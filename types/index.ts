// types/index.ts

// types/index.ts
export interface Project {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: 'blue' | 'orange' | 'green';
  progress: number;
  status: 'planning' | 'in-progress' | 'testing' | 'pending' | 'completed' | 'on-hold';
  next_milestone: string;
  problem?: string;
  solution?: string;
  benefits?: string[];
  tech_stack?: any;
  gallery?: string[]; // ✅ Ajout du champ gallery
  stages?: ProjectStage[];
  created_at: string;
  updated_at: string;
}
export interface ProjectStage {
  id: string;
  project_id: string;
  name: string;
  progress: number;
  status: 'completed' | 'in-progress' | 'pending';
  created_at: string;
  updated_at: string;
}
export interface NewsletterSubscriber {
  email: string;
  interestedIn?: string[];
}