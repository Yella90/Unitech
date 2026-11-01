// contexts/LanguageContext.tsx
'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { DEFAULT_LOCALE, LOCALE_COOKIE, Locale, Messages, messages } from '@/lib/i18n';

interface LanguageContextType {
  locale: Locale;
  t: Messages;
  setLocale: (locale: Locale) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    // Cookie d'un an : le serveur rend la bonne langue dès la prochaine visite
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = next;
  }, []);

  return (
    <LanguageContext.Provider value={{ locale, t: messages[locale], setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  // Hors du fournisseur (ex. tests), on retombe sur le français
  if (!context) {
    return { locale: DEFAULT_LOCALE, t: messages[DEFAULT_LOCALE], setLocale: () => {} };
  }
  return context;
}
