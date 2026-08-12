// app/(dashboard)/admin/emails/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FaEnvelope, 
  FaCheckCircle, 
  FaClock, 
  FaExclamationTriangle,
  FaSync,
  FaRobot,
  FaSpinner,
  FaSearch,
  FaFilter,
  FaTimes,
  FaInbox,
  FaReply,
  FaEye
} from 'react-icons/fa';
import { toast, Toaster } from 'sonner';

type Email = {
  id: string;
  from_email: string;
  to_email: string;
  subject: string;
  body: string;
  status: string;
  category: string;
  ai_analyzed: boolean;
  ai_response: string;
  created_at: string;
  processed_at: string | null;
};

const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { 
    label: 'En attente', 
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: <FaClock className="h-3 w-3" />
  },
  analyzed: { 
    label: 'Analysé', 
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: <FaRobot className="h-3 w-3" />
  },
  sent: { 
    label: 'Envoyé', 
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: <FaReply className="h-3 w-3" />
  },
  error: { 
    label: 'Erreur', 
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: <FaExclamationTriangle className="h-3 w-3" />
  },
  ignored: { 
    label: 'Ignoré', 
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: <FaTimes className="h-3 w-3" />
  },
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

export default function AdminEmailsPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedEmails, setExpandedEmails] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadEmails();
  }, []);

  const loadEmails = async (silent: boolean = false) => {
    if (!silent) {
      setRefreshing(true);
    }

    try {
      const { data, error } = await supabase
        .from('incoming_emails')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Erreur:', error);
        if (!silent) toast.error('Erreur lors du chargement des emails');
        return;
      }

      setEmails(data || []);
      if (!silent) {
        toast.success(`✅ ${data?.length || 0} emails chargés`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      if (!silent) toast.error('Erreur lors du chargement');
    } finally {
      if (!silent) {
        setRefreshing(false);
        setLoading(false);
      }
    }
  };

  const processEmails = async () => {
    try {
      setProcessing(true);
      toast.info('🔄 Traitement des emails en cours...');
      
      const response = await fetch('/api/emails/process', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(`✅ ${data.processed || 0} emails traités`);
        await loadEmails(true);
      } else {
        toast.error(data.error || 'Erreur lors du traitement');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du traitement');
    } finally {
      setProcessing(false);
    }
  };

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedEmails);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedEmails(newSet);
  };

  // Filtrage
  const getFilteredEmails = () => {
    let filtered = emails;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(e => e.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(e => e.category === categoryFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(e => 
        e.from_email.toLowerCase().includes(term) ||
        e.subject.toLowerCase().includes(term) ||
        (e.body && e.body.toLowerCase().includes(term)) ||
        (e.ai_response && e.ai_response.toLowerCase().includes(term))
      );
    }

    return filtered;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setShowFilters(false);
  };

  const filteredEmails = getFilteredEmails();
  const hasActiveFilters = searchTerm || statusFilter !== 'all' || categoryFilter !== 'all';

  // Statistiques
  const total = emails.length;
  const pending = emails.filter(e => e.status === 'pending').length;
  const analyzed = emails.filter(e => e.ai_analyzed).length;
  const sent = emails.filter(e => e.status === 'sent').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] p-4">
        <div className="h-10 w-10 sm:h-12 sm:w-12 animate-spin rounded-full border-4 border-[#1E3A8A] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F7FB] p-3 sm:p-4 md:p-6">
      <Toaster position="top-right" richColors />
      
      <div className="mx-auto max-w-7xl">
        {/* En-tête responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1E3A8A] flex flex-wrap items-center gap-2 sm:gap-3">
              <FaEnvelope className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-[#F97316] flex-shrink-0" />
              <span className="truncate">Gestion des Emails</span>
              {refreshing && (
                <FaSpinner className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-[#F97316] flex-shrink-0" />
              )}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
              Suivez et analysez les emails entrants
            </p>
          </div>
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <Button 
              onClick={processEmails} 
              disabled={processing} 
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm"
            >
              {processing ? (
                <FaSpinner className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
              ) : (
                <FaSync className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              )}
              <span className="hidden xs:inline">{processing ? 'Traitement...' : 'Traiter les emails'}</span>
              <span className="xs:hidden">⚡</span>
            </Button>
            <Button 
              onClick={() => loadEmails(false)} 
              variant="outline"
              size="sm"
              disabled={refreshing}
              className="text-xs sm:text-sm"
            >
              {refreshing ? (
                <FaSpinner className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
              ) : (
                <FaSync className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Statistiques responsive */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Total</p>
                  <p className="text-base sm:text-lg md:text-xl font-bold text-[#1E3A8A]">{total}</p>
                </div>
                <FaInbox className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-[#F97316]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">En attente</p>
                  <p className="text-base sm:text-lg md:text-xl font-bold text-yellow-600">{pending}</p>
                </div>
                <FaClock className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Analysés par IA</p>
                  <p className="text-base sm:text-lg md:text-xl font-bold text-blue-600">{analyzed}</p>
                </div>
                <FaRobot className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs text-slate-500">Envoyés</p>
                  <p className="text-base sm:text-lg md:text-xl font-bold text-green-600">{sent}</p>
                </div>
                <FaReply className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex flex-col xs:flex-row gap-2">
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
                  <FaTimes className="h-3 w-3 sm:h-4 sm:w-4" />
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
              {hasActiveFilters && (
                <Badge className="ml-2 bg-[#F97316] text-white text-[10px]">
                  !
                </Badge>
              )}
            </Button>
          </div>

          {/* Filtres */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={statusFilter === 'all' && categoryFilter === 'all' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => { setStatusFilter('all'); setCategoryFilter('all'); }}
                className={`text-xs ${statusFilter === 'all' && categoryFilter === 'all' ? 'bg-[#1E3A8A]' : ''}`}
              >
                Tous ({total})
              </Button>
              {Object.entries(statusMap).map(([status, config]) => {
                const count = emails.filter(e => e.status === status).length;
                return (
                  <Button 
                    key={status}
                    variant={statusFilter === status ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
                    className={`text-xs ${statusFilter === status ? 'bg-[#1E3A8A]' : ''}`}
                  >
                    {config.icon}
                    <span className="ml-1 hidden xs:inline">{config.label}</span>
                    <span className="ml-1">({count})</span>
                  </Button>
                );
              })}
              <div className="w-px h-6 bg-slate-200 hidden lg:block" />
              {Object.entries(categoryColors).map(([category, color]) => {
                const count = emails.filter(e => e.category === category).length;
                if (count === 0) return null;
                return (
                  <Button 
                    key={category}
                    variant={categoryFilter === category ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setCategoryFilter(categoryFilter === category ? 'all' : category)}
                    className={`text-xs ${categoryFilter === category ? 'bg-[#1E3A8A]' : ''}`}
                  >
                    <span className={`inline-block h-2 w-2 rounded-full mr-1 ${color.split(' ')[0]}`} />
                    {category} ({count})
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Liste des emails */}
        <Card className="border-0 sm:border shadow-sm sm:shadow-md">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-sm sm:text-lg flex flex-wrap items-center gap-2">
              <FaEnvelope className="h-4 w-4 sm:h-5 sm:w-5 text-[#F97316]" />
              <span>Emails récents</span>
              <Badge variant="secondary" className="text-[10px] sm:text-xs">
                {filteredEmails.length}
              </Badge>
              {hasActiveFilters && (
                <Badge variant="outline" className="text-[10px] sm:text-xs">
                  Filtrés
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            {filteredEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <FaInbox className="h-12 w-12 mb-3 text-slate-300" />
                <p className="text-sm font-medium">Aucun email</p>
                <p className="text-xs">
                  {hasActiveFilters ? 'Aucun email ne correspond aux filtres' : 'Les emails apparaîtront ici'}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4">
                    Réinitialiser les filtres
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {filteredEmails.slice(0, 20).map((email) => {
                  const status = statusMap[email.status] || statusMap.pending;
                  const isExpanded = expandedEmails.has(email.id);
                  const categoryColor = categoryColors[email.category] || categoryColors.other;
                  
                  return (
                    <div 
                      key={email.id} 
                      className="border-b border-slate-100 pb-3 sm:pb-4 last:border-0 hover:bg-slate-50/50 rounded-lg p-2 sm:p-3 transition"
                    >
                      <div className="flex flex-col gap-2">
                        {/* En-tête de l'email */}
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                              <span className="font-semibold text-slate-800 text-sm sm:text-base truncate max-w-[120px] xs:max-w-[200px] sm:max-w-[300px]">
                                {email.from_email}
                              </span>
                              <Badge className={`${status.color} text-[8px] sm:text-[10px] flex-shrink-0`}>
                                <span className="flex items-center gap-1">
                                  {status.icon}
                                  <span className="hidden xs:inline">{status.label}</span>
                                </span>
                              </Badge>
                              {email.ai_analyzed && (
                                <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[8px] sm:text-[10px] flex-shrink-0">
                                  <FaRobot className="mr-0.5 sm:mr-1 h-2 w-2 sm:h-3 sm:w-3" />
                                  <span className="hidden xs:inline">IA</span>
                                </Badge>
                              )}
                              {email.category && (
                                <Badge className={`${categoryColor} text-[8px] sm:text-[10px] flex-shrink-0`}>
                                  {email.category}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm font-medium text-slate-700 truncate mt-0.5">
                              {email.subject}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpand(email.id)}
                            className="flex-shrink-0 h-6 w-6 sm:h-8 sm:w-8 p-0"
                          >
                            <FaEye className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>

                        {/* Corps de l'email */}
                        <div className={`text-xs sm:text-sm text-slate-600 ${isExpanded ? '' : 'line-clamp-2'}`}>
                          {email.body}
                        </div>

                        {/* Réponse IA (si disponible) */}
                        {email.ai_response && isExpanded && (
                          <div className="mt-2 p-2 sm:p-3 bg-purple-50 rounded-lg text-xs sm:text-sm text-slate-600 border border-purple-200">
                            <span className="font-medium text-purple-700 flex items-center gap-1">
                              <FaRobot className="h-3 w-3" />
                              Réponse IA :
                            </span>
                            <span className="ml-1">{email.ai_response}</span>
                          </div>
                        )}

                        {/* Métadonnées */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-slate-400 mt-0.5">
                          <span>📅 {new Date(email.created_at).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                          {email.processed_at && (
                            <span>✅ Traité le {new Date(email.processed_at).toLocaleString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                          )}
                        </div>

                        {/* Actions - expandé */}
                        {isExpanded && (
                          <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-slate-100">
                            <Button size="sm" variant="outline" className="text-xs">
                              <FaReply className="mr-1 h-3 w-3" />
                              Répondre
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50">
                              <FaRobot className="mr-1 h-3 w-3" />
                              Analyser avec IA
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {filteredEmails.length > 20 && (
                  <div className="text-center text-xs sm:text-sm text-slate-400 pt-2">
                    + {filteredEmails.length - 20} emails supplémentaires
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}