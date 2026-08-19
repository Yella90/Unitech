// app/(dashboard)/admin/services/service-requests/page.tsx
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
  FaFile,
  FaDownload,
  FaSearch,
  FaFilter,
  FaTimesCircle,
  FaSync
} from 'react-icons/fa';
import { toast, Toaster } from 'sonner';
import Link from 'next/link';
import RequestDetailModal from '@/components/dashboard/RequestDetailModal';

type ServiceRequest = {
  id: string;
  service_id: string;
  service?: {
    name: string;
    slug: string;
  };
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  description: string;
  budget: string | null;
  deadline: string | null;
  attachments: string[];
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
};

const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: {
    label: 'En attente',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: <FaClock className="h-3 w-3" />
  },
  processing: {
    label: 'En traitement',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: <FaSpinner className="h-3 w-3 animate-spin" />
  },
  completed: {
    label: 'Terminé',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: <FaCheck className="h-3 w-3" />
  },
  cancelled: {
    label: 'Annulé',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: <FaTimes className="h-3 w-3" />
  },
};

export default function AdminServiceRequests() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'processing' | 'completed' | 'cancelled'>('all');
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async (silent: boolean = false) => {
    if (!silent) setRefreshing(true);

    try {
      let query = supabase
        .from('service_requests')
        .select(`
          *,
          service:service_id (
            name,
            slug
          )
        `)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRequests(data || []);
      
      if (!silent) {
        toast.success(`✅ ${data?.length || 0} demandes chargées`);
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

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setRequests(requests.map(r => 
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

  const getFilteredRequests = () => {
    let filtered = requests;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term) ||
        r.description.toLowerCase().includes(term) ||
        r.company?.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  const filteredRequests = getFilteredRequests();
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    processing: requests.filter(r => r.status === 'processing').length,
    completed: requests.filter(r => r.status === 'completed').length,
    cancelled: requests.filter(r => r.status === 'cancelled').length,
  };

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
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1E3A8A] flex items-center gap-2 sm:gap-3">
              <FaClipboardList className="h-6 w-6 sm:h-7 sm:w-7 text-[#F97316]" />
              Demandes de services
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Gérez les demandes de services des clients
            </p>
          </div>
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
        </div>

        {/* Statistiques */}
        <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4">
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
                  <p className="text-[10px] sm:text-xs text-slate-500">En traitement</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">{stats.processing}</p>
                </div>
                <FaSpinner className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 animate-spin" />
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
                <FaCheck className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
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

        {/* Recherche et filtres */}
        <div className="mt-4 sm:mt-6 flex flex-col gap-3">
          <div className="flex flex-col xs:flex-row gap-2">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3 w-3 sm:h-4 sm:w-4" />
              <input
                type="text"
                placeholder="Rechercher par nom, email, entreprise..."
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

          {/* Filtres */}
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
              variant={filterStatus === 'processing' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('processing')}
              className={`text-xs ${filterStatus === 'processing' ? 'bg-blue-600' : ''}`}
            >
              <FaSpinner className="mr-1 h-3 w-3 animate-spin" />
              En traitement ({stats.processing})
            </Button>
            <Button
              variant={filterStatus === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('completed')}
              className={`text-xs ${filterStatus === 'completed' ? 'bg-green-600' : ''}`}
            >
              <FaCheck className="mr-1 h-3 w-3" />
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

        {/* Liste des demandes */}
        <div className="mt-4 sm:mt-6 rounded-xl sm:rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
              <div className="rounded-full bg-slate-100 p-3 sm:p-4">
                <FaClipboardList className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
              </div>
              <h3 className="mt-4 text-base sm:text-lg font-semibold text-slate-700">
                Aucune demande trouvée
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                {searchTerm || filterStatus !== 'all'
                  ? 'Essayez de modifier vos filtres'
                  : 'Aucune demande de service pour le moment'}
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
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600">Client</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600 hidden md:table-cell">Service</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600 hidden lg:table-cell">Description</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600">Statut</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600 hidden xs:table-cell">Date</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <div>
                          <p className="font-medium text-slate-800 text-xs sm:text-sm truncate max-w-[100px] xs:max-w-[150px]">
                            {request.name}
                          </p>
                          <p className="text-[10px] sm:text-xs text-slate-400 truncate max-w-[100px] xs:max-w-[150px]">
                            {request.email}
                          </p>
                          {request.company && (
                            <p className="text-[10px] text-slate-400 truncate max-w-[100px] xs:max-w-[150px]">
                              {request.company}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell">
                        <span className="text-xs sm:text-sm text-slate-600">
                          {request.service?.name || 'Non spécifié'}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 hidden lg:table-cell">
                        <p className="line-clamp-2 max-w-xs text-slate-600 text-xs sm:text-sm">
                          {request.description}
                        </p>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <Badge className={`${statusMap[request.status]?.color || 'bg-gray-100'} text-[8px] sm:text-[10px] flex items-center gap-1 w-fit`}>
                          {statusMap[request.status]?.icon}
                          {statusMap[request.status]?.label || request.status}
                        </Badge>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 hidden xs:table-cell">
                        <span className="text-[10px] sm:text-xs text-slate-500">
                          {new Date(request.created_at).toLocaleDateString('fr-FR')}
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
                          {request.status === 'pending' && (
                            <button
                              onClick={() => updateStatus(request.id, 'processing')}
                              className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg transition flex items-center justify-center text-blue-500 hover:bg-blue-50"
                              title="Prendre en charge"
                            >
                              <FaSpinner className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                          )}
                          {request.status === 'processing' && (
                            <button
                              onClick={() => updateStatus(request.id, 'completed')}
                              className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg transition flex items-center justify-center text-green-500 hover:bg-green-50"
                              title="Marquer comme terminé"
                            >
                              <FaCheck className="h-3 w-3 sm:h-4 sm:w-4" />
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

      {/* Modal de détails */}
      {selectedRequest && (
        <RequestDetailModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          request={selectedRequest}
          onStatusUpdate={updateStatus}
        />
      )}
    </main>
  );
}