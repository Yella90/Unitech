// scripts/alwaysdata/send-approved-emails.cjs
// Tâche planifiée AlwaysData #32196 (compte « unitech », dossier
// www/imap-fetcher, toutes les 2 minutes) : envoie les réponses de HARVEY que
// le client a approuvées, depuis la boîte du client (son serveur SMTP), en
// réponse au message d'origine.
//
// Configuration : variables d'environnement de la tâche (aucun secret ici).
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY      base Unitech
//   EMAIL_ENCRYPTION_KEY                         clé actuelle (identique à Render)
//   EMAIL_ENCRYPTION_KEY_PREVIOUS                ancienne clé, pendant une rotation
//   MAIL_DATABASE_URL                            file mail_sortant (alertes)
//   ADMIN_ALERT_EMAIL                            copie des alertes
//   APP_URL                                      lien vers l'espace client
//   SMTP_TLS_INSECURE=1                          (à éviter) accepte un certificat SMTP invalide

const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const env = process.env;
const CONFIG = {
  SUPABASE_URL: env.SUPABASE_URL || 'https://sagvtnbbbdrfuoqxnplf.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
  KEY: env.EMAIL_ENCRYPTION_KEY,
  PREVIOUS_KEY: env.EMAIL_ENCRYPTION_KEY_PREVIOUS,
  MAIL_DATABASE_URL: env.MAIL_DATABASE_URL,
  ADMIN_ALERT_EMAIL: env.ADMIN_ALERT_EMAIL || '',
  APP_URL: (env.APP_URL || 'https://unitech-qvgo.onrender.com').replace(/\/$/, ''),
  TLS_INSECURE: env.SMTP_TLS_INSECURE === '1',
  MAX_EMAILS_PER_RUN: 50,
  DELAY_BETWEEN_SENDS: 2000,
  LOG_DIR: path.join(__dirname, 'logs'),
  ALERT_EVERY_MS: 24 * 60 * 60 * 1000, // une alerte par boîte et par jour au plus
  STATUS_TO_SEND: 'approved',
};

const HEX_KEY = /^[0-9a-fA-F]{64}$/;
for (const [name, value] of [['SUPABASE_SERVICE_ROLE_KEY', CONFIG.SUPABASE_SERVICE_ROLE_KEY], ['EMAIL_ENCRYPTION_KEY', CONFIG.KEY]]) {
  if (!value) {
    console.error(`❌ Variable d'environnement manquante : ${name}`);
    process.exit(1);
  }
}
if (!HEX_KEY.test(CONFIG.KEY)) {
  console.error('❌ EMAIL_ENCRYPTION_KEY invalide (64 caractères hexadécimaux attendus)');
  process.exit(1);
}

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
fs.mkdirSync(CONFIG.LOG_DIR, { recursive: true });

// ============================================================
// DÉCHIFFREMENT (AES-256-CBC, « iv:données » en hexadécimal)
// Clé actuelle, puis ancienne clé pendant une rotation.
// ============================================================
function decryptWith(keyHex, ivHex, dataHex) {
  try {
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(keyHex, 'hex'), Buffer.from(ivHex, 'hex'));
    const plain = decipher.update(dataHex, 'hex', 'utf8') + decipher.final('utf8');
    // Une mauvaise clé donne, dans les rares cas où elle passe, un texte illisible
    return plain && !/[�\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(plain) ? plain : null;
  } catch {
    return null;
  }
}

function decryptPassword(value) {
  if (!value || !value.includes(':')) return null;
  const [ivHex, dataHex] = value.split(':');
  if (!ivHex || ivHex.length !== 32 || !dataHex) return null;
  const keys = [CONFIG.KEY, HEX_KEY.test(CONFIG.PREVIOUS_KEY || '') ? CONFIG.PREVIOUS_KEY : null].filter(Boolean);
  for (const key of keys) {
    const plain = decryptWith(key, ivHex, dataHex);
    if (plain !== null) return plain;
  }
  return null;
}

// ============================================================
// ALERTES (file mail_sortant), au plus une par boîte et par jour
// ============================================================
const ALERT_STATE = path.join(CONFIG.LOG_DIR, 'alertes.json');

function readAlertState() {
  try {
    return JSON.parse(fs.readFileSync(ALERT_STATE, 'utf8'));
  } catch {
    return {};
  }
}

