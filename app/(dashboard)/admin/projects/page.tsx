// app/(dashboard)/admin/projects/page.tsx
import { supabase } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaProjectDiagram,
  FaCheckCircle,
  FaClock,
  FaPauseCircle,
  FaExclamationTriangle
} from 'react-icons/fa';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cookies } from 'next/headers';

// ✅ Récupérer la session via les cookies (comme dans login)
async function getSessionFromCookies() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return null;
    }

    // Vérifier la session dans la base de données
    const { data: session, error } = await supabase
      .from('sessions')
      .select('*, users(*)')
      .eq('token', sessionToken)
      .single();

    if (error || !session) {
      return null;
    }

    // Vérifier l'expiration
    if (new Date(session.expires_at) < new Date()) {
      return null;
    }

    return session;
  } catch (error) {
    console.error('Erreur récupération session:', error);
    return null;
  }
}

// ✅ Vérifier si l'utilisateur est admin
async function checkAdminAccess() {
  const session = await getSessionFromCookies();
  
  if (!session) {
    return false;
  }

  const user = session.users;
  return user && ['admin', 'super_admin'].includes(user.role);
}

// ✅ Récupérer les projets depuis Supabase
async function getProjects() {
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur lors du chargement des projets:', error);
    return [];
  }

  // Récupérer les étapes pour chaque projet
  for (const project of projects) {
    const { data: stages } = await supabase
      .from('project_stages')
      .select('*')
      .eq('project_id', project.id)
      .order('created_at', { ascending: true });
    
    project.stages = stages || [];
  }

  return projects;
}

// ✅ Mapping des statuts
const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  'planning': { 
    label: 'Planification', 
    variant: 'secondary',
    icon: <FaClock className="h-3.5 w-3.5" />
  },
  'in-progress': { 
    label: 'En cours', 
    variant: 'default',
    icon: <FaClock className="h-3.5 w-3.5 animate-pulse" />
  },
  'testing': { 
    label: 'En test', 
    variant: 'outline',
    icon: <FaExclamationTriangle className="h-3.5 w-3.5" />
  },
  'pending': { 
    label: 'En attente', 
    variant: 'secondary',
    icon: <FaPauseCircle className="h-3.5 w-3.5" />
  },
  'completed': { 
    label: 'Terminé', 
    variant: 'default',
    icon: <FaCheckCircle className="h-3.5 w-3.5" />
  },
  'on-hold': { 
    label: 'En pause', 
    variant: 'destructive',
    icon: <FaPauseCircle className="h-3.5 w-3.5" />
  }
};

// ✅ Mapping des couleurs
const colorMap: Record<string, string> = {
  'blue': 'from-blue-50 to-blue-100 border-blue-200',
  'orange': 'from-orange-50 to-orange-100 border-orange-200',
  'green': 'from-green-50 to-green-100 border-green-200'
};

export default async function AdminProjectsPage() {
  // ✅ Vérifier l'accès admin (comme dans login)
  const isAdmin = await checkAdminAccess();
  
  if (!isAdmin) {
    console.log('🔒 Accès non autorisé, redirection vers /login');
    redirect('/login?error=unauthorized&message=Accès réservé aux administrateurs');
  }

  console.log('✅ Accès autorisé, chargement des projets...');

  // ✅ Récupérer les projets
  const projects = await getProjects();
  console.log(`📊 ${projects.length} projets chargés`);

  return (
    <main className="min-h-screen bg-[#F5F7FB] p-6">
      <div className="mx-auto max-w-7xl">
        {/* En-tête */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#1E3A8A] flex items-center gap-3">
              <FaProjectDiagram className="h-8 w-8 text-[#F97316]" />
              Gestion des Projets
            </h1>
            <p className="mt-1 text-slate-500">
              Gérez tous vos projets, suivez leur progression et leurs jalons.
            </p>
          </div>
          <Link href="/admin/projects/new">
            <Button className="bg-[#F97316] hover:bg-[#ea580c] text-white font-semibold">
              <FaPlus className="mr-2 h-4 w-4" />
              Nouveau projet
            </Button>
          </Link>
        </div>

        {/* Statistiques rapides */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Total</p>
              <p className="text-2xl font-bold text-[#1E3A8A]">{projects.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">En cours</p>
              <p className="text-2xl font-bold text-blue-600">
                {projects.filter(p => p.status === 'in-progress').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Terminés</p>
              <p className="text-2xl font-bold text-green-600">
                {projects.filter(p => p.status === 'completed').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Planification</p>
              <p className="text-2xl font-bold text-orange-500">
                {projects.filter(p => p.status === 'planning').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Liste des projets */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-slate-100 p-4">
                <FaProjectDiagram className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-700">Aucun projet</h3>
              <p className="text-sm text-slate-500">Commencez par créer votre premier projet.</p>
              <Link href="/admin/projects/new">
                <Button className="mt-4 bg-[#F97316] hover:bg-[#ea580c] text-white">
                  <FaPlus className="mr-2 h-4 w-4" />
                  Créer un projet
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-left">
                    <th className="px-4 py-3 font-semibold text-slate-600">Projet</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Description</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Progression</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 hidden sm:table-cell">Statut</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => {
                    const status = statusMap[project.status] || statusMap['planning'];
                    const colors = colorMap[project.color] || colorMap['blue'];
                    const progress = project.progress || 0;

                    return (
                      <tr key={project.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{project.icon || '📁'}</span>
                            <div>
                              <p className="font-medium text-slate-800">{project.name}</p>
                              <p className="text-xs text-slate-400">{project.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <p className="line-clamp-2 max-w-xs text-slate-600">
                            {project.description || 'Aucune description'}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-32">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-500">Avancement</span>
                              <span className="font-medium text-[#1E3A8A]">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <Badge variant={status.variant} className="flex w-fit items-center gap-1.5">
                            {status.icon}
                            {status.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/projects/${project.slug}`} target="_blank">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-[#1E3A8A]">
                                <FaEye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/admin/projects/${project.id}/edit`}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-[#F97316]">
                                <FaEdit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/admin/projects/${project.id}/delete`}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-red-600">
                                <FaTrash className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}