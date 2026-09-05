// lib/agents/harvey-v2/HarveyV2.ts
// Harvey V2 - Service d'automatisation des emails client-specific

import { supabase } from '@/lib/supabase';
import { keyManagement } from '@/lib/services/KeyManagementService';
import { generateWithFallback } from '@/lib/config/llm';
import { generateEmailHtml } from './templates';
import {
  EmailRequest,
  EmailResponse,
  BatchEmailRequest,
  BatchEmailResponse,
  HarveyV2Config,
  CompanyData,
  EmailCategory,
  EmailPriority,
  EmailTone,
  AgentType,
  ErrorCode,
  WebhookPayload
} from './types';

// Configuration par défaut
const DEFAULT_CONFIG: HarveyV2Config = {
  maxEmailsPerRun: 50,
  minConfidence: 60,
  requireHumanReview: true,
  defaultTone: 'professional',
  temperature: 0.7,
  maxTokens: 1000,
  enableAutoReply: true,
  enableClassification: true,
  enableSentimentAnalysis: true,
  enableSpamDetection: true,
  enableWebhooks: true,
  maxRetries: 3,
  timeout: 30000,
  rateLimitPerMinute: 100,
  maxBatchSize: 50,
  requireApiKey: true,
  companyName: 'UNITECH',
  companyDescription: 'Solutions technologiques innovantes',
  signature: "L'équipe UNITECH",
  responseLanguage: 'auto',
  brandingEnabled: true,
  websiteUrl: 'https://unitech-qvgo.onrender.com',
  contactUrl: 'https://unitech-qvgo.onrender.com/contact',
  cacheEnabled: true,
  cacheTTL: 3600,
  debugMode: false,
  logLevel: 'info'
};

export class HarveyV2 {
  private config: HarveyV2Config;
  private initialized: boolean = false;
  private processedEmails: Set<string> = new Set();
  private metrics: {
    totalProcessed: number;
    totalErrors: number;
    totalConfidence: number;
    averageConfidence: number;
    lastProcessedAt: string | null;
    requestCount: number;
    rateLimitReset: number;
  } = {
    totalProcessed: 0,
    totalErrors: 0,
    totalConfidence: 0,
    averageConfidence: 0,
    lastProcessedAt: null,
    requestCount: 0,
    rateLimitReset: Date.now() + 60000
  };
  private isProcessing: boolean = false;
  private webhookHandlers: Array<(payload: WebhookPayload) => Promise<void>> = [];

  constructor(config: Partial<HarveyV2Config> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    console.log(`🦸‍♂️ Harvey V2: Initialisé pour le service client`);
  }

  // ============================================================
  // INITIALISATION
  // ============================================================

