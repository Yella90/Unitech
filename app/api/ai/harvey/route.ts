// app/api/ai/harvey/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { harvey } from '@/lib/agents/harvey/harvey';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    // 1. Récupérer les paramètres
    const body = await request.json();
    const {
      message,
      subject = 'Message via API',
      from = 'client@example.com',
      category = 'general',
      tone = 'friendly',
      responseType = 'json',
      context = {}
    } = body;

    // 2. Validation
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Message requis',
          content: "Je n'ai pas compris votre demande. Pouvez-vous reformuler ?"
        },
        { status: 400 }
      );
    }

    console.log(`🤖 HARVEY API: Message reçu: "${message.substring(0, 50)}..."`);

    // 3. Initialiser HARVEY
    await harvey.init();

    // 4. Préparer les données de l'email
    const emailData = {
      id: `api-${Date.now()}`,
      from_email: from,
      to_email: 'support@unitech.com',
      subject: subject || 'Demande client',
      body: message,
      category: category,
      priority: 'medium',
      assigned_agent: 'HARVEY',
      ai_analysis: {
        category: category,
        priority: 'medium',
        assigned_agent: 'HARVEY',
        confidence: 70,
        matched_keywords: [],
        summary: 'Demande via API',
        score: 0.7
      },
      received_at: new Date().toISOString(),
      status: 'analyzed'
    };

    // 5. Générer la réponse avec le vrai LLM
    const result = await harvey.generateFullResponse(emailData.id);

    if (!result) {
      // Fallback si HARVEY échoue
      return NextResponse.json({
        success: false,
        content: "Je rencontre actuellement un problème. Veuillez réessayer ou contacter notre équipe à contact@unitech.com.",
        tone: 'professional',
        actions: ['Contacter un conseiller'],
        requires_human_review: true,
        confidence: 0,
        suggested_agent: 'HUMAN',
        category: 'error',
        metadata: {
          word_count: 0,
          reading_time: 0,
          sentiment: 'neutral'
        },
        error: 'Harvey generation failed'
      }, { status: 500 });
    }

    // 6. Construire la réponse
    const response: any = {
      success: true,
      content: result.response.content,
      tone: result.response.tone,
      actions: result.response.actions,
      requires_human_review: result.response.requires_human_review,
      confidence: result.response.confidence,
      suggested_agent: result.response.suggested_agent,
      category: result.response.suggested_agent?.toLowerCase() === 'harvey' ? 'harvey' : category,
      metadata: result.response.metadata,
    };

    // Ajouter HTML si demandé
    if (responseType === 'html' || responseType === 'both') {
      response.html = result.html;
    }

    // Ajouter JSON si demandé
    if (responseType === 'json' || responseType === 'both') {
      response.json = result.json;
    }

    console.log(`✅ HARVEY API: Réponse générée avec succès (confiance: ${result.response.confidence}%)`);
    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ HARVEY API error:', error);
    
    // Réponse d'erreur avec fallback
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erreur interne',
        content: "Je rencontre actuellement un problème technique. Veuillez réessayer dans quelques instants ou contacter directement notre équipe à **contact@unitech.com**.",
        tone: 'professional',
        actions: ['Contacter un conseiller', 'Réessayer'],
        requires_human_review: true,
        confidence: 0,
        suggested_agent: 'HUMAN',
        category: 'error',
        metadata: {
          word_count: 0,
          reading_time: 0,
          sentiment: 'neutral'
        },
        fallback: true
      },
      { status: 500 }
    );
  }
}

// ✅ GET pour tester
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'HARVEY API is running with real LLM',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
}