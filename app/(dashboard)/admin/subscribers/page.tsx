'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FaEnvelope, FaCheckCircle, FaTimesCircle, FaDownload, FaTrash } from 'react-icons/fa';
import { toast, Toaster } from 'sonner';

type Subscriber = {
  id: string;
  email: string;
  interested_in: string[] | null;
  created_at: string | null;
};

export default function AdminSubscribersPage() {
  const router = useRouter();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
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

        // 2. Charger les abonnés
        const { data, error } = await supabase
          .from('newsletter_subscribers')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erreur:', error);
          toast.error('Erreur lors du chargement des abonnés');
          return;
        }

        setSubscribers(data || []);
      } catch (error) {
        console.error('Erreur:', error);
        toast.error('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoad();
  }, [router]);

  // ✅ Supprimer un abonné
  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Supprimer l'abonné "${email}" ?`)) return;

    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('✅ Abonné supprimé avec succès');
      setSubscribers(subscribers.filter(s => s.id !== id));
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  // ✅ Exporter les emails en CSV
  const handleExportCSV = () => {
    if (subscribers.length === 0) {
      toast.error('Aucun abonné à exporter');
      return;
    }

    try {
      // Créer le contenu CSV
      const headers = ['Email', 'Intérêts', 'Date d\'inscription'];
      const rows = subscribers.map(s => [
        s.email,
        s.interested_in?.join('; ') || '',
        new Date(s.created_at || '').toLocaleDateString('fr-FR')
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      // Télécharger le fichier
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `abonnes_newsletter_${new Date().toISOString().split('T')[0]}.csv`;
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
        <div className="mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#1E3A8A] flex items-center gap-3">
                <FaEnvelope className="h-8 w-8 text-[#F97316]" />
                Abonnés Newsletter
              </h1>
              <p className="mt-1 text-slate-500">Liste des abonnements recueillis via la vitrine publique.</p>
            </div>
            <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
              <Button 
                variant="outline" 
                onClick={handleExportCSV}
                className="border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white"
              >
                <FaDownload className="mr-2 h-4 w-4" />
                Exporter CSV
              </Button>
              <div className="rounded-3xl bg-white border border-slate-200 p-4 shadow-sm">
                <p className="text-sm text-slate-500">Total abonnés</p>
                <p className="text-3xl font-bold text-[#1E3A8A]">{subscribers.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des abonnés */}
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
          {subscribers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-slate-100 p-4">
                <FaEnvelope className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-700">Aucun abonné</h3>
              <p className="text-sm text-slate-500">La newsletter n'a pas encore d'abonnés.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-4 py-3 font-semibold text-slate-600">Email</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Intérêts</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Date</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Statut</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="px-4 py-3 text-slate-800 font-medium">{subscriber.email}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-slate-600">
                      {subscriber.interested_in && subscriber.interested_in.length > 0 
                        ? subscriber.interested_in.join(', ') 
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {subscriber.created_at 
                        ? new Date(subscriber.created_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="default" className="inline-flex items-center gap-2 bg-green-100 text-green-700 hover:bg-green-100">
                        <FaCheckCircle className="h-3.5 w-3.5" /> 
                        Actif
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                        onClick={() => handleDelete(subscriber.id, subscriber.email)}
                        title="Supprimer"
                      >
                        <FaTrash className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Résumé des intérêts */}
        {subscribers.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-slate-600 mb-2">Centres d'intérêt</h2>
            <div className="flex flex-wrap gap-2">
              {(() => {
                const interests = subscribers
                  .flatMap(s => s.interested_in || [])
                  .reduce((acc, i) => {
                    acc[i] = (acc[i] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);

                return Object.entries(interests).map(([interest, count]) => (
                  <Badge key={interest} variant="secondary" className="text-sm px-3 py-1">
                    {interest}: {count}
                  </Badge>
                ));
              })()}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}