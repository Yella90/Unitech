// app/api/auth/client/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { supabaseServer as supabase } from '@/lib/supabase-admin';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { deposerEmail, envoiDisponible } from '@/lib/email/mail-sortant';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      email, 
      password, 
      first_name, 
      last_name, 
      company_name, 
      phone 
    } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format d\'email invalide' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      );
    }

    const { data: existingClient, error: checkError } = await supabase
      .from('clients')
      .select('email')
      .eq('email', email)
      .single();

    if (existingClient) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 409 }
      );
    }

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Erreur vérification email:', checkError);
      return NextResponse.json(
        { error: 'Erreur lors de la vérification' },
        { status: 500 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const verificationToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    if (!supabaseAdmin) {
      console.error('❌ supabaseAdmin n\'est pas disponible');
      return NextResponse.json(
        { error: 'Erreur de configuration serveur' },
        { status: 500 }
      );
    }

    // Récupérer l'IP correctement
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                      req.headers.get('x-real-ip') || 
                      'unknown';

    const { data: client, error: createError } = await supabaseAdmin
      .from('clients')
      .insert({
        email,
        password_hash: passwordHash,
        first_name: first_name || null,
        last_name: last_name || null,
        company_name: company_name || null,
        phone: phone || null,
        subscription_plan: 'free',
        credits_balance: 50,
        is_active: true,
        email_verified: false,
        verification_token: verificationToken,
        created_at: new Date().toISOString()
      })
      .select('id, email, first_name, last_name, company_name, subscription_plan, credits_balance, email_verified')
      .single();

    if (createError) {
      console.error('❌ Erreur création client:', createError);
      
      if (createError.code === '23505') {
        return NextResponse.json(
          { error: 'Cet email est déjà utilisé' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Erreur lors de la création du compte' },
        { status: 500 }
      );
    }

    console.log('✅ Client créé avec succès:', client.id);

    const { error: verifyError } = await supabaseAdmin
      .from('email_verifications')
      .insert({
        client_id: client.id,
        email: client.email,
        token: verificationToken,
        expires_at: expiresAt.toISOString()
      });

    if (verifyError) {
      console.error('❌ Erreur sauvegarde token de vérification:', verifyError);
    }

    // E-mail de vérification via la file d'envoi commune (la fonction
    // add_verification_email appelée auparavant n'existe pas en base)
    if (envoiDisponible()) {
      try {
        const appUrl = (process.env.APP_URL || 'https://unitech-qvgo.onrender.com').replace(/\/$/, '');
        const link = `${appUrl}/api/auth/client/verify?token=${verificationToken}`;
        await deposerEmail({
          destinataire: client.email,
          objet: 'Confirmez votre adresse e-mail UNITECH',
          titre: 'Bienvenue chez UNITECH',
          message: [
            client.first_name ? `Bonjour ${client.first_name},` : 'Bonjour,',
            '',
            'Votre espace client UNITECH est créé. Confirmez votre adresse e-mail en cliquant sur ce lien :',
            link,
            '',
            "Si vous n'êtes pas à l'origine de cette inscription, ignorez cet e-mail.",
            '',
            "L'équipe UNITECH",
          ].join('\n'),
        });
      } catch (queueError) {
        console.error('❌ E-mail de vérification non déposé:', queueError);
      }
    }

    const sessionToken = randomBytes(32).toString('hex');
    const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const { error: sessionError } = await supabaseAdmin
      .from('client_sessions')
      .insert({
        client_id: client.id,
        token: sessionToken,
        expires_at: sessionExpiresAt.toISOString(),
        ip_address: ipAddress,
        user_agent: req.headers.get('user-agent') || 'unknown',
        is_active: true
      });

    if (sessionError) {
      console.error('❌ Erreur création session:', sessionError);
    }

    const response = NextResponse.json({
      success: true,
      message: 'Compte créé avec succès. Un email de vérification vous a été envoyé.',
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

    response.cookies.set('client_session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('❌ Erreur inscription:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l\'inscription' },
      { status: 500 }
    );
  }
}