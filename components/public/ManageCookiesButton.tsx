// components/public/ManageCookiesButton.tsx
'use client';

import { openConsentSettings } from '@/lib/consent';

export default function ManageCookiesButton({ variant = 'button' }: { variant?: 'button' | 'link' }) {
  if (variant === 'link') {
    return (
      <button type="button" onClick={openConsentSettings} className="text-left hover:text-[#1E3A8A] transition">
        Gérer les cookies
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={openConsentSettings}
      className="rounded-xl bg-[#1E3A8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#162f58]"
    >
      Gérer mes choix
    </button>
  );
}
