// lib/email/imap.ts
import { simpleParser } from 'mailparser';
import { processIncomingEmail } from './processor-optimized';

const IMAP_CONFIG = {
  user: process.env.IMAP_USER!,
  password: process.env.IMAP_PASS!,
  host: process.env.IMAP_HOST || 'imap-unitech.alwaysdata.net',
  port: parseInt(process.env.IMAP_PORT || '993'),
  secure: true,
  tlsOptions: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 30000,
};

let isProcessing = false;

function getEmailFromAddress(address: any): string {
  if (!address) return '';
  if (Array.isArray(address)) {
    return address[0]?.text || address[0]?.address || '';
  }
  return address.text || address.address || '';
}

export async function fetchEmailsFromIMAP() {
  if (isProcessing) {
    console.log('⏳ Déjà en cours de traitement...');
    return;
  }

  isProcessing = true;
  console.log('📧 Récupération des emails (Alwaysdata IMAP)...');

  try {
    const { ImapFlow } = await import('imapflow');
    const client = new ImapFlow(IMAP_CONFIG);

    await client.connect();
    console.log('✅ Connecté à IMAP Alwaysdata');

    const lock = await client.getMailboxLock('INBOX');
    console.log('📂 Boîte de réception ouverte');

    try {
      const messages = await client.fetch({
        seen: false,
      }, {
        envelope: true,
        source: true,
        uid: true,
      });

      const messagesArray = [];
      for await (const message of messages) {
        messagesArray.push(message);
      }

      console.log(`📧 ${messagesArray.length} emails non lus trouvés`);

      for (const message of messagesArray) {
        try {
          console.log(`📨 Traitement de l'email ${message.uid}...`);
          
          if (!message.source) {
            console.warn(`⚠️ Email ${message.uid} sans source, ignoré`);
            continue;
          }

          const parsed = await simpleParser(message.source);
          
          const from = getEmailFromAddress(parsed.from);
          const to = getEmailFromAddress(parsed.to);
          const subject = parsed.subject || 'Sans sujet';
          const body = parsed.text || '';
          const html = parsed.html || '';

          console.log(`📧 De: ${from} - Sujet: ${subject}`);

          await processIncomingEmail({
            from,
            to,
            subject,
            body,
            html,
          });

          // ✅ Marquer comme lu avec setFlags
          await client.setFlags(message.uid, ['\\Seen']);
          console.log(`✅ Email ${message.uid} traité et marqué comme lu`);

        } catch (error) {
          console.error(`❌ Erreur sur l'email ${message.uid}:`, error);
        }
      }

      console.log('✅ Tous les emails traités');

    } finally {
      lock.release();
      await client.logout();
      console.log('🔒 Déconnexion IMAP');
    }

  } catch (error) {
    console.error('❌ Erreur IMAP:', error);
  } finally {
    isProcessing = false;
  }
}

export function startIMAPPolling(interval: number = 60000) {
  console.log(`🚀 Service IMAP Polling démarré (intervalle: ${interval}ms)`);
  
  fetchEmailsFromIMAP();

  const timer = setInterval(fetchEmailsFromIMAP, interval);
  
  return {
    stop: () => {
      clearInterval(timer);
      console.log('⏹️ Service IMAP Polling arrêté');
    },
  };
}