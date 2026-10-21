// proxy.ts (ex-middleware.ts, renommé pour Next 16)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabase-admin';
import { ADMIN_PANEL_ROLES as ADMIN_ROLES } from '@/lib/admin-db/policy';

// Les tables de sessions ne sont lisibles qu'avec la clé service (RLS)
function getClient() {
  return supabaseServer;
}

// Espace client : pages sous /clients et tableau de bord /dashboard
function isClientRoute(pathname: string) {
  return pathname.startsWith('/client') || pathname === '/dashboard' || pathname.startsWith('/dashboard/');
}

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  
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

    const client = getClient();
    const { data: session } = await client
      .from('sessions')
      .select('expires_at, users(role, is_active)')
      .eq('token', sessionToken)
      .gte('expires_at', new Date().toISOString())
      .single();

    const sessionUser = session?.users as unknown as { role?: string; is_active?: boolean } | null;
    if (!session || !sessionUser || sessionUser.is_active === false) {
      const redirectRes = NextResponse.redirect(new URL('/login', req.url));
      redirectRes.cookies.delete('session_token');
      return redirectRes;
    }

    if (pathname === '/login') {
      if (sessionUser.role && ADMIN_ROLES.includes(sessionUser.role)) {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    if (!sessionUser.role || !ADMIN_ROLES.includes(sessionUser.role)) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Routes client
  if (isClientRoute(pathname) && !clientPublicRoutes.includes(pathname)) {
    const sessionToken = req.cookies.get('client_session_token')?.value;

    if (!sessionToken) {
      return NextResponse.redirect(new URL('/connexion', req.url));
    }

    const client = getClient();
    const { data: session } = await client
      .from('client_sessions')
      .select('id')
      .eq('token', sessionToken)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (!session) {
      const redirectRes = NextResponse.redirect(new URL('/connexion', req.url));
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