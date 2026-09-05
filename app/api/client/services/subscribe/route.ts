// app/api/client/services/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { authenticateAPIRequest } from '@/lib/api/auth';

// ✅ Fonction utilitaire pour vérifier supabaseAdmin
function getAdminClient() {
  if (!supabaseAdmin) {
    throw new Error('supabaseAdmin n\'est pas disponible. Vérifiez la clé SERVICE_ROLE_KEY.');
  }
  return supabaseAdmin;
}

export async function POST(req: NextRequest) {
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
    const body = await req.json();
    const { serviceId, autoRenew, expiresInDays } = body;

    // 2. Validation
    if (!serviceId) {
      return NextResponse.json(
        { error: 'ID du service requis' },
        { status: 400 }
      );
    }

    // 3. Vérifier que le service existe
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .eq('is_active', true)
      .single();

    if (serviceError || !service) {
      return NextResponse.json(
        { error: 'Service non trouvé ou inactif' },
        { status: 404 }
      );
    }

    // 4. Vérifier si le client est déjà souscrit (gestion des doublons)
    const { data: existing, error: checkError } = await supabase
      .from('client_services')
      .select('id, status')
      .eq('client_id', client.id)
      .eq('service_id', serviceId)
      .maybeSingle();

    if (existing) {
      // ✅ Si déjà actif, retourner une erreur claire
      if (existing.status === 'active') {
        return NextResponse.json(
          { 
            error: 'Vous êtes déjà souscrit à ce service',
            code: 'ALREADY_SUBSCRIBED',
            subscriptionId: existing.id
          },
          { status: 409 }
        );
      }
      
      // ✅ Si en attente, annulé ou suspendu, on le réactive
      try {
        const adminClient = getAdminClient();
        
        const { data: updated, error: updateError } = await adminClient
          .from('client_services')
          .update({
            status: 'active',
            expires_at: new Date(Date.now() + (expiresInDays || 30) * 24 * 60 * 60 * 1000).toISOString(),
            auto_renew: autoRenew || false,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Erreur réactivation:', updateError);
          return NextResponse.json(
            { error: 'Erreur lors de la réactivation' },
            { status: 500 }
          );
        }

        console.log(`✅ Service ${service.name} réactivé pour ${client.email}`);
        
        return NextResponse.json({
          success: true,
          message: 'Service réactivé avec succès',
          data: updated
        });
        
      } catch (adminError) {
        console.error('❌ Erreur adminClient:', adminError);
        return NextResponse.json(
          { error: 'Erreur de configuration serveur' },
          { status: 500 }
        );
      }
    }

    // 5. Créer une nouvelle souscription
    try {
      const adminClient = getAdminClient();
      const expiresAt = new Date(Date.now() + (expiresInDays || 30) * 24 * 60 * 60 * 1000);

      const { data: subscription, error: createError } = await adminClient
        .from('client_services')
        .insert({
          client_id: client.id,
          service_id: serviceId,
          status: 'active',
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          auto_renew: autoRenew || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Erreur souscription:', createError);
        
        // ✅ Gérer spécifiquement l'erreur de clé unique
        if (createError.code === '23505') {
          return NextResponse.json(
            { 
              error: 'Vous êtes déjà souscrit à ce service',
              code: 'ALREADY_SUBSCRIBED'
            },
            { status: 409 }
          );
        }
        
        return NextResponse.json(
          { error: 'Erreur lors de la souscription' },
          { status: 500 }
        );
      }

      console.log(`✅ Client ${client.email} souscrit au service ${service.name}`);

      return NextResponse.json({
        success: true,
        message: 'Souscription réussie',
        data: subscription
      });

    } catch (adminError) {
      console.error('❌ Erreur adminClient:', adminError);
      return NextResponse.json(
        { error: 'Erreur de configuration serveur' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Erreur souscription:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}