// app/api/auth/login/route.ts
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // ✅ Normaliser email + password
    const email = (body.email || '').toLowerCase().trim();
    const password = (body.password || '').trim();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    // ✅ Vérifier que la clé service_role est bien configurée
    if (!supabaseAdmin) {
      console.error('❌ supabaseAdmin non initialisé (SUPABASE_SERVICE_ROLE_KEY manquante)');
      return NextResponse.json(
        { error: 'Configuration serveur invalide' },
        { status: 500 }
      );
    }

    // ✅ 1. Récupérer le user via le CLIENT ADMIN (bypass RLS)
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, role, is_active, password_hash')
      .eq('email', email)
      .maybeSingle();  // ✅ maybeSingle au lieu de single → pas de PGRST116

    if (error) {
      console.error('❌ Erreur SELECT users:', error);
      return NextResponse.json(
        { error: 'Erreur de connexion' },
        { status: 500 }
      );
    }

    if (!user) {
      // Sécurité : message générique (ne pas révéler si l'email existe)
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    // ✅ 2. Vérifier que le compte est actif
    if (user.is_active === false) {
      return NextResponse.json(
        { error: 'Compte désactivé. Contactez un administrateur.' },
        { status: 403 }
      );
    }

    // ✅ 3. Vérifier que le hash existe
    if (!user.password_hash) {
      console.error('❌ password_hash manquant pour', email);
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    // ✅ 4. Comparer le mot de passe
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.email, '/', user.role);

    // ✅ 5. Créer la session
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 24 * 7 * 1000).toISOString();

    const { error: sessionError } = await supabaseAdmin
      .from('sessions')
      .insert({
        token: sessionToken,
        user_id: user.id,
        expires_at: expiresAt,
      });

    if (sessionError) {
      console.error('❌ Session insert error:', sessionError);
      return NextResponse.json(
        { error: 'Impossible de créer la session' },
        { status: 500 }
      );
    }

    // ✅ 6. Cookie
    const cookieStore = await cookies();
    cookieStore.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    // ✅ 7. Update last_login (via admin client aussi)
    await supabaseAdmin
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // ✅ 8. Retourner le user sans le hash
    const { password_hash, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la connexion' },
      { status: 500 }
    );
  }
}