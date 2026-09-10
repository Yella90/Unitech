// app/api/harvey/regenerate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    // 1. Récupérer le cookie de session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      console.log('❌ Pas de session_token dans les cookies');
      return NextResponse.json(
        { error: 'Non authentifié - Session manquante' },
        { status: 401 }
      );
    }

    console.log('🔑 session_token trouvé:', sessionToken.substring(0, 20) + '...');

    // 2. Vérifier la session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*, users(*)')
      .eq('token', sessionToken)
      .single();

    if (sessionError || !session) {
      console.log('❌ Session invalide:', sessionError);
      return NextResponse.json(
        { error: 'Session invalide' },
        { status: 401 }
      );
    }

    // 3. Vérifier l'expiration
    if (new Date(session.expires_at) < new Date()) {
      console.log('❌ Session expirée:', session.expires_at);
      return NextResponse.json(
        { error: 'Session expirée' },
        { status: 401 }
      );
    }

    const user = session.users;
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 403 }
      );
    }

    // 4. Vérifier les rôles admin
    const adminRoles = ['admin', 'super_admin', 'developer'];
    if (!adminRoles.includes(user.role)) {
      console.log(`❌ Rôle non admin: ${user.role}`);
      return NextResponse.json(
        { error: 'Accès non autorisé - Rôle administrateur requis' },
        { status: 403 }
      );
    }

    console.log(`✅ Admin authentifié: ${user.email} (${user.role})`);

    // 5. Récupérer l'ID de la conversation
    const body = await req.json();
    const { conversationId } = body;

    if (!conversationId) {
      return NextResponse.json(
        { error: 'ID de conversation requis' },
        { status: 400 }
      );
    }

    console.log(`🔄 Régénération: ${conversationId}`);

    // 6. Récupérer la conversation
    const { data: conversation, error: convError } = await supabase
      .from('email_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation non trouvée' },
        { status: 404 }
      );
    }

    // 7. Récupérer l'email source
    const { data: email, error: emailError } = await supabase
      .from('emails')
      .select('*')
      .eq('id', conversation.email_id)
      .single();

    // 8. Supprimer la conversation
    await supabase
      .from('email_conversations')
      .delete()
      .eq('id', conversationId);

    if (emailError || !email) {
      return NextResponse.json({
        success: true,
        message: 'Conversation supprimée (email source non trouvé)',
        data: { conversation_id: conversationId }
      });
    }

    // 9. Remettre l'email en 'pending'
    await supabase
      .from('emails')
      .update({
        status: 'pending',
        harvey_response: null,
        harvey_confidence: null,
        harvey_tone: null,
        harvey_actions: null,
        processed_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', email.id);

    return NextResponse.json({
      success: true,
      message: 'Email réinitialisé pour régénération',
      data: {
        conversation_id: conversationId,
        email_id: email.id,
        status: 'pending'
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur régénération:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la régénération' },
      { status: 500 }
    );
  }
}