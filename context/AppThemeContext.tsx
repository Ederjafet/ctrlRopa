import { getAppearanceSettings } from '@/services/appearanceService';
import {
  DEFAULT_DESIGN_PRESET_ID,
  DesignPresetId,
  designPresets,
  getDesignPreset,
} from '@/theme/designPresets';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

type ThemeColors = {
  primary: string;
  primarySoft: string;
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
  dangerSoft: string;
  success: string;
  successBackground: string;
  successSoft: string;
  warning: string;
  warningBackground: string;
  warningSoft: string;
  info: string;
  infoSoft: string;
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
  shadow: string;
  shadowSoft: string;
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
  primarySoft: '#e2e8f0',
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
  dangerSoft: '#fee2e2',
  success: '#15803d',
  successBackground: '#ecfdf5',
  successSoft: '#dcfce7',
  warning: '#b45309',
  warningBackground: '#fffbeb',
  warningSoft: '#fef3c7',
  info: '#0ea5e9',
  infoSoft: '#e0f2fe',
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
  shadow: '#0f172a',
  shadowSoft: 'rgba(15,23,42,0.08)',
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
  primarySoft: '#1e293b',
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
  dangerSoft: '#3f1218',
  success: '#86efac',
  successBackground: '#052e16',
  successSoft: '#052e16',
  warning: '#fbbf24',
  warningBackground: '#3b2506',
  warningSoft: '#3b2506',
  info: '#93c5fd',
  infoSoft: '#0b2245',
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
  shadow: '#000000',
  shadowSoft: 'rgba(0,0,0,0.28)',
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
  visualPresetId: DesignPresetId;
  designPresets: typeof designPresets;
  isLoadingTheme: boolean;
  reloadTheme: () => Promise<void>;
  toggleThemeMode: () => Promise<void>;
  setThemeMode: (mode: 'LIGHT' | 'DARK') => Promise<void>;
  setVisualPresetId: (presetId: DesignPresetId) => Promise<void>;
};

const AppThemeContext = createContext<AppThemeContextValue>({
  theme: createDefaultTheme('light'),
  themeMode: 'LIGHT',
  visualPresetId: DEFAULT_DESIGN_PRESET_ID,
  designPresets,
  isLoadingTheme: false,
  reloadTheme: async () => {},
  toggleThemeMode: async () => {},
  setThemeMode: async () => {},
  setVisualPresetId: async () => {},
});

