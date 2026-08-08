// app/layout.tsx
import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Tracker from "@/components/public/Tracker";
import { cn } from "@/lib/utils";
import { initDonaService } from '@/lib/dona/auto-start';

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "UNITECH - Solutions technologiques",
  description: "UNITECH développe des solutions SaaS innovantes pour l'éducation, le commerce local et la gestion énergétique.",
  icons: {
    icon: "/favicon.ico",
  },
};
// ✅ Démarrer DONA au chargement du serveur
// Ce code s'exécute côté serveur uniquement
if (typeof window === 'undefined') {
  try {
    initDonaService();
    console.log('✅ DONA initialisé avec succès');
  } catch (error) {
    console.error('❌ Erreur initialisation DONA:', error);
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