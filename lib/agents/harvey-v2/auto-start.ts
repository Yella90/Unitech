// lib/agents/harvey-v2/auto-start.ts
// Auto-start pour Harvey V2 - Service d'automatisation des emails

import { harveyV2 } from './HarveyV2';
import { supabase } from '@/lib/supabase';

let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;
let cleanupFunctions: Array<() => void> = [];

/**
 * Initialise et démarre le service Harvey V2
 */
export function initHarveyV2Service(options?: {
  interval?: number;
  onError?: (error: Error) => void;
  onProcess?: (result: any) => void;
}): () => void {
  if (isRunning) {
    console.log('⚠️ Harvey V2 déjà en cours d\'exécution');
    return () => {};
  }

  const interval = options?.interval || 120000;
  console.log(`🦸‍♂️ Harvey V2: Démarrage du service (intervalle: ${interval}ms)`);

  isRunning = true;

  const processEmails = async () => {
    if (!isRunning) return;

    try {
      const initResult = await harveyV2.init();
      if (!initResult.success) {
        console.error('❌ Harvey V2: Erreur initialisation:', initResult.error);
        return;
      }

      console.log('🔄 Harvey V2: Traitement des emails en attente...');

      const { data: pendingEmails, error } = await supabase
        .from('emails')
        .select('client_id, id, status')
        .in('status', ['pending', 'analyzed'])
        .order('received_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('❌ Harvey V2: Erreur récupération emails:', error);
        return;
      }

      if (!pendingEmails || pendingEmails.length === 0) {
        console.log('📭 Harvey V2: Aucun email en attente');
        return;
      }

      const clientIds = [...new Set(pendingEmails.map((e: any) => e.client_id).filter(Boolean))];

      if (clientIds.length === 0) {
        console.log('📭 Harvey V2: Aucun client avec des emails en attente');
        return;
      }

      console.log(`📋 Harvey V2: ${clientIds.length} clients avec des emails en attente`);

      let totalProcessed = 0;
      let totalErrors = 0;

      for (const clientId of clientIds) {
        try {
          const { data: mailAccount, error: mailError } = await supabase
            .from('mail_accounts')
            .select('id, email, is_connected')
            .eq('client_id', clientId)
            .eq('is_active', true)
            .maybeSingle();

          if (mailError || !mailAccount) {
            console.log(`⚠️ Harvey V2: Client ${clientId} sans compte mail configuré`);
            continue;
          }

          if (!mailAccount.is_connected) {
            console.log(`⚠️ Harvey V2: Compte mail non connecté pour client ${clientId}`);
            continue;
          }

          const result = await harveyV2.processClientEmails(clientId, {
            limit: 20,
            syncNew: false
          });

          totalProcessed += result.processed;
          totalErrors += result.errors;

          if (options?.onProcess && result.processed > 0) {
            options.onProcess({
              clientId,
              clientEmail: mailAccount.email,
              processed: result.processed,
              errors: result.errors,
              responses: result.responses
            });
          }
        } catch (error: any) {
          console.error(`❌ Harvey V2: Erreur client ${clientId}:`, error.message);
          totalErrors++;

          if (options?.onError) {
            options.onError(error);
          }
        }
      }

      if (totalProcessed > 0 || totalErrors > 0) {
        console.log(`📊 Harvey V2: ${totalProcessed} emails traités, ${totalErrors} erreurs`);
      }
    } catch (error: any) {
      console.error('❌ Harvey V2: Erreur traitement:', error.message);
      if (options?.onError) {
        options.onError(error);
      }
    }
  };

  intervalId = setInterval(processEmails, interval);
  setTimeout(processEmails, 5000);

  const cleanup = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    isRunning = false;
    console.log('🛑 Harvey V2: Service arrêté');
  };

  cleanupFunctions.push(cleanup);
  return cleanup;
}

/**
 * Arrête le service Harvey V2
 */
export function stopHarveyV2Service(): void {
  console.log('🛑 Harvey V2: Arrêt du service...');
  cleanupFunctions.forEach(fn => fn());
  cleanupFunctions = [];
  isRunning = false;
}

/**
 * Vérifie si Harvey V2 est en cours d'exécution
 */
