import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { hasPermission, isRole, type Permission, type Role } from './rbac';

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: Role;
  first_name?: string | null;
  last_name?: string | null;
};

export class AuthorizationError extends Error {
  constructor(public readonly status: 401 | 403, message: string) {
    super(message);
  }
}

/** Temporary adapter for the existing session_token authentication.
 * Route handlers should use this instead of trusting a client supplied role.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  if (!supabaseAdmin) return null;

  const token = (await cookies()).get('session_token')?.value;
  if (!token) return null;

  const { data: session } = await supabaseAdmin
    .from('sessions')
    .select('expires_at, users(id, email, role, first_name, last_name, is_active)')
    .eq('token', token)
    .maybeSingle();

  const user = session?.users as unknown as (AuthenticatedUser & { is_active?: boolean }) | null;
  if (!session || !user || !user.is_active || new Date(session.expires_at) <= new Date() || !isRole(user.role)) {
    return null;
  }

  return user;
}

export async function requirePermission(permission: Permission): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthorizationError(401, 'Authentification requise');
  if (!hasPermission(user.role, permission)) throw new AuthorizationError(403, 'Permission insuffisante');
  return user;
}

export function authorizationErrorResponse(error: unknown): NextResponse | null {
  if (error instanceof AuthorizationError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return null;
}

export async function writeAuditLog(input: {
  actorUserId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  result: 'success' | 'denied' | 'failure';
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (!supabaseAdmin) return;

  const { error } = await supabaseAdmin.from('audit_logs').insert({
    actor_user_id: input.actorUserId,
    action: input.action,
    resource_type: input.resourceType,
    resource_id: input.resourceId ?? null,
    result: input.result,
    metadata: input.metadata ?? {},
  });

  // Auditing must not make a successful business operation fail while the
  // migration is being rolled out. Log only a non-sensitive diagnostic.
  if (error) console.error('Audit log write failed', { code: error.code });
}
