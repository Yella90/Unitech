// app/(dashboard)/admin/services/subscriptions/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FaUsers,
  FaSpinner,
  FaEye,
  FaCheck,
  FaTimes,
  FaClock,
  FaEnvelope,
  FaBuilding,
  FaCalendar,
  FaSearch,
  FaSync,
  FaArrowLeft,
  FaEdit,
  FaTrash,
  FaCreditCard,
  FaRocket,
  FaUserCheck,
  FaUserTimes,
  FaExclamationTriangle,
  FaCheckCircle,
  FaPrint,
  FaDownload,
  FaFilter,
  FaTimesCircle
} from 'react-icons/fa';
import { toast, Toaster } from 'sonner';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// ============================================================
// TYPES
// ============================================================
type ClientSubscription = {
  id: string;
  client_id: string;
  service_id: string;
  status: 'pending' | 'active' | 'suspended' | 'expired' | 'cancelled';
  config: any;
  started_at: string;
  expires_at: string;
  auto_renew: boolean;
  last_renewed_at: string;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    company_name: string;
    phone: string;
  };
  service?: {
    id: string;
    name: string;
    slug: string;
    category: string;
    type: string;
    icon: string;
    color: string;
    price_monthly: number;
    price_yearly: number;
  };
};

// ============================================================
// CONFIGURATION
// ============================================================
const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  active: {
    label: 'Actif',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: <FaCheckCircle className="h-3 w-3" />
  },
  pending: {
    label: 'En attente',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: <FaClock className="h-3 w-3" />
  },
  suspended: {
    label: 'Suspendu',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    icon: <FaExclamationTriangle className="h-3 w-3" />
  },
  expired: {
    label: 'Expiré',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: <FaTimes className="h-3 w-3" />
  },
  cancelled: {
    label: 'Annulé',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: <FaUserTimes className="h-3 w-3" />
  },
};

