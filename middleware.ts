// middleware.ts (Version simplifiée avec gestion de supabaseAdmin null)
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const ADMIN_ROLES = ['admin', 'super_admin', 'developer'];

// ✅ Fonction pour obtenir un client Supabase
function getClient(req: NextRequest, res: NextResponse) {
  if (supabaseAdmin) return supabaseAdmin;
  
  return createServerClient(
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
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const response = NextResponse.next({ request: { headers: req.headers } });
  
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', pathname);

  // Routes publiques
  const publicRoutes = ['/', '/chat', '/about', '/contact', '/services'];
  const clientPublicRoutes = ['/client/login', '/client/register'];
  
  if (publicRoutes.includes(pathname) || clientPublicRoutes.includes(pathname)) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Routes admin
  if (pathname === '/login' || pathname.startsWith('/admin')) {
    const sessionToken = req.cookies.get('session_token')?.value;

    if (!sessionToken) {
      if (pathname === '/login') {
        return NextResponse.next({ request: { headers: requestHeaders } });
      }
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const client = getClient(req, response);
    const { data: session } = await client
      .from('sessions')
      .select('*, users(*)')
      .eq('token', sessionToken)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (!session) {
      const redirectRes = NextResponse.redirect(new URL('/login', req.url));
      redirectRes.cookies.delete('session_token');
      return redirectRes;
    }

    if (pathname === '/login') {
      if (session.users?.role && ADMIN_ROLES.includes(session.users.role)) {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    if (!ADMIN_ROLES.includes(session.users?.role)) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Routes client
  if (pathname.startsWith('/client') && !clientPublicRoutes.includes(pathname)) {
    const sessionToken = req.cookies.get('client_session_token')?.value;

    if (!sessionToken) {
      return NextResponse.redirect(new URL('/connexion', req.url));
    }

    const client = getClient(req, response);
    const { data: session } = await client
      .from('client_sessions')
      .select('*, clients(*)')
      .eq('token', sessionToken)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (!session) {
      const redirectRes = NextResponse.redirect(new URL('/connexions', req.url));
      redirectRes.cookies.delete('client_session_token');
      return redirectRes;
    }

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};