import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { TranslationKey, translations } from './translations';

type Language = 'tr' | 'en' | 'de' | 'fr' | 'pt' | 'ar' | 'zh' | 'ru' | 'uk';

const LANGUAGE_KEY = '@zeitlog_language';

// Cihaz dilini al
const deviceLanguage = getLocales()[0]?.languageCode || 'en';

// Desteklenen diller
const supportedLanguages: Language[] = ['tr', 'en', 'de', 'fr', 'pt', 'ar', 'zh', 'ru', 'uk'];

// Mevcut dil (varsayılan)
let currentLocale: Language = supportedLanguages.includes(deviceLanguage as Language)
  ? (deviceLanguage as Language)
  : 'en';

// Kaydedilmiş dili yükle
export const loadSavedLanguage = async (): Promise<Language> => {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (saved && supportedLanguages.includes(saved as Language)) {
      currentLocale = saved as Language;
      return currentLocale;
    }
  } catch (e) {
    console.error('Error loading language:', e);
  }
  return currentLocale;
};

// Başlangıçta yükle
loadSavedLanguage();

// Basit i18n objesi
const i18n = {
  get locale() {
    return currentLocale;
  },
  set locale(lang: Language) {
    currentLocale = lang;
  },
  t(key: TranslationKey): string {
    const translation = translations[currentLocale]?.[key];
    if (translation) return translation;
    // Fallback to English
    return translations.en[key] || key;
  },
  getLanguage() {
    return currentLocale;
  },
};

export default i18n;

// Dil değiştirme fonksiyonu
export const setLanguage = async (lang: Language) => {
  currentLocale = lang;
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  } catch (e) {
    console.error('Error saving language:', e);
  }
};

// Mevcut dili al
export const getLanguage = () => currentLocale;

// Kısa çeviri fonksiyonu
export const t = (key: TranslationKey) => i18n.t(key);












