'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FaPlus, 
  FaGraduationCap, 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaChartBar,
  FaSpinner,
  FaFilter
} from 'react-icons/fa';
import { toast, Toaster } from 'sonner';

type Training = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  icon: string | null;
  duration: string | null;
  level: string | null;
  price: string | null;
  modules: string[] | null;
  color: string | null;
  created_at: string | null;
};

const levelMap: Record<string, { label: string; color: string }> = {
  'Débutant': { label: 'Débutant', color: 'bg-green-100 text-green-700' },
  'Intermédiaire': { label: 'Intermédiaire', color: 'bg-blue-100 text-blue-700' },
  'Intermédiaire à Avancé': { label: 'Intermédiaire à Avancé', color: 'bg-purple-100 text-purple-700' },
  'Avancé': { label: 'Avancé', color: 'bg-red-100 text-red-700' },
};

export default function AdminTrainingsPage() {
  const router = useRouter();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();

        if (!sessionData.user || !['admin', 'super_admin'].includes(sessionData.user.role)) {
          router.push('/login?error=unauthorized&message=Accès réservé aux administrateurs');
          return;
        }

        setIsAdmin(true);

        const { data, error } = await supabase
          .from('trainings')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erreur:', error);
          toast.error('Erreur lors du chargement des formations');
          return;
        }

        setTrainings(data || []);
      } catch (error) {
        console.error('Erreur:', error);
        toast.error('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoad();
  }, [router]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Supprimer la formation "${title}" ?`)) return;

    try {
      const { error } = await supabase
        .from('trainings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('✅ Formation supprimée avec succès');
      setTrainings(trainings.filter(t => t.id !== id));
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  // Filtrage
  const getFilteredTrainings = () => {
    let filtered = trainings;

    if (filter !== 'all') {
      filtered = filtered.filter(t => t.level === filter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(term) ||
        (t.description && t.description.toLowerCase().includes(term)) ||
        (t.slug && t.slug.toLowerCase().includes(term))
      );
    }

    return filtered;
  };

  // Statistiques
  const totalModules = trainings.reduce(
    (acc, training) => acc + (Array.isArray(training.modules) ? training.modules.length : 0),
    0
  );

  const levelStats = trainings.reduce((acc, training) => {
    const level = training.level || 'Non défini';
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const displayedTrainings = getFilteredTrainings();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] p-4">
        <div className="h-10 w-10 sm:h-12 sm:w-12 animate-spin rounded-full border-4 border-[#1E3A8A] border-t-transparent"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#F5F7FB] p-3 sm:p-4 md:p-6">
      <Toaster position="top-right" richColors />
      
      <div className="mx-auto max-w-7xl">
        {/* En-tête responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1E3A8A] flex flex-wrap items-center gap-2 sm:gap-3">
              <FaGraduationCap className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-[#F97316] flex-shrink-0" />
              <span className="truncate">Gestion des Formations</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
              Liste des formations, création, édition et suppression.
            </p>
          </div>
          <Link href="/admin/trainings/new" className="flex-shrink-0">
            <Button className="w-full sm:w-auto bg-[#F97316] hover:bg-[#ea580c] text-white text-xs sm:text-sm">
              <FaPlus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Nouvelle formation</span>
              <span className="xs:hidden">Nouvelle</span>
            </Button>
          </Link>
        </div>

        {/* Statistiques responsive */}
        <div className="mt-4 sm:mt-6 grid grid-cols-3 gap-2 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Total</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#1E3A8A]">{trainings.length}</p>
                </div>
                <FaGraduationCap className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-[#F97316]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Modules</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#1E3A8A]">{totalModules}</p>
                </div>
                <FaChartBar className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-[#F97316]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Niveaux</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#1E3A8A]">{Object.keys(levelStats).length}</p>
                </div>
                <Badge className="bg-blue-100 text-blue-700 text-xs">
                  {Object.keys(levelStats).length}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="mt-4 sm:mt-6 flex flex-col gap-3">
          <div className="flex flex-col xs:flex-row gap-2">
            <div className="relative flex-1 min-w-0">
              <input
                type="text"
                placeholder="Rechercher une formation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent"
              />
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
          </div>

          {/* Filtres */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={filter === 'all' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilter('all')}
                className={`text-xs ${filter === 'all' ? 'bg-[#1E3A8A]' : ''}`}
              >
                Tous ({trainings.length})
              </Button>
              {Object.keys(levelStats).map((level) => {
                const levelInfo = levelMap[level] || { label: level, color: 'bg-gray-100 text-gray-700' };
                return (
                  <Button 
                    key={level}
                    variant={filter === level ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setFilter(level)}
                    className={`text-xs ${filter === level ? 'bg-[#1E3A8A]' : ''}`}
                  >
                    {levelInfo.label} ({levelStats[level]})
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Liste des formations - responsive */}
        <div className="mt-4 sm:mt-6 rounded-xl sm:rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {trainings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
              <div className="rounded-full bg-slate-100 p-3 sm:p-4">
                <FaGraduationCap className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
              </div>
              <h3 className="mt-4 text-base sm:text-lg font-semibold text-slate-700">Aucune formation</h3>
              <p className="text-xs sm:text-sm text-slate-500">Commencez par créer votre première formation.</p>
              <Link href="/admin/trainings/new">
                <Button className="mt-4 bg-[#F97316] hover:bg-[#ea580c] text-white text-xs sm:text-sm">
                  <FaPlus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Créer une formation
                </Button>
              </Link>
            </div>
          ) : displayedTrainings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <p className="text-sm text-slate-500">Aucune formation ne correspond aux filtres.</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { setFilter('all'); setSearchTerm(''); }}
                className="mt-2"
              >
                Réinitialiser les filtres
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <div className="min-w-[640px] sm:min-w-full">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600">Formation</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600 hidden md:table-cell">Description</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600">Niveau</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600 hidden xs:table-cell">Durée</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedTrainings.map((training) => {
                      const level = levelMap[training.level || ''] || { 
                        label: training.level || 'Non défini', 
                        color: 'bg-gray-100 text-gray-700' 
                      };
                      
                      return (
                        <tr key={training.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition">
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <span className="text-xl sm:text-2xl flex-shrink-0">{training.icon || '📚'}</span>
                              <div className="min-w-0">
                                <p className="font-medium text-slate-800 text-xs sm:text-sm truncate max-w-[100px] xs:max-w-[150px] sm:max-w-[200px]">
                                  {training.title}
                                </p>
                                <p className="text-[10px] sm:text-xs text-slate-400 truncate max-w-[100px] xs:max-w-[150px] sm:max-w-[200px]">
                                  {training.slug}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell">
                            <p className="line-clamp-2 max-w-xs text-slate-600 text-xs sm:text-sm">
                              {training.description || 'Aucune description'}
                            </p>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <Badge className={`${level.color} text-[8px] sm:text-[10px] whitespace-nowrap`}>
                              {level.label}
                            </Badge>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 hidden xs:table-cell text-slate-600 text-xs sm:text-sm">
                            {training.duration || 'N/A'}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                            <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                              <Link href={`/training#${training.slug}`} target="_blank">
                                <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-slate-400 hover:text-[#1E3A8A]">
                                  <FaEye className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span className="sr-only">Voir</span>
                                </Button>
                              </Link>
                              <Link href={`/admin/trainings/${training.id}/edit`}>
                                <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-slate-400 hover:text-[#F97316]">
                                  <FaEdit className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span className="sr-only">Modifier</span>
                                </Button>
                              </Link>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-slate-400 hover:text-red-600"
                                onClick={() => handleDelete(training.id, training.title)}
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
    </main>
  );
}