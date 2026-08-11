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
  FaExclamationTriangle,
  FaChartLine,
  FaFolderOpen,
  FaSpinner
} from 'react-icons/fa';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cookies } from 'next/headers';

// ✅ Récupérer la session via les cookies
async function getSessionFromCookies() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return null;
    }

    const { data: session, error } = await supabase
      .from('sessions')
      .select('*, users(*)')
      .eq('token', sessionToken)
      .single();

    if (error || !session) {
      return null;
    }

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
    icon: <FaClock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
  },
  'in-progress': { 
    label: 'En cours', 
    variant: 'default',
    icon: <FaClock className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-pulse" />
  },
  'testing': { 
    label: 'En test', 
    variant: 'outline',
    icon: <FaExclamationTriangle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
  },
  'pending': { 
    label: 'En attente', 
    variant: 'secondary',
    icon: <FaPauseCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
  },
  'completed': { 
    label: 'Terminé', 
    variant: 'default',
    icon: <FaCheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
  },
  'on-hold': { 
    label: 'En pause', 
    variant: 'destructive',
    icon: <FaPauseCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
  }
};

// ✅ Mapping des couleurs
const colorMap: Record<string, string> = {
  'blue': 'from-blue-50 to-blue-100 border-blue-200',
  'orange': 'from-orange-50 to-orange-100 border-orange-200',
  'green': 'from-green-50 to-green-100 border-green-200'
};

export default async function AdminProjectsPage() {
  const isAdmin = await checkAdminAccess();
  
  if (!isAdmin) {
    console.log('🔒 Accès non autorisé, redirection vers /login');
    redirect('/login?error=unauthorized&message=Accès réservé aux administrateurs');
  }

  console.log('✅ Accès autorisé, chargement des projets...');

  const projects = await getProjects();
  console.log(`📊 ${projects.length} projets chargés`);

  // Calcul des statistiques
  const total = projects.length;
  const inProgress = projects.filter(p => p.status === 'in-progress').length;
  const completed = projects.filter(p => p.status === 'completed').length;
  const planning = projects.filter(p => p.status === 'planning').length;
  const avgProgress = total > 0 ? Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / total) : 0;

  return (
    <main className="min-h-screen bg-[#F5F7FB] p-3 sm:p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        {/* En-tête responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1E3A8A] flex flex-wrap items-center gap-2 sm:gap-3">
              <FaProjectDiagram className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-[#F97316] flex-shrink-0" />
              <span className="truncate">Gestion des Projets</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
              Gérez tous vos projets, suivez leur progression et leurs jalons.
            </p>
          </div>
          <Link href="/admin/projects/new" className="flex-shrink-0">
            <Button className="w-full sm:w-auto bg-[#F97316] hover:bg-[#ea580c] text-white font-semibold text-xs sm:text-sm">
              <FaPlus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Nouveau projet</span>
              <span className="xs:hidden">Nouveau</span>
            </Button>
          </Link>
        </div>

        {/* Statistiques rapides - Version responsive */}
        <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Total</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#1E3A8A]">{total}</p>
                </div>
                <FaFolderOpen className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-[#1E3A8A]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">En cours</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">{inProgress}</p>
                </div>
                <FaClock className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Terminés</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{completed}</p>
                </div>
                <FaCheckCircle className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Avancement</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-orange-500">{avgProgress}%</p>
                </div>
                <FaChartLine className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des projets - Version responsive */}
        <div className="mt-4 sm:mt-6 rounded-xl sm:rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
              <div className="rounded-full bg-slate-100 p-3 sm:p-4">
                <FaProjectDiagram className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
              </div>
              <h3 className="mt-4 text-base sm:text-lg font-semibold text-slate-700">Aucun projet</h3>
              <p className="text-xs sm:text-sm text-slate-500">Commencez par créer votre premier projet.</p>
              <Link href="/admin/projects/new">
                <Button className="mt-4 bg-[#F97316] hover:bg-[#ea580c] text-white text-xs sm:text-sm">
                  <FaPlus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Créer un projet
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <div className="min-w-[640px] sm:min-w-full">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600">Projet</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600 hidden md:table-cell">Description</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600">Avancement</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600 hidden sm:table-cell">Statut</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project) => {
                      const status = statusMap[project.status] || statusMap['planning'];
                      const colors = colorMap[project.color] || colorMap['blue'];
                      const progress = project.progress || 0;

                      return (
                        <tr key={project.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                          {/* Colonne Projet - responsive */}
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <span className="text-xl sm:text-2xl flex-shrink-0">{project.icon || '📁'}</span>
                              <div className="min-w-0">
                                <p className="font-medium text-slate-800 text-xs sm:text-sm truncate max-w-[80px] xs:max-w-[120px] sm:max-w-[200px]">
                                  {project.name}
                                </p>
                                <p className="text-[10px] sm:text-xs text-slate-400 truncate max-w-[80px] xs:max-w-[120px] sm:max-w-[200px]">
                                  {project.slug}
                                </p>
                              </div>
                            </div>
                          </td>
                          
                          {/* Colonne Description - cachée sur mobile */}
                          <td className="px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell">
                            <p className="line-clamp-2 max-w-xs text-slate-600 text-xs sm:text-sm">
                              {project.description || 'Aucune description'}
                            </p>
                          </td>
                          
                          {/* Colonne Progression - responsive */}
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <div className="w-20 sm:w-24 md:w-32">
                              <div className="flex justify-between text-[10px] sm:text-xs">
                                <span className="text-slate-500 hidden xs:inline">Avancement</span>
                                <span className="font-medium text-[#1E3A8A]">{progress}%</span>
                              </div>
                              <Progress value={progress} className="h-1.5 sm:h-2" />
                            </div>
                          </td>
                          
                          {/* Colonne Statut - cachée sur très petit écran */}
                          <td className="px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell">
                            <Badge variant={status.variant} className="flex w-fit items-center gap-1 text-[8px] sm:text-[10px] whitespace-nowrap">
                              {status.icon}
                              <span className="hidden xs:inline">{status.label}</span>
                              <span className="xs:hidden">{status.label.substring(0, 3)}</span>
                            </Badge>
                          </td>
                          
                          {/* Colonne Actions - responsive */}
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                            <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                              <Link href={`/projects/${project.slug}`} target="_blank">
                                <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-slate-400 hover:text-[#1E3A8A]">
                                  <FaEye className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span className="sr-only">Voir</span>
                                </Button>
                              </Link>
                              <Link href={`/admin/projects/${project.id}/edit`}>
                                <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-slate-400 hover:text-[#F97316]">
                                  <FaEdit className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span className="sr-only">Modifier</span>
                                </Button>
                              </Link>
                              <Link href={`/admin/projects/${project.id}/delete`}>
                                <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-slate-400 hover:text-red-600">
                                  <FaTrash className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span className="sr-only">Supprimer</span>
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
            </div>
          )}
        </div>
      </div>
    </main>
  );
}