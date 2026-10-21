-- Les jetons de session sont désormais stockés sous forme d'empreinte SHA-256
-- (lib/auth/session-token.ts). Les sessions ouvertes avant ce changement
-- contiennent le jeton en clair : elles ne correspondent plus à rien et sont
-- supprimées. Les personnes connectées se reconnectent une fois.
--
-- Appliquée le 2026-10-21, juste après la mise en ligne du code (08:47:44 UTC) ;
-- les sessions ouvertes ensuite sont déjà hachées.

delete from public.sessions        where created_at < '2026-10-21T08:47:44Z';
delete from public.client_sessions where created_at < '2026-10-21T08:47:44Z';
