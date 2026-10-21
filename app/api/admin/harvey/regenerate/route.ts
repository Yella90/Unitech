// app/api/admin/harvey/regenerate/route.ts
// Remet des e-mails en file pour que HARVEY régénère leur réponse. La tâche
// de fond (lib/agents/harvey-v2/auto-start.ts, toutes les 2 minutes) produit
// la nouvelle réponse ; la requête ne bloque donc pas pendant les appels IA.
import { NextRequest, NextResponse } from 'next/server';
import { authorizationErrorResponse, requirePermission } from '@/lib/auth/session';
import { supabaseServer } from '@/lib/supabase-admin';
import { harveyV2 } from '@/lib/agents/harvey-v2/HarveyV2';

export const dynamic = 'force-dynamic';

const MAX_IDS = 200;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// On ne touche pas aux réponses validées, en cours d'envoi ou déjà envoyées
const REGENERABLE = ['review', 'response_ready', 'error', 'pending', 'analyzed', 'archived'];

export async function POST(req: NextRequest) {
  try {
    await requirePermission('ai.regenerate');

    const body = await req.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body.ids) ? body.ids.filter((id: unknown) => typeof id === 'string' && UUID.test(id)) : [];
    if (ids.length === 0 || ids.length > MAX_IDS) {
      return NextResponse.json({ error: `Entre 1 et ${MAX_IDS} e-mails à régénérer` }, { status: 400 });
    }

    const reset = {
      status: 'pending',
      harvey_response: null,
      harvey_response_html: null,
      harvey_response_json: null,
      harvey_confidence: null,
      harvey_tone: null,
      harvey_actions: null,
      harvey_suggested_agent: null,
      harvey_requires_review: null,
      error_message: null,
      processed_at: null,
      updated_at: new Date().toISOString(),
    };

    // E-mails archivés comme automatiques : l'admin demande une réponse malgré
    // tout, HARVEY ne doit donc plus les écarter
    const forced = await supabaseServer
      .from('emails')
      .update({ ...reset, ai_analysis: { harvey_force_reply: true } })
      .in('id', ids)
      .eq('status', 'archived')
      .not('ai_analysis->>harvey_skipped', 'is', null)
      .select('id');

    const { data, error } = forced.error
      ? forced
      : await supabaseServer.from('emails').update(reset).in('id', ids).in('status', REGENERABLE).select('id');

    if (error) {
      console.error('❌ Régénération (admin):', error);
      return NextResponse.json({ error: 'Les e-mails n’ont pas pu être remis en file' }, { status: 500 });
    }

    // Le service garde en mémoire les e-mails déjà traités : on les oublie
    const cache = (harveyV2 as unknown as { processedEmails?: Set<string> }).processedEmails;
    for (const row of data || []) cache?.delete(row.id);

    return NextResponse.json({ success: true, queued: data?.length ?? 0 });
  } catch (error) {
    const authorizationResponse = authorizationErrorResponse(error);
    if (authorizationResponse) return authorizationResponse;
    console.error('❌ /api/admin/harvey/regenerate:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
