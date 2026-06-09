export const SUGGESTED_PERMISSION_DEPENDENCIES: Record<string, string[]> = {
  REASSIGN_CUSTOMERS: ['VIEW_CUSTOMERS'],
  APPLY_CUSTOMER_BALANCE: ['VIEW_CUSTOMERS'],
  CREATE_CLOSE_CUSTOMER_PACKAGE: ['VIEW_CUSTOMERS'],
  VIEW_CUSTOMER_ORDERS: ['VIEW_CUSTOMERS'],
  EDIT_CUSTOMER: ['VIEW_CUSTOMERS'],
  MANAGE_INVENTORY: ['VIEW_INVENTORY'],
  CREATE_ITEM: ['VIEW_INVENTORY'],
  EDIT_ITEM: ['VIEW_INVENTORY'],
  REGISTER_PAYMENTS: ['VIEW_PAYMENTS'],
  VOID_PAYMENT: ['VIEW_PAYMENTS'],
  OPERATE_LIVE: ['VIEW_LIVE'],
  PREPARE_LIVE_ITEM: ['VIEW_LIVE'],
  CHANGE_LIVE_ACTIVE_ITEM: ['OPERATE_LIVE'],
  REMOVE_LIVE_ACTIVE_ITEM: ['OPERATE_LIVE'],
};

const PERMISSION_GROUP_ORDER = [
  'Clientes',
  'Inventario',
  'Lotes',
  'Pagos',
  'Ventas',
  'Reportes',
  'Transferencias',
  'Consignaciones',
  'Sistema/Usuarios',
  'En vivo',
  'Otros',
];

const PERMISSION_LABELS_ES: Record<string, string> = {
  APPLY_CUSTOMER_BALANCE: 'Aplicar saldo de cliente',
  APPLY_APPROVED_LIVE_PRICE_CHANGE: 'Aplicar precio LIVE aprobado',
  APPLY_LIVE_OPERATION_AUTHORIZATION: 'Aplicar autorización operativa LIVE',
  APPROVE_REFUND: 'Aprobar devolución',
  APPROVE_LIVE_OPERATION_AUTHORIZATION: 'Aprobar autorización operativa LIVE',
  APPROVE_LIVE_PRICE_CHANGE: 'Aprobar cambio de precio LIVE',
  CANCEL_CONSIGNMENTS: 'Cancelar consignaciones',
  CANCEL_REFUND: 'Cancelar devolución',
  CANCEL_RESERVATION: 'Cancelar apartado',
  CANCEL_RESERVATION_WITH_PAYMENT: 'Cancelar apartado con pago',
  CANCEL_SALE: 'Cancelar venta',
  CANCEL_TRANSFERS: 'Cancelar transferencias',
  CHANGE_LIVE_ACTIVE_ITEM: 'Cambiar prenda al aire',
  CHANGE_LIVE_PRICE: 'Cambiar precio LIVE directamente',
  CLOSE_LIVE_OPERATIONAL_SALE: 'Cerrar venta operativa LIVE',
  CREATE_CLOSE_CUSTOMER_PACKAGE: 'Crear cierre de paquete de cliente',
  CREATE_CUSTOMER: 'Crear cliente',
  CREATE_CUSTOMER_PACKAGES: 'Crear cierre de paquete de cliente',
  CREATE_ITEM: 'Crear prenda',
  DO_DOOR_RESERVATION: 'Apartar en puerta',
  DO_DOOR_SALE: 'Venta puerta',
  DO_LIVE_RESERVATION: 'Apartar en LIVE',
  EXECUTE_REFUND: 'Ejecutar devolución',
  EDIT_CUSTOMER: 'Editar cliente',
  EDIT_ITEM: 'Editar prenda',
  EDIT_LOCKED_ITEM: 'Editar prenda bloqueada',
  ADMIN_ROLES: 'Administrar roles',
  ADMIN_SECURITY: 'Administrar seguridad',
  ADMIN_SHIPMENTS: 'Administrar envíos',
  ADMIN_TRANSFERS: 'Administrar transferencias',
  ADMIN_USERS: 'Administrar usuarios',
  MANAGE_BRANDING: 'Administrar apariencia y marca',
  MANAGE_BRANCH_CHANNELS: 'Administrar canales operativos',
  MANAGE_BRANCHES: 'Administrar sucursales',
  MANAGE_CASH_CLOSURES: 'Administrar cortes de caja',
  MANAGE_CASH_CUTS: 'Administrar cortes de caja',
  MANAGE_CATALOGS: 'Administrar catálogos',
  MANAGE_CONSIGNMENTS: 'Administrar consignaciones',
  MANAGE_CHANNELS: 'Administrar canales operativos',
  MANAGE_CUSTOMER_PACKAGES: 'Administrar paquetes de cliente',
  MANAGE_INCIDENTS: 'Administrar incidencias',
  MANAGE_INVENTORY: 'Administrar inventario',
  MANAGE_REFUNDS: 'Administrar devoluciones',
  MANAGE_RETURNS: 'Administrar retornos',
  MANAGE_ROLES: 'Administrar roles',
  MANAGE_SECURITY_SETTINGS: 'Administrar seguridad',
  MANAGE_SHIPMENTS: 'Administrar envios',
  MANAGE_TRANSFERS: 'Administrar transferencias',
  MANAGE_USERS: 'Administrar usuarios',
  OPERATE_LIVE: 'Operar LIVE',
  PREPARE_LIVE_ITEM: 'Preparar prenda para LIVE',
  PROCESS_REFUND: 'Procesar devolución',
  REASSIGN_CUSTOMERS: 'Reasignar clientes',
  REASSIGN_RESERVATION: 'Reasignar apartado',
  RECEIVE_TRANSFERS: 'Recibir transferencias',
  REGISTER_PAYMENTS: 'Registrar pagos',
  RELEASE_RESERVED_ITEM: 'Liberar prenda apartada',
  REMOVE_LIVE_ACTIVE_ITEM: 'Retirar prenda del aire',
  REQUEST_LIVE_OPERATION_AUTHORIZATION: 'Solicitar autorización operativa LIVE',
  REQUEST_LIVE_PRICE_CHANGE: 'Solicitar cambio de precio LIVE',
  REQUEST_REFUND: 'Solicitar devolución',
  SEND_TRANSFERS: 'Enviar transferencias',
  SETTLE_CONSIGNMENTS: 'Liquidar consignaciones',
  UNDO_LIVE_OPERATIONAL_SALE: 'Deshacer cierre de venta LIVE',
  VIEW_CUSTOMER_ORDERS: 'Ver pedidos de cliente',
  VIEW_CUSTOMERS: 'Ver clientes',
  VIEW_DEPOSIT_REPORTS: 'Ver reporte de depósitos',
  VIEW_INVENTORY: 'Ver inventario',
  VIEW_LIVE: 'Ver LIVE',
  VIEW_LIVE_OPERATION_AUTHORIZATIONS: 'Ver autorizaciones operativas LIVE',
  VIEW_LIVE_PRICE_AUTHORIZATIONS: 'Ver autorizaciones de precio LIVE',
  VIEW_PAYMENT_STATUS: 'Ver estado de pago',
  VIEW_PAYMENTS: 'Ver pagos',
  VIEW_REPORTS: 'Ver reportes',
  VIEW_SALES: 'Ver ventas',
  VIEW_SECURITY_AUDIT: 'Ver auditoria de seguridad',
  VOID_PAYMENT: 'Anular pago',
};

