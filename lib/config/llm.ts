// lib/config/llm.ts

// ============================================================
// TYPES
// ============================================================

export interface LLMConfig {
  provider: string;
  baseURL: string;
  apiKey?: string;
  model: string;
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
  priority: number;
  isFree: boolean;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionParams {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;        // ✅ Correction : max_tokens (snake_case)
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
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
  };
}

// ============================================================
// CONFIGURATION DES PROVIDERS GRATUITS
// ============================================================

// lib/config/llm.ts

// lib/config/llm.ts

export const llmConfigs: LLMConfig[] = [
  {
    provider: 'groq',
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY,
    model: 'llama-3.1-8b-instant',  // ✅ Fonctionne
    maxTokens: 4096,
    temperature: 0.7,
    timeoutMs: 30000,
    priority: 1,  // ✅ Priorité maximale
    isFree: true,
  },
  {
    provider: 'gemini',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/models',
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-1.5-flash',
    maxTokens: 4096,
    temperature: 0.7,
    timeoutMs: 30000,
    priority: 2,
    isFree: true,
  },
  {
    provider: 'huggingface',
    baseURL: 'https://api-inference.huggingface.co/models',
    apiKey: process.env.HUGGINGFACE_API_KEY,
    model: 'mistralai/Mistral-7B-Instruct-v0.1',
    maxTokens: 4096,
    temperature: 0.7,
    timeoutMs: 45000,
    priority: 3,
    isFree: true,
  },
  {
    provider: 'cerebras',
    baseURL: 'https://api.cerebras.ai/v1',
    apiKey: process.env.CEREBRAS_API_KEY,
    model: 'llama3.1-70b',
    maxTokens: 4096,
    temperature: 0.7,
    timeoutMs: 30000,
    priority: 4,
    isFree: true,
  },
  {
    provider: 'keyless',
    baseURL: 'https://keylessai.thryx.workers.dev/v1',
    apiKey: undefined,
    model: 'gpt-3.5-turbo',
    maxTokens: 800,
    temperature: 0.7,
    timeoutMs: 30000,
    priority: 5,  // ✅ Dernier recours
    isFree: true,
  },
];

export const defaultLLM: LLMConfig = llmConfigs[0];

// ============================================================
// FONCTIONS
// ============================================================

export function getLLMConfig(provider?: string): LLMConfig {
  if (provider) {
    const found = llmConfigs.find((c) => c.provider === provider);
    if (found) return found;
  }
  return defaultLLM;
}

export function getLLMConfigsByPriority(): LLMConfig[] {
  return [...llmConfigs].sort((a, b) => a.priority - b.priority);
}

export function getFreeProviders(): LLMConfig[] {
  return llmConfigs.filter((c) => c.isFree);
}

// ============================================================
// NORMALISER L'URL
// ============================================================

function normalizeBaseURL(baseURL: string): string {
  return baseURL.replace(/\/+$/, '');
}

// ============================================================
// EXTRAIRE LE CONTENU DE LA RÉPONSE
// ============================================================

function extractContent(data: any): string {
  const openAIContent = data?.choices?.[0]?.message?.content;
  if (typeof openAIContent === 'string' && openAIContent.trim()) {
    return openAIContent.trim();
  }

  const geminiContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof geminiContent === 'string' && geminiContent.trim()) {
    return geminiContent.trim();
  }

  if (Array.isArray(data) && data.length > 0) {
    const hfContent = data[0]?.generated_text;
    if (typeof hfContent === 'string' && hfContent.trim()) {
      return hfContent.trim();
    }
  }

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
// CRÉER UN CLIENT LLM
// ============================================================

