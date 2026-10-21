// app/api/auth/password/reset/route.ts
// Nouveau mot de passe à partir du lien reçu par e-mail.
import { NextRequest, NextResponse } from 'next/server';
import { resetPassword } from '@/lib/auth/password-reset';
import { clientIp, takeToken } from '@/lib/api/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!takeToken(`reset:ip:${clientIp(req)}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans quelques minutes.' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const token = typeof body.token === 'string' ? body.token : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!token || token.length > 200) {
    return NextResponse.json({ error: 'Lien invalide' }, { status: 400 });
  }

  const result = await resetPassword(token, password);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true, login: result.login });
}
