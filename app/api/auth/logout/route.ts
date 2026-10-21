// app/api/auth/logout/route.ts
import { hashSessionToken } from '@/lib/auth/session-token';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { supabaseServer as supabase } from '@/lib/supabase-admin';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    const adminClient = supabaseAdmin ?? supabase;

    if (sessionToken) {
      // Supprimer la session de la base de données
      await adminClient
        .from('sessions')
        .delete()
        .eq('token', hashSessionToken(sessionToken));
    }

    // Supprimer le cookie
    cookieStore.delete('session_token');

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}