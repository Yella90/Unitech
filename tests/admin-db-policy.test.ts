import { describe, expect, it } from 'vitest';
import { checkQuery, stripSensitive } from '@/lib/admin-db/policy';
import type { DbQuerySpec } from '@/lib/admin-db/types';

const superAdmin = { id: 'sa', email: 'sa@test', role: 'super_admin' } as any;
const developer = { id: 'dev', email: 'dev@test', role: 'developer' } as any;

function spec(partial: Partial<DbQuerySpec>): DbQuerySpec {
  return { table: 'projects', action: 'select', filters: [], order: [], ...partial };
}

describe('règles de /api/admin/db', () => {
  it('autorise une lecture simple', () => {
    expect(checkQuery(spec({ columns: '*' }), superAdmin)).toBeNull();
  });

  it('refuse les tables hors back-office', () => {
    expect(checkQuery(spec({ table: 'client_sessions' }), superAdmin)).toMatch(/Table non autorisée/);
    expect(checkQuery(spec({ table: 'mail_accounts' }), superAdmin)).toMatch(/Table non autorisée/);
    expect(checkQuery(spec({ table: 'constructor' }), superAdmin)).toMatch(/Table non autorisée/);
  });

  it('refuse les colonnes sensibles, en lecture comme en filtre', () => {
    expect(checkQuery(spec({ table: 'users', columns: 'password_hash' }), superAdmin)).toBe('Colonne non autorisée');
    expect(
      checkQuery(spec({ table: 'users', filters: [{ op: 'or', args: ['password_hash.like.$2b%'] }] }), superAdmin)
    ).toBe('Colonne non autorisée');
    expect(
      checkQuery(spec({ table: 'users', action: 'update', values: { password_hash: 'x' }, filters: [{ op: 'eq', args: ['id', 'sa'] }] }), superAdmin)
    ).toBe('Colonne non autorisée');
  });

  it('refuse les relations vers des tables non autorisées', () => {
    expect(checkQuery(spec({ table: 'users', columns: '*, sessions(token)' }), superAdmin)).toMatch(/Relation non autorisée/);
  });

  it('exige un filtre pour modifier ou supprimer', () => {
    expect(checkQuery(spec({ action: 'delete' }), superAdmin)).toMatch(/Filtre obligatoire/);
  });

  it('laisse chacun modifier son propre profil, pas celui des autres', () => {
    const self = spec({ table: 'users', action: 'update', values: { first_name: 'A' }, filters: [{ op: 'eq', args: ['id', 'dev'] }] });
    const other = spec({ table: 'users', action: 'update', values: { first_name: 'A' }, filters: [{ op: 'eq', args: ['id', 'sa'] }] });
    expect(checkQuery(self, developer)).toBeNull();
    expect(checkQuery(other, developer)).toBe('Permission insuffisante');
  });

  it('réserve le changement de rôle à qui en a le droit', () => {
    const promote = spec({ table: 'users', action: 'update', values: { role: 'super_admin' }, filters: [{ op: 'eq', args: ['id', 'dev'] }] });
    expect(checkQuery(promote, developer)).not.toBeNull();
    expect(checkQuery(promote, superAdmin)).toBeNull();
  });

  it('laisse valider les réponses de HARVEY, sans suppression ni ajout', () => {
    const approve = spec({ table: 'emails', action: 'update', values: { status: 'approved' }, filters: [{ op: 'eq', args: ['id', 'e1'] }] });
    expect(checkQuery(spec({ table: 'emails', columns: '*, clients(company_name, email)' }), developer)).toBeNull();
    expect(checkQuery(approve, superAdmin)).toBeNull();
    expect(checkQuery(approve, developer)).toBe('Permission insuffisante');
    expect(checkQuery(spec({ table: 'emails', action: 'delete', filters: [{ op: 'eq', args: ['id', 'e1'] }] }), superAdmin)).toBe('Opération non autorisée');
    expect(checkQuery(spec({ table: 'emails', action: 'insert', values: { subject: 'x' } }), superAdmin)).toBe('Opération non autorisée');
  });

  it('retire les colonnes sensibles des résultats, même imbriquées', () => {
    const cleaned = stripSensitive([{ id: 1, password_hash: 'h', nested: { verification_token: 't', ok: true } }]);
    expect(cleaned).toEqual([{ id: 1, nested: { ok: true } }]);
  });
});
