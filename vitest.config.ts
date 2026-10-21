// vitest.config.ts
// Tests unitaires : logique pure (règles d'accès, classification, mise en
// forme). Aucun test ne contacte la base de données.
import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname) },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    env: {
      // Clé de test (64 caractères hexadécimaux), sans rapport avec la production
      EMAIL_ENCRYPTION_KEY: '0f'.repeat(32),
      NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'cle-anon-de-test',
    },
  },
});
