// app/(public)/agents/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import { 
  FaBrain, 
  FaRobot, 
  FaArrowRight, 
  FaCheckCircle, 
  FaRocket, 
  FaShieldAlt 
} from 'react-icons/fa';
import AgentCard from '@/components/public/AgentCard';

export const metadata: Metadata = {
  title: 'Agents IA - UNITECH',
  description: 'Découvrez les agents IA de UNITECH : DONA et HARVEY, nos assistants intelligents pour vos besoins.',
};

// ✅ Les icônes sont passées comme JSX, pas comme fonctions
export default function AgentsPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      {/* Hero */}
      <section className="py-16 bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] text-white">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FaBrain className="h-8 w-8 text-[#F97316]" />
            <h1 className="text-4xl md:text-5xl font-black">Nos Agents IA</h1>
          </div>
          <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
            Découvrez DONA et HARVEY, les deux agents intelligents qui propulsent UNITECH.
          </p>
        </div>
      </section>

      {/* DONA */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <AgentCard
            name="DONA"
            icon={<FaBrain className="h-12 w-12" />}  // ✅ Passer le JSX
            color="#8B5CF6"
            role="Agent de Classification"
            description="DONA est l'agent responsable de l'analyse et de la catégorisation automatique de toutes les demandes entrantes."
            features={[
              'Analyse sémantique des messages',
              'Classification automatique (support, commercial, projet, etc.)',
              "Détection de l'urgence et de la priorité",
              'Routage intelligent vers les bons agents',
              'Apprentissage continu des interactions'
            ]}
            stats={{
              precision: '95%',
              tempsMoyen: '150ms',
              categories: '12+',
              traites: '10K+'
            }}
          />
        </div>
      </section>

      {/* HARVEY */}
      <section className="py-16 bg-[#F5F7FB]">
        <div className="mx-auto max-w-7xl px-4">
          <AgentCard
            name="HARVEY"
            icon={<FaRobot className="h-12 w-12" />}  // ✅ Passer le JSX
            color="#F97316"
            role="Agent de Réponse"
            description="HARVEY est l'agent intelligent qui génère des réponses personnalisées et pertinentes pour chaque demande."
            features={[
              'Génération de réponses contextuelles',
              'Adaptation du ton (professionnel, amical, technique)',
              "Intégration des connaissances de l'entreprise",
              'Fallback automatique entre plusieurs providers IA',
              'Apprentissage des préférences utilisateur'
            ]}
            stats={{
              rapidite: '2s',
              precision: '92%',
              langues: '5+',
              reponses: '15K+'
            }}
          />
        </div>
      </section>

      {/* Synergie */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h2 className="text-3xl font-bold text-[#1E3A8A] mb-4">Une Synergie Parfaite</h2>
          <p className="text-slate-600 max-w-2xl mx-auto mb-8">
            DONA et HARVEY travaillent en tandem pour vous offrir une expérience fluide et efficace.
          </p>
          <div className="grid gap-6 md:grid-cols-3 max-w-3xl mx-auto">
            <div className="bg-[#F5F7FB] rounded-xl p-6">
              <FaCheckCircle className="h-8 w-8 text-[#8B5CF6] mx-auto mb-3" />
              <h3 className="font-semibold text-slate-800">1. Analyse</h3>
              <p className="text-sm text-slate-500">DONA analyse et catégorise votre demande</p>
            </div>
            <div className="bg-[#F5F7FB] rounded-xl p-6">
              <FaRocket className="h-8 w-8 text-[#F97316] mx-auto mb-3" />
              <h3 className="font-semibold text-slate-800">2. Traitement</h3>
              <p className="text-sm text-slate-500">HARVEY génère une réponse personnalisée</p>
            </div>
            <div className="bg-[#F5F7FB] rounded-xl p-6">
              <FaShieldAlt className="h-8 w-8 text-[#1E3A8A] mx-auto mb-3" />
              <h3 className="font-semibold text-slate-800">3. Réponse</h3>
              <p className="text-sm text-slate-500">Vous recevez une réponse précise et utile</p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1E3A8A] text-white font-semibold rounded-xl hover:bg-[#1A2F6A] transition"
            >
              Expérimenter nos agents
              <FaArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/demande-service"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#F97316] text-white font-semibold rounded-xl hover:bg-[#ea580c] transition"
            >
              Demander un service
              <FaArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}