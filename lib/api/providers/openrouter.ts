// lib/ai/providers/openrouter.ts

import { AIProvider, AIRequest, AIResponse, ProviderHealth } from '../types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export class OpenRouterProvider implements AIProvider {
  name = 'openrouter';
  models = [
    'mistralai/mistral-7b-instruct',
    'meta-llama/llama-3-70b-instruct',
    'anthropic/claude-3-haiku',
    'google/gemini-1.5-flash',
  ];
  defaultModel = 'mistralai/mistral-7b-instruct';
  maxTokens = 8192;
  supportsStreaming = true;

  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || '';
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'UNITECH HARVEY',
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
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
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