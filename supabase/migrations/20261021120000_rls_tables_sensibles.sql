-- Verrouille les tables qui contiennent des secrets (jetons de session,
-- mots de passe e-mail chiffrés, contenu des e-mails des clients).
--
-- RLS activé sans aucune policy : la clé anon (publique, présente dans le
-- navigateur) ne peut plus rien lire ni écrire ; la clé service_role,
-- utilisée par les routes serveur via lib/supabase-admin.ts, n'est pas
-- concernée par RLS.
--
-- Aucune page navigateur n'interroge ces tables : à appliquer APRÈS le
-- déploiement du code qui passe les routes serveur sur la clé service.
--
-- Pas encore ici : users, clients, api_keys. Le back-office les lit
-- directement depuis le navigateur avec la clé anon ; il faut d'abord
-- déplacer ces lectures dans des routes serveur.

alter table if exists public.sessions             enable row level security;
alter table if exists public.client_sessions      enable row level security;
alter table if exists public.admin_sessions       enable row level security;
alter table if exists public.mail_accounts        enable row level security;
alter table if exists public.emails               enable row level security;
alter table if exists public.service_tokens       enable row level security;
alter table if exists public.email_verifications  enable row level security;
