// components/public/sections/ProjectsGrid.tsx
'use client';

import { useState } from 'react';
import { motion } from "framer-motion";
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  FaProjectDiagram, 
  FaArrowRight, 
  FaClock, 
  FaCheckCircle, 
  FaSpinner,
  FaExternalLinkAlt  // ✅ Ajout pour le lien
} from 'react-icons/fa';

// ============================================================
// TYPES
// ============================================================
type Project = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  progress: number;
  status: string;
  next_milestone: string;
  gallery: string[];
  created_at: string;
};

// ============================================================
// MAPPING DES COULEURS
// ============================================================
const colorMap: Record<string, { bg: string; text: string; border: string; progress: string }> = {
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-200',
    progress: 'bg-blue-600'
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    border: 'border-orange-200',
    progress: 'bg-orange-600'
  },
  green: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    border: 'border-green-200',
    progress: 'bg-green-600'
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    border: 'border-purple-200',
    progress: 'bg-purple-600'
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
    progress: 'bg-red-600'
  },
  teal: {
    bg: 'bg-teal-50',
    text: 'text-teal-600',
    border: 'border-teal-200',
    progress: 'bg-teal-600'
  },
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    border: 'border-indigo-200',
    progress: 'bg-indigo-600'
  },
  yellow: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-600',
    border: 'border-yellow-200',
    progress: 'bg-yellow-600'
  },
};

// ============================================================
// MAPPING DES STATUTS
// ============================================================
const statusMap: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  'planning': {
    label: 'Planification',
    icon: <FaClock className="h-3 w-3" />,
    color: 'bg-yellow-100 text-yellow-700'
  },
  'in-progress': {
    label: 'En cours',
    icon: <FaSpinner className="h-3 w-3 animate-spin" />,
    color: 'bg-blue-100 text-blue-700'
  },
  'testing': {
    label: 'En test',
    icon: <FaSpinner className="h-3 w-3" />,
    color: 'bg-purple-100 text-purple-700'
  },
  'pending': {
    label: 'En attente',
    icon: <FaClock className="h-3 w-3" />,
    color: 'bg-gray-100 text-gray-700'
  },
  'completed': {
    label: 'Terminé',
    icon: <FaCheckCircle className="h-3 w-3" />,
    color: 'bg-green-100 text-green-700'
  },
  'on-hold': {
    label: 'En pause',
    icon: <FaClock className="h-3 w-3" />,
    color: 'bg-red-100 text-red-700'
  },
};

// ============================================================
// PROPS
// ============================================================
interface ProjectsGridProps {
  limit?: number;
  initialProjects?: Project[];
}

export default function ProjectsGrid({ limit = 3, initialProjects = [] }: ProjectsGridProps) {
  const [showAll, setShowAll] = useState(false);

  // ✅ Utiliser directement les projets passés en props
  const projects = initialProjects || [];
  
  const getColor = (color: string) => {
    return colorMap[color] || colorMap.blue;
  };

  const getStatus = (status: string) => {
    return statusMap[status] || statusMap['planning'];
  };

  const displayedProjects = projects.length > 0 
    ? (showAll ? projects : projects.slice(0, limit))
    : [];
  
  const hasMore = projects.length > limit;
  const totalProjects = projects.length;

  if (!projects || projects.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-white" id="projects">
      <div className="mx-auto max-w-7xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-[#1E3A8A]/10 px-4 py-1.5 text-sm font-medium text-[#1E3A8A]">
            <FaProjectDiagram className="h-4 w-4" />
            Projets
          </div>
          <h2 className="mt-4 text-3xl font-black text-[#1E3A8A] md:text-4xl">
            Nos Projets
          </h2>
          <p className="mt-2 text-slate-600 max-w-2xl mx-auto">
            Découvrez les projets innovants que nous développons.
          </p>
        </motion.div>

       

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayedProjects.map((project, index) => {
            const color = getColor(project.color);
            const status = getStatus(project.status);
            const firstImage = project.gallery && project.gallery.length > 0 
              ? project.gallery[0] 
              : null;

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <Link href={`/projects/${project.slug}`} className="block h-full">
                  <Card className="border-2 hover:shadow-xl transition-all h-full group cursor-pointer overflow-hidden">
                    {/* Image ou icône en haut */}
                    {firstImage ? (
                      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                        <img
                          src={firstImage}
                          alt={project.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '';
                            (e.target as HTMLImageElement).className = 'hidden';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-3 flex items-center gap-2">
                          <span className="text-3xl">{project.icon || '📁'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className={`flex h-48 items-center justify-center ${color.bg}`}>
                        <span className="text-6xl">{project.icon || '📁'}</span>
                      </div>
                    )}

                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-bold text-slate-800 group-hover:text-[#F97316] transition line-clamp-1">
                          {project.name}
                        </h3>
                        <Badge className={`${status.color} flex-shrink-0`}>
                          <span className="flex items-center gap-1">
                            {status.icon}
                            {status.label}
                          </span>
                        </Badge>
                      </div>

                      <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                        {project.description}
                      </p>

                      <div className="mt-4">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Progression</span>
                          <span className={`font-medium ${color.text}`}>{project.progress}%</span>
                        </div>
                        <Progress 
                          value={project.progress} 
                          className={`h-2 mt-1 ${color.progress}`}
                        />
                      </div>

                      {project.next_milestone && (
                        <p className="mt-2 text-xs text-slate-400">
                          🎯 {project.next_milestone}
                        </p>
                      )}

                      <div className="mt-4 flex items-center gap-2 text-sm font-medium text-[#1E3A8A] group-hover:text-[#F97316] transition">
                        En savoir plus
                        <FaArrowRight className="h-3 w-3 group-hover:translate-x-1 transition" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
         {/* ✅ Lien vers /projects */}
        <div className="mt-6 flex justify-center">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E3A8A]/10 text-[#1E3A8A] font-medium rounded-full hover:bg-[#1E3A8A]/20 transition group"
          >
            <span>Voir tous nos projets</span>
            <FaExternalLinkAlt className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
            <span className="text-sm text-[#1E3A8A]/60 ml-1">({totalProjects})</span>
          </Link>
        </div>

        {/* Bouton "Voir plus" - Redirige vers /projects */}
        {hasMore && !showAll && (
          <div className="text-center mt-8">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1E3A8A] text-white font-medium rounded-xl hover:bg-[#1A2F6A] transition hover:scale-105"
            >
              Voir tous nos projets ({totalProjects})
              <FaArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* Bouton "Voir moins" */}
        {showAll && (
          <div className="text-center mt-8">
            <button
              onClick={() => setShowAll(false)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-300 transition"
            >
              Réduire la liste
            </button>
          </div>
        )}
      </div>
    </section>
  );
}