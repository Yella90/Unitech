// app/(dashboard)/admin/trainings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminDb as supabase } from '@/lib/admin-db/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaGraduationCap,
  FaSpinner,
  FaSearch,
  FaFilter,
  FaTimesCircle,
  FaEye,
  FaEyeSlash,
  FaSync,
  FaClock,
  FaLevelUpAlt,
  FaUsers,
  FaUserPlus
} from 'react-icons/fa';
import { toast, Toaster } from 'sonner';
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal';

type Training = {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  duration: string;
  level: string;
  schedule: string;
  price: string;
  modules: string[];
  color: string;
  created_at: string;
  updated_at: string;
};

const colorMap: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  orange: 'bg-orange-100 text-orange-700 border-orange-200',
  green: 'bg-green-100 text-green-700 border-green-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
  red: 'bg-red-100 text-red-700 border-red-200',
  teal: 'bg-teal-100 text-teal-700 border-teal-200',
  yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
};

const levelMap: Record<string, string> = {
  'Débutant': 'bg-green-100 text-green-700',
  'Intermédiaire': 'bg-blue-100 text-blue-700',
  'Avancé': 'bg-red-100 text-red-700',
  'Expert': 'bg-purple-100 text-purple-700',
  'Tous niveaux': 'bg-gray-100 text-gray-700',
};

