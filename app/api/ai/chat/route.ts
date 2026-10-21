// app/api/ai/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dona } from '@/lib/agents/dona/processor';
import { generateWithFallback } from '@/lib/config/llm';
import { keyManagement } from '@/lib/services/KeyManagementService';
import { leadManagement } from '@/lib/services/lead-management-server';
import { supabaseServer as supabase } from '@/lib/supabase-admin';
import { clientIp, takeToken } from '@/lib/api/rate-limit';
import { catalogueRecipient, catalogueReply, envoyerCatalogue, recentlySent } from '@/lib/agents/harvey/catalogue';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// ============================================================
// CONFIGURATION
// ============================================================

const HISTORY_PAIRS = 5;              // 5 paires Q/R = 10 messages
const MAX_MESSAGE_CHARS = 4000;       // troncature de sécurité
const MAX_HISTORY_ITEM_CHARS = 1500;  // troncature par message d'historique
const LEAD_KEYWORD_THRESHOLD = 2;     // score minimum pour flaguer un lead
const MAX_RESPONSE_TOKENS = 800;      // plafond imposé quel que soit le client
const CHAT_WINDOW_MS = 10 * 60 * 1000; // fenêtre de 10 minutes
const CHAT_LIMIT_PER_IP = 30;         // messages par IP et par fenêtre
const CHAT_LIMIT_GLOBAL = 600;        // messages tous visiteurs confondus
const CATALOGUE_WINDOW_MS = 60 * 60 * 1000; // fenêtre d'une heure
const CATALOGUE_PER_SESSION = 3;      // envois de catalogue par conversation et par heure

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

// Les données changent rarement : une lecture toutes les 5 minutes suffit
const COMPANY_CACHE_MS = 5 * 60 * 1000;
let companyCache: { at: number; data: CompanyData } | null = null;

async function getCompanyData(): Promise<CompanyData> {
  if (companyCache && Date.now() - companyCache.at < COMPANY_CACHE_MS) {
    return companyCache.data;
  }
  const data = await loadCompanyData();
  companyCache = { at: Date.now(), data };
  return data;
}

