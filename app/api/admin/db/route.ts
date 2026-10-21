// app/api/admin/db/route.ts
// Exécute côté serveur les requêtes du back-office (voir lib/admin-db).
// Le navigateur n'a plus besoin d'accès direct aux tables via la clé anon.
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { supabaseServer } from '@/lib/supabase-admin';
import { ADMIN_PANEL_ROLES, checkQuery } from '@/lib/admin-db/policy';
import { executeQuery } from '@/lib/admin-db/execute';
import type { DbQuerySpec } from '@/lib/admin-db/types';

export const dynamic = 'force-dynamic';

function fail(status: number, message: string) {
  return NextResponse.json({ data: null, count: null, status, error: { message } }, { status });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return fail(401, 'Authentification requise');
  if (!ADMIN_PANEL_ROLES.includes(user.role)) return fail(403, 'Accès réservé aux administrateurs');

  let spec: DbQuerySpec;
  try {
    spec = await req.json();
  } catch {
    return fail(400, 'Requête invalide');
  }

  const refusal = checkQuery(spec, user);
  if (refusal) return fail(403, refusal);

  try {
    return NextResponse.json(await executeQuery(supabaseServer, spec));
  } catch (error) {
    console.error('❌ /api/admin/db:', error);
    return fail(500, 'Erreur serveur');
  }
}