export default function AdminTrainingsPage() {
  const router = useRouter();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterLevel, setFilterLevel] = useState<string>('all');

  // ✅ État du modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: '',
    name: '',
    type: 'Formation',
    isLoading: false,
  });

  useEffect(() => {
    loadTrainings();
  }, []);

  const loadTrainings = async (silent: boolean = false) => {
    if (!silent) {
      setRefreshing(true);
    }

    try {
      const { data, error } = await supabase
        .from('trainings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrainings(data || []);
      
      if (!silent) {
        toast.success(`✅ ${data?.length || 0} formations chargées`);
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

  const openDeleteModal = (id: string, name: string) => {
    setDeleteModal({
      isOpen: true,
      id,
      name,
      type: 'Formation',
      isLoading: false,
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      id: '',
      name: '',
      type: '',
      isLoading: false,
    });
  };

  const confirmDelete = async () => {
    setDeleteModal(prev => ({ ...prev, isLoading: true }));

    try {
      const { error } = await supabase
        .from('trainings')
        .delete()
        .eq('id', deleteModal.id);

      if (error) throw error;

      toast.success(`✅ "${deleteModal.name}" supprimée avec succès`);
      setTrainings(trainings.filter(t => t.id !== deleteModal.id));
      closeDeleteModal();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression');
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const getFilteredTrainings = () => {
    let filtered = trainings;

    if (filterLevel !== 'all') {
      filtered = filtered.filter(t => t.level === filterLevel);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(term) ||
        t.description.toLowerCase().includes(term) ||
        t.slug.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  const filteredTrainings = getFilteredTrainings();
  const total = trainings.length;
  const levels = Array.from(new Set(trainings.map(t => t.level).filter(Boolean)));

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
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1E3A8A] flex flex-wrap items-center gap-2 sm:gap-3">
              <FaGraduationCap className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-[#F97316] flex-shrink-0" />
              <span className="truncate">Gestion des Formations</span>
              {refreshing && (
                <FaSpinner className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-[#F97316] flex-shrink-0" />
              )}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
              Gérez les formations proposées par UNITECH
            </p>
          </div>
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            {/* ✅ Lien vers les inscriptions */}
            <Link href="/admin/training-registrations">
              <Button 
                variant="outline" 
                size="sm"
                className="border-[#F97316] text-[#F97316] hover:bg-[#F97316] hover:text-white text-xs sm:text-sm"
              >
                <FaUsers className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Inscriptions</span>
                <span className="xs:hidden">📋</span>
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => loadTrainings(false)}
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
            <Link href="/admin/trainings/new">
              <Button className="w-full sm:w-auto bg-[#F97316] hover:bg-[#ea580c] text-white text-xs sm:text-sm">
                <FaPlus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Nouvelle formation</span>
                <span className="xs:hidden">Nouvelle</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistiques */}
        <div className="mt-4 sm:mt-6 grid grid-cols-3 gap-2 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Total</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#1E3A8A]">{total}</p>
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
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#1E3A8A]">
                    {trainings.reduce((acc, t) => acc + (t.modules?.length || 0), 0)}
                  </p>
                </div>
                <FaGraduationCap className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-[#F97316]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Niveaux</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#1E3A8A]">{levels.length}</p>
                </div>
                <FaLevelUpAlt className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-[#F97316]" />
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
                placeholder="Rechercher une formation..."
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
              onClick={() => loadTrainings(false)}
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
                variant={filterLevel === 'all' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilterLevel('all')}
                className={`text-xs ${filterLevel === 'all' ? 'bg-[#1E3A8A]' : ''}`}
              >
                Tous ({total})
              </Button>
              {levels.map(level => {
                const count = trainings.filter(t => t.level === level).length;
                const levelColor = levelMap[level] || 'bg-gray-100 text-gray-700';
                return (
                  <Button 
                    key={level}
                    variant={filterLevel === level ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setFilterLevel(filterLevel === level ? 'all' : level)}
                    className={`text-xs ${filterLevel === level ? 'bg-[#1E3A8A]' : ''}`}
                  >
                    <span className={`inline-block h-2 w-2 rounded-full mr-1 ${levelColor.split(' ')[0]}`} />
                    {level} ({count})
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Liste des formations */}
        <div className="mt-4 sm:mt-6 rounded-xl sm:rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {filteredTrainings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
              <div className="rounded-full bg-slate-100 p-3 sm:p-4">
                <FaGraduationCap className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
              </div>
              <h3 className="mt-4 text-base sm:text-lg font-semibold text-slate-700">
                {searchTerm || filterLevel !== 'all' ? 'Aucune formation trouvée' : 'Aucune formation'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                {searchTerm || filterLevel !== 'all' 
                  ? 'Essayez de modifier vos filtres' 
                  : 'Commencez par créer votre première formation'}
              </p>
              {searchTerm || filterLevel !== 'all' ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => { setSearchTerm(''); setFilterLevel('all'); }}
                  className="mt-4"
                >
                  Réinitialiser les filtres
                </Button>
              ) : (
                <Link href="/admin/trainings/new">
                  <Button className="mt-4 bg-[#F97316] hover:bg-[#ea580c] text-white">
                    <FaPlus className="mr-2 h-4 w-4" />
                    Créer une formation
                  </Button>
                </Link>
              )}
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
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600">Modules</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrainings.map((training) => {
                      const levelColor = levelMap[training.level] || 'bg-gray-100 text-gray-700';
                      return (
                        <tr key={training.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <span className="text-xl sm:text-2xl flex-shrink-0">{training.icon || '📚'}</span>
                              <div className="min-w-0">
                                <p className="font-medium text-slate-800 text-xs sm:text-sm truncate max-w-[100px] xs:max-w-[150px]">
                                  {training.title}
                                </p>
                                <p className="text-[10px] sm:text-xs text-slate-400 truncate max-w-[100px] xs:max-w-[150px]">
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
                            <Badge className={`${levelColor} text-[8px] sm:text-[10px]`}>
                              {training.level || 'Non défini'}
                            </Badge>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 hidden xs:table-cell">
                            <span className="flex items-center gap-1 text-slate-600 text-xs">
                              <FaClock className="h-3 w-3" />
                              {training.duration || 'N/A'}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-slate-600 text-xs text-center">
                            {training.modules?.length || 0}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                            <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                              {/* ✅ Lien vers les inscriptions de cette formation */}
                              <Link href={`/admin/training-registrations?training=${training.id}`}>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-slate-400 hover:text-[#F97316]"
                                  title="Voir les inscriptions"
                                >
                                  <FaUserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span className="sr-only">Inscriptions</span>
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
                                onClick={() => openDeleteModal(training.id, training.title)}
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
        message="Êtes-vous sûr de vouloir supprimer cette formation ?"
        itemName={deleteModal.name}
        itemType={deleteModal.type}
        isLoading={deleteModal.isLoading}
      />
    </main>
  );
}