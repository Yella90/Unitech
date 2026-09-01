// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { authorizationErrorResponse, requirePermission, writeAuditLog, getCurrentUser } from '@/lib/auth/session';
import { isRole, Permission, ADMIN_ROLES } from '@/lib/auth/rbac';
import { supabaseAdmin } from '@/lib/supabase';

// ============================================================
// FONCTION DE VÉRIFICATION DE supabaseAdmin
// ============================================================
function requireAdminClient() {
  if (!supabaseAdmin) {
    throw new Error('supabaseAdmin n\'est pas disponible. Vérifiez la clé SERVICE_ROLE_KEY.');
  }
  return supabaseAdmin;
}

// ============================================================
// GET - Récupérer la liste des utilisateurs
// ============================================================
export async function GET(req: NextRequest) {
  try {
    await requirePermission('users.view' as Permission);
    
    const adminClient = requireAdminClient();
    
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const role = searchParams.get('role');
    const search = searchParams.get('search');

    let query = adminClient
      .from('users')
      .select('id, email, first_name, last_name, role, is_active, created_at, last_login_at', { count: 'exact' });

    if (role) {
      query = query.eq('role', role);
    }

    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }

    const { data: users, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('❌ Erreur récupération utilisateurs:', error);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération des utilisateurs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: users,
      total: count || 0,
      limit,
      offset
    });

  } catch (error: unknown) {
    const authorizationResponse = authorizationErrorResponse(error);
    if (authorizationResponse) return authorizationResponse;
    
    console.error('❌ Erreur GET users:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur interne' 
      },
      { status: 500 }
    );
  }
}

