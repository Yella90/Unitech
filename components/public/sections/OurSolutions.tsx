// components/public/sections/OurSolutions.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from "@/components/ui/card";
import Link from 'next/link';
import { 
  FaUniversity, 
  FaStore, 
  FaSolarPanel, 
  FaRobot, 
  FaGraduationCap,
  FaCog,
  FaLeaf,
  FaBuilding,
  FaBolt,
  FaBrain,
  FaCogs,
  FaChartLine,
  FaArrowRight
} from "react-icons/fa";

// ============================================================
// TYPES
// ============================================================
type Solution = {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  features: string[];
  slug: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
};

// ============================================================
// MAPPING DES ICÔNES
// ============================================================
const iconMap: Record<string, React.ReactNode> = {
  FaUniversity: <FaUniversity className="h-8 w-8" />,
  FaStore: <FaStore className="h-8 w-8" />,
  FaSolarPanel: <FaSolarPanel className="h-8 w-8" />,
  FaRobot: <FaRobot className="h-8 w-8" />,
  FaGraduationCap: <FaGraduationCap className="h-8 w-8" />,
  FaLeaf: <FaLeaf className="h-8 w-8" />,
  FaCog: <FaCog className="h-8 w-8" />,
  FaBuilding: <FaBuilding className="h-8 w-8" />,
  FaBolt: <FaBolt className="h-8 w-8" />,
  FaBrain: <FaBrain className="h-8 w-8" />,
  FaCogs: <FaCogs className="h-8 w-8" />,
  FaChartLine: <FaChartLine className="h-8 w-8" />,
};

// ============================================================
// MAPPING DES COULEURS
// ============================================================
type ColorConfig = {
  gradient: string;
  bg: string;
  text: string;
  border: string;
};

const colorMap: Record<string, ColorConfig> = {
  blue: {
    gradient: 'from-blue-50 to-blue-100',
    bg: 'bg-blue-100',
    text: 'text-blue-600',
    border: 'border-blue-200'
  },
  orange: {
    gradient: 'from-orange-50 to-orange-100',
    bg: 'bg-orange-100',
    text: 'text-orange-600',
    border: 'border-orange-200'
  },
  green: {
    gradient: 'from-green-50 to-green-100',
    bg: 'bg-green-100',
    text: 'text-green-600',
    border: 'border-green-200'
  },
  purple: {
    gradient: 'from-purple-50 to-purple-100',
    bg: 'bg-purple-100',
    text: 'text-purple-600',
    border: 'border-purple-200'
  },
  red: {
    gradient: 'from-red-50 to-red-100',
    bg: 'bg-red-100',
    text: 'text-red-600',
    border: 'border-red-200'
  },
  teal: {
    gradient: 'from-teal-50 to-teal-100',
    bg: 'bg-teal-100',
    text: 'text-teal-600',
    border: 'border-teal-200'
  },
  indigo: {
    gradient: 'from-indigo-50 to-indigo-100',
    bg: 'bg-indigo-100',
    text: 'text-indigo-600',
    border: 'border-indigo-200'
  },
  yellow: {
    gradient: 'from-yellow-50 to-yellow-100',
    bg: 'bg-yellow-100',
    text: 'text-yellow-600',
    border: 'border-yellow-200'
  },
  cyan: {
    gradient: 'from-cyan-50 to-cyan-100',
    bg: 'bg-cyan-100',
    text: 'text-cyan-600',
    border: 'border-cyan-200'
  },
};

// ============================================================
// PROPS
// ============================================================
interface OurSolutionsProps {
  limit?: number;
}

export default function OurSolutions({ limit = 4 }: OurSolutionsProps) {
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAll, setShowAll] = useState<boolean>(false);

  useEffect(() => {
    loadSolutions();
  }, []);

  const loadSolutions = async (): Promise<void> => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('solutions')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setSolutions(data || []);
    } catch (error) {
      console.error('❌ Erreur chargement solutions:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderIcon = (iconName: string, color: string): React.ReactNode => {
    const icon = iconMap[iconName] || <FaCog className="h-8 w-8" />;
    const colorClass = colorMap[color]?.text || 'text-blue-600';
    return <div className={colorClass}>{icon}</div>;
  };

  const getIconBg = (color: string): string => {
    return colorMap[color]?.bg || 'bg-blue-100';
  };

  const getGradient = (color: string): string => {
    return colorMap[color]?.gradient || 'from-blue-50 to-blue-100';
  };

  const getBorder = (color: string): string => {
    return colorMap[color]?.border || 'border-blue-200';
  };

  const displayedSolutions = showAll ? solutions : solutions.slice(0, limit);
  const hasMore = solutions.length > limit;

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1E3A8A] border-t-transparent" />
          </div>
        </div>
      </section>
    );
  }

  if (solutions.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-white" id="solutions">
      <div className="mx-auto max-w-7xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl font-black text-[#1E3A8A] md:text-4xl">
            Nos Solutions
          </h2>
          <p className="mt-2 text-slate-600 max-w-2xl mx-auto">
            Des solutions innovantes pour répondre aux défis de demain.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayedSolutions.map((solution: Solution, index: number) => (
            <motion.div
              key={solution.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
            >
              <Link href={`/solutions/${solution.slug}`} className="block h-full">
                <Card className={`border-2 bg-gradient-to-br ${getGradient(solution.color)} ${getBorder(solution.color)} hover:shadow-xl transition-all h-full group cursor-pointer`}>
                  <CardContent className="p-6">
                    <div className={`inline-flex rounded-full ${getIconBg(solution.color)} p-3 mb-4 group-hover:scale-110 transition`}>
                      {renderIcon(solution.icon, solution.color)}
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 group-hover:text-[#F97316] transition">
                      {solution.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">{solution.description}</p>
                    
                    {solution.features && solution.features.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {solution.features.slice(0, 3).map((feature: string, idx: number) => (
                          <span
                            key={idx}
                            className="inline-block rounded-full bg-white/50 px-2.5 py-0.5 text-xs text-slate-600 border border-slate-200/50"
                          >
                            {feature}
                          </span>
                        ))}
                        {solution.features.length > 3 && (
                          <span className="text-xs text-slate-400">
                            +{solution.features.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-2 text-sm font-medium text-[#1E3A8A] group-hover:text-[#F97316] transition">
                      En savoir plus
                      <FaArrowRight className="h-3 w-3 group-hover:translate-x-1 transition" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* ✅ Bouton "Voir plus" */}
        {hasMore && !showAll && (
          <div className="text-center mt-8">
            <button
              onClick={() => setShowAll(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1E3A8A] text-white font-medium rounded-xl hover:bg-[#1A2F6A] transition hover:scale-105"
            >
              Voir toutes nos solutions ({solutions.length})
              <FaArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ✅ Bouton "Voir moins" */}
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