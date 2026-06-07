export type RgbColor = {
  r: number;
  g: number;
  b: number;
};

export type HslColor = {
  h: number;
  s: number;
  l: number;
};

export type HarmonyType = 'monochromatic' | 'complementary' | 'analogous' | 'triadic' | 'tetradic';

export type SemanticPalette = {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  background: string;
  surface: string;
};

export type BrandColorInputs = {
  primary?: string | null;
  secondary?: string | null;
  accent?: string | null;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const normalizeHue = (hue: number) => ((hue % 360) + 360) % 360;
const toHexChannel = (value: number) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0');

export function isValidHexColor(value?: string | null) {
  if (!value) return false;
  return /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
}

export function normalizeHexColor(value?: string | null, fallback = '#2563EB') {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!isValidHexColor(trimmed)) return fallback;
  const clean = trimmed.replace('#', '');
  const normalized =
    clean.length === 3
      ? clean
          .split('')
          .map((char) => char + char)
          .join('')
      : clean;
  return `#${normalized.toUpperCase()}`;
}

export function hexToRgb(value?: string | null): RgbColor | null {
  if (!isValidHexColor(value)) return null;
  const clean = normalizeHexColor(value).replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: RgbColor) {
  return `#${toHexChannel(r)}${toHexChannel(g)}${toHexChannel(b)}`.toUpperCase();
}

export function rgbToHsl({ r, g, b }: RgbColor): HslColor {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let h = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    if (max === red) h = ((green - blue) / delta) % 6;
    else if (max === green) h = (blue - red) / delta + 2;
    else h = (red - green) / delta + 4;
    h *= 60;
  }

  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return {
    h: normalizeHue(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToRgb({ h, s, l }: HslColor): RgbColor {
  const hue = normalizeHue(h);
  const saturation = clamp(s, 0, 100) / 100;
  const lightness = clamp(l, 0, 100) / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const match = lightness - chroma / 2;
  let red = 0;
  let green = 0;
  let blue = 0;

  if (hue < 60) [red, green, blue] = [chroma, x, 0];
  else if (hue < 120) [red, green, blue] = [x, chroma, 0];
  else if (hue < 180) [red, green, blue] = [0, chroma, x];
  else if (hue < 240) [red, green, blue] = [0, x, chroma];
  else if (hue < 300) [red, green, blue] = [x, 0, chroma];
  else [red, green, blue] = [chroma, 0, x];

  return {
    r: Math.round((red + match) * 255),
    g: Math.round((green + match) * 255),
    b: Math.round((blue + match) * 255),
  };
}

export function hslToHex(color: HslColor) {
  return rgbToHex(hslToRgb(color));
}

export function hexToHsl(value?: string | null): HslColor | null {
  const rgb = hexToRgb(value);
  return rgb ? rgbToHsl(rgb) : null;
}

export function adjustHsl(value: string, adjustment: Partial<HslColor>) {
  const hsl = hexToHsl(value);
  if (!hsl) return normalizeHexColor(value);
  return hslToHex({
    h: normalizeHue(adjustment.h ?? hsl.h),
    s: clamp(adjustment.s ?? hsl.s, 0, 100),
    l: clamp(adjustment.l ?? hsl.l, 0, 100),
  });
}

export function generateTints(value: string, count = 6) {
  const base = hexToHsl(value) ?? hexToHsl('#2563EB')!;
  return Array.from({ length: count }, (_, index) => {
    const ratio = (index + 1) / (count + 1);
    return hslToHex({ ...base, l: base.l + (96 - base.l) * ratio });
  });
}

export function generateShades(value: string, count = 6) {
  const base = hexToHsl(value) ?? hexToHsl('#2563EB')!;
  return Array.from({ length: count }, (_, index) => {
    const ratio = (index + 1) / (count + 1);
    return hslToHex({ ...base, l: base.l - (base.l - 12) * ratio });
  });
}

export function generateTones(value: string, count = 6) {
  const base = hexToHsl(value) ?? hexToHsl('#2563EB')!;
  return Array.from({ length: count }, (_, index) => {
    const ratio = (index + 1) / (count + 1);
    return hslToHex({
      ...base,
      s: base.s - (base.s - 24) * ratio,
      l: base.l + (50 - base.l) * ratio * 0.4,
    });
  });
}

export function generateHarmonyColors(value: string, harmony: HarmonyType) {
  const base = hexToHsl(value) ?? hexToHsl('#2563EB')!;
  const hueSets: Record<HarmonyType, number[]> = {
    monochromatic: [0, 0, 0, 0],
    complementary: [0, 180, 210, 330],
    analogous: [0, -30, 30, 60],
    triadic: [0, 120, 240, 180],
    tetradic: [0, 90, 180, 270],
  };

  return hueSets[harmony].map((offset, index) =>
    hslToHex({
      h: base.h + offset,
      s: clamp(base.s - index * 6, 28, 86),
      l: clamp(base.l + (index === 0 ? 0 : index % 2 === 0 ? -4 : 5), 28, 72),
    }),
  );
}

export function getRelativeLuminance(value: string) {
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

export function getReadableTextColor(background: string, lightText = '#FFFFFF', darkText = '#0F172A') {
  const lightRatio = getContrastRatio(lightText, background) ?? 0;
  const darkRatio = getContrastRatio(darkText, background) ?? 0;
  return lightRatio >= darkRatio ? lightText : darkText;
}

export function getContrastStatus(ratio: number | null): 'ok' | 'review' | 'low' {
  if (ratio === null) return 'review';
  if (ratio >= 4.5) return 'ok';
  if (ratio >= 3) return 'review';
  return 'low';
}

export function generateSemanticPalette(
  value: string,
  harmony: HarmonyType,
  scheme: 'light' | 'dark',
  brandColors: BrandColorInputs = {},
): SemanticPalette {
  const base = normalizeHexColor(brandColors.primary ?? value);
  const baseHsl = hexToHsl(base) ?? hexToHsl('#2563EB')!;
  const harmonyColors = generateHarmonyColors(base, harmony);
  const tone = generateTones(base, 4);
  const shade = generateShades(base, 4);
  const secondary =
    brandColors.secondary && isValidHexColor(brandColors.secondary)
      ? normalizeHexColor(brandColors.secondary)
      : scheme === 'dark'
        ? tone[1]
        : shade[1];
  const accent =
    brandColors.accent && isValidHexColor(brandColors.accent)
      ? normalizeHexColor(brandColors.accent)
      : harmony === 'monochromatic'
        ? tone[2]
        : harmonyColors[1];

  return {
    primary: base,
    secondary,
    accent,
    success: scheme === 'dark' ? '#86EFAC' : '#15803D',
    warning: scheme === 'dark' ? '#FBBF24' : '#B45309',
    danger: scheme === 'dark' ? '#FCA5A5' : '#B91C1C',
    background:
      scheme === 'dark'
        ? hslToHex({ h: baseHsl.h, s: clamp(baseHsl.s * 0.28, 8, 24), l: 7 })
        : hslToHex({ h: baseHsl.h, s: clamp(baseHsl.s * 0.24, 8, 22), l: 97 }),
    surface:
      scheme === 'dark'
        ? hslToHex({ h: baseHsl.h, s: clamp(baseHsl.s * 0.3, 10, 28), l: 13 })
        : hslToHex({ h: baseHsl.h, s: clamp(baseHsl.s * 0.18, 4, 16), l: 100 }),
  };
}
