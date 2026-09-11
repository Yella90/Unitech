// app/api/mail/sync/route.ts
// Synchronisation des emails clients depuis IMAP vers la table "emails"
// ✅ Marque les emails comme lus après récupération
// ✅ Pas de vérification de doublon

import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { authenticateAPIRequest } from '@/lib/api/auth';
import { simpleParser } from 'mailparser';
import crypto from 'crypto';

// ============================================================
// CONFIGURATION
// ============================================================

const ENCRYPTION_KEY = process.env.EMAIL_ENCRYPTION_KEY || '8f3a7c2e91d64b508a17c9e4f62b3d8a0c5e71f94a26d83b6e19f047c3a5d82e';

const IMAP_TIMEOUT = 30000;        // 30 secondes
const IMAP_MAX_EMAILS = 50;         // Nombre max d'emails par sync

// ============================================================
// DÉCHIFFREMENT DU MOT DE PASSE
// ============================================================

function decryptPassword(encrypted: string): string {
  try {
    if (!encrypted || !encrypted.includes(':')) {
      throw new Error('Format de mot de passe chiffré invalide');
    }

    const [ivHex, encryptedHex] = encrypted.split(':');
    if (!ivHex || !encryptedHex) {
      throw new Error('IV ou texte chiffré manquant');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      iv
    );

    let decrypted = decipher.update(encryptedText, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error: any) {
    console.error('❌ Erreur déchiffrement:', error.message);
    throw new Error('Impossible de déchiffrer le mot de passe du compte mail');
  }
}

// ============================================================
// CLIENT ADMIN SUPABASE
// ============================================================

function getAdminClient() {
  if (!supabaseAdmin) {
    throw new Error('supabaseAdmin n\'est pas disponible');
  }
  return supabaseAdmin;
}

// ============================================================
// RÉCUPÉRATION DES EMAILS DEPUIS IMAP
// ============================================================

async function fetchEmailsFromIMAP(mailAccount: any): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const Imap = require('imap');

    // Déchiffrer le mot de passe
    let password: string;
    try {
      password = decryptPassword(mailAccount.email_password);
    } catch (error: any) {
      reject(new Error(`Erreur de déchiffrement: ${error.message}`));
      return;
    }

    const imap = new Imap({
      user: mailAccount.email,
      password: password,
      host: mailAccount.imap_server,
      port: mailAccount.imap_port || 993,
      tls: mailAccount.encryption === 'tls' || mailAccount.encryption === 'ssl',
      tlsOptions: { rejectUnauthorized: false },
      connTimeout: IMAP_TIMEOUT,
      authTimeout: IMAP_TIMEOUT,
      keepalive: false
    });

    const emails: any[] = [];
    let isConnected = false;
    let timeoutId: NodeJS.Timeout | null = null;

    // Timeout global
    timeoutId = setTimeout(() => {
      console.log('⏰ Timeout IMAP, fermeture...');
      try {
        if (isConnected) imap.end();
      } catch (e) {}
      reject(new Error('Timeout de connexion IMAP'));
    }, IMAP_TIMEOUT);

    imap.once('ready', () => {
      isConnected = true;
      console.log('✅ Connexion IMAP établie');

      // ✅ Ouvrir en mode lecture/écriture (false) pour pouvoir marquer comme lu
      imap.openBox('INBOX', false, (err: any, box: any) => {
        if (err) {
          if (timeoutId) clearTimeout(timeoutId);
          imap.end();
          reject(err);
          return;
        }

        console.log(`📬 Boîte ouverte: ${box.messages.total} messages`);

        // Récupérer uniquement les emails NON LUS
        const searchCriteria = ['UNSEEN'];
        const fetchOptions = {
          bodies: ['HEADER', 'TEXT', ''],
          struct: true,
          markSeen: true  // ✅ Marquer comme lu après récupération
        };

        imap.search(searchCriteria, (err: any, results: any) => {
          if (err) {
            if (timeoutId) clearTimeout(timeoutId);
            imap.end();
            reject(err);
            return;
          }

          if (!results || results.length === 0) {
            console.log('📭 Aucun email non lu');
            if (timeoutId) clearTimeout(timeoutId);
            imap.end();
            resolve([]);
            return;
          }

          // Limiter le nombre d'emails
          const limit = Math.min(
            results.length,
            mailAccount.max_emails_per_sync || IMAP_MAX_EMAILS
          );
          const emailIds = results.slice(0, limit);

          console.log(`📧 Récupération de ${emailIds.length} emails (sur ${results.length} non lus)`);

          const fetch = imap.fetch(emailIds, fetchOptions);
          let emailCount = 0;

          fetch.on('message', (msg: any, seqno: any) => {
            const emailData: any = {};

            msg.on('body', (stream: any, info: any) => {
              let buffer = '';
              stream.on('data', (chunk: any) => { buffer += chunk.toString('utf8'); });
              stream.on('end', () => {
                if (info.which === '') {
                  simpleParser(buffer, (err: any, parsed: any) => {
                    if (!err && parsed) {
                      emailData.parsed = parsed;
                    }
                  });
                } else {
                  emailData[info.which] = buffer;
                }
              });
            });

            msg.once('attributes', (attrs: any) => {
              emailData.attributes = attrs;
            });

            msg.once('end', () => {
              if (emailData.parsed) {
                emails.push(emailData.parsed);
                emailCount++;
              }
            });
          });

          fetch.once('error', (err: any) => {
            console.error('❌ Erreur fetch:', err);
            if (timeoutId) clearTimeout(timeoutId);
            imap.end();
            reject(err);
          });

          fetch.once('end', () => {
            console.log(`✅ ${emailCount} emails récupérés et marqués comme lus`);
            if (timeoutId) clearTimeout(timeoutId);
            imap.end();
            resolve(emails);
          });
        });
      });
    });

    imap.once('error', (err: any) => {
      if (timeoutId) clearTimeout(timeoutId);
      console.error('❌ Erreur IMAP:', err);
      if (!isConnected) {
        reject(err);
      }
    });

    imap.once('end', () => {
      if (timeoutId) clearTimeout(timeoutId);
      console.log('📪 Connexion IMAP fermée');
    });

    console.log(`🔗 Connexion IMAP à ${mailAccount.imap_server}:${mailAccount.imap_port || 993}...`);
    imap.connect();
  });
}

