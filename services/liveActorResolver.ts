import { hasPermission, hasRole, isAdmin, isNoAccess } from '@/services/accessControl';
import {
  blockedLiveCapabilities,
  LiveCapabilities,
  resolveLiveCapabilities,
} from '@/services/liveCapabilities';
import { UserSession } from '@/services/sessionStorage';

export type LiveActorRole =
  | 'OPERATOR'
  | 'SELLER'
  | 'SUPERVISOR'
  | 'PRESENTER'
  | 'NO_ACCESS';

export type LiveActorCapabilities = LiveCapabilities & {
  canSetActiveProduct: boolean;
  canReserve: boolean;
  canViewEvents: boolean;
};

export type LiveActorContext = {
  actor: LiveActorRole;
  labelKey: string;
  subtitleKey: string;
  capabilities: LiveActorCapabilities;
  reasonKey?: string;
};

const blockedCapabilities: LiveActorCapabilities = {
  ...blockedLiveCapabilities,
  canSetActiveProduct: false,
  canReserve: false,
  canViewEvents: false,
};

function withLegacyAliases(capabilities: LiveCapabilities): LiveActorCapabilities {
  return {
    ...capabilities,
    canSetActiveProduct: capabilities.canSetActiveItem,
    canReserve: capabilities.canCreateReservation,
    canViewEvents: capabilities.canViewLiveEvents,
  };
}

export function resolveLiveActorContext(user: UserSession | null): LiveActorContext {
  const capabilities = withLegacyAliases(resolveLiveCapabilities(user));
  const viewLive = capabilities.canViewLive;

  if (!user || isNoAccess(user) || !viewLive) {
    return {
      actor: 'NO_ACCESS',
      labelKey: 'live.actorNoAccessLabel',
      subtitleKey: 'live.actorNoAccessSubtitle',
      capabilities: blockedCapabilities,
      reasonKey: 'live.accessDenied',
    };
  }

  if (hasRole(user, 'SUPERVISOR')) {
    return {
      actor: 'SUPERVISOR',
      labelKey: 'live.actorSupervisorLabel',
      subtitleKey: 'live.actorSupervisorSubtitle',
      capabilities,
    };
  }

  if (capabilities.canOperateLive && (hasRole(user, 'SELLER') || hasRole(user, 'QA_TENANT_SELLER'))) {
    return {
      actor: 'SELLER',
      labelKey: 'live.actorSellerLabel',
      subtitleKey: 'live.actorSellerSubtitle',
      capabilities,
    };
  }

  if (capabilities.canOperateLive || isAdmin(user) || hasRole(user, 'QA_TENANT_ADMIN')) {
    return {
      actor: 'OPERATOR',
      labelKey: 'live.actorOperatorLabel',
      subtitleKey: 'live.actorOperatorSubtitle',
      capabilities,
    };
  }

  if (hasPermission(user, 'VIEW_REPORTS')) {
    return {
      actor: 'SUPERVISOR',
      labelKey: 'live.actorSupervisorLabel',
      subtitleKey: 'live.actorSupervisorSubtitle',
      capabilities,
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
