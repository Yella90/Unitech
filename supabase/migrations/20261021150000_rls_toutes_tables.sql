-- Ferme l'accès direct aux tables avec la clé anon (publique).
--
-- Après ce changement :
--   * le back-office passe par /api/admin/db (clé service, session admin) ;
--   * les visites, leads du chatbot et uploads passent par des routes serveur ;
--   * le navigateur ne garde que : lecture du catalogue public et envoi des
--     formulaires publics (insertion seule, sans relecture).
--
-- À appliquer APRÈS le déploiement du code correspondant.

-- 1. RLS sur toutes les tables qui ne l'avaient pas
alter table if exists public.projects                 enable row level security;
alter table if exists public.project_stages           enable row level security;
alter table if exists public.project_members          enable row level security;
alter table if exists public.tasks                    enable row level security;
alter table if exists public.trainings                enable row level security;
alter table if exists public.newsletter_subscribers   enable row level security;
alter table if exists public.collaborations           enable row level security;
alter table if exists public.contacts                 enable row level security;
alter table if exists public.page_visits              enable row level security;
alter table if exists public.incoming_emails          enable row level security;
alter table if exists public.email_conversations      enable row level security;
alter table if exists public.review_notifications     enable row level security;
alter table if exists public.services                 enable row level security;
alter table if exists public.service_requests         enable row level security;
alter table if exists public.ai_providers             enable row level security;
alter table if exists public.api_keys                 enable row level security;
alter table if exists public.ai_performance           enable row level security;
alter table if exists public.ai_errors                enable row level security;
alter table if exists public.ai_context_rules         enable row level security;
alter table if exists public.faq                      enable row level security;
alter table if exists public.leads                    enable row level security;
alter table if exists public.quotes                   enable row level security;
alter table if exists public.appointments             enable row level security;
alter table if exists public.clients                  enable row level security;
alter table if exists public.client_services          enable row level security;
alter table if exists public.client_service_requests  enable row level security;

-- 2. Anciennes policies trop larges
drop policy if exists "Enable all for anon users"        on public.email_conversations;
drop policy if exists "Enable read access for all users" on public.training_registrations;
drop policy if exists "Anyone can insert page visits"    on public.page_visits;
drop policy if exists "Anyone can update page visits"    on public.page_visits;
drop policy if exists "System can insert logs"           on public.employee_logs;

-- 3. Catalogue public en lecture (pages du site)
create policy "catalogue_lecture_publique" on public.services       for select to anon, authenticated using (true);
create policy "catalogue_lecture_publique" on public.trainings      for select to anon, authenticated using (true);
create policy "catalogue_lecture_publique" on public.projects       for select to anon, authenticated using (true);
create policy "catalogue_lecture_publique" on public.project_stages for select to anon, authenticated using (true);
create policy "catalogue_lecture_publique" on public.collaborations for select to anon, authenticated using (true);
create policy "catalogue_lecture_publique" on public.faq            for select to anon, authenticated using (true);

-- 4. Formulaires publics : insertion seule
--    (service_requests et training_registrations en ont déjà une)
create policy "formulaire_public_insertion" on public.contacts               for insert to anon, authenticated with check (true);
create policy "formulaire_public_insertion" on public.newsletter_subscribers for insert to anon, authenticated with check (true);

-- 5. Images de projet : lecture publique conservée, écriture réservée au
--    serveur (/api/admin/upload)
drop policy if exists "Authenticated users can upload" on storage.objects;
drop policy if exists "Authenticated users can update" on storage.objects;
drop policy if exists "Authenticated users can delete" on storage.objects;
