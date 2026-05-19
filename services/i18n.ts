import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from '@/locales/en/common.json';
import esCommon from '@/locales/es/common.json';

export const SUPPORTED_LANGUAGES = ['es', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
const LANGUAGE_KEY = 'app_language';
const canUseStorage = typeof window !== 'undefined';

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

if (canUseStorage) {
  void AsyncStorage.getItem(LANGUAGE_KEY).then((storedLanguage) => {
    if (SUPPORTED_LANGUAGES.includes(storedLanguage as SupportedLanguage)) {
      void i18n.changeLanguage(storedLanguage as SupportedLanguage);
    }
  });
}

export async function changeAppLanguage(language: SupportedLanguage) {
  if (canUseStorage) {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
  }
  return i18n.changeLanguage(language);
}

export default i18n;
