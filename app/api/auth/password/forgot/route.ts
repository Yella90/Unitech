// app/api/auth/password/forgot/route.ts
// Demande de lien de réinitialisation (admin ou client). Réponse identique
// que le compte existe ou non.
import { NextRequest, NextResponse } from 'next/server';
import { requestPasswordReset, type AccountType } from '@/lib/auth/password-reset';
import { envoiDisponible } from '@/lib/email/mail-sortant';
import { clientIp, takeToken } from '@/lib/api/rate-limit';

export const dynamic = 'force-dynamic';

const GENERIC_REPLY =
  'Si un compte correspond à cette adresse, un e-mail contenant un lien de réinitialisation vient de lui être envoyé. Pensez à vérifier vos courriers indésirables.';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const type: AccountType = body.type === 'admin' ? 'admin' : 'client';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'Adresse e-mail invalide' }, { status: 400 });
  }

  if (!envoiDisponible()) {
    return NextResponse.json(
      { error: "La réinitialisation par e-mail n'est pas encore disponible. Contactez l'équipe UNITECH." },
      { status: 503 }
    );
  }

  // Limites : par adresse IP et par adresse e-mail
  if (
    !takeToken(`forgot:ip:${clientIp(req)}`, 5, 15 * 60 * 1000) ||
    !takeToken(`forgot:email:${type}:${email}`, 3, 60 * 60 * 1000)
  ) {
    return NextResponse.json({ error: 'Trop de demandes. Réessayez dans quelques minutes.' }, { status: 429 });
  }

  try {
    await requestPasswordReset(type, email);
  } catch (error) {
    // Erreur journalisée, réponse inchangée : rien ne révèle l'existence du compte
    console.error('❌ Mot de passe oublié:', error);
  }

  return NextResponse.json({ success: true, message: GENERIC_REPLY });
}
