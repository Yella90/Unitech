// app/(dashboard)/admin/analytics/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FaUsers, 
  FaEye, 
  FaChartLine, 
  FaMobile, 
  FaDesktop,
  FaGlobe,
  FaCalendarAlt,
  FaDownload,
  FaSync
} from 'react-icons/fa';
import { toast, Toaster } from 'sonner';

type Visit = {
  id: string;
  page: string;
  visitor_id: string;
  session_id: string;
  referrer: string;
  country: string;
  city: string;
  device_type: string;
  browser: string;
  os: string;
  created_at: string;
  duration: number;
};

type Stats = {
  totalVisits: number;
  uniqueVisitors: number;
  avgDuration: number;
  visitsByPage: Record<string, number>;
  visitsByDevice: Record<string, number>;
  visitsByCountry: Record<string, number>;
  visitsByDay: Record<string, number>;
};

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalVisits: 0,
    uniqueVisitors: 0,
    avgDuration: 0,
    visitsByPage: {},
    visitsByDevice: {},
    visitsByCountry: {},
    visitsByDay: {},
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
        await loadData();

      } catch (error) {
        console.error('Erreur:', error);
        toast.error('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const loadData = async () => {
    try {
      const { data, error } = await supabase
        .from('page_visits')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setVisits(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Erreur chargement:', error);
      toast.error('Erreur lors du chargement des données');
    }
  };

  const calculateStats = (data: Visit[]) => {
    // Total des visites
    const totalVisits = data.length;

    // Visiteurs uniques
    const uniqueVisitors = new Set(data.map(v => v.visitor_id)).size;

    // Durée moyenne
    const avgDuration = Math.round(
      data.reduce((acc, v) => acc + (v.duration || 0), 0) / totalVisits
    );

    // Par page
    const visitsByPage = data.reduce((acc, v) => {
      acc[v.page] = (acc[v.page] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Par appareil
    const visitsByDevice = data.reduce((acc, v) => {
      acc[v.device_type || 'unknown'] = (acc[v.device_type || 'unknown'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Par pays
    const visitsByCountry = data.reduce((acc, v) => {
      const country = v.country || 'unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Par jour
    const visitsByDay = data.reduce((acc, v) => {
      const day = new Date(v.created_at).toLocaleDateString('fr-FR');
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    setStats({
      totalVisits,
      uniqueVisitors,
      avgDuration,
      visitsByPage,
      visitsByDevice,
      visitsByCountry,
      visitsByDay,
    });
  };

  const exportCSV = () => {
    if (visits.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    const headers = ['Page', 'Pays', 'Appareil', 'Navigateur', 'OS', 'Date'];
    const rows = visits.map(v => [
      v.page,
      v.country || 'Inconnu',
      v.device_type || 'Inconnu',
      v.browser || 'Inconnu',
      v.os || 'Inconnu',
      new Date(v.created_at).toLocaleString('fr-FR'),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `visites_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    toast.success('✅ Export CSV réussi');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1E3A8A] border-t-transparent"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#F5F7FB] p-6">
      <Toaster position="top-right" richColors />
      
      <div className="mx-auto max-w-7xl">
        {/* En-tête */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1E3A8A] flex items-center gap-3">
              <FaChartLine className="h-8 w-8 text-[#F97316]" />
              Analytics
            </h1>
            <p className="mt-1 text-slate-500">
              Suivez les visites et le comportement des visiteurs sur le site.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCSV}>
              <FaDownload className="mr-2 h-4 w-4" />
              Exporter CSV
            </Button>
            <Button variant="outline" onClick={loadData}>
              <FaSync className="mr-2 h-4 w-4" />
              Rafraîchir
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total visites</p>
                  <p className="text-2xl font-bold text-[#1E3A8A]">{stats.totalVisits}</p>
                </div>
                <FaEye className="h-8 w-8 text-[#F97316]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Visiteurs uniques</p>
                  <p className="text-2xl font-bold text-[#1E3A8A]">{stats.uniqueVisitors}</p>
                </div>
                <FaUsers className="h-8 w-8 text-[#F97316]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Durée moyenne</p>
                  <p className="text-2xl font-bold text-[#1E3A8A]">{stats.avgDuration}s</p>
                </div>
                <FaCalendarAlt className="h-8 w-8 text-[#F97316]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Pages visitées</p>
                  <p className="text-2xl font-bold text-[#1E3A8A]">{Object.keys(stats.visitsByPage).length}</p>
                </div>
                <FaGlobe className="h-8 w-8 text-[#F97316]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Détails par page */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pages les plus visitées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.visitsByPage)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([page, count]) => (
                    <div key={page} className="flex items-center justify-between border-b border-slate-100 py-2">
                      <span className="text-sm text-slate-700">{page || '/'}</span>
                      <span className="text-sm font-medium text-[#1E3A8A]">{count}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Appareils</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.visitsByDevice)
                  .sort((a, b) => b[1] - a[1])
                  .map(([device, count]) => (
                    <div key={device} className="flex items-center justify-between border-b border-slate-100 py-2">
                      <span className="flex items-center gap-2 text-sm text-slate-700">
                        {device === 'desktop' ? <FaDesktop className="h-4 w-4" /> : <FaMobile className="h-4 w-4" />}
                        {device === 'desktop' ? 'Ordinateur' : 'Mobile'}
                      </span>
                      <span className="text-sm font-medium text-[#1E3A8A]">{count}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dernières visites */}
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-700">Dernières visites</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-4 py-2 text-left text-slate-600">Page</th>
                  <th className="px-4 py-2 text-left text-slate-600 hidden md:table-cell">Pays</th>
                  <th className="px-4 py-2 text-left text-slate-600 hidden sm:table-cell">Appareil</th>
                  <th className="px-4 py-2 text-left text-slate-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {visits.slice(0, 10).map((visit) => (
                  <tr key={visit.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-2 text-slate-700">{visit.page}</td>
                    <td className="px-4 py-2 text-slate-600 hidden md:table-cell">{visit.country || '—'}</td>
                    <td className="px-4 py-2 text-slate-600 hidden sm:table-cell">
                      {visit.device_type === 'desktop' ? '💻' : '📱'} {visit.device_type || '—'}
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      {new Date(visit.created_at).toLocaleString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}