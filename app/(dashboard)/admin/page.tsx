// app/(dashboard)/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FaProjectDiagram, 
  FaUsers, 
  FaGraduationCap, 
  FaEnvelope, 
  FaChartLine,
  FaRobot,
  FaUserTie,
  FaBuilding,
  FaCreditCard,
  FaRocket,
  FaClipboardList,
  FaUserCheck,
  FaUserTimes,
  FaShieldAlt,
  FaCog,
  FaGlobe,
  FaUserFriends,
  FaBriefcase,
  FaMailBulk,
  FaKey,
  FaCalendarAlt,
  FaClock
} from 'react-icons/fa';
import { toast, Toaster } from 'sonner';

// ✅ Rôles autorisés
const ADMIN_ROLES = ['admin', 'super_admin', 'developer'];

type Stats = {
  projects: number;
  users: number;
  trainings: number;
  subscribers: number;
  activeProjects: number;
  activeUsers: number;
  // ✅ Nouveaux champs pour les clients et services
  clients: number;
  activeClients: number;
  inactiveClients: number;
  verifiedClients: number;
  saasServices: number;
  productServices: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  serviceRequests: number;
  clientRequests: number;
};

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<Stats>({
    projects: 0,
    users: 0,
    trainings: 0,
    subscribers: 0,
    activeProjects: 0,
    activeUsers: 0,
    clients: 0,
    activeClients: 0,
    inactiveClients: 0,
    verifiedClients: 0,
    saasServices: 0,
    productServices: 0,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    serviceRequests: 0,
    clientRequests: 0,
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (silent: boolean = false) => {
    if (!silent) setRefreshing(true);

    try {
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();

      if (!sessionData.user || !ADMIN_ROLES.includes(sessionData.user.role)) {
        router.push('/login?error=unauthorized&message=Accès réservé aux administrateurs');
        return;
      }

      setIsAdmin(true);

      // ✅ Récupérer toutes les statistiques
      const [
        projectsResult,
        usersResult,
        trainingsResult,
        subscribersResult,
        activeProjectsResult,
        activeUsersResult,
        clientsResult,
        activeClientsResult,
        inactiveClientsResult,
        verifiedClientsResult,
        saasServicesResult,
        productServicesResult,
        totalSubscriptionsResult,
        activeSubscriptionsResult,
        serviceRequestsResult,
        clientRequestsResult
      ] = await Promise.all([
        // Projets
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        // Utilisateurs admin
        supabase.from('users').select('*', { count: 'exact', head: true }),
        // Formations
        supabase.from('trainings').select('*', { count: 'exact', head: true }),
        // Newsletter
        supabase.from('newsletter_subscribers').select('*', { count: 'exact', head: true }),
        // Projets actifs
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'in-progress'),
        // Utilisateurs actifs
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true),
        // ✅ Clients
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        // Clients actifs
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('is_active', true),
        // Clients inactifs
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('is_active', false),
        // Clients vérifiés
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('email_verified', true),
        // ✅ Services SaaS
        supabase.from('services').select('*', { count: 'exact', head: true }).eq('type', 'saas').eq('is_active', true),
        // Services Produits
        supabase.from('services').select('*', { count: 'exact', head: true }).eq('type', 'product').eq('is_active', true),
        // ✅ Souscriptions totales
        supabase.from('client_services').select('*', { count: 'exact', head: true }),
        // Souscriptions actives
        supabase.from('client_services').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        // ✅ Demandes publiques
        supabase.from('service_requests').select('*', { count: 'exact', head: true }),
        // ✅ Demandes clients
        supabase.from('client_service_requests').select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        projects: projectsResult.count || 0,
        users: usersResult.count || 0,
        trainings: trainingsResult.count || 0,
        subscribers: subscribersResult.count || 0,
        activeProjects: activeProjectsResult.count || 0,
        activeUsers: activeUsersResult.count || 0,
        clients: clientsResult.count || 0,
        activeClients: activeClientsResult.count || 0,
        inactiveClients: inactiveClientsResult.count || 0,
        verifiedClients: verifiedClientsResult.count || 0,
        saasServices: saasServicesResult.count || 0,
        productServices: productServicesResult.count || 0,
        totalSubscriptions: totalSubscriptionsResult.count || 0,
        activeSubscriptions: activeSubscriptionsResult.count || 0,
        serviceRequests: serviceRequestsResult.count || 0,
        clientRequests: clientRequestsResult.count || 0,
      });

      setLastUpdate(new Date());

      if (!silent) {
        toast.success('✅ Données actualisées');
      }

    } catch (error) {
      console.error('Erreur:', error);
      if (!silent) toast.error('Erreur lors du chargement des données');
    } finally {
      if (!silent) {
        setRefreshing(false);
        setLoading(false);
      }
    }
  };

  const progressRate = stats.projects > 0 
    ? Math.round((stats.activeProjects / stats.projects) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1E3A8A] border-t-transparent"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />

      {/* ============================================================
      EN-TÊTE
      ============================================================ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[#F97316]">Espace administrateur</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-[#1E3A8A]">Tableau de bord</h1>
          <p className="mt-2 text-slate-600 flex items-center gap-2 text-sm">
            <FaClock className="h-3 w-3 text-slate-400" />
            Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => fetchData(false)}
            disabled={refreshing}
            className="flex-shrink-0"
          >
            {refreshing ? (
              <span className="flex items-center gap-2">
                <FaClock className="h-4 w-4 animate-spin" />
                Chargement...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                🔄 Actualiser
              </span>
            )}
          </Button>
          <Link href="/admin/clients">
            <Button className="bg-[#1E3A8A] hover:bg-[#162f58] text-white">
              <FaUsers className="mr-2" />
              Clients
            </Button>
          </Link>
          <Link href="/admin/services">
            <Button variant="outline">Services</Button>
          </Link>
        </div>
      </div>

      {/* ============================================================
      STATISTIQUES PRINCIPALES
      ============================================================ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <FaProjectDiagram className="h-4 w-4 text-[#F97316]" />
              Projets
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#1E3A8A]">{stats.projects}</p>
                <p className="text-xs text-slate-500">{stats.activeProjects} en cours</p>
              </div>
              <Badge className="bg-blue-100 text-blue-700">
                {progressRate}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <FaUsers className="h-4 w-4 text-[#F97316]" />
              Utilisateurs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#1E3A8A]">{stats.users}</p>
                <p className="text-xs text-slate-500">{stats.activeUsers} actifs</p>
              </div>
              <FaUserCheck className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <FaGraduationCap className="h-4 w-4 text-[#F97316]" />
              Formations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#1E3A8A]">{stats.trainings}</p>
                <p className="text-xs text-slate-500">Programmes</p>
              </div>
              <FaGraduationCap className="h-6 w-6 text-[#F97316]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <FaEnvelope className="h-4 w-4 text-[#F97316]" />
              Abonnés
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#1E3A8A]">{stats.subscribers}</p>
                <p className="text-xs text-slate-500">Newsletter</p>
              </div>
              <FaEnvelope className="h-6 w-6 text-[#F97316]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================================
      STATISTIQUES CLIENTS & SERVICES
      ============================================================ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <FaBuilding className="h-4 w-4 text-[#F97316]" />
              Clients
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#1E3A8A]">{stats.clients}</p>
                <p className="text-xs text-slate-500">{stats.activeClients} actifs</p>
              </div>
              <div className="flex gap-1">
                <Badge className="bg-green-100 text-green-700 text-[10px]">
                  {stats.verifiedClients} vérifiés
                </Badge>
              </div>
            </div>
            <div className="mt-2 flex gap-1">
              <Badge className="bg-green-100 text-green-700 text-[10px]">
                ✅ {stats.activeClients}
              </Badge>
              <Badge className="bg-red-100 text-red-700 text-[10px]">
                ❌ {stats.inactiveClients}
              </Badge>
              <Badge className="bg-blue-100 text-blue-700 text-[10px]">
                📧 {stats.verifiedClients}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <FaRocket className="h-4 w-4 text-[#F97316]" />
              Services
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#1E3A8A]">
                  {stats.saasServices + stats.productServices}
                </p>
                <p className="text-xs text-slate-500">Services actifs</p>
              </div>
              <div className="flex flex-col gap-1 text-right">
                <Badge className="bg-purple-100 text-purple-700 text-[10px]">
                  🚀 SaaS: {stats.saasServices}
                </Badge>
                <Badge className="bg-blue-100 text-blue-700 text-[10px]">
                  📦 Produits: {stats.productServices}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <FaCreditCard className="h-4 w-4 text-[#F97316]" />
              Souscriptions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#1E3A8A]">{stats.totalSubscriptions}</p>
                <p className="text-xs text-slate-500">Souscriptions totales</p>
              </div>
              <Badge className="bg-green-100 text-green-700">
                ✅ {stats.activeSubscriptions} actives
              </Badge>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Taux d'activation: {stats.totalSubscriptions > 0 ? Math.round((stats.activeSubscriptions / stats.totalSubscriptions) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <FaClipboardList className="h-4 w-4 text-[#F97316]" />
              Demandes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#1E3A8A]">
                  {stats.serviceRequests + stats.clientRequests}
                </p>
                <p className="text-xs text-slate-500">Demandes totales</p>
              </div>
              <div className="flex flex-col gap-1 text-right">
                <Badge className="bg-yellow-100 text-yellow-700 text-[10px]">
                  🌍 Publiques: {stats.serviceRequests}
                </Badge>
                <Badge className="bg-purple-100 text-purple-700 text-[10px]">
                  👤 Clients: {stats.clientRequests}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================================
      ACCÈS RAPIDE AUX AGENTS
      ============================================================ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/admin/dona" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="p-4">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FaRobot className="h-5 w-5 text-[#F97316]" />
                DONA - Agent de tri
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-sm text-slate-600">
                Classification automatique des emails et contacts
              </p>
              <div className="mt-2 flex gap-2">
                <Badge className="bg-blue-100 text-blue-700 text-[10px]">
                  📧 Emails traités
                </Badge>
                <Badge className="bg-purple-100 text-purple-700 text-[10px]">
                  👤 Contacts classés
                </Badge>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/harvey" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="p-4">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FaUserTie className="h-5 w-5 text-[#F97316]" />
                HARVEY - Agent de réponse
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-sm text-slate-600">
                Génération automatique de réponses IA
              </p>
              <div className="mt-2 flex gap-2">
                <Badge className="bg-green-100 text-green-700 text-[10px]">
                  🤖 Réponses générées
                </Badge>
                <Badge className="bg-orange-100 text-orange-700 text-[10px]">
                  📤 Envoyées
                </Badge>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ============================================================
      ACCÈS RAPIDE ADMIN
      ============================================================ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link href="/admin/clients">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <FaUsers className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Clients</p>
                  <p className="text-xs text-slate-400">Gérer les clients</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/services">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                  <FaRocket className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Services</p>
                  <p className="text-xs text-slate-400">Gérer les services</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/services/subscriptions">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 text-green-600">
                  <FaCreditCard className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Souscriptions</p>
                  <p className="text-xs text-slate-400">Voir les abonnements</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/services/client-requests">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                  <FaClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Demandes</p>
                  <p className="text-xs text-slate-400">Demandes clients</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ============================================================
      SYNTHÈSE
      ============================================================ */}
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <FaChartLine className="h-4 w-4 text-[#F97316]" />
              Synthèse rapide
            </span>
            <Badge className="bg-green-100 text-green-700">
              {stats.projects > 0 ? 'Projets actifs' : 'Aucun projet'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Performance</p>
              <div className="mt-2 flex items-center gap-3">
                <FaChartLine className="h-5 w-5 text-[#1E3A8A]" />
                <div>
                  <p className="text-xl font-semibold text-[#1E3A8A]">{progressRate}%</p>
                  <p className="text-xs text-slate-500">
                    {stats.activeProjects} / {stats.projects} projets en cours
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Activité</p>
              <div className="mt-2 space-y-1 text-sm text-slate-700">
                <p className="flex items-center gap-2">
                  <FaUsers className="h-3 w-3 text-[#F97316]" />
                  {stats.clients} clients ({stats.activeClients} actifs)
                </p>
                <p className="flex items-center gap-2">
                  <FaCreditCard className="h-3 w-3 text-[#F97316]" />
                  {stats.totalSubscriptions} souscriptions ({stats.activeSubscriptions} actives)
                </p>
                <p className="flex items-center gap-2">
                  <FaClipboardList className="h-3 w-3 text-[#F97316]" />
                  {stats.serviceRequests + stats.clientRequests} demandes
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Accès rapide</p>
              <div className="mt-2 flex flex-col gap-2 text-sm">
                <Link href="/admin/clients" className="text-[#1E3A8A] hover:underline flex items-center gap-2">
                  <FaUsers className="h-3 w-3" />
                  Clients ({stats.clients})
                </Link>
                <Link href="/admin/services" className="text-[#1E3A8A] hover:underline flex items-center gap-2">
                  <FaRocket className="h-3 w-3" />
                  Services ({stats.saasServices + stats.productServices})
                </Link>
                <Link href="/admin/services/subscriptions" className="text-[#1E3A8A] hover:underline flex items-center gap-2">
                  <FaCreditCard className="h-3 w-3" />
                  Souscriptions ({stats.totalSubscriptions})
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}