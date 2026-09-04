// app/api/client/mail/configure/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { authenticateAPIRequest } from '@/lib/api/auth';
import crypto from 'crypto';

// ✅ Clé de chiffrement (à mettre dans .env)
const ENCRYPTION_KEY = process.env.EMAIL_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

// ✅ Fonction pour chiffrer le mot de passe
function encryptPassword(password: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// ✅ Fonction pour récupérer le client admin
function getAdminClient() {
  if (!supabaseAdmin) {
    throw new Error('supabaseAdmin n\'est pas disponible');
  }
  return supabaseAdmin;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authentification
    const authResult = await authenticateAPIRequest(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    const client = authResult.client;
    const body = await req.json();

    const {
      email,
      imap_server,
      imap_port,
      smtp_server,
      smtp_port,
      password,
      encryption,
      prompt_config
    } = body;

    // 2. Validation
    if (!email || !imap_server || !smtp_server || !password) {
      return NextResponse.json(
        { error: 'Email, serveurs IMAP/SMTP et mot de passe requis' },
        { status: 400 }
      );
    }

    // 3. Vérifier si le service mail est actif
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id')
      .eq('slug', 'mail-automation')
      .eq('is_active', true)
      .single();

    if (serviceError || !service) {
      return NextResponse.json(
        { error: 'Service d\'automatisation mail non disponible' },
        { status: 403 }
      );
    }

    // 4. Vérifier si le client est souscrit au service
    const { data: subscription, error: subError } = await supabase
      .from('client_services')
      .select('id')
      .eq('client_id', client.id)
      .eq('service_id', service.id)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Vous devez souscrire au service Automation Mail' },
        { status: 403 }
      );
    }

    // 5. Chiffrer le mot de passe
    const encryptedPassword = encryptPassword(password);
    const adminClient = getAdminClient();

    // 6. Vérifier si un compte mail existe déjà
    const { data: existing, error: checkError } = await adminClient
      .from('mail_accounts')
      .select('id')
      .eq('client_id', client.id)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Erreur vérification compte existant:', checkError);
    }

    let result;

    // 7. Créer ou mettre à jour le compte mail
    if (existing) {
      // ✅ Mise à jour
      const { data, error } = await adminClient
        .from('mail_accounts')
        .update({
          email,
          imap_server,
          imap_port: imap_port || 993,
          smtp_server,
          smtp_port: smtp_port || 587,
          email_password: encryptedPassword,
          encryption: encryption || 'tls',
          prompt_config: prompt_config || {
            instructions: '',
            tone: 'professional',
            signature: "L'équipe UNITECH",
            custom_rules: []
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // ✅ Création
      const { data, error } = await adminClient
        .from('mail_accounts')
        .insert({
          client_id: client.id,
          email,
          imap_server,
          imap_port: imap_port || 993,
          smtp_server,
          smtp_port: smtp_port || 587,
          email_password: encryptedPassword,
          encryption: encryption || 'tls',
          prompt_config: prompt_config || {
            instructions: '',
            tone: 'professional',
            signature: "L'équipe UNITECH",
            custom_rules: []
          },
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // 8. Synchroniser immédiatement
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/mail/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mailAccountId: result.id })
      });
    } catch (syncError) {
      console.warn('⚠️ Erreur synchronisation initiale:', syncError);
    }

    console.log(`✅ Compte mail configuré pour ${client.email}`);

    return NextResponse.json({
      success: true,
      message: 'Compte mail configuré avec succès',
      data: {
        id: result.id,
        email: result.email,
        imap_server: result.imap_server,
        smtp_server: result.smtp_server,
        is_connected: result.is_connected || false,
        prompt_config: result.prompt_config || {}
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur configuration mail:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la configuration' },
      { status: 500 }
    );
  }
}