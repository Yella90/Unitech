// fix-types.js
const fs = require('fs');
const path = require('path');

// 1. Corriger les types
const typesPath = path.join(__dirname, 'types/index.ts');
let typesContent = fs.readFileSync(typesPath, 'utf8');

// Remplacer nextMilestone par next_milestone
typesContent = typesContent.replace(/nextMilestone/g, 'next_milestone');

// Ajouter les champs manquants à ProjectStage
typesContent = typesContent.replace(
  /export interface ProjectStage \{([^}]*)\}/,
  `export interface ProjectStage {
  id: string;
  project_id: string;
  name: string;
  progress: number;
  status: 'completed' | 'in-progress' | 'pending';
  created_at: string;
  updated_at: string;
}`
);

fs.writeFileSync(typesPath, typesContent);
console.log('✅ Types corrigés');