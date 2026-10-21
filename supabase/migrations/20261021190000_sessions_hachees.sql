-- Les jetons de session sont désormais stockés sous forme d'empreinte SHA-256
-- (lib/auth/session-token.ts). Les sessions ouvertes avant ce changement
-- contiennent le jeton en clair : elles ne correspondent plus à rien et sont
-- supprimées. Les personnes connectées se reconnectent une fois.
--
-- À appliquer juste après le déploiement du code, en remplaçant la date par
-- l'heure de mise en ligne (les sessions ouvertes ensuite sont déjà hachées).

delete from public.sessions        where created_at < '2026-10-21T00:00:00Z';
delete from public.client_sessions where created_at < '2026-10-21T00:00:00Z';
