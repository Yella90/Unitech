// app/(dashboard)/admin/harvey/page.tsx
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
  FaCheckCircle, 
  FaClock, 
  FaSync,
  FaSearch,
  FaSpinner,
  FaUserTie,
  FaReply,
  FaEye,
  FaCheck,
  FaTimes,
  FaUserCheck,
  FaBrain,
  FaFileAlt,
  FaChartLine,
  FaUsers,
  FaUserFriends,
  FaInbox
} from 'react-icons/fa';
import { toast, Toaster } from 'sonner';

// ============================================================
// TYPES
// ============================================================
type EmailConversation = {
  id: string;
  email_id: string;
  from_email: string;
  to_email: string;
  subject: string;
  message: string;
  body: string;
  agent_response: string;
  response_tone: string;
  tone: string;
  category: string;
  actions: string[];
  requires_human_review: boolean;
  confidence: number;
  suggested_agent: string;
  status: 'pending' | 'review' | 'approved' | 'sent' | 'archived';
  created_at: string;
  sent_at: string | null;
  is_outgoing: boolean;
  updated_at: string;
  source: 'email' | 'contact';
  contact_name?: string;
};

type HarveyStats = {
  total: number;
  pending: number;
  review: number;
  approved: number;
  sent: number;
  archived: number;
  avgConfidence: number;
  byCategory: Record<string, number>;
  byTone: Record<string, number>;
  bySource: {
    email: number;
    contact: number;
  };
};

// ============================================================
// CONFIGURATION DES COULEURS
// ============================================================
const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  review: 'bg-orange-100 text-orange-700',
  approved: 'bg-blue-100 text-blue-700',
  sent: 'bg-green-100 text-green-700',
  archived: 'bg-gray-100 text-gray-700',
};

const statusLabels: Record<string, string> = {
  pending: '⏳ En attente',
  review: '👀 Relecture',
  approved: '✅ Approuvé',
  sent: '📤 Envoyé',
  archived: '📦 Archivé',
};

const categoryColors: Record<string, string> = {
  support: 'bg-blue-100 text-blue-700',
  commercial: 'bg-orange-100 text-orange-700',
  project: 'bg-purple-100 text-purple-700',
  newsletter: 'bg-green-100 text-green-700',
  information: 'bg-gray-100 text-gray-700',
  spam: 'bg-red-100 text-red-700',
  other: 'bg-slate-100 text-slate-700',
};

const toneColors: Record<string, string> = {
  professional: 'bg-blue-50 text-blue-600 border-blue-200',
  friendly: 'bg-green-50 text-green-600 border-green-200',
  technical: 'bg-purple-50 text-purple-600 border-purple-200',
  concise: 'bg-gray-50 text-gray-600 border-gray-200',
};

