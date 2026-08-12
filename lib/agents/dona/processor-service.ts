// lib/agents/dona/processor-service.ts
import { supabase } from '@/lib/supabase';
import { dona } from './processor';
import { ProcessOptions, DonaStatus, DonaConfig } from './types';

// ============================================================
// TYPES
// ============================================================
export type ProcessResult = {
  processedCount: number;
  errorCount: number;
  ignoredCount: number;
  duplicateCount: number;
  errors?: string[];
  details?: {
    emails?: { processed: number; ignored: number; errors: number };
    contacts?: { processed: number; ignored: number; errors: number };
  };
};

export type DonaServiceHandle = {
  stop: () => void;
  restart: () => void;
  getStatus: () => {
    isRunning: boolean;
    isProcessing: boolean;
    lastRun: Date | null;
    stats: ProcessResult | null;
    donaStatus: DonaStatus;
    config: DonaServiceConfig;
  };
  processNow: (options?: ProcessOptions) => Promise<ProcessResult>;
};

export type DonaServiceConfig = {
  interval?: number;
  maxEmailsPerRun?: number;
  maxContactsPerRun?: number;
  autoStart?: boolean;
  enableLogging?: boolean;
  onProcessComplete?: (result: ProcessResult) => void;
  onError?: (error: Error) => void;
};

// ============================================================
// CONFIGURATION PAR DÉFAUT
// ============================================================
const defaultConfig: DonaServiceConfig = {
  interval: 60000,
  maxEmailsPerRun: 50,
  maxContactsPerRun: 50,
  autoStart: true,
  enableLogging: true,
};

// ============================================================
// SERVICE DONA
// ============================================================
class DonaService {
  private timer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private lastRun: Date | null = null;
  private lastResult: ProcessResult | null = null;
  private config: DonaServiceConfig;
  private isProcessing: boolean = false;

  constructor(config: Partial<DonaServiceConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  // ============================================================
  // LOGGING
  // ============================================================
  private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    if (!this.config.enableLogging) return;
    
    const prefix = level === 'info' ? 'ℹ️' : level === 'warn' ? '⚠️' : '❌';
    console.log(`${prefix} DONA Service: ${message}`);
  }

  // ============================================================
  // INITIALISATION
  // ============================================================
  async init(): Promise<void> {
    try {
      this.log('Initialisation...');
      await dona.init();
      this.log('✅ Initialisé avec succès');
    } catch (error: any) {
      this.log(`❌ Erreur d'initialisation: ${error.message}`, 'error');
      throw error;
    }
  }

  // ============================================================
  // TRAITEMENT DES ITEMS
  // ============================================================
  async processPendingItems(options: ProcessOptions = {}): Promise<ProcessResult> {
    if (this.isProcessing) {
      this.log('⚠️ Traitement déjà en cours, ignoré', 'warn');
      return {
        processedCount: 0,
        errorCount: 0,
        ignoredCount: 0,
        duplicateCount: 0,
        errors: ['Traitement déjà en cours'],
      };
    }

    this.isProcessing = true;
    const result: ProcessResult = {
      processedCount: 0,
      errorCount: 0,
      ignoredCount: 0,
      duplicateCount: 0,
      errors: [],
      details: {
        emails: { processed: 0, ignored: 0, errors: 0 },
        contacts: { processed: 0, ignored: 0, errors: 0 },
      },
    };

    const startTime = Date.now();

    try {
      this.log('🔄 Début du traitement...');
      this.isRunning = true;

      const maxEmails = options.maxEmails || this.config.maxEmailsPerRun || 50;
      const maxContacts = options.maxContacts || this.config.maxContactsPerRun || 50;

      // ✅ 1. Récupérer les emails en attente
      const { data: emails, error: emailError } = await supabase
        .from('incoming_emails')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(maxEmails);

      if (emailError) {
        this.log(`❌ Erreur récupération emails: ${emailError.message}`, 'error');
        result.errors?.push(`Email error: ${emailError.message}`);
      } else {
        this.log(`📧 ${emails?.length || 0} emails à traiter`);
      }

      // ✅ 2. Récupérer les contacts en attente
      const { data: contacts, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(maxContacts);

      if (contactError) {
        this.log(`❌ Erreur récupération contacts: ${contactError.message}`, 'error');
        result.errors?.push(`Contact error: ${contactError.message}`);
      } else {
        this.log(`📋 ${contacts?.length || 0} contacts à traiter`);
      }

      // ✅ 3. Traiter les emails
      if (emails && emails.length > 0) {
        for (const email of emails) {
          try {
            const emailData = {
              id: email.id,
              from: email.from_email || 'unknown@example.com',
              to: email.to_email || 'doumbialayesoma@gmail.com',
              subject: email.subject || 'Sans sujet',
              body: email.body || '',
              received_at: email.received_at || email.created_at,
            };

            const processResult = await dona.processEmail(emailData);
            
            if (processResult.action === 'stored') {
              result.processedCount++;
              result.details!.emails!.processed++;
            } else if (processResult.action === 'ignored' || processResult.action === 'duplicate') {
              result.ignoredCount++;
              result.details!.emails!.ignored++;
            } else if (processResult.action === 'error') {
              result.errorCount++;
              result.details!.emails!.errors++;
              result.errors?.push(`Email ${email.id}: ${processResult.error?.message}`);
            }
            
          } catch (error: any) {
            result.errorCount++;
            result.details!.emails!.errors++;
            result.errors?.push(`Email ${email.id}: ${error.message}`);
            
            await supabase
              .from('incoming_emails')
              .update({ 
                status: 'error', 
                updated_at: new Date().toISOString(),
                processed_at: new Date().toISOString(),
              })
              .eq('id', email.id);
          }
        }
      }

      // ✅ 4. Traiter les contacts
      if (contacts && contacts.length > 0) {
        for (const contact of contacts) {
          try {
            const contactData = {
              id: contact.id,
              name: contact.name || 'Anonyme',
              email: contact.email || 'unknown@example.com',
              subject: contact.subject || 'Sans sujet',
              message: contact.message || '',
              created_at: contact.created_at,
            };

            const processResult = await dona.processContact(contactData);
            
            if (processResult.action === 'updated') {
              result.processedCount++;
              result.details!.contacts!.processed++;
            } else if (processResult.action === 'ignored' || processResult.action === 'duplicate') {
              result.ignoredCount++;
              result.details!.contacts!.ignored++;
            } else if (processResult.action === 'error') {
              result.errorCount++;
              result.details!.contacts!.errors++;
              result.errors?.push(`Contact ${contact.id}: ${processResult.error?.message}`);
            }
            
          } catch (error: any) {
            result.errorCount++;
            result.details!.contacts!.errors++;
            result.errors?.push(`Contact ${contact.id}: ${error.message}`);
            
            await supabase
              .from('contacts')
              .update({ 
                status: 'error', 
                updated_at: new Date().toISOString(),
                processed_at: new Date().toISOString(),
              })
              .eq('id', contact.id);
          }
        }
      }

      const duration = Date.now() - startTime;
      this.lastRun = new Date();
      this.lastResult = result;

      this.log(`✅ Terminé: ${result.processedCount} traités, ${result.ignoredCount} ignorés, ${result.duplicateCount} doublons, ${result.errorCount} erreurs (${duration}ms)`);

      if (this.config.onProcessComplete) {
        this.config.onProcessComplete(result);
      }

      return result;

    } catch (error: any) {
      this.log(`❌ Erreur fatale: ${error.message}`, 'error');
      result.errorCount++;
      result.errors?.push(`Fatal: ${error.message}`);
      
      if (this.config.onError) {
        this.config.onError(error);
      }
      
      return result;
    } finally {
      this.isProcessing = false;
      this.isRunning = false;
    }
  }

  // ============================================================
  // DÉMARRAGE ET ARRÊT
  // ============================================================
  start(interval?: number): void {
    if (this.timer) {
      this.log('⚠️ Service déjà en cours d\'exécution', 'warn');
      return;
    }

    const delay = interval || this.config.interval || 60000;
    
    this.log(`🚀 Démarrage (intervalle: ${delay / 1000}s)`);
    
    this.init().then(() => {
      this.processPendingItems();
      this.timer = setInterval(() => {
        this.processPendingItems();
      }, delay);
    }).catch((error) => {
      this.log(`❌ Erreur d'initialisation: ${error.message}`, 'error');
    });
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      this.isRunning = false;
      this.log('⏹️ Service arrêté');
    } else {
      this.log('⚠️ Service déjà arrêté', 'warn');
    }
  }