let pgPool = null;
function mailPool() {
  if (pgPool || !CONFIG.MAIL_DATABASE_URL) return pgPool;
  try {
    const { Pool } = require('pg');
    const url = new URL(CONFIG.MAIL_DATABASE_URL);
    url.searchParams.delete('sslmode');
    pgPool = new Pool({ connectionString: url.toString(), ssl: { rejectUnauthorized: true }, max: 1 });
  } catch (error) {
    console.warn('⚠️ Alertes désactivées (module pg absent : npm install pg) :', error.message);
  }
  return pgPool;
}

async function alertMailbox(mailAccount, client, reason) {
  const state = readAlertState();
  const last = state[mailAccount.id] || 0;
  if (Date.now() - last < CONFIG.ALERT_EVERY_MS) return;

  const pool = mailPool();
  if (!pool) return;

  const recipients = [...new Set([client?.email, CONFIG.ADMIN_ALERT_EMAIL].filter(Boolean))];
  const message = [
    'Bonjour,',
    '',
    `Les réponses approuvées pour la boîte ${mailAccount.email} n'ont pas pu être envoyées :`,
    reason,
    '',
    `Pour corriger, ouvrez votre espace UNITECH (${CONFIG.APP_URL}/clients/mail), section Configuration, et saisissez à nouveau le mot de passe d'application de cette boîte.`,
    "Les réponses concernées sont marquées « erreur » : vous pourrez les approuver de nouveau ensuite.",
    '',
    "L'équipe UNITECH",
  ].join('\n');

  try {
    for (const to of recipients) {
      await pool.query(
        'INSERT INTO mail_sortant (systeme, destinataire, objet, titre, message) VALUES ($1, $2, $3, $4, $5)',
        ['UNITECH', to, `Envoi impossible depuis ${mailAccount.email}`, "Vos réponses n'ont pas pu partir", message]
      );
    }
    state[mailAccount.id] = Date.now();
    fs.writeFileSync(ALERT_STATE, JSON.stringify(state));
    console.log(`📨 Alerte déposée pour ${mailAccount.email} (${recipients.length} destinataire(s))`);
  } catch (error) {
    console.error('❌ Alerte non déposée :', error.message);
  }
}

// ============================================================
// 1. RÉPONSES APPROUVÉES, REGROUPÉES PAR BOÎTE
// ============================================================
async function getApprovedEmails() {
  const { data: emails, error } = await supabase
    .from('emails')
    .select('*')
    .eq('status', CONFIG.STATUS_TO_SEND)
    .is('replied_at', null)
    .not('harvey_response', 'is', null)
    .not('client_id', 'is', null)
    .order('processed_at', { ascending: true })
    .limit(CONFIG.MAX_EMAILS_PER_RUN);

  if (error) throw new Error(`Lecture des e-mails : ${error.message}`);
  return emails || [];
}

async function getMailAccount(clientId) {
  const { data, error } = await supabase
    .from('mail_accounts')
    .select('id, client_id, email, smtp_server, smtp_port, encryption, email_password, clients:client_id (id, email, first_name, last_name, company_name)')
    .eq('client_id', clientId)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw new Error(`Lecture du compte mail : ${error.message}`);
  return data;
}

async function markEmail(emailId, fields) {
  const { error } = await supabase
    .from('emails')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', emailId);
  if (error) console.error(`❌ Mise à jour de l'e-mail ${emailId} :`, error.message);
  return !error;
}

// ============================================================
// 2. ENVOI DEPUIS LA BOÎTE DU CLIENT
// ============================================================
function isAuthError(error) {
  return error && (error.code === 'EAUTH' || error.responseCode === 535 || /535|Invalid login|authentication/i.test(error.message || ''));
}

async function sendFromClientMailbox(email, mailAccount, password) {
  const fromEmail = mailAccount.email;
  const client = mailAccount.clients;
  const port = mailAccount.smtp_port || 587;
  const transporter = nodemailer.createTransport({
    host: mailAccount.smtp_server || 'smtp.gmail.com',
    port,
    secure: mailAccount.encryption === 'ssl' || port === 465,
    auth: { user: fromEmail, pass: password },
    // Certificat vérifié : sinon un tiers pourrait intercepter le mot de passe
    tls: { rejectUnauthorized: !CONFIG.TLS_INSECURE },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
  });

  try {
    const subject = email.subject || 'Sans objet';
    const info = await transporter.sendMail({
      from: `"${client?.company_name || fromEmail}" <${fromEmail}>`,
      to: email.from_email,
      subject: /^re:/i.test(subject) ? subject : `Re: ${subject}`,
      text: email.harvey_response,
      html: email.harvey_response_html || undefined,
      headers: {
        ...(email.message_id ? { 'In-Reply-To': email.message_id } : {}),
        ...(email.message_id || email.thread_id ? { References: email.message_id || email.thread_id } : {}),
        'X-Auto-Reply': 'yes',
      },
    });
    return { ok: true, messageId: info.messageId };
  } finally {
    transporter.close();
  }
}

