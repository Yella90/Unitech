// app/api/auth/password/route.ts
// Changement du mot de passe de l'utilisateur admin connecté. La
// vérification se fait ici : le hash ne quitte jamais le serveur.
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getCurrentUser } from '@/lib/auth/session';
import { supabaseServer } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

const MIN_LENGTH = 8;

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentification requise' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Mot de passe actuel et nouveau mot de passe requis' }, { status: 400 });
  }
  if (newPassword.length < MIN_LENGTH) {
    return NextResponse.json({ error: `Le mot de passe doit contenir au moins ${MIN_LENGTH} caractères` }, { status: 400 });
  }

  const { data: row, error } = await supabaseServer
    .from('users')
    .select('password_hash')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !row?.password_hash) {
    console.error('❌ Changement de mot de passe, lecture:', error);
    return NextResponse.json({ error: 'Erreur lors de la vérification' }, { status: 500 });
  }

  if (!(await bcrypt.compare(currentPassword, row.password_hash))) {
    return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  const { error: updateError } = await supabaseServer
    .from('users')
    .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (updateError) {
    console.error('❌ Changement de mot de passe, écriture:', updateError);
    return NextResponse.json({ error: 'Erreur lors du changement de mot de passe' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
