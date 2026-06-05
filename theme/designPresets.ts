export type DesignPresetId =
  | 'retailPremium'
  | 'darkConsole'
  | 'blueCorporate'
  | 'boutique'
  | 'classicErp';

export type DesignPresetColors = {
  primary: string;
  primarySoft: string;
  secondary: string;
  accent: string;
  accentSoft: string;
  background: string;
  backgroundElevated: string;
  surface: string;
  surfaceAlt: string;
  surfaceElevated: string;
  surfaceMuted: string;
  border: string;
  borderSubtle: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnPrimary: string;
  textOnAccent: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;
  inputBackground: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;
  disabledBackground: string;
  disabledText: string;
  shadow: string;
  shadowSoft: string;
  focusRing: string;
  overlay: string;
};

export type DesignPreset = {
  id: DesignPresetId;
  label: string;
  description: string;
  active: boolean;
  radius: 'standard' | 'soft' | 'compact';
  density: 'NORMAL' | 'COMPACT';
  colors: {
    light: DesignPresetColors;
    dark: DesignPresetColors;
  };
};

export const DEFAULT_DESIGN_PRESET_ID: DesignPresetId = 'retailPremium';

export const editableVisualTokenKeys = [
  'primary',
  'secondary',
  'accent',
  'success',
  'warning',
  'danger',
  'background',
  'surface',
] as const;

export type EditableVisualTokenKey = (typeof editableVisualTokenKeys)[number];
export type ThemeScheme = 'light' | 'dark';

export type VisualIdentityRadius = 'standard' | 'soft' | 'compact';
export type VisualIdentityDensity = 'NORMAL' | 'COMPACT';

export type CustomVisualIdentity = {
  presetId: DesignPresetId;
  colors: Partial<Record<ThemeScheme, Partial<Record<EditableVisualTokenKey, string>>>>;
  radius?: VisualIdentityRadius;
  density?: VisualIdentityDensity;
  updatedAt?: string;
};

export const visualTokenLabels: Record<EditableVisualTokenKey, string> = {
  primary: 'Color primario',
  secondary: 'Color secundario',
  accent: 'Color acento',
  success: 'Color exito',
  warning: 'Color advertencia',
  danger: 'Color peligro / reservado',
  background: 'Color de fondo',
  surface: 'Color de superficie/cards',
};

export function isHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value.trim());
}

