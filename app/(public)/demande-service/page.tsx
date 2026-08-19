// app/(public)/demande-service/page.tsx
import { supabase } from '@/lib/supabase';
import { Metadata } from 'next';
import Link from 'next/link';
import { FaArrowLeft, FaCheckCircle, FaClock, FaUserCheck } from 'react-icons/fa';
import ServiceRequestForm from '@/components/public/forms/ServiceRequestForm';

export const metadata: Metadata = {
  title: 'Demander un service - UNITECH',
  description: 'Faites une demande de service personnalisée auprès de UNITECH. Nous vous répondrons dans les plus brefs délais.',
};

// ✅ Fonction pour récupérer les services avec gestion d'erreur
async function getServices() {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('id, name, slug, icon, color')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('❌ Erreur chargement services:', error);
      return []; // ✅ Toujours retourner un tableau
    }
    return data || []; // ✅ Toujours retourner un tableau
  } catch (error) {
    console.error('❌ Erreur chargement services:', error);
    return []; // ✅ Toujours retourner un tableau
  }
}

// ✅ Composant principal avec gestion du cas où services est undefined
export default async function ServiceRequestPage() {
  const services = await getServices();

  return (
    <main className="min-h-screen bg-[#F5F7FB] py-8 sm:py-12 md:py-16">
      <div className="mx-auto max-w-4xl px-4">
        {/* Lien retour */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#1E3A8A] hover:text-[#F97316] transition mb-6"
        >
          <FaArrowLeft className="h-4 w-4" />
          Retour à l'accueil
        </Link>

        {/* En-tête */}
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#1E3A8A]">
            Demander un service
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            Remplissez ce formulaire pour nous faire part de votre besoin. 
            Nous vous répondrons dans les plus brefs délais.
          </p>
        </div>

        {/* Étapes */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8 sm:mb-10">
          <div className="text-center">
            <div className="flex items-center justify-center">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-[#1E3A8A] text-white text-sm sm:text-base font-bold">
                1
              </div>
            </div>
            <p className="mt-2 text-[10px] sm:text-xs font-medium text-[#1E3A8A]">Choisissez</p>
            <p className="text-[8px] sm:text-[10px] text-slate-400">Sélectionnez un service</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-[#F97316] text-white text-sm sm:text-base font-bold">
                2
              </div>
            </div>
            <p className="mt-2 text-[10px] sm:text-xs font-medium text-[#F97316]">Décrivez</p>
            <p className="text-[8px] sm:text-[10px] text-slate-400">Expliquez votre besoin</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-green-600 text-white text-sm sm:text-base font-bold">
                3
              </div>
            </div>
            <p className="mt-2 text-[10px] sm:text-xs font-medium text-green-600">Envoyez</p>
            <p className="text-[8px] sm:text-[10px] text-slate-400">Nous vous répondrons</p>
          </div>
        </div>

        {/* Formulaire - Passage des services même si vide */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8">
          <ServiceRequestForm services={services || []} />
        </div>

        {/* Informations complémentaires */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm border border-slate-200">
            <FaClock className="h-5 w-5 text-[#1E3A8A] flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Délai de réponse</h3>
              <p className="text-xs text-slate-500">Nous vous répondons sous 24 à 48 heures</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm border border-slate-200">
            <FaUserCheck className="h-5 w-5 text-[#1E3A8A] flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Suivi personnalisé</h3>
              <p className="text-xs text-slate-500">Un expert vous accompagne dans votre projet</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}