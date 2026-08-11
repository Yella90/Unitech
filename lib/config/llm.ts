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
  enabled: boolean;
}

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
// CONFIGURATION
// ============================================================

/**
 * IMPORTANT :
 * Ce fichier est prévu pour fonctionner côté serveur.
 *
 * Les clés doivent être dans .env.local :
 *
 * GROQ_API_KEY=...
 * GEMINI_API_KEY=...
 * CEREBRAS_API_KEY=...
 * HUGGINGFACE_API_KEY=...
 *
 * Ne jamais mettre ces clés dans NEXT_PUBLIC_*.
 */

// ============================================================
// PROVIDERS
// ============================================================

export const llmConfigs: LLMConfig[] = [
  // ----------------------------------------------------------
  // 1. GROQ
  // ----------------------------------------------------------
  {
    provider: 'groq',
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY,
    model: 'llama-3.1-8b-instant',
    maxTokens: 800,
    temperature: 0.7,
    timeoutMs: 30000,
    priority: 1,
    isFree: true,
    enabled: Boolean(process.env.GROQ_API_KEY),
  },

  // ----------------------------------------------------------
  // 2. GEMINI
  // ----------------------------------------------------------
  {
    provider: 'gemini',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/models',
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-1.5-flash',
    maxTokens: 800,
    temperature: 0.7,
    timeoutMs: 30000,
    priority: 2,
    isFree: true,
    enabled: Boolean(process.env.GEMINI_API_KEY),
  },

  // ----------------------------------------------------------
  // 3. CEREBRAS
  // ----------------------------------------------------------
  {
    provider: 'cerebras',
    baseURL: 'https://api.cerebras.ai/v1',
    apiKey: process.env.CEREBRAS_API_KEY,
    model: 'llama3.1-8b',
    maxTokens: 800,
    temperature: 0.7,
    timeoutMs: 30000,
    priority: 3,
    isFree: true,
    enabled: Boolean(process.env.CEREBRAS_API_KEY),
  },

  // ----------------------------------------------------------
  // 4. HUGGING FACE
  // ----------------------------------------------------------
  {
    provider: 'huggingface',
    baseURL: 'https://router.huggingface.co/v1',
    apiKey: process.env.HUGGINGFACE_API_KEY,
    model: 'meta-llama/Llama-3.1-8B-Instruct',
    maxTokens: 800,
    temperature: 0.7,
    timeoutMs: 45000,
    priority: 4,
    isFree: true,
    enabled: Boolean(process.env.HUGGINGFACE_API_KEY),
  },
];

// ============================================================
// PROVIDER PAR DÉFAUT
// ============================================================

export const defaultLLM = llmConfigs.find((provider) => provider.enabled) || llmConfigs[0];

// ============================================================
// UTILITAIRES
// ============================================================

function normalizeBaseURL(baseURL: string): string {
  return baseURL.replace(/\/+$/, '');
}

function hasApiKey(config: LLMConfig): boolean {
  return Boolean(
    config.apiKey &&
    config.apiKey.trim() &&
    config.apiKey !== 'not-needed'
  );
}

// ============================================================
// EXTRACTION DE RÉPONSE
// ============================================================