function hexToRgb(value: string) {
  if (!isHexColor(value)) return null;
  const clean = value.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function rgbaFromHex(value: string, alpha: number) {
  const rgb = hexToRgb(value);
  if (!rgb) return value;
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
}

function getRelativeLuminance(value: string) {
  const rgb = hexToRgb(value);
  if (!rgb) return null;

  const channels = [rgb.r, rgb.g, rgb.b].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function getContrastRatio(foreground: string, background: string) {
  const foregroundLuminance = getRelativeLuminance(foreground);
  const backgroundLuminance = getRelativeLuminance(background);
  if (foregroundLuminance === null || backgroundLuminance === null) return null;

  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

export function applyCustomVisualIdentity(
  colors: DesignPresetColors,
  customIdentity: CustomVisualIdentity | null | undefined,
  scheme: ThemeScheme,
) {
  if (!customIdentity) return colors;

  const overrides = customIdentity.colors[scheme] ?? {};
  const nextColors: DesignPresetColors = { ...colors };

  editableVisualTokenKeys.forEach((key) => {
    const value = overrides[key];
    if (value && isHexColor(value)) {
      nextColors[key] = value;
    }
  });

  if (overrides.primary && isHexColor(overrides.primary)) {
    nextColors.primarySoft = rgbaFromHex(overrides.primary, scheme === 'dark' ? 0.24 : 0.14);
  }
  if (overrides.accent && isHexColor(overrides.accent)) {
    nextColors.accentSoft = rgbaFromHex(overrides.accent, scheme === 'dark' ? 0.24 : 0.14);
    nextColors.focusRing = overrides.accent;
  }
  if (overrides.success && isHexColor(overrides.success)) {
    nextColors.successSoft = rgbaFromHex(overrides.success, scheme === 'dark' ? 0.24 : 0.14);
  }
  if (overrides.warning && isHexColor(overrides.warning)) {
    nextColors.warningSoft = rgbaFromHex(overrides.warning, scheme === 'dark' ? 0.24 : 0.16);
  }
  if (overrides.danger && isHexColor(overrides.danger)) {
    nextColors.dangerSoft = rgbaFromHex(overrides.danger, scheme === 'dark' ? 0.26 : 0.14);
  }
  if (overrides.background && isHexColor(overrides.background)) {
    nextColors.backgroundElevated = rgbaFromHex(overrides.background, scheme === 'dark' ? 0.7 : 0.72);
  }
  if (overrides.surface && isHexColor(overrides.surface)) {
    nextColors.surfaceAlt = rgbaFromHex(overrides.surface, scheme === 'dark' ? 0.72 : 0.78);
    nextColors.surfaceElevated = overrides.surface;
    nextColors.inputBackground = overrides.surface;
  }

  return nextColors;
}

export const designPresets: DesignPreset[] = [
  {
    id: 'retailPremium',
    label: 'Retail Premium',
    description: 'Base comercial limpia para operacion retail y demo ejecutiva.',
    active: true,
    radius: 'soft',
    density: 'NORMAL',
    colors: {
      light: {
        primary: '#0f172a',
        primarySoft: '#e2e8f0',
        secondary: '#475569',
        accent: '#2563eb',
        accentSoft: '#dbeafe',
        background: '#f8fafc',
        backgroundElevated: '#eef2f7',
        surface: '#ffffff',
        surfaceAlt: '#f8fafc',
        surfaceElevated: '#ffffff',
        surfaceMuted: '#f1f5f9',
        border: '#e2e8f0',
        borderSubtle: '#edf2f7',
        borderStrong: '#cbd5e1',
        textPrimary: '#0f172a',
        textSecondary: '#475569',
        textMuted: '#64748b',
        textOnPrimary: '#ffffff',
        textOnAccent: '#ffffff',
        success: '#15803d',
        successSoft: '#dcfce7',
        warning: '#b45309',
        warningSoft: '#fef3c7',
        danger: '#b91c1c',
        dangerSoft: '#fee2e2',
        info: '#0ea5e9',
        infoSoft: '#e0f2fe',
        inputBackground: '#ffffff',
        inputBorder: '#cbd5e1',
        inputText: '#0f172a',
        inputPlaceholder: '#64748b',
        disabledBackground: '#e2e8f0',
        disabledText: '#64748b',
        shadow: '#0f172a',
        shadowSoft: 'rgba(15,23,42,0.08)',
        focusRing: '#2563eb',
        overlay: 'rgba(15,23,42,0.38)',
      },
      dark: {
        primary: '#e2e8f0',
        primarySoft: '#1e293b',
        secondary: '#94a3b8',
        accent: '#93c5fd',
        accentSoft: '#172554',
        background: '#020617',
        backgroundElevated: '#07111f',
        surface: '#0f172a',
        surfaceAlt: '#111827',
        surfaceElevated: '#111827',
        surfaceMuted: '#1e293b',
        border: '#334155',
        borderSubtle: '#1e293b',
        borderStrong: '#475569',
        textPrimary: '#f8fafc',
        textSecondary: '#cbd5e1',
        textMuted: '#94a3b8',
        textOnPrimary: '#020617',
        textOnAccent: '#020617',
        success: '#86efac',
        successSoft: '#052e16',
        warning: '#fbbf24',
        warningSoft: '#3b2506',
        danger: '#fca5a5',
        dangerSoft: '#3f1218',
        info: '#93c5fd',
        infoSoft: '#0b2245',
        inputBackground: '#111827',
        inputBorder: '#64748b',
        inputText: '#f8fafc',
        inputPlaceholder: '#cbd5e1',
        disabledBackground: '#1e293b',
        disabledText: '#94a3b8',
        shadow: '#000000',
        shadowSoft: 'rgba(0,0,0,0.28)',
        focusRing: '#93c5fd',
        overlay: 'rgba(0,0,0,0.62)',
      },
    },
  },
  {
    id: 'darkConsole',
    label: 'Dark Console',
    description: 'Consola operacional con acentos cyan y alta legibilidad.',
    active: true,
    radius: 'standard',
    density: 'NORMAL',
    colors: {
      light: {
        primary: '#0f172a',
        primarySoft: '#ccfbf1',
        secondary: '#334155',
        accent: '#0891b2',
        accentSoft: '#cffafe',
        background: '#f1f5f9',
        backgroundElevated: '#e2e8f0',
        surface: '#ffffff',
        surfaceAlt: '#f8fafc',
        surfaceElevated: '#ffffff',
        surfaceMuted: '#e2e8f0',
        border: '#cbd5e1',
        borderSubtle: '#e2e8f0',
        borderStrong: '#94a3b8',
        textPrimary: '#0f172a',
        textSecondary: '#334155',
        textMuted: '#64748b',
        textOnPrimary: '#ffffff',
        textOnAccent: '#ffffff',
        success: '#047857',
        successSoft: '#d1fae5',
        warning: '#b45309',
        warningSoft: '#fef3c7',
        danger: '#be123c',
        dangerSoft: '#ffe4e6',
        info: '#0891b2',
        infoSoft: '#cffafe',
        inputBackground: '#ffffff',
        inputBorder: '#94a3b8',
        inputText: '#0f172a',
        inputPlaceholder: '#64748b',
        disabledBackground: '#e2e8f0',
        disabledText: '#64748b',
        shadow: '#0f172a',
        shadowSoft: 'rgba(15,23,42,0.1)',
        focusRing: '#0891b2',
        overlay: 'rgba(15,23,42,0.42)',
      },
      dark: {
        primary: '#ecfeff',
        primarySoft: '#164e63',
        secondary: '#a5f3fc',
        accent: '#22d3ee',
        accentSoft: '#083344',
        background: '#020617',
        backgroundElevated: '#05111f',
        surface: '#07111f',
        surfaceAlt: '#0f172a',
        surfaceElevated: '#111827',
        surfaceMuted: '#1e293b',
        border: '#164e63',
        borderSubtle: '#0e2938',
        borderStrong: '#155e75',
        textPrimary: '#ecfeff',
        textSecondary: '#bae6fd',
        textMuted: '#67e8f9',
        textOnPrimary: '#022c22',
        textOnAccent: '#022c22',
        success: '#5eead4',
        successSoft: '#042f2e',
        warning: '#fbbf24',
        warningSoft: '#3b2506',
        danger: '#fb7185',
        dangerSoft: '#3f1218',
        info: '#22d3ee',
        infoSoft: '#083344',
        inputBackground: '#0f172a',
        inputBorder: '#155e75',
        inputText: '#ecfeff',
        inputPlaceholder: '#a5f3fc',
        disabledBackground: '#1e293b',
        disabledText: '#94a3b8',
        shadow: '#000000',
        shadowSoft: 'rgba(0,0,0,0.36)',
        focusRing: '#22d3ee',
        overlay: 'rgba(0,0,0,0.68)',
      },
    },
  },
  {
    id: 'blueCorporate',
    label: 'Blue Corporate',
    description: 'Identidad sobria azul para operacion multi-sucursal.',
    active: true,
    radius: 'standard',
    density: 'NORMAL',
    colors: {
      light: {
        primary: '#1e3a8a',
        primarySoft: '#dbeafe',
        secondary: '#475569',
        accent: '#1d4ed8',
        accentSoft: '#dbeafe',
        background: '#f8fafc',
        backgroundElevated: '#eff6ff',
        surface: '#ffffff',
        surfaceAlt: '#f8fafc',
        surfaceElevated: '#ffffff',
        surfaceMuted: '#eaf2ff',
        border: '#bfdbfe',
        borderSubtle: '#dbeafe',
        borderStrong: '#93c5fd',
        textPrimary: '#172554',
        textSecondary: '#334155',
        textMuted: '#64748b',
        textOnPrimary: '#ffffff',
        textOnAccent: '#ffffff',
        success: '#15803d',
        successSoft: '#dcfce7',
        warning: '#a16207',
        warningSoft: '#fef3c7',
        danger: '#b91c1c',
        dangerSoft: '#fee2e2',
        info: '#1d4ed8',
        infoSoft: '#dbeafe',
        inputBackground: '#ffffff',
        inputBorder: '#93c5fd',
        inputText: '#172554',
        inputPlaceholder: '#64748b',
        disabledBackground: '#e2e8f0',
        disabledText: '#64748b',
        shadow: '#1e3a8a',
        shadowSoft: 'rgba(30,58,138,0.1)',
        focusRing: '#1d4ed8',
        overlay: 'rgba(30,58,138,0.36)',
      },
      dark: {
        primary: '#dbeafe',
        primarySoft: '#172554',
        secondary: '#bfdbfe',
        accent: '#60a5fa',
        accentSoft: '#172554',
        background: '#020617',
        backgroundElevated: '#08142b',
        surface: '#0f172a',
        surfaceAlt: '#111827',
        surfaceElevated: '#111827',
        surfaceMuted: '#172554',
        border: '#1e3a8a',
        borderSubtle: '#172554',
        borderStrong: '#2563eb',
        textPrimary: '#eff6ff',
        textSecondary: '#bfdbfe',
        textMuted: '#93c5fd',
        textOnPrimary: '#020617',
        textOnAccent: '#020617',
        success: '#86efac',
        successSoft: '#052e16',
        warning: '#facc15',
        warningSoft: '#3b2506',
        danger: '#fca5a5',
        dangerSoft: '#3f1218',
        info: '#93c5fd',
        infoSoft: '#172554',
        inputBackground: '#111827',
        inputBorder: '#2563eb',
        inputText: '#eff6ff',
        inputPlaceholder: '#bfdbfe',
        disabledBackground: '#1e293b',
        disabledText: '#94a3b8',
        shadow: '#000000',
        shadowSoft: 'rgba(0,0,0,0.3)',
        focusRing: '#60a5fa',
        overlay: 'rgba(0,0,0,0.64)',
      },
    },
  },
  {
    id: 'boutique',
    label: 'Boutique',
    description: 'Acentos vino/rosa para retail de moda con tono editorial controlado.',
    active: true,
    radius: 'soft',
    density: 'NORMAL',
    colors: {
      light: {
        primary: '#4c0519',
        primarySoft: '#ffe4e6',
        secondary: '#6b4754',
        accent: '#be123c',
        accentSoft: '#ffe4e6',
        background: '#fff7f8',
        backgroundElevated: '#ffe4e6',
        surface: '#ffffff',
        surfaceAlt: '#fff1f2',
        surfaceElevated: '#ffffff',
        surfaceMuted: '#ffe4e6',
        border: '#fecdd3',
        borderSubtle: '#ffe4e6',
        borderStrong: '#fda4af',
        textPrimary: '#4c0519',
        textSecondary: '#6b4754',
        textMuted: '#8a5f6b',
        textOnPrimary: '#ffffff',
        textOnAccent: '#ffffff',
        success: '#15803d',
        successSoft: '#dcfce7',
        warning: '#b45309',
        warningSoft: '#fef3c7',
        danger: '#be123c',
        dangerSoft: '#ffe4e6',
        info: '#7c3aed',
        infoSoft: '#ede9fe',
        inputBackground: '#ffffff',
        inputBorder: '#fda4af',
        inputText: '#4c0519',
        inputPlaceholder: '#8a5f6b',
        disabledBackground: '#ffe4e6',
        disabledText: '#8a5f6b',
        shadow: '#4c0519',
        shadowSoft: 'rgba(76,5,25,0.1)',
        focusRing: '#be123c',
        overlay: 'rgba(76,5,25,0.36)',
      },
      dark: {
        primary: '#ffe4e6',
        primarySoft: '#4c0519',
        secondary: '#fecdd3',
        accent: '#fb7185',
        accentSoft: '#4c0519',
        background: '#12060b',
        backgroundElevated: '#210913',
        surface: '#1f0a12',
        surfaceAlt: '#2b0f19',
        surfaceElevated: '#2b0f19',
        surfaceMuted: '#4c0519',
        border: '#881337',
        borderSubtle: '#4c0519',
        borderStrong: '#be123c',
        textPrimary: '#fff1f2',
        textSecondary: '#fecdd3',
        textMuted: '#fda4af',
        textOnPrimary: '#12060b',
        textOnAccent: '#12060b',
        success: '#86efac',
        successSoft: '#052e16',
        warning: '#fbbf24',
        warningSoft: '#3b2506',
        danger: '#fb7185',
        dangerSoft: '#4c0519',
        info: '#c4b5fd',
        infoSoft: '#2e1065',
        inputBackground: '#2b0f19',
        inputBorder: '#be123c',
        inputText: '#fff1f2',
        inputPlaceholder: '#fecdd3',
        disabledBackground: '#4c0519',
        disabledText: '#fda4af',
        shadow: '#000000',
        shadowSoft: 'rgba(0,0,0,0.34)',
        focusRing: '#fb7185',
        overlay: 'rgba(0,0,0,0.68)',
      },
    },
  },
  {
    id: 'classicErp',
    label: 'Classic ERP',
    description: 'Panel sobrio y denso para administracion operativa tradicional.',
    active: true,
    radius: 'compact',
    density: 'COMPACT',
    colors: {
      light: {
        primary: '#111827',
        primarySoft: '#e5e7eb',
        secondary: '#4b5563',
        accent: '#2563eb',
        accentSoft: '#e0f2fe',
        background: '#f3f4f6',
        backgroundElevated: '#e5e7eb',
        surface: '#ffffff',
        surfaceAlt: '#f9fafb',
        surfaceElevated: '#ffffff',
        surfaceMuted: '#f3f4f6',
        border: '#d1d5db',
        borderSubtle: '#e5e7eb',
        borderStrong: '#9ca3af',
        textPrimary: '#111827',
        textSecondary: '#374151',
        textMuted: '#6b7280',
        textOnPrimary: '#ffffff',
        textOnAccent: '#ffffff',
        success: '#166534',
        successSoft: '#dcfce7',
        warning: '#92400e',
        warningSoft: '#fef3c7',
        danger: '#991b1b',
        dangerSoft: '#fee2e2',
        info: '#1d4ed8',
        infoSoft: '#dbeafe',
        inputBackground: '#ffffff',
        inputBorder: '#9ca3af',
        inputText: '#111827',
        inputPlaceholder: '#6b7280',
        disabledBackground: '#e5e7eb',
        disabledText: '#6b7280',
        shadow: '#111827',
        shadowSoft: 'rgba(17,24,39,0.08)',
        focusRing: '#2563eb',
        overlay: 'rgba(17,24,39,0.42)',
      },
      dark: {
        primary: '#f9fafb',
        primarySoft: '#1f2937',
        secondary: '#d1d5db',
        accent: '#93c5fd',
        accentSoft: '#1e3a8a',
        background: '#0b0f17',
        backgroundElevated: '#111827',
        surface: '#111827',
        surfaceAlt: '#1f2937',
        surfaceElevated: '#1f2937',
        surfaceMuted: '#374151',
        border: '#374151',
        borderSubtle: '#1f2937',
        borderStrong: '#6b7280',
        textPrimary: '#f9fafb',
        textSecondary: '#d1d5db',
        textMuted: '#9ca3af',
        textOnPrimary: '#111827',
        textOnAccent: '#111827',
        success: '#86efac',
        successSoft: '#052e16',
        warning: '#fbbf24',
        warningSoft: '#3b2506',
        danger: '#fca5a5',
        dangerSoft: '#3f1218',
        info: '#93c5fd',
        infoSoft: '#1e3a8a',
        inputBackground: '#1f2937',
        inputBorder: '#6b7280',
        inputText: '#f9fafb',
        inputPlaceholder: '#d1d5db',
        disabledBackground: '#374151',
        disabledText: '#9ca3af',
        shadow: '#000000',
        shadowSoft: 'rgba(0,0,0,0.3)',
        focusRing: '#93c5fd',
        overlay: 'rgba(0,0,0,0.66)',
      },
    },
  },
];

export function getDesignPreset(id?: string | null) {
  return (
    designPresets.find((preset) => preset.active && preset.id === id) ??
    designPresets.find((preset) => preset.id === DEFAULT_DESIGN_PRESET_ID)!
  );
}
