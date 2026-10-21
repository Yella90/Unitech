// app/api/admin/upload/route.ts
// Upload d'images de projet par le back-office, avec la clé service :
// le bucket n'accepte plus d'écriture avec la clé anon.
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, authorizationErrorResponse } from '@/lib/auth/session';
import { supabaseServer } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

const BUCKET = 'project-images';
const MAX_SIZE = 5 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export async function POST(req: NextRequest) {
  try {
    await requirePermission('projects.edit');

    const form = await req.formData();
    const file = form.get('file');
    const projectId = String(form.get('projectId') || 'divers').replace(/[^\w-]/g, '');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });
    }
    const extension = EXTENSIONS[file.type];
    if (!extension) {
      return NextResponse.json({ error: 'Format non accepté (JPEG, PNG, WebP ou GIF)' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "L'image ne doit pas dépasser 5MB" }, { status: 400 });
    }

    const path = `projects/${projectId}_${Date.now()}.${extension}`;
    const { error } = await supabaseServer.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });

    if (error) {
      console.error('❌ Upload image projet:', error);
      return NextResponse.json({ error: "Erreur lors de l'upload de l'image" }, { status: 500 });
    }

    const { data } = supabaseServer.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (error) {
    const authorizationResponse = authorizationErrorResponse(error);
    if (authorizationResponse) return authorizationResponse;
    console.error('❌ /api/admin/upload:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
