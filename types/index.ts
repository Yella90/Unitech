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
  gallery?: string[];
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  stages?: ProjectStage[];
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

export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: 'super_admin' | 'admin' | 'project_manager' | 'team_lead' | 'developer' | 'designer' | 'client' | 'viewer';
  avatar: string | null;
  phone: string | null;
  department: string | null;
  skills: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Training {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  icon: string | null;
  duration: string | null;
  level: string | null;
  schedule: string | null;
  price: string | null;
  modules: string[] | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}