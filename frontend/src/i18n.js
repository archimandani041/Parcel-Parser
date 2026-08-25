import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/translation.json';
import gu from './locales/gu/translation.json';
import hi from './locales/hi/translation.json';

const savedLang = localStorage.getItem('selectedLanguage') || 'en';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, gu: { translation: gu }, hi: { translation: hi } },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
});

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('selectedLanguage', lng);
});

export default i18n;
