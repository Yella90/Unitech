// lib/dona/auto-start.ts
import { startDonaService } from './processor-service';

let isStarted = false;

export function initDonaService() {
  // ✅ Éviter les démarrages multiples
  if (isStarted) {
    console.log('⚠️ DONA déjà démarré');
    return;
  }

  // ✅ Vérifier qu'on est côté serveur (pas dans le navigateur)
  if (typeof window !== 'undefined') {
    console.log('⚠️ DONA ne s\'exécute que côté serveur');
    return;
  }

  console.log('🚀 Initialisation du service DONA...');
  
  // ✅ Démarrer le service (intervalle: 60 secondes)
  const stopService = startDonaService(60000);
  
  isStarted = true;

  // ✅ Retourner la fonction d'arrêt pour le cleanup
  return stopService;
}