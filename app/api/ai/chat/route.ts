// app/api/ai/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dona } from '@/lib/agents/dona/processor';
import { generateWithFallback } from '@/lib/config/llm';
import { keyManagement } from '@/lib/services/KeyManagementService';
import { leadManagement } from '@/lib/services/LeadManagementService';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// ============================================================
// CONFIGURATION
// ============================================================

const HISTORY_PAIRS = 5;              // 5 paires Q/R = 10 messages
const MAX_MESSAGE_CHARS = 4000;       // troncature de sécurité
const MAX_HISTORY_ITEM_CHARS = 1500;  // troncature par message d'historique
const LEAD_KEYWORD_THRESHOLD = 2;     // score minimum pour flaguer un lead

// ============================================================
// TYPES
// ============================================================

interface CompanyData {
  name: string;
  description: string;
  founder: string;
  services: any[];
  formations: any[];
  projects: any[];
  solutions: any[];
  collaborations: any[];
  team: any[];
  faq: any[];
  pricing: any;
  missions: any[];
}

interface LLMHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

interface LeadInfo {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  interest?: string;
  budget?: string;
}

// ============================================================
// RÉCUPÉRATION DES DONNÉES DE L'ENTREPRISE
// ============================================================

async function getCompanyData(): Promise<CompanyData> {
  try {
    console.log('📊 Récupération des données entreprise...');

    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (servicesError) console.error('❌ Erreur services:', servicesError);

    const { data: formations, error: formationsError } = await supabase
      .from('trainings')
      .select('*')
      .order('created_at', { ascending: false });

    if (formationsError) console.error('❌ Erreur formations:', formationsError);

    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (projectsError) console.error('❌ Erreur projets:', projectsError);

    const { data: solutions, error: solutionsError } = await supabase
      .from('solutions')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (solutionsError) console.error('❌ Erreur solutions:', solutionsError);

    const { data: collaborations, error: collaborationsError } = await supabase
      .from('collaborations')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (collaborationsError) console.error('❌ Erreur collaborations:', collaborationsError);

    let companyData = null;
    try {
      const { data, error } = await supabase
        .from('company_data')
        .select('*')
        .single();

      if (error) {
        console.warn('⚠️ Aucune donnée entreprise trouvée, utilisation des données par défaut');
      } else {
        companyData = data;
      }
    } catch (error) {
      console.warn('⚠️ Erreur récupération company_data, utilisation des données par défaut');
    }

    const { data: faq, error: faqError } = await supabase
      .from('faq')
      .select('*')
      .eq('is_active', true);

    if (faqError) console.error('❌ Erreur faq:', faqError);

    console.log('✅ Données récupérées:', {
      services: services?.length || 0,
      formations: formations?.length || 0,
      projects: projects?.length || 0,
      solutions: solutions?.length || 0,
      collaborations: collaborations?.length || 0,
      faq: faq?.length || 0,
    });

    return {
      name: companyData?.name || '',
      description: companyData?.description || 'Solutions technologiques innovantes',
      founder: companyData?.founder || '',
      services: services || [],
      formations: formations || [],
      projects: projects || [],
      solutions: solutions || [],
      collaborations: collaborations || [],
      team: companyData?.team || [{ name: '', role: 'Fondateur & CEO' }],
      faq: faq || [],
      pricing: companyData?.pricing || {},
      missions: companyData?.missions || [],
    };
  } catch (error) {
    console.error('❌ Erreur récupération données:', error);
    return getDefaultCompanyData();
  }
}

function getDefaultCompanyData(): CompanyData {
  return {
    name: 'UNITECH',
    description:
      "Solutions technologiques intelligentes pour l'éducation, l'industrie et la formation professionnelle.",
    founder: 'Laye Soma',
    services: [
      { name: 'SaaS Scolaire', description: 'Gestion complète des établissements scolaires' },
      { name: 'SaaS Boutique', description: 'Gestion pour commerçants locaux' },
      { name: 'Domotique Énergétique', description: 'Système intelligent de gestion énergétique' },
    ],
    formations: [
      { name: 'Développement Web Full Stack', duration: '6 mois', level: 'Débutant à Avancé' },
      { name: 'Intelligence Artificielle et ML', duration: '4 mois', level: 'Intermédiaire' },
    ],
    projects: [
      { name: 'SaaS Scolaire', status: 'En développement', progress: 68 },
      { name: 'SaaS Boutique', status: 'En développement', progress: 42 },
      { name: 'Domotique Énergétique', status: 'En développement', progress: 35 },
    ],
    solutions: [],
    collaborations: [],
    team: [{ name: 'Laye Soma', role: 'Fondateur & CEO' }],
    faq: [],
    pricing: {},
    missions: [],
  };
}

