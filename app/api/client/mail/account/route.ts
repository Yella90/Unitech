// app/api/client/mail/account/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authenticateAPIRequest } from '@/lib/api/auth';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateAPIRequest(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    const client = authResult.client;

    const { data, error } = await supabase
      .from('mail_accounts')
      .select('*')
      .eq('client_id', client.id)
      .eq('is_active', true)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Erreur récupération compte mail:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération du compte mail' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || null
    });

  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}