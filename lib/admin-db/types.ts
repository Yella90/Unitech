// lib/admin-db/types.ts
// Description d'une requête envoyée par le back-office à /api/admin/db.
// Le navigateur décrit la requête ; le serveur la vérifie puis l'exécute
// avec la clé service.

export type DbAction = 'select' | 'insert' | 'update' | 'upsert' | 'delete';

export const FILTER_OPS = [
  'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
  'like', 'ilike', 'is', 'in', 'contains', 'containedBy',
  'or', 'not', 'match', 'filter',
] as const;

export type FilterOp = (typeof FILTER_OPS)[number];

export type DbFilter = { op: FilterOp; args: unknown[] };

export type DbOrder = {
  column: string;
  ascending?: boolean;
  nullsFirst?: boolean;
  referencedTable?: string;
};

export type DbQuerySpec = {
  table: string;
  action: DbAction;
  /** Colonnes du select, ou colonnes renvoyées après insert/update/delete */
  columns?: string;
  /** insert/update/delete/upsert suivi de .select() */
  returning?: boolean;
  count?: 'exact' | 'planned' | 'estimated';
  head?: boolean;
  values?: unknown;
  upsertOptions?: { onConflict?: string; ignoreDuplicates?: boolean };
  filters: DbFilter[];
  order: DbOrder[];
  limit?: number;
  range?: [number, number];
  single?: 'single' | 'maybeSingle';
};

export type DbError = { message: string; code?: string; details?: string | null; hint?: string | null };

export type DbResult<T = any> = {
  data: T | null;
  error: DbError | null;
  count: number | null;
  status: number;
  statusText: string;
};
