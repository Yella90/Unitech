// lib/secrets.ts
// Clés des fournisseurs IA (table api_keys) : chiffrées en base avec
// EMAIL_ENCRYPTION_KEY, déchiffrées uniquement au moment d'appeler le
// fournisseur, et jamais renvoyées en entier au back-office.
import { decryptPassword, decryptSecretDetailed, encryptPassword, isEncrypted } from '@/lib/encryption';
import { supabaseServer } from '@/lib/supabase-admin';

/** Chiffre une valeur si elle ne l'est pas déjà. */
export function sealSecret(value: string): string {
  return isEncrypted(value) ? value : encryptPassword(value);
}

/** Valeur en clair (les anciennes valeurs non chiffrées sont rendues telles quelles). */
export function revealSecret(value: string): string {
  return isEncrypted(value) ? decryptPassword(value) : value;
}

/** Aperçu affichable : début et fin de la clé seulement. */
export function maskSecret(value: string): string {
  let plain = value;
  try {
    plain = revealSecret(value);
  } catch {
    plain = '';
  }
  if (!plain) return '•••• (illisible)';
  return plain.length <= 12 ? '••••••••' : `${plain.slice(0, 4)}…${plain.slice(-4)}`;
}

/** Une valeur masquée renvoyée telle quelle par le formulaire d'édition. */
export function isMaskedSecret(value: string): boolean {
  return value.includes('…') || value.includes('••••');
}

let sweepDone = false;

/**
 * Remet à niveau les secrets stockés, une fois par processus, sur le serveur
 * qui détient EMAIL_ENCRYPTION_KEY :
 * - clés IA encore en clair → chiffrées ;
 * - clés IA et mots de passe de messagerie lisibles seulement avec l'ancienne
 *   clé (EMAIL_ENCRYPTION_KEY_PREVIOUS) → re-chiffrés avec la clé actuelle.
 * Les valeurs illisibles avec les deux clés sont laissées telles quelles.
 */
export async function rotateStoredSecrets(): Promise<{ apiKeys: number; mailPasswords: number; unreadable: number }> {
  const counts = { apiKeys: 0, mailPasswords: 0, unreadable: 0 };
  if (sweepDone || !process.env.EMAIL_ENCRYPTION_KEY) return counts;
  sweepDone = true;
  try {
    const { data: keys } = await supabaseServer.from('api_keys').select('id, key_value');
    for (const row of keys || []) {
      if (typeof row.key_value !== 'string' || !row.key_value) continue;
      let next: string | null = null;
      if (!isEncrypted(row.key_value)) {
        next = encryptPassword(row.key_value);
      } else {
        const result = decryptSecretDetailed(row.key_value);
        if (!result) counts.unreadable++;
        else if (result.key === 'previous') next = encryptPassword(result.plain);
      }
      if (next) {
        await supabaseServer.from('api_keys').update({ key_value: next }).eq('id', row.id);
        counts.apiKeys++;
      }
    }

    const { data: accounts } = await supabaseServer.from('mail_accounts').select('id, email_password');
    for (const row of accounts || []) {
      if (typeof row.email_password !== 'string' || !row.email_password) continue;
      const result = decryptSecretDetailed(row.email_password);
      if (!result) {
        counts.unreadable++;
      } else if (result.key === 'previous') {
        await supabaseServer
          .from('mail_accounts')
          .update({ email_password: encryptPassword(result.plain), updated_at: new Date().toISOString() })
          .eq('id', row.id);
        counts.mailPasswords++;
      }
    }

    if (counts.apiKeys || counts.mailPasswords || counts.unreadable) {
      console.log(`🔐 Secrets : ${counts.apiKeys} clés IA et ${counts.mailPasswords} mots de passe re-chiffrés, ${counts.unreadable} illisibles`);
    }
  } catch (error) {
    sweepDone = false;
    console.error('❌ Rotation des secrets:', error);
  }
  return counts;
}
