// lib/consent.ts
// Choix du visiteur sur la mesure d'audience. Les cookies de connexion et le
// stockage du chatbot sont nécessaires au service : ils ne dépendent pas de
// ce choix. Seules les statistiques de visite (Tracker) attendent l'accord.

const KEY = 'unitech_consent';
export const CONSENT_CHANGED = 'unitech-consent-changed';
export const OPEN_CONSENT = 'unitech-open-consent';

export type Consent = { statistics: boolean; at: string };

export function readConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Consent) : null;
  } catch {
    return null;
  }
}

export function saveConsent(statistics: boolean) {
  const consent: Consent = { statistics, at: new Date().toISOString() };
  try {
    localStorage.setItem(KEY, JSON.stringify(consent));
    if (!statistics) {
      // Refus : on retire l'identifiant de mesure d'audience déjà posé
      localStorage.removeItem('visitor_id');
      sessionStorage.removeItem('session_id');
    }
  } catch {
    // stockage indisponible : le choix ne vaut que pour cette page
  }
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED, { detail: consent }));
}

export function statisticsAllowed(): boolean {
  return readConsent()?.statistics === true;
}

/** Rouvre le bandeau (lien « Gérer les cookies »). */
export function openConsentSettings() {
  window.dispatchEvent(new Event(OPEN_CONSENT));
}
