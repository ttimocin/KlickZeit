import { getLanguage, loadSavedLanguage, setLanguage as setI18nLanguage } from '@/i18n';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

type Language = 'tr' | 'en' | 'de';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  forceUpdate: number;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLang] = useState<Language>(getLanguage() as Language);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Uygulama açıldığında kaydedilmiş dili yükle
  useEffect(() => {
    const load = async () => {
      const savedLang = await loadSavedLanguage();
      setLang(savedLang);
      setForceUpdate(prev => prev + 1);
    };
    load();
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    await setI18nLanguage(lang);
    setLang(lang);
    setForceUpdate(prev => prev + 1); // Force re-render
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, forceUpdate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}