const agentColors: Record<string, string> = {
  SUPPORT: 'bg-blue-100 text-blue-700',
  COMMERCIAL: 'bg-orange-100 text-orange-700',
  PROJET: 'bg-purple-100 text-purple-700',
  HUMAN: 'bg-emerald-100 text-emerald-700',
};

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function AdminHarveyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState<EmailConversation[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<EmailConversation | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [stats, setStats] = useState<HarveyStats>({
    total: 0,
    pending: 0,
    review: 0,
    approved: 0,
    sent: 0,
    archived: 0,
    avgConfidence: 0,
    byCategory: {},
    byTone: {},
    bySource: { email: 0, contact: 0 }
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
  // CHARGEMENT DES DONNÉES AVEC IDENTIFICATION DES CONTACTS
  // ============================================================
  const loadData = async (silent: boolean = false) => {
    if (!silent) {
      setRefreshing(true);
    }

    try {
      // Charger les conversations
      const { data: conversationsData, error: convError } = await supabase
        .from('email_conversations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (convError) {
        console.error('Erreur conversations:', convError);
        if (!silent) toast.error('Erreur lors du chargement des conversations');
      } else {
        // Récupérer les emails des contacts pour identification
        const { data: contacts } = await supabase
          .from('contacts')
          .select('email, name');

        const contactEmails = new Map();
        contacts?.forEach(c => contactEmails.set(c.email, c.name));

        // Transformer et identifier les sources
        const transformed = (conversationsData || []).map((item: any) => {
          const isContact = contactEmails.has(item.from_email);
          return {
            ...item,
            agent_response: item.agent_response || item.response_content || '',
            tone: item.tone || item.response_tone || 'professional',
            source: isContact ? 'contact' : 'email',
            contact_name: isContact ? contactEmails.get(item.from_email) : undefined
          };
        });
        
        setConversations(transformed);
        calculateStats(transformed);
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

  // ============================================================
  // CALCUL DES STATISTIQUES
  // ============================================================
  const calculateStats = (data: EmailConversation[]) => {
    const stats: HarveyStats = {
      total: data.length,
      pending: 0,
      review: 0,
      approved: 0,
      sent: 0,
      archived: 0,
      avgConfidence: 0,
      byCategory: {},
      byTone: {},
      bySource: { email: 0, contact: 0 }
    };

    let totalConfidence = 0;

    data.forEach(item => {
      // Statuts
      if (item.status === 'pending') stats.pending++;
      else if (item.status === 'review') stats.review++;
      else if (item.status === 'approved') stats.approved++;
      else if (item.status === 'sent') stats.sent++;
      else if (item.status === 'archived') stats.archived++;

      // Confiance
      totalConfidence += item.confidence || 0;

      // Catégories
      if (item.category) {
        stats.byCategory[item.category] = (stats.byCategory[item.category] || 0) + 1;
      }

      // Tons
      if (item.tone) {
        stats.byTone[item.tone] = (stats.byTone[item.tone] || 0) + 1;
      }

      // Source
      if (item.source === 'contact') {
        stats.bySource.contact++;
      } else {
        stats.bySource.email++;
      }
    });

    stats.avgConfidence = data.length > 0 ? Math.round(totalConfidence / data.length) : 0;
    setStats(stats);
  };

  // ============================================================
  // ACTIONS
  // ============================================================
  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('email_conversations')
        .update({ 
          status,
          updated_at: new Date().toISOString(),
          ...(status === 'sent' ? { sent_at: new Date().toISOString() } : {})
        })
        .eq('id', id);

      if (error) throw error;

      toast.success(`✅ Statut mis à jour: ${statusLabels[status] || status}`);
      loadData(true);
    } catch (error: any) {
      console.error('Erreur mise à jour:', error);
      toast.error(`❌ Erreur: ${error.message}`);
    }
  };

  const approveResponse = async (id: string) => {
    await updateStatus(id, 'approved');
  };

  const sendResponse = async (id: string) => {
    await updateStatus(id, 'sent');
  };

  const archiveResponse = async (id: string) => {
    await updateStatus(id, 'archived');
  };

  const regenerateResponse = async (id: string) => {
    try {
      toast.info('🔄 Régénération en cours...');
      
      const response = await fetch('/api/harvey/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: id })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('✅ Réponse régénérée');
        loadData(true);
      } else {
        toast.error(`❌ Erreur: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Erreur régénération:', error);
      toast.error(`❌ Erreur: ${error.message}`);
    }
  };

  // ============================================================
  // FILTRES ET RECHERCHE
  // ============================================================
  const getFilteredConversations = () => {
    let filtered = conversations;
    
    if (filter === 'pending') {
      filtered = filtered.filter(c => c.status === 'pending');
    } else if (filter === 'review') {
      filtered = filtered.filter(c => c.status === 'review');
    } else if (filter === 'approved') {
      filtered = filtered.filter(c => c.status === 'approved');
    } else if (filter === 'sent') {
      filtered = filtered.filter(c => c.status === 'sent');
    } else if (filter === 'archived') {
      filtered = filtered.filter(c => c.status === 'archived');
    } else if (filter === 'contacts') {
      filtered = filtered.filter(c => c.source === 'contact');
    } else if (filter === 'emails') {
      filtered = filtered.filter(c => c.source === 'email');
    } else if (filter !== 'all') {
      filtered = filtered.filter(c => c.category === filter);
    }

    if (searchTerm) {
      filtered = filtered.filter(c => 
        (c.from_email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.agent_response || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.contact_name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  // ============================================================
  // DÉCLENCHER HARVEY
  // ============================================================
  const triggerHarvey = async () => {
    try {
      toast.info('🔄 Déclenchement du traitement HARVEY...');
      
      const response = await fetch('/api/harvey/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 20 })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`✅ ${data.result.total?.processed || data.result.emails?.processed || 0} traités`);
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

  const displayedConversations = getFilteredConversations();

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
              <FaUserTie className="h-8 w-8 text-[#F97316]" />
              HARVEY - Agent de réponse
              <Badge variant="outline" className="ml-2">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                  En direct
                </span>
              </Badge>
            </h1>
            <p className="mt-1 text-slate-500 flex items-center gap-2">
              Gestion des réponses générées par l'agent IA
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
              onClick={triggerHarvey}
            >
              <FaReply className="mr-2 h-4 w-4" />
              Traiter maintenant
            </Button>
          </div>
        </div>

        {/* ============================================================
        STATISTIQUES
        ============================================================ */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6 mb-6">
          <Card className="transition-all hover:shadow-md">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Total</p>
                  <p className="text-xl font-bold text-[#1E3A8A]">{stats.total}</p>
                </div>
                <FaFileAlt className="h-6 w-6 text-[#F97316]" />
              </div>
            </CardContent>
          </Card>
          <Card className="transition-all hover:shadow-md">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">En attente</p>
                  <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <FaClock className="h-6 w-6 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="transition-all hover:shadow-md">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Relecture</p>
                  <p className="text-xl font-bold text-orange-600">{stats.review}</p>
                </div>
                <FaEye className="h-6 w-6 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="transition-all hover:shadow-md">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Approuvés</p>
                  <p className="text-xl font-bold text-blue-600">{stats.approved}</p>
                </div>
                <FaCheck className="h-6 w-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="transition-all hover:shadow-md">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Envoyés</p>
                  <p className="text-xl font-bold text-green-600">{stats.sent}</p>
                </div>
                <FaReply className="h-6 w-6 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="transition-all hover:shadow-md">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Confiance moy.</p>
                  <p className="text-xl font-bold text-[#1E3A8A]">{stats.avgConfidence}%</p>
                </div>
                <FaBrain className="h-6 w-6 text-[#F97316]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ============================================================
        FILTRES AVEC BOUTONS CONTACTS / EMAILS
        ============================================================ */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={filter === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'bg-[#1E3A8A]' : ''}
            >
              📋 Tous ({stats.total})
            </Button>
            <Button 
              variant={filter === 'contacts' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('contacts')}
              className={filter === 'contacts' ? 'bg-purple-600' : ''}
            >
              <FaUserFriends className="mr-1 h-3 w-3" />
              Contacts ({stats.bySource.contact})
            </Button>
            <Button 
              variant={filter === 'emails' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('emails')}
              className={filter === 'emails' ? 'bg-blue-600' : ''}
            >
              <FaEnvelope className="mr-1 h-3 w-3" />
              Emails ({stats.bySource.email})
            </Button>
            <Button 
              variant={filter === 'pending' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('pending')}
              className={filter === 'pending' ? 'bg-yellow-600' : ''}
            >
              ⏳ En attente ({stats.pending})
            </Button>
            <Button 
              variant={filter === 'review' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('review')}
              className={filter === 'review' ? 'bg-orange-600' : ''}
            >
              👀 Relecture ({stats.review})
            </Button>
            <Button 
              variant={filter === 'approved' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('approved')}
              className={filter === 'approved' ? 'bg-blue-600' : ''}
            >
              ✅ Approuvés ({stats.approved})
            </Button>
            <Button 
              variant={filter === 'sent' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('sent')}
              className={filter === 'sent' ? 'bg-green-600' : ''}
            >
              📤 Envoyés ({stats.sent})
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

        {/* ============================================================
        LISTE DES CONVERSATIONS
        ============================================================ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FaReply className="h-5 w-5 text-[#F97316]" />
              Réponses générées
              <Badge variant="secondary" className="ml-2">
                {displayedConversations.length}
              </Badge>
              {refreshing && (
                <FaSpinner className="h-4 w-4 animate-spin ml-2 text-slate-400" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {displayedConversations.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <FaReply className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                <p className="text-lg font-medium">Aucune réponse générée</p>
                <p className="text-sm">Les réponses apparaîtront ici une fois que HARVEY aura traité des emails ou des contacts.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedConversations.map((conv) => (
                  <div 
                    key={conv.id}
                    className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      {/* Informations avec badge source */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-slate-800 truncate">
                            {conv.contact_name || conv.from_email}
                          </p>
                          
                          {/* Badge source */}
                          {conv.source === 'contact' ? (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                              <FaUserFriends className="mr-1 h-3 w-3" />
                              Contact
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              <FaEnvelope className="mr-1 h-3 w-3" />
                              Email
                            </Badge>
                          )}
                          
                          <Badge className={statusColors[conv.status] || statusColors.pending}>
                            {statusLabels[conv.status] || conv.status}
                          </Badge>
                          {conv.requires_human_review && (
                            <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                              👤 Relecture
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 truncate">{conv.subject}</p>
                      </div>

                      {/* Badges catégorie, ton, agent */}
                      <div className="flex flex-wrap gap-2 items-center">
                        {conv.category && (
                          <Badge className={categoryColors[conv.category] || categoryColors.other}>
                            {conv.category}
                          </Badge>
                        )}
                        {conv.tone && (
                          <Badge variant="outline" className={toneColors[conv.tone] || ''}>
                            {conv.tone}
                          </Badge>
                        )}
                        {conv.suggested_agent && (
                          <Badge className={agentColors[conv.suggested_agent] || ''}>
                            {conv.suggested_agent}
                          </Badge>
                        )}
                        <Badge variant="outline">
                          🧠 {conv.confidence || 0}%
                        </Badge>
                      </div>
                    </div>

                    {/* Aperçu de la réponse */}
                    <div className="mt-2 text-sm text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded">
                      {conv.agent_response || conv.message || 'Pas de réponse'}
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedConversation(conv);
                          setShowDetail(true);
                        }}
                      >
                        <FaEye className="mr-1 h-3 w-3" /> Voir
                      </Button>

                      {conv.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => approveResponse(conv.id)}
                        >
                          <FaCheck className="mr-1 h-3 w-3" /> Approuver
                        </Button>
                      )}

                      {conv.status === 'approved' && (
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => sendResponse(conv.id)}
                        >
                          <FaReply className="mr-1 h-3 w-3" /> Envoyer
                        </Button>
                      )}

                      {conv.status === 'review' && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => approveResponse(conv.id)}
                          >
                            <FaCheck className="mr-1 h-3 w-3" /> Approuver
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => regenerateResponse(conv.id)}
                          >
                            <FaSync className="mr-1 h-3 w-3" /> Régénérer
                          </Button>
                        </>
                      )}

                      {!['sent', 'archived'].includes(conv.status) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => archiveResponse(conv.id)}
                        >
                          <FaTimes className="mr-1 h-3 w-3" /> Archiver
                        </Button>
                      )}
                    </div>

                    {/* Métadonnées */}
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-400">
                      <span>📅 {new Date(conv.created_at).toLocaleString('fr-FR')}</span>
                      {conv.sent_at && (
                        <span>📤 Envoyé le: {new Date(conv.sent_at).toLocaleString('fr-FR')}</span>
                      )}
                      {conv.actions && conv.actions.length > 0 && (
                        <span>📌 Actions: {conv.actions.join(', ')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ============================================================
      MODAL DETAIL
      ============================================================ */}
      {showDetail && selectedConversation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#1E3A8A]">Détail de la réponse</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetail(false)}
              >
                ✕
              </Button>
            </div>

            <div className="p-6 space-y-4">
              {/* Message original */}
              <div>
                <h3 className="text-sm font-semibold text-slate-600 mb-2">
                  {selectedConversation.source === 'contact' ? '📋 Message de contact' : '📧 Email original'}
                </h3>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm font-medium">{selectedConversation.subject}</p>
                  <p className="text-xs text-slate-500">
                    De: {selectedConversation.contact_name || selectedConversation.from_email}
                    {selectedConversation.source === 'contact' && (
                      <span className="ml-2 text-purple-600">(Contact)</span>
                    )}
                  </p>
                  <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">
                    {selectedConversation.message || selectedConversation.body || 'Contenu non disponible'}
                  </p>
                </div>
              </div>

              {/* Réponse générée */}
              <div>
                <h3 className="text-sm font-semibold text-slate-600 mb-2">🤖 Réponse générée</h3>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={statusColors[selectedConversation.status] || statusColors.pending}>
                      {statusLabels[selectedConversation.status] || selectedConversation.status}
                    </Badge>
                    <Badge variant="outline">🧠 {selectedConversation.confidence || 0}%</Badge>
                    {selectedConversation.requires_human_review && (
                      <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                        👤 Relecture
                      </Badge>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap text-sm text-slate-700">
                    {selectedConversation.agent_response || 'Pas de réponse générée'}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedConversation.tone && (
                      <Badge variant="outline" className={toneColors[selectedConversation.tone] || ''}>
                        Ton: {selectedConversation.tone}
                      </Badge>
                    )}
                    {selectedConversation.suggested_agent && (
                      <Badge className={agentColors[selectedConversation.suggested_agent] || ''}>
                        Agent: {selectedConversation.suggested_agent}
                      </Badge>
                    )}
                  </div>
                  {selectedConversation.actions && selectedConversation.actions.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-slate-500">📌 Actions suggérées:</p>
                      <ul className="text-sm text-slate-600 list-disc list-inside">
                        {selectedConversation.actions.map((action, idx) => (
                          <li key={idx}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={() => setShowDetail(false)}
                >
                  Fermer
                </Button>

                {selectedConversation.status === 'pending' && (
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      approveResponse(selectedConversation.id);
                      setShowDetail(false);
                    }}
                  >
                    <FaCheck className="mr-1 h-3 w-3" /> Approuver
                  </Button>
                )}

                {selectedConversation.status === 'approved' && (
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      sendResponse(selectedConversation.id);
                      setShowDetail(false);
                    }}
                  >
                    <FaReply className="mr-1 h-3 w-3" /> Envoyer
                  </Button>
                )}

                {selectedConversation.status === 'review' && (
                  <>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        approveResponse(selectedConversation.id);
                        setShowDetail(false);
                      }}
                    >
                      <FaCheck className="mr-1 h-3 w-3" /> Approuver
                    </Button>
                    <Button
                      variant="outline"
                      className="text-orange-600 border-orange-200 hover:bg-orange-50"
                      onClick={() => {
                        regenerateResponse(selectedConversation.id);
                        setShowDetail(false);
                      }}
                    >
                      <FaSync className="mr-1 h-3 w-3" /> Régénérer
                    </Button>
                  </>
                )}

                {!['sent', 'archived'].includes(selectedConversation.status) && (
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      archiveResponse(selectedConversation.id);
                      setShowDetail(false);
                    }}
                  >
                    <FaTimes className="mr-1 h-3 w-3" /> Archiver
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}