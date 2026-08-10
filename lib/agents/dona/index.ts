// agents/dona/index.ts

// ✅ Export des classes et fonctions (valeur)
export { Dona, dona } from './processor';
export { 
  processPendingItems, 
  startDonaService 
} from './processor-service';
export { 
  initDonaService, 
  isDonaRunning, 
  restartDonaService 
} from './auto-start';

// ✅ Export des types avec 'export type'
export type { DonaServiceHandle } from './processor-service';
export * from './types';