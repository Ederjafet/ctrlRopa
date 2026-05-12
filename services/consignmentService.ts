import { apiRequest } from '@/services/apiClient';

export type EntityStatus = 'ACTIVE' | 'INACTIVE';
export type ConsignmentStatus = 'OPEN' | 'DELIVERED' | 'IN_SETTLEMENT' | 'CLOSED' | 'CANCELLED';
export type ConsignmentItemStatus = 'OUT_ON_CONSIGNMENT' | 'SOLD' | 'RETURNED';
export type ConsignmentSettlementResult = 'SOLD' | 'RETURNED';

export type Consignee = {
  id: number;
  branchId: number;
  branchCode?: string;
  branchName?: string;
  name: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
  status: EntityStatus | string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateConsigneeRequest = {
  branchId: number;
  name: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
};

export type UpdateConsigneeRequest = {
  name?: string;
  phone?: string;
  email?: string | null;
  notes?: string | null;
  status?: EntityStatus;
};

export type AddConsignmentItemRequest = {
  itemId?: number;
  itemCode?: string;
  qrCode?: string;
  suggestedPrice?: number | null;
  notes?: string | null;
};

export type CreateConsignmentRequest = {
  branchId: number;
  consigneeId: number;
  notes?: string | null;
  items?: AddConsignmentItemRequest[];
};

export type ConsignmentItemLine = {
  consignmentItemId: number;
  itemId: number;
  itemCode: string;
  itemQrCode?: string | null;
  itemStatus?: string | null;
  suggestedPrice?: number | null;
  status: ConsignmentItemStatus | string;
  notes?: string | null;
  createdAt?: string;
};

export type SettlementItemLine = {
  settlementItemId: number;
  consignmentItemId: number;
  result: ConsignmentSettlementResult | string;
  salePrice?: number | null;
  customerId?: number | null;
  customerName?: string | null;
  notes?: string | null;
  createdAt?: string;
};

export type SettlementLine = {
  settlementId: number;
  notes?: string | null;
  createdAt?: string;
  createdByUserId?: number;
  items: SettlementItemLine[];
};

export type Consignment = {
  id: number;
  folio: string;
  branchId: number;
  branchCode?: string;
  branchName?: string;
  consigneeId: number;
  consigneeName: string;
  status: ConsignmentStatus | string;
  notes?: string | null;
  createdAt?: string;
  createdByUserId?: number;
  deliveredAt?: string | null;
  closedAt?: string | null;
  cancelledAt?: string | null;
  cancelledByUserId?: number | null;
  cancelReason?: string | null;
  totalItems: number;
  soldItems: number;
  returnedItems: number;
  openItems: number;
  items: ConsignmentItemLine[];
  settlements: SettlementLine[];
};

export type SettlementItemRequest = {
  consignmentItemId: number;
  result: ConsignmentSettlementResult;
  salePrice?: number | null;
  customerId?: number | null;
  notes?: string | null;
};

export type CreateConsignmentSettlementRequest = {
  notes?: string | null;
  items: SettlementItemRequest[];
};

export async function getConsigneesByBranch(branchId: number): Promise<Consignee[]> {
  return apiRequest<Consignee[]>(`/api/consignees/branch/${branchId}`);
}

export async function getActiveConsigneesByBranch(branchId: number): Promise<Consignee[]> {
  return apiRequest<Consignee[]>(`/api/consignees/branch/${branchId}/active`);
}

export async function getConsigneeById(id: number): Promise<Consignee> {
  return apiRequest<Consignee>(`/api/consignees/${id}`);
}

export async function createConsignee(payload: CreateConsigneeRequest): Promise<Consignee> {
  return apiRequest<Consignee>('/api/consignees', {
    method: 'POST',
    body: cleanConsigneePayload(payload),
  });
}

export async function updateConsignee(
  id: number,
  payload: UpdateConsigneeRequest
): Promise<Consignee> {
  return apiRequest<Consignee>(`/api/consignees/${id}`, {
    method: 'PUT',
    body: cleanUpdateConsigneePayload(payload),
  });
}

export async function deactivateConsignee(id: number): Promise<Consignee> {
  return apiRequest<Consignee>(`/api/consignees/${id}/deactivate`, {
    method: 'PATCH',
  });
}

export async function activateConsignee(consignee: Consignee): Promise<Consignee> {
  return updateConsignee(consignee.id, {
    name: consignee.name,
    phone: consignee.phone,
    email: consignee.email ?? null,
    notes: consignee.notes ?? null,
    status: 'ACTIVE',
  });
}

export async function getConsignmentsByBranch(branchId: number): Promise<Consignment[]> {
  return apiRequest<Consignment[]>(`/api/consignments/branch/${branchId}`);
}

export async function getConsignmentById(id: number): Promise<Consignment> {
  return apiRequest<Consignment>(`/api/consignments/${id}`);
}

export async function getConsignmentByFolio(folio: string): Promise<Consignment> {
  return apiRequest<Consignment>(`/api/consignments/folio/${encodeURIComponent(folio)}`);
}

export async function createConsignment(
  payload: CreateConsignmentRequest
): Promise<Consignment> {
  return apiRequest<Consignment>('/api/consignments', {
    method: 'POST',
    body: {
      branchId: payload.branchId,
      consigneeId: payload.consigneeId,
      notes: cleanNullable(payload.notes),
      items: payload.items ?? [],
    },
  });
}

export async function addConsignmentItem(
  consignmentId: number,
  payload: AddConsignmentItemRequest
): Promise<Consignment> {
  return apiRequest<Consignment>(`/api/consignments/${consignmentId}/items`, {
    method: 'POST',
    body: cleanItemPayload(payload),
  });
}

export async function deliverConsignment(consignmentId: number): Promise<Consignment> {
  return apiRequest<Consignment>(`/api/consignments/${consignmentId}/deliver`, {
    method: 'PATCH',
  });
}

export async function settleConsignment(
  consignmentId: number,
  payload: CreateConsignmentSettlementRequest
): Promise<Consignment> {
  return apiRequest<Consignment>(`/api/consignments/${consignmentId}/settlements`, {
    method: 'POST',
    body: {
      notes: cleanNullable(payload.notes),
      items: payload.items,
    },
  });
}

export async function cancelConsignment(
  consignmentId: number,
  reason?: string | null
): Promise<Consignment> {
  return apiRequest<Consignment>(`/api/consignments/${consignmentId}/cancel`, {
    method: 'PATCH',
    body: { reason: cleanNullable(reason) },
  });
}

export function isConsigneeActive(consignee: Consignee): boolean {
  return consignee.status === 'ACTIVE';
}

export function getConsignmentStatusLabel(status?: string | null) {
  switch (status) {
    case 'OPEN':
      return 'Abierta';
    case 'DELIVERED':
      return 'Entregada';
    case 'IN_SETTLEMENT':
      return 'En liquidación';
    case 'CLOSED':
      return 'Cerrada';
    case 'CANCELLED':
      return 'Cancelada';
    default:
      return status || 'Sin estado';
  }
}

export function getConsignmentItemStatusLabel(status?: string | null) {
  switch (status) {
    case 'OUT_ON_CONSIGNMENT':
      return 'En consignación';
    case 'SOLD':
      return 'Vendido';
    case 'RETURNED':
      return 'Devuelto';
    default:
      return status || 'Sin estado';
  }
}

function cleanNullable(value?: string | null) {
  const clean = value?.trim();
  return clean ? clean : null;
}

function cleanConsigneePayload(payload: CreateConsigneeRequest): CreateConsigneeRequest {
  return {
    branchId: payload.branchId,
    name: payload.name.trim(),
    phone: payload.phone.trim(),
    email: cleanNullable(payload.email),
    notes: cleanNullable(payload.notes),
  };
}

function cleanUpdateConsigneePayload(payload: UpdateConsigneeRequest): UpdateConsigneeRequest {
  return {
    name: payload.name?.trim(),
    phone: payload.phone?.trim(),
    email: cleanNullable(payload.email),
    notes: cleanNullable(payload.notes),
    status: payload.status,
  };
}

function cleanItemPayload(payload: AddConsignmentItemRequest): AddConsignmentItemRequest {
  return {
    itemId: payload.itemId,
    itemCode: cleanNullable(payload.itemCode) ?? undefined,
    qrCode: cleanNullable(payload.qrCode) ?? undefined,
    suggestedPrice: payload.suggestedPrice ?? null,
    notes: cleanNullable(payload.notes),
  };
}
