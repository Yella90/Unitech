// components/dashboard/DashboardLayout.tsx
'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FaHome,
  FaProjectDiagram,
  FaGraduationCap,
  FaUsers,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaEnvelope,
  FaShieldAlt,
  FaChartLine,
  FaEye,
  FaUserFriends,
  FaMobileAlt,
  FaDesktop,
  FaGlobe,
  FaClock,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaSpinner,
  FaTabletAlt,
  FaSync,
  FaHistory
} from "react-icons/fa";
import { toast } from "sonner";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface VisitorStats {
  totalVisits: number;
  uniqueVisitors: number;
  todayVisits: number;
  avgDuration: number;
  bounceRate: number;
  visitsByDevice: { desktop: number; mobile: number; tablet: number };
  visitsByPage: { page: string; count: number }[];
  visitsByDay: { date: string; count: number }[];
  previousDayVisits: number;
  trend: 'up' | 'down' | 'stable';
  loading: boolean;
  hasData: boolean;
}

const navItems = [
  { href: "/admin", label: "Tableau de bord", icon: FaHome },
  { href: "/admin/projects", label: "Projets", icon: FaProjectDiagram },
  { href: "/admin/trainings", label: "Formations", icon: FaGraduationCap },
  { href: "/admin/users", label: "Utilisateurs", icon: FaUsers },
  { href: "/admin/subscribers", label: "Newsletter", icon: FaEnvelope },
  { href: "/admin/analytics", label: "Analytics", icon: FaChartLine },
  { href: "/admin/logs", label: "Logs", icon: FaClock },

  { href: "/admin/settings", label: "Paramètres", icon: FaCog },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [visitorStats, setVisitorStats] = useState<VisitorStats>({
    totalVisits: 0,
    uniqueVisitors: 0,
    todayVisits: 0,
    avgDuration: 0,
    bounceRate: 0,
    visitsByDevice: { desktop: 0, mobile: 0, tablet: 0 },
    visitsByPage: [],
    visitsByDay: [],
    previousDayVisits: 0,
    trend: 'stable',
    loading: true,
    hasData: false
  });

  const fetchVisitorStats = async () => {
    try {
      setVisitorStats(prev => ({ ...prev, loading: true }));

      console.log('📊 Début chargement statistiques...');

      // ✅ Récupérer TOUTES les visites sans limite
      const { data: allVisits, error: visitsError } = await supabase
        .from('page_visits')
        .select('*')
        .order('created_at', { ascending: false });

      if (visitsError) {
        console.error('❌ Erreur chargement visites:', visitsError);
        setVisitorStats(prev => ({ ...prev, loading: false }));
        return;
      }

      console.log(`📊 ${allVisits?.length || 0} visites récupérées`);

      if (!allVisits || allVisits.length === 0) {
        console.log('📊 Aucune visite trouvée');
        setVisitorStats(prev => ({ 
          ...prev, 
          loading: false, 
          hasData: false 
        }));
        return;
      }

      // ✅ Afficher un échantillon des données
      console.log('📊 Premier enregistrement:', allVisits[0]);
      console.log('📊 Dernier enregistrement:', allVisits[allVisits.length - 1]);

      // 2. Statistiques
      const totalVisits = allVisits.length;
      const uniqueVisitors = new Set(allVisits.map(v => v.visitor_id).filter(id => id)).size;

      // 3. Visites aujourd'hui
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayVisits = allVisits.filter(v => {
        const d = new Date(v.created_at);
        return d >= today;
      }).length;

      // 4. Visites hier
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayVisits = allVisits.filter(v => {
        const d = new Date(v.created_at);
        return d >= yesterday && d < today;
      }).length;

      // 5. Durée moyenne
      const durations = allVisits.filter(v => v.duration && v.duration > 0).map(v => v.duration);
      const avgDuration = durations.length > 0 
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;

      // 6. Appareils
      const deviceCounts = { desktop: 0, mobile: 0, tablet: 0 };
      allVisits.forEach(v => {
        const device = v.device_type?.toLowerCase() || 'desktop';
        if (device === 'desktop' || device === 'pc' || device === 'computer') {
          deviceCounts.desktop++;
        } else if (device === 'mobile' || device === 'phone' || device === 'android' || device === 'iphone') {
          deviceCounts.mobile++;
        } else if (device === 'tablet' || device === 'ipad') {
          deviceCounts.tablet++;
        } else {
          deviceCounts.desktop++;
        }
      });

      // 7. Pages populaires
      const pageCounts: Record<string, number> = {};
      allVisits.forEach(v => {
        const page = v.page || '/';
        pageCounts[page] = (pageCounts[page] || 0) + 1;
      });
      
      const visitsByPage = Object.entries(pageCounts)
        .map(([page, count]) => ({ page, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // 8. Visites par jour (7 derniers jours)
      const visitsByDay = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        
        const count = allVisits.filter(v => {
          const d = new Date(v.created_at);
          return d >= startOfDay && d <= endOfDay;
        }).length;
        
        visitsByDay.push({
          date: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
          count
        });
      }

      // 9. Tendance
      const trend = yesterdayVisits > 0
        ? todayVisits > yesterdayVisits ? 'up' 
          : todayVisits < yesterdayVisits ? 'down' 
          : 'stable'
        : 'stable';

      // 10. Taux de rebond
      const bounceVisits = allVisits.filter(v => v.duration !== null && v.duration < 5).length;
      const validDurationVisits = allVisits.filter(v => v.duration !== null).length;
      const bounceRate = validDurationVisits > 0 
        ? Math.round((bounceVisits / validDurationVisits) * 100)
        : 0;

      console.log('📊 Statistiques calculées:', {
        totalVisits,
        uniqueVisitors,
        todayVisits,
        avgDuration,
        bounceRate,
        deviceCounts,
        visitsByPage,
        visitsByDay: visitsByDay.map(d => d.count)
      });

      setVisitorStats({
        totalVisits,
        uniqueVisitors,
        todayVisits,
        avgDuration,
        bounceRate,
        visitsByDevice: deviceCounts,
        visitsByPage,
        visitsByDay,
        previousDayVisits: yesterdayVisits,
        trend,
        loading: false,
        hasData: true
      });

    } catch (error) {
      console.error('❌ Erreur inattendue:', error);
      setVisitorStats(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);

        const response = await fetch('/api/auth/session');
        const payload = await response.json();

        if (!response.ok || !payload.user || !['admin', 'super_admin'].includes(payload.user.role)) {
          router.push('/login');
          return;
        }

        setUser(payload.user);
        await fetchVisitorStats();
      } catch (error) {
        console.error('Erreur:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchVisitorStats, 30000);
    return () => clearInterval(interval);
  }, [router]);

  const handleLogout = async () => {
    try {
      toast.loading('Déconnexion en cours...');

      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        toast.error('Erreur lors de la déconnexion');
        return;
      }

      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });

      localStorage.clear();
      sessionStorage.clear();

      toast.success('Déconnecté avec succès');
      
      setTimeout(() => {
        window.location.href = '/login';
      }, 500);

    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la déconnexion');
      
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1E3A8A] border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const maxVisits = Math.max(...visitorStats.visitsByDay.map(d => d.count), 1);
  const hasData = visitorStats.hasData && visitorStats.totalVisits > 0;

  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-slate-200 transition-transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E3A8A] text-white font-black text-sm">U</div>
            <span className="font-bold text-[#1E3A8A]">UNITECH</span>
            <span className="text-xs text-slate-400 font-medium">admin</span>
          </Link>
          <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setSidebarOpen(false)}>
            <FaTimes className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href + "/"));
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${isActive ? "bg-[#1E3A8A]/10 text-[#1E3A8A]" : "text-slate-600 hover:bg-slate-100"}`}>
                <item.icon className="h-5 w-5" /> {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1E3A8A]/10 text-[#1E3A8A] font-medium text-sm">
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="text-xs">
                <p className="font-medium text-slate-700 truncate max-w-[120px]">{user?.email}</p>
                <div className="flex items-center gap-1">
                  <FaShieldAlt className="h-3 w-3 text-[#F97316]" />
                  <p className="text-slate-400">{user?.role || "viewer"}</p>
                </div>
              </div>
            </div>
            <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-red-600 transition" title="Se déconnecter">
              <FaSignOutAlt className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {!sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(true)} />
      )}

      <div className={`transition-all ${sidebarOpen ? "lg:ml-64" : "lg:ml-0"}`}>
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-4">
            <button className="p-2 rounded-lg hover:bg-slate-100 lg:hidden" onClick={() => setSidebarOpen(true)}>
              <FaBars className="h-5 w-5 text-slate-600" />
            </button>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500 hidden sm:block">admin.unitech.com</span>
              <span className="text-sm text-slate-700">{user?.first_name || user?.email}</span>
            </div>
          </div>
        </header>

        <main>
          {/* Statistiques des visiteurs */}
          <div className="p-4 border-b border-slate-200 bg-white/50">
            <div className="mx-auto max-w-7xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FaChartLine className="h-5 w-5 text-[#F97316]" />
                  <h2 className="text-sm font-semibold text-[#1E3A8A]">Statistiques des visiteurs</h2>
                  <Badge variant="outline" className="text-[10px]">
                    <FaClock className="mr-1 h-3 w-3" />
                    {hasData ? 'Temps réel' : 'Aucune donnée'}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={fetchVisitorStats} className="h-6 px-2">
                    <FaSync className="h-3 w-3" />
                  </Button>
                </div>
                {hasData && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      {visitorStats.trend === 'up' && <FaArrowUp className="h-3 w-3 text-green-500" />}
                      {visitorStats.trend === 'down' && <FaArrowDown className="h-3 w-3 text-red-500" />}
                      {visitorStats.trend === 'stable' && <FaMinus className="h-3 w-3 text-yellow-500" />}
                      {visitorStats.previousDayVisits > 0 
                        ? `${visitorStats.todayVisits > visitorStats.previousDayVisits ? '+' : ''}${Math.round(((visitorStats.todayVisits - visitorStats.previousDayVisits) / visitorStats.previousDayVisits) * 100)}% vs hier`
                        : 'Premières données'}
                    </span>
                  </div>
                )}
              </div>

              {visitorStats.loading ? (
                <div className="flex items-center justify-center py-6">
                  <FaSpinner className="h-6 w-6 animate-spin text-[#1E3A8A]" />
                  <span className="ml-2 text-sm text-slate-500">Chargement...</span>
                </div>
              ) : !hasData ? (
                <div className="text-center py-8 text-slate-400">
                  <FaEye className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                  <p>Aucune visite enregistrée</p>
                  <p className="text-xs mt-1">Visitez le site public pour générer des données</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={fetchVisitorStats}
                  >
                    <FaSync className="mr-2 h-3 w-3" />
                    Rafraîchir
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] uppercase text-slate-400">Total visites</p>
                            <p className="text-xl font-bold text-[#1E3A8A]">{visitorStats.totalVisits}</p>
                          </div>
                          <div className="rounded-full bg-[#1E3A8A]/10 p-2">
                            <FaEye className="h-4 w-4 text-[#1E3A8A]" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] uppercase text-slate-400">Visiteurs uniques</p>
                            <p className="text-xl font-bold text-[#1E3A8A]">{visitorStats.uniqueVisitors}</p>
                          </div>
                          <div className="rounded-full bg-[#F97316]/10 p-2">
                            <FaUserFriends className="h-4 w-4 text-[#F97316]" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] uppercase text-slate-400">Aujourd'hui</p>
                            <p className="text-xl font-bold text-[#1E3A8A]">{visitorStats.todayVisits}</p>
                          </div>
                          <div className="rounded-full bg-[#10B981]/10 p-2">
                            <FaChartLine className="h-4 w-4 text-[#10B981]" />
                          </div>
                        </div>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {visitorStats.todayVisits > 0 ? '🟢 Visites aujourd\'hui' : '⏳ Aucune visite aujourd\'hui'}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] uppercase text-slate-400">Durée moyenne</p>
                            <p className="text-xl font-bold text-[#1E3A8A]">{visitorStats.avgDuration}s</p>
                          </div>
                          <div className="rounded-full bg-purple-500/10 p-2">
                            <FaClock className="h-4 w-4 text-purple-500" />
                          </div>
                        </div>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {visitorStats.avgDuration > 60 ? '✅ Bon engagement' : visitorStats.avgDuration > 0 ? '⚠️ Court séjour' : '⏳ En attente'}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Graphique */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] uppercase text-slate-400">Visites des 7 derniers jours</p>
                      <p className="text-[10px] text-slate-400">Taux de rebond: {visitorStats.bounceRate}%</p>
                    </div>
                    <div className="flex items-end gap-1 h-12">
                      {visitorStats.visitsByDay.map((day, index) => {
                        const height = maxVisits > 0 ? (day.count / maxVisits) * 100 : 0;
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center group">
                            <div 
                              className="w-full rounded-sm bg-[#1E3A8A] transition-all duration-500 hover:bg-[#F97316] cursor-pointer"
                              style={{ height: `${Math.max(height * 0.8, 2)}%` }}
                            />
                            <span className="mt-1 text-[8px] text-slate-400 truncate w-full text-center">
                              {day.date}
                            </span>
                            <span className="text-[7px] text-slate-300 hidden group-hover:block">
                              {day.count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pages populaires et appareils */}
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] uppercase text-slate-400 mb-1">Pages populaires</p>
                      <div className="space-y-1">
                        {visitorStats.visitsByPage.length > 0 ? (
                          visitorStats.visitsByPage.slice(0, 3).map((page, index) => (
                            <div key={index} className="flex items-center justify-between text-xs">
                              <span className="text-slate-600 truncate">{page.page || '/'}</span>
                              <span className="font-medium text-[#1E3A8A]">{page.count}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400">Aucune page visitée</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-slate-400 mb-1">Appareils</p>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1 text-slate-600">
                            <FaDesktop className="h-3 w-3" /> Ordinateur
                          </span>
                          <span className="font-medium text-[#1E3A8A]">{visitorStats.visitsByDevice.desktop}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1 text-slate-600">
                            <FaMobileAlt className="h-3 w-3" /> Mobile
                          </span>
                          <span className="font-medium text-[#1E3A8A]">{visitorStats.visitsByDevice.mobile}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1 text-slate-600">
                            <FaTabletAlt className="h-3 w-3" /> Tablette
                          </span>
                          <span className="font-medium text-[#1E3A8A]">{visitorStats.visitsByDevice.tablet}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Contenu principal */}
          {children}
        </main>
      </div>
    </div>
  );
}