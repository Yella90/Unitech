// components/public/AgentCard.tsx
'use client';

import { motion } from 'framer-motion';
import { FaCheckCircle } from 'react-icons/fa';

interface AgentCardProps {
  name: string;
  icon: React.ReactNode;  // ✅ Changer le type de IconType à ReactNode
  color: string;
  role: string;
  description: string;
  features: string[];
  stats: {
    [key: string]: string;
  };
}

export default function AgentCard({
  name,
  icon,
  color,
  role,
  description,
  features,
  stats
}: AgentCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto"
    >
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Avatar avec icône */}
        <div className="flex-shrink-0">
          <div
            className="w-24 h-24 rounded-2xl flex items-center justify-center text-white shadow-lg"
            style={{ backgroundColor: color }}
          >
            {icon}  {/* ✅ Afficher l'icône directement */}
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-[#1E3A8A]">{name}</h2>
            <span className="text-sm px-3 py-1 bg-slate-100 rounded-full text-slate-600">
              {role}
            </span>
          </div>
          <p className="text-slate-600 mb-4">{description}</p>

          {/* Features */}
          <div className="grid gap-2 sm:grid-cols-2 mb-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <FaCheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">{feature}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-200">
            {Object.entries(stats).map(([key, value]) => (
              <div key={key} className="text-center">
                <p className="text-xl font-bold text-[#1E3A8A]">{value}</p>
                <p className="text-xs text-slate-500 capitalize">{key}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}