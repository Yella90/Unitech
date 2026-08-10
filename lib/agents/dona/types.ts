// lib/agents/dona/types.ts

export type KeywordConfig = {
  id: string;
  category: string;
  keywords: string[];
  priority: number;
  is_active: boolean;
};

export type AnalysisResult = {
  category: 'support' | 'commercial' | 'project' | 'newsletter' | 'information' | 'spam' | 'other';
  priority: 'high' | 'medium' | 'low';
  assigned_agent: string;
  confidence: number;
  matched_keywords: string[];
  summary: string;
  score: number;
};

export type EmailData = {
  id?: string;
  from: string;
  to: string;
  subject: string;
  body: string;
};

export type ContactData = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
};

export type ProcessEmailResult = {
  action: 'stored' | 'ignored' | 'newsletter' | 'error';
  reason?: string;
  email_id?: string;
  analysis?: AnalysisResult;
  error?: Error;
};

export type ProcessContactResult = {
  action: 'updated' | 'error';
  analysis?: AnalysisResult;
  error?: Error;
};

export type DonaConfig = {
  maxEmailsPerRun: number;
  defaultCategories: KeywordConfig[];
};