// app/(dashboard)/admin/harvey/page.tsx
// Réponses de HARVEY aux e-mails reçus par les boîtes connectées (table
// emails) : relire, modifier, valider (l'envoi part depuis la boîte d'origine
// via la tâche AlwaysData), régénérer, archiver. L'ancien circuit
// (email_conversations, arrêté le 10 septembre 2026) reste consultable en
// lecture seule dans l'onglet Historique.
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminDb as supabase } from '@/lib/admin-db/client';
import { hasPermission } from '@/lib/auth/rbac';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FaUserTie, FaSync, FaSpinner, FaSearch, FaTimesCircle, FaCheck, FaRedo,
  FaArchive, FaEdit, FaSave, FaTimes, FaExclamationTriangle, FaChevronDown,
  FaChevronUp, FaHistory, FaInbox, FaPaperPlane,
} from 'react-icons/fa';
import { toast, Toaster } from 'sonner';

// ============================================================
// TYPES ET LIBELLÉS
// ============================================================
type EmailRow = {
  id: string;
  client_id: string | null;
  from_email: string;
  from_name: string | null;
  to_email: string | null;
  subject: string | null;
  body: string | null;
  body_text: string | null;
  category: string | null;
  priority: string | null;
  status: string;
  harvey_response: string | null;
  harvey_confidence: number | null;
  harvey_tone: string | null;
  error_message: string | null;
  received_at: string | null;
  sent_at: string | null;
  clients: { company_name: string | null; email: string | null } | null;
};

type LegacyRow = {
  id: string;
  from_email: string;
  to_email: string | null;
  subject: string | null;
  message: string | null;
  body: string | null;
  agent_response: string | null;
  status: string;
  category: string | null;
  confidence: number | null;
  created_at: string;
};

const STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: 'Génération en attente', className: 'bg-yellow-100 text-yellow-800' },
  analyzed: { label: 'Génération en attente', className: 'bg-yellow-100 text-yellow-800' },
  generating: { label: 'Génération…', className: 'bg-yellow-100 text-yellow-800' },
  review: { label: 'À relire', className: 'bg-orange-100 text-orange-800' },
  response_ready: { label: 'Réponse prête', className: 'bg-teal-100 text-teal-800' },
  approved: { label: 'Validée, envoi en cours', className: 'bg-blue-100 text-blue-800' },
  sending: { label: 'Envoi en cours', className: 'bg-blue-100 text-blue-800' },
  sent: { label: 'Envoyée', className: 'bg-green-100 text-green-800' },
  error: { label: "Erreur d'envoi", className: 'bg-red-100 text-red-800' },
  archived: { label: 'Archivée', className: 'bg-slate-100 text-slate-700' },
};

const TABS = [
  { key: 'to_validate', label: 'À valider', statuses: ['review', 'response_ready'] },
  { key: 'in_progress', label: 'En cours', statuses: ['pending', 'analyzed', 'generating', 'approved', 'sending'] },
  { key: 'sent', label: 'Envoyées', statuses: ['sent'] },
  { key: 'error', label: 'Erreurs', statuses: ['error'] },
  { key: 'archived', label: 'Archivées', statuses: ['archived'] },
  { key: 'all', label: 'Toutes', statuses: null },
] as const;

type TabKey = (typeof TABS)[number]['key'] | 'history';

// Textes produits quand aucun fournisseur IA n'a répondu
const FALLBACK_MARKERS = [
  'problème technique pour générer une réponse complète',
  'Notre équipe examine actuellement votre demande',
];

function isFallback(text: string | null): boolean {
  return !!text && FALLBACK_MARKERS.some((marker) => text.includes(marker));
}

// L'ancien circuit stockait parfois le destinataire sous la forme ["a@b.c"]
function normalizeAddress(value: string | null): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.join(', ');
    } catch {
      // valeur laissée telle quelle
    }
  }
  return trimmed;
}

