'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FaHistory, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSignInAlt, 
  FaSignOutAlt,
  FaDownload,
  FaSync,
  FaFilter,
  FaSearch,
  FaTimes,
  FaFileCsv,
  FaSpinner,
  FaChevronLeft,
  FaChevronRight,
  FaUserCircle,
  FaClock
} from 'react-icons/fa';
import { toast, Toaster } from 'sonner';

type Log = {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: any;
  created_at: string;
  users?: {
    email: string;
    first_name: string;
    last_name: string;
  };
};

type FilterOptions = {
  action: string;
  userId: string;
  dateFrom: string;
  dateTo: string;
  entityType: string;
};

const actionLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  login: { label: 'Connexion', color: 'bg-green-100 text-green-700 border-green-200', icon: <FaSignInAlt className="h-3 w-3" /> },
  logout: { label: 'Déconnexion', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: <FaSignOutAlt className="h-3 w-3" /> },
  create_project: { label: 'Création projet', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <FaPlus className="h-3 w-3" /> },
  update_project: { label: 'Modification projet', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: <FaEdit className="h-3 w-3" /> },
  delete_project: { label: 'Suppression projet', color: 'bg-red-100 text-red-700 border-red-200', icon: <FaTrash className="h-3 w-3" /> },
  create_training: { label: 'Création formation', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <FaPlus className="h-3 w-3" /> },
  update_training: { label: 'Modification formation', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: <FaEdit className="h-3 w-3" /> },
  delete_training: { label: 'Suppression formation', color: 'bg-red-100 text-red-700 border-red-200', icon: <FaTrash className="h-3 w-3" /> },
  create_user: { label: 'Création utilisateur', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <FaPlus className="h-3 w-3" /> },
  update_user: { label: 'Modification utilisateur', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: <FaEdit className="h-3 w-3" /> },
  delete_user: { label: 'Suppression utilisateur', color: 'bg-red-100 text-red-700 border-red-200', icon: <FaTrash className="h-3 w-3" /> },
  update_settings: { label: 'Modification paramètres', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: <FaEdit className="h-3 w-3" /> },
  view_analytics: { label: 'Consultation analytics', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: <FaHistory className="h-3 w-3" /> },
  export_data: { label: 'Export données', color: 'bg-cyan-100 text-cyan-700 border-cyan-200', icon: <FaFileCsv className="h-3 w-3" /> },
};

const actionOptions = Object.entries(actionLabels).map(([value, { label }]) => ({ value, label }));

