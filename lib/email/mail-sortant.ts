// lib/email/mail-sortant.ts
// Envoi d'e-mails : UNITECH dépose ses messages dans la table mail_sortant de
// la base PostgreSQL commune à tous les systèmes (MAIL_DATABASE_URL, compte
// AlwaysData « unitech »). Une tâche planifiée les envoie toutes les 5 minutes.
// Sans MAIL_DATABASE_URL, aucun e-mail ne part.
import { Pool } from 'pg';

export const SYSTEME = 'UNITECH';

const globalPourMail = globalThis as unknown as { poolMail: Pool | undefined };

export function envoiDisponible(): boolean {
  return !!process.env.MAIL_DATABASE_URL;
}

function pool(): Pool {
  if (globalPourMail.poolMail) return globalPourMail.poolMail;
  const url = new URL(process.env.MAIL_DATABASE_URL!);
  const local = ['localhost', '127.0.0.1'].includes(url.hostname);
  url.searchParams.delete('sslmode');
  const p = new Pool({
    connectionString: url.toString(),
    ssl: local ? false : { rejectUnauthorized: process.env.MAIL_DATABASE_SSL_NO_VERIFY !== '1' },
    max: 2,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 15000,
    allowExitOnIdle: true,
  });
  p.on('error', (err) => console.error('[mail pool]', err.message));
  globalPourMail.poolMail = p;
  return p;
}

// message : version texte ; messageHtml : version mise en forme (sinon le
// script d'envoi construit un HTML simple à partir du titre et du message)
export type Email = { destinataire: string; objet: string; titre: string; message: string; messageHtml?: string };

export async function deposerEmail(e: Email): Promise<void> {
  if (!envoiDisponible()) throw new Error("L'envoi d'e-mails n'est pas configuré");
  try {
    await pool().query(
      'INSERT INTO mail_sortant (systeme, destinataire, objet, titre, message, message_html) VALUES ($1, $2, $3, $4, $5, $6)',
      [SYSTEME, e.destinataire, e.objet, e.titre, e.message, e.messageHtml ?? null]
    );
  } catch (err) {
    console.error('[mail]', err);
    throw new Error("L'e-mail n'a pas pu être envoyé pour le moment");
  }
}
