// lib/email/auto-start.ts
import { startIMAPPolling } from './imap';

let isStarted = false;

export function initEmailService() {
  if (isStarted) {
    console.log('⚠️ Service email déjà démarré');
    return;
  }

  if (typeof window !== 'undefined') {
    console.log('⚠️ Service email ne s\'exécute que côté serveur');
    return;
  }

  console.log('🚀 Initialisation du service email Alwaysdata...');
  
  const stopService = startIMAPPolling(60000);
  isStarted = true;

  return stopService;
}