// agents/harvey/auto-start.ts
import { startHarveyService, HarveyServiceHandle } from './harvey-service';

let isStarted = false;
let stopServiceFn: (() => void) | null = null;
let serviceHandle: HarveyServiceHandle | null = null;

export function initHarveyService(options?: {
  interval?: number;
  onError?: (error: Error) => void;
}): (() => void) | null {
  if (isStarted) {
    console.log('⚠️ HARVEY déjà démarré');
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
    console.log('⚠️ HARVEY ne s\'exécute que côté serveur');
    return null;
  }

  try {
    console.log('🚀 Initialisation HARVEY...');
    const interval = options?.interval || 120000;
    
    // ✅ Démarrer le service et récupérer le handle
    startHarveyService(interval).then((handle) => {
      serviceHandle = handle;
      stopServiceFn = handle.stop;
      isStarted = true;
      console.log('✅ HARVEY Service démarré');
    });

    return () => {
      if (stopServiceFn) {
        stopServiceFn();
        isStarted = false;
        stopServiceFn = null;
        serviceHandle = null;
        console.log('✅ HARVEY Service arrêté');
      }
    };
  } catch (error) {
    console.error('❌ HARVEY: Erreur démarrage:', error);
    options?.onError?.(error as Error);
    return null;
  }
}

// ✅ Fonction exportée pour vérifier l'état
export function isHarveyRunning(): boolean {
  return isStarted;
}

// ✅ Fonction pour redémarrer
export function restartHarveyService(options?: {
  interval?: number;
  onError?: (error: Error) => void;
}): (() => void) | null {
  console.log('🔄 Redémarrage HARVEY...');
  
  if (stopServiceFn) {
    stopServiceFn();
    isStarted = false;
    stopServiceFn = null;
    serviceHandle = null;
  }
  
  return initHarveyService(options);
}