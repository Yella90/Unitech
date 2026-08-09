// lib/dona/processor.ts
import { supabase } from '@/lib/supabase';

// ============================================================
// TYPES
// ============================================================
type KeywordConfig = {
  id: string;
  category: string;
  keywords: string[];
  priority: number;
  is_active: boolean;
};

type AnalysisResult = {
  category: 'support' | 'commercial' | 'project' | 'newsletter' | 'information' | 'spam' | 'other';
  priority: 'high' | 'medium' | 'low';
  assigned_agent: string;
  confidence: number;
  matched_keywords: string[];
  summary: string;
  score: number;
};

type EmailData = {
  from: string;
  to: string;
  subject: string;
  body: string;
};

type ContactData = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
};

type ProcessEmailResult = {
  action: 'stored' | 'ignored' | 'newsletter' | 'error';
  reason?: string;
  email_id?: string;
  analysis?: AnalysisResult;
  error?: Error;
};

type ProcessContactResult = {
  action: 'updated' | 'error';
  analysis?: AnalysisResult;
  error?: Error;
};

// ============================================================
// CLASSE DONA
// ============================================================
export class Dona {
  private keywordConfigs: KeywordConfig[] = [];

  // ============================================================
  // CHARGEMENT DE LA CONFIGURATION
  // ============================================================
  async loadConfig(): Promise<void> {
    console.log('📊 DONA: Chargement de la configuration...');

    try {
      const { data, error } = await supabase
        .from('keyword_config')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('❌ Erreur chargement config:', error);
        return;
      }

      this.keywordConfigs = data || [];
      
      console.log(`📋 ${this.keywordConfigs.length} catégories chargées`);
      
      if (this.keywordConfigs.length === 0) {
        console.warn('⚠️ Aucune catégorie chargée ! Utilisation des mots-clés par défaut');
        this.useDefaultKeywords();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('❌ Erreur inattendue:', errorMessage);
      this.useDefaultKeywords();
    }
  }

