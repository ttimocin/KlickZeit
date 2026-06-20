import fs from 'fs';
import path from 'path';

import { privacyPolicyContent, termsOfServiceContent } from '../content/legal-content';

const docsDir = path.join(__dirname, '..', 'docs');

const langConfig: Record<
  string,
  { htmlLang: string; privacyFile: string; termsFile: string; termsLinkLabel: string; privacyLinkLabel: string }
> = {
  tr: {
    htmlLang: 'tr',
    privacyFile: 'privacy-policy.html',
    termsFile: 'terms-of-service.html',
    termsLinkLabel: 'Kullanım Koşulları',
    privacyLinkLabel: 'Gizlilik Politikası',
  },
  en: {
    htmlLang: 'en',
    privacyFile: 'privacy-policy-en.html',
    termsFile: 'terms-of-service-en.html',
    termsLinkLabel: 'Terms of Service',
    privacyLinkLabel: 'Privacy Policy',
  },
  de: {
    htmlLang: 'de',
    privacyFile: 'privacy-policy-de.html',
    termsFile: 'terms-of-service-de.html',
    termsLinkLabel: 'Nutzungsbedingungen',
    privacyLinkLabel: 'Datenschutzerklärung',
  },
  fr: {
    htmlLang: 'fr',
    privacyFile: 'privacy-policy-fr.html',
    termsFile: 'terms-of-service-fr.html',
    termsLinkLabel: 'Conditions d\'utilisation',
    privacyLinkLabel: 'Politique de confidentialité',
  },
  pt: {
    htmlLang: 'pt',
    privacyFile: 'privacy-policy-pt.html',
    termsFile: 'terms-of-service-pt.html',
    termsLinkLabel: 'Termos de Serviço',
    privacyLinkLabel: 'Política de Privacidade',
  },
  ar: {
    htmlLang: 'ar',
    privacyFile: 'privacy-policy-ar.html',
    termsFile: 'terms-of-service-ar.html',
    termsLinkLabel: 'شروط الخدمة',
    privacyLinkLabel: 'سياسة الخصوصية',
  },
  zh: {
    htmlLang: 'zh',
    privacyFile: 'privacy-policy-zh.html',
    termsFile: 'terms-of-service-zh.html',
    termsLinkLabel: '服务条款',
    privacyLinkLabel: '隐私政策',
  },
  ru: {
    htmlLang: 'ru',
    privacyFile: 'privacy-policy-ru.html',
    termsFile: 'terms-of-service-ru.html',
    termsLinkLabel: 'Условия использования',
    privacyLinkLabel: 'Политика конфиденциальности',
  },
  uk: {
    htmlLang: 'uk',
    privacyFile: 'privacy-policy-uk.html',
    termsFile: 'terms-of-service-uk.html',
    termsLinkLabel: 'Умови використання',
    privacyLinkLabel: 'Політика конфіденційності',
  },
};


function langSwitcher(type: 'privacy' | 'terms') {
  const flags: Record<string, string> = {
    tr: '🇹🇷 TR',
    en: '🇬🇧 EN',
    de: '🇩🇪 DE',
    fr: '🇫🇷 FR',
    pt: '🇵🇹 PT',
    ar: '🇸🇦 AR',
    zh: '🇨🇳 ZH',
    ru: '🇷🇺 RU',
    uk: '🇺🇦 UK',
  };
  return Object.entries(langConfig)
    .map(([code, cfg]) => {
      const href = type === 'privacy' ? cfg.privacyFile : cfg.termsFile;
      return `<a href="${href}">${flags[code]}</a>`;
    })
    .join('\n            ');
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/https:\/\/github\.com\/ttimocin\/KlickZeit/g, '<a href="https://github.com/ttimocin/KlickZeit" target="_blank">https://github.com/ttimocin/KlickZeit</a>');
}

function renderSections(sections: { title: string; content: string }[]) {
  return sections
    .map(
      (section) => `        <div class="section">
            <h2>${section.title}</h2>
            <p>${escapeHtml(section.content)}</p>
        </div>`
    )
    .join('\n\n');
}

function renderHtml(
  type: 'privacy' | 'terms',
  lang: string,
  doc: { title: string; lastUpdated: string; sections: { title: string; content: string }[] }
) {
  const cfg = langConfig[lang];
  const otherLink = type === 'privacy' ? cfg.termsFile : cfg.privacyFile;
  const otherLabel = type === 'privacy' ? cfg.termsLinkLabel : cfg.privacyLinkLabel;
  const pageTitle = `${doc.title} - KlickZeit`;
  const dirAttr = lang === 'ar' ? ' dir="rtl"' : '';

  return `<!DOCTYPE html>
<html lang="${cfg.htmlLang}"${dirAttr}>

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageTitle}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); }
        .lang-switcher { text-align: right; margin-bottom: 20px; font-size: 14px; }
        .lang-switcher a { color: #10b981; text-decoration: none; margin-left: 12px; }
        .lang-switcher a:hover { text-decoration: underline; }
        h1 { color: #1a1a2e; margin-bottom: 10px; font-size: 32px; }
        .last-updated { color: #666; font-size: 14px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #1a1a2e; font-size: 20px; margin-bottom: 12px; margin-top: 24px; }
        .section p { color: #666; font-size: 15px; line-height: 1.8; white-space: pre-line; }
        .section a { color: #10b981; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #999; font-size: 14px; }
        .footer a { color: #10b981; text-decoration: none; }
        .footer a:hover { text-decoration: underline; }
        @media (prefers-color-scheme: dark) {
            body { background: #121212; color: #fff; }
            .container { background: #1e1e1e; }
            h1, .section h2 { color: #fff; }
            .section p { color: #ccc; }
            .last-updated { color: #888; }
            .footer { border-top-color: #333; color: #666; }
        }
        @media (max-width: 600px) {
            body { padding: 10px; }
            .container { padding: 20px; }
            h1 { font-size: 24px; }
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="lang-switcher">
            ${langSwitcher(type)}
        </div>

        <h1>${doc.title}</h1>
        <p class="last-updated">${doc.lastUpdated}</p>

${renderSections(doc.sections)}

        <div class="footer">
            <p>KlickZeit - TayTek</p>
            <p><a href="https://github.com/ttimocin/KlickZeit">GitHub</a> • <a href="${otherLink}">${otherLabel}</a></p>
        </div>
    </div>
</body>

</html>`;
}

for (const lang of Object.keys(langConfig)) {
  const privacy = privacyPolicyContent[lang];
  const terms = termsOfServiceContent[lang];
  if (!privacy || !terms) continue;

  fs.writeFileSync(
    path.join(docsDir, langConfig[lang].privacyFile),
    renderHtml('privacy', lang, privacy),
    'utf8'
  );
  fs.writeFileSync(
    path.join(docsDir, langConfig[lang].termsFile),
    renderHtml('terms', lang, terms),
    'utf8'
  );
  console.log(`✓ ${lang}`);
}

console.log('Legal HTML docs generated.');
