// app/(dashboard)/admin/dona/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
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
  FaSearch,
  FaSpinner,
  FaUserFriends,
  FaInbox,
  FaChartBar,
  FaEye,
  FaTrash,
  FaReply,
  FaPlay,
  FaFilter,
  FaChevronDown,
  FaChevronUp,
  FaTimesCircle
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
  received_at: string;
  processed_at: string;
  ai_analysis: any;
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
};

export default function AdminDonaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filter, setFilter] = useState('all');
  const [emailFilter, setEmailFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [emailSearchTerm, setEmailSearchTerm] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState('contacts');
  const [showContactFilters, setShowContactFilters] = useState(false);
  const [showEmailFilters, setShowEmailFilters] = useState(false);
  const [stats, setStats] = useState<DonaStats>({
    contacts: { total: 0, processed: 0, pending: 0, analyzed: 0, rate: 0 },
    emails: { total: 0, processed: 0, pending: 0, analyzed: 0, ignored: 0, rate: 0 }
  });

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

  const loadData = async (silent: boolean = false) => {
    if (!silent) {
      setRefreshing(true);
    }

    try {
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

      updateStats(contactsData || [], emailsData || []);

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

  const updateStats = (contactsData: Contact[], emailsData: Email[]) => {
    const processedContacts = contactsData.filter(c => 
      c.status === 'processed' || c.status === 'read' || c.status === 'analyzed'
    ).length;
    const pendingContacts = contactsData.filter(c => c.status === 'pending').length;
    const analyzedContacts = contactsData.filter(c => c.status === 'analyzed').length;
    
    const processedEmails = emailsData.filter(e => 
      e.status === 'processed' || e.status === 'analyzed'
    ).length;
    const pendingEmails = emailsData.filter(e => e.status === 'pending').length;
    const analyzedEmails = emailsData.filter(e => e.status === 'analyzed').length;
    const ignoredEmails = emailsData.filter(e => e.status === 'ignored' || e.status === 'spam').length;

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
      }
    });
  };

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

    return () => {
      supabase.removeChannel(contactsChannel);
      supabase.removeChannel(emailsChannel);
    };
  }, [isAdmin]);

  const getFilteredContacts = () => {
    let filtered = contacts;
    
    if (filter === 'processed') {
      filtered = filtered.filter(c => 
        c.status === 'processed' || c.status === 'read' || c.status === 'analyzed'
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
      filtered = filtered.filter(e => e.status === 'processed' || e.status === 'analyzed');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
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
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <Toaster position="top-right" richColors />
      
      {/* En-tête responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1E3A8A] flex flex-wrap items-center gap-2">
            <FaRobot className="h-5 w-5 sm:h-6 sm:w-6 text-[#F97316] flex-shrink-0" />
            <span>DONA - Agent de tri</span>
            <Badge variant="outline" className="flex-shrink-0">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="hidden xs:inline">En direct</span>
              </span>
            </Badge>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 flex flex-wrap items-center gap-1 mt-0.5">
            Visualisez et gérez les données traitées par DONA
            <span className="text-xs text-slate-400 hidden sm:inline">·</span>
            <span className="text-xs text-slate-400">
              Dernière MAJ: {lastUpdate.toLocaleTimeString()}
            </span>
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex flex-wrap gap-2 flex-shrink-0">
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
          <Button 
            variant={autoRefresh ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`text-xs sm:text-sm ${autoRefresh ? 'bg-[#1E3A8A]' : ''}`}
          >
            {autoRefresh ? '🔄' : '⏸️'}
            <span className="hidden xs:inline ml-1">Auto</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            className="bg-[#F97316] hover:bg-[#E86A0A] text-xs sm:text-sm"
            onClick={triggerDona}
          >
            <FaPlay className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Traiter</span>
            <span className="xs:hidden">⚡</span>
          </Button>
        </div>
      </div>

      {/* Statistiques responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-slate-500">Total contacts</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#1E3A8A]">{stats.contacts.total}</p>
              </div>
              <FaUserFriends className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-[#F97316]" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-slate-500">Contacts traités</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{stats.contacts.processed}</p>
              </div>
              <FaCheckCircle className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-slate-500">Total emails</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#1E3A8A]">{stats.emails.total}</p>
              </div>
              <FaEnvelope className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-[#F97316]" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-slate-500">Emails traités</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{stats.emails.processed}</p>
              </div>
              <FaCheckCircle className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-xs sm:max-w-md grid-cols-2">
          <TabsTrigger value="contacts" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <FaUserFriends className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Contacts</span>
            <span className="xs:hidden">👥</span>
            <Badge variant="secondary" className="ml-0 sm:ml-1 text-[10px] sm:text-xs">
              {stats.contacts.pending}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="emails" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <FaEnvelope className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Emails</span>
            <span className="xs:hidden">📧</span>
            <Badge variant="secondary" className="ml-0 sm:ml-1 text-[10px] sm:text-xs">
              {stats.emails.pending}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Contacts */}
        <TabsContent value="contacts">
          <Card>
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <FaUserFriends className="h-4 w-4 sm:h-5 sm:w-5 text-[#F97316]" />
                <span>Contacts</span>
                <Badge variant="secondary" className="text-[10px] sm:text-xs">
                  {displayedContacts.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-4 md:p-6">
              {/* Barre de recherche et filtres */}
              <div className="flex flex-col gap-3 mb-4">
                <div className="flex flex-col xs:flex-row gap-2">
                  <div className="relative flex-1 min-w-0">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3 w-3 sm:h-4 sm:w-4" />
                    <input
                      type="text"
                      placeholder="Rechercher un contact..."
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
                    onClick={() => setShowContactFilters(!showContactFilters)}
                    className="flex-shrink-0 lg:hidden"
                  >
                    <FaFilter className="mr-2 h-3 w-3" />
                    Filtres
                    {showContactFilters ? <FaChevronUp className="ml-2 h-3 w-3" /> : <FaChevronDown className="ml-2 h-3 w-3" />}
                  </Button>
                </div>

                {/* Filtres */}
                <div className={`${showContactFilters ? 'block' : 'hidden'} lg:block`}>
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    <Button 
                      variant={filter === 'all' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setFilter('all')}
                      className={`text-xs ${filter === 'all' ? 'bg-[#1E3A8A]' : ''}`}
                    >
                      Tous ({contacts.length})
                    </Button>
                    <Button 
                      variant={filter === 'processed' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setFilter('processed')}
                      className={`text-xs ${filter === 'processed' ? 'bg-green-600' : ''}`}
                    >
                      ✅ <span className="hidden xs:inline">Traités</span>
                      <span className="xs:hidden">✅</span>
                      ({stats.contacts.processed})
                    </Button>
                    <Button 
                      variant={filter === 'pending' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setFilter('pending')}
                      className={`text-xs ${filter === 'pending' ? 'bg-yellow-600' : ''}`}
                    >
                      ⏳ <span className="hidden xs:inline">En attente</span>
                      <span className="xs:hidden">⏳</span>
                      ({stats.contacts.pending})
                    </Button>
                    <Button 
                      variant={filter === 'analyzed' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setFilter('analyzed')}
                      className={`text-xs ${filter === 'analyzed' ? 'bg-blue-600' : ''}`}
                    >
                      🔍 <span className="hidden xs:inline">Analysés</span>
                      <span className="xs:hidden">🔍</span>
                      ({stats.contacts.analyzed})
                    </Button>
                    <Button 
                      variant={filter === 'support' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setFilter('support')}
                      className={`text-xs ${filter === 'support' ? 'bg-blue-600' : ''}`}
                    >
                      Support
                    </Button>
                    <Button 
                      variant={filter === 'commercial' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setFilter('commercial')}
                      className={`text-xs ${filter === 'commercial' ? 'bg-orange-600' : ''}`}
                    >
                      Commercial
                    </Button>
                    <Button 
                      variant={filter === 'project' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setFilter('project')}
                      className={`text-xs ${filter === 'project' ? 'bg-purple-600' : ''}`}
                    >
                      Projet
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tableau responsive */}
              {displayedContacts.length === 0 ? (
                <div className="text-center py-8 sm:py-12 text-slate-500">
                  <FaUserFriends className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-sm sm:text-base">Aucun contact trouvé</p>
                  <p className="text-xs sm:text-sm">Les contacts apparaîtront ici une fois traités par DONA</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-2 sm:mx-0">
                  <div className="min-w-[640px] sm:min-w-full">
                    <table className="w-full text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/50">
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600">Nom / Email</th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600 hidden sm:table-cell">Sujet</th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600">Catégorie</th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600 hidden xs:table-cell">Statut</th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600 hidden lg:table-cell">Agent</th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedContacts.map((contact) => (
                          <tr key={contact.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                            <td className="px-2 sm:px-4 py-2 sm:py-3">
                              <div className="min-w-[80px]">
                                <p className="font-medium text-slate-800 text-xs sm:text-sm truncate max-w-[100px] sm:max-w-[150px]">
                                  {contact.name}
                                </p>
                                <p className="text-[10px] sm:text-xs text-slate-400 truncate max-w-[100px] sm:max-w-[150px]">
                                  {contact.email}
                                </p>
                              </div>
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell text-slate-600 max-w-xs truncate">
                              {contact.subject}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3">
                              <Badge className={`${categoryColors[contact.category] || categoryColors.other} text-[8px] sm:text-[10px] whitespace-nowrap`}>
                                {contact.category || 'Non classé'}
                              </Badge>
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 hidden xs:table-cell">
                              <Badge className={`${statusColors[contact.status] || statusColors.pending} text-[8px] sm:text-[10px] whitespace-nowrap`}>
                                {contact.status || 'pending'}
                              </Badge>
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 hidden lg:table-cell">
                              <span className="text-[10px] sm:text-xs font-medium text-slate-600">
                                {contact.assigned_agent || '—'}
                              </span>
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-slate-500 text-[10px] sm:text-xs whitespace-nowrap">
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
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emails */}
        <TabsContent value="emails">
          <Card>
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <FaEnvelope className="h-4 w-4 sm:h-5 sm:w-5 text-[#F97316]" />
                <span>Emails</span>
                <Badge variant="secondary" className="text-[10px] sm:text-xs">
                  {displayedEmails.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-4 md:p-6">
              {/* Barre de recherche et filtres */}
              <div className="flex flex-col gap-3 mb-4">
                <div className="flex flex-col xs:flex-row gap-2">
                  <div className="relative flex-1 min-w-0">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3 w-3 sm:h-4 sm:w-4" />
                    <input
                      type="text"
                      placeholder="Rechercher un email..."
                      value={emailSearchTerm}
                      onChange={(e) => setEmailSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-8 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent"
                    />
                    {emailSearchTerm && (
                      <button
                        onClick={() => setEmailSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <FaTimesCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEmailFilters(!showEmailFilters)}
                    className="flex-shrink-0 lg:hidden"
                  >
                    <FaFilter className="mr-2 h-3 w-3" />
                    Filtres
                    {showEmailFilters ? <FaChevronUp className="ml-2 h-3 w-3" /> : <FaChevronDown className="ml-2 h-3 w-3" />}
                  </Button>
                </div>

                {/* Filtres */}
                <div className={`${showEmailFilters ? 'block' : 'hidden'} lg:block`}>
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    <Button 
                      variant={emailFilter === 'all' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setEmailFilter('all')}
                      className={`text-xs ${emailFilter === 'all' ? 'bg-[#1E3A8A]' : ''}`}
                    >
                      Tous ({emails.length})
                    </Button>
                    <Button 
                      variant={emailFilter === 'processed' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setEmailFilter('processed')}
                      className={`text-xs ${emailFilter === 'processed' ? 'bg-green-600' : ''}`}
                    >
                      ✅ <span className="hidden xs:inline">Traités</span>
                      <span className="xs:hidden">✅</span>
                      ({stats.emails.processed})
                    </Button>
                    <Button 
                      variant={emailFilter === 'pending' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setEmailFilter('pending')}
                      className={`text-xs ${emailFilter === 'pending' ? 'bg-yellow-600' : ''}`}
                    >
                      ⏳ <span className="hidden xs:inline">En attente</span>
                      <span className="xs:hidden">⏳</span>
                      ({stats.emails.pending})
                    </Button>
                    <Button 
                      variant={emailFilter === 'analyzed' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setEmailFilter('analyzed')}
                      className={`text-xs ${emailFilter === 'analyzed' ? 'bg-blue-600' : ''}`}
                    >
                      🔍 <span className="hidden xs:inline">Analysés</span>
                      <span className="xs:hidden">🔍</span>
                      ({stats.emails.analyzed})
                    </Button>
                    <Button 
                      variant={emailFilter === 'ignored' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setEmailFilter('ignored')}
                      className={`text-xs ${emailFilter === 'ignored' ? 'bg-gray-600' : ''}`}
                    >
                      🚫 <span className="hidden xs:inline">Ignorés</span>
                      <span className="xs:hidden">🚫</span>
                      ({stats.emails.ignored})
                    </Button>
                    <Button 
                      variant={emailFilter === 'support' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setEmailFilter('support')}
                      className={`text-xs ${emailFilter === 'support' ? 'bg-blue-600' : ''}`}
                    >
                      Support
                    </Button>
                    <Button 
                      variant={emailFilter === 'commercial' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setEmailFilter('commercial')}
                      className={`text-xs ${emailFilter === 'commercial' ? 'bg-orange-600' : ''}`}
                    >
                      Commercial
                    </Button>
                    <Button 
                      variant={emailFilter === 'project' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setEmailFilter('project')}
                      className={`text-xs ${emailFilter === 'project' ? 'bg-purple-600' : ''}`}
                    >
                      Projet
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tableau responsive */}
              {displayedEmails.length === 0 ? (
                <div className="text-center py-8 sm:py-12 text-slate-500">
                  <FaEnvelope className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-sm sm:text-base">Aucun email trouvé</p>
                  <p className="text-xs sm:text-sm">Les emails apparaîtront ici une fois traités par DONA</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-2 sm:mx-0">
                  <div className="min-w-[640px] sm:min-w-full">
                    <table className="w-full text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/50">
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600">Expéditeur</th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600 hidden sm:table-cell">Sujet</th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600">Catégorie</th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600 hidden xs:table-cell">Statut</th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600 hidden lg:table-cell">Agent</th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-slate-600">Reçu</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedEmails.map((email) => (
                          <tr key={email.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                            <td className="px-2 sm:px-4 py-2 sm:py-3">
                              <div className="min-w-[80px]">
                                <p className="font-medium text-slate-800 text-xs sm:text-sm truncate max-w-[100px] sm:max-w-[200px]">
                                  {email.from_email}
                                </p>
                              </div>
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell text-slate-600 max-w-xs truncate">
                              {email.subject}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3">
                              {email.category ? (
                                <Badge className={`${categoryColors[email.category] || categoryColors.other} text-[8px] sm:text-[10px] whitespace-nowrap`}>
                                  {email.category}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[8px] sm:text-[10px] text-slate-400 whitespace-nowrap">
                                  Non classé
                                </Badge>
                              )}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 hidden xs:table-cell">
                              <Badge className={`${statusColors[email.status] || statusColors.pending} text-[8px] sm:text-[10px] whitespace-nowrap`}>
                                {email.status || 'pending'}
                              </Badge>
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 hidden lg:table-cell">
                              <span className="text-[10px] sm:text-xs font-medium text-slate-600">
                                {email.assigned_agent || '—'}
                              </span>
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-slate-500 text-[10px] sm:text-xs whitespace-nowrap">
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
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}