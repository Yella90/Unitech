// app/api/mail/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { authenticateAPIRequest } from '@/lib/api/auth';
import { simpleParser } from 'mailparser';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.EMAIL_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

// ✅ Fonction pour déchiffrer le mot de passe
function decryptPassword(encrypted: string): string {
  const [ivHex, encryptedHex] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encryptedText = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let decrypted = decipher.update(encryptedText, undefined, 'utf8');
decrypted += decipher.final('utf8');
  return decrypted;
}

function getAdminClient() {
  if (!supabaseAdmin) {
    throw new Error('supabaseAdmin n\'est pas disponible');
  }
  return supabaseAdmin;
}

// ✅ Récupérer les emails depuis IMAP
async function fetchEmailsFromIMAP(mailAccount: any): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const Imap = require('imap');
    const imap = new Imap({
      user: mailAccount.email,
      password: decryptPassword(mailAccount.email_password),
      host: mailAccount.imap_server,
      port: mailAccount.imap_port || 993,
      tls: mailAccount.encryption === 'tls' || mailAccount.encryption === 'ssl',
      tlsOptions: { rejectUnauthorized: false }
    });

    const emails: any[] = [];

    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err: any, box: any) => {
        if (err) {
          imap.end();
          reject(err);
          return;
        }

        const searchCriteria = ['UNSEEN'];
        const fetchOptions = {
          bodies: ['HEADER', 'TEXT', ''],
          struct: true,
          markSeen: false
        };

        imap.search(searchCriteria, (err: any, results: any) => {
          if (err) {
            imap.end();
            reject(err);
            return;
          }

          if (results.length === 0) {
            imap.end();
            resolve([]);
            return;
          }

          const fetch = imap.fetch(results.slice(0, mailAccount.max_emails_per_sync || 50), fetchOptions);

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
              }
            });
          });

          fetch.once('error', (err: any) => {
            imap.end();
            reject(err);
          });

          fetch.once('end', () => {
            imap.end();
            resolve(emails);
          });
        });
      });
    });

    imap.once('error', (err: any) => {
      reject(err);
    });

    imap.connect();
  });
}

// ✅ Sauvegarder les emails dans la base
async function saveEmailsToDatabase(mailAccountId: string, clientId: string, emails: any[]): Promise<{
  saved: number;
  errors: number;
}> {
  let saved = 0;
  let errors = 0;
  const adminClient = getAdminClient();

  for (const email of emails) {
    try {
      // Vérifier si l'email existe déjà
      const { data: existing } = await adminClient
        .from('emails')
        .select('id')
        .eq('message_id', email.messageId)
        .maybeSingle();

      if (existing) {
        continue;
      }

      const from = email.from?.value?.[0] || { address: 'unknown', name: '' };
      const to = email.to?.value?.map((v: any) => v.address) || [];
      const cc = email.cc?.value?.map((v: any) => v.address) || [];
      const bcc = email.bcc?.value?.map((v: any) => v.address) || [];

      const { error: insertError } = await adminClient
        .from('emails')
        .insert({
          mail_account_id: mailAccountId,
          client_id: clientId,
          message_id: email.messageId,
          thread_id: email.threadId || email.messageId,
          from_email: from.address || 'unknown',
          from_name: from.name || '',
          to_email: to,
          cc_email: cc,
          bcc_email: bcc,
          subject: email.subject || '',
          body: email.text || '',
          body_html: email.html || '',
          body_text: email.text || '',
          attachments: email.attachments?.map((a: any) => ({
            filename: a.filename,
            contentType: a.contentType,
            size: a.size
          })) || [],
          headers: email.headers || {},
          received_at: email.date || new Date().toISOString(),
          sent_at: email.date || new Date().toISOString(),
          is_read: false,
          is_replied: false,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('❌ Erreur insertion email:', insertError);
        errors++;
      } else {
        saved++;
      }

    } catch (error) {
      console.error('❌ Erreur sauvegarde email:', error);
      errors++;
    }
  }

  return { saved, errors };
}

export async function POST(req: NextRequest) {
  // ✅ Déclarer mailAccountId en dehors du try/catch
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

    // 4. Mettre à jour le statut
    await adminClient
      .from('mail_accounts')
      .update({
        is_connected: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', mailAccountId);

    // 5. Récupérer les emails
    const emails = await fetchEmailsFromIMAP(mailAccount);

    // 6. Sauvegarder les emails
    const result = await saveEmailsToDatabase(mailAccountId, authResult.client.id, emails);

    // 7. Mettre à jour le statut
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
    
    // ✅ Utiliser mailAccountId qui est maintenant accessible
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