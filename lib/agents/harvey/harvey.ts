// lib/agents/harvey/harvey.ts

import { supabase } from '@/lib/supabase';
import { generateWithFallback } from '@/lib/config/llm';

import {
  EmailWithAnalysis,
  CompanyData,
  ConversationHistory,
  HarveyResponse,
  HarveyConfig,
} from './types';

// ============================================================
// CONFIGURATION PAR DÉFAUT
// ============================================================

const defaultConfig: HarveyConfig = {
  maxEmailsPerRun: 10,
  minConfidence: 60,
  requireHumanReview: true,
  defaultTone: 'professional',
  temperature: 0.7,
  maxTokens: 800,
};

// ============================================================
// CLASSE HARVEY
// ============================================================

export class Harvey {
  private config: HarveyConfig;
  private companyData: CompanyData | null = null;
  private knowledgeBase: any[] = [];
  private templates: any[] = [];
  private initialized = false;
  
  // ✅ SUIVI DES EMAILS TRAITÉS
  private processedEmails: Set<string> = new Set();
  private processedContacts: Set<string> = new Set();

  constructor(config: Partial<HarveyConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  // ============================================================
  // INITIALISATION
  // ============================================================

  async init(): Promise<void> {
    if (this.initialized) return;

    console.log('🦸‍♂️ HARVEY: Initialisation...');

    await Promise.all([
      this.loadCompanyData(),
      this.loadKnowledgeBase(),
      this.loadTemplates(),
      this.loadProcessedEmails(),
      this.loadProcessedContacts(),
    ]);

    this.initialized = true;
    console.log('✅ HARVEY: Prêt à répondre');
  }

  // ============================================================
  // CHARGEMENT DES DONNÉES ENTREPRISE
  // ============================================================

  private async loadCompanyData(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('company_data')
        .select('*')
        .single();

      if (error) {
        console.warn('⚠️ HARVEY: Données entreprise par défaut utilisées');
        this.companyData = this.getDefaultCompanyData();
        return;
      }

      this.companyData = {
        name: data.name || 'UNITECH',
        description: data.description || '',
        services: data.services || [],
        formations: data.formations || [],
        projects: data.projects || [],
        missions: data.missions || [],
        pricing: data.pricing || {},
        team: data.team || [],
        faq: data.faq || [],
      };

      console.log(`🏢 HARVEY: ${this.companyData.name} chargé`);
    } catch (error) {
      console.warn('⚠️ HARVEY: Erreur chargement entreprise');
      this.companyData = this.getDefaultCompanyData();
    }
  }

  private getDefaultCompanyData(): CompanyData {
    return {
      name: 'UNITECH',
      description:
        "Solutions technologiques intelligentes pour l'éducation, l'industrie et la formation professionnelle.",
      services: [
        {
          name: 'SaaS Scolaire',
          description: 'Gestion complète des établissements scolaires',
          features: ['Gestion des élèves', 'Notes et bulletins', 'Paiements', 'Statistiques'],
        },
        {
          name: 'SaaS Boutique',
          description: 'Gestion pour commerçants locaux',
          features: ['Gestion des stocks', 'Suivi des ventes', 'Clients', 'Facturation'],
        },
        {
          name: 'Domotique Énergétique',
          description: 'Système intelligent de gestion énergétique',
          features: ['Suivi consommation', 'Facturation automatique', 'Optimisation IA'],
        },
      ],
      formations: [
        {
          name: 'Développement Web Full Stack',
          duration: '6 mois',
          level: 'Débutant à Avancé',
          technologies: ['React', 'Node.js', 'MongoDB'],
        },
        {
          name: 'Intelligence Artificielle et ML',
          duration: '4 mois',
          level: 'Intermédiaire',
          technologies: ['Python', 'TensorFlow', 'Scikit-learn'],
        },
      ],
      projects: [
        {
          name: 'SaaS Scolaire',
          status: 'En développement',
          progress: 68,
          description: 'Plateforme de gestion pour écoles',
        },
        {
          name: 'SaaS Boutique',
          status: 'En développement',
          progress: 42,
          description: 'Solution pour commerçants locaux',
        },
      ],
      missions: [
        { title: 'Développeur Full Stack', description: "Conception d'applications web et mobiles" },
        { title: 'Ingénieur IA', description: "Développement de modèles d'intelligence artificielle" },
      ],
      pricing: {
        base: 'Sur devis',
        consultation: 'Gratuite',
        details: 'Solutions adaptées à vos besoins',
      },
      team: [
        { name: 'Laye Soma', role: 'Fondateur & CEO', email: 'laye@unitech.com' },
        { name: 'Équipe TECH', role: 'Développement', email: 'tech@unitech.com' },
      ],
      faq: [
        {
          question: 'Quels sont vos services ?',
          answer: 'Nous proposons des solutions SaaS, formations et missions',
        },
        {
          question: 'Comment obtenir un devis ?',
          answer: 'Contactez-nous via le formulaire de contact ou par email.',
        },
      ],
    };
  }

