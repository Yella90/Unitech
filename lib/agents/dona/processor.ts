// lib/agents/dona/processor.ts
import { supabase } from '@/lib/supabase';
import { 
  KeywordConfig, 
  AnalysisResult, 
  EmailData, 
  ContactData,
  ProcessEmailResult,
  ProcessContactResult,
  DonaConfig,
  DonaStatus,
  ProcessOptions,
  BatchProcessResult,
  CleanupResult,
  IDona
} from './types';

// ============================================================
// CONFIGURATION PAR DÉFAUT
// ============================================================
const defaultConfig: DonaConfig = {
  maxEmailsPerRun: 50,
  enableDeduplication: true,
  enableNewsletterAutoSubscribe: true,
  debug: false,
  defaultCategories: [
    { 
      id: 'default-commercial', 
      category: 'commercial', 
      keywords: [
        'prix', 'achat', 'devis', 'acheter', 'tarif', 'facture', 
        'paiement', 'produit', 'service', 'domotique', 'boutique', 
        'scolaire', 'energie', 'solution', 'logiciel', 'catalogue', 
        'prestation', 'commande', 'livraison', 'stock'
      ], 
      priority: 1, 
      is_active: true 
    },
    { 
      id: 'default-project', 
      category: 'project', 
      keywords: [
        'projet', 'developpement', 'prestation', 'realisation', 
        'saas', 'logiciel', 'application', 'solution', 'gestion', 
        'boutique', 'scolaire', 'domotique', 'energie', 'plateforme', 
        'systeme', 'automatisation', 'application web'
      ], 
      priority: 1, 
      is_active: true 
    },
    { 
      id: 'default-support', 
      category: 'support', 
      keywords: [
        'aide', 'probleme', 'bug', 'erreur', 'assistance', 'support', 
        'help', 'issue', 'problem', 'panne', 'incident', 'difficulte', 
        'bloque', 'fonctionne pas', 'marche pas', 'plantage', 
        'urgent', 'assistance technique', 'reparation', 'depannage'
      ], 
      priority: 1, 
      is_active: true 
    },
    { 
      id: 'default-newsletter', 
      category: 'newsletter', 
      keywords: [
        'newsletter', 'inscription', 'desinscription', 'abonnement', 
        'unsubscribe', 'news', 'infolettre', 'actualite', 'information', 
        'rejoindre', 'quitter', 'se desinscrire', 'actualites',
        'bulletin', 'mise a jour'
      ], 
      priority: 2, 
      is_active: true 
    },
    { 
      id: 'default-information', 
      category: 'information', 
      keywords: [
        'information', 'renseignement', 'demande', 'question', 
        'infos', 'connaitre', 'savoir', 'details', 'precisions', 
        'expliquer', 'curieux', 'interesse'
      ], 
      priority: 3, 
      is_active: true 
    },
    { 
      id: 'default-spam', 
      category: 'spam', 
      keywords: [
        'spam', 'viagra', 'casino', 'porn', 'phishing', '$$$', 
        'lottery', 'gagnant', 'cliquez ici', 'offre exceptionnelle', 
        'million', 'gratuit', 'argent facile', 'gagner', 'prix',
        'cadeau', 'promotion', 'reduction', 'vente flash'
      ], 
      priority: 0, 
      is_active: true 
    }
  ]
};

// ============================================================
// CLASSE DONA
// ============================================================
export class Dona implements IDona {
  private keywordConfigs: KeywordConfig[] = [];
  private config: DonaConfig;
  private initialized: boolean = false;
  private processedEmails: Set<string> = new Set();

  constructor(config: Partial<DonaConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    console.log('🤖 DONA: Initialisation...');
    await this.loadConfig();
    await this.loadProcessedEmails();
    this.initialized = true;
    console.log(`✅ DONA: ${this.keywordConfigs.length} catégories chargées`);
    console.log(`📚 DONA: ${this.processedEmails.size} emails déjà traités`);
  }

