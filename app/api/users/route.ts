import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { authorizationErrorResponse, requirePermission, writeAuditLog } from '@/lib/auth/session';
import { hasPermission, isRole } from '@/lib/auth/rbac';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const actor = await requirePermission('user.create');
    const { email, password, first_name, last_name, role } = await req.json();

    if (typeof email !== 'string' || typeof password !== 'string' || typeof first_name !== 'string' || typeof last_name !== 'string' || !email.trim() || !first_name.trim() || !last_name.trim()) {
      return NextResponse.json({ error: 'Email, mot de passe, prénom et nom sont requis' }, { status: 400 });
    }
    if (password.length < 12) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 12 caractères' }, { status: 400 });
    }

    const requestedRole = role ?? 'viewer';
    if (!isRole(requestedRole)) return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 });
    if (!hasPermission(actor.role, 'user.assign_role')) return NextResponse.json({ error: 'Permission insuffisante pour attribuer un rôle' }, { status: 403 });
    if (!supabaseAdmin) return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 });

    const normalizedEmail = email.trim().toLowerCase();
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { first_name: first_name.trim(), last_name: last_name.trim() },
    });
    if (authError || !authData.user) return NextResponse.json({ error: 'Impossible de créer le compte' }, { status: 400 });

    // Compatibility with the temporary custom-login flow. Remove password_hash
    // when Supabase Auth becomes the only session authority.
    const passwordHash = await bcrypt.hash(password, 10);
    const { error: profileError } = await supabaseAdmin.from('users').insert({
      id: authData.user.id,
      email: normalizedEmail,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      role: requestedRole,
      is_active: true,
      password_hash: passwordHash,
    });
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: 'Impossible de créer le profil utilisateur' }, { status: 500 });
    }

    await writeAuditLog({
      actorUserId: actor.id,
      action: 'user.create',
      resourceType: 'user',
      resourceId: authData.user.id,
      result: 'success',
      metadata: { assigned_role: requestedRole },
    });

    return NextResponse.json({ success: true, user: { id: authData.user.id, email: normalizedEmail, first_name: first_name.trim(), last_name: last_name.trim(), role: requestedRole } }, { status: 201 });
  } catch (error) {
    const authorizationResponse = authorizationErrorResponse(error);
    if (authorizationResponse) return authorizationResponse;
    console.error('User creation failed', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
