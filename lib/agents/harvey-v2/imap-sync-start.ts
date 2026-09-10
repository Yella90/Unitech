// lib/agents/harvey-v2/imap-sync-start.ts
// Démarrage automatique du service de sync IMAP

import { runImapSync } from '@/lib/services/imap-sync-service';

let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;

export function initImapSyncService(options?: {
  interval?: number;           // défaut: 5 min
  onError?: (error: Error) => void;
  onSync?: (result: any) => void;
}): () => void {
  if (isRunning) {
    console.log('⚠️ Sync IMAP déjà en cours');
    return () => {};
  }

  const interval = options?.interval || 5 * 60 * 1000; // 5 minutes
  console.log(`📧 Sync IMAP: Démarrage (intervalle: ${interval}ms)`);

  isRunning = true;

  const runSync = async () => {
    if (!isRunning) return;

    try {
      const result = await runImapSync();

      if (options?.onSync && result.emailsSaved > 0) {
        options.onSync(result);
      }
    } catch (error: any) {
      console.error('❌ Sync IMAP erreur:', error);
      if (options?.onError) options.onError(error);
    }
  };

  // Démarrer l'intervalle
  intervalId = setInterval(runSync, interval);

  // Premier run après 30s
  setTimeout(runSync, 30000);

  const cleanup = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    isRunning = false;
    console.log('🛑 Sync IMAP: Service arrêté');
  };

  return cleanup;
}