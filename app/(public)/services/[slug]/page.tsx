// app/(public)/services/[slug]/page.tsx
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  FaArrowLeft, 
  FaCheckCircle,
  FaCode,
  FaMobileAlt,
  FaCogs,
  FaBrain,
  FaRobot,
  FaChartLine,
  FaPaintBrush,
  FaCloud,
  FaDatabase,
  FaShieldAlt,
  FaHome,
  FaGraduationCap,
  FaCog,
  FaStore,
  FaSolarPanel,
  FaLeaf,
  FaBuilding,
  FaBolt,
  FaUniversity,
  FaClipboardList, // ✅ Ajout pour le lien vers demande
  FaArrowRight
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
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type ColorConfig = {
  bg: string;
  text: string;
  border: string;
  gradient: string;
  hover: string;
};

// ============================================================
// MAPPING DES ICÔNES
// ============================================================
const iconMap: Record<string, React.ReactNode> = {
  FaUniversity: <FaUniversity className="h-12 w-12" />,
  FaStore: <FaStore className="h-12 w-12" />,
  FaSolarPanel: <FaSolarPanel className="h-12 w-12" />,
  FaRobot: <FaRobot className="h-12 w-12" />,
  FaGraduationCap: <FaGraduationCap className="h-12 w-12" />,
  FaLeaf: <FaLeaf className="h-12 w-12" />,
  FaCog: <FaCog className="h-12 w-12" />,
  FaBuilding: <FaBuilding className="h-12 w-12" />,
  FaBolt: <FaBolt className="h-12 w-12" />,
  FaBrain: <FaBrain className="h-12 w-12" />,
  FaCogs: <FaCogs className="h-12 w-12" />,
  FaChartLine: <FaChartLine className="h-12 w-12" />,
  FaCode: <FaCode className="h-12 w-12" />,
  FaMobileAlt: <FaMobileAlt className="h-12 w-12" />,
  FaPaintBrush: <FaPaintBrush className="h-12 w-12" />,
  FaCloud: <FaCloud className="h-12 w-12" />,
  FaDatabase: <FaDatabase className="h-12 w-12" />,
  FaShieldAlt: <FaShieldAlt className="h-12 w-12" />,
  FaHome: <FaHome className="h-12 w-12" />,
};

// ============================================================
// MAPPING DES COULEURS
// ============================================================
const colorMap: Record<string, ColorConfig> = {
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-200',
    gradient: 'from-blue-50 to-blue-100',
    hover: 'hover:bg-blue-50'
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    border: 'border-orange-200',
    gradient: 'from-orange-50 to-orange-100',
    hover: 'hover:bg-orange-50'
  },
  green: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    border: 'border-green-200',
    gradient: 'from-green-50 to-green-100',
    hover: 'hover:bg-green-50'
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    border: 'border-purple-200',
    gradient: 'from-purple-50 to-purple-100',
    hover: 'hover:bg-purple-50'
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
    gradient: 'from-red-50 to-red-100',
    hover: 'hover:bg-red-50'
  },
  teal: {
    bg: 'bg-teal-50',
    text: 'text-teal-600',
    border: 'border-teal-200',
    gradient: 'from-teal-50 to-teal-100',
    hover: 'hover:bg-teal-50'
  },
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    border: 'border-indigo-200',
    gradient: 'from-indigo-50 to-indigo-100',
    hover: 'hover:bg-indigo-50'
  },
  yellow: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-600',
    border: 'border-yellow-200',
    gradient: 'from-yellow-50 to-yellow-100',
    hover: 'hover:bg-yellow-50'
  },
  cyan: {
    bg: 'bg-cyan-50',
    text: 'text-cyan-600',
    border: 'border-cyan-200',
    gradient: 'from-cyan-50 to-cyan-100',
    hover: 'hover:bg-cyan-50'
  },
};

// ============================================================
// MÉTADONNÉES
// ============================================================
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const { data: service, error } = await supabase
      .from('services')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !service) {
      return {
        title: 'Service non trouvé',
        description: 'Le service que vous recherchez n\'existe pas.'
      };
    }

    return {
      title: `${service.name} - UNITECH`,
      description: service.description,
      openGraph: {
        title: `${service.name} - UNITECH`,
        description: service.description,
        siteName: 'UNITECH',
        locale: 'fr_FR',
        type: 'website',
      },
    };
  } catch (error) {
    return {
      title: 'Service - UNITECH',
      description: 'Découvrez nos services technologiques innovants.'
    };
  }
}

// ============================================================
// GÉNÉRATION DES CHEMINS STATIQUES
// ============================================================
export async function generateStaticParams() {
  const { data: services } = await supabase
    .from('services')
    .select('slug')
    .eq('is_active', true);

  if (!services) return [];

  return services.map((service: { slug: string }) => ({
    slug: service.slug,
  }));
}

