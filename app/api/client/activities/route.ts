// app/api/client/activities/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    // Récupérer le token de session
    const sessionToken = req.cookies.get('client_session_token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Récupérer le client
    const { data: session, error: sessionError } = await supabase
      .from('client_sessions')
      .select('client_id')
      .eq('token', sessionToken)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session invalide' },
        { status: 401 }
      );
    }

    const clientId = session.client_id;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // ✅ Récupérer les activités récentes depuis email_conversations
    const { data: activities, error } = await supabase
      .from('email_conversations')
      .select(`
        id,
        from_email,
        subject,
        message,
        agent_response,
        status,
        confidence,
        created_at,
        sent_at
      `)
      .eq('from_email', (await supabase
        .from('clients')
        .select('email')
        .eq('id', clientId)
        .single()
      ).data?.email || '')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erreur récupération activités:', error);
      
      // Si la table n'existe pas, retourner un tableau vide
      if (error.code === '42P01') {
        return NextResponse.json({
          success: true,
          data: []
        });
      }
      
      return NextResponse.json(
        { error: 'Erreur serveur' },
        { status: 500 }
      );
    }

    // Transformer les données
    const formattedActivities = (activities || []).map((activity: any) => ({
      id: activity.id,
      type: activity.agent_response ? 'email' : 'recruitment',
      message: activity.subject || 'Activité',
      date: activity.created_at,
      status: activity.status || 'pending'
    }));

    return NextResponse.json({
      success: true,
      data: formattedActivities
    });

  } catch (error) {
    console.error('Erreur activités:', error);
    return NextResponse.json({
      success: true,
      data: []
    });
  }
}