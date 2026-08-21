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
// CONFIGURATION PAR DÉFAUT AMÉLIORÉE
// ============================================================
const defaultConfig: DonaConfig = {
  maxEmailsPerRun: 50,
  enableDeduplication: true,
  enableNewsletterAutoSubscribe: true,
  debug: false,
  defaultCategories: [
    // ==========================================================
    // COMMERCIAL - Demandes de devis, achats, prix
    // ==========================================================
    { 
      id: 'default-commercial', 
      category: 'commercial', 
      keywords: [
        'prix', 'achat', 'devis', 'acheter', 'tarif', 'facture', 
        'paiement', 'produit', 'service', 'domotique', 'boutique', 
        'scolaire', 'energie', 'solution', 'logiciel', 'catalogue', 
        'prestation', 'commande', 'livraison', 'stock', 'cout', 'coût',
        'budget', 'financier', 'remise', 'réduction', 'promotion',
        'offre', 'abonnement', 'forfait', 'facturation'
      ], 
      priority: 1, 
      is_active: true 
    },
    // ==========================================================
    // PROJECT - Demandes de projets, développement
    // ==========================================================
    { 
      id: 'default-project', 
      category: 'project', 
      keywords: [
        'projet', 'developpement', 'prestation', 'realisation', 
        'saas', 'logiciel', 'application', 'solution', 'gestion', 
        'boutique', 'scolaire', 'domotique', 'energie', 'plateforme', 
        'systeme', 'automatisation', 'application web', 'mobile',
        'site web', 'api', 'integration', 'personnalisation',
        'sur mesure', 'custom', 'developer', 'programmation'
      ], 
      priority: 1, 
      is_active: true 
    },
    // ==========================================================
    // SUPPORT - Aide, assistance, problèmes
    // ==========================================================
    { 
      id: 'default-support', 
      category: 'support', 
      keywords: [
        'aide', 'probleme', 'bug', 'erreur', 'assistance', 'support', 
        'help', 'issue', 'problem', 'panne', 'incident', 'difficulte', 
        'bloque', 'fonctionne pas', 'marche pas', 'plantage', 
        'urgent', 'assistance technique', 'reparation', 'depannage',
        'casse', 'ne marche', 'peut pas', 'impossible', 'inaccessible',
        'perte', 'donnée', 'data', 'sauvegarde', 'restauration'
      ], 
      priority: 1, 
      is_active: true 
    },
    // ==========================================================
    // NEWSLETTER - Inscriptions, abonnements
    // ==========================================================
    { 
      id: 'default-newsletter', 
      category: 'newsletter', 
      keywords: [
        'newsletter', 'inscription', 'desinscription', 'abonnement', 
        'unsubscribe', 'news', 'infolettre', 'actualite', 'information', 
        'rejoindre', 'quitter', 'se desinscrire', 'actualites',
        'bulletin', 'mise a jour', 'mailing', 'emailing',
        'recevoir', 'envoyer', 'actu', 'nouveauté'
      ], 
      priority: 2, 
      is_active: true 
    },
    // ==========================================================
    // INFORMATION - Demandes d'information générales
    // ==========================================================
    { 
      id: 'default-information', 
      category: 'information', 
      keywords: [
        'information', 'renseignement', 'demande', 'question', 
        'infos', 'connaitre', 'savoir', 'details', 'precisions', 
        'expliquer', 'curieux', 'interesse', 'présentation',
        'découvrir', 'en savoir', 'comprendre', 'clarification',
        'plus', 'comment', 'pourquoi', 'est-ce que', 'explique'
      ], 
      priority: 3, 
      is_active: true 
    },
    // ==========================================================
    // FOUNDER - Questions sur le fondateur
    // ==========================================================
    { 
      id: 'default-founder', 
      category: 'founder', 
      keywords: [
        'fondateur', 'créateur', 'qui a créé', 'qui est le patron',
        'CEO', 'dirigeant', 'propriétaire', 'fondatrice', 'créatrice',
        'visionnaire', 'initiateur', 'porteur', 'leader', 'chef',
        'patron', 'boss', 'founder', 'creator', 'entrepreneur'
      ], 
      priority: 1, 
      is_active: true 
    },
    // ==========================================================
    // SPAM - Messages indésirables
    // ==========================================================
    { 
      id: 'default-spam', 
      category: 'spam', 
      keywords: [
        'spam', 'viagra', 'casino', 'porn', 'phishing', '$$$', 
        'lottery', 'gagnant', 'cliquez ici', 'offre exceptionnelle', 
        'million', 'gratuit', 'argent facile', 'gagner', 'prix',
        'cadeau', 'promotion', 'reduction', 'vente flash',
        'gagné', 'concours', 'récompense', 'free', 'click here'
      ], 
      priority: 0, 
      is_active: true 
    },
    // ==========================================================
    // GENERAL - Catégorie par défaut
    // ==========================================================
    { 
      id: 'default-general', 
      category: 'general', 
      keywords: [
        'bonjour', 'salut', 'hello', 'coucou', 'hey',
        'ça va', 'comment ça va', 'bien', 'merci', 'super',
        'génial', 'cool', 'nice', 'great', 'awesome'
      ], 
      priority: 4, 
      is_active: true 
    }
  ]
};

