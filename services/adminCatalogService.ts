import { apiRequest } from '@/services/apiClient';

export type CatalogKind =
  | 'brands'
  | 'sizes'
  | 'product-types'
  | 'suppliers'
  | 'payment-methods'
  | 'sales-channels'
  | 'storage-locations'
  | 'boxes';

export type CatalogEntity = {
  id: number;
  code?: string | null;
  name?: string | null;
  description?: string | null;
  qrCode?: string | null;
  sortOrder?: number | null;
  status?: string | null;
  active?: boolean | null;
  branchId?: number | null;
  branchName?: string | null;
  [key: string]: unknown;
};

export type CatalogField = {
  key: 'code' | 'name' | 'description' | 'qrCode' | 'sortOrder';
  label: string;
  required?: boolean;
  keyboardType?: 'default' | 'numeric';
  placeholder?: string;
};

export type CatalogConfig = {
  kind: CatalogKind;
  title: string;
  singular: string;
  permissionCode?: string;
  branchScoped?: boolean;
  fields: CatalogField[];
  supportsActivate?: boolean;
  notes?: string[];
};

export const CATALOG_CONFIGS: CatalogConfig[] = [
  {
    kind: 'brands',
    title: 'Marcas',
    singular: 'marca',
    permissionCode: 'MANAGE_CATALOGS',
    fields: [
      { key: 'code', label: 'Código', required: true, placeholder: 'Ej. NIKE' },
      { key: 'name', label: 'Nombre', required: true, placeholder: 'Ej. Nike' },
    ],
    notes: ['Marca es opcional en item, pero si se captura debe existir en catálogo.'],
  },
  {
    kind: 'sizes',
    title: 'Tallas',
    singular: 'talla',
    permissionCode: 'MANAGE_CATALOGS',
    fields: [
      { key: 'code', label: 'Código', required: true, placeholder: 'Ej. M' },
      { key: 'name', label: 'Nombre', required: true, placeholder: 'Ej. Mediana' },
      { key: 'sortOrder', label: 'Orden', keyboardType: 'numeric', placeholder: 'Ej. 2' },
    ],
    notes: ['Talla es catálogo obligatorio; no debe capturarse texto libre en prendas.'],
  },
  {
    kind: 'product-types',
    title: 'Tipos de prenda',
    singular: 'tipo de prenda',
    permissionCode: 'MANAGE_CATALOGS',
    fields: [
      { key: 'code', label: 'Código', required: true, placeholder: 'Ej. TS' },
      { key: 'name', label: 'Nombre', required: true, placeholder: 'Ej. Playera' },
    ],
  },
  {
    kind: 'suppliers',
    title: 'Proveedores',
    singular: 'proveedor',
    permissionCode: 'MANAGE_CATALOGS',
    fields: [
      { key: 'code', label: 'Código', required: true, placeholder: 'Ej. PROV-01' },
      { key: 'name', label: 'Nombre', required: true, placeholder: 'Ej. Proveedor Centro' },
      { key: 'description', label: 'Notas', placeholder: 'Contacto, condiciones o especialidad' },
    ],
    notes: ['Los proveedores se vinculan a lotes para medir origen y calidad de recepcion.'],
  },
  {
    kind: 'payment-methods',
    title: 'Métodos de pago',
    singular: 'método de pago',
    permissionCode: 'MANAGE_CATALOGS',
    fields: [
      { key: 'code', label: 'Código', required: true, placeholder: 'Ej. CASH' },
      { key: 'name', label: 'Nombre', required: true, placeholder: 'Ej. Efectivo' },
    ],
  },
  {
    kind: 'sales-channels',
    title: 'Canales de venta',
    singular: 'canal de venta',
    permissionCode: 'MANAGE_CATALOGS',
    fields: [
      { key: 'code', label: 'Código', required: true, placeholder: 'Ej. DOOR_SALE' },
      { key: 'name', label: 'Nombre', required: true, placeholder: 'Ej. Venta puerta' },
    ],
    notes: ['El canal debe estar activo globalmente y habilitado por sucursal para poder operar.'],
  },
  {
    kind: 'storage-locations',
    title: 'Ubicaciones',
    singular: 'ubicación',
    permissionCode: 'MANAGE_CATALOGS',
    branchScoped: true,
    supportsActivate: true,
    fields: [
      { key: 'code', label: 'Código', required: true, placeholder: 'Ej. RACK-A' },
      { key: 'name', label: 'Nombre', required: true, placeholder: 'Ej. Rack A' },
    ],
    notes: ['Ubicaciones son por sucursal y representan lugares físicos reales.'],
  },
  {
    kind: 'boxes',
    title: 'Cajas',
    singular: 'caja',
    permissionCode: 'MANAGE_CATALOGS',
    branchScoped: true,
    supportsActivate: true,
    fields: [
      { key: 'code', label: 'Código', required: true, placeholder: 'Ej. BOX-01' },
      { key: 'description', label: 'Descripción', required: true, placeholder: 'Ej. Caja mostrador' },
      { key: 'qrCode', label: 'QR / Código de caja', placeholder: 'Opcional; si lo dejas vacío se usa el código' },
    ],
    notes: ['Caja es contenedor temporal físico para reservas.'],
  },
];

