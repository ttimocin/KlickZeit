/** Web sitesi ile paylaşılan dil anahtarı (lang.js → KZ_LANG_KEY). */
export const WEBSITE_LANG_KEY = 'klickzeit_lang';

/** Web sitesi legal-page-lang-init.js / lang.js ile aynı desteklenen diller. */
export const WEBSITE_SUPPORTED_LANGS = [
  'en',
  'tr',
  'de',
  'fr',
  'pt',
  'ru',
  'uk',
  'ar',
  'zh',
  'zh_Hans',
] as const;

export type WebsiteLang = (typeof WEBSITE_SUPPORTED_LANGS)[number];
export type AppLanguage = 'tr' | 'en' | 'de' | 'fr' | 'pt' | 'ar' | 'zh' | 'ru' | 'uk';

export const WEBSITE_BASE_URL =
  process.env.EXPO_PUBLIC_WEBSITE_URL?.trim().replace(/\/$/, '') ||
  'https://klickzeit-webside.ttimocin.workers.dev';

export const LEGAL_PAGES = {
  privacy: 'privacy',
  terms: 'terms',
  impressum: 'impressum',
} as const;

export type LegalPage = keyof typeof LEGAL_PAGES;

export function getWebsiteBaseUrl(): string {
  return WEBSITE_BASE_URL;
}

/** Uygulama dil kodunu web sitesi ?lang= değerine çevirir. */
export function toWebsiteLang(appLang: AppLanguage): WebsiteLang {
  if (WEBSITE_SUPPORTED_LANGS.includes(appLang as WebsiteLang)) {
    return appLang as WebsiteLang;
  }
  return 'en';
}

/** https://domain/privacy?lang=de — web sitesi resolveLang ile uyumlu. */
export function buildLegalPageUrl(page: LegalPage, appLang: AppLanguage): string {
  const baseUrl = getWebsiteBaseUrl();
  const path = LEGAL_PAGES[page];
  const lang = toWebsiteLang(appLang);
  const url = new URL(`${path}`, `${baseUrl}/`);
  url.searchParams.set('lang', lang);
  return url.toString();
}
