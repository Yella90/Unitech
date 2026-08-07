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
  FaGraduationCap, 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaChartBar 
} from 'react-icons/fa';
import { toast, Toaster } from 'sonner';

type Training = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  icon: string | null;
  duration: string | null;
  level: string | null;
  price: string | null;
  modules: string[] | null;
  color: string | null;
  created_at: string | null;
};

const levelMap: Record<string, { label: string; color: string }> = {
  'Débutant': { label: 'Débutant', color: 'bg-green-100 text-green-700' },
  'Intermédiaire': { label: 'Intermédiaire', color: 'bg-blue-100 text-blue-700' },
  'Intermédiaire à Avancé': { label: 'Intermédiaire à Avancé', color: 'bg-purple-100 text-purple-700' },
  'Avancé': { label: 'Avancé', color: 'bg-red-100 text-red-700' },
};

export default function AdminTrainingsPage() {
  const router = useRouter();
  const [trainings, setTrainings] = useState<Training[]>([]);
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

        // 2. Charger les formations
        const { data, error } = await supabase
          .from('trainings')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erreur:', error);
          toast.error('Erreur lors du chargement des formations');
          return;
        }

        setTrainings(data || []);
      } catch (error) {
        console.error('Erreur:', error);
        toast.error('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoad();
  }, [router]);

  // ✅ Supprimer une formation
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Supprimer la formation "${title}" ?`)) return;

    try {
      const { error } = await supabase
        .from('trainings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('✅ Formation supprimée avec succès');
      setTrainings(trainings.filter(t => t.id !== id));
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  // Statistiques
  const totalModules = trainings.reduce(
    (acc, training) => acc + (Array.isArray(training.modules) ? training.modules.length : 0),
    0
  );

  const levelStats = trainings.reduce((acc, training) => {
    const level = training.level || 'Non défini';
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
              <FaGraduationCap className="h-8 w-8 text-[#F97316]" />
              Gestion des Formations
            </h1>
            <p className="mt-1 text-slate-500">Liste des formations, création, édition et suppression.</p>
          </div>
          <Link href="/admin/trainings/new">
            <Button className="bg-[#F97316] hover:bg-[#ea580c] text-white">
              <FaPlus className="mr-2 h-4 w-4" /> Nouvelle formation
            </Button>
          </Link>
        </div>

        {/* Statistiques */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Total</p>
              <p className="text-2xl font-bold text-[#1E3A8A]">{trainings.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Modules</p>
              <p className="text-2xl font-bold text-[#1E3A8A]">{totalModules}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Niveaux</p>
              <p className="text-2xl font-bold text-[#1E3A8A]">{Object.keys(levelStats).length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Liste des formations */}
        <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
          {trainings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-slate-100 p-4">
                <FaGraduationCap className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-700">Aucune formation</h3>
              <p className="text-sm text-slate-500">Commencez par créer votre première formation.</p>
              <Link href="/admin/trainings/new">
                <Button className="mt-4 bg-[#F97316] hover:bg-[#ea580c] text-white">
                  <FaPlus className="mr-2 h-4 w-4" />
                  Créer une formation
                </Button>
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-4 py-3 font-semibold text-slate-600">Formation</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Description</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Niveau</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Durée</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trainings.map((training) => {
                  const level = levelMap[training.level || ''] || { 
                    label: training.level || 'Non défini', 
                    color: 'bg-gray-100 text-gray-700' 
                  };
                  
                  return (
                    <tr key={training.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{training.icon || '📚'}</span>
                          <div>
                            <p className="font-medium text-slate-800">{training.title}</p>
                            <p className="text-xs text-slate-400">{training.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="line-clamp-2 max-w-xl text-slate-600">
                          {training.description || 'Aucune description'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={level.color}>
                          {level.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{training.duration || 'N/A'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/training#${training.slug}`} target="_blank">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-[#1E3A8A]">
                              <FaEye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/admin/trainings/${training.id}/edit`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-[#F97316]">
                              <FaEdit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                            onClick={() => handleDelete(training.id, training.title)}
                          >
                            <FaTrash className="h-4 w-4" />
                          </Button>
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