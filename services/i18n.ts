import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from '@/locales/en/common.json';
import esCommon from '@/locales/es/common.json';

export const SUPPORTED_LANGUAGES = ['es', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

function resolveInitialLanguage(): SupportedLanguage {
  const deviceLanguage = getLocales()[0]?.languageCode?.toLowerCase();

  return SUPPORTED_LANGUAGES.includes(deviceLanguage as SupportedLanguage)
    ? (deviceLanguage as SupportedLanguage)
    : 'es';
}

void i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  fallbackLng: 'es',
  interpolation: {
    escapeValue: false,
  },
  lng: resolveInitialLanguage(),
  ns: ['common'],
  react: {
    useSuspense: false,
  },
  defaultNS: 'common',
  resources: {
    es: { common: esCommon },
    en: { common: enCommon },
  },
});

export function changeAppLanguage(language: SupportedLanguage) {
  return i18n.changeLanguage(language);
}

export default i18n;
