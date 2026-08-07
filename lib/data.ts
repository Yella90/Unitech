// lib/data.ts
import { Project, ProjectStage } from '@/types';

// ✅ Fonctions pour générer des données
const generateId = () => Math.random().toString(36).substring(2, 15);
const now = new Date().toISOString();

// ✅ Helper pour créer des stages
const createStage = (name: string, progress: number, status: 'completed' | 'in-progress' | 'pending'): ProjectStage => ({
  id: generateId(),
  project_id: '',
  name,
  progress,
  status,
  created_at: now,
  updated_at: now,
});

export const projects: Project[] = [
  {
    id: '1',
    slug: 'school-saas',
    name: 'SaaS Gestion Scolaire',
    description: 'Solution complète de gestion des établissements scolaires (élèves, notes, paiements, statistiques)',
    icon: '🏫',
    color: 'blue',
    progress: 68,
    status: 'in-progress',
    next_milestone: 'Beta interne - Septembre 2026',
    problem: 'Les établissements scolaires peinent à gérer efficacement leurs données. Les inscriptions sont manuelles, les notes se perdent, les paiements sont difficiles à suivre.',
    solution: 'UNITECH Éducation est un SaaS complet qui digitalise toute la gestion scolaire. De l\'inscription des élèves à la génération des bulletins.',
    benefits: [
      'Réduction de 60% du temps administratif',
      'Décisions basées sur des données réelles',
      'Réduction des pertes financières',
      'Accès depuis n\'importe quel appareil'
    ],
    tech_stack: {
      frontend: ['React.js', 'Tailwind CSS', 'Chart.js'],
      backend: ['Node.js', 'Express.js'],
      database: ['PostgreSQL'],
      others: ['Orange Money API']
    },
    created_at: now,
    updated_at: now,
    stages: [
      createStage('Étude de marché', 100, 'completed'),
      createStage('Maquettage UI', 100, 'completed'),
      createStage('Développement Core', 80, 'in-progress'),
      createStage('Intégration API', 60, 'in-progress'),
      createStage('Phase de test', 40, 'pending'),
      createStage('Déploiement Beta', 20, 'pending'),
      createStage('Lancement officiel', 10, 'pending'),
    ],
  },
  {
    id: '2',
    slug: 'shop-saas',
    name: 'SaaS Gestion Boutique',
    description: 'Plateforme de gestion pour commerçants locaux (stock, ventes, clients, facturation)',
    icon: '🛍️',
    color: 'orange',
    progress: 42,
    status: 'planning',
    next_milestone: 'Prototype fonctionnel - Novembre 2026',
    problem: 'Les petits commerçants locaux gèrent leurs activités de manière manuelle. Pas de suivi des stocks, pas de fichier clients.',
    solution: 'UNITECH Commerce propose un système de gestion complet : suivi des stocks en temps réel, historique des ventes.',
    benefits: [
      'Réduction des pertes de stock',
      'Augmentation du chiffre d\'affaires',
      'Gain de temps quotidien',
      'Utilisable sur smartphone'
    ],
    tech_stack: {
      frontend: ['React Native', 'React.js'],
      backend: ['Node.js', 'Express.js'],
      database: ['PostgreSQL'],
      others: ['Mobile Money API', 'QR Code']
    },
    created_at: now,
    updated_at: now,
    stages: [
      createStage('Étude de marché', 100, 'completed'),
      createStage('Maquettage UI', 70, 'in-progress'),
      createStage('Développement Backend', 35, 'pending'),
      createStage('Développement Mobile', 15, 'pending'),
      createStage('Phase de test', 10, 'pending'),
      createStage('Lancement officiel', 5, 'pending'),
    ],
  },
  {
    id: '3',
    slug: 'energy-domotic',
    name: 'Système Domotique Énergétique',
    description: 'Suivi et gestion de la consommation énergétique avec panneaux solaires, IA et facturation automatique',
    icon: '⚡',
    color: 'green',
    progress: 55,
    status: 'in-progress',
    next_milestone: 'Test terrain - Octobre 2026',
    problem: 'Les propriétaires de bâtiments avec locataires n\'ont pas de visibilité sur la consommation individuelle.',
    solution: 'Un système complet avec des capteurs intelligents, une IA qui optimise la distribution d\'énergie.',
    benefits: [
      'Visibilité totale sur la consommation',
      'Facturation juste et automatisée',
      'Optimisation de l\'énergie solaire',
      'Économies d\'énergie jusqu\'à 30%'
    ],
    tech_stack: {
      frontend: ['React.js', 'Chart.js', 'WebSockets'],
      backend: ['Node.js', 'Python', 'TensorFlow'],
      database: ['PostgreSQL', 'InfluxDB'],
      others: ['MQTT', 'ESP32', 'LoRa']
    },
    created_at: now,
    updated_at: now,
    stages: [
      createStage('Étude de faisabilité', 100, 'completed'),
      createStage('Sélection des capteurs', 100, 'completed'),
      createStage('Prototype hardware', 75, 'in-progress'),
      createStage('Développement IA', 55, 'in-progress'),
      createStage('Dashboard', 40, 'pending'),
      createStage('Test terrain', 25, 'pending'),
      createStage('Déploiement réel', 10, 'pending'),
    ],
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

export function getAllProjects(): Project[] {
  return projects;
}

export function getRelatedProjects(currentSlug: string, limit: number = 2): Project[] {
  return projects.filter((project) => project.slug !== currentSlug).slice(0, limit);
}