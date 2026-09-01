// app/layout.tsx
import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Tracker from "@/components/public/Tracker";
import { cn } from "@/lib/utils";
import ChatButton from "@/components/public/ChatButton";
import { ChatProvider } from "@/contexts/ChatContext";
import { headers } from 'next/headers'; // ✅ Ajout

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
    const stopDona = initDonaService({ 
      interval: 60000,
      onError: (error) => {
        console.error('❌ Erreur DONA:', error);
      }
    });
    
    const stopHarvey = initHarveyService({ 
      interval: 120000,
      onError: (error) => {
        console.error('❌ Erreur HARVEY:', error);
      }
    });
    
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

export default async function RootLayout({  // ✅ Ajouter 'async'
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // ✅ Utiliser await avec headers()
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  const isChatPage = pathname === '/chat';
console.log('🔍 Layout - Chemin actuel:', pathname, 'Is Chat Page:', isChatPage);
  return (
    <html lang="fr" className={cn("font-sans", geist.variable)}>
      <body className={`${inter.className} bg-[#F5F7FB] min-h-screen flex flex-col`}>
        <ChatProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Tracker />
          {/* ✅ Condition pour afficher ou non le footer */}
          {!isChatPage && <Footer />}
          <ChatButton />
        </ChatProvider>
      </body>
    </html>
  );
}