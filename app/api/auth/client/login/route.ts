// app/api/auth/client/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // ✅ Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    // ✅ Récupérer le client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('email', email)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    // ✅ Vérifier si le compte est actif
    if (!client.is_active) {
      return NextResponse.json(
        { error: 'Ce compte a été désactivé' },
        { status: 401 }
      );
    }

    // ✅ Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, client.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    // ✅ Créer une session
    const sessionToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

    const { error: sessionError } = await supabase
      .from('client_sessions')
      .insert({
        client_id: client.id,
        token: sessionToken,
        expires_at: expiresAt.toISOString(),
        ip_address: req.headers.get('x-forwarded-for') || req.ip || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown'
      });

    if (sessionError) {
      console.error('❌ Erreur création session:', sessionError);
      return NextResponse.json(
        { error: 'Erreur lors de la connexion' },
        { status: 500 }
      );
    }

    // ✅ Mettre à jour la dernière connexion
    await supabase
      .from('clients')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', client.id);

    // ✅ Préparer la réponse
    const response = NextResponse.json({
      success: true,
      message: 'Connexion réussie',
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

    // ✅ Définir le cookie de session
    response.cookies.set('client_session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('❌ Erreur connexion:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}