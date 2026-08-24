// app/(dashboard)/admin/leads/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { leadManagement } from '@/lib/services/LeadManagementService';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  FaUsers, 
  FaUserPlus, 
  FaCheckCircle, 
  FaClock, 
  FaEye,
  FaSearch,
  FaSpinner,
  FaSync,
  FaEnvelope,
  FaPhone,
  FaBuilding,
  FaTimes,
  FaMoneyBillWave,
  FaCalendarAlt
} from 'react-icons/fa';
import { toast } from 'sonner';

// ============================================================
// TYPES
// ============================================================

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

const statusColors: Record<LeadStatus, string> = {
  new: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  contacted: 'bg-blue-100 text-blue-700 border-blue-200',
  qualified: 'bg-green-100 text-green-700 border-green-200',
  proposal: 'bg-purple-100 text-purple-700 border-purple-200',
  negotiation: 'bg-orange-100 text-orange-700 border-orange-200',
  won: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  lost: 'bg-red-100 text-red-700 border-red-200',
};

const statusLabels: Record<LeadStatus, string> = {
  new: 'Nouveau',
  contacted: 'Contacté',
  qualified: 'Qualifié',
  proposal: 'Devis',
  negotiation: 'Négociation',
  won: 'Gagné',
  lost: 'Perdu',
};

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [stats, setStats] = useState({ 
    total: 0, 
    newLeads: 0, 
    contacted: 0, 
    qualified: 0, 
    proposal: 0, 
    negotiation: 0, 
    won: 0, 
    lost: 0 
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (silent: boolean = false) => {
    if (!silent) setRefreshing(true);

    try {
      let query = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLeads(data || []);

      const statsData = await leadManagement.getStats();
      setStats(statsData);

      if (!silent) {
        toast.success(`✅ ${data?.length || 0} leads chargés`);
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      if (!silent) toast.error('Erreur lors du chargement');
    } finally {
      if (!silent) {
        setRefreshing(false);
        setLoading(false);
      }
    }
  };

  const updateStatus = async (id: string, status: LeadStatus) => {
    try {
      const result = await leadManagement.updateLead(id, { status });
      if (result) {
        toast.success(`Statut mis à jour: ${statusLabels[status]}`);
        loadData(true);
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const viewLead = (lead: any) => {
    setSelectedLead(lead);
  };

  const closeModal = () => {
    setSelectedLead(null);
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1E3A8A] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A8A] flex items-center gap-2">
            <FaUsers className="h-6 w-6 text-[#F97316]" />
            Gestion des Leads
          </h1>
          <p className="text-sm text-slate-500">Suivez et gérez vos prospects</p>
        </div>
        <Button onClick={() => loadData()} disabled={refreshing} className="flex-shrink-0">
          {refreshing ? <FaSpinner className="mr-2 h-4 w-4 animate-spin" /> : <FaSync className="mr-2 h-4 w-4" />}
          Rafraîchir
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total</p>
                <p className="text-2xl font-bold text-[#1E3A8A]">{stats.total}</p>
              </div>
              <FaUsers className="h-8 w-8 text-[#1E3A8A]/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Nouveaux</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.newLeads}</p>
              </div>
              <FaUserPlus className="h-8 w-8 text-yellow-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Qualifiés</p>
                <p className="text-2xl font-bold text-green-600">{stats.qualified}</p>
              </div>
              <FaCheckCircle className="h-8 w-8 text-green-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Gagnés</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.won}</p>
              </div>
              <FaCheckCircle className="h-8 w-8 text-emerald-500/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un lead..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
        >
          <option value="all">Tous les statuts</option>
          <option value="new">Nouveau</option>
          <option value="contacted">Contacté</option>
          <option value="qualified">Qualifié</option>
          <option value="proposal">Devis</option>
          <option value="negotiation">Négociation</option>
          <option value="won">Gagné</option>
          <option value="lost">Perdu</option>
        </select>
      </div>

      {/* Liste des leads */}
      <div className="space-y-4">
        {leads.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <FaUsers className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Aucun lead trouvé</p>
          </div>
        ) : (
          leads.map((lead) => (
            <Card key={lead.id} className="hover:shadow-md transition">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-800">
                        {lead.name || 'Anonyme'}
                      </h3>
                      <Badge className={statusColors[lead.status as LeadStatus] || 'bg-gray-100'}>
                        {statusLabels[lead.status as LeadStatus] || lead.status}
                      </Badge>
                    </div>
                    <div className="mt-1 space-y-0.5 text-sm text-slate-500">
                      {lead.email && (
                        <p className="flex items-center gap-1">
                          <FaEnvelope className="h-3 w-3" />
                          {lead.email}
                        </p>
                      )}
                      {lead.phone && (
                        <p className="flex items-center gap-1">
                          <FaPhone className="h-3 w-3" />
                          {lead.phone}
                        </p>
                      )}
                      {lead.company && (
                        <p className="flex items-center gap-1">
                          <FaBuilding className="h-3 w-3" />
                          {lead.company}
                        </p>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <FaClock className="h-3 w-3" />
                        {new Date(lead.created_at).toLocaleString('fr-FR')}
                      </span>
                      <span>
                        {lead.messages?.length || 0} messages
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewLead(lead)}
                      className="text-xs"
                    >
                      <FaEye className="mr-1 h-3 w-3" />
                      Voir
                    </Button>
                    <select
                      value={lead.status}
                      onChange={(e) => updateStatus(lead.id, e.target.value as LeadStatus)}
                      className="text-sm border rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                    >
                      <option value="new">Nouveau</option>
                      <option value="contacted">Contacté</option>
                      <option value="qualified">Qualifié</option>
                      <option value="proposal">Devis</option>
                      <option value="negotiation">Négociation</option>
                      <option value="won">Gagné</option>
                      <option value="lost">Perdu</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal des détails avec Markdown */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeModal}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#1E3A8A]">Détails du lead</h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-lg">
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Informations du lead */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Nom</p>
                  <p className="font-medium">{selectedLead.name || 'Anonyme'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Statut</p>
                  <Badge className={statusColors[selectedLead.status as LeadStatus] || 'bg-gray-100'}>
                    {statusLabels[selectedLead.status as LeadStatus] || selectedLead.status}
                  </Badge>
                </div>
                {selectedLead.email && (
                  <div>
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="font-medium">{selectedLead.email}</p>
                  </div>
                )}
                {selectedLead.phone && (
                  <div>
                    <p className="text-sm text-slate-500">Téléphone</p>
                    <p className="font-medium">{selectedLead.phone}</p>
                  </div>
                )}
                {selectedLead.company && (
                  <div>
                    <p className="text-sm text-slate-500">Entreprise</p>
                    <p className="font-medium">{selectedLead.company}</p>
                  </div>
                )}
                {selectedLead.interest && (
                  <div>
                    <p className="text-sm text-slate-500">Intérêt</p>
                    <p className="font-medium text-[#F97316]">{selectedLead.interest}</p>
                  </div>
                )}
                {selectedLead.budget && (
                  <div>
                    <p className="text-sm text-slate-500">Budget</p>
                    <p className="font-medium">{selectedLead.budget}</p>
                  </div>
                )}
              </div>

              {/* Conversation avec Markdown */}
              <div>
                <p className="text-sm text-slate-500 mb-2">Conversation</p>
                <div className="bg-slate-50 rounded-lg p-4 max-h-64 overflow-y-auto space-y-3">
                  {selectedLead.messages?.map((msg: any, index: number) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[90%] px-3 py-2 rounded-lg ${
                        msg.role === 'user' 
                          ? 'bg-[#1E3A8A] text-white' 
                          : 'bg-white border border-slate-200'
                      }`}>
                        {msg.role === 'assistant' ? (
                          <div className="text-sm leading-relaxed">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                // ✅ Texte en gras
                                strong: ({ children }) => (
                                  <strong className="font-bold text-[#1E3A8A]">{children}</strong>
                                ),
                                // ✅ Listes
                                ul: ({ children }) => (
                                  <ul className="list-disc pl-4 my-1 space-y-0.5">{children}</ul>
                                ),
                                ol: ({ children }) => (
                                  <ol className="list-decimal pl-4 my-1 space-y-0.5">{children}</ol>
                                ),
                                li: ({ children }) => (
                                  <li className="mb-0.5">{children}</li>
                                ),
                                // ✅ Paragraphes
                                p: ({ children }) => (
                                  <span className="block my-1">{children}</span>
                                ),
                                // ✅ Liens
                                a: ({ href, children }) => (
                                  <a 
                                    href={href} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-[#1E3A8A] underline hover:text-[#F97316] transition-colors"
                                  >
                                    {children}
                                  </a>
                                ),
                                // ✅ Titres
                                h1: ({ children }) => (
                                  <h1 className="text-lg font-bold text-[#1E3A8A] my-2">{children}</h1>
                                ),
                                h2: ({ children }) => (
                                  <h2 className="text-base font-semibold text-[#1E3A8A] my-1.5">{children}</h2>
                                ),
                                h3: ({ children }) => (
                                  <h3 className="text-sm font-semibold text-[#1E3A8A] my-1">{children}</h3>
                                ),
                                // ✅ Bloc de code
                                code: ({ children }) => (
                                  <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono">
                                    {children}
                                  </code>
                                ),
                                // ✅ Blockquote
                                blockquote: ({ children }) => (
                                  <blockquote className="border-l-4 border-[#1E3A8A] pl-3 my-2 text-slate-600 italic">
                                    {children}
                                  </blockquote>
                                ),
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <span className="text-sm">{msg.content}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}