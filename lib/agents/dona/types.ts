// lib/agents/dona/types.ts

// ============================================================
// CONFIGURATION DES MOTS-CLÉS
// ============================================================
export type KeywordConfig = {
  id: string;
  category: string;
  keywords: string[];
  priority: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

// ============================================================
// RÉSULTAT DE L'ANALYSE
// ============================================================
export type AnalysisResult = {
  category: 'support' | 'commercial' | 'project' | 'newsletter' | 'information' | 'spam' | 'other'| 'general';
  priority: 'high' | 'medium' | 'low';
  assigned_agent: string;
  confidence: number;
  matched_keywords: string[];
  summary: string;
  score: number;
  analyzed_at?: string;
};

// ============================================================
// DONNÉES D'EMAIL
// ============================================================
export type EmailData = {
  id?: string;
  from: string;
  to?: string;
  subject: string;
  body: string;
  received_at?: string;
  created_at?: string;
  status?: string;
  category?: string;
};

// ============================================================
// DONNÉES DE CONTACT
// ============================================================
export type ContactData = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status?: string;
  category?: string;
  created_at?: string;
};

// ============================================================
// RÉSULTAT DE TRAITEMENT D'EMAIL
// ============================================================
export type ProcessEmailResult = {
  action: 'stored' | 'ignored' | 'newsletter' | 'duplicate' | 'error';
  reason?: string;
  email_id?: string;
  analysis?: AnalysisResult;
  error?: Error;
  metadata?: {
    processed_at?: string;
    duration?: number;
  };
};

// ============================================================
// RÉSULTAT DE TRAITEMENT DE CONTACT
// ============================================================
export type ProcessContactResult = {
  action: 'updated' | 'ignored' | 'duplicate' | 'error';
  reason?: string;
  contact_id?: string;
  analysis?: AnalysisResult;
  error?: Error;
  metadata?: {
    processed_at?: string;
    duration?: number;
  };
};

// ============================================================
// CONFIGURATION DE DONA
// ============================================================
export type DonaConfig = {
  maxEmailsPerRun: number;
  defaultCategories: KeywordConfig[];
  minConfidence?: number;
  enableDeduplication?: boolean;
  enableNewsletterAutoSubscribe?: boolean;
  debug?: boolean;
};

// ============================================================
// STATUT DE DONA
// ============================================================
export type DonaStatus = {
  initialized: boolean;
  processedEmails: number;
  keywordConfigs: number;
  pendingEmails: number;
  config: DonaConfig;
  lastRun?: Date;
  totalProcessed?: number;
};

// ============================================================
// OPTIONS DE TRAITEMENT
// ============================================================
export type ProcessOptions = {
  force?: boolean;
  skipDeduplication?: boolean;
  skipNewsletter?: boolean;
  customCategories?: KeywordConfig[];
  maxEmails?: number;
  maxContacts?: number;
};

// ============================================================
// RÉSULTAT DE TRAITEMENT EN LOT
// ============================================================
export type BatchProcessResult = {
  processed: number;
  ignored: number;
  errors: string[];
  total: number;
  duration: number;
  details?: {
    emails?: ProcessEmailResult[];
    contacts?: ProcessContactResult[];
  };
};

// ============================================================
// RÉSULTAT DE NETTOYAGE
// ============================================================
export type CleanupResult = {
  cleaned: number;
  errors: string[];
  duplicates: Array<{
    key: string;
    count: number;
    kept: string;
    removed: string[];
  }>;
};

// ============================================================
// ÉVÉNEMENTS DE DONA
// ============================================================
export type DonaEvent = {
  type: 'analysis' | 'processed' | 'ignored' | 'error' | 'duplicate';
  timestamp: string;
  data: {
    id?: string;
    email?: string;
    category?: string;
    confidence?: number;
    error?: string;
    reason?: string;
  };
};

// ============================================================
// INTERFACE DE DONA
// ============================================================
export interface IDona {
  init(): Promise<void>;
  analyze(input: { from?: string; subject?: string; body: string; source: 'email' | 'contact' }): Promise<AnalysisResult>;
  processEmail(emailData: EmailData): Promise<ProcessEmailResult>;
  processContact(contactData: ContactData): Promise<ProcessContactResult>;
  processBatch(options?: ProcessOptions): Promise<BatchProcessResult>;
  cleanupDuplicates(): Promise<CleanupResult>;
  refreshCache(): Promise<void>;
  getStatus(): DonaStatus;
  updateConfig(config: Partial<DonaConfig>): void;
}

// ============================================================
// TYPES POUR LES CATÉGORIES PRÉDÉFINIES
// ============================================================
export type CategoryType = 'support' | 'commercial' | 'project' | 'newsletter' | 'information' | 'spam' | 'other';

export const CategoryLabels: Record<CategoryType, string> = {
  support: 'Support',
  commercial: 'Commercial',
  project: 'Projet',
  newsletter: 'Newsletter',
  information: 'Information',
  spam: 'Spam',
  other: 'Autre',
};

export const CategoryColors: Record<CategoryType, string> = {
  support: 'bg-blue-100 text-blue-700 border-blue-200',
  commercial: 'bg-orange-100 text-orange-700 border-orange-200',
  project: 'bg-purple-100 text-purple-700 border-purple-200',
  newsletter: 'bg-green-100 text-green-700 border-green-200',
  information: 'bg-gray-100 text-gray-700 border-gray-200',
  spam: 'bg-red-100 text-red-700 border-red-200',
  other: 'bg-slate-100 text-slate-700 border-slate-200',
};

export const CategoryIcons: Record<CategoryType, string> = {
  support: '🛠️',
  commercial: '💰',
  project: '🚀',
  newsletter: '📬',
  information: 'ℹ️',
  spam: '🚫',
  other: '📌',
  
};

// ============================================================
// AGENTS
// ============================================================
export type AgentType = 'SUPPORT' | 'COMMERCIAL' | 'PROJET' | 'NEWSLETTER' | 'HUMAN' | 'NONE';

export const AgentLabels: Record<AgentType, string> = {
  SUPPORT: 'Support',
  COMMERCIAL: 'Commercial',
  PROJET: 'Projet',
  NEWSLETTER: 'Newsletter',
  HUMAN: 'Humain',
  NONE: 'Aucun',
};

export const AgentColors: Record<AgentType, string> = {
  SUPPORT: 'bg-blue-100 text-blue-700',
  COMMERCIAL: 'bg-orange-100 text-orange-700',
  PROJET: 'bg-purple-100 text-purple-700',
  NEWSLETTER: 'bg-green-100 text-green-700',
  HUMAN: 'bg-emerald-100 text-emerald-700',
  NONE: 'bg-gray-100 text-gray-700',
};

// ============================================================
// PRIORITÉS
// ============================================================
export type PriorityType = 'high' | 'medium' | 'low';

export const PriorityLabels: Record<PriorityType, string> = {
  high: 'Élevée',
  medium: 'Moyenne',
  low: 'Basse',
};

export const PriorityColors: Record<PriorityType, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};