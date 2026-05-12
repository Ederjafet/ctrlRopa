import { apiRequest } from '@/services/apiClient';

export type ThemeMode = 'LIGHT' | 'DARK' | 'AUTO';
export type DensityMode = 'COMPACT' | 'NORMAL';
export type ButtonStyle = 'ROUNDED' | 'STRAIGHT';

export type AppearanceSettings = {
  id?: number;
  appName?: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  themeMode?: ThemeMode;
  densityMode?: DensityMode;
  buttonStyle?: ButtonStyle;
  showLogoOnPrints?: boolean;
  printFooterText?: string | null;
  packageThankYouText?: string | null;
  primaryButtonColor?: string;
  primaryButtonTextColor?: string;
  secondaryButtonColor?: string;
  secondaryButtonTextColor?: string;
  operationButtonColor?: string;
  operationButtonTextColor?: string;
  dangerButtonColor?: string;
  dangerButtonTextColor?: string;
  cancelButtonColor?: string;
  cancelButtonTextColor?: string;
  backButtonColor?: string;
  backButtonTextColor?: string;
  menuButtonColor?: string;
  menuButtonTextColor?: string;
  infoCardBackgroundColor?: string;
  infoCardTextColor?: string;
  infoCardBorderColor?: string;
  calendarSelectedColor?: string;
  calendarSelectedTextColor?: string;
  calendarTextColor?: string;
  dashboardMetricBackgroundColor?: string;
  dashboardMetricTextColor?: string;
  dashboardAccentColor?: string;
  loginLogoUrl?: string | null;
  printLogoUrl?: string | null;
  updatedAt?: string;
  updatedByUserId?: number | null;
};

export async function getAppearanceSettings(): Promise<AppearanceSettings> {
  try {
    const data = await apiRequest<AppearanceSettings>('/api/appearance');
    return data ?? {};
  } catch {
    return {};
  }
}

export async function updateAppearanceSettings(
  payload: AppearanceSettings
): Promise<AppearanceSettings> {
  return apiRequest<AppearanceSettings>('/api/appearance', {
    method: 'PUT',
    body: payload,
  });
}