// ============================================================
// SAUVEGARDE DES EMAILS DANS LA BASE (table "emails")
// ✅ Pas de vérification de doublon (les emails sont marqués
//    comme lus côté Gmail, donc ils ne seront plus récupérés)
// ============================================================

async function saveEmailsToDatabase(
  mailAccountId: string,
  clientId: string,
  emails: any[]
): Promise<{ saved: number; errors: number }> {
  let saved = 0;
  let errors = 0;
  const adminClient = getAdminClient();

  for (const email of emails) {
    try {
      // 1. Extraire les données de l'email
      const from = email.from?.value?.[0] || { address: 'unknown', name: '' };
      const to = email.to?.value?.map((v: any) => v.address) || [];
      const cc = email.cc?.value?.map((v: any) => v.address) || [];
      const bcc = email.bcc?.value?.map((v: any) => v.address) || [];

      // ✅ "to_email" est de type TEXT (pas ARRAY)
      const toEmailString = to.join(', ');

      // 2. ✅ Insertion DIRECTE sans vérification de doublon
      const { error: insertError } = await adminClient
        .from('emails')
        .insert({
          // Identifiants
          mail_account_id: mailAccountId,
          client_id: clientId,
          message_id: email.messageId || null,
          thread_id: email.threadId || email.messageId || null,
          message_id_unique: email.messageId || null,

          // Expéditeur / destinataires
          from_email: from.address || 'unknown',
          from_name: from.name || '',
          to_email: toEmailString,           // ✅ TEXT (pas ARRAY)
          cc_email: cc,                      // ARRAY
          bcc_email: bcc,                    // ARRAY

          // Contenu
          subject: email.subject || 'Sans sujet',
          body: email.text || '',
          body_text: email.text || '',
          body_html: email.html || '',

          // Pièces jointes & headers
          attachments: email.attachments?.map((a: any) => ({
            filename: a.filename,
            contentType: a.contentType,
            size: a.size
          })) || [],
          headers: email.headers || {},

          // Dates
          received_at: email.date || new Date().toISOString(),
          sent_at: null,                     // ✅ NULL car c'est un email REÇU
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),

          // Statuts & flags
          status: 'pending',
          is_read: false,
          is_replied: false,
          priority: 'normal',
          retry_count: 0,
          max_retries: 3
        });

      if (insertError) {
        // ✅ Gérer l'erreur de contrainte UNIQUE (code 23505)
        if (insertError.code === '23505') {
          console.log(`⏭️ Email déjà présent (contrainte UNIQUE): ${email.subject}`);
        } else {
          console.error('❌ Erreur insertion email:', insertError);
          errors++;
        }
      } else {
        saved++;
        console.log(`✅ Email sauvegardé: ${email.subject}`);
      }

    } catch (error: any) {
      console.error('❌ Erreur sauvegarde email:', error.message);
      errors++;
    }
  }

  return { saved, errors };
}

