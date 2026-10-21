// lib/auth/password-reset.ts
// Mot de passe oublié pour les comptes admin (table users) et client (table
// clients). Le lien envoyé contient un jeton aléatoire ; la base n'en garde
// que l'empreinte SHA-256, valable une heure et une seule fois.
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { supabaseServer } from '@/lib/supabase-admin';
import { deposerEmail } from '@/lib/email/mail-sortant';

export type AccountType = 'admin' | 'client';

export const MIN_PASSWORD_LENGTH = 8;
const TOKEN_TTL_MS = 60 * 60 * 1000;
const APP_URL = (process.env.APP_URL || 'https://unitech-qvgo.onrender.com').replace(/\/$/, '');

const ACCOUNTS = {
  admin: { table: 'users', sessions: 'sessions', sessionKey: 'user_id', login: '/login', label: 'administrateur' },
  client: { table: 'clients', sessions: 'client_sessions', sessionKey: 'client_id', login: '/connexion', label: 'client' },
} as const;

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Envoie un lien de réinitialisation si un compte actif existe pour cette
 * adresse. Ne dit jamais à l'appelant si le compte existe.
 */
export async function requestPasswordReset(type: AccountType, email: string): Promise<void> {
  const account = ACCOUNTS[type];
  const { data: row } = await supabaseServer
    .from(account.table)
    .select('id, email, first_name, is_active')
    // Insensible à la casse ; % et _ échappés pour ne viser que cette adresse
    .ilike('email', email.replace(/[\\%_]/g, '\\$&'))
    .limit(1)
    .maybeSingle();

  if (!row || row.is_active === false) return;

  // Un seul lien valable à la fois : les précédents sont invalidés
  await supabaseServer
    .from('password_resets')
    .update({ used_at: new Date().toISOString() })
    .eq('account_type', type)
    .eq('account_id', row.id)
    .is('used_at', null);

  const token = crypto.randomBytes(32).toString('base64url');
  const { error } = await supabaseServer.from('password_resets').insert({
    account_type: type,
    account_id: row.id,
    token_hash: hashToken(token),
    expires_at: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
  });
  if (error) throw new Error(`Enregistrement du jeton impossible : ${error.message}`);

  const link = `${APP_URL}/reinitialiser-mot-de-passe?token=${token}`;
  const hello = row.first_name ? `Bonjour ${row.first_name},` : 'Bonjour,';

  await deposerEmail({
    destinataire: row.email,
    objet: 'Réinitialisation de votre mot de passe UNITECH',
    titre: 'Réinitialiser votre mot de passe',
    message: [
      hello,
      '',
      `Vous avez demandé à réinitialiser le mot de passe de votre compte ${account.label} UNITECH.`,
      'Cliquez sur ce lien pour choisir un nouveau mot de passe (valable 1 heure, une seule fois) :',
      link,
      '',
      "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail : votre mot de passe actuel reste valable.",
      '',
      "L'équipe UNITECH",
    ].join('\n'),
  });
}

export type ResetResult = { ok: true; login: string } | { ok: false; error: string };

/** Change le mot de passe si le jeton est valable, puis ferme toutes les sessions du compte. */
export async function resetPassword(token: string, password: string): Promise<ResetResult> {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères` };
  }

  const { data: reset } = await supabaseServer
    .from('password_resets')
    .select('id, account_type, account_id, expires_at, used_at')
    .eq('token_hash', hashToken(token))
    .maybeSingle();

  if (!reset || reset.used_at || new Date(reset.expires_at) <= new Date()) {
    return { ok: false, error: 'Ce lien est invalide ou a expiré. Demandez-en un nouveau.' };
  }

  // Marqué utilisé d'abord : deux envois simultanés du même lien ne passent pas
  const { data: claimed } = await supabaseServer
    .from('password_resets')
    .update({ used_at: new Date().toISOString() })
    .eq('id', reset.id)
    .is('used_at', null)
    .select('id');
  if (!claimed?.length) {
    return { ok: false, error: 'Ce lien a déjà été utilisé. Demandez-en un nouveau.' };
  }

  const account = ACCOUNTS[reset.account_type as AccountType];
  const passwordHash = await bcrypt.hash(password, 10);

  const { error } = await supabaseServer
    .from(account.table)
    .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
    .eq('id', reset.account_id);
  if (error) {
    console.error('❌ Réinitialisation du mot de passe:', error);
    return { ok: false, error: 'Le mot de passe n’a pas pu être modifié. Réessayez.' };
  }

  // Déconnecte tous les appareils : un éventuel intrus perd l'accès
  await supabaseServer.from(account.sessions).delete().eq(account.sessionKey, reset.account_id);

  return { ok: true, login: account.login };
}
