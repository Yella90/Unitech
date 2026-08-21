// lib/config/ai-models.ts

// ✅ Importer les types depuis ai-management.ts
import type { AIProviderName, ContextType } from '@/lib/types/ai-management';

// ✅ Réexporter les types pour faciliter l'import
export type { AIProviderName, ContextType };

// ============================================================
// MODÈLES VALIDES PAR PROVIDER
// ============================================================

export const AI_MODELS = {
  // --------------------------------------------------------------------------
  // 1. OPENAI
  // --------------------------------------------------------------------------
  openai: {
    provider: 'openai',
    displayName: 'OpenAI',
    description: 'Modèles GPT d\'OpenAI',
    website: 'https://openai.com',
    apiBase: 'https://api.openai.com/v1',
    apiType: 'openai' as const,
    isFree: false,
    priority: 100,
    models: [
      'gpt-5',
      'gpt-5-mini',
      'gpt-5-nano',
      'gpt-4.1',
      'gpt-4.1-mini',
      'gpt-4.1-nano'
    ],
    defaultModel: 'gpt-4.1',
    defaultMaxTokens: 800,
    defaultTemperature: 0.7,
    timeoutMs: 30000,
    contexts: {
      general: { model: 'gpt-4.1', score: 95 },
      fast_response: { model: 'gpt-5-mini', score: 85 },
      coding: { model: 'gpt-5', score: 92 },
      complex_reasoning: { model: 'gpt-5', score: 90 },
      analytical: { model: 'gpt-4.1', score: 88 },
      creative: { model: 'gpt-5', score: 85 },
      factual: { model: 'gpt-4.1', score: 90 },
      cheap: { model: 'gpt-5-nano', score: 70 }
    }
  },

  // --------------------------------------------------------------------------
  // 2. ANTHROPIC
  // --------------------------------------------------------------------------
  anthropic: {
    provider: 'anthropic',
    displayName: 'Anthropic',
    description: 'Modèles Claude d\'Anthropic',
    website: 'https://anthropic.com',
    apiBase: 'https://api.anthropic.com/v1',
    apiType: 'anthropic' as const,
    isFree: false,
    priority: 90,
    models: [
      'claude-opus-4-6',
      'claude-sonnet-4-6',
      'claude-haiku-4-5'
    ],
    defaultModel: 'claude-sonnet-4-6',
    defaultMaxTokens: 800,
    defaultTemperature: 0.7,
    timeoutMs: 30000,
    contexts: {
      general: { model: 'claude-sonnet-4-6', score: 93 },
      fast_response: { model: 'claude-haiku-4-5', score: 82 },
      coding: { model: 'claude-sonnet-4-6', score: 90 },
      complex_reasoning: { model: 'claude-opus-4-6', score: 97 },
      analytical: { model: 'claude-opus-4-6', score: 95 },
      creative: { model: 'claude-sonnet-4-6', score: 92 },
      factual: { model: 'claude-opus-4-6', score: 93 },
      cheap: { model: 'claude-haiku-4-5', score: 75 }
    }
  },

  // --------------------------------------------------------------------------
  // 3. GOOGLE GEMINI
  // --------------------------------------------------------------------------
  google: {
    provider: 'google',
    displayName: 'Google Gemini',
    description: 'Modèles Gemini de Google',
    website: 'https://ai.google.dev',
    apiBase: 'https://generativelanguage.googleapis.com/v1beta',
    apiType: 'google' as const,
    isFree: true,
    priority: 80,
    models: [
      'gemini-3.7-flash',
      'gemini-3-pro',
      'gemini-3-flash'
    ],
    defaultModel: 'gemini-3-flash',
    defaultMaxTokens: 800,
    defaultTemperature: 0.7,
    timeoutMs: 30000,
    contexts: {
      general: { model: 'gemini-3-flash', score: 88 },
      fast_response: { model: 'gemini-3.7-flash', score: 90 },
      coding: { model: 'gemini-3-flash', score: 85 },
      complex_reasoning: { model: 'gemini-3-pro', score: 92 },
      analytical: { model: 'gemini-3-pro', score: 86 },
      creative: { model: 'gemini-3-flash', score: 82 },
      factual: { model: 'gemini-3-pro', score: 88 },
      cheap: { model: 'gemini-3.7-flash', score: 78 }
    }
  },

  // --------------------------------------------------------------------------
  // 4. MISTRAL AI
  // --------------------------------------------------------------------------
  mistral: {
    provider: 'mistral',
    displayName: 'Mistral AI',
    description: 'Modèles Mistral AI',
    website: 'https://mistral.ai',
    apiBase: 'https://api.mistral.ai/v1',
    apiType: 'openai' as const,
    isFree: true,
    priority: 70,
    models: [
      'mistral-large-3',
      'mistral-medium-3.5',
      'mistral-small-4',
      'ministral-3-8b',
      'ministral-3-14b',
      'ministral-3-3b',
      'codestral',
      'devstral',
      'devstral-small',
      'leanstral-1.5'
    ],
    defaultModel: 'mistral-large-3',
    defaultMaxTokens: 800,
    defaultTemperature: 0.7,
    timeoutMs: 30000,
    contexts: {
      general: { model: 'mistral-large-3', score: 85 },
      fast_response: { model: 'ministral-3-3b', score: 80 },
      coding: { model: 'codestral', score: 90 },
      complex_reasoning: { model: 'mistral-large-3', score: 88 },
      analytical: { model: 'mistral-large-3', score: 84 },
      creative: { model: 'mistral-medium-3.5', score: 82 },
      factual: { model: 'mistral-large-3', score: 86 },
      cheap: { model: 'ministral-3-3b', score: 72 }
    }
  },

  // --------------------------------------------------------------------------
  // 5. GROQ
  // --------------------------------------------------------------------------
  groq: {
    provider: 'groq',
    displayName: 'Groq',
    description: 'Modèles Groq ultra-rapides',
    website: 'https://groq.com',
    apiBase: 'https://api.groq.com/openai/v1',
    apiType: 'openai' as const,
    isFree: true,
    priority: 60,
    models: [
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'llama-3.3-70b-versatile',
      'qwen/qwen3.6-27b',
      'meta-llama/Llama-3.1-8B-Instruct',
      'meta-llama/Llama-3.1-70B-Instruct',
      'mistralai/Mistral-7B-Instruct-v0.3'
    ],
    defaultModel: 'llama-3.3-70b-versatile',
    defaultMaxTokens: 800,
    defaultTemperature: 0.7,
    timeoutMs: 30000,
    contexts: {
      general: { model: 'llama-3.3-70b-versatile', score: 82 },
      fast_response: { model: 'llama-3.3-70b-versatile', score: 88 },
      coding: { model: 'llama-3.3-70b-versatile', score: 84 },
      complex_reasoning: { model: 'openai/gpt-oss-120b', score: 86 },
      analytical: { model: 'openai/gpt-oss-120b', score: 82 },
      creative: { model: 'llama-3.3-70b-versatile', score: 78 },
      factual: { model: 'openai/gpt-oss-120b', score: 84 },
      cheap: { model: 'llama-3.3-70b-versatile', score: 76 }
    }
  },

  // --------------------------------------------------------------------------
  // 6. COHERE
  // --------------------------------------------------------------------------
  cohere: {
    provider: 'cohere',
    displayName: 'Cohere',
    description: 'Modèles Cohere',
    website: 'https://cohere.com',
    apiBase: 'https://api.cohere.ai/v1',
    apiType: 'cohere' as const,
    isFree: true,
    priority: 50,
    models: [
      'command-a-03-2025',
      'command-a-reasoning-08-2025',
      'command-r7b-12-2024',
      'embed-v4.0',
      'embed-multilingual-v3.0',
      'embed-english-v3.0'
    ],
    defaultModel: 'command-a-03-2025',
    defaultMaxTokens: 800,
    defaultTemperature: 0.7,
    timeoutMs: 30000,
    contexts: {
      general: { model: 'command-a-03-2025', score: 84 },
      fast_response: { model: 'command-r7b-12-2024', score: 78 },
      coding: { model: 'command-a-03-2025', score: 80 },
      complex_reasoning: { model: 'command-a-reasoning-08-2025', score: 86 },
      analytical: { model: 'command-a-reasoning-08-2025', score: 82 },
      creative: { model: 'command-a-03-2025', score: 76 },
      factual: { model: 'command-a-03-2025', score: 82 },
      cheap: { model: 'command-r7b-12-2024', score: 70 }
    }
  },

  // --------------------------------------------------------------------------
  // 7. DEEPSEEK
  // --------------------------------------------------------------------------
  deepseek: {
    provider: 'deepseek',
    displayName: 'DeepSeek',
    description: 'Modèles DeepSeek',
    website: 'https://deepseek.com',
    apiBase: 'https://api.deepseek.com/v1',
    apiType: 'openai' as const,
    isFree: true,
    priority: 40,
    models: [
      'deepseek-v3.2',
      'deepseek-v3.2-speciale',
      'deepseek-v4'
    ],
    defaultModel: 'deepseek-v3.2',
    defaultMaxTokens: 800,
    defaultTemperature: 0.7,
    timeoutMs: 30000,
    contexts: {
      general: { model: 'deepseek-v3.2', score: 82 },
      fast_response: { model: 'deepseek-v3.2', score: 78 },
      coding: { model: 'deepseek-v4', score: 92 },
      complex_reasoning: { model: 'deepseek-v4', score: 88 },
      analytical: { model: 'deepseek-v4', score: 84 },
      creative: { model: 'deepseek-v3.2', score: 76 },
      factual: { model: 'deepseek-v3.2', score: 82 },
      cheap: { model: 'deepseek-v3.2', score: 72 }
    }
  },

  // --------------------------------------------------------------------------
  // 8. CEREBRAS
  // --------------------------------------------------------------------------
  cerebras: {
    provider: 'cerebras',
    displayName: 'Cerebras',
    description: 'Modèles Cerebras ultra-rapides avec accélération matérielle',
    website: 'https://cerebras.ai',
    apiBase: 'https://api.cerebras.ai/v1',
    apiType: 'openai' as const,
    isFree: true,
    priority: 55,
    models: [
      'llama3.1-8b',
      'llama3.1-70b',
      'llama3.1-405b'
    ],
    defaultModel: 'llama3.1-8b',
    defaultMaxTokens: 800,
    defaultTemperature: 0.7,
    timeoutMs: 30000,
    contexts: {
      general: { model: 'llama3.1-8b', score: 80 },
      fast_response: { model: 'llama3.1-8b', score: 85 },
      coding: { model: 'llama3.1-70b', score: 82 },
      complex_reasoning: { model: 'llama3.1-405b', score: 88 },
      analytical: { model: 'llama3.1-70b', score: 84 },
      creative: { model: 'llama3.1-8b', score: 76 },
      factual: { model: 'llama3.1-70b', score: 82 },
      cheap: { model: 'llama3.1-8b', score: 78 }
    }
  },

  // --------------------------------------------------------------------------
  // 9. HUGGINGFACE
  // --------------------------------------------------------------------------
  huggingface: {
    provider: 'huggingface',
    displayName: 'HuggingFace',
    description: 'Modèles open-source de HuggingFace',
    website: 'https://huggingface.co',
    apiBase: 'https://router.huggingface.co/v1',
    apiType: 'openai' as const,
    isFree: true,
    priority: 45,
    models: [
      'meta-llama/Llama-3.1-8B-Instruct',
      'meta-llama/Llama-3.1-70B-Instruct',
      'meta-llama/Llama-3.1-405B-Instruct',
      'mistralai/Mistral-7B-Instruct-v0.3',
      'mistralai/Mixtral-8x7B-Instruct-v0.1',
      'NousResearch/Hermes-2-Pro-Llama-3-8B',
      'google/gemma-2-9b-it',
      'google/gemma-2-27b-it',
      'Qwen/Qwen2.5-7B-Instruct',
      'Qwen/Qwen2.5-14B-Instruct',
      'Qwen/Qwen2.5-32B-Instruct',
      'Qwen/Qwen2.5-72B-Instruct',
      'microsoft/Phi-3.5-mini-instruct',
      'Mistral-7B-Instruct-v0.3',
      'zephyr-7b-beta'
    ],
    defaultModel: 'meta-llama/Llama-3.1-8B-Instruct',
    defaultMaxTokens: 800,
    defaultTemperature: 0.7,
    timeoutMs: 45000,
    contexts: {
      general: { model: 'meta-llama/Llama-3.1-8B-Instruct', score: 80 },
      fast_response: { model: 'microsoft/Phi-3.5-mini-instruct', score: 82 },
      coding: { model: 'Qwen/Qwen2.5-7B-Instruct', score: 84 },
      complex_reasoning: { model: 'meta-llama/Llama-3.1-405B-Instruct', score: 90 },
      analytical: { model: 'meta-llama/Llama-3.1-70B-Instruct', score: 86 },
      creative: { model: 'NousResearch/Hermes-2-Pro-Llama-3-8B', score: 78 },
      factual: { model: 'meta-llama/Llama-3.1-70B-Instruct', score: 84 },
      cheap: { model: 'google/gemma-2-9b-it', score: 75 }
    }
  }
};

