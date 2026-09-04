// app/(client)/clients/mail/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FaEnvelope,
  FaCheckCircle,
  FaClock,
  FaSync,
  FaSearch,
  FaSpinner,
  FaReply,
  FaEye,
  FaCheck,
  FaTimes,
  FaBrain,
  FaFileAlt,
  FaChartLine,
  FaInbox,
  FaFilter,
  FaTimesCircle,
  FaChevronDown,
  FaChevronUp,
  FaCog,
  FaKey,
  FaServer,
  FaLock,
  FaMailBulk,
  FaUser,
  FaUserFriends,
  FaBuilding,
  FaPhone,
  FaAddressCard,
  FaGlobe,
  FaUserTie,
  FaCreditCard,
  FaRocket,
  FaShieldAlt,
  FaInfoCircle,
  FaSave,
  FaArrowLeft,
  FaPlus,
  FaTrash,
  FaEdit,
  FaDownload,
  FaPrint,
  FaShare,
  FaStar,
  FaStarHalf,
  FaRegStar,
  FaPaperclip,
  FaCalendarAlt,
  FaUserCircle,
  FaAt,
  FaHashtag,
  FaGoogle,
  FaMicrosoft,
  FaYahoo,
  FaQuestionCircle,
  FaExternalLinkAlt
} from 'react-icons/fa';
import { toast, Toaster } from 'sonner';

// ============================================================
// TYPES
// ============================================================
type ClientEmail = {
  id: string;
  mail_account_id: string;
  client_id: string;
  from_email: string;
  from_name: string;
  to_email: string[];
  subject: string;
  body: string;
  body_html: string;
  status: 'pending' | 'analyzed' | 'generating' | 'response_ready' | 'approved' | 'sending' | 'sent' | 'archived' | 'error';
  category: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  received_at: string;
  is_read: boolean;
  is_replied: boolean;
  harvey_response: string;
  harvey_response_html: string;
  harvey_response_json: any;
  harvey_tone: string;
  harvey_confidence: number;
  harvey_actions: string[];
  harvey_requires_review: boolean;
  harvey_suggested_agent: string;
  processed_at: string;
  replied_at: string;
  created_at: string;
  updated_at: string;
  mail_account?: {
    email: string;
    imap_server: string;
    imap_port: number;
  };
};

type MailAccount = {
  id: string;
  client_id: string;
  email: string;
  imap_server: string;
  imap_port: number;
  smtp_server: string;
  smtp_port: number;
  encryption: string;
  is_connected: boolean;
  last_sync_at: string;
  sync_status: string;
  is_active: boolean;
  mail_config: any;
  prompt_config: any;
  created_at: string;
};

type EmailStats = {
  total: number;
  pending: number;
  analyzed: number;
  response_ready: number;
  approved: number;
  sent: number;
  archived: number;
  error: number;
  avgConfidence: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
};

// ============================================================
// CONFIGURATION DES COULEURS
// ============================================================
const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  analyzed: 'bg-blue-100 text-blue-700',
  generating: 'bg-purple-100 text-purple-700',
  response_ready: 'bg-indigo-100 text-indigo-700',
  approved: 'bg-green-100 text-green-700',
  sending: 'bg-orange-100 text-orange-700',
  sent: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-gray-100 text-gray-700',
  error: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  pending: '⏳ En attente',
  analyzed: '🔍 Analysé',
  generating: '🤖 Génération',
  response_ready: '📝 Réponse prête',
  approved: '✅ Approuvé',
  sending: '📤 Envoi...',
  sent: '📤 Envoyé',
  archived: '📦 Archivé',
  error: '❌ Erreur',
};