  async init(): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.initialized) return { success: true };
      
      console.log('🦸‍♂️ Harvey V2: Chargement des données...');
      await this.loadProcessedEmails();
      
      this.initialized = true;
      console.log('✅ Harvey V2: Prêt pour le service client');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Harvey V2: Erreur initialisation:', error.message);
      return { success: false, error: error.message };
    }
  }

  // ============================================================
  // API PRINCIPALE - TRAITER LES EMAILS D'UN CLIENT
  // ============================================================

  /**
   * Traite les emails pour un client spécifique en utilisant sa configuration
   */
  async processClientEmails(
    clientId: string,
    options?: {
      limit?: number;
      syncNew?: boolean;
    }
  ): Promise<{
    success: boolean;
    processed: number;
    errors: number;
    responses: EmailResponse[];
  }> {
    try {
      console.log(`🦸‍♂️ Harvey V2: Traitement des emails du client ${clientId}`);

      // 1. Récupérer la configuration du client
      const clientConfig = await this.getClientConfig(clientId);
      if (!clientConfig) {
        return {
          success: false,
          processed: 0,
          errors: 1,
          responses: []
        };
      }

      // 2. Récupérer les emails non traités du client
      const emails = await this.getClientEmails(clientId, options?.limit || 50);
      
      if (emails.length === 0) {
        console.log(`📭 Harvey V2: Aucun email à traiter pour le client ${clientId}`);
        return {
          success: true,
          processed: 0,
          errors: 0,
          responses: []
        };
      }

      console.log(`📧 Harvey V2: ${emails.length} emails à traiter pour ${clientConfig.email}`);

      // 3. Traiter chaque email avec la configuration du client
      const responses: EmailResponse[] = [];
      let processed = 0;
      let errors = 0;

      for (const email of emails) {
        try {
          // Vérifier si l'email a déjà été traité
          if (this.processedEmails.has(email.id)) {
            console.log(`⚠️ Email ${email.id} déjà traité, ignoré`);
            continue;
          }

          // Traiter l'email avec la configuration du client
          const response = await this.processEmailWithClientConfig(email, clientConfig);
          
          if (response.success) {
            processed++;
            // Marquer l'email comme traité
            await this.markEmailAsProcessed(email.id, response);
          } else {
            errors++;
          }
          
          responses.push(response);
          
        } catch (error: any) {
          errors++;
          console.error(`❌ Erreur email ${email.id}:`, error.message);
          responses.push({
            success: false,
            error: error.message,
            code: 'PROCESS_ERROR'
          });
        }
      }

      console.log(`✅ Harvey V2: ${processed} emails traités, ${errors} erreurs`);

      return {
        success: true,
        processed,
        errors,
        responses
      };

    } catch (error: any) {
      console.error('❌ Harvey V2: Erreur traitement client:', error.message);
      return {
        success: false,
        processed: 0,
        errors: 1,
        responses: []
      };
    }
  }

  // ============================================================
  // GÉNÉRER UNE RÉPONSE RAPIDE (SANS STOCKAGE)
  // ============================================================

  /**
   * Génère une réponse rapide sans stockage (pour aperçu)
   */
  async generateReply(request: EmailRequest): Promise<{
    success: boolean;
    response?: string;
    tone?: EmailTone;
    confidence?: number;
    error?: string;
  }> {
    try {
      // 1. Initialisation
      if (!this.initialized) {
        await this.init();
      }

      // 2. Validation
      const validation = this.validateRequest(request);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // 3. Classification
      const classification = await this.classifyEmail(request);
      
      // 4. Analyse de sentiment
      const sentiment = this.analyzeSentiment(request.body);

      // 5. Construction des données
      const emailData = {
        id: request.id || `temp_${Date.now()}`,
        from_email: request.from_email,
        from_name: request.from_name || request.from_email.split('@')[0],
        to_email: Array.isArray(request.to_email) ? request.to_email : [request.to_email],
        subject: request.subject || 'Sans sujet',
        body: request.body,
        body_html: request.body_html || '',
        category: request.category || 'general',
        priority: request.priority || 'normal',
        status: 'processing',
        received_at: request.received_at || new Date().toISOString(),
        attachments: request.attachments || [],
        ai_analysis: {
          category: classification.category,
          priority: classification.priority,
          confidence: classification.confidence,
          matched_keywords: classification.keywords || [],
          summary: classification.summary || '',
          score: classification.score || 0.5,
          sentiment: sentiment.sentiment,
          sentiment_score: sentiment.score
        }
      };

      // 6. Générer la réponse
      const responseContent = await this.generateClientResponse(emailData, {
        prompt_config: {
          instructions: '',
          tone: 'professional',
          signature: this.config.signature,
          custom_rules: []
        },
        company_name: this.config.companyName,
        email: 'contact@unitech.com'
      });

      if (!responseContent) {
        return { success: false, error: 'Échec de génération' };
      }

      // 7. Analyser la réponse
      const analysis = this.analyzeResponse(responseContent, emailData);

      return {
        success: true,
        response: analysis.content,
        tone: analysis.tone,
        confidence: analysis.confidence
      };

    } catch (error: any) {
      console.error('❌ Erreur generateReply:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================================
  // TRAITER UN EMAIL AVEC LA CONFIGURATION DU CLIENT
  // ============================================================

  private async processEmailWithClientConfig(
    email: any,
    clientConfig: any
  ): Promise<EmailResponse> {
    try {
      console.log(`📧 Traitement email: ${email.subject} pour ${clientConfig.email}`);

      // 1. Construire la requête email
      const request: EmailRequest = {
        id: email.id,
        from_email: email.from_email,
        from_name: email.from_name || email.from_email.split('@')[0],
        to_email: email.to_email || clientConfig.email,
        subject: email.subject || 'Sans sujet',
        body: email.body || email.body_text || '',
        body_html: email.body_html || '',
        category: email.category || 'general',
        priority: email.priority || 'normal',
        client_id: clientConfig.client_id,
        received_at: email.received_at || email.created_at || new Date().toISOString(),
        attachments: email.attachments || [],
        metadata: {
          mail_account_id: clientConfig.id,
          account_email: clientConfig.email
        }
      };

      // 2. Vérifier si l'email est déjà traité
      if (this.processedEmails.has(request.id || '')) {
        return {
          success: false,
          error: 'Email déjà traité',
          code: 'DUPLICATE'
        };
      }

      // 3. Classification avec la configuration du client
      const classification = await this.classifyEmailWithClientConfig(request, clientConfig);

      // 4. Analyse de sentiment
      const sentiment = this.analyzeSentiment(request.body);

      // 5. Construction des données de l'email
      const emailData = {
        id: request.id || `temp_${Date.now()}`,
        from_email: request.from_email,
        from_name: request.from_name,
        to_email: request.to_email,
        subject: request.subject,
        body: request.body,
        body_html: request.body_html || '',
        category: classification.category,
        priority: classification.priority,
        status: 'processing',
        received_at: request.received_at || new Date().toISOString(),
        attachments: request.attachments || [],
        ai_analysis: {
          category: classification.category,
          priority: classification.priority,
          confidence: classification.confidence,
          matched_keywords: classification.keywords || [],
          summary: classification.summary || '',
          score: classification.score || 0.5,
          sentiment: sentiment.sentiment,
          sentiment_score: sentiment.score
        }
      };

      // 6. Générer la réponse avec la configuration du client
      const responseContent = await this.generateClientResponse(emailData, clientConfig);

      if (!responseContent) {
        return {
          success: false,
          error: 'Échec de génération de réponse',
          code: 'GENERATION_ERROR'
        };
      }

      // 7. Analyser la réponse
      const analysis = this.analyzeResponse(responseContent, emailData);

      // 8. Générer le HTML avec le branding du client
      const htmlResponse = await this.generateClientHtmlResponse(analysis, emailData, clientConfig);

      // 9. Stocker la réponse
      const stored = await this.storeClientResponse(
        email.id,
        analysis,
        emailData,
        clientConfig,
        htmlResponse
      );

      if (!stored) {
        return {
          success: false,
          error: 'Échec du stockage',
          code: 'STORAGE_ERROR'
        };
      }

      // 10. Mettre à jour l'email source
      await this.updateEmailStatus(email.id, {
        status: analysis.requires_human_review ? 'review' : 'response_ready',
        assigned_agent: analysis.suggested_agent || 'HARVEY',
        harvey_response: analysis.content,
        harvey_response_html: htmlResponse,
        harvey_confidence: analysis.confidence,
        harvey_tone: analysis.tone,
        harvey_actions: analysis.actions || [],
        processed_at: new Date().toISOString()
      });

      // 11. Mettre à jour les métriques
      this.metrics.totalProcessed++;
      this.metrics.totalConfidence += analysis.confidence;
      this.metrics.averageConfidence = this.metrics.totalConfidence / this.metrics.totalProcessed;
      this.metrics.lastProcessedAt = new Date().toISOString();

      console.log(`✅ Email traité avec ${analysis.confidence}% de confiance`);

      return {
        success: true,
        data: {
          id: stored?.id || `resp_${Date.now()}`,
          email_id: email.id,
          conversation_id: stored?.id || `conv_${Date.now()}`,
          response: analysis.content,
          response_html: htmlResponse,
          tone: analysis.tone,
          confidence: analysis.confidence,
          actions: analysis.actions || [],
          requires_human_review: analysis.requires_human_review,
          suggested_agent: analysis.suggested_agent || 'HUMAN',
          metadata: {
            word_count: analysis.metadata?.word_count || 0,
            reading_time: analysis.metadata?.reading_time || 0,
            sentiment: analysis.metadata?.sentiment || 'neutral',
            processing_time_ms: Date.now() - new Date(email.received_at || Date.now()).getTime()
          }
        }
      };

    } catch (error: any) {
      console.error('❌ Erreur processEmailWithClientConfig:', error.message);
      return {
        success: false,
        error: error.message || 'Erreur interne',
        code: 'PROCESS_ERROR'
      };
    }
  }

  // ============================================================
  // RÉCUPÉRATION DE LA CONFIGURATION DU CLIENT
  // ============================================================

  private async getClientConfig(clientId: string): Promise<any> {
    try {
      const { data: mailAccount, error: mailError } = await supabase
        .from('mail_accounts')
        .select(`
          *,
          clients!inner (
            id,
            email,
            first_name,
            last_name,
            company_name,
            subscription_plan
          )
        `)
        .eq('client_id', clientId)
        .eq('is_active', true)
        .single();

      if (mailError || !mailAccount) {
        console.error('❌ Aucun compte mail configuré pour le client:', mailError);
        return null;
      }

      const config = {
        ...mailAccount,
        prompt_config: mailAccount.prompt_config || {
          instructions: '',
          tone: 'professional',
          signature: mailAccount.clients?.company_name 
            ? `L'équipe ${mailAccount.clients.company_name}` 
            : "L'équipe UNITECH",
          custom_rules: []
        },
        client_name: mailAccount.clients?.first_name || '',
        client_email: mailAccount.clients?.email || '',
        company_name: mailAccount.clients?.company_name || 'UNITECH',
        subscription_plan: mailAccount.clients?.subscription_plan || 'free'
      };

      console.log(`📋 Configuration client chargée: ${config.company_name || config.email}`);
      return config;

    } catch (error) {
      console.error('❌ Erreur getClientConfig:', error);
      return null;
    }
  }

  // ============================================================
  // RÉCUPÉRATION DES EMAILS DU CLIENT
  // ============================================================

  private async getClientEmails(clientId: string, limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('emails')
        .select('*')
        .eq('client_id', clientId)
        .in('status', ['pending', 'analyzed'])
        .order('received_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('❌ Erreur récupération emails:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Erreur getClientEmails:', error);
      return [];
    }
  }

  // ============================================================
  // CLASSIFICATION AVEC CONFIGURATION CLIENT
  // ============================================================

  private async classifyEmailWithClientConfig(
    request: EmailRequest,
    clientConfig: any
  ): Promise<{
    category: EmailCategory;
    priority: EmailPriority;
    confidence: number;
    keywords: string[];
    summary: string;
    score: number;
  }> {
    const content = `${request.subject || ''} ${request.body}`.toLowerCase();

    const customRules = clientConfig.prompt_config?.custom_rules || [];
    const customKeywords: string[] = [];

    for (const rule of customRules) {
      if (typeof rule === 'string') {
        const words = rule.toLowerCase().split(/\s+/);
        customKeywords.push(...words.filter(w => w.length > 4));
      }
    }

    const categories: Record<EmailCategory, { keywords: string[]; priority: EmailPriority }> = {
      support: {
        keywords: ['aide', 'probleme', 'problème', 'assistance', 'bug', 'erreur', 'panne', 'incident', 'support', 'dysfonctionnement', ...customKeywords],
        priority: 'high'
      },
      commercial: {
        keywords: ['devis', 'prix', 'tarif', 'achat', 'commande', 'proposition', 'offre', 'commercial', 'vente', 'abonnement'],
        priority: 'normal'
      },
      project: {
        keywords: ['projet', 'mission', 'développement', 'livraison', 'phase', 'planification', 'objectif', 'deadline'],
        priority: 'normal'
      },
      urgent: {
        keywords: ['urgent', 'immediat', 'immediate', 'urgence', 'critique', 'vite', 'rapide', 'important'],
        priority: 'urgent'
      },
      technical: {
        keywords: ['technique', 'code', 'logiciel', 'programme', 'installation', 'configuration', 'api', 'intégration'],
        priority: 'normal'
      },
      billing: {
        keywords: ['facture', 'paiement', 'transaction', 'abonnement', 'tarif', 'crédit', 'débit', 'prélèvement'],
        priority: 'normal'
      },
      newsletter: {
        keywords: ['newsletter', 'inscription', 'désabonner', 'unsubscribe', 'information', 'actualité'],
        priority: 'low'
      },
      information: {
        keywords: ['information', 'renseignement', 'question', 'demande', 'savoir', 'connaître'],
        priority: 'normal'
      },
      general: {
        keywords: ['bonjour', 'contact', 'message', 'merci', 'cordialement'],
        priority: 'normal'
      },
      spam: {
        keywords: ['spam', 'viagra', 'casino', 'gagnez', 'million', 'crypto', 'bitcoin'],
        priority: 'low'
      }
    };

    let bestCategory: EmailCategory = 'general';
    let bestScore = 0;
    let detectedPriority: EmailPriority = 'normal';

    for (const [category, data] of Object.entries(categories)) {
      let score = 0;
      for (const keyword of data.keywords) {
        if (content.includes(keyword)) {
          score += 1;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category as EmailCategory;
        detectedPriority = data.priority;
      }
    }

    if (bestScore === 0) {
      bestCategory = 'general';
      detectedPriority = 'normal';
    }

    const confidence = Math.min(60 + (bestScore * 5), 95);
    const keywords = content.split(/\s+/)
      .filter(word => word.length > 4)
      .slice(0, 10);

    const summary = request.body.substring(0, 200) + (request.body.length > 200 ? '...' : '');

    return {
      category: bestCategory,
      priority: detectedPriority,
      confidence,
      keywords,
      summary,
      score: confidence / 100
    };
  }

  // ============================================================
  // CLASSIFICATION DE BASE
  // ============================================================

  private async classifyEmail(request: EmailRequest): Promise<{
    category: EmailCategory;
    priority: EmailPriority;
    confidence: number;
    keywords: string[];
    summary: string;
    score: number;
  }> {
    return this.classifyEmailWithClientConfig(request, {
      prompt_config: { custom_rules: [] }
    });
  }

  // ============================================================
  // GÉNÉRATION DE RÉPONSE AVEC CONFIGURATION CLIENT
  // ============================================================

  private async generateClientResponse(emailData: any, clientConfig: any): Promise<string> {
    try {
      const promptConfig = clientConfig.prompt_config || {
        instructions: '',
        tone: 'professional',
        signature: `L'équipe ${clientConfig.company_name || 'UNITECH'}`,
        custom_rules: []
      };

      const history = await this.getClientConversationHistory(
        clientConfig.client_id,
        emailData.from_email,
        5
      );

      const prompt = this.buildClientPrompt(emailData, clientConfig, promptConfig, history);

      const result = await generateWithFallback({
        messages: [
          {
            role: 'system',
            content: this.getClientSystemPrompt(clientConfig, promptConfig)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      });

      return result.content;

    } catch (error) {
      console.error('❌ Erreur generateClientResponse:', error);
      return this.getClientFallbackResponse(emailData, clientConfig);
    }
  }

  // ============================================================
  // SYSTEM PROMPT PERSONNALISÉ POUR LE CLIENT
  // ============================================================

  private getClientSystemPrompt(clientConfig: any, promptConfig: any): string {
    const companyName = clientConfig.company_name || 'UNITECH';
    const signature = promptConfig.signature || `L'équipe ${companyName}`;
    const instructions = promptConfig.instructions || '';
    const tone = promptConfig.tone || 'professional';
    const customRules = promptConfig.custom_rules || [];

    let prompt = `Tu es un consultant professionnel pour ${companyName}.

## IDENTITÉ
- Tu es un **consultant humain de ${companyName}**
- Tu N'ES PAS une IA, un assistant, un chatbot ou HARVEY
- Tu ne parles JAMAIS de toi en tant qu'IA

## STYLE DE COMMUNICATION
- Ton de réponse: ${tone}
- Réponds avec assurance comme un expert
- Sois concis mais complet
- Utilise un ton professionnel et courtois

## RÈGLES SPÉCIFIQUES
1. Sois professionnel, direct et confiant
2. Réponds dans la même langue que le client
3. **Ne mentionne JAMAIS que tu es une IA, un assistant ou HARVEY**
4. **Signe uniquement par : ${signature}**
5. Suis les instructions suivantes: ${instructions || 'Aucune instruction spécifique'}`;

    if (customRules && customRules.length > 0) {
      prompt += `\n\n## RÈGLES PERSONNALISÉES\n`;
      for (const rule of customRules) {
        prompt += `- ${rule}\n`;
      }
    }

    prompt += `\n\n## SPECIALITÉS DE ${companyName}
- Solutions SaaS
- Éducation
- Commerce local
- Domotique
- Gestion d'entreprise

Signature : ${signature}`;

    return prompt;
  }

  // ============================================================
  // BUILD PROMPT CLIENT
  // ============================================================

  private buildClientPrompt(
    emailData: any,
    clientConfig: any,
    promptConfig: any,
    history: any[]
  ): string {
    const safeBody = emailData.body?.substring(0, 3000) || '';
    const companyName = clientConfig.company_name || 'UNITECH';

    let prompt = `
## EMAIL DU CLIENT

De : ${emailData.from_email}
Nom : ${emailData.from_name || 'Client'}
Sujet : ${emailData.subject}
Catégorie : ${emailData.category}
Priorité : ${emailData.priority}

Message :
${safeBody}

## ANALYSE
Confiance : ${emailData.ai_analysis?.confidence || 0}%
Mots-clés : ${emailData.ai_analysis?.matched_keywords?.join(', ') || 'Aucun'}
Sentiment : ${emailData.ai_analysis?.sentiment || 'neutral'}

## INSTRUCTIONS PERSONNALISÉES
${promptConfig.instructions || 'Aucune instruction spécifique'}`;

    if (history && history.length > 0) {
      prompt += `

## HISTORIQUE RÉCENT
${history.slice(0, 3).map((conv: any, index: number) => `
### Conversation ${index + 1}
Sujet : ${conv.subject}
Message : ${conv.message?.substring(0, 300) || ''}
Réponse : ${conv.agent_response?.substring(0, 300) || ''}
`).join('')}`;
    }

    prompt += `

## INSTRUCTION FINALE
Rédige une réponse professionnelle pour ce client de ${companyName}.

La réponse doit être directe, professionnelle et utile.

**Ne mets pas :**
- "Réponse proposée"
- "Voici une réponse"
- "En tant qu'IA"
- une explication de ton raisonnement

**Donne directement le texte de l'email.**

Signature : ${promptConfig.signature || `L'équipe ${companyName}`}`;

    return prompt;
  }

  // ============================================================
  // RÉPONSE DE SECOURS CLIENT
  // ============================================================

  private getClientFallbackResponse(emailData: any, clientConfig: any): string {
    const name = emailData.from_name || emailData.from_email.split('@')[0] || 'Client';
    const signature = clientConfig.prompt_config?.signature || `L'équipe ${clientConfig.company_name || 'UNITECH'}`;
    const companyName = clientConfig.company_name || 'UNITECH';

    return `
Bonjour ${name},

Merci pour votre message. Nous avons bien reçu votre demande concernant "${emailData.subject || 'votre demande'}".

Notre équipe examine actuellement votre demande afin de vous apporter une réponse précise et adaptée à vos besoins.

Nous reviendrons vers vous dans les plus brefs délais.

${signature}
`.trim();
  }

  // ============================================================
  // GÉNÉRATION HTML AVEC BRANDING CLIENT
  // ============================================================

  private async generateClientHtmlResponse(
    analysis: any,
    emailData: any,
    clientConfig: any
  ): Promise<string> {
    try {
      const companyName = clientConfig.company_name || 'UNITECH';
      const signature = clientConfig.prompt_config?.signature || `L'équipe ${companyName}`;

      return generateEmailHtml({
        companyName: companyName,
        userName: emailData.from_name || emailData.from_email.split('@')[0] || 'Client',
        userEmail: emailData.from_email,
        subject: emailData.subject || 'Message',
        message: analysis.content,
        category: emailData.category || 'information',
        signature: signature,
        logoUrl: null,
        websiteUrl: this.config.websiteUrl,
        contactUrl: this.config.contactUrl,
        actions: analysis.actions
      });
    } catch (error) {
      console.error('❌ Erreur generation HTML:', error);
      return analysis.content;
    }
  }

  // ============================================================
  // HISTORIQUE DES CONVERSATIONS CLIENT
  // ============================================================

  private async getClientConversationHistory(
    clientId: string,
    fromEmail: string,
    limit: number = 5
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('email_conversations')
        .select('*')
        .eq('client_id', clientId)
        .eq('from_email', fromEmail)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) return [];
      return data || [];
    } catch (error) {
      return [];
    }
  }

  // ============================================================
  // STOCKAGE DE LA RÉPONSE CLIENT
  // ============================================================

  private async storeClientResponse(
    emailId: string,
    analysis: any,
    emailData: any,
    clientConfig: any,
    htmlResponse?: string
  ): Promise<any> {
    try {
      const insertData = {
        email_id: emailId,
        client_id: clientConfig.client_id,
        mail_account_id: clientConfig.id,
        from_email: emailData.from_email || '',
        to_email: Array.isArray(emailData.to_email) ? emailData.to_email.join(', ') : emailData.to_email || clientConfig.email,
        subject: emailData.subject || '',
        message: emailData.body || '',
        body: emailData.body || '',
        agent_response: analysis.content,
        agent_response_html: htmlResponse || null,
        response_tone: analysis.tone,
        confidence: analysis.confidence,
        actions: analysis.actions || [],
        status: analysis.requires_human_review ? 'review' : 'response_ready',
        requires_human_review: analysis.requires_human_review,
        suggested_agent: analysis.suggested_agent,
        category: emailData.category || 'information',
        is_outgoing: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('email_conversations')
        .insert(insertData)
        .select();

      if (error) {
        console.error('❌ Erreur stockage:', error);
        return null;
      }

      this.processedEmails.add(emailId);
      return data?.[0] || null;
    } catch (error) {
      console.error('❌ Erreur storeClientResponse:', error);
      return null;
    }
  }

  // ============================================================
  // MISE À JOUR DU STATUT DE L'EMAIL
  // ============================================================

  private async updateEmailStatus(emailId: string, updates: any): Promise<void> {
    try {
      await supabase
        .from('emails')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', emailId);
    } catch (error) {
      console.error('❌ Erreur updateEmailStatus:', error);
    }
  }

  // ============================================================
  // MARQUER L'EMAIL COMME TRAITÉ
  // ============================================================

  private async markEmailAsProcessed(emailId: string, response: EmailResponse): Promise<void> {
    try {
      this.processedEmails.add(emailId);
      
      await supabase
        .from('emails')
        .update({
          status: response.data?.requires_human_review ? 'review' : 'response_ready',
          harvey_response: response.data?.response || null,
          harvey_response_html: response.data?.response_html || null,
          harvey_confidence: response.data?.confidence || 0,
          harvey_tone: response.data?.tone || 'professional',
          harvey_actions: response.data?.actions || [],
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', emailId);

      console.log(`✅ Email ${emailId} marqué comme traité`);
    } catch (error) {
      console.error('❌ Erreur markEmailAsProcessed:', error);
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
        .not('email_id', 'is', null)
        .limit(1000);

      if (error) return;

      data?.forEach((item: any) => {
        if (item.email_id) {
          this.processedEmails.add(item.email_id);
        }
      });
    } catch (error) {
      // Silently fail
    }
  }

  // ============================================================
  // VALIDATION
  // ============================================================

  private validateRequest(request: EmailRequest): { valid: boolean; error?: string } {
    if (!request.from_email) {
      return { valid: false, error: 'Email expéditeur requis' };
    }
    if (!request.to_email) {
      return { valid: false, error: 'Email destinataire requis' };
    }
    if (!request.body || request.body.length < 3) {
      return { valid: false, error: 'Contenu de l\'email trop court' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.from_email)) {
      return { valid: false, error: 'Format email expéditeur invalide' };
    }

    if (request.body.length > 10000) {
      return { valid: false, error: 'Contenu trop long (max 10000 caractères)' };
    }

    return { valid: true };
  }

  // ============================================================
  // ANALYSE DE SENTIMENT
  // ============================================================

  private analyzeSentiment(text: string): { sentiment: 'positive' | 'neutral' | 'negative'; score: number } {
    const lower = text.toLowerCase();
    
    const positiveWords = [
      'bonjour', 'merci', 'bravo', 'excellent', 'super', 'content', 'heureux', 'ravi',
      'agréable', 'intéressé', 'bien', 'parfait', 'satisfait', 'plaisir', 'apprécier'
    ];
    const negativeWords = [
      'probleme', 'problème', 'erreur', 'panne', 'dommage', 'déçu', 'insatisfait',
      'inefficace', 'lent', 'bug', 'crash', 'perte', 'attente', 'retard', 'mauvais'
    ];

    let positiveScore = 0;
    let negativeScore = 0;

    for (const word of positiveWords) {
      if (lower.includes(word)) positiveScore++;
    }
    for (const word of negativeWords) {
      if (lower.includes(word)) negativeScore++;
    }

    const total = positiveScore + negativeScore;
    if (total === 0) return { sentiment: 'neutral', score: 0.5 };

    const score = positiveScore / total;
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';

    if (score > 0.6) sentiment = 'positive';
    else if (score < 0.4) sentiment = 'negative';

    return { sentiment, score };
  }

  // ============================================================
  // ANALYSE DE RÉPONSE
  // ============================================================

  private analyzeResponse(content: string, emailData: any) {
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));
    const lower = content.toLowerCase();

    let tone: EmailTone = this.config.defaultTone;

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
        normalized.includes('recommande') ||
        normalized.includes('merci de') ||
        normalized.includes('veuillez') ||
        normalized.includes('n\'hésitez pas') ||
        normalized.includes('contactez')
      ) {
        const action = line.trim().replace(/^[•\-*]\s*/, '');
        if (action.length > 10 && action.length < 200) {
          actions.push(action);
        }
      }
    }

    const requiresHumanReview =
      lower.includes('une personne') ||
      lower.includes('un humain') ||
      lower.includes('membre de notre équipe') ||
      lower.includes('transférer') ||
      emailData.priority === 'urgent' ||
      wordCount > 500;

    let confidence = 70;
    if (emailData.ai_analysis?.confidence && emailData.ai_analysis.confidence > 60) {
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

    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (lower.includes('ravi') || lower.includes('plaisir') || lower.includes('content') || lower.includes('heureux')) {
      sentiment = 'positive';
    }
    if (lower.includes('désolé') || lower.includes('probleme') || lower.includes('problème')) {
      sentiment = 'negative';
    }

    let suggestedAgent: AgentType = 'HUMAN';
    const category = String(emailData.category || '').toLowerCase();

    if (category === 'support') suggestedAgent = 'SUPPORT';
    else if (category === 'commercial') suggestedAgent = 'COMMERCIAL';
    else if (category === 'project') suggestedAgent = 'PROJET';
    else if (confidence < this.config.minConfidence) suggestedAgent = 'HUMAN';
    else suggestedAgent = 'AUTO';

    return {
      content,
      tone,
      actions: actions.slice(0, 5),
      requires_human_review: requiresHumanReview && this.config.requireHumanReview,
      confidence,
      suggested_agent: suggestedAgent,
      metadata: {
        word_count: wordCount,
        reading_time: readingTime,
        sentiment
      }
    };
  }

  // ============================================================
  // API PUBLIQUE - MÉTRIQUES ET STATUTS
  // ============================================================

  getMetrics() {
    return {
      initialized: this.initialized,
      totalProcessed: this.metrics.totalProcessed,
      totalErrors: this.metrics.totalErrors,
      averageConfidence: Math.round(this.metrics.averageConfidence),
      lastProcessedAt: this.metrics.lastProcessedAt,
      isProcessing: this.isProcessing,
      processedEmailsCount: this.processedEmails.size
    };
  }

  getConfig(): HarveyV2Config {
    return { ...this.config };
  }

  updateConfig(config: Partial<HarveyV2Config>): void {
    this.config = { ...this.config, ...config };
    console.log('⚙️ Harvey V2: Configuration mise à jour');
  }

  // ============================================================
  // WEBHOOKS
  // ============================================================

  addWebhookHandler(handler: (payload: WebhookPayload) => Promise<void>): void {
    this.webhookHandlers.push(handler);
    console.log(`📡 Harvey V2: Webhook handler ajouté (${this.webhookHandlers.length} total)`);
  }

  removeWebhookHandler(handler: (payload: WebhookPayload) => Promise<void>): void {
    this.webhookHandlers = this.webhookHandlers.filter(h => h !== handler);
  }

  private async sendWebhook(payload: WebhookPayload): Promise<void> {
    const webhookUrl = process.env.HARVEY_WEBHOOK_URL;
    
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (error) {
        console.error('❌ Harvey V2: Erreur webhook:', error);
      }
    }

    for (const handler of this.webhookHandlers) {
      try {
        await handler(payload);
      } catch (error) {
        console.error('❌ Harvey V2: Erreur handler webhook:', error);
      }
    }
  }

  private createErrorResponse(error: string, code: ErrorCode): EmailResponse {
    return {
      success: false,
      error,
      code
    };
  }
}

// ============================================================
// EXPORT
// ============================================================

export const harveyV2 = new HarveyV2();
export default HarveyV2;