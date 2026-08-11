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
  FaUserTie
} from 'react-icons/fa';
import { toast } from 'sonner';

type Stats = {
  projects: number;
  users: number;
  trainings: number;
  subscribers: number;
  activeProjects: number;
  activeUsers: number;
};

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    projects: 0,
    users: 0,
    trainings: 0,
    subscribers: 0,
    activeProjects: 0,
    activeUsers: 0,
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

        const [
          { count: projectsCount },
          { count: usersCount },
          { count: trainingsCount },
          { count: subscribersCount },
          { count: activeProjectsCount },
          { count: activeUsersCount }
        ] = await Promise.all([
          supabase.from('projects').select('*', { count: 'exact', head: true }),
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('trainings').select('*', { count: 'exact', head: true }),
          supabase.from('newsletter_subscribers').select('*', { count: 'exact', head: true }),
          supabase.from('projects').select('*', { count: 'exact', head: true })
            .eq('status', 'in-progress'),
          supabase.from('users').select('*', { count: 'exact', head: true })
            .eq('is_active', true),
        ]);

        setStats({
          projects: projectsCount || 0,
          users: usersCount || 0,
          trainings: trainingsCount || 0,
          subscribers: subscribersCount || 0,
          activeProjects: activeProjectsCount || 0,
          activeUsers: activeUsersCount || 0,
        });

      } catch (error) {
        console.error('Erreur:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

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
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[#F97316]">Espace administrateur</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-[#1E3A8A]">Tableau de bord</h1>
          <p className="mt-2 text-slate-600">
            Accédez aux actions clés : projets, utilisateurs, formations et abonnés.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/projects">
            <Button className="bg-[#1E3A8A] hover:bg-[#162f58] text-white">
              Projets
            </Button>
          </Link>
          <Link href="/admin/users">
            <Button variant="outline">Utilisateurs</Button>
          </Link>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm">Projets</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#1E3A8A]">{stats.projects}</p>
                <p className="text-xs text-slate-500">{stats.activeProjects} en cours</p>
              </div>
              <FaProjectDiagram className="h-6 w-6 text-[#F97316]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm">Utilisateurs</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#1E3A8A]">{stats.users}</p>
                <p className="text-xs text-slate-500">{stats.activeUsers} actifs</p>
              </div>
              <FaUsers className="h-6 w-6 text-[#F97316]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm">Formations</CardTitle>
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
            <CardTitle className="text-sm">Abonnés</CardTitle>
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

      {/* Accès rapide aux agents */}
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
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Synthèse */}
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="flex items-center justify-between text-base">
            Synthèse rapide
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
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Actions</p>
              <div className="mt-2 space-y-1 text-sm text-slate-700">
                <p>📌 {stats.trainings > 0 ? `${stats.trainings} formations` : 'Aucune formation'}</p>
                <p>📧 {stats.subscribers > 0 ? `${stats.subscribers} abonnés` : 'Aucun abonné'}</p>
                <p>👥 {stats.users > 0 ? `${stats.users} utilisateurs` : 'Aucun utilisateur'}</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Accès rapide</p>
              <div className="mt-2 flex flex-col gap-2 text-sm">
                <Link href="/admin/projects" className="text-[#1E3A8A] hover:underline">
                  📁 Projets ({stats.projects})
                </Link>
                <Link href="/admin/users" className="text-[#1E3A8A] hover:underline">
                  👤 Utilisateurs ({stats.users})
                </Link>
                <Link href="/admin/dona" className="text-[#1E3A8A] hover:underline">
                  🤖 DONA
                </Link>
                <Link href="/admin/harvey" className="text-[#1E3A8A] hover:underline">
                  🦸 HARVEY
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}