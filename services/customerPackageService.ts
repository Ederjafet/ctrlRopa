import { apiRequest } from '@/services/apiClient';

export type CustomerPackageStatus = 'OPEN' | 'READY' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | string;
export type CustomerPackagePaymentStatus = 'PAID' | 'PARTIAL' | 'PENDING' | 'UNPAID' | string;

export type CustomerPackage = {
  id: number;
  folio: string;
  customerId: number;
  customerName?: string;
  branchId: number;
  branchCode?: string;
  status: CustomerPackageStatus;
  notes?: string | null;
  createdAt?: string;
  createdByUserId?: number;
  closedAt?: string | null;
  closedByUserId?: number | null;
};

export type CustomerPackageItemLine = {
  id: number;
  itemId: number;
  itemCode?: string;
  itemQrCode?: string;
  itemStatus?: string;
  productType?: string;
  brand?: string | null;
  size?: string | null;
  price?: number;
  paidAmount?: number;
  pendingAmount?: number;
  saleId?: number | null;
  reservationId?: number | null;
  sourceType?: 'SALE' | 'RESERVATION' | string;
  sourceStatus?: string;
  canRemove?: boolean;
  removeBlockedReason?: string | null;
  createdAt?: string;
};

export type CustomerPackageShipmentLine = {
  shipmentPackageId: number;
  shipmentId: number;
  shipmentFolio?: string;
  shipmentStatus?: string;
  packageShipmentStatus?: string;
  paymentMode?: string;
  expectedCollectionAmount?: number;
  collectedAmount?: number;
  collectionDifference?: number;
  collectionStatus?: string;
  collectionNotes?: string | null;
  deliveredAt?: string | null;
  returnedAt?: string | null;
};

export type CustomerPackageDetail = CustomerPackage & {
  customerPhone?: string;
  branchName?: string;
  paymentStatus?: CustomerPackagePaymentStatus;
  totalItems?: number;
  itemSubtotalAmount?: number;
  shippingCostAmount?: number | null;
  shippingCostConfirmed?: boolean;
  shippingCostWaived?: boolean;
  shippingNotes?: string | null;
  shippingCarrier?: string | null;
  trackingNumber?: string | null;
  totalAmount?: number;
  paidAmount?: number;
  pendingAmount?: number;
  canMarkReadyForShipment?: boolean;
  markReadyForShipmentBlockedReason?: string | null;
  items?: CustomerPackageItemLine[];
  shipments?: CustomerPackageShipmentLine[];
};

export type CreateCustomerPackageRequest = {
  customerId: number;
  branchId: number;
  notes?: string | null;
  createdByUserId: number;
};

export type AddCustomerPackageItemRequest = {
  itemId: number;
  reservationId?: number | null;
  saleId?: number | null;
};

export type PrepareCustomerPackageFromOrderRequest = {
  createdByUserId: number;
};

export type PrepareCustomerPackageFromReservationRequest = {
  createdByUserId: number;
};

export type UpdateCustomerPackageShippingRequest = {
  shippingCostAmount?: number | null;
  shippingCostWaived: boolean;
  shippingNotes?: string | null;
  shippingCarrier?: string | null;
  trackingNumber?: string | null;
};

export async function createCustomerPackage(
  payload: CreateCustomerPackageRequest
): Promise<CustomerPackage> {
  return apiRequest<CustomerPackage>('/api/customer-packages', {
    method: 'POST',
    body: payload,
  });
}

export async function getCustomerPackagesByCustomer(
  customerId: number
): Promise<CustomerPackage[]> {
  return apiRequest<CustomerPackage[]>(`/api/customer-packages/customer/${customerId}`);
}

export async function getCustomerPackageDetailsByBranch(
  branchId: number
): Promise<CustomerPackageDetail[]> {
  return apiRequest<CustomerPackageDetail[]>(`/api/customer-packages/branch/${branchId}/details`);
}

export async function getCustomerPackageDetailsByCustomer(
  customerId: number
): Promise<CustomerPackageDetail[]> {
  return apiRequest<CustomerPackageDetail[]>(`/api/customer-packages/customer/${customerId}/details`);
}

