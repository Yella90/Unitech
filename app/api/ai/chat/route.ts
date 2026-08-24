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

    // 1. Récupérer les services
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (servicesError) console.error('❌ Erreur services:', servicesError);

    // 2. Récupérer les formations
    const { data: formations, error: formationsError } = await supabase
      .from('trainings')
      .select('*')
      .order('created_at', { ascending: false });

    if (formationsError) console.error('❌ Erreur formations:', formationsError);

    // 3. Récupérer les projets
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (projectsError) console.error('❌ Erreur projets:', projectsError);

    // 4. Récupérer les solutions
    const { data: solutions, error: solutionsError } = await supabase
      .from('solutions')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (solutionsError) console.error('❌ Erreur solutions:', solutionsError);

    // 5. Récupérer les collaborations
    const { data: collaborations, error: collaborationsError } = await supabase
      .from('collaborations')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (collaborationsError) console.error('❌ Erreur collaborations:', collaborationsError);

    // 6. Récupérer les données de l'entreprise
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

    // 7. Récupérer la FAQ
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
      name: companyData?.name || 'UNITECH',
      description: companyData?.description || 'Solutions technologiques innovantes',
      founder: companyData?.founder || 'Laye Soma',
      services: services || [],
      formations: formations || [],
      projects: projects || [],
      solutions: solutions || [],
      collaborations: collaborations || [],
      team: companyData?.team || [{ name: 'Laye Soma', role: 'Fondateur & CEO' }],
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
  // Services
  const servicesText = companyData.services.map((s: any) => 
    `- **${s.name}**: ${s.description || ''}${s.features ? ` (${s.features.join(', ')})` : ''}`
  ).join('\n');

  // Formations
  const formationsText = companyData.formations.map((f: any) => 
    `- **${f.name || f.title}**: ${f.duration || ''} (${f.level || 'Tous niveaux'})${f.technologies ? ` - Technologies: ${f.technologies.join(', ')}` : ''}`
  ).join('\n');

  // Projets
  const projectsText = companyData.projects.map((p: any) => 
    `- **${p.name}**: ${p.status || 'En cours'} (${p.progress || 0}%) - ${p.description || ''}`
  ).join('\n');

  // Solutions
  const solutionsText = companyData.solutions.map((s: any) => 
    `- **${s.title || s.name}**: ${s.description || ''}`
  ).join('\n');

  // Collaborations
  const collaborationsText = companyData.collaborations.map((c: any) => 
    `- **${c.name}**: ${c.type || 'Partenariat'} - ${c.status || 'Actif'}`
  ).join('\n');

  // FAQ
  const faqText = companyData.faq.map((f: any) => 
    `Q: ${f.question}\nR: ${f.answer}`
  ).join('\n\n');

  // Équipe
  const teamText = companyData.team.map((t: any) => 
    `- ${t.name}: ${t.role}`
  ).join('\n');

  // Historique
  const historyText = history.length > 0 
    ? history.map((h: { role: string; content: string }) => 
        `${h.role === 'user' ? 'Utilisateur' : 'HARVEY'}: ${h.content}`
      ).join('\n')
    : 'Aucun historique';

  // Instructions par catégorie
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
5. Pour les liens:
   - Projets: https://unitech-qvgo.onrender.com/projects/<slug>
   - Formations: https://unitech-qvgo.onrender.com/training/<slug>
   - Services: https://unitech-qvgo.onrender.com/services/<slug>
   - Contact: https://unitech-qvgo.onrender.com/contact
   - Email: doumbialayesoma@gmail.com

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
// POST /api/ai/chat - CORRIGÉ
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

    // ✅ 1. Classification avec DONA
    const classification = await classifyWithDona(message);
    console.log(`🧠 DONA: ${classification.category} (${classification.confidence}%)`);

    // ✅ 2. Récupérer les données de l'entreprise
    const companyData = await getCompanyData();

    // ✅ 3. Construire le prompt
    const prompt = buildPromptWithContext(message, history, companyData, classification);

    // ✅ 4. Essayer d'utiliser le LLM - SANS provider spécifique
    try {
      // ✅ Récupérer la meilleure clé disponible (n'importe quel provider)
      const apiKey = await keyManagement.getBestApiKey(); // ✅ PAS de provider spécifique
      
      if (apiKey) {
        console.log(`🔑 Clé trouvée: ${apiKey.provider?.display_name || 'Inconnu'} (${apiKey.key_name})`);
        console.log(`   Utilisations: ${apiKey.usage_count}, Erreurs: ${apiKey.error_count}`);
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
      
      // Tenter de marquer l'erreur si une clé a été utilisée
      try {
        const apiKey = await keyManagement.getBestApiKey();
        if (apiKey) {
          await keyManagement.markError(apiKey.id, llmError.message);
        }
      } catch (markError) {
        console.warn('⚠️ Erreur lors du marquage de l\'erreur:', markError);
      }
    }

    // ✅ 5. Fallback - UNIQUEMENT si le LLM échoue
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

  // Détection des salutations
  const greetings: string[] = ['bonjour', 'salut', 'hello', 'coucou', 'hey', 'bonsoir', 'bonsoir'];
  const isGreeting = matched_keywords.some((k: string) => greetings.includes(k));

  // Salutation
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

  // Question hors sujet
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

  // Réponse par défaut
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
      founder: companyData.founder,
    },
    timestamp: new Date().toISOString()
  });
}