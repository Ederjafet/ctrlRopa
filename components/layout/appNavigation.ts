import { SidebarSection } from '@/components/layout/Sidebar';
import {
  canAccess,
  canAccessByPermission,
  hasAnyPermission,
  isAdmin,
  isNoAccess,
} from '@/services/accessControl';
import { canViewLive } from '@/services/livePermissionGuards';
import { UserSession } from '@/services/sessionStorage';

export function buildMainNavSections(session: UserSession | null): SidebarSection[] {
  if (!session || isNoAccess(session)) {
    return [];
  }

  const liveAllowed = canViewLive(session);
  const doorSaleAllowed = canAccess(session, 'DOOR_SALE', 'DO_DOOR_SALE');
  const doorReservationAllowed = canAccess(session, 'DOOR_RESERVATION', 'DO_DOOR_RESERVATION');
  const customersAllowed = canAccessByPermission(session, 'VIEW_CUSTOMERS');
  const reservationsAllowed = doorReservationAllowed || liveAllowed;
  const inventoryAllowed = hasAnyPermission(session, ['VIEW_INVENTORY', 'MANAGE_INVENTORY']);
  const inventoryManageAllowed = canAccessByPermission(session, 'MANAGE_INVENTORY');
  const usersAllowed = canAccessByPermission(session, 'MANAGE_USERS') || isAdmin(session);
  const rolesAllowed = canAccessByPermission(session, 'MANAGE_ROLES') || isAdmin(session);
  const channelsAllowed = canAccessByPermission(session, 'MANAGE_BRANCH_CHANNELS') || isAdmin(session);
  const systemAllowed =
    rolesAllowed ||
    channelsAllowed ||
    isAdmin(session);
  const reportsAllowed = canAccessByPermission(session, 'VIEW_REPORTS') || isAdmin(session);
  const securityAuditAllowed = canAccessByPermission(session, 'VIEW_SECURITY_AUDIT') || isAdmin(session);
  const adminAllowed = isAdmin(session);

  const homeItems = [
    { key: 'home', label: 'Resumen operativo', route: '/', icon: 'space-dashboard' as const },
  ];

  const operationItems = [
    liveAllowed
      ? { key: 'live', label: 'En vivo', route: '/live', icon: 'live-tv' as const }
      : null,
    doorSaleAllowed
      ? { key: 'door-sale', label: 'Venta puerta', route: '/door-sale', icon: 'point-of-sale' as const }
      : null,
    doorReservationAllowed
      ? {
          key: 'door-reservation',
          label: 'Apartado puerta',
          route: '/door-reservation',
          icon: 'assignment' as const,
        }
      : null,
    reservationsAllowed
      ? { key: 'reservations', label: 'Apartados', route: '/reservations', icon: 'bookmark' as const }
      : null,
    customersAllowed
      ? { key: 'customers', label: 'Clientes', route: '/customers', icon: 'groups' as const }
      : null,
  ].filter(Boolean);

  const inventoryItems = [
    inventoryAllowed
      ? { key: 'items', label: 'Prendas / Inventario', route: '/items', icon: 'inventory-2' as const }
      : null,
    inventoryManageAllowed
      ? { key: 'items-create', label: 'Alta de prendas', route: '/items-create', icon: 'add-box' as const }
      : null,
    inventoryAllowed
      ? { key: 'batches', label: 'Lotes', route: '/batches', icon: 'inventory' as const }
      : null,
  ].filter(Boolean);

  const adminItems = [
    usersAllowed
      ? { key: 'users', label: 'Usuarios', route: '/users', icon: 'manage-accounts' as const }
      : null,
    rolesAllowed
      ? { key: 'system-roles', label: 'Roles', route: '/system-roles', icon: 'admin-panel-settings' as const }
      : null,
    channelsAllowed
      ? { key: 'system-channels', label: 'Canales operativos', route: '/system-channels', icon: 'hub' as const }
      : null,
    systemAllowed
      ? { key: 'system', label: 'Sistema', route: '/system', icon: 'settings' as const }
      : null,
    adminAllowed
      ? { key: 'appearance', label: 'Apariencia / Branding', route: '/appearance', icon: 'palette' as const }
      : null,
  ].filter(Boolean);

  const reportItems = [
    reportsAllowed
      ? { key: 'reports', label: 'Reportes generales', route: '/reports', icon: 'analytics' as const }
      : null,
    reportsAllowed
      ? { key: 'report-daily-store', label: 'Diario tienda', route: '/report-daily-store', icon: 'today' as const }
      : null,
    reportsAllowed
      ? { key: 'report-deliveries', label: 'Entregas diarias', route: '/report-deliveries', icon: 'local-shipping' as const }
      : null,
    reportsAllowed
      ? { key: 'report-deposits', label: 'Depositos diarios', route: '/report-deposits', icon: 'payments' as const }
      : null,
    reportsAllowed
      ? {
          key: 'report-cancellations',
          label: 'Cancelaciones diarias',
          route: '/report-cancellations',
          icon: 'cancel' as const,
        }
      : null,
    reportsAllowed
      ? { key: 'report-live', label: 'Control Live', route: '/report-live', icon: 'live-tv' as const }
      : null,
    reportsAllowed
      ? { key: 'report-remissions', label: 'Remisiones', route: '/report-remissions', icon: 'receipt-long' as const }
      : null,
  ].filter(Boolean);

  const securityItems = [
    securityAuditAllowed
      ? {
          key: 'system-security-audit',
          label: 'Auditoria de seguridad',
          route: '/system-security-audit',
          icon: 'security' as const,
        }
      : null,
    adminAllowed
      ? { key: 'system-security', label: 'Seguridad dev', route: '/system-security', icon: 'lock' as const }
      : null,
    adminAllowed
      ? { key: 'system-sessions', label: 'Sesiones y bloqueos', route: '/system-sessions', icon: 'lock-clock' as const }
      : null,
  ].filter(Boolean);

  const developmentItems = [
    adminAllowed
      ? { key: 'ui-kit', label: 'UI Kit', route: '/ui-kit', icon: 'dashboard-customize' as const }
      : null,
  ].filter(Boolean);

  return [
    { title: 'Inicio', items: homeItems },
    { title: 'Operacion', items: operationItems },
    { title: 'Inventario', items: inventoryItems },
    { title: 'Administracion', items: adminItems },
    { title: 'Reportes', items: reportItems },
    { title: 'Seguridad', items: securityItems },
    { title: 'Desarrollo', items: developmentItems },
  ].filter((section) => section.items.length > 0) as SidebarSection[];
}

export function getSessionScopeLabel(session: UserSession | null) {
  const company = session?.companyName || session?.companyCode || 'Empresa no disponible';
  const branch = session?.branchName || 'Sucursal no disponible';
  return `${company} · ${branch}`;
}
