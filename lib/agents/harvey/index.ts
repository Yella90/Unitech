// agents/harvey/index.ts

// ✅ Export des classes et fonctions (valeur)
export { Harvey, harvey } from './harvey';
export { 
  startHarveyService 
} from './harvey-service';
export { 
  initHarveyService, 
  isHarveyRunning, 
  restartHarveyService 
} from './auto-start';

// ✅ Export des types avec 'export type'
export type { HarveyServiceHandle } from './harvey-service';
export * from './types';