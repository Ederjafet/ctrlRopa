import { UserSession } from '@/services/sessionStorage';

export function isAdmin(user: UserSession | null): boolean {
  return hasRole(user, 'ADMIN');
}

export function hasRole(user: UserSession | null, code: string): boolean {
  return user?.roles?.some((role) => role.code === code) === true;
}

export function hasAnyRole(user: UserSession | null, codes: string[]): boolean {
  return codes.some((code) => hasRole(user, code));
}

export function getRoleCodes(user: UserSession | null): string[] {
  return user?.roles?.map((role) => role.code) ?? [];
}

export function hasChannel(user: UserSession | null, code: string): boolean {
  return (
    user?.channels?.some(
      (channel) => channel.code === code && channel.enabled === true
    ) === true
  );
}

export function hasPermission(
  user: UserSession | null,
  code: string | null
): boolean {
  if (!code) return true;
  if (isAdmin(user)) return true;

  return (
    user?.effectivePermissions?.some(
      (permission) => permission.code === code
    ) === true
  );
}

export function canAccess(
  user: UserSession | null,
  channelCode: string,
  permissionCode: string | null
): boolean {
  return hasChannel(user, channelCode) && hasPermission(user, permissionCode);
}

export function canAccessByPermission(
  user: UserSession | null,
  permissionCode: string
): boolean {
  return hasPermission(user, permissionCode);
}