// ============================================================
// HELPERS AVEC TYPES CORRECTS
// ============================================================

/**
 * Récupère la configuration complète d'un provider
 */
export function getProviderConfig(providerName: AIProviderName) {
  return AI_MODELS[providerName];
}

/**
 * Récupère la liste des modèles pour un provider
 */
export function getProviderModels(providerName: AIProviderName): string[] {
  const config = AI_MODELS[providerName];
  return config ? [...config.models] : [];
}

/**
 * Récupère le modèle par défaut pour un provider
 */
export function getDefaultModel(providerName: AIProviderName): string {
  return AI_MODELS[providerName]?.defaultModel || '';
}

/**
 * Récupère l'URL de base de l'API pour un provider
 */
export function getApiBase(providerName: AIProviderName): string {
  return AI_MODELS[providerName]?.apiBase || '';
}

/**
 * Récupère le type d'API pour un provider
 */
export function getApiType(providerName: AIProviderName): 'openai' | 'anthropic' | 'google' | 'cohere' {
  return AI_MODELS[providerName]?.apiType || 'openai';
}

/**
 * Récupère le modèle recommandé pour un contexte donné
 */
export function getContextModel(
  providerName: AIProviderName,
  contextType: ContextType = 'general'
): { model: string; score: number } {
  const config = AI_MODELS[providerName];
  if (!config) {
    return { model: getDefaultModel(providerName), score: 50 };
  }
  
  const context = config.contexts[contextType];
  if (!context) {
    return { model: config.defaultModel, score: 50 };
  }
  
  return context;
}