// ============================================================
// ROUTE POST - SYNCHRONISATION
// ============================================================

export async function POST(req: NextRequest) {
  let mailAccountId: string | null = null;

  try {
    // 1. Authentification
    const authResult = await authenticateAPIRequest(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    const body = await req.json();
    mailAccountId = body.mailAccountId;

    if (!mailAccountId) {
      return NextResponse.json(
        { error: 'ID du compte mail requis' },
        { status: 400 }
      );
    }

    // 2. Récupérer le compte mail
    const adminClient = getAdminClient();
    const { data: mailAccount, error: mailError } = await adminClient
      .from('mail_accounts')
      .select('*')
      .eq('id', mailAccountId)
      .single();

    if (mailError || !mailAccount) {
      return NextResponse.json(
        { error: 'Compte mail non trouvé' },
        { status: 404 }
      );
    }

    // 3. Vérifier que le compte appartient au client
    if (mailAccount.client_id !== authResult.client.id) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    // 4. Marquer "is_connected = false" pendant la synchro
    await adminClient
      .from('mail_accounts')
      .update({
        is_connected: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', mailAccountId);

    // 5. Récupérer les emails depuis IMAP
    let emails: any[] = [];
    try {
      emails = await fetchEmailsFromIMAP(mailAccount);
    } catch (imapError: any) {
      console.error('❌ Erreur IMAP:', imapError.message);

      // Mettre à jour le statut d'erreur
      await adminClient
        .from('mail_accounts')
        .update({
          is_connected: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', mailAccountId);

      return NextResponse.json(
        { error: imapError.message || 'Erreur de connexion IMAP' },
        { status: 500 }
      );
    }

    // 6. Sauvegarder les emails dans la table "emails"
    const result = await saveEmailsToDatabase(
      mailAccountId,
      authResult.client.id,
      emails
    );

    // 7. Marquer "is_connected = true" après succès
    await adminClient
      .from('mail_accounts')
      .update({
        is_connected: true,
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', mailAccountId);

    return NextResponse.json({
      success: true,
      data: {
        emailsFetched: emails.length,
        emailsSaved: result.saved,
        errors: result.errors
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur synchronisation:', error);

    // Mettre à jour le statut en cas d'erreur
    if (mailAccountId) {
      try {
        const adminClient = getAdminClient();
        await adminClient
          .from('mail_accounts')
          .update({
            is_connected: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', mailAccountId);
      } catch (updateError) {
        console.error('Erreur mise à jour statut:', updateError);
      }
    }

    return NextResponse.json(
      { error: error.message || 'Erreur lors de la synchronisation' },
      { status: 500 }
    );
  }
}