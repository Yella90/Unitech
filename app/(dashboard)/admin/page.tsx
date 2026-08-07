// app/(dashboard)/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FaProjectDiagram, FaUsers, FaGraduationCap, FaEnvelope, FaChartLine } from 'react-icons/fa';
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
        // 1. Vérifier la session
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();

        if (!sessionData.user || !['admin', 'super_admin'].includes(sessionData.user.role)) {
          router.push('/login?error=unauthorized&message=Accès réservé aux administrateurs');
          return;
        }

        setIsAdmin(true);

        // 2. Récupérer les statistiques
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

  // ✅ Calcul du taux de progression (basé sur les projets actifs)
  const progressRate = stats.projects > 0 
    ? Math.round((stats.activeProjects / stats.projects) * 100)
    : 0;

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
      <div className="mx-auto max-w-7xl">
        {/* En-tête */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#F97316]">Espace administrateur</p>
            <h1 className="mt-2 text-4xl font-bold text-[#1E3A8A]">Tableau de bord</h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Accédez aux actions clés : projets, utilisateurs, formations et abonnés.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/admin/projects">
              <Button className="bg-[#1E3A8A] hover:bg-[#162f58] text-white">Projets</Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="outline">Utilisateurs</Button>
            </Link>
          </div>
        </div>

        {/* Statistiques */}
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Projets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-3xl font-bold text-[#1E3A8A]">{stats.projects}</p>
                  <p className="text-sm text-slate-500">
                    {stats.activeProjects} en cours
                  </p>
                </div>
                <FaProjectDiagram className="h-8 w-8 text-[#F97316]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Utilisateurs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-3xl font-bold text-[#1E3A8A]">{stats.users}</p>
                  <p className="text-sm text-slate-500">
                    {stats.activeUsers} actifs
                  </p>
                </div>
                <FaUsers className="h-8 w-8 text-[#F97316]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Formations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-3xl font-bold text-[#1E3A8A]">{stats.trainings}</p>
                  <p className="text-sm text-slate-500">Programmes</p>
                </div>
                <FaGraduationCap className="h-8 w-8 text-[#F97316]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Abonnés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-3xl font-bold text-[#1E3A8A]">{stats.subscribers}</p>
                  <p className="text-sm text-slate-500">Newsletter</p>
                </div>
                <FaEnvelope className="h-8 w-8 text-[#F97316]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Synthèse */}
        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-[#1E3A8A]">Synthèse rapide</h2>
              <p className="mt-2 text-slate-500">
                Suivez les indicateurs importants et accédez rapidement aux sections les plus utilisées.
              </p>
            </div>
            <Badge className="bg-green-100 text-green-700">
              {stats.projects > 0 ? 'Projets actifs' : 'Aucun projet'}
            </Badge>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {/* Performance */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Performance</p>
              <div className="mt-4 flex items-center gap-3">
                <FaChartLine className="h-6 w-6 text-[#1E3A8A]" />
                <div>
                  <p className="text-2xl font-semibold text-[#1E3A8A]">{progressRate}%</p>
                  <p className="text-sm text-slate-500">
                    {stats.activeProjects} / {stats.projects} projets en cours
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Actions</p>
              <div className="mt-4 space-y-2 text-sm text-slate-700">
                <p>📌 {stats.trainings > 0 ? `${stats.trainings} formations disponibles` : 'Aucune formation'}</p>
                <p>📧 {stats.subscribers > 0 ? `${stats.subscribers} abonnés à la newsletter` : 'Aucun abonné'}</p>
                <p>👥 {stats.users > 0 ? `${stats.users} utilisateurs enregistrés` : 'Aucun utilisateur'}</p>
              </div>
            </div>

            {/* Accès rapide */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Accès rapide</p>
              <div className="mt-4 flex flex-col gap-3">
                <Link href="/admin/projects" className="text-sm font-medium text-[#1E3A8A] hover:underline">
                  📁 Projets ({stats.projects})
                </Link>
                <Link href="/admin/users" className="text-sm font-medium text-[#1E3A8A] hover:underline">
                  👤 Utilisateurs ({stats.users})
                </Link>
                <Link href="/admin/subscribers" className="text-sm font-medium text-[#1E3A8A] hover:underline">
                  📬 Abonnés ({stats.subscribers})
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}