  private async loadProcessedEmails(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('incoming_emails')
        .select('id')
        .neq('status', 'pending');

      if (error) {
        console.warn('⚠️ DONA: Erreur chargement emails traités:', error);
        return;
      }

      if (data) {
        data.forEach(item => {
          this.processedEmails.add(item.id);
        });
      }
    } catch (error) {
      console.warn('⚠️ DONA: Erreur chargement historique:', error);
    }
  }

  async loadConfig(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('keyword_config')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.warn('⚠️ DONA: Erreur chargement, utilisation des defaults');
        this.keywordConfigs = this.config.defaultCategories;
        return;
      }

      this.keywordConfigs = data && data.length > 0 ? data : this.config.defaultCategories;
      
      if (this.keywordConfigs.length === 0) {
        console.warn('⚠️ DONA: Aucune catégorie, utilisation des defaults');
        this.keywordConfigs = this.config.defaultCategories;
      }

      console.log(`📋 DONA: ${this.keywordConfigs.length} catégories chargées`);
    } catch (error) {
      console.error('❌ DONA: Erreur chargement config:', error);
      this.keywordConfigs = this.config.defaultCategories;
    }
  }

  async analyze(input: {
    from?: string;
    subject?: string;
    body: string;
    source: 'email' | 'contact';
  }): Promise<AnalysisResult> {
    if (!this.initialized) {
      await this.init();
    }

    const text = `${input.subject || ''} ${input.body}`.toLowerCase();
    const words = text.split(/\s+/).filter(w => w.length > 2);

    const results: { category: string; score: number; matched: string[] }[] = [];

    for (const config of this.keywordConfigs) {
      const matched = config.keywords.filter(kw => 
        words.some(w => w.includes(kw) || kw.includes(w))
      );
      
      if (matched.length > 0) {
        const score = Math.min(matched.length / config.keywords.length, 1);
        results.push({
          category: config.category,
          score: score,
          matched: matched,
        });
      }
    }

    if (results.length === 0) {
      return {
        category: 'information',
        priority: 'medium',
        assigned_agent: 'HUMAN',
        confidence: 10,
        matched_keywords: [],
        summary: 'Aucun mot-clé spécifique détecté',
        score: 0,
      };
    }

    results.sort((a, b) => b.score - a.score);
    const best = results[0];
    const confidence = Math.min(Math.round(best.score * 100 + 10), 100);

    return {
      category: best.category as any,
      priority: this.getPriority(best.category),
      assigned_agent: this.getAgent(best.category),
      confidence: confidence,
      matched_keywords: best.matched,
      summary: `Catégorie "${best.category}" avec ${best.matched.length} mots-clés trouvés`,
      score: best.score,
    };
  }

  private getPriority(category: string): 'high' | 'medium' | 'low' {
    const map: Record<string, 'high' | 'medium' | 'low'> = {
      support: 'high',
      commercial: 'high',
      project: 'high',
      newsletter: 'medium',
      information: 'medium',
      spam: 'low',
      other: 'medium',
    };
    return map[category] || 'medium';
  }

  private getAgent(category: string): string {
    const map: Record<string, string> = {
      support: 'SUPPORT',
      commercial: 'COMMERCIAL',
      project: 'PROJET',
      newsletter: 'NEWSLETTER',
      information: 'HUMAN',
      spam: 'NONE',
      other: 'HUMAN',
    };
    return map[category] || 'HUMAN';
  }

  private async isDuplicateEmail(fromEmail: string, subject: string): Promise<boolean> {
    if (!this.config.enableDeduplication) return false;

    try {
      const { data, error } = await supabase
        .from('incoming_emails')
        .select('id, status')
        .eq('from_email', fromEmail)
        .eq('subject', subject)
        .neq('status', 'pending')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn('⚠️ DONA: Erreur vérification doublon:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      return false;
    }
  }

  // ============================================================
  // PROCESS EMAIL - CORRIGÉ AVEC STATUT 'analyzed'
  // ============================================================
  async processEmail(emailData: EmailData): Promise<ProcessEmailResult> {
    const startTime = Date.now();

    try {
      if (!this.initialized) {
        await this.init();
      }

      console.log(`📧 DONA: Analyse email de ${emailData.from}`);
      
      if (emailData.id && this.processedEmails.has(emailData.id)) {
        console.log(`⚠️ DONA: Email ${emailData.id} déjà traité (cache)`);
        return { action: 'ignored', reason: 'duplicate' };
      }

      const isDuplicate = await this.isDuplicateEmail(emailData.from, emailData.subject);
      if (isDuplicate) {
        console.log(`⚠️ DONA: Email déjà traité: ${emailData.from} - ${emailData.subject}`);
        
        await supabase
          .from('incoming_emails')
          .update({
            status: 'duplicate',
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('from_email', emailData.from)
          .eq('subject', emailData.subject)
          .eq('status', 'pending');

        return { action: 'ignored', reason: 'duplicate' };
      }

      const analysis = await this.analyze({
        from: emailData.from,
        subject: emailData.subject,
        body: emailData.body,
        source: 'email',
      });
      
      console.log(`📊 DONA: ${analysis.category} (${analysis.confidence}%)`);

      const { data: emailToUpdate, error: findError } = await supabase
        .from('incoming_emails')
        .select('id, status')
        .eq('from_email', emailData.from)
        .eq('subject', emailData.subject)
        .eq('status', 'pending')
        .limit(1)
        .maybeSingle();

      if (findError) {
        console.error('❌ DONA: Erreur recherche:', findError);
        return { action: 'error', error: new Error(findError.message) };
      }

      if (!emailToUpdate) {
        const { data: existing } = await supabase
          .from('incoming_emails')
          .select('id, status')
          .eq('from_email', emailData.from)
          .eq('subject', emailData.subject)
          .limit(1)
          .maybeSingle();

        if (existing) {
          console.log(`⚠️ DONA: Email déjà traité (status: ${existing.status})`);
          this.processedEmails.add(existing.id);
          return { action: 'stored', email_id: existing.id, analysis };
        }

        const { data: newEmail, error: insertError } = await supabase
          .from('incoming_emails')
          .insert({
            from_email: emailData.from,
            subject: emailData.subject,
            body: emailData.body,
            status: 'pending',
            received_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ DONA: Erreur création email:', insertError);
          return { action: 'error', error: new Error(insertError.message) };
        }

        return await this.processEmail({
          ...emailData,
          id: newEmail.id
        });
      }

      // ✅ SPAM → Ignorer
      if (analysis.category === 'spam') {
        console.log(`🚫 DONA: Email ignoré (spam)`);
        
        await supabase
          .from('incoming_emails')
          .update({
            category: analysis.category,
            priority: analysis.priority,
            assigned_agent: 'NONE',
            status: 'ignored',
            ai_analysis: analysis,
            updated_at: new Date().toISOString(),
            processed_at: new Date().toISOString(),
          })
          .eq('id', emailToUpdate.id);

        this.processedEmails.add(emailToUpdate.id);
        return { action: 'ignored', reason: 'spam' };
      }

      // ✅ NEWSLETTER → Ajouter à la liste et marquer comme traité
      if (analysis.category === 'newsletter' && this.config.enableNewsletterAutoSubscribe) {
        await this.handleNewsletter(emailData);
        
        await supabase
          .from('incoming_emails')
          .update({
            category: analysis.category,
            priority: analysis.priority,
            assigned_agent: 'NEWSLETTER',
            status: 'analyzed', // ✅ CHANGEMENT: analyzed au lieu de processed
            ai_analysis: analysis,
            updated_at: new Date().toISOString(),
            processed_at: new Date().toISOString(),
          })
          .eq('id', emailToUpdate.id);

        this.processedEmails.add(emailToUpdate.id);
        return { action: 'newsletter', analysis };
      }

      // ✅ AUTRES CATÉGORIES → 'analyzed' pour HARVEY
      const { data, error } = await supabase
        .from('incoming_emails')
        .update({
          category: analysis.category,
          priority: analysis.priority,
          assigned_agent: analysis.assigned_agent,
          status: 'analyzed', // ✅ CHANGEMENT: analyzed au lieu de processed
          ai_analysis: analysis,
          updated_at: new Date().toISOString(),
          processed_at: new Date().toISOString(),
        })
        .eq('id', emailToUpdate.id)
        .select()
        .single();

      if (error) {
        console.error('❌ DONA: Erreur mise à jour:', error);
        return { action: 'error', error: new Error(error.message) };
      }

      this.processedEmails.add(emailToUpdate.id);
      console.log(`✅ DONA: Email ${data.id} classé: ${analysis.category}`);
      
      return { 
        action: 'stored', 
        email_id: data.id, 
        analysis,
        metadata: {
          processed_at: new Date().toISOString(),
          duration: Date.now() - startTime,
        }
      };

    } catch (error: any) {
      console.error('❌ DONA: Erreur processEmail:', error.message);
      return { action: 'error', error: new Error(error.message) };
    }
  }

  // ============================================================
  // PROCESS CONTACT - CORRIGÉ AVEC STATUT 'analyzed'
  // ============================================================
  async processContact(contactData: ContactData): Promise<ProcessContactResult> {
    const startTime = Date.now();

    try {
      if (!this.initialized) {
        await this.init();
      }

      console.log(`📧 DONA: Analyse contact de ${contactData.name}`);
      
      const isDuplicate = await this.isDuplicateEmail(contactData.email, contactData.subject);
      if (isDuplicate) {
        console.log(`⚠️ DONA: Contact déjà traité: ${contactData.email} - ${contactData.subject}`);
        
        await supabase
          .from('contacts')
          .update({
            status: 'duplicate',
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', contactData.id);

        return { action: 'ignored', reason: 'duplicate' };
      }

      const analysis = await this.analyze({
        from: contactData.email,
        subject: contactData.subject,
        body: contactData.message,
        source: 'contact',
      });
      
      console.log(`📊 DONA: ${analysis.category} (${analysis.confidence}%)`);

      // ✅ Marquer le contact comme 'analyzed' pour HARVEY
      const { error: contactError } = await supabase
        .from('contacts')
        .update({
          status: 'analyzed', // ✅ CHANGEMENT: analyzed au lieu de processed
          category: analysis.category,
          assigned_agent: analysis.assigned_agent,
          priority: analysis.priority,
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', contactData.id);

      if (contactError) {
        console.error('❌ DONA: Erreur contact:', contactError);
        return { action: 'error', error: new Error(contactError.message) };
      }

      // ✅ Créer ou mettre à jour l'email correspondant dans incoming_emails
      const { data: existingEmail } = await supabase
        .from('incoming_emails')
        .select('id, status')
        .eq('from_email', contactData.email)
        .eq('subject', contactData.subject)
        .limit(1)
        .maybeSingle();

      if (existingEmail) {
        await supabase
          .from('incoming_emails')
          .update({
            status: 'analyzed', // ✅ CHANGEMENT: analyzed
            category: analysis.category,
            assigned_agent: analysis.assigned_agent,
            priority: analysis.priority,
            ai_analysis: analysis,
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingEmail.id);
      } else {
        await supabase
          .from('incoming_emails')
          .insert({
            from_email: contactData.email,
            subject: contactData.subject,
            body: contactData.message,
            status: 'analyzed', // ✅ CHANGEMENT: analyzed
            category: analysis.category,
            assigned_agent: analysis.assigned_agent,
            priority: analysis.priority,
            ai_analysis: analysis,
            received_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
      }

      if (analysis.category === 'newsletter' && this.config.enableNewsletterAutoSubscribe) {
        await this.handleNewsletter({
          from: contactData.email,
          subject: contactData.subject,
          body: contactData.message,
        });
      }

      console.log(`✅ DONA: Contact ${contactData.id} classé: ${analysis.category}`);
      
      return { 
        action: 'updated', 
        analysis,
        metadata: {
          processed_at: new Date().toISOString(),
          duration: Date.now() - startTime,
        }
      };

    } catch (error: any) {
      console.error('❌ DONA: Erreur processContact:', error.message);
      return { action: 'error', error: new Error(error.message) };
    }
  }

  private async handleNewsletter(emailData: EmailData): Promise<void> {
    try {
      const { data: existing } = await supabase
        .from('newsletter_subscribers')
        .select('id')
        .eq('email', emailData.from)
        .maybeSingle();

      if (existing) {
        console.log(`📬 DONA: ${emailData.from} déjà abonné`);
        return;
      }

      await supabase
        .from('newsletter_subscribers')
        .insert({
          email: emailData.from,
          interests: ['general'],
          source: 'email',
          is_active: true,
          created_at: new Date().toISOString()
        });

      console.log(`📬 DONA: ${emailData.from} ajouté à la newsletter`);
    } catch (error: any) {
      console.error('❌ DONA: Erreur newsletter:', error.message);
    }
  }

  async processBatch(options: ProcessOptions = {}): Promise<BatchProcessResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let processed = 0;
    let ignored = 0;

    try {
      if (!this.initialized) {
        await this.init();
      }

      const maxEmails = options.maxEmails || this.config.maxEmailsPerRun || 50;

      const { data: emails, error } = await supabase
        .from('incoming_emails')
        .select('*')
        .eq('status', 'pending')
        .limit(maxEmails);

      if (error) {
        throw new Error(`Erreur récupération emails: ${error.message}`);
      }

      if (!emails || emails.length === 0) {
        console.log('📭 DONA: Aucun email à traiter');
        return { processed: 0, ignored: 0, errors: [], total: 0, duration: Date.now() - startTime };
      }

      console.log(`📨 DONA: Traitement de ${emails.length} emails`);

      for (const email of emails) {
        try {
          const result = await this.processEmail({
            id: email.id,
            from: email.from_email,
            subject: email.subject || '',
            body: email.body || '',
          });

          if (result.action === 'error') {
            errors.push(`Email ${email.id}: ${result.error?.message}`);
          } else if (result.action === 'ignored') {
            ignored++;
          } else {
            processed++;
          }
        } catch (err: any) {
          errors.push(`Email ${email.id}: ${err.message}`);
        }
      }

      return { processed, ignored, errors, total: emails.length, duration: Date.now() - startTime };

    } catch (error: any) {
      console.error('❌ DONA: Erreur processBatch:', error.message);
      return { processed: 0, ignored: 0, errors: [error.message], total: 0, duration: Date.now() - startTime };
    }
  }

  async cleanupDuplicates(): Promise<CleanupResult> {
    const errors: string[] = [];
    const duplicates: CleanupResult['duplicates'] = [];
    let cleaned = 0;

    try {
      const { data: emails, error } = await supabase
        .from('incoming_emails')
        .select('from_email, subject, id, status, created_at')
        .order('from_email')
        .order('created_at');

      if (error) {
        throw new Error(`Erreur récupération: ${error.message}`);
      }

      const grouped = new Map<string, any[]>();
      emails.forEach(email => {
        const key = `${email.from_email}|${email.subject}`;
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push(email);
      });

      for (const [key, items] of grouped) {
        if (items.length > 1) {
          const sorted = items.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          
          const [keep, ...removed] = sorted;
          
          duplicates.push({
            key,
            count: items.length,
            kept: keep.id,
            removed: removed.map(r => r.id)
          });
          
          for (const dup of removed) {
            if (dup.status !== 'duplicate') {
              const { error: updateError } = await supabase
                .from('incoming_emails')
                .update({
                  status: 'duplicate',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', dup.id);

              if (updateError) {
                errors.push(`Erreur nettoyage ${dup.id}: ${updateError.message}`);
              } else {
                cleaned++;
                this.processedEmails.add(dup.id);
              }
            }
          }
        }
      }

      console.log(`🧹 DONA: ${cleaned} doublons nettoyés`);
      return { cleaned, errors, duplicates };

    } catch (error: any) {
      console.error('❌ DONA: Erreur cleanupDuplicates:', error.message);
      return { cleaned: 0, errors: [error.message], duplicates: [] };
    }
  }

  async refreshCache(): Promise<void> {
    console.log('🔄 DONA: Rafraîchissement du cache...');
    this.processedEmails.clear();
    await this.loadProcessedEmails();
    console.log(`✅ DONA: Cache rafraîchi (${this.processedEmails.size} emails)`);
  }

  getStatus(): DonaStatus {
    return {
      initialized: this.initialized,
      processedEmails: this.processedEmails.size,
      keywordConfigs: this.keywordConfigs.length,
      pendingEmails: 0,
      config: this.config,
      lastRun: undefined,
      totalProcessed: this.processedEmails.size,
    };
  }

  updateConfig(config: Partial<DonaConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('⚙️ DONA: Configuration mise à jour');
  }
}

export const dona = new Dona();