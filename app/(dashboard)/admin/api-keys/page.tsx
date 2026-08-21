// app/(dashboard)/admin/api-keys/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FaKey,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaSpinner,
  FaSearch,
  FaTimesCircle,
  FaSync,
  FaCheckCircle,
  FaExclamationCircle,
  FaClock,
  FaCog
} from 'react-icons/fa';
import { toast, Toaster } from 'sonner';
import ApiKeyModal from '@/components/dashboard/ApiKeyModal';
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal';

// ✅ Importer les types depuis le fichier central
import type { 
  APIKey, 
  ApiKeyStatus, 
  AIProvider 
} from '@/lib/types/ai-management';

// ============================================================
// MAPPING DES STATUTS
// ============================================================
const statusMap: Record<ApiKeyStatus, { label: string; color: string; icon: React.ReactNode }> = {
  active: {
    label: 'Actif',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: <FaCheckCircle className="h-3 w-3" />
  },
  inactive: {
    label: 'Inactif',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: <FaExclamationCircle className="h-3 w-3" />
  },
  expired: {
    label: 'Expiré',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    icon: <FaClock className="h-3 w-3" />
  },
  depleted: {
    label: 'Épuisé',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: <FaTimesCircle className="h-3 w-3" />
  },
};

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function AdminApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showKeyValues, setShowKeyValues] = useState<Record<string, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<APIKey | null>(null);

  // ✅ État du modal de confirmation
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: '',
    name: '',
    type: 'Clé API',
    isLoading: false,
  });

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================
  useEffect(() => {
    loadData();
  }, [filterProvider, filterStatus]);

  const loadData = async (silent: boolean = false) => {
    if (!silent) setRefreshing(true);

    try {
      console.log('🔍 Chargement des données...');

      // 1. Charger les providers
      const { data: providersData, error: providersError } = await supabase
        .from('ai_providers')
        .select('*')
        .order('name');

      if (providersError) {
        console.error('❌ Erreur providers:', providersError);
        throw providersError;
      }
      console.log(`✅ ${providersData?.length || 0} providers chargés`);
      
      const formattedProviders: AIProvider[] = (providersData || []).map(p => ({
        id: p.id,
        name: p.name,
        display_name: p.display_name,
        description: p.description || null,
        website: p.website || null,
        api_base_url: p.api_base_url || null,
        models: p.models || [],
        is_active: p.is_active !== undefined ? p.is_active : true,
        priority: p.priority || 0,
        created_at: p.created_at || new Date().toISOString(),
        updated_at: p.updated_at || new Date().toISOString(),
      }));
      setProviders(formattedProviders);

      // 2. Charger les clés API
      let query = supabase
        .from('api_keys')
        .select('*');

      if (filterProvider !== 'all') {
        query = query.eq('provider_id', filterProvider);
      }

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data: keysData, error: keysError } = await query
        .order('created_at', { ascending: false });

      if (keysError) {
        console.error('❌ Erreur clés API:', keysError);
        throw keysError;
      }

      console.log(`✅ ${keysData?.length || 0} clés API chargées`);
      
      if (keysData && keysData.length > 0) {
        const providerMap = new Map();
        formattedProviders.forEach(p => providerMap.set(p.id, p));

        const keysWithProviders: APIKey[] = keysData.map(key => ({
          id: key.id,
          provider_id: key.provider_id,
          provider: providerMap.get(key.provider_id) || undefined,
          key_value: key.key_value,
          key_name: key.key_name || '',
          status: key.status as ApiKeyStatus,
          usage_count: key.usage_count || 0,
          monthly_usage: key.monthly_usage || 0,
          daily_usage: key.daily_usage || 0,
          rate_limit: key.rate_limit || 0,
          remaining_quota: key.remaining_quota || null,
          total_quota: key.total_quota || null,
          expires_at: key.expires_at || null,
          last_used_at: key.last_used_at || null,
          last_error: key.last_error || null,
          error_count: key.error_count || 0,
          is_primary: key.is_primary || false,
          notes: key.notes || null,
          created_at: key.created_at || new Date().toISOString(),
          updated_at: key.updated_at || new Date().toISOString(),
        }));

        setApiKeys(keysWithProviders);
        console.log(`✅ ${keysWithProviders.length} clés formatées`);
      } else {
        setApiKeys([]);
      }

      if (!silent) {
        toast.success(`✅ ${keysData?.length || 0} clés API chargées`);
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
  // ACTIONS SUR LES CLÉS
  // ============================================================
  const toggleKeyVisibility = (id: string) => {
    setShowKeyValues(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleStatus = async (id: string, currentStatus: ApiKeyStatus) => {
    const newStatus: ApiKeyStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setApiKeys(apiKeys.map(key =>
        key.id === id ? { ...key, status: newStatus } : key
      ));

      toast.success(`Clé ${newStatus === 'active' ? 'activée' : 'désactivée'}`);
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Erreur lors du changement de statut');
    }
  };

  const togglePrimary = async (id: string, currentPrimary: boolean) => {
    try {
      const key = apiKeys.find(k => k.id === id);
      if (!key) {
        toast.error('Clé non trouvée');
        return;
      }

      const { error: updateError } = await supabase
        .from('api_keys')
        .update({ 
          is_primary: false,
          updated_at: new Date().toISOString()
        })
        .eq('provider_id', key.provider_id);

      if (updateError) {
        console.error('❌ Erreur désactivation primaires:', updateError);
        toast.error('Erreur lors de la mise à jour');
        return;
      }

      const { error } = await supabase
        .from('api_keys')
        .update({
          is_primary: !currentPrimary,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setApiKeys(apiKeys.map(k => 
        k.id === id 
          ? { ...k, is_primary: !currentPrimary }
          : k.provider_id === key.provider_id 
            ? { ...k, is_primary: false }
            : k
      ));

      toast.success(`Clé ${!currentPrimary ? 'définie comme primaire' : 'retirée des primaires'}`);
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Erreur lors du changement');
    }
  };

  // ✅ Ouvrir le modal de confirmation
  const openDeleteModal = (id: string, name: string) => {
    setDeleteModal({
      isOpen: true,
      id,
      name: name || 'Sans nom',
      type: 'Clé API',
      isLoading: false,
    });
  };

  // ✅ Fermer le modal
  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      id: '',
      name: '',
      type: 'Clé API',
      isLoading: false,
    });
  };

  // ✅ Confirmer la suppression
  const confirmDelete = async () => {
    setDeleteModal(prev => ({ ...prev, isLoading: true }));

    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', deleteModal.id);

      if (error) throw error;

      toast.success(`✅ "${deleteModal.name}" supprimé avec succès`);
      setApiKeys(apiKeys.filter(key => key.id !== deleteModal.id));
      closeDeleteModal();
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('Erreur lors de la suppression');
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  // ============================================================
  // FILTRAGE
  // ============================================================
  const getFilteredKeys = () => {
    let filtered = apiKeys;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(key =>
        key.key_name?.toLowerCase().includes(term) ||
        key.key_value.toLowerCase().includes(term) ||
        key.provider?.display_name?.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  const filteredKeys = getFilteredKeys();

  const stats = {
    total: apiKeys.length,
    active: apiKeys.filter(k => k.status === 'active').length,
    inactive: apiKeys.filter(k => k.status === 'inactive').length,
    expired: apiKeys.filter(k => k.status === 'expired').length,
    depleted: apiKeys.filter(k => k.status === 'depleted').length,
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

  return (
    <main className="min-h-screen bg-[#F5F7FB] p-3 sm:p-4 md:p-6">
      <Toaster position="top-right" richColors />
      
      <div className="mx-auto max-w-7xl">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1E3A8A] flex items-center gap-2 sm:gap-3">
              <FaKey className="h-6 w-6 sm:h-7 sm:w-7 text-[#F97316]" />
              Gestion des Clés API
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Gérez les clés API de vos fournisseurs d'IA
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {stats.total} clé{stats.total > 1 ? 's' : ''} configurée{stats.total > 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(false)}
              disabled={refreshing}
              className="text-xs sm:text-sm"
            >
              {refreshing ? (
                <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FaSync className="mr-2 h-4 w-4" />
              )}
              Rafraîchir
            </Button>
            <Button
              onClick={() => { setEditingKey(null); setIsModalOpen(true); }}
              className="bg-[#1E3A8A] hover:bg-[#1A2F6A] text-white text-xs sm:text-sm"
            >
              <FaPlus className="mr-2 h-4 w-4" />
              Nouvelle clé
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4">
          {/* ... Cartes de statistiques ... */}
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Total</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#1E3A8A]">{stats.total}</p>
                </div>
                <FaKey className="h-5 w-5 sm:h-6 sm:w-6 text-[#1E3A8A]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Actives</p>
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
                  <p className="text-[10px] sm:text-xs text-slate-500">Inactives</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-600">{stats.inactive}</p>
                </div>
                <FaExclamationCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Expirées</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600">{stats.expired}</p>
                </div>
                <FaClock className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-2 sm:col-span-1">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Épuisées</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-600">{stats.depleted}</p>
                </div>
                <FaTimesCircle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
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
                placeholder="Rechercher une clé API..."
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

          <div className="flex flex-wrap gap-2">
            <select
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            >
              <option value="all">Tous les providers</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.display_name}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
              <option value="expired">Expiré</option>
              <option value="depleted">Épuisé</option>
            </select>
          </div>
        </div>

        {/* Liste des clés API */}
        <div className="mt-4 sm:mt-6 rounded-xl sm:rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {filteredKeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
              <div className="rounded-full bg-slate-100 p-3 sm:p-4">
                <FaKey className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
              </div>
              <h3 className="mt-4 text-base sm:text-lg font-semibold text-slate-700">
                {apiKeys.length === 0 ? 'Aucune clé API trouvée' : 'Aucun résultat'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                {apiKeys.length === 0
                  ? 'Commencez par ajouter votre première clé API'
                  : 'Essayez de modifier vos filtres'}
              </p>
              {apiKeys.length === 0 ? (
                <Button
                  onClick={() => { setEditingKey(null); setIsModalOpen(true); }}
                  className="mt-4 bg-[#1E3A8A] hover:bg-[#1A2F6A] text-white"
                >
                  <FaPlus className="mr-2 h-4 w-4" />
                  Ajouter une clé
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setSearchTerm(''); setFilterProvider('all'); setFilterStatus('all'); }}
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
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600">Provider</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600">Nom</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600">Clé</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600">Statut</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600 hidden md:table-cell">Utilisations</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600 hidden lg:table-cell">Primaire</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKeys.map((key) => {
                    const statusInfo = statusMap[key.status];
                    const isProviderActive = key.provider?.is_active !== false;
                    
                    return (
                      <tr key={key.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                        <td className="px-2 sm:px-4 py-2 sm:py-3">
                          <div className="flex items-center gap-2">
                            <FaCog className={`h-4 w-4 ${isProviderActive ? 'text-slate-400' : 'text-slate-300'}`} />
                            <span className={`font-medium ${isProviderActive ? 'text-slate-800' : 'text-slate-400'}`}>
                              {key.provider?.display_name || 'Inconnu'}
                            </span>
                            {!isProviderActive && (
                              <Badge variant="outline" className="text-[8px] text-slate-400">
                                Inactif
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3">
                          <span className="text-slate-700">{key.key_name || 'Sans nom'}</span>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3">
                          <div className="flex items-center gap-2">
                            <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">
                              {showKeyValues[key.id]
                                ? key.key_value
                                : `${key.key_value.slice(0, 8)}...${key.key_value.slice(-4)}`}
                            </code>
                            <button
                              onClick={() => toggleKeyVisibility(key.id)}
                              className="text-slate-400 hover:text-slate-600"
                              title={showKeyValues[key.id] ? 'Masquer' : 'Afficher'}
                            >
                              {showKeyValues[key.id] ? (
                                <FaEyeSlash className="h-4 w-4" />
                              ) : (
                                <FaEye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3">
                          <div className="flex flex-col gap-0.5">
                            <Badge className={statusInfo?.color || 'bg-gray-100'}>
                              <span className="flex items-center gap-1">
                                {statusInfo?.icon}
                                {statusInfo?.label || key.status}
                              </span>
                            </Badge>
                            {key.error_count > 0 && (
                              <span className="text-[10px] text-red-500">
                                {key.error_count} erreur{key.error_count > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell">
                          <div>
                            <p className="text-slate-600">{key.usage_count || 0} appels</p>
                            {key.remaining_quota !== null && (
                              <p className="text-[10px] text-slate-400">
                                Quota: {key.remaining_quota}/{key.total_quota || '∞'}
                              </p>
                            )}
                            {key.last_used_at && (
                              <p className="text-[10px] text-slate-400">
                                Dernier: {new Date(key.last_used_at).toLocaleDateString('fr-FR')}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 hidden lg:table-cell">
                          {key.is_primary ? (
                            <Badge className="bg-[#1E3A8A] text-white">
                              <FaCheckCircle className="mr-1 h-3 w-3" />
                              Primaire
                            </Badge>
                          ) : (
                            <span className="text-slate-400 text-xs">Non</span>
                          )}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                          <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                            <button
                              onClick={() => toggleStatus(key.id, key.status)}
                              className={`h-7 w-7 sm:h-8 sm:w-8 rounded-lg transition flex items-center justify-center ${
                                key.status === 'active'
                                  ? 'text-red-500 hover:bg-red-50'
                                  : 'text-green-500 hover:bg-green-50'
                              }`}
                              title={key.status === 'active' ? 'Désactiver' : 'Activer'}
                            >
                              {key.status === 'active' ? (
                                <FaEyeSlash className="h-3 w-3 sm:h-4 sm:w-4" />
                              ) : (
                                <FaEye className="h-3 w-3 sm:h-4 sm:w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => togglePrimary(key.id, key.is_primary)}
                              className={`h-7 w-7 sm:h-8 sm:w-8 rounded-lg transition flex items-center justify-center ${
                                key.is_primary
                                  ? 'text-[#1E3A8A] hover:bg-blue-50'
                                  : 'text-slate-400 hover:bg-slate-100'
                              }`}
                              title={key.is_primary ? 'Retirer des primaires' : 'Définir comme primaire'}
                            >
                              <FaCheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                            <button
                              onClick={() => { setEditingKey(key); setIsModalOpen(true); }}
                              className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg transition flex items-center justify-center text-slate-400 hover:text-[#F97316] hover:bg-orange-50"
                              title="Modifier"
                            >
                              <FaEdit className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                            {/* ✅ Bouton Supprimer avec modal */}
                            <button
                              onClick={() => openDeleteModal(key.id, key.key_name || key.provider?.display_name || 'Sans nom')}
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

        {/* Bas de page */}
        {filteredKeys.length > 0 && (
          <div className="mt-4 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
            <span>
              {filteredKeys.length} clé{filteredKeys.length > 1 ? 's' : ''} affichée{filteredKeys.length > 1 ? 's' : ''}
              {apiKeys.length > filteredKeys.length && ` (sur ${apiKeys.length} total)`}
            </span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                {stats.active} actives
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-red-500"></span>
                {stats.inactive} inactives
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                {stats.expired} expirées
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                {stats.depleted} épuisées
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Modal d'ajout/édition */}
      <ApiKeyModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingKey(null);
        }}
        onSave={() => {
          loadData(true);
          setIsModalOpen(false);
          setEditingKey(null);
        }}
        editingKey={editingKey}
        providers={providers}
      />

      {/* ✅ Modal de confirmation de suppression */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer la clé API "${deleteModal.name}" ?`}
        itemName={deleteModal.name}
        itemType={deleteModal.type}
        isLoading={deleteModal.isLoading}
      />
    </main>
  );
}