const statusOptions = [
  { value: 'all', label: 'Tous' },
  { value: 'active', label: 'Actif' },
  { value: 'pending', label: 'En attente' },
  { value: 'suspended', label: 'Suspendu' },
  { value: 'expired', label: 'Expiré' },
  { value: 'cancelled', label: 'Annulé' },
];

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<ClientSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedSubscription, setSelectedSubscription] = useState<ClientSubscription | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    status: '',
    auto_renew: false,
    expires_at: ''
  });
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================
  const loadSubscriptions = async (silent: boolean = false) => {
    if (!silent) setRefreshing(true);

    try {
      console.log('🔄 Chargement des souscriptions...');

      const { data, error } = await supabase
        .from('client_services')
        .select(`
          *,
          client:client_id (
            id,
            email,
            first_name,
            last_name,
            company_name,
            phone
          ),
          service:service_id (
            id,
            name,
            slug,
            category,
            type,
            icon,
            color,
            price_monthly,
            price_yearly
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur:', error);
        if (!silent) toast.error('Erreur lors du chargement');
        return;
      }

      setSubscriptions(data || []);
      console.log(`✅ ${data?.length || 0} souscriptions chargées`);

      if (!silent && data) {
        toast.success(`✅ ${data.length} souscriptions chargées`);
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

  // ============================================================
  // ACTIONS
  // ============================================================
  const updateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubscription) return;

    setUpdating(true);

    try {
      const updates: any = {
        updated_at: new Date().toISOString()
      };

      if (editForm.status) updates.status = editForm.status;
      if (editForm.auto_renew !== undefined) updates.auto_renew = editForm.auto_renew;
      if (editForm.expires_at) updates.expires_at = editForm.expires_at;

      const { error } = await supabase
        .from('client_services')
        .update(updates)
        .eq('id', selectedSubscription.id);

      if (error) throw error;

      toast.success('✅ Souscription mise à jour avec succès');
      setEditModalOpen(false);
      await loadSubscriptions(true);
      
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSubscription) return;
    
    setDeleting(true);

    try {
      const { error } = await supabase
        .from('client_services')
        .delete()
        .eq('id', selectedSubscription.id);

      if (error) throw error;

      toast.success('✅ Souscription supprimée avec succès');
      setDeleteModalOpen(false);
      setModalOpen(false);
      await loadSubscriptions(true);
      
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (subscription: ClientSubscription) => {
    setSelectedSubscription(subscription);
    setEditForm({
      status: subscription.status,
      auto_renew: subscription.auto_renew,
      expires_at: subscription.expires_at || ''
    });
    setEditModalOpen(true);
  };

  const openDeleteModal = (subscription: ClientSubscription) => {
    setSelectedSubscription(subscription);
    setDeleteModalOpen(true);
  };

  // ============================================================
  // FILTRES
  // ============================================================
  const getFilteredSubscriptions = () => {
    let filtered = subscriptions;

    if (filterStatus !== 'all') {
      filtered = filtered.filter((s) => s.status === filterStatus);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((s) => 
        s.client?.email?.toLowerCase().includes(term) ||
        s.client?.first_name?.toLowerCase().includes(term) ||
        s.client?.last_name?.toLowerCase().includes(term) ||
        s.client?.company_name?.toLowerCase().includes(term) ||
        s.service?.name?.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysRemaining = (expiresAt: string) => {
    if (!expiresAt) return null;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // ============================================================
  // STATISTIQUES
  // ============================================================
  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter((s) => s.status === 'active').length,
    pending: subscriptions.filter((s) => s.status === 'pending').length,
    suspended: subscriptions.filter((s) => s.status === 'suspended').length,
    expired: subscriptions.filter((s) => s.status === 'expired').length,
    cancelled: subscriptions.filter((s) => s.status === 'cancelled').length,
  };

  // ============================================================
  // RENDU
  // ============================================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] p-4">
        <div className="h-10 w-10 sm:h-12 sm:w-12 animate-spin rounded-full border-4 border-[#1E3A8A] border-t-transparent"></div>
      </div>
    );
  }

  const filteredSubscriptions = getFilteredSubscriptions();

  return (
    <main className="min-h-screen bg-[#F5F7FB] p-3 sm:p-4 md:p-6">
      <Toaster position="top-right" richColors />
      
      <div className="mx-auto max-w-7xl">
        {/* ============================================================
        EN-TÊTE
        ============================================================ */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <Link href="/admin/services">
              <Button variant="ghost" size="sm" className="text-slate-500 hover:text-[#1E3A8A]">
                <FaArrowLeft className="h-4 w-4 mr-1" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1E3A8A] flex items-center gap-2 sm:gap-3">
                <FaUsers className="h-6 w-6 sm:h-7 sm:w-7 text-[#F97316]" />
                Souscriptions clients
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Gérez les souscriptions des clients aux services SaaS
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadSubscriptions(false)}
              disabled={refreshing}
              className="flex-shrink-0"
            >
              {refreshing ? (
                <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FaSync className="mr-2 h-4 w-4" />
              )}
              Rafraîchir
            </Button>
            <Button
              size="sm"
              className="bg-[#F97316] hover:bg-[#ea580c] text-white"
              onClick={() => window.print()}
            >
              <FaPrint className="mr-2 h-4 w-4" />
              Imprimer
            </Button>
          </div>
        </div>

        {/* ============================================================
        STATISTIQUES
        ============================================================ */}
        <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Total</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#1E3A8A]">{stats.total}</p>
                </div>
                <FaUsers className="h-5 w-5 sm:h-6 sm:w-6 text-[#1E3A8A]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Actifs</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <FaCheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">En attente</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <FaClock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Suspendus</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600">{stats.suspended}</p>
                </div>
                <FaExclamationTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Expirés</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-600">{stats.expired}</p>
                </div>
                <FaTimes className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-2 sm:col-span-1">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Annulés</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-600">{stats.cancelled}</p>
                </div>
                <FaUserTimes className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ============================================================
        RECHERCHE ET FILTRES
        ============================================================ */}
        <div className="mt-4 sm:mt-6 flex flex-col gap-3">
          <div className="flex flex-col xs:flex-row gap-2">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3 w-3 sm:h-4 sm:w-4" />
              <input
                type="text"
                placeholder="Rechercher par client, email, service..."
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
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ============================================================
        LISTE DES SOUSCRIPTIONS
        ============================================================ */}
        <div className="mt-4 sm:mt-6 rounded-xl sm:rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {filteredSubscriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
              <div className="rounded-full bg-slate-100 p-3 sm:p-4">
                <FaUsers className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
              </div>
              <h3 className="mt-4 text-base sm:text-lg font-semibold text-slate-700">
                Aucune souscription trouvée
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                {searchTerm || filterStatus !== 'all'
                  ? 'Essayez de modifier vos filtres'
                  : 'Aucune souscription pour le moment'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600">Client / Service</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600 hidden md:table-cell">Statut</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600 hidden xs:table-cell">Expiration</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600 hidden lg:table-cell">Renouvellement</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscriptions.map((subscription) => {
                    const daysRemaining = getDaysRemaining(subscription.expires_at);
                    return (
                      <tr key={subscription.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                        <td className="px-2 sm:px-4 py-2 sm:py-3">
                          <div>
                            <p className="font-medium text-slate-800 text-xs sm:text-sm truncate max-w-[100px] xs:max-w-[150px]">
                              {subscription.client?.first_name} {subscription.client?.last_name}
                            </p>
                            <p className="text-[10px] sm:text-xs text-slate-400 truncate max-w-[100px] xs:max-w-[150px]">
                              {subscription.client?.email}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate max-w-[100px] xs:max-w-[150px]">
                              {subscription.service?.name}
                            </p>
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell">
                          <Badge className={`${statusMap[subscription.status]?.color || 'bg-gray-100'} text-[8px] sm:text-[10px] flex items-center gap-1 w-fit`}>
                            {statusMap[subscription.status]?.icon}
                            {statusMap[subscription.status]?.label || subscription.status}
                          </Badge>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 hidden xs:table-cell">
                          <div className="text-[10px] sm:text-xs">
                            <p className="text-slate-600">{formatDate(subscription.expires_at)}</p>
                            {daysRemaining !== null && (
                              <p className={`${daysRemaining < 0 ? 'text-red-500' : daysRemaining < 7 ? 'text-orange-500' : 'text-green-500'}`}>
                                {daysRemaining < 0 ? 'Expiré' : `${daysRemaining} jours restants`}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 hidden lg:table-cell">
                          <Badge className={subscription.auto_renew ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                            {subscription.auto_renew ? '✅ Auto' : '❌ Manuel'}
                          </Badge>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                          <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                            <button
                              onClick={() => {
                                setSelectedSubscription(subscription);
                                setModalOpen(true);
                              }}
                              className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg transition flex items-center justify-center text-slate-400 hover:text-[#1E3A8A] hover:bg-slate-100"
                              title="Voir les détails"
                            >
                              <FaEye className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(subscription)}
                              className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg transition flex items-center justify-center text-slate-400 hover:text-[#F97316] hover:bg-orange-50"
                              title="Modifier"
                            >
                              <FaEdit className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                            <button
                              onClick={() => openDeleteModal(subscription)}
                              className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg transition flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50"
                              title="Supprimer"
                            >
                              <FaTrash className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
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

      {/* ============================================================
      MODAL DE DÉTAILS
      ============================================================ */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1E3A8A]">Détails de la souscription</DialogTitle>
            <DialogDescription>
              Informations complètes sur la souscription
            </DialogDescription>
          </DialogHeader>

          {selectedSubscription && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-2 p-4 bg-slate-50 rounded-lg">
                <div>
                  <h3 className="text-lg font-semibold text-[#1E3A8A]">
                    {selectedSubscription.service?.name}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {selectedSubscription.client?.email} • {formatDate(selectedSubscription.created_at)}
                  </p>
                </div>
                <Badge className={`${statusMap[selectedSubscription.status]?.color || 'bg-gray-100'} text-xs`}>
                  {statusMap[selectedSubscription.status]?.icon}
                  {statusMap[selectedSubscription.status]?.label || selectedSubscription.status}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                    <FaUserCheck className="h-4 w-4 text-[#F97316]" />
                    Client
                  </h4>
                  <p className="text-sm font-medium">{selectedSubscription.client?.first_name} {selectedSubscription.client?.last_name}</p>
                  <p className="text-sm text-slate-500">{selectedSubscription.client?.email}</p>
                  {selectedSubscription.client?.company_name && (
                    <p className="text-sm text-slate-500">{selectedSubscription.client?.company_name}</p>
                  )}
                </div>
                <div className="p-4 border border-slate-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                    <FaRocket className="h-4 w-4 text-[#F97316]" />
                    Service
                  </h4>
                  <p className="text-sm font-medium">{selectedSubscription.service?.name}</p>
                  <p className="text-sm text-slate-500">Type: {selectedSubscription.service?.type === 'saas' ? 'SaaS' : 'Produit'}</p>
                  {selectedSubscription.service?.price_monthly && (
                    <p className="text-sm text-slate-500">
                      Prix: {selectedSubscription.service.price_monthly} FCFA/mois
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-slate-600 mb-2">Dates</h4>
                  <p className="text-sm text-slate-500">
                    <span className="font-medium">Début:</span> {formatDate(selectedSubscription.started_at)}
                  </p>
                  <p className="text-sm text-slate-500">
                    <span className="font-medium">Expiration:</span> {formatDate(selectedSubscription.expires_at)}
                  </p>
                  <p className="text-sm text-slate-500">
                    <span className="font-medium">Renouvellement:</span> {selectedSubscription.auto_renew ? '✅ Automatique' : '❌ Manuel'}
                  </p>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-slate-600 mb-2">Configuration</h4>
                  <pre className="text-xs text-slate-600 bg-slate-50 p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify(selectedSubscription.config || {}, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setModalOpen(false)}>
                  Fermer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setModalOpen(false);
                    openEditModal(selectedSubscription);
                  }}
                  className="text-[#F97316] border-[#F97316] hover:bg-orange-50"
                >
                  <FaEdit className="mr-2 h-4 w-4" />
                  Modifier
                </Button>
                <Button variant="destructive" onClick={() => openDeleteModal(selectedSubscription)}>
                  <FaTrash className="mr-2 h-4 w-4" />
                  Supprimer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================================
      MODAL D'ÉDITION
      ============================================================ */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1E3A8A]">Modifier la souscription</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations de la souscription
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={updateSubscription} className="space-y-4">
            <div>
              <Label htmlFor="edit-status">Statut</Label>
              <select
                id="edit-status"
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent bg-white"
              >
                <option value="active">Actif</option>
                <option value="pending">En attente</option>
                <option value="suspended">Suspendu</option>
                <option value="expired">Expiré</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>

            <div>
              <Label htmlFor="edit-auto-renew">Renouvellement automatique</Label>
              <select
                id="edit-auto-renew"
                value={editForm.auto_renew ? 'true' : 'false'}
                onChange={(e) => setEditForm({ ...editForm, auto_renew: e.target.value === 'true' })}
                className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent bg-white"
              >
                <option value="true">✅ Activé</option>
                <option value="false">❌ Désactivé</option>
              </select>
            </div>

            <div>
              <Label htmlFor="edit-expires-at">Date d'expiration</Label>
              <Input
                id="edit-expires-at"
                type="datetime-local"
                value={editForm.expires_at}
                onChange={(e) => setEditForm({ ...editForm, expires_at: e.target.value })}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setEditModalOpen(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[#F97316] hover:bg-[#ea580c] text-white"
                disabled={updating}
              >
                {updating ? (
                  <FaSpinner className="animate-spin mr-2 h-4 w-4" />
                ) : (
                  'Enregistrer'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================
      MODAL DE SUPPRESSION
      ============================================================ */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette souscription ?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="flex-1"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <FaSpinner className="animate-spin mr-2 h-4 w-4" />
              ) : (
                'Supprimer'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}