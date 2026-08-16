// app/(dashboard)/admin/training-registrations/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FaGraduationCap, 
  FaUsers,
  FaSpinner,
  FaSearch,
  FaFilter,
  FaTimesCircle,
  FaSync,
  FaCheckCircle,
  FaClock,
  FaTimes,
  FaEye,
  FaEnvelope,
  FaPhone,
  FaMoneyBillWave,
  FaCalendarCheck,
  FaTrash
} from 'react-icons/fa';
import { toast, Toaster } from 'sonner';
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal';

type TrainingRegistration = {
  id: string;
  training_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  profession: string | null;
  company: string | null;
  level: string | null;
  motivation: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'paid' | 'failed';
  amount: number | null;
  payment_method: string | null;
  payment_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  trainings?: {
    title: string;
    slug: string;
  };
};

const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { 
    label: 'En attente', 
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: <FaClock className="h-3 w-3" />
  },
  confirmed: { 
    label: 'Confirmé', 
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: <FaCheckCircle className="h-3 w-3" />
  },
  cancelled: { 
    label: 'Annulé', 
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: <FaTimes className="h-3 w-3" />
  },
  completed: { 
    label: 'Terminé', 
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: <FaCalendarCheck className="h-3 w-3" />
  },
};

const paymentStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
  paid: { label: 'Payé', color: 'bg-green-100 text-green-700' },
  failed: { label: 'Échoué', color: 'bg-red-100 text-red-700' },
};

