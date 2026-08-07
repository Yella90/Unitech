// components/sections/Stats.tsx
'use client';

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { FaProjectDiagram, FaUsers, FaRocket, FaAward } from "react-icons/fa";

const stats = [
  {
    icon: <FaProjectDiagram className="h-8 w-8 text-[#1E3A8A]" />,
    number: 3,
    label: "Projets en développement",
    suffix: "+"
  },
  {
    icon: <FaUsers className="h-8 w-8 text-[#F97316]" />,
    number: 12,
    label: "Membres dans l'équipe",
    suffix: ""
  },
  {
    icon: <FaRocket className="h-8 w-8 text-[#10B981]" />,
    number: 2,
    label: "SaaS en production",
    suffix: ""
  },
  {
    icon: <FaAward className="h-8 w-8 text-purple-600" />,
    number: 5,
    label: "Solutions innovantes",
    suffix: "+"
  }
];

export default function Stats() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section ref={ref} className="mx-auto max-w-7xl px-4 py-16">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.6, delay: index * 0.15 }}
            className="bg-white rounded-2xl p-6 text-center shadow-lg border border-slate-100"
          >
            <div className="flex justify-center mb-3">{stat.icon}</div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.8, delay: index * 0.15 + 0.3 }}
              className="text-4xl font-black text-[#1E3A8A]"
            >
              {stat.number}{stat.suffix}
            </motion.div>
            <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}