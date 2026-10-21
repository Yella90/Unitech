import { describe, expect, it } from 'vitest';
import { isMaskedSecret, maskSecret, revealSecret, sealSecret } from '@/lib/secrets';
import { hashSessionToken, newSessionToken } from '@/lib/auth/session-token';

describe('clés des fournisseurs IA', () => {
  const key = 'gsk_1234567890abcdefWXYZ';

  it('chiffre puis déchiffre', () => {
    const sealed = sealSecret(key);
    expect(sealed).not.toContain(key);
    expect(revealSecret(sealed)).toBe(key);
  });

  it('ne chiffre pas deux fois', () => {
    const sealed = sealSecret(key);
    expect(sealSecret(sealed)).toBe(sealed);
  });

  it('rend les anciennes valeurs en clair telles quelles', () => {
    expect(revealSecret(key)).toBe(key);
  });

  it('masque la clé, chiffrée ou non', () => {
    expect(maskSecret(sealSecret(key))).toBe('gsk_…WXYZ');
    expect(maskSecret(key)).toBe('gsk_…WXYZ');
    expect(isMaskedSecret(maskSecret(key))).toBe(true);
  });
});

describe('rotation de la clé de chiffrement', () => {
  const OLD = 'ab'.repeat(32);

  it('relit avec l’ancienne clé et signale qu’il faut re-chiffrer', async () => {
    const { decryptSecretDetailed, encryptPassword, needsReencryption } = await import('@/lib/encryption');
    const current = process.env.EMAIL_ENCRYPTION_KEY;

    process.env.EMAIL_ENCRYPTION_KEY = OLD;
    const oldValue = encryptPassword('mot-de-passe-imap');
    process.env.EMAIL_ENCRYPTION_KEY = current;

    // Sans ancienne clé déclarée : illisible
    delete process.env.EMAIL_ENCRYPTION_KEY_PREVIOUS;
    expect(decryptSecretDetailed(oldValue)).toBeNull();

    // Pendant la rotation : lisible, marqué « previous »
    process.env.EMAIL_ENCRYPTION_KEY_PREVIOUS = OLD;
    expect(decryptSecretDetailed(oldValue)).toEqual({ plain: 'mot-de-passe-imap', key: 'previous' });
    expect(needsReencryption(oldValue)).toBe(true);

    // Une valeur chiffrée avec la nouvelle clé reste « current »
    const newValue = encryptPassword('mot-de-passe-imap');
    expect(decryptSecretDetailed(newValue)?.key).toBe('current');
    expect(needsReencryption(newValue)).toBe(false);

    delete process.env.EMAIL_ENCRYPTION_KEY_PREVIOUS;
  });
});

describe('jetons de session', () => {
  it('stocke une empreinte stable et différente du jeton', () => {
    const token = newSessionToken();
    expect(token).toHaveLength(64);
    expect(hashSessionToken(token)).toBe(hashSessionToken(token));
    expect(hashSessionToken(token)).not.toBe(token);
  });
});
