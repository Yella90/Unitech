// app/(dashboard)/admin/dona/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FaRobot, 
  FaEnvelope, 
  FaUsers, 
  FaCheckCircle, 
  FaClock, 
  FaSync,
  FaFilter,
  FaSearch,
  FaEye,
  FaTrash,
  FaChartBar,
  FaDownload,
  FaSpinner
} from 'react-icons/fa';
import { toast, Toaster } from 'sonner';

type Contact = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  category: string;
  assigned_agent: string;
  priority: string;
  created_at: string;
  processed_at: string;
};

type Email = {
  id: string;
  from_email: string;
  to_email: string;
  subject: string;
  body: string;
  category: string;
  assigned_agent: string;
  priority: string;
  status: string;
  created_at: string;
};

const categoryColors: Record<string, string> = {
  support: 'bg-blue-100 text-blue-700 border-blue-200',
  commercial: 'bg-orange-100 text-orange-700 border-orange-200',
  project: 'bg-purple-100 text-purple-700 border-purple-200',
  newsletter: 'bg-green-100 text-green-700 border-green-200',
  information: 'bg-gray-100 text-gray-700 border-gray-200',
  spam: 'bg-red-100 text-red-700 border-red-200',
  other: 'bg-slate-100 text-slate-700 border-slate-200',
};

const priorityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processed: 'bg-green-100 text-green-700',
  analyzed: 'bg-blue-100 text-blue-700',
  assigned: 'bg-purple-100 text-purple-700',
  responded: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-gray-100 text-gray-700',
  read: 'bg-blue-100 text-blue-700',
};

