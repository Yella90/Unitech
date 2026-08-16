// app/(public)/training/[slug]/register/page.tsx
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft, FaGraduationCap, FaClock, FaLevelUpAlt, FaUserGraduate, FaCode } from 'react-icons/fa';
import TrainingRegistrationForm from '@/components/public/forms/TrainingRegistrationForm';
import { Metadata } from 'next';

type Training = {
  id: string;
  title: string;
  description: string;
  slug: string;
  duration: string;
  level: string;
  price: string;
  modules: string[];
  color: string;
  icon: string;
};

// ✅ Métadonnées
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = await params;

  try {
    const { data: training } = await supabase
      .from('trainings')
      .select('title, description')
      .eq('slug', slug)
      .single();

    if (!training) {
      return {
        title: 'Inscription - UNITECH',
        description: 'Inscrivez-vous à une formation UNITECH'
      };
    }

    return {
      title: `Inscription à ${training.title} - UNITECH`,
      description: training.description || `Inscrivez-vous à la formation ${training.title}`,
    };
  } catch (error) {
    return {
      title: 'Inscription - UNITECH',
      description: 'Inscrivez-vous à une formation UNITECH'
    };
  }
}

export default async function TrainingRegistrationPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;

  // Récupérer la formation
  const { data: training, error } = await supabase
    .from('trainings')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !training) {
    notFound();
  }

  const levelColors: Record<string, string> = {
    'Débutant': 'bg-green-100 text-green-700',
    'Intermédiaire': 'bg-blue-100 text-blue-700',
    'Avancé': 'bg-red-100 text-red-700',
    'Expert': 'bg-purple-100 text-purple-700',
  };

  const levelColor = levelColors[training.level] || 'bg-gray-100 text-gray-700';
  const colorMap: Record<string, string> = {
    blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-600',
    orange: 'from-orange-50 to-orange-100 border-orange-200 text-orange-600',
    green: 'from-green-50 to-green-100 border-green-200 text-green-600',
    purple: 'from-purple-50 to-purple-100 border-purple-200 text-purple-600',
    red: 'from-red-50 to-red-100 border-red-200 text-red-600',
    teal: 'from-teal-50 to-teal-100 border-teal-200 text-teal-600',
    indigo: 'from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-600',
    yellow: 'from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-600',
  };

  const colorClass = colorMap[training.color] || colorMap.blue;

  return (
    <main className="min-h-screen bg-[#F5F7FB] py-8 sm:py-12 md:py-16">
      <div className="mx-auto max-w-4xl px-4">
        {/* Navigation */}
        <Link
          href={`/training/${training.slug}`}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#1E3A8A] transition mb-6"
        >
          <FaArrowLeft className="h-4 w-4" />
          Retour à la formation
        </Link>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Formulaire */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              {/* En-tête du formulaire */}
              <div className={`bg-gradient-to-r ${colorClass} px-6 py-8 text-[#1E3A8A]`}>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <FaUserGraduate className="h-6 w-6" />
                  Inscription à la formation
                </h1>
                <p className="mt-1 text-slate-600 text-sm">
                  Remplissez le formulaire ci-dessous pour vous inscrire
                </p>
              </div>

              <div className="p-6">
                <TrainingRegistrationForm trainingId={training.id} trainingTitle={training.title} />
              </div>
            </div>
          </div>

          {/* Informations de la formation */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden sticky top-6">
              <div className="p-6">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{training.icon || '📚'}</span>
                  <div>
                    <h2 className="text-xl font-bold text-[#1E3A8A]">{training.title}</h2>
                    <p className="text-sm text-slate-500 mt-1">{training.description}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-3 text-sm">
                    <FaClock className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">Durée : <strong>{training.duration}</strong></span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <FaLevelUpAlt className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">Niveau : <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${levelColor}`}>{training.level}</span></span>
                  </div>
                  {training.price && (
                    <div className="flex items-center gap-3 text-sm">
                      <FaUserGraduate className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-600">Prix : <strong>{training.price}</strong></span>
                    </div>
                  )}
                </div>

                {training.modules && training.modules.length > 0 && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Modules :</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {training.modules.slice(0, 4).map((module: string, idx: number) => (
                        <span
                          key={`${module}-${idx}`}
                          className="inline-block rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
                        >
                          <FaCode className="inline mr-1 h-2.5 w-2.5" />
                          {module}
                        </span>
                      ))}
                      {training.modules.length > 4 && (
                        <span className="text-xs text-slate-400">+{training.modules.length - 4} autres</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-4 border-t border-slate-100 pt-4">
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                    <p className="text-xs text-blue-700 flex items-start gap-2">
                      <span className="text-lg">ℹ️</span>
                      <span>Une confirmation vous sera envoyée par email après votre inscription.</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}