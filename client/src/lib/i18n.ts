import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation resources
import fr from '../locales/fr.json';
import en from '../locales/en.json';
import ar from '../locales/ar.json';

export const supportedLanguages = ['fr', 'en', 'ar'] as const;
export type SupportedLanguage = typeof supportedLanguages[number];

export const languageNames: Record<SupportedLanguage, string> = {
  fr: 'Français',
  en: 'English',
  ar: 'العربية',
};

export const languageFlags: Record<SupportedLanguage, string> = {
  fr: '🇫🇷',
  en: '🇬🇧',
  ar: '🇩🇿',
};

export const rtlLanguages: SupportedLanguage[] = ['ar'];

export function isRTL(lang: string): boolean {
  return rtlLanguages.includes(lang as SupportedLanguage);
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      ar: { translation: ar },
    },
    fallbackLng: 'fr',
    supportedLngs: supportedLanguages as unknown as string[],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'algerac-lang',
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false,
    },
  });

// Set document direction on language change
i18n.on('languageChanged', (lng) => {
  const dir = isRTL(lng) ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
  
  // Add/remove RTL class for Tailwind
  if (isRTL(lng)) {
    document.documentElement.classList.add('rtl');
  } else {
    document.documentElement.classList.remove('rtl');
  }
});

// Initialize direction on load
const currentLng = i18n.language || 'fr';
document.documentElement.dir = isRTL(currentLng) ? 'rtl' : 'ltr';
document.documentElement.lang = currentLng;

export default i18n;