export async function getCustomerPackageDetail(
  id: number
): Promise<CustomerPackageDetail> {
  return apiRequest<CustomerPackageDetail>(`/api/customer-packages/${id}`);
}

export async function getCustomerPackageDetailByFolio(
  folio: string
): Promise<CustomerPackageDetail> {
  return apiRequest<CustomerPackageDetail>(`/api/customer-packages/folio/${encodeURIComponent(folio)}`);
}

export async function prepareCustomerPackageFromOrder(
  orderId: number,
  payload: PrepareCustomerPackageFromOrderRequest
): Promise<CustomerPackageDetail> {
  return apiRequest<CustomerPackageDetail>(`/api/customer-packages/from-order/${orderId}`, {
    method: 'POST',
    body: payload,
  });
}

export async function prepareCustomerPackageFromReservation(
  reservationId: number,
  payload: PrepareCustomerPackageFromReservationRequest
): Promise<CustomerPackageDetail> {
  return apiRequest<CustomerPackageDetail>(`/api/customer-packages/from-reservation/${reservationId}`, {
    method: 'POST',
    body: payload,
  });
}

export async function addCustomerPackageItem(
  packageId: number,
  payload: AddCustomerPackageItemRequest
): Promise<CustomerPackageDetail> {
  return apiRequest<CustomerPackageDetail>(`/api/customer-packages/${packageId}/items`, {
    method: 'POST',
    body: payload,
  });
}

export async function addCustomerPackageItemByCode(
  folio: string,
  code: string
): Promise<CustomerPackageDetail> {
  return apiRequest<CustomerPackageDetail>(
    `/api/customer-packages/folio/${encodeURIComponent(folio)}/items/item-code/${encodeURIComponent(code.trim())}`,
    { method: 'POST' }
  );
}

export async function addCustomerPackageItemByQr(
  folio: string,
  qrCode: string
): Promise<CustomerPackageDetail> {
  return apiRequest<CustomerPackageDetail>(
    `/api/customer-packages/folio/${encodeURIComponent(folio)}/items/qr/${encodeURIComponent(qrCode.trim())}`,
    { method: 'POST' }
  );
}

export async function removeCustomerPackageItem(
  packageId: number,
  packageItemId: number
): Promise<CustomerPackageDetail> {
  return apiRequest<CustomerPackageDetail>(`/api/customer-packages/${packageId}/items/${packageItemId}`, {
    method: 'DELETE',
  });
}

export async function markCustomerPackageReady(
  id: number,
  closedByUserId: number
): Promise<CustomerPackageDetail> {
  return apiRequest<CustomerPackageDetail>(`/api/customer-packages/${id}/ready`, {
    method: 'PATCH',
    body: { closedByUserId },
  });
}

export async function updateCustomerPackageShippingCost(
  id: number,
  payload: UpdateCustomerPackageShippingRequest
): Promise<CustomerPackageDetail> {
  return apiRequest<CustomerPackageDetail>(`/api/customer-packages/${id}/shipping-cost`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function cancelCustomerPackage(
  id: number,
  notes: string,
  closedByUserId: number
): Promise<CustomerPackageDetail> {
  return apiRequest<CustomerPackageDetail>(`/api/customer-packages/${id}/cancel`, {
    method: 'PATCH',
    body: { notes, closedByUserId },
  });
}

export function isCustomerPackageOpen(customerPackage?: CustomerPackageDetail | CustomerPackage | null) {
  return customerPackage?.status === 'OPEN';
}

export function canMarkCustomerPackageReady(customerPackage?: CustomerPackageDetail | null) {
  if (!customerPackage) return false;
  if (typeof customerPackage.canMarkReadyForShipment === 'boolean') {
    return customerPackage.canMarkReadyForShipment;
  }
  return (
    customerPackage.status === 'OPEN' &&
    Number(customerPackage.totalItems ?? 0) > 0 &&
    customerPackage.shippingCostConfirmed === true &&
    Number(Number(customerPackage.pendingAmount ?? 0).toFixed(2)) <= 0
  );
}
