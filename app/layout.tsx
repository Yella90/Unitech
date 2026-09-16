// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Tracker from "@/components/public/Tracker";
import { cn } from "@/lib/utils";
import ChatButton from "@/components/public/ChatButton";
import { ChatProvider } from "@/contexts/ChatContext";
import { headers } from 'next/headers';

// ✅ Imports des agents existants
import { initDonaService } from '@/lib/agents/dona/auto-start';
import { initHarveyService } from '@/lib/agents/harvey/auto-start';

// ✅ Import de Harvey V2
import { initHarveyV2Service } from '@/lib/agents/harvey-v2/auto-start';

// ✅ NOUVEAU : Import du service de sync IMAP
import { initImapSyncService } from '@/lib/agents/imap-sync/auto-start';

const geist = Geist({ 
  subsets: ['latin'], 
  variable: '--font-sans',
  display: 'swap',
});

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://unitech.com'),
  title: {
    default: "UNITECH - Solutions technologiques",
    template: "%s | UNITECH"
  },
  description: "UNITECH développe des solutions SaaS innovantes pour l'éducation, le commerce local et la gestion énergétique intelligente.",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [{ url: '/apple-touch-icon.png' }],
    shortcut: ['/favicon.ico'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#1E3A8A',
  colorScheme: 'light',
};

// ✅ Forcer le rendu dynamique pour éviter l'erreur
export const dynamic = 'force-dynamic';

// ✅ Démarrer les agents au chargement du serveur
if (typeof window === 'undefined') {
  try {
    console.log('🚀 Démarrage des agents IA...');
    
    
    
    
    
    // 3. ✅ Démarrer HARVEY V2 (nouvelle version)
    const stopHarveyV2 = initHarveyV2Service({
      interval: 120000, // 2 minutes
      onError: (error) => {
        console.error('❌ Erreur HARVEY V2:', error);
      },
      onProcess: (result) => {
        console.log(`📊 HARVEY V2: ${result.processed} emails traités pour client ${result.clientId}`);
      }
    });

    // 4. ✅ NOUVEAU : Démarrer le service de sync IMAP
    const stopImapSync = initImapSyncService({
      interval: 5 * 60 * 1000, // 5 minutes
      onError: (error) => {
        console.error('❌ Erreur Sync IMAP:', error);
      },
      onSync: (result) => {
        if (result.emailsSaved > 0) {
          console.log(
            `📧 Sync IMAP: ${result.emailsSaved} emails récupérés ` +
            `(${result.accounts} comptes, ${result.errors} erreurs)`
          );
        }
      }
    });
    
    // Fonction de nettoyage globale
    const cleanup = () => {
      console.log('🛑 Arrêt des agents...');
      if (stopHarveyV2) stopHarveyV2();
      if (stopImapSync) stopImapSync();
      console.log('✅ Agents arrêtés');
    };
    
    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);
    process.on('beforeExit', cleanup);
    
    console.log('✅ DONA, HARVEY (v1), HARVEY V2 et SYNC IMAP initialisés avec succès');
  } catch (error) {
    console.error('❌ Erreur initialisation des agents:', error);
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // ✅ Récupérer le pathname pour le footer conditionnel
  let isChatPage = false;
  try {
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') || '';
    isChatPage = pathname === '';
  } catch (error) {
    console.error('❌ Erreur récupération headers:', error);
  }

  return (
    <html 
      lang="fr" 
      className={cn(
        "font-sans antialiased", 
        geist.variable,
        inter.variable
      )}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://sagvtnbbbdrfuoqxnplf.supabase.co" />
        <meta name="theme-color" content="#1E3A8A" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body 
        className={cn(
          `${inter.className} bg-[#F5F7FB] min-h-screen flex flex-col`,
          "selection:bg-[#1E3A8A] selection:text-white"
        )}
        suppressHydrationWarning
      >
        <ChatProvider>
          <a 
            href="#main-content" 
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:p-4 focus:rounded-lg focus:shadow-lg"
          >
            Passer au contenu principal
          </a>
          
          <Header />
          
          <main id="main-content" className="flex-1">
            {children}
          </main>
          
          <Tracker />
          
          {isChatPage && <Footer />}
          
          <ChatButton />
        </ChatProvider>
      </body>
    </html>
  );
}