// components/public/sections/Training.tsx
'use client';

import { useState } from 'react';
import { motion } from "framer-motion";
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { FaGraduationCap, FaArrowRight, FaClock, FaLevelUpAlt, FaCode, FaUserGraduate } from 'react-icons/fa';

// ============================================================
// TYPES
// ============================================================
type Training = {
  id: string;
  slug: string;
  title: string;
  description: string;
  duration: string;
  level: string;
  price: string;
  modules: string[];
  color: string;
  created_at: string;
};

// ============================================================
// MAPPING DES COULEURS
// ============================================================
const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-200'
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    border: 'border-orange-200'
  },
  green: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    border: 'border-green-200'
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    border: 'border-purple-200'
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200'
  },
  teal: {
    bg: 'bg-teal-50',
    text: 'text-teal-600',
    border: 'border-teal-200'
  },
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    border: 'border-indigo-200'
  },
  yellow: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-600',
    border: 'border-yellow-200'
  },
};

// ============================================================
// MAPPING DES NIVEAUX
// ============================================================
const levelColors: Record<string, string> = {
  'Débutant': 'bg-green-100 text-green-700',
  'Intermédiaire': 'bg-blue-100 text-blue-700',
  'Avancé': 'bg-red-100 text-red-700',
  'Expert': 'bg-purple-100 text-purple-700',
  'Tous niveaux': 'bg-gray-100 text-gray-700',
  'Débutant à Avancé': 'bg-gradient-to-r from-green-100 to-red-100 text-green-700',
  'Intermédiaire à Avancé': 'bg-gradient-to-r from-blue-100 to-red-100 text-blue-700',
};

// ============================================================
// PROPS
// ============================================================
interface TrainingProps {
  limit?: number;
  initialTrainings?: Training[];
}

export default function Training({ limit = 4, initialTrainings = [] }: TrainingProps) {
  const [showAll, setShowAll] = useState(false);

  // ✅ Utiliser directement les formations passées en props
  const trainings = initialTrainings || [];

  const getColor = (color: string) => {
    return colorMap[color] || colorMap.blue;
  };

  const getLevelColor = (level: string) => {
    return levelColors[level] || 'bg-gray-100 text-gray-700';
  };

  const displayedTrainings = trainings.length > 0 
    ? (showAll ? trainings : trainings.slice(0, limit))
    : [];
  
  const hasMore = trainings.length > limit;

  if (!trainings || trainings.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-[#F5F7FB]">
      <div className="mx-auto max-w-7xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-[#1E3A8A]/10 px-4 py-1.5 text-sm font-medium text-[#1E3A8A]">
            <FaGraduationCap className="h-4 w-4" />
            Formations
          </div>
          <h2 className="mt-4 text-3xl font-black text-[#1E3A8A] md:text-4xl">
            Formations Technologiques
          </h2>
          <p className="mt-2 text-slate-600 max-w-2xl mx-auto">
            Des programmes de formation pour développer vos compétences techniques.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayedTrainings.map((training, index) => {
            const color = getColor(training.color);
            const levelColor = getLevelColor(training.level);

            return (
              <motion.div
                key={training.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <Link href={`/trainings/${training.slug}`} className="block h-full">
                  <Card className={`border-2 ${color.border} hover:shadow-xl transition-all h-full group cursor-pointer`}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${color.bg} ${color.text} group-hover:scale-110 transition flex-shrink-0`}>
                          <FaGraduationCap className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-slate-800 group-hover:text-[#F97316] transition">
                            {training.title}
                          </h3>
                          <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                            {training.description}
                          </p>
                          
                          {/* Durée et Niveau */}
                          <div className="mt-3 flex flex-wrap gap-2">
                            {training.duration && (
                              <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                                <FaClock className="h-3 w-3" />
                                {training.duration}
                              </span>
                            )}
                            {training.level && (
                              <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${levelColor}`}>
                                <FaLevelUpAlt className="h-3 w-3" />
                                {training.level}
                              </span>
                            )}
                          </div>

                          {/* Prix */}
                          {training.price && (
                            <div className="mt-2">
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#1E3A8A] bg-[#1E3A8A]/5 px-2 py-1 rounded-full">
                                <FaUserGraduate className="h-3 w-3" />
                                {training.price}
                              </span>
                            </div>
                          )}

                          {/* Modules */}
                          {training.modules && training.modules.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {training.modules.slice(0, 2).map((module, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">
                                  <FaCode className="h-2.5 w-2.5" />
                                  {module}
                                </span>
                              ))}
                              {training.modules.length > 2 && (
                                <span className="text-xs text-slate-400">
                                  +{training.modules.length - 2}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="mt-3 flex items-center gap-1 text-sm font-medium text-[#1E3A8A] group-hover:text-[#F97316] transition">
                            En savoir plus
                            <FaArrowRight className="h-3 w-3 group-hover:translate-x-1 transition" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Bouton "Voir plus" */}
        {hasMore && !showAll && (
          <div className="text-center mt-8">
            <Link
              href="/trainings"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1E3A8A] text-white font-medium rounded-xl hover:bg-[#1A2F6A] transition hover:scale-105"
            >
              Voir toutes nos formations ({trainings.length})
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