import { getLanguage } from '@/i18n';

// Dil kodunu locale'e çevir
const getLocale = (): string => {
  const lang = getLanguage();
  const localeMap: Record<string, string> = {
    tr: 'tr-TR',
    en: 'en-US',
    de: 'de-DE',
    fr: 'fr-FR',
    pt: 'pt-PT',
    ar: 'ar-SA',
    zh: 'zh-CN',
    ru: 'ru-RU',
    uk: 'uk-UA',
  };
  return localeMap[lang] || 'en-US';
};

// Benzersiz ID oluştur
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Tarih formatla (YYYY-MM-DD)
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Saat formatla (HH:mm)
export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString(getLocale(), {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

// Tarih göster (gün ay yıl)
export const displayDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString(getLocale(), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

// Bugün mü kontrol et
export const isToday = (dateStr: string): boolean => {
  return dateStr === formatDate(new Date());
};

// Gün adını getir
export const getDayName = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString(getLocale(), { weekday: 'long' });
};