export function getCatalogConfig(kind: string | string[] | undefined): CatalogConfig | null {
  const cleanKind = Array.isArray(kind) ? kind[0] : kind;
  return CATALOG_CONFIGS.find((config) => config.kind === cleanKind) ?? null;
}

export function getEntityTitle(config: CatalogConfig, entity?: CatalogEntity | null): string {
  if (!entity) return `Nueva ${config.singular}`;
  return `Editar ${config.singular}`;
}

function listPath(config: CatalogConfig, branchId?: number): string {
  if (config.kind === 'storage-locations') return `/api/storage-locations/branch/${branchId}`;
  if (config.kind === 'boxes') return `/api/boxes/branch/${branchId}`;
  return `/api/${config.kind}`;
}

function itemPath(config: CatalogConfig, id: number): string {
  if (config.kind === 'storage-locations') return `/api/storage-locations/${id}`;
  if (config.kind === 'boxes') return `/api/boxes/${id}`;
  return `/api/${config.kind}/${id}`;
}

function createPath(config: CatalogConfig, branchId?: number): string {
  if (config.kind === 'storage-locations') return `/api/storage-locations/branch/${branchId}`;
  if (config.kind === 'boxes') return `/api/boxes/branch/${branchId}`;
  return `/api/${config.kind}`;
}

export async function listCatalogItems(config: CatalogConfig, branchId?: number): Promise<CatalogEntity[]> {
  return apiRequest<CatalogEntity[]>(listPath(config, branchId));
}

export async function getCatalogItem(config: CatalogConfig, id: number): Promise<CatalogEntity> {
  return apiRequest<CatalogEntity>(itemPath(config, id));
}

export async function saveCatalogItem(
  config: CatalogConfig,
  payload: Partial<CatalogEntity>,
  branchId?: number,
  id?: number
): Promise<CatalogEntity> {
  if (id) {
    return apiRequest<CatalogEntity>(itemPath(config, id), {
      method: 'PUT',
      body: normalizePayload(config, payload),
    });
  }

  return apiRequest<CatalogEntity>(createPath(config, branchId), {
    method: 'POST',
    body: normalizePayload(config, payload),
  });
}

export async function deactivateCatalogItem(config: CatalogConfig, id: number): Promise<CatalogEntity | null> {
  return apiRequest<CatalogEntity | null>(`${itemPath(config, id)}/deactivate`, {
    method: 'PATCH',
  });
}

export async function activateCatalogItem(config: CatalogConfig, id: number): Promise<CatalogEntity | null> {
  if (config.supportsActivate) {
    return apiRequest<CatalogEntity | null>(`${itemPath(config, id)}/activate`, {
      method: 'PATCH',
    });
  }

  const current = await getCatalogItem(config, id);

  return saveCatalogItem(
    config,
    {
      ...current,
      status: 'ACTIVE',
      active: true,
    },
    current.branchId ?? undefined,
    id
  );
}

function normalizePayload(config: CatalogConfig, payload: Partial<CatalogEntity>) {
  const clean: Record<string, unknown> = {};

  for (const field of config.fields) {
    const value = payload[field.key];

    if (field.key === 'sortOrder') {
      clean[field.key] = value === null || value === undefined || value === '' ? null : Number(value);
      continue;
    }

    clean[field.key] = typeof value === 'string' ? value.trim() : value ?? null;
  }

  if (config.kind === 'boxes') {
    clean.qrCode = clean.qrCode || clean.code;
  }

  if (payload.status !== undefined && payload.status !== null) {
    clean.status = payload.status;
  } else if (!payload.id && config.kind !== 'storage-locations' && config.kind !== 'boxes') {
    clean.status = 'ACTIVE';
  }

  if (payload.active !== undefined && payload.active !== null) {
    clean.active = payload.active;
  }

  return clean;
}

export function isActive(entity: CatalogEntity) {
  if (typeof entity.active === 'boolean') return entity.active;
  return (entity.status ?? '').toString().toUpperCase() === 'ACTIVE';
}

export function getPrimaryLabel(entity: CatalogEntity) {
  return entity.name || entity.description || entity.code || `ID ${entity.id}`;
}

export function getSecondaryLabel(entity: CatalogEntity) {
  const parts = [entity.code, entity.branchName, entity.status].filter(Boolean);
  return parts.join(' · ');
}
