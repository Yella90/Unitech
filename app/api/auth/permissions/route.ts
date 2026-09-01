// app/api/auth/permissions/route.ts
import { NextResponse } from 'next/server';
import { authorizationErrorResponse, getCurrentUser } from '@/lib/auth/session';
import { PERMISSIONS, getScope, isRole } from '@/lib/auth/rbac';
import { Role } from '@/lib/auth/rbac';

/**
 * Capabilities for UI adaptation only. Every mutation remains server-authorized.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const role = user.role as Role;
    
    if (!isRole(role)) {
      return NextResponse.json(
        { error: 'Rôle invalide' },
        { status: 403 }
      );
    }

    // ✅ Correction : Utiliser Object.values et flatMap correctement
    const permissions = PERMISSIONS[role] || [];
    
    // ✅ Correction : getScope avec un seul argument
    const scopes = getScope(role);

    return NextResponse.json({
      success: true,
      data: {
        role,
        permissions,
        scopes,
        isAdmin: ['super_admin', 'admin', 'project_manager', 'team_lead', 'developer'].includes(role),
      }
    });

  } catch (error: unknown) {
    const authorizationResponse = authorizationErrorResponse(error);
    if (authorizationResponse) return authorizationResponse;
    
    console.error('❌ Erreur permissions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur interne' 
      },
      { status: 500 }
    );
  }
}