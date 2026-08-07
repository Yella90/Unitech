// components/sections/Training.tsx
'use client';

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FaGraduationCap, 
  FaLaptopCode, 
  FaMicrochip, 
  FaRobot, 
  FaBolt, 
  FaBrain,
  FaCertificate,
  FaUsers,
  FaChalkboardTeacher,
  FaTools
} from "react-icons/fa";

const trainingPrograms = [
  {
    icon: <FaLaptopCode className="h-8 w-8 text-[#1E3A8A]" />,
    title: "Développement Web & Mobile",
    description: "Formation complète au développement d'applications web et mobiles avec les technologies modernes (React, Next.js, Node.js).",
    duration: "6 mois",
    level: "Débutant à Avancé",
    color: "from-blue-50 to-blue-100 border-blue-200"
  },
  {
    icon: <FaMicrochip className="h-8 w-8 text-[#F97316]" />,
    title: "Électronique & Mécatronique",
    description: "Initiation à l'électronique, la conception de circuits, et les systèmes mécatroniques avec Arduino et Raspberry Pi.",
    duration: "4 mois",
    level: "Débutant",
    color: "from-orange-50 to-orange-100 border-orange-200"
  },
  {
    icon: <FaRobot className="h-8 w-8 text-[#10B981]" />,
    title: "Robotique & Automatisation",
    description: "Conception et programmation de robots, systèmes automatisés et intelligence embarquée.",
    duration: "6 mois",
    level: "Intermédiaire",
    color: "from-green-50 to-green-100 border-green-200"
  },
  {
    icon: <FaBrain className="h-8 w-8 text-purple-600" />,
    title: "Intelligence Artificielle & Data",
    description: "Introduction à l'IA, au machine learning et à l'analyse de données avec Python et TensorFlow.",
    duration: "6 mois",
    level: "Intermédiaire à Avancé",
    color: "from-purple-50 to-purple-100 border-purple-200"
  },
  {
    icon: <FaBolt className="h-8 w-8 text-yellow-600" />,
    title: "Énergie & Domotique",
    description: "Systèmes d'énergie solaire, domotique, IoT et gestion intelligente de l'énergie.",
    duration: "4 mois",
    level: "Débutant",
    color: "from-yellow-50 to-yellow-100 border-yellow-200"
  },
  {
    icon: <FaTools className="h-8 w-8 text-red-600" />,
    title: "Maintenance & Support Technique",
    description: "Maintenance informatique, électronique et support technique pour équipements industriels.",
    duration: "3 mois",
    level: "Débutant",
    color: "from-red-50 to-red-100 border-red-200"
  }
];

const trainingFeatures = [
  {
    icon: <FaChalkboardTeacher className="h-6 w-6 text-[#1E3A8A]" />,
    title: "Formation Théorique & Pratique",
    description: "Cours en salle et ateliers pratiques pour une maîtrise complète."
  },
  {
    icon: <FaCertificate className="h-6 w-6 text-[#F97316]" />,
    title: "Certification",
    description: "Attestation de formation reconnue à la fin de chaque programme."
  },
  {
    icon: <FaUsers className="h-6 w-6 text-[#10B981]" />,
    title: "Encadrement Personnalisé",
    description: "Suivi individuel et mentorat pour chaque apprenant."
  }
];

export default function Training() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 bg-[#F5F7FB] rounded-3xl my-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-[#1E3A8A]/10 px-4 py-1.5 text-sm font-medium text-[#1E3A8A]">
          <FaGraduationCap className="h-4 w-4" />
          Formation & Transmission
        </div>
        <h2 className="mt-4 text-3xl font-black text-[#1E3A8A] md:text-4xl">
          Formez-vous aux technologies de demain
        </h2>
        <p className="mt-2 text-slate-600 max-w-2xl mx-auto">
          UNITECH propose des formations théoriques et pratiques pour initier les jeunes 
          aux métiers de la technologie, du développement à la robotique en passant par l'IA.
        </p>
      </motion.div>

      {/* Programmes de formation */}
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {trainingPrograms.map((program, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
          >
            <Card className={`border-2 bg-gradient-to-br ${program.color} hover:shadow-xl transition-all h-full`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                    {program.icon}
                  </div>
                  <div>
                    <span className="text-xs font-medium text-[#1E3A8A]">{program.duration}</span>
                    <p className="text-xs text-slate-500">{program.level}</p>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-800">{program.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{program.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Caractéristiques de la formation */}
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {trainingFeatures.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1E3A8A]/10">
              {feature.icon}
            </div>
            <div>
              <h4 className="font-semibold text-slate-800">{feature.title}</h4>
              <p className="text-sm text-slate-500">{feature.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        viewport={{ once: true }}
        className="mt-12 text-center"
      >
        <Button
          asChild
          className="bg-[#F97316] hover:bg-[#ea580c] text-white font-semibold px-8 py-6 rounded-xl text-base hover:scale-105 transition-all"
        >
          <a href="/training">
            Découvrir nos formations
            <FaGraduationCap className="ml-2 h-5 w-5" />
          </a>
        </Button>
        <p className="mt-3 text-sm text-slate-500">
          Des sessions sont organisées tout au long de l'année. Inscriptions ouvertes.
        </p>
      </motion.div>
    </section>
  );
}