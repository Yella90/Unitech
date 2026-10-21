-- Jetons de réinitialisation de mot de passe (comptes admin et client).
-- Seule l'empreinte SHA-256 du jeton est stockée : le lien envoyé par e-mail
-- ne peut pas être reconstitué depuis la base. Usage unique, validité d'une
-- heure. Accès réservé au serveur (RLS sans policy).

create table if not exists public.password_resets (
  id            uuid primary key default gen_random_uuid(),
  account_type  text not null check (account_type in ('admin', 'client')),
  account_id    uuid not null,
  token_hash    text not null unique,
  expires_at    timestamptz not null,
  used_at       timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists password_resets_account on public.password_resets (account_type, account_id);

alter table public.password_resets enable row level security;