const PERMISSION_LABELS_EN: Record<string, string> = {
  APPLY_CUSTOMER_BALANCE: 'Apply customer balance',
  APPLY_APPROVED_LIVE_PRICE_CHANGE: 'Apply approved LIVE price',
  APPLY_LIVE_OPERATION_AUTHORIZATION: 'Apply LIVE operational authorization',
  APPROVE_REFUND: 'Approve refund',
  APPROVE_LIVE_OPERATION_AUTHORIZATION: 'Approve LIVE operational authorization',
  APPROVE_LIVE_PRICE_CHANGE: 'Approve LIVE price change',
  CANCEL_CONSIGNMENTS: 'Cancel consignments',
  CANCEL_REFUND: 'Cancel refund',
  CANCEL_RESERVATION: 'Cancel hold',
  CANCEL_RESERVATION_WITH_PAYMENT: 'Cancel hold with payment',
  CANCEL_SALE: 'Cancel sale',
  CANCEL_TRANSFERS: 'Cancel transfers',
  CHANGE_LIVE_ACTIVE_ITEM: 'Change live item on air',
  CHANGE_LIVE_PRICE: 'Change LIVE price directly',
  CLOSE_LIVE_OPERATIONAL_SALE: 'Close LIVE operational sale',
  CREATE_CLOSE_CUSTOMER_PACKAGE: 'Create customer package closing',
  CREATE_CUSTOMER: 'Create customer',
  CREATE_CUSTOMER_PACKAGES: 'Create customer package closing',
  CREATE_ITEM: 'Create item',
  DO_DOOR_RESERVATION: 'Door hold',
  DO_DOOR_SALE: 'Door sale',
  DO_LIVE_RESERVATION: 'LIVE hold',
  EDIT_CUSTOMER: 'Edit customer',
  EDIT_ITEM: 'Edit item',
  EDIT_LOCKED_ITEM: 'Edit locked item',
  EXECUTE_REFUND: 'Execute refund',
  ADMIN_ROLES: 'Manage roles',
  ADMIN_SECURITY: 'Manage security',
  ADMIN_SHIPMENTS: 'Manage shipments',
  ADMIN_TRANSFERS: 'Manage transfers',
  ADMIN_USERS: 'Manage users',
  MANAGE_BRANDING: 'Manage branding',
  MANAGE_BRANCH_CHANNELS: 'Manage operational channels',
  MANAGE_BRANCHES: 'Manage branches',
  MANAGE_CASH_CLOSURES: 'Manage cash closures',
  MANAGE_CASH_CUTS: 'Manage cash closures',
  MANAGE_CATALOGS: 'Manage catalogs',
  MANAGE_CHANNELS: 'Manage operational channels',
  MANAGE_CONSIGNMENTS: 'Manage consignments',
  MANAGE_CUSTOMER_PACKAGES: 'Manage customer packages',
  MANAGE_INCIDENTS: 'Manage incidents',
  MANAGE_INVENTORY: 'Manage inventory',
  MANAGE_REFUNDS: 'Manage refunds',
  MANAGE_RETURNS: 'Manage returns',
  MANAGE_ROLES: 'Manage roles',
  MANAGE_SECURITY_SETTINGS: 'Manage security',
  MANAGE_SHIPMENTS: 'Manage shipments',
  MANAGE_TRANSFERS: 'Manage transfers',
  MANAGE_USERS: 'Manage users',
  OPERATE_LIVE: 'Operate LIVE',
  PREPARE_LIVE_ITEM: 'Prepare item for LIVE',
  PROCESS_REFUND: 'Process refund',
  REASSIGN_CUSTOMERS: 'Reassign customers',
  REASSIGN_RESERVATION: 'Reassign hold',
  RECEIVE_TRANSFERS: 'Receive transfers',
  REGISTER_PAYMENTS: 'Register payments',
  RELEASE_RESERVED_ITEM: 'Release held item',
  REMOVE_LIVE_ACTIVE_ITEM: 'Remove item from air',
  REQUEST_LIVE_OPERATION_AUTHORIZATION: 'Request LIVE operational authorization',
  REQUEST_LIVE_PRICE_CHANGE: 'Request LIVE price change',
  REQUEST_REFUND: 'Request refund',
  SEND_TRANSFERS: 'Send transfers',
  SETTLE_CONSIGNMENTS: 'Settle consignments',
  UNDO_LIVE_OPERATIONAL_SALE: 'Undo LIVE sale closing',
  VIEW_CUSTOMER_ORDERS: 'View customer orders',
  VIEW_CUSTOMERS: 'View customers',
  VIEW_DEPOSIT_REPORTS: 'View deposit reports',
  VIEW_INVENTORY: 'View inventory',
  VIEW_LIVE: 'View LIVE',
  VIEW_LIVE_OPERATION_AUTHORIZATIONS: 'View LIVE operational authorizations',
  VIEW_LIVE_PRICE_AUTHORIZATIONS: 'View LIVE price authorizations',
  VIEW_PAYMENT_STATUS: 'View payment status',
  VIEW_PAYMENTS: 'View payments',
  VIEW_REPORTS: 'View reports',
  VIEW_SALES: 'View sales',
  VIEW_SECURITY_AUDIT: 'View security audit',
  VOID_PAYMENT: 'Void payment',
};