export function isHarveyV2Running(): boolean {
  return isRunning;
}

/**
 * Récupère les métriques de Harvey V2
 */
export function getHarveyV2Metrics() {
  return harveyV2.getMetrics();
}

/**
 * Récupère la configuration de Harvey V2
 */
export function getHarveyV2Config() {
  return harveyV2.getConfig();
}

/**
 * Déclenche un traitement manuel des emails
 */
export async function triggerHarveyV2Processing(
  clientId?: string
): Promise<{
  success: boolean;
  processed?: number;
  errors?: number;
  responses?: any[];
  error?: string;
}> {
  try {
    const initResult = await harveyV2.init();
    if (!initResult.success) {
      return {
        success: false,
        error: initResult.error || 'Erreur d\'initialisation'
      };
    }

    if (clientId) {
      const result = await harveyV2.processClientEmails(clientId, {
        limit: 50,
        syncNew: true
      });
      return {
        success: result.success,
        processed: result.processed,
        errors: result.errors,
        responses: result.responses
      };
    } else {
      const { data: pendingEmails, error } = await supabase
        .from('emails')
        .select('client_id')
        .in('status', ['pending', 'analyzed'])
        .limit(100);

      if (error) {
        return { success: false, error: error.message };
      }

      const clientIds = [...new Set(pendingEmails.map((e: any) => e.client_id).filter(Boolean))];

      if (clientIds.length === 0) {
        return {
          success: true,
          processed: 0,
          errors: 0,
          responses: [],
          error: 'Aucun email en attente'
        };
      }

      let totalProcessed = 0;
      let totalErrors = 0;
      const allResponses: any[] = [];

      for (const id of clientIds) {
        try {
          const result = await harveyV2.processClientEmails(id, {
            limit: 20,
            syncNew: false
          });
          totalProcessed += result.processed;
          totalErrors += result.errors;
          allResponses.push(...result.responses);
        } catch (error: any) {
          totalErrors++;
        }
      }

      return {
        success: true,
        processed: totalProcessed,
        errors: totalErrors,
        responses: allResponses
      };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Traite un lot spécifique d'emails
 */
export async function processEmailBatch(
  emailIds: string[]
): Promise<{
  success: boolean;
  processed: number;
  errors: number;
  results: any[];
  error?: string;
}> {
  try {
    const initResult = await harveyV2.init();
    if (!initResult.success) {
      return {
        success: false,
        processed: 0,
        errors: emailIds.length,
        results: [],
        error: initResult.error || 'Erreur d\'initialisation'
      };
    }

    const { data: emails, error } = await supabase
      .from('emails')
      .select('*')
      .in('id', emailIds);

    if (error) {
      return {
        success: false,
        processed: 0,
        errors: emailIds.length,
        results: [],
        error: error.message
      };
    }

    if (!emails || emails.length === 0) {
      return {
        success: true,
        processed: 0,
        errors: 0,
        results: []
      };
    }

    const clientEmails: Record<string, any[]> = {};
    for (const email of emails) {
      if (!clientEmails[email.client_id]) {
        clientEmails[email.client_id] = [];
      }
      clientEmails[email.client_id].push(email);
    }

    let processed = 0;
    let errors = 0;
    const results: any[] = [];

    for (const [clientId, clientEmailList] of Object.entries(clientEmails)) {
      try {
        const result = await harveyV2.processClientEmails(clientId, {
          limit: clientEmailList.length,
          syncNew: false
        });
        processed += result.processed;
        errors += result.errors;
        results.push(...result.responses);
      } catch (error: any) {
        errors += clientEmailList.length;
        results.push({
          success: false,
          error: error.message,
          clientId
        });
      }
    }

    return {
      success: true,
      processed,
      errors,
      results
    };
  } catch (error: any) {
    return {
      success: false,
      processed: 0,
      errors: emailIds.length,
      results: [],
      error: error.message
    };
  }
}

// ============================================================
// EXPORT PAR DÉFAUT
// ============================================================

const autoStart = {
  initHarveyV2Service,
  stopHarveyV2Service,
  isHarveyV2Running,
  getHarveyV2Metrics,
  getHarveyV2Config,
  triggerHarveyV2Processing,
  processEmailBatch
};

export default autoStart;