/**
 * Vérifie si un modèle est valide pour un provider
 */
export function isValidModel(providerName: string, model: string): boolean {
  const config = AI_MODELS[providerName as AIProviderName];
  if (!config) return false;
  return config.models.includes(model);
}

/**
 * Récupère tous les modèles disponibles
 */
export function getAllModels(): { provider: string; displayName: string; models: string[] }[] {
  return (Object.keys(AI_MODELS) as AIProviderName[]).map((provider) => {
    const config = AI_MODELS[provider];
    return {
      provider,
      displayName: config.displayName,
      models: [...config.models]
    };
  });
}

/**
 * Récupère les providers actifs (priorité > 0)
 */
export function getActiveProviders(): AIProviderName[] {
  return (Object.keys(AI_MODELS) as AIProviderName[]).filter(
    (name) => AI_MODELS[name].priority > 0
  );
}

/**
 * Récupère les providers gratuits
 */
export function getFreeProviders(): AIProviderName[] {
  return (Object.keys(AI_MODELS) as AIProviderName[]).filter(
    (name) => AI_MODELS[name].isFree
  );
}

/**
 * Récupère les providers par ordre de priorité
 */
export function getProvidersByPriority(): AIProviderName[] {
  return (Object.keys(AI_MODELS) as AIProviderName[])
    .filter((name) => AI_MODELS[name].priority > 0)
    .sort((a, b) => AI_MODELS[b].priority - AI_MODELS[a].priority);
}

