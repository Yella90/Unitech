# UNITECH

Site vitrine, espace client et back-office d'UNITECH, avec les agents IA
**HARVEY** (conseiller commercial du chatbot, réponses aux e-mails) et
**DONA** (classification des messages).

En ligne : https://unitech-qvgo.onrender.com

## Architecture

- **Next.js 16** (App Router), un seul projet : pages publiques, espace client
  (`/dashboard`, `/clients/*`), back-office (`/admin/*`) et API (`app/api`).
- **Supabase (PostgreSQL)**, projet « Unitech ERP Mali ». RLS est actif sur
  toutes les tables : le navigateur ne lit que le catalogue public et ne fait
  qu'insérer les formulaires publics. Tout le reste passe par le serveur avec la
  clé service (`lib/supabase-admin.ts`).
- **Back-office** : les pages utilisent `adminDb` (`lib/admin-db`), qui a la
  syntaxe de supabase-js mais envoie chaque requête à `/api/admin/db`. Le serveur
  vérifie la session, les permissions RBAC (`lib/auth/rbac.ts`) et les tables
  autorisées (`lib/admin-db/policy.ts`), et ne renvoie jamais les mots de passe,
  jetons ou clés.
- **Connexion** : sessions maison (cookies `session_token` pour les admins,
  `client_session_token` pour les clients). La base ne stocke que l'empreinte
  SHA-256 des jetons (`lib/auth/session-token.ts`). Mot de passe oublié :
  `lib/auth/password-reset.ts`.
- **IA** : `lib/config/llm.ts` essaie les fournisseurs actifs (Groq, Gemini,
  Cerebras, Hugging Face, OpenRouter) avec bascule automatique. Les clés sont
  gérées dans l'admin (« Clés API ») et chiffrées en base (`lib/secrets.ts`).
- **E-mails** : jamais d'envoi direct. Les messages sont déposés dans la table
  `mail_sortant` d'une base commune (`MAIL_DATABASE_URL`) ; une tâche planifiée
  sur AlwaysData les envoie (`lib/email/mail-sortant.ts`).
- **Accès protégés** : `proxy.ts` (ex-middleware) contrôle `/admin`,
  `/dashboard` et `/clients`.

## Démarrer en local

```bash
npm ci
cp .env.example .env.local   # puis compléter
npm run dev
```

⚠️ Utilisez une base Supabase de développement : la base de production ne doit
pas recevoir les données de test.

## Commandes

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run typecheck` | Vérification des types |
| `npm test` | Tests unitaires (Vitest, sans base de données) |
| `npm run build` | Build de production |

La CI GitHub (`.github/workflows/ci.yml`) lance typage, tests et build à chaque
push sur `main` et sur chaque pull request.

## Base de données

- Les changements de schéma se font par fichier dans `supabase/migrations/`.
- Une migration qui retire un accès (RLS, policies) s'applique **après** le
  déploiement du code qui n'en a plus besoin.
- Les types `types/database.ts` sont générés depuis la base ; les régénérer après
  chaque migration.

## Déploiement

Render déploie automatiquement la branche `main`. Variables d'environnement :
voir `.env.example`.
