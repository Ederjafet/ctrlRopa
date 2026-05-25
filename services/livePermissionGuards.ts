import {
  canAccess,
  canAccessByPermission,
  can,
  hasChannel,
  hasAnyPermission,
  hasPermission,
  hasRole,
  isAdmin,
  isNoAccess,
} from '@/services/accessControl';
import { UserSession } from '@/services/sessionStorage';

const LIVE_CHANNEL = 'LIVE';

export function canViewLive(user: UserSession | null): boolean {
  return (
    hasChannel(user, LIVE_CHANNEL) &&
    (isAdmin(user) ||
      hasRole(user, 'QA_TENANT_ADMIN') ||
      hasRole(user, 'QA_TENANT_SELLER') ||
      hasPermission(user, 'DO_LIVE_RESERVATION') ||
      hasPermission(user, 'VIEW_REPORTS'))
  );
}

export function canOperateLive(user: UserSession | null): boolean {
  return canAccess(user, LIVE_CHANNEL, 'DO_LIVE_RESERVATION');
}

export function canSelectLiveCustomer(user: UserSession | null): boolean {
  return canOperateLive(user) && canAccessByPermission(user, 'VIEW_CUSTOMERS');
}

export function canCreateLiveCustomer(user: UserSession | null): boolean {
  return canSelectLiveCustomer(user);
}

export function canSelectLiveItem(user: UserSession | null): boolean {
  return canOperateLive(user) && canAccessByPermission(user, 'VIEW_INVENTORY');
}

export function canCreateLiveItem(user: UserSession | null): boolean {
  return canOperateLive(user) && canAccessByPermission(user, 'MANAGE_INVENTORY');
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
