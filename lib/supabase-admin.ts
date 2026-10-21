// lib/supabase-admin.ts
// Client Supabase réservé au serveur (clé service_role, contourne RLS).
// Ne jamais importer ce fichier depuis un composant "use client".
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquante');
  }

  client = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return client;
}

// Créé au premier usage : l'absence de clé n'empêche pas le build,
// mais toute requête échoue au lieu de retomber sur la clé publique.
export const supabaseServer = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const real = getClient();
    const value = Reflect.get(real, prop, real);
    return typeof value === 'function' ? value.bind(real) : value;
  },
});
