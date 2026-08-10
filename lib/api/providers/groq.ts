// lib/ai/providers/groq.ts

import { AIProvider, AIRequest, AIResponse, ProviderHealth } from '../types';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export class GroqProvider implements AIProvider {
  name = 'groq';
  models = ['mixtral-8x7b-32768', 'llama3-70b-8192', 'llama3-8b-8192'];
  defaultModel = 'mixtral-8x7b-32768';
  maxTokens = 8192;
  supportsStreaming = true;

  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GROQ_API_KEY || '';
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    const response = await fetch(GROQ_API_URL, {
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
      throw new Error(`Groq API error: ${response.status} - ${error}`);
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