// app/api/client/services/cancel/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { authenticateAPIRequest } from '@/lib/api/auth';

// ✅ Fonction utilitaire pour vérifier supabaseAdmin
function getAdminClient() {
  if (!supabaseAdmin) {
    throw new Error('supabaseAdmin n\'est pas disponible. Vérifiez la clé SERVICE_ROLE_KEY.');
  }
  return supabaseAdmin;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ✅ params est maintenant une Promise
) {
  try {
    // 1. Authentification
    const authResult = await authenticateAPIRequest(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    const client = authResult.client;
    
    // ✅ Attendre la résolution des params
    const { id } = await params;

    // 2. Validation
    if (!id) {
      return NextResponse.json(
        { error: 'ID de souscription requis' },
        { status: 400 }
      );
    }

    // 3. Vérifier que supabaseAdmin est disponible
    let adminClient;
    try {
      adminClient = getAdminClient();
    } catch (adminError) {
      console.error('❌ Erreur adminClient:', adminError);
      return NextResponse.json(
        { error: 'Erreur de configuration serveur' },
        { status: 500 }
      );
    }

    // 4. Vérifier que la souscription appartient au client
    const { data: subscription, error: checkError } = await adminClient
      .from('client_services')
      .select('id, client_id, service_id, status')
      .eq('id', id)
      .eq('client_id', client.id)
      .single();

    if (checkError || !subscription) {
      return NextResponse.json(
        { error: 'Souscription non trouvée' },
        { status: 404 }
      );
    }

    // 5. Vérifier si déjà annulée
    if (subscription.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cette souscription est déjà annulée' },
        { status: 400 }
      );
    }

    // 6. Vérifier si la souscription est expirée
    if (subscription.status === 'expired') {
      return NextResponse.json(
        { error: 'Cette souscription est déjà expirée' },
        { status: 400 }
      );
    }

    // 7. Annuler la souscription
    const { error: updateError } = await adminClient
      .from('client_services')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('❌ Erreur annulation:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de l\'annulation' },
        { status: 500 }
      );
    }

    console.log(`✅ Souscription ${id} annulée pour ${client.email}`);

    return NextResponse.json({
      success: true,
      message: 'Souscription annulée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur annulation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}