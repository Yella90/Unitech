// app/(public)/training/[slug]/page.tsx
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  FaArrowLeft, 
  FaCheckCircle,
  FaClock,
  FaLevelUpAlt,
  FaCode,
  FaUserGraduate,
  FaUserPlus,
  FaGraduationCap,
  FaCalendarAlt,
  FaBookOpen,
  FaChalkboardTeacher,
  FaCertificate,
  FaArrowRight,
  FaExternalLinkAlt
} from 'react-icons/fa';
import { Metadata } from 'next';

// ============================================================
// TYPES
// ============================================================
type Training = {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  duration: string;
  level: string;
  schedule: string;
  price: string;
  modules: string[];
  slug: string;
  created_at: string;
  updated_at: string;
};

type ColorConfig = {
  bg: string;
  text: string;
  border: string;
  gradient: string;
  hover: string;
  light: string;
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
    hover: 'hover:bg-blue-50',
    light: 'bg-blue-100'
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    border: 'border-orange-200',
    gradient: 'from-orange-50 to-orange-100',
    hover: 'hover:bg-orange-50',
    light: 'bg-orange-100'
  },
  green: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    border: 'border-green-200',
    gradient: 'from-green-50 to-green-100',
    hover: 'hover:bg-green-50',
    light: 'bg-green-100'
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    border: 'border-purple-200',
    gradient: 'from-purple-50 to-purple-100',
    hover: 'hover:bg-purple-50',
    light: 'bg-purple-100'
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
    gradient: 'from-red-50 to-red-100',
    hover: 'hover:bg-red-50',
    light: 'bg-red-100'
  },
  teal: {
    bg: 'bg-teal-50',
    text: 'text-teal-600',
    border: 'border-teal-200',
    gradient: 'from-teal-50 to-teal-100',
    hover: 'hover:bg-teal-50',
    light: 'bg-teal-100'
  },
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    border: 'border-indigo-200',
    gradient: 'from-indigo-50 to-indigo-100',
    hover: 'hover:bg-indigo-50',
    light: 'bg-indigo-100'
  },
  yellow: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-600',
    border: 'border-yellow-200',
    gradient: 'from-yellow-50 to-yellow-100',
    hover: 'hover:bg-yellow-50',
    light: 'bg-yellow-100'
  },
  cyan: {
    bg: 'bg-cyan-50',
    text: 'text-cyan-600',
    border: 'border-cyan-200',
    gradient: 'from-cyan-50 to-cyan-100',
    hover: 'hover:bg-cyan-50',
    light: 'bg-cyan-100'
  },
};

// ============================================================
// MAPPING DES NIVEAUX
// ============================================================
const levelMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  'Débutant': {
    label: 'Débutant',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: <FaLevelUpAlt className="h-3 w-3" />
  },
  'Intermédiaire': {
    label: 'Intermédiaire',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: <FaLevelUpAlt className="h-3 w-3" />
  },
  'Avancé': {
    label: 'Avancé',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: <FaLevelUpAlt className="h-3 w-3" />
  },
  'Expert': {
    label: 'Expert',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    icon: <FaLevelUpAlt className="h-3 w-3" />
  },
  'Tous niveaux': {
    label: 'Tous niveaux',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: <FaLevelUpAlt className="h-3 w-3" />
  },
  'Débutant à Avancé': {
    label: 'Débutant à Avancé',
    color: 'bg-gradient-to-r from-green-100 to-red-100 text-green-700 border-green-200',
    icon: <FaLevelUpAlt className="h-3 w-3" />
  },
  'Intermédiaire à Avancé': {
    label: 'Intermédiaire à Avancé',
    color: 'bg-gradient-to-r from-blue-100 to-red-100 text-blue-700 border-blue-200',
    icon: <FaLevelUpAlt className="h-3 w-3" />
  },
};

// ============================================================
// MÉTADONNÉES
// ============================================================
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const { data: training, error } = await supabase
      .from('trainings')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !training) {
      return {
        title: 'Formation non trouvée',
        description: 'La formation que vous recherchez n\'existe pas.'
      };
    }

    return {
      title: `${training.title} - UNITECH Formation`,
      description: training.description,
      openGraph: {
        title: `${training.title} - UNITECH Formation`,
        description: training.description,
        siteName: 'UNITECH',
        locale: 'fr_FR',
        type: 'website',
      },
    };
  } catch (error) {
    return {
      title: 'Formation - UNITECH',
      description: 'Découvrez nos formations technologiques innovantes.'
    };
  }
}

