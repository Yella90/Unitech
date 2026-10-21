// lib/admin-db/policy.ts
// Règles d'accès de /api/admin/db : quelles tables le back-office peut
// toucher, avec quelle permission, et ce qui ne sort jamais du serveur.
import { hasPermission, type Permission } from '@/lib/auth/rbac';
import type { AuthenticatedUser } from '@/lib/auth/session';
import { FILTER_OPS, type DbAction, type DbQuerySpec } from './types';
import type { Database } from '@/types/database';

// Mêmes rôles que ceux qui ouvrent /admin dans proxy.ts
export const ADMIN_PANEL_ROLES = ['admin', 'super_admin', 'developer'];

type TablePermissions = Partial<Record<'view' | 'insert' | 'update' | 'delete', Permission | false>>;

type TableName = keyof Database['public']['Tables'];

// Tables utilisées par le back-office. Une permission précise s'ajoute au
// rôle admin quand elle existe ; `false` interdit l'opération. Le type
// garantit que chaque nom correspond à une table réelle (types/database.ts).
const TABLES: Partial<Record<TableName, TablePermissions>> = {
  users: { view: 'users.view', insert: false, update: 'users.edit', delete: 'users.delete' },
  api_keys: { view: 'api_keys.view', insert: 'api_keys.create', update: 'api_keys.create', delete: 'api_keys.delete' },
  ai_providers: { view: 'api_keys.view', insert: 'api_keys.create', update: 'api_keys.create', delete: 'api_keys.delete' },
  employee_logs: { view: 'logs.view', insert: false, update: false, delete: false },
  email_logs: { view: 'logs.view', insert: false, update: false, delete: false },
  page_visits: { view: 'analytics.view', insert: false, update: false, delete: false },
  projects: { view: 'projects.view', insert: 'projects.create', update: 'projects.edit', delete: 'projects.delete' },
  project_stages: { view: 'projects.view', insert: 'projects.edit', update: 'projects.edit', delete: 'projects.edit' },
  trainings: { view: 'trainings.view', insert: 'trainings.create', update: 'trainings.edit', delete: 'trainings.delete' },
  training_registrations: { view: 'trainings.view', insert: 'trainings.edit', update: 'trainings.edit', delete: 'trainings.delete' },
  incoming_emails: { view: 'email.view' },
  email_conversations: { view: 'email.view', update: 'email.create_response' },
  clients: {},
  client_services: {},
  client_service_requests: {},
  services: {},
  service_requests: {},
  collaborations: {},
  contacts: {},
  newsletter_subscribers: {},
  leads: {},
  quotes: {},
  appointments: {},
};

// Recherche stricte : « constructor » ou « __proto__ » ne sont pas des tables
function tablePermissions(name: string): TablePermissions | undefined {
  return Object.hasOwn(TABLES, name) ? TABLES[name as TableName] : undefined;
}

// Colonnes jamais renvoyées ni utilisables (filtre, tri, écriture)
const SENSITIVE_COLUMNS = [
  'password_hash',
  'verification_token',
  'reset_password_token',
  'reset_password_expires',
  'email_password',
];
const SENSITIVE_PATTERN = new RegExp(SENSITIVE_COLUMNS.join('|'), 'i');

// Champs qu'un utilisateur peut modifier sur son propre profil sans users.edit
const SELF_PROFILE_FIELDS = new Set(['first_name', 'last_name', 'phone', 'department', 'avatar', 'skills', 'updated_at']);

const ACTION_TO_PERMISSION_KEY: Record<DbAction, 'view' | 'insert' | 'update' | 'delete'> = {
  select: 'view',
  insert: 'insert',
  upsert: 'insert',
  update: 'update',
  delete: 'delete',
};

function valueKeys(values: unknown): string[] {
  const rows = Array.isArray(values) ? values : [values];
  const keys = new Set<string>();
  for (const row of rows) {
    if (row && typeof row === 'object') Object.keys(row).forEach((k) => keys.add(k));
  }
  return [...keys];
}

// Ressources embarquées dans un select : `*, users(email)`, `auteur:users!fk(id)`
function embeddedTables(columns: string): string[] {
  const names: string[] = [];
  const re = /([A-Za-z_][\w]*)\s*(?:![\w]+)?\s*\(/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(columns))) names.push(match[1]);
  return names;
}

function isSelfProfileUpdate(spec: DbQuerySpec, user: AuthenticatedUser): boolean {
  if (spec.table !== 'users' || spec.action !== 'update') return false;
  if (spec.filters.length !== 1) return false;
  const [filter] = spec.filters;
  if (filter.op !== 'eq' || filter.args[0] !== 'id' || filter.args[1] !== user.id) return false;
  return valueKeys(spec.values).every((key) => SELF_PROFILE_FIELDS.has(key));
}

/** Renvoie un message d'erreur si la requête est refusée, sinon null. */
export function checkQuery(spec: DbQuerySpec, user: AuthenticatedUser): string | null {
  if (!spec || typeof spec.table !== 'string' || !Array.isArray(spec.filters) || !Array.isArray(spec.order)) {
    return 'Requête invalide';
  }

  const table = tablePermissions(spec.table);
  if (!table) return `Table non autorisée : ${spec.table}`;

  const permissionKey = ACTION_TO_PERMISSION_KEY[spec.action];
  if (!permissionKey) return 'Action invalide';

  if (spec.filters.some((f) => !FILTER_OPS.includes(f.op))) return 'Filtre non autorisé';

  // Aucune colonne sensible dans ce que le client décrit (hors valeurs écrites)
  const described = JSON.stringify({ c: spec.columns, f: spec.filters, o: spec.order, u: spec.upsertOptions });
  if (SENSITIVE_PATTERN.test(described)) return 'Colonne non autorisée';
  if (spec.values !== undefined && valueKeys(spec.values).some((k) => SENSITIVE_PATTERN.test(k))) {
    return 'Colonne non autorisée';
  }

  if (spec.columns) {
    const forbidden = embeddedTables(spec.columns).find((name) => !tablePermissions(name));
    if (forbidden) return `Relation non autorisée : ${forbidden}`;
  }

  // Une mise à jour ou suppression sans filtre toucherait toute la table
  if ((spec.action === 'update' || spec.action === 'delete') && spec.filters.length === 0) {
    return 'Filtre obligatoire pour une modification ou une suppression';
  }

  if (isSelfProfileUpdate(spec, user)) return null;

  const required = table[permissionKey];
  if (required === false) return 'Opération non autorisée';
  if (required && !hasPermission(user.role, required)) return 'Permission insuffisante';

  if (spec.table === 'users' && valueKeys(spec.values).includes('role') && !hasPermission(user.role, 'users.assign_role')) {
    return 'Permission insuffisante pour changer un rôle';
  }

  return null;
}

/** Retire récursivement les colonnes sensibles d'un résultat. */
export function stripSensitive<T>(value: T): T {
  if (Array.isArray(value)) return value.map(stripSensitive) as T;
  if (value && typeof value === 'object') {
    const clean: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value)) {
      if (SENSITIVE_COLUMNS.includes(key)) continue;
      clean[key] = stripSensitive(inner);
    }
    return clean as T;
  }
  return value;
}
