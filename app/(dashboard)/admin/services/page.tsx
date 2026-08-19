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
  FaSync,
  FaUniversity,
  FaStore,
  FaSolarPanel,
  FaRobot,
  FaGraduationCap,
  FaLeaf,
  FaBuilding,
  FaBolt,
  FaBrain,
  FaCogs,
  FaChartLine,
  FaCode,
  FaMobileAlt,
  FaPaintBrush,
  FaCloud,
  FaDatabase,
  FaShieldAlt,
  FaHome,
  FaClipboardList // ✅ Ajout pour l'icône des demandes
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

// ✅ MAPPING DES ICÔNES
const iconMap: Record<string, React.ReactNode> = {
  FaUniversity: <FaUniversity className="h-5 w-5 sm:h-6 sm:w-6" />,
  FaStore: <FaStore className="h-5 w-5 sm:h-6 sm:w-6" />,
  FaSolarPanel: <FaSolarPanel className="h-5 w-5 sm:h-6 sm:w-6" />,
  FaRobot: <FaRobot className="h-5 w-5 sm:h-6 sm:w-6" />,
  FaGraduationCap: <FaGraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />,
  FaLeaf: <FaLeaf className="h-5 w-5 sm:h-6 sm:w-6" />,
  FaCog: <FaCog className="h-5 w-5 sm:h-6 sm:w-6" />,
  FaBuilding: <FaBuilding className="h-5 w-5 sm:h-6 sm:w-6" />,
  FaBolt: <FaBolt className="h-5 w-5 sm:h-6 sm:w-6" />,
  FaBrain: <FaBrain className="h-5 w-5 sm:h-6 sm:w-6" />,
  FaCogs: <FaCogs className="h-5 w-5 sm:h-6 sm:w-6" />,
  FaChartLine: <FaChartLine className="h-5 w-5 sm:h-6 sm:w-6" />,
  FaCode: <FaCode className="h-5 w-5 sm:h-6 sm:w-6" />,
  FaMobileAlt: <FaMobileAlt className="h-5 w-5 sm:h-6 sm:w-6" />,
  FaPaintBrush: <FaPaintBrush className="h-5 w-5 sm:h-6 sm:w-6" />,
  FaCloud: <FaCloud className="h-5 w-5 sm:h-6 sm:w-6" />,
  FaDatabase: <FaDatabase className="h-5 w-5 sm:h-6 sm:w-6" />,
  FaShieldAlt: <FaShieldAlt className="h-5 w-5 sm:h-6 sm:w-6" />,
  FaHome: <FaHome className="h-5 w-5 sm:h-6 sm:w-6" />,
};

// ✅ FONCTION POUR RÉCUPÉRER UNE ICÔNE
const getServiceIcon = (iconName: string): React.ReactNode => {
  return iconMap[iconName] || <FaCog className="h-5 w-5 sm:h-6 sm:w-6" />;
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
            {/* ✅ NOUVEAU LIEN VERS GESTION DES DEMANDES */}
            <Link href="/admin/services/service-requests" className="flex-shrink-0">
              <Button 
                variant="outline" 
                size="sm"
                className="border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A]/10"
              >
                <FaClipboardList className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Demandes</span>
                <span className="xs:hidden">Demandes</span>
              </Button>
            </Link>
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

        {/* ... Le reste du code reste identique ... */}
        
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

        {/* ... Le reste du code (recherche, filtres, tableau) reste identique ... */}
        
        {/* Liste des services - Le reste du tableau reste identique */}
        <div className="mt-4 sm:mt-6 rounded-xl sm:rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* ... Tableau des services ... */}
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