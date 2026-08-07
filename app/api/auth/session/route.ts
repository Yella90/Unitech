// app/api/auth/session/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    const adminClient = supabaseAdmin ?? supabase;

    if (!sessionToken) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Vérifier la session
    const { data: session, error } = await adminClient
      .from('sessions')
      .select('*, users(*)')
      .eq('token', sessionToken)
      .single();

    if (error || !session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Vérifier l'expiration
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user: session.users });
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 500 });
  }
}