  restart(): void {
    this.log('🔄 Redémarrage...');
    this.stop();
    setTimeout(() => {
      this.start();
    }, 1000);
  }

  // ============================================================
  // STATUTS - VERSION CORRIGÉE
  // ============================================================
  getStatus(): {
    isRunning: boolean;
    isProcessing: boolean;
    lastRun: Date | null;
    stats: ProcessResult | null;
    donaStatus: DonaStatus;
    config: DonaServiceConfig;
  } {
    // ✅ Récupérer le statut complet de DONA (qui inclut pendingEmails et config)
    const donaStatus = dona.getStatus();
    
    return {
      isRunning: this.isRunning,
      isProcessing: this.isProcessing,
      lastRun: this.lastRun,
      stats: this.lastResult,
      donaStatus: donaStatus, // ✅ Maintenant complet
      config: this.config,
    };
  }

  // ============================================================
  // CONFIGURATION
  // ============================================================
  updateConfig(config: Partial<DonaServiceConfig>): void {
    this.config = { ...this.config, ...config };
    this.log('⚙️ Configuration mise à jour');
  }

  // ============================================================
  // TRAITEMENT FORCÉ
  // ============================================================
  async processNow(options: ProcessOptions = {}): Promise<ProcessResult> {
    this.log('🔄 Exécution forcée...');
    return await this.processPendingItems(options);
  }

  // ============================================================
  // NETTOYAGE DES DOUBLONS
  // ============================================================
  async cleanupDuplicates(): Promise<{ cleaned: number; errors: string[] }> {
    this.log('🧹 Nettoyage des doublons...');
    const result = await dona.cleanupDuplicates();
    this.log(`✅ ${result.cleaned} doublons nettoyés`);
    return result;
  }

  // ============================================================
  // RAFRAÎCHIR LE CACHE
  // ============================================================
  async refreshCache(): Promise<void> {
    this.log('🔄 Rafraîchissement du cache...');
    await dona.refreshCache();
    this.log('✅ Cache rafraîchi');
  }
}

// ============================================================
// EXPORT DE L'INSTANCE
// ============================================================
export const donaService = new DonaService();

// ============================================================
// FONCTIONS DE COMPATIBILITÉ
// ============================================================
export async function processPendingItems(): Promise<ProcessResult> {
  return donaService.processPendingItems();
}

export function startDonaService(interval: number = 60000): DonaServiceHandle {
  donaService.start(interval);
  
  return {
    stop: () => donaService.stop(),
    restart: () => donaService.restart(),
    getStatus: () => donaService.getStatus(),
    processNow: (options?: ProcessOptions) => donaService.processNow(options),
  };
}

export default donaService;