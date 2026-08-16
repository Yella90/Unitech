// app/(public)/services/page.tsx
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  FaArrowRight,
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
  FaHome
} from 'react-icons/fa';
import { Metadata } from 'next';

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
// MÉTADONNÉES
// ============================================================
export const metadata: Metadata = {
  title: "Services - UNITECH",
  description: "Découvrez tous les services technologiques proposés par UNITECH.",
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
const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-600',
    border: 'border-blue-200'
  },
  orange: {
    bg: 'bg-orange-100',
    text: 'text-orange-600',
    border: 'border-orange-200'
  },
  green: {
    bg: 'bg-green-100',
    text: 'text-green-600',
    border: 'border-green-200'
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-600',
    border: 'border-purple-200'
  },
  red: {
    bg: 'bg-red-100',
    text: 'text-red-600',
    border: 'border-red-200'
  },
  teal: {
    bg: 'bg-teal-100',
    text: 'text-teal-600',
    border: 'border-teal-200'
  },
  indigo: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-600',
    border: 'border-indigo-200'
  },
  yellow: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-600',
    border: 'border-yellow-200'
  },
  cyan: {
    bg: 'bg-cyan-100',
    text: 'text-cyan-600',
    border: 'border-cyan-200'
  },
};

// ============================================================
// PAGE DE LISTE DES SERVICES
// ============================================================
export default async function ServicesPage() {
  // ✅ Récupérer tous les services depuis Supabase
  const { data: services, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Erreur Supabase:', error);
  }

  const renderIcon = (iconName: string, color: string) => {
    const icon = iconMap[iconName] || <FaCog className="h-8 w-8" />;
    const colorClass = colorMap[color]?.text || 'text-blue-600';
    return <div className={colorClass}>{icon}</div>;
  };

  const getIconBg = (color: string) => {
    return colorMap[color]?.bg || 'bg-blue-100';
  };

  const getBorder = (color: string) => {
    return colorMap[color]?.border || 'border-blue-200';
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      <div className="mx-auto max-w-7xl px-4 py-16">
        {/* En-tête */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-[#1E3A8A]">
            Nos Services
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Découvrez l'ensemble de nos solutions technologiques sur mesure.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm text-slate-500">
            <span className="px-3 py-1 bg-white rounded-full shadow-sm">
              🚀 {services?.length || 0} services disponibles
            </span>
          </div>
        </div>

        {/* Grille des services */}
        {services && services.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service: Service) => (
              <Link
                key={service.id}
                href={`/services/${service.slug}`}
                className="group bg-white rounded-xl border border-slate-200 p-6 hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="flex items-start gap-4">
                  <div className={`inline-flex rounded-full ${getIconBg(service.color)} p-3 flex-shrink-0 group-hover:scale-110 transition`}>
                    {renderIcon(service.icon, service.color)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-[#F97316] transition">
                      {service.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                      {service.description}
                    </p>
                    {service.features && service.features.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {service.features.slice(0, 2).map((feature: string, idx: number) => (
                          <span
                            key={idx}
                            className={`inline-block rounded-full px-2 py-0.5 text-xs ${getBorder(service.color)} bg-white/50 text-slate-600`}
                          >
                            {feature}
                          </span>
                        ))}
                        {service.features.length > 2 && (
                          <span className="text-xs text-slate-400">
                            +{service.features.length - 2}
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
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex rounded-full bg-slate-100 p-4 mb-4">
              <FaCog className="h-12 w-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700">Aucun service disponible</h3>
            <p className="mt-2 text-slate-500">
              Les services seront bientôt disponibles.
            </p>
          </div>
        )}

        {/* Statistiques */}
        {services && services.length > 0 && (
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-slate-200">
              <p className="text-2xl font-bold text-[#1E3A8A]">{services.length}</p>
              <p className="text-xs text-slate-500">Services</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-slate-200">
              <p className="text-2xl font-bold text-[#1E3A8A]">
                {services.reduce((acc, s) => acc + (s.features?.length || 0), 0)}
              </p>
              <p className="text-xs text-slate-500">Fonctionnalités</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-slate-200">
              <p className="text-2xl font-bold text-[#1E3A8A]">
                {new Set(services.map(s => s.color)).size}
              </p>
              <p className="text-xs text-slate-500">Catégories</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-slate-200">
              <p className="text-2xl font-bold text-[#1E3A8A]">
                {services.filter(s => s.is_active).length}
              </p>
              <p className="text-xs text-slate-500">Actifs</p>
            </div>
          </div>
        )}

        {/* Appel à l'action */}
        <div className="mt-12 text-center">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#F97316] text-white font-semibold rounded-xl hover:bg-[#ea580c] transition hover:scale-105"
          >
            Demander un devis
            <FaArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}