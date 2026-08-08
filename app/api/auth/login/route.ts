// app/api/auth/login/route.ts
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const adminClient = supabaseAdmin ?? supabase;
   

    // 1. Vérifier les identifiants
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role, password_hash')
      .eq('email', email)
      .single();
console.log('User fetched:', user, 'Error:', error);
    if (error || !user) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    // 2. Vérifier le mot de passe (à implémenter avec bcrypt)
   
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }
    console.log('User authenticated:', user);

    // 3. Créer une session (session token)
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 24 * 7 * 1000).toISOString();

    // 4. Enregistrer la session côté serveur
    const { error: sessionError } = await adminClient
      .from('sessions')
      .insert({
        token: sessionToken,
        user_id: user.id,
        expires_at: expiresAt,
      });

    if (sessionError) {
      console.error('Session insert error:', sessionError);
      return NextResponse.json(
        { error: 'Impossible de créer la session' },
        { status: 500 }
      );
    }

    // 5. Stocker la session dans un cookie
    const cookieStore = await cookies();
    cookieStore.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      path: '/',
    });

    // 6. Mettre à jour la date de dernière connexion
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // 7. Retourner les infos utilisateur (sans le mot de passe)
    const { password_hash, ...userWithoutPassword } = user;
    return NextResponse.json({ 
      success: true, 
      user: userWithoutPassword 
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la connexion' },
      { status: 500 }
    );
  }
}