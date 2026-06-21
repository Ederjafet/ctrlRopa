const PERMISSION_DIAGNOSTICS_ENV =
  process.env.EXPO_PUBLIC_ENABLE_PERMISSION_DIAGNOSTICS?.trim().toLowerCase();

const ENABLED_VALUES = new Set(['1', 'true', 'yes', 'on', 'enabled']);
const DISABLED_VALUES = new Set(['0', 'false', 'no', 'off', 'disabled']);

export const PERMISSION_DIAGNOSTICS_FLAG = 'EXPO_PUBLIC_ENABLE_PERMISSION_DIAGNOSTICS';

export function isPermissionDiagnosticsEnabled() {
  if (PERMISSION_DIAGNOSTICS_ENV && ENABLED_VALUES.has(PERMISSION_DIAGNOSTICS_ENV)) {
    return true;
  }

  if (PERMISSION_DIAGNOSTICS_ENV && DISABLED_VALUES.has(PERMISSION_DIAGNOSTICS_ENV)) {
    return false;
  }

  return process.env.NODE_ENV !== 'production';
}
