import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from '@/locales/en/common.json';
import esCommon from '@/locales/es/common.json';

export const SUPPORTED_LANGUAGES = ['es', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
const LANGUAGE_KEY = 'app_language';
const canUseStorage =
  typeof window !== 'undefined' ||
  (typeof navigator !== 'undefined' && navigator.product === 'ReactNative');

function normalizeLanguage(language?: string | null): SupportedLanguage | null {
  const normalized = language?.toLowerCase();
  return SUPPORTED_LANGUAGES.includes(normalized as SupportedLanguage)
    ? (normalized as SupportedLanguage)
    : null;
}

function resolveInitialLanguage(): SupportedLanguage {
  const deviceLanguage = normalizeLanguage(getLocales()[0]?.languageCode);

  return deviceLanguage ?? 'es';
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
    const resolvedLanguage = normalizeLanguage(storedLanguage);
    if (resolvedLanguage) {
      void i18n.changeLanguage(resolvedLanguage);
    }
  });
}

export async function changeAppLanguage(language: SupportedLanguage) {
  await i18n.changeLanguage(language);
  if (canUseStorage) {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
  }
  return language;
}

export default i18n;
