import { getAppearanceSettings } from '@/services/appearanceService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

type ThemeColors = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  mutedText: string;
  border: string;
  danger: string;
  dangerBackground: string;
  success: string;
  successBackground: string;
  warning: string;
  warningBackground: string;
  inputBackground: string;
  inputText: string;
  inputBorder: string;
  placeholderText: string;
  modalBackground: string;
  optionBackground: string;
  optionPressedBackground: string;
  optionBorder: string;
  backdrop: string;
  primaryButtonBackground: string;
  primaryButtonText: string;
  secondaryButtonBackground: string;
  secondaryButtonText: string;
  operationButtonBackground: string;
  operationButtonText: string;
  dangerButtonBackground: string;
  dangerButtonText: string;
  cancelButtonBackground: string;
  cancelButtonText: string;
  backButtonBackground: string;
  backButtonText: string;
  menuButtonBackground: string;
  menuButtonText: string;
  neutralButtonBackground: string;
  neutralButtonText: string;
  neutralButtonBorder: string;
  disabledButtonBackground: string;
  disabledButtonText: string;
  infoCardBackground: string;
  infoCardText: string;
  infoCardBorder: string;
  calendarSelectedBackground: string;
  calendarSelectedText: string;
  calendarText: string;
  dashboardMetricBackground: string;
  dashboardMetricText: string;
  dashboardAccent: string;
};

export type AppTheme = {
  isDark: boolean;
  colors: ThemeColors;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  density: 'COMPACT' | 'NORMAL';
  buttonStyle: 'ROUNDED' | 'STRAIGHT';
};

const lightColors: ThemeColors = {
  primary: '#111111',
  secondary: '#666666',
  accent: '#2563eb',
  background: '#f5f5f5',
  surface: '#ffffff',
  text: '#111111',
  mutedText: '#666666',
  border: '#dddddd',
  danger: '#b00020',
  dangerBackground: '#fee2e2',
  success: '#d4edda',
  successBackground: '#ecfdf3',
  warning: '#b45309',
  warningBackground: '#fef3c7',
  inputBackground: '#ffffff',
  inputText: '#111111',
  inputBorder: '#dddddd',
  placeholderText: '#777777',
  modalBackground: '#ffffff',
  optionBackground: '#ffffff',
  optionPressedBackground: '#f0f0f0',
  optionBorder: '#eeeeee',
  backdrop: 'rgba(0,0,0,0.35)',
  primaryButtonBackground: '#111111',
  primaryButtonText: '#ffffff',
  secondaryButtonBackground: '#666666',
  secondaryButtonText: '#ffffff',
  operationButtonBackground: '#0f172a',
  operationButtonText: '#ffffff',
  dangerButtonBackground: '#b00020',
  dangerButtonText: '#ffffff',
  cancelButtonBackground: '#6b7280',
  cancelButtonText: '#ffffff',
  backButtonBackground: '#374151',
  backButtonText: '#ffffff',
  menuButtonBackground: '#2563eb',
  menuButtonText: '#ffffff',
  neutralButtonBackground: '#f8fafc',
  neutralButtonText: '#334155',
  neutralButtonBorder: '#cbd5e1',
  disabledButtonBackground: '#e5e7eb',
  disabledButtonText: '#64748b',
  infoCardBackground: '#eef2ff',
  infoCardText: '#1e293b',
  infoCardBorder: '#93c5fd',
  calendarSelectedBackground: '#0f172a',
  calendarSelectedText: '#ffffff',
  calendarText: '#111111',
  dashboardMetricBackground: '#ffffff',
  dashboardMetricText: '#111111',
  dashboardAccent: '#2563eb',
};