// ============================================================
// PAGE DE DÉTAIL D'UN SERVICE// ============================================================
export default async function ServiceDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;

  // Récupérer le service par son slug
  const { data: service, error } = await supabase
    .from('services')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !service) {
    notFound();
  }

  // Récupérer les autres services
  const { data: otherServices } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .neq('id', service.id)
    .order('order_index', { ascending: true })
    .limit(3);

  const color = colorMap[service.color] || colorMap.blue;
  const icon = iconMap[service.icon] || <FaCog className="h-12 w-12" />;

  return (
    <main className="min-h-screen bg-[#F5F7FB]">
      {/* En-tête du service */}
      <section className={`py-16 bg-gradient-to-br ${color.gradient}`}>
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center text-center">
            <div className={`inline-flex rounded-full ${color.bg} p-6 mb-6 shadow-lg`}>
              <div className={color.text}>{icon}</div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-[#1E3A8A]">
              {service.name}
            </h1>
            
            <p className="mt-4 text-lg text-slate-600 max-w-2xl">
              {service.description}
            </p>
            
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/#services"
                className="inline-flex items-center gap-2 text-sm text-[#1E3A8A] hover:text-[#F97316] transition"
              >
                <FaArrowLeft className="h-4 w-4" />
                Retour aux services
              </Link>
              
              {/* ✅ NOUVEAU LIEN VERS LA DEMANDE DE SERVICE */}
              <span className="text-slate-300">|</span>
              
              <Link
                href="/demande-service"
                className="inline-flex items-center gap-2 text-sm text-[#F97316] hover:text-[#ea580c] transition font-medium"
              >
                <FaClipboardList className="h-4 w-4" />
                Demander ce service
                <FaArrowRight className="h-3 w-3 group-hover:translate-x-1 transition" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Fonctionnalités */}
      {service.features && service.features.length > 0 && (
        <section className="py-16 bg-white">
          <div className="mx-auto max-w-7xl px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#1E3A8A]">
                Fonctionnalités clés
              </h2>
              <p className="mt-2 text-slate-500">
                Découvrez ce que notre service peut vous apporter
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {service.features.map((feature: string, index: number) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-4 rounded-lg border ${color.border} ${color.hover} transition`}
                >
                  <FaCheckCircle className={`h-5 w-5 ${color.text} flex-shrink-0 mt-0.5`} />
                  <span className="text-slate-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ... Le reste du code (Pourquoi choisir, Autres services, CTA) reste identique ... */}
      
      {/* Pourquoi choisir ce service */}
      <section className="py-16 bg-[#F5F7FB]">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1E3A8A]">
              Pourquoi choisir ce service ?
            </h2>
            <p className="mt-2 text-slate-500">
              Des avantages concrets pour votre entreprise
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className={`inline-flex rounded-full ${color.bg} p-4 mb-4`}>
                <FaCheckCircle className={`h-8 w-8 ${color.text}`} />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Expertise</h3>
              <p className="mt-2 text-sm text-slate-500">
                Une équipe d'experts passionnés à votre service
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className={`inline-flex rounded-full ${color.bg} p-4 mb-4`}>
                <FaCheckCircle className={`h-8 w-8 ${color.text}`} />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Innovation</h3>
              <p className="mt-2 text-sm text-slate-500">
                Des solutions innovantes avec les dernières technologies
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className={`inline-flex rounded-full ${color.bg} p-4 mb-4`}>
                <FaCheckCircle className={`h-8 w-8 ${color.text}`} />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Support</h3>
              <p className="mt-2 text-sm text-slate-500">
                Un accompagnement personnalisé et réactif
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Autres services */}
      {otherServices && otherServices.length > 0 && (
        <section className="py-16 bg-white">
          <div className="mx-auto max-w-7xl px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#1E3A8A]">
                Autres services
              </h2>
              <p className="mt-2 text-slate-500">
                Découvrez nos autres solutions technologiques
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {otherServices.map((other: Service) => {
                const otherColor = colorMap[other.color] || colorMap.blue;
                const otherIcon = iconMap[other.icon] || <FaCog className="h-6 w-6" />;
                
                return (
                  <Link
                    key={other.id}
                    href={`/services/${other.slug}`}
                    className="group p-6 bg-[#F5F7FB] rounded-xl border border-slate-200 hover:shadow-lg transition-all hover:-translate-y-1"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`inline-flex rounded-full ${otherColor.bg} p-3 flex-shrink-0`}>
                        <div className={otherColor.text}>{otherIcon}</div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 group-hover:text-[#F97316] transition">
                          {other.name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                          {other.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="text-center mt-8">
              <Link
                href="/#services"
                className="inline-flex items-center gap-2 text-[#1E3A8A] hover:text-[#F97316] transition font-medium"
              >
                Voir tous nos services
                <span className="text-lg">→</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Appel à l'action */}
      <section className="py-16 bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF]">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white">
            Prêt à démarrer votre projet ?
          </h2>
          <p className="mt-4 text-white/80 max-w-2xl mx-auto">
            Contactez-nous dès maintenant pour discuter de vos besoins et obtenir un devis personnalisé.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {/* ✅ NOUVEAU LIEN VERS DEMANDE DE SERVICE */}
            <Link
              href="/demande-service"
              className="px-8 py-3 bg-[#F97316] text-white font-semibold rounded-xl hover:bg-[#ea580c] transition hover:scale-105"
            >
              <FaClipboardList className="inline mr-2 h-5 w-5" />
              Demander ce service
            </Link>
            <Link
              href="/contact"
              className="px-8 py-3 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition backdrop-blur-sm"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}