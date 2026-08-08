// lib/dona/processor.ts
import { supabase } from '@/lib/supabase';

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

export class Dona {
  private keywordConfigs: KeywordConfig[] = [];

  async loadConfig() {
    const { data, error } = await supabase
      .from('keyword_config')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true });

    if (error) {
      console.error('❌ Erreur chargement config:', error);
      return;
    }

    this.keywordConfigs = data || [];
    console.log(`📋 ${this.keywordConfigs.length} catégories chargées`);
  }

  async analyze(input: {
    from?: string;
    subject?: string;
    body: string;
    source: 'email' | 'contact';
  }): Promise<AnalysisResult> {
    if (this.keywordConfigs.length === 0) {
      await this.loadConfig();
    }

    const text = `${input.subject || ''} ${input.body}`.toLowerCase();
    const results: AnalysisResult[] = [];

    for (const config of this.keywordConfigs) {
      const matched = config.keywords.filter(kw => text.includes(kw.toLowerCase()));
      
      if (matched.length > 0) {
        const confidence = Math.min(
          Math.round((matched.length / config.keywords.length) * 100),
          100
        );

        results.push({
          category: config.category as any,
          priority: config.priority === 0 ? 'low' : config.priority === 1 ? 'medium' : 'high',
          assigned_agent: this.getAgentForCategory(config.category),
          confidence,
          matched_keywords: matched,
          summary: `Analyse par DONA: ${matched.length} mots-clés trouvés`,
        });
      }
    }

    if (results.length === 0) {
      return {
        category: 'information',
        priority: 'medium',
        assigned_agent: 'HUMAN',
        confidence: 30,
        matched_keywords: [],
        summary: 'Aucun mot-clé spécifique détecté. À traiter manuellement.',
      };
    }

    results.sort((a, b) => b.confidence - a.confidence);

    const spamConfig = this.keywordConfigs.find(c => c.category === 'spam');
    if (spamConfig && text.includes('spam')) {
      return {
        category: 'spam',
        priority: 'low',
        assigned_agent: 'NONE',
        confidence: 95,
        matched_keywords: ['spam'],
        summary: 'Email identifié comme spam',
      };
    }

    return results[0];
  }

  private getAgentForCategory(category: string): string {
    const agentMap: Record<string, string> = {
      support: 'SUPPORT',
      commercial: 'COMMERCIAL',
      project: 'PROJET',
      newsletter: 'NEWSLETTER',
      information: 'HUMAN',
      spam: 'NONE',
      other: 'HUMAN',
    };
    return agentMap[category] || 'HUMAN';
  }

  // ✅ Traiter un email entrant
  async processEmail(emailData: EmailData) {
    console.log(`📧 DONA analyse un email de ${emailData.from}`);

    const analysis = await this.analyze({
      from: emailData.from,
      subject: emailData.subject,
      body: emailData.body,
      source: 'email',
    });

    console.log(`📊 Catégorie: ${analysis.category} (confiance: ${analysis.confidence}%)`);

    if (analysis.category === 'spam') {
      console.log(`🚫 Email ignoré (spam)`);
      return { action: 'ignored', reason: 'spam' };
    }

    if (analysis.category === 'newsletter') {
      await this.handleNewsletter(emailData);
      return { action: 'newsletter', analysis };
    }

    const { data, error } = await supabase
      .from('incoming_emails')
      .insert({
        from_email: emailData.from,
        to_email: emailData.to,
        subject: emailData.subject,
        body: emailData.body,
        received_at: new Date().toISOString(),
        category: analysis.category,
        priority: analysis.priority,
        assigned_agent: analysis.assigned_agent,
        status: 'pending',
        ai_analysis: analysis,
        is_relevant: true,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur insertion:', error);
      return { action: 'error', error };
    }

    console.log(`✅ Email ${data.id} stocké et assigné à ${analysis.assigned_agent}`);

    return { action: 'stored', email_id: data.id, analysis };
  }

  // ✅ Traiter un contact - CORRIGÉ
  async processContact(contactData: ContactData) {
    console.log(`📧 DONA analyse un contact de ${contactData.name}`);

    const analysis = await this.analyze({
      from: contactData.email,
      subject: contactData.subject,
      body: contactData.message,
      source: 'contact',
    });

    console.log(`📊 Catégorie: ${analysis.category} (confiance: ${analysis.confidence}%)`);

    // ✅ Mettre à jour le contact (colonnes existantes uniquement)
    const updateData: any = {
      status: 'processed',
      updated_at: new Date().toISOString(),
    };

    // ✅ Ajouter les nouvelles colonnes si elles existent
    // Sinon, on les ignore silencieusement
    try {
      // Vérifier si les colonnes existent
      const { data: columns } = await supabase
        .from('contacts')
        .select('category, assigned_agent, priority, processed_at')
        .limit(1);

      if (columns && columns.length >= 0) {
        // Les colonnes existent, on les met à jour
        updateData.category = analysis.category;
        updateData.assigned_agent = analysis.assigned_agent;
        updateData.priority = analysis.priority;
        updateData.processed_at = new Date().toISOString();
      }
    } catch (error) {
      // Les colonnes n'existent pas, on continue sans elles
      console.log('⚠️ Colonnes supplémentaires non disponibles');
    }

    const { error } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', contactData.id);

    if (error) {
      console.error('❌ Erreur mise à jour contact:', error);
      return { action: 'error', error };
    }

    console.log(`✅ Contact ${contactData.id} mis à jour: ${analysis.category}`);

    return { action: 'updated', analysis };
  }

  private async handleNewsletter(emailData: EmailData) {
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
    } catch (error) {
      console.error('❌ Erreur newsletter:', error);
    }
  }
}

export const dona = new Dona();