// app/(dashboard)/admin/services/page.tsx
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
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaCog,
  FaSpinner,
  FaSearch,
  FaFilter,
  FaTimesCircle,
  FaEyeSlash,
  FaSync
} from 'react-icons/fa';
import { toast, Toaster } from 'sonner';
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal';

type Service = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  features: string[];
  is_active: boolean;
  order_index: number;
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

export default function AdminServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // ✅ État du modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: '',
    name: '',
    type: '',
    isLoading: false,
  });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async (silent: boolean = false) => {
    if (!silent) {
      setRefreshing(true);
    }

    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setServices(data || []);
      
      if (!silent) {
        toast.success(`✅ ${data?.length || 0} services chargés`);
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
      type: 'Service',
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
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', deleteModal.id);

      if (error) throw error;

      toast.success(`✅ "${deleteModal.name}" supprimé avec succès`);
      setServices(services.filter(s => s.id !== deleteModal.id));
      closeDeleteModal();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression');
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setServices(services.map(s => 
        s.id === id ? { ...s, is_active: !currentStatus } : s
      ));
      
      toast.success(`Service ${!currentStatus ? 'activé' : 'désactivé'}`);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du changement de statut');
    }
  };

  // Filtrage
  const getFilteredServices = () => {
    let filtered = services;

    if (filterStatus === 'active') {
      filtered = filtered.filter(s => s.is_active);
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(s => !s.is_active);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(term) ||
        s.description.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  const filteredServices = getFilteredServices();
  const total = services.length;
  const active = services.filter(s => s.is_active).length;

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
              <FaCog className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-[#F97316] flex-shrink-0" />
              <span className="truncate">Gestion des Services</span>
              {refreshing && (
                <FaSpinner className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-[#F97316] flex-shrink-0" />
              )}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
              Gérez les services proposés par UNITECH
            </p>
          </div>
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => loadServices(false)}
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
            <Link href="/admin/services/new" className="flex-shrink-0">
              <Button className="w-full sm:w-auto bg-[#F97316] hover:bg-[#ea580c] text-white text-xs sm:text-sm">
                <FaPlus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Nouveau service</span>
                <span className="xs:hidden">Nouveau</span>
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
                <FaCog className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-[#F97316]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Actifs</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{active}</p>
                </div>
                <FaCog className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Inactifs</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-600">{total - active}</p>
                </div>
                <FaCog className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-red-500" />
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
                placeholder="Rechercher un service..."
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
              onClick={() => loadServices(false)}
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
              <Button 
                variant={filterStatus === 'active' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilterStatus('active')}
                className={`text-xs ${filterStatus === 'active' ? 'bg-green-600' : ''}`}
              >
                Actifs ({active})
              </Button>
              <Button 
                variant={filterStatus === 'inactive' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilterStatus('inactive')}
                className={`text-xs ${filterStatus === 'inactive' ? 'bg-red-600' : ''}`}
              >
                Inactifs ({total - active})
              </Button>
            </div>
          </div>
        </div>

        {/* Liste des services */}
        <div className="mt-4 sm:mt-6 rounded-xl sm:rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {filteredServices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
              <div className="rounded-full bg-slate-100 p-3 sm:p-4">
                <FaCog className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
              </div>
              <h3 className="mt-4 text-base sm:text-lg font-semibold text-slate-700">
                {searchTerm || filterStatus !== 'all' ? 'Aucun service trouvé' : 'Aucun service'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Essayez de modifier vos filtres' 
                  : 'Commencez par créer votre premier service'}
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
                <Link href="/admin/services/new">
                  <Button className="mt-4 bg-[#F97316] hover:bg-[#ea580c] text-white">
                    <FaPlus className="mr-2 h-4 w-4" />
                    Créer un service
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
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600">Service</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600 hidden md:table-cell">Description</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600">Couleur</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600 hidden xs:table-cell">Statut</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600">Ordre</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredServices.map((service) => (
                      <tr key={service.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                        <td className="px-2 sm:px-4 py-2 sm:py-3">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <span className="text-xl sm:text-2xl flex-shrink-0">{service.icon || '📁'}</span>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-800 text-xs sm:text-sm truncate max-w-[100px] xs:max-w-[150px]">
                                {service.name}
                              </p>
                              <p className="text-[10px] sm:text-xs text-slate-400 truncate max-w-[100px] xs:max-w-[150px]">
                                {service.features?.length || 0} fonctionnalités
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell">
                          <p className="line-clamp-2 max-w-xs text-slate-600 text-xs sm:text-sm">
                            {service.description || 'Aucune description'}
                          </p>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3">
                          <Badge className={`${colorMap[service.color] || 'bg-gray-100 text-gray-700'} text-[8px] sm:text-[10px]`}>
                            {service.color}
                          </Badge>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 hidden xs:table-cell">
                          <Badge variant={service.is_active ? 'default' : 'destructive'} className="text-[8px] sm:text-[10px]">
                            {service.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-slate-600 text-xs sm:text-sm">
                          {service.order_index}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                          <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                            <button
                              onClick={() => toggleStatus(service.id, service.is_active)}
                              className={`h-7 w-7 sm:h-8 sm:w-8 rounded-lg transition flex items-center justify-center ${
                                service.is_active 
                                  ? 'text-green-600 hover:bg-green-50' 
                                  : 'text-red-600 hover:bg-red-50'
                              }`}
                              title={service.is_active ? 'Désactiver' : 'Activer'}
                            >
                              {service.is_active ? (
                                <FaEye className="h-3 w-3 sm:h-4 sm:w-4" />
                              ) : (
                                <FaEyeSlash className="h-3 w-3 sm:h-4 sm:w-4" />
                              )}
                            </button>
                            <Link href={`/admin/services/${service.id}/edit`}>
                              <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-slate-400 hover:text-[#F97316]">
                                <FaEdit className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="sr-only">Modifier</span>
                              </Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-slate-400 hover:text-red-600"
                              onClick={() => openDeleteModal(service.id, service.name)}
                            >
                              <FaTrash className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="sr-only">Supprimer</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
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
        message="Êtes-vous sûr de vouloir supprimer ce service ?"
        itemName={deleteModal.name}
        itemType={deleteModal.type}
        isLoading={deleteModal.isLoading}
      />
    </main>
  );
}