// lib/agents/harvey-v2/types.ts
// Types pour Harvey V2 - Service d'automatisation des emails

// ============================================================
// TYPES PRINCIPAUX
// ============================================================

export interface EmailRequest {
  id?: string;
  from_email: string;
  from_name?: string;
  to_email: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  body: string;
  body_html?: string;
  category?: EmailCategory;
  priority?: EmailPriority;
  project_id?: string;
  client_id?: string;
  received_at?: string;
  attachments?: Attachment[];
  headers?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface EmailResponse {
  success: boolean;
  data?: {
    id: string;
    email_id?: string;
    conversation_id?: string;
    response: string;
    response_html?: string;
    response_json?: any;
    tone: EmailTone;
    confidence: number;
    actions: string[];
    requires_human_review: boolean;
    suggested_agent: AgentType;
    metadata: ResponseMetadata;
    company_mentions?: CompanyMention[];
    next_steps?: string[];
  };
  error?: string;
  code?: ErrorCode;
}

export interface BatchEmailRequest {
  emails: EmailRequest[];
  options?: {
    parallel?: boolean;
    maxConcurrent?: number;
    skipDuplicates?: boolean;
    webhook_url?: string;
  };
}

export interface BatchEmailResponse {
  success: boolean;
  data: EmailResponse[];
  summary: {
    total: number;
    succeeded: number;
    failed: number;
    skipped: number;
    processing_time_ms: number;
  };
  errors?: string[];
}

export interface WebhookPayload {
  event: 'email.processed' | 'batch.completed' | 'error';
  timestamp: string;
  data: any;
  metadata: {
    service: string;
    version: string;
    environment: string;
  };
}

// ============================================================
// TYPES D'ÉNUMÉRATION
// ============================================================

export type EmailCategory = 
  | 'support'
  | 'commercial'
  | 'project'
  | 'information'
  | 'newsletter'
  | 'spam'
  | 'urgent'
  | 'general'
  | 'technical'
  | 'billing';

export type EmailPriority = 'low' | 'normal' | 'high' | 'urgent';

export type EmailTone = 'professional' | 'friendly' | 'technical' | 'concise' | 'formal';

export type AgentType = 'HUMAN' | 'SUPPORT' | 'COMMERCIAL' | 'PROJET' | 'AUTO';

export type ErrorCode = 
  | 'VALIDATION_ERROR'
  | 'DUPLICATE'
  | 'GENERATION_ERROR'
  | 'STORAGE_ERROR'
  | 'RATE_LIMIT'
  | 'API_ERROR'
  | 'PROCESS_ERROR'
  | 'BATCH_ERROR'
  | 'CONFIG_ERROR';

// ============================================================
// TYPES DE DONNÉES
// ============================================================

export interface Attachment {
  filename: string;
  contentType: string;
  size: number;
  url?: string;
  content?: string; // Base64 encoded
}

export interface ResponseMetadata {
  word_count: number;
  reading_time: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence_score?: number;
  processing_time_ms?: number;
  model_used?: string;
  tokens_used?: number;
}

export interface CompanyMention {
  name: string;
  context: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
}

// ============================================================
// CONFIGURATION
// ============================================================

export interface HarveyV2Config {
  // Paramètres de base
  maxEmailsPerRun: number;
  minConfidence: number;
  requireHumanReview: boolean;
  defaultTone: EmailTone;
  temperature: number;
  maxTokens: number;
  
  // Paramètres commerciaux
  enableAutoReply: boolean;
  enableClassification: boolean;
  enableSentimentAnalysis: boolean;
  enableSpamDetection: boolean;
  enableWebhooks: boolean;
  maxRetries: number;
  timeout: number;
  
  // Paramètres de sécurité
  rateLimitPerMinute: number;
  maxBatchSize: number;
  requireApiKey: boolean;
  
  // Paramètres de personnalisation
  companyName: string;
  companyDescription: string;
  signature: string;
  responseLanguage: 'fr' | 'en' | 'auto';
  brandingEnabled: boolean;
  logoUrl?: string;
  websiteUrl?: string;
  contactUrl?: string;
  
  // Paramètres avancés
  cacheEnabled: boolean;
  cacheTTL: number;
  debugMode: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

// ============================================================
// DONNÉES ENTREPRISE
// ============================================================

export interface CompanyData {
  id?: string;
  name: string;
  description: string;
  services: Service[];
  projects: Project[];
  team: TeamMember[];
  pricing: PricingInfo;
  faq: FAQItem[];
  socialLinks?: SocialLinks;
  contactInfo?: ContactInfo;
}

export interface Service {
  id?: string;
  name: string;
  description: string;
  features: string[];
  icon?: string;
  price?: string;
  isActive?: boolean;
}

export interface Project {
  id?: string;
  name: string;
  slug: string;
  description: string;
  status: 'planning' | 'development' | 'testing' | 'deployed' | 'maintenance';
  progress: number;
  images?: string[];
  technologies?: string[];
  client?: string;
  startDate?: string;
  endDate?: string;
}

export interface TeamMember {
  id?: string;
  name: string;
  role: string;
  email?: string;
  avatar?: string;
  specialties?: string[];
}

// ✅ CORRIGÉ - Ajout de 'details'
export interface PricingInfo {
  base: string;
  consultation: string;
  details: string;         
  plans?: PricingPlan[];
  currency?: string;
  startingPrice?: string;
  features?: string[];
}

export interface PricingPlan {
  name: string;
  price: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  type?: 'monthly' | 'yearly' | 'one-time';
  priceMonthly?: string;
  priceYearly?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
  category?: string;
}

export interface SocialLinks {
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
}

export interface ContactInfo {
  email: string;
  phone?: string;
  address?: string;
  businessHours?: string;
  mapUrl?: string;
}

// ============================================================
// TYPES DE RÉPONSE INTERNE
// ============================================================

export interface EmailWithAnalysis {
  id: string;
  from_email: string;
  from_name?: string;
  to_email: string | string[];
  subject: string;
  body: string;
  body_html?: string;
  category: string;
  priority: string;
  status: string;
  received_at: string;
  attachments?: Attachment[];
  ai_analysis?: {
    category: string;
    priority: string;
    confidence: number;
    matched_keywords: string[];
    summary: string;
    score: number;
    sentiment?: string;
    sentiment_score?: number;
  };
  project_id?: string;
  client_id?: string;
  metadata?: Record<string, any>;
}

export interface ConversationHistory {
  id: string;
  from_email: string;
  subject: string;
  body: string;
  agent_response: string;
  sent_at: string;
  category: string;
  tone: string;
  confidence: number;
}

export interface EmailClassification {
  category: EmailCategory;
  priority: EmailPriority;
  confidence: number;
  keywords: string[];
  summary: string;
  score: number;
}

export interface SentimentAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  confidence?: number;
}