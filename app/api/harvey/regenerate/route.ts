// app/api/harvey/regenerate/route.ts
import { NextResponse } from 'next/server';
import { harvey } from '@/lib/agents/harvey';
import { supabase } from '@/lib/supabase';
import { authorizationErrorResponse, requirePermission } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    await requirePermission('ai.regenerate');
    const { conversationId } = await request.json();

    if (!conversationId) {
      return NextResponse.json(
        { error: 'ID de conversation requis' },
        { status: 400 }
      );
    }

    // Récupérer la conversation
    const { data: conversation, error: findError } = await supabase
      .from('email_conversations')
      .select('email_id')
      .eq('id', conversationId)
      .single();

    if (findError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation non trouvée' },
        { status: 404 }
      );
    }

    // Supprimer l'ancienne réponse
    await supabase
      .from('email_conversations')
      .delete()
      .eq('id', conversationId);

    // Générer une nouvelle réponse
    const response = await harvey.generateResponse(conversation.email_id);

    if (!response) {
      return NextResponse.json(
        { error: 'Erreur lors de la régénération' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      response 
    });

  } catch (error: unknown) {
    const authorizationResponse = authorizationErrorResponse(error);
    if (authorizationResponse) return authorizationResponse;
    console.error('Erreur régénération:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur interne' },
      { status: 500 }
    );
  }
}