/**
 * Récupère le score d'un provider pour un contexte
 */
export function getProviderScore(providerName: AIProviderName, contextType: ContextType = 'general'): number {
  const config = AI_MODELS[providerName];
  if (!config) return 0;
  const context = config.contexts[contextType];
  return context?.score || 50;
}

/**
 * Récupère tous les providers avec leurs scores pour un contexte
 */
export function getProvidersWithScores(contextType: ContextType = 'general'): {
  provider: AIProviderName;
  displayName: string;
  score: number;
  model: string;
  isFree: boolean;
}[] {
  return (Object.keys(AI_MODELS) as AIProviderName[])
    .filter((name) => AI_MODELS[name].priority > 0)
    .map((name) => {
      const config = AI_MODELS[name];
      const context = config.contexts[contextType];
      return {
        provider: name,
        displayName: config.displayName,
        score: context?.score || 50,
        model: context?.model || config.defaultModel,
        isFree: config.isFree
      };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * Récupère les providers payants
 */
export function getPaidProviders(): AIProviderName[] {
  return (Object.keys(AI_MODELS) as AIProviderName[]).filter(
    (name) => !AI_MODELS[name].isFree
  );
}

/**
 * Récupère un provider par son nom
 */
export function getProviderByName(name: string): typeof AI_MODELS[AIProviderName] | undefined {
  return AI_MODELS[name as AIProviderName];
}

// ============================================================
// CONSTANTES
// ============================================================

export const SUPPORTED_CONTEXT_TYPES: ContextType[] = [
  'general',
  'fast_response',
  'coding',
  'complex_reasoning',
  'analytical',
  'creative',
  'factual',
  'cheap'
];

export const CONTEXT_LABELS: Record<ContextType, string> = {
  general: 'Général',
  fast_response: 'Réponse rapide',
  coding: 'Programmation',
  complex_reasoning: 'Raisonnement complexe',
  analytical: 'Analyse',
  creative: 'Créatif',
  factual: 'Factuel',
  cheap: 'Économique'
};

export const CONTEXT_ICONS: Record<ContextType, string> = {
  general: '💬',
  fast_response: '⚡',
  coding: '💻',
  complex_reasoning: '🧠',
  analytical: '📊',
  creative: '🎨',
  factual: '📚',
  cheap: '💰'
};

// ============================================================
// STATISTIQUES
// ============================================================

export function getModelsStats() {
  const stats = {
    totalProviders: 0,
    totalModels: 0,
    freeProviders: 0,
    freeModels: 0,
    paidProviders: 0,
    paidModels: 0,
    providers: [] as {
      name: string;
      displayName: string;
      modelCount: number;
      isFree: boolean;
    }[]
  };

  (Object.keys(AI_MODELS) as AIProviderName[]).forEach((name) => {
    const config = AI_MODELS[name];
    const modelCount = config.models.length;
    stats.totalProviders++;
    stats.totalModels += modelCount;
    
    if (config.isFree) {
      stats.freeProviders++;
      stats.freeModels += modelCount;
    } else {
      stats.paidProviders++;
      stats.paidModels += modelCount;
    }

    stats.providers.push({
      name,
      displayName: config.displayName,
      modelCount,
      isFree: config.isFree
    });
  });

  return stats;
}

// ============================================================
// EXPORT DU RÉSUMÉ
// ============================================================

export const MODEL_SUMMARY = {
  totalProviders: Object.keys(AI_MODELS).length,
  totalModels: (Object.keys(AI_MODELS) as AIProviderName[]).reduce(
    (acc, name) => acc + AI_MODELS[name].models.length,
    0
  ),
  freeProviders: (Object.keys(AI_MODELS) as AIProviderName[]).filter(
    (name) => AI_MODELS[name].isFree
  ).length,
  paidProviders: (Object.keys(AI_MODELS) as AIProviderName[]).filter(
    (name) => !AI_MODELS[name].isFree
  ).length,
  providers: (Object.keys(AI_MODELS) as AIProviderName[]).map((name) => ({
    name,
    displayName: AI_MODELS[name].displayName,
    modelCount: AI_MODELS[name].models.length,
    isFree: AI_MODELS[name].isFree,
    priority: AI_MODELS[name].priority
  }))
};

// ✅ Affichage du résumé au chargement (côté serveur uniquement)
if (typeof window === 'undefined') {
  console.log('📊 Résumé des modèles IA:');
  console.log(`   Total providers: ${MODEL_SUMMARY.totalProviders}`);
  console.log(`   Total modèles: ${MODEL_SUMMARY.totalModels}`);
  console.log(`   Gratuits: ${MODEL_SUMMARY.freeProviders} providers`);
  console.log(`   Payants: ${MODEL_SUMMARY.paidProviders} providers`);
  console.log('   Détails:');
  MODEL_SUMMARY.providers.forEach((p) => {
    console.log(`     - ${p.displayName}: ${p.modelCount} modèles${p.isFree ? ' (gratuit)' : ' (payant)'}`);
  });
}