function permissionLabelsForLanguage(language = 'es'): Record<string, string> {
  return language.toLowerCase().startsWith('es') ? PERMISSION_LABELS_ES : PERMISSION_LABELS_EN;
}

export function formatPermissionCode(code: string, language = 'es'): string {
  const normalized = code.toUpperCase();
  const knownLabel = permissionLabelsForLanguage(language)[normalized];
  if (knownLabel) return knownLabel;

  return normalized
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}

export function inferPermissionGroup(permissionCode: string, permissionName = ''): string {
  const code = permissionCode.toUpperCase();
  const text = `${permissionCode} ${permissionName}`.toLowerCase();

  if (text.includes('cliente') || code.includes('CUSTOMER')) return 'Clientes';
  if (text.includes('inventario') || text.includes('prenda') || code.includes('ITEM') || code.includes('INVENTORY')) {
    return 'Inventario';
  }
  if (text.includes('lote') || code.includes('BATCH')) return 'Lotes';
  if (text.includes('pago') || text.includes('saldo') || code.includes('PAYMENT') || code.includes('BALANCE')) {
    return 'Pagos';
  }
  if (text.includes('venta') || code.includes('SALE')) return 'Ventas';
  if (text.includes('reporte') || code.includes('REPORT')) return 'Reportes';
  if (text.includes('transferencia') || code.includes('TRANSFER')) return 'Transferencias';
  if (text.includes('consignacion') || text.includes('consignación') || code.includes('CONSIGNMENT')) {
    return 'Consignaciones';
  }
  if (text.includes('usuario') || text.includes('rol') || text.includes('seguridad') || code.includes('USER') || code.includes('ROLE') || code.includes('SECURITY')) {
    return 'Sistema/Usuarios';
  }
  if (text.includes('live') || text.includes('vivo') || code.includes('LIVE')) return 'En vivo';

  return 'Otros';
}

