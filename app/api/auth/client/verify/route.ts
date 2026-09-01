// app/api/auth/client/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token de vérification requis' },
        { status: 400 }
      );
    }

    // ✅ Vérifier le token
    const { data: client, error } = await supabase
      .from('clients')
      .select('id, email_verified')
      .eq('verification_token', token)
      .single();

    if (error || !client) {
      return NextResponse.json(
        { error: 'Token invalide ou expiré' },
        { status: 400 }
      );
    }

    // ✅ Marquer l'email comme vérifié
    await supabase
      .from('clients')
      .update({
        email_verified: true,
        verification_token: null
      })
      .eq('id', client.id);

    // ✅ Rediriger vers le dashboard
    return NextResponse.redirect(
      new URL('/dashboard?verified=true', req.url)
    );

  } catch (error) {
    console.error('❌ Erreur vérification:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}