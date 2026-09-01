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
  FaSpinner
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

  // ✅ Vérifier la session au chargement
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/client/session');
        const data = await response.json();
        
        if (!data.user) {
          // ✅ Rediriger vers /connexion si pas de session
          const publicPaths = ['/connexion', '/register'];
          if (!publicPaths.includes(pathname)) {
            router.push('/connexion');
          }
          setLoading(false);
          return;
        }

        setUser(data.user);
        
        // ✅ Si l'utilisateur est sur connexion ou register, rediriger vers dashboard
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
    { href: '/profile', label: 'Profil', icon: FaUserCircle },
    { href: '/emails', label: 'Emails', icon: FaEnvelope },
    { href: '/recruitments', label: 'Recrutements', icon: FaBriefcase },
    { href: '/analytics', label: 'Analytiques', icon: FaChartLine },
    { href: '/settings', label: 'Paramètres', icon: FaCog },
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
      
      {/* Barre de navigation supérieure */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-xl font-bold text-[#1E3A8A]">UNITECH</span>
              <span className="text-xs text-slate-400 font-medium">Client</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 hidden sm:block">
              {user?.email}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1E3A8A] text-white font-medium text-sm">
              {user?.first_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-red-600 transition"
              title="Se déconnecter"
            >
              <FaSignOutAlt className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Corps principal avec sidebar */}
      <div className="flex">
        {/* Sidebar gauche */}
        <aside className="w-64 min-h-[calc(100vh-4rem)] bg-white border-r border-slate-200 hidden md:block">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-[#1E3A8A] text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Contenu principal */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}