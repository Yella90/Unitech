// types/supabase.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          role: 'super_admin' | 'admin' | 'project_manager' | 'team_lead' | 'developer' | 'designer' | 'client' | 'viewer' | 'collaborator' | 'associate';
          avatar: string | null;
          phone: string | null;
          department: string | null;
          skills: string[] | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          role?: 'super_admin' | 'admin' | 'project_manager' | 'team_lead' | 'developer' | 'designer' | 'client' | 'viewer' | 'collaborator' | 'associate';
          avatar?: string | null;
          phone?: string | null;
          department?: string | null;
          skills?: string[] | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          role?: 'super_admin' | 'admin' | 'project_manager' | 'team_lead' | 'developer' | 'designer' | 'client' | 'viewer' | 'collaborator' | 'associate';
          avatar?: string | null;
          phone?: string | null;
          department?: string | null;
          skills?: string[] | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          icon: string | null;
          color: 'blue' | 'orange' | 'green' | null;
          progress: number | null;
          status: 'planning' | 'in-progress' | 'testing' | 'pending' | 'completed' | 'on-hold' | null;
          next_milestone: string | null;
          problem: string | null;
          solution: string | null;
          benefits: string[] | null;
          tech_stack: Json | null;
          gallery: Json[] | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          color?: 'blue' | 'orange' | 'green' | null;
          progress?: number | null;
          status?: 'planning' | 'in-progress' | 'testing' | 'pending' | 'completed' | 'on-hold' | null;
          next_milestone?: string | null;
          problem?: string | null;
          solution?: string | null;
          benefits?: string[] | null;
          tech_stack?: Json | null;
          gallery?: Json[] | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          icon?: string | null;
          color?: 'blue' | 'orange' | 'green' | null;
          progress?: number | null;
          status?: 'planning' | 'in-progress' | 'testing' | 'pending' | 'completed' | 'on-hold' | null;
          next_milestone?: string | null;
          problem?: string | null;
          solution?: string | null;
          benefits?: string[] | null;
          tech_stack?: Json | null;
          gallery?: Json[] | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      project_stages: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          progress: number | null;
          status: 'completed' | 'in-progress' | 'pending' | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          progress?: number | null;
          status?: 'completed' | 'in-progress' | 'pending' | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          progress?: number | null;
          status?: 'completed' | 'in-progress' | 'pending' | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      trainings: {
        Row: {
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
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          description?: string | null;
          icon?: string | null;
          duration?: string | null;
          level?: string | null;
          schedule?: string | null;
          price?: string | null;
          modules?: string[] | null;
          color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          description?: string | null;
          icon?: string | null;
          duration?: string | null;
          level?: string | null;
          schedule?: string | null;
          price?: string | null;
          modules?: string[] | null;
          color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      newsletter_subscribers: {
        Row: {
          id: string;
          email: string;
          interested_in: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          interested_in?: string[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          interested_in?: string[] | null;
          created_at?: string;
        };
      };
      project_members: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          role: 'manager' | 'developer' | 'designer' | 'viewer' | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          role?: 'manager' | 'developer' | 'designer' | 'viewer' | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          role?: 'manager' | 'developer' | 'designer' | 'viewer' | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