const categoryColors: Record<string, string> = {
  support: 'bg-blue-100 text-blue-700',
  commercial: 'bg-orange-100 text-orange-700',
  project: 'bg-purple-100 text-purple-700',
  newsletter: 'bg-green-100 text-green-700',
  information: 'bg-gray-100 text-gray-700',
  spam: 'bg-red-100 text-red-700',
  general: 'bg-slate-100 text-slate-700',
  other: 'bg-slate-100 text-slate-700',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

// ============================================================
// CONFIGURATION DES FOURNISSEURS EMAIL
// ============================================================
const emailProviders = {
  gmail: {
    name: 'Gmail',
    icon: FaGoogle,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    imap: 'imap.gmail.com',
    imapPort: 993,
    smtp: 'smtp.gmail.com',
    smtpPort: 587,
    encryption: 'tls',
    docs: 'https://support.google.com/accounts/answer/185833',
    appPasswordGuide: 'https://support.google.com/accounts/answer/185833'
  },
  outlook: {
    name: 'Outlook / Office 365',
    icon: FaMicrosoft,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    imap: 'outlook.office365.com',
    imapPort: 993,
    smtp: 'smtp.office365.com',
    smtpPort: 587,
    encryption: 'tls',
    docs: 'https://support.microsoft.com/fr-fr/office/configurer-un-appareil-ou-une-application-avec-un-mot-de-passe-d-application-3dbe25d0-8c7e-4b65-b282-01ac493ba2fd',
    appPasswordGuide: 'https://support.microsoft.com/fr-fr/account-billing/utiliser-des-mots-de-passe-d-application-avec-des-apps-qui-ne-prennent-pas-en-charge-la-v%C3%A9rification-en-deux-%C3%A9tapes-5896ed9b-4263-e681-128a-a6f2979a7944'
  },
  yahoo: {
    name: 'Yahoo Mail',
    icon: FaYahoo,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    imap: 'imap.mail.yahoo.com',
    imapPort: 993,
    smtp: 'smtp.mail.yahoo.com',
    smtpPort: 587,
    encryption: 'tls',
    docs: 'https://help.yahoo.com/kb/SLN15241.html',
    appPasswordGuide: 'https://help.yahoo.com/kb/generate-third-party-passwords-sln15241.html'
  },
  alwaysdata: {
    name: 'Alwaysdata',
    icon: FaServer,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    imap: 'mail.alwaysdata.net',
    imapPort: 993,
    smtp: 'mail.alwaysdata.net',
    smtpPort: 587,
    encryption: 'tls',
    docs: 'https://help.alwaysdata.com/fr/emails/',
    appPasswordGuide: 'https://help.alwaysdata.com/fr/emails/'
  }
};

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function ClientMailPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [emails, setEmails] = useState<ClientEmail[]>([]);
  const [mailAccount, setMailAccount] = useState<MailAccount | null>(null);
  const [hasMailAccount, setHasMailAccount] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<ClientEmail | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('inbox');

  const [stats, setStats] = useState<EmailStats>({
    total: 0,
    pending: 0,
    analyzed: 0,
    response_ready: 0,
    approved: 0,
    sent: 0,
    archived: 0,
    error: 0,
    avgConfidence: 0,
    byCategory: {},
    byPriority: {}
  });

  // Formulaire de configuration
  const [configForm, setConfigForm] = useState({
    email: '',
    imap_server: '',
    imap_port: '993',
    smtp_server: '',
    smtp_port: '587',
    password: '',
    encryption: 'tls',
    max_emails_per_sync: '50',
    prompt_instructions: '',
    prompt_tone: 'professional',
    prompt_signature: "L'équipe UNITECH",
    prompt_custom_rules: ''
  });
  const [configLoading, setConfigLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [showAppPasswordGuide, setShowAppPasswordGuide] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================
  // INITIALISATION
  // ============================================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        await loadMailAccount();
        await loadEmails();
      } catch (error) {
        console.error('Erreur chargement:', error);
        toast.error('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        loadEmails(true);
      }, 30000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh]);

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================
  const loadMailAccount = async () => {
    try {
      const response = await fetch('/api/client/mail/account');
      const data = await response.json();
      
      if (data.success && data.data) {
        setMailAccount(data.data);
        setHasMailAccount(true);
        // Pré-remplir le formulaire
        setConfigForm(prev => ({
          ...prev,
          email: data.data.email || '',
          imap_server: data.data.imap_server || '',
          imap_port: data.data.imap_port?.toString() || '993',
          smtp_server: data.data.smtp_server || '',
          smtp_port: data.data.smtp_port?.toString() || '587',
          encryption: data.data.encryption || 'tls',
          max_emails_per_sync: data.data.max_emails_per_sync?.toString() || '50',
          prompt_instructions: data.data.prompt_config?.instructions || '',
          prompt_tone: data.data.prompt_config?.tone || 'professional',
          prompt_signature: data.data.prompt_config?.signature || "L'équipe UNITECH",
          prompt_custom_rules: data.data.prompt_config?.custom_rules?.join('\n') || ''
        }));
        
        // Détecter le fournisseur
        detectProvider(data.data);
      } else {
        setHasMailAccount(false);
      }
    } catch (error) {
      console.error('Erreur chargement compte mail:', error);
      setHasMailAccount(false);
    }
  };

  const detectProvider = (account: MailAccount) => {
    const server = account.imap_server?.toLowerCase() || '';
    if (server.includes('gmail')) {
      setSelectedProvider('gmail');
    } else if (server.includes('outlook') || server.includes('office365')) {
      setSelectedProvider('outlook');
    } else if (server.includes('yahoo')) {
      setSelectedProvider('yahoo');
    } else if (server.includes('alwaysdata')) {
      setSelectedProvider('alwaysdata');
    }
  };

  const loadEmails = async (silent: boolean = false) => {
    if (!silent) {
      setRefreshing(true);
    }

    try {
      const response = await fetch('/api/client/mail/emails?limit=100');
      const data = await response.json();

      if (data.success) {
        setEmails(data.data || []);
        calculateStats(data.data || []);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erreur chargement emails:', error);
      if (!silent) {
        toast.error('Erreur lors du chargement des emails');
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
  const calculateStats = (data: ClientEmail[]) => {
    const stats: EmailStats = {
      total: data.length,
      pending: 0,
      analyzed: 0,
      response_ready: 0,
      approved: 0,
      sent: 0,
      archived: 0,
      error: 0,
      avgConfidence: 0,
      byCategory: {},
      byPriority: {}
    };

    let totalConfidence = 0;
    let confidenceCount = 0;

    data.forEach(item => {
      switch (item.status) {
        case 'pending':
          stats.pending = (stats.pending || 0) + 1;
          break;
        case 'analyzed':
          stats.analyzed = (stats.analyzed || 0) + 1;
          break;
        case 'generating':
          stats.analyzed = (stats.analyzed || 0) + 1;
          break;
        case 'response_ready':
          stats.response_ready = (stats.response_ready || 0) + 1;
          break;
        case 'approved':
          stats.approved = (stats.approved || 0) + 1;
          break;
        case 'sending':
          stats.sent = (stats.sent || 0) + 1;
          break;
        case 'sent':
          stats.sent = (stats.sent || 0) + 1;
          break;
        case 'archived':
          stats.archived = (stats.archived || 0) + 1;
          break;
        case 'error':
          stats.error = (stats.error || 0) + 1;
          break;
        default:
          stats.pending = (stats.pending || 0) + 1;
          break;
      }

      if (item.category) {
        stats.byCategory[item.category] = (stats.byCategory[item.category] || 0) + 1;
      }

      if (item.priority) {
        stats.byPriority[item.priority] = (stats.byPriority[item.priority] || 0) + 1;
      }

      if (item.harvey_confidence) {
        totalConfidence += item.harvey_confidence;
        confidenceCount++;
      }
    });

    stats.avgConfidence = confidenceCount > 0 ? Math.round(totalConfidence / confidenceCount) : 0;
    setStats(stats);
  };

  // ============================================================
  // ACTIONS SUR LES EMAILS
  // ============================================================
  const updateEmailStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/client/mail/emails/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`✅ Statut mis à jour: ${statusLabels[status] || status}`);
        loadEmails(true);
      } else {
        toast.error(`❌ Erreur: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Erreur mise à jour:', error);
      toast.error(`❌ Erreur: ${error.message}`);
    }
  };

  const approveEmail = async (id: string) => {
    await updateEmailStatus(id, 'approved');
  };

  const sendEmail = async (id: string) => {
    await updateEmailStatus(id, 'sent');
  };

  const archiveEmail = async (id: string) => {
    await updateEmailStatus(id, 'archived');
  };

  const regenerateResponse = async (id: string) => {
    try {
      toast.info('🔄 Régénération en cours...');
      
      const response = await fetch('/api/client/mail/emails/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId: id })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('✅ Réponse régénérée');
        loadEmails(true);
      } else {
        toast.error(`❌ Erreur: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Erreur régénération:', error);
      toast.error(`❌ Erreur: ${error.message}`);
    }
  };

  const syncEmails = async () => {
    if (!mailAccount) return;
    
    setSyncLoading(true);
    try {
      const response = await fetch('/api/client/mail/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mailAccountId: mailAccount.id })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`✅ Synchronisation terminée: ${data.data?.emailsSaved || 0} emails récupérés`);
        await loadEmails();
      } else {
        toast.error(`❌ Erreur: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Erreur synchronisation:', error);
      toast.error(`❌ Erreur: ${error.message}`);
    } finally {
      setSyncLoading(false);
    }
  };

  // ============================================================
  // CONFIGURATION DU COMPTE MAIL
  // ============================================================
  const applyProviderConfig = (provider: string) => {
    const config = emailProviders[provider as keyof typeof emailProviders];
    if (config) {
      setConfigForm(prev => ({
        ...prev,
        imap_server: config.imap,
        imap_port: config.imapPort.toString(),
        smtp_server: config.smtp,
        smtp_port: config.smtpPort.toString(),
        encryption: config.encryption
      }));
      setSelectedProvider(provider);
      toast.info(`✅ Configuration ${config.name} appliquée`);
    }
  };

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigLoading(true);

    try {
      const response = await fetch('/api/client/mail/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...configForm,
          imap_port: parseInt(configForm.imap_port),
          smtp_port: parseInt(configForm.smtp_port),
          max_emails_per_sync: parseInt(configForm.max_emails_per_sync),
          prompt_config: {
            instructions: configForm.prompt_instructions,
            tone: configForm.prompt_tone,
            signature: configForm.prompt_signature,
            custom_rules: configForm.prompt_custom_rules ? configForm.prompt_custom_rules.split('\n').filter(r => r.trim()) : []
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('✅ Compte mail configuré avec succès');
        await loadMailAccount();
        await loadEmails();
        setActiveTab('inbox');
      } else {
        toast.error(`❌ Erreur: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Erreur configuration:', error);
      toast.error(`❌ Erreur: ${error.message}`);
    } finally {
      setConfigLoading(false);
    }
  };

  // ============================================================
  // FILTRES ET RECHERCHE
  // ============================================================
  const getFilteredEmails = () => {
    let filtered = emails;
    
    if (filter === 'pending') {
      filtered = filtered.filter(e => e.status === 'pending');
    } else if (filter === 'analyzed') {
      filtered = filtered.filter(e => e.status === 'analyzed' || e.status === 'generating');
    } else if (filter === 'response_ready') {
      filtered = filtered.filter(e => e.status === 'response_ready');
    } else if (filter === 'approved') {
      filtered = filtered.filter(e => e.status === 'approved');
    } else if (filter === 'sent') {
      filtered = filtered.filter(e => e.status === 'sent');
    } else if (filter === 'archived') {
      filtered = filtered.filter(e => e.status === 'archived');
    } else if (filter === 'error') {
      filtered = filtered.filter(e => e.status === 'error');
    } else if (filter === 'unread') {
      filtered = filtered.filter(e => !e.is_read);
    } else if (filter === 'support') {
      filtered = filtered.filter(e => e.category === 'support');
    } else if (filter === 'commercial') {
      filtered = filtered.filter(e => e.category === 'commercial');
    } else if (filter === 'project') {
      filtered = filtered.filter(e => e.category === 'project');
    } else if (filter !== 'all') {
      filtered = filtered.filter(e => e.category === filter);
    }

    if (searchTerm) {
      filtered = filtered.filter(e => 
        (e.from_email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.from_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.body || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.harvey_response || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ============================================================
  // RENDU
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1E3A8A] border-t-transparent"></div>
      </div>
    );
  }

  const displayedEmails = getFilteredEmails();
  const provider = selectedProvider ? emailProviders[selectedProvider as keyof typeof emailProviders] : null;

  // ✅ Composant du guide du mot de passe d'application
  const AppPasswordGuide = () => {
    const provider = selectedProvider ? emailProviders[selectedProvider as keyof typeof emailProviders] : null;
    
    if (!provider) return null;

    const guides = {
      gmail: {
        steps: [
          'Connectez-vous à votre compte Google',
          'Allez dans "Sécurité" dans le menu de gauche',
          'Activez la "Vérification en deux étapes" si ce n\'est pas déjà fait',
          'Cliquez sur "Mots de passe d\'application"',
          'Sélectionnez "Autre (nom personnalisé)"',
          'Entrez "UNITECH" comme nom',
          'Cliquez sur "Générer"',
          'Copiez le mot de passe généré (16 caractères sans espaces)'
        ]
      },
      outlook: {
        steps: [
          'Connectez-vous à votre compte Microsoft',
          'Allez dans "Sécurité" → "Mots de passe d\'application"',
          'Cliquez sur "Créer un nouveau mot de passe d\'application"',
          'Entrez un nom (ex: "UNITECH")',
          'Copiez le mot de passe généré'
        ]
      },
      yahoo: {
        steps: [
          'Connectez-vous à votre compte Yahoo',
          'Allez dans "Compte" → "Sécurité du compte"',
          'Activez la "Vérification en deux étapes"',
          'Cliquez sur "Générer un mot de passe d\'application"',
          'Sélectionnez "Autre" et entrez "UNITECH"',
          'Cliquez sur "Générer"',
          'Copiez le mot de passe généré'
        ]
      },
      alwaysdata: {
        steps: [
          'Connectez-vous à votre compte Alwaysdata',
          'Allez dans "Emails" → "Comptes emails"',
          'Créez ou sélectionnez un compte email',
          'Utilisez le mot de passe défini pour ce compte (pas de mot de passe d\'application spécifique)'
        ]
      }
    };

    const providerGuide = guides[selectedProvider as keyof typeof guides] || guides.gmail;

    return (
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-100">
            <FaShieldAlt className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
              🔐 Générer un mot de passe d'application pour {provider.name}
              <a 
                href={provider.appPasswordGuide} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
              >
                <FaExternalLinkAlt className="h-3 w-3" />
                Documentation
              </a>
            </h4>
            <ol className="mt-2 space-y-1 text-xs text-blue-700 list-decimal list-inside">
              {providerGuide.steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                ⚠️ <strong>Important :</strong> Copiez immédiatement le mot de passe généré. 
                Vous ne pourrez pas le revoir après avoir fermé la page.
              </p>
            </div>
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-800">
                ✅ Collez le mot de passe généré dans le champ <strong>"Mot de passe"</strong> ci-dessus.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
              <FaMailBulk className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-[#F97316] flex-shrink-0" />
              <span className="truncate">Gestion des emails</span>
              <Badge variant="outline" className="flex-shrink-0">
                <span className="flex items-center gap-1">
                  <span className={`h-2 w-2 rounded-full ${mailAccount?.is_connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></span>
                  <span className="hidden xs:inline">{mailAccount?.is_connected ? 'Connecté' : 'Non connecté'}</span>
                </span>
              </Badge>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 flex flex-wrap items-center gap-1 sm:gap-2 mt-0.5">
              Gérez vos emails et réponses générées par IA
              <span className="text-xs text-slate-400 hidden sm:inline">·</span>
              <span className="text-xs text-slate-400">
                Dernière MAJ: {lastUpdate.toLocaleTimeString()}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            {hasMailAccount && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => loadEmails(false)}
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
                  onClick={syncEmails}
                  disabled={syncLoading}
                >
                  {syncLoading ? (
                    <FaSpinner className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  ) : (
                    <FaSync className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                  <span className="hidden xs:inline">Synchroniser</span>
                  <span className="xs:hidden">⚡</span>
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm"
              onClick={() => setActiveTab('config')}
            >
              <FaCog className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Configuration</span>
            </Button>
          </div>
        </div>

        {/* ============================================================
        STATISTIQUES
        ============================================================ */}
        {hasMailAccount && (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3 md:gap-3 mb-4 md:mb-6">
            <Card className="transition-all hover:shadow-md">
              <CardContent className="p-2 sm:p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] sm:text-xs text-slate-500">Total</p>
                    <p className="text-base sm:text-lg md:text-xl font-bold text-[#1E3A8A]">{stats.total}</p>
                  </div>
                  <FaInbox className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-[#F97316]" />
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
                    <p className="text-[10px] sm:text-xs text-slate-500">Réponses prêtes</p>
                    <p className="text-base sm:text-lg md:text-xl font-bold text-indigo-600">{stats.response_ready}</p>
                  </div>
                  <FaBrain className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-indigo-500" />
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
                  <FaCheckCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="transition-all hover:shadow-md">
              <CardContent className="p-2 sm:p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] sm:text-xs text-slate-500">Erreurs</p>
                    <p className="text-base sm:text-lg md:text-xl font-bold text-red-600">{stats.error}</p>
                  </div>
                  <FaTimes className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-red-500" />
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
        )}

        {/* ============================================================
        TABS
        ============================================================ */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-wrap gap-1 mb-4">
            {hasMailAccount && (
              <>
                <TabsTrigger value="inbox" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <FaInbox className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Boîte de réception</span>
                  <span className="xs:hidden">📥</span>
                  <Badge variant="secondary" className="ml-0 sm:ml-1 text-[10px] sm:text-xs">
                    {stats.pending}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="responses" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <FaBrain className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Réponses IA</span>
                  <span className="xs:hidden">🤖</span>
                  <Badge variant="secondary" className="ml-0 sm:ml-1 text-[10px] sm:text-xs">
                    {stats.response_ready + stats.approved}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="sent" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <FaCheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Envoyés</span>
                  <span className="xs:hidden">📤</span>
                  <Badge variant="secondary" className="ml-0 sm:ml-1 text-[10px] sm:text-xs">
                    {stats.sent}
                  </Badge>
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="config" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <FaCog className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Configuration</span>
              <span className="xs:hidden">⚙️</span>
            </TabsTrigger>
          </TabsList>

          {/* ============================================================
          TAB: INBOX
          ============================================================ */}
          <TabsContent value="inbox">
            {!hasMailAccount ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FaMailBulk className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">Aucun compte mail configuré</h3>
                  <p className="text-slate-500 mb-4">Configurez votre compte mail pour commencer à recevoir et traiter vos emails.</p>
                  <Button 
                    className="bg-[#F97316] hover:bg-[#ea580c]"
                    onClick={() => setActiveTab('config')}
                  >
                    <FaCog className="mr-2" />
                    Configurer
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Filtres et recherche */}
                <div className="flex flex-col gap-3 sm:gap-4 mb-4">
                  <div className="flex flex-col xs:flex-row gap-2 items-stretch xs:items-center">
                    <div className="relative flex-1 min-w-0">
                      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3 w-3 sm:h-4 sm:w-4" />
                      <input
                        type="text"
                        placeholder="Rechercher un email..."
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
                        variant={filter === 'pending' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setFilter('pending')}
                        className={`text-xs sm:text-sm ${filter === 'pending' ? 'bg-yellow-600' : ''}`}
                      >
                        ⏳ En attente ({stats.pending})
                      </Button>
                      <Button 
                        variant={filter === 'response_ready' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setFilter('response_ready')}
                        className={`text-xs sm:text-sm ${filter === 'response_ready' ? 'bg-indigo-600' : ''}`}
                      >
                        🤖 Réponses ({stats.response_ready})
                      </Button>
                      <Button 
                        variant={filter === 'sent' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setFilter('sent')}
                        className={`text-xs sm:text-sm ${filter === 'sent' ? 'bg-green-600' : ''}`}
                      >
                        ✅ Envoyés ({stats.sent})
                      </Button>
                      <Button 
                        variant={filter === 'unread' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setFilter('unread')}
                        className={`text-xs sm:text-sm ${filter === 'unread' ? 'bg-blue-600' : ''}`}
                      >
                        📬 Non lus
                      </Button>
                      <Button 
                        variant={filter === 'error' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setFilter('error')}
                        className={`text-xs sm:text-sm ${filter === 'error' ? 'bg-red-600' : ''}`}
                      >
                        ❌ Erreurs ({stats.error})
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

                {/* Liste des emails - (contenu existant) */}
                <Card>
                  <CardHeader className="p-3 sm:p-4 md:p-6">
                    <CardTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg md:text-xl">
                      <FaInbox className="h-4 w-4 sm:h-5 sm:w-5 text-[#F97316]" />
                      <span>Emails</span>
                      <Badge variant="secondary" className="text-xs">
                        {displayedEmails.length}
                      </Badge>
                      {refreshing && (
                        <FaSpinner className="h-3 w-3 sm:h-4 sm:w-4 animate-spin ml-auto text-slate-400" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-3 md:p-6">
                    {/* Contenu de la liste des emails existant... */}
                    {displayedEmails.length === 0 ? (
                      <div className="text-center py-8 sm:py-12 text-slate-500">
                        <FaInbox className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-slate-300 mb-3" />
                        <p className="text-base sm:text-lg font-medium">Aucun email</p>
                        <p className="text-xs sm:text-sm">Les emails apparaîtront ici une fois synchronisés.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 sm:space-y-4">
                        {/* ... contenu existant ... */}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ============================================================
          TAB: RESPONSES (contenu existant)
          ============================================================ */}
          <TabsContent value="responses">
            {/* ... contenu existant ... */}
          </TabsContent>

          {/* ============================================================
          TAB: SENT (contenu existant)
          ============================================================ */}
          <TabsContent value="sent">
            {/* ... contenu existant ... */}
          </TabsContent>

          {/* ============================================================
          TAB: CONFIGURATION - FORMULAIRE COMPLET AVEC GUIDE
          ============================================================ */}
          <TabsContent value="config">
            <Card>
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <CardTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg md:text-xl">
                  <FaCog className="h-4 w-4 sm:h-5 sm:w-5 text-[#F97316]" />
                  <span>Configuration du compte mail</span>
                </CardTitle>
                <p className="text-sm text-slate-500">
                  Configurez votre compte mail pour l'automatisation des réponses
                </p>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                <form onSubmit={handleConfigSubmit} className="space-y-4">
                  {/* ============================================ */}
                  {/* QUICK CONFIG - SÉLECTION DU FOURNISSEUR */}
                  {/* ============================================ */}
                  <div className="border-b border-slate-200 pb-4">
                    <h3 className="text-sm font-semibold text-[#1E3A8A] mb-3 flex items-center gap-2">
                      <FaRocket className="h-4 w-4 text-[#F97316]" />
                      Configuration rapide
                    </h3>
                    <p className="text-xs text-slate-500 mb-3">
                      Sélectionnez votre fournisseur pour pré-remplir les paramètres
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {Object.entries(emailProviders).map(([key, provider]) => {
                        const Icon = provider.icon;
                        const isSelected = selectedProvider === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => applyProviderConfig(key)}
                            className={`p-3 rounded-lg border-2 transition flex flex-col items-center gap-1 ${
                              isSelected
                                ? `border-[#1E3A8A] bg-[#1E3A8A]/5`
                                : 'border-slate-200 hover:border-slate-300'
                            } ${provider.bgColor}`}
                          >
                            <Icon className={`h-6 w-6 ${provider.color}`} />
                            <span className="text-[10px] font-medium text-slate-700 text-center">
                              {provider.name}
                            </span>
                            {isSelected && (
                              <Badge className="bg-green-100 text-green-700 text-[8px] mt-1">
                                ✅ Sélectionné
                              </Badge>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {selectedProvider && provider && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs text-green-700 flex items-center gap-2">
                          <FaCheckCircle className="h-4 w-4 text-green-500" />
                          Configuration {provider.name} appliquée
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ============================================ */}
                  {/* INFORMATIONS DU COMPTE */}
                  {/* ============================================ */}
                  <div className="border-b border-slate-200 pb-4">
                    <h3 className="text-sm font-semibold text-[#1E3A8A] mb-3 flex items-center gap-2">
                      <FaUser className="h-4 w-4 text-[#F97316]" />
                      Informations du compte
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="config-email">Adresse email <span className="text-red-500">*</span></Label>
                        <div className="relative mt-1">
                          <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <Input
                            id="config-email"
                            type="email"
                            placeholder="votre@email.com"
                            value={configForm.email}
                            onChange={(e) => setConfigForm({ ...configForm, email: e.target.value })}
                            className="pl-10"
                            required
                            disabled={hasMailAccount}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="config-password">
                          Mot de passe <span className="text-red-500">*</span>
                          <span className="ml-2 text-[10px] text-slate-400 font-normal">
                            (Mot de passe d'application)
                          </span>
                        </Label>
                        <div className="relative mt-1">
                          <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <Input
                            id="config-password"
                            type="password"
                            placeholder="Votre mot de passe d'application"
                            value={configForm.password}
                            onChange={(e) => setConfigForm({ ...configForm, password: e.target.value })}
                            className="pl-10"
                            required={!hasMailAccount}
                            disabled={hasMailAccount}
                          />
                        </div>
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <FaShieldAlt className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-blue-800">🔐 Sécurité</p>
                              <p className="text-[10px] text-blue-700">
                                Utilisez un <strong>mot de passe d'application</strong> (App Password) 
                                et non le mot de passe principal de votre compte email.
                                {selectedProvider && (
                                  <button
                                    type="button"
                                    onClick={() => setShowAppPasswordGuide(!showAppPasswordGuide)}
                                    className="ml-2 text-blue-600 hover:underline font-medium"
                                  >
                                    {showAppPasswordGuide ? 'Masquer le guide' : 'Voir le guide'}
                                  </button>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ============================================ */}
                  {/* GUIDE MOT DE PASSE D'APPLICATION */}
                  {/* ============================================ */}
                  {showAppPasswordGuide && <AppPasswordGuide />}

                  {/* ============================================ */}
                  {/* SERVEURS */}
                  {/* ============================================ */}
                  <div className="border-b border-slate-200 pb-4">
                    <h3 className="text-sm font-semibold text-[#1E3A8A] mb-3 flex items-center gap-2">
                      <FaServer className="h-4 w-4 text-[#F97316]" />
                      Serveurs
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="col-span-2">
                        <Label htmlFor="config-imap-server">Serveur IMAP <span className="text-red-500">*</span></Label>
                        <Input
                          id="config-imap-server"
                          placeholder="imap.gmail.com"
                          value={configForm.imap_server}
                          onChange={(e) => setConfigForm({ ...configForm, imap_server: e.target.value })}
                          required
                          disabled={hasMailAccount}
                        />
                      </div>
                      <div>
                        <Label htmlFor="config-imap-port">Port IMAP</Label>
                        <Input
                          id="config-imap-port"
                          type="number"
                          placeholder="993"
                          value={configForm.imap_port}
                          onChange={(e) => setConfigForm({ ...configForm, imap_port: e.target.value })}
                          required
                          disabled={hasMailAccount}
                        />
                      </div>
                      <div>
                        <Label htmlFor="config-encryption">Chiffrement</Label>
                        <select
                          id="config-encryption"
                          value={configForm.encryption}
                          onChange={(e) => setConfigForm({ ...configForm, encryption: e.target.value })}
                          className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent bg-white"
                          disabled={hasMailAccount}
                        >
                          <option value="tls">TLS</option>
                          <option value="ssl">SSL</option>
                          <option value="none">Aucun</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                      <div className="col-span-2">
                        <Label htmlFor="config-smtp-server">Serveur SMTP <span className="text-red-500">*</span></Label>
                        <Input
                          id="config-smtp-server"
                          placeholder="smtp.gmail.com"
                          value={configForm.smtp_server}
                          onChange={(e) => setConfigForm({ ...configForm, smtp_server: e.target.value })}
                          required
                          disabled={hasMailAccount}
                        />
                      </div>
                      <div>
                        <Label htmlFor="config-smtp-port">Port SMTP</Label>
                        <Input
                          id="config-smtp-port"
                          type="number"
                          placeholder="587"
                          value={configForm.smtp_port}
                          onChange={(e) => setConfigForm({ ...configForm, smtp_port: e.target.value })}
                          required
                          disabled={hasMailAccount}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ============================================ */}
                  {/* OPTIONS AVANCÉES */}
                  {/* ============================================ */}
                  <div className="border-b border-slate-200 pb-4">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex w-full items-center justify-between text-left"
                    >
                      <h3 className="text-sm font-semibold text-[#1E3A8A] flex items-center gap-2">
                        <FaShieldAlt className="h-4 w-4 text-[#F97316]" />
                        Options avancées
                      </h3>
                      <span className="text-slate-400">
                        {showAdvanced ? <FaChevronUp className="h-4 w-4" /> : <FaChevronDown className="h-4 w-4" />}
                      </span>
                    </button>
                    
                    {showAdvanced && (
                      <div className="mt-4 space-y-4">
                        <div>
                          <Label htmlFor="config-max-emails">Emails par synchronisation</Label>
                          <Input
                            id="config-max-emails"
                            type="number"
                            placeholder="50"
                            value={configForm.max_emails_per_sync}
                            onChange={(e) => setConfigForm({ ...configForm, max_emails_per_sync: e.target.value })}
                            disabled={hasMailAccount}
                          />
                          <p className="text-xs text-slate-400 mt-1">Nombre maximum d'emails récupérés à chaque synchronisation</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ============================================ */}
                  {/* CONFIGURATION IA */}
                  {/* ============================================ */}
                  <div className="border-b border-slate-200 pb-4">
                    <h3 className="text-sm font-semibold text-[#1E3A8A] mb-3 flex items-center gap-2">
                      <FaBrain className="h-4 w-4 text-[#F97316]" />
                      Configuration de l'IA (HARVEY)
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="config-prompt-instructions">Instructions personnalisées</Label>
                        <Textarea
                          id="config-prompt-instructions"
                          placeholder="Instructions pour l'IA (ex: Réponds de manière professionnelle, mentionne nos services...)"
                          value={configForm.prompt_instructions}
                          onChange={(e) => setConfigForm({ ...configForm, prompt_instructions: e.target.value })}
                          className="min-h-[80px]"
                        />
                        <p className="text-xs text-slate-400 mt-1">Ces instructions guident l'IA dans la génération des réponses</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="config-prompt-tone">Ton de la réponse</Label>
                          <select
                            id="config-prompt-tone"
                            value={configForm.prompt_tone}
                            onChange={(e) => setConfigForm({ ...configForm, prompt_tone: e.target.value })}
                            className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent bg-white"
                          >
                            <option value="professional">Professionnel</option>
                            <option value="friendly">Amical</option>
                            <option value="technical">Technique</option>
                            <option value="concise">Concis</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="config-prompt-signature">Signature</Label>
                          <Input
                            id="config-prompt-signature"
                            placeholder="L'équipe UNITECH"
                            value={configForm.prompt_signature}
                            onChange={(e) => setConfigForm({ ...configForm, prompt_signature: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="config-prompt-rules">Règles personnalisées (une par ligne)</Label>
                        <Textarea
                          id="config-prompt-rules"
                          placeholder="Ex: Ne jamais mentionner les prix sans accord préalable&#10;Toujours proposer un rendez-vous téléphonique"
                          value={configForm.prompt_custom_rules}
                          onChange={(e) => setConfigForm({ ...configForm, prompt_custom_rules: e.target.value })}
                          className="min-h-[60px]"
                        />
                        <p className="text-xs text-slate-400 mt-1">Ajoutez des règles spécifiques que l'IA doit respecter</p>
                      </div>
                    </div>
                  </div>

                  {/* ============================================ */}
                  {/* BOUTONS */}
                  {/* ============================================ */}
                  <div className="flex flex-wrap gap-3 pt-4">
                    <Button
                      type="submit"
                      className="bg-[#F97316] hover:bg-[#ea580c] text-white font-semibold text-xs sm:text-sm flex-1 sm:flex-none"
                      disabled={configLoading}
                    >
                      {configLoading ? (
                        <>
                          <FaSpinner className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                          Configuration en cours...
                        </>
                      ) : (
                        <>
                          <FaSave className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden xs:inline">Enregistrer la configuration</span>
                          <span className="xs:hidden">Enregistrer</span>
                        </>
                      )}
                    </Button>

                    {hasMailAccount && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={syncEmails}
                        disabled={syncLoading}
                        className="text-xs sm:text-sm"
                      >
                        {syncLoading ? (
                          <FaSpinner className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                        ) : (
                          <FaSync className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                        Synchroniser
                      </Button>
                    )}

                    {hasMailAccount && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => {
                          if (confirm('Voulez-vous vraiment supprimer ce compte mail ?')) {
                            toast.info('Fonctionnalité à implémenter');
                          }
                        }}
                        className="text-xs sm:text-sm"
                      >
                        <FaTrash className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Supprimer
                      </Button>
                    )}
                  </div>

                  {/* Informations du compte existant */}
                  {hasMailAccount && mailAccount && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-start gap-2">
                        <FaInfoCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-blue-800">Compte configuré</p>
                          <p className="text-xs text-blue-700">
                            {mailAccount.email} • {mailAccount.imap_server}:{mailAccount.imap_port}
                          </p>
                          <p className="text-xs text-blue-700">
                            Dernière synchronisation: {mailAccount.last_sync_at ? formatDate(mailAccount.last_sync_at) : 'Jamais'}
                          </p>
                          <p className="text-xs text-blue-700">
                            Statut: {mailAccount.is_connected ? '✅ Connecté' : '❌ Non connecté'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ============================================================
        MODAL DETAIL
        ============================================================ */}
        {showDetail && selectedEmail && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-200 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-[#1E3A8A] truncate">
                  Détail de l'email
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
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-600 mb-2">📧 Email original</h3>
                  <div className="bg-slate-50 rounded-lg p-3 sm:p-4">
                    <p className="text-sm sm:text-base font-medium break-words">{selectedEmail.subject}</p>
                    <p className="text-xs sm:text-sm text-slate-500 break-words">
                      De: {selectedEmail.from_name || selectedEmail.from_email}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-500 break-words">
                      Reçu: {formatDate(selectedEmail.received_at || selectedEmail.created_at)}
                    </p>
                    <div className="mt-3 text-sm sm:text-base text-slate-700 whitespace-pre-wrap break-words">
                      {selectedEmail.body || selectedEmail.body_html || 'Contenu non disponible'}
                    </div>
                  </div>
                </div>

                {/* Réponse générée */}
                {selectedEmail.harvey_response && (
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-600 mb-2">🤖 Réponse générée</h3>
                    <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
                        <Badge className={`${statusColors[selectedEmail.status] || statusColors.pending} text-[10px] sm:text-xs`}>
                          {statusLabels[selectedEmail.status] || selectedEmail.status}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] sm:text-xs">
                          🧠 Confiance: {selectedEmail.harvey_confidence || 0}%
                        </Badge>
                        {selectedEmail.harvey_tone && (
                          <Badge variant="outline" className="text-[10px] sm:text-xs">
                            Ton: {selectedEmail.harvey_tone}
                          </Badge>
                        )}
                      </div>
                      <div className="whitespace-pre-wrap text-sm sm:text-base text-slate-700 break-words max-h-60 overflow-y-auto">
                        {selectedEmail.harvey_response}
                      </div>
                      {selectedEmail.harvey_actions && selectedEmail.harvey_actions.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-slate-500">📌 Actions suggérées:</p>
                          <ul className="text-xs text-slate-600 list-disc list-inside">
                            {selectedEmail.harvey_actions.map((action, idx) => (
                              <li key={idx}>{action}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDetail(false)}
                    className="text-xs sm:text-sm"
                  >
                    Fermer
                  </Button>

                  {selectedEmail.status === 'pending' && (
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm"
                      onClick={() => {
                        updateEmailStatus(selectedEmail.id, 'analyzed');
                        setShowDetail(false);
                      }}
                    >
                      <FaBrain className="mr-1 h-3 w-3" /> Analyser
                    </Button>
                  )}

                  {selectedEmail.status === 'response_ready' && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                      onClick={() => {
                        sendEmail(selectedEmail.id);
                        setShowDetail(false);
                      }}
                    >
                      <FaReply className="mr-1 h-3 w-3" /> Envoyer
                    </Button>
                  )}

                  {selectedEmail.status === 'response_ready' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-orange-600 border-orange-200 hover:bg-orange-50 text-xs sm:text-sm"
                      onClick={() => {
                        regenerateResponse(selectedEmail.id);
                        setShowDetail(false);
                      }}
                    >
                      <FaSync className="mr-1 h-3 w-3" /> Régénérer
                    </Button>
                  )}

                  {!['sent', 'archived'].includes(selectedEmail.status) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50 text-xs sm:text-sm"
                      onClick={() => {
                        archiveEmail(selectedEmail.id);
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
      </div>
    </main>
  );
}