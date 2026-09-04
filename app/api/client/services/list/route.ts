// app/api/client/services/list/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authenticateAPIRequest } from '@/lib/api/auth';

export async function GET(req: NextRequest) {
  try {
    // ✅ Récupérer tous les services actifs (sans authentification)
    const { data: services, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('type', { ascending: true })
      .order('order_index', { ascending: true });

    if (error) {
      console.error('❌ Erreur récupération services:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des services' },
        { status: 500 }
      );
    }

    console.log(`✅ ${services?.length || 0} services chargés`);

    return NextResponse.json({
      success: true,
      data: services || []
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}