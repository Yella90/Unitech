// lib/ai/types.ts

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequest {
  messages: AIMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface AIResponse {
  content: string;
  model: string;
  provider: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latency?: number;
}

export interface AIProvider {
  name: string;
  models: string[];
  defaultModel: string;
  maxTokens: number;
  supportsStreaming: boolean;

  generate(request: AIRequest): Promise<AIResponse>;
  isAvailable(): Promise<boolean>;
  getHealth(): Promise<ProviderHealth>;
}

export interface ProviderHealth {
  available: boolean;
  latency: number;
  error?: string;
  lastCheck: Date;
}

export interface Quota {
  provider: string;
  limit: number;
  used: number;
  resetAt: Date;
  remaining: number;
}

export type ProviderName = 'groq' | 'gemini' | 'openrouter' | 'cerebras' | 'huggingface';