// ============================================================
// CLASSE DONA AMÉLIORÉE
// ============================================================
export class Dona implements IDona {
  private keywordConfigs: KeywordConfig[] = [];
  private config: DonaConfig;
  private initialized: boolean = false;
  private processedEmails: Set<string> = new Set();
  private processedContacts: Set<string> = new Set();

  constructor(config: Partial<DonaConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  // ============================================================
  // INITIALISATION
  // ============================================================
  async init(): Promise<void> {
    if (this.initialized) return;
    console.log('🤖 DONA: Initialisation...');
    await this.loadConfig();
    await this.loadProcessedEmails();
    await this.loadProcessedContacts();
    this.initialized = true;
    console.log(`✅ DONA: ${this.keywordConfigs.length} catégories chargées`);
    console.log(`📚 DONA: ${this.processedEmails.size} emails déjà traités`);
    console.log(`📚 DONA: ${this.processedContacts.size} contacts déjà traités`);
  }

  // ============================================================
  // CHARGEMENT DES DONNÉES TRAITÉES
  // ============================================================
  private async loadProcessedEmails(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('incoming_emails')
        .select('id')
        .neq('status', 'pending')
        .limit(1000);

      if (error) {
        console.warn('⚠️ DONA: Erreur chargement emails traités:', error);
        return;
      }

      if (data) {
        data.forEach(item => {
          this.processedEmails.add(item.id);
        });
        console.log(`📚 DONA: ${this.processedEmails.size} emails en cache`);
      }
    } catch (error) {
      console.warn('⚠️ DONA: Erreur chargement historique emails:', error);
    }
  }

