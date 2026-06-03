import { hasPermission, hasRole, isAdmin, isNoAccess } from '@/services/accessControl';
import {
  canCreateLiveCustomer,
  canCreateLiveItem,
  canOperateLive,
  canSelectLiveCustomer,
  canSelectLiveItem,
  canViewLive,
} from '@/services/livePermissionGuards';
import { UserSession } from '@/services/sessionStorage';

export type LiveActorRole =
  | 'OPERATOR'
  | 'SELLER'
  | 'SUPERVISOR'
  | 'PRESENTER'
  | 'NO_ACCESS';

export type LiveActorCapabilities = {
  canViewLive: boolean;
  canOperateLive: boolean;
  canStartLive: boolean;
  canCloseLive: boolean;
  canSelectCustomer: boolean;
  canCreateCustomer: boolean;
  canSelectItem: boolean;
  canCreateItem: boolean;
  canSetActiveProduct: boolean;
  canReserve: boolean;
  canChangeReservationStatus: boolean;
  canViewEvents: boolean;
  viewMode: 'operator' | 'support' | 'supervisor' | 'blocked';
};

export type LiveActorContext = {
  actor: LiveActorRole;
  labelKey: string;
  subtitleKey: string;
  capabilities: LiveActorCapabilities;
  reasonKey?: string;
};

const blockedCapabilities: LiveActorCapabilities = {
  canViewLive: false,
  canOperateLive: false,
  canStartLive: false,
  canCloseLive: false,
  canSelectCustomer: false,
  canCreateCustomer: false,
  canSelectItem: false,
  canCreateItem: false,
  canSetActiveProduct: false,
  canReserve: false,
  canChangeReservationStatus: false,
  canViewEvents: false,
  viewMode: 'blocked',
};

export function resolveLiveActorContext(user: UserSession | null): LiveActorContext {
  const viewLive = canViewLive(user);

  if (!user || isNoAccess(user) || !viewLive) {
    return {
      actor: 'NO_ACCESS',
      labelKey: 'live.actorNoAccessLabel',
      subtitleKey: 'live.actorNoAccessSubtitle',
      capabilities: blockedCapabilities,
      reasonKey: 'live.accessDenied',
    };
  }

  const operate = canOperateLive(user);
  const selectCustomer = canSelectLiveCustomer(user);
  const createCustomer = canCreateLiveCustomer(user);
  const selectItem = canSelectLiveItem(user);
  const createItem = canCreateLiveItem(user);
  const baseCapabilities: LiveActorCapabilities = {
    canViewLive: viewLive,
    canOperateLive: operate,
    canStartLive: operate,
    canCloseLive: operate,
    canSelectCustomer: selectCustomer,
    canCreateCustomer: createCustomer,
    canSelectItem: selectItem,
    canCreateItem: createItem,
    canSetActiveProduct: operate && selectItem,
    canReserve: operate,
    canChangeReservationStatus: operate,
    canViewEvents: viewLive,
    viewMode: 'support',
  };

  if (hasRole(user, 'SUPERVISOR')) {
    return {
      actor: 'SUPERVISOR',
      labelKey: 'live.actorSupervisorLabel',
      subtitleKey: 'live.actorSupervisorSubtitle',
      capabilities: {
        ...baseCapabilities,
        viewMode: 'supervisor',
      },
    };
  }

  if (operate && (hasRole(user, 'SELLER') || hasRole(user, 'QA_TENANT_SELLER'))) {
    return {
      actor: 'SELLER',
      labelKey: 'live.actorSellerLabel',
      subtitleKey: 'live.actorSellerSubtitle',
      capabilities: {
        ...baseCapabilities,
        viewMode: 'support',
      },
    };
  }

  if (operate || isAdmin(user) || hasRole(user, 'QA_TENANT_ADMIN')) {
    return {
      actor: 'OPERATOR',
      labelKey: 'live.actorOperatorLabel',
      subtitleKey: 'live.actorOperatorSubtitle',
      capabilities: {
        ...baseCapabilities,
        viewMode: 'operator',
      },
    };
  }

  if (hasPermission(user, 'VIEW_REPORTS')) {
    return {
      actor: 'SUPERVISOR',
      labelKey: 'live.actorSupervisorLabel',
      subtitleKey: 'live.actorSupervisorSubtitle',
      capabilities: {
        ...baseCapabilities,
        viewMode: 'supervisor',
      },
    };
  }

  return {
    actor: 'NO_ACCESS',
    labelKey: 'live.actorNoAccessLabel',
    subtitleKey: 'live.actorNoAccessSubtitle',
    capabilities: blockedCapabilities,
    reasonKey: 'live.accessDenied',
  };
}
