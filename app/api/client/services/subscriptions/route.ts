// app/api/client/services/subscriptions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authenticateAPIRequest } from '@/lib/api/auth';

export async function GET(req: NextRequest) {
  try {
    // ✅ Authentification requise pour les souscriptions
    const authResult = await authenticateAPIRequest(req);
    if (!authResult.success) {
      // ✅ Retourner un tableau vide au lieu d'une erreur 401
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Non authentifié'
      });
    }

    const client = authResult.client;

    // ✅ Récupérer les souscriptions du client
    const { data: subscriptions, error } = await supabase
      .from('client_services')
      .select(`
        *,
        service:service_id (
          id,
          name,
          slug,
          description,
          category,
          type,
          icon,
          features,
          color,
          is_active,
          order_index,
          price_monthly,
          price_yearly
        )
      `)
      .eq('client_id', client.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur récupération souscriptions:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des souscriptions' },
        { status: 500 }
      );
    }

    console.log(`✅ ${subscriptions?.length || 0} souscriptions chargées`);

    return NextResponse.json({
      success: true,
      data: subscriptions || []
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}