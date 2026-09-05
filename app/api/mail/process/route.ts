// app/api/mail/process/route.ts
// API Route pour le service d'automatisation des emails

import { NextRequest, NextResponse } from 'next/server';
import { harveyV2 } from '@/lib/agents/harvey-v2/HarveyV2';
import { authenticateClient } from '@/lib/api/auth';
import { supabase } from '@/lib/supabase';

// Configuration CORS
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'https://unitech-qvgo.onrender.com'
];

export async function POST(req: NextRequest) {
  try {
    // 1. Vérification CORS
    const origin = req.headers.get('origin');
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return NextResponse.json(
        { error: 'Origine non autorisée' },
        { status: 403 }
      );
    }

    // 2. Authentification
    const authResult = await authenticateClient(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Non authentifié' },
        { status: authResult.status || 401 }
      );
    }

    const client = authResult.client;
    console.log(`🔐 Client authentifié: ${client.email} (ID: ${client.id})`);

    // 3. Vérifier que le client a un compte mail configuré
    const { data: mailAccount, error: mailError } = await supabase
      .from('mail_accounts')
      .select('id, email, is_connected')
      .eq('client_id', client.id)
      .eq('is_active', true)
      .maybeSingle();

    if (mailError || !mailAccount) {
      return NextResponse.json(
        { 
          error: 'Aucun compte mail configuré. Veuillez configurer votre compte mail d\'abord.',
          code: 'NO_MAIL_ACCOUNT'
        },
        { status: 400 }
      );
    }

    if (!mailAccount.is_connected) {
      return NextResponse.json(
        { 
          error: 'Compte mail non connecté. Veuillez synchroniser vos emails d\'abord.',
          code: 'MAIL_NOT_CONNECTED'
        },
        { status: 400 }
      );
    }

    // 4. Initialiser Harvey V2
    const initResult = await harveyV2.init();
    if (!initResult.success) {
      return NextResponse.json(
        { 
          error: initResult.error || 'Erreur d\'initialisation du service',
          code: 'INIT_ERROR'
        },
        { status: 500 }
      );
    }

    // 5. Récupérer les paramètres
    const body = await req.json();
    const { action = 'process', limit = 50, syncNew = false } = body;

    // 6. Actions disponibles
    switch (action) {
      case 'process':
      case 'process_emails': {
        // ✅ Utiliser processClientEmails au lieu de processBatch
        const result = await harveyV2.processClientEmails(
          client.id,
          { limit, syncNew }
        );

        return NextResponse.json({
          success: result.success,
          data: {
            processed: result.processed,
            errors: result.errors,
            responses: result.responses.map((r: any) => ({
              success: r.success,
              email_id: r.data?.email_id,
              response_preview: r.data?.response?.substring(0, 200) + (r.data?.response?.length > 200 ? '...' : ''),
              confidence: r.data?.confidence,
              tone: r.data?.tone,
              requires_review: r.data?.requires_human_review
            }))
          },
          metrics: harveyV2.getMetrics()
        });
      }

      case 'status': {
        // Récupérer le statut
        const metrics = harveyV2.getMetrics();
        const config = harveyV2.getConfig();
        
        // Compter les emails en attente
        const { count: pendingCount, error: countError } = await supabase
          .from('emails')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', client.id)
          .in('status', ['pending', 'analyzed']);

        if (countError) {
          console.error('❌ Erreur comptage emails:', countError);
        }

        return NextResponse.json({
          success: true,
          data: {
            metrics,
            config: {
              minConfidence: config.minConfidence,
              defaultTone: config.defaultTone,
              companyName: config.companyName
            },
            pending_emails: pendingCount || 0,
            mail_account: {
              email: mailAccount.email,
              is_connected: mailAccount.is_connected
            }
          }
        });
      }

      case 'generate_preview': {
        // ✅ Utiliser generateReply
        if (!body.email) {
          return NextResponse.json(
            { error: 'Email requis pour la génération' },
            { status: 400 }
          );
        }

        const result = await harveyV2.generateReply({
          from_email: body.email.from_email,
          from_name: body.email.from_name,
          to_email: body.email.to_email || mailAccount.email,
          subject: body.email.subject || 'Sans sujet',
          body: body.email.body || '',
          category: body.email.category,
          priority: body.email.priority
        });

        return NextResponse.json({
          success: result.success,
          data: {
            response: result.response,
            tone: result.tone,
            confidence: result.confidence
          }
        });
      }

      default:
        return NextResponse.json(
          { 
            error: `Action inconnue: ${action}`,
            available_actions: ['process', 'process_emails', 'status', 'generate_preview']
          },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('❌ Erreur API mail/process:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Erreur interne du serveur',
        code: 'SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}

// ============================================================
// GET - Récupérer le statut
// ============================================================

export async function GET(req: NextRequest) {
  try {
    // 1. Authentification
    const authResult = await authenticateClient(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Non authentifié' },
        { status: authResult.status || 401 }
      );
    }

    const client = authResult.client;

    // 2. Vérifier le compte mail
    const { data: mailAccount } = await supabase
      .from('mail_accounts')
      .select('id, email, is_connected, last_sync_at')
      .eq('client_id', client.id)
      .eq('is_active', true)
      .maybeSingle();

    // 3. Compter les emails en attente
    const { count: pendingCount } = await supabase
      .from('emails')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', client.id)
      .in('status', ['pending', 'analyzed']);

    // 4. Compter les réponses prêtes
    const { count: responsesCount } = await supabase
      .from('emails')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', client.id)
      .eq('status', 'response_ready');

    // 5. Métriques Harvey
    const metrics = harveyV2.getMetrics();

    return NextResponse.json({
      success: true,
      data: {
        client: {
          id: client.id,
          email: client.email,
          name: client.first_name || client.company_name
        },
        mail_account: mailAccount ? {
          email: mailAccount.email,
          is_connected: mailAccount.is_connected,
          last_sync_at: mailAccount.last_sync_at
        } : null,
        queue: {
          pending: pendingCount || 0,
          response_ready: responsesCount || 0
        },
        harvey: metrics
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur API GET:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur interne' },
      { status: 500 }
    );
  }
}

// ============================================================
// OPTIONS - CORS
// ============================================================

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin');
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : '*';
  
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowed,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}