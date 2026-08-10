// app/layout.tsx - Version avec DONA + HARVEY
import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Tracker from "@/components/public/Tracker";
import { cn } from "@/lib/utils";
// ✅ Imports des deux agents
import { initDonaService } from '@/lib/agents/dona/auto-start';
import { initHarveyService } from '@/lib/agents/harvey/auto-start';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "UNITECH - Solutions technologiques",
  description: "UNITECH développe des solutions SaaS innovantes pour l'éducation, le commerce local et la gestion énergétique.",
  icons: {
    icon: "/favicon.ico",
  },
};

// ✅ Démarrer les agents au chargement du serveur
if (typeof window === 'undefined') {
  try {
    // 1. DONA - Classification (toutes les 60 secondes)
    const stopDona = initDonaService({ 
      interval: 60000,
      onError: (error) => {
        console.error('❌ Erreur DONA:', error);
      }
    });
    
    // 2. HARVEY - Réponse (toutes les 120 secondes)
    const stopHarvey = initHarveyService({ 
      interval: 120000,
      onError: (error) => {
        console.error('❌ Erreur HARVEY:', error);
      }
    });
    
    // Nettoyage à l'arrêt
    process.on('SIGTERM', () => {
      if (stopDona) stopDona();
      if (stopHarvey) stopHarvey();
      console.log('🛑 Agents arrêtés');
    });
    process.on('SIGINT', () => {
      if (stopDona) stopDona();
      if (stopHarvey) stopHarvey();
      console.log('🛑 Agents arrêtés');
    });
    
    console.log('✅ DONA et HARVEY initialisés avec succès');
  } catch (error) {
    console.error('❌ Erreur initialisation des agents:', error);
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={cn("font-sans", geist.variable)}>
      <body className={`${inter.className} bg-[#F5F7FB] min-h-screen flex flex-col`}>
        <Header />
        <main className="flex-1">{children}</main>
        <Tracker />
        <Footer />
      </body>
    </html>
  );
}