export function matchesPermissionSearch(
  permission: { code: string; name: string },
  search: string,
  language = 'es'
): boolean {
  const value = search.trim().toLowerCase();
  if (!value) return true;

  return `${permission.name} ${permission.code} ${formatPermissionCode(permission.code, language)} ${inferPermissionGroup(permission.code, permission.name)}`
    .toLowerCase()
    .includes(value);
}

export function sortPermissionsForDisplay<T extends { code: string; name: string }>(
  permissions: T[],
  language = 'es'
): T[] {
  return [...permissions].sort((left, right) => {
    const leftGroup = inferPermissionGroup(left.code, left.name);
    const rightGroup = inferPermissionGroup(right.code, right.name);
    const groupComparison =
      PERMISSION_GROUP_ORDER.indexOf(leftGroup) - PERMISSION_GROUP_ORDER.indexOf(rightGroup);
    if (groupComparison !== 0) return groupComparison;

    return formatPermissionCode(left.code, language).localeCompare(formatPermissionCode(right.code, language), language);
  });
}

export function groupPermissionsForDisplay<T extends { code: string; name: string }>(
  permissions: T[],
  language = 'es'
): { group: string; permissions: T[] }[] {
  return sortPermissionsForDisplay(permissions, language).reduce<{ group: string; permissions: T[] }[]>(
    (groups, permission) => {
      const group = inferPermissionGroup(permission.code, permission.name);
      const existingGroup = groups.find((current) => current.group === group);

      if (existingGroup) {
        existingGroup.permissions.push(permission);
      } else {
        groups.push({ group, permissions: [permission] });
      }

      return groups;
    },
    []
  );
}

export function getMissingSuggestedDependencies(
  permissionCode: string,
  selectedPermissionCodes: string[]
): string[] {
  const normalizedPermissionCode = permissionCode.toUpperCase();
  const selected = new Set(selectedPermissionCodes.map((code) => code.toUpperCase()));
  const configuredDependencies = SUGGESTED_PERMISSION_DEPENDENCIES[normalizedPermissionCode] ?? [];
  const reportDependencies =
    normalizedPermissionCode.startsWith('VIEW_REPORT_') && normalizedPermissionCode !== 'VIEW_REPORTS'
      ? ['VIEW_REPORTS']
      : [];

  return Array.from(new Set([...configuredDependencies, ...reportDependencies])).filter(
    (dependency) => !selected.has(dependency)
  );
}

export type PermissionDependencyWarning = {
  existsInCatalog: boolean;
  text: string;
};

export function getSuggestedDependencyWarnings(
  permissionCode: string,
  selectedPermissionCodes: string[],
  availablePermissions: { code: string; name: string }[],
  language = 'es'
): PermissionDependencyWarning[] {
  const isSpanish = language.toLowerCase().startsWith('es');

  return getMissingSuggestedDependencies(permissionCode, selectedPermissionCodes).map((dependencyCode) => {
    const dependency = availablePermissions.find(
      (permission) => permission.code.toUpperCase() === dependencyCode.toUpperCase()
    );

    return dependency
      ? {
          existsInCatalog: true,
          text: isSpanish
            ? `Este permiso puede requerir: ${formatPermissionCode(dependency.code, language)}`
            : `This permission may require: ${formatPermissionCode(dependency.code, language)}`,
        }
      : {
          existsInCatalog: false,
          text: isSpanish
            ? `Dependencia pendiente de definir en catálogo: ${formatPermissionCode(dependencyCode, language)}`
            : `Pending catalog dependency: ${formatPermissionCode(dependencyCode, language)}`,
        };
  });
}
