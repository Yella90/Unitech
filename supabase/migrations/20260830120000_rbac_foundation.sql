-- RBAC foundation for UNITECH. Review against the live Supabase schema before
-- applying. This migration does not enable RLS on business tables yet because
-- the application is still using its legacy session_token authentication.

create table if not exists public.roles (
  code text primary key,
  label text not null,
  created_at timestamptz not null default now(),
  constraint roles_code_check check (code in ('super_admin', 'admin', 'project_manager', 'team_lead', 'developer', 'designer', 'client', 'viewer', 'collaborator', 'associate'))
);

insert into public.roles (code, label) values
  ('super_admin', 'Super administrateur'), ('admin', 'Administrateur'),
  ('project_manager', 'Chef de projet'), ('team_lead', 'Responsable d''équipe'),
  ('developer', 'Développeur'), ('designer', 'Designer'), ('client', 'Client'),
  ('viewer', 'Lecteur'), ('collaborator', 'Collaborateur'), ('associate', 'Associé')
on conflict (code) do update set label = excluded.label;

create table if not exists public.permissions (
  code text primary key,
  resource text not null,
  action text not null,
  created_at timestamptz not null default now(),
  constraint permissions_code_check check (code = resource || '.' || action)
);

create table if not exists public.role_permissions (
  role_code text not null references public.roles(code) on delete cascade,
  permission_code text not null references public.permissions(code) on delete cascade,
  scope text not null,
  created_at timestamptz not null default now(),
  primary key (role_code, permission_code),
  constraint role_permissions_scope_check check (scope in ('none', 'own', 'assigned', 'team', 'managed', 'client', 'all'))
);

insert into public.permissions (code, resource, action)
select code, split_part(code, '.', 1), split_part(code, '.', 2)
from unnest(array[
  'user.create','user.read','user.update','user.delete','user.assign_role','user.manage_permissions',
  'project.create','project.read','project.update','project.delete','project.archive','project.assign_member','project.remove_member',
  'member.read','member.add','member.remove','task.create','task.read','task.update','task.delete','task.assign',
  'document.create','document.read','document.update','document.delete','document.download',
  'finance.read','finance.create','finance.update','finance.delete','invoice.create','invoice.read','invoice.update','payment.create','payment.read',
  'client.create','client.read','client.update','client.delete','ai.read','ai.use','ai.configure','ai.approve','ai.regenerate',
  'email.read','email.create_response','email.approve','email.send','email.delete',
  'settings.read','settings.update','api_key.read','api_key.create','api_key.update','api_key.delete'
]::text[]) as code
on conflict (code) do nothing;

-- The runtime map in lib/auth/rbac.ts is the transitional source of truth.
-- Seed privileged baseline grants in SQL for auditing and the later RLS migration.
insert into public.role_permissions (role_code, permission_code, scope)
select 'super_admin', code, 'all' from public.permissions
on conflict (role_code, permission_code) do update set scope = excluded.scope;

insert into public.role_permissions (role_code, permission_code, scope)
select 'admin', code, 'all' from public.permissions
where code not in ('user.create','user.assign_role','user.manage_permissions','api_key.read','api_key.create','api_key.update','api_key.delete')
on conflict (role_code, permission_code) do update set scope = excluded.scope;

insert into public.role_permissions (role_code, permission_code, scope)
select 'project_manager', code, 'managed'
from unnest(array[
  'project.create','project.read','project.update','project.archive','project.assign_member','project.remove_member',
  'member.read','member.add','member.remove','task.create','task.read','task.update','task.delete','task.assign',
  'document.create','document.read','document.update','document.delete','document.download',
  'finance.read','finance.create','finance.update','invoice.create','invoice.read','invoice.update','payment.create','payment.read',
  'client.read','client.update','ai.read','ai.use','ai.approve','ai.regenerate',
  'email.read','email.create_response','email.approve','email.send','email.delete'
]::text[]) as code
on conflict (role_code, permission_code) do update set scope = excluded.scope;

-- Keep user roles compatible with the existing text column and validate all
-- historical role values before applying this constraint in production.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'role') then
    alter table public.users drop constraint if exists users_role_check;
    alter table public.users alter column role set default 'viewer';
    alter table public.users add constraint users_role_check
      check (role in ('super_admin', 'admin', 'project_manager', 'team_lead', 'developer', 'designer', 'client', 'viewer', 'collaborator', 'associate')) not valid;
  end if;
end $$;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  result text not null check (result in ('success', 'denied', 'failure')),
  request_id uuid,
  ip inet,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_actor_created_at_idx on public.audit_logs (actor_user_id, created_at desc);
create index if not exists audit_logs_resource_created_at_idx on public.audit_logs (resource_type, resource_id, created_at desc);
create index if not exists role_permissions_permission_idx on public.role_permissions (permission_code, role_code);

-- Permission rows are intentionally seeded by the application migration step.
-- Do not grant SELECT on api_keys or audit_logs to authenticated/anon clients.
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.audit_logs enable row level security;

create policy "authenticated_can_read_permission_catalog"
  on public.permissions for select to authenticated using (true);

create policy "super_admin_can_read_role_grants"
  on public.role_permissions for select to authenticated
  using ((select auth.uid()) in (select id from public.users where role = 'super_admin' and is_active = true));

create policy "super_admin_can_manage_role_grants"
  on public.role_permissions for all to authenticated
  using ((select auth.uid()) in (select id from public.users where role = 'super_admin' and is_active = true))
  with check ((select auth.uid()) in (select id from public.users where role = 'super_admin' and is_active = true));

create policy "super_admin_can_read_audit_logs"
  on public.audit_logs for select to authenticated
  using ((select auth.uid()) in (select id from public.users where role = 'super_admin' and is_active = true));
