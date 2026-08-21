// lib/agents/harvey/types.ts
import { AnalysisResult } from '../dona/types';

export type EmailWithAnalysis = {
  id: string;
  from_email: string;
  to_email: string;
  subject: string;
  body: string;
  category: string;
  priority: string;
  assigned_agent: string;
  ai_analysis: AnalysisResult;
  received_at: string;
  status: string;
  project_id?: string;
  project_slug?: string;
  project_name?: string;
  project_description?: string;
  project_progress?: number;
  project_status?: string;
};

export type CompanyData = {
  name: string;
  description: string;
  services: Service[];
  formations: Formation[];
  projects: Project[];
  missions: Mission[];
  pricing: any;
  team: TeamMember[];
  faq: FAQ[];
};

export type Service = {
  name: string;
  description: string;
  features?: string[];
};

export type Formation = {
  name: string;
  duration: string;
  level: string;
  technologies: string[];
};

export type Project = {
  name: string;
  status: string;
  progress: number;
  description: string;
  slug?: string;
};

export type Mission = {
  title: string;
  description: string;
};

export type TeamMember = {
  name: string;
  role: string;
  email?: string;
};

export type FAQ = {
  question: string;
  answer: string;
  keyword?: string;
};

export type ConversationHistory = {
  id: string;
  from_email: string;
  subject: string;
  body: string;
  agent_response: string;
  sent_at: string;
  category: string;
  tone?: string;
  confidence?: number;
};

export type HarveyResponse = {
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
};

// ✅ Nouveaux types pour les réponses
export type HarveyResponseType = 'html' | 'json' | 'both';

export interface HarveyResponseConfig {
  responseType: HarveyResponseType;
  includeHtml: boolean;
  includeJson: boolean;
  htmlTemplate?: string;
}

export type HarveyConfig = {
  maxEmailsPerRun: number;
  minConfidence: number;
  requireHumanReview: boolean;
  defaultTone: 'professional' | 'friendly' | 'technical' | 'concise';
  temperature: number;
  maxTokens: number;
  providerPriority?: string[];
  responseType?: HarveyResponseType;
  includeHtml?: boolean;
  includeJson?: boolean;
};