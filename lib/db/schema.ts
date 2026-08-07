// lib/db/schema.ts
/**
 * ============================================
 * SCHEMA COMPLET DE LA BASE DE DONNÉES UNITECH
 * ============================================
 * Ce fichier contient la définition de toutes
 * les tables, leurs relations et des exemples
 * de données pour Supabase.
 */

// ============================================
// 1. TABLE : USERS (Utilisateurs)
// ============================================
export const usersTable = {
  name: 'users',
  definition: `
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      first_name TEXT,
      last_name TEXT,
      role TEXT DEFAULT 'viewer' CHECK (role IN ('super_admin', 'admin', 'project_manager', 'team_lead', 'developer', 'designer', 'client', 'viewer')),
      avatar TEXT,
      phone TEXT,
      department TEXT,
      skills TEXT[],
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,
  description: 'Utilisateurs du système avec rôles et permissions',
  sampleData: [
    {
      email: 'admin@unitech.com',
      first_name: 'Admin',
      last_name: 'UNITECH',
      role: 'super_admin',
      is_active: true
    },
    {
      email: 'manager@unitech.com',
      first_name: 'Chef',
      last_name: 'Projet',
      role: 'project_manager',
      is_active: true
    },
    {
      email: 'dev@unitech.com',
      first_name: 'Développeur',
      last_name: 'Dev',
      role: 'developer',
      is_active: true
    }
  ]
};

// ============================================
// 2. TABLE : PROJECTS (Projets)
// ============================================
export const projectsTable = {
  name: 'projects',
  definition: `
    CREATE TABLE IF NOT EXISTS projects (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      color TEXT CHECK (color IN ('blue', 'orange', 'green')),
      progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
      status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'in-progress', 'testing', 'pending', 'completed', 'on-hold')),
      next_milestone TEXT,
      problem TEXT,
      solution TEXT,
      benefits TEXT[],
      tech_stack JSONB,
      gallery JSONB[],
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,
  description: 'Projets de l\'entreprise avec suivi de progression',
  sampleData: [
    {
      slug: 'school-saas',
      name: 'SaaS Gestion Scolaire',
      description: 'Solution complète de gestion des établissements scolaires',
      icon: '🏫',
      color: 'blue',
      progress: 68,
      status: 'in-progress',
      next_milestone: 'Beta interne - Septembre 2026'
    },
    {
      slug: 'shop-saas',
      name: 'SaaS Gestion Boutique',
      description: 'Plateforme de gestion pour commerçants locaux',
      icon: '🛍️',
      color: 'orange',
      progress: 42,
      status: 'planning',
      next_milestone: 'Prototype fonctionnel - Novembre 2026'
    },
    {
      slug: 'energy-domotic',
      name: 'Système Domotique Énergétique',
      description: 'Suivi et gestion de la consommation énergétique avec panneaux solaires',
      icon: '⚡',
      color: 'green',
      progress: 55,
      status: 'in-progress',
      next_milestone: 'Test terrain - Octobre 2026'
    }
  ]
};

