// lib/agents/harvey/types.ts

import { AnalysisResult } from '../dona/types';

// ============================================================
// EMAIL AVEC ANALYSE
// ============================================================
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
  // ✅ Champs pour les projets
  project_id?: string;
  project_slug?: string;
  project_name?: string;
  project_description?: string;
  project_progress?: number;
  project_status?: string;
};

// ============================================================
// DONNÉES DE L'ENTREPRISE
// ============================================================
export type CompanyData = {
  name: string;
  description: string;
  services: Service[];
  formations: Formation[];
  projects: Project[];
  missions: Mission[];
  pricing: Pricing;
  team: TeamMember[];
  faq: FAQ[];
};

// ============================================================
// SERVICES
// ============================================================
export type Service = {
  name: string;
  description: string;
  features?: string[];
};

// ============================================================
// FORMATIONS
// ============================================================
export type Formation = {
  name: string;
  duration: string;
  level: string;
  technologies: string[];
};

// ============================================================
// PROJETS
// ============================================================
export type Project = {
  name: string;
  status: string;
  progress: number;
  description: string;
  slug?: string;
};

// ============================================================
// MISSIONS
// ============================================================
export type Mission = {
  title: string;
  description: string;
};

// ============================================================
// TARIFS
// ============================================================
export type Pricing = {
  base: string;
  consultation: string;
  details: string;
  [key: string]: string;
};

// ============================================================
// MEMBRES DE L'ÉQUIPE
// ============================================================
export type TeamMember = {
  name: string;
  role: string;
  email?: string;
};

// ============================================================
// FAQ
// ============================================================
export type FAQ = {
  question: string;
  answer: string;
  keyword?: string;
};

// ============================================================
// HISTORIQUE DES CONVERSATIONS
// ============================================================
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

// ============================================================
// RÉPONSE DE HARVEY
// ============================================================
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

// ============================================================
// CONFIGURATION DE HARVEY
// ============================================================
export type HarveyConfig = {
  maxEmailsPerRun: number;
  minConfidence: number;
  requireHumanReview: boolean;
  defaultTone: 'professional' | 'friendly' | 'technical' | 'concise';
  temperature: number;
  maxTokens: number;
  providerPriority?: string[];
};

// ============================================================
// STATUT DE HARVEY
// ============================================================
export type HarveyStatus = {
  initialized: boolean;
  processedEmails: number;
  processedContacts: number;
  knowledgeBase: number;
  templates: number;
  config: HarveyConfig;
  lastRun?: Date;
};