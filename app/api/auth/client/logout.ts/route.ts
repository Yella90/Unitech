// app/api/auth/client/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('client_session_token')?.value;

    if (sessionToken) {
      // ✅ Désactiver la session
      await supabase
        .from('client_sessions')
        .update({ is_active: false })
        .eq('token', sessionToken);
    }

    // ✅ Supprimer le cookie
    const response = NextResponse.json({
      success: true,
      message: 'Déconnecté avec succès'
    });

    response.cookies.delete('client_session_token');

    return response;

  } catch (error) {
    console.error('❌ Erreur déconnexion:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}