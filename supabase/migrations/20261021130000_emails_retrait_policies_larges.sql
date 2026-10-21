-- Ces policies autorisaient tout utilisateur connecté à Supabase Auth à lire,
-- ajouter et modifier n'importe quel e-mail (condition « true »). L'application
-- accède à la table avec la clé service_role, qui n'en a pas besoin.
-- Restent les policies limitées au propriétaire (auth.uid() = client_id).
-- Appliquée sur la base le 2026-10-21.

drop policy if exists "Enable read access for own emails"   on public.emails;
drop policy if exists "Enable insert access for own emails" on public.emails;
drop policy if exists "Enable update access for own emails" on public.emails;
