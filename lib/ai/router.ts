// lib/ai/router.ts

import { AIProvider, AIRequest, AIResponse, ProviderHealth, ProviderName } from '../api/types';
import { GroqProvider } from '../api/providers/groq';
import { GeminiProvider } from '../api/providers/gemini';
import { OpenRouterProvider } from '../api/providers/openrouter';
import { CerebrasProvider } from '../api/providers/cerebras';
import { HuggingFaceProvider } from '../api/providers/huggingface';

export class AIRouter {
  private providers: Map<ProviderName, AIProvider> = new Map();
  private primaryProvider: ProviderName = 'openrouter';
  private fallbackProviders: ProviderName[] = ['groq', 'gemini', 'cerebras', 'huggingface'];

  constructor() {
    // Initialiser tous les providers
    this.registerProvider('groq', new GroqProvider());
    this.registerProvider('gemini', new GeminiProvider());
    this.registerProvider('openrouter', new OpenRouterProvider());
    this.registerProvider('cerebras', new CerebrasProvider());
    this.registerProvider('huggingface', new HuggingFaceProvider());
  }

  registerProvider(name: ProviderName, provider: AIProvider): void {
    this.providers.set(name, provider);
  }

  setPrimaryProvider(name: ProviderName): void {
    if (this.providers.has(name)) {
      this.primaryProvider = name;
    }
  }

  setFallbackProviders(names: ProviderName[]): void {
    this.fallbackProviders = names;
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    // 1. Essayer le provider principal
    const primary = this.providers.get(this.primaryProvider);
    if (primary) {
      try {
        const health = await primary.getHealth();
        if (health.available) {
          return await primary.generate(request);
        }
      } catch (error) {
        console.warn(`⚠️ Primary provider ${this.primaryProvider} unavailable:`, error);
      }
    }

    // 2. Essayer les fallbacks
    for (const name of this.fallbackProviders) {
      const provider = this.providers.get(name);
      if (!provider) continue;

      try {
        const health = await provider.getHealth();
        if (health.available) {
          console.log(`🔄 Using fallback provider: ${name}`);
          return await provider.generate(request);
        }
      } catch (error) {
        console.warn(`⚠️ Fallback provider ${name} unavailable:`, error);
      }
    }

    throw new Error('Aucun provider IA disponible');
  }

  async getAvailableProviders(): Promise<ProviderName[]> {
    const available: ProviderName[] = [];

    for (const [name, provider] of this.providers) {
      try {
        const health = await provider.getHealth();
        if (health.available) {
          available.push(name);
        }
      } catch {
        // Ignorer les erreurs
      }
    }

    return available;
  }

  async getHealth(): Promise<Record<ProviderName, ProviderHealth>> {
    const health: Record<ProviderName, ProviderHealth> = {} as any;

    for (const [name, provider] of this.providers) {
      health[name] = await provider.getHealth();
    }

    return health;
  }
}

export const aiRouter = new AIRouter();