// lib/agents/harvey/harvey.ts

import { supabase } from '@/lib/supabase';
import { keyManagement } from '@/lib/services/KeyManagementService';
import { generateWithFallback } from '@/lib/config/llm';
import {
  EmailWithAnalysis,
  CompanyData,
  ConversationHistory,
  HarveyResponse,
  HarveyConfig,
  HarveyResponseType,
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
  responseType: 'both',
  includeHtml: true,
  includeJson: true,
};

// ============================================================
// TEMPLATES D'EMAILS HTML
// ============================================================

function getEmailTemplate(data: {
  companyName: string;
  userName: string;
  subject: string;
  message: string;
  category: string;
  signature: string;
  logoUrl?: string | null;
  projectImages?: string[];
  projectName?: string | null;
  projectSlug?: string | null;
  projectDescription?: string | null;
  projectProgress?: number | null;
  projectStatus?: string | null;
  links?: {
    website: string;
    contact: string;
    projects: string;
  };
}): string {
  const categoryColors: Record<string, string> = {
    support: '#3b82f6',
    commercial: '#f59e0b',
    project: '#22c55e',
    newsletter: '#a855f7',
    information: '#64748b',
  };

  const categoryIcons: Record<string, string> = {
    support: '🛠️',
    commercial: '💼',
    project: '🚀',
    newsletter: '📬',
    information: 'ℹ️',
  };

  const color = categoryColors[data.category] || '#64748b';
  const icon = categoryIcons[data.category] || '📌';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f7f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f7f9;padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">
          
          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#1E3A8A,#1E40AF);padding:32px 40px;text-align:center;">
              ${data.logoUrl ? `
                <img src="${data.logoUrl}" alt="${data.companyName}" style="max-height:60px;width:auto;margin-bottom:12px;" />
              ` : `
                <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0;">${data.companyName}</h1>
              `}
              <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:8px 0 0 0;">Solutions technologiques innovantes</p>
            </td>
          </tr>
          
          <!-- CATEGORY HEADER -->
          <tr>
            <td style="background:${color}15;padding:12px 40px;text-align:center;border-bottom:2px solid ${color};">
              <span style="color:${color};font-weight:600;font-size:14px;">${icon} ${data.category.charAt(0).toUpperCase() + data.category.slice(1)}</span>
            </td>
          </tr>
          
          <!-- CONTENT -->
          <tr>
            <td style="padding:40px;">
              <!-- Message du client -->
              <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
                <p style="color:#64748b;font-size:12px;margin:0 0 4px 0;text-transform:uppercase;letter-spacing:0.5px;">Votre demande</p>
                <p style="color:#0f172a;font-size:14px;margin:0;font-style:italic;">"${data.message}"</p>
              </div>
              
              <!-- Réponse -->
              <div style="margin-bottom:24px;">
                <p style="color:#1e293b;font-size:15px;line-height:1.6;margin:0 0 16px 0;">
                  Bonjour <strong>${data.userName}</strong>,
                </p>
                <div style="color:#1e293b;font-size:14px;line-height:1.8;margin:0 0 16px 0;">
                  ${data.message}
                </div>
              </div>
              
              <!-- PROJET -->
              ${data.projectName ? `
                <div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #86efac;border-radius:12px;padding:20px;margin-bottom:24px;">
                  <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
                    <div style="flex:1;min-width:200px;">
                      <h3 style="color:#166534;font-size:16px;margin:0 0 4px 0;">${data.projectName}</h3>
                      ${data.projectDescription ? `<p style="color:#15803d;font-size:13px;margin:0 0 8px 0;">${data.projectDescription}</p>` : ''}
                      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
                        ${data.projectStatus ? `<span style="background:#22c55e;color:white;padding:2px 12px;border-radius:12px;font-size:11px;">${data.projectStatus}</span>` : ''}
                        ${data.projectProgress !== undefined && data.projectProgress !== null ? `<span style="color:#15803d;font-size:13px;">Progression: ${data.projectProgress}%</span>` : ''}
                        ${data.projectSlug ? `
                          <a href="${data.links?.projects || '#'}/${data.projectSlug}" style="background:#1E3A8A;color:white;padding:6px 16px;border-radius:6px;text-decoration:none;font-size:12px;display:inline-block;">
                            Voir le projet →
                          </a>
                        ` : ''}
                      </div>
                    </div>
                    ${data.projectImages && data.projectImages.length > 0 ? `
                      <div style="display:flex;gap:8px;flex-wrap:wrap;">
                        ${data.projectImages.slice(0, 3).map(img => `
                          <img src="${img}" style="width:80px;height:60px;object-fit:cover;border-radius:8px;border:1px solid #86efac;" />
                        `).join('')}
                      </div>
                    ` : ''}
                  </div>
                </div>
              ` : ''}
              
              <!-- SIGNATURE -->
              <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e2e8f0;">
                <p style="color:#1e293b;font-size:14px;margin:0 0 4px 0;">
                  Cordialement,
                </p>
                <p style="color:#1e293b;font-size:14px;margin:0;">
                  <strong>${data.signature}</strong>
                </p>
              </div>
            </td>
          </tr>
          
          <!-- FOOTER -->
          <tr>
            <td style="background-color:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="color:#64748b;font-size:13px;margin:0 0 8px 0;">
                ${data.companyName} · Solutions technologiques
              </p>
              <p style="color:#94a3b8;font-size:12px;margin:0;">
                <a href="${data.links?.website || '#'}" style="color:#1E3A8A;text-decoration:none;margin:0 8px;">Site web</a>
                ·
                <a href="${data.links?.contact || '#'}" style="color:#1E3A8A;text-decoration:none;margin:0 8px;">Contact</a>
                ·
                <a href="${data.links?.projects || '#'}" style="color:#1E3A8A;text-decoration:none;margin:0 8px;">Projets</a>
              </p>
              <p style="color:#94a3b8;font-size:11px;margin:8px 0 0 0;">
                Cet email a été généré automatiquement. Pour toute question, contactez-nous.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// ============================================================
// CLASSE HARVEY AMÉLIORÉE
// ============================================================

export class Harvey {
  private config: HarveyConfig;
  private companyData: CompanyData | null = null;
  private knowledgeBase: any[] = [];
  private templates: any[] = [];
  private initialized = false;
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

      if (error || !data) {
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
      description: "Solutions technologiques intelligentes pour l'éducation, l'industrie et la formation professionnelle.",
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
          slug: 'school-saas',
        },
        {
          name: 'SaaS Boutique',
          status: 'En développement',
          progress: 42,
          description: 'Solution pour commerçants locaux',
          slug: 'shop-saas',
        },
        {
          name: 'Domotique Énergétique',
          status: 'En développement',
          progress: 35,
          description: 'Système de gestion énergétique intelligent',
          slug: 'energy-domotic',
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
        { name: 'Laye Soma', role: 'Fondateur & CEO' },
        { name: 'Équipe TECH', role: 'Développement' },
      ],
      faq: [
        {
          question: 'Quels sont vos services ?',
          answer: 'Nous proposons des solutions SaaS, formations et missions',
        },
        {
          question: 'Comment obtenir un devis ?',
          answer: 'Contactez-nous via le formulaire de contact sur notre site.',
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
        .not('email_id', 'is', null)
        .limit(1000);

      if (error) {
        console.warn('⚠️ HARVEY: Erreur chargement emails traités:', error);
        return;
      }

      if (data) {
        data.forEach((item: any) => {
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
        .select('from_email')
        .not('from_email', 'is', null)
        .limit(1000);

      if (error) {
        console.warn('⚠️ HARVEY: Erreur chargement contacts traités:', error);
        return;
      }

      if (data) {
        data.forEach((item: any) => {
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
      if (this.processedEmails.has(emailId)) {
        return true;
      }

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
      if (this.processedContacts.has(email)) {
        return true;
      }

      const { data, error } = await supabase
        .from('email_conversations')
        .select('id')
        .eq('from_email', email)
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
  // RÉCUPÉRER LES IMAGES D'UN PROJET
  // ============================================================

  private async getProjectImages(projectId: string | null): Promise<string[]> {
    if (!projectId) return [];

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('gallery')
        .eq('id', projectId)
        .single();

      if (error || !data) {
        return [];
      }

      if (Array.isArray(data.gallery)) {
        return data.gallery.slice(0, 3);
      }

      return [];
    } catch (error) {
      console.error('❌ HARVEY: Erreur récupération images projet:', error);
      return [];
    }
  }

  // ============================================================
  // RÉCUPÉRER LE LOGO DE L'ENTREPRISE
  // ============================================================

  private async getCompanyLogo(): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('company_data')
        .select('logo_url')
        .single();

      if (error || !data || !data.logo_url) {
        return null;
      }

      return data.logo_url;
    } catch (error) {
      return null;
    }
  }

  // ============================================================
  // GÉNÉRER L'EMAIL HTML AVEC TEMPLATE
  // ============================================================

  private async generateEmailHtml(
    response: HarveyResponse,
    email: EmailWithAnalysis,
    projectData?: any
  ): Promise<string> {
    let projectImages: string[] = [];
    if (projectData?.id) {
      projectImages = await this.getProjectImages(projectData.id);
    }

    const logoUrl = await this.getCompanyLogo();

    return getEmailTemplate({
      companyName: this.companyData?.name || 'UNITECH',
      userName: email.from_email?.split('@')[0] || 'Client',
      subject: email.subject || 'Message',
      message: response.content,
      category: email.category || 'information',
      signature: `L'équipe ${this.companyData?.name || 'UNITECH'}`,
      logoUrl: logoUrl || undefined,
      projectImages: projectImages,
      projectName: projectData?.name || null,
      projectSlug: projectData?.slug || null,
      projectDescription: projectData?.description || null,
      projectProgress: projectData?.progress || null,
      projectStatus: projectData?.status || null,
      links: {
        website: 'https://unitech-qvgo.onrender.com',
        contact: 'https://unitech-qvgo.onrender.com/contact',
        projects: 'https://unitech-qvgo.onrender.com/projects',
      },
    });
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

## RÈGLES IMPORTANTES

1. **Tu es un consultant humain de UNITECH, PAS une IA ou un assistant**
2. **Ne mentionne JAMAIS que tu es une IA, un assistant, HARVEY ou un chatbot**
3. **Ne mentionne jamais d'API, de modèle, de prompt ou de LLM**
4. **Signe uniquement par : L'équipe UNITECH**
5. Sois professionnel, direct et confiant
6. Réponds dans la même langue que le client
7. Ne fabrique aucune information
8. Si tu ne sais pas, dis : "Je vérifie et je reviens vers vous"
9. Propose une action concrète

## LIENS ET CONTACTS

- **Site web** : https://unitech-qvgo.onrender.com/
- **Contact** : https://unitech-qvgo.onrender.com/contact
- **Lien vers un projet spécifique** : https://unitech-qvgo.onrender.com/projects/[slug-du-projet]

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
  // APPEL LLM AVEC GESTION DES CLÉS API
  // ============================================================

  private async callLLMWithKeyManagement(prompt: string): Promise<string> {
    try {
      // 1. Récupérer la meilleure clé API
      const apiKey = await keyManagement.getBestApiKey('openai');
      
      if (apiKey) {
        console.log(`🔑 Utilisation de la clé API: ${apiKey.key_name || 'sans nom'}`);
        // Incrémenter l'utilisation
        await keyManagement.incrementUsage(apiKey.id);
      }

      // 2. Appeler le LLM avec fallback
      const result = await generateWithFallback({
        messages: [
          {
            role: 'system',
            content: `Tu es un consultant professionnel pour UNITECH.

## PERSONNALITÉ
- Confiant et direct, comme un consultant humain
- Intelligent et pragmatique
- Charismatique et persuasif
- Professionnel mais accessible
- Ne tourne pas autour du pot

## IDENTITÉ - TRÈS IMPORTANT
- Tu es un **consultant humain de UNITECH**
- Tu N'ES PAS une IA, un assistant, un chatbot ou HARVEY
- Tu ne parles JAMAIS de toi en tant qu'IA
- Tu n'utilises JAMAIS les mots "IA", "assistant", "algorithme", "modèle", "prompt"

## STYLE DE COMMUNICATION
- Réponds avec assurance comme un expert
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

      return result.content;
    } catch (error: any) {
      console.error('❌ HARVEY: Erreur LLM:', error.message);
      
      // Marquer l'erreur si une clé a été utilisée
      const apiKey = await keyManagement.getBestApiKey('openai');
      if (apiKey) {
        await keyManagement.markError(apiKey.id, error.message);
      }

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

Pour plus d'informations, vous pouvez consulter notre site web : https://unitech-qvgo.onrender.com/

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
  // STOCKAGE DE LA RÉPONSE EMAIL - AVEC TEMPLATE ET IMAGES
  // ============================================================

  private async storeResponse(
    emailId: string,
    response: HarveyResponse,
    email: EmailWithAnalysis,
    projectData?: any
  ): Promise<any> {
    try {
      const emailHtml = await this.generateEmailHtml(response, email, projectData);

      const insertData: any = {
        email_id: emailId,
        from_email: email.from_email || '',
        to_email: email.to_email || 'doumbialayesoma@gmail.com',
        subject: email.subject || '',
        message: email.body || '',
        body: email.body || '',
        agent_response: response.content,
        agent_response_html: emailHtml,
        response_tone: response.tone,
        tone: response.tone,
        confidence: response.confidence,
        actions: response.actions,
        status: response.requires_human_review ? 'review' : 'pending',
        requires_human_review: response.requires_human_review,
        suggested_agent: response.suggested_agent,
        is_outgoing: true,
        category: email.category || 'information',
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

      this.processedEmails.add(emailId);

      console.log(`✅ HARVEY: Réponse stockée pour ${emailId} (avec template HTML)`);

      if (response.requires_human_review) {
        await this.createReviewNotification(emailId, response);
      }

      return data;
    } catch (error: any) {
      console.error('❌ HARVEY: Erreur stockage:', error?.message || error);
      return this.storeResponseFallback(emailId, response, email);
    }
  }

  // ============================================================
  // STOCKAGE RÉPONSE SIMPLE (FALLBACK)
  // ============================================================

  private async storeResponseFallback(
    emailId: string,
    response: HarveyResponse,
    email: EmailWithAnalysis
  ): Promise<any> {
    try {
      const insertData: any = {
        email_id: emailId,
        from_email: email.from_email || '',
        to_email: email.to_email || 'doumbialayesoma@gmail.com',
        subject: email.subject || '',
        message: email.body || '',
        body: email.body || '',
        agent_response: response.content,
        agent_response_html: null,
        response_tone: response.tone,
        tone: response.tone,
        confidence: response.confidence,
        actions: response.actions,
        status: response.requires_human_review ? 'review' : 'pending',
        requires_human_review: response.requires_human_review,
        suggested_agent: response.suggested_agent,
        is_outgoing: true,
        category: email.category || 'information',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('email_conversations')
        .insert(insertData)
        .select();

      if (error) {
        console.error('❌ HARVEY: Erreur stockage fallback:', error);
        return null;
      }

      console.log(`✅ HARVEY: Réponse stockée pour ${emailId} (fallback)`);
      return data;
    } catch (error: any) {
      console.error('❌ HARVEY: Erreur stockage fallback:', error?.message || error);
      return null;
    }
  }

  // ============================================================
  // STOCKER RÉPONSE CONTACT - AVEC TEMPLATE ET IMAGES
  // ============================================================

  private async storeContactResponse(
    contactId: string,
    response: HarveyResponse,
    contact: any,
    projectData?: any
  ): Promise<any> {
    try {
      let projectImages: string[] = [];
      if (projectData?.id) {
        projectImages = await this.getProjectImages(projectData.id);
      }

      const logoUrl = await this.getCompanyLogo();

      const emailHtml = getEmailTemplate({
        companyName: this.companyData?.name || 'UNITECH',
        userName: contact.name || contact.email?.split('@')[0] || 'Client',
        subject: contact.subject || 'Demande de contact',
        message: response.content,
        category: contact.category || 'information',
        signature: `L'équipe ${this.companyData?.name || 'UNITECH'}`,
        logoUrl: logoUrl || undefined,
        projectImages: projectImages,
        projectName: projectData?.name || null,
        projectSlug: projectData?.slug || null,
        projectDescription: projectData?.description || null,
        projectProgress: projectData?.progress || null,
        projectStatus: projectData?.status || null,
        links: {
          website: 'https://unitech-qvgo.onrender.com',
          contact: 'https://unitech-qvgo.onrender.com/contact',
          projects: 'https://unitech-qvgo.onrender.com/projects',
        },
      });

      const insertData: any = {
        contact_id: contactId,
        from_email: contact.email || '',
        to_email: 'doumbialayesoma@gmail.com',
        subject: contact.subject || 'Demande de contact',
        message: contact.message || '',
        body: contact.message || '',
        agent_response: response.content,
        agent_response_html: emailHtml,
        response_tone: response.tone,
        tone: response.tone,
        confidence: response.confidence,
        actions: response.actions,
        status: response.requires_human_review ? 'review' : 'pending',
        requires_human_review: response.requires_human_review,
        suggested_agent: response.suggested_agent,
        is_outgoing: true,
        category: contact.category || 'information',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log(`📝 Insertion contact dans email_conversations:`, {
        contact_id: insertData.contact_id,
        from_email: insertData.from_email,
        subject: insertData.subject,
        agent_response_length: insertData.agent_response?.length || 0,
        has_template: !!insertData.agent_response_html,
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

      this.processedContacts.add(contact.email);

      await supabase
        .from('contacts')
        .update({
          status: response.requires_human_review ? 'review' : 'answered',
          assigned_agent: 'HARVEY',
          updated_at: new Date().toISOString(),
        })
        .eq('id', contactId);

      console.log(`✅ HARVEY: Réponse contact stockée pour ${contactId} (avec template)`);
      return data;
    } catch (error: any) {
      console.error('❌ HARVEY: Erreur stockage contact:', error?.message || error);
      return this.storeContactResponseFallback(contactId, response, contact);
    }
  }

  // ============================================================
  // STOCKER RÉPONSE CONTACT SIMPLE (FALLBACK)
  // ============================================================

  private async storeContactResponseFallback(
    contactId: string,
    response: HarveyResponse,
    contact: any
  ): Promise<any> {
    try {
      const insertData: any = {
        contact_id: contactId,
        from_email: contact.email || '',
        to_email: 'doumbialayesoma@gmail.com',
        subject: contact.subject || 'Demande de contact',
        message: contact.message || '',
        body: contact.message || '',
        agent_response: response.content,
        agent_response_html: null,
        response_tone: response.tone,
        tone: response.tone,
        confidence: response.confidence,
        actions: response.actions,
        status: response.requires_human_review ? 'review' : 'pending',
        requires_human_review: response.requires_human_review,
        suggested_agent: response.suggested_agent,
        is_outgoing: true,
        category: contact.category || 'information',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('email_conversations')
        .insert(insertData)
        .select();

      if (error) {
        console.error('❌ HARVEY: Erreur stockage contact fallback:', error);
        return null;
      }

      this.processedContacts.add(contact.email);

      await supabase
        .from('contacts')
        .update({
          status: response.requires_human_review ? 'review' : 'answered',
          assigned_agent: 'HARVEY',
          updated_at: new Date().toISOString(),
        })
        .eq('id', contactId);

      console.log(`✅ HARVEY: Réponse contact stockée pour ${contactId} (fallback)`);
      return data;
    } catch (error: any) {
      console.error('❌ HARVEY: Erreur stockage contact fallback:', error?.message || error);
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

      if (contact.status === 'answered' || contact.status === 'review' || contact.status === 'duplicate') {
        console.log(`⚠️ HARVEY: Contact déjà traité (status: ${contact.status})`);
        return null;
      }

      console.log(`🦸‍♂️ HARVEY: Génération réponse contact ${contact.id}`);

      // Récupérer le projet associé
      let projectData = null;
      if (contact.project_id) {
        const { data } = await supabase
          .from('projects')
          .select('*')
          .eq('id', contact.project_id)
          .single();
        projectData = data;
      }

      const emailData: EmailWithAnalysis = {
        id: contact.id,
        from_email: contact.email || '',
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
        project_id: contact.project_id,
        project_slug: projectData?.slug,
        project_name: projectData?.name,
        project_description: projectData?.description,
        project_progress: projectData?.progress,
        project_status: projectData?.status,
      };

      const history = await this.getConversationHistory(contact.email);
      const prompt = this.buildPrompt(emailData, history, this.companyData);
      const responseContent = await this.callLLMWithKeyManagement(prompt);

      if (!responseContent) {
        console.error('❌ HARVEY: Aucune réponse générée');
        return null;
      }

      const analysis = this.analyzeResponse(responseContent, emailData);
      await this.storeContactResponse(contact.id, analysis, contact, projectData);

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

      if (await this.isEmailAlreadyProcessed(emailId)) {
        console.log(`⚠️ HARVEY: Email ${emailId} déjà traité, ignoré`);
        
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

      if (email.status === 'answered' || email.status === 'review' || email.status === 'duplicate') {
        console.log(`⚠️ HARVEY: Email déjà traité (status: ${email.status})`);
        return null;
      }

      if (email.status !== 'analyzed' && email.status !== 'processed') {
        console.log(`⚠️ HARVEY: Email non analysé (status: ${email.status})`);
        return null;
      }

      // Récupérer le projet associé
      let projectData = null;
      if (email.project_id) {
        const { data } = await supabase
          .from('projects')
          .select('*')
          .eq('id', email.project_id)
          .single();
        projectData = data;
      }

      const history = await this.getConversationHistory(email.from_email);
      const prompt = this.buildPrompt(email, history, this.companyData);
      const responseContent = await this.callLLMWithKeyManagement(prompt);

      if (!responseContent) {
        console.error('❌ HARVEY: Aucune réponse générée');
        return null;
      }

      const analysis = this.analyzeResponse(responseContent, email);
      
      await this.storeResponse(emailId, analysis, email, projectData);

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
  // GÉNÉRATION DE RÉPONSE COMPLÈTE AVEC HTML/JSON
  // ============================================================

  async generateFullResponse(
    emailId: string,
    options?: { responseType?: HarveyResponseType; includeHtml?: boolean; includeJson?: boolean }
  ): Promise<{
    response: HarveyResponse;
    html?: string;
    json?: any;
  } | null> {
    const response = await this.generateResponse(emailId);
    if (!response) return null;

    const includeHtml = options?.includeHtml ?? this.config.includeHtml ?? true;
    const includeJson = options?.includeJson ?? this.config.includeJson ?? true;

    const result: any = { response };

    // Générer HTML si demandé
    if (includeHtml) {
      const email = await this.getEmailById(emailId);
      if (email) {
        const projectData = await this.getProjectData(email.project_id);
        result.html = await this.generateEmailHtml(response, email, projectData);
      }
    }

    // Générer JSON si demandé
    if (includeJson) {
      result.json = {
        success: true,
        content: response.content,
        tone: response.tone,
        actions: response.actions,
        requires_human_review: response.requires_human_review,
        confidence: response.confidence,
        suggested_agent: response.suggested_agent,
        metadata: response.metadata,
      };
    }

    return result;
  }

  // ============================================================
  // RÉCUPÉRATION DES DONNÉES
  // ============================================================

  private async getEmailById(emailId: string): Promise<EmailWithAnalysis | null> {
    const { data, error } = await supabase
      .from('incoming_emails')
      .select('*')
      .eq('id', emailId)
      .single();

    if (error || !data) {
      console.error('❌ HARVEY: Email non trouvé:', error);
      return null;
    }

    return {
      ...data,
      ai_analysis: data.ai_analysis || {},
    };
  }

  private async getProjectData(projectId?: string | null): Promise<any> {
    if (!projectId) return null;
    try {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      return data;
    } catch (error) {
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
      const { data, error } = await supabase
        .from('incoming_emails')
        .select('id')
        .in('status', ['analyzed', 'processed'])
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
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .in('status', ['analyzed', 'processed'])
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

      const { data: emails, error } = await supabase
        .from('incoming_emails')
        .select('id, from_email, subject, status')
        .in('status', ['analyzed', 'processed']);

      if (error) {
        throw new Error(`Erreur récupération: ${error.message}`);
      }

      if (!emails || emails.length === 0) {
        console.log('📭 HARVEY: Aucun email à nettoyer');
        return { cleaned: 0, errors: [] };
      }

      for (const email of emails) {
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