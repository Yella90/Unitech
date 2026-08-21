// lib/types/ai-management.ts

// ============================================================
// TYPES DE BASE
// ============================================================

export type AIProvider = {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  website: string | null;
  api_base_url: string | null;
  models: string[];
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
};
export type AIProviderName = 
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'mistral'
  | 'groq'
  | 'cohere'
  | 'deepseek'
  | 'cerebras'
  | 'huggingface';
export type ApiKeyStatus = 'active' | 'inactive' | 'expired' | 'depleted';

export type APIKey = {
  id: string;
  provider_id: string;
  provider?: AIProvider;
  key_value: string;
  key_name: string | null;
  status: ApiKeyStatus;
  usage_count: number;
  monthly_usage: number;
  daily_usage: number;
  rate_limit: number;
  remaining_quota: number | null;
  total_quota: number | null;
  expires_at: string | null;
  last_used_at: string | null;
  last_error: string | null;
  error_count: number;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

// ============================================================
// TYPES DÉRIVÉS
// ============================================================

export type AIPerformance = {
  id: string;
  provider_id: string;
  provider?: AIProvider;
  api_key_id: string;
  api_key?: APIKey;
  model: string;
  request_type: string;
  duration_ms: number;
  tokens_input: number;
  tokens_output: number;
  tokens_total: number;
  cost: number;
  success: boolean;
  error_message: string | null;
  response_time: number;
  timestamp: string;
  session_id: string | null;
  context: string | null;
  metadata: Record<string, any>;
};

export type AIError = {
  id: string;
  provider_id: string;
  provider?: AIProvider;
  api_key_id: string;
  api_key?: APIKey;
  error_type: string;
  error_message: string;
  status_code: number;
  request_data: Record<string, any>;
  response_data: Record<string, any>;
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
};

export type AIContextRule = {
  id: string;
  context_type: string;
  provider_id: string;
  provider?: AIProvider;
  model: string;
  priority: number;
  conditions: Record<string, any>;
  score: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// ============================================================
// TYPES DE CONTEXTE
// ============================================================

export type ContextType = 
  | 'general' 
  | 'fast_response' 
  | 'complex_reasoning' 
  | 'coding' 
  | 'cheap' 
  | 'creative' 
  | 'factual' 
  | 'analytical';

// ============================================================
// TYPES POUR LES AGENTS
// ============================================================

export type AgentType = 'dona' | 'harvey' | 'both';

export type AgentStatus = {
  initialized: boolean;
  lastRun?: string;
  totalProcessed?: number;
  errors?: number;
};

export type DonaStatus = {
  initialized: boolean;
  processedEmails: number;
  keywordConfigs: number;
  pendingEmails: number;
  totalProcessed: number;
  config?: DonaConfig;
  lastRun?: string;
};

export type HarveyStatus = {
  initialized: boolean;
  processedEmails: number;
  processedContacts: number;
  knowledgeBase: number;
  templates: number;
  config?: HarveyConfig;
  lastRun?: string;
};

// ============================================================
// TYPES DE CONFIGURATION
// ============================================================

export interface DonaConfig {
  maxEmailsPerRun?: number;
  enableDeduplication?: boolean;
  enableNewsletterAutoSubscribe?: boolean;
  debug?: boolean;
  defaultCategories?: KeywordConfig[];
}

export interface KeywordConfig {
  id: string;
  category: string;
  keywords: string[];
  priority: number;
  is_active: boolean;
}

export interface HarveyConfig {
  maxEmailsPerRun?: number;
  minConfidence?: number;
  requireHumanReview?: boolean;
  defaultTone?: 'professional' | 'friendly' | 'technical' | 'concise';
  temperature?: number;
  maxTokens?: number;
  providerPriority?: string[];
}

// ============================================================
// TYPES POUR LES REQUÊTES
// ============================================================

export interface EmailData {
  id?: string;
  from: string;
  subject: string;
  body: string;
  to?: string;
  category?: string;
  priority?: string;
  assigned_agent?: string;
  received_at?: string;
  status?: string;
}

export interface ContactData {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  category?: string;
  priority?: string;
  assigned_agent?: string;
  status?: string;
  created_at?: string;
}

export interface AnalysisResult {
  category: string;
  priority: 'high' | 'medium' | 'low';
  assigned_agent: string;
  confidence: number;
  matched_keywords: string[];
  summary: string;
  score: number;
}

// ============================================================
// TYPES POUR LES RÉSULTATS DE PROCESSUS
// ============================================================

export interface ProcessEmailResult {
  action: 'stored' | 'ignored' | 'newsletter' | 'error';
  email_id?: string;
  analysis?: AnalysisResult;
  error?: Error;
  reason?: string;
  metadata?: {
    processed_at?: string;
    duration?: number;
  };
}

export interface ProcessContactResult {
  action: 'updated' | 'ignored' | 'error';
  analysis?: AnalysisResult;
  error?: Error;
  reason?: string;
  metadata?: {
    processed_at?: string;
    duration?: number;
  };
}

export interface BatchProcessResult {
  processed: number;
  ignored: number;
  errors: string[];
  total: number;
  duration: number;
}

export interface CleanupResult {
  cleaned: number;
  errors: string[];
  duplicates: {
    key: string;
    count: number;
    kept: string;
    removed: string[];
  }[];
}

// ============================================================
// TYPES POUR LA CONVERSATION
// ============================================================

export interface ConversationHistory {
  id: string;
  from_email: string;
  subject: string;
  body: string;
  agent_response: string;
  sent_at: string;
  category: string;
  tone?: string;
  confidence?: number;
}

// ============================================================
// TYPES POUR LES RÉPONSES
// ============================================================

export interface HarveyResponse {
  content: string;
  tone: 'professional' | 'friendly' | 'technical' | 'concise';
  actions: string[];
  requires_human_review: boolean;
  confidence: number;
  suggested_agent: 'SUPPORT' | 'COMMERCIAL' | 'PROJET' | 'HUMAN';
  metadata: {
    word_count: number;
    reading_time: number;
    sentiment: 'positive' | 'neutral' | 'negative';
  };
}

// ============================================================
// TYPES POUR LES STATISTIQUES
// ============================================================

export type ApiKeyStats = {
  total: number;
  active: number;
  inactive: number;
  expired: number;
  depleted: number;
};

export type ProviderStats = {
  provider: AIProvider;
  keyCount: number;
  activeKeys: number;
  totalUsage: number;
  errorRate: number;
  avgResponseTime: number;
};

export type DashboardStats = {
  totalProviders: number;
  activeProviders: number;
  totalKeys: number;
  activeKeys: number;
  providerStats: ProviderStats[];
  recentErrors: AIError[];
  performanceOverview: {
    avgResponseTime: number;
    successRate: number;
    totalRequests: number;
  };
};

// ============================================================
// HELPERS
// ============================================================

export const isValidStatus = (status: string): status is ApiKeyStatus => {
  return ['active', 'inactive', 'expired', 'depleted'].includes(status);
};

export const isProviderActive = (provider: AIProvider): boolean => {
  return provider.is_active === true;
};

export const getProviderDisplayName = (provider: AIProvider): string => {
  return provider.display_name || provider.name;
};

export const getStatusLabel = (status: ApiKeyStatus): string => {
  const labels: Record<ApiKeyStatus, string> = {
    active: 'Actif',
    inactive: 'Inactif',
    expired: 'Expiré',
    depleted: 'Épuisé'
  };
  return labels[status] || status;
};

export const isKeyUsable = (key: APIKey): boolean => {
  return key.status === 'active' && 
         (!key.expires_at || new Date(key.expires_at) > new Date()) &&
         (key.remaining_quota === null || key.remaining_quota > 0);
};

export const getContextLabel = (contextType: ContextType): string => {
  const labels: Record<ContextType, string> = {
    general: 'Général',
    fast_response: 'Réponse rapide',
    complex_reasoning: 'Raisonnement complexe',
    coding: 'Programmation',
    cheap: 'Économique',
    creative: 'Créatif',
    factual: 'Factuel',
    analytical: 'Analyse'
  };
  return labels[contextType] || contextType;
};

export const getContextIcon = (contextType: ContextType): string => {
  const icons: Record<ContextType, string> = {
    general: '💬',
    fast_response: '⚡',
    complex_reasoning: '🧠',
    coding: '💻',
    cheap: '💰',
    creative: '🎨',
    factual: '📚',
    analytical: '📊'
  };
  return icons[contextType] || '📌';
};