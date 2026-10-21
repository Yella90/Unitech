// lib/auth/session-token.ts
// Jetons de session : le cookie contient le jeton, la base n'en garde que
// l'empreinte SHA-256. Une fuite de la table sessions ne permet donc pas de
// se connecter à la place de quelqu'un.
import crypto from 'crypto';

export function newSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
