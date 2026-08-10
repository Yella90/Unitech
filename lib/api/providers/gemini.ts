// lib/ai/providers/gemini.ts

import { AIProvider, AIRequest, AIResponse, ProviderHealth } from '../types';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export class GeminiProvider implements AIProvider {
  name = 'gemini';
  models = ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash-exp'];
  defaultModel = 'gemini-1.5-flash';
  maxTokens = 8192;
  supportsStreaming = false;

  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    const model = request.model || this.defaultModel;

    const response = await fetch(`${GEMINI_API_URL}/${model}:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: request.messages
                  .map((m) => `${m.role}: ${m.content}`)
                  .join('\n'),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.maxTokens ?? this.maxTokens,
          topP: request.topP ?? 0.9,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    return {
      content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
      model,
      provider: this.name,
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