  // ============================================================
  // MOTS-CLÉS PAR DÉFAUT
  // ============================================================
  private useDefaultKeywords(): void {
    this.keywordConfigs = [
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
          'systeme', 'automatisation', 'application web', 'service',
          'conception', 'architecture', 'base de donnees'
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
      },
    ];
    console.log(`📋 ${this.keywordConfigs.length} catégories par défaut chargées`);
  }

  // ============================================================
  // MAPPING PRIORITÉ
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

  // ============================================================
  // MAPPING AGENT
  // ============================================================
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
  // ANALYSE DU TEXTE
  // ============================================================
  async analyze(input: {
    from?: string;
    subject?: string;
    body: string;
    source: 'email' | 'contact';
  }): Promise<AnalysisResult> {
    if (this.keywordConfigs.length === 0) {
      console.log('🔄 DONA: Chargement de la configuration...');
      await this.loadConfig();
    }

    if (this.keywordConfigs.length === 0) {
      console.warn('⚠️ DONA: Utilisation des mots-clés par défaut');
      this.useDefaultKeywords();
    }

    const text = `${input.subject || ''} ${input.body}`.toLowerCase();
    const words = text.split(/\s+/).filter(w => w.length > 2);
    
    console.log(`🔍 Analyse de ${words.length} mots (source: ${input.source})`);

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
      console.log('📊 Aucun mot-clé trouvé, classé en "information"');
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

    console.log(`📊 Catégorie: ${best.category} (confiance: ${confidence}%, mots: ${best.matched.join(', ')})`);

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

  // lib/dona/processor.ts - Version corrigée

// ============================================================
// TRAITER UN EMAIL (Version corrigée)
// ============================================================
async processEmail(emailData: EmailData): Promise<ProcessEmailResult> {
  try {
    console.log(`📧 DONA analyse un email de ${emailData.from}`);
    
    const analysis = await this.analyze({
      from: emailData.from,
      subject: emailData.subject,
      body: emailData.body,
      source: 'email',
    });
    
    console.log(`📊 Résultat: ${analysis.category} (confiance: ${analysis.confidence}%)`);

    // ✅ SPAM → Ignorer
    if (analysis.category === 'spam') {
      console.log(`🚫 Email ignoré (spam)`);
      
      // ✅ Récupérer l'ID de l'email en attente
      const { data: emailToUpdate, error: findError } = await supabase
        .from('incoming_emails')
        .select('id')
        .eq('from_email', emailData.from)
        .eq('subject', emailData.subject)
        .eq('status', 'pending')
        .limit(1)
        .single();

      if (findError) {
        console.error('❌ Erreur recherche email:', findError);
        return { action: 'error', error: new Error(findError.message) };
      }

      if (!emailToUpdate) {
        console.log('⚠️ Aucun email en attente trouvé');
        return { action: 'ignored', reason: 'no_pending_email' };
      }

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
        console.error('❌ Erreur mise à jour spam:', error);
        return { action: 'error', error: new Error(error.message) };
      }
      return { action: 'ignored', reason: 'spam' };
    }

    // ✅ NEWSLETTER → Ajouter à la liste
    if (analysis.category === 'newsletter') {
      await this.handleNewsletter(emailData);
      
      const { data: emailToUpdate, error: findError } = await supabase
        .from('incoming_emails')
        .select('id')
        .eq('from_email', emailData.from)
        .eq('subject', emailData.subject)
        .eq('status', 'pending')
        .limit(1)
        .single();

      if (findError) {
        console.error('❌ Erreur recherche email:', findError);
        return { action: 'error', error: new Error(findError.message) };
      }

      if (!emailToUpdate) {
        console.log('⚠️ Aucun email en attente trouvé');
        return { action: 'newsletter', analysis };
      }

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
        console.error('❌ Erreur mise à jour newsletter:', error);
        return { action: 'error', error: new Error(error.message) };
      }
      
      return { action: 'newsletter', analysis };
    }

    // ✅ Mettre à jour l'email avec un statut valide
    const { data: emailToUpdate, error: findError } = await supabase
      .from('incoming_emails')
      .select('id')
      .eq('from_email', emailData.from)
      .eq('subject', emailData.subject)
      .eq('status', 'pending')
      .limit(1)
      .single();

    if (findError) {
      console.error('❌ Erreur recherche email:', findError);
      return { action: 'error', error: new Error(findError.message) };
    }

    if (!emailToUpdate) {
      console.log('⚠️ Aucun email en attente trouvé');
      return { action: 'error', error: new Error('No pending email found') };
    }

    const { data, error } = await supabase
      .from('incoming_emails')
      .update({
        category: analysis.category,
        priority: analysis.priority,
        assigned_agent: analysis.assigned_agent,
        status: 'processed',
        ai_analysis: analysis,
        updated_at: new Date().toISOString(),
        processed_at: new Date().toISOString(),
      })
      .eq('id', emailToUpdate.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur mise à jour email:', error);
      return { action: 'error', error: new Error(error.message) };
    }

    console.log(`✅ Email ${data.id} classé: ${analysis.category} (assigné à ${analysis.assigned_agent})`);
    return { action: 'stored', email_id: data.id, analysis };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('❌ Erreur processEmail:', errorMessage);
    return { action: 'error', error: new Error(errorMessage) };
  }
}

  // ============================================================
  // TRAITER UN CONTACT
  // ============================================================
  async processContact(contactData: ContactData): Promise<ProcessContactResult> {
    try {
      console.log(`📧 DONA analyse un contact de ${contactData.name}`);
      
      const analysis = await this.analyze({
        from: contactData.email,
        subject: contactData.subject,
        body: contactData.message,
        source: 'contact',
      });
      
      console.log(`📊 Résultat: ${analysis.category} (confiance: ${analysis.confidence}%)`);

      const updateData: any = {
        status: 'processed',
        category: analysis.category,
        assigned_agent: analysis.assigned_agent,
        priority: analysis.priority,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', contactData.id);

      if (error) {
        console.error('❌ Erreur mise à jour contact:', error);
        return { action: 'error', error: new Error(error.message) };
      }

      console.log(`✅ Contact ${contactData.id} classé: ${analysis.category} (confiance: ${analysis.confidence}%)`);
      return { action: 'updated', analysis };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('❌ Erreur processContact:', errorMessage);
      return { action: 'error', error: new Error(errorMessage) };
    }
  }

  // ============================================================
  // GÉRER LA NEWSLETTER
  // ============================================================
  private async handleNewsletter(emailData: EmailData): Promise<void> {
    try {
      const { data: existing } = await supabase
        .from('newsletter_subscribers')
        .select('id')
        .eq('email', emailData.from)
        .single();

      if (existing) {
        console.log(`📬 ${emailData.from} déjà abonné`);
        return;
      }

      await supabase
        .from('newsletter_subscribers')
        .insert({
          email: emailData.from,
          interests: ['general'],
          source: 'email',
          is_active: true,
        });

      console.log(`📬 ${emailData.from} ajouté à la newsletter`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('❌ Erreur newsletter:', errorMessage);
    }
  }
}

// ============================================================
// EXPORT DE L'INSTANCE
// ============================================================
export const dona = new Dona();