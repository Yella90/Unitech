// lib/ai/providers/cerebras.ts

import { AIProvider, AIRequest, AIResponse, ProviderHealth } from '../types';

const CEREBRAS_API_URL = 'https://api.cerebras.ai/v1/chat/completions';

export class CerebrasProvider implements AIProvider {
  name = 'cerebras';
  models = ['llama3.1-70b', 'llama3.1-8b'];
  defaultModel = 'llama3.1-70b';
  maxTokens = 8192;
  supportsStreaming = false;

  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.CEREBRAS_API_KEY || '';
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    const response = await fetch(CEREBRAS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model || this.defaultModel,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? this.maxTokens,
        top_p: request.topP ?? 0.9,
        frequency_penalty: request.frequencyPenalty ?? 0.2,
        presence_penalty: request.presencePenalty ?? 0.1,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cerebras API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    return {
      content: data.choices[0]?.message?.content || '',
      model: data.model || this.defaultModel,
      provider: this.name,
      usage: data.usage,
      latency: Date.now() - startTime,
    };
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      await this.generate({
        messages: [{ role: 'user', content: 'ping' }],
        maxTokens: 5,
      });
      return true;
    } catch {
      return false;
    }
  }

  async getHealth(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      await this.isAvailable();
      return {
        available: true,
        latency: Date.now() - start,
        lastCheck: new Date(),
      };
    } catch (error: any) {
      return {
        available: false,
        latency: Date.now() - start,
        error: error.message,
        lastCheck: new Date(),
      };
    }
  }
}