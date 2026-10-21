// lib/admin-db/client.ts
// Remplace le client Supabase anon dans le back-office : même syntaxe
// (from().select().eq()...), mais chaque requête passe par /api/admin/db,
// qui vérifie la session admin et exécute côté serveur.
//
// Seul le sous-ensemble de supabase-js utilisé par les pages est couvert.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DbAction, DbFilter, DbOrder, DbQuerySpec, DbResult, FilterOp } from './types';

async function run(spec: DbQuerySpec): Promise<DbResult> {
  try {
    const response = await fetch('/api/admin/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(spec),
    });
    const payload = await response.json().catch(() => null);
    if (!payload) {
      return { data: null, error: { message: `Erreur serveur (${response.status})` }, count: null, status: response.status, statusText: response.statusText };
    }
    return {
      data: payload.data ?? null,
      error: payload.error ?? null,
      count: payload.count ?? null,
      status: payload.status ?? response.status,
      statusText: response.statusText,
    };
  } catch (error) {
    return {
      data: null,
      error: { message: error instanceof Error ? error.message : 'Erreur réseau' },
      count: null,
      status: 0,
      statusText: '',
    };
  }
}

class AdminQuery implements PromiseLike<DbResult> {
  private spec: DbQuerySpec;

  constructor(table: string) {
    this.spec = { table, action: 'select', filters: [], order: [] };
  }

  private setAction(action: DbAction, values?: unknown) {
    this.spec.action = action;
    if (values !== undefined) this.spec.values = values;
    return this;
  }

  private addFilter(op: FilterOp, ...args: unknown[]) {
    // Les options absentes deviendraient null en JSON : on les retire
    while (args.length > 0 && args[args.length - 1] === undefined) args.pop();
    this.spec.filters.push({ op, args } as DbFilter);
    return this;
  }

  select(columns = '*', options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }) {
    if (this.spec.action === 'select') {
      this.spec.columns = columns;
    } else {
      this.spec.returning = true;
      this.spec.columns = columns;
    }
    if (options?.count) this.spec.count = options.count;
    if (options?.head) this.spec.head = true;
    return this;
  }

  insert(values: unknown, options?: { count?: 'exact' | 'planned' | 'estimated' }) {
    if (options?.count) this.spec.count = options.count;
    return this.setAction('insert', values);
  }

  update(values: unknown, options?: { count?: 'exact' | 'planned' | 'estimated' }) {
    if (options?.count) this.spec.count = options.count;
    return this.setAction('update', values);
  }

  upsert(values: unknown, options?: { onConflict?: string; ignoreDuplicates?: boolean }) {
    if (options) this.spec.upsertOptions = { onConflict: options.onConflict, ignoreDuplicates: options.ignoreDuplicates };
    return this.setAction('upsert', values);
  }

  delete(options?: { count?: 'exact' | 'planned' | 'estimated' }) {
    if (options?.count) this.spec.count = options.count;
    return this.setAction('delete');
  }

  eq(column: string, value: unknown) { return this.addFilter('eq', column, value); }
  neq(column: string, value: unknown) { return this.addFilter('neq', column, value); }
  gt(column: string, value: unknown) { return this.addFilter('gt', column, value); }
  gte(column: string, value: unknown) { return this.addFilter('gte', column, value); }
  lt(column: string, value: unknown) { return this.addFilter('lt', column, value); }
  lte(column: string, value: unknown) { return this.addFilter('lte', column, value); }
  like(column: string, pattern: string) { return this.addFilter('like', column, pattern); }
  ilike(column: string, pattern: string) { return this.addFilter('ilike', column, pattern); }
  is(column: string, value: unknown) { return this.addFilter('is', column, value); }
  in(column: string, values: unknown[]) { return this.addFilter('in', column, values); }
  contains(column: string, value: unknown) { return this.addFilter('contains', column, value); }
  containedBy(column: string, value: unknown) { return this.addFilter('containedBy', column, value); }
  or(filters: string, options?: { referencedTable?: string; foreignTable?: string }) {
    return this.addFilter('or', filters, options);
  }
  not(column: string, operator: string, value: unknown) { return this.addFilter('not', column, operator, value); }
  match(query: Record<string, unknown>) { return this.addFilter('match', query); }
  filter(column: string, operator: string, value: unknown) { return this.addFilter('filter', column, operator, value); }

  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean; referencedTable?: string; foreignTable?: string }) {
    const order: DbOrder = { column };
    if (options?.ascending !== undefined) order.ascending = options.ascending;
    if (options?.nullsFirst !== undefined) order.nullsFirst = options.nullsFirst;
    const referenced = options?.referencedTable ?? options?.foreignTable;
    if (referenced) order.referencedTable = referenced;
    this.spec.order.push(order);
    return this;
  }

  limit(count: number) {
    this.spec.limit = count;
    return this;
  }

  range(from: number, to: number) {
    this.spec.range = [from, to];
    return this;
  }

  single() {
    this.spec.single = 'single';
    return this;
  }

  maybeSingle() {
    this.spec.single = 'maybeSingle';
    return this;
  }

  then<TResult1 = DbResult, TResult2 = never>(
    onfulfilled?: ((value: DbResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return run(this.spec).then(onfulfilled, onrejected);
  }
}

const client = {
  from(table: string) {
    return new AdminQuery(table);
  },
};

// Typé comme un client Supabase pour que les pages existantes compilent sans
// changement ; à l'exécution seules les méthodes ci-dessus existent.
export const adminDb = client as unknown as SupabaseClient;
