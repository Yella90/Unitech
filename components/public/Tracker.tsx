// components/public/Tracker.tsx
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Tracker() {
  const pathname = usePathname();

  useEffect(() => {
    const trackVisit = async () => {
      try {
        console.log('📊 Tracker: Début tracking pour', pathname);

        // Générer un ID de visiteur unique
        let visitorId = localStorage.getItem('visitor_id');
        if (!visitorId) {
          visitorId = crypto.randomUUID();
          localStorage.setItem('visitor_id', visitorId);
          console.log('📊 Nouveau visiteur ID:', visitorId);
        }

        // Générer un ID de session
        let sessionId = sessionStorage.getItem('session_id');
        if (!sessionId) {
          sessionId = crypto.randomUUID();
          sessionStorage.setItem('session_id', sessionId);
          console.log('📊 Nouvelle session ID:', sessionId);
        }

        const userAgent = navigator.userAgent;
        const deviceType = /Mobile|Android|iPhone|iPad/i.test(userAgent) ? 'mobile' : 'desktop';
        const browser = /Firefox|Chrome|Safari|Edge|Opera/i.exec(userAgent)?.[0] || 'unknown';
        const os = /Windows|Mac|Linux|Android|iOS/i.exec(userAgent)?.[0] || 'unknown';

        // Préparer les données
        const visitData = {
          page: pathname || '/',
          visitor_id: visitorId,
          session_id: sessionId,
          referrer: document.referrer || null,
          user_agent: userAgent,
          device_type: deviceType,
          browser: browser,
          os: os,
        };

        console.log('📊 Envoi des données:', visitData);

        // Envoyer les données
        const { data, error } = await supabase
          .from('page_visits')
          .insert([visitData])
          .select();

        if (error) {
          console.error('❌ Erreur tracking:', error);
        } else {
          console.log('✅ Visite enregistrée avec succès:', data);
        }

      } catch (error) {
        console.error('❌ Erreur de tracking:', error);
      }
    };

    // Tracker la visite
    trackVisit();

    // Tracker le temps passé
    let startTime = Date.now();
    const handleBeforeUnload = async () => {
      const duration = Math.round((Date.now() - startTime) / 1000);
      if (duration > 5) {
        try {
          // Mettre à jour la durée
          const { error } = await supabase
            .from('page_visits')
            .update({ duration })
            .eq('visitor_id', localStorage.getItem('visitor_id'))
            .eq('page', pathname)
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (error) {
            console.error('❌ Erreur mise à jour durée:', error);
          } else {
            console.log('✅ Durée mise à jour:', duration, 's');
          }
        } catch (error) {
          console.error('❌ Erreur durée:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pathname]);

  return null; // Ce composant ne rend rien
}