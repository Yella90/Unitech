// components/public/CookieConsent.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaCookieBite } from 'react-icons/fa';
import { OPEN_CONSENT, readConsent, saveConsent } from '@/lib/consent';

export default function CookieConsent() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Affiché tant que le visiteur n'a pas fait de choix
    if (!readConsent()) setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_CONSENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT, reopen);
  }, []);

  if (!open) return null;

  const choose = (statistics: boolean) => {
    saveConsent(statistics);
    setOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookies et mesure d'audience"
      className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:inset-x-6 sm:p-5"
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex gap-3">
          <FaCookieBite className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#F97316]" aria-hidden />
          <p className="text-sm leading-relaxed text-slate-700">
            Nous utilisons des cookies nécessaires à la connexion et au chatbot. Avec votre accord, nous
            mesurons aussi l&apos;audience du site (pages vues, sans publicité ni partage avec des tiers).{' '}
            <Link href="/cookies" className="font-medium text-[#1E3A8A] underline">
              En savoir plus
            </Link>
          </p>
        </div>
        <div className="flex flex-shrink-0 gap-2">
          <button
            onClick={() => choose(false)}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:flex-none"
          >
            Refuser
          </button>
          <button
            onClick={() => choose(true)}
            className="flex-1 rounded-xl bg-[#1E3A8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#162f58] sm:flex-none"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
