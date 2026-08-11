// app/(dashboard)/admin/harvey/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  FaInbox,
  FaFilter,
  FaTimesCircle,
  FaChevronDown,
  FaChevronUp
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
  const [showFilters, setShowFilters] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

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
  // CHARGEMENT DES DONNÉES
  // ============================================================
  const loadData = async (silent: boolean = false) => {
    if (!silent) {
      setRefreshing(true);
    }

    try {
      const { data: conversationsData, error: convError } = await supabase
        .from('email_conversations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (convError) {
        console.error('Erreur conversations:', convError);
        if (!silent) toast.error('Erreur lors du chargement des conversations');
      } else {
        const { data: contacts } = await supabase
          .from('contacts')
          .select('email, name');

        const contactEmails = new Map();
        contacts?.forEach(c => contactEmails.set(c.email, c.name));

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
      if (item.status === 'pending') stats.pending++;
      else if (item.status === 'review') stats.review++;
      else if (item.status === 'approved') stats.approved++;
      else if (item.status === 'sent') stats.sent++;
      else if (item.status === 'archived') stats.archived++;

      totalConfidence += item.confidence || 0;

      if (item.category) {
        stats.byCategory[item.category] = (stats.byCategory[item.category] || 0) + 1;
      }

      if (item.tone) {
        stats.byTone[item.tone] = (stats.byTone[item.tone] || 0) + 1;
      }

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

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedItems);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedItems(newSet);
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
    <main className="min-h-screen bg-[#F5F7FB] p-3 sm:p-4 md:p-6">
      <Toaster position="top-right" richColors />
      
      <div className="mx-auto max-w-7xl">
        {/* ============================================================
        EN-TÊTE
        ============================================================ */}
        <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between mb-4 md:mb-6">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1E3A8A] flex flex-wrap items-center gap-2 md:gap-3">
              <FaUserTie className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-[#F97316] flex-shrink-0" />
              <span className="truncate">HARVEY - Agent de réponse</span>
              <Badge variant="outline" className="flex-shrink-0">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="hidden xs:inline">En direct</span>
                </span>
              </Badge>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 flex flex-wrap items-center gap-1 sm:gap-2 mt-0.5">
              Gestion des réponses générées par l'agent IA
              <span className="text-xs text-slate-400 hidden sm:inline">·</span>
              <span className="text-xs text-slate-400">
                Dernière MAJ: {lastUpdate.toLocaleTimeString()}
              </span>
            </p>
          </div>
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
              onClick={triggerHarvey}
            >
              <FaReply className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Traiter</span>
              <span className="xs:hidden">⚡</span>
            </Button>
          </div>
        </div>

        {/* ============================================================
        STATISTIQUES - Version responsive
        ============================================================ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-3 mb-4 md:mb-6">
          <Card className="transition-all hover:shadow-md">
            <CardContent className="p-2 sm:p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Total</p>
                  <p className="text-base sm:text-lg md:text-xl font-bold text-[#1E3A8A]">{stats.total}</p>
                </div>
                <FaFileAlt className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-[#F97316]" />
              </div>
            </CardContent>
          </Card>
          <Card className="transition-all hover:shadow-md">
            <CardContent className="p-2 sm:p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">En attente</p>
                  <p className="text-base sm:text-lg md:text-xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <FaClock className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="transition-all hover:shadow-md">
            <CardContent className="p-2 sm:p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Relecture</p>
                  <p className="text-base sm:text-lg md:text-xl font-bold text-orange-600">{stats.review}</p>
                </div>
                <FaEye className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="transition-all hover:shadow-md">
            <CardContent className="p-2 sm:p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Approuvés</p>
                  <p className="text-base sm:text-lg md:text-xl font-bold text-blue-600">{stats.approved}</p>
                </div>
                <FaCheck className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="transition-all hover:shadow-md">
            <CardContent className="p-2 sm:p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Envoyés</p>
                  <p className="text-base sm:text-lg md:text-xl font-bold text-green-600">{stats.sent}</p>
                </div>
                <FaReply className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="transition-all hover:shadow-md col-span-2 sm:col-span-1">
            <CardContent className="p-2 sm:p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Confiance moy.</p>
                  <p className="text-base sm:text-lg md:text-xl font-bold text-[#1E3A8A]">{stats.avgConfidence}%</p>
                </div>
                <FaBrain className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-[#F97316]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ============================================================
        FILTRES - Version responsive avec toggle mobile
        ============================================================ */}
        <div className="flex flex-col gap-3 sm:gap-4 mb-4">
          {/* Barre de recherche et bouton filtres */}
          <div className="flex flex-col xs:flex-row gap-2 items-stretch xs:items-center">
            <div className="relative flex-1 min-w-0">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3 w-3 sm:h-4 sm:w-4" />
              <input
                type="text"
                placeholder="Rechercher..."
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
              {showFilters ? <FaChevronUp className="ml-2 h-3 w-3" /> : <FaChevronDown className="ml-2 h-3 w-3" />}
            </Button>
          </div>

          {/* Filtres - visible sur desktop, toggle sur mobile */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              <Button 
                variant={filter === 'all' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilter('all')}
                className={`text-xs sm:text-sm ${filter === 'all' ? 'bg-[#1E3A8A]' : ''}`}
              >
                📋 Tous ({stats.total})
              </Button>
              <Button 
                variant={filter === 'contacts' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilter('contacts')}
                className={`text-xs sm:text-sm ${filter === 'contacts' ? 'bg-purple-600' : ''}`}
              >
                <FaUserFriends className="mr-1 h-3 w-3" />
                <span className="hidden xs:inline">Contacts</span>
                <span className="xs:hidden">👥</span>
                ({stats.bySource.contact})
              </Button>
              <Button 
                variant={filter === 'emails' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilter('emails')}
                className={`text-xs sm:text-sm ${filter === 'emails' ? 'bg-blue-600' : ''}`}
              >
                <FaEnvelope className="mr-1 h-3 w-3" />
                <span className="hidden xs:inline">Emails</span>
                <span className="xs:hidden">📧</span>
                ({stats.bySource.email})
              </Button>
              <Button 
                variant={filter === 'pending' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilter('pending')}
                className={`text-xs sm:text-sm ${filter === 'pending' ? 'bg-yellow-600' : ''}`}
              >
                ⏳ <span className="hidden xs:inline">En attente</span>
                <span className="xs:hidden">Attente</span>
                ({stats.pending})
              </Button>
              <Button 
                variant={filter === 'review' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilter('review')}
                className={`text-xs sm:text-sm ${filter === 'review' ? 'bg-orange-600' : ''}`}
              >
                👀 <span className="hidden xs:inline">Relecture</span>
                <span className="xs:hidden">Relect.</span>
                ({stats.review})
              </Button>
              <Button 
                variant={filter === 'approved' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilter('approved')}
                className={`text-xs sm:text-sm ${filter === 'approved' ? 'bg-blue-600' : ''}`}
              >
                ✅ <span className="hidden xs:inline">Approuvés</span>
                <span className="xs:hidden">Appr.</span>
                ({stats.approved})
              </Button>
              <Button 
                variant={filter === 'sent' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilter('sent')}
                className={`text-xs sm:text-sm ${filter === 'sent' ? 'bg-green-600' : ''}`}
              >
                📤 <span className="hidden xs:inline">Envoyés</span>
                <span className="xs:hidden">Env.</span>
                ({stats.sent})
              </Button>
              <Button 
                variant={filter === 'support' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilter('support')}
                className={`text-xs sm:text-sm ${filter === 'support' ? 'bg-blue-600' : ''}`}
              >
                Support
              </Button>
              <Button 
                variant={filter === 'commercial' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilter('commercial')}
                className={`text-xs sm:text-sm ${filter === 'commercial' ? 'bg-orange-600' : ''}`}
              >
                Commercial
              </Button>
              <Button 
                variant={filter === 'project' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilter('project')}
                className={`text-xs sm:text-sm ${filter === 'project' ? 'bg-purple-600' : ''}`}
              >
                Projet
              </Button>
            </div>
          </div>
        </div>

        {/* ============================================================
        LISTE DES CONVERSATIONS - Version responsive
        ============================================================ */}
        <Card>
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg md:text-xl">
              <FaReply className="h-4 w-4 sm:h-5 sm:w-5 text-[#F97316]" />
              <span>Réponses générées</span>
              <Badge variant="secondary" className="text-xs">
                {displayedConversations.length}
              </Badge>
              {refreshing && (
                <FaSpinner className="h-3 w-3 sm:h-4 sm:w-4 animate-spin ml-auto text-slate-400" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 md:p-6">
            {displayedConversations.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-slate-500">
                <FaReply className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-slate-300 mb-3" />
                <p className="text-base sm:text-lg font-medium">Aucune réponse générée</p>
                <p className="text-xs sm:text-sm">Les réponses apparaîtront ici une fois que HARVEY aura traité des emails ou des contacts.</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {displayedConversations.map((conv) => {
                  const isExpanded = expandedItems.has(conv.id);
                  return (
                    <div 
                      key={conv.id}
                      className="border border-slate-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition"
                    >
                      {/* En-tête de la conversation - toujours visible */}
                      <div className="flex flex-col gap-2">
                        {/* Ligne 1: Source + Statut + Actions rapides */}
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                          <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                            <p className="font-medium text-slate-800 text-sm sm:text-base truncate max-w-[120px] xs:max-w-[200px] sm:max-w-[300px]">
                              {conv.contact_name || conv.from_email}
                            </p>
                            
                            {conv.source === 'contact' ? (
                              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] sm:text-xs flex-shrink-0">
                                <FaUserFriends className="mr-1 h-2 w-2 sm:h-3 sm:w-3" />
                                <span className="hidden xs:inline">Contact</span>
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] sm:text-xs flex-shrink-0">
                                <FaEnvelope className="mr-1 h-2 w-2 sm:h-3 sm:w-3" />
                                <span className="hidden xs:inline">Email</span>
                              </Badge>
                            )}
                            
                            <Badge className={`${statusColors[conv.status] || statusColors.pending} text-[10px] sm:text-xs flex-shrink-0`}>
                              {statusLabels[conv.status] || conv.status}
                            </Badge>
                            
                            {conv.requires_human_review && (
                              <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-[10px] sm:text-xs flex-shrink-0">
                                👤 Relecture
                              </Badge>
                            )}
                          </div>
                          
                          {/* Bouton expand sur mobile */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="lg:hidden h-6 w-6 p-0"
                            onClick={() => toggleExpand(conv.id)}
                          >
                            {isExpanded ? <FaChevronUp className="h-3 w-3" /> : <FaChevronDown className="h-3 w-3" />}
                          </Button>
                        </div>

                        {/* Ligne 2: Sujet + Catégorie/Ton/Agent (sur une ligne) */}
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                          <p className="text-xs sm:text-sm text-slate-600 truncate flex-1 min-w-0">
                            {conv.subject}
                          </p>
                          <div className="flex flex-wrap gap-1 flex-shrink-0">
                            {conv.category && (
                              <Badge className={`${categoryColors[conv.category] || categoryColors.other} text-[8px] sm:text-[10px]`}>
                                {conv.category}
                              </Badge>
                            )}
                            {conv.tone && (
                              <Badge variant="outline" className={`${toneColors[conv.tone] || ''} text-[8px] sm:text-[10px] hidden sm:inline-flex`}>
                                {conv.tone}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-[8px] sm:text-[10px]">
                              🧠 {conv.confidence || 0}%
                            </Badge>
                          </div>
                        </div>

                        {/* Ligne 3: Aperçu de la réponse */}
                        <div className={`text-xs sm:text-sm text-slate-600 bg-slate-50 p-2 rounded ${isExpanded ? '' : 'line-clamp-2'}`}>
                          {conv.agent_response || conv.message || 'Pas de réponse'}
                        </div>

                        {/* Ligne 4: Actions - toujours visibles */}
                        <div className="flex flex-wrap gap-1 sm:gap-2 mt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 sm:h-8"
                            onClick={() => {
                              setSelectedConversation(conv);
                              setShowDetail(true);
                            }}
                          >
                            <FaEye className="mr-1 h-2 w-2 sm:h-3 sm:w-3" /> 
                            <span className="hidden xs:inline">Voir</span>
                          </Button>

                          {conv.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-blue-600 hover:bg-blue-700 text-xs h-7 sm:h-8"
                              onClick={() => approveResponse(conv.id)}
                            >
                              <FaCheck className="mr-1 h-2 w-2 sm:h-3 sm:w-3" /> 
                              <span className="hidden xs:inline">Approuver</span>
                            </Button>
                          )}

                          {conv.status === 'approved' && (
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-green-600 hover:bg-green-700 text-xs h-7 sm:h-8"
                              onClick={() => sendResponse(conv.id)}
                            >
                              <FaReply className="mr-1 h-2 w-2 sm:h-3 sm:w-3" /> 
                              <span className="hidden xs:inline">Envoyer</span>
                            </Button>
                          )}

                          {conv.status === 'review' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-blue-600 hover:bg-blue-700 text-xs h-7 sm:h-8"
                                onClick={() => approveResponse(conv.id)}
                              >
                                <FaCheck className="mr-1 h-2 w-2 sm:h-3 sm:w-3" /> 
                                <span className="hidden xs:inline">Approuver</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-7 sm:h-8"
                                onClick={() => regenerateResponse(conv.id)}
                              >
                                <FaSync className="mr-1 h-2 w-2 sm:h-3 sm:w-3" /> 
                                <span className="hidden xs:inline">Régénérer</span>
                              </Button>
                            </>
                          )}

                          {!['sent', 'archived'].includes(conv.status) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-7 sm:h-8"
                              onClick={() => archiveResponse(conv.id)}
                            >
                              <FaTimes className="mr-1 h-2 w-2 sm:h-3 sm:w-3" /> 
                              <span className="hidden xs:inline">Archiver</span>
                            </Button>
                          )}
                        </div>

                        {/* Métadonnées - version compacte */}
                        <div className="flex flex-wrap gap-2 sm:gap-4 text-[10px] sm:text-xs text-slate-400 mt-1">
                          <span>📅 {new Date(conv.created_at).toLocaleString('fr-FR')}</span>
                          {conv.sent_at && (
                            <span>📤 Envoyé: {new Date(conv.sent_at).toLocaleString('fr-FR')}</span>
                          )}
                          {conv.actions && conv.actions.length > 0 && (
                            <span className="hidden sm:inline">📌 Actions: {conv.actions.join(', ')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ============================================================
      MODAL DETAIL - Version responsive
      ============================================================ */}
      {showDetail && selectedConversation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-[#1E3A8A] truncate">
                Détail de la réponse
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetail(false)}
                className="flex-shrink-0"
              >
                ✕
              </Button>
            </div>

            <div className="p-3 sm:p-4 md:p-6 space-y-4">
              {/* Message original */}
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-slate-600 mb-2">
                  {selectedConversation.source === 'contact' ? '📋 Message de contact' : '📧 Email original'}
                </h3>
                <div className="bg-slate-50 rounded-lg p-3 sm:p-4">
                  <p className="text-sm sm:text-base font-medium break-words">{selectedConversation.subject}</p>
                  <p className="text-xs sm:text-sm text-slate-500 break-words">
                    De: {selectedConversation.contact_name || selectedConversation.from_email}
                    {selectedConversation.source === 'contact' && (
                      <span className="ml-2 text-purple-600">(Contact)</span>
                    )}
                  </p>
                  <p className="text-sm sm:text-base text-slate-700 mt-2 whitespace-pre-wrap break-words">
                    {selectedConversation.message || selectedConversation.body || 'Contenu non disponible'}
                  </p>
                </div>
              </div>

              {/* Réponse générée */}
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-slate-600 mb-2">🤖 Réponse générée</h3>
                <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
                    <Badge className={`${statusColors[selectedConversation.status] || statusColors.pending} text-[10px] sm:text-xs`}>
                      {statusLabels[selectedConversation.status] || selectedConversation.status}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] sm:text-xs">🧠 {selectedConversation.confidence || 0}%</Badge>
                    {selectedConversation.requires_human_review && (
                      <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-[10px] sm:text-xs">
                        👤 Relecture
                      </Badge>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap text-sm sm:text-base text-slate-700 break-words max-h-60 overflow-y-auto">
                    {selectedConversation.agent_response || 'Pas de réponse générée'}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1 sm:gap-2">
                    {selectedConversation.tone && (
                      <Badge variant="outline" className={`${toneColors[selectedConversation.tone] || ''} text-[10px] sm:text-xs`}>
                        Ton: {selectedConversation.tone}
                      </Badge>
                    )}
                    {selectedConversation.suggested_agent && (
                      <Badge className={`${agentColors[selectedConversation.suggested_agent] || ''} text-[10px] sm:text-xs`}>
                        Agent: {selectedConversation.suggested_agent}
                      </Badge>
                    )}
                  </div>
                  {selectedConversation.actions && selectedConversation.actions.length > 0 && (
                    <div className="mt-2">
                      <p className="text-[10px] sm:text-xs font-medium text-slate-500">📌 Actions suggérées:</p>
                      <ul className="text-xs sm:text-sm text-slate-600 list-disc list-inside">
                        {selectedConversation.actions.map((action, idx) => (
                          <li key={idx} className="break-words">{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions - responsive */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetail(false)}
                  className="text-xs sm:text-sm"
                >
                  Fermer
                </Button>

                {selectedConversation.status === 'pending' && (
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm"
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
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
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
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm"
                      onClick={() => {
                        approveResponse(selectedConversation.id);
                        setShowDetail(false);
                      }}
                    >
                      <FaCheck className="mr-1 h-3 w-3" /> Approuver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-orange-600 border-orange-200 hover:bg-orange-50 text-xs sm:text-sm"
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
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50 text-xs sm:text-sm"
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