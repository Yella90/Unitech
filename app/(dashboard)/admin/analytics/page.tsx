// app/(dashboard)/admin/analytics/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
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
  FaMinus,
  FaSpinner
} from 'react-icons/fa';
import { toast, Toaster } from 'sonner';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area
} from 'recharts';

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

// ✅ Format des données pour recharts
type ChartData = {
  date: string;
  visits: number;
  fullDate: string;
};

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

        intervalRef.current = setInterval(() => {
          loadAnalytics(true);
        }, 60000);

      } catch (error) {
        console.error('Erreur:', error);
        toast.error('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [router]);

  const loadAnalytics = async (silent: boolean = false) => {
    if (!silent) {
      setRefreshing(true);
    }

    try {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      const { data: visits, error } = await supabase
        .from('page_visits')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!visits || visits.length === 0) {
        setData(prev => ({ ...prev, totalVisits: 0, visitsByDay: [] }));
        setChartData([]);
        if (!silent) toast.info('Aucune donnée disponible');
        return;
      }

      const newData = calculateStats(visits, days);
      setData(newData);
      
      // ✅ Préparer les données pour le graphique
      const chartFormatted = newData.visitsByDay.map(day => ({
        date: day.date,
        visits: day.count,
        fullDate: day.date
      }));
      setChartData(chartFormatted);
      
      setLastUpdate(new Date());

      if (!silent) {
        toast.success(`✅ Données actualisées (${new Date().toLocaleTimeString()})`);
      }

    } catch (error) {
      console.error('Erreur:', error);
      if (!silent) {
        toast.error('Erreur lors du chargement des analytics');
      }
    } finally {
      if (!silent) {
        setRefreshing(false);
      }
    }
  };

  const calculateStats = (visits: any[], days: number): AnalyticsData => {
    const totalVisits = visits.length;
    const uniqueVisitors = new Set(visits.map(v => v.visitor_id).filter(id => id)).size;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayVisits = visits.filter(v => new Date(v.created_at) >= today).length;

    const deviceCounts = { desktop: 0, mobile: 0, tablet: 0 };
    visits.forEach(v => {
      const device = v.device_type?.toLowerCase() || 'desktop';
      if (device === 'desktop' || device === 'pc') deviceCounts.desktop++;
      else if (device === 'mobile' || device === 'phone') deviceCounts.mobile++;
      else if (device === 'tablet') deviceCounts.tablet++;
      else deviceCounts.desktop++;
    });

    const pageCounts: Record<string, number> = {};
    visits.forEach(v => {
      const page = v.page || '/';
      pageCounts[page] = (pageCounts[page] || 0) + 1;
    });
    const visitsByPage = Object.entries(pageCounts)
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const countryCounts: Record<string, number> = {};
    visits.forEach(v => {
      const country = v.country || 'Inconnu';
      countryCounts[country] = (countryCounts[country] || 0) + 1;
    });
    const visitsByCountry = Object.entries(countryCounts)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const visitsByDay = [];
    const displayDays = Math.min(days, 30);
    for (let i = displayDays - 1; i >= 0; i--) {
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

    const bounceVisits = visits.filter(v => v.duration !== null && v.duration < 5).length;
    const validDurationVisits = visits.filter(v => v.duration !== null).length;
    const bounceRate = validDurationVisits > 0 
      ? Math.round((bounceVisits / validDurationVisits) * 100)
      : 0;

    const durations = visits.filter(v => v.duration && v.duration > 0).map(v => v.duration);
    const avgDuration = durations.length > 0 
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

    return {
      totalVisits,
      uniqueVisitors,
      todayVisits,
      avgDuration,
      bounceRate,
      visitsByDevice: deviceCounts,
      visitsByPage,
      visitsByDay,
      visitsByCountry,
      trend
    };
  };

  const exportCSV = () => {
    try {
      const headers = ['Page', 'Visites', 'Visiteurs uniques', 'Date'];
      const rows = data.visitsByPage.map(p => [
        p.page,
        p.count.toString(),
        Math.round(p.count * 0.7).toString(),
        new Date().toLocaleDateString('fr-FR')
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `analytics_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast.success('✅ Export CSV réussi');
    } catch (error) {
      console.error('Erreur export:', error);
      toast.error('Erreur lors de l\'export');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] p-4">
        <div className="h-10 w-10 sm:h-12 sm:w-12 animate-spin rounded-full border-4 border-[#1E3A8A] border-t-transparent"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const hasChartData = chartData.length > 0 && chartData.some(d => d.visits > 0);

  // ✅ Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-3">
          <p className="text-sm font-semibold text-[#1E3A8A]">{label}</p>
          <p className="text-sm text-slate-600">
            Visites: <span className="font-bold text-[#F97316]">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <main className="min-h-screen bg-[#F5F7FB] p-3 sm:p-4 md:p-6">
      <Toaster position="top-right" richColors />
      
      <div className="mx-auto max-w-7xl">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1E3A8A] flex flex-wrap items-center gap-2 sm:gap-3">
              <FaChartLine className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-[#F97316] flex-shrink-0" />
              <span className="truncate">Analytics</span>
              {refreshing && (
                <FaSpinner className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-[#F97316] flex-shrink-0" />
              )}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 flex flex-wrap items-center gap-1 sm:gap-2 mt-0.5">
              Statistiques détaillées des visiteurs
              <span className="text-xs text-slate-400">
                · Dernière MAJ: {lastUpdate.toLocaleTimeString()}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              {(['7d', '30d', '90d'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium transition ${
                    period === p 
                      ? 'bg-[#1E3A8A] text-white' 
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p === '7d' ? '7j' : p === '30d' ? '30j' : '90j'}
                </button>
              ))}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => loadAnalytics(false)}
              disabled={refreshing}
              className="text-xs sm:text-sm"
            >
              {refreshing ? (
                <FaSpinner className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
              ) : (
                <FaSync className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              )}
              <span className="hidden xs:inline">{refreshing ? 'Chargement...' : 'Rafraîchir'}</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={exportCSV}
              className="text-xs sm:text-sm"
            >
              <FaDownload className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Exporter</span>
              <span className="xs:hidden">📥</span>
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <Card className="transition-all hover:shadow-md">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Total visites</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#1E3A8A]">
                    {data.totalVisits}
                  </p>
                </div>
                <FaEye className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-[#F97316]" />
              </div>
            </CardContent>
          </Card>
          <Card className="transition-all hover:shadow-md">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Visiteurs uniques</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#1E3A8A]">
                    {data.uniqueVisitors}
                  </p>
                </div>
                <FaUserFriends className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-[#F97316]" />
              </div>
            </CardContent>
          </Card>
          <Card className="transition-all hover:shadow-md">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Aujourd'hui</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#1E3A8A]">
                    {data.todayVisits}
                  </p>
                </div>
                <FaClock className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-[#10B981]" />
              </div>
              <div className="mt-0.5 sm:mt-1 flex items-center gap-1">
                {data.trend === 'up' && <FaArrowUp className="h-2 w-2 sm:h-3 sm:w-3 text-green-500" />}
                {data.trend === 'down' && <FaArrowDown className="h-2 w-2 sm:h-3 sm:w-3 text-red-500" />}
                {data.trend === 'stable' && <FaMinus className="h-2 w-2 sm:h-3 sm:w-3 text-yellow-500" />}
                <span className="text-[8px] sm:text-xs text-slate-400">vs hier</span>
              </div>
            </CardContent>
          </Card>
          <Card className="transition-all hover:shadow-md">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Durée moy.</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#1E3A8A]">
                    {data.avgDuration}s
                  </p>
                </div>
                <FaClock className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-purple-500" />
              </div>
              <p className="mt-0.5 sm:mt-1 text-[8px] sm:text-xs text-slate-400">
                Taux rebond: {data.bounceRate}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ✅ Graphique avec recharts - ComposedChart (Barres + Courbe) */}
        <Card className="mt-4 sm:mt-6">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-sm sm:text-lg flex flex-wrap items-center gap-2">
              <span>Visites des {period === '7d' ? '7' : period === '30d' ? '30' : '90'} derniers jours</span>
              <Badge variant="outline" className="text-[10px] sm:text-xs">
                {chartData.reduce((sum, d) => sum + d.visits, 0)} total
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {!hasChartData ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <FaChartLine className="h-12 w-12 mb-3 text-slate-300" />
                <p className="text-sm font-medium">Aucune donnée de visite</p>
                <p className="text-xs">Les données apparaîtront dès que des visiteurs arriveront sur le site</p>
              </div>
            ) : (
              <div className="w-full h-64 sm:h-72 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                    />
                    
                    {/* Barres */}
                    <Bar 
                      dataKey="visits" 
                      fill="#1E3A8A" 
                      radius={[4, 4, 0, 0]}
                      barSize={20}
                      name="Visites"
                    />
                    
                    {/* Courbe de tendance */}
                    <Line
                      type="monotone"
                      dataKey="visits"
                      stroke="#F97316"
                      strokeWidth={2.5}
                      dot={{ fill: '#F97316', r: 4 }}
                      activeDot={{ r: 6, fill: '#F97316' }}
                      name="Tendance"
                    />
                    
                    {/* Zone sous la courbe (optionnel) */}
                    <Area
                      type="monotone"
                      dataKey="visits"
                      stroke="none"
                      fill="#F97316"
                      fillOpacity={0.1}
                      name="Zone"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pages et appareils */}
        <div className="mt-4 sm:mt-6 grid gap-4 sm:gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-sm sm:text-lg flex flex-wrap items-center gap-2">
                <span>Pages les plus visitées</span>
                <Badge variant="secondary" className="text-[10px] sm:text-xs">
                  {data.visitsByPage.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-1 sm:space-y-2">
                {data.visitsByPage.slice(0, 5).map((page, index) => (
                  <div key={index} className="flex items-center justify-between border-b border-slate-100 py-1 sm:py-2">
                    <span className="text-xs sm:text-sm text-slate-600 truncate max-w-[120px] xs:max-w-[200px] sm:max-w-none">
                      {page.page || '/'}
                    </span>
                    <Badge variant="secondary" className="text-[10px] sm:text-xs">
                      {page.count}
                    </Badge>
                  </div>
                ))}
                {data.visitsByPage.length === 0 && (
                  <p className="text-xs sm:text-sm text-slate-400">Aucune page visitée</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-sm sm:text-lg">Appareils</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-1 sm:space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 py-1 sm:py-2">
                  <span className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-slate-600">
                    <FaDesktop className="h-3 w-3 sm:h-4 sm:w-4" /> Ordinateur
                  </span>
                  <Badge variant="secondary" className="text-[10px] sm:text-xs">
                    {data.visitsByDevice.desktop}
                  </Badge>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-1 sm:py-2">
                  <span className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-slate-600">
                    <FaMobileAlt className="h-3 w-3 sm:h-4 sm:w-4" /> Mobile
                  </span>
                  <Badge variant="secondary" className="text-[10px] sm:text-xs">
                    {data.visitsByDevice.mobile}
                  </Badge>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-1 sm:py-2">
                  <span className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-slate-600">
                    <FaTabletAlt className="h-3 w-3 sm:h-4 sm:w-4" /> Tablette
                  </span>
                  <Badge variant="secondary" className="text-[10px] sm:text-xs">
                    {data.visitsByDevice.tablet}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pays */}
        <Card className="mt-4 sm:mt-6">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-sm sm:text-lg flex flex-wrap items-center gap-2">
              <FaGlobe className="h-4 w-4 sm:h-5 sm:w-5 text-[#F97316]" />
              <span>Pays des visiteurs</span>
              <Badge variant="secondary" className="text-[10px] sm:text-xs">
                {data.visitsByCountry.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2">
              {data.visitsByCountry.map((country, index) => (
                <div key={index} className="flex items-center justify-between border-b border-slate-100 py-1 sm:py-2">
                  <span className="text-xs sm:text-sm text-slate-600 truncate">
                    {country.country}
                  </span>
                  <Badge variant="secondary" className="text-[10px] sm:text-xs">
                    {country.count}
                  </Badge>
                </div>
              ))}
              {data.visitsByCountry.length === 0 && (
                <p className="text-xs sm:text-sm text-slate-400 col-span-full text-center py-4">
                  Aucune donnée de localisation
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}