const LOCAL_THEME_MODE_KEY = 'controlRopa.localThemeMode';
const LOCAL_VISUAL_PRESET_KEY = 'controlRopa.localVisualPreset';

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
  const [visualPresetId, setVisualPresetState] = useState<DesignPresetId>(DEFAULT_DESIGN_PRESET_ID);
  const [isLoadingTheme, setIsLoadingTheme] = useState(true);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      AsyncStorage.getItem(LOCAL_THEME_MODE_KEY),
      AsyncStorage.getItem(LOCAL_VISUAL_PRESET_KEY),
    ])
      .then(([value, presetValue]) => {
        if (cancelled) return;
        setLocalThemeMode(value === 'DARK' ? 'DARK' : value === 'LIGHT' ? 'LIGHT' : null);
        setVisualPresetState(getDesignPreset(presetValue).id);
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
  }, [systemScheme, localThemeMode, visualPresetId]);

  const setThemeMode = async (mode: 'LIGHT' | 'DARK') => {
    await AsyncStorage.setItem(LOCAL_THEME_MODE_KEY, mode);
    setLocalThemeMode(mode);
  };

  const toggleThemeMode = async () => {
    await setThemeMode(theme.isDark ? 'LIGHT' : 'DARK');
  };

  const setVisualPresetId = async (presetId: DesignPresetId) => {
    const nextPreset = getDesignPreset(presetId);
    await AsyncStorage.setItem(LOCAL_VISUAL_PRESET_KEY, nextPreset.id);
    setVisualPresetState(nextPreset.id);
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
      const activePreset = getDesignPreset(visualPresetId);
      const presetColors = activePreset.colors[baseTheme.isDark ? 'dark' : 'light'];
      const presetRadius =
        activePreset.radius === 'compact'
          ? { sm: 4, md: 6, lg: 10, xl: 14 }
          : activePreset.radius === 'soft'
            ? { sm: 8, md: 12, lg: 18, xl: 24 }
            : baseTheme.radius;
      const baseSpacing =
        settings.densityMode === 'COMPACT' || activePreset.density === 'COMPACT'
          ? { xs: 3, sm: 6, md: 10, lg: 14, xl: 22 }
          : baseTheme.spacing;
      const baseRadius =
        settings.buttonStyle === 'STRAIGHT'
          ? { sm: 2, md: 2, lg: 2, xl: 2 }
          : presetRadius;
      const configuredColors = {
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
        shadow: baseTheme.colors.shadow,
        shadowSoft: baseTheme.colors.shadowSoft,
        dangerSoft: baseTheme.colors.dangerSoft,
        successSoft: baseTheme.colors.successSoft,
        warningSoft: baseTheme.colors.warningSoft,
        info: baseTheme.colors.info,
        infoSoft: baseTheme.colors.infoSoft,
        modalBackground: baseTheme.colors.modalBackground,
        optionBackground: baseTheme.colors.optionBackground,
        optionPressedBackground: baseTheme.colors.optionPressedBackground,
        optionBorder: baseTheme.colors.optionBorder,
      };
      const presetThemeColors = {
        ...configuredColors,
        ...presetColors,
        text: presetColors.textPrimary,
        mutedText: presetColors.textMuted,
        placeholderText: presetColors.inputPlaceholder,
        primaryButtonBackground: presetColors.primary,
        primaryButtonText: presetColors.textOnPrimary,
        secondaryButtonBackground: presetColors.accent,
        secondaryButtonText: presetColors.textOnAccent,
        operationButtonBackground: presetColors.primary,
        operationButtonText: presetColors.textOnPrimary,
        dangerButtonBackground: presetColors.danger,
        dangerButtonText: '#ffffff',
        cancelButtonBackground: presetColors.surfaceMuted,
        cancelButtonText: presetColors.textPrimary,
        backButtonBackground: presetColors.surfaceMuted,
        backButtonText: presetColors.textPrimary,
        menuButtonBackground: presetColors.accent,
        menuButtonText: presetColors.textOnAccent,
        neutralButtonBackground: presetColors.surfaceMuted,
        neutralButtonText: presetColors.textSecondary,
        neutralButtonBorder: presetColors.borderStrong,
        disabledButtonBackground: presetColors.disabledBackground,
        disabledButtonText: presetColors.disabledText,
        infoCardBackground: presetColors.infoSoft,
        infoCardText: presetColors.info,
        infoCardBorder: presetColors.info,
        modalBackground: presetColors.surfaceElevated,
        optionBackground: presetColors.surface,
        optionPressedBackground: presetColors.surfaceMuted,
        optionBorder: presetColors.border,
        calendarSelectedBackground: presetColors.primary,
        calendarSelectedText: presetColors.textOnPrimary,
        calendarText: presetColors.textPrimary,
        dashboardMetricBackground: presetColors.surfaceElevated,
        dashboardMetricText: presetColors.textPrimary,
        dashboardAccent: presetColors.accent,
      };

      setTheme({
        ...baseTheme,
        density: settings.densityMode ?? activePreset.density ?? baseTheme.density,
        buttonStyle: settings.buttonStyle ?? baseTheme.buttonStyle,
        spacing: baseSpacing,
        radius: baseRadius,
        colors: presetThemeColors,
      });
    } finally {
      setIsLoadingTheme(false);
    }
  };

  const value = useMemo(
    () => ({
      theme,
      themeMode: (theme.isDark ? 'DARK' : 'LIGHT') as 'LIGHT' | 'DARK',
      visualPresetId,
      designPresets,
      isLoadingTheme,
      reloadTheme,
      toggleThemeMode,
      setThemeMode,
      setVisualPresetId,
    }),
    [theme, isLoadingTheme, visualPresetId]
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  return useContext(AppThemeContext);
}
