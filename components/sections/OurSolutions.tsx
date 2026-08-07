// components/sections/OurSolutions.tsx
'use client';

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { FaGraduationCap, FaStore, FaBolt, FaBrain, FaCogs, FaChartLine } from "react-icons/fa";

const solutions = [
  {
    icon: <FaGraduationCap className="h-8 w-8 text-[#1E3A8A]" />,
    title: "SaaS Scolaire",
    description: "Gestion complète des établissements scolaires : élèves, notes, paiements, statistiques en temps réel.",
    color: "from-blue-50 to-blue-100 border-blue-200",
    iconBg: "bg-blue-100"
  },
  {
    icon: <FaStore className="h-8 w-8 text-[#F97316]" />,
    title: "SaaS Commerce",
    description: "Plateforme de gestion pour commerçants locaux : stocks, ventes, clients, facturation automatisée.",
    color: "from-orange-50 to-orange-100 border-orange-200",
    iconBg: "bg-orange-100"
  },
  {
    icon: <FaBolt className="h-8 w-8 text-[#10B981]" />,
    title: "Domotique Énergétique",
    description: "Système intelligent de gestion énergétique avec IA, panneaux solaires et facturation automatique.",
    color: "from-green-50 to-green-100 border-green-200",
    iconBg: "bg-green-100"
  },
  {
    icon: <FaBrain className="h-8 w-8 text-purple-600" />,
    title: "IA & Automatisation",
    description: "Solutions d'intelligence artificielle pour l'optimisation énergétique et la gestion client.",
    color: "from-purple-50 to-purple-100 border-purple-200",
    iconBg: "bg-purple-100"
  },
  {
    icon: <FaCogs className="h-8 w-8 text-red-600" />,
    title: "Mécatronique",
    description: "Conception de systèmes mécatroniques pour l'automatisation industrielle et la domotique.",
    color: "from-red-50 to-red-100 border-red-200",
    iconBg: "bg-red-100"
  },
  {
    icon: <FaChartLine className="h-8 w-8 text-indigo-600" />,
    title: "Data Analytics",
    description: "Analyse de données et tableaux de bord pour une prise de décision éclairée.",
    color: "from-indigo-50 to-indigo-100 border-indigo-200",
    iconBg: "bg-indigo-100"
  }
];

export default function OurSolutions() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-center"
      >
        <h2 className="text-3xl font-black text-[#1E3A8A] md:text-4xl">
          Nos Solutions
        </h2>
        <p className="mt-2 text-slate-600 max-w-2xl mx-auto">
          Des solutions innovantes qui allient le digital et le physique pour répondre aux défis technologiques d'aujourd'hui.
        </p>
      </motion.div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {solutions.map((solution, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.03 }}
          >
            <Card className={`border-2 bg-gradient-to-br ${solution.color} hover:shadow-xl transition-all h-full`}>
              <CardContent className="p-6 text-center">
                <div className={`inline-flex rounded-full ${solution.iconBg} p-3 mb-4`}>
                  {solution.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-800">{solution.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{solution.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}