export function createLLMClient(config: LLMConfig) {
  return {
    createChatCompletion: async (
      params: ChatCompletionParams
    ): Promise<ChatCompletionResponse> => {
      const baseURL = normalizeBaseURL(config.baseURL);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        };

        if (config.apiKey && config.apiKey.trim() && config.apiKey !== 'not-needed') {
          headers.Authorization = `Bearer ${config.apiKey}`;
        }

        let url = `${baseURL}/chat/completions`;
        let body: any = {
          model: params.model || config.model,
          messages: params.messages,
          temperature: params.temperature ?? config.temperature,
          max_tokens: params.max_tokens ?? config.maxTokens,  // ✅ Correction
          top_p: params.top_p ?? 0.9,
          frequency_penalty: params.frequency_penalty ?? 0.2,
          presence_penalty: params.presence_penalty ?? 0.1,
        };

        // Adaptation pour Gemini
        if (config.provider === 'gemini') {
          url = `${baseURL}/${config.model}:generateContent?key=${config.apiKey}`;
          body = {
            contents: [
              {
                parts: [
                  {
                    text: params.messages
                      .map((m) => `${m.role}: ${m.content}`)
                      .join('\n'),
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: params.temperature ?? config.temperature,
              maxOutputTokens: params.max_tokens ?? config.maxTokens,
              topP: params.top_p ?? 0.9,
            },
          };
        }

        // Adaptation pour HuggingFace
        if (config.provider === 'huggingface') {
          url = `${baseURL}/${config.model}`;
          body = {
            inputs: params.messages.map((m) => `${m.role}: ${m.content}`).join('\n'),
            parameters: {
              temperature: params.temperature ?? config.temperature,
              max_new_tokens: params.max_tokens ?? config.maxTokens,
              top_p: params.top_p ?? 0.9,
            },
          };
        }

        const response = await fetch(url, {
          method: 'POST',
          headers,
          signal: controller.signal,
          body: JSON.stringify(body),
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const content = extractContent(data);

        if (!content) {
          throw new Error('Le LLM a retourné une réponse vide.');
        }

        return {
          data: {
            choices: [
              {
                message: {
                  role: 'assistant',
                  content,
                },
              },
            ],
            provider: config.provider,
          },
        };
      } catch (error: any) {
        clearTimeout(timeoutId);

        if (error?.name === 'AbortError') {
          throw new Error(`Timeout après ${config.timeoutMs}ms`);
        }

        throw error;
      }
    },
  };
}

// ============================================================
// GÉNÉRER AVEC FALLBACK
// ============================================================

export async function generateWithFallback(
  params: ChatCompletionParams
): Promise<{ content: string; provider: string }> {
  const providers = getLLMConfigsByPriority();
  const errors: string[] = [];

  for (const config of providers) {
    try {
      console.log(`🔌 Essai du provider: ${config.provider} (${config.model})`);

      const client = createLLMClient(config);
      const response = await client.createChatCompletion(params);

      const content = response.data.choices[0]?.message?.content || '';

      if (content) {
        console.log(`✅ Provider ${config.provider} a répondu`);
        return { content, provider: config.provider };
      }
    } catch (error: any) {
      const errorMsg = `${config.provider}: ${error.message}`;
      console.warn(`⚠️ ${errorMsg}`);
      errors.push(errorMsg);
    }
  }

  console.error('❌ Tous les providers ont échoué:', errors);
  throw new Error(`Aucun provider disponible: ${errors.join('; ')}`);
}

// ============================================================
// TEST DE CONNEXION
// ============================================================

export async function testAllProviders(): Promise<
  Array<{ provider: string; success: boolean; error?: string; latency?: number }>
> {
  const results = [];

  for (const config of getFreeProviders()) {
    const start = Date.now();
    try {
      const client = createLLMClient(config);
      await client.createChatCompletion({
        messages: [
          { role: 'system', content: 'Réponds très brièvement.' },
          { role: 'user', content: 'Dis: OK' },
        ],
        max_tokens: 5,
        temperature: 0.3,
      });

      results.push({
        provider: config.provider,
        success: true,
        latency: Date.now() - start,
      });
    } catch (error: any) {
      results.push({
        provider: config.provider,
        success: false,
        error: error.message,
        latency: Date.now() - start,
      });
    }
  }

  return results;
}

// ============================================================
// EXPORT DU CLIENT AVEC FALLBACK
// ============================================================

export const llmClient = {
  createChatCompletion: async (params: ChatCompletionParams) => {
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
      },
    };
  },
};