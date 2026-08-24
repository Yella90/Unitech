// components/public/sections/Hero.tsx
'use client';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FaArrowRight, FaStar, FaComments, FaRobot } from "react-icons/fa";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useChat } from "@/contexts/ChatContext";

const TAGS = ['SaaS', 'IA', 'Domotique', 'Mécatronique', 'React', 'Node.js'];

// Animation des lignes de code
const codeLines = [
  'const innovate = () => {',
  '  return "Future ready";',
  '};',
  'class Unitech {',
  '  constructor() {',
  '    this.vision = "Smart Africa";',
  '  }',
  '}',
  'export default UNITECH;',
];

interface Particle {
  left: string;
  top: string;
  duration: number;
  delay: number;
}

export default function Hero() {
  const { openChat } = useChat();
  const [isMounted, setIsMounted] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  // ✅ Fonction pour ouvrir le chatbot via le contexte
  const handleOpenChat = () => {
    openChat();
  };

  useEffect(() => {
    setIsMounted(true);
    setParticles(
      Array.from({ length: 20 }, () => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        duration: 5 + Math.random() * 10,
        delay: Math.random() * 5,
      }))
    );
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1E3A8A] to-[#1E3A8A] min-h-[90vh] flex items-center">
      {/* Animation des lignes de code en arrière-plan */}
      <div className="absolute inset-0 opacity-10 overflow-hidden">
        <div className="absolute top-10 left-10 font-mono text-xs text-white/30 leading-8">
          {codeLines.map((line, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.3, duration: 0.5 }}
              className="whitespace-nowrap"
            >
              {line}
            </motion.div>
          ))}
        </div>
        <div className="absolute bottom-10 right-10 font-mono text-xs text-white/20 leading-8 text-right">
          {codeLines.slice().reverse().map((line, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.3 + 0.5, duration: 0.5 }}
              className="whitespace-nowrap"
            >
              {line}
            </motion.div>
          ))}
        </div>
        {/* Particules de code flottantes */}
        {isMounted && particles.map((particle, i) => (
          <motion.div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-[#F97316]"
            initial={{
              x: 0,
              y: 0,
              opacity: 0.2,
            }}
            animate={{
              y: [0, -100, 100, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
            }}
            style={{
              left: particle.left,
              top: particle.top,
            }}
            suppressHydrationWarning
          />
        ))}
      </div>

      {/* Effets de fond colorés */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-[#F97316] blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 h-80 w-80 rounded-full bg-blue-400 blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1E3A8A] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-20 text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm"
        >
          <FaStar className="h-3.5 w-3.5 text-[#F97316] animate-pulse" />
          Innovation en cours
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-6 max-w-4xl mx-auto text-4xl font-black leading-tight text-white md:text-5xl lg:text-6xl"
        >
          Bâtissons l'infrastructure
          <span className="block text-[#F97316]">intelligente de demain</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-6 max-w-2xl mx-auto text-sm text-slate-200 md:text-base lg:text-lg"
        >
          UNITECH développe des solutions SaaS innovantes pour l'éducation, le commerce local,
          et la gestion énergétique intelligente. Découvrez nos projets en cours de développement.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-6 flex flex-wrap justify-center gap-2"
        >
          {TAGS.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="border border-white/20 bg-white/10 text-white/80 hover:bg-white/20 transition-all hover:scale-105"
            >
              {tag}
            </Badge>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-8 flex flex-wrap justify-center gap-4"
        >
         

          <Button
            asChild
            className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold px-8 py-6 rounded-xl text-base hover:scale-105 transition-all border border-white/20"
          >
            <a href="/chat">
              Discuter avec HARVEY <span className="ml-2">Assistant</span>
              <FaArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>

         
        </motion.div>

        {/* ✅ Petit indicateur du chatbot */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-6 flex items-center justify-center gap-2 text-xs text-white/50"
        >
          <FaRobot className="h-3 w-3 text-[#F97316]" />
          <span>Ou cliquez sur le bouton orange pour parler à notre assistant IA 24/7</span>
        </motion.div>
      </div>
    </section>
  );
}