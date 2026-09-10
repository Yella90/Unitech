// lib/agents/imap-sync/auto-start.ts
// Démarrage automatique du service de synchronisation IMAP

import { runImapSync } from '@/lib/services/imap-sync-service';

let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;
let cleanupFunctions: Array<() => void> = [];

/**
 * Initialise et démarre le service de synchronisation IMAP
 */
export function initImapSyncService(options?: {
  interval?: number;              // Intervalle en ms (défaut: 5 min)
  onError?: (error: Error) => void;
  onSync?: (result: {
    accounts: number;
    emailsSaved: number;
    errors: number;
  }) => void;
}): () => void {
  if (isRunning) {
    console.log('⚠️ Sync IMAP déjà en cours d\'exécution');
    return () => {};
  }

  const interval = options?.interval || 5 * 60 * 1000; // 5 minutes par défaut
  console.log(`📧 Sync IMAP: Démarrage (intervalle: ${interval}ms)`);

  isRunning = true;

  const runSync = async () => {
    if (!isRunning) return;

    try {
      const result = await runImapSync();

      if (options?.onSync) {
        options.onSync(result);
      }

      if (result.emailsSaved > 0) {
        console.log(`📊 Sync IMAP: ${result.emailsSaved} nouveaux emails`);
      }
    } catch (error: any) {
      console.error('❌ Sync IMAP erreur:', error);
      if (options?.onError) {
        options.onError(error);
      }
    }
  };

  // Démarrer l'intervalle
  intervalId = setInterval(runSync, interval);

  // Premier run après 30 secondes (laisser le temps au serveur de démarrer)
  setTimeout(runSync, 30000);

  // Fonction de nettoyage
  const cleanup = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    isRunning = false;
    console.log('🛑 Sync IMAP: Service arrêté');
  };

  cleanupFunctions.push(cleanup);

  return cleanup;
}

/**
 * Arrête le service de sync IMAP
 */
export function stopImapSyncService(): void {
  console.log('🛑 Sync IMAP: Arrêt du service...');
  cleanupFunctions.forEach(fn => fn());
  cleanupFunctions = [];
  isRunning = false;
}

/**
 * Vérifie si le service tourne
 */
export function isImapSyncRunning(): boolean {
  return isRunning;
}

/**
 * Déclenche une synchronisation manuelle
 */
export async function triggerImapSync() {
  console.log('🔄 Sync IMAP: Déclenchement manuel');
  return await runImapSync();
}