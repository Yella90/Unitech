
// lib/ai/providers/huggingface.ts

import { AIProvider, AIRequest, AIResponse, ProviderHealth } from '../types';

export class HuggingFaceProvider implements AIProvider {
  name = 'huggingface';
  models = [
    'mistralai/Mistral-7B-Instruct-v0.1',
    'meta-llama/Llama-2-7b-chat-hf',
    'google/gemma-7b-it',
  ];
  defaultModel = 'mistralai/Mistral-7B-Instruct-v0.1';
  maxTokens = 4096;
  supportsStreaming = false;

  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.HUGGINGFACE_API_KEY || '';
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    const model = request.model || this.defaultModel;

    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        inputs: request.messages
          .map((m) => `${m.role}: ${m.content}`)
          .join('\n'),
        parameters: {
          temperature: request.temperature ?? 0.7,
          max_new_tokens: request.maxTokens ?? this.maxTokens,
          top_p: request.topP ?? 0.9,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HuggingFace API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    // HuggingFace peut retourner un tableau ou un objet
    const content = Array.isArray(data)
      ? data[0]?.generated_text || ''
      : data?.generated_text || '';

    return {
      content,
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