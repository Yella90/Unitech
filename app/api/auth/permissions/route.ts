import { NextResponse } from 'next/server';
import { authorizationErrorResponse, getCurrentUser } from '@/lib/auth/session';
import { PERMISSIONS, getScope } from '@/lib/auth/rbac';

/** Capabilities for UI adaptation only. Every mutation remains server-authorized. */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Authentification requise' }, { status: 401 });

    const permissions = PERMISSIONS.flatMap((permission) => {
      const scope = getScope(user.role, permission);
      return scope === 'none' ? [] : [{ permission, scope }];
    });

    return NextResponse.json({ user: { id: user.id, role: user.role }, permissions });
  } catch (error) {
    const authorizationResponse = authorizationErrorResponse(error);
    return authorizationResponse ?? NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
