import { apiRequest } from '@/services/apiClient';

export type ShipmentDeliveryType = 'LOCAL' | 'CARRIER';
export type ShipmentStatus =
  | 'OPEN'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CLOSED_WITH_INCIDENTS'
  | 'CANCELLED'
  | string;

export type ShipmentPackagePaymentMode = 'PREPAID' | 'COD';
export type ShipmentPackageStatus =
  | 'PENDING'
  | 'DELIVERED'
  | 'NOT_DELIVERED'
  | 'RETURNED'
  | 'CANCELLED'
  | string;

export type CollectionStatus = 'BALANCED' | 'SHORT' | 'OVER' | string;

export type Shipment = {
  id: number;
  folio: string;
  branchId: number;
  branchCode?: string;
  deliveryType: ShipmentDeliveryType | string;
  status: ShipmentStatus;
  guideReference?: string | null;
  createdAt?: string;
  createdByUserId?: number;
  dispatchedAt?: string | null;
  dispatchedByUserId?: number | null;
  cancelledAt?: string | null;
  cancelledByUserId?: number | null;
  packageCount?: number | null;
};

export type ShipmentPackageLine = {
  id: number;
  customerPackageId: number;
  customerPackageFolio?: string;
  customerId: number;
  customerName?: string;
  deliveryAddressId: number;
  deliveryAddressLabel?: string;
  paymentMode: ShipmentPackagePaymentMode | string;
  expectedCollectionAmount?: number | null;
  status: ShipmentPackageStatus;
  collectedAmount?: number | null;
  collectionDifference?: number | null;
  collectionStatus?: CollectionStatus | null;
  collectionNotes?: string | null;
  deliveryConfirmedByUserId?: number | null;
  deliveredAt?: string | null;
  returnedAt?: string | null;
};

export type ShipmentDetail = Shipment & {
  packages: ShipmentPackageLine[];
};

export type CreateShipmentRequest = {
  branchId: number;
  deliveryType: ShipmentDeliveryType;
  guideReference?: string | null;
  createdByUserId: number;
};

export type AddShipmentPackageRequest = {
  customerPackageId: number;
  deliveryAddressId: number;
  paymentMode: ShipmentPackagePaymentMode;
  expectedCodAmount?: number | null;
};

export type ResolveShipmentPackageRequest = {
  status: Exclude<ShipmentPackageStatus, 'PENDING'>;
  collectedAmount?: number | null;
  collectionNotes?: string | null;
  deliveryConfirmedByUserId: number;
};

export async function getShipmentsByBranch(branchId: number): Promise<Shipment[]> {
  return apiRequest<Shipment[]>(`/api/shipments/branch/${branchId}`);
}

export async function getShipmentDetail(id: number): Promise<ShipmentDetail> {
  return apiRequest<ShipmentDetail>(`/api/shipments/${id}`);
}

export async function getShipmentDetailByFolio(folio: string): Promise<ShipmentDetail> {
  return apiRequest<ShipmentDetail>(`/api/shipments/folio/${encodeURIComponent(folio)}`);
}

export async function createShipment(payload: CreateShipmentRequest): Promise<Shipment> {
  return apiRequest<Shipment>('/api/shipments', {
    method: 'POST',
    body: payload,
  });
}

export async function addPackageToShipment(
  shipmentId: number,
  payload: AddShipmentPackageRequest
): Promise<ShipmentDetail> {
  return apiRequest<ShipmentDetail>(`/api/shipments/${shipmentId}/packages`, {
    method: 'POST',
    body: payload,
  });
}

export async function dispatchShipment(
  shipmentId: number,
  dispatchedByUserId: number
): Promise<ShipmentDetail> {
  return apiRequest<ShipmentDetail>(`/api/shipments/${shipmentId}/dispatch`, {
    method: 'PATCH',
    body: { dispatchedByUserId },
  });
}

export async function resolveShipmentPackage(
  shipmentId: number,
  shipmentPackageId: number,
  payload: ResolveShipmentPackageRequest
): Promise<ShipmentDetail> {
  return apiRequest<ShipmentDetail>(
    `/api/shipments/${shipmentId}/packages/${shipmentPackageId}/resolve`,
    {
      method: 'PATCH',
      body: payload,
    }
  );
}

export async function cancelShipment(
  shipmentId: number,
  cancelledByUserId: number
): Promise<ShipmentDetail> {
  return apiRequest<ShipmentDetail>(`/api/shipments/${shipmentId}/cancel`, {
    method: 'PATCH',
    body: { cancelledByUserId },
  });
}

export async function reopenShipment(
  shipmentId: number,
  reopenedByUserId: number
): Promise<ShipmentDetail> {
  return apiRequest<ShipmentDetail>(`/api/shipments/${shipmentId}/reopen`, {
    method: 'PATCH',
    body: { reopenedByUserId },
  });
}

export function shipmentStatusLabel(status?: string | null): string {
  switch (status) {
    case 'OPEN':
      return 'Abierto';
    case 'OUT_FOR_DELIVERY':
      return 'En ruta';
    case 'DELIVERED':
      return 'Entregado';
    case 'CLOSED_WITH_INCIDENTS':
      return 'Cerrado con incidencias';
    case 'CANCELLED':
      return 'Cancelado';
    default:
      return status || 'Sin estado';
  }
}

export function shipmentDeliveryTypeLabel(type?: string | null): string {
  switch (type) {
    case 'LOCAL':
      return 'Local';
    case 'CARRIER':
      return 'Paquetería';
    default:
      return type || 'Sin tipo';
  }
}

export function shipmentPackageStatusLabel(status?: string | null): string {
  switch (status) {
    case 'PENDING':
      return 'Pendiente';
    case 'DELIVERED':
      return 'Entregado';
    case 'NOT_DELIVERED':
      return 'No entregado';
    case 'RETURNED':
      return 'Devuelto';
    case 'CANCELLED':
      return 'Cancelado';
    default:
      return status || 'Sin estado';
  }
}

export function paymentModeLabel(mode?: string | null): string {
  switch (mode) {
    case 'PREPAID':
      return 'Pagado';
    case 'COD':
      return 'Contra entrega';
    default:
      return mode || 'Sin modo';
  }
}

export function collectionStatusLabel(status?: string | null): string {
  switch (status) {
    case 'BALANCED':
      return 'Cuadrado';
    case 'SHORT':
      return 'Faltante';
    case 'OVER':
      return 'Sobrante';
    default:
      return status || 'Sin resultado';
  }
}
