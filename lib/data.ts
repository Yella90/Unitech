// lib/data.ts
import { Project } from '@/types';

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
    nextMilestone: 'Beta interne - Septembre 2026',
    problem: 'Les établissements scolaires peinent à gérer efficacement leurs données. Les inscriptions sont manuelles, les notes se perdent, les paiements sont difficiles à suivre.',
    solution: 'UNITECH Éducation est un SaaS complet qui digitalise toute la gestion scolaire. De l\'inscription des élèves à la génération des bulletins, en passant par la gestion des notes, des paiements et des statistiques en temps réel.',
    benefits: [
      'Réduction de 60% du temps administratif',
      'Décisions basées sur des données réelles',
      'Réduction des pertes financières',
      'Accès depuis n\'importe quel appareil'
    ],
    techStack: {
      frontend: ['React.js', 'Tailwind CSS', 'Chart.js'],
      backend: ['Node.js', 'Express.js'],
      database: ['PostgreSQL'],
      others: ['Orange Money API']
    },
    stages: [
      { name: 'Étude de marché', progress: 100, status: 'completed' },
      { name: 'Maquettage UI', progress: 100, status: 'completed' },
      { name: 'Développement Core', progress: 80, status: 'in-progress' },
      { name: 'Intégration API', progress: 60, status: 'in-progress' },
      { name: 'Phase de test', progress: 40, status: 'pending' },
      { name: 'Déploiement Beta', progress: 20, status: 'pending' },
      { name: 'Lancement officiel', progress: 10, status: 'pending' }
    ],
    createdAt: '2026-01-01',
    updatedAt: '2026-08-04'
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
    nextMilestone: 'Prototype fonctionnel - Novembre 2026',
    problem: 'Les petits commerçants locaux gèrent leurs activités de manière manuelle. Pas de suivi des stocks, pas de fichier clients, des calculs de bénéfices approximatifs.',
    solution: 'UNITECH Commerce propose un système de gestion complet : suivi des stocks en temps réel, historique des ventes, gestion des clients, facturation automatisée et tableaux de bord.',
    benefits: [
      'Réduction des pertes de stock',
      'Augmentation du chiffre d\'affaires',
      'Gain de temps quotidien',
      'Vision claire de l\'activité',
      'Utilisable sur smartphone'
    ],
    techStack: {
      frontend: ['React Native', 'React.js', 'Tailwind CSS'],
      backend: ['Node.js', 'Express.js'],
      database: ['PostgreSQL'],
      others: ['Mobile Money API', 'QR Code']
    },
    stages: [
      { name: 'Étude de marché', progress: 100, status: 'completed' },
      { name: 'Maquettage UI', progress: 70, status: 'in-progress' },
      { name: 'Développement Backend', progress: 35, status: 'pending' },
      { name: 'Développement Mobile', progress: 15, status: 'pending' },
      { name: 'Phase de test', progress: 10, status: 'pending' },
      { name: 'Lancement officiel', progress: 5, status: 'pending' }
    ],
    createdAt: '2026-02-15',
    updatedAt: '2026-08-04'
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
    nextMilestone: 'Test terrain - Octobre 2026',
    problem: 'Les propriétaires de bâtiments avec locataires n\'ont pas de visibilité sur la consommation individuelle. La gestion des panneaux solaires est complexe, et la facturation est manuelle.',
    solution: 'Un système complet avec des capteurs intelligents par logement, une IA qui optimise la distribution d\'énergie, et une plateforme de facturation automatique.',
    benefits: [
      'Visibilité totale sur la consommation',
      'Facturation juste et automatisée',
      'Optimisation de l\'énergie solaire',
      'Réduction du gaspillage',
      'Économies d\'énergie jusqu\'à 30%'
    ],
    techStack: {
      frontend: ['React.js', 'Chart.js', 'WebSockets'],
      backend: ['Node.js', 'Python', 'TensorFlow'],
      database: ['PostgreSQL', 'InfluxDB'],
      others: ['MQTT', 'ESP32', 'LoRa']
    },
    stages: [
      { name: 'Étude de faisabilité', progress: 100, status: 'completed' },
      { name: 'Sélection des capteurs', progress: 100, status: 'completed' },
      { name: 'Prototype hardware', progress: 75, status: 'in-progress' },
      { name: 'Développement IA', progress: 55, status: 'in-progress' },
      { name: 'Dashboard', progress: 40, status: 'pending' },
      { name: 'Test terrain', progress: 25, status: 'pending' },
      { name: 'Déploiement réel', progress: 10, status: 'pending' }
    ],
    createdAt: '2026-03-10',
    updatedAt: '2026-08-04'
  }
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