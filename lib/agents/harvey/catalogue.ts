// lib/agents/harvey/catalogue.ts
// Catalogue des formations envoyé par HARVEY quand un visiteur le demande
// dans le chatbot et donne son adresse e-mail.
import type { SupabaseClient } from '@supabase/supabase-js';
import { deposerEmail, envoiDisponible } from '@/lib/email/mail-sortant';

const SITE = 'https://unitech-qvgo.onrender.com';
const CONTACT_EMAIL = 'doumbialayesoma@gmail.com';
const CONTACT_TEL = '+223 90692363';

type Formation = {
  title: string;
  slug: string | null;
  description: string | null;
  duration: string | null;
  level: string | null;
  schedule: string | null;
  price: string | null;
  modules: string[] | null;
};

const CATALOGUE_WORDS = /catalogue|brochure|plaquette/i;
const ASKS_FOR_EMAIL = /e-?mail|adresse/i;
const EMAIL = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

/**
 * Adresse à laquelle envoyer le catalogue, si le message courant en contient
 * une et que le catalogue a été demandé (par le visiteur) ou proposé (par
 * HARVEY, qui attend l'adresse).
 */
export function catalogueRecipient(
  message: string,
  history: Array<{ role: string; content: string }>
): string | null {
  const email = message.match(EMAIL)?.[0];
  if (!email || email.length > 254) return null;

  const lastAssistant = [...history].reverse().find((h) => h.role === 'assistant');
  const offered = !!lastAssistant && CATALOGUE_WORDS.test(lastAssistant.content);
  const askedBefore =
    history.some((h) => h.role === 'user' && CATALOGUE_WORDS.test(h.content)) &&
    !!lastAssistant &&
    ASKS_FOR_EMAIL.test(lastAssistant.content);

  return CATALOGUE_WORDS.test(message) || offered || askedBefore ? email.toLowerCase() : null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function details(f: Formation): Array<[string, string]> {
  const rows: Array<[string, string]> = [];
  if (f.duration) rows.push(['Durée', f.duration]);
  if (f.level) rows.push(['Niveau', f.level]);
  if (f.schedule) rows.push(['Dates / horaires', f.schedule]);
  rows.push(['Tarif', f.price || 'Sur demande']);
  return rows;
}

function buildText(formations: Formation[]): string {
  const blocks = formations.map((f) => {
    const lines = [`■ ${f.title}`];
    if (f.description) lines.push(f.description);
    for (const [label, value] of details(f)) lines.push(`${label} : ${value}`);
    if (f.modules?.length) {
      lines.push('Programme :');
      f.modules.forEach((m, i) => lines.push(`  ${i + 1}. ${m}`));
    }
    if (f.slug) lines.push(`Détails et inscription : ${SITE}/training/${f.slug}`);
    return lines.join('\n');
  });

  return [
    'Bonjour,',
    '',
    'Comme convenu avec HARVEY, voici le catalogue complet des formations UNITECH : programmes détaillés, tarifs et dates.',
    '',
    blocks.join('\n\n'),
    '',
    `Toutes nos formations : ${SITE}/training`,
    `Une question ? Répondez à cet e-mail, écrivez à ${CONTACT_EMAIL} ou appelez le ${CONTACT_TEL}.`,
    '',
    "L'équipe UNITECH",
  ].join('\n');
}

function buildHtml(formations: Formation[]): string {
  const cards = formations
    .map((f) => {
      const rows = details(f)
        .map(
          ([label, value]) =>
            `<tr><td style="padding:4px 12px 4px 0;color:#64748b;white-space:nowrap;vertical-align:top">${escapeHtml(label)}</td><td style="padding:4px 0;color:#0f172a;font-weight:600">${escapeHtml(value)}</td></tr>`
        )
        .join('');
      const modules = f.modules?.length
        ? `<p style="margin:16px 0 6px;font-weight:700;color:#1e3a8a">Programme</p><ol style="margin:0;padding-left:20px;color:#334155;line-height:1.6">${f.modules
            .map((m) => `<li>${escapeHtml(m)}</li>`)
            .join('')}</ol>`
        : '';
      const link = f.slug
        ? `<p style="margin:18px 0 0"><a href="${SITE}/training/${encodeURIComponent(f.slug)}" style="display:inline-block;background:#1e3a8a;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">Voir le détail et s'inscrire</a></p>`
        : '';
      return `<div style="border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:0 0 16px;background:#ffffff">
<h2 style="margin:0 0 8px;font-size:18px;color:#0f172a">${escapeHtml(f.title)}</h2>
${f.description ? `<p style="margin:0 0 12px;color:#475569;line-height:1.6">${escapeHtml(f.description)}</p>` : ''}
<table role="presentation" style="border-collapse:collapse;font-size:14px">${rows}</table>
${modules}
${link}
</div>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Catalogue des formations UNITECH</title></head>
<body style="margin:0;padding:0;background:#f5f7fb;font-family:Segoe UI,Helvetica,Arial,sans-serif">
<div style="max-width:640px;margin:0 auto;padding:24px 16px">
<div style="background:#1e3a8a;border-radius:12px 12px 0 0;padding:24px;color:#ffffff">
<p style="margin:0;font-size:13px;letter-spacing:1px;opacity:.8">UNITECH</p>
<h1 style="margin:6px 0 0;font-size:22px">Catalogue des formations</h1>
</div>
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px;padding:24px">
<p style="margin:0 0 20px;color:#334155;line-height:1.6">Bonjour,<br>Comme convenu avec HARVEY, voici le catalogue complet de nos formations : programmes détaillés, tarifs et dates.</p>
${cards}
<p style="margin:20px 0 0;color:#334155;line-height:1.6">Toutes nos formations : <a href="${SITE}/training" style="color:#1e3a8a">${SITE}/training</a><br>
Une question ? Répondez à cet e-mail, écrivez à <a href="mailto:${CONTACT_EMAIL}" style="color:#1e3a8a">${CONTACT_EMAIL}</a> ou appelez le ${CONTACT_TEL}.</p>
<p style="margin:16px 0 0;color:#0f172a;font-weight:600">L'équipe UNITECH</p>
</div>
</div>
</body></html>`;
}

/** Texte et HTML du catalogue (aussi utile pour un aperçu). */
export function composerCatalogue(formations: Formation[]): { text: string; html: string } {
  return { text: buildText(formations), html: buildHtml(formations) };
}

export type CatalogueResult = 'envoye' | 'indisponible' | 'aucune_formation' | 'erreur';

// Adresses servies récemment (mémoire du processus) : un seul envoi par
// adresse et par heure, même si le visiteur répète sa demande.
const RESEND_DELAY_MS = 60 * 60 * 1000;
const sentAt = new Map<string, number>();

export function recentlySent(email: string): boolean {
  const at = sentAt.get(email);
  return !!at && Date.now() - at < RESEND_DELAY_MS;
}

function markSent(email: string) {
  sentAt.set(email, Date.now());
  if (sentAt.size > 5000) {
    for (const [key, at] of sentAt) if (Date.now() - at >= RESEND_DELAY_MS) sentAt.delete(key);
  }
}

/** Dépose le catalogue dans la file d'envoi commune. */
export async function envoyerCatalogue(db: SupabaseClient, destinataire: string): Promise<CatalogueResult> {
  if (!envoiDisponible()) return 'indisponible';

  const { data, error } = await db
    .from('trainings')
    .select('title, slug, description, duration, level, schedule, price, modules')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Catalogue : lecture des formations', error);
    return 'erreur';
  }
  const formations = (data || []) as Formation[];
  if (formations.length === 0) return 'aucune_formation';

  try {
    await deposerEmail({
      destinataire,
      objet: 'Catalogue des formations UNITECH',
      titre: 'Catalogue des formations',
      message: buildText(formations),
      messageHtml: buildHtml(formations),
    });
    markSent(destinataire);
    return 'envoye';
  } catch {
    return 'erreur';
  }
}

/** Réponse de HARVEY après la tentative d'envoi. */
export function catalogueReply(result: CatalogueResult | 'deja_envoye' | 'limite', email: string): string {
  switch (result) {
    case 'limite':
      return `J'ai déjà envoyé plusieurs catalogues depuis cette conversation. Pour un nouvel envoi, écrivez-nous à ${CONTACT_EMAIL} : l'équipe UNITECH s'en charge. Toutes nos formations sont aussi en ligne : ${SITE}/training`;
    case 'envoye':
      return `C'est parti ! Le catalogue complet de nos formations (programmes détaillés, tarifs et dates) est en route vers **${email}**. Vous devriez le recevoir d'ici quelques minutes ; pensez à vérifier vos courriers indésirables.\n\nVoulez-vous que je vous aide à choisir la formation la plus adaptée à votre profil ?`;
    case 'deja_envoye':
      return `Le catalogue a déjà été envoyé à **${email}** il y a peu. S'il n'est pas arrivé d'ici quelques minutes, vérifiez vos courriers indésirables, ou écrivez-nous à ${CONTACT_EMAIL}.\n\nEn attendant, quelle formation vous intéresse le plus ?`;
    case 'aucune_formation':
      return `Notre catalogue est en cours de mise à jour. J'ai bien noté votre adresse **${email}** : l'équipe UNITECH vous l'enverra dès qu'il sera prêt. Vous pouvez aussi nous joindre au ${CONTACT_TEL}.`;
    default:
      return `Je n'arrive pas à envoyer le catalogue pour le moment. J'ai bien noté votre adresse **${email}** et l'équipe UNITECH vous le fera parvenir. En attendant, toutes nos formations sont ici : ${SITE}/training`;
  }
}
