// app/api/auth/client/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('client_session_token')?.value;

    if (sessionToken) {
      // Désactiver la session
      await supabase
        .from('client_sessions')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('token', sessionToken);
    }

    const response = NextResponse.json({
      success: true,
      message: 'Déconnecté avec succès'
    });

    // Supprimer le cookie
    response.cookies.delete('client_session_token');

    return response;

  } catch (error) {
    console.error('❌ Erreur déconnexion:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la déconnexion' },
      { status: 500 }
    );
  }
}