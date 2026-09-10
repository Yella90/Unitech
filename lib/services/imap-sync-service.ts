// lib/services/imap-sync-service.ts
// Service de synchronisation IMAP automatique pour tous les clients

import { supabase } from '@/lib/supabase';
import Imap from 'imap';
import { simpleParser } from 'mailparser';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.EMAIL_ENCRYPTION_KEY || '';
const IMAP_TIMEOUT = 30000;
const MAX_EMAILS = 50;

function decryptPassword(encrypted: string): string | null {
  try {
    if (!encrypted || !encrypted.includes(':')) return null;
    const [ivHex, encryptedHex] = encrypted.split(':');
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
  } catch (e) {
    return null;
  }
}

async function fetchEmailsFromIMAP(mailAccount: any): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const password = decryptPassword(mailAccount.email_password);
    if (!password) return reject(new Error('Mot de passe invalide'));

    const imap = new Imap({
      user: mailAccount.email,
      password,
      host: mailAccount.imap_server,
      port: mailAccount.imap_port || 993,
      tls: mailAccount.encryption === 'tls' || mailAccount.encryption === 'ssl',
      tlsOptions: { rejectUnauthorized: false },
      connTimeout: IMAP_TIMEOUT,
      authTimeout: IMAP_TIMEOUT
    });

    const emails: any[] = [];
    let isConnected = false;
    const timeoutId = setTimeout(() => {
      try { if (isConnected) imap.end(); } catch (e) {}
      reject(new Error('Timeout'));
    }, IMAP_TIMEOUT);

    imap.once('ready', () => {
      isConnected = true;
      imap.openBox('INBOX', true, (err) => {
        if (err) { clearTimeout(timeoutId); imap.end(); return reject(err); }

        imap.search(['UNSEEN'], (err, results) => {
          if (err) { clearTimeout(timeoutId); imap.end(); return reject(err); }
          if (!results || results.length === 0) {
            clearTimeout(timeoutId); imap.end(); return resolve([]);
          }

          const limit = Math.min(results.length, mailAccount.max_emails_per_sync || MAX_EMAILS);
          const fetch = imap.fetch(results.slice(0, limit), {
            bodies: ['HEADER', 'TEXT', ''],
            struct: true,
            markSeen: false
          });

          fetch.on('message', (msg) => {
            const data: any = {};
            msg.on('body', (stream, info) => {
              let buffer = '';
              stream.on('data', (c) => { buffer += c.toString('utf8'); });
              stream.on('end', () => {
                if (info.which === '') {
                  simpleParser(buffer, (err, parsed) => {
                    if (!err && parsed) data.parsed = parsed;
                  });
                } else {
                  data[info.which] = buffer;
                }
              });
            });
            msg.once('end', () => { if (data.parsed) emails.push(data.parsed); });
          });

          fetch.once('error', (err) => { clearTimeout(timeoutId); imap.end(); reject(err); });
          fetch.once('end', () => { clearTimeout(timeoutId); imap.end(); resolve(emails); });
        });
      });
    });

    imap.once('error', (err) => {
      clearTimeout(timeoutId);
      if (!isConnected) reject(err);
    });

    imap.connect();
  });
}

async function saveEmails(account: any, emails: any[]) {
  let saved = 0, errors = 0;

  for (const email of emails) {
    try {
      const { data: existing } = await supabase
        .from('emails')
        .select('id')
        .eq('message_id', email.messageId)
        .maybeSingle();

      if (existing) continue;

      const from = email.from?.value?.[0] || { address: 'unknown', name: '' };
      const to = email.to?.value?.map((v: any) => v.address) || [];

      const { error } = await supabase.from('emails').insert({
        mail_account_id: account.id,
        client_id: account.client_id,
        message_id: email.messageId,
        thread_id: email.threadId || email.messageId,
        message_id_unique: email.messageId,
        from_email: from.address,
        from_name: from.name || '',
        to_email: to.join(', '),
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
        sent_at: null,
        status: 'pending',
        is_read: false,
        is_replied: false,
        priority: 'normal'
      });

      if (error) errors++;
      else saved++;
    } catch (e) {
      errors++;
    }
  }

  return { saved, errors };
}

export async function runImapSync(): Promise<{
  accounts: number;
  emailsSaved: number;
  errors: number;
}> {
  console.log('🔄 Sync IMAP: Démarrage...');

  let accounts = 0, emailsSaved = 0, errors = 0;

  try {
    const { data: mailAccounts } = await supabase
      .from('mail_accounts')
      .select('*')
      .eq('is_active', true);

    if (!mailAccounts || mailAccounts.length === 0) {
      console.log('📭 Aucun compte actif');
      return { accounts: 0, emailsSaved: 0, errors: 0 };
    }

    for (const account of mailAccounts) {
      accounts++;
      try {
        console.log(`📧 Sync: ${account.email}`);
        const emails = await fetchEmailsFromIMAP(account);
        const result = await saveEmails(account, emails);
        emailsSaved += result.saved;
        errors += result.errors;

        await supabase
          .from('mail_accounts')
          .update({
            is_connected: true,
            last_sync_at: new Date().toISOString()
          })
          .eq('id', account.id);

      } catch (err: any) {
        errors++;
        console.error(`❌ ${account.email}:`, err.message);
        await supabase
          .from('mail_accounts')
          .update({ is_connected: false })
          .eq('id', account.id);
      }

      await new Promise(r => setTimeout(r, 3000));
    }

    console.log(`📊 Sync IMAP: ${accounts} comptes, ${emailsSaved} emails, ${errors} erreurs`);
    return { accounts, emailsSaved, errors };

  } catch (error: any) {
    console.error('❌ Erreur fatale sync IMAP:', error);
    return { accounts, emailsSaved, errors: errors + 1 };
  }
}