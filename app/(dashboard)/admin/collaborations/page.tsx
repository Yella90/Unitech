// app/(dashboard)/admin/collaborations/page.tsx
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
  FaHandshake,
  FaSpinner,
  FaSearch,
  FaFilter,
  FaTimesCircle,
  FaEye,
  FaEyeSlash,
  FaSync
} from 'react-icons/fa';
import { toast, Toaster } from 'sonner';
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal';

type Collaboration = {
  id: string;
  name: string;
  type: string;
  status: string;
  contact: { name?: string; email?: string; phone?: string } | null;
  contributions: string[] | null;
  projects: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const typeMap: Record<string, { label: string; color: string }> = {
  partner: { label: 'Partenaire', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  association: { label: 'Association', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  supplier: { label: 'Fournisseur', color: 'bg-green-100 text-green-700 border-green-200' },
  consultant: { label: 'Consultant', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  investor: { label: 'Investisseur', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
};

const statusMap: Record<string, { label: string; color: string }> = {
  active: { label: 'Actif', color: 'bg-green-100 text-green-700 border-green-200' },
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  inactive: { label: 'Inactif', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  ended: { label: 'Terminé', color: 'bg-red-100 text-red-700 border-red-200' },
};

export default function AdminCollaborationsPage() {
  const router = useRouter();
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending' | 'inactive' | 'ended'>('all');

  // ✅ État du modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: '',
    name: '',
    type: '',
    isLoading: false,
  });

  useEffect(() => {
    loadCollaborations();
  }, []);

  const loadCollaborations = async (silent: boolean = false) => {
    if (!silent) {
      setRefreshing(true);
    }

    try {
      const { data, error } = await supabase
        .from('collaborations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCollaborations(data || []);
      
      if (!silent) {
        toast.success(`✅ ${data?.length || 0} collaborations chargées`);
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

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const { error } = await supabase
        .from('collaborations')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setCollaborations(collaborations.map(c => 
        c.id === id ? { ...c, status: newStatus } : c
      ));
      
      toast.success(`Collaboration ${newStatus === 'active' ? 'activée' : 'désactivée'}`);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du changement de statut');
    }
  };

  // ✅ Ouvrir le modal de confirmation
  const openDeleteModal = (id: string, name: string, type: string) => {
    setDeleteModal({
      isOpen: true,
      id,
      name,
      type,
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
        .from('collaborations')
        .delete()
        .eq('id', deleteModal.id);

      if (error) throw error;

      toast.success(`✅ "${deleteModal.name}" supprimée avec succès`);
      setCollaborations(collaborations.filter(c => c.id !== deleteModal.id));
      closeDeleteModal();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression');
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  // ✅ Filtrer les collaborations
  const getFilteredCollaborations = () => {
    let filtered = collaborations;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(c => c.status === filterStatus);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(term) ||
        c.type.toLowerCase().includes(term) ||
        (c.notes && c.notes.toLowerCase().includes(term)) ||
        (c.contact?.name && c.contact.name.toLowerCase().includes(term)) ||
        (c.contact?.email && c.contact.email.toLowerCase().includes(term))
      );
    }

    return filtered;
  };

  const filteredCollaborations = getFilteredCollaborations();
  const total = collaborations.length;
  const active = collaborations.filter(c => c.status === 'active').length;

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
              <FaHandshake className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-[#F97316] flex-shrink-0" />
              <span className="truncate">Gestion des Collaborations</span>
              {refreshing && (
                <FaSpinner className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-[#F97316] flex-shrink-0" />
              )}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
              Gérez les partenaires, associations, fournisseurs et consultants
            </p>
          </div>
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => loadCollaborations(false)}
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
            <Link href="/admin/collaborations/new">
              <Button className="w-full sm:w-auto bg-[#F97316] hover:bg-[#ea580c] text-white text-xs sm:text-sm">
                <FaPlus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Nouvelle collaboration</span>
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
                <FaHandshake className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-[#F97316]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Actives</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{active}</p>
                </div>
                <FaHandshake className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Types</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#1E3A8A]">
                    {new Set(collaborations.map(c => c.type)).size}
                  </p>
                </div>
                <FaHandshake className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-[#F97316]" />
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
                placeholder="Rechercher une collaboration..."
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
              onClick={() => loadCollaborations(false)}
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
                variant={filterStatus === 'pending' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilterStatus('pending')}
                className={`text-xs ${filterStatus === 'pending' ? 'bg-yellow-600' : ''}`}
              >
                En attente ({collaborations.filter(c => c.status === 'pending').length})
              </Button>
              <Button 
                variant={filterStatus === 'inactive' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilterStatus('inactive')}
                className={`text-xs ${filterStatus === 'inactive' ? 'bg-gray-600' : ''}`}
              >
                Inactifs ({collaborations.filter(c => c.status === 'inactive').length})
              </Button>
              <Button 
                variant={filterStatus === 'ended' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilterStatus('ended')}
                className={`text-xs ${filterStatus === 'ended' ? 'bg-red-600' : ''}`}
              >
                Terminés ({collaborations.filter(c => c.status === 'ended').length})
              </Button>
            </div>
          </div>
        </div>

        {/* Liste des collaborations */}
        <div className="mt-4 sm:mt-6 rounded-xl sm:rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {filteredCollaborations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
              <div className="rounded-full bg-slate-100 p-3 sm:p-4">
                <FaHandshake className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
              </div>
              <h3 className="mt-4 text-base sm:text-lg font-semibold text-slate-700">
                {searchTerm || filterStatus !== 'all' ? 'Aucune collaboration trouvée' : 'Aucune collaboration'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Essayez de modifier vos filtres' 
                  : 'Commencez par créer votre première collaboration'}
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
                <Link href="/admin/collaborations/new">
                  <Button className="mt-4 bg-[#F97316] hover:bg-[#ea580c] text-white">
                    <FaPlus className="mr-2 h-4 w-4" />
                    Créer une collaboration
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
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600">Nom</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600 hidden md:table-cell">Type</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600">Statut</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600 hidden xs:table-cell">Contact</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600">Contrib.</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCollaborations.map((collab) => {
                      const typeInfo = typeMap[collab.type] || { label: collab.type, color: 'bg-gray-100 text-gray-700' };
                      const statusInfo = statusMap[collab.status] || { label: collab.status, color: 'bg-gray-100 text-gray-700' };
                      
                      return (
                        <tr key={collab.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <div className="min-w-0">
                              <p className="font-medium text-slate-800 text-xs sm:text-sm truncate max-w-[100px] xs:max-w-[150px]">
                                {collab.name}
                              </p>
                              {collab.notes && (
                                <p className="text-[10px] sm:text-xs text-slate-400 truncate max-w-[100px] xs:max-w-[150px]">
                                  {collab.notes}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell">
                            <Badge className={`${typeInfo.color} text-[8px] sm:text-[10px]`}>
                              {typeInfo.label}
                            </Badge>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <Badge className={`${statusInfo.color} text-[8px] sm:text-[10px]`}>
                              {statusInfo.label}
                            </Badge>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 hidden xs:table-cell">
                            <span className="text-slate-600 text-xs truncate max-w-[100px]">
                              {collab.contact?.name || collab.contact?.email || '—'}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-slate-600 text-xs text-center">
                            {collab.contributions?.length || 0}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                            <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                              <button
                                onClick={() => handleToggleStatus(collab.id, collab.status)}
                                className={`h-7 w-7 sm:h-8 sm:w-8 rounded-lg transition flex items-center justify-center ${
                                  collab.status === 'active' 
                                    ? 'text-green-600 hover:bg-green-50' 
                                    : 'text-gray-400 hover:bg-gray-50'
                                }`}
                                title={collab.status === 'active' ? 'Désactiver' : 'Activer'}
                              >
                                {collab.status === 'active' ? (
                                  <FaEye className="h-3 w-3 sm:h-4 sm:w-4" />
                                ) : (
                                  <FaEyeSlash className="h-3 w-3 sm:h-4 sm:w-4" />
                                )}
                              </button>
                              <Link href={`/admin/collaborations/${collab.id}/edit`}>
                                <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-slate-400 hover:text-[#F97316]">
                                  <FaEdit className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span className="sr-only">Modifier</span>
                                </Button>
                              </Link>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-slate-400 hover:text-red-600"
                                onClick={() => openDeleteModal(collab.id, collab.name, typeInfo.label)}
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
        message="Êtes-vous sûr de vouloir supprimer cette collaboration ?"
        itemName={deleteModal.name}
        itemType={deleteModal.type}
        isLoading={deleteModal.isLoading}
      />
    </main>
  );
}