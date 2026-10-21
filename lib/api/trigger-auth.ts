// lib/api/trigger-auth.ts
// Autorise le déclenchement manuel des agents : soit un cron muni de
// CRON_SECRET, soit un admin connecté qui a la permission demandée.
// Fermé par défaut : sans CRON_SECRET configuré, seul l'admin passe.
import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { authorizationErrorResponse, requirePermission } from '@/lib/auth/session';
import type { Permission } from '@/lib/auth/rbac';

function hasValidCronSecret(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  const header = request.headers.get('authorization');
  if (!expected || !header?.startsWith('Bearer ')) return false;

  const given = Buffer.from(header.substring(7));
  const wanted = Buffer.from(expected);
  return given.length === wanted.length && crypto.timingSafeEqual(given, wanted);
}

/** Renvoie une réponse d'erreur si la requête n'est pas autorisée, sinon null. */
export async function requireTriggerAccess(
  request: Request,
  permission: Permission
): Promise<NextResponse | null> {
  if (hasValidCronSecret(request)) return null;

  try {
    await requirePermission(permission);
    return null;
  } catch (error) {
    return (
      authorizationErrorResponse(error) ??
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );
  }
}
