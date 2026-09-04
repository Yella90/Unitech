// app/(dashboard)/admin/services/client-requests/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FaClipboardList,
  FaSpinner,
  FaEye,
  FaCheck,
  FaTimes,
  FaClock,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBuilding,
  FaCalendar,
  FaSearch,
  FaFilter,
  FaTimesCircle,
  FaSync,
  FaArrowLeft,
  FaEdit,
  FaTrash,
  FaInfoCircle,
  FaBriefcase,
  FaMoneyBill,
  FaCalendarAlt,
  FaComment,
  FaUsers,
  FaUserPlus,
  FaCheckCircle,
  FaExclamationTriangle,
  FaHourglassHalf,
  FaArrowRight,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaPlus,
  FaSave,
  FaDownload,
  FaPrint,
  FaReply,
  FaShare,
  FaStar,
  FaStarHalf,
  FaRegStar,
  FaPaperclip,
  FaUserTie,
  FaRocket,
  FaShieldAlt,
  FaGlobe,
  FaUserCheck
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ============================================================
// TYPES
// ============================================================
type ClientServiceRequest = {
  id: string;
  client_id: string;
  service_id: string;
  title: string;
  description: string;
  budget?: string;
  deadline?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'review' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  assigned_to?: string;
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
  };
  assigned_user?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
};

type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
};

// ============================================================
// CONFIGURATION DES STATUTS
// ============================================================
const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: {
    label: 'En attente',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: <FaClock className="h-3 w-3" />
  },
  review: {
    label: 'En relecture',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    icon: <FaEye className="h-3 w-3" />
  },
  approved: {
    label: 'Approuvé',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: <FaCheck className="h-3 w-3" />
  },
  in_progress: {
    label: 'En cours',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    icon: <FaSpinner className="h-3 w-3 animate-spin" />
  },
  completed: {
    label: 'Terminé',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: <FaCheckCircle className="h-3 w-3" />
  },
  cancelled: {
    label: 'Annulé',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: <FaTimes className="h-3 w-3" />
  },
};

