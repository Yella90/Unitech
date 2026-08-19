// components/public/sections/Training.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FaGraduationCap, 
  FaArrowRight, 
  FaClock, 
  FaLevelUpAlt, 
  FaCode, 
  FaUserGraduate, 
  FaUserPlus,
  FaExternalLinkAlt  // ✅ Ajout pour le lien
} from 'react-icons/fa';
import TrainingRegistrationModal from '@/components/public/forms/TrainingRegistrationModal';

// ============================================================
// TYPES
// ============================================================
type Training = {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  duration: string;
  level: string;
  schedule: string;
  price: string;
  modules: string[];
  color: string;
  created_at: string;
  updated_at: string;
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
  const [trainings, setTrainings] = useState<Training[]>(initialTrainings || []);
  const [loading, setLoading] = useState(!initialTrainings || initialTrainings.length === 0);
  const [showAll, setShowAll] = useState(false);
  
  // ✅ État pour le modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<{ id: string; title: string; slug: string } | null>(null);

  useEffect(() => {
    if (!initialTrainings || initialTrainings.length === 0) {
      loadTrainings();
    }
  }, [initialTrainings]);

  const loadTrainings = async (): Promise<void> => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('trainings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur chargement formations:', error);
        throw error;
      }

      setTrainings(data || []);
    } catch (error) {
      console.error('❌ Erreur chargement formations:', error);
      setTrainings([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Ouvrir le modal d'inscription
  const openModal = (training: { id: string; title: string; slug: string }) => {
    setSelectedTraining(training);
    setModalOpen(true);
  };

  // ✅ Fermer le modal
  const closeModal = () => {
    setModalOpen(false);
    setSelectedTraining(null);
  };

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
  const totalTrainings = trainings.length;

  if (loading) {
    return (
      <section className="py-16 bg-[#F5F7FB]">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1E3A8A] border-t-transparent" />
          </div>
        </div>
      </section>
    );
  }

  if (!trainings || trainings.length === 0) {
    return null;
  }

  return (
    <>
      <section className="py-16 bg-[#F5F7FB]" id="trainings">
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

          
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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

                          {/* ✅ Boutons d'action */}
                          <div className="mt-4 flex flex-wrap gap-2">
                            {/* Lien vers la page de détail */}
                            <Link 
                              href={`/training/${training.slug}`}
                              className="inline-flex items-center gap-1 text-sm font-medium text-[#1E3A8A] group-hover:text-[#F97316] transition"
                            >
                              En savoir plus
                              <FaArrowRight className="h-3 w-3 group-hover:translate-x-1 transition" />
                            </Link>
                            
                            <span className="text-slate-300">|</span>
                            
                            {/* Lien vers la page d'inscription */}
                            <Link 
                              href={`/training/${training.slug}/register`}
                              className="inline-flex items-center gap-1 text-sm font-medium text-[#F97316] hover:text-[#ea580c] transition"
                            >
                              <FaUserPlus className="h-3 w-3" />
                              S'inscrire
                            </Link>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
          {/* ✅ Lien vers /training */}
          <div className="mt-6 flex justify-center">
            <Link
              href="/training"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E3A8A]/10 text-[#1E3A8A] font-medium rounded-full hover:bg-[#1E3A8A]/20 transition group"
            >
              <span>Voir toutes nos formations</span>
              <FaExternalLinkAlt className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
              <span className="text-sm text-[#1E3A8A]/60 ml-1">({totalTrainings})</span>
            </Link>
          </div>


          {/* Bouton "Voir plus" - Redirige vers /training */}
          {hasMore && !showAll && (
            <div className="text-center mt-8">
              <Link
                href="/training"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#1E3A8A] text-white font-medium rounded-xl hover:bg-[#1A2F6A] transition hover:scale-105"
              >
                Voir toutes nos formations ({totalTrainings})
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

      {/* ✅ Modal d'inscription */}
      {selectedTraining && (
        <TrainingRegistrationModal
          isOpen={modalOpen}
          onClose={closeModal}
          trainingId={selectedTraining.id}
          trainingTitle={selectedTraining.title}
          trainingSlug={selectedTraining.slug}
        />
      )}
    </>
  );
}