// app/api/track/route.ts
// Enregistre les visites du site public (composant Tracker). Remplace
// l'écriture directe dans page_visits avec la clé anon.
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-admin';
import { clientIp, takeToken } from '@/lib/api/rate-limit';

export const dynamic = 'force-dynamic';

const WINDOW_MS = 10 * 60 * 1000;
const LIMIT_PER_IP = 120;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function text(value: unknown, max: number): string | null {
  return typeof value === 'string' && value.length > 0 ? value.slice(0, max) : null;
}

export async function POST(req: NextRequest) {
  if (!takeToken(`track:${clientIp(req)}`, LIMIT_PER_IP, WINDOW_MS)) {
    return new NextResponse(null, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !UUID.test(body.visitor_id || '')) {
    return new NextResponse(null, { status: 400 });
  }
  const page = text(body.page, 300) || '/';

  try {
    if (body.type === 'duration') {
      const duration = Math.round(Number(body.duration));
      if (!Number.isFinite(duration) || duration <= 0 || duration > 24 * 3600) {
        return new NextResponse(null, { status: 400 });
      }
      const { data: last } = await supabaseServer
        .from('page_visits')
        .select('id')
        .eq('visitor_id', body.visitor_id)
        .eq('page', page)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (last) {
        await supabaseServer.from('page_visits').update({ duration }).eq('id', last.id);
      }
      return new NextResponse(null, { status: 204 });
    }

    await supabaseServer.from('page_visits').insert({
      page,
      visitor_id: body.visitor_id,
      session_id: UUID.test(body.session_id || '') ? body.session_id : null,
      referrer: text(body.referrer, 500),
      user_agent: text(req.headers.get('user-agent'), 500),
      device_type: text(body.device_type, 20),
      browser: text(body.browser, 30),
      os: text(body.os, 30),
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('❌ /api/track:', error);
    return new NextResponse(null, { status: 500 });
  }
}
