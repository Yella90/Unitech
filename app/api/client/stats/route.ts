// app/api/client/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    // Récupérer la session client
    const sessionToken = req.cookies.get('client_session_token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer le client
    const { data: session, error: sessionError } = await supabase
      .from('client_sessions')
      .select('client_id')
      .eq('token', sessionToken)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
    }

    const clientId = session.client_id;

    // Récupérer les statistiques
    const [
      { count: totalEmails },
      { count: totalRecruitments },
      { count: totalCandidates },
      { data: client }
    ] = await Promise.all([
      supabase.from('emails').select('*', { count: 'exact', head: true }).eq('client_id', clientId),
      supabase.from('recruitments').select('*', { count: 'exact', head: true }).eq('client_id', clientId),
      supabase.from('candidates').select('*', { count: 'exact', head: true }).eq('client_id', clientId),
      supabase.from('clients').select('credits_balance, subscription_plan').eq('id', clientId).single()
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalEmails: totalEmails || 0,
        totalRecruitments: totalRecruitments || 0,
        totalCandidates: totalCandidates || 0,
        creditsBalance: client?.credits_balance || 0,
        activeServices: 0 // À implémenter
      }
    });

  } catch (error) {
    console.error('Erreur stats:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}