  private async loadProcessedContacts(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('id')
        .neq('status', 'pending')
        .limit(1000);

      if (error) {
        console.warn('⚠️ DONA: Erreur chargement contacts traités:', error);
        return;
      }

      if (data) {
        data.forEach(item => {
          this.processedContacts.add(item.id);
        });
        console.log(`📚 DONA: ${this.processedContacts.size} contacts en cache`);
      }
    } catch (error) {
      console.warn('⚠️ DONA: Erreur chargement historique contacts:', error);
    }
  }

  // ============================================================
  // CHARGEMENT DE LA CONFIGURATION
  // ============================================================
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

  // ============================================================
  // ANALYSE AVEC SCORE DE PERTINENCE
  // ============================================================
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

    // ✅ Score par catégorie avec poids
    const results: { 
      category: string; 
      score: number; 
      matched: string[];
      weight: number;
    }[] = [];

    for (const config of this.keywordConfigs) {
      const matched = config.keywords.filter(kw => 
        words.some(w => w.includes(kw) || kw.includes(w))
      );
      
      if (matched.length > 0) {
        // ✅ Score basé sur le nombre de mots-clés trouvés
        let score = matched.length / config.keywords.length;
        
        // ✅ Bonus pour les correspondances exactes
        const exactMatches = config.keywords.filter(kw => 
          text.includes(kw)
        );
        if (exactMatches.length > 0) {
          score += exactMatches.length * 0.05;
        }
        
        // ✅ Bonus pour les mots-clés en début de message (plus importants)
        const firstWords = text.split(' ').slice(0, 10).join(' ');
        const firstMatches = config.keywords.filter(kw => 
          firstWords.includes(kw)
        );
        if (firstMatches.length > 0) {
          score += firstMatches.length * 0.03;
        }

        // ✅ Poids selon la priorité de la catégorie
        const weight = config.priority > 0 ? config.priority / 10 : 0.1;
        
        results.push({
          category: config.category,
          score: Math.min(score, 1),
          matched: matched,
          weight: weight,
        });
      }
    }

    // ✅ Si aucun résultat, catégorie 'general'
    if (results.length === 0) {
      return {
        category: 'general',
        priority: 'medium',
        assigned_agent: 'HARVEY',
        confidence: 20,
        matched_keywords: [],
        summary: 'Aucun mot-clé spécifique détecté, classé en général',
        score: 0,
      };
    }

    // ✅ Trier par score * poids
    results.sort((a, b) => (b.score * b.weight) - (a.score * a.weight));
    const best = results[0];
    const confidence = Math.min(Math.round(best.score * 100 + 10), 100);

    // ✅ Log de débogage
    if (this.config.debug) {
      console.log(`🔍 DONA Debug:`, {
        category: best.category,
        score: best.score,
        weight: best.weight,
        confidence,
        matched: best.matched.length,
        total_results: results.length,
      });
    }

    return {
      category: best.category as any,
      priority: this.getPriority(best.category),
      assigned_agent: this.getAgent(best.category),
      confidence: confidence,
      matched_keywords: best.matched,
      summary: `Catégorie "${best.category}" avec ${best.matched.length} mots-clés trouvés (confiance: ${confidence}%)`,
      score: best.score,
    };
  }

  // ============================================================
  // MAPPINGS AVEC NOUVELLES CATÉGORIES
  // ============================================================
  private getPriority(category: string): 'high' | 'medium' | 'low' {
    const map: Record<string, 'high' | 'medium' | 'low'> = {
      support: 'high',
      commercial: 'high',
      project: 'high',
      founder: 'high',
      newsletter: 'medium',
      information: 'medium',
      general: 'medium',
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
      founder: 'HUMAN',
      newsletter: 'NEWSLETTER',
      information: 'HARVEY',
      general: 'HARVEY',
      spam: 'NONE',
      other: 'HUMAN',
    };
    return map[category] || 'HUMAN';
  }

  // ============================================================
  // VÉRIFICATION DES DOUBLONS
  // ============================================================
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
  // PROCESS EMAIL - CORRIGÉ
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

      // ✅ NEWSLETTER → Ajouter à la liste
      if (analysis.category === 'newsletter' && this.config.enableNewsletterAutoSubscribe) {
        await this.handleNewsletter(emailData);
        
        await supabase
          .from('incoming_emails')
          .update({
            category: analysis.category,
            priority: analysis.priority,
            assigned_agent: 'NEWSLETTER',
            status: 'analyzed',
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
          status: 'analyzed',
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
  // PROCESS CONTACT - CORRIGÉ
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

      const { error: contactError } = await supabase
        .from('contacts')
        .update({
          status: 'analyzed',
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
            status: 'analyzed',
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
            status: 'analyzed',
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

  // ============================================================
  // NEWSLETTER
  // ============================================================
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

  // ============================================================
  // PROCESS BATCH
  // ============================================================
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

  // ============================================================
  // NETTOYAGE DES DOUBLONS
  // ============================================================
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

  // ============================================================
  // CLASSIFICATION RAPIDE POUR CHATBOT
  // ============================================================
  async classifyForChat(message: string): Promise<{
    category: string;
    confidence: number;
    matched_keywords: string[];
  }> {
    await this.init();
    
    const analysis = await this.analyze({
      from: 'chatbot',
      subject: 'Message chat',
      body: message,
      source: 'email',
    });

    return {
      category: analysis.category,
      confidence: analysis.confidence,
      matched_keywords: analysis.matched_keywords,
    };
  }

  // ============================================================
  // RAFRAÎCHISSEMENT DU CACHE
  // ============================================================
  async refreshCache(): Promise<void> {
    console.log('🔄 DONA: Rafraîchissement du cache...');
    this.processedEmails.clear();
    this.processedContacts.clear();
    await this.loadProcessedEmails();
    await this.loadProcessedContacts();
    console.log(`✅ DONA: Cache rafraîchi (${this.processedEmails.size} emails, ${this.processedContacts.size} contacts)`);
  }

  // ============================================================
  // STATUT
  // ============================================================
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

  // ============================================================
  // CONFIGURATION
  // ============================================================
  updateConfig(config: Partial<DonaConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('⚙️ DONA: Configuration mise à jour');
  }

  // ============================================================
  // RÉINITIALISATION COMPLÈTE
  // ============================================================
  async reset(): Promise<void> {
    console.log('🔄 DONA: Réinitialisation complète...');
    this.initialized = false;
    this.processedEmails.clear();
    this.processedContacts.clear();
    this.keywordConfigs = [];
    await this.init();
    console.log('✅ DONA: Réinitialisation terminée');
  }
}

// ============================================================
// INSTANCE DONA
// ============================================================
export const dona = new Dona();