'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FaUsers, FaEdit, FaPlus, FaTrash } from 'react-icons/fa';
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
  admin: 'bg-purple-100 text-purple-700',
  super_admin: 'bg-red-100 text-red-700',
  project_manager: 'bg-blue-100 text-blue-700',
  team_lead: 'bg-cyan-100 text-cyan-700',
  developer: 'bg-green-100 text-green-700',
  designer: 'bg-pink-100 text-pink-700',
  client: 'bg-slate-100 text-slate-700',
  viewer: 'bg-gray-100 text-gray-700',
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // ✅ Vérifier l'authentification et charger les données
  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        // 1. Vérifier la session via l'API
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();

        if (!sessionData.user || !['admin', 'super_admin'].includes(sessionData.user.role)) {
          router.push('/login?error=unauthorized&message=Accès réservé aux administrateurs');
          return;
        }

        setIsAdmin(true);

        // 2. Charger les utilisateurs
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erreur:', error);
          toast.error('Erreur lors du chargement des utilisateurs');
          return;
        }

        setUsers(data || []);
      } catch (error) {
        console.error('Erreur:', error);
        toast.error('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoad();
  }, [router]);

  // ✅ Supprimer un utilisateur
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

  // Statistiques
  const activeUsers = users.filter((user) => user.is_active).length;
  const totalUsers = users.length;
  const uniqueRoles = new Set(users.map((user) => user.role)).size;

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
              <FaUsers className="h-8 w-8 text-[#F97316]" />
              Gestion des utilisateurs
            </h1>
            <p className="mt-1 text-slate-500">Liste des comptes, rôles et accès administrateurs.</p>
          </div>
          <Link href="/admin/users/new">
            <Button className="bg-[#F97316] hover:bg-[#ea580c] text-white">
              <FaPlus className="mr-2 h-4 w-4" /> Nouvel utilisateur
            </Button>
          </Link>
        </div>

        {/* Statistiques */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Total</p>
              <p className="text-2xl font-bold text-[#1E3A8A]">{totalUsers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Actifs</p>
              <p className="text-2xl font-bold text-green-600">{activeUsers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Rôles</p>
              <p className="text-2xl font-bold text-[#1E3A8A]">{uniqueRoles}</p>
            </CardContent>
          </Card>
        </div>

        {/* Liste des utilisateurs */}
        <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-slate-100 p-4">
                <FaUsers className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-700">Aucun utilisateur</h3>
              <p className="text-sm text-slate-500">Commencez par ajouter votre premier utilisateur.</p>
              <Link href="/admin/users/new">
                <Button className="mt-4 bg-[#F97316] hover:bg-[#ea580c] text-white">
                  <FaPlus className="mr-2 h-4 w-4" />
                  Ajouter un utilisateur
                </Button>
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-4 py-3 font-semibold text-slate-600">Utilisateur</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Email</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Rôle</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Statut</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const roleLabel = roleLabels[user.role] || user.role;
                  const roleColor = roleColors[user.role] || 'bg-gray-100 text-gray-700';
                  
                  return (
                    <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <p className="font-medium text-slate-800">
                            {user.first_name || user.last_name 
                              ? `${user.first_name || ''} ${user.last_name || ''}`.trim() 
                              : 'Utilisateur'}
                          </p>
                          <p className="text-xs text-slate-400">{user.department || 'Aucun département'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-slate-600">{user.email}</td>
                      <td className="px-4 py-3">
                        <Badge className={roleColor}>{roleLabel}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={user.is_active ? 'default' : 'destructive'}>
                          {user.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/users/${user.id}/edit`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-[#1E3A8A]">
                              <FaEdit className="h-4 w-4" />
                            </Button>
                          </Link>
                          {user.role !== 'super_admin' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                              onClick={() => handleDelete(user.id, user.email)}
                            >
                              <FaTrash className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}