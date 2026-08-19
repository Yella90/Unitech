// components/public/sections/OurServices.tsx
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
  FaCode,
  FaMobileAlt,
  FaPaintBrush,
  FaCloud,
  FaDatabase,
  FaShieldAlt,
  FaHome,
  FaArrowRight,
  FaExternalLinkAlt  // ✅ Remplacé par FaExternalLinkAlt
} from "react-icons/fa";

// ============================================================
// TYPES
// ============================================================
type Service = {
  id: string;
  name: string;
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
  FaCode: <FaCode className="h-8 w-8" />,
  FaMobileAlt: <FaMobileAlt className="h-8 w-8" />,
  FaPaintBrush: <FaPaintBrush className="h-8 w-8" />,
  FaCloud: <FaCloud className="h-8 w-8" />,
  FaDatabase: <FaDatabase className="h-8 w-8" />,
  FaShieldAlt: <FaShieldAlt className="h-8 w-8" />,
  FaHome: <FaHome className="h-8 w-8" />,
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
interface OurServicesProps {
  limit?: number;
  initialServices?: Service[];
}

export default function OurServices({ limit = 4, initialServices = [] }: OurServicesProps) {
  const [services, setServices] = useState<Service[]>(initialServices || []);
  const [loading, setLoading] = useState(!initialServices || initialServices.length === 0);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!initialServices || initialServices.length === 0) {
      loadServices();
    }
  }, [initialServices]);

  const loadServices = async (): Promise<void> => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('❌ Erreur chargement services:', error);
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

  const displayedServices = services.length > 0 
    ? (showAll ? services : services.slice(0, limit))
    : [];
  
  const hasMore = services.length > limit;
  const totalServices = services.length;

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

  if (services.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-[#F5F7FB]" id="services">
      <div className="mx-auto max-w-7xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl font-black text-[#1E3A8A] md:text-4xl">
            Nos Services
          </h2>
          <p className="mt-2 text-slate-600 max-w-2xl mx-auto">
            Des solutions technologiques sur mesure pour répondre à vos besoins.
          </p>
        </motion.div>

        

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayedServices.map((service, index) => (
          service.is_active && (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
            >
              <Link href={`/services/${service.slug}`} className="block h-full">
                <Card className={`border-2 bg-gradient-to-br ${getGradient(service.color)} ${getBorder(service.color)} hover:shadow-xl transition-all h-full group cursor-pointer`}>
                  <CardContent className="p-6">
                    <div className={`inline-flex rounded-full ${getIconBg(service.color)} p-3 mb-4 group-hover:scale-110 transition`}>
                      {renderIcon(service.icon, service.color)}
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 group-hover:text-[#F97316] transition">
                      {service.name}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">{service.description}</p>
                    
                    {service.features && service.features.length > 0 && (
                      <ul className="mt-4 space-y-1">
                        {service.features.slice(0, 3).map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#1E3A8A]" />
                            {feature}
                          </li>
                        ))}
                        {service.features.length > 3 && (
                          <li className="text-xs text-slate-400">
                            +{service.features.length - 3} autres
                          </li>
                        )}
                      </ul>
                    )}

                    <div className="mt-4 flex items-center gap-2 text-sm font-medium text-[#1E3A8A] group-hover:text-[#F97316] transition">
                      En savoir plus
                      <FaArrowRight className="h-3 w-3 group-hover:translate-x-1 transition" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
            )
          ))}
        </div>
{/* ✅ Lien vers /services */}
        <div className="mt-6 flex justify-center">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E3A8A]/10 text-[#1E3A8A] font-medium rounded-full hover:bg-[#1E3A8A]/20 transition group"
          >
            <span>Voir tous nos services</span>
            <FaExternalLinkAlt className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
            <span className="text-sm text-[#1E3A8A]/60 ml-1">({totalServices})</span>
          </Link>
        </div>
        {hasMore && !showAll && (
          <div className="text-center mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setShowAll(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1E3A8A] text-white font-medium rounded-xl hover:bg-[#1A2F6A] transition hover:scale-105"
            >
              Voir tous nos services ({services.length})
              <FaArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

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