// ============================================================
// 3. TRAITEMENT
// ============================================================
async function processApprovedEmails() {
  const started = Date.now();
  console.log(`🔄 Début du traitement à ${new Date().toISOString()}`);

  const emails = await getApprovedEmails();
  if (emails.length === 0) {
    console.log('📭 Aucun e-mail approuvé à envoyer');
    return { sent: 0, failed: 0 };
  }
  console.log(`📧 ${emails.length} e-mail(s) approuvé(s)`);

  const accounts = new Map();
  let sent = 0;
  let failed = 0;

  for (const email of emails) {
    if (!accounts.has(email.client_id)) {
      const mailAccount = await getMailAccount(email.client_id);
      accounts.set(email.client_id, {
        mailAccount,
        password: mailAccount ? decryptPassword(mailAccount.email_password) : null,
        blocked: null,
      });
    }
    const entry = accounts.get(email.client_id);
    const { mailAccount, password } = entry;

    if (!mailAccount) {
      failed++;
      await markEmail(email.id, { status: 'error', error_message: 'Aucune boîte mail active pour ce client' });
      continue;
    }
    if (!password) {
      failed++;
      const reason = 'Le mot de passe enregistré pour cette boîte est illisible.';
      await markEmail(email.id, { status: 'error', error_message: reason });
      await alertMailbox(mailAccount, mailAccount.clients, reason);
      continue;
    }
    if (entry.blocked) {
      // La boîte a déjà refusé la connexion pendant ce passage
      failed++;
      await markEmail(email.id, { status: 'error', error_message: entry.blocked });
      continue;
    }

    try {
      console.log(`📤 ${email.from_email} ← ${mailAccount.email}`);
      const result = await sendFromClientMailbox(email, mailAccount, password);
      const now = new Date().toISOString();
      if (await markEmail(email.id, { status: 'sent', is_replied: true, replied_at: now, sent_at: now, error_message: null })) {
        sent++;
        console.log(`✅ Envoyé (${result.messageId})`);
      }
    } catch (error) {
      failed++;
      const reason = isAuthError(error)
        ? "Le serveur d'envoi a refusé l'identifiant ou le mot de passe (mot de passe d'application révoqué ou modifié)."
        : `Erreur d'envoi : ${error.message}`;
      console.error(`❌ ${mailAccount.email} : ${error.message}`);
      await markEmail(email.id, { status: 'error', error_message: reason });
      if (isAuthError(error)) {
        entry.blocked = reason;
        await alertMailbox(mailAccount, mailAccount.clients, reason);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, CONFIG.DELAY_BETWEEN_SENDS));
  }

  const duration = ((Date.now() - started) / 1000).toFixed(2);
  console.log(`📊 ${sent} envoyé(s), ${failed} en erreur (${duration} s)`);
  fs.appendFileSync(
    path.join(CONFIG.LOG_DIR, 'sender.log'),
    JSON.stringify({ timestamp: new Date().toISOString(), sent, failed, duration }) + '\n'
  );
  return { sent, failed };
}

if (require.main === module) {
  processApprovedEmails()
    // Les erreurs d'envoi sont signalées par alerte ; le code de sortie
    // n'échoue que si le traitement lui-même n'a pas pu tourner
    .then(async (result) => {
      console.log(`✅ Terminé : ${result.sent} envoyé(s), ${result.failed} en erreur`);
      if (pgPool) await pgPool.end();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('❌ Erreur fatale :', error.message);
      fs.appendFileSync(
        path.join(CONFIG.LOG_DIR, 'sender-error.log'),
        JSON.stringify({ timestamp: new Date().toISOString(), error: error.message }) + '\n'
      );
      if (pgPool) await pgPool.end().catch(() => {});
      process.exit(1);
    });
}

module.exports = { processApprovedEmails, decryptPassword };
