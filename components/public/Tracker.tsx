// components/public/Tracker.tsx
'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { CONSENT_CHANGED, statisticsAllowed } from '@/lib/consent';

// Les visites passent par /api/track : la table page_visits n'est plus
// accessible avec la clé anon. Rien n'est mesuré sans l'accord du visiteur.
function send(payload: Record<string, unknown>, keepalive = false) {
  return fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive,
  });
}

export default function Tracker() {
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  // Suit le choix du bandeau cookies (et ses changements)
  useEffect(() => {
    setAllowed(statisticsAllowed());
    const update = () => setAllowed(statisticsAllowed());
    window.addEventListener(CONSENT_CHANGED, update);
    return () => window.removeEventListener(CONSENT_CHANGED, update);
  }, []);

  useEffect(() => {
    if (!allowed) return;
    const page = pathname || '/';
    let visitorId: string | null = null;

    const trackVisit = async () => {
      try {
        // Générer un ID de visiteur unique
        visitorId = localStorage.getItem('visitor_id');
        if (!visitorId) {
          visitorId = crypto.randomUUID();
          localStorage.setItem('visitor_id', visitorId);
        }

        // Générer un ID de session
        let sessionId = sessionStorage.getItem('session_id');
        if (!sessionId) {
          sessionId = crypto.randomUUID();
          sessionStorage.setItem('session_id', sessionId);
        }

        const userAgent = navigator.userAgent;
        const deviceType = /Mobile|Android|iPhone|iPad/i.test(userAgent) ? 'mobile' : 'desktop';
        const browser = /Firefox|Chrome|Safari|Edge|Opera/i.exec(userAgent)?.[0] || 'unknown';
        const os = /Windows|Mac|Linux|Android|iOS/i.exec(userAgent)?.[0] || 'unknown';

        await send({
          type: 'visit',
          page,
          visitor_id: visitorId,
          session_id: sessionId,
          referrer: document.referrer || null,
          device_type: deviceType,
          browser,
          os,
        });
      } catch (error) {
        console.error('❌ Erreur de tracking:', error);
      }
    };

    // Tracker la visite
    trackVisit();

    // Tracker le temps passé (keepalive : la requête survit à la fermeture de l'onglet)
    const startTime = Date.now();
    const handleBeforeUnload = () => {
      const duration = Math.round((Date.now() - startTime) / 1000);
      if (duration > 5 && visitorId) {
        send({ type: 'duration', page, visitor_id: visitorId, duration }, true).catch(() => {});
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pathname, allowed]);

  return null; // Ce composant ne rend rien
}
