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

describe('jetons de session', () => {
  it('stocke une empreinte stable et différente du jeton', () => {
    const token = newSessionToken();
    expect(token).toHaveLength(64);
    expect(hashSessionToken(token)).toBe(hashSessionToken(token));
    expect(hashSessionToken(token)).not.toBe(token);
  });
});
