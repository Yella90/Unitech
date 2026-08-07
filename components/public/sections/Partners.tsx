// components/sections/Partners.tsx
'use client';

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { FaHandshake, FaSolarPanel, FaBuilding, FaUniversity, FaIndustry, FaRobot } from "react-icons/fa";
import { GiElectric, GiGears } from "react-icons/gi";

const partners = [
  {
    name: "Solaire Plus Mali",
    description: "Installation et maintenance de systèmes solaires pour les bâtiments résidentiels et commerciaux.",
    icon: <FaSolarPanel className="h-8 w-8 text-[#F97F51]" />,
    type: "Partenaire Technique",
    domain: "⚡ Énergie Solaire",
    color: "from-yellow-50 to-yellow-100 border-yellow-200"
  },
  {
    name: "Mali Robotique",
    description: "Conception et fabrication de systèmes robotiques pour l'industrie et la formation.",
    icon: <FaRobot className="h-8 w-8 text-[#00B894]" />,
    type: "Partenaire Technique",
    domain: "🤖 Robotique",
    color: "from-green-50 to-green-100 border-green-200"
  },
  {
    name: "GreenTech Énergie",
    description: "Solutions d'énergies renouvelables et efficacité énergétique pour les entreprises.",
    icon: <GiElectric className="h-8 w-8 text-[#FDCB6E]" />,
    type: "Collaborateur",
    domain: "⚡ Énergie",
    color: "from-amber-50 to-amber-100 border-amber-200"
  },
  {
    name: "Institut Polytechnique",
    description: "Partenariat recherche et développement en mécatronique et intelligence artificielle.",
    icon: <FaUniversity className="h-8 w-8 text-[#0984E3]" />,
    type: "Partenariat Académique",
    domain: "🎓 Recherche & Formation",
    color: "from-blue-50 to-blue-100 border-blue-200"
  },
  {
    name: "Industrie Automatisée SA",
    description: "Automatisation industrielle et systèmes de contrôle pour les usines.",
    icon: <FaIndustry className="h-8 w-8 text-[#E17055]" />,
    type: "Partenaire Industriel",
    domain: "🏭 Automatisation",
    color: "from-red-50 to-red-100 border-red-200"
  },
  {
    name: "Mécatronique Africa",
    description: "Intégration de systèmes mécatroniques pour la domotique et l'industrie.",
    icon: <GiGears className="h-8 w-8 text-[#6C5CE7]" />,
    type: "Collaborateur",
    domain: "⚙️ Mécatronique",
    color: "from-purple-50 to-purple-100 border-purple-200"
  }
];

export default function Partners() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-[#1E3A8A]/10 px-4 py-1.5 text-sm font-medium text-[#1E3A8A]">
          <FaHandshake className="h-4 w-4" />
          Nos Partenaires
        </div>
        <h2 className="mt-4 text-3xl font-black text-[#1E3A8A] md:text-4xl">
          Collaborations & Partenariats
        </h2>
        <p className="mt-2 text-slate-600 max-w-2xl mx-auto">
          Nous collaborons avec des entreprises et institutions de confiance pour offrir des solutions complètes et intégrées.
        </p>
      </motion.div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {partners.map((partner, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
          >
            <Card className={`border-2 bg-gradient-to-br ${partner.color} hover:shadow-xl transition-all h-full`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm flex-shrink-0">
                    {partner.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{partner.name}</h3>
                    <p className="text-xs font-medium text-[#1E3A8A]">{partner.type}</p>
                    <p className="text-xs text-slate-500 mt-1">{partner.domain}</p>
                    <p className="mt-2 text-sm text-slate-600">{partner.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Bannière de collaboration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        viewport={{ once: true }}
        className="mt-12 rounded-2xl bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] p-8 text-center text-white"
      >
        <h3 className="text-2xl font-bold">Vous souhaitez collaborer avec nous ?</h3>
        <p className="mt-2 text-white/80">
          Rejoignez notre réseau de partenaires pour construire ensemble les solutions de demain.
        </p>
        <a
          href="/contact"
          className="mt-4 inline-block rounded-xl bg-[#F97316] px-6 py-3 font-semibold text-white hover:bg-[#ea580c] transition hover:scale-105"
        >
          Devenir partenaire →
        </a>
      </motion.div>
    </section>
  );
}