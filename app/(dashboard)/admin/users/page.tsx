'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FaUsers, 
  FaEdit, 
  FaPlus, 
  FaTrash, 
  FaSpinner,
  FaSearch,
  FaFilter,
  FaTimesCircle,
  FaUserCheck,
  FaUserTimes,
  FaShieldAlt,
  FaEnvelope
} from 'react-icons/fa';
import { toast, Toaster } from 'sonner';

type User = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  department: string | null;
  is_active: boolean;
  created_at: string | null;
};

const roleLabels: Record<string, string> = {
  admin: 'Administrateur',
  super_admin: 'Super admin',
  project_manager: 'Chef de projet',
  team_lead: 'Lead technique',
  developer: 'Développeur',
  designer: 'Designer',
  client: 'Client',
  viewer: 'Visiteur',
};

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700 border-purple-200',
  super_admin: 'bg-red-100 text-red-700 border-red-200',
  project_manager: 'bg-blue-100 text-blue-700 border-blue-200',
  team_lead: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  developer: 'bg-green-100 text-green-700 border-green-200',
  designer: 'bg-pink-100 text-pink-700 border-pink-200',
  client: 'bg-slate-100 text-slate-700 border-slate-200',
  viewer: 'bg-gray-100 text-gray-700 border-gray-200',
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();

        if (!sessionData.user || !['admin', 'super_admin'].includes(sessionData.user.role)) {
          router.push('/login?error=unauthorized&message=Accès réservé aux administrateurs');
          return;
        }

        setIsAdmin(true);
        await loadUsers();

      } catch (error) {
        console.error('Erreur:', error);
        toast.error('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoad();
  }, [router]);

  const loadUsers = async (silent: boolean = false) => {
    if (!silent) {
      setRefreshing(true);
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur:', error);
        if (!silent) toast.error('Erreur lors du chargement des utilisateurs');
        return;
      }

      setUsers(data || []);
      if (!silent) {
        toast.success(`✅ ${data?.length || 0} utilisateurs chargés`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      if (!silent) toast.error('Erreur lors du chargement');
    } finally {
      if (!silent) {
        setRefreshing(false);
      }
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Supprimer l'utilisateur "${email}" ?`)) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('✅ Utilisateur supprimé avec succès');
      setUsers(users.filter(u => u.id !== id));
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  // Filtrage
  const getFilteredUsers = () => {
    let filtered = users;

    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    if (statusFilter === 'active') {
      filtered = filtered.filter(u => u.is_active);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(u => !u.is_active);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u => 
        (u.first_name && u.first_name.toLowerCase().includes(term)) ||
        (u.last_name && u.last_name.toLowerCase().includes(term)) ||
        u.email.toLowerCase().includes(term) ||
        (u.department && u.department.toLowerCase().includes(term))
      );
    }

    return filtered;
  };

  const activeUsers = users.filter((user) => user.is_active).length;
  const totalUsers = users.length;
  const uniqueRoles = new Set(users.map((user) => user.role)).size;
  const filteredUsers = getFilteredUsers();

  // Rôles uniques pour les filtres
  const roles = Array.from(new Set(users.map(u => u.role)));

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
              <FaUsers className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-[#F97316] flex-shrink-0" />
              <span className="truncate">Gestion des utilisateurs</span>
              {refreshing && (
                <FaSpinner className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-[#F97316] flex-shrink-0" />
              )}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
              Liste des comptes, rôles et accès administrateurs.
            </p>
          </div>
          <Link href="/admin/users/new" className="flex-shrink-0">
            <Button className="w-full sm:w-auto bg-[#F97316] hover:bg-[#ea580c] text-white text-xs sm:text-sm">
              <FaPlus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Nouvel utilisateur</span>
              <span className="xs:hidden">Nouveau</span>
            </Button>
          </Link>
        </div>

        {/* Statistiques responsive */}
        <div className="mt-4 sm:mt-6 grid grid-cols-3 gap-2 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Total</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#1E3A8A]">{totalUsers}</p>
                </div>
                <FaUsers className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-[#F97316]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Actifs</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{activeUsers}</p>
                </div>
                <FaUserCheck className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Rôles</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#1E3A8A]">{uniqueRoles}</p>
                </div>
                <FaShieldAlt className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-[#F97316]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="mt-4 sm:mt-6 flex flex-col gap-3">
          <div className="flex flex-col xs:flex-row gap-2">
            <div className="relative flex-1 min-w-0">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3 w-3 sm:h-4 sm:w-4" />
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
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
              onClick={() => loadUsers(false)}
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
                variant={roleFilter === 'all' && statusFilter === 'all' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => { setRoleFilter('all'); setStatusFilter('all'); }}
                className={`text-xs ${roleFilter === 'all' && statusFilter === 'all' ? 'bg-[#1E3A8A]' : ''}`}
              >
                Tous ({totalUsers})
              </Button>
              <Button 
                variant={statusFilter === 'active' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}
                className={`text-xs ${statusFilter === 'active' ? 'bg-green-600' : ''}`}
              >
                <FaUserCheck className="mr-1 h-3 w-3" />
                Actifs ({activeUsers})
              </Button>
              <Button 
                variant={statusFilter === 'inactive' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setStatusFilter(statusFilter === 'inactive' ? 'all' : 'inactive')}
                className={`text-xs ${statusFilter === 'inactive' ? 'bg-red-600' : ''}`}
              >
                <FaUserTimes className="mr-1 h-3 w-3" />
                Inactifs ({totalUsers - activeUsers})
              </Button>
              {roles.map((role) => {
                const count = users.filter(u => u.role === role).length;
                const label = roleLabels[role] || role;
                const color = roleColors[role] || 'bg-gray-100 text-gray-700';
                return (
                  <Button 
                    key={role}
                    variant={roleFilter === role ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setRoleFilter(roleFilter === role ? 'all' : role)}
                    className={`text-xs ${roleFilter === role ? 'bg-[#1E3A8A]' : ''}`}
                  >
                    <span className={`inline-block h-2 w-2 rounded-full mr-1 ${color.split(' ')[0]}`} />
                    {label} ({count})
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Liste des utilisateurs - responsive */}
        <div className="mt-4 sm:mt-6 rounded-xl sm:rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
              <div className="rounded-full bg-slate-100 p-3 sm:p-4">
                <FaUsers className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
              </div>
              <h3 className="mt-4 text-base sm:text-lg font-semibold text-slate-700">Aucun utilisateur</h3>
              <p className="text-xs sm:text-sm text-slate-500">Commencez par ajouter votre premier utilisateur.</p>
              <Link href="/admin/users/new">
                <Button className="mt-4 bg-[#F97316] hover:bg-[#ea580c] text-white text-xs sm:text-sm">
                  <FaPlus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Ajouter un utilisateur
                </Button>
              </Link>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <FaSearch className="h-10 w-10 sm:h-12 sm:w-12 text-slate-300 mb-3" />
              <p className="text-sm text-slate-500">Aucun utilisateur ne correspond aux filtres</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { setSearchTerm(''); setRoleFilter('all'); setStatusFilter('all'); }}
                className="mt-2"
              >
                Réinitialiser les filtres
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <div className="min-w-[640px] sm:min-w-full">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600">Utilisateur</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600 hidden sm:table-cell">Email</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600">Rôle</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600 hidden xs:table-cell">Statut</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const roleLabel = roleLabels[user.role] || user.role;
                      const roleColor = roleColors[user.role] || 'bg-gray-100 text-gray-700';
                      const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Utilisateur';
                      
                      return (
                        <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <p className="font-medium text-slate-800 text-xs sm:text-sm truncate max-w-[100px] xs:max-w-[150px] sm:max-w-[200px]">
                                {fullName}
                              </p>
                              <p className="text-[10px] sm:text-xs text-slate-400 truncate max-w-[100px] xs:max-w-[150px] sm:max-w-[200px]">
                                {user.department || 'Aucun département'}
                              </p>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell">
                            <div className="flex items-center gap-1">
                              <FaEnvelope className="h-3 w-3 text-slate-400" />
                              <span className="text-slate-600 text-xs sm:text-sm truncate max-w-[150px]">
                                {user.email}
                              </span>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <Badge className={`${roleColor} text-[8px] sm:text-[10px] whitespace-nowrap`}>
                              {roleLabel}
                            </Badge>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 hidden xs:table-cell">
                            <Badge variant={user.is_active ? 'default' : 'destructive'} className="text-[8px] sm:text-[10px]">
                              {user.is_active ? 'Actif' : 'Inactif'}
                            </Badge>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                            <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                              <Link href={`/admin/users/${user.id}/edit`}>
                                <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-slate-400 hover:text-[#1E3A8A]">
                                  <FaEdit className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span className="sr-only">Modifier</span>
                                </Button>
                              </Link>
                              {user.role !== 'super_admin' && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-slate-400 hover:text-red-600"
                                  onClick={() => handleDelete(user.id, user.email)}
                                >
                                  <FaTrash className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span className="sr-only">Supprimer</span>
                                </Button>
                              )}
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

        {/* Résumé des rôles */}
        {users.length > 0 && (
          <div className="mt-4 sm:mt-6">
            <h3 className="text-xs sm:text-sm font-semibold text-slate-600 mb-2">Répartition des rôles</h3>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {Object.entries(roleLabels).map(([role, label]) => {
                const count = users.filter(u => u.role === role).length;
                if (count === 0) return null;
                const color = roleColors[role] || 'bg-gray-100 text-gray-700';
                return (
                  <Badge key={role} className={`${color} text-[10px] sm:text-sm px-2 py-0.5 sm:px-3 sm:py-1`}>
                    {label}: {count}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}