import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from '@/locales/en/common.json';
import esCommon from '@/locales/es/common.json';
import frCommon from '@/locales/fr/common.json';
import jaCommon from '@/locales/ja/common.json';
import koCommon from '@/locales/ko/common.json';
import ptBRCommon from '@/locales/pt-BR/common.json';
import zhCommon from '@/locales/zh/common.json';

export const SUPPORTED_LANGUAGES = ['es', 'en', 'pt-BR', 'fr', 'ja', 'zh', 'ko'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
const LANGUAGE_KEY = 'app_language';
const canUseStorage =
  typeof window !== 'undefined' ||
  (typeof navigator !== 'undefined' && navigator.product === 'ReactNative');

function normalizeLanguage(language?: string | null): SupportedLanguage | null {
  const normalized = language?.toLowerCase().replace('_', '-');
  const languageAliases: Record<string, SupportedLanguage> = {
    en: 'en',
    es: 'es',
    fr: 'fr',
    ja: 'ja',
    ko: 'ko',
    pt: 'pt-BR',
    'pt-br': 'pt-BR',
    zh: 'zh',
    'zh-cn': 'zh',
    'zh-hans': 'zh',
  };

  return normalized ? languageAliases[normalized] ?? null : null;
}

function resolveInitialLanguage(): SupportedLanguage {
  const deviceLocale = getLocales()[0];
  const deviceLanguage =
    normalizeLanguage(deviceLocale?.languageTag) ??
    normalizeLanguage(deviceLocale?.languageCode);

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
    'pt-BR': { common: ptBRCommon },
    fr: { common: frCommon },
    ja: { common: jaCommon },
    zh: { common: zhCommon },
    ko: { common: koCommon },
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
