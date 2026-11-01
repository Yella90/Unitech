// components/public/ManageCookiesButton.tsx
'use client';

import { openConsentSettings } from '@/lib/consent';
import { useLanguage } from "@/contexts/LanguageContext";

export default function ManageCookiesButton({ variant = 'button' }: { variant?: 'button' | 'link' }) {
  const { t } = useLanguage();
  if (variant === 'link') {
    return (
      <button type="button" onClick={openConsentSettings} className="text-left hover:text-[#1E3A8A] transition">
        {t.footer.manageCookies}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={openConsentSettings}
      className="rounded-xl bg-[#1E3A8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#162f58]"
    >
      {t.cookies.manageChoices}
    </button>
  );
}
