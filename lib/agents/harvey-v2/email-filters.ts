// lib/agents/harvey-v2/email-filters.ts
// Règles appliquées par HARVEY autour de la génération : ne pas répondre aux
// messages automatiques (notifications, newsletters, alertes) et nettoyer le
// texte produit par l'IA avant de l'enregistrer.

type IncomingEmail = {
  from_email?: string | null;
  body?: string | null;
  body_text?: string | null;
  body_html?: string | null;
  headers?: unknown;
};

// Adresses qui n'attendent jamais de réponse : no-reply, notifications…
// Le mot doit être un segment de la partie locale (« noreply-accounts »,
// « google-maps-noreply ») pour ne pas toucher « newsroom » ou « alertix ».
const AUTOMATED_LOCAL_PART =
  /(^|[-_.+])(no-?reply|do-?not-?reply|ne-?pas-?repondre|mailer-daemon|postmaster|bounces?|notifications?|alerts?|newsletters?|news|mailing|digest|subscribe|unsubscribe|marketing|updates?|welcome)($|[-_.+])/i;

// Sous-domaines réservés aux envois en masse (« x@engage.canva.com ») ; une
// adresse de personne est sur le domaine principal (« x@entreprise.com »)
const BULK_SUBDOMAIN =
  /^(e-?mails?|notify(e-?mail)?|engage|discover|updates?|news(letters?)?|marketing|mailer|mailing|try|promo|offers)\./i;

// Mentions de désinscription présentes dans les envois en nombre
const BULK_BODY =
  /\b(unsubscribe|opt[- ]out|(manage|change|update) (your )?(e-?mail |communication |notification )?(preferences|settings)|you('|’)re receiving this (e-?mail|message)|you are receiving this (e-?mail|message)|se d[ée]sabonner|se d[ée]sinscrire|d[ée]sinscription|d[ée]sabonnement|g[ée]re[rz] (vos|mes) (pr[ée]f[ée]rences|notifications)|vous recevez (cet|ce) (e-?mail|message|courriel) (car|parce))\b/i;

// Texte visible d'un corps HTML (balises retirées, accents usuels décodés)
function htmlText(html: string): string {
  return html
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&eacute;/gi, 'é')
    .replace(/&egrave;/gi, 'è')
    .replace(/&rsquo;|&#39;|&#x27;/gi, '’')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/\s+/g, ' ');
}

// En-têtes posés par les envois automatiques (RFC 3834, listes de diffusion)
function headerValue(headers: unknown, name: string): string | null {
  if (!headers || typeof headers !== 'object') return null;
  for (const [key, value] of Object.entries(headers as Record<string, unknown>)) {
    if (key.toLowerCase() !== name) continue;
    if (value == null) return null;
    return typeof value === 'string' ? value : JSON.stringify(value);
  }
  return null;
}

function automatedHeader(headers: unknown): string | null {
  const autoSubmitted = headerValue(headers, 'auto-submitted');
  if (autoSubmitted && autoSubmitted.trim().toLowerCase() !== 'no') return 'en-tête Auto-Submitted';
  const precedence = headerValue(headers, 'precedence');
  if (precedence && /bulk|list|junk/i.test(precedence)) return 'en-tête Precedence';
  if (headerValue(headers, 'list-unsubscribe') || headerValue(headers, 'list-id')) return 'liste de diffusion';
  if (headerValue(headers, 'x-auto-response-suppress')) return 'en-tête X-Auto-Response-Suppress';
  return null;
}

/**
 * Raison pour laquelle l'e-mail n'appelle pas de réponse, ou null s'il faut
 * répondre. `mailbox` est l'adresse de la boîte qui l'a reçu : un message
 * qu'elle s'envoie à elle-même (alertes d'une application) est ignoré.
 */
export function automatedSenderReason(email: IncomingEmail, mailbox?: string | null): string | null {
  const from = (email.from_email || '').trim().toLowerCase();
  const [localPart = '', domain = ''] = from.split('@');

  if (!from || from === 'unknown') return 'expéditeur inconnu';
  if (mailbox && from === mailbox.trim().toLowerCase()) return 'envoyé par la boîte elle-même';
  if (AUTOMATED_LOCAL_PART.test(localPart)) return 'adresse automatique';
  if (domain.split('.').length >= 3 && BULK_SUBDOMAIN.test(domain)) return 'domaine d’envoi en masse';

  const header = automatedHeader(email.headers);
  if (header) return header;

  const body = email.body_text || email.body || '';
  if (BULK_BODY.test(body) || (email.body_html && BULK_BODY.test(htmlText(email.body_html)))) {
    return 'envoi en nombre (lien de désinscription)';
  }

  return null;
}

// En-têtes utiles conservés à l'enregistrement d'un e-mail reçu. mailparser
// fournit une Map, que JSON transforme en {} : on garde un objet simple.
const KEPT_HEADERS = ['auto-submitted', 'precedence', 'list-unsubscribe', 'list-id', 'x-auto-response-suppress'];

export function headersForStorage(headers: unknown): Record<string, string> {
  const entries: Iterable<[string, unknown]> =
    headers instanceof Map
      ? headers.entries()
      : headers && typeof headers === 'object'
        ? Object.entries(headers as Record<string, unknown>)
        : [];
  const kept: Record<string, string> = {};
  for (const [key, value] of entries) {
    const name = key.toLowerCase();
    if (!KEPT_HEADERS.includes(name) || value == null) continue;
    kept[name] = typeof value === 'string' ? value : JSON.stringify(value);
  }
  return kept;
}

// Ligne d'objet que l'IA place parfois en tête de réponse (« Subject: Re: … »)
const SUBJECT_LINE = /^\s*(\*\*)?\s*(subject|objet|sujet)\s*(\*\*)?\s*:.*$/i;

/** Retire les lignes d'objet placées en tête du texte généré. */
export function cleanGeneratedReply(text: string): string {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  let start = 0;
  while (start < lines.length && (lines[start].trim() === '' || SUBJECT_LINE.test(lines[start]))) start++;
  return lines.slice(start).join('\n').trim();
}
