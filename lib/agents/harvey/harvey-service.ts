// agents/harvey/harvey-service.ts
import { harvey } from './harvey';

let isRunning = false;

// ✅ Définir le type de retour
export type HarveyServiceHandle = {
  stop: () => void;
};

export async function startHarveyService(interval: number = 60000): Promise<HarveyServiceHandle> {
  if (isRunning) {
    console.log('⚠️ HARVEY déjà en cours');
    return {
      stop: () => {
        console.log('⏹️ HARVEY déjà arrêté');
      }
    };
  }

  console.log(`🦸‍♂️ HARVEY Service démarré (intervalle: ${interval / 1000}s)`);

  // Initialiser HARVEY
  await harvey.init();
  
  // Exécuter immédiatement
  await harvey.processPendingEmails(5);

  // Puis périodiquement
  const timer = setInterval(async () => {
    try {
      await harvey.processPendingEmails(5);
    } catch (error: any) {
      console.error('❌ HARVEY Service error:', error.message);
    }
  }, interval);

  isRunning = true;

  // ✅ Retourner un objet avec stop()
  return {
    stop: () => {
      clearInterval(timer);
      isRunning = false;
      console.log('⏹️ HARVEY Service arrêté');
    }
  };
}