// lib/agents/dona/processor.ts
import { supabase } from '@/lib/supabase';
import { 
  KeywordConfig, 
  AnalysisResult, 
  EmailData, 
  ContactData,
  ProcessEmailResult,
  ProcessContactResult,
  DonaConfig
} from './types';

// ============================================================
// CONFIGURATION PAR DÉFAUT
// ============================================================
const defaultConfig: DonaConfig = {
  maxEmailsPerRun: 50,
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
export class Dona {
  private keywordConfigs: KeywordConfig[] = [];
  private config: DonaConfig;
  private initialized: boolean = false;

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
    this.initialized = true;
    console.log(`✅ DONA: ${this.keywordConfigs.length} catégories chargées`);
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
  // ANALYSE DU TEXTE
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

  // ============================================================
  // MAPPINGS
  // ============================================================
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

  // ============================================================
  // PROCESS EMAIL (VERSION COMPLÈTE CORRIGÉE)
  // ============================================================
  async processEmail(emailData: EmailData): Promise<ProcessEmailResult> {
    try {
      if (!this.initialized) {
        await this.init();
      }

      console.log(`📧 DONA: Analyse email de ${emailData.from}`);
      
      const analysis = await this.analyze({
        from: emailData.from,
        subject: emailData.subject,
        body: emailData.body,
        source: 'email',
      });
      
      console.log(`📊 DONA: ${analysis.category} (${analysis.confidence}%)`);

      // ✅ Récupérer l'email en attente avec gestion d'erreur
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
        // ✅ Si aucun email en 'pending', vérifier s'il a déjà été traité
        const { data: existing } = await supabase
          .from('incoming_emails')
          .select('id, status')
          .eq('from_email', emailData.from)
          .eq('subject', emailData.subject)
          .limit(1)
          .maybeSingle();

        if (existing) {
          console.log(`⚠️ DONA: Email déjà traité (status: ${existing.status})`);
          return { action: 'stored', email_id: existing.id, analysis };
        }

        console.log('⚠️ DONA: Aucun email en attente trouvé');
        return { action: 'error', error: new Error('No pending email found') };
      }

      // ✅ SPAM → Ignorer
      if (analysis.category === 'spam') {
        console.log(`🚫 DONA: Email ignoré (spam)`);
        
        const { error } = await supabase
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

        if (error) {
          console.error('❌ DONA: Erreur spam:', error);
          return { action: 'error', error: new Error(error.message) };
        }
        return { action: 'ignored', reason: 'spam' };
      }

      // ✅ NEWSLETTER → Ajouter à la liste et marquer comme traité
      if (analysis.category === 'newsletter') {
        await this.handleNewsletter(emailData);
        
        const { error } = await supabase
          .from('incoming_emails')
          .update({
            category: analysis.category,
            priority: analysis.priority,
            assigned_agent: 'NEWSLETTER',
            status: 'processed',
            ai_analysis: analysis,
            updated_at: new Date().toISOString(),
            processed_at: new Date().toISOString(),
          })
          .eq('id', emailToUpdate.id);

        if (error) {
          console.error('❌ DONA: Erreur newsletter:', error);
          return { action: 'error', error: new Error(error.message) };
        }
        return { action: 'newsletter', analysis };
      }

      // ✅ AUTRES CATÉGORIES → 'analyzed' pour HARVEY
      const { data, error } = await supabase
        .from('incoming_emails')
        .update({
          category: analysis.category,
          priority: analysis.priority,
          assigned_agent: analysis.assigned_agent,
          status: 'analyzed',  // ✅ HARVEY cherche ce statut
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

      console.log(`✅ DONA: Email ${data.id} classé: ${analysis.category}`);
      return { action: 'stored', email_id: data.id, analysis };

    } catch (error: any) {
      console.error('❌ DONA: Erreur processEmail:', error.message);
      return { action: 'error', error: new Error(error.message) };
    }
  }

  // ============================================================
  // PROCESS CONTACT
  // ============================================================
  async processContact(contactData: ContactData): Promise<ProcessContactResult> {
    try {
      if (!this.initialized) {
        await this.init();
      }

      console.log(`📧 DONA: Analyse contact de ${contactData.name}`);
      
      const analysis = await this.analyze({
        from: contactData.email,
        subject: contactData.subject,
        body: contactData.message,
        source: 'contact',
      });
      
      console.log(`📊 DONA: ${analysis.category} (${analysis.confidence}%)`);

      const { error } = await supabase
        .from('contacts')
        .update({
          status: 'processed',
          category: analysis.category,
          assigned_agent: analysis.assigned_agent,
          priority: analysis.priority,
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', contactData.id);

      if (error) {
        console.error('❌ DONA: Erreur contact:', error);
        return { action: 'error', error: new Error(error.message) };
      }

      console.log(`✅ DONA: Contact ${contactData.id} classé: ${analysis.category}`);
      return { action: 'updated', analysis };

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
      // Vérifier si l'email existe déjà
      const { data: existing } = await supabase
        .from('newsletter_subscribers')
        .select('id')
        .eq('email', emailData.from)
        .maybeSingle();

      if (existing) {
        console.log(`📬 DONA: ${emailData.from} déjà abonné`);
        return;
      }

      // Ajouter à la newsletter
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({
          email: emailData.from,
          interests: ['general'],
          source: 'email',
          is_active: true,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ DONA: Erreur insertion newsletter:', error);
      } else {
        console.log(`📬 DONA: ${emailData.from} ajouté à la newsletter`);
      }
    } catch (error: any) {
      console.error('❌ DONA: Erreur newsletter:', error.message);
    }
  }
}

// ============================================================
// EXPORT DE L'INSTANCE
// ============================================================
export const dona = new Dona();