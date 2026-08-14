// lib/email/templates/types.ts

export type EmailTemplateData = {
  company_name: string;
  user_name: string;
  user_email: string;
  subject: string;
  message: string;
  category: string;
  signature: string;
  logo_url?: string;
  project_images?: string[];
  project_name?: string;
  project_slug?: string;
  project_description?: string;
  project_progress?: number;
  project_status?: string;
  links?: {
    website: string;
    contact: string;
    projects: string;
  };
};