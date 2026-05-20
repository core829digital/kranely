import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.js';
import it from './locales/it.js';
import fr from './locales/fr.js';
import es from './locales/es.js';
import de from './locales/de.js';

const resources = {
  en: { translation: en },
  it: { translation: it },
  fr: { translation: fr },
  es: { translation: es },
  de: { translation: de },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'it', 'fr', 'es', 'de'],
    lng: localStorage.getItem('i18nextLng') || 'it', // Default to Italian
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// Force set the language from localStorage on init
const savedLang = localStorage.getItem('i18nextLng');
if (savedLang && savedLang !== i18n.language) {
  i18n.changeLanguage(savedLang);
}

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English',  flag: '🇬🇧' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español',  flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch',  flag: '🇩🇪' },
];

export default i18n;
