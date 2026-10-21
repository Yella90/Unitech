// lib/admin-db/execute.ts
// Traduit une DbQuerySpec (déjà validée par checkQuery) en requête Supabase.
import type { SupabaseClient } from '@supabase/supabase-js';
import { stripSensitive } from './policy';
import { isMaskedSecret, maskSecret, sealSecret } from '@/lib/secrets';
import type { DbQuerySpec, DbResult } from './types';

// Clés des fournisseurs IA : chiffrées à l'écriture ; une valeur masquée
// renvoyée par le formulaire d'édition signifie « inchangée »
function prepareValues(spec: DbQuerySpec): unknown {
  if (spec.table !== 'api_keys' || spec.values === undefined) return spec.values;
  const seal = (row: any) => {
    if (!row || typeof row !== 'object' || typeof row.key_value !== 'string') return row;
    const { key_value, ...rest } = row;
    const trimmed = key_value.trim();
    if (!trimmed || isMaskedSecret(trimmed)) return rest;
    return { ...rest, key_value: sealSecret(trimmed) };
  };
  return Array.isArray(spec.values) ? spec.values.map(seal) : seal(spec.values);
}

// Toute clé renvoyée au navigateur est masquée (début et fin seulement)
function maskKeys<T>(value: T): T {
  if (Array.isArray(value)) return value.map(maskKeys) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value)) {
      out[key] = key === 'key_value' && typeof inner === 'string' ? maskSecret(inner) : maskKeys(inner);
    }
    return out as T;
  }
  return value;
}

export async function executeQuery(db: SupabaseClient, spec: DbQuerySpec): Promise<Omit<DbResult, 'statusText'>> {
  spec = { ...spec, values: prepareValues(spec) };

  // Le builder Supabase change de type à chaque étape ; on le manipule
  // dynamiquement.
  const base = db.from(spec.table);
  const countOption = spec.count ? { count: spec.count } : {};
  let query: any;

  switch (spec.action) {
    case 'select':
      query = base.select(spec.columns || '*', { ...countOption, head: !!spec.head });
      break;
    case 'insert':
      query = base.insert(spec.values as any, countOption);
      break;
    case 'upsert':
      query = base.upsert(spec.values as any, { ...countOption, ...spec.upsertOptions });
      break;
    case 'update':
      query = base.update(spec.values as any, countOption);
      break;
    case 'delete':
      query = base.delete(countOption);
      break;
  }

  if (spec.action !== 'select' && spec.returning) {
    query = query.select(spec.columns || '*');
  }

  for (const filter of spec.filters) {
    query = query[filter.op](...filter.args);
  }

  for (const order of spec.order) {
    const { column, ...options } = order;
    query = query.order(column, options);
  }

  if (typeof spec.limit === 'number') query = query.limit(spec.limit);
  if (Array.isArray(spec.range)) query = query.range(spec.range[0], spec.range[1]);
  if (spec.single === 'single') query = query.single();
  if (spec.single === 'maybeSingle') query = query.maybeSingle();

  const { data, error, count, status } = await query;

  return {
    data: maskKeys(stripSensitive(data ?? null)),
    count: count ?? null,
    status,
    error: error ? { message: error.message, code: error.code, details: error.details, hint: error.hint } : null,
  };
}
