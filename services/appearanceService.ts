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

type GetAppearanceSettingsOptions = {
  force?: boolean;
};

const APPEARANCE_CACHE_TTL_MS = 5 * 60 * 1000;

let cachedAppearanceSettings: AppearanceSettings | null = null;
let cachedAppearanceLoadedAt = 0;
let pendingAppearanceRequest: Promise<AppearanceSettings> | null = null;

export function clearAppearanceSettingsCache() {
  cachedAppearanceSettings = null;
  cachedAppearanceLoadedAt = 0;
  pendingAppearanceRequest = null;
}

export async function getAppearanceSettings(
  options: GetAppearanceSettingsOptions = {}
): Promise<AppearanceSettings> {
  const now = Date.now();
  const canUseCached =
    !options.force &&
    cachedAppearanceSettings !== null &&
    now - cachedAppearanceLoadedAt < APPEARANCE_CACHE_TTL_MS;

  if (canUseCached && cachedAppearanceSettings) {
    return cachedAppearanceSettings;
  }

  if (!options.force && pendingAppearanceRequest) {
    return pendingAppearanceRequest;
  }

  const request = apiRequest<AppearanceSettings>('/api/appearance', {
    includeSession: false,
  })
    .then((data) => {
      cachedAppearanceSettings = data ?? {};
      cachedAppearanceLoadedAt = Date.now();
      return cachedAppearanceSettings;
    })
    .catch(() => cachedAppearanceSettings ?? {})
    .finally(() => {
      if (pendingAppearanceRequest === request) {
        pendingAppearanceRequest = null;
      }
    });

  pendingAppearanceRequest = request;

  return request;
}

export async function updateAppearanceSettings(
  payload: AppearanceSettings
): Promise<AppearanceSettings> {
  const updated = await apiRequest<AppearanceSettings>('/api/appearance', {
    method: 'PUT',
    body: payload,
  });

  cachedAppearanceSettings = updated ?? {};
  cachedAppearanceLoadedAt = Date.now();

  return updated;
}
