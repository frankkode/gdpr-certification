import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import language resources
import en from './locales/en.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import es from './locales/es.json';

// Language resources
const resources = {
  en: {
    translation: en
  },
  de: {
    translation: de
  },
  fr: {
    translation: fr
  },
  es: {
    translation: es
  }
};

i18n
  // Use language detector to detect user's preferred language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,
    // Default language
    fallbackLng: 'en',
    // Debug mode (set to false in production)
    debug: process.env.NODE_ENV === 'development',

    // Language detection options
    detection: {
      // Order of language detection methods
      order: ['localStorage', 'navigator', 'htmlTag'],
      // Cache user language
      caches: ['localStorage'],
      // Check for languages that are similar (en-US -> en)
      checkWhitelist: true
    },

    // Translation options
    interpolation: {
      // React already escapes values
      escapeValue: false,
    },

    // Namespace configuration
    defaultNS: 'translation',
    ns: ['translation'],

    // Supported languages
    supportedLngs: ['en', 'de', 'fr', 'es'],
    
    // Load only supported languages
    nonExplicitSupportedLngs: false,

    // Load languages synchronously
    load: 'languageOnly',

    // Clean code (remove region codes like en-US -> en)
    cleanCode: true,

    // Key separator
    keySeparator: '.',
    
    // Namespace separator
    nsSeparator: ':',

    // React options
    react: {
      // Bind i18n to components
      bindI18n: 'languageChanged',
      // Bind store to components
      bindI18nStore: false,
      // Use React Suspense
      useSuspense: false,
    }
  });

export default i18n;

// Helper function to get current language info
export const getCurrentLanguageInfo = () => {
  const currentLang = i18n.language;
  const languageMap = {
    en: { name: 'English', nativeName: 'English', flag: '🇺🇸' },
    de: { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' }
  };
  
  return languageMap[currentLang as keyof typeof languageMap] || languageMap.en;
};

// Helper function to get all supported languages
export const getSupportedLanguages = () => {
  return [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' }
  ];
};