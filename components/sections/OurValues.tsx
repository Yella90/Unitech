// components/sections/OurValues.tsx
'use client';

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { 
    FaGraduationCap,
  FaLightbulb, 
  FaShieldAlt, 
  FaHandsHelping, 
  FaRocket, 
  FaUsers, 
  FaLeaf 
} from "react-icons/fa";

const values = [
  {
    icon: <FaLightbulb className="h-6 w-6 text-[#F97316]" />,
    title: "Innovation",
    description: "Nous repoussons les limites de la technologie pour créer des solutions uniques et adaptées.",
    color: "border-orange-200 hover:border-orange-400"
  },
  // components/sections/OurValues.tsx - Ajouter cette valeur
{
  icon: <FaGraduationCap className="h-6 w-6 text-indigo-600" />,
  title: "Transmission",
  description: "Former la prochaine génération de techniciens et développeurs africains.",
  color: "border-indigo-200 hover:border-indigo-400"
}
  ,

  {
    icon: <FaShieldAlt className="h-6 w-6 text-[#1E3A8A]" />,
    title: "Fiabilité",
    description: "Des systèmes robustes et sécurisés pour une confiance durable avec nos clients.",
    color: "border-blue-200 hover:border-blue-400"
  },
  {
    icon: <FaHandsHelping className="h-6 w-6 text-[#10B981]" />,
    title: "Impact Local",
    description: "Des solutions qui répondent aux besoins et réalités du marché africain.",
    color: "border-green-200 hover:border-green-400"
  },
  {
    icon: <FaRocket className="h-6 w-6 text-purple-600" />,
    title: "Performance",
    description: "Des technologies optimisées pour des résultats tangibles et mesurables.",
    color: "border-purple-200 hover:border-purple-400"
  },
  {
    icon: <FaUsers className="h-6 w-6 text-red-500" />,
    title: "Collaboration",
    description: "Une approche participative avec nos clients et partenaires pour co-créer des solutions.",
    color: "border-red-200 hover:border-red-400"
  },
  {
    icon: <FaLeaf className="h-6 w-6 text-emerald-600" />,
    title: "Durabilité",
    description: "Des solutions écologiques et économes en énergie pour un avenir durable.",
    color: "border-emerald-200 hover:border-emerald-400"
  }
];

export default function OurValues() {
  return (
    <section className="bg-[#F5F7FB] py-16">
      <div className="mx-auto max-w-7xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl font-black text-[#1E3A8A] md:text-4xl">
            Nos Valeurs
          </h2>
          <p className="mt-2 text-slate-600 max-w-2xl mx-auto">
            Les principes qui guident notre travail et notre engagement envers nos clients.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {values.map((value, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
            >
              <Card className={`border-2 ${value.color} transition-all hover:shadow-xl`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                      {value.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{value.title}</h3>
                      <p className="text-sm text-slate-600">{value.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}