// app/(dashboard)/admin/projects/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  FaSpinner,
  FaSync,
  FaSearch,
  FaFilter,
  FaTimesCircle
} from 'react-icons/fa';
import { toast, Toaster } from 'sonner';
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal';

type Project = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  progress: number;
  status: string;
  next_milestone: string;
  gallery: string[];
  created_at: string;
  updated_at: string;
  stages?: any[];
};

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

const colorMap: Record<string, string> = {
  'blue': 'from-blue-50 to-blue-100 border-blue-200',
  'orange': 'from-orange-50 to-orange-100 border-orange-200',
  'green': 'from-green-50 to-green-100 border-green-200',
  'purple': 'from-purple-50 to-purple-100 border-purple-200',
  'red': 'from-red-50 to-red-100 border-red-200',
  'teal': 'from-teal-50 to-teal-100 border-teal-200',
  'indigo': 'from-indigo-50 to-indigo-100 border-indigo-200',
  'yellow': 'from-yellow-50 to-yellow-100 border-yellow-200',
};

export default function AdminProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // ✅ État du modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: '',
    name: '',
    type: 'Projet',
    isLoading: false,
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async (silent: boolean = false) => {
    if (!silent) {
      setRefreshing(true);
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Récupérer les étapes pour chaque projet
      for (const project of data || []) {
        const { data: stages } = await supabase
          .from('project_stages')
          .select('*')
          .eq('project_id', project.id)
          .order('created_at', { ascending: true });
        
        project.stages = stages || [];
      }

      setProjects(data || []);
      
      if (!silent) {
        toast.success(`✅ ${data?.length || 0} projets chargés`);
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      if (!silent) toast.error('Erreur lors du chargement');
    } finally {
      if (!silent) {
        setRefreshing(false);
        setLoading(false);
      }
    }
  };

  // ✅ Ouvrir le modal de confirmation
  const openDeleteModal = (id: string, name: string) => {
    setDeleteModal({
      isOpen: true,
      id,
      name,
      type: 'Projet',
      isLoading: false,
    });
  };

  // ✅ Fermer le modal
  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      id: '',
      name: '',
      type: '',
      isLoading: false,
    });
  };

  // ✅ Confirmer la suppression
  const confirmDelete = async () => {
    setDeleteModal(prev => ({ ...prev, isLoading: true }));

    try {
      // Supprimer d'abord les étapes associées
      await supabase
        .from('project_stages')
        .delete()
        .eq('project_id', deleteModal.id);

      // Puis supprimer le projet
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', deleteModal.id);

      if (error) throw error;

      toast.success(`✅ "${deleteModal.name}" supprimé avec succès`);
      setProjects(projects.filter(p => p.id !== deleteModal.id));
      closeDeleteModal();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression');
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  // ✅ Filtrer les projets
  const getFilteredProjects = () => {
    let filtered = projects;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.slug.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  const filteredProjects = getFilteredProjects();
  const total = projects.length;
  const inProgress = projects.filter(p => p.status === 'in-progress').length;
  const completed = projects.filter(p => p.status === 'completed').length;
  const planning = projects.filter(p => p.status === 'planning').length;
  const avgProgress = total > 0 ? Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / total) : 0;

  // ✅ Statistiques par statut
  const statusCounts = projects.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] p-4">
        <div className="h-10 w-10 sm:h-12 sm:w-12 animate-spin rounded-full border-4 border-[#1E3A8A] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F7FB] p-3 sm:p-4 md:p-6">
      <Toaster position="top-right" richColors />
      
      <div className="mx-auto max-w-7xl">
        {/* En-tête responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1E3A8A] flex flex-wrap items-center gap-2 sm:gap-3">
              <FaProjectDiagram className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-[#F97316] flex-shrink-0" />
              <span className="truncate">Gestion des Projets</span>
              {refreshing && (
                <FaSpinner className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-[#F97316] flex-shrink-0" />
              )}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
              Gérez tous vos projets, suivez leur progression et leurs jalons.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => loadProjects(false)}
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
            <Link href="/admin/projects/new" className="flex-shrink-0">
              <Button className="w-full sm:w-auto bg-[#F97316] hover:bg-[#ea580c] text-white font-semibold text-xs sm:text-sm">
                <FaPlus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Nouveau projet</span>
                <span className="xs:hidden">Nouveau</span>
              </Button>
            </Link>
          </div>
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

        {/* Recherche et filtres */}
        <div className="mt-4 sm:mt-6 flex flex-col gap-3">
          <div className="flex flex-col xs:flex-row gap-2">
            <div className="relative flex-1 min-w-0">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3 w-3 sm:h-4 sm:w-4" />
              <input
                type="text"
                placeholder="Rechercher un projet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-8 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <FaTimesCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex-shrink-0 lg:hidden"
            >
              <FaFilter className="mr-2 h-3 w-3" />
              Filtres
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadProjects(false)}
              disabled={refreshing}
              className="flex-shrink-0 text-xs sm:text-sm"
            >
              {refreshing ? (
                <FaSpinner className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
              ) : (
                <FaSearch className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
            </Button>
          </div>

          {/* Filtres */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={filterStatus === 'all' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilterStatus('all')}
                className={`text-xs ${filterStatus === 'all' ? 'bg-[#1E3A8A]' : ''}`}
              >
                Tous ({total})
              </Button>
              {Object.entries(statusMap).map(([status, config]) => {
                const count = statusCounts[status] || 0;
                if (count === 0) return null;
                return (
                  <Button 
                    key={status}
                    variant={filterStatus === status ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}
                    className={`text-xs ${filterStatus === status ? 'bg-[#1E3A8A]' : ''}`}
                  >
                    <span className="flex items-center gap-1">
                      {config.icon}
                      <span className="hidden xs:inline">{config.label}</span>
                      <span className="xs:hidden">{config.label.substring(0, 3)}</span>
                      <span className="text-[10px] text-slate-400">({count})</span>
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Liste des projets - Version responsive */}
        <div className="mt-4 sm:mt-6 rounded-xl sm:rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
              <div className="rounded-full bg-slate-100 p-3 sm:p-4">
                <FaProjectDiagram className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
              </div>
              <h3 className="mt-4 text-base sm:text-lg font-semibold text-slate-700">
                {searchTerm || filterStatus !== 'all' ? 'Aucun projet trouvé' : 'Aucun projet'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Essayez de modifier vos filtres' 
                  : 'Commencez par créer votre premier projet'}
              </p>
              {searchTerm || filterStatus !== 'all' ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}
                  className="mt-4"
                >
                  Réinitialiser les filtres
                </Button>
              ) : (
                <Link href="/admin/projects/new">
                  <Button className="mt-4 bg-[#F97316] hover:bg-[#ea580c] text-white text-xs sm:text-sm">
                    <FaPlus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    Créer un projet
                  </Button>
                </Link>
              )}
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
                    {filteredProjects.map((project) => {
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
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-slate-400 hover:text-red-600"
                                onClick={() => openDeleteModal(project.id, project.name)}
                              >
                                <FaTrash className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="sr-only">Supprimer</span>
                              </Button>
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

      {/* ✅ Modal de confirmation de suppression */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer ce projet ?"
        itemName={deleteModal.name}
        itemType={deleteModal.type}
        isLoading={deleteModal.isLoading}
      />
    </main>
  );
}