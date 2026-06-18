import {
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
  const viewLivePermission = hasPermission(user, 'VIEW_LIVE');
  const operateLivePermission = hasPermission(user, 'OPERATE_LIVE');
  const prepareLiveItemPermission = hasPermission(user, 'PREPARE_LIVE_ITEM');
  const changeLiveActiveItemPermission = hasPermission(user, 'CHANGE_LIVE_ACTIVE_ITEM');
  const removeLiveActiveItemPermission = hasPermission(user, 'REMOVE_LIVE_ACTIVE_ITEM');
  const viewReports = hasPermission(user, 'VIEW_REPORTS');
  const operate = liveChannelEnabled && (operateLivePermission || liveReservation);
  const legacyLiveReservationAccess = liveChannelEnabled && liveReservation;
  const canViewLive =
    liveChannelEnabled &&
    (admin || viewLivePermission || operateLivePermission || liveReservation || viewReports);
  const canSelectCustomer = legacyLiveReservationAccess && canAccessByPermission(user, 'VIEW_CUSTOMERS');
  const canSelectItem = operate && canAccessByPermission(user, 'VIEW_INVENTORY');
  const canManageInventory = canAccessByPermission(user, 'MANAGE_INVENTORY');
  const canCreateDoorSale = canAccessByPermission(user, 'DO_DOOR_SALE');
  const canManageLiveSession = operate && (admin || (!seller && !supervisor));
  const canManageLiveItem = canManageLiveSession && canSelectItem;
  const canPrepareLiveItem = canSelectItem && (prepareLiveItemPermission || canManageLiveItem);
  const canSetLiveActiveItem = canSelectItem && (changeLiveActiveItemPermission || canManageLiveItem);
  const canClearLiveActiveItem = canSelectItem && (removeLiveActiveItemPermission || canManageLiveItem);
  const canCancelReservation = legacyLiveReservationAccess && canAccessByPermission(user, 'CANCEL_RESERVATION');
  const canMarkOperationalSold = legacyLiveReservationAccess && (admin || canCreateDoorSale);
  const canViewPayments = hasEffectivePermission(user, 'VIEW_PAYMENTS');
  const canViewLiveDashboard = canViewLive && (supervisor || viewReports || admin);
  const canChangeLivePrice =
    legacyLiveReservationAccess &&
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
      : operate
        ? 'operator'
        : 'support';

  return {
    canViewLive,
    canOperateLive: operate,
    canStartLive: canManageLiveSession,
    canCloseLive: canManageLiveSession,
    canPrepareItem: canPrepareLiveItem,
    canSetActiveItem: canSetLiveActiveItem,
    canClearActiveItem: canClearLiveActiveItem,
    canCreateReservation: legacyLiveReservationAccess,
    canCancelReservation,
    canMarkPending: legacyLiveReservationAccess,
    canMarkOperationalSold,
    canReleaseReservedItem: canCancelReservation && canManageInventory && canViewPayments,
    canChangeLivePrice,
    canViewLiveDashboard,
    canViewLiveEvents: canViewLive,
    canViewLiveHistory: canViewLive,
    canViewPayments,
    canAccessCashbox,
    canSelectCustomer,
    canCreateCustomer: legacyLiveReservationAccess && canAccessByPermission(user, 'CREATE_CUSTOMER'),
    canSelectItem,
    canCreateItem: canManageLiveSession && canManageInventory,
    canChangeReservationStatus: canMarkOperationalSold || canCancelReservation,
    viewMode,
    gaps,
  };
}
