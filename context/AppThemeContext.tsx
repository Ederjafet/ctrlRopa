import { getAppearanceSettings } from '@/services/appearanceService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

type ThemeColors = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  backgroundElevated: string;
  surface: string;
  surfaceAlt: string;
  surfaceElevated: string;
  surfaceMuted: string;
  text: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnPrimary: string;
  textOnAccent: string;
  mutedText: string;
  border: string;
  borderSubtle: string;
  borderStrong: string;
  danger: string;
  dangerBackground: string;
  success: string;
  successBackground: string;
  warning: string;
  warningBackground: string;
  accentSoft: string;
  inputBackground: string;
  inputText: string;
  inputBorder: string;
  placeholderText: string;
  inputPlaceholder: string;
  disabledBackground: string;
  disabledText: string;
  focusRing: string;
  overlay: string;
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
  primary: '#0f172a',
  secondary: '#475569',
  accent: '#2563eb',
  background: '#f8fafc',
  backgroundElevated: '#eef2f7',
  surface: '#ffffff',
  surfaceAlt: '#f8fafc',
  surfaceElevated: '#ffffff',
  surfaceMuted: '#f1f5f9',
  text: '#0f172a',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#64748b',
  textOnPrimary: '#ffffff',
  textOnAccent: '#ffffff',
  mutedText: '#64748b',
  border: '#e2e8f0',
  borderSubtle: '#edf2f7',
  borderStrong: '#cbd5e1',
  danger: '#b91c1c',
  dangerBackground: '#fef2f2',
  success: '#15803d',
  successBackground: '#ecfdf5',
  warning: '#b45309',
  warningBackground: '#fffbeb',
  accentSoft: '#dbeafe',
  inputBackground: '#ffffff',
  inputText: '#0f172a',
  inputBorder: '#cbd5e1',
  placeholderText: '#64748b',
  inputPlaceholder: '#64748b',
  disabledBackground: '#e2e8f0',
  disabledText: '#64748b',
  focusRing: '#2563eb',
  overlay: 'rgba(15,23,42,0.38)',
  modalBackground: '#ffffff',
  optionBackground: '#ffffff',
  optionPressedBackground: '#f1f5f9',
  optionBorder: '#e2e8f0',
  backdrop: 'rgba(15,23,42,0.38)',
  primaryButtonBackground: '#0f172a',
  primaryButtonText: '#ffffff',
  secondaryButtonBackground: '#2563eb',
  secondaryButtonText: '#ffffff',
  operationButtonBackground: '#0f172a',
  operationButtonText: '#ffffff',
  dangerButtonBackground: '#b91c1c',
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
  disabledButtonBackground: '#e2e8f0',
  disabledButtonText: '#64748b',
  infoCardBackground: '#eff6ff',
  infoCardText: '#1e3a8a',
  infoCardBorder: '#bfdbfe',
  calendarSelectedBackground: '#0f172a',
  calendarSelectedText: '#ffffff',
  calendarText: '#0f172a',
  dashboardMetricBackground: '#ffffff',
  dashboardMetricText: '#0f172a',
  dashboardAccent: '#2563eb',
};

const darkColors: ThemeColors = {
  primary: '#e2e8f0',
  secondary: '#94a3b8',
  accent: '#93c5fd',
  background: '#020617',
  backgroundElevated: '#07111f',
  surface: '#0f172a',
  surfaceAlt: '#111827',
  surfaceElevated: '#111827',
  surfaceMuted: '#1e293b',
  text: '#f8fafc',
  textPrimary: '#f8fafc',
  textSecondary: '#cbd5e1',
  textMuted: '#94a3b8',
  textOnPrimary: '#020617',
  textOnAccent: '#020617',
  mutedText: '#cbd5e1',
  border: '#334155',
  borderSubtle: '#1e293b',
  borderStrong: '#475569',
  danger: '#fca5a5',
  dangerBackground: '#3f1218',
  success: '#86efac',
  successBackground: '#052e16',
  warning: '#fbbf24',
  warningBackground: '#3b2506',
  accentSoft: '#172554',
  inputBackground: '#111827',
  inputText: '#f8fafc',
  inputBorder: '#64748b',
  placeholderText: '#cbd5e1',
  inputPlaceholder: '#cbd5e1',
  disabledBackground: '#1e293b',
  disabledText: '#94a3b8',
  focusRing: '#93c5fd',
  overlay: 'rgba(0,0,0,0.62)',
  modalBackground: '#111827',
  optionBackground: '#111827',
  optionPressedBackground: '#1f2937',
  optionBorder: '#334155',
  backdrop: 'rgba(0,0,0,0.62)',
  primaryButtonBackground: '#60a5fa',
  primaryButtonText: '#020617',
  secondaryButtonBackground: '#1e293b',
  secondaryButtonText: '#e2e8f0',
  operationButtonBackground: '#93c5fd',
  operationButtonText: '#020617',
  dangerButtonBackground: '#ef4444',
  dangerButtonText: '#ffffff',
  cancelButtonBackground: '#475569',
  cancelButtonText: '#ffffff',
  backButtonBackground: '#334155',
  backButtonText: '#f9fafb',
  menuButtonBackground: '#2563eb',
  menuButtonText: '#ffffff',
  neutralButtonBackground: '#0f172a',
  neutralButtonText: '#e2e8f0',
  neutralButtonBorder: '#475569',
  disabledButtonBackground: '#1e293b',
  disabledButtonText: '#94a3b8',
  infoCardBackground: '#0b2245',
  infoCardText: '#dbeafe',
  infoCardBorder: '#2563eb',
  calendarSelectedBackground: '#60a5fa',
  calendarSelectedText: '#020617',
  calendarText: '#f8fafc',
  dashboardMetricBackground: '#0f172a',
  dashboardMetricText: '#f8fafc',
  dashboardAccent: '#93c5fd',
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
          mutedText: baseTheme.colors.mutedText,
          textSecondary: baseTheme.colors.textSecondary,
          textMuted: baseTheme.colors.textMuted,
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
          inputBackground: baseTheme.colors.inputBackground,
          inputText: baseTheme.colors.inputText,
          inputBorder: baseTheme.colors.inputBorder,
          placeholderText: baseTheme.colors.placeholderText,
          inputPlaceholder: baseTheme.colors.inputPlaceholder,
          disabledBackground: baseTheme.colors.disabledBackground,
          disabledText: baseTheme.colors.disabledText,
          focusRing: baseTheme.colors.focusRing,
          overlay: baseTheme.colors.overlay,
          modalBackground: baseTheme.colors.modalBackground,
          optionBackground: baseTheme.colors.optionBackground,
          optionPressedBackground: baseTheme.colors.optionPressedBackground,
          optionBorder: baseTheme.colors.optionBorder,
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
