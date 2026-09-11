// lib/services/imap-sync-service.ts
// Service de synchronisation IMAP automatique pour tous les clients
// ✅ Marque les emails comme lus après récupération
// ✅ Pas de vérification de doublon (car les emails ne sont plus non-lus)

import { supabase } from '@/lib/supabase';
import Imap from 'imap';
import { simpleParser } from 'mailparser';
import crypto from 'crypto';

// ============================================================
// CONFIGURATION
// ============================================================
const ENCRYPTION_KEY = process.env.EMAIL_ENCRYPTION_KEY || '';
const IMAP_TIMEOUT = 30000;            // 30 secondes
const MAX_EMAILS = 50;                 // Nombre max d'emails par sync par défaut
const DELAY_BETWEEN_ACCOUNTS = 3000;   // 3 secondes entre chaque compte

// ============================================================
// DÉCHIFFREMENT DU MOT DE PASSE
// ============================================================
function decryptPassword(encrypted: string): string | null {
  try {
    if (!encrypted || !encrypted.includes(':')) {
      console.error('   ❌ Format de mot de passe invalide');
      return null;
    }

    const [ivHex, encryptedHex] = encrypted.split(':');
    if (!ivHex || !encryptedHex) {
      console.error('   ❌ IV ou texte chiffré manquant');
      return null;
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
    console.error('   ❌ Erreur déchiffrement:', error.message);
    return null;
  }
}

// ============================================================
// RÉCUPÉRATION DES EMAILS DEPUIS IMAP
// ============================================================
async function fetchEmailsFromIMAP(mailAccount: any): Promise<any[]> {
  return new Promise((resolve, reject) => {
    // 1. Déchiffrer le mot de passe
    const password = decryptPassword(mailAccount.email_password);
    if (!password) {
      return reject(new Error('Impossible de déchiffrer le mot de passe'));
    }

    // 2. Créer la connexion IMAP
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

    // 3. Timeout global
    timeoutId = setTimeout(() => {
      console.log('   ⏰ Timeout IMAP, fermeture...');
      try {
        if (isConnected) imap.end();
      } catch (e) {}
      reject(new Error('Timeout de connexion IMAP'));
    }, IMAP_TIMEOUT);

    imap.once('ready', () => {
      isConnected = true;
      console.log('   ✅ Connexion IMAP établie');

      // 4. Ouvrir la boîte de réception
      imap.openBox('INBOX', false, (err: any, box: any) => {
        if (err) {
          if (timeoutId) clearTimeout(timeoutId);
          imap.end();
          return reject(err);
        }

        console.log(`   📬 Boîte ouverte: ${box.messages.total} messages`);

        // 5. Rechercher uniquement les emails NON LUS
        imap.search(['UNSEEN'], (err: any, results: any) => {
          if (err) {
            if (timeoutId) clearTimeout(timeoutId);
            imap.end();
            return reject(err);
          }

          if (!results || results.length === 0) {
            console.log('   📭 Aucun email non lu');
            if (timeoutId) clearTimeout(timeoutId);
            imap.end();
            return resolve([]);
          }

          // 6. Limiter le nombre d'emails
          const limit = Math.min(
            results.length,
            mailAccount.max_emails_per_sync || MAX_EMAILS
          );
          const emailIds = results.slice(0, limit);

          console.log(`   📧 Récupération de ${emailIds.length} emails (sur ${results.length} non lus)`);

          const fetchOptions = {
            bodies: ['HEADER', 'TEXT', ''],
            struct: true,
            markSeen: true   // ✅ MARQUE COMME LU après récupération
          };

          const fetch = imap.fetch(emailIds, fetchOptions);
          let emailCount = 0;

          fetch.on('message', (msg: any) => {
            const emailData: any = {};

            msg.on('body', (stream: any, info: any) => {
              let buffer = '';
              stream.on('data', (chunk: any) => {
                buffer += chunk.toString('utf8');
              });
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
            console.error('   ❌ Erreur fetch:', err);
            if (timeoutId) clearTimeout(timeoutId);
            imap.end();
            reject(err);
          });

          fetch.once('end', () => {
            console.log(`   ✅ ${emailCount} emails récupérés et marqués comme lus`);
            if (timeoutId) clearTimeout(timeoutId);
            imap.end();
            resolve(emails);
          });
        });
      });
    });

    imap.once('error', (err: any) => {
      if (timeoutId) clearTimeout(timeoutId);
      console.error('   ❌ Erreur IMAP:', err.message);
      if (!isConnected) reject(err);
    });

    imap.once('end', () => {
      if (timeoutId) clearTimeout(timeoutId);
      console.log('   📪 Connexion IMAP fermée');
    });

    console.log(`   🔗 Connexion à ${mailAccount.imap_server}:${mailAccount.imap_port || 993}...`);
    imap.connect();
  });
}

// ============================================================
// SAUVEGARDE DES EMAILS DANS LA TABLE "emails"
// ✅ Pas de vérification de doublon : les emails sont marqués
//    comme lus côté Gmail, donc ils ne seront plus récupérés
// ============================================================
async function saveEmails(
  account: any,
  emails: any[]
): Promise<{ saved: number; errors: number }> {
  let saved = 0;
  let errors = 0;

  const mailAccountId = account.id;
  const clientId = account.client_id;

  for (const email of emails) {
    try {
      // Extraire les données
      const from = email.from?.value?.[0] || { address: 'unknown', name: '' };
      const to = email.to?.value?.map((v: any) => v.address) || [];
      const cc = email.cc?.value?.map((v: any) => v.address) || [];
      const bcc = email.bcc?.value?.map((v: any) => v.address) || [];

      // ✅ Insertion directe SANS vérification de doublon
      //    (les emails sont marqués comme lus côté Gmail)
      const { error } = await supabase.from('emails').insert({
        mail_account_id: mailAccountId,
        client_id: clientId,
        message_id: email.messageId || null,
        thread_id: email.threadId || email.messageId || null,
        message_id_unique: email.messageId || null,
        from_email: from.address || 'unknown',
        from_name: from.name || '',
        to_email: to.join(', '),         // TEXT (pas ARRAY)
        cc_email: cc,
        bcc_email: bcc,
        subject: email.subject || 'Sans sujet',
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
        sent_at: null,                    // NULL car c'est un email REÇU
        status: 'pending',
        is_read: false,
        is_replied: false,
        priority: 'normal',
        retry_count: 0,
        max_retries: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (error) {
        console.error(`   ❌ Erreur insertion: ${error.message}`);
        errors++;
      } else {
        saved++;
        console.log(`   ✅ Email sauvegardé: "${email.subject}"`);
      }

    } catch (err: any) {
      console.error(`   ❌ Erreur: ${err.message}`);
      errors++;
    }
  }

  return { saved, errors };
}

// ============================================================
// FONCTION PRINCIPALE - SYNC DE TOUS LES COMPTES
// ============================================================
export async function runImapSync(): Promise<{
  accounts: number;
  emailsSaved: number;
  errors: number;
}> {
  console.log('\n🔄 Sync IMAP: Démarrage...');

  let accounts = 0;
  let emailsSaved = 0;
  let errors = 0;

  try {
    // 1. Récupérer tous les comptes actifs
    const { data: mailAccounts, error: fetchError } = await supabase
      .from('mail_accounts')
      .select('*')
      .eq('is_active', true);

    if (fetchError) {
      console.error('❌ Erreur récupération comptes:', fetchError);
      return { accounts: 0, emailsSaved: 0, errors: 1 };
    }

    if (!mailAccounts || mailAccounts.length === 0) {
      console.log('📭 Aucun compte actif à synchroniser');
      return { accounts: 0, emailsSaved: 0, errors: 0 };
    }

    console.log(`📋 ${mailAccounts.length} comptes actifs trouvés`);

    // 2. Synchroniser chaque compte
    for (const account of mailAccounts) {
      accounts++;
      console.log(`\n📧 Sync: ${account.email}`);

      try {
        // Marquer comme "en cours"
        await supabase
          .from('mail_accounts')
          .update({
            is_connected: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', account.id);

        // Récupérer les emails depuis IMAP
        const emails = await fetchEmailsFromIMAP(account);

        // Sauvegarder (sans vérification de doublon)
        const result = await saveEmails(account, emails);
        emailsSaved += result.saved;
        errors += result.errors;

        // Marquer comme connecté
        await supabase
          .from('mail_accounts')
          .update({
            is_connected: true,
            last_sync_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', account.id);

      } catch (err: any) {
        errors++;
        console.error(`❌ Erreur compte ${account.email}:`, err.message);

        await supabase
          .from('mail_accounts')
          .update({
            is_connected: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', account.id);
      }

      // Délai entre les comptes (éviter de surcharger le serveur)
      await new Promise(r => setTimeout(r, DELAY_BETWEEN_ACCOUNTS));
    }

    console.log(`\n📊 Sync IMAP terminé: ${accounts} comptes, ${emailsSaved} emails, ${errors} erreurs`);
    return { accounts, emailsSaved, errors };

  } catch (error: any) {
    console.error('❌ Erreur fatale sync IMAP:', error);
    return { accounts, emailsSaved, errors: errors + 1 };
  }
}