async function loadCompanyData(): Promise<CompanyData> {
  try {
    console.log('📊 Récupération des données entreprise...');

    // Lectures en parallèle (auparavant 7 requêtes l'une après l'autre)
    const [servicesRes, formationsRes, projectsRes, solutionsRes, collaborationsRes, companyRes, faqRes] =
      await Promise.all([
        supabase.from('services').select('*').eq('is_active', true).order('order_index', { ascending: true }),
        supabase.from('trainings').select('*').order('created_at', { ascending: true }),
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('solutions').select('*').eq('is_active', true).order('order_index', { ascending: true }),
        supabase.from('collaborations').select('*').eq('status', 'active').order('created_at', { ascending: false }),
        supabase.from('company_data').select('*').limit(1).maybeSingle(),
        supabase.from('faq').select('*').eq('is_active', true).order('order_index', { ascending: true }),
      ]);

    for (const [label, res] of Object.entries({
      services: servicesRes, formations: formationsRes, projets: projectsRes, solutions: solutionsRes,
      collaborations: collaborationsRes, company_data: companyRes, faq: faqRes,
    })) {
      if (res.error) console.error(`❌ Erreur ${label}:`, res.error);
    }

    const services = servicesRes.data;
    const formations = formationsRes.data;
    const projects = projectsRes.data;
    const solutions = solutionsRes.data;
    const collaborations = collaborationsRes.data;
    const companyData = companyRes.data;
    const faq = faqRes.data;

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

/**
 * Historique prêt pour le LLM : commence par l'utilisateur (le message
 * d'accueil est retiré) et alterne les rôles (messages consécutifs fusionnés),
 * comme l'exigent certains fournisseurs.
 */
function toChatTurns(history: LLMHistoryItem[], message: string): LLMHistoryItem[] {
  const turns: LLMHistoryItem[] = [];
  for (const item of [...history, { role: 'user' as const, content: message }]) {
    if (turns.length === 0 && item.role === 'assistant') continue;
    const last = turns[turns.length - 1];
    if (last && last.role === item.role) {
      last.content = `${last.content}\n\n${item.content}`;
    } else {
      turns.push({ ...item });
    }
  }
  return turns;
}

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

// Coordonnées officielles : les seules que HARVEY communique
const CONTACT = {
  email: 'doumbialayesoma@gmail.com',
  phone: '+223 90692363',
  site: 'https://unitech-qvgo.onrender.com',
};

const PROJECT_STATUS: Record<string, string> = {
  completed: 'terminé',
  'in-progress': 'en cours',
  planned: 'prévu',
  paused: 'en pause',
};

// Certaines réponses de la FAQ contiennent des « \n » littéraux
function cleanText(value: unknown): string {
  return String(value ?? '').replace(/\\n/g, '\n').trim();
}

function fcfa(value: unknown): string | null {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return `${Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA`;
}

// Le prompt doit rester court : Groq (fournisseur principal) plafonne à
// 8 000 tokens par minute. Tout le catalogue figure en une ligne par
// élément ; le détail n'est ajouté que pour le sujet de la question.

function firstSentence(value: unknown, max = 140): string {
  const text = cleanText(value).replace(/\s+/g, ' ');
  const end = text.search(/[.!?](\s|$)/);
  const sentence = end > 0 ? text.slice(0, end + 1) : text;
  return sentence.length > max ? `${sentence.slice(0, max - 1)}…` : sentence;
}

function formatFormations(list: any[], detailed: boolean): string {
  return list
    .map((f) => {
      const facts = [f.duration, f.schedule, f.price || 'tarif sur demande'].filter(Boolean).join(' · ');
      const lines = [`- **${cleanText(f.title || f.name)}** : ${facts}${f.slug ? ` — ${CONTACT.site}/training/${f.slug}` : ''}`];
      if (detailed) {
        if (f.level) lines.push(`  Niveau : ${f.level}`);
        if (f.description) lines.push(`  ${firstSentence(f.description, 220)}`);
        if (Array.isArray(f.modules) && f.modules.length) lines.push(`  Programme : ${f.modules.join(' ; ')}`);
      }
      return lines.join('\n');
    })
    .join('\n');
}

function formatServices(list: any[], detailed: boolean): string {
  return list
    .map((s) => {
      const prices = [
        fcfa(s.price_monthly) && `${fcfa(s.price_monthly)}/mois`,
        fcfa(s.price_yearly) && `${fcfa(s.price_yearly)}/an`,
        fcfa(s.price_project) && `${fcfa(s.price_project)} le projet`,
      ].filter(Boolean);
      const line = `- **${cleanText(s.name)}** (${prices.length ? prices.join(' ou ') : 'sur devis'})${s.slug ? ` — ${CONTACT.site}/services/${s.slug}` : ''}`;
      if (!detailed) return line;
      const features = Array.isArray(s.features) && s.features.length ? ` Inclut : ${s.features.slice(0, 5).join(', ')}.` : '';
      return `${line}\n  ${firstSentence(s.description)}${features}`;
    })
    .join('\n');
}

function formatProjects(list: any[], detailed: boolean): string {
  return list
    .map((p) => {
      const status = PROJECT_STATUS[p.status] || p.status || 'en cours';
      const progress = p.status !== 'completed' && p.progress != null ? ` ${p.progress} %` : '';
      const line = `- **${cleanText(p.name)}** (${status}${progress})${p.slug ? ` — ${CONTACT.site}/projects/${p.slug}` : ''}`;
      if (!detailed) return line;
      const milestone = p.next_milestone ? ` Prochaine étape : ${cleanText(p.next_milestone)}.` : '';
      return `${line}\n  ${firstSentence(p.description)}${milestone}${p.site ? ` Site : ${p.site}` : ''}`;
    })
    .join('\n');
}

// Mots significatifs d'un texte (sans accents ni mots outils)
const STOP_WORDS = new Set(['les', 'des', 'une', 'pour', 'vous', 'nous', 'est', 'que', 'qui', 'quel', 'quels', 'quelle', 'quelles', 'sur', 'avec', 'dans', 'votre', 'vos', 'mon', 'mes', 'comment', 'puis', 'unitech', 'proposez']);
function significantWords(text: string): Set<string> {
  return new Set(
    text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w))
  );
}

// Entrées de FAQ qui partagent au moins un mot significatif avec la question
function relevantFaq(faq: any[], message: string, max = 3): any[] {
  const words = significantWords(message);
  return faq
    .map((f) => {
      const qWords = significantWords(`${f.question} ${(f.keywords || []).join(' ')}`);
      let hits = 0;
      for (const w of words) if (qWords.has(w)) hits++;
      return { f, hits };
    })
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, max)
    .map((x) => x.f);
}

