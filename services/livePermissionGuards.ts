import {
  can,
  hasAnyPermission,
  hasPermission,
  hasRole,
  isAdmin,
  isNoAccess,
} from '@/services/accessControl';
import { resolveLiveCapabilities } from '@/services/liveCapabilities';
import { UserSession } from '@/services/sessionStorage';

export function canViewLive(user: UserSession | null): boolean {
  return resolveLiveCapabilities(user).canViewLive;
}

export function canOperateLive(user: UserSession | null): boolean {
  return resolveLiveCapabilities(user).canOperateLive;
}

export function canSelectLiveCustomer(user: UserSession | null): boolean {
  return resolveLiveCapabilities(user).canSelectCustomer;
}

export function canCreateLiveCustomer(user: UserSession | null): boolean {
  return resolveLiveCapabilities(user).canCreateCustomer;
}

export function canSelectLiveItem(user: UserSession | null): boolean {
  return resolveLiveCapabilities(user).canSelectItem;
}

export function canCreateLiveItem(user: UserSession | null): boolean {
  return resolveLiveCapabilities(user).canCreateItem;
}

export function canViewLiveAnalytics(user: UserSession | null): boolean {
  return (
    isAdmin(user) ||
    hasRole(user, 'QA_TENANT_ADMIN') ||
    hasPermission(user, 'VIEW_REPORTS') ||
    hasPermission(user, 'MANAGE_USERS')
  );
}

export function canConfigureSystem(user: UserSession | null): boolean {
  return (
    isAdmin(user) ||
    hasRole(user, 'QA_TENANT_ADMIN') ||
    hasAnyPermission(user, [
      'MANAGE_ROLES',
      'MANAGE_BRANCH_CHANNELS',
      'MANAGE_SECURITY_SETTINGS',
    ])
  );
}

export function canManageUsers(user: UserSession | null): boolean {
  return can(user, 'MANAGE_USERS');
}

export { can, hasAnyPermission, hasRole, isNoAccess };