function extractContent(data: any): string {
  // ----------------------------------------------------------
  // OpenAI / Groq / Cerebras / HF Router
  // ----------------------------------------------------------

  const openAIContent = data?.choices?.[0]?.message?.content;

  if (typeof openAIContent === 'string' && openAIContent.trim()) {
    return openAIContent.trim();
  }

  // ----------------------------------------------------------
  // Gemini
  // ----------------------------------------------------------

  const geminiContent = data?.candidates?.[0]?.content?.parts
    ?.map((part: any) => part?.text || '')
    .join('');

  if (typeof geminiContent === 'string' && geminiContent.trim()) {
    return geminiContent.trim();
  }

  // ----------------------------------------------------------
  // Autres formats
  // ----------------------------------------------------------

  if (typeof data?.response === 'string' && data.response.trim()) {
    return data.response.trim();
  }

  if (typeof data?.result === 'string' && data.result.trim()) {
    return data.result.trim();
  }

  if (typeof data?.content === 'string' && data.content.trim()) {
    return data.content.trim();
  }

  // Hugging Face ancien format
  if (Array.isArray(data)) {
    const generatedText = data[0]?.generated_text;
    if (typeof generatedText === 'string' && generatedText.trim()) {
      return generatedText.trim();
    }
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
// RÉPONSE DE SECOURS
// ============================================================

function getFallbackResponse(): string {
  return `Bonjour,

Merci pour votre message.

Je suis HARVEY, l'assistant automatique d'UNITECH.

Je rencontre actuellement un problème technique pour générer une réponse complète.

Un membre de notre équipe va prendre en charge votre demande dans les plus brefs délais.

Nous vous remercions de votre compréhension.
https://unitech-qvgo.onrender.com/

L'équipe UNITECH`;
}

// ============================================================
// CLIENT LLM
// ============================================================

export function createLLMClient(config: LLMConfig) {
  return {
    createChatCompletion: async (
      params: ChatCompletionParams
    ): Promise<ChatCompletionResponse> => {
      if (!config.enabled) {
        throw new Error(`Provider ${config.provider} désactivé ou clé API absente.`);
      }

      if (config.provider !== 'gemini' && !hasApiKey(config)) {
        throw new Error(`Clé API absente pour ${config.provider}.`);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

      try {
        let url = '';
        let body: Record<string, any>;

        // ====================================================
        // GEMINI
        // ====================================================

        if (config.provider === 'gemini') {
          if (!hasApiKey(config)) {
            throw new Error('GEMINI_API_KEY est absente.');
          }

          url =
            `${normalizeBaseURL(config.baseURL)}/` +
            `${config.model}:generateContent` +
            `?key=${encodeURIComponent(config.apiKey!)}`;

          const gemini = buildGeminiContents(params.messages);

          body = {
            contents: gemini.contents,
          };

          if (gemini.systemInstruction) {
            body.systemInstruction = gemini.systemInstruction;
          }

          body.generationConfig = {
            maxOutputTokens: params.max_tokens ?? config.maxTokens,
          };
        }

        // ====================================================
        // OPENAI-COMPATIBLE
        // Groq / Cerebras / HF Router
        // ====================================================

        else {
          url = `${normalizeBaseURL(config.baseURL)}/chat/completions`;

          body = {
            model: params.model ?? config.model,
            messages: params.messages,
            temperature: params.temperature ?? config.temperature,
            max_tokens: params.max_tokens ?? config.maxTokens,
            top_p: params.top_p ?? 0.9,
            frequency_penalty: params.frequency_penalty ?? 0.2,
            presence_penalty: params.presence_penalty ?? 0.1,
          };
        }

        // ====================================================
        // HEADERS
        // ====================================================

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        };

        if (hasApiKey(config)) {
          headers.Authorization = `Bearer ${config.apiKey}`;
        }

        // ====================================================
        // REQUEST
        // ====================================================

        const response = await fetch(url, {
          method: 'POST',
          headers,
          signal: controller.signal,
          body: JSON.stringify(body),
        });

        const responseText = await response.text();

        if (!response.ok) {
          throw new Error(`${config.provider} HTTP ${response.status}: ${responseText}`);
        }

        let data: any;

        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error(`${config.provider}: réponse JSON invalide.`);
        }

        const content = extractContent(data);

        if (!content) {
          throw new Error(`${config.provider}: réponse vide.`);
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
        if (error?.name === 'AbortError') {
          throw new Error(`${config.provider}: timeout après ${config.timeoutMs}ms`);
        }

        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    },
  };
}

// ============================================================
// CONFIGURATION PAR PROVIDER
// ============================================================

export function getLLMConfig(provider?: string): LLMConfig {
  if (provider) {
    const config = llmConfigs.find((item) => item.provider === provider);
    if (config) {
      return config;
    }
  }

  return defaultLLM;
}

// ============================================================
// PROVIDERS PAR PRIORITÉ
// ============================================================

export function getLLMConfigsByPriority(): LLMConfig[] {
  return llmConfigs
    .filter((config) => config.enabled)
    .sort((a, b) => a.priority - b.priority);
}

// ============================================================
// PROVIDERS GRATUITS DISPONIBLES
// ============================================================

export function getFreeProviders(): LLMConfig[] {
  return llmConfigs
    .filter((config) => config.isFree && config.enabled)
    .sort((a, b) => a.priority - b.priority);
}

// ============================================================
// FALLBACK AUTOMATIQUE
// ============================================================

export async function generateWithFallback(
  params: ChatCompletionParams
): Promise<{
  content: string;
  provider: string;
}> {
  const providers = getLLMConfigsByPriority();

  if (providers.length === 0) {
    console.warn('⚠️ Aucun provider configuré, utilisation du fallback');
    return {
      content: getFallbackResponse(),
      provider: 'fallback',
    };
  }

  const errors: string[] = [];

  for (const config of providers) {
    console.log(`🤖 HARVEY → ${config.provider} (${config.model})`);

    try {
      const client = createLLMClient(config);
      const response = await client.createChatCompletion(params);

      const content = response.data.choices?.[0]?.message?.content?.trim() || '';

      if (!content) {
        throw new Error('Réponse vide.');
      }

      console.log(`✅ HARVEY → réponse obtenue avec ${config.provider}`);
      return {
        content,
        provider: config.provider,
      };
    } catch (error: any) {
      const message = error?.message || 'Erreur inconnue';
      console.warn(`⚠️ ${config.provider} indisponible: ${message}`);
      errors.push(`${config.provider}: ${message}`);

      // Petit délai avant de passer au suivant
      if (providers.indexOf(config) < providers.length - 1) {
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
  };
}

// ============================================================
// TEST D'UN PROVIDER
// ============================================================

export async function testProvider(
  config: LLMConfig
): Promise<{
  provider: string;
  success: boolean;
  latency?: number;
  error?: string;
}> {
  const start = Date.now();

  try {
    const client = createLLMClient(config);

    await client.createChatCompletion({
      messages: [
        {
          role: 'system',
          content: 'Réponds uniquement par OK.',
        },
        {
          role: 'user',
          content: 'Dis OK.',
        },
      ],
      max_tokens: 10,
    });

    return {
      provider: config.provider,
      success: true,
      latency: Date.now() - start,
    };
  } catch (error: any) {
    return {
      provider: config.provider,
      success: false,
      latency: Date.now() - start,
      error: error?.message || 'Erreur inconnue',
    };
  }
}

// ============================================================
// TEST DE TOUS LES PROVIDERS
// ============================================================

export async function testAllProviders(): Promise<
  Array<{
    provider: string;
    success: boolean;
    error?: string;
    latency?: number;
  }>
> {
  const providers = getLLMConfigsByPriority();
  const results = [];

  for (const config of providers) {
    const result = await testProvider(config);
    results.push(result);
  }

  return results;
}

// ============================================================
// CLIENT GLOBAL AVEC FAILOVER
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
      },
    };
  },
};