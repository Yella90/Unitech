// app/(dashboard)/admin/logs/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  FaUser, 
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
  FaCalendarAlt,
  FaFileExport,
  FaFileCsv,
  FaPrint
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
  export_data: { label: 'Export données', color: 'bg-cyan-100 text-cyan-700 border-cyan-200', icon: <FaFileExport className="h-3 w-3" /> },
};

const actionOptions = Object.entries(actionLabels).map(([value, { label }]) => ({ value, label }));

export default function AdminLogsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<Log[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<Log[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // ✅ Filtres
  const [filters, setFilters] = useState<FilterOptions>({
    action: 'all',
    userId: '',
    dateFrom: '',
    dateTo: '',
    entityType: '',
  });

  // ✅ Pagination
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

  const loadLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_logs')
        .select('*, users(email, first_name, last_name)')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      setLogs(data || []);
      setFilteredLogs(data || []);
    } catch (error) {
      console.error('Erreur chargement logs:', error);
      toast.error('Erreur lors du chargement des logs');
    }
  };

  // ✅ Application des filtres
  useEffect(() => {
    let result = [...logs];

    // Filtre action
    if (filters.action !== 'all') {
      result = result.filter(log => log.action === filters.action);
    }

    // Filtre recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(log => 
        log.users?.email?.toLowerCase().includes(term) ||
        log.action?.toLowerCase().includes(term) ||
        log.entity_type?.toLowerCase().includes(term) ||
        JSON.stringify(log.details).toLowerCase().includes(term)
      );
    }

    // Filtre date
    if (filters.dateFrom) {
      result = result.filter(log => new Date(log.created_at) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      const dateTo = new Date(filters.dateTo);
      dateTo.setHours(23, 59, 59, 999);
      result = result.filter(log => new Date(log.created_at) <= dateTo);
    }

    // Filtre entité
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
  };

  // ✅ Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1E3A8A] border-t-transparent"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#F5F7FB] p-6">
      <Toaster position="top-right" richColors />
      
      <div className="mx-auto max-w-7xl">
        {/* En-tête */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1E3A8A] flex items-center gap-3">
              <FaHistory className="h-8 w-8 text-[#F97316]" />
              Journal des activités
            </h1>
            <p className="mt-1 text-slate-500">
              Suivez toutes les actions effectuées par les employés dans le système.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <FaFilter className="mr-2 h-4 w-4" />
              Filtres
              {Object.values(filters).some(v => v && v !== 'all') && (
                <Badge variant="default" className="ml-2 bg-[#F97316] text-white text-xs">
                  Actif
                </Badge>
              )}
            </Button>
            <Button variant="outline" onClick={exportLogsCSV}>
              <FaFileCsv className="mr-2 h-4 w-4" />
              Exporter CSV
            </Button>
            <Button variant="outline" onClick={loadLogs}>
              <FaSync className="mr-2 h-4 w-4" />
              Rafraîchir
            </Button>
          </div>
        </div>

        {/* Filtres */}
        {showFilters && (
          <Card className="mt-4 border border-slate-200">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Label htmlFor="action-filter">Action</Label>
                  <Select
                    value={filters.action}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, action: value }))}
                  >
                    <SelectTrigger id="action-filter">
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
                  <Label htmlFor="entity-filter">Entité</Label>
                  <Input
                    id="entity-filter"
                    placeholder="Projet, formation, etc."
                    value={filters.entityType}
                    onChange={(e) => setFilters(prev => ({ ...prev, entityType: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="date-from">Du</Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="date-to">Au</Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <FaTimes className="mr-2 h-4 w-4" />
                  Réinitialiser
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recherche */}
        <div className="mt-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Rechercher un utilisateur, une action, un détail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Statistiques */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-slate-500">Total</p>
              <p className="text-xl font-bold text-[#1E3A8A]">{filteredLogs.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-slate-500">Aujourd'hui</p>
              <p className="text-xl font-bold text-[#1E3A8A]">
                {filteredLogs.filter(log => 
                  new Date(log.created_at).toDateString() === new Date().toDateString()
                ).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-slate-500">Utilisateurs</p>
              <p className="text-xl font-bold text-[#1E3A8A]">
                {new Set(filteredLogs.map(log => log.user_id)).size}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-slate-500">Actions uniques</p>
              <p className="text-xl font-bold text-[#1E3A8A]">
                {new Set(filteredLogs.map(log => log.action)).size}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Liste des logs */}
        <div className="mt-4 rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Utilisateur</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Action</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 hidden md:table-cell">Entité</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 hidden lg:table-cell">Détails</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      {searchTerm || Object.values(filters).some(v => v && v !== 'all') 
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
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-xs">
                          {new Date(log.created_at).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1E3A8A]/10 text-[#1E3A8A] text-xs font-medium">
                              {log.users?.email?.[0]?.toUpperCase() || 'S'}
                            </div>
                            <span className="text-slate-700 text-xs truncate max-w-[120px]">
                              {log.users?.email || 'Système'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`${action.color} border`}>
                            <span className="flex items-center gap-1 text-xs">
                              {action.icon}
                              {action.label}
                            </span>
                          </Badge>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-slate-600 text-xs">
                          {log.entity_type || '—'}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-slate-600 text-xs max-w-[200px] truncate">
                          {log.details ? JSON.stringify(log.details).slice(0, 100) : '—'}
                          {log.details && JSON.stringify(log.details).length > 100 && '...'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
              <p className="text-xs text-slate-500">
                {filteredLogs.length} entrées
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Précédent
                </Button>
                <span className="flex items-center px-3 text-sm text-slate-600">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}