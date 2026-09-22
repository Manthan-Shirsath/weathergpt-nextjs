"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SupportedLanguage, translations, TranslationKeys } from './translations';

interface LanguageContextProps {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: TranslationKeys;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('skycast-language') as SupportedLanguage;
    if (saved && (saved === 'en' || saved === 'mr')) {
      // eslint-disable-next-line
      setLanguageState(saved);
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('skycast-language', lang);
  };

  // Prevent hydration mismatch by using English initially on server
  const currentLang = mounted ? language : 'en';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[currentLang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