// ============================================================
// CONFIGURATION DES PRIORITÉS
// ============================================================
const priorityMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  low: {
    label: 'Basse',
    color: 'bg-gray-100 text-gray-700',
    icon: <FaArrowDown className="h-3 w-3" />
  },
  normal: {
    label: 'Normale',
    color: 'bg-blue-100 text-blue-700',
    icon: <FaMinus className="h-3 w-3" />
  },
  high: {
    label: 'Haute',
    color: 'bg-orange-100 text-orange-700',
    icon: <FaArrowUp className="h-3 w-3" />
  },
  urgent: {
    label: 'Urgente',
    color: 'bg-red-100 text-red-700',
    icon: <FaExclamationTriangle className="h-3 w-3" />
  },
};

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function AdminClientServiceRequests() {
  const [requests, setRequests] = useState<ClientServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'review' | 'approved' | 'in_progress' | 'completed' | 'cancelled'>('all');
  const [selectedRequest, setSelectedRequest] = useState<ClientServiceRequest | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [editForm, setEditForm] = useState({
    status: '',
    priority: '',
    budget: '',
    deadline: '',
    notes: '',
    assigned_to: ''
  });
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadRequests();
    loadUsers();
  }, []);

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================
  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, role')
        .in('role', ['admin', 'super_admin', 'project_manager', 'team_lead']);
      
      if (!error && data) {
        setUsers(data as User[]);
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    }
  };

  const loadRequests = async (silent: boolean = false) => {
    if (!silent) setRefreshing(true);

    try {
      // ✅ Récupérer les demandes avec les relations
      const { data, error } = await supabase
        .from('client_service_requests')
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
            color
          ),
          assigned_user:assigned_to (
            id,
            email,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur chargement:', error);
        
        // ✅ Fallback: récupérer sans les relations
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('client_service_requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (fallbackError) throw fallbackError;

        const serviceIds = [...new Set(fallbackData?.map((r: any) => r.service_id).filter(Boolean) || [])];
        const clientIds = [...new Set(fallbackData?.map((r: any) => r.client_id).filter(Boolean) || [])];
        const userIds = [...new Set(fallbackData?.map((r: any) => r.assigned_to).filter(Boolean) || [])];

        const [servicesRes, clientsRes, usersRes] = await Promise.all([
          serviceIds.length > 0 ? supabase.from('services').select('*').in('id', serviceIds) : { data: [] },
          clientIds.length > 0 ? supabase.from('clients').select('*').in('id', clientIds) : { data: [] },
          userIds.length > 0 ? supabase.from('users').select('*').in('id', userIds) : { data: [] }
        ]);

        const servicesMap = new Map(servicesRes.data?.map((s: any) => [s.id, s]) || []);
        const clientsMap = new Map(clientsRes.data?.map((c: any) => [c.id, c]) || []);
        const usersMap = new Map(usersRes.data?.map((u: any) => [u.id, u]) || []);

        const mappedData = (fallbackData || []).map((item: any) => ({
          ...item,
          service: servicesMap.get(item.service_id) || null,
          client: clientsMap.get(item.client_id) || null,
          assigned_user: usersMap.get(item.assigned_to) || null
        }));

        setRequests(mappedData);
        if (!silent) toast.success(`✅ ${mappedData.length} demandes clients chargées`);
        return;
      }

      setRequests(data || []);
      if (!silent) {
        toast.success(`✅ ${data?.length || 0} demandes clients chargées`);
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
  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('client_service_requests')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setRequests(requests.map((r: ClientServiceRequest) => 
        r.id === id ? { ...r, status: newStatus as any } : r
      ));

      toast.success(`Statut mis à jour: ${statusMap[newStatus]?.label || newStatus}`);
      
      if (selectedRequest?.id === id) {
        setSelectedRequest({ ...selectedRequest, status: newStatus as any });
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    setUpdating(true);

    try {
      const updates: any = {
        updated_at: new Date().toISOString()
      };

      if (editForm.status) updates.status = editForm.status;
      if (editForm.priority) updates.priority = editForm.priority;
      if (editForm.budget) updates.budget = editForm.budget;
      if (editForm.deadline) updates.deadline = editForm.deadline;
      if (editForm.notes) updates.notes = editForm.notes;

      const { error } = await supabase
        .from('client_service_requests')
        .update(updates)
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast.success('✅ Demande mise à jour avec succès');
      setEditModalOpen(false);
      await loadRequests(true);
      
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRequest) return;
    
    setDeleting(true);

    try {
      const { error } = await supabase
        .from('client_service_requests')
        .delete()
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast.success('✅ Demande supprimée avec succès');
      setDeleteModalOpen(false);
      setModalOpen(false);
      await loadRequests(true);
      
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (request: ClientServiceRequest) => {
    setSelectedRequest(request);
    setEditForm({
      status: request.status,
      priority: request.priority,
      budget: request.budget || '',
      deadline: request.deadline || '',
      notes: request.notes || '',
      assigned_to: request.assigned_to || ''
    });
    setEditModalOpen(true);
  };

  const openDeleteModal = (request: ClientServiceRequest) => {
    setSelectedRequest(request);
    setDeleteModalOpen(true);
  };

  // ============================================================
  // FILTRES
  // ============================================================
  const getFilteredRequests = () => {
    let filtered = requests;

    if (filterStatus !== 'all') {
      filtered = filtered.filter((r: ClientServiceRequest) => r.status === filterStatus);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((r: ClientServiceRequest) => 
        r.title?.toLowerCase().includes(term) ||
        r.description?.toLowerCase().includes(term) ||
        r.client?.first_name?.toLowerCase().includes(term) ||
        r.client?.last_name?.toLowerCase().includes(term) ||
        r.client?.email?.toLowerCase().includes(term) ||
        r.client?.company_name?.toLowerCase().includes(term) ||
        r.service?.name?.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  const formatDate = (dateString: string) => {
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
  // STATISTIQUES
  // ============================================================
  const stats = {
    total: requests.length,
    pending: requests.filter((r: ClientServiceRequest) => r.status === 'pending').length,
    review: requests.filter((r: ClientServiceRequest) => r.status === 'review').length,
    approved: requests.filter((r: ClientServiceRequest) => r.status === 'approved').length,
    in_progress: requests.filter((r: ClientServiceRequest) => r.status === 'in_progress').length,
    completed: requests.filter((r: ClientServiceRequest) => r.status === 'completed').length,
    cancelled: requests.filter((r: ClientServiceRequest) => r.status === 'cancelled').length,
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

  const filteredRequests = getFilteredRequests();

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
                Demandes clients
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Gérez les demandes de services des clients connectés
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadRequests(false)}
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
        STATISTIQUES - CORRIGÉ AVEC LES DONNÉES RÉELLES
        ============================================================ */}
        <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Total</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#1E3A8A]">{stats.total}</p>
                </div>
                <FaClipboardList className="h-5 w-5 sm:h-6 sm:w-6 text-[#1E3A8A]" />
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
                  <p className="text-[10px] sm:text-xs text-slate-500">En cours</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600">{stats.in_progress}</p>
                </div>
                <FaSpinner className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500 animate-spin" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Approuvés</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">{stats.approved}</p>
                </div>
                <FaCheck className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Terminés</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <FaCheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-2 sm:col-span-1">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Annulés</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-600">{stats.cancelled}</p>
                </div>
                <FaTimes className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
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
                placeholder="Rechercher par client, service, titre..."
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
          </div>

          {/* Filtres par statut */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('all')}
              className={`text-xs ${filterStatus === 'all' ? 'bg-[#1E3A8A]' : ''}`}
            >
              Tous ({stats.total})
            </Button>
            <Button
              variant={filterStatus === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('pending')}
              className={`text-xs ${filterStatus === 'pending' ? 'bg-yellow-600' : ''}`}
            >
              <FaClock className="mr-1 h-3 w-3" />
              En attente ({stats.pending})
            </Button>
            <Button
              variant={filterStatus === 'review' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('review')}
              className={`text-xs ${filterStatus === 'review' ? 'bg-orange-600' : ''}`}
            >
              <FaEye className="mr-1 h-3 w-3" />
              Relecture ({stats.review})
            </Button>
            <Button
              variant={filterStatus === 'approved' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('approved')}
              className={`text-xs ${filterStatus === 'approved' ? 'bg-blue-600' : ''}`}
            >
              <FaCheck className="mr-1 h-3 w-3" />
              Approuvés ({stats.approved})
            </Button>
            <Button
              variant={filterStatus === 'in_progress' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('in_progress')}
              className={`text-xs ${filterStatus === 'in_progress' ? 'bg-purple-600' : ''}`}
            >
              <FaSpinner className="mr-1 h-3 w-3 animate-spin" />
              En cours ({stats.in_progress})
            </Button>
            <Button
              variant={filterStatus === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('completed')}
              className={`text-xs ${filterStatus === 'completed' ? 'bg-green-600' : ''}`}
            >
              <FaCheckCircle className="mr-1 h-3 w-3" />
              Terminés ({stats.completed})
            </Button>
            <Button
              variant={filterStatus === 'cancelled' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('cancelled')}
              className={`text-xs ${filterStatus === 'cancelled' ? 'bg-red-600' : ''}`}
            >
              <FaTimes className="mr-1 h-3 w-3" />
              Annulés ({stats.cancelled})
            </Button>
          </div>
        </div>

        {/* ============================================================
        LISTE DES DEMANDES
        ============================================================ */}
        <div className="mt-4 sm:mt-6 rounded-xl sm:rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
              <div className="rounded-full bg-slate-100 p-3 sm:p-4">
                <FaUsers className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
              </div>
              <h3 className="mt-4 text-base sm:text-lg font-semibold text-slate-700">
                Aucune demande client trouvée
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                {searchTerm || filterStatus !== 'all'
                  ? 'Essayez de modifier vos filtres'
                  : 'Aucune demande de service de client pour le moment'}
              </p>
              {(searchTerm || filterStatus !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}
                  className="mt-4"
                >
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600">Client / Service</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600 hidden md:table-cell">Titre</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600">Statut</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600 hidden xs:table-cell">Priorité</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600 hidden lg:table-cell">Date</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request: ClientServiceRequest) => (
                    <tr key={request.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <div>
                          <p className="font-medium text-slate-800 text-xs sm:text-sm truncate max-w-[100px] xs:max-w-[150px]">
                            {request.client?.first_name} {request.client?.last_name}
                          </p>
                          <p className="text-[10px] sm:text-xs text-slate-400 truncate max-w-[100px] xs:max-w-[150px]">
                            {request.client?.email}
                          </p>
                          {request.service && (
                            <p className="text-[10px] text-slate-500 truncate max-w-[100px] xs:max-w-[150px]">
                              {request.service.name}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell">
                        <p className="text-xs sm:text-sm text-slate-600 truncate max-w-[200px]">
                          {request.title}
                        </p>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <Badge className={`${statusMap[request.status]?.color || 'bg-gray-100'} text-[8px] sm:text-[10px] flex items-center gap-1 w-fit`}>
                          {statusMap[request.status]?.icon}
                          {statusMap[request.status]?.label || request.status}
                        </Badge>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 hidden xs:table-cell">
                        <Badge className={`${priorityMap[request.priority]?.color || 'bg-gray-100'} text-[8px] sm:text-[10px] flex items-center gap-1`}>
                          {priorityMap[request.priority]?.icon}
                          {priorityMap[request.priority]?.label || request.priority}
                        </Badge>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 hidden lg:table-cell">
                        <span className="text-[10px] sm:text-xs text-slate-500">
                          {formatDate(request.created_at)}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                        <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setModalOpen(true);
                            }}
                            className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg transition flex items-center justify-center text-slate-400 hover:text-[#1E3A8A] hover:bg-slate-100"
                            title="Voir les détails"
                          >
                            <FaEye className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(request)}
                            className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg transition flex items-center justify-center text-slate-400 hover:text-[#F97316] hover:bg-orange-50"
                            title="Modifier"
                          >
                            <FaEdit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(request)}
                            className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg transition flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title="Supprimer"
                          >
                            <FaTrash className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                          {request.status === 'pending' && (
                            <button
                              onClick={() => updateStatus(request.id, 'review')}
                              className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg transition flex items-center justify-center text-orange-500 hover:bg-orange-50"
                              title="Mettre en relecture"
                            >
                              <FaEye className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                          )}
                          {request.status === 'review' && (
                            <button
                              onClick={() => updateStatus(request.id, 'approved')}
                              className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg transition flex items-center justify-center text-blue-500 hover:bg-blue-50"
                              title="Approuver"
                            >
                              <FaCheck className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                          )}
                          {request.status === 'approved' && (
                            <button
                              onClick={() => updateStatus(request.id, 'in_progress')}
                              className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg transition flex items-center justify-center text-purple-500 hover:bg-purple-50"
                              title="Démarrer"
                            >
                              <FaSpinner className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                          )}
                          {request.status === 'in_progress' && (
                            <button
                              onClick={() => updateStatus(request.id, 'completed')}
                              className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg transition flex items-center justify-center text-green-500 hover:bg-green-50"
                              title="Marquer comme terminé"
                            >
                              <FaCheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                          )}
                          {request.status !== 'cancelled' && request.status !== 'completed' && (
                            <button
                              onClick={() => updateStatus(request.id, 'cancelled')}
                              className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg transition flex items-center justify-center text-red-500 hover:bg-red-50"
                              title="Annuler"
                            >
                              <FaTimes className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                          )}
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
            <DialogTitle className="text-[#1E3A8A]">Détails de la demande client</DialogTitle>
            <DialogDescription>
              Informations complètes sur la demande de service
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              {/* En-tête */}
              <div className="flex flex-wrap items-start justify-between gap-2 p-4 bg-slate-50 rounded-lg">
                <div>
                  <h3 className="text-lg font-semibold text-[#1E3A8A]">{selectedRequest.title}</h3>
                  <p className="text-sm text-slate-500">
                    {selectedRequest.service?.name || 'Service non spécifié'} • {formatDate(selectedRequest.created_at)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className={`${statusMap[selectedRequest.status]?.color || 'bg-gray-100'} text-xs`}>
                    {statusMap[selectedRequest.status]?.icon}
                    {statusMap[selectedRequest.status]?.label || selectedRequest.status}
                  </Badge>
                  <Badge className={`${priorityMap[selectedRequest.priority]?.color || 'bg-gray-100'} text-xs flex items-center gap-1`}>
                    {priorityMap[selectedRequest.priority]?.icon}
                    {priorityMap[selectedRequest.priority]?.label || selectedRequest.priority}
                  </Badge>
                </div>
              </div>

              {/* Client */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                    <FaUser className="h-4 w-4 text-[#F97316]" />
                    Client
                  </h4>
                  <p className="text-sm font-medium">{selectedRequest.client?.first_name} {selectedRequest.client?.last_name}</p>
                  <p className="text-sm text-slate-500">{selectedRequest.client?.email}</p>
                  {selectedRequest.client?.phone && (
                    <p className="text-sm text-slate-500">{selectedRequest.client?.phone}</p>
                  )}
                  {selectedRequest.client?.company_name && (
                    <p className="text-sm text-slate-500">{selectedRequest.client?.company_name}</p>
                  )}
                </div>
                <div className="p-4 border border-slate-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                    <FaBriefcase className="h-4 w-4 text-[#F97316]" />
                    Service
                  </h4>
                  <p className="text-sm font-medium">{selectedRequest.service?.name || 'Non spécifié'}</p>
                  <p className="text-sm text-slate-500">Catégorie: {selectedRequest.service?.category || 'N/A'}</p>
                  <p className="text-sm text-slate-500">Type: {selectedRequest.service?.type === 'saas' ? 'SaaS' : 'Produit'}</p>
                </div>
              </div>

              {/* Description */}
              <div className="p-4 border border-slate-200 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                  <FaComment className="h-4 w-4 text-[#F97316]" />
                  Description
                </h4>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedRequest.description}</p>
              </div>

              {/* Budget et délai */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedRequest.budget && (
                  <div className="p-4 border border-slate-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                      <FaMoneyBill className="h-4 w-4 text-[#F97316]" />
                      Budget
                    </h4>
                    <p className="text-sm font-medium">{selectedRequest.budget}</p>
                  </div>
                )}
                {selectedRequest.deadline && (
                  <div className="p-4 border border-slate-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                      <FaCalendarAlt className="h-4 w-4 text-[#F97316]" />
                      Délai souhaité
                    </h4>
                    <p className="text-sm font-medium">{formatDate(selectedRequest.deadline)}</p>
                  </div>
                )}
              </div>

              {/* Informations supplémentaires */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedRequest.notes && (
                  <div className="p-4 border border-slate-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                      <FaInfoCircle className="h-4 w-4 text-[#F97316]" />
                      Notes
                    </h4>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedRequest.notes}</p>
                  </div>
                )}
                {selectedRequest.assigned_user && (
                  <div className="p-4 border border-slate-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                      <FaUserTie className="h-4 w-4 text-[#F97316]" />
                      Assigné à
                    </h4>
                    <p className="text-sm font-medium">
                      {selectedRequest.assigned_user.first_name} {selectedRequest.assigned_user.last_name}
                    </p>
                    <p className="text-sm text-slate-500">{selectedRequest.assigned_user.email}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                >
                  Fermer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setModalOpen(false);
                    openEditModal(selectedRequest);
                  }}
                  className="text-[#F97316] border-[#F97316] hover:bg-orange-50"
                >
                  <FaEdit className="mr-2 h-4 w-4" />
                  Modifier
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => openDeleteModal(selectedRequest)}
                >
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
            <DialogTitle className="text-[#1E3A8A]">Modifier la demande</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations de la demande
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <Label htmlFor="edit-status">Statut</Label>
              <select
                id="edit-status"
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent bg-white"
              >
                <option value="pending">En attente</option>
                <option value="review">En relecture</option>
                <option value="approved">Approuvé</option>
                <option value="in_progress">En cours</option>
                <option value="completed">Terminé</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>

            <div>
              <Label htmlFor="edit-priority">Priorité</Label>
              <select
                id="edit-priority"
                value={editForm.priority}
                onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent bg-white"
              >
                <option value="low">Basse</option>
                <option value="normal">Normale</option>
                <option value="high">Haute</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>

            <div>
              <Label htmlFor="edit-budget">Budget</Label>
              <Input
                id="edit-budget"
                placeholder="Ex: 1 000 000 FCFA"
                value={editForm.budget}
                onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-deadline">Délai souhaité</Label>
              <Input
                id="edit-deadline"
                type="date"
                value={editForm.deadline}
                onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                placeholder="Notes internes..."
                rows={3}
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
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
              Êtes-vous sûr de vouloir supprimer cette demande ?
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