// lib/agents/dona/auto-start.ts
import { startDonaService, DonaServiceHandle } from './processor-service';

let isStarted = false;
let stopServiceFn: (() => void) | null = null;
let serviceHandle: DonaServiceHandle | null = null;

// ============================================================
// INITIALISATION
// ============================================================
export function initDonaService(options?: {
  interval?: number;
  onError?: (error: Error) => void;
}): (() => void) | null {
  if (isStarted) {
    console.log('⚠️ DONA déjà démarré');
    return () => {
      if (stopServiceFn) {
        stopServiceFn();
        isStarted = false;
        stopServiceFn = null;
        serviceHandle = null;
      }
    };
  }

  // ✅ Vérification côté serveur (pas de window)
  if (typeof window !== 'undefined') {
    console.log('⚠️ DONA ne s\'exécute que côté serveur');
    return null;
  }

  try {
    console.log('🚀 Initialisation DONA...');
    const interval = options?.interval || 60000;
    
    serviceHandle = startDonaService(interval);
    
    stopServiceFn = serviceHandle.stop;
    isStarted = true;
    
    console.log('✅ DONA Service démarré');

    return () => {
      if (stopServiceFn) {
        stopServiceFn();
        isStarted = false;
        stopServiceFn = null;
        serviceHandle = null;
        console.log('✅ DONA Service arrêté');
      }
    };
  } catch (error) {
    console.error('❌ DONA: Erreur démarrage:', error);
    options?.onError?.(error as Error);
    return null;
  }
}

// ============================================================
// VÉRIFIER L'ÉTAT
// ============================================================
export function isDonaRunning(): boolean {
  return isStarted;
}

// ============================================================
// REDÉMARRER
// ============================================================
export function restartDonaService(options?: {
  interval?: number;
  onError?: (error: Error) => void;
}): (() => void) | null {
  console.log('🔄 Redémarrage DONA...');
  
  if (stopServiceFn) {
    stopServiceFn();
    isStarted = false;
    stopServiceFn = null;
    serviceHandle = null;
  }
  
  return initDonaService(options);
}

// ============================================================
// ARRÊTER
// ============================================================
export function stopDonaService(): void {
  if (stopServiceFn) {
    stopServiceFn();
    isStarted = false;
    stopServiceFn = null;
    serviceHandle = null;
    console.log('✅ DONA Service arrêté');
  } else {
    console.log('⚠️ DONA: Service déjà arrêté');
  }
}

// ============================================================
// STATUT DÉTAILLÉ
// ============================================================
export function getDonaStatus() {
  if (serviceHandle) {
    return serviceHandle.getStatus();
  }
  return null;
}