// ============================================================
// GÉNÉRATION DES CHEMINS STATIQUES
// ============================================================
export async function generateStaticParams() {
  const { data: trainings } = await supabase
    .from('trainings')
    .select('slug');

  if (!trainings) return [];

  return trainings.map((training: { slug: string }) => ({
    slug: training.slug,
  }));
}

// ============================================================
// PAGE DE DÉTAIL D'UNE FORMATION
// ============================================================
export default async function TrainingDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;

  // Récupérer la formation par son slug
  const { data: training, error } = await supabase
    .from('trainings')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !training) {
    notFound();
  }

  // Récupérer les autres formations
  const { data: otherTrainings } = await supabase
    .from('trainings')
    .select('*')
    .neq('id', training.id)
    .order('created_at', { ascending: false })
    .limit(3);

  const color = colorMap[training.color] || colorMap.blue;
  const levelInfo = levelMap[training.level] || levelMap['Tous niveaux'];

  return (
    <main className="min-h-screen bg-[#F5F7FB]">
      {/* En-tête de la formation */}
      <section className={`py-16 bg-gradient-to-br ${color.gradient}`}>
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center text-center">
            <div className={`inline-flex rounded-full ${color.bg} p-6 mb-6 shadow-lg`}>
              <FaGraduationCap className={`h-12 w-12 ${color.text}`} />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-[#1E3A8A]">
              {training.title}
            </h1>
            
            <p className="mt-4 text-lg text-slate-600 max-w-2xl">
              {training.description}
            </p>

            {/* Badges d'information */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {training.duration && (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                  <FaClock className="h-4 w-4 text-[#1E3A8A]" />
                  {training.duration}
                </span>
              )}
              {training.level && (
                <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-sm ${levelInfo.color}`}>
                  {levelInfo.icon}
                  {levelInfo.label}
                </span>
              )}
              {training.price && (
                <span className="inline-flex items-center gap-2 rounded-full bg-[#1E3A8A]/10 px-4 py-2 text-sm font-medium text-[#1E3A8A] shadow-sm">
                  <FaUserGraduate className="h-4 w-4" />
                  {training.price}
                </span>
              )}
            </div>
            
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/training"
                className="inline-flex items-center gap-2 text-sm text-[#1E3A8A] hover:text-[#F97316] transition"
              >
                <FaArrowLeft className="h-4 w-4" />
                Retour aux formations
              </Link>
              
              <span className="text-slate-300">|</span>
              
              <Link
                href={`/training/${training.slug}/register`}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#F97316] text-white font-medium rounded-full hover:bg-[#ea580c] transition hover:scale-105"
              >
                <FaUserPlus className="h-4 w-4" />
                S'inscrire maintenant
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Programme / Modules */}
      {training.modules && training.modules.length > 0 && (
        <section className="py-16 bg-white">
          <div className="mx-auto max-w-7xl px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#1E3A8A]">
                Programme de la formation
              </h2>
              <p className="mt-2 text-slate-500">
                Découvrez le contenu détaillé de cette formation
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {training.modules.map((module: string, index: number) => (
                <div
                  key={index}
                  className={`flex items-start gap-4 p-4 rounded-lg border ${color.border} ${color.hover} transition group`}
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${color.bg} ${color.text} font-bold flex-shrink-0`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <FaBookOpen className={`h-4 w-4 ${color.text}`} />
                      <span className="font-medium text-slate-700">{module}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Informations détaillées */}
      <section className="py-16 bg-[#F5F7FB]">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1E3A8A]">
              Informations pratiques
            </h2>
            <p className="mt-2 text-slate-500">
              Tout ce que vous devez savoir avant de vous inscrire
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Durée */}
            <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className={`inline-flex rounded-full ${color.bg} p-4 mb-4`}>
                <FaClock className={`h-8 w-8 ${color.text}`} />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Durée</h3>
              <p className="mt-2 text-sm text-slate-500">
                {training.duration || 'À définir'}
              </p>
            </div>

            {/* Niveau */}
            <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className={`inline-flex rounded-full ${color.bg} p-4 mb-4`}>
                <FaLevelUpAlt className={`h-8 w-8 ${color.text}`} />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Niveau</h3>
              <p className="mt-2 text-sm text-slate-500">
                {training.level || 'Tous niveaux'}
              </p>
            </div>

            {/* Prix */}
            <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className={`inline-flex rounded-full ${color.bg} p-4 mb-4`}>
                <FaUserGraduate className={`h-8 w-8 ${color.text}`} />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Tarif</h3>
              <p className="mt-2 text-sm text-slate-500">
                {training.price || 'Gratuit'}
              </p>
            </div>
          </div>

          {/* Schedule */}
          {training.schedule && (
            <div className="mt-8 p-6 bg-white rounded-xl shadow-sm border border-slate-200 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-3">
                <FaCalendarAlt className={`h-5 w-5 ${color.text}`} />
                <span className="text-slate-700">
                  <strong>Horaire :</strong> {training.schedule}
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Pourquoi suivre cette formation */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1E3A8A]">
              Pourquoi suivre cette formation ?
            </h2>
            <p className="mt-2 text-slate-500">
              Des compétences recherchées par les entreprises
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center p-6 bg-[#F5F7FB] rounded-xl border border-slate-200">
              <div className={`inline-flex rounded-full ${color.bg} p-4 mb-4`}>
                <FaChalkboardTeacher className={`h-8 w-8 ${color.text}`} />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Formation pratique</h3>
              <p className="mt-2 text-sm text-slate-500">
                Apprenez par la pratique avec des exercices concrets
              </p>
            </div>

            <div className="text-center p-6 bg-[#F5F7FB] rounded-xl border border-slate-200">
              <div className={`inline-flex rounded-full ${color.bg} p-4 mb-4`}>
                <FaCertificate className={`h-8 w-8 ${color.text}`} />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Certification</h3>
              <p className="mt-2 text-sm text-slate-500">
                Obtenez un certificat reconnu par les professionnels
              </p>
            </div>

            <div className="text-center p-6 bg-[#F5F7FB] rounded-xl border border-slate-200">
              <div className={`inline-flex rounded-full ${color.bg} p-4 mb-4`}>
                <FaCode className={`h-8 w-8 ${color.text}`} />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Technologies actuelles</h3>
              <p className="mt-2 text-sm text-slate-500">
                Apprenez les technologies les plus demandées du marché
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Autres formations */}
      {otherTrainings && otherTrainings.length > 0 && (
        <section className="py-16 bg-[#F5F7FB]">
          <div className="mx-auto max-w-7xl px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#1E3A8A]">
                Autres formations
              </h2>
              <p className="mt-2 text-slate-500">
                Découvrez nos autres programmes de formation
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {otherTrainings.map((other: Training) => {
                const otherColor = colorMap[other.color] || colorMap.blue;
                const otherLevel = levelMap[other.level] || levelMap['Tous niveaux'];
                
                return (
                  <Link
                    key={other.id}
                    href={`/training/${other.slug}`}
                    className="group p-6 bg-white rounded-xl border border-slate-200 hover:shadow-lg transition-all hover:-translate-y-1"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`inline-flex rounded-full ${otherColor.bg} p-3 flex-shrink-0`}>
                        <FaGraduationCap className={`h-6 w-6 ${otherColor.text}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-800 group-hover:text-[#F97316] transition line-clamp-1">
                          {other.title}
                        </h3>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {other.duration && (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                              <FaClock className="h-2.5 w-2.5" />
                              {other.duration}
                            </span>
                          )}
                          {other.level && (
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${otherLevel.color}`}>
                              {otherLevel.icon}
                              {otherLevel.label}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-slate-500 line-clamp-1">
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
                href="/training"
                className="inline-flex items-center gap-2 text-[#1E3A8A] hover:text-[#F97316] transition font-medium"
              >
                Voir toutes nos formations
                <FaArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Appel à l'action */}
      <section className="py-16 bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF]">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white">
            Prêt à commencer votre formation ?
          </h2>
          <p className="mt-4 text-white/80 max-w-2xl mx-auto">
            Inscrivez-vous dès maintenant et développez vos compétences techniques.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href={`/training/${training.slug}/register`}
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#F97316] text-white font-semibold rounded-xl hover:bg-[#ea580c] transition hover:scale-105"
            >
              <FaUserPlus className="h-5 w-5" />
              S'inscrire maintenant
            </Link>
            <Link
              href="/training"
              className="inline-flex items-center gap-2 px-8 py-3 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition backdrop-blur-sm"
            >
              Voir toutes les formations
              <FaArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}