// ============================================
// 3. TABLE : PROJECT_STAGES (Étapes des projets)
// ============================================
export const projectStagesTable = {
  name: 'project_stages',
  definition: `
    CREATE TABLE IF NOT EXISTS project_stages (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
      status TEXT DEFAULT 'pending' CHECK (status IN ('completed', 'in-progress', 'pending')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,
  description: 'Étapes de progression pour chaque projet',
  sampleData: [
    { name: 'Étude de marché', progress: 100, status: 'completed' },
    { name: 'Maquettage UI', progress: 100, status: 'completed' },
    { name: 'Développement Core', progress: 80, status: 'in-progress' },
    { name: 'Intégration API', progress: 60, status: 'in-progress' },
    { name: 'Phase de test', progress: 40, status: 'pending' },
    { name: 'Déploiement Beta', progress: 20, status: 'pending' },
    { name: 'Lancement officiel', progress: 10, status: 'pending' }
  ]
};

// ============================================
// 4. TABLE : TRAININGS (Formations)
// ============================================
export const trainingsTable = {
  name: 'trainings',
  definition: `
    CREATE TABLE IF NOT EXISTS trainings (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      duration TEXT,
      level TEXT,
      schedule TEXT,
      price TEXT,
      modules TEXT[],
      color TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,
  description: 'Programmes de formation',
  sampleData: [
    {
      slug: 'dev-web',
      title: 'Développement Web & Mobile',
      description: 'Formation complète au développement d\'applications web et mobiles',
      icon: '💻',
      duration: '6 mois',
      level: 'Débutant à Avancé',
      schedule: 'Lundi, Mercredi, Vendredi - 18h à 21h',
      price: '250 000 FCFA',
      modules: ['HTML/CSS/JS', 'React/Next.js', 'Node.js', 'PostgreSQL', 'DevOps'],
      color: 'blue'
    },
    {
      slug: 'electronique',
      title: 'Électronique & Mécatronique',
      description: 'Initiation à l\'électronique et aux systèmes mécatroniques',
      icon: '🔌',
      duration: '4 mois',
      level: 'Débutant',
      schedule: 'Mardi, Jeudi - 18h à 21h',
      price: '200 000 FCFA',
      modules: ['Bases électronique', 'PCB Design', 'Arduino', 'Moteurs', 'Systèmes embarqués'],
      color: 'orange'
    }
  ]
};

// ============================================
// 5. TABLE : NEWSLETTER_SUBSCRIBERS (Abonnés)
// ============================================
export const newsletterSubscribersTable = {
  name: 'newsletter_subscribers',
  definition: `
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      interested_in TEXT[],
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,
  description: 'Abonnés à la newsletter',
  sampleData: [
    { email: 'client1@example.com', interested_in: ['school-saas'] },
    { email: 'client2@example.com', interested_in: ['shop-saas'] },
    { email: 'client3@example.com', interested_in: ['energy-domotic'] }
  ]
};

// ============================================
// 6. TABLE : PROJECT_MEMBERS (Membres des projets)
// ============================================
export const projectMembersTable = {
  name: 'project_members',
  definition: `
    CREATE TABLE IF NOT EXISTS project_members (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT DEFAULT 'viewer' CHECK (role IN ('manager', 'developer', 'designer', 'viewer')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(project_id, user_id)
    );
  `,
  description: 'Membres assignés aux projets'
};

// ============================================
// 7. TABLE : TASKS (Tâches)
// ============================================
export const tasksTable = {
  name: 'tasks',
  definition: `
    CREATE TABLE IF NOT EXISTS tasks (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
      assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
      assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
      status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'review', 'done')),
      priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
      estimated_hours INTEGER,
      actual_hours INTEGER DEFAULT 0,
      due_date TIMESTAMP WITH TIME ZONE,
      completed_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,
  description: 'Tâches des projets'
};

// ============================================
// 8. TABLE : FINANCES (Finances)
// ============================================
export const financesTable = {
  name: 'finances',
  definition: `
    CREATE TABLE IF NOT EXISTS finances (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'investment', 'capital')),
      category TEXT,
      sub_category TEXT,
      amount NUMERIC(15,2) NOT NULL,
      currency TEXT DEFAULT 'XOF',
      description TEXT,
      date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
      receipt JSONB,
      notes TEXT,
      tags TEXT[],
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,
  description: 'Gestion financière'
};

// ============================================
// 9. TABLE : COLLABORATIONS (Collaborations)
// ============================================
export const collaborationsTable = {
  name: 'collaborations',
  definition: `
    CREATE TABLE IF NOT EXISTS collaborations (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT CHECK (type IN ('partner', 'association', 'supplier', 'consultant', 'investor')),
      contact JSONB,
      projects UUID[],
      status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'inactive', 'ended')),
      agreement JSONB,
      contributions JSONB[],
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,
  description: 'Partenaires et collaborateurs'
};