// ============================================================
// ✅ NETTOYAGE DE L'HISTORIQUE (5 paires Q/R max)
// ============================================================

function sanitizeHistory(
  raw: any,
  maxPairs: number = HISTORY_PAIRS
): LLMHistoryItem[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];

  const cleaned: LLMHistoryItem[] = [];

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;

    const role = item.role;
    const content = typeof item.content === 'string' ? item.content : '';

    // Ignorer rôles non supportés par le LLM
    if (role !== 'user' && role !== 'assistant') continue;

    // Ignorer contenus vides ou placeholder typing
    const trimmed = content.trim();
    if (!trimmed || trimmed === '...') continue;

    // Tronquer les messages trop longs
    const safeContent =
      trimmed.length > MAX_HISTORY_ITEM_CHARS
        ? trimmed.slice(0, MAX_HISTORY_ITEM_CHARS) + '…'
        : trimmed;

    cleaned.push({ role, content: safeContent });
  }

  // 1 paire = 2 messages → garder les N derniers (ordre chronologique)
  return cleaned.slice(-(maxPairs * 2));
}

// ============================================================
// CLASSIFICATION AVEC DONA
// ============================================================

async function classifyWithDona(message: string): Promise<{
  category: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
  matched_keywords: string[];
  summary: string;
}> {
  try {
    await dona.init();

    const analysis = await dona.analyze({
      from: 'chatbot',
      subject: 'Message utilisateur',
      body: message,
      source: 'email',
    });

    console.log(`🧠 DONA: Classification terminée`);
    console.log(`   Catégorie: ${analysis.category}`);
    console.log(`   Confiance: ${analysis.confidence}%`);
    console.log(`   Mots-clés: ${analysis.matched_keywords.join(', ')}`);

    return {
      category: analysis.category,
      priority: analysis.priority,
      confidence: analysis.confidence,
      matched_keywords: analysis.matched_keywords,
      summary: analysis.summary,
    };
  } catch (error) {
    console.error('❌ Erreur DONA:', error);
    return {
      category: 'general',
      priority: 'medium',
      confidence: 30,
      matched_keywords: [],
      summary: 'Classification par défaut',
    };
  }
}

// ============================================================
// DÉTECTION DES INFORMATIONS DE LEAD
// ============================================================