export default function AdminTrainingRegistrationsPage() {
  const router = useRouter();
  const [registrations, setRegistrations] = useState<TrainingRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');

  // ✅ État du modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: '',
    name: '',
    type: 'Inscription',
    isLoading: false,
  });

  useEffect(() => {
    loadRegistrations();
  }, []);

  const loadRegistrations = async (silent: boolean = false) => {
    if (!silent) {
      setRefreshing(true);
    }

    try {
      const { data, error } = await supabase
        .from('training_registrations')
        .select(`
          *,
          trainings (
            title,
            slug
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
      
      if (!silent) {
        toast.success(`✅ ${data?.length || 0} inscriptions chargées`);
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

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('training_registrations')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;

      setRegistrations(registrations.map(r => 
        r.id === id ? { ...r, status: status as any } : r
      ));
      
      toast.success(`Statut mis à jour : ${statusMap[status]?.label}`);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const updatePaymentStatus = async (id: string, paymentStatus: string) => {
    try {
      const { error } = await supabase
        .from('training_registrations')
        .update({ 
          payment_status: paymentStatus,
          payment_date: paymentStatus === 'paid' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;

      setRegistrations(registrations.map(r => 
        r.id === id ? { ...r, payment_status: paymentStatus as any } : r
      ));
      
      toast.success(`Statut de paiement mis à jour : ${paymentStatusMap[paymentStatus]?.label}`);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const openDeleteModal = (id: string, name: string) => {
    setDeleteModal({
      isOpen: true,
      id,
      name,
      type: 'Inscription',
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
        .from('training_registrations')
        .delete()
        .eq('id', deleteModal.id);

      if (error) throw error;

      toast.success(`✅ Inscription de "${deleteModal.name}" supprimée avec succès`);
      setRegistrations(registrations.filter(r => r.id !== deleteModal.id));
      closeDeleteModal();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression');
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const getFilteredRegistrations = () => {
    let filtered = registrations;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

    if (filterPayment !== 'all') {
      filtered = filtered.filter(r => r.payment_status === filterPayment);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.full_name.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term) ||
        (r.phone && r.phone.toLowerCase().includes(term)) ||
        (r.trainings?.title && r.trainings.title.toLowerCase().includes(term))
      );
    }

    return filtered;
  };

  const filteredRegistrations = getFilteredRegistrations();
  const total = registrations.length;
  const pending = registrations.filter(r => r.status === 'pending').length;
  const confirmed = registrations.filter(r => r.status === 'confirmed').length;
  const paid = registrations.filter(r => r.payment_status === 'paid').length;

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
              <FaUsers className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-[#F97316] flex-shrink-0" />
              <span className="truncate">Inscriptions aux Formations</span>
              {refreshing && (
                <FaSpinner className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-[#F97316] flex-shrink-0" />
              )}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
              Gérez les inscriptions aux formations UNITECH
            </p>
          </div>
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => loadRegistrations(false)}
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
          </div>
        </div>

        {/* Statistiques */}
        <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Total</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#1E3A8A]">{total}</p>
                </div>
                <FaUsers className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-[#F97316]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">En attente</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-600">{pending}</p>
                </div>
                <FaClock className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Confirmées</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{confirmed}</p>
                </div>
                <FaCheckCircle className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Payées</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{paid}</p>
                </div>
                <FaMoneyBillWave className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-green-500" />
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
                placeholder="Rechercher une inscription..."
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
          </div>

          {/* Filtres */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={filterStatus === 'all' && filterPayment === 'all' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => { setFilterStatus('all'); setFilterPayment('all'); }}
                className={`text-xs ${filterStatus === 'all' && filterPayment === 'all' ? 'bg-[#1E3A8A]' : ''}`}
              >
                Tous ({total})
              </Button>
              {Object.entries(statusMap).map(([status, config]) => {
                const count = registrations.filter(r => r.status === status).length;
                if (count === 0) return null;
                return (
                  <Button 
                    key={status}
                    variant={filterStatus === status ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}
                    className={`text-xs ${filterStatus === status ? 'bg-[#1E3A8A]' : ''}`}
                  >
                    {config.icon}
                    <span className="ml-1 hidden xs:inline">{config.label}</span>
                    <span className="ml-1">({count})</span>
                  </Button>
                );
              })}
              <div className="w-px h-6 bg-slate-200 hidden lg:block" />
              {Object.entries(paymentStatusMap).map(([status, config]) => {
                const count = registrations.filter(r => r.payment_status === status).length;
                if (count === 0) return null;
                return (
                  <Button 
                    key={status}
                    variant={filterPayment === status ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setFilterPayment(filterPayment === status ? 'all' : status)}
                    className={`text-xs ${filterPayment === status ? 'bg-[#1E3A8A]' : ''}`}
                  >
                    <FaMoneyBillWave className="h-3 w-3" />
                    <span className="ml-1 hidden xs:inline">{config.label}</span>
                    <span className="ml-1">({count})</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Liste des inscriptions */}
        <div className="mt-4 sm:mt-6 rounded-xl sm:rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {filteredRegistrations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
              <div className="rounded-full bg-slate-100 p-3 sm:p-4">
                <FaUsers className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
              </div>
              <h3 className="mt-4 text-base sm:text-lg font-semibold text-slate-700">
                {searchTerm || filterStatus !== 'all' || filterPayment !== 'all' 
                  ? 'Aucune inscription trouvée' 
                  : 'Aucune inscription'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Les inscriptions apparaîtront ici une fois que des personnes s'inscriront.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <div className="min-w-[768px] sm:min-w-full">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600">Inscrit</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600 hidden md:table-cell">Formation</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600">Statut</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600 hidden sm:table-cell">Paiement</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600 hidden lg:table-cell">Date</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegistrations.map((reg) => {
                      const status = statusMap[reg.status] || statusMap.pending;
                      const payment = paymentStatusMap[reg.payment_status] || paymentStatusMap.pending;
                      
                      return (
                        <tr key={reg.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <div className="min-w-0">
                              <p className="font-medium text-slate-800 text-xs sm:text-sm truncate max-w-[100px] xs:max-w-[150px]">
                                {reg.full_name}
                              </p>
                              <p className="text-[10px] sm:text-xs text-slate-400 truncate max-w-[100px] xs:max-w-[150px]">
                                {reg.email}
                              </p>
                              {reg.phone && (
                                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <FaPhone className="h-2.5 w-2.5" />
                                  {reg.phone}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell">
                            <div className="flex items-center gap-1">
                              <FaGraduationCap className="h-3 w-3 text-slate-400" />
                              <span className="text-slate-600 text-xs truncate max-w-[150px]">
                                {reg.trainings?.title || 'Formation inconnue'}
                              </span>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <Badge className={`${status.color} text-[8px] sm:text-[10px]`}>
                              <span className="flex items-center gap-1">
                                {status.icon}
                                <span className="hidden xs:inline">{status.label}</span>
                              </span>
                            </Badge>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell">
                            <Badge className={`${payment.color} text-[8px] sm:text-[10px]`}>
                              {payment.label}
                            </Badge>
                            {reg.amount && (
                              <span className="ml-1 text-[10px] text-slate-500">
                                {reg.amount} FCFA
                              </span>
                            )}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 hidden lg:table-cell text-slate-500 text-[10px] sm:text-xs whitespace-nowrap">
                            {new Date(reg.created_at).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                            <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                              {/* Status actions */}
                              {reg.status === 'pending' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-green-600 hover:bg-green-50"
                                  onClick={() => updateStatus(reg.id, 'confirmed')}
                                  title="Confirmer"
                                >
                                  <FaCheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              )}
                              {reg.status === 'confirmed' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-blue-600 hover:bg-blue-50"
                                  onClick={() => updateStatus(reg.id, 'completed')}
                                  title="Marquer comme terminé"
                                >
                                  <FaCalendarCheck className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              )}
                              {reg.status !== 'cancelled' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-red-600 hover:bg-red-50"
                                  onClick={() => updateStatus(reg.id, 'cancelled')}
                                  title="Annuler"
                                >
                                  <FaTimes className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              )}
                              {/* Payment actions */}
                              {reg.payment_status !== 'paid' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-green-600 hover:bg-green-50"
                                  onClick={() => updatePaymentStatus(reg.id, 'paid')}
                                  title="Marquer comme payé"
                                >
                                  <FaMoneyBillWave className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              )}
                              {/* Delete */}
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-slate-400 hover:text-red-600"
                                onClick={() => openDeleteModal(reg.id, reg.full_name)}
                              >
                                <FaTrash className="h-3 w-3 sm:h-4 sm:w-4" />
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

      {/* Modal de suppression */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer cette inscription ?"
        itemName={deleteModal.name}
        itemType={deleteModal.type}
        isLoading={deleteModal.isLoading}
      />
    </main>
  );
}