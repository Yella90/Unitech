// lib/config/llm.ts
import { aiManagement } from '@/lib/services/AIManagementService';
import type { ContextType, AIProviderName } from '@/lib/types/ai-management';

// ============================================================
// TYPES
// ============================================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionParams {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  contextType?: ContextType;
  provider?: string;  // ✅ Ajouté
  sessionId?: string; // ✅ Ajouté
}

export interface ChatCompletionResponse {
  data: {
    choices: Array<{
      message: {
        role?: string;
        content: string;
      };
    }>;
    provider?: string;
    model?: string;
  };
}

// ============================================================
// MODÈLES PAR PROVIDER
// ============================================================

const PROVIDER_MODELS: Record<string, string[]> = {
  openai: [
    'gpt-5',
    'gpt-5-mini',
    'gpt-5-nano',
    'gpt-4.1',
    'gpt-4.1-mini',
    'gpt-4.1-nano'
  ],
  anthropic: [
    'claude-opus-4-6',
    'claude-sonnet-4-6',
    'claude-haiku-4-5'
  ],
  google: [
    'gemini-3.7-flash',
    'gemini-3-pro',
    'gemini-3-flash'
  ],
  mistral: [
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
  deepseek: [
    'deepseek-v3.2',
    'deepseek-v3.2-speciale',
    'deepseek-v4'
  ],
  groq: [
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'llama-3.3-70b-versatile',
    'qwen/qwen3.6-27b',
    'meta-llama/Llama-3.1-8B-Instruct',
    'meta-llama/Llama-3.1-70B-Instruct',
    'mistralai/Mistral-7B-Instruct-v0.3'
  ],
  cohere: [
    'command-a-03-2025',
    'command-a-reasoning-08-2025',
    'command-r7b-12-2024',
    'embed-v4.0',
    'embed-multilingual-v3.0',
    'embed-english-v3.0'
  ],
  cerebras: [
    'llama3.1-8b',
    'llama3.1-70b',
    'llama3.1-405b'
  ],
  huggingface: [
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
  ]
};

// ============================================================
// API BASES PAR PROVIDER
// ============================================================

const API_BASES: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  google: 'https://generativelanguage.googleapis.com/v1beta',
  mistral: 'https://api.mistral.ai/v1',
  deepseek: 'https://api.deepseek.com/v1',
  groq: 'https://api.groq.com/openai/v1',
  cohere: 'https://api.cohere.ai/v1',
  cerebras: 'https://api.cerebras.ai/v1',
  huggingface: 'https://router.huggingface.co/v1'
};

// ============================================================
// API TYPES PAR PROVIDER
// ============================================================

const API_TYPES: Record<string, 'openai' | 'anthropic' | 'google' | 'cohere'> = {
  openai: 'openai',
  anthropic: 'anthropic',
  google: 'google',
  mistral: 'openai',
  deepseek: 'openai',
  groq: 'openai',
  cohere: 'cohere',
  cerebras: 'openai',
  huggingface: 'openai'
};

// ============================================================
// RÉPONSE DE SECOURS
// ============================================================

function getFallbackResponse(): string {
  return `Bonjour,

Merci pour votre message.

Je suis HARVEY, l'assistant automatique d'UNITECH.

Je rencontre actuellement un problème technique pour générer une réponse complète.

Un membre de notre équipe va prendre en charge votre demande dans les plus brefs délais.

Nous vous remercions de votre compréhension.

L'équipe UNITECH`;
}

// ============================================================
// EXTRACTION DE RÉPONSE PAR PROVIDER
// ============================================================

function extractContent(data: any, provider: string): string {
  // OpenAI / Groq / Mistral / DeepSeek / Cerebras / HuggingFace
  if (['openai', 'groq', 'mistral', 'deepseek', 'cerebras', 'huggingface'].includes(provider)) {
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content === 'string' && content.trim()) {
      return content.trim();
    }
  }

  // Anthropic
  if (provider === 'anthropic') {
    const content = data?.content?.[0]?.text;
    if (typeof content === 'string' && content.trim()) {
      return content.trim();
    }
  }

  // Google Gemini
  if (provider === 'google') {
    const content = data?.candidates?.[0]?.content?.parts
      ?.map((part: any) => part?.text || '')
      .join('');
    if (typeof content === 'string' && content.trim()) {
      return content.trim();
    }
  }

  // Cohere
  if (provider === 'cohere') {
    const content = data?.text || data?.generations?.[0]?.text;
    if (typeof content === 'string' && content.trim()) {
      return content.trim();
    }
  }

  // Fallback générique
  if (typeof data?.response === 'string' && data.response.trim()) {
    return data.response.trim();
  }
  if (typeof data?.result === 'string' && data.result.trim()) {
    return data.result.trim();
  }
  if (typeof data?.content === 'string' && data.content.trim()) {
    return data.content.trim();
  }

  return '';
}

