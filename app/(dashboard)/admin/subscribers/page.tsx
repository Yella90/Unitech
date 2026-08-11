// app/(dashboard)/admin/subscribers/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FaEnvelope, 
  FaCheckCircle, 
  FaDownload, 
  FaTrash, 
  FaUsers,
  FaEye,
  FaReply,
  FaArchive,
  FaSync,
  FaSpinner,
  FaFilter,
  FaTimesCircle,
  FaSearch
} from 'react-icons/fa';
import { toast, Toaster } from 'sonner';

type Subscriber = {
  id: string;
  email: string;
  interested_in: string[] | null;
  created_at: string | null;
};

type Contact = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'pending' | 'read' | 'replied' | 'archived';
  created_at: string;
  updated_at: string;
};

const contactStatusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { 
    label: 'En attente', 
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: <FaEnvelope className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
  },
  read: { 
    label: 'Lu', 
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: <FaEye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
  },
  replied: { 
    label: 'Répondu', 
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: <FaReply className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
  },
  archived: { 
    label: 'Archivé', 
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: <FaArchive className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
  },
};

export default function AdminSubscribersPage() {
  const router = useRouter();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('subscribers');
  const [searchTerm, setSearchTerm] = useState('');
  const [contactFilter, setContactFilter] = useState('all');
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
        await loadData();

      } catch (error) {
        console.error('Erreur:', error);
        toast.error('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoad();
  }, [router]);

  const loadData = async (silent: boolean = false) => {
    if (!silent) {
      setRefreshing(true);
    }

    try {
      console.log('📊 Chargement des données...');

      const { data: subscribersData, error: subError } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('created_at', { ascending: false });

      if (subError) {
        console.error('❌ Erreur abonnés:', subError);
        if (!silent) toast.error('Erreur lors du chargement des abonnés');
      } else {
        console.log(`📊 ${subscribersData?.length || 0} abonnés chargés`);
        setSubscribers(subscribersData || []);
      }

      const { data: contactsData, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (contactError) {
        console.error('❌ Erreur contacts:', contactError);
        if (!silent) toast.error(`Erreur lors du chargement des messages: ${contactError.message}`);
      } else {
        console.log(`📊 ${contactsData?.length || 0} contacts chargés`);
        setContacts(contactsData || []);
      }

      if (!silent) {
        toast.success(`✅ Données actualisées (${new Date().toLocaleTimeString()})`);
      }

    } catch (error) {
      console.error('❌ Erreur générale:', error);
      if (!silent) toast.error('Erreur lors du chargement');
    } finally {
      if (!silent) {
        setRefreshing(false);
      }
    }
  };

  const handleDeleteSubscriber = async (id: string, email: string) => {
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

  const handleDeleteContact = async (id: string, name: string) => {
    if (!confirm(`Supprimer le message de "${name}" ?`)) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('✅ Message supprimé avec succès');
      setContacts(contacts.filter(c => c.id !== id));
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const updateContactStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setContacts(contacts.map(c => c.id === id ? { ...c, status: status as any } : c));
      toast.success(`Statut mis à jour : ${contactStatusMap[status]?.label}`);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleExportCSV = () => {
    const dataToExport = activeTab === 'subscribers' ? subscribers : contacts;
    
    if (dataToExport.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    try {
      let headers: string[];
      let rows: string[][];

      if (activeTab === 'subscribers') {
        headers = ['Email', 'Intérêts', "Date d'inscription"];
        rows = subscribers.map(s => [
          s.email,
          s.interested_in?.join('; ') || '',
          new Date(s.created_at || '').toLocaleDateString('fr-FR')
        ]);
      } else {
        headers = ['Nom', 'Email', 'Sujet', 'Message', 'Statut', 'Date'];
        rows = contacts.map(c => [
          c.name,
          c.email,
          c.subject || '',
          c.message,
          contactStatusMap[c.status]?.label || c.status,
          new Date(c.created_at).toLocaleDateString('fr-FR')
        ]);
      }

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
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

  // Filtrage des contacts
  const getFilteredContacts = () => {
    let filtered = contacts;

    if (contactFilter !== 'all') {
      filtered = filtered.filter(c => c.status === contactFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        (c.subject && c.subject.toLowerCase().includes(term)) ||
        c.message.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  // Filtrage des abonnés
  const getFilteredSubscribers = () => {
    if (!searchTerm) return subscribers;
    
    const term = searchTerm.toLowerCase();
    return subscribers.filter(s => 
      s.email.toLowerCase().includes(term) ||
      (s.interested_in && s.interested_in.some(i => i.toLowerCase().includes(term)))
    );
  };

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

  const pendingContacts = contacts.filter(c => c.status === 'pending').length;
  const filteredContacts = getFilteredContacts();
  const filteredSubscribers = getFilteredSubscribers();

  return (
    <main className="min-h-screen bg-[#F5F7FB] p-3 sm:p-4 md:p-6">
      <Toaster position="top-right" richColors />
      
      <div className="mx-auto max-w-7xl">
        {/* En-tête responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1E3A8A] flex flex-wrap items-center gap-2 sm:gap-3">
              <FaEnvelope className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-[#F97316] flex-shrink-0" />
              <span className="truncate">Communications</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
              Gérez les abonnés à la newsletter et les messages de contact.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExportCSV}
              className="border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white text-xs sm:text-sm"
            >
              <FaDownload className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Exporter CSV</span>
              <span className="xs:hidden">📥</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => loadData(false)}
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
          </div>
        </div>

        {/* Statistiques responsive */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Abonnés</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#1E3A8A]">{subscribers.length}</p>
                </div>
                <FaUsers className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-[#F97316]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Messages</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#1E3A8A]">{contacts.length}</p>
                </div>
                <FaEnvelope className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-[#F97316]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">En attente</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-600">{pendingContacts}</p>
                </div>
                <FaEnvelope className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Taux réponse</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">
                    {contacts.length > 0 
                      ? Math.round((contacts.filter(c => c.status === 'replied').length / contacts.length) * 100)
                      : 0}%
                  </p>
                </div>
                <FaReply className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs - responsive */}
        <Tabs defaultValue="subscribers" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-xs sm:max-w-sm grid-cols-2 mb-4 sm:mb-6">
            <TabsTrigger value="subscribers" className="text-xs sm:text-sm">
              <FaUsers className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Abonnés</span>
              <span className="xs:hidden">👥</span>
              ({subscribers.length})
            </TabsTrigger>
            <TabsTrigger value="contacts" className="text-xs sm:text-sm">
              <FaEnvelope className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Messages</span>
              <span className="xs:hidden">📧</span>
              ({contacts.length})
              {pendingContacts > 0 && (
                <Badge className="ml-1 sm:ml-2 bg-[#F97316] text-white text-[10px] sm:text-xs">
                  {pendingContacts}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Barre de recherche et filtres */}
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex flex-col xs:flex-row gap-2">
              <div className="relative flex-1 min-w-0">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3 w-3 sm:h-4 sm:w-4" />
                <input
                  type="text"
                  placeholder={activeTab === 'subscribers' ? "Rechercher un abonné..." : "Rechercher un message..."}
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
              {activeTab === 'contacts' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex-shrink-0 lg:hidden"
                >
                  <FaFilter className="mr-2 h-3 w-3" />
                  Filtres
                </Button>
              )}
            </div>

            {/* Filtres contacts */}
            {activeTab === 'contacts' && (
              <div className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant={contactFilter === 'all' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setContactFilter('all')}
                    className={`text-xs ${contactFilter === 'all' ? 'bg-[#1E3A8A]' : ''}`}
                  >
                    Tous ({contacts.length})
                  </Button>
                  {Object.entries(contactStatusMap).map(([status, config]) => {
                    const count = contacts.filter(c => c.status === status).length;
                    return (
                      <Button 
                        key={status}
                        variant={contactFilter === status ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setContactFilter(status)}
                        className={`text-xs ${contactFilter === status ? 'bg-[#1E3A8A]' : ''}`}
                      >
                        {config.icon}
                        <span className="ml-1">{config.label} ({count})</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Onglet Abonnés - responsive */}
          <TabsContent value="subscribers">
            <div className="rounded-xl sm:rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {filteredSubscribers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
                  <div className="rounded-full bg-slate-100 p-3 sm:p-4">
                    <FaUsers className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
                  </div>
                  <h3 className="mt-4 text-base sm:text-lg font-semibold text-slate-700">
                    {searchTerm ? 'Aucun abonné trouvé' : 'Aucun abonné'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    {searchTerm ? 'Essayez une autre recherche.' : 'La newsletter n\'a pas encore d\'abonnés.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-2 sm:mx-0">
                  <div className="min-w-[640px] sm:min-w-full">
                    <table className="w-full text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600">Email</th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600 hidden sm:table-cell">Intérêts</th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600 hidden xs:table-cell">Date</th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600">Statut</th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-slate-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSubscribers.map((subscriber) => (
                          <tr key={subscriber.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                            <td className="px-2 sm:px-4 py-2 sm:py-3">
                              <p className="text-slate-800 font-medium text-xs sm:text-sm truncate max-w-[120px] xs:max-w-[200px]">
                                {subscriber.email}
                              </p>
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell">
                              <p className="text-slate-600 text-xs truncate max-w-[150px]">
                                {subscriber.interested_in && subscriber.interested_in.length > 0 
                                  ? subscriber.interested_in.join(', ') 
                                  : '—'}
                              </p>
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 hidden xs:table-cell text-slate-600 text-xs whitespace-nowrap">
                              {subscriber.created_at 
                                ? new Date(subscriber.created_at).toLocaleDateString('fr-FR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  })
                                : '—'}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3">
                              <Badge variant="default" className="inline-flex items-center gap-1 bg-green-100 text-green-700 hover:bg-green-100 text-[8px] sm:text-[10px]">
                                <FaCheckCircle className="h-2 w-2 sm:h-3 sm:w-3" /> 
                                <span className="hidden xs:inline">Actif</span>
                              </Badge>
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-slate-400 hover:text-red-600"
                                onClick={() => handleDeleteSubscriber(subscriber.id, subscriber.email)}
                                title="Supprimer"
                              >
                                <FaTrash className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Onglet Messages - responsive */}
          <TabsContent value="contacts">
            <div className="rounded-xl sm:rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {filteredContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
                  <div className="rounded-full bg-slate-100 p-3 sm:p-4">
                    <FaEnvelope className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
                  </div>
                  <h3 className="mt-4 text-base sm:text-lg font-semibold text-slate-700">
                    {searchTerm ? 'Aucun message trouvé' : 'Aucun message'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    {searchTerm ? 'Essayez une autre recherche.' : 'Aucun message de contact pour le moment.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredContacts.map((contact) => {
                    const status = contactStatusMap[contact.status] || contactStatusMap.pending;
                    return (
                      <div key={contact.id} className="p-3 sm:p-4 hover:bg-slate-50 transition">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                              <p className="font-semibold text-slate-800 text-sm sm:text-base truncate max-w-[100px] xs:max-w-[200px]">
                                {contact.name}
                              </p>
                              <p className="text-xs sm:text-sm text-slate-500 truncate max-w-[120px] xs:max-w-[200px]">
                                {contact.email}
                              </p>
                              <Badge className={`${status.color} text-[8px] sm:text-[10px] flex-shrink-0`}>
                                <span className="flex items-center gap-1">
                                  {status.icon}
                                  <span className="hidden xs:inline">{status.label}</span>
                                </span>
                              </Badge>
                            </div>
                            {contact.subject && (
                              <p className="mt-1 text-xs sm:text-sm font-medium text-slate-700 truncate">
                                📌 {contact.subject}
                              </p>
                            )}
                            <p className="mt-1 text-xs sm:text-sm text-slate-600 line-clamp-2 sm:line-clamp-3">
                              {contact.message}
                            </p>
                            <p className="mt-1 text-[10px] sm:text-xs text-slate-400">
                              {new Date(contact.created_at).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1 flex-shrink-0">
                            {contact.status !== 'read' && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => updateContactStatus(contact.id, 'read')}
                                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                title="Marquer comme lu"
                              >
                                <FaEye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              </Button>
                            )}
                            {contact.status !== 'replied' && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => updateContactStatus(contact.id, 'replied')}
                                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                title="Marquer comme répondu"
                              >
                                <FaReply className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              </Button>
                            )}
                            {contact.status !== 'archived' && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => updateContactStatus(contact.id, 'archived')}
                                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                title="Archiver"
                              >
                                <FaArchive className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteContact(contact.id, contact.name)}
                              title="Supprimer"
                            >
                              <FaTrash className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Résumé des intérêts - responsive */}
        {subscribers.length > 0 && (
          <div className="mt-4 sm:mt-6">
            <h2 className="text-xs sm:text-sm font-semibold text-slate-600 mb-2">Centres d'intérêt des abonnés</h2>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {(() => {
                const interests = subscribers
                  .flatMap(s => s.interested_in || [])
                  .reduce((acc, i) => {
                    acc[i] = (acc[i] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);

                const sortedInterests = Object.entries(interests)
                  .sort((a, b) => b[1] - a[1]);

                return sortedInterests.map(([interest, count]) => (
                  <Badge key={interest} variant="secondary" className="text-[10px] sm:text-sm px-2 py-0.5 sm:px-3 sm:py-1">
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