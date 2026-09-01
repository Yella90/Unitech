// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client public
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('SUPABASE_SERVICE_ROLE_KEY existe ?', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log('SUPABASE_URL existe ?', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
// ✅ Client admin - seulement si la clé existe
export const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  : null; // ✅ Retourne null si la clé n'existe pas
/**
 * -- ============================================
-- 1. TABLE users (utilisateurs)
-- ============================================
CREATE TABLE users (
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

-- ============================================
-- 2. TABLE projects (projets)
-- ============================================
CREATE TABLE projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT CHECK (color IN ('blue', 'orange', 'green')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    status TEXT CHECK (status IN ('planning', 'in-progress', 'testing', 'pending', 'completed', 'on-hold')),
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

-- ============================================
-- 3. TABLE project_stages (étapes des projets)
-- ============================================
CREATE TABLE project_stages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    status TEXT CHECK (status IN ('completed', 'in-progress', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. TABLE trainings (formations)
-- ============================================
CREATE TABLE trainings (
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

-- ============================================
-- 5. TABLE newsletter_subscribers (abonnés newsletter)
-- ============================================
CREATE TABLE newsletter_subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    interested_in TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. TABLE project_members (membres des projets)
-- ============================================
CREATE TABLE project_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('manager', 'developer', 'designer', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- ============================================
-- 7. TABLE tasks (tâches)
-- ============================================
CREATE TABLE tasks (
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

-- ============================================
-- 8. TABLE access_tokens (tokens d'accès)
-- ============================================
CREATE TABLE access_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 9. INDEX POUR PERFORMANCES
-- ============================================
CREATE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_project_stages_project_id ON project_stages(project_id);
CREATE INDEX idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_access_tokens_token ON access_tokens(token);

-- ============================================
-- 10. CRÉER L'UTILISATEUR ADMIN
-- ============================================
-- ⚠️ Remplacer 'votre-email@email.com' par votre vrai email
INSERT INTO users (email, first_name, last_name, role, is_active)
VALUES ('votre-email@email.com', 'Admin', 'UNITECH', 'super_admin', true);


-- ============================================
-- 11. INSÉRER LES PROJETS DE DÉMONSTRATION
-- ============================================
INSERT INTO projects (slug, name, description, icon, color, progress, status, next_milestone, problem, solution, benefits, tech_stack) VALUES
(
    'school-saas',
    'SaaS Gestion Scolaire',
    'Solution complète de gestion des établissements scolaires (élèves, notes, paiements, statistiques)',
    '🏫',
    'blue',
    68,
    'in-progress',
    'Beta interne - Septembre 2026',
    'Les établissements scolaires peinent à gérer efficacement leurs données. Les inscriptions sont manuelles, les notes se perdent.',
    'UNITECH Éducation est un SaaS complet qui digitalise toute la gestion scolaire.',
    ARRAY['Réduction de 60% du temps administratif', 'Décisions basées sur des données réelles', 'Accès depuis n''importe quel appareil'],
    '{"frontend": ["React.js", "Tailwind CSS", "Chart.js"], "backend": ["Node.js", "Express.js"], "database": ["PostgreSQL"], "others": ["Orange Money API"]}'
),
(
    'shop-saas',
    'SaaS Gestion Boutique',
    'Plateforme de gestion pour commerçants locaux (stock, ventes, clients, facturation)',
    '🛍️',
    'orange',
    42,
    'planning',
    'Prototype fonctionnel - Novembre 2026',
    'Les petits commerçants locaux gèrent leurs activités de manière manuelle. Pas de suivi des stocks.',
    'UNITECH Commerce propose un système de gestion complet : suivi des stocks en temps réel.',
    ARRAY['Réduction des pertes de stock', 'Augmentation du chiffre d''affaires', 'Gain de temps quotidien'],
    '{"frontend": ["React Native", "React.js"], "backend": ["Node.js", "Express.js"], "database": ["PostgreSQL"], "others": ["Mobile Money API"]}'
),
(
    'energy-domotic',
    'Système Domotique Énergétique',
    'Suivi et gestion de la consommation énergétique avec panneaux solaires, IA et facturation automatique',
    '⚡',
    'green',
    55,
    'in-progress',
    'Test terrain - Octobre 2026',
    'Les propriétaires de bâtiments avec locataires n''ont pas de visibilité sur la consommation individuelle.',
    'Un système complet avec des capteurs intelligents, une IA qui optimise la distribution d''énergie.',
    ARRAY['Visibilité totale sur la consommation', 'Facturation juste et automatisée', 'Économies d''énergie jusqu''à 30%'],
    '{"frontend": ["React.js", "Chart.js", "WebSockets"], "backend": ["Node.js", "Python", "TensorFlow"], "database": ["PostgreSQL", "InfluxDB"], "others": ["MQTT", "ESP32"]}'
);

-- ============================================
-- 12. INSÉRER LES ÉTAPES DES PROJETS
-- ============================================
-- Projet 1: School SaaS
INSERT INTO project_stages (project_id, name, progress, status) VALUES
((SELECT id FROM projects WHERE slug = 'school-saas'), 'Étude de marché', 100, 'completed'),
((SELECT id FROM projects WHERE slug = 'school-saas'), 'Maquettage UI', 100, 'completed'),
((SELECT id FROM projects WHERE slug = 'school-saas'), 'Développement Core', 80, 'in-progress'),
((SELECT id FROM projects WHERE slug = 'school-saas'), 'Intégration API', 60, 'in-progress'),
((SELECT id FROM projects WHERE slug = 'school-saas'), 'Phase de test', 40, 'pending'),
((SELECT id FROM projects WHERE slug = 'school-saas'), 'Déploiement Beta', 20, 'pending'),
((SELECT id FROM projects WHERE slug = 'school-saas'), 'Lancement officiel', 10, 'pending');

-- Projet 2: Shop SaaS
INSERT INTO project_stages (project_id, name, progress, status) VALUES
((SELECT id FROM projects WHERE slug = 'shop-saas'), 'Étude de marché', 100, 'completed'),
((SELECT id FROM projects WHERE slug = 'shop-saas'), 'Maquettage UI', 70, 'in-progress'),
((SELECT id FROM projects WHERE slug = 'shop-saas'), 'Développement Backend', 35, 'pending'),
((SELECT id FROM projects WHERE slug = 'shop-saas'), 'Développement Mobile', 15, 'pending'),
((SELECT id FROM projects WHERE slug = 'shop-saas'), 'Phase de test', 10, 'pending'),
((SELECT id FROM projects WHERE slug = 'shop-saas'), 'Lancement officiel', 5, 'pending');

-- Projet 3: Energy Domotic
INSERT INTO project_stages (project_id, name, progress, status) VALUES
((SELECT id FROM projects WHERE slug = 'energy-domotic'), 'Étude de faisabilité', 100, 'completed'),
((SELECT id FROM projects WHERE slug = 'energy-domotic'), 'Sélection des capteurs', 100, 'completed'),
((SELECT id FROM projects WHERE slug = 'energy-domotic'), 'Prototype hardware', 75, 'in-progress'),
((SELECT id FROM projects WHERE slug = 'energy-domotic'), 'Développement IA', 55, 'in-progress'),
((SELECT id FROM projects WHERE slug = 'energy-domotic'), 'Dashboard', 40, 'pending'),
((SELECT id FROM projects WHERE slug = 'energy-domotic'), 'Test terrain', 25, 'pending'),
((SELECT id FROM projects WHERE slug = 'energy-domotic'), 'Déploiement réel', 10, 'pending');

-- ============================================
-- 13. INSÉRER LES FORMATIONS DE DÉMONSTRATION
-- ============================================
INSERT INTO trainings (slug, title, description, icon, duration, level, schedule, price, modules, color) VALUES
('dev-web', 'Développement Web & Mobile', 'Formation complète au développement d''applications web et mobiles avec les technologies modernes.', '💻', '6 mois', 'Débutant à Avancé', 'Lundi, Mercredi, Vendredi - 18h à 21h', '250 000 FCFA', ARRAY['HTML, CSS, JavaScript', 'React.js & Next.js', 'Node.js & Express', 'Base de données (PostgreSQL)', 'Déploiement & DevOps'], 'blue'),
('electronique', 'Électronique & Mécatronique', 'Initiation à l''électronique, la conception de circuits, et les systèmes mécatroniques.', '🔌', '4 mois', 'Débutant', 'Mardi, Jeudi - 18h à 21h', '200 000 FCFA', ARRAY['Bases de l''électronique', 'Circuit imprimé (PCB)', 'Arduino & capteurs', 'Moteurs et actionneurs', 'Systèmes embarqués'], 'orange'),
('robotique', 'Robotique & Automatisation', 'Conception et programmation de robots, systèmes automatisés et intelligence embarquée.', '🤖', '6 mois', 'Intermédiaire', 'Lundi, Mercredi, Vendredi - 18h à 21h', '300 000 FCFA', ARRAY['Robotique fondamentale', 'Programmation embarquée', 'Capteurs et actionneurs', 'Systèmes automatisés', 'Projet robotique final'], 'green');
 */