// ============================================================
// CONSTRUIRE LE PROMPT GEMINI
// ============================================================

function buildGeminiContents(messages: ChatMessage[]) {
  const systemMessages = messages
    .filter((message) => message.role === 'system')
    .map((message) => message.content)
    .join('\n\n');

  const conversationMessages = messages.filter((message) => message.role !== 'system');

  const contents = conversationMessages.map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }],
  }));

  return {
    contents,
    systemInstruction: systemMessages
      ? { parts: [{ text: systemMessages }] }
      : undefined,
  };
}

// ============================================================
// APPEL API PAR PROVIDER
// ============================================================

async function callProviderAPI(
  provider: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  temperature: number,
  maxTokens: number,
  timeoutMs: number = 30000
): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const apiType = API_TYPES[provider] || 'openai';
    const baseURL = API_BASES[provider] || '';

    let url = '';
    let body: Record<string, any> = {};
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    switch (apiType) {
      case 'openai':
        url = `${baseURL}/chat/completions`;
        headers['Authorization'] = `Bearer ${apiKey}`;
        body = {
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          top_p: 0.9,
          frequency_penalty: 0.2,
          presence_penalty: 0.1,
        };
        break;

      case 'anthropic':
        url = `${baseURL}/messages`;
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01';
        
        const systemMessage = messages.find(m => m.role === 'system');
        const userMessages = messages.filter(m => m.role !== 'system');
        
        body = {
          model,
          messages: userMessages,
          system: systemMessage?.content,
          temperature,
          max_tokens: maxTokens,
        };
        break;

      case 'google':
        url = `${baseURL}/models/${model}:generateContent?key=${apiKey}`;
        const gemini = buildGeminiContents(messages);
        body = {
          contents: gemini.contents,
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature,
          },
        };
        if (gemini.systemInstruction) {
          body.systemInstruction = gemini.systemInstruction;
        }
        break;

      case 'cohere':
        url = `${baseURL}/generate`;
        headers['Authorization'] = `Bearer ${apiKey}`;
        const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');
        body = {
          model,
          prompt,
          max_tokens: maxTokens,
          temperature,
        };
        break;

      default:
        throw new Error(`Provider ${provider} non supporté`);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`${provider} HTTP ${response.status}: ${responseText}`);
    }

    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error(`${provider}: réponse JSON invalide`);
    }

    const content = extractContent(data, provider);
    if (!content) {
      throw new Error(`${provider}: réponse vide`);
    }

    return {
      content,
      model: model,
      usage: data?.usage || data?.usageMetadata || null,
    };

  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error(`${provider}: timeout après ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================================
// FALLBACK AUTOMATIQUE AVEC GESTION DES CLÉS API
// ============================================================

export async function generateWithFallback(
  params: ChatCompletionParams
): Promise<{
  content: string;
  provider: string;
  model: string;
}> {
  const {
    messages,
    temperature = 0.7,
    max_tokens = 800,
    contextType = 'general',
    model: preferredModel,
    provider: preferredProvider
  } = params;

  // 1. Obtenir la liste des providers actifs
  let providers = await aiManagement.getProviders(true);
  
  // 2. Si un provider spécifique est demandé, le mettre en premier
  if (preferredProvider) {
    const preferred = providers.find(p => p.name === preferredProvider);
    if (preferred) {
      providers = [preferred, ...providers.filter(p => p.name !== preferredProvider)];
    }
  }

  if (providers.length === 0) {
    console.warn('⚠️ Aucun provider configuré, utilisation du fallback');
    return {
      content: getFallbackResponse(),
      provider: 'fallback',
      model: 'fallback'
    };
  }

  // 3. Obtenir les règles de contexte
  const rules = await aiManagement.getContextRules(contextType);

  // 4. Trier les providers par score
  const scoredProviders = await Promise.all(
    providers.map(async (provider) => {
      const key = await aiManagement.getActiveApiKey(provider.id);
      if (!key) return null;

      const perf = await aiManagement.getPerformanceStats(provider.id, 7);
      const rule = rules.find(r => r.provider_id === provider.id);

      let score = provider.priority || 0;
      if (rule) score += rule.score || 0;
      if (perf.successRate > 0.9) score += 20;
      score -= (key.error_count || 0) * 5;

      // Si un modèle spécifique est demandé, vérifier qu'il est disponible
      if (preferredModel) {
        const availableModels = PROVIDER_MODELS[provider.name] || [];
        if (!availableModels.includes(preferredModel)) {
          score -= 50; // Réduire le score si le modèle n'est pas disponible
        }
      }

      return {
        provider,
        key,
        score,
        performance: perf
      };
    })
  );

  const validProviders = scoredProviders
    .filter((item): item is { provider: any; key: any; score: number; performance: any } => item !== null)
    .sort((a, b) => b.score - a.score);

  if (validProviders.length === 0) {
    console.warn('⚠️ Aucun provider valide, utilisation du fallback');
    return {
      content: getFallbackResponse(),
      provider: 'fallback',
      model: 'fallback'
    };
  }

  // 5. Essayer chaque provider dans l'ordre de score
  const errors: string[] = [];

  for (const { provider, key } of validProviders) {
    const availableModels = PROVIDER_MODELS[provider.name] || [];
    const model = preferredModel && availableModels.includes(preferredModel)
      ? preferredModel
      : availableModels[0] || 'default';

    console.log(`🤖 HARVEY → ${provider.display_name} (${model})`);

    try {
      const startTime = Date.now();
      
      const result = await callProviderAPI(
        provider.name,
        key.key_value,
        model,
        messages,
        temperature,
        max_tokens
      );

      const duration = Date.now() - startTime;

      // Logger la performance
      await aiManagement.logPerformance({
        provider_id: provider.id,
        api_key_id: key.id,
        model: result.model || model,
        request_type: contextType,
        duration_ms: duration,
        tokens_input: result.usage?.prompt_tokens || result.usage?.input_tokens || 0,
        tokens_output: result.usage?.completion_tokens || result.usage?.output_tokens || 0,
        tokens_total: result.usage?.total_tokens || result.usage?.totalTokenCount || 0,
        cost: 0,
        success: true,
        response_time: duration,
        context: contextType,
        metadata: { temperature, max_tokens }
      });

      // Incrémenter l'utilisation
      await aiManagement.incrementApiUsage(key.id, result.usage?.total_tokens || 0);

      console.log(`✅ HARVEY → réponse obtenue avec ${provider.display_name} (${duration}ms)`);

      return {
        content: result.content,
        provider: provider.name,
        model: result.model || model
      };

    } catch (error: any) {
      const message = error?.message || 'Erreur inconnue';
      console.warn(`⚠️ ${provider.display_name} indisponible: ${message}`);
      errors.push(`${provider.display_name}: ${message}`);

      // Logger l'erreur
      await aiManagement.markApiKeyError(key.id, message);
      
      await aiManagement.logError({
        provider_id: provider.id,
        api_key_id: key.id,
        error_type: error?.type || 'api_error',
        error_message: message,
        status_code: error?.status || 500,
        request_data: { messages, temperature, max_tokens, model }
      });

      await aiManagement.logPerformance({
        provider_id: provider.id,
        api_key_id: key.id,
        model: model,
        request_type: contextType,
        duration_ms: 0,
        tokens_input: 0,
        tokens_output: 0,
        tokens_total: 0,
        cost: 0,
        success: false,
        error_message: message,
        response_time: 0,
        context: contextType,
        metadata: { temperature, max_tokens, error: message }
      });

      // Petit délai avant le prochain
      const currentIndex = validProviders.findIndex(p => p.provider.id === provider.id);
      if (currentIndex < validProviders.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      continue;
    }
  }

  console.error('❌ Tous les providers ont échoué:', errors);

  // ✅ Fallback ultime
  return {
    content: getFallbackResponse(),
    provider: 'fallback',
    model: 'fallback'
  };
}

// ============================================================
// CLIENT GLOBAL
// ============================================================

export const llmClient = {
  createChatCompletion: async (
    params: ChatCompletionParams
  ): Promise<ChatCompletionResponse> => {
    const result = await generateWithFallback(params);

    return {
      data: {
        choices: [
          {
            message: {
              role: 'assistant',
              content: result.content,
            },
          },
        ],
        provider: result.provider,
        model: result.model,
      },
    };
  },
};