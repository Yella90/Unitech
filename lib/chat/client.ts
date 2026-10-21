// lib/chat/client.ts
// Code commun à la page /chat et au widget flottant : identifiant de
// conversation, appel à HARVEY et préparation du texte pour le Markdown.

const SESSION_KEY = 'unitech_chat_session';

function newSessionId(): string {
  return `chat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Identifiant de la conversation, conservé entre les pages et les
 * rechargements : le serveur s'en sert pour rattacher le lead et limiter
 * les envois de catalogue.
 */
export function getChatSessionId(): string {
  try {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = newSessionId();
    localStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return newSessionId();
  }
}

/** Nouvelle conversation : nouvel identifiant. */
export function resetChatSessionId(): string {
  const id = newSessionId();
  try {
    localStorage.setItem(SESSION_KEY, id);
  } catch {
    // stockage indisponible : l'identifiant ne vaut que pour cette page
  }
  return id;
}

export type HarveyReply = {
  ok: boolean;
  content: string;
  agent: 'harvey' | 'dona' | 'both';
  category?: string;
};

const TECHNICAL_ERROR = 'Je rencontre un problème technique. Veuillez réessayer dans quelques instants.';

/**
 * Envoie un message à HARVEY. Renvoie toujours un texte à afficher : la
 * réponse, ou le message du serveur quand il refuse (limite de messages
 * atteinte, requête invalide), ou un message d'erreur générique.
 */
export async function askHarvey(input: {
  message: string;
  history: Array<{ role: string; content: string }>;
  sessionId: string;
}): Promise<HarveyReply> {
  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, tone: 'friendly' }),
    });
    const data = await response.json().catch(() => null);

    if (response.ok && data?.success && data.content) {
      return { ok: true, content: data.content, agent: data.agent || 'harvey', category: data.category };
    }
    return { ok: false, content: data?.content || TECHNICAL_ERROR, agent: 'harvey' };
  } catch {
    return { ok: false, content: TECHNICAL_ERROR, agent: 'harvey' };
  }
}

/**
 * Le Markdown fusionne les lignes simples et ignore les puces « • » : on
 * convertit les puces en liste et les retours à la ligne en sauts de ligne.
 */
export function toMarkdown(text: string): string {
  const lines = text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/^(\s*)[•●▪]\s?/, '$1- '));

  const isListItem = (line: string) => /^\s*([-*+]|\d+\.)\s/.test(line);

  return lines
    .map((line, i) => {
      const next = lines[i + 1];
      if (next === undefined || line.trim() === '' || next.trim() === '') return line;
      if (isListItem(next)) return line;
      // Texte après une liste : ligne vide pour fermer la liste
      if (isListItem(line)) return `${line}\n`;
      return `${line}  `;
    })
    .join('\n');
}