function extractLeadInfo(messages: Array<{ role: string; content: string }>): LeadInfo {
  const info: LeadInfo = {};
  const text = messages.map((m) => m.content).join(' ').toLowerCase();

  // Nom
  const nameMatch =
    text.match(/je m'appelle\s+([a-zà-ÿ\s]+)/i) ||
    text.match(/mon nom est\s+([a-zà-ÿ\s]+)/i) ||
    text.match(/moi c'est\s+([a-zà-ÿ\s]+)/i);
  if (nameMatch) {
    info.name = nameMatch[1]
      .trim()
      .split(' ')
      .filter(Boolean)
      .slice(0, 3)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  // Email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) info.email = emailMatch[0];

  // Téléphone (FR + international)
  const phoneMatch =
    text.match(/(?:(?:\+|00)\d{1,3}[\s.-]?)?(?:\(?\d{1,4}\)?[\s.-]?){2,5}\d{2,4}/) ||
    text.match(/(?:(?:\+|00)33|0)[1-9](?:\s?\d{2}){4}/);
  if (phoneMatch && phoneMatch[0].replace(/\D/g, '').length >= 8) {
    info.phone = phoneMatch[0].trim();
  }

  // Entreprise
  const companyMatch =
    text.match(/je travaille chez\s+([a-zà-ÿ\s]+)/i) ||
    text.match(/mon entreprise\s+([a-zà-ÿ\s]+)/i);
  if (companyMatch) {
    info.company = companyMatch[1]
      .trim()
      .split(' ')
      .slice(0, 4)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  // Budget
  const budgetMatch = text.match(/budget\s*(?:de|:)?\s*([\d\s.,]+)\s*(?:€|euros|euro|fcfa|xof)/i);
  if (budgetMatch) info.budget = budgetMatch[1].trim();

  // Intérêt (multi-catégories prioritaires)
  const interestGroups: string[][] = [
    ['saas', 'logiciel', 'application', 'plateforme'],
    ['formation', 'formations', 'cours', 'apprentissage'],
    ['domotique', 'énergie', 'energie', 'énergétique'],
    ['ia', 'intelligence artificielle', 'machine learning'],
    ['site web', 'web', 'vitrine', 'e-commerce'],
    ['scolaire', 'école', 'ecole', 'éducation', 'education'],
    ['boutique', 'commerce', 'commerçant', 'commercant'],
  ];
  for (const group of interestGroups) {
    const found = group.find((kw) => text.includes(kw));
    if (found) {
      info.interest = found;
      break;
    }
  }

  return info;
}

// ============================================================
// DÉTECTION INTENTION LEAD (mots-clés pondérés)
// ============================================================

function detectLeadIntent(text: string): { isLead: boolean; score: number; matched: string[] } {
  const lower = text.toLowerCase();
  const groups: Array<{ weight: number; words: string[] }> = [
    { weight: 3, words: ['devis', 'tarif', 'prix', 'budget', 'coût', 'cout', 'tarification', 'facturation'] },
    { weight: 3, words: ['contrat', 'commande', 'achat', 'souscrire', 'abonnement', 'prestation'] },
    { weight: 2, words: ['contact', 'rappel', 'appel', 'rendez-vous', 'rdv', 'rencontrer', 'téléphone', 'telephone'] },
    { weight: 2, words: ['projet', 'collaboration', 'partenariat', 'mission', 'formation', 'audit', 'consulting'] },
    { weight: 1, words: ['urgent', 'urgence', 'rapidement', 'asap', 'vite'] },
  ];

  const matched: string[] = [];
  let score = 0;

  for (const g of groups) {
    for (const w of g.words) {
      if (lower.includes(w)) {
        matched.push(w);
        score += g.weight;
        break; // 1 seul match par groupe
      }
    }
  }

  return { isLead: score >= LEAD_KEYWORD_THRESHOLD, score, matched };
}

// ============================================================
// ✅ DÉTECTION : la conversation a-t-elle déjà commencé ?
// ============================================================

function hasConversationStarted(history: LLMHistoryItem[]): boolean {
  return history.length > 0;
}

// ============================================================
// CONSTRUCTION DU PROMPT
// ============================================================

function buildPromptWithContext(
  message: string,
  history: LLMHistoryItem[],
  companyData: CompanyData,
  classification: any,
  leadInfo?: LeadInfo
): string {
  const servicesText = companyData.services
    .map((s: any) => `- **${s.name}**: ${s.description || ''}`)
    .join('\n');

  const formationsText = companyData.formations
    .map(
      (f: any) =>
        `- **${f.name || f.title}**: ${f.duration || ''} ${f.slug || ''} ${f.description || ''} (${
          f.level || 'Tous niveaux'
        })`
    )
    .join('\n');

  const projectsText = companyData.projects
    .map(
      (p: any) =>
        `- **${p.name}**: ${p.status || 'En cours'} ${p.description || ''} ${p.slug || ''} (${
          p.progress || 0
        }%)`
    )
    .join('\n');

  const solutionsText = companyData.solutions
    .map((s: any) => `- **${s.title || s.name}**: ${s.description || ''}`)
    .join('\n');
const conversationStarted = hasConversationStarted(history);
  const collaborationsText = companyData.collaborations
    .map((c: any) => `- **${c.name}**: ${c.type || 'Partenariat'} - ${c.status || 'Actif'}`)
    .join('\n');

  const faqText = companyData.faq
    .map((f: any) => `Q: ${f.question}\nR: ${f.answer}`)
    .join('\n\n');

  const teamText = companyData.team.map((t: any) => `- ${t.name}: ${t.role}`).join('\n');

  // ✅ Historique déjà nettoyé (5 paires max)
  const historyText =
    history.length > 0
      ? history
          .map(
            (h) =>
              `${h.role === 'user' ? 'Utilisateur' : 'HARVEY'}: ${h.content}`
          )
          .join('\n')
      : 'Aucun historique';

  // Informations du lead
  let leadInfoText = '';
  if (leadInfo && Object.keys(leadInfo).length > 0) {
    leadInfoText = `
## INFORMATIONS COLLECTÉES
${leadInfo.name ? `- Nom: ${leadInfo.name}` : ''}
${leadInfo.email ? `- Email: ${leadInfo.email}` : ''}
${leadInfo.phone ? `- Téléphone: ${leadInfo.phone}` : ''}
${leadInfo.company ? `- Entreprise: ${leadInfo.company}` : ''}
${leadInfo.budget ? `- Budget: ${leadInfo.budget}` : ''}
${leadInfo.interest ? `- Intérêt: ${leadInfo.interest}` : ''}
`;
  }

  const categoryInstructions: Record<string, string> = {
    commercial: `L'utilisateur a une demande commerciale. Présente les services de manière attractive et propose un devis.`,
    project: `L'utilisateur demande des informations sur les projets. Présente les projets avec leurs statuts et progression.`,
    support: `L'utilisateur a une demande de support. Sois rassurant et propose une aide concrète.`,
    newsletter: `L'utilisateur s'intéresse à la newsletter. Propose de s'inscrire.`,
    founder: `L'utilisateur demande des informations sur le fondateur. Réponds avec le nom et la vision.`,
    information: `L'utilisateur demande des informations générales. Donne une réponse claire et structurée.`,
    general: `L'utilisateur pose une question générale. Réponds de manière utile et professionnelle.`,
    spam: `L'utilisateur a envoyé un message indésirable. Réponds poliment que tu ne peux pas traiter ce type de demande.`,
  };

  const instruction = categoryInstructions[classification.category] || categoryInstructions.general;

  const isOffTopic = classification.category === 'general' && classification.confidence < 40;

  let offTopicInstruction = '';
  if (isOffTopic) {
    offTopicInstruction = `
## ⚠️ QUESTION HORS SUJET
Cette question ne semble pas liée à UNITECH.
- Si c'est le cas, dis-le poliment à l'utilisateur
- Propose de l'aider sur les sujets liés à UNITECH
- Ne donne pas de conseils sur des sujets hors de ton domaine
`;
  }

  return `Tu es HARVEY, le conseiller IA et agent commercial de UNITECH.
  ## RÈGLES CONVERSATIONNELLES (TRÈS IMPORTANT)

${
  conversationStarted
    ? `⚠️ La conversation est DÉJÀ EN COURS (${history.length} messages d'historique).
- ❌ NE COMMENCE PAS par "Bonjour", "Salut", "Bonsoir", "Hello" ou 👋
- ❌ NE REDEMANDE PAS les informations déjà fournies dans l'historique
- ❌ PAS de formule de politesse creuse en début ("Je suis ravi de...", "Merci pour votre message...")
- ✅ Enchaîne DIRECTEMENT sur le fond de la question
- ✅ Réponds comme dans une discussion continue entre deux personnes

Exemple INTERDIT :
"Bonjour ! 👋 Je suis ravi que vous souhaitiez..."

Exemple CORRECT :
"Pour planifier ce rendez-vous, il me faut..."
"Très bien, dans ce cas je vous suggère..."`
    : `C'est le PREMIER message de la conversation. Tu peux saluer brièvement (une seule fois).
Ensuite, va droit au but.`
}

## IDENTITÉ
- Tu es HARVEY, un consultant expert et agent commercial de UNITECH
- Tu es professionnel, courtois, précis et utile
- Tu réponds dans la même langue que l'utilisateur
- Tu peux faire des blagues et sympathiser

## RÔLE D'AGENT COMMERCIAL
1. **Qualifier le lead** : Identifie le besoin, le budget, le délai
2. **Proposer des solutions** : Recommande les services adaptés
3. **Créer un lien** : Sois chaleureux et professionnel
4. **Collecter les infos** : Nom, email, téléphone, entreprise
5. **Proposer des actions** : Devis, rendez-vous, démo

## RÈGLES IMPORTANTES
1. Utilise les informations de l'entreprise ci-dessous
2. Si la question est hors sujet, dis-le poliment
3. Propose une action concrète en fin de réponse (une seule, pas trois)
4. Sois professionnel mais accessible
5. **Ne répète JAMAIS les salutations** si l'historique est non vide
6. **Ne paraphrase pas** ce que l'utilisateur vient de dire
7. Réponses concises : 100–200 mots max sauf si demande explicite de détail
8. Pour les liens:
   - Projets: https://unitech-qvgo.onrender.com/projects/<slug>
   - Formations: https://unitech-qvgo.onrender.com/training/<slug>
   - Services: https://unitech-qvgo.onrender.com/services/<slug>
   - Contact: https://unitech-qvgo.onrender.com/contact
   - Email: doumbialayesoma@gmail.com
   - Tel: +223 90692363

## CLASSIFICATION DONA
- Catégorie: ${classification.category}
- Confiance: ${classification.confidence}%
- Mots-clés: ${classification.matched_keywords.join(', ')}

${leadInfoText}

## DONNÉES ENTREPRISE

### Présentation
🏢 **${companyData.name}**
${companyData.description}

👤 **Fondateur**: ${companyData.founder}

### Services
${servicesText || 'Aucun service disponible'}

### Formations
${formationsText || 'Aucune formation disponible'}

### Projets
${projectsText || 'Aucun projet disponible'}

### Solutions
${solutionsText || 'Aucune solution disponible'}

### Collaborations
${collaborationsText || 'Aucune collaboration disponible'}

### Équipe
${teamText || 'Équipe non renseignée'}

### FAQ
${faqText || 'Aucune FAQ disponible'}

## HISTORIQUE (${history.length} messages, 5 dernières paires Q/R)
${historyText}

## QUESTION ACTUELLE
${message}

## INSTRUCTION SPÉCIFIQUE
${instruction}

${offTopicInstruction}

RÉPONSE:`;
}

// ============================================================
// POST /api/ai/chat
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      message,
      history = [],
      sessionId,
      tone = 'friendly',
      temperature = 0.7,
      maxTokens = 600,
    } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        {
          success: false,
          content: "Je n'ai pas compris votre demande. Pouvez-vous reformuler ?",
        },
        { status: 400 }
      );
    }

    // Sécurité : tronquer si trop long
    const safeMessage =
      message.length > MAX_MESSAGE_CHARS
        ? message.slice(0, MAX_MESSAGE_CHARS)
        : message;

    console.log(
      `🤖 HARVEY: Message reçu: "${safeMessage.substring(0, 50)}..."`
    );

    // ✅ 1. Nettoyer l'historique (5 paires max)
    const cleanHistory = sanitizeHistory(history, HISTORY_PAIRS);
    console.log(
      `📚 Historique: ${cleanHistory.length} messages (${cleanHistory.length / 2} paires)`
    );

    // ✅ 2. Classification avec DONA
    const classification = await classifyWithDona(safeMessage);
    console.log(`🧠 DONA: ${classification.category} (${classification.confidence}%)`);

    // ✅ 3. Récupérer les données de l'entreprise
    const companyData = await getCompanyData();

    // ✅ 4. Extraire les infos du lead (historique complet + message courant)
    const allMessages = [...cleanHistory, { role: 'user', content: safeMessage }];
    const leadInfo = extractLeadInfo(allMessages);

    // ✅ 5. Détection d'intention lead
    const leadIntent = detectLeadIntent(safeMessage);

    // ✅ 6. Construire le prompt
    const prompt = buildPromptWithContext(
      safeMessage,
      cleanHistory,
      companyData,
      classification,
      leadInfo
    );

    // ✅ 7. Essayer d'utiliser le LLM
    let llmResponse: string | null = null;
    let providerName = 'fallback';
    try {
      const apiKey = await keyManagement.getBestApiKey();

      if (apiKey) {
        console.log(
          `🔑 Clé trouvée: ${apiKey.provider?.display_name || 'Inconnu'} (${apiKey.key_name})`
        );
        await keyManagement.incrementUsage(apiKey.id);

        const result = await generateWithFallback({
          messages: [
            {
              role: 'system',
              content: `Tu es HARVEY, le conseiller IA et agent commercial de UNITECH. Réponds de manière précise et utile. Utilise l'historique fourni pour rester cohérent. Si la question est hors sujet, dis-le poliment.`,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature,
          max_tokens: maxTokens,
        });

        if (result?.content) {
          llmResponse = result.content;
          providerName = result.provider || 'unknown';
          console.log(`✅ HARVEY: Réponse générée (provider: ${providerName})`);
        }
      } else {
        console.warn('⚠️ Aucune clé API disponible');
      }
    } catch (llmError: any) {
      console.warn('⚠️ Erreur LLM:', llmError.message);
    }

    // ✅ 8. Fallback si nécessaire
    const finalContent =
      llmResponse || generateFallbackWithDona(safeMessage, classification, companyData);

    // ✅ 9. Sauvegarder / mettre à jour le lead si infos collectées OU intention détectée
    const shouldCreateLead =
      !!sessionId &&
      (leadInfo.name ||
        leadInfo.email ||
        leadInfo.phone ||
        leadIntent.isLead);

    if (shouldCreateLead) {
      try {
        const existingLead = await leadManagement.getLeadBySession(sessionId);

        const conversationSummary = allMessages
          .map((m) => m.content)
          .join(' ')
          .substring(0, 500);

        if (existingLead) {
          await leadManagement.updateLead(existingLead.id!, {
            name: leadInfo.name || existingLead.name,
            email: leadInfo.email || existingLead.email,
            phone: leadInfo.phone || existingLead.phone,
            company: leadInfo.company || existingLead.company,
            interest: leadInfo.interest || existingLead.interest,
            budget: leadInfo.budget || existingLead.budget,
            status: 'contacted',
            last_contact_at: new Date().toISOString(),
          });
        } else if (leadInfo.name || leadInfo.email || leadIntent.isLead) {
          await leadManagement.createLead({
            session_id: sessionId,
            name: leadInfo.name,
            email: leadInfo.email,
            phone: leadInfo.phone,
            company: leadInfo.company,
            interest: leadInfo.interest,
            budget: leadInfo.budget,
            status: 'new',
            source: 'chatbot',
            conversation_summary: conversationSummary,
          });
        }
      } catch (leadError) {
        console.warn('⚠️ Erreur sauvegarde lead:', leadError);
      }
    }

    // ✅ 10. Réponse enrichie
    return NextResponse.json({
      success: true,
      content: finalContent,
      agent: 'harvey',
      fallback: !llmResponse,
      provider: providerName,
      category: classification.category,
      confidence: classification.confidence,
      pairsUsed: cleanHistory.length / 2,
      leadInfo,
      shouldNotifyLead: leadIntent.isLead,
      leadScore: leadIntent.score,
      matchedKeywords: leadIntent.matched,
    });
  } catch (error: any) {
    console.error('❌ Erreur:', error);
    return NextResponse.json(
      {
        success: false,
        content: 'Je rencontre un problème technique. Veuillez réessayer.',
      },
      { status: 500 }
    );
  }
}

// ============================================================
// FALLBACK
// ============================================================

function generateFallbackWithDona(
  message: string,
  classification: any,
  companyData: CompanyData
): string {
  const { category, matched_keywords } = classification;

  const greetings: string[] = ['bonjour', 'salut', 'hello', 'coucou', 'hey', 'bonsoir'];
  const isGreeting = matched_keywords.some((k: string) => greetings.includes(k));

  if (category === 'general' && isGreeting) {
    return `Bonjour ! 👋 Je suis HARVEY, votre conseiller IA chez UNITECH.

Comment puis-je vous accompagner aujourd'hui ?

Vous souhaitez découvrir nos services ? → https://unitech-qvgo.onrender.com/services
Vous avez besoin d'un devis personnalisé ? → https://unitech-qvgo.onrender.com/contact
Vous êtes intéressé par nos formations ? → https://unitech-qvgo.onrender.com/training

N'hésitez pas à me préciser votre besoin, je suis là pour vous aider ! 💬`;
  }

  if (category === 'general' && classification.confidence < 40) {
    return `Je suis HARVEY, votre conseiller chez UNITECH. 🤖

Je suis spécialisé dans les questions concernant UNITECH et ses services.

Je peux vous renseigner sur :
• Nos services et solutions technologiques
• Nos agents IA (DONA et HARVEY)
• Nos projets et formations
• Notre équipe
• Comment nous contacter

Si vous avez une question sur ces sujets, je serai ravi de vous aider ! 💬`;
  }

  return `Je suis HARVEY, votre conseiller chez UNITECH. 🤖

Je peux vous renseigner sur :
• Nos services et solutions
• Nos agents IA (DONA et HARVEY)
• Nos projets et formations
• Notre équipe
• Comment nous contacter

Posez-moi votre question ! 💬`;
}

// ============================================================
// GET - Health Check
// ============================================================

export async function GET() {
  const companyData = await getCompanyData();
  return NextResponse.json({
    status: 'ok',
    message: 'HARVEY API with DONA classification and Lead Management',
    version: '2.3.0',
    historyPairs: HISTORY_PAIRS,
    data: {
      services: companyData.services.length,
      formations: companyData.formations.length,
      projects: companyData.projects.length,
      solutions: companyData.solutions.length,
      collaborations: companyData.collaborations.length,
      faq: companyData.faq.length,
      founder: companyData.founder,
    },
    timestamp: new Date().toISOString(),
  });
}