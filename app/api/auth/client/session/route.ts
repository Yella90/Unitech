// app/api/auth/client/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('client_session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // ✅ Vérifier la session
    const { data: session, error: sessionError } = await supabase
      .from('client_sessions')
      .select('*, clients(*)')
      .eq('token', sessionToken)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      // Supprimer le cookie invalide
      const response = NextResponse.json({ user: null });
      response.cookies.delete('client_session_token');
      return response;
    }

    // ✅ Mettre à jour la dernière activité
    await supabase
      .from('client_sessions')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', session.id);

    const client = session.clients;

    return NextResponse.json({
      user: {
        id: client.id,
        email: client.email,
        first_name: client.first_name,
        last_name: client.last_name,
        company_name: client.company_name,
        subscription_plan: client.subscription_plan,
        credits_balance: client.credits_balance,
        email_verified: client.email_verified
      }
    });

  } catch (error) {
    console.error('❌ Erreur session:', error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}