export default function AdminLogsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logs, setLogs] = useState<Log[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<Log[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [tableExists, setTableExists] = useState(true);
  
  const [filters, setFilters] = useState<FilterOptions>({
    action: 'all',
    userId: '',
    dateFrom: '',
    dateTo: '',
    entityType: '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();

        if (!sessionData.user || !['admin', 'super_admin'].includes(sessionData.user.role)) {
          router.push('/login?error=unauthorized&message=Accès réservé aux administrateurs');
          return;
        }

        setIsAdmin(true);
        await loadLogs();

      } catch (error) {
        console.error('Erreur:', error);
        toast.error('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const loadLogs = async (silent: boolean = false) => {
    if (!silent) {
      setRefreshing(true);
    }

    try {
      const { data, error } = await supabase
        .from('employee_logs')
        .select('*, users(email, first_name, last_name)')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) {
        if (error.message?.includes('relation "employee_logs" does not exist')) {
          setTableExists(false);
          setLogs([]);
          setFilteredLogs([]);
          if (!silent) toast.warning('⚠️ La table des logs n\'existe pas encore');
          return;
        }
        console.error('Erreur chargement logs:', error);
        if (!silent) toast.error('Erreur lors du chargement des logs');
        return;
      }

      setLogs(data || []);
      setFilteredLogs(data || []);
      setTableExists(true);
      if (!silent) {
        toast.success(`✅ ${data?.length || 0} logs chargés`);
      }
    } catch (error) {
      console.error('Erreur chargement logs:', error);
      if (!silent) toast.error('Erreur lors du chargement des logs');
    } finally {
      if (!silent) {
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    let result = [...logs];

    if (filters.action !== 'all') {
      result = result.filter(log => log.action === filters.action);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(log => 
        log.users?.email?.toLowerCase().includes(term) ||
        log.action?.toLowerCase().includes(term) ||
        log.entity_type?.toLowerCase().includes(term) ||
        JSON.stringify(log.details).toLowerCase().includes(term)
      );
    }

    if (filters.dateFrom) {
      result = result.filter(log => new Date(log.created_at) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      const dateTo = new Date(filters.dateTo);
      dateTo.setHours(23, 59, 59, 999);
      result = result.filter(log => new Date(log.created_at) <= dateTo);
    }

    if (filters.entityType) {
      result = result.filter(log => log.entity_type === filters.entityType);
    }

    setFilteredLogs(result);
    setCurrentPage(1);
  }, [logs, filters, searchTerm]);

  const exportLogsCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error('Aucun log à exporter');
      return;
    }

    try {
      const headers = ['Date', 'Utilisateur', 'Action', 'Entité', 'Détails'];
      const rows = filteredLogs.map(log => [
        new Date(log.created_at).toLocaleString('fr-FR'),
        log.users?.email || 'Système',
        actionLabels[log.action]?.label || log.action,
        log.entity_type || '—',
        JSON.stringify(log.details || {}),
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `logs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast.success('✅ Export CSV réussi');
    } catch (error) {
      console.error('Erreur export:', error);
      toast.error('Erreur lors de l\'export');
    }
  };

  const clearFilters = () => {
    setFilters({
      action: 'all',
      userId: '',
      dateFrom: '',
      dateTo: '',
      entityType: '',
    });
    setSearchTerm('');
    setShowFilters(false);
  };

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = searchTerm || Object.values(filters).some(v => v && v !== 'all');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] p-4">
        <div className="h-10 w-10 sm:h-12 sm:w-12 animate-spin rounded-full border-4 border-[#1E3A8A] border-t-transparent"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#F5F7FB] p-3 sm:p-4 md:p-6">
      <Toaster position="top-right" richColors />
      
      <div className="mx-auto max-w-7xl">
        {/* En-tête responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1E3A8A] flex flex-wrap items-center gap-2 sm:gap-3">
              <FaHistory className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-[#F97316] flex-shrink-0" />
              <span className="truncate">Journal des activités</span>
              {refreshing && (
                <FaSpinner className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-[#F97316] flex-shrink-0" />
              )}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
              Suivez toutes les actions effectuées par les employés dans le système.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="text-xs sm:text-sm"
            >
              <FaFilter className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Filtres</span>
              {hasActiveFilters && (
                <Badge variant="default" className="ml-1 sm:ml-2 bg-[#F97316] text-white text-[8px] sm:text-[10px]">
                  Actif
                </Badge>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={exportLogsCSV}
              className="text-xs sm:text-sm"
            >
              <FaFileCsv className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Exporter CSV</span>
              <span className="xs:hidden">📥</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => loadLogs(false)}
              disabled={refreshing}
              className="text-xs sm:text-sm"
            >
              {refreshing ? (
                <FaSpinner className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
              ) : (
                <FaSync className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              )}
              <span className="hidden xs:inline">Rafraîchir</span>
            </Button>
          </div>
        </div>

        {!tableExists && (
          <div className="mt-4 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs sm:text-sm text-yellow-800">
              ⚠️ La table des logs n'existe pas encore. Exécutez le script SQL dans Supabase pour la créer.
            </p>
            <Button 
              variant="outline" 
              size="sm"
              className="mt-2 border-yellow-300 text-yellow-700 hover:bg-yellow-100 text-xs sm:text-sm"
              onClick={() => window.open('https://app.supabase.com', '_blank')}
            >
              Aller à Supabase
            </Button>
          </div>
        )}

        {/* Filtres - responsive */}
        {showFilters && (
          <Card className="mt-4 border border-slate-200">
            <CardContent className="p-3 sm:p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Label htmlFor="action-filter" className="text-xs sm:text-sm">Action</Label>
                  <Select
                    value={filters.action}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, action: value }))}
                  >
                    <SelectTrigger id="action-filter" className="mt-1 text-sm">
                      <SelectValue placeholder="Toutes les actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les actions</SelectItem>
                      {actionOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="entity-filter" className="text-xs sm:text-sm">Entité</Label>
                  <Input
                    id="entity-filter"
                    placeholder="Projet, formation..."
                    value={filters.entityType}
                    onChange={(e) => setFilters(prev => ({ ...prev, entityType: e.target.value }))}
                    className="mt-1 text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="date-from" className="text-xs sm:text-sm">Du</Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    className="mt-1 text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="date-to" className="text-xs sm:text-sm">Au</Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    className="mt-1 text-sm"
                  />
                </div>
              </div>

              <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs sm:text-sm">
                  <FaTimes className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Réinitialiser
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recherche - responsive */}
        <div className="mt-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3 w-3 sm:h-4 sm:w-4" />
            <Input
              placeholder="Rechercher un utilisateur, une action, un détail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 sm:pl-10 text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <FaTimes className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Statistiques - responsive */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Total</p>
                  <p className="text-base sm:text-lg md:text-xl font-bold text-[#1E3A8A]">{filteredLogs.length}</p>
                </div>
                <FaHistory className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-[#F97316]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Aujourd'hui</p>
                  <p className="text-base sm:text-lg md:text-xl font-bold text-[#1E3A8A]">
                    {filteredLogs.filter(log => 
                      new Date(log.created_at).toDateString() === new Date().toDateString()
                    ).length}
                  </p>
                </div>
                <FaClock className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-[#10B981]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Utilisateurs</p>
                  <p className="text-base sm:text-lg md:text-xl font-bold text-[#1E3A8A]">
                    {new Set(filteredLogs.map(log => log.user_id)).size}
                  </p>
                </div>
                <FaUserCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-[#F97316]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Actions uniques</p>
                  <p className="text-base sm:text-lg md:text-xl font-bold text-[#1E3A8A]">
                    {new Set(filteredLogs.map(log => log.action)).size}
                  </p>
                </div>
                <FaFilter className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-[#F97316]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tableau des logs - responsive */}
        <div className="mt-4 rounded-xl sm:rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <div className="min-w-[640px] sm:min-w-full">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600">Date</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600">Utilisateur</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600">Action</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600 hidden md:table-cell">Entité</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-2 sm:px-4 py-8 text-center text-slate-500 text-xs sm:text-sm">
                        {!tableExists 
                          ? '⚠️ La table des logs n\'existe pas' 
                          : searchTerm || hasActiveFilters 
                            ? 'Aucun résultat pour ces critères' 
                            : 'Aucune activité enregistrée'}
                      </td>
                    </tr>
                  ) : (
                    paginatedLogs.map((log) => {
                      const action = actionLabels[log.action] || { 
                        label: log.action, 
                        color: 'bg-gray-100 text-gray-700 border-gray-200',
                        icon: null 
                      };
                      return (
                        <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-slate-600 whitespace-nowrap text-[10px] sm:text-xs">
                            {new Date(log.created_at).toLocaleString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-[#1E3A8A]/10 text-[#1E3A8A] text-[10px] sm:text-xs font-medium flex-shrink-0">
                                {log.users?.email?.[0]?.toUpperCase() || 'S'}
                              </div>
                              <span className="text-slate-700 text-[10px] sm:text-xs truncate max-w-[80px] xs:max-w-[120px] sm:max-w-[150px]">
                                {log.users?.email || 'Système'}
                              </span>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <Badge className={`${action.color} border text-[8px] sm:text-[10px] whitespace-nowrap`}>
                              <span className="flex items-center gap-0.5 sm:gap-1">
                                {action.icon}
                                <span className="hidden xs:inline">{action.label}</span>
                                <span className="xs:hidden">{action.label.substring(0, 10)}</span>
                              </span>
                            </Badge>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell text-slate-600 text-[10px] sm:text-xs truncate max-w-[150px]">
                            {log.entity_type || '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination - responsive */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 px-3 sm:px-4 py-3">
              <p className="text-[10px] sm:text-xs text-slate-500">
                {filteredLogs.length} entrées
              </p>
              <div className="flex items-center gap-1 sm:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-7 sm:h-8 px-2 sm:px-3 text-xs"
                >
                  <FaChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline ml-1">Précédent</span>
                </Button>
                <span className="flex items-center px-2 sm:px-3 text-[10px] sm:text-sm text-slate-600">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-7 sm:h-8 px-2 sm:px-3 text-xs"
                >
                  <span className="hidden xs:inline mr-1">Suivant</span>
                  <FaChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}