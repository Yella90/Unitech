// app/(dashboard)/admin/dona/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/agents/supabase/client';
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
  FaSearch,
  FaSpinner,
  FaUserFriends,
  FaInbox,
  FaChartBar,
  FaEye,
  FaTrash,
  FaReply,
  FaPlay
} from 'react-icons/fa';
import { toast, Toaster } from 'sonner';

// ============================================================
// TYPES
// ============================================================
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
  received_at: string;
  processed_at: string;
  ai_analysis: any;
};

type Conversation = {
  id: string;
  from_email: string;
  subject: string;
  agent_response: string;
  status: string;
  confidence: number;
  created_at: string;
};

type DonaStats = {
  contacts: {
    total: number;
    processed: number;
    pending: number;
    analyzed: number;
    rate: number;
  };
  emails: {
    total: number;
    processed: number;
    pending: number;
    analyzed: number;
    ignored: number;
    rate: number;
  };
  conversations: {
    total: number;
    pending: number;
    review: number;
    sent: number;
  };
};

// ============================================================
// CONFIGURATION DES COULEURS
// ============================================================
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
  ignored: 'bg-gray-100 text-gray-500',
  error: 'bg-red-100 text-red-700',
  answered: 'bg-green-100 text-green-700',
  review: 'bg-orange-100 text-orange-700',
  sent: 'bg-emerald-100 text-emerald-700',
};

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function AdminDonaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filter, setFilter] = useState('all');
  const [emailFilter, setEmailFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [emailSearchTerm, setEmailSearchTerm] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState('contacts');
  const [stats, setStats] = useState<DonaStats>({
    contacts: { total: 0, processed: 0, pending: 0, analyzed: 0, rate: 0 },
    emails: { total: 0, processed: 0, pending: 0, analyzed: 0, ignored: 0, rate: 0 },
    conversations: { total: 0, pending: 0, review: 0, sent: 0 }
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================
  // INITIALISATION
  // ============================================================
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

    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        loadData(true);
      }, 30000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [router, autoRefresh]);

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================
  const loadData = async (silent: boolean = false) => {
    if (!silent) {
      setRefreshing(true);
    }

    try {
      // Charger les contacts
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

      // Charger les emails
      const { data: emailsData, error: emailError } = await supabase
        .from('incoming_emails')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (emailError) {
        if (emailError.code !== '42P01') {
          console.error('Erreur emails:', emailError);
          if (!silent) toast.error('Erreur lors du chargement des emails');
        }
      } else {
        setEmails(emailsData || []);
      }

      // Charger les conversations (réponses)
      const { data: conversationsData, error: convError } = await supabase
        .from('email_conversations')
        .select('id, from_email, subject, agent_response, status, confidence, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (convError) {
        console.error('Erreur conversations:', convError);
      } else {
        setConversations(conversationsData || []);
      }

      updateStats(contactsData || [], emailsData || [], conversationsData || []);

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

  // ============================================================
  // STATISTIQUES (CORRIGÉ)
  // ============================================================
  const updateStats = (contactsData: Contact[], emailsData: Email[], conversationsData: Conversation[]) => {
    // ✅ Contacts traités = processed + read + analyzed + answered + review + sent
    const processedContacts = contactsData.filter(c => 
      c.status === 'processed' || 
      c.status === 'read' || 
      c.status === 'analyzed' ||
      c.status === 'answered' ||
      c.status === 'review' ||
      c.status === 'sent'
    ).length;
    
    const pendingContacts = contactsData.filter(c => c.status === 'pending').length;
    const analyzedContacts = contactsData.filter(c => c.status === 'analyzed').length;
    
    // ✅ Emails traités = processed + analyzed + answered + review + sent
    const processedEmails = emailsData.filter(e => 
      e.status === 'processed' || 
      e.status === 'analyzed' ||
      e.status === 'answered' ||
      e.status === 'review' ||
      e.status === 'sent'
    ).length;
    
    const pendingEmails = emailsData.filter(e => e.status === 'pending').length;
    const analyzedEmails = emailsData.filter(e => e.status === 'analyzed').length;
    const ignoredEmails = emailsData.filter(e => e.status === 'ignored' || e.status === 'spam').length;

    const totalConv = conversationsData.length;
    const pendingConv = conversationsData.filter(c => c.status === 'pending').length;
    const reviewConv = conversationsData.filter(c => c.status === 'review').length;
    const sentConv = conversationsData.filter(c => c.status === 'sent').length;

    setStats({
      contacts: {
        total: contactsData.length,
        processed: processedContacts,
        pending: pendingContacts,
        analyzed: analyzedContacts,
        rate: contactsData.length > 0 ? Math.round((processedContacts / contactsData.length) * 100) : 0
      },
      emails: {
        total: emailsData.length,
        processed: processedEmails,
        pending: pendingEmails,
        analyzed: analyzedEmails,
        ignored: ignoredEmails,
        rate: emailsData.length > 0 ? Math.round((processedEmails / emailsData.length) * 100) : 0
      },
      conversations: {
        total: totalConv,
        pending: pendingConv,
        review: reviewConv,
        sent: sentConv
      }
    });
  };

  // ============================================================
  // TEMPS RÉEL (REALTIME)
  // ============================================================
  useEffect(() => {
    if (!isAdmin) return;

    const contactsChannel = supabase
      .channel('contacts-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, () => {
        loadData(true);
      })
      .subscribe();

    const emailsChannel = supabase
      .channel('emails-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incoming_emails' }, () => {
        loadData(true);
      })
      .subscribe();

    const convChannel = supabase
      .channel('conversations-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'email_conversations' }, () => {
        loadData(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(contactsChannel);
      supabase.removeChannel(emailsChannel);
      supabase.removeChannel(convChannel);
    };
  }, [isAdmin]);

  // ============================================================
  // FILTRES (CORRIGÉS)
  // ============================================================
  const getFilteredContacts = () => {
    let filtered = contacts;
    
    if (filter === 'processed') {
      // ✅ Traités = processed + read + analyzed + answered + review + sent
      filtered = filtered.filter(c => 
        c.status === 'processed' || 
        c.status === 'read' || 
        c.status === 'analyzed' ||
        c.status === 'answered' ||
        c.status === 'review' ||
        c.status === 'sent'
      );
    } else if (filter === 'pending') {
      filtered = filtered.filter(c => c.status === 'pending');
    } else if (filter === 'analyzed') {
      filtered = filtered.filter(c => c.status === 'analyzed');
    } else if (filter !== 'all') {
      filtered = filtered.filter(c => c.category === filter);
    }

    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const getFilteredEmails = () => {
    let filtered = emails;
    
    if (emailFilter === 'processed') {
      // ✅ Traités = processed + analyzed + answered + review + sent
      filtered = filtered.filter(e => 
        e.status === 'processed' || 
        e.status === 'analyzed' ||
        e.status === 'answered' ||
        e.status === 'review' ||
        e.status === 'sent'
      );
    } else if (emailFilter === 'pending') {
      filtered = filtered.filter(e => e.status === 'pending');
    } else if (emailFilter === 'analyzed') {
      filtered = filtered.filter(e => e.status === 'analyzed');
    } else if (emailFilter === 'ignored') {
      filtered = filtered.filter(e => e.status === 'ignored' || e.status === 'spam');
    } else if (emailFilter !== 'all') {
      filtered = filtered.filter(e => e.category === emailFilter);
    }

    if (emailSearchTerm) {
      filtered = filtered.filter(e => 
        e.from_email.toLowerCase().includes(emailSearchTerm.toLowerCase()) ||
        e.subject.toLowerCase().includes(emailSearchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  // ============================================================
  // DÉCLENCHER DONA
  // ============================================================
  const triggerDona = async () => {
    try {
      toast.info('🔄 Déclenchement du traitement DONA...');
      
      const response = await fetch('/api/dona/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 20 })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`✅ ${data.result?.processed || 0} éléments traités`);
        loadData(true);
      } else {
        toast.error(`❌ Erreur: ${data.error}`);
      }
    } catch (error: any) {
      toast.error(`❌ Erreur: ${error.message}`);
    }
  };

  // ============================================================
  // RENDU
  // ============================================================
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

  const displayedContacts = getFilteredContacts();
  const displayedEmails = getFilteredEmails();

  return (
    <main className="min-h-screen bg-[#F5F7FB] p-6">
      <Toaster position="top-right" richColors />
      
      <div className="mx-auto max-w-7xl">
        {/* ============================================================
        EN-TÊTE
        ============================================================ */}
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
            <Button
              variant="default"
              className="bg-[#F97316] hover:bg-[#E86A0A]"
              onClick={triggerDona}
            >
              <FaPlay className="mr-2 h-4 w-4" />
              Traiter maintenant
            </Button>
          </div>
        </div>

        {/* ============================================================
        STATISTIQUES GLOBALES
        ============================================================ */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
          <Card className="transition-all hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Total contacts</p>
                  <p className="text-2xl font-bold text-[#1E3A8A]">{stats.contacts.total}</p>
                </div>
                <FaUserFriends className="h-8 w-8 text-[#F97316]" />
              </div>
            </CardContent>
          </Card>
          <Card className="transition-all hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Contacts traités</p>
                  <p className="text-2xl font-bold text-green-600">{stats.contacts.processed}</p>
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
                  <p className="text-2xl font-bold text-yellow-600">{stats.contacts.pending}</p>
                </div>
                <FaClock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="transition-all hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Analysés</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.contacts.analyzed}</p>
                </div>
                <FaEye className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ============================================================
        TABS - CONTACTS / EMAILS
        ============================================================ */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <FaUserFriends className="h-4 w-4" />
              Contacts
              <Badge variant="secondary" className="ml-1">
                {stats.contacts.pending}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="emails" className="flex items-center gap-2">
              <FaEnvelope className="h-4 w-4" />
              Emails
              <Badge variant="secondary" className="ml-1">
                {stats.emails.pending}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* ============================================================
          TAB CONTACTS
          ============================================================ */}
          <TabsContent value="contacts">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FaUserFriends className="h-5 w-5 text-[#F97316]" />
                  Contacts
                  <Badge variant="secondary" className="ml-2">
                    {displayedContacts.length}
                  </Badge>
                  {refreshing && (
                    <FaSpinner className="h-4 w-4 animate-spin ml-2 text-slate-400" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filtres contacts */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant={filter === 'all' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setFilter('all')}
                      className={filter === 'all' ? 'bg-[#1E3A8A]' : ''}
                    >
                      Tous ({contacts.length})
                    </Button>
                    <Button 
                      variant={filter === 'processed' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setFilter('processed')}
                      className={filter === 'processed' ? 'bg-green-600' : ''}
                    >
                      ✅ Traités ({stats.contacts.processed})
                    </Button>
                    <Button 
                      variant={filter === 'pending' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setFilter('pending')}
                      className={filter === 'pending' ? 'bg-yellow-600' : ''}
                    >
                      ⏳ En attente ({stats.contacts.pending})
                    </Button>
                    <Button 
                      variant={filter === 'analyzed' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setFilter('analyzed')}
                      className={filter === 'analyzed' ? 'bg-blue-600' : ''}
                    >
                      🔍 Analysés ({stats.contacts.analyzed})
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

                {/* Tableau contacts */}
                {displayedContacts.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p>Aucun contact trouvé</p>
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
                            <td className="px-4 py-3 hidden md:table-cell text-slate-600 max-w-xs truncate">
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
          </TabsContent>

          {/* ============================================================
          TAB EMAILS
          ============================================================ */}
          <TabsContent value="emails">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FaEnvelope className="h-5 w-5 text-[#F97316]" />
                  Emails
                  <Badge variant="secondary" className="ml-2">
                    {displayedEmails.length}
                  </Badge>
                  {refreshing && (
                    <FaSpinner className="h-4 w-4 animate-spin ml-2 text-slate-400" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filtres emails */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant={emailFilter === 'all' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setEmailFilter('all')}
                      className={emailFilter === 'all' ? 'bg-[#1E3A8A]' : ''}
                    >
                      Tous ({emails.length})
                    </Button>
                    <Button 
                      variant={emailFilter === 'processed' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setEmailFilter('processed')}
                      className={emailFilter === 'processed' ? 'bg-green-600' : ''}
                    >
                      ✅ Traités ({stats.emails.processed})
                    </Button>
                    <Button 
                      variant={emailFilter === 'pending' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setEmailFilter('pending')}
                      className={emailFilter === 'pending' ? 'bg-yellow-600' : ''}
                    >
                      ⏳ En attente ({stats.emails.pending})
                    </Button>
                    <Button 
                      variant={emailFilter === 'analyzed' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setEmailFilter('analyzed')}
                      className={emailFilter === 'analyzed' ? 'bg-blue-600' : ''}
                    >
                      🔍 Analysés ({stats.emails.analyzed})
                    </Button>
                    <Button 
                      variant={emailFilter === 'ignored' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setEmailFilter('ignored')}
                      className={emailFilter === 'ignored' ? 'bg-gray-600' : ''}
                    >
                      🚫 Ignorés ({stats.emails.ignored})
                    </Button>
                    <Button 
                      variant={emailFilter === 'support' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setEmailFilter('support')}
                      className={emailFilter === 'support' ? 'bg-blue-600' : ''}
                    >
                      Support
                    </Button>
                    <Button 
                      variant={emailFilter === 'commercial' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setEmailFilter('commercial')}
                      className={emailFilter === 'commercial' ? 'bg-orange-600' : ''}
                    >
                      Commercial
                    </Button>
                    <Button 
                      variant={emailFilter === 'project' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setEmailFilter('project')}
                      className={emailFilter === 'project' ? 'bg-purple-600' : ''}
                    >
                      Projet
                    </Button>
                  </div>

                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={emailSearchTerm}
                      onChange={(e) => setEmailSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-sm w-48 sm:w-64"
                    />
                    {emailSearchTerm && (
                      <button
                        onClick={() => setEmailSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Tableau emails */}
                {displayedEmails.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p>Aucun email trouvé</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/50">
                          <th className="px-4 py-3 text-left font-semibold text-slate-600">Expéditeur</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-600 hidden md:table-cell">Sujet</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-600">Catégorie</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-600">Statut</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-600 hidden lg:table-cell">Agent</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-600">Reçu le</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedEmails.map((email) => (
                          <tr key={email.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-slate-800 text-xs truncate max-w-[150px]">
                                  {email.from_email}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell text-slate-600 max-w-xs truncate">
                              {email.subject}
                            </td>
                            <td className="px-4 py-3">
                              {email.category ? (
                                <Badge className={categoryColors[email.category] || categoryColors.other}>
                                  {email.category}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-slate-400">
                                  Non classé
                                </Badge>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={statusColors[email.status] || statusColors.pending}>
                                {email.status || 'pending'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 hidden lg:table-cell">
                              <span className="text-xs font-medium text-slate-600">
                                {email.assigned_agent || '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-500 text-xs">
                              {new Date(email.received_at || email.created_at).toLocaleDateString('fr-FR', {
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
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}