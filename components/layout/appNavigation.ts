import { SidebarSection } from '@/components/layout/Sidebar';
import {
  canAccess,
  canAccessByPermission,
  canAccessPlatform,
  hasAnyPermission,
  isAdmin,
  isNoAccess,
  isPlatformOwner,
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
  const packagesAllowed = canAccessByPermission(session, 'CREATE_CLOSE_CUSTOMER_PACKAGE');
  const shipmentsAllowed = canAccessByPermission(session, 'MANAGE_SHIPMENTS');
  const operationalAuthorizationsAllowed = hasAnyPermission(session, [
    'VIEW_LIVE_OPERATION_AUTHORIZATIONS',
    'REQUEST_LIVE_OPERATION_AUTHORIZATION',
  ]);
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
  const platformAllowed = canAccessPlatform(session);

  if (platformAllowed && isPlatformOwner(session)) {
    return [
      {
        title: 'PLATAFORMA',
        items: [
          {
            key: 'platform',
            label: 'Panel Plataforma',
            helper: 'Clientes / Compañías',
            route: '/platform',
            activeFor: ['platform', '/platform'],
            icon: 'business' as const,
          },
        ],
      },
    ];
  }

  const homeItems = [
    { key: 'home', label: 'Resumen operativo', labelKey: 'navigation.items.homeSummary', route: '/', activeFor: ['home', '/'], icon: 'space-dashboard' as const },
  ];

  const platformItems = [
    platformAllowed
      ? { key: 'platform', label: 'Panel Plataforma', helper: 'Clientes / Compañías', route: '/platform', activeFor: ['platform', '/platform'], icon: 'business' as const }
      : null,
  ].filter(Boolean);

  const operationItems = [
    liveAllowed
      ? { key: 'live', label: 'En vivo', labelKey: 'navigation.items.live', route: '/live', activeFor: ['live', '/live'], icon: 'live-tv' as const }
      : null,
    doorSaleAllowed
      ? { key: 'door-sale', label: 'Venta puerta', labelKey: 'navigation.items.doorSale', route: '/door-sale', activeFor: ['door-sale', '/door-sale'], icon: 'point-of-sale' as const }
      : null,
    doorReservationAllowed
      ? {
          key: 'door-reservation',
          label: 'Apartado puerta',
          labelKey: 'navigation.items.doorHold',
          route: '/door-reservation',
          activeFor: ['door-reservation', '/door-reservation'],
          icon: 'assignment' as const,
        }
      : null,
    reservationsAllowed
      ? { key: 'reservations', label: 'Apartados', labelKey: 'navigation.items.holds', route: '/reservations', activeFor: ['reservations', '/reservations', 'reservation-detail', '/reservation-detail'], icon: 'bookmark' as const }
      : null,
    packagesAllowed
      ? { key: 'customer-packages', label: 'Paquetes', labelKey: 'navigation.items.packages', route: '/customer-packages', activeFor: ['customer-packages', '/customer-packages', 'customer-package-detail', '/customer-package-detail'], icon: 'inventory' as const }
      : null,
    shipmentsAllowed
      ? { key: 'shipments', label: 'Envíos', labelKey: 'navigation.items.shipments', route: '/shipments', activeFor: ['shipments', '/shipments', 'shipment-detail', '/shipment-detail'], icon: 'local-shipping' as const }
      : null,
    operationalAuthorizationsAllowed
      ? {
          key: 'operational-authorizations',
          label: 'Autorizaciones LIVE',
          labelKey: 'navigation.items.operationalAuthorizations',
          route: '/operational-authorizations',
          activeFor: ['operational-authorizations', '/operational-authorizations'],
          icon: 'approval' as const,
        }
      : null,
    customersAllowed
      ? { key: 'customers', label: 'Clientes', labelKey: 'navigation.items.customers', route: '/customers', activeFor: ['customers', '/customers', 'customers-create', '/customers-create'], icon: 'groups' as const }
      : null,
  ].filter(Boolean);

  const inventoryItems = [
    inventoryAllowed
      ? { key: 'items', label: 'Prendas / Inventario', labelKey: 'navigation.items.itemsInventory', route: '/items', activeFor: ['items', '/items'], icon: 'inventory-2' as const }
      : null,
    inventoryManageAllowed
      ? { key: 'items-create', label: 'Alta de prendas', labelKey: 'navigation.items.createItems', route: '/items-create', activeFor: ['items-create', '/items-create'], icon: 'add-box' as const }
      : null,
    inventoryAllowed
      ? { key: 'batches', label: 'Lotes', labelKey: 'navigation.items.batches', route: '/batches', activeFor: ['batches', '/batches', 'batch-form', '/batch-form', 'batch-detail', '/batch-detail'], icon: 'inventory' as const }
      : null,
  ].filter(Boolean);

  const adminItems = [
    usersAllowed
      ? { key: 'users', label: 'Usuarios', labelKey: 'navigation.items.users', route: '/users', activeFor: ['users', '/users', 'users-form', '/users-form'], icon: 'manage-accounts' as const }
      : null,
    rolesAllowed
      ? { key: 'system-roles', label: 'Roles', labelKey: 'navigation.items.roles', route: '/system-roles', activeFor: ['system-roles', '/system-roles'], icon: 'admin-panel-settings' as const }
      : null,
    channelsAllowed
      ? { key: 'system-channels', label: 'Canales operativos', labelKey: 'navigation.items.channels', route: '/system-channels', activeFor: ['system-channels', '/system-channels'], icon: 'hub' as const }
      : null,
    systemAllowed
      ? { key: 'system', label: 'Sistema', labelKey: 'navigation.items.system', route: '/system', activeFor: ['system', '/system'], icon: 'settings' as const }
      : null,
    adminAllowed
      ? { key: 'appearance', label: 'Apariencia / Branding', labelKey: 'navigation.items.appearance', route: '/appearance', activeFor: ['appearance', '/appearance'], icon: 'palette' as const }
      : null,
  ].filter(Boolean);

  const reportItems = [
    reportsAllowed
      ? { key: 'reports', label: 'Reportes generales', labelKey: 'navigation.items.reportsGeneral', route: '/reports', activeFor: ['reports', '/reports'], icon: 'analytics' as const }
      : null,
    reportsAllowed
      ? { key: 'report-daily-store', label: 'Diario tienda', labelKey: 'navigation.items.dailyStore', route: '/report-daily-store', activeFor: ['report-daily-store', '/report-daily-store'], icon: 'today' as const }
      : null,
    reportsAllowed
      ? { key: 'report-deliveries', label: 'Entregas diarias', labelKey: 'navigation.items.dailyDeliveries', route: '/report-deliveries', activeFor: ['report-deliveries', '/report-deliveries'], icon: 'local-shipping' as const }
      : null,
    reportsAllowed
      ? { key: 'report-deposits', label: 'Depositos diarios', labelKey: 'navigation.items.dailyDeposits', route: '/report-deposits', activeFor: ['report-deposits', '/report-deposits'], icon: 'payments' as const }
      : null,
    reportsAllowed
      ? {
          key: 'report-cancellations',
          label: 'Cancelaciones diarias',
          labelKey: 'navigation.items.dailyCancellations',
          route: '/report-cancellations',
          activeFor: ['report-cancellations', '/report-cancellations'],
          icon: 'cancel' as const,
        }
      : null,
    reportsAllowed
      ? { key: 'report-live', label: 'Control Live', labelKey: 'navigation.items.liveControl', route: '/report-live', activeFor: ['report-live', '/report-live'], icon: 'live-tv' as const }
      : null,
    reportsAllowed
      ? { key: 'report-remissions', label: 'Remisiones', labelKey: 'navigation.items.remissions', route: '/report-remissions', activeFor: ['report-remissions', '/report-remissions'], icon: 'receipt-long' as const }
      : null,
  ].filter(Boolean);

  const securityItems = [
    securityAuditAllowed
      ? {
          key: 'system-security-audit',
          label: 'Auditoria de seguridad',
          labelKey: 'navigation.items.securityAudit',
          route: '/system-security-audit',
          activeFor: ['system-security-audit', '/system-security-audit'],
          icon: 'security' as const,
        }
      : null,
    adminAllowed
      ? { key: 'system-security', label: 'Seguridad dev', labelKey: 'navigation.items.devSecurity', route: '/system-security', activeFor: ['system-security', '/system-security'], icon: 'lock' as const }
      : null,
    adminAllowed
      ? { key: 'system-sessions', label: 'Sesiones y bloqueos', labelKey: 'navigation.items.sessionsLocks', route: '/system-sessions', activeFor: ['system-sessions', '/system-sessions'], icon: 'lock-clock' as const }
      : null,
  ].filter(Boolean);

  const developmentItems = [
    adminAllowed
      ? { key: 'ui-kit', label: 'UI Kit', labelKey: 'navigation.items.uiKit', route: '/ui-kit', activeFor: ['ui-kit', '/ui-kit'], icon: 'dashboard-customize' as const }
      : null,
  ].filter(Boolean);

  return [
    { title: 'Plataforma', items: platformItems },
    { title: 'Inicio', titleKey: 'navigation.sections.home', items: homeItems },
    { title: 'Operacion', titleKey: 'navigation.sections.operation', items: operationItems },
    { title: 'Inventario', titleKey: 'navigation.sections.inventory', items: inventoryItems },
    { title: 'Administracion', titleKey: 'navigation.sections.administration', items: adminItems },
    { title: 'Reportes', titleKey: 'navigation.sections.reports', items: reportItems },
    { title: 'Seguridad', titleKey: 'navigation.sections.security', items: securityItems },
    { title: 'Desarrollo', titleKey: 'navigation.sections.development', items: developmentItems },
  ].filter((section) => section.items.length > 0) as SidebarSection[];
}

export function getSessionScopeLabel(session: UserSession | null) {
  if (canAccessPlatform(session) && isPlatformOwner(session)) {
    return 'Modo Plataforma AppModa';
  }

  const company = session?.companyName || session?.companyCode || 'Empresa no disponible';
  const branch = session?.branchName || 'Sucursal no disponible';
  return `${company} · ${branch}`;
}