const CATEGORY_HINTS: Record<string, string> = {
  commercial: "Demande commerciale : identifie le service adapté, donne son prix s'il est connu et propose un devis.",
  project: 'Projet ou réalisation : explique ce qu’UNITECH peut construire, cite un projet comparable et propose un échange avec l’équipe.',
  formation: 'Formations : donne programme, durée, horaires et tarif des formations pertinentes, puis propose le catalogue complet par e-mail ou l’inscription.',
  support: 'Demande d’aide : sois rassurant, demande les détails utiles et oriente vers l’équipe si nécessaire.',
  newsletter: 'Newsletter : explique comment s’inscrire depuis le site.',
  founder: 'Question sur le fondateur : présente-le brièvement avec la vision d’UNITECH.',
  information: 'Demande d’information : réponds clairement à partir des données ci-dessous.',
  general: 'Message général : réponds utilement et oriente vers ce qu’UNITECH propose.',
  spam: 'Message probablement indésirable : réponds poliment que tu ne peux pas traiter cette demande.',
};

/** Prompt système de HARVEY : règles, données de l'entreprise, contexte. */
function buildSystemPrompt(
  message: string,
  history: LLMHistoryItem[],
  companyData: CompanyData,
  classification: any,
  leadInfo?: LeadInfo
): string {
  const conversationStarted = hasConversationStarted(history);

  // Sujet de la question (message courant + dernier échange) : on détaille
  // seulement les sections concernées
  const topicText = significantWords(`${message} ${history.slice(-2).map((h) => h.content).join(' ')}`);
  const mentions = (...words: string[]) => words.some((w) => [...topicText].some((t) => t.startsWith(w)));
  const category = classification.category;
  const detail = {
    formations: category === 'formation' || mentions('formation', 'cours', 'programme', 'module', 'inscri', 'certific', 'stage'),
    services: category === 'commercial' || category === 'project' || mentions('service', 'prix', 'tarif', 'devis', 'abonnement', 'saas', 'offre', 'logiciel', 'application', 'site'),
    projects: category === 'project' || mentions('projet', 'realisation', 'reference', 'client'),
  };

  const solutionsText = companyData.solutions
    .map((s: any) => `- **${cleanText(s.title || s.name)}** : ${firstSentence(s.description, 100)}`)
    .join('\n');
  const partnersText = companyData.collaborations.map((c: any) => cleanText(c.name)).join(', ');
  const teamText = companyData.team
    .filter((t: any) => t?.name)
    .map((t: any) => `${t.name} (${t.role})`)
    .join(', ');
  const faqText = relevantFaq(companyData.faq, message)
    .map((f: any) => `Q : ${cleanText(f.question)}\nR : ${cleanText(f.answer)}`)
    .join('\n\n');

  const known = leadInfo
    ? [
        leadInfo.name && `nom ${leadInfo.name}`,
        leadInfo.email && `e-mail ${leadInfo.email}`,
        leadInfo.phone && `téléphone ${leadInfo.phone}`,
        leadInfo.company && `entreprise ${leadInfo.company}`,
        leadInfo.budget && `budget ${leadInfo.budget}`,
        leadInfo.interest && `intérêt ${leadInfo.interest}`,
      ].filter(Boolean).join(', ')
    : '';

  const hint = CATEGORY_HINTS[category] || CATEGORY_HINTS.general;

  return `Tu es HARVEY, conseiller commercial et assistant virtuel d'UNITECH : ${cleanText(companyData.description)}${companyData.founder ? ` Fondateur : ${companyData.founder}.` : ''}

## RÈGLES
- Réponds dans la langue du visiteur, chaleureux et professionnel. ${conversationStarted
    ? 'Conversation en cours : ni salutation ni formule creuse, enchaîne sur le fond, ne redemande pas ce qui est déjà donné.'
    : 'Premier message : une phrase de salutation au plus.'}
- 60 à 150 mots sauf demande de détail ; listes « - » pour énumérer, **gras** pour les noms ; ne répète pas la question.
- Termine par UNE seule proposition d'action (devis, inscription, rendez-vous, catalogue, mise en relation).
- Exactitude : n'utilise que les données ci-dessous. Prix (en FCFA), horaires, durées, programmes et noms se recopient tels quels. Si une information manque, dis-le et propose la mise en relation. N'invente jamais prix, date, remise, délai ou coordonnée. Le catalogue prime sur la FAQ.
- Rôle commercial : comprends le besoin (une question à la fois), recommande l'offre adaptée avec prix et lien, et dès qu'un intérêt réel apparaît, propose de laisser nom et e-mail ou téléphone pour être recontacté.
- Formations : propose d'envoyer le catalogue complet par e-mail et demande l'adresse, par exemple « Parfait, je prépare le catalogue complet de nos formations (programmes détaillés, tarifs, dates). Pour vous l'envoyer, indiquez simplement l'adresse email à laquelle vous souhaitez le recevoir. » Le système l'envoie dès que l'adresse est donnée ; ne dis jamais qu'il est envoyé avant.
- Hors sujet (sans rapport avec UNITECH, le numérique, l'IA, l'énergie ou la formation) : dis poliment que tu es là pour UNITECH. Aucun conseil médical, juridique ou financier.

## INTENTION PROBABLE (indice de DONA, à vérifier)
${hint}

## CONTACT (seules coordonnées à donner)
E-mail ${CONTACT.email} · Téléphone ${CONTACT.phone} · Contact et devis ${CONTACT.site}/contact
${known ? `\n## DÉJÀ DONNÉ PAR LE VISITEUR\n${known}\n` : ''}
## FORMATIONS
${formatFormations(companyData.formations, detail.formations) || 'Aucune.'}

## SERVICES
${formatServices(companyData.services, detail.services) || 'Aucun.'}

## SOLUTIONS
${solutionsText || 'Aucune.'}

## PROJETS ET RÉALISATIONS
${formatProjects(companyData.projects, detail.projects) || 'Aucun.'}

Partenaires : ${partnersText || 'non renseignés'}. Équipe : ${teamText || 'non renseignée'}.${faqText ? `\n\n## FAQ PERTINENTE\n${faqText}` : ''}`;
}

// ============================================================
// POST /api/ai/chat
// ============================================================

export async function POST(request: NextRequest) {
  try {
    // Chatbot public : limite par IP et plafond global pour préserver les quotas IA
    const ip = clientIp(request);
    if (
      !takeToken(`chat:ip:${ip}`, CHAT_LIMIT_PER_IP, CHAT_WINDOW_MS) ||
      !takeToken('chat:global', CHAT_LIMIT_GLOBAL, CHAT_WINDOW_MS)
    ) {
      return NextResponse.json(
        {
          success: false,
          content: 'Vous envoyez beaucoup de messages. Merci de patienter quelques minutes avant de réessayer.',
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { message, history = [], sessionId, tone = 'friendly' } = body;
    // Bornés côté serveur : le client ne choisit pas le coût d'une réponse
    const temperature = Math.min(Math.max(Number(body.temperature) || 0.7, 0), 1);
    const maxTokens = Math.min(Math.max(Number(body.maxTokens) || 600, 1), MAX_RESPONSE_TOKENS);

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

    // ✅ 5 bis. Catalogue des formations : demandé ou proposé, et le visiteur
    // donne son adresse → dépôt dans la file d'envoi UNITECH, réponse fixe
    let catalogueContent: string | null = null;
    const catalogueEmail = catalogueRecipient(safeMessage, cleanHistory);
    if (catalogueEmail) {
      if (recentlySent(catalogueEmail)) {
        catalogueContent = catalogueReply('deja_envoye', catalogueEmail);
      } else if (!takeToken(`catalogue:${sessionId || ip}`, CATALOGUE_PER_SESSION, CATALOGUE_WINDOW_MS)) {
        catalogueContent = catalogueReply('limite', catalogueEmail);
      } else {
        const result = await envoyerCatalogue(supabase, catalogueEmail);
        console.log(`📚 HARVEY: catalogue des formations → ${result}`);
        catalogueContent = catalogueReply(result, catalogueEmail);
      }
      // Le lead garde la trace de la demande
      if (!leadInfo.interest) leadInfo.interest = 'Catalogue des formations';
    }

    // ✅ 6. Construire le prompt : règles et données en système, puis la
    // conversation sous forme de vrais échanges
    const systemPrompt = buildSystemPrompt(safeMessage, cleanHistory, companyData, classification, leadInfo);
    console.log(`📏 HARVEY: prompt système de ${systemPrompt.length} caractères`);

    // ✅ 7. Essayer d'utiliser le LLM
    let llmResponse: string | null = null;
    let providerName = catalogueContent ? 'catalogue' : 'fallback';
    if (!catalogueContent) try {
      const apiKey = await keyManagement.getBestApiKey();

      if (apiKey) {
        console.log(
          `🔑 Clé trouvée: ${apiKey.provider?.display_name || 'Inconnu'} (${apiKey.key_name})`
        );
        await keyManagement.incrementUsage(apiKey.id);

        const result = await generateWithFallback({
          messages: [
            { role: 'system', content: systemPrompt },
            ...toChatTurns(cleanHistory, safeMessage),
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
      catalogueContent || llmResponse || generateFallbackWithDona(safeMessage, classification, companyData);

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
      fallback: !llmResponse && !catalogueContent,
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