const darkColors: ThemeColors = {
  primary: '#111827',
  secondary: '#374151',
  accent: '#60a5fa',
  background: '#0f172a',
  surface: '#111827',
  text: '#f9fafb',
  mutedText: '#cbd5e1',
  border: '#334155',
  danger: '#dc2626',
  dangerBackground: '#450a0a',
  success: '#14532d',
  successBackground: '#052e16',
  warning: '#f59e0b',
  warningBackground: '#451a03',
  inputBackground: '#1f2937',
  inputText: '#f9fafb',
  inputBorder: '#475569',
  placeholderText: '#94a3b8',
  modalBackground: '#111827',
  optionBackground: '#111827',
  optionPressedBackground: '#1f2937',
  optionBorder: '#334155',
  backdrop: 'rgba(0,0,0,0.55)',
  primaryButtonBackground: '#2563eb',
  primaryButtonText: '#ffffff',
  secondaryButtonBackground: '#334155',
  secondaryButtonText: '#f9fafb',
  operationButtonBackground: '#0f172a',
  operationButtonText: '#ffffff',
  dangerButtonBackground: '#dc2626',
  dangerButtonText: '#ffffff',
  cancelButtonBackground: '#475569',
  cancelButtonText: '#ffffff',
  backButtonBackground: '#334155',
  backButtonText: '#f9fafb',
  menuButtonBackground: '#2563eb',
  menuButtonText: '#ffffff',
  neutralButtonBackground: '#1e293b',
  neutralButtonText: '#e2e8f0',
  neutralButtonBorder: '#475569',
  disabledButtonBackground: '#334155',
  disabledButtonText: '#94a3b8',
  infoCardBackground: '#172554',
  infoCardText: '#dbeafe',
  infoCardBorder: '#2563eb',
  calendarSelectedBackground: '#2563eb',
  calendarSelectedText: '#ffffff',
  calendarText: '#f9fafb',
  dashboardMetricBackground: '#1f2937',
  dashboardMetricText: '#f9fafb',
  dashboardAccent: '#60a5fa',
};

const createDefaultTheme = (scheme: ColorSchemeName = 'light'): AppTheme => {
  const isDark = scheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return {
    isDark,
    colors,
    spacing: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 20,
      xl: 28,
    },
    radius: {
      sm: 6,
      md: 10,
      lg: 14,
      xl: 18,
    },
    density: 'NORMAL',
    buttonStyle: 'ROUNDED',
  };
};

type AppThemeContextValue = {
  theme: AppTheme;
  themeMode: 'LIGHT' | 'DARK';
  isLoadingTheme: boolean;
  reloadTheme: () => Promise<void>;
  toggleThemeMode: () => Promise<void>;
  setThemeMode: (mode: 'LIGHT' | 'DARK') => Promise<void>;
};

const AppThemeContext = createContext<AppThemeContextValue>({
  theme: createDefaultTheme('light'),
  themeMode: 'LIGHT',
  isLoadingTheme: false,
  reloadTheme: async () => {},
  toggleThemeMode: async () => {},
  setThemeMode: async () => {},
});

const LOCAL_THEME_MODE_KEY = 'controlRopa.localThemeMode';