// ============================================
// 10. TABLE : AI_DECISIONS (Décisions IA)
// ============================================
export const aiDecisionsTable = {
  name: 'ai_decisions',
  definition: `
    CREATE TABLE IF NOT EXISTS ai_decisions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      client_id UUID,
      decision_type TEXT,
      description TEXT,
      confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'auto-applied')),
      suggestions JSONB,
      applied_at TIMESTAMP WITH TIME ZONE,
      confirmed_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,
  description: 'Décisions de l\'agent IA'
};

// ============================================
// 11. TABLE : ACCESS_TOKENS (Tokens d'accès)
// ============================================
export const accessTokensTable = {
  name: 'access_tokens',
  definition: `
    CREATE TABLE IF NOT EXISTS access_tokens (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      token TEXT UNIQUE NOT NULL,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,
  description: 'Tokens d\'accès pour l\'administration'
};

// ============================================
// EXPORT DE TOUTES LES TABLES
// ============================================
export const allTables = {
  users: usersTable,
  projects: projectsTable,
  project_stages: projectStagesTable,
  trainings: trainingsTable,
  newsletter_subscribers: newsletterSubscribersTable,
  project_members: projectMembersTable,
  tasks: tasksTable,
  finances: financesTable,
  collaborations: collaborationsTable,
  ai_decisions: aiDecisionsTable,
  access_tokens: accessTokensTable,
};

// ============================================
// GÉNÉRATION DU SCRIPT SQL COMPLET
// ============================================
export function generateSQLScript(): string {
  const tables = Object.values(allTables);
  let sql = '';
  
  // Activation des extensions
  sql += `-- ============================================\n`;
  sql += `-- ACTIVATION DES EXTENSIONS\n`;
  sql += `-- ============================================\n`;
  sql += `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n`;
  sql += `CREATE EXTENSION IF NOT EXISTS "pgcrypto";\n`;
  sql += `CREATE EXTENSION IF NOT EXISTS "moddatetime";\n\n`;
  
  // Création des tables
  for (const table of tables) {
    sql += `-- ============================================\n`;
    sql += `-- TABLE : ${table.name.toUpperCase()}\n`;
    sql += `-- ${table.description}\n`;
    sql += `-- ============================================\n`;
    sql += table.definition;
    sql += `\n`;
  }
  
  // Index
  sql += `-- ============================================\n`;
  sql += `-- INDEX POUR PERFORMANCES\n`;
  sql += `-- ============================================\n`;
  sql += `CREATE INDEX idx_projects_slug ON projects(slug);\n`;
  sql += `CREATE INDEX idx_project_stages_project_id ON project_stages(project_id);\n`;
  sql += `CREATE INDEX idx_newsletter_email ON newsletter_subscribers(email);\n`;
  sql += `CREATE INDEX idx_project_members_project_id ON project_members(project_id);\n`;
  sql += `CREATE INDEX idx_project_members_user_id ON project_members(user_id);\n`;
  sql += `CREATE INDEX idx_tasks_project_id ON tasks(project_id);\n`;
  sql += `CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);\n`;
  sql += `CREATE INDEX idx_finances_type ON finances(type);\n`;
  
  return sql;
}

// ============================================
// TYPES TYPESCRIPT POUR SUPABASE
// ============================================
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
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
        };
        Insert: {
          id?: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          role?: 'super_admin' | 'admin' | 'project_manager' | 'team_lead' | 'developer' | 'designer' | 'client' | 'viewer';
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
          role?: 'super_admin' | 'admin' | 'project_manager' | 'team_lead' | 'developer' | 'designer' | 'client' | 'viewer';
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
          tech_stack: any;
          gallery: any[] | null;
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
          tech_stack?: any;
          gallery?: any[] | null;
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
          tech_stack?: any;
          gallery?: any[] | null;
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
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          project_id: string | null;
          assigned_to: string | null;
          assigned_by: string | null;
          status: 'todo' | 'in-progress' | 'review' | 'done' | null;
          priority: 'low' | 'medium' | 'high' | 'critical' | null;
          estimated_hours: number | null;
          actual_hours: number | null;
          due_date: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          project_id?: string | null;
          assigned_to?: string | null;
          assigned_by?: string | null;
          status?: 'todo' | 'in-progress' | 'review' | 'done' | null;
          priority?: 'low' | 'medium' | 'high' | 'critical' | null;
          estimated_hours?: number | null;
          actual_hours?: number | null;
          due_date?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          project_id?: string | null;
          assigned_to?: string | null;
          assigned_by?: string | null;
          status?: 'todo' | 'in-progress' | 'review' | 'done' | null;
          priority?: 'low' | 'medium' | 'high' | 'critical' | null;
          estimated_hours?: number | null;
          actual_hours?: number | null;
          due_date?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      finances: {
        Row: {
          id: string;
          type: 'income' | 'expense' | 'investment' | 'capital';
          category: string | null;
          sub_category: string | null;
          amount: number;
          currency: string;
          description: string | null;
          date: string;
          project_id: string | null;
          user_id: string | null;
          status: 'pending' | 'confirmed' | 'rejected' | null;
          receipt: any | null;
          notes: string | null;
          tags: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: 'income' | 'expense' | 'investment' | 'capital';
          category?: string | null;
          sub_category?: string | null;
          amount: number;
          currency?: string;
          description?: string | null;
          date?: string;
          project_id?: string | null;
          user_id?: string | null;
          status?: 'pending' | 'confirmed' | 'rejected' | null;
          receipt?: any | null;
          notes?: string | null;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: 'income' | 'expense' | 'investment' | 'capital';
          category?: string | null;
          sub_category?: string | null;
          amount?: number;
          currency?: string;
          description?: string | null;
          date?: string;
          project_id?: string | null;
          user_id?: string | null;
          status?: 'pending' | 'confirmed' | 'rejected' | null;
          receipt?: any | null;
          notes?: string | null;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      collaborations: {
        Row: {
          id: string;
          name: string;
          type: 'partner' | 'association' | 'supplier' | 'consultant' | 'investor' | null;
          contact: any | null;
          projects: string[] | null;
          status: 'active' | 'pending' | 'inactive' | 'ended' | null;
          agreement: any | null;
          contributions: any[] | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type?: 'partner' | 'association' | 'supplier' | 'consultant' | 'investor' | null;
          contact?: any | null;
          projects?: string[] | null;
          status?: 'active' | 'pending' | 'inactive' | 'ended' | null;
          agreement?: any | null;
          contributions?: any[] | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: 'partner' | 'association' | 'supplier' | 'consultant' | 'investor' | null;
          contact?: any | null;
          projects?: string[] | null;
          status?: 'active' | 'pending' | 'inactive' | 'ended' | null;
          agreement?: any | null;
          contributions?: any[] | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ai_decisions: {
        Row: {
          id: string;
          client_id: string | null;
          decision_type: string | null;
          description: string | null;
          confidence: number | null;
          status: 'pending' | 'confirmed' | 'rejected' | 'auto-applied' | null;
          suggestions: any | null;
          applied_at: string | null;
          confirmed_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          decision_type?: string | null;
          description?: string | null;
          confidence?: number | null;
          status?: 'pending' | 'confirmed' | 'rejected' | 'auto-applied' | null;
          suggestions?: any | null;
          applied_at?: string | null;
          confirmed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string | null;
          decision_type?: string | null;
          description?: string | null;
          confidence?: number | null;
          status?: 'pending' | 'confirmed' | 'rejected' | 'auto-applied' | null;
          suggestions?: any | null;
          applied_at?: string | null;
          confirmed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      access_tokens: {
        Row: {
          id: string;
          token: string;
          user_id: string | null;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          token: string;
          user_id?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          token?: string;
          user_id?: string | null;
          expires_at?: string | null;
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
};