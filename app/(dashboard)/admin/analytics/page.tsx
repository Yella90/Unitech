// app/(dashboard)/admin/analytics/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FaChartLine, 
  FaEye, 
  FaUserFriends, 
  FaDesktop, 
  FaMobileAlt, 
  FaTabletAlt,
  FaGlobe,
  FaClock,
  FaSync,
  FaDownload,
  FaArrowUp,
  FaArrowDown,
  FaMinus
} from 'react-icons/fa';
import { toast, Toaster } from 'sonner';

type AnalyticsData = {
  totalVisits: number;
  uniqueVisitors: number;
  todayVisits: number;
  avgDuration: number;
  bounceRate: number;
  visitsByDevice: { desktop: number; mobile: number; tablet: number };
  visitsByPage: { page: string; count: number }[];
  visitsByDay: { date: string; count: number }[];
  visitsByCountry: { country: string; count: number }[];
  trend: 'up' | 'down' | 'stable';
};

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData>({
    totalVisits: 0,
    uniqueVisitors: 0,
    todayVisits: 0,
    avgDuration: 0,
    bounceRate: 0,
    visitsByDevice: { desktop: 0, mobile: 0, tablet: 0 },
    visitsByPage: [],
    visitsByDay: [],
    visitsByCountry: [],
    trend: 'stable'
  });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();

        if (!sessionData.user || !['admin', 'super_admin'].includes(sessionData.user.role)) {
          router.push('/login?error=unauthorized&message=Accès réservé aux administrateurs');
          return;
        }

        setIsAdmin(true);
        await loadAnalytics();

      } catch (error) {
        console.error('Erreur:', error);
        toast.error('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const loadAnalytics = async () => {
    try {
      const { data: visits, error } = await supabase
        .from('page_visits')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!visits || visits.length === 0) {
        setData(prev => ({ ...prev, totalVisits: 0 }));
        return;
      }

      // Calculer les statistiques
      const totalVisits = visits.length;
      const uniqueVisitors = new Set(visits.map(v => v.visitor_id).filter(id => id)).size;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayVisits = visits.filter(v => new Date(v.created_at) >= today).length;

      // Appareils
      const deviceCounts = { desktop: 0, mobile: 0, tablet: 0 };
      visits.forEach(v => {
        const device = v.device_type?.toLowerCase() || 'desktop';
        if (device === 'desktop' || device === 'pc') deviceCounts.desktop++;
        else if (device === 'mobile' || device === 'phone') deviceCounts.mobile++;
        else if (device === 'tablet') deviceCounts.tablet++;
        else deviceCounts.desktop++;
      });

      // Pages
      const pageCounts: Record<string, number> = {};
      visits.forEach(v => {
        const page = v.page || '/';
        pageCounts[page] = (pageCounts[page] || 0) + 1;
      });
      const visitsByPage = Object.entries(pageCounts)
        .map(([page, count]) => ({ page, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Pays
      const countryCounts: Record<string, number> = {};
      visits.forEach(v => {
        const country = v.country || 'Inconnu';
        countryCounts[country] = (countryCounts[country] || 0) + 1;
      });
      const visitsByCountry = Object.entries(countryCounts)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // 7 derniers jours
      const visitsByDay = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        
        const count = visits.filter(v => {
          const d = new Date(v.created_at);
          return d >= start && d <= end;
        }).length;
        
        visitsByDay.push({
          date: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
          count
        });
      }

      // Tendance
      const yesterdayVisits = visits.filter(v => {
        const d = new Date(v.created_at);
        const y = new Date(today);
        y.setDate(y.getDate() - 1);
        return d >= y && d < today;
      }).length;

      const trend = yesterdayVisits > 0
        ? todayVisits > yesterdayVisits ? 'up' 
          : todayVisits < yesterdayVisits ? 'down' 
          : 'stable'
        : 'stable';

      setData({
        totalVisits,
        uniqueVisitors,
        todayVisits,
        avgDuration: 0,
        bounceRate: 0,
        visitsByDevice: deviceCounts,
        visitsByPage,
        visitsByDay,
        visitsByCountry,
        trend
      });

    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des analytics');
    }
  };

  const exportCSV = () => {
    // Logique d'export
    toast.success('Export CSV en cours...');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1E3A8A] border-t-transparent"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const maxVisits = Math.max(...data.visitsByDay.map(d => d.count), 1);

  return (
    <main className="min-h-screen bg-[#F5F7FB] p-6">
      <Toaster position="top-right" richColors />
      
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#1E3A8A] flex items-center gap-3">
              <FaChartLine className="h-8 w-8 text-[#F97316]" />
              Analytics
            </h1>
            <p className="mt-1 text-slate-500">
              Statistiques détaillées des visiteurs
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadAnalytics}>
              <FaSync className="mr-2 h-4 w-4" />
              Rafraîchir
            </Button>
            <Button variant="outline" onClick={exportCSV}>
              <FaDownload className="mr-2 h-4 w-4" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Statistiques générales */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Total visites</p>
                  <p className="text-2xl font-bold text-[#1E3A8A]">{data.totalVisits}</p>
                </div>
                <FaEye className="h-8 w-8 text-[#F97316]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Visiteurs uniques</p>
                  <p className="text-2xl font-bold text-[#1E3A8A]">{data.uniqueVisitors}</p>
                </div>
                <FaUserFriends className="h-8 w-8 text-[#F97316]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Aujourd'hui</p>
                  <p className="text-2xl font-bold text-[#1E3A8A]">{data.todayVisits}</p>
                </div>
                <FaClock className="h-8 w-8 text-[#10B981]" />
              </div>
              <div className="mt-1 flex items-center gap-1">
                {data.trend === 'up' && <FaArrowUp className="h-3 w-3 text-green-500" />}
                {data.trend === 'down' && <FaArrowDown className="h-3 w-3 text-red-500" />}
                {data.trend === 'stable' && <FaMinus className="h-3 w-3 text-yellow-500" />}
                <span className="text-xs text-slate-400">vs hier</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Taux de rebond</p>
                  <p className="text-2xl font-bold text-[#1E3A8A]">{data.bounceRate}%</p>
                </div>
                <FaChartLine className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Graphique 7 jours */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Visites des 7 derniers jours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-32">
              {data.visitsByDay.map((day, index) => {
                const height = maxVisits > 0 ? (day.count / maxVisits) * 100 : 0;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full rounded-sm bg-[#1E3A8A] transition-all duration-500"
                      style={{ height: `${Math.max(height * 0.8, 2)}%` }}
                    />
                    <span className="mt-1 text-[10px] text-slate-400">{day.date}</span>
                    <span className="text-[9px] text-slate-300">{day.count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Pages et appareils */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pages les plus visitées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.visitsByPage.map((page, index) => (
                  <div key={index} className="flex items-center justify-between border-b border-slate-100 py-1">
                    <span className="text-sm text-slate-600">{page.page || '/'}</span>
                    <Badge variant="secondary">{page.count}</Badge>
                  </div>
                ))}
                {data.visitsByPage.length === 0 && (
                  <p className="text-sm text-slate-400">Aucune page visitée</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Appareils</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 py-1">
                  <span className="flex items-center gap-2 text-sm text-slate-600">
                    <FaDesktop className="h-4 w-4" /> Ordinateur
                  </span>
                  <Badge variant="secondary">{data.visitsByDevice.desktop}</Badge>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-1">
                  <span className="flex items-center gap-2 text-sm text-slate-600">
                    <FaMobileAlt className="h-4 w-4" /> Mobile
                  </span>
                  <Badge variant="secondary">{data.visitsByDevice.mobile}</Badge>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-1">
                  <span className="flex items-center gap-2 text-sm text-slate-600">
                    <FaTabletAlt className="h-4 w-4" /> Tablette
                  </span>
                  <Badge variant="secondary">{data.visitsByDevice.tablet}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pays */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FaGlobe className="h-5 w-5 text-[#F97316]" />
              Pays des visiteurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {data.visitsByCountry.map((country, index) => (
                <div key={index} className="flex items-center justify-between border-b border-slate-100 py-1">
                  <span className="text-sm text-slate-600">{country.country}</span>
                  <Badge variant="secondary">{country.count}</Badge>
                </div>
              ))}
              {data.visitsByCountry.length === 0 && (
                <p className="text-sm text-slate-400">Aucune donnée de localisation</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}