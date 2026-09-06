// app/(client)/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Toaster } from 'sonner';
import Link from 'next/link';
import { 
  FaUser, 
  FaSignOutAlt, 
  FaHome, 
  FaUserCircle,
  FaCog,
  FaEnvelope,
  FaBriefcase,
  FaChartLine,
  FaSpinner,
  FaUsers,
  FaMailBulk,
  FaRocket,
  FaBars,
  FaTimes
} from 'react-icons/fa';
import { toast } from 'sonner';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ✅ Vérifier la session au chargement
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/client/session');
        const data = await response.json();
        
        if (!data.user) {
          const publicPaths = ['/connexion', '/register'];
          if (!publicPaths.includes(pathname)) {
            router.push('/connexion');
          }
          setLoading(false);
          return;
        }

        setUser(data.user);
        
        if (pathname === '/connexion' || pathname === '/register') {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Erreur session client:', error);
        if (!['/connexion', '/register'].includes(pathname)) {
          router.push('/connexion');
        }
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [router, pathname]);

  // ✅ Fermer la sidebar sur mobile lors du changement de page
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // ✅ Déconnexion
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/client/logout', {
        method: 'POST',
      });

      if (!response.ok) {
        toast.error('Erreur lors de la déconnexion');
        return;
      }

      toast.success('Déconnecté avec succès');
      router.push('/connexion');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur serveur');
    }
  };

  // ✅ Navigation client
  const navItems = [
    { href: '/dashboard', label: 'Tableau de bord', icon: FaHome },
    { href: '/clients/profile', label: 'Profil', icon: FaUserCircle },
    { href: '/clients/mail', label: 'Emails', icon: FaMailBulk },
    { href: '/clients/recruitment', label: 'Recrutements', icon: FaBriefcase },
    { href: '/clients/services', label: 'Services', icon: FaRocket },
    { href: '/clients/analytics', label: 'Analytiques', icon: FaChartLine },
    { href: '/clients/settings', label: 'Paramètres', icon: FaCog },
  ];

  // ✅ Si chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB]">
        <div className="text-center">
          <FaSpinner className="h-12 w-12 animate-spin text-[#1E3A8A] mx-auto" />
          <p className="mt-4 text-sm text-slate-500">Chargement...</p>
        </div>
      </div>
    );
  }

  // ✅ Pages publiques (connexion, register) - sans sidebar
  if (pathname === '/connexion' || pathname === '/register') {
    return (
      <div className="min-h-screen bg-[#F5F7FB]">
        <Toaster position="top-right" richColors />
        {children}
      </div>
    );
  }

  // ✅ Pages authentifiées avec sidebar
  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      <Toaster position="top-right" richColors />
      
      {/* ============================================================ */}
      {/* EN-TÊTE */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-3 sm:px-4 md:px-6">
          {/* Logo + Menu mobile */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* ✅ Bouton menu mobile */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition md:hidden"
              aria-label={sidebarOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              {sidebarOpen ? (
                <FaTimes className="h-5 w-5" />
              ) : (
                <FaBars className="h-5 w-5" />
              )}
            </button>

            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-bold text-[#1E3A8A]">UNITECH</span>
              <span className="text-[10px] sm:text-xs text-slate-400 font-medium hidden xs:inline">Client</span>
            </Link>
          </div>
          
          {/* User info */}
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-xs sm:text-sm text-slate-600 hidden sm:block truncate max-w-[120px] md:max-w-[200px]">
              {user?.email}
            </span>
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-[#1E3A8A] text-white font-medium text-xs sm:text-sm">
              {user?.first_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-red-600 transition"
              title="Se déconnecter"
            >
              <FaSignOutAlt className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* CORPS PRINCIPAL */}
      {/* ============================================================ */}
      <div className="flex relative">
        {/* ✅ Overlay pour mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ============================================================ */}
        {/* SIDEBAR - Version responsive */}
        {/* ============================================================ */}
        <aside 
          className={`
            fixed md:sticky top-16 md:top-0 z-30
            w-[280px] sm:w-[300px] md:w-64 lg:w-72
            h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)]
            bg-white border-r border-slate-200
            transition-transform duration-300 ease-in-out
            overflow-y-auto
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
        >
          <nav className="p-3 sm:p-4 space-y-0.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 sm:py-3 rounded-lg 
                    text-sm font-medium transition
                    ${isActive
                      ? 'bg-[#1E3A8A] text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-[#1E3A8A]'
                    }
                  `}
                >
                  <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />
                  )}
                </Link>
              );
            })}

            {/* ✅ Séparateur */}
            <div className="my-3 border-t border-slate-200" />

            {/* ✅ Lien déconnexion dans sidebar (mobile) */}
            <button
              onClick={() => {
                handleLogout();
                setSidebarOpen(false);
              }}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition md:hidden"
            >
              <FaSignOutAlt className="h-5 w-5 flex-shrink-0" />
              <span>Déconnexion</span>
            </button>
          </nav>

          {/* ✅ Version info - Pied de sidebar */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100 bg-white/80 hidden md:block">
            <p className="text-[10px] text-slate-400 text-center">
              {user?.email && (
                <span className="truncate block">{user.email}</span>
              )}
              <span className="mt-1 block">v2.0.0 · {new Date().getFullYear()}</span>
            </p>
          </div>
        </aside>

        {/* ============================================================ */}
        {/* CONTENU PRINCIPAL */}
        {/* ============================================================ */}
        <main className="flex-1 min-w-0 p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}