// components/public/sections/OurSolutions.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from "@/components/ui/card";
import { 
  FaGraduationCap, 
  FaStore, 
  FaBolt, 
  FaBrain, 
  FaCogs, 
  FaChartLine,
  FaUniversity,
  FaSolarPanel,
  FaRobot,
  FaLeaf,
  FaCog,
  FaBuilding,
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
  image_url: string | null;
  link_text: string | null;
  link_url: string | null;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
};

// ============================================================
// MAPPING DES ICÔNES
// ============================================================
const iconMap: Record<string, React.ReactNode> = {
  FaGraduationCap: <FaGraduationCap className="h-8 w-8" />,
  FaStore: <FaStore className="h-8 w-8" />,
  FaBolt: <FaBolt className="h-8 w-8" />,
  FaBrain: <FaBrain className="h-8 w-8" />,
  FaCogs: <FaCogs className="h-8 w-8" />,
  FaChartLine: <FaChartLine className="h-8 w-8" />,
  FaUniversity: <FaUniversity className="h-8 w-8" />,
  FaSolarPanel: <FaSolarPanel className="h-8 w-8" />,
  FaRobot: <FaRobot className="h-8 w-8" />,
  FaLeaf: <FaLeaf className="h-8 w-8" />,
  FaCog: <FaCog className="h-8 w-8" />,
  FaBuilding: <FaBuilding className="h-8 w-8" />,
};

// ============================================================
// MAPPING DES COULEURS
// ============================================================
const colorMap: Record<string, { gradient: string; bg: string; text: string; border: string }> = {
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
  indigo: {
    gradient: 'from-indigo-50 to-indigo-100',
    bg: 'bg-indigo-100',
    text: 'text-indigo-600',
    border: 'border-indigo-200'
  },
  teal: {
    gradient: 'from-teal-50 to-teal-100',
    bg: 'bg-teal-100',
    text: 'text-teal-600',
    border: 'border-teal-200'
  },
  yellow: {
    gradient: 'from-yellow-50 to-yellow-100',
    bg: 'bg-yellow-100',
    text: 'text-yellow-600',
    border: 'border-yellow-200'
  },
};

export default function OurSolutions() {
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSolutions();
  }, []);

  const loadSolutions = async () => {
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

  // ✅ Rendu de l'icône avec la bonne couleur
  const renderIcon = (iconName: string, color: string) => {
    const icon = iconMap[iconName] || <FaCog className="h-8 w-8" />;
    const colorClass = colorMap[color]?.text || 'text-blue-600';
    return <div className={colorClass}>{icon}</div>;
  };

  // ✅ Rendu du background de l'icône
  const getIconBg = (color: string) => {
    return colorMap[color]?.bg || 'bg-blue-100';
  };

  // ✅ Rendu du gradient
  const getGradient = (color: string) => {
    return colorMap[color]?.gradient || 'from-blue-50 to-blue-100';
  };

  // ✅ Rendu de la bordure
  const getBorder = (color: string) => {
    return colorMap[color]?.border || 'border-blue-200';
  };

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1E3A8A] border-t-transparent" />
        </div>
      </section>
    );
  }

  if (solutions.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
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
          Des solutions innovantes qui allient le digital et le physique pour répondre aux défis technologiques d'aujourd'hui.
        </p>
      </motion.div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {solutions.map((solution, index) => (
          <motion.div
            key={solution.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.03 }}
          >
            <Card className={`border-2 bg-gradient-to-br ${getGradient(solution.color)} ${getBorder(solution.color)} hover:shadow-xl transition-all h-full`}>
              <CardContent className="p-6 text-center">
                <div className={`inline-flex rounded-full ${getIconBg(solution.color)} p-3 mb-4`}>
                  {renderIcon(solution.icon, solution.color)}
                </div>
                <h3 className="text-xl font-bold text-slate-800">{solution.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{solution.description}</p>
                
                {/* ✅ Features */}
                {solution.features && solution.features.length > 0 && (
                  <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                    {solution.features.slice(0, 3).map((feature, idx) => (
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

                {/* ✅ Lien "En savoir plus" */}
                {solution.link_url && (
                  <div className="mt-4">
                    <a 
                      href={solution.link_url}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1E3A8A] hover:text-[#F97316] transition"
                    >
                      {solution.link_text || 'En savoir plus'}
                      <FaArrowRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}