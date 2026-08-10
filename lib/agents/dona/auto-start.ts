// agents/dona/auto-start.ts
import { startDonaService, DonaServiceHandle } from './processor-service';

let isStarted = false;
let stopServiceFn: (() => void) | null = null;
let serviceHandle: DonaServiceHandle | null = null;

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

  if (typeof window !== 'undefined') {
    console.log('⚠️ DONA ne s\'exécute que côté serveur');
    return null;
  }

  try {
    console.log('🚀 Initialisation DONA...');
    const interval = options?.interval || 60000;
    
    // ✅ Récupérer le handle du service
    serviceHandle = startDonaService(interval);
    
    // ✅ Stocker la fonction stop
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

// ✅ Fonction exportée pour vérifier l'état
export function isDonaRunning(): boolean {
  return isStarted;
}

// ✅ Fonction pour redémarrer
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