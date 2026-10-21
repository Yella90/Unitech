// app/api/leads/chatbot/route.ts
// Enregistre une conversation du chatbot public comme lead (une seule fois
// par session). Remplace l'écriture directe dans leads avec la clé anon.
import { NextRequest, NextResponse } from 'next/server';
import { leadManagement } from '@/lib/services/lead-management-server';
import { clientIp, takeToken } from '@/lib/api/rate-limit';

export const dynamic = 'force-dynamic';

const WINDOW_MS = 10 * 60 * 1000;
const LIMIT_PER_IP = 10;
const MAX_MESSAGES = 50;
const MAX_MESSAGE_CHARS = 4000;

export async function POST(req: NextRequest) {
  if (!takeToken(`lead:${clientIp(req)}`, LIMIT_PER_IP, WINDOW_MS)) {
    return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const sessionId = typeof body?.sessionId === 'string' ? body.sessionId.slice(0, 100) : '';
  if (!sessionId || !Array.isArray(body?.messages)) {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 });
  }

  const messages = body.messages.slice(-MAX_MESSAGES).map((m: any) => ({
    role: m?.role === 'user' ? 'user' : 'assistant',
    content: String(m?.content ?? '').slice(0, MAX_MESSAGE_CHARS),
    timestamp: typeof m?.timestamp === 'string' ? m.timestamp : new Date().toISOString(),
  }));

  try {
    const existing = await leadManagement.getLeadBySession(sessionId);
    if (existing) return NextResponse.json({ id: existing.id });

    const lead = await leadManagement.createLead({
      session_id: sessionId,
      source: 'chatbot',
      messages,
      conversation_summary: messages.map((m: { content: string }) => m.content).join(' ').substring(0, 500),
      status: 'new',
    });
    return NextResponse.json({ id: lead?.id ?? null });
  } catch (error) {
    console.error('❌ /api/leads/chatbot:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
