// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function middleware(req: NextRequest) {
  const response = NextResponse.next({
    request: { headers: req.headers },
  });

  const sessionToken = req.cookies.get('session_token')?.value;
  const adminClient = supabaseAdmin ?? createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll().map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  let session = null;
  let error = null;

  if (sessionToken) {
    const result = await adminClient
      .from('sessions')
      .select('*, users(*)')
      .eq('token', sessionToken)
      .single();

    session = result.data;
    error = result.error;
  }

  console.log('🔍 Middleware - Session:', {
    hasSession: !!session,
    userEmail: session?.users?.email,
    error: error?.message || 'aucune',
  });

  const pathname = req.nextUrl.pathname;
  const adminRoles = ['admin', 'super_admin'];

  if (pathname === '/login' && session) {
    console.log('🚀 Utilisateur connecté sur /login, redirection vers /admin');
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (!session) {
      console.log('🔒 Accès admin refusé : pas de session');
      return NextResponse.redirect(new URL('/login?error=unauthorized&message=Accès réservé aux administrateurs', req.url));
    }

    if (!session.users || !adminRoles.includes(session.users.role)) {
      console.log('🔒 Accès admin refusé : rôle non autorisé', {
        role: session.users?.role,
        error: error?.message,
      });
      return NextResponse.redirect(new URL('/login?error=unauthorized&message=Accès réservé aux administrateurs', req.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/login', '/admin', '/admin/:path*'],
};