function formatDate(value: string | null): string {
  if (!value) return '';
  return new Date(value).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const EMAIL_COLUMNS =
  'id, client_id, from_email, from_name, to_email, subject, body, body_text, category, priority, status, ' +
  'harvey_response, harvey_confidence, harvey_tone, error_message, received_at, sent_at, clients(company_name, email)';

// ============================================================
// PAGE
// ============================================================
export default function AdminHarveyPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [emails, setEmails] = useState<EmailRow[]>([]);
  const [legacy, setLegacy] = useState<LegacyRow[] | null>(null);
  const [tab, setTab] = useState<TabKey>('to_validate');
  const [mailbox, setMailbox] = useState('all');
  const [onlyFallback, setOnlyFallback] = useState(false);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // ------------------------------------------------------------
  // CHARGEMENT
  // ------------------------------------------------------------
  const loadEmails = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    const { data, error } = await supabase
      .from('emails')
      .select(EMAIL_COLUMNS)
      .order('received_at', { ascending: false })
      .limit(400);
    if (error) {
      if (!silent) toast.error(`Chargement impossible : ${error.message}`);
    } else {
      setEmails((data || []) as unknown as EmailRow[]);
      setLastUpdate(new Date());
    }
    if (!silent) setRefreshing(false);
  }, []);

  const loadLegacy = useCallback(async () => {
    const { data, error } = await supabase
      .from('email_conversations')
      .select('id, from_email, to_email, subject, message, body, agent_response, status, category, confidence, created_at')
      .order('created_at', { ascending: false })
      .limit(300);
    if (error) toast.error(`Historique indisponible : ${error.message}`);
    setLegacy((data || []) as unknown as LegacyRow[]);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/session');
        const session = await res.json();
        if (!session.user || !['admin', 'super_admin', 'developer'].includes(session.user.role)) {
          router.push('/login');
          return;
        }
        setRole(session.user.role);
        setAuthorized(true);
        await loadEmails(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [router, loadEmails]);

  // Rafraîchissement automatique (sauf pendant une modification)
  useEffect(() => {
    if (!authorized) return;
    const timer = setInterval(() => {
      if (!editing) loadEmails(true);
    }, 30_000);
    return () => clearInterval(timer);
  }, [authorized, editing, loadEmails]);

  // ------------------------------------------------------------
  // DONNÉES DÉRIVÉES
  // ------------------------------------------------------------
  const mailboxes = useMemo(
    () => [...new Set(emails.map((e) => normalizeAddress(e.to_email)).filter(Boolean))].sort(),
    [emails]
  );

  // Le rôle developer consulte seulement
  const canSend = hasPermission(role, 'email.send');
  const canRegenerate = hasPermission(role, 'ai.regenerate');

  const fallbackIds = useMemo(
    () => emails.filter((e) => ['review', 'response_ready'].includes(e.status) && isFallback(e.harvey_response)).map((e) => e.id),
    [emails]
  );

  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    for (const t of TABS) {
      result[t.key] = t.statuses ? emails.filter((e) => (t.statuses as readonly string[]).includes(e.status)).length : emails.length;
    }
    return result;
  }, [emails]);

  const visible = useMemo(() => {
    const current = TABS.find((t) => t.key === tab);
    const term = search.trim().toLowerCase();
    return emails.filter((e) => {
      if (current?.statuses && !(current.statuses as readonly string[]).includes(e.status)) return false;
      if (mailbox !== 'all' && normalizeAddress(e.to_email) !== mailbox) return false;
      if (onlyFallback && !isFallback(e.harvey_response)) return false;
      if (!term) return true;
      return [e.from_email, e.from_name, e.subject, e.harvey_response, e.clients?.company_name]
        .some((v) => (v || '').toLowerCase().includes(term));
    });
  }, [emails, tab, mailbox, onlyFallback, search]);

  // ------------------------------------------------------------
  // ACTIONS
  // ------------------------------------------------------------
  const update = async (id: string, fields: Record<string, unknown>, success: string) => {
    setBusy(id);
    const { error } = await supabase
      .from('emails')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id);
    setBusy(null);
    if (error) {
      toast.error(`Échec : ${error.message}`);
      return false;
    }
    toast.success(success);
    await loadEmails(true);
    return true;
  };

  const approve = (email: EmailRow) => {
    if (isFallback(email.harvey_response)) {
      toast.error('Réponse de secours : régénérez-la ou modifiez-la avant de la valider.');
      return;
    }
    update(email.id, { status: 'approved', error_message: null }, "Réponse validée : elle part d'ici 2 minutes depuis la boîte d'origine.");
  };

  const archive = (email: EmailRow) => update(email.id, { status: 'archived' }, 'E-mail archivé.');

  const saveEdit = async () => {
    if (!editing) return;
    const text = editing.text.trim();
    if (!text) {
      toast.error('La réponse ne peut pas être vide.');
      return;
    }
    // La version HTML n'est plus à jour : le texte modifié fait foi
    const ok = await update(editing.id, { harvey_response: text, harvey_response_html: null }, 'Réponse modifiée.');
    if (ok) setEditing(null);
  };

  const regenerate = async (ids: string[], label: string) => {
    if (ids.length === 0) return;
    setBusy(ids.length === 1 ? ids[0] : 'bulk');
    try {
      const res = await fetch('/api/admin/harvey/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || `Erreur ${res.status}`);
      toast.success(`${label} : ${result.queued} e-mail(s) en file. Les nouvelles réponses arrivent d'ici quelques minutes.`);
      await loadEmails(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Régénération impossible');
    } finally {
      setBusy(null);
    }
  };

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // ------------------------------------------------------------
  // RENDU
  // ------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1E3A8A] border-t-transparent" />
      </div>
    );
  }
  if (!authorized) return null;

  return (
    <main className="min-h-screen bg-[#F5F7FB] p-3 sm:p-4 md:p-6">
      <Toaster position="top-right" richColors />
      <div className="mx-auto max-w-6xl">
        {/* En-tête */}
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-xl font-bold text-[#1E3A8A] sm:text-2xl md:text-3xl">
              <FaUserTie className="h-6 w-6 flex-shrink-0 text-[#F97316] sm:h-7 sm:w-7" />
              HARVEY · Réponses aux e-mails
            </h1>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Relisez, modifiez puis validez : la réponse part depuis la boîte qui a reçu l&apos;e-mail.
              {lastUpdate && <span className="text-slate-400"> · Mis à jour à {lastUpdate.toLocaleTimeString('fr-FR')}</span>}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => loadEmails(false)} disabled={refreshing}>
            {refreshing ? <FaSpinner className="mr-2 h-3 w-3 animate-spin" /> : <FaSync className="mr-2 h-3 w-3" />}
            Rafraîchir
          </Button>
        </div>

        {/* Alerte réponses de secours */}
        {fallbackIds.length > 0 && tab !== 'history' && canRegenerate && (
          <div className="mb-4 flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3 text-sm text-amber-900">
              <FaExclamationTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
              <p>
                <strong>{fallbackIds.length} réponse(s) de secours</strong> attendent une validation : l&apos;IA était
                indisponible et HARVEY a enregistré un texte générique. Ne les envoyez pas telles quelles.
              </p>
            </div>
            <div className="flex flex-shrink-0 gap-2">
              <Button size="sm" variant="outline" onClick={() => setOnlyFallback((v) => !v)}>
                {onlyFallback ? 'Tout afficher' : 'Les afficher'}
              </Button>
              <Button
                size="sm"
                className="bg-amber-600 text-white hover:bg-amber-700"
                disabled={busy === 'bulk'}
                onClick={() => {
                  if (confirm(`Régénérer ${fallbackIds.length} réponse(s) de secours ? HARVEY les reprendra d'ici quelques minutes.`)) {
                    regenerate(fallbackIds, 'Réponses de secours');
                  }
                }}
              >
                {busy === 'bulk' ? <FaSpinner className="mr-2 h-3 w-3 animate-spin" /> : <FaRedo className="mr-2 h-3 w-3" />}
                Tout régénérer
              </Button>
            </div>
          </div>
        )}

        {/* Onglets */}
        <div className="mb-3 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <Button
              key={t.key}
              size="sm"
              variant={tab === t.key ? 'default' : 'outline'}
              className={tab === t.key ? 'bg-[#1E3A8A]' : ''}
              onClick={() => setTab(t.key)}
            >
              {t.key === 'to_validate' && <FaInbox className="mr-2 h-3 w-3" />}
              {t.label} ({counts[t.key] ?? 0})
            </Button>
          ))}
          <Button
            size="sm"
            variant={tab === 'history' ? 'default' : 'outline'}
            className={tab === 'history' ? 'bg-slate-700' : ''}
            onClick={() => {
              setTab('history');
              if (legacy === null) loadLegacy();
            }}
          >
            <FaHistory className="mr-2 h-3 w-3" />
            Historique (avant le 10 sept.)
          </Button>
        </div>

        {tab === 'history' ? (
          <LegacyList rows={legacy} expanded={expanded} toggle={toggle} />
        ) : (
          <>
            {/* Filtres */}
            <div className="mb-4 flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un expéditeur, un objet, un texte…"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-8 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
                {search && (
                  <button onClick={() => setSearch('')} aria-label="Effacer la recherche" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <FaTimesCircle className="h-3 w-3" />
                  </button>
                )}
              </div>
              <select
                value={mailbox}
                onChange={(e) => setMailbox(e.target.value)}
                aria-label="Boîte de réception"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="all">Toutes les boîtes</option>
                {mailboxes.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {visible.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-sm text-slate-500">
                  Aucun e-mail dans cette vue.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {visible.map((email) => {
                  const open = expanded.has(email.id);
                  const fallback = isFallback(email.harvey_response);
                  const status = STATUS[email.status] || { label: email.status, className: 'bg-slate-100 text-slate-700' };
                  const actionable = ['review', 'response_ready', 'error'].includes(email.status);
                  const isEditing = editing?.id === email.id;
                  const original = (email.body_text || email.body || '').replace(/<[^>]+>/g, ' ').replace(/\s+\n/g, '\n').trim();

                  return (
                    <Card key={email.id} className={fallback ? 'border-amber-300' : ''}>
                      <CardContent className="p-3 sm:p-4">
                        <button onClick={() => toggle(email.id)} className="flex w-full items-start justify-between gap-3 text-left">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="truncate font-semibold text-slate-900">{email.from_name || email.from_email}</span>
                              <Badge className={status.className}>{status.label}</Badge>
                              {fallback && (
                                <Badge className="bg-amber-100 text-amber-800">
                                  <FaExclamationTriangle className="mr-1 h-3 w-3" /> Réponse de secours
                                </Badge>
                              )}
                              {typeof email.harvey_confidence === 'number' && !fallback && (
                                <span className="text-xs text-slate-400">confiance {email.harvey_confidence} %</span>
                              )}
                            </div>
                            <p className="mt-0.5 truncate text-sm text-slate-700">{email.subject || '(sans objet)'}</p>
                            <p className="mt-0.5 text-xs text-slate-400">
                              {formatDate(email.received_at)} · {email.from_email} → {normalizeAddress(email.to_email)}
                              {email.clients?.company_name ? ` · ${email.clients.company_name}` : ''}
                            </p>
                          </div>
                          {open ? <FaChevronUp className="mt-1 h-3 w-3 flex-shrink-0 text-slate-400" /> : <FaChevronDown className="mt-1 h-3 w-3 flex-shrink-0 text-slate-400" />}
                        </button>

                        {email.status === 'error' && email.error_message && (
                          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{email.error_message}</p>
                        )}

                        {open && (
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <div>
                              <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Message reçu</p>
                              <div className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                                {original || '(vide)'}
                              </div>
                            </div>
                            <div>
                              <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Réponse de HARVEY</p>
                              {isEditing ? (
                                <textarea
                                  value={editing.text}
                                  onChange={(e) => setEditing({ id: email.id, text: e.target.value })}
                                  rows={12}
                                  className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                                />
                              ) : (
                                <div className={`max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg p-3 text-sm ${fallback ? 'bg-amber-50 text-amber-900' : 'bg-blue-50 text-slate-800'}`}>
                                  {email.harvey_response || (['pending', 'analyzed', 'generating'].includes(email.status) ? 'Génération en attente : HARVEY la produit au prochain passage (2 minutes).' : '(aucune réponse)')}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {isEditing ? (
                            <>
                              <Button size="sm" className="bg-[#1E3A8A]" onClick={saveEdit} disabled={busy === email.id}>
                                <FaSave className="mr-2 h-3 w-3" /> Enregistrer
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditing(null)}>
                                <FaTimes className="mr-2 h-3 w-3" /> Annuler
                              </Button>
                            </>
                          ) : (
                            <>
                              {canSend && actionable && email.harvey_response && (
                                <Button
                                  size="sm"
                                  className="bg-green-600 text-white hover:bg-green-700"
                                  disabled={busy === email.id || fallback}
                                  title={fallback ? 'Régénérez ou modifiez la réponse de secours avant de la valider' : undefined}
                                  onClick={() => approve(email)}
                                >
                                  <FaPaperPlane className="mr-2 h-3 w-3" /> Valider et envoyer
                                </Button>
                              )}
                              {canSend && actionable && email.harvey_response && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setExpanded((prev) => new Set(prev).add(email.id));
                                    setEditing({ id: email.id, text: email.harvey_response || '' });
                                  }}
                                >
                                  <FaEdit className="mr-2 h-3 w-3" /> Modifier
                                </Button>
                              )}
                              {canRegenerate && (actionable || email.status === 'archived') && (
                                <Button size="sm" variant="outline" disabled={busy === email.id} onClick={() => regenerate([email.id], 'Régénération')}>
                                  <FaRedo className="mr-2 h-3 w-3" /> Régénérer
                                </Button>
                              )}
                              {canSend && actionable && (
                                <Button size="sm" variant="outline" disabled={busy === email.id} onClick={() => archive(email)}>
                                  <FaArchive className="mr-2 h-3 w-3" /> Archiver
                                </Button>
                              )}
                              {email.status === 'approved' && (
                                <span className="flex items-center text-xs text-blue-700">
                                  <FaCheck className="mr-1 h-3 w-3" /> Envoi dans les 2 minutes
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

// ============================================================
// HISTORIQUE (ancien circuit, lecture seule)
// ============================================================
function LegacyList({ rows, expanded, toggle }: { rows: LegacyRow[] | null; expanded: Set<string>; toggle: (id: string) => void }) {
  return (
    <div>
      <p className="mb-3 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
        Ancien circuit (table email_conversations), arrêté le 10 septembre 2026. Consultation seulement : ces réponses ne
        peuvent plus être envoyées d&apos;ici.
      </p>
      {!rows || rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-slate-500">
            {rows ? 'Aucune conversation dans l’historique.' : 'Chargement de l’historique…'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => {
            const open = expanded.has(row.id);
            return (
              <Card key={row.id}>
                <CardContent className="p-3">
                  <button onClick={() => toggle(row.id)} className="flex w-full items-start justify-between gap-3 text-left">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-semibold text-slate-800">{row.from_email}</span>
                        <Badge className={(STATUS[row.status] || STATUS.archived).className}>
                          {(STATUS[row.status] || { label: row.status }).label}
                        </Badge>
                        {isFallback(row.agent_response) && <Badge className="bg-amber-100 text-amber-800">Réponse de secours</Badge>}
                      </div>
                      <p className="truncate text-sm text-slate-600">{row.subject || '(sans objet)'}</p>
                      <p className="text-xs text-slate-400">
                        {formatDate(row.created_at)} → {normalizeAddress(row.to_email)}
                      </p>
                    </div>
                    {open ? <FaChevronUp className="mt-1 h-3 w-3 text-slate-400" /> : <FaChevronDown className="mt-1 h-3 w-3 text-slate-400" />}
                  </button>
                  {open && (
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                        {row.message || row.body || '(vide)'}
                      </div>
                      <div className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg bg-blue-50 p-3 text-sm text-slate-800">
                        {row.agent_response || '(aucune réponse)'}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
