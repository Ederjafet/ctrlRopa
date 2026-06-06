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
  CANCEL_RESERVATION: 'Cancelar apartado',
  CANCEL_SALE: 'Cancelar venta',
  CREATE_CLOSE_CUSTOMER_PACKAGE: 'Crear cierre de paquete de cliente',
  CREATE_CUSTOMER: 'Crear cliente',
  CREATE_ITEM: 'Crear prenda',
  DO_DOOR_RESERVATION: 'Apartar en puerta',
  DO_DOOR_SALE: 'Venta puerta',
  DO_LIVE_RESERVATION: 'Apartar en LIVE',
  EDIT_CUSTOMER: 'Editar cliente',
  EDIT_ITEM: 'Editar prenda',
  MANAGE_BRANCH_CHANNELS: 'Administrar canales operativos',
  MANAGE_BRANCHES: 'Administrar sucursales',
  MANAGE_CASH_CLOSURES: 'Administrar cortes de caja',
  MANAGE_CATALOGS: 'Administrar catalogos',
  MANAGE_CONSIGNMENTS: 'Administrar consignaciones',
  MANAGE_INCIDENTS: 'Administrar incidencias',
  MANAGE_INVENTORY: 'Administrar inventario',
  MANAGE_REFUNDS: 'Administrar devoluciones',
  MANAGE_RETURNS: 'Administrar retornos',
  MANAGE_ROLES: 'Administrar roles',
  MANAGE_SECURITY_SETTINGS: 'Administrar seguridad',
  MANAGE_SHIPMENTS: 'Administrar envios',
  MANAGE_TRANSFERS: 'Administrar transferencias',
  MANAGE_USERS: 'Administrar usuarios',
  REASSIGN_CUSTOMERS: 'Reasignar clientes',
  REGISTER_PAYMENTS: 'Registrar pagos',
  VIEW_CUSTOMER_ORDERS: 'Ver pedidos de cliente',
  VIEW_CUSTOMERS: 'Ver clientes',
  VIEW_INVENTORY: 'Ver inventario',
  VIEW_PAYMENTS: 'Ver pagos',
  VIEW_REPORTS: 'Ver reportes',
  VIEW_SALES: 'Ver ventas',
  VIEW_SECURITY_AUDIT: 'Ver auditoria de seguridad',
  VOID_PAYMENT: 'Anular pago',
};

export function formatPermissionCode(code: string): string {
  const normalized = code.toUpperCase();
  const knownLabel = PERMISSION_LABELS_ES[normalized];
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
  search: string
): boolean {
  const value = search.trim().toLowerCase();
  if (!value) return true;

  return `${permission.name} ${permission.code} ${formatPermissionCode(permission.code)} ${inferPermissionGroup(permission.code, permission.name)}`
    .toLowerCase()
    .includes(value);
}

export function sortPermissionsForDisplay<T extends { code: string; name: string }>(
  permissions: T[]
): T[] {
  return [...permissions].sort((left, right) => {
    const leftGroup = inferPermissionGroup(left.code, left.name);
    const rightGroup = inferPermissionGroup(right.code, right.name);
    const groupComparison =
      PERMISSION_GROUP_ORDER.indexOf(leftGroup) - PERMISSION_GROUP_ORDER.indexOf(rightGroup);
    if (groupComparison !== 0) return groupComparison;

    return formatPermissionCode(left.code).localeCompare(formatPermissionCode(right.code), 'es');
  });
}

export function groupPermissionsForDisplay<T extends { code: string; name: string }>(
  permissions: T[]
): { group: string; permissions: T[] }[] {
  return sortPermissionsForDisplay(permissions).reduce<{ group: string; permissions: T[] }[]>(
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
  availablePermissions: { code: string; name: string }[]
): PermissionDependencyWarning[] {
  return getMissingSuggestedDependencies(permissionCode, selectedPermissionCodes).map((dependencyCode) => {
    const dependency = availablePermissions.find(
      (permission) => permission.code.toUpperCase() === dependencyCode.toUpperCase()
    );

    return dependency
      ? {
          existsInCatalog: true,
          text: `Este permiso puede requerir: ${dependency.name} (${formatPermissionCode(dependency.code)})`,
        }
      : {
          existsInCatalog: false,
          text: `Dependencia pendiente de definir en catálogo: ${formatPermissionCode(dependencyCode)}`,
        };
  });
}
