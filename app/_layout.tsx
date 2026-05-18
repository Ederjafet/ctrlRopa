import { AppThemeProvider, useAppTheme } from '@/context/AppThemeContext';
import i18n from '@/services/i18n';
import { StatusBar } from 'expo-status-bar';
import { Stack, useRouter } from 'expo-router';
import { ensureSessionActive, getSession } from '@/services/sessionStorage';
import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import {
  AppState,
  Platform,
  StatusBar as NativeStatusBar,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <I18nextProvider i18n={i18n}>
      <SafeAreaProvider>
        <AppThemeProvider>
          <RootStack />
        </AppThemeProvider>
      </SafeAreaProvider>
    </I18nextProvider>
  );
}

function RootStack() {
  const { theme } = useAppTheme();
  const router = useRouter();

  useEffect(() => {
    const applySystemBars = () => {
      if (Platform.OS !== 'android') return;

      NativeStatusBar.setTranslucent(false);
      NativeStatusBar.setBackgroundColor(theme.colors.background);
      NativeStatusBar.setBarStyle(theme.isDark ? 'light-content' : 'dark-content');
    };

    applySystemBars();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        applySystemBars();
        ensureSessionActive().then(async (active) => {
          const session = await getSession();
          if (!active && !session) {
            router.replace('/login');
          }
        });
      }
    });

    return () => subscription.remove();
  }, [router, theme.colors.background, theme.isDark]);

  return (
    <>
      <StatusBar
        style={theme.isDark ? 'light' : 'dark'}
        backgroundColor={theme.colors.background}
        translucent={false}
      />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: theme.colors.background,
          },
        }}
      />
    </>
  );
}
