// app/api/ai/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dona } from '@/lib/agents/dona/processor';
import { generateWithFallback } from '@/lib/config/llm';
import { keyManagement } from '@/lib/services/KeyManagementService';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

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

    const { data: company, error: companyError } = await supabase
      .from('company_data')
      .select('*')
      .single();

    if (companyError) console.error('❌ Erreur company_data:', companyError);

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
      name: company?.name || 'UNITECH',
      description: company?.description || 'Solutions technologiques innovantes',
      founder: company?.founder || 'Laye Soma',
      services: services || [],
      formations: formations || [],
      projects: projects || [],
      solutions: solutions || [],
      collaborations: collaborations || [],
      team: company?.team || [{ name: 'Laye Soma', role: 'Fondateur & CEO' }],
      faq: faq || [],
      pricing: company?.pricing || {},
      missions: company?.missions || [],
    };

  } catch (error) {
    console.error('❌ Erreur récupération données:', error);
    return getDefaultCompanyData();
  }
}

function getDefaultCompanyData(): CompanyData {
  return {
    name: 'UNITECH',
    description: "Solutions technologiques intelligentes pour l'éducation, l'industrie et la formation professionnelle.",
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
// CONSTRUCTION DU PROMPT
// ============================================================

function buildPromptWithContext(
  message: string,
  history: Array<{ role: string; content: string }>,
  companyData: CompanyData,
  classification: any
): string {
  const servicesText = companyData.services.map((s: any) => 
    `- **${s.name}**: ${s.description || ''} ${s.features || ''} (${s.slug || '/'}) ${s.is_active || 'false'}`
  ).join('\n');

  const formationsText = companyData.formations.map((f: any) => 
    `- **${f.title}**: ${f.duration || ''} (${f.level || 'Tous niveaux'}) (${f.description || 'Tous niveaux'}) (${f.icon || 'Tous niveaux'})  (${f.prix || 'Tous niveaux'}) (${f.modules || 'Tous niveaux'})`
  ).join('\n');

  const projectsText = companyData.projects.map((p: any) => 
    `- **${p.name}**: ${p.status || 'En cours'} (${p.progress || 0})% (${p.slug || '/'})  (${p.description || '/'})`
  ).join('\n');

  const solutionsText = companyData.solutions.map((s: any) => 
    `- **${s.title || s.name}**: ${s.description || ''} (${s.link_url || '/'}) ${s.is_active || 'false'}`
  ).join('\n');

  const collaborationsText = companyData.collaborations.map((c: any) => 
    `- **${c.name}**: ${c.type || 'Partenariat'} - ${c.status || 'Actif' } ${c.site || '' }`
  ).join('\n');

  const faqText = companyData.faq.map((f: any) => 
    `Q: ${f.question}\nR: ${f.answer}`
  ).join('\n\n');

  const teamText = companyData.team.map((t: any) => 
    `- ${t.name}: ${t.role}`
  ).join('\n');

  const historyText = history.length > 0 
    ? history.map((h: { role: string; content: string }) => 
        `${h.role === 'user' ? 'Utilisateur' : 'HARVEY'}: ${h.content}`
      ).join('\n')
    : 'Aucun historique';

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

  return `Tu es HARVEY, le conseiller IA de UNITECH.

## IDENTITÉ
- Tu es HARVEY, un consultant expert de UNITECH
- Tu es professionnel, courtois, précis et utile
- Tu réponds dans la même langue que l'utilisateur
- Tu peux faire des blagues et sympathiser

## RÈGLES IMPORTANTES
1. Utilise les informations de l'entreprise ci-dessous
2. Si la question est hors sujet, dis-le poliment
3. Propose une action concrète en fin de réponse
4. Sois professionnel mais accessible
5. Pour les lien des progets https://unitech-qvgo.onrender.com/projects , par proget https://unitech-qvgo.onrender.com/projects/<slug> suivi du slug du proget 
6. pour les formation https://unitech-qvgo.onrender.com/training  , par formation https://unitech-qvgo.onrender.com/training/<slug> suivi du slug de la formation
7. pour les services https://unitech-qvgo.onrender.com/services , par service https://unitech-qvgo.onrender.com/services/<slug> suivi du slug du service
8. Pour la page de contacte https://unitech-qvgo.onrender.com/contact 
9. Pour le contact via le mail adresse est doumbialayesma@gmail.com



## CLASSIFICATION DONA
- Catégorie: ${classification.category}
- Confiance: ${classification.confidence}%
- Mots-clés: ${classification.matched_keywords.join(', ')}

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

## HISTORIQUE
${historyText}

## QUESTION
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
      tone = 'friendly',
      temperature = 0.7,
      maxTokens = 600
    } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          content: "Je n'ai pas compris votre demande. Pouvez-vous reformuler ?" 
        },
        { status: 400 }
      );
    }

    console.log(`🤖 HARVEY: Message reçu: "${message.substring(0, 50)}..."`);

    const classification = await classifyWithDona(message);
    console.log(`🧠 DONA: ${classification.category} (${classification.confidence}%)`);

    const companyData = await getCompanyData();

    const prompt = buildPromptWithContext(message, history, companyData, classification);

    try {
      const apiKey = await keyManagement.getBestApiKey('openai');
      
      if (apiKey) {
        console.log(`🔑 Clé API: ${apiKey.key_name || 'sans nom'}`);
        await keyManagement.incrementUsage(apiKey.id);
        
        const result = await generateWithFallback({
          messages: [
            {
              role: 'system',
              content: `Tu es HARVEY, le conseiller IA de UNITECH. Réponds de manière précise et utile. Si la question est hors sujet, dis-le poliment.`,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: temperature,
          max_tokens: maxTokens,
        });

        if (result?.content) {
          console.log(`✅ HARVEY: Réponse générée (provider: ${result.provider})`);
          return NextResponse.json({
            success: true,
            content: result.content,
            provider: result.provider,
            category: classification.category,
            confidence: classification.confidence,
          });
        }
      } else {
        console.warn('⚠️ Aucune clé API disponible');
      }
    } catch (llmError: any) {
      console.warn('⚠️ Erreur LLM:', llmError.message);
      
      const apiKey = await keyManagement.getBestApiKey('openai');
      if (apiKey) {
        await keyManagement.markError(apiKey.id, llmError.message);
      }
    }

    console.log(`📝 Fallback (LLM indisponible)`);
    const fallbackContent = generateFallbackWithDona(message, classification, companyData);

    return NextResponse.json({
      success: true,
      content: fallbackContent,
      fallback: true,
      category: classification.category,
      confidence: classification.confidence,
    });

  } catch (error: any) {
    console.error('❌ Erreur:', error);
    return NextResponse.json(
      { 
        success: false, 
        content: "Je rencontre un problème technique. Veuillez réessayer."
      },
      { status: 500 }
    );
  }
}

// ============================================================
// FALLBACK - UNIQUEMENT SI LE LLM ÉCHOUÉ
// ============================================================

function generateFallbackWithDona(message: string, classification: any, companyData: CompanyData): string {
  const { category, matched_keywords } = classification;

  // ✅ Typage explicite pour la vérification des salutations
  const greetings: string[] = ['bonjour', 'salut', 'hello', 'coucou', 'hey'];
  
  // ✅ Correction avec typage explicite pour 'k'
  const isGreeting = matched_keywords.some((k: string) => greetings.includes(k));

  if (category === 'general' && isGreeting) {
    return `Bonjour ! 👋 Je suis HARVEY, l'assistant de UNITECH.

Comment puis-je vous aider aujourd'hui ? Je peux vous renseigner sur :
• Nos services et solutions
• Nos agents IA (DONA et HARVEY)
• Nos projets et formations
• Notre équipe
• Comment nous contacter

Posez-moi votre question ! 💬`;
  }

  if (category === 'general' && classification.confidence < 40) {
    return `Je suis HARVEY, l'assistant de UNITECH. 🤖

Je suis spécialisé dans les questions concernant UNITECH et ses services.

Je peux vous renseigner sur :
• Nos services et solutions technologiques
• Nos agents IA (DONA et HARVEY)
• Nos projets et formations
• Notre équipe
• Comment nous contacter

Si vous avez une question sur ces sujets, je serai ravi de vous aider ! 💬`;
  }

  return `Je suis HARVEY, l'assistant de UNITECH. 🤖

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
    message: 'HARVEY API with DONA classification - All questions go to LLM',
    version: '2.1.0',
    data: {
      services: companyData.services.length,
      formations: companyData.formations.length,
      projects: companyData.projects.length,
      solutions: companyData.solutions.length,
      collaborations: companyData.collaborations.length,
      faq: companyData.faq.length,
    },
    timestamp: new Date().toISOString()
  });
}