// ============================================================
// POST - Créer un utilisateur
// ============================================================
export async function POST(req: NextRequest) {
  try {
    await requirePermission('users.create' as Permission);
    
    const adminClient = requireAdminClient();
    
    const body = await req.json();
    const { email, password, first_name, last_name, role, is_active } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Format d\'email invalide' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      );
    }

    if (role && !isRole(role)) {
      return NextResponse.json(
        { success: false, error: 'Rôle invalide' },
        { status: 400 }
      );
    }

    const { data: existing, error: checkError } = await adminClient
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Cet email est déjà utilisé' },
        { status: 409 }
      );
    }

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Erreur vérification email:', checkError);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la vérification' },
        { status: 500 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const { data: user, error: createError } = await adminClient
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        first_name: first_name || null,
        last_name: last_name || null,
        role: role || 'viewer',
        is_active: is_active !== undefined ? is_active : true,
        created_at: new Date().toISOString()
      })
      .select('id, email, first_name, last_name, role, is_active, created_at')
      .single();

    if (createError) {
      console.error('❌ Erreur création utilisateur:', createError);
      
      if (createError.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Cet email est déjà utilisé' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la création de l\'utilisateur' },
        { status: 500 }
      );
    }

    // ✅ Journaliser l'action - Format correct
    try {
      const currentUser = await getCurrentUser();
      await writeAuditLog({
        actorUserId: currentUser?.id || 'system',
        action: 'user.create',
        resourceType: 'user',
        resourceId: user.id,
        result: 'success',
        metadata: { 
          email: user.email, 
          role: user.role,
          created_by: currentUser?.email || 'system'
        }
      });
    } catch (auditError) {
      console.warn('⚠️ Erreur journalisation:', auditError);
    }

    return NextResponse.json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: user
    });

  } catch (error: unknown) {
    const authorizationResponse = authorizationErrorResponse(error);
    if (authorizationResponse) return authorizationResponse;
    
    console.error('❌ Erreur POST users:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur interne' 
      },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH - Mettre à jour un utilisateur
// ============================================================
export async function PATCH(req: NextRequest) {
  try {
    await requirePermission('users.edit' as Permission);
    
    const adminClient = requireAdminClient();
    
    const body = await req.json();
    const { id, first_name, last_name, role, is_active, password } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID utilisateur requis' },
        { status: 400 }
      );
    }

    if (role && !isRole(role)) {
      return NextResponse.json(
        { success: false, error: 'Rôle invalide' },
        { status: 400 }
      );
    }

    const { data: existing, error: findError } = await adminClient
      .from('users')
      .select('id, role, email')
      .eq('id', id)
      .single();

    if (findError || !existing) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    const updates: any = {};
    if (first_name !== undefined) updates.first_name = first_name;
    if (last_name !== undefined) updates.last_name = last_name;
    if (role !== undefined) updates.role = role;
    if (is_active !== undefined) updates.is_active = is_active;
    
    if (password && password.length >= 8) {
      const salt = await bcrypt.genSalt(10);
      updates.password_hash = await bcrypt.hash(password, salt);
    } else if (password && password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      );
    }
    
    updates.updated_at = new Date().toISOString();

    const { data: user, error: updateError } = await adminClient
      .from('users')
      .update(updates)
      .eq('id', id)
      .select('id, email, first_name, last_name, role, is_active, created_at, updated_at')
      .single();

    if (updateError) {
      console.error('❌ Erreur mise à jour utilisateur:', updateError);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la mise à jour' },
        { status: 500 }
      );
    }

    // ✅ Journaliser l'action - Format correct
    try {
      const currentUser = await getCurrentUser();
      await writeAuditLog({
        actorUserId: currentUser?.id || 'system',
        action: 'user.update',
        resourceType: 'user',
        resourceId: user.id,
        result: 'success',
        metadata: { 
          email: user.email,
          updated_fields: Object.keys(updates).filter(k => k !== 'password_hash'),
          updated_by: currentUser?.email || 'system'
        }
      });
    } catch (auditError) {
      console.warn('⚠️ Erreur journalisation:', auditError);
    }

    return NextResponse.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      data: user
    });

  } catch (error: unknown) {
    const authorizationResponse = authorizationErrorResponse(error);
    if (authorizationResponse) return authorizationResponse;
    
    console.error('❌ Erreur PATCH users:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur interne' 
      },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE - Supprimer un utilisateur
// ============================================================
export async function DELETE(req: NextRequest) {
  try {
    await requirePermission('users.delete' as Permission);
    
    const adminClient = requireAdminClient();
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID utilisateur requis' },
        { status: 400 }
      );
    }

    const { data: existing, error: findError } = await adminClient
      .from('users')
      .select('id, email, role')
      .eq('id', id)
      .single();

    if (findError || !existing) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier qu'on ne supprime pas le dernier admin
    if (existing.role === 'super_admin' || existing.role === 'admin') {
      const { count, error: countError } = await adminClient
        .from('users')
        .select('id', { count: 'exact', head: true })
        .in('role', ['super_admin', 'admin']);

      if (!countError && count && count <= 1) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Impossible de supprimer le dernier administrateur' 
          },
          { status: 400 }
        );
      }
    }

    const { error: deleteError } = await adminClient
      .from('users')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('❌ Erreur suppression utilisateur:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la suppression' },
        { status: 500 }
      );
    }

    // ✅ Journaliser l'action - Format correct
    try {
      const currentUser = await getCurrentUser();
      await writeAuditLog({
        actorUserId: currentUser?.id || 'system',
        action: 'user.delete',
        resourceType: 'user',
        resourceId: id,
        result: 'success',
        metadata: { 
          email: existing.email, 
          role: existing.role,
          deleted_by: currentUser?.email || 'system'
        }
      });
    } catch (auditError) {
      console.warn('⚠️ Erreur journalisation:', auditError);
    }

    return NextResponse.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });

  } catch (error: unknown) {
    const authorizationResponse = authorizationErrorResponse(error);
    if (authorizationResponse) return authorizationResponse;
    
    console.error('❌ Erreur DELETE users:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur interne' 
      },
      { status: 500 }
    );
  }
}