const cleanColor = (value?: string | null) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );
  const [theme, setTheme] = useState<AppTheme>(createDefaultTheme(systemScheme));
  const [localThemeMode, setLocalThemeMode] = useState<'LIGHT' | 'DARK' | null>(null);
  const [isLoadingTheme, setIsLoadingTheme] = useState(true);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(LOCAL_THEME_MODE_KEY)
      .then((value) => {
        if (cancelled) return;
        setLocalThemeMode(value === 'DARK' ? 'DARK' : value === 'LIGHT' ? 'LIGHT' : null);
      })
      .catch(() => {
        if (!cancelled) setLocalThemeMode(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    reloadTheme();
  }, [systemScheme, localThemeMode]);

  const setThemeMode = async (mode: 'LIGHT' | 'DARK') => {
    await AsyncStorage.setItem(LOCAL_THEME_MODE_KEY, mode);
    setLocalThemeMode(mode);
  };

  const toggleThemeMode = async () => {
    await setThemeMode(theme.isDark ? 'LIGHT' : 'DARK');
  };

  const reloadTheme = async () => {
    try {
      setIsLoadingTheme(true);
      const settings = await getAppearanceSettings();
      const configuredMode = localThemeMode ?? settings.themeMode ?? 'LIGHT';
      const resolvedScheme =
        configuredMode === 'AUTO'
          ? systemScheme
          : configuredMode === 'DARK'
            ? 'dark'
            : 'light';

      const baseTheme = createDefaultTheme(resolvedScheme);
      const isDark = baseTheme.isDark;

      setTheme({
        ...baseTheme,
        density: settings.densityMode ?? baseTheme.density,
        buttonStyle: settings.buttonStyle ?? baseTheme.buttonStyle,
        spacing:
          settings.densityMode === 'COMPACT'
            ? { xs: 3, sm: 6, md: 10, lg: 14, xl: 22 }
            : baseTheme.spacing,
        radius:
          settings.buttonStyle === 'STRAIGHT'
            ? { sm: 2, md: 2, lg: 2, xl: 2 }
            : baseTheme.radius,
        colors: {
          ...baseTheme.colors,
          primary: cleanColor(settings.primaryColor) ?? baseTheme.colors.primary,
          secondary:
            cleanColor(settings.secondaryColor) ?? baseTheme.colors.secondary,
          mutedText:
            cleanColor(settings.secondaryColor) ?? baseTheme.colors.mutedText,
          accent: cleanColor(settings.accentColor) ?? baseTheme.colors.accent,
          primaryButtonBackground:
            cleanColor(settings.primaryButtonColor) ??
            cleanColor(settings.primaryColor) ??
            baseTheme.colors.primaryButtonBackground,
          primaryButtonText:
            cleanColor(settings.primaryButtonTextColor) ??
            baseTheme.colors.primaryButtonText,
          secondaryButtonBackground:
            cleanColor(settings.secondaryButtonColor) ??
            cleanColor(settings.secondaryColor) ??
            baseTheme.colors.secondaryButtonBackground,
          secondaryButtonText:
            cleanColor(settings.secondaryButtonTextColor) ??
            baseTheme.colors.secondaryButtonText,
          operationButtonBackground:
            cleanColor(settings.operationButtonColor) ??
            baseTheme.colors.operationButtonBackground,
          operationButtonText:
            cleanColor(settings.operationButtonTextColor) ??
            baseTheme.colors.operationButtonText,
          dangerButtonBackground:
            cleanColor(settings.dangerButtonColor) ??
            baseTheme.colors.dangerButtonBackground,
          dangerButtonText:
            cleanColor(settings.dangerButtonTextColor) ??
            baseTheme.colors.dangerButtonText,
          cancelButtonBackground:
            cleanColor(settings.cancelButtonColor) ??
            baseTheme.colors.cancelButtonBackground,
          cancelButtonText:
            cleanColor(settings.cancelButtonTextColor) ??
            baseTheme.colors.cancelButtonText,
          backButtonBackground:
            cleanColor(settings.backButtonColor) ??
            baseTheme.colors.backButtonBackground,
          backButtonText:
            cleanColor(settings.backButtonTextColor) ??
            baseTheme.colors.backButtonText,
          menuButtonBackground:
            cleanColor(settings.menuButtonColor) ??
            baseTheme.colors.menuButtonBackground,
          menuButtonText:
            cleanColor(settings.menuButtonTextColor) ??
            baseTheme.colors.menuButtonText,
          neutralButtonBackground: baseTheme.colors.neutralButtonBackground,
          neutralButtonText: baseTheme.colors.neutralButtonText,
          neutralButtonBorder: baseTheme.colors.neutralButtonBorder,
          disabledButtonBackground: baseTheme.colors.disabledButtonBackground,
          disabledButtonText: baseTheme.colors.disabledButtonText,
          infoCardBackground:
            cleanColor(settings.infoCardBackgroundColor) ??
            baseTheme.colors.infoCardBackground,
          infoCardText:
            cleanColor(settings.infoCardTextColor) ??
            baseTheme.colors.infoCardText,
          infoCardBorder:
            cleanColor(settings.infoCardBorderColor) ??
            baseTheme.colors.infoCardBorder,
          calendarSelectedBackground:
            cleanColor(settings.calendarSelectedColor) ??
            baseTheme.colors.calendarSelectedBackground,
          calendarSelectedText:
            cleanColor(settings.calendarSelectedTextColor) ??
            baseTheme.colors.calendarSelectedText,
          calendarText:
            cleanColor(settings.calendarTextColor) ?? baseTheme.colors.calendarText,
          dashboardMetricBackground:
            cleanColor(settings.dashboardMetricBackgroundColor) ??
            baseTheme.colors.dashboardMetricBackground,
          dashboardMetricText:
            cleanColor(settings.dashboardMetricTextColor) ??
            baseTheme.colors.dashboardMetricText,
          dashboardAccent:
            cleanColor(settings.dashboardAccentColor) ??
            baseTheme.colors.dashboardAccent,
          inputBackground: isDark ? '#1f2937' : '#ffffff',
          inputText: isDark ? '#f9fafb' : '#111111',
          inputBorder: isDark ? '#475569' : '#dddddd',
          placeholderText: isDark ? '#94a3b8' : '#777777',
          modalBackground: isDark ? '#111827' : '#ffffff',
          optionBackground: isDark ? '#111827' : '#ffffff',
          optionPressedBackground: isDark ? '#1f2937' : '#f0f0f0',
          optionBorder: isDark ? '#334155' : '#eeeeee',
        },
      });
    } finally {
      setIsLoadingTheme(false);
    }
  };

  const value = useMemo(
    () => ({
      theme,
      themeMode: (theme.isDark ? 'DARK' : 'LIGHT') as 'LIGHT' | 'DARK',
      isLoadingTheme,
      reloadTheme,
      toggleThemeMode,
      setThemeMode,
    }),
    [theme, isLoadingTheme]
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  return useContext(AppThemeContext);
}
