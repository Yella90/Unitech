// app/api/client/mail/decrypt-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateClient } from '@/lib/api/auth';
import { decryptPassword } from '@/lib/encryption';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    // 1. Authentification du client
    const authResult = await authenticateClient(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Non authentifié' },
        { status: 401 }
      );
    }

    // 2. Récupérer le mot de passe chiffré
    const body = await req.json();
    const { encrypted } = body;

    if (!encrypted) {
      return NextResponse.json(
        { error: 'Mot de passe chiffré requis' },
        { status: 400 }
      );
    }

    // 3. Vérifier que le mot de passe appartient au client
    const { data: mailAccount, error: mailError } = await supabase
      .from('mail_accounts')
      .select('id, email_password')
      .eq('client_id', authResult.client.id)
      .eq('is_active', true)
      .single();

    if (mailError || !mailAccount) {
      return NextResponse.json(
        { error: 'Aucun compte mail configuré' },
        { status: 404 }
      );
    }

    // 4. Vérifier que le mot de passe correspond
    if (mailAccount.email_password !== encrypted) {
      return NextResponse.json(
        { error: 'Le mot de passe ne correspond pas au compte' },
        { status: 403 }
      );
    }

    // 5. Déchiffrer le mot de passe
    const decrypted = decryptPassword(encrypted);

    if (!decrypted) {
      return NextResponse.json(
        { error: 'Échec du déchiffrement du mot de passe' },
        { status: 500 }
      );
    }

    // 6. Retourner le mot de passe déchiffré
    return NextResponse.json({
      success: true,
      password: decrypted
    });

  } catch (error: any) {
    console.error('❌ Erreur déchiffrement:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors du déchiffrement' },
      { status: 500 }
    );
  }
}