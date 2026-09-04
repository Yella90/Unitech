// app/(dashboard)/admin/clients/page.tsx
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
  FaUserPlus,
  FaUserCheck,
  FaUserTimes,
  FaCreditCard,
  FaRocket,
  FaShieldAlt,
  FaPhone,
  FaMapMarkerAlt,
  FaGlobe,
  FaPrint,
  FaDownload,
  FaFilter,
  FaTimesCircle,
  FaUserCog,
  FaUserTie,
  FaBriefcase
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
type Client = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company_name: string;
  company_siret: string;
  company_website: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  subscription_plan: 'free' | 'basic' | 'pro' | 'enterprise';
  credits_balance: number;
  is_active: boolean;
  email_verified: boolean;
  last_login_at: string;
  created_at: string;
  updated_at: string;
};

type ClientStats = {
  total: number;
  active: number;
  inactive: number;
  verified: number;
  byPlan: Record<string, number>;
};

// ============================================================
// CONFIGURATION
// ============================================================
const subscriptionPlans: Record<string, { label: string; color: string }> = {
  free: { label: 'Gratuit', color: 'bg-gray-100 text-gray-700' },
  basic: { label: 'Basic', color: 'bg-blue-100 text-blue-700' },
  pro: { label: 'Pro', color: 'bg-purple-100 text-purple-700' },
  enterprise: { label: 'Enterprise', color: 'bg-orange-100 text-orange-700' },
};

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [stats, setStats] = useState<ClientStats>({
    total: 0,
    active: 0,
    inactive: 0,
    verified: 0,
    byPlan: {}
  });
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    company_name: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    subscription_plan: '',
    is_active: true,
    email_verified: false
  });
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================
  const loadClients = async (silent: boolean = false) => {
    if (!silent) setRefreshing(true);

    try {
      console.log('🔄 Chargement des clients...');

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur:', error);
        if (!silent) toast.error('Erreur lors du chargement');
        return;
      }

      setClients(data || []);
      calculateStats(data || []);
      console.log(`✅ ${data?.length || 0} clients chargés`);

      if (!silent && data) {
        toast.success(`✅ ${data.length} clients chargés`);
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
  // CALCUL DES STATISTIQUES
  // ============================================================
  const calculateStats = (data: Client[]) => {
    const stats: ClientStats = {
      total: data.length,
      active: data.filter((c) => c.is_active).length,
      inactive: data.filter((c) => !c.is_active).length,
      verified: data.filter((c) => c.email_verified).length,
      byPlan: {}
    };

    data.forEach((client) => {
      const plan = client.subscription_plan || 'free';
      stats.byPlan[plan] = (stats.byPlan[plan] || 0) + 1;
    });

    setStats(stats);
  };

  // ============================================================
  // ACTIONS
  // ============================================================
  const updateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    setUpdating(true);

    try {
      const updates: any = {
        updated_at: new Date().toISOString()
      };

      if (editForm.first_name !== undefined) updates.first_name = editForm.first_name;
      if (editForm.last_name !== undefined) updates.last_name = editForm.last_name;
      if (editForm.company_name !== undefined) updates.company_name = editForm.company_name;
      if (editForm.phone !== undefined) updates.phone = editForm.phone;
      if (editForm.address !== undefined) updates.address = editForm.address;
      if (editForm.city !== undefined) updates.city = editForm.city;
      if (editForm.country !== undefined) updates.country = editForm.country;
      if (editForm.subscription_plan) updates.subscription_plan = editForm.subscription_plan;
      if (editForm.is_active !== undefined) updates.is_active = editForm.is_active;
      if (editForm.email_verified !== undefined) updates.email_verified = editForm.email_verified;

      const { error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', selectedClient.id);

      if (error) throw error;

      toast.success('✅ Client mis à jour avec succès');
      setEditModalOpen(false);
      await loadClients(true);
      
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedClient) return;
    
    setDeleting(true);

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', selectedClient.id);

      if (error) throw error;

      toast.success('✅ Client supprimé avec succès');
      setDeleteModalOpen(false);
      setModalOpen(false);
      await loadClients(true);
      
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setClients(clients.map(c => 
        c.id === id ? { ...c, is_active: !currentStatus } : c
      ));

      calculateStats(clients.map(c => 
        c.id === id ? { ...c, is_active: !currentStatus } : c
      ));

      toast.success(`Client ${!currentStatus ? 'activé' : 'désactivé'}`);
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Erreur lors du changement de statut');
    }
  };

  const openEditModal = (client: Client) => {
    setSelectedClient(client);
    setEditForm({
      first_name: client.first_name || '',
      last_name: client.last_name || '',
      company_name: client.company_name || '',
      phone: client.phone || '',
      address: client.address || '',
      city: client.city || '',
      country: client.country || 'Sénégal',
      subscription_plan: client.subscription_plan || 'free',
      is_active: client.is_active,
      email_verified: client.email_verified
    });
    setEditModalOpen(true);
  };

  const openDeleteModal = (client: Client) => {
    setSelectedClient(client);
    setDeleteModalOpen(true);
  };

  // ============================================================
  // FILTRES
  // ============================================================
  const getFilteredClients = () => {
    let filtered = clients;

    if (filterStatus === 'active') {
      filtered = filtered.filter((c) => c.is_active);
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter((c) => !c.is_active);
    } else if (filterStatus === 'verified') {
      filtered = filtered.filter((c) => c.email_verified);
    } else if (filterStatus === 'unverified') {
      filtered = filtered.filter((c) => !c.email_verified);
    }

    if (filterPlan !== 'all') {
      filtered = filtered.filter((c) => c.subscription_plan === filterPlan);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((c) => 
        c.email?.toLowerCase().includes(term) ||
        c.first_name?.toLowerCase().includes(term) ||
        c.last_name?.toLowerCase().includes(term) ||
        c.company_name?.toLowerCase().includes(term) ||
        c.phone?.toLowerCase().includes(term)
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

  const filteredClients = getFilteredClients();

  return (
    <main className="min-h-screen bg-[#F5F7FB] p-3 sm:p-4 md:p-6">
      <Toaster position="top-right" richColors />
      
      <div className="mx-auto max-w-7xl">
        {/* ============================================================
        EN-TÊTE
        ============================================================ */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="text-slate-500 hover:text-[#1E3A8A]">
                <FaArrowLeft className="h-4 w-4 mr-1" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1E3A8A] flex items-center gap-2 sm:gap-3">
                <FaUsers className="h-6 w-6 sm:h-7 sm:w-7 text-[#F97316]" />
                Gestion des clients
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Gérez tous les clients de la plateforme UNITECH
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadClients(false)}
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
        <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4">
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
                <FaUserCheck className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Inactifs</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-600">{stats.inactive}</p>
                </div>
                <FaUserTimes className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Vérifiés</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">{stats.verified}</p>
                </div>
                <FaShieldAlt className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Non vérifiés</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-600">{stats.total - stats.verified}</p>
                </div>
                <FaClock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
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
                placeholder="Rechercher par nom, email, entreprise, téléphone..."
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
            <div className="flex flex-wrap gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
                <option value="verified">Vérifiés</option>
                <option value="unverified">Non vérifiés</option>
              </select>
              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent"
              >
                <option value="all">Tous les plans</option>
                <option value="free">Gratuit</option>
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
        </div>

        {/* ============================================================
        LISTE DES CLIENTS
        ============================================================ */}
        <div className="mt-4 sm:mt-6 rounded-xl sm:rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
              <div className="rounded-full bg-slate-100 p-3 sm:p-4">
                <FaUsers className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
              </div>
              <h3 className="mt-4 text-base sm:text-lg font-semibold text-slate-700">
                Aucun client trouvé
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                {searchTerm || filterStatus !== 'all' || filterPlan !== 'all'
                  ? 'Essayez de modifier vos filtres'
                  : 'Aucun client inscrit pour le moment'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600">Client</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600 hidden md:table-cell">Entreprise</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600">Plan</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600 hidden xs:table-cell">Statut</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600 hidden lg:table-cell">Inscription</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <div>
                          <p className="font-medium text-slate-800 text-xs sm:text-sm truncate max-w-[100px] xs:max-w-[150px]">
                            {client.first_name} {client.last_name}
                          </p>
                          <p className="text-[10px] sm:text-xs text-slate-400 truncate max-w-[100px] xs:max-w-[150px]">
                            {client.email}
                          </p>
                          {client.phone && (
                            <p className="text-[10px] text-slate-400 truncate max-w-[100px] xs:max-w-[150px]">
                              {client.phone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell">
                        <div>
                          <p className="text-xs sm:text-sm text-slate-600 truncate max-w-[150px]">
                            {client.company_name || '-'}
                          </p>
                          {client.city && (
                            <p className="text-[10px] text-slate-400">
                              {client.city}, {client.country}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <Badge className={`${subscriptionPlans[client.subscription_plan]?.color || 'bg-gray-100'} text-[8px] sm:text-[10px]`}>
                          {subscriptionPlans[client.subscription_plan]?.label || client.subscription_plan}
                        </Badge>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 hidden xs:table-cell">
                        <div className="flex flex-wrap gap-1">
                          <Badge className={client.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                            {client.is_active ? '✅ Actif' : '❌ Inactif'}
                          </Badge>
                          {client.email_verified && (
                            <Badge className="bg-blue-100 text-blue-700">
                              📧 Vérifié
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 hidden lg:table-cell">
                        <span className="text-[10px] sm:text-xs text-slate-500">
                          {formatDate(client.created_at)}
                        </span>
                        {client.last_login_at && (
                          <p className="text-[10px] text-slate-400">
                            Dernière connexion: {formatDate(client.last_login_at)}
                          </p>
                        )}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                        <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                          <button
                            onClick={() => {
                              setSelectedClient(client);
                              setModalOpen(true);
                            }}
                            className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg transition flex items-center justify-center text-slate-400 hover:text-[#1E3A8A] hover:bg-slate-100"
                            title="Voir les détails"
                          >
                            <FaEye className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(client)}
                            className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg transition flex items-center justify-center text-slate-400 hover:text-[#F97316] hover:bg-orange-50"
                            title="Modifier"
                          >
                            <FaEdit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                          <button
                            onClick={() => toggleStatus(client.id, client.is_active)}
                            className={`h-7 w-7 sm:h-8 sm:w-8 rounded-lg transition flex items-center justify-center ${
                              client.is_active 
                                ? 'text-green-500 hover:bg-green-50' 
                                : 'text-red-500 hover:bg-red-50'
                            }`}
                            title={client.is_active ? 'Désactiver' : 'Activer'}
                          >
                            {client.is_active ? (
                              <FaUserCheck className="h-3 w-3 sm:h-4 sm:w-4" />
                            ) : (
                              <FaUserTimes className="h-3 w-3 sm:h-4 sm:w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => openDeleteModal(client)}
                            className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg transition flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title="Supprimer"
                          >
                            <FaTrash className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
            <DialogTitle className="text-[#1E3A8A]">Détails du client</DialogTitle>
            <DialogDescription>
              Informations complètes sur le client
            </DialogDescription>
          </DialogHeader>

          {selectedClient && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-2 p-4 bg-slate-50 rounded-lg">
                <div>
                  <h3 className="text-lg font-semibold text-[#1E3A8A]">
                    {selectedClient.first_name} {selectedClient.last_name}
                  </h3>
                  <p className="text-sm text-slate-500">{selectedClient.email}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className={selectedClient.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                    {selectedClient.is_active ? '✅ Actif' : '❌ Inactif'}
                  </Badge>
                  <Badge className={selectedClient.email_verified ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}>
                    {selectedClient.email_verified ? '📧 Vérifié' : '📧 Non vérifié'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                    <FaUserTie className="h-4 w-4 text-[#F97316]" />
                    Informations personnelles
                  </h4>
                  <p className="text-sm"><span className="font-medium">Nom:</span> {selectedClient.first_name} {selectedClient.last_name}</p>
                  <p className="text-sm"><span className="font-medium">Email:</span> {selectedClient.email}</p>
                  <p className="text-sm"><span className="font-medium">Téléphone:</span> {selectedClient.phone || 'Non renseigné'}</p>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                    <FaBriefcase className="h-4 w-4 text-[#F97316]" />
                    Entreprise
                  </h4>
                  <p className="text-sm"><span className="font-medium">Nom:</span> {selectedClient.company_name || 'Non renseigné'}</p>
                  <p className="text-sm"><span className="font-medium">SIRET:</span> {selectedClient.company_siret || 'Non renseigné'}</p>
                  <p className="text-sm"><span className="font-medium">Site web:</span> {selectedClient.company_website || 'Non renseigné'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                    <FaMapMarkerAlt className="h-4 w-4 text-[#F97316]" />
                    Adresse
                  </h4>
                  <p className="text-sm">{selectedClient.address || 'Non renseignée'}</p>
                  <p className="text-sm">{selectedClient.city && `${selectedClient.city}, ${selectedClient.country || ''}`}</p>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                    <FaCreditCard className="h-4 w-4 text-[#F97316]" />
                    Abonnement
                  </h4>
                  <p className="text-sm"><span className="font-medium">Plan:</span> {subscriptionPlans[selectedClient.subscription_plan]?.label || selectedClient.subscription_plan}</p>
                  <p className="text-sm"><span className="font-medium">Crédits:</span> {selectedClient.credits_balance}</p>
                  <p className="text-sm"><span className="font-medium">Inscrit le:</span> {formatDate(selectedClient.created_at)}</p>
                  {selectedClient.last_login_at && (
                    <p className="text-sm"><span className="font-medium">Dernière connexion:</span> {formatDate(selectedClient.last_login_at)}</p>
                  )}
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
                    openEditModal(selectedClient);
                  }}
                  className="text-[#F97316] border-[#F97316] hover:bg-orange-50"
                >
                  <FaEdit className="mr-2 h-4 w-4" />
                  Modifier
                </Button>
                <Button variant="destructive" onClick={() => openDeleteModal(selectedClient)}>
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
            <DialogTitle className="text-[#1E3A8A]">Modifier le client</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations du client
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={updateClient} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-first-name">Prénom</Label>
                <Input
                  id="edit-first-name"
                  value={editForm.first_name}
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-last-name">Nom</Label>
                <Input
                  id="edit-last-name"
                  value={editForm.last_name}
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-company">Entreprise</Label>
              <Input
                id="edit-company"
                value={editForm.company_name}
                onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-phone">Téléphone</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-address">Adresse</Label>
              <Input
                id="edit-address"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-city">Ville</Label>
                <Input
                  id="edit-city"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-country">Pays</Label>
                <Input
                  id="edit-country"
                  value={editForm.country}
                  onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-plan">Plan d'abonnement</Label>
              <select
                id="edit-plan"
                value={editForm.subscription_plan}
                onChange={(e) => setEditForm({ ...editForm, subscription_plan: e.target.value })}
                className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent bg-white"
              >
                <option value="free">Gratuit</option>
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Statut du compte</Label>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, is_active: true })}
                    className={`px-4 py-2 rounded-lg border-2 transition flex-1 ${
                      editForm.is_active
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'bg-white border-slate-200 text-slate-500'
                    }`}
                  >
                    ✅ Actif
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, is_active: false })}
                    className={`px-4 py-2 rounded-lg border-2 transition flex-1 ${
                      !editForm.is_active
                        ? 'bg-red-50 border-red-500 text-red-700'
                        : 'bg-white border-slate-200 text-slate-500'
                    }`}
                  >
                    ❌ Inactif
                  </button>
                </div>
              </div>
              <div>
                <Label className="text-sm">Vérification email</Label>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, email_verified: true })}
                    className={`px-4 py-2 rounded-lg border-2 transition flex-1 ${
                      editForm.email_verified
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-white border-slate-200 text-slate-500'
                    }`}
                  >
                    ✅ Vérifié
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, email_verified: false })}
                    className={`px-4 py-2 rounded-lg border-2 transition flex-1 ${
                      !editForm.email_verified
                        ? 'bg-yellow-50 border-yellow-500 text-yellow-700'
                        : 'bg-white border-slate-200 text-slate-500'
                    }`}
                  >
                    ⏳ Non vérifié
                  </button>
                </div>
              </div>
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
              Êtes-vous sûr de vouloir supprimer ce client ?
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