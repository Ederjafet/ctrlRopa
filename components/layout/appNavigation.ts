import { SidebarSection } from '@/components/layout/Sidebar';
import { canAccess, canAccessByPermission, isAdmin } from '@/services/accessControl';
import { canViewLive } from '@/services/livePermissionGuards';
import { UserSession } from '@/services/sessionStorage';

export function buildMainNavSections(session: UserSession | null): SidebarSection[] {
  const liveAllowed = canViewLive(session);
  const customersAllowed = canAccessByPermission(session, 'VIEW_CUSTOMERS');
  const reservationsAllowed =
    canAccess(session, 'DOOR_RESERVATION', 'DO_DOOR_RESERVATION') || liveAllowed;
  const usersAllowed = canAccessByPermission(session, 'MANAGE_USERS') || isAdmin(session);
  const systemAllowed =
    canAccessByPermission(session, 'MANAGE_ROLES') ||
    canAccessByPermission(session, 'MANAGE_BRANCH_CHANNELS') ||
    isAdmin(session);
  const reportsAllowed = canAccessByPermission(session, 'VIEW_REPORTS') || isAdmin(session);
  const adminAllowed = isAdmin(session);

  const operationItems = [
    { key: 'home', label: 'Inicio', route: '/', icon: 'space-dashboard' as const },
    liveAllowed ? { key: 'live', label: 'LIVE', route: '/live', icon: 'live-tv' as const } : null,
    customersAllowed
      ? { key: 'customers', label: 'Clientes', route: '/customers', icon: 'groups' as const }
      : null,
    reservationsAllowed
      ? { key: 'reservations', label: 'Reservas', route: '/reservations', icon: 'bookmark' as const }
      : null,
  ].filter(Boolean);

  const controlItems = [
    usersAllowed
      ? { key: 'users', label: 'Usuarios', route: '/users', icon: 'manage-accounts' as const }
      : null,
    systemAllowed
      ? { key: 'system', label: 'Sistema', route: '/system', icon: 'settings' as const }
      : null,
    reportsAllowed
      ? { key: 'reports', label: 'Reportes', route: '/reports', icon: 'analytics' as const }
      : null,
    adminAllowed
      ? { key: 'appearance', label: 'Configuracion', route: '/appearance', icon: 'palette' as const }
      : null,
  ].filter(Boolean);

  const developmentItems = [
    adminAllowed
      ? { key: 'ui-kit', label: 'UI Kit', route: '/ui-kit', icon: 'dashboard-customize' as const }
      : null,
  ].filter(Boolean);

  return [
    { title: 'Operacion', items: operationItems },
    { title: 'Control', items: controlItems },
    { title: 'Desarrollo', items: developmentItems },
  ].filter((section) => section.items.length > 0) as SidebarSection[];
}

export function getSessionScopeLabel(session: UserSession | null) {
  const company = session?.companyName || session?.companyCode || 'Empresa no disponible';
  const branch = session?.branchName || 'Sucursal no disponible';
  return `${company} · ${branch}`;
}
