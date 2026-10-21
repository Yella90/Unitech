// lib/secrets.ts
// Clés des fournisseurs IA (table api_keys) : chiffrées en base avec
// EMAIL_ENCRYPTION_KEY, déchiffrées uniquement au moment d'appeler le
// fournisseur, et jamais renvoyées en entier au back-office.
import { decryptPassword, encryptPassword, isEncrypted } from '@/lib/encryption';
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
 * Chiffre les clés encore stockées en clair. Lancé une fois par processus,
 * sur le serveur qui détient EMAIL_ENCRYPTION_KEY.
 */
export async function sealPlaintextApiKeys(): Promise<void> {
  if (sweepDone || !process.env.EMAIL_ENCRYPTION_KEY) return;
  sweepDone = true;
  try {
    const { data } = await supabaseServer.from('api_keys').select('id, key_value');
    for (const row of data || []) {
      if (typeof row.key_value === 'string' && row.key_value && !isEncrypted(row.key_value)) {
        await supabaseServer.from('api_keys').update({ key_value: sealSecret(row.key_value) }).eq('id', row.id);
      }
    }
  } catch (error) {
    sweepDone = false;
    console.error('❌ Chiffrement des clés IA:', error);
  }
}