export default function AdminDonaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
        await loadData();

      } catch (error) {
        console.error('Erreur:', error);
        toast.error('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // ✅ Mettre en place l'intervalle de rafraîchissement automatique
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        loadData(true); // Rafraîchir en arrière-plan
      }, 30000); // Toutes les 30 secondes
    }

    // ✅ Nettoyer l'intervalle
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [router, autoRefresh]);

  const loadData = async (silent: boolean = false) => {
    if (!silent) {
      setRefreshing(true);
    }

    try {
      // ✅ Charger les contacts avec écoute en temps réel
      const { data: contactsData, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (contactError) {
        console.error('Erreur contacts:', contactError);
        if (!silent) toast.error('Erreur lors du chargement des contacts');
      } else {
        setContacts(contactsData || []);
      }

      // ✅ Charger les emails traités (si la table existe)
      const { data: emailsData, error: emailError } = await supabase
        .from('incoming_emails')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (emailError) {
        if (emailError.code !== '42P01') {
          console.error('Erreur emails:', emailError);
        }
      } else {
        setEmails(emailsData || []);
      }

      setLastUpdate(new Date());
      if (!silent) {
        toast.success(`✅ Données actualisées (${new Date().toLocaleTimeString()})`);
      }

    } catch (error) {
      console.error('Erreur chargement:', error);
      if (!silent) {
        toast.error('Erreur lors du chargement des données');
      }
    } finally {
      if (!silent) {
        setRefreshing(false);
      }
    }
  };

  // ✅ Écouter les changements en temps réel via Supabase Realtime
  useEffect(() => {
    if (!isAdmin) return;

    // ✅ S'abonner aux changements sur la table contacts
    const contactsChannel = supabase
      .channel('contacts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contacts',
        },
        (payload) => {
          console.log('🔄 Changement contact:', payload);
          // Recharger les données silencieusement
          loadData(true);
        }
      )
      .subscribe();

    // ✅ S'abonner aux changements sur la table incoming_emails (si existe)
    const emailsChannel = supabase
      .channel('emails-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incoming_emails',
        },
        (payload) => {
          console.log('🔄 Changement email:', payload);
          loadData(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(contactsChannel);
      supabase.removeChannel(emailsChannel);
    };
  }, [isAdmin]);

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

  const processedContacts = contacts.filter(c => c.status === 'processed' || c.status === 'read').length;
  const pendingContacts = contacts.filter(c => c.status === 'pending').length;
  const totalContacts = contacts.length;

  const filteredContacts = contacts.filter(c => {
    if (filter === 'all') return true;
    if (filter === 'processed') return c.status === 'processed' || c.status === 'read';
    if (filter === 'pending') return c.status === 'pending';
    return c.category === filter;
  });

  const displayedContacts = searchTerm
    ? filteredContacts.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.subject.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : filteredContacts;

  return (
    <main className="min-h-screen bg-[#F5F7FB] p-6">
      <Toaster position="top-right" richColors />
      
      <div className="mx-auto max-w-7xl">
        {/* En-tête avec statut en temps réel */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#1E3A8A] flex items-center gap-3">
              <FaRobot className="h-8 w-8 text-[#F97316]" />
              DONA - Agent de tri
              <Badge variant="outline" className="ml-2">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                  En direct
                </span>
              </Badge>
            </h1>
            <p className="mt-1 text-slate-500 flex items-center gap-2">
              Visualisez et gérez les données traitées par DONA
              <span className="text-xs text-slate-400">
                · Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={() => loadData(false)}
              disabled={refreshing}
              className="relative"
            >
              {refreshing ? (
                <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FaSync className="mr-2 h-4 w-4" />
              )}
              {refreshing ? 'Chargement...' : 'Rafraîchir'}
            </Button>
            <Button 
              variant={autoRefresh ? 'default' : 'outline'}
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? 'bg-[#1E3A8A]' : ''}
            >
              {autoRefresh ? '🔄 Auto' : '⏸️ Auto'}
            </Button>
          </div>
        </div>

        {/* Statistiques avec animations */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
          <Card className="transition-all hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Total contacts</p>
                  <p className="text-2xl font-bold text-[#1E3A8A] animate-count">{totalContacts}</p>
                </div>
                <FaUsers className="h-8 w-8 text-[#F97316]" />
              </div>
            </CardContent>
          </Card>
          <Card className="transition-all hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Traités</p>
                  <p className="text-2xl font-bold text-green-600">{processedContacts}</p>
                </div>
                <FaCheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="transition-all hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">En attente</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingContacts}</p>
                </div>
                <FaClock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="transition-all hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Taux de traitement</p>
                  <p className="text-2xl font-bold text-[#1E3A8A]">
                    {totalContacts > 0 ? Math.round((processedContacts / totalContacts) * 100) : 0}%
                  </p>
                </div>
                <FaChartBar className="h-8 w-8 text-[#F97316]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et recherche */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={filter === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'bg-[#1E3A8A]' : ''}
            >
              Tous
            </Button>
            <Button 
              variant={filter === 'processed' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('processed')}
              className={filter === 'processed' ? 'bg-green-600' : ''}
            >
              ✅ Traités
            </Button>
            <Button 
              variant={filter === 'pending' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('pending')}
              className={filter === 'pending' ? 'bg-yellow-600' : ''}
            >
              ⏳ En attente
            </Button>
            <Button 
              variant={filter === 'support' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('support')}
              className={filter === 'support' ? 'bg-blue-600' : ''}
            >
              Support
            </Button>
            <Button 
              variant={filter === 'commercial' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('commercial')}
              className={filter === 'commercial' ? 'bg-orange-600' : ''}
            >
              Commercial
            </Button>
            <Button 
              variant={filter === 'project' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('project')}
              className={filter === 'project' ? 'bg-purple-600' : ''}
            >
              Projet
            </Button>
          </div>

          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-sm w-48 sm:w-64"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Liste des contacts avec animation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FaUsers className="h-5 w-5 text-[#F97316]" />
              Contacts traités
              <Badge variant="secondary" className="ml-2">
                {displayedContacts.length}
              </Badge>
              {refreshing && (
                <FaSpinner className="h-4 w-4 animate-spin ml-2 text-slate-400" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {displayedContacts.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p>Aucun contact traité par DONA</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Nom / Email</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600 hidden md:table-cell">Sujet</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Catégorie</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Statut</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600 hidden lg:table-cell">Agent</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedContacts.map((contact) => (
                      <tr key={contact.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-slate-800">{contact.name}</p>
                            <p className="text-xs text-slate-400">{contact.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-slate-600">
                          {contact.subject}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={categoryColors[contact.category] || categoryColors.other}>
                            {contact.category || 'Non classé'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={statusColors[contact.status] || statusColors.pending}>
                            {contact.status || 'pending'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-xs font-medium text-slate-600">
                            {contact.assigned_agent || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {new Date(contact.created_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}