  // ============================================================
  // CHARGEMENT BASE DE CONNAISSANCES
  // ============================================================

  private async loadKnowledgeBase(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.warn('⚠️ HARVEY: Base de connaissances vide');
        this.knowledgeBase = [];
        return;
      }

      this.knowledgeBase = data || [];
      console.log(`📚 HARVEY: ${this.knowledgeBase.length} connaissances chargées`);
    } catch (error) {
      console.error('❌ HARVEY: Erreur base de connaissances');
      this.knowledgeBase = [];
    }
  }

  // ============================================================
  // CHARGEMENT DES TEMPLATES
  // ============================================================

  private async loadTemplates(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('response_templates')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.warn('⚠️ HARVEY: Aucun template disponible');
        this.templates = [];
        return;
      }

      this.templates = data || [];
      console.log(`📝 HARVEY: ${this.templates.length} templates chargés`);
    } catch (error) {
      console.error('❌ HARVEY: Erreur chargement templates');
      this.templates = [];
    }
  }

  // ============================================================
  // CHARGEMENT DES EMAILS DÉJÀ TRAITÉS
  // ============================================================

  private async loadProcessedEmails(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('email_conversations')
        .select('email_id')
        .not('email_id', 'is', null);

      if (error) {
        console.warn('⚠️ HARVEY: Erreur chargement emails traités:', error);
        return;
      }

      if (data) {
        data.forEach(item => {
          if (item.email_id) {
            this.processedEmails.add(item.email_id);
          }
        });
        console.log(`📚 HARVEY: ${this.processedEmails.size} emails déjà traités`);
      }
    } catch (error) {
      console.warn('⚠️ HARVEY: Erreur chargement historique emails');
    }
  }

  // ============================================================
  // CHARGEMENT DES CONTACTS DÉJÀ TRAITÉS
  // ============================================================

  private async loadProcessedContacts(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('email_conversations')
        .select('from_email, source')
        .eq('source', 'contact');

      if (error) {
        console.warn('⚠️ HARVEY: Erreur chargement contacts traités:', error);
        return;
      }

      if (data) {
        data.forEach(item => {
          if (item.from_email) {
            this.processedContacts.add(item.from_email);
          }
        });
        console.log(`📚 HARVEY: ${this.processedContacts.size} contacts déjà traités`);
      }
    } catch (error) {
      console.warn('⚠️ HARVEY: Erreur chargement historique contacts');
    }
  }

  // ============================================================
  // VÉRIFICATION DES DOUBLONS
  // ============================================================

  private async isEmailAlreadyProcessed(emailId: string): Promise<boolean> {
    try {
      // ✅ Vérifier dans la mémoire locale
      if (this.processedEmails.has(emailId)) {
        return true;
      }

      // ✅ Vérifier dans la base de données
      const { data, error } = await supabase
        .from('email_conversations')
        .select('email_id')
        .eq('email_id', emailId)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn('⚠️ HARVEY: Erreur vérification doublon email:', error);
        return false;
      }

      if (data) {
        this.processedEmails.add(emailId);
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  private async isContactAlreadyProcessed(contactId: string, email: string): Promise<boolean> {
    try {
      // ✅ Vérifier dans la mémoire locale
      if (this.processedContacts.has(email)) {
        return true;
      }

      // ✅ Vérifier dans la base de données
      const { data, error } = await supabase
        .from('email_conversations')
        .select('id')
        .eq('from_email', email)
        .eq('source', 'contact')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn('⚠️ HARVEY: Erreur vérification doublon contact:', error);
        return false;
      }

      if (data) {
        this.processedContacts.add(email);
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  // ============================================================
  // HISTORIQUE DES CONVERSATIONS
  // ============================================================

  private async getConversationHistory(
    email: string,
    limit: number = 5
  ): Promise<ConversationHistory[]> {
    try {
      const { data, error } = await supabase
        .from('email_conversations')
        .select(
          'id, from_email, subject, message, body, agent_response, sent_at, response_tone, confidence'
        )
        .eq('from_email', email)
        .eq('status', 'sent')
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ HARVEY: Erreur historique:', error);
        return [];
      }

      if (!data || data.length === 0) return [];

      return data.map(
        (item: any): ConversationHistory => ({
          id: item.id,
          from_email: item.from_email,
          subject: item.subject || 'Sans sujet',
          body: item.message || item.body || '',
          agent_response: item.agent_response || '',
          sent_at: item.sent_at || new Date().toISOString(),
          category: 'information',
          tone: item.response_tone || 'professional',
          confidence: item.confidence || 70,
        })
      );
    } catch (error: any) {
      console.error('❌ HARVEY: Erreur historique:', error?.message || error);
      return [];
    }
  }

  // ============================================================
  // CONSTRUCTION DU PROMPT
  // ============================================================

  private buildPrompt(
    email: EmailWithAnalysis,
    history: ConversationHistory[],
    companyData: CompanyData
  ): string {
    const safeBody = email.body?.substring(0, 3000) || '';

    let prompt = `
Tu es un consultant professionnel pour ${companyData.name}.

## OBJECTIF

Rédige une réponse directe et professionnelle comme le ferait un consultant de ${companyData.name}.

## STYLE

- Sois confiant et assuré
- Réponds avec clarté et précision
- Utilise un ton professionnel et courtois
- Sois direct, ne tourne pas autour du pot
- Montre que tu maîtrises le sujet

## RÈGLES

1. Sois professionnel, direct et confiant
2. Réponds dans la même langue que le client
3. Ne fabrique aucune information
4. Si tu ne sais pas, dis : "Je vérifie et je reviens vers vous"
5. Propose une action concrète
6. **Ne mentionne JAMAIS que tu es une IA, un assistant ou HARVEY**
7. **Ne mentionne jamais d'API, de modèle, de prompt ou de LLM**
8. **Signe uniquement par : L'équipe ${companyData.name}**

## ENTREPRISE

Nom : ${companyData.name}
Description : ${companyData.description}

## SERVICES

${companyData.services.map((s) => `- ${s.name}: ${s.description}`).join('\n')}

## FORMATIONS

${companyData.formations.map((f) => `- ${f.name}: ${f.duration} (${f.level})`).join('\n')}

## PROJETS

${companyData.projects.map((p) => `- ${p.name}: ${p.status} (${p.progress}%)`).join('\n')}

## TARIFS

${JSON.stringify(companyData.pricing, null, 2)}

## EMAIL DU CLIENT

De : ${email.from_email}
Sujet : ${email.subject}
Catégorie : ${email.category}
Priorité : ${email.priority}

Message :
${safeBody}

## ANALYSE

Confiance : ${email.ai_analysis?.confidence || 0}%
Mots-clés : ${email.ai_analysis?.matched_keywords?.join(', ') || 'Aucun'}
`;

    if (history && history.length > 0) {
      prompt += `
      
## HISTORIQUE RÉCENT

`;
      history.slice(0, 5).forEach((conv, index) => {
        prompt += `
### Conversation ${index + 1}

Sujet : ${conv.subject}
Message : ${conv.body?.substring(0, 500) || ''}
Réponse précédente : ${conv.agent_response?.substring(0, 500) || ''}
`;
      });
    }

    if (this.knowledgeBase && this.knowledgeBase.length > 0) {
      const emailText = `${email.subject || ''} ${email.body || ''}`.toLowerCase();
      const relevant = this.knowledgeBase
        .filter((kb: any) => {
          if (!kb?.keyword) return false;
          return emailText.includes(String(kb.keyword).toLowerCase());
        })
        .slice(0, 5);

      if (relevant.length > 0) {
        prompt += `
        
## INFORMATIONS PERTINENTES

`;
        relevant.forEach((kb: any) => {
          prompt += `
Question : ${kb.question || ''}
Réponse : ${kb.answer || ''}
`;
        });
      }
    }

    prompt += `

## INSTRUCTION FINALE

Rédige maintenant la réponse complète au client.

La réponse doit être directe, professionnelle et utile.

Longueur recommandée : 150 à 400 mots.

**Ne mets pas :**
- "Réponse proposée"
- "Voici une réponse"
- "En tant qu'IA"
- "Je suis HARVEY"
- "Je suis un assistant"
- une explication de ton raisonnement
- un ton trop automatique

**Donne directement le texte de l'email comme si un consultant de UNITECH l'écrivait.**

Signature : L'équipe ${companyData.name}
`;

    return prompt.trim();
  }

  // ============================================================
  // APPEL À L'API LLM AVEC FALLBACK
  // ============================================================

  private async callLLM(prompt: string): Promise<string> {
    try {
      console.log('🤖 HARVEY: Appel du LLM avec fallback...');

      const result = await generateWithFallback({
        messages: [
          {
            role: 'system',
            content: `Tu es un consultant professionnel pour UNITECH.

## PERSONNALITÉ
- Confiant et direct
- Intelligent et pragmatique
- Charismatique et persuasif
- Professionnel mais accessible
- Ne tourne pas autour du pot

## STYLE DE COMMUNICATION
- Réponds avec assurance
- Sois concis mais complet
- Utilise un ton professionnel et courtois
- Montre que tu maîtrises le sujet

## RÈGLES
1. Sois professionnel, direct et confiant
2. Réponds dans la même langue que le client
3. Si tu ne connais pas une information, dis : "Je vérifie et je reviens vers vous"
4. **Ne mentionne JAMAIS que tu es une IA, un assistant ou HARVEY**
5. **Ne mentionne jamais d'API, de modèle, de prompt ou de LLM**
6. **Signe uniquement par : L'équipe UNITECH**

## SPÉCIALITÉS
- Solutions SaaS
- Éducation
- Commerce local
- Domotique
- Gestion d'entreprise

Signature : L'équipe UNITECH`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      });

      if (!result.content) {
        throw new Error('Le LLM a retourné une réponse vide.');
      }

      console.log(`✅ HARVEY: Réponse reçue (provider: ${result.provider})`);
      return result.content;
    } catch (error: any) {
      console.error('❌ HARVEY: Erreur LLM:', error.message);
      return this.getFallbackResponse();
    }
  }

  // ============================================================
  // RÉPONSE DE SECOURS
  // ============================================================

  private getFallbackResponse(): string {
    return `
Bonjour,

Merci pour votre message. Nous avons bien reçu votre demande.

Notre équipe examine actuellement votre demande afin de vous apporter une réponse précise et adaptée.

Nous reviendrons vers vous dans les plus brefs délais.

Si votre demande concerne un problème technique, merci de nous communiquer les détails du problème ainsi que, si possible, une capture d'écran ou toute information utile.

Nous vous remercions pour votre confiance.

L'équipe UNITECH
`.trim();
  }

  // ============================================================
  // ANALYSE DE LA RÉPONSE
  // ============================================================

  private analyzeResponse(content: string, email: EmailWithAnalysis): HarveyResponse {
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));
    const lower = content.toLowerCase();

    let tone: HarveyResponse['tone'] = this.config.defaultTone;

    if (lower.includes('merci') || lower.includes('bonjour') || lower.includes('cordialement')) {
      tone = 'professional';
    }
    if (lower.includes('technique') || lower.includes('solution') || lower.includes('code')) {
      tone = 'technical';
    }
    if (lower.includes(' :)') || lower.includes(';)')) {
      tone = 'friendly';
    }
    if (wordCount < 100) {
      tone = 'concise';
    }

    const actions: string[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const normalized = line.toLowerCase();
      if (
        normalized.includes('propose') ||
        normalized.includes('suggère') ||
        normalized.includes('suggere') ||
        normalized.includes('recommande') ||
        normalized.includes('merci de') ||
        normalized.includes('veuillez')
      ) {
        const action = line.trim().replace(/^[•\-*]\s*/, '');
        if (action.length > 10) {
          actions.push(action);
        }
      }
    }

    const requiresHumanReview =
      lower.includes('une personne') ||
      lower.includes('un humain') ||
      lower.includes('membre de notre équipe') ||
      lower.includes('équipe va examiner') ||
      lower.includes('équipe doit examiner') ||
      lower.includes('transférer') ||
      email.priority === 'high' ||
      wordCount > 500;

    let confidence = 70;

    if (email.ai_analysis?.confidence && email.ai_analysis.confidence > 60) {
      confidence += 15;
    }
    if (wordCount > 150) {
      confidence += 10;
    }
    if (content.split('\n\n').length > 2) {
      confidence += 5;
    }
    if (requiresHumanReview) {
      confidence = Math.min(confidence, 65);
    }
    confidence = Math.min(confidence, 100);

    let sentiment: HarveyResponse['metadata']['sentiment'] = 'neutral';

    if (
      lower.includes('ravi') ||
      lower.includes('plaisir') ||
      lower.includes('content') ||
      lower.includes('heureux')
    ) {
      sentiment = 'positive';
    }
    if (lower.includes('désolé') || lower.includes('désolée') || lower.includes('probleme') || lower.includes('problème')) {
      sentiment = 'negative';
    }

    let suggestedAgent: HarveyResponse['suggested_agent'] = 'HUMAN';
    const category = String(email.category || '').toLowerCase();

    if (category === 'support') {
      suggestedAgent = 'SUPPORT';
    } else if (category === 'commercial') {
      suggestedAgent = 'COMMERCIAL';
    } else if (category === 'project') {
      suggestedAgent = 'PROJET';
    } else if (confidence < this.config.minConfidence) {
      suggestedAgent = 'HUMAN';
    }

    return {
      content,
      tone,
      actions: actions.slice(0, 3),
      requires_human_review: requiresHumanReview && this.config.requireHumanReview,
      confidence,
      suggested_agent: suggestedAgent,
      metadata: {
        word_count: wordCount,
        reading_time: readingTime,
        sentiment,
      },
    };
  }

  // ============================================================
  // STOCKAGE DE LA RÉPONSE EMAIL
  // ============================================================

  private async storeResponse(
    emailId: string,
    response: HarveyResponse,
    email: EmailWithAnalysis
  ): Promise<any> {
    try {
      const insertData: any = {
        email_id: emailId,
        from_email: email.from_email,
        to_email: email.to_email || 'doumbialayesoma@gmail.com',
        subject: email.subject,
        message: email.body,
        body: email.body,
        agent_response: response.content,
        response_tone: response.tone,
        tone: response.tone,
        confidence: response.confidence,
        actions: response.actions,
        status: response.requires_human_review ? 'review' : 'pending',
        requires_human_review: response.requires_human_review,
        suggested_agent: response.suggested_agent,
        is_outgoing: true,
        category: email.category || 'information',
        source: 'email',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('email_conversations')
        .insert(insertData)
        .select();

      if (error) {
        console.error('❌ HARVEY: Erreur stockage:', error);
        return null;
      }

      // ✅ Ajouter à la mémoire locale
      this.processedEmails.add(emailId);

      console.log(`✅ HARVEY: Réponse stockée pour ${emailId}`);

      if (response.requires_human_review) {
        await this.createReviewNotification(emailId, response);
      }

      return data;
    } catch (error: any) {
      console.error('❌ HARVEY: Erreur stockage:', error?.message || error);
      return null;
    }
  }

  // ============================================================
  // STOCKER RÉPONSE CONTACT (SANS EMAIL_ID)
  // ============================================================

  private async storeContactResponse(
    contactId: string,
    response: HarveyResponse,
    contact: any
  ): Promise<any> {
    try {
      const insertData: any = {
        from_email: contact.email,
        to_email: 'doumbialayesoma@gmail.com',
        subject: contact.subject || 'Demande de contact',
        message: contact.message || '',
        body: contact.message || '',
        agent_response: response.content,
        response_tone: response.tone,
        tone: response.tone,
        confidence: response.confidence,
        actions: response.actions,
        status: response.requires_human_review ? 'review' : 'pending',
        requires_human_review: response.requires_human_review,
        suggested_agent: response.suggested_agent,
        is_outgoing: true,
        category: contact.category || 'information',
        source: 'contact',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log(`📝 Insertion contact dans email_conversations:`, {
        from_email: insertData.from_email,
        subject: insertData.subject,
        agent_response_length: insertData.agent_response?.length || 0,
        status: insertData.status
      });

      const { data, error } = await supabase
        .from('email_conversations')
        .insert(insertData)
        .select();

      if (error) {
        console.error('❌ HARVEY: Erreur stockage contact:', error);
        return null;
      }

      // ✅ Ajouter à la mémoire locale
      this.processedContacts.add(contact.email);

      // ✅ Mettre à jour le statut du contact
      await supabase
        .from('contacts')
        .update({
          status: response.requires_human_review ? 'review' : 'answered',
          assigned_agent: 'HARVEY',
          updated_at: new Date().toISOString(),
        })
        .eq('id', contactId);

      console.log(`✅ HARVEY: Réponse contact stockée pour ${contactId}`);
      return data;
    } catch (error: any) {
      console.error('❌ HARVEY: Erreur stockage contact:', error?.message || error);
      return null;
    }
  }

  // ============================================================
  // NOTIFICATION DE RELECTURE
  // ============================================================

  private async createReviewNotification(emailId: string, response: HarveyResponse): Promise<void> {
    try {
      const { error } = await supabase
        .from('review_notifications')
        .insert({
          email_id: emailId,
          message: `L'email ${emailId} nécessite une relecture humaine (confiance: ${response.confidence}%).`,
          status: 'pending',
          confidence: response.confidence,
          created_at: new Date().toISOString(),
        });

      if (error) {
        if (error.code === '42501') {
          console.log('⚠️ HARVEY: Notification ignorée à cause des règles RLS');
          return;
        }
        console.error('❌ HARVEY: Erreur notification:', error);
        return;
      }

      console.log(`📢 HARVEY: Notification créée pour ${emailId}`);
    } catch (error: any) {
      console.error('❌ HARVEY: Erreur notification:', error?.message || error);
    }
  }

  // ============================================================
  // GÉNÉRER UNE RÉPONSE POUR UN CONTACT
  // ============================================================

  async generateContactResponse(contact: any): Promise<HarveyResponse | null> {
    try {
      if (!this.initialized) {
        await this.init();
      }

      if (!this.companyData) {
        this.companyData = this.getDefaultCompanyData();
      }

      // ✅ VÉRIFICATION DES DOUBLONS
      if (await this.isContactAlreadyProcessed(contact.id, contact.email)) {
        console.log(`⚠️ HARVEY: Contact ${contact.id} déjà traité, ignoré`);
        
        await supabase
          .from('contacts')
          .update({
            status: 'duplicate',
            updated_at: new Date().toISOString(),
          })
          .eq('id', contact.id);
        
        return null;
      }

      // ✅ Vérifier si le contact n'a pas déjà un statut final
      if (contact.status === 'answered' || contact.status === 'review' || contact.status === 'duplicate') {
        console.log(`⚠️ HARVEY: Contact déjà traité (status: ${contact.status})`);
        return null;
      }

      console.log(`🦸‍♂️ HARVEY: Génération réponse contact ${contact.id}`);

      const emailData: EmailWithAnalysis = {
        id: contact.id,
        from_email: contact.email,
        to_email: 'doumbialayesoma@gmail.com',
        subject: contact.subject || 'Demande de contact',
        body: contact.message || '',
        category: contact.category || 'information',
        priority: contact.priority || 'medium',
        assigned_agent: contact.assigned_agent || 'HUMAN',
        ai_analysis: {
          category: contact.category || 'information',
          priority: contact.priority || 'medium',
          assigned_agent: contact.assigned_agent || 'HUMAN',
          confidence: 50,
          matched_keywords: [],
          summary: 'Demande de contact',
          score: 0.5,
        },
        received_at: contact.created_at || new Date().toISOString(),
        status: contact.status || 'pending',
      };

      const history = await this.getConversationHistory(contact.email);
      const prompt = this.buildPrompt(emailData, history, this.companyData);
      const responseContent = await this.callLLM(prompt);

      if (!responseContent) {
        console.error('❌ HARVEY: Aucune réponse générée');
        return null;
      }

      const analysis = this.analyzeResponse(responseContent, emailData);
      await this.storeContactResponse(contact.id, analysis, contact);

      console.log(`✅ HARVEY: Contact ${contact.id} traité (${analysis.confidence}% confiance)`);
      return analysis;
    } catch (error: any) {
      console.error('❌ HARVEY: Erreur contact:', error?.message || error);
      return null;
    }
  }

  // ============================================================
  // MÉTHODE PRINCIPALE - GÉNÉRER UNE RÉPONSE POUR UN EMAIL
  // ============================================================

  async generateResponse(emailId: string): Promise<HarveyResponse | null> {
    try {
      if (!this.initialized) {
        await this.init();
      }

      if (!this.companyData) {
        this.companyData = this.getDefaultCompanyData();
      }

      // ✅ VÉRIFICATION DES DOUBLONS
      if (await this.isEmailAlreadyProcessed(emailId)) {
        console.log(`⚠️ HARVEY: Email ${emailId} déjà traité, ignoré`);
        
        // Mettre à jour le statut pour éviter les boucles
        await supabase
          .from('incoming_emails')
          .update({
            status: 'duplicate',
            updated_at: new Date().toISOString(),
            processed_at: new Date().toISOString(),
          })
          .eq('id', emailId);
        
        return null;
      }

      console.log(`🦸‍♂️ HARVEY: Génération réponse email ${emailId}`);

      const { data: email, error: emailError } = await supabase
        .from('incoming_emails')
        .select('*')
        .eq('id', emailId)
        .single();

      if (emailError || !email) {
        console.error('❌ HARVEY: Email non trouvé:', emailError);
        return null;
      }

      // ✅ Si déjà traité en base, ignorer
      if (email.status === 'answered' || email.status === 'processed' || email.status === 'review') {
        console.log(`⚠️ HARVEY: Email déjà traité (status: ${email.status})`);
        return null;
      }

      const history = await this.getConversationHistory(email.from_email);
      const prompt = this.buildPrompt(email, history, this.companyData);
      const responseContent = await this.callLLM(prompt);

      if (!responseContent) {
        console.error('❌ HARVEY: Aucune réponse générée');
        return null;
      }

      const analysis = this.analyzeResponse(responseContent, email);
      
      // ✅ Stocker la réponse
      await this.storeResponse(emailId, analysis, email);

      // ✅ Mettre à jour le statut
      const newStatus = analysis.requires_human_review ? 'review' : 'answered';
      await supabase
        .from('incoming_emails')
        .update({
          status: newStatus,
          assigned_agent: 'HARVEY',
          updated_at: new Date().toISOString(),
          processed_at: new Date().toISOString(),
        })
        .eq('id', emailId);

      console.log(`✅ HARVEY: Email ${emailId} traité (${analysis.confidence}% confiance)`);
      return analysis;
    } catch (error: any) {
      console.error('❌ HARVEY: Erreur génération:', error?.message || error);
      return null;
    }
  }

  // ============================================================
  // TRAITEMENT DES EMAILS EN ATTENTE
  // ============================================================

  async processPendingEmails(
    limit: number = this.config.maxEmailsPerRun
  ): Promise<{ processed: number; errors: number }> {
    console.log(`🦸‍♂️ HARVEY: Traitement de ${limit} emails`);

    try {
      // ✅ Récupérer uniquement les emails en 'analyzed' (pas déjà traités)
      const { data, error } = await supabase
        .from('incoming_emails')
        .select('id')
        .eq('status', 'analyzed')
        .neq('category', 'spam')
        .neq('category', 'newsletter')
        .limit(limit);

      if (error) {
        console.error('❌ HARVEY: Erreur récupération emails:', error);
        return { processed: 0, errors: 1 };
      }

      if (!data || data.length === 0) {
        console.log('📭 HARVEY: Aucun email à traiter');
        return { processed: 0, errors: 0 };
      }

      console.log(`📧 HARVEY: ${data.length} emails trouvés`);

      let processed = 0;
      let errors = 0;

      for (const email of data) {
        try {
          // ✅ Vérifier que l'email n'est pas déjà dans processedEmails
          if (this.processedEmails.has(email.id)) {
            console.log(`⚠️ HARVEY: Email ${email.id} déjà traité (skip)`);
            continue;
          }

          const response = await this.generateResponse(email.id);
          if (response) {
            processed++;
            console.log(`✅ HARVEY: Email ${email.id} traité`);
          } else {
            errors++;
            console.log(`❌ HARVEY: Échec email ${email.id}`);
          }
        } catch (error: any) {
          errors++;
          console.error(`❌ HARVEY: Erreur email ${email.id}:`, error?.message || error);
        }
      }

      console.log(`📊 HARVEY: ${processed} traités, ${errors} erreurs`);
      return { processed, errors };
    } catch (error: any) {
      console.error('❌ HARVEY: Erreur fatale:', error?.message || error);
      return { processed: 0, errors: 1 };
    }
  }

  // ============================================================
  // TRAITEMENT DES CONTACTS EN ATTENTE
  // ============================================================

  async processPendingContacts(
    limit: number = this.config.maxEmailsPerRun
  ): Promise<{ processed: number; errors: number }> {
    console.log(`🦸‍♂️ HARVEY: Traitement de ${limit} contacts`);

    try {
      // ✅ Récupérer uniquement les contacts en 'analyzed' (pas déjà traités)
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('status', 'analyzed')
        .limit(limit);

      if (error) {
        console.error('❌ HARVEY: Erreur récupération contacts:', error);
        return { processed: 0, errors: 1 };
      }

      if (!data || data.length === 0) {
        console.log('📭 HARVEY: Aucun contact à traiter');
        return { processed: 0, errors: 0 };
      }

      console.log(`📋 HARVEY: ${data.length} contacts trouvés`);

      let processed = 0;
      let errors = 0;

      for (const contact of data) {
        try {
          // ✅ Vérifier que le contact n'est pas déjà traité
          if (this.processedContacts.has(contact.email)) {
            console.log(`⚠️ HARVEY: Contact ${contact.id} déjà traité (skip)`);
            continue;
          }

          const response = await this.generateContactResponse(contact);
          if (response) {
            processed++;
            console.log(`✅ HARVEY: Contact ${contact.id} traité`);
          } else {
            errors++;
            console.log(`❌ HARVEY: Échec contact ${contact.id}`);
          }
        } catch (error: any) {
          errors++;
          console.error(`❌ HARVEY: Erreur contact ${contact.id}:`, error?.message || error);
        }
      }

      console.log(`📊 HARVEY: ${processed} contacts traités, ${errors} erreurs`);
      return { processed, errors };
    } catch (error: any) {
      console.error('❌ HARVEY: Erreur fatale contacts:', error?.message || error);
      return { processed: 0, errors: 1 };
    }
  }

  // ============================================================
  // NETTOYAGE DES DOUBLONS
  // ============================================================

  async cleanupDuplicates(): Promise<{
    cleaned: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let cleaned = 0;

    try {
      console.log('🧹 HARVEY: Nettoyage des doublons...');

      // ✅ Trouver les emails en 'analyzed' qui ont déjà une réponse
      const { data: emails, error } = await supabase
        .from('incoming_emails')
        .select('id, from_email, subject, status')
        .eq('status', 'analyzed');

      if (error) {
        throw new Error(`Erreur récupération: ${error.message}`);
      }

      if (!emails || emails.length === 0) {
        console.log('📭 HARVEY: Aucun email à nettoyer');
        return { cleaned: 0, errors: [] };
      }

      for (const email of emails) {
        // ✅ Vérifier si une réponse existe déjà
        const { data: existing, error: checkError } = await supabase
          .from('email_conversations')
          .select('id')
          .eq('email_id', email.id)
          .limit(1)
          .maybeSingle();

        if (checkError) {
          errors.push(`Erreur vérification ${email.id}: ${checkError.message}`);
          continue;
        }

        if (existing) {
          // ✅ Marquer comme duplicate
          const { error: updateError } = await supabase
            .from('incoming_emails')
            .update({
              status: 'duplicate',
              updated_at: new Date().toISOString(),
              processed_at: new Date().toISOString(),
            })
            .eq('id', email.id);

          if (updateError) {
            errors.push(`Erreur mise à jour ${email.id}: ${updateError.message}`);
          } else {
            cleaned++;
            console.log(`🧹 HARVEY: Email ${email.id} marqué comme duplicate`);
          }
        }
      }

      console.log(`✅ HARVEY: ${cleaned} doublons nettoyés`);
      return { cleaned, errors };

    } catch (error: any) {
      console.error('❌ HARVEY: Erreur cleanupDuplicates:', error.message);
      return { cleaned: 0, errors: [error.message] };
    }
  }

  // ============================================================
  // RÉINITIALISATION DU CACHE
  // ============================================================

  async refreshCache(): Promise<void> {
    console.log('🔄 HARVEY: Rafraîchissement du cache...');
    this.processedEmails.clear();
    this.processedContacts.clear();
    await this.loadProcessedEmails();
    await this.loadProcessedContacts();
    console.log('✅ HARVEY: Cache rafraîchi');
  }

  // ============================================================
  // STATUTS
  // ============================================================

  getStatus(): {
    initialized: boolean;
    processedEmails: number;
    processedContacts: number;
    knowledgeBase: number;
    templates: number;
    config: HarveyConfig;
  } {
    return {
      initialized: this.initialized,
      processedEmails: this.processedEmails.size,
      processedContacts: this.processedContacts.size,
      knowledgeBase: this.knowledgeBase.length,
      templates: this.templates.length,
      config: this.config,
    };
  }

  // ============================================================
  // CONFIGURATION
  // ============================================================

  updateConfig(config: Partial<HarveyConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('⚙️ HARVEY: Configuration mise à jour');
  }

  getConfig(): HarveyConfig {
    return { ...this.config };
  }
}

// ============================================================
// INSTANCE HARVEY
// ============================================================

export const harvey = new Harvey();