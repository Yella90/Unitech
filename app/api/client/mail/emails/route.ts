// app/api/client/mail/emails/route.ts
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
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .eq('client_id', client.id)
      .order('received_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erreur récupération emails:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des emails' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}