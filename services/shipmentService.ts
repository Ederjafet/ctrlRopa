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
  primaryPackageId?: number | null;
  primaryPackageFolio?: string | null;
  primaryPackageStatus?: string | null;
  packageItemCount?: number | null;
  customerId?: number | null;
  customerName?: string | null;
  customerPhone?: string | null;
  packageDeliveryType?: string | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
  destinationSummary?: string | null;
  destinationCity?: string | null;
  destinationState?: string | null;
  destinationPostalCode?: string | null;
  shippingCarrier?: string | null;
  packageTrackingNumber?: string | null;
  shippingCostAmount?: number | null;
  shippingNotes?: string | null;
  logisticsSource?: string | null;
  logisticsWarning?: string | null;
  quotedAt?: string | null;
  readyAt?: string | null;
  receivedAt?: string | null;
  packageTotalAmount?: number | null;
  paymentMode?: ShipmentPackagePaymentMode | string | null;
  requiresAttention?: boolean;
  attentionReason?: string | null;
  nextStep?: string | null;
  canDispatch?: boolean;
  canConfirmReceived?: boolean;
  blockedReason?: string | null;
};

export type ShipmentPackageLine = {
  id: number;
  customerPackageId: number;
  customerPackageFolio?: string;
  customerId: number;
  customerName?: string;
  deliveryAddressId?: number | null;
  deliveryAddressLabel?: string;
  deliveryType?: string | null;
  shippingAddressSource?: string | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
  deliveryAddressText?: string | null;
  deliveryReferences?: string | null;
  shippingCostAmount?: number | null;
  shippingCostWaived?: boolean;
  shippingCollect?: boolean;
  customerProvidedLabel?: boolean;
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
  customerPackageId: number;
  deliveryAddressId?: number | null;
  paymentMode?: ShipmentPackagePaymentMode;
  expectedCodAmount?: number | null;
  deliveryType: ShipmentDeliveryType;
  guideReference?: string | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
  destinationSummary?: string | null;
  destinationCity?: string | null;
  destinationState?: string | null;
  destinationPostalCode?: string | null;
  shippingCarrier?: string | null;
  realShippingCost?: number | null;
  shippingNotes?: string | null;
  createdByUserId: number;
};

export type UpdateShipmentLogisticsRequest = {
  deliveryType?: ShipmentDeliveryType | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
  destinationSummary?: string | null;
  destinationCity?: string | null;
  destinationState?: string | null;
  destinationPostalCode?: string | null;
  shippingCarrier?: string | null;
  trackingNumber?: string | null;
  realShippingCost?: number | null;
  shippingNotes?: string | null;
  quotedAt?: string | null;
  readyAt?: string | null;
};
export type AddShipmentPackageRequest = {
  customerPackageId: number;
  deliveryAddressId?: number | null;
  paymentMode: ShipmentPackagePaymentMode;
  expectedCodAmount?: number | null;
};

export type ResolveShipmentPackageRequest = {
  status: Exclude<ShipmentPackageStatus, 'PENDING'>;
  collectedAmount?: number | null;
  collectionNotes?: string | null;
  deliveryConfirmedByUserId: number;
};

export type ConfirmShipmentReceivedRequest = {
  receivedAt?: string | null;
  notes?: string | null;
  deliveryConfirmedByUserId: number;
};
export type ShipmentCostShareMethod = 'EQUAL_SPLIT' | 'MANUAL' | 'STORE_ABSORBED' | string;

export type ShipmentCostShareLine = {
  packageId: number;
  packageCode?: string | null;
  customerId: number;
  customerName?: string | null;
  assignedAmount?: number | null;
  notes?: string | null;
};

export type ShipmentCostShareResponse = {
  shipmentId: number;
  realShippingCost?: number | null;
  shareMethod?: ShipmentCostShareMethod | null;
  assignedTotal?: number | null;
  absorbedAmount?: number | null;
  overAssignedAmount?: number | null;
  shares: ShipmentCostShareLine[];
};

export type ShipmentCostShareRequest = {
  shareMethod: ShipmentCostShareMethod;
  shares?: Array<{
    packageId: number;
    assignedAmount?: number | null;
    notes?: string | null;
  }>;
};
export type ShipmentPaymentStatus = 'REGISTERED' | 'CANCELLED' | string;

export type ShipmentShippingPaymentLine = {
  id: number;
  costShareId: number;
  packageId: number;
  packageReference?: string | null;
  customerId: number;
  customerName?: string | null;
  paidByCustomerId?: number | null;
  paidByCustomerName?: string | null;
  amount?: number | null;
  paymentMethod?: string | null;
  reference?: string | null;
  notes?: string | null;
  status?: ShipmentPaymentStatus | null;
  registeredAt?: string | null;
  registeredBy?: number | null;
  cancelledAt?: string | null;
  cancelledBy?: number | null;
  cancelReason?: string | null;
};

export type ShipmentShippingPaymentShare = {
  costShareId: number;
  packageId: number;
  packageReference?: string | null;
  customerId: number;
  customerName?: string | null;
  assignedAmount?: number | null;
  paidAmount?: number | null;
  balanceAmount?: number | null;
  payments: ShipmentShippingPaymentLine[];
};

export type ShipmentShippingPaymentsResponse = {
  shipmentId: number;
  realShippingCost?: number | null;
  assignedTotal?: number | null;
  paidTotal?: number | null;
  shippingBalance?: number | null;
  absorbedAmount?: number | null;
  overAssignedAmount?: number | null;
  shares: ShipmentShippingPaymentShare[];
  payments: ShipmentShippingPaymentLine[];
};

export type ShipmentShippingBalancePaymentStatus = 'NO_COST' | 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERPAID' | string;

export type ShipmentShippingBalance = {
  shipmentId: number;
  shipmentFolio?: string | null;
  shipmentStatus?: ShipmentStatus | string | null;
  customerId?: number | null;
  customerName?: string | null;
  packageCount?: number | null;
  realShippingCost?: number | null;
  assignedShippingAmount?: number | null;
  paidShippingAmount?: number | null;
  pendingShippingBalance?: number | null;
  absorbedAmount?: number | null;
  overassignedAmount?: number | null;
  overpaidAmount?: number | null;
  paymentStatus?: ShipmentShippingBalancePaymentStatus | null;
  createdAt?: string | null;
  dispatchedAt?: string | null;
  deliveredAt?: string | null;
};
export type RegisterShipmentShippingPaymentRequest = {
  costShareId?: number | null;
  packageId?: number | null;
  customerId?: number | null;
  paidByCustomerId?: number | null;
  amount: number;
  paymentMethod?: string | null;
  reference?: string | null;
  notes?: string | null;
  registeredAt?: string | null;
};

export type CancelShipmentShippingPaymentRequest = {
  cancelReason?: string | null;
  cancelledAt?: string | null;
};

export async function getShipmentsByBranch(branchId: number): Promise<Shipment[]> {
  return apiRequest<Shipment[]>(`/api/shipments/branch/${branchId}`);
}

export async function getShippingBalances(branchId: number): Promise<ShipmentShippingBalance[]> {
  return apiRequest<ShipmentShippingBalance[]>(`/api/shipments/branch/${branchId}/shipping-balances`);
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

export async function updateShipmentLogistics(
  shipmentId: number,
  payload: UpdateShipmentLogisticsRequest
): Promise<ShipmentDetail> {
  return apiRequest<ShipmentDetail>(`/api/shipments/${shipmentId}/logistics`, {
    method: 'PATCH',
    body: payload,
  });
}
export async function getShipmentCostShares(shipmentId: number): Promise<ShipmentCostShareResponse> {
  return apiRequest<ShipmentCostShareResponse>(`/api/shipments/${shipmentId}/cost-shares`);
}

export async function updateShipmentCostShares(
  shipmentId: number,
  payload: ShipmentCostShareRequest
): Promise<ShipmentCostShareResponse> {
  return apiRequest<ShipmentCostShareResponse>(`/api/shipments/${shipmentId}/cost-shares`, {
    method: 'PUT',
    body: payload,
  });
}
export async function getShipmentShippingPayments(shipmentId: number): Promise<ShipmentShippingPaymentsResponse> {
  return apiRequest<ShipmentShippingPaymentsResponse>(`/api/shipments/${shipmentId}/shipping-payments`);
}

export async function registerShipmentShippingPayment(
  shipmentId: number,
  payload: RegisterShipmentShippingPaymentRequest
): Promise<ShipmentShippingPaymentsResponse> {
  return apiRequest<ShipmentShippingPaymentsResponse>(`/api/shipments/${shipmentId}/shipping-payments`, {
    method: 'POST',
    body: payload,
  });
}

export async function cancelShipmentShippingPayment(
  shipmentId: number,
  paymentId: number,
  payload: CancelShipmentShippingPaymentRequest
): Promise<ShipmentShippingPaymentsResponse> {
  return apiRequest<ShipmentShippingPaymentsResponse>(`/api/shipments/${shipmentId}/shipping-payments/${paymentId}/cancel`, {
    method: 'PATCH',
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

export async function confirmShipmentReceived(
  shipmentId: number,
  payload: ConfirmShipmentReceivedRequest
): Promise<ShipmentDetail> {
  return apiRequest<ShipmentDetail>(`/api/shipments/${shipmentId}/confirm-received`, {
    method: 'PATCH',
    body: payload,
  });
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
