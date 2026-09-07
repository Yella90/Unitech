// app/api/client/mail/emails/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authenticateClient } from '@/lib/api/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ✅ params est une Promise
) {
  try {
    // 1. Authentification
    const authResult = await authenticateClient(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    // 2. ✅ Déballer params avec await
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Statut requis' },
        { status: 400 }
      );
    }

    // 3. Vérifier que l'email appartient au client
    const { data: email, error: checkError } = await supabase
      .from('emails')
      .select('id, client_id')
      .eq('id', id)
      .eq('client_id', authResult.client.id)
      .single();

    if (checkError || !email) {
      return NextResponse.json(
        { error: 'Email non trouvé ou non autorisé' },
        { status: 404 }
      );
    }

    // 4. Mettre à jour le statut
    const { data, error } = await supabase
      .from('emails')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur mise à jour statut:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error: any) {
    console.error('❌ Erreur PATCH status:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}