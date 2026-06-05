import {
  canAccess,
  canAccessByPermission,
  hasEffectivePermission,
  hasPermission,
  hasRole,
  isAdmin,
  isNoAccess,
} from '@/services/accessControl';
import { UserSession } from '@/services/sessionStorage';

const LIVE_CHANNEL = 'LIVE';

export type LiveViewMode = 'operator' | 'support' | 'supervisor' | 'blocked';

export type LiveCapabilities = {
  canViewLive: boolean;
  canOperateLive: boolean;
  canStartLive: boolean;
  canCloseLive: boolean;
  canPrepareItem: boolean;
  canSetActiveItem: boolean;
  canClearActiveItem: boolean;
  canCreateReservation: boolean;
  canCancelReservation: boolean;
  canMarkPending: boolean;
  canMarkOperationalSold: boolean;
  canReleaseReservedItem: boolean;
  canChangeLivePrice: boolean;
  canViewLiveDashboard: boolean;
  canViewLiveEvents: boolean;
  canViewLiveHistory: boolean;
  canViewPayments: boolean;
  canAccessCashbox: boolean;
  canSelectCustomer: boolean;
  canCreateCustomer: boolean;
  canSelectItem: boolean;
  canCreateItem: boolean;
  canChangeReservationStatus: boolean;
  viewMode: LiveViewMode;
  gaps: string[];
};

export const blockedLiveCapabilities: LiveCapabilities = {
  canViewLive: false,
  canOperateLive: false,
  canStartLive: false,
  canCloseLive: false,
  canPrepareItem: false,
  canSetActiveItem: false,
  canClearActiveItem: false,
  canCreateReservation: false,
  canCancelReservation: false,
  canMarkPending: false,
  canMarkOperationalSold: false,
  canReleaseReservedItem: false,
  canChangeLivePrice: false,
  canViewLiveDashboard: false,
  canViewLiveEvents: false,
  canViewLiveHistory: false,
  canViewPayments: false,
  canAccessCashbox: false,
  canSelectCustomer: false,
  canCreateCustomer: false,
  canSelectItem: false,
  canCreateItem: false,
  canChangeReservationStatus: false,
  viewMode: 'blocked',
  gaps: [],
};

export function resolveLiveCapabilities(user: UserSession | null): LiveCapabilities {
  if (!user || isNoAccess(user)) {
    return blockedLiveCapabilities;
  }

  const liveChannelEnabled = user.channels?.some(
    (channel) => channel.code === LIVE_CHANNEL && channel.enabled
  ) === true;
  const admin = isAdmin(user) || hasRole(user, 'QA_TENANT_ADMIN');
  const seller = hasRole(user, 'SELLER') || hasRole(user, 'QA_TENANT_SELLER');
  const supervisor = hasRole(user, 'SUPERVISOR');
  const liveReservation = hasPermission(user, 'DO_LIVE_RESERVATION');
  const viewReports = hasPermission(user, 'VIEW_REPORTS');
  const operate = canAccess(user, LIVE_CHANNEL, 'DO_LIVE_RESERVATION');
  const canViewLive = liveChannelEnabled && (admin || seller || supervisor || liveReservation || viewReports);
  const canSelectCustomer = operate && canAccessByPermission(user, 'VIEW_CUSTOMERS');
  const canSelectItem = operate && canAccessByPermission(user, 'VIEW_INVENTORY');
  const canManageInventory = canAccessByPermission(user, 'MANAGE_INVENTORY');
  const canCancelReservation = operate && canAccessByPermission(user, 'CANCEL_RESERVATION');
  const canViewPayments = hasEffectivePermission(user, 'VIEW_PAYMENTS');
  const canViewLiveDashboard = canViewLive && (supervisor || viewReports || admin);
  const canChangeLivePrice =
    operate &&
    (admin || (canManageInventory && canCancelReservation && canViewLiveDashboard));
  const canAccessCashbox =
    canAccessByPermission(user, 'MANAGE_CASH_CLOSURES') ||
    canAccessByPermission(user, 'REGISTER_PAYMENTS');
  const gaps: string[] = [
    'START_LIVE',
    'CLOSE_LIVE',
    'SET_LIVE_ACTIVE_ITEM',
    'CLEAR_LIVE_ACTIVE_ITEM',
    'UPDATE_LIVE_PRICE',
    'RELEASE_LIVE_RESERVED_ITEM',
  ];

  const viewMode: LiveViewMode = !canViewLive
    ? 'blocked'
    : supervisor || (canViewLiveDashboard && !admin && !seller)
      ? 'supervisor'
      : operate && !seller
        ? 'operator'
        : 'support';

  return {
    canViewLive,
    canOperateLive: operate,
    canStartLive: operate,
    canCloseLive: operate,
    canPrepareItem: operate && canSelectItem,
    canSetActiveItem: operate && canSelectItem,
    canClearActiveItem: operate && canSelectItem,
    canCreateReservation: operate,
    canCancelReservation,
    canMarkPending: operate,
    canMarkOperationalSold: operate,
    canReleaseReservedItem: canCancelReservation && canManageInventory && canViewPayments,
    canChangeLivePrice,
    canViewLiveDashboard,
    canViewLiveEvents: canViewLive,
    canViewLiveHistory: canViewLive,
    canViewPayments,
    canAccessCashbox,
    canSelectCustomer,
    canCreateCustomer: operate && canAccessByPermission(user, 'CREATE_CUSTOMER'),
    canSelectItem,
    canCreateItem: operate && canManageInventory,
    canChangeReservationStatus: operate,
    viewMode,
    gaps,
  };
}
