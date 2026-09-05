// app/api/client/mail/configure/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.EMAIL_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

// ✅ Fonction pour chiffrer le mot de passe
function encryptPassword(password: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function getAdminClient() {
  if (!supabaseAdmin) {
    throw new Error('supabaseAdmin n\'est pas disponible');
  }
  return supabaseAdmin;
}

// ✅ Fonction d'authentification avec cookies
async function authenticateClient(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('client_session_token')?.value;

    if (!sessionToken) {
      return { success: false, error: 'Non authentifié', status: 401 };
    }

    const { data: session, error: sessionError } = await supabase
      .from('client_sessions')
      .select('*, clients(*)')
      .eq('token', sessionToken)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return { success: false, error: 'Session invalide ou expirée', status: 401 };
    }

    const client = session.clients;
    if (!client) {
      return { success: false, error: 'Client non trouvé', status: 403 };
    }

    await supabase
      .from('client_sessions')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', session.id);

    return { success: true, client };
  } catch (error) {
    console.error('❌ Erreur authentification:', error);
    return { success: false, error: 'Erreur lors de l\'authentification', status: 500 };
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. 🔐 Authentification
    console.log('🔍 Début configuration mail...');
    const authResult = await authenticateClient(req);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    const client = authResult.client;
    console.log(`✅ Client authentifié: ${client.email} (ID: ${client.id})`);

    const body = await req.json();
    
    // 2. 📋 Récupération des données
    const {
      email,
      imap_server,
      imap_port,
      smtp_server,
      smtp_port,
      password,
      encryption,
      max_emails_per_sync,
      prompt_config,
      blocked_senders,
      blocked_domains,
      block_rules
    } = body;

    console.log('📧 Configuration reçue:', {
      email,
      imap_server,
      imap_port,
      smtp_server,
      smtp_port,
      hasPassword: !!password,
      blockedSendersCount: blocked_senders?.length || 0,
      blockedDomainsCount: blocked_domains?.length || 0
    });

    // 3. ✅ Validation
    if (!email || !imap_server || !smtp_server) {
      return NextResponse.json(
        { error: 'Email, serveurs IMAP/SMTP requis' },
        { status: 400 }
      );
    }

    const adminClient = getAdminClient();

    // 4. 🔍 Vérification du service
    let { data: service } = await adminClient
      .from('services')
      .select('id')
      .eq('slug', 'mail-automation')
      .maybeSingle();

    if (!service) {
      const { data: newService, error: createError } = await adminClient
        .from('services')
        .insert({
          name: 'Automation Mail',
          slug: 'mail-automation',
          description: 'Automatisation complète de vos emails avec IA.',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (createError || !newService) {
        console.error('❌ Erreur création service:', createError);
        return NextResponse.json(
          { error: 'Service d\'automatisation mail non disponible' },
          { status: 403 }
        );
      }
      service = newService;
      console.log('✅ Service créé:', service.id);
    }

    // 5. 📝 Gestion de la souscription
    let { data: subscription } = await adminClient
      .from('client_services')
      .select('id, status')
      .eq('client_id', client.id)
      .eq('service_id', service.id)
      .maybeSingle();

    if (!subscription) {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const { data: newSubscription, error: createError } = await adminClient
        .from('client_services')
        .insert({
          client_id: client.id,
          service_id: service.id,
          status: 'active',
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          auto_renew: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id, status')
        .single();

      if (createError) {
        console.error('❌ Erreur création souscription:', createError);
        return NextResponse.json(
          { error: 'Erreur lors de la création de la souscription' },
          { status: 500 }
        );
      }
      subscription = newSubscription;
      console.log('✅ Souscription créée:', subscription.id);
    } else if (subscription.status !== 'active') {
      await adminClient
        .from('client_services')
        .update({
          status: 'active',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);
      subscription.status = 'active';
      console.log('✅ Souscription réactivée');
    }

    // 6. 🔐 Préparation des données
    const encryptedPassword = password ? encryptPassword(password) : undefined;

    // 7. 📦 Construction du payload
    const mailData: any = {
      client_id: client.id,
      email,
      imap_server,
      imap_port: imap_port || 993,
      smtp_server,
      smtp_port: smtp_port || 587,
      encryption: encryption || 'tls',
      max_emails_per_sync: max_emails_per_sync || 50,
      prompt_config: prompt_config || {
        instructions: '',
        tone: 'professional',
        signature: "L'équipe UNITECH",
        custom_rules: []
      },
      // ✅ NOUVEAU: Données de blocage
      blocked_senders: blocked_senders || [],
      blocked_domains: blocked_domains || [],
      block_rules: block_rules || {
        block_spam: true,
        block_unknown: false,
        block_marketing: true,
        custom_rules: []
      },
      updated_at: new Date().toISOString()
    };

    if (encryptedPassword) {
      mailData.email_password = encryptedPassword;
    }

    // 8. 🔍 Vérifier si un compte existe déjà
    const { data: existing } = await adminClient
      .from('mail_accounts')
      .select('id')
      .eq('client_id', client.id)
      .maybeSingle();

    let result;

    if (existing) {
      console.log('📝 Mise à jour du compte existant:', existing.id);
      const { data, error } = await adminClient
        .from('mail_accounts')
        .update(mailData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur mise à jour:', error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
      result = data;
    } else {
      console.log('📝 Création d\'un nouveau compte');
      mailData.created_at = new Date().toISOString();
      mailData.is_active = true;

      const { data, error } = await adminClient
        .from('mail_accounts')
        .insert(mailData)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur création:', error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
      result = data;
    }

    console.log(`✅ Compte mail configuré pour ${client.email}`);

    return NextResponse.json({
      success: true,
      message: existing ? 'Configuration mise à jour' : 'Compte mail configuré avec succès',
      data: {
        id: result.id,
        email: result.email,
        imap_server: result.imap_server,
        smtp_server: result.smtp_server,
        is_connected: result.is_connected || false,
        blocked_senders: result.blocked_senders || [],
        blocked_domains: result.blocked_domains || []
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