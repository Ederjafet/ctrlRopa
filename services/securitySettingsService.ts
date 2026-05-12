import { apiRequest } from '@/services/apiClient';

export type SecuritySettings = {
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  loginLockoutMinutes: number;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumber: boolean;
  passwordRequireSymbol: boolean;
  passwordExpirationDays: number;
  passwordHistoryCount: number;
  absoluteSessionTimeoutHours: number;
};

const DEFAULT_SETTINGS: SecuritySettings = {
  sessionTimeoutMinutes: 30,
  maxLoginAttempts: 5,
  loginLockoutMinutes: 15,
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumber: true,
  passwordRequireSymbol: true,
  passwordExpirationDays: 90,
  passwordHistoryCount: 5,
  absoluteSessionTimeoutHours: 12,
};

function numberValue(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function normalizeSecuritySettings(
  settings?: Partial<SecuritySettings> | null
): SecuritySettings {
  return {
    sessionTimeoutMinutes:
      numberValue(settings?.sessionTimeoutMinutes, DEFAULT_SETTINGS.sessionTimeoutMinutes),
    maxLoginAttempts:
      numberValue(settings?.maxLoginAttempts, DEFAULT_SETTINGS.maxLoginAttempts),
    loginLockoutMinutes:
      numberValue(settings?.loginLockoutMinutes, DEFAULT_SETTINGS.loginLockoutMinutes),
    passwordMinLength:
      numberValue(settings?.passwordMinLength, DEFAULT_SETTINGS.passwordMinLength),
    passwordRequireUppercase:
      settings?.passwordRequireUppercase ?? DEFAULT_SETTINGS.passwordRequireUppercase,
    passwordRequireLowercase:
      settings?.passwordRequireLowercase ?? DEFAULT_SETTINGS.passwordRequireLowercase,
    passwordRequireNumber:
      settings?.passwordRequireNumber ?? DEFAULT_SETTINGS.passwordRequireNumber,
    passwordRequireSymbol:
      settings?.passwordRequireSymbol ?? DEFAULT_SETTINGS.passwordRequireSymbol,
    passwordExpirationDays:
      numberValue(settings?.passwordExpirationDays, DEFAULT_SETTINGS.passwordExpirationDays),
    passwordHistoryCount:
      numberValue(settings?.passwordHistoryCount, DEFAULT_SETTINGS.passwordHistoryCount),
    absoluteSessionTimeoutHours:
      numberValue(settings?.absoluteSessionTimeoutHours, DEFAULT_SETTINGS.absoluteSessionTimeoutHours),
  };
}

export async function getPublicSecuritySettings(): Promise<SecuritySettings> {
  const settings = await apiRequest<SecuritySettings>('/api/security/settings/public', {
    includeSession: false,
  });

  return normalizeSecuritySettings(settings);
}

export async function getSecuritySettings(): Promise<SecuritySettings> {
  const settings = await apiRequest<SecuritySettings>('/api/security/settings');

  return normalizeSecuritySettings(settings);
}

export async function updateSecuritySettings(
  settings: SecuritySettings
): Promise<SecuritySettings> {
  const updated = await apiRequest<SecuritySettings>('/api/security/settings', {
    method: 'PUT',
    body: settings,
  });

  return normalizeSecuritySettings(updated);
}
