import { apiRequest } from '@/services/apiClient';

export type RefundStatus = 'PENDING' | 'APPROVED' | 'PROCESSED' | 'CANCELLED';
export type RefundMethod = 'CASH' | 'ORIGINAL_METHOD' | 'STORE_CREDIT';

export type Refund = {
  id: number;
  returnId: number;
  saleId: number;
  customerId: number;
  customerOrderId?: number | null;
  branchId: number;
  amount: number;
  method: RefundMethod | string;
  status: RefundStatus | string;
  reason: string;
  notes?: string | null;
  createdByUserId?: number | null;
  approvedByUserId?: number | null;
  processedByUserId?: number | null;
  cancelledByUserId?: number | null;
  createdAt?: string | null;
  approvedAt?: string | null;
  processedAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
};

export type RefundLookup = {
  itemId: number;
  itemCode: string;
  saleId: number;
  salePrice: number;
  totalPaid: number;
  totalRefunded: number;
  refundableAvailable: number;
  returnId?: number | null;
  returnStatus?: string | null;
};

export type CreateRefundRequest = {
  returnId: number;
  amount: number;
  method: RefundMethod;
  reason: string;
  notes?: string | null;
  createdByUserId: number;
};

export type ApproveRefundRequest = {
  approvedByUserId: number;
};

export type ProcessRefundRequest = {
  processedByUserId: number;
};

export type CancelRefundRequest = {
  reason: string;
  cancelledByUserId: number;
};

export async function getRefundsByStatus(
  status: RefundStatus = 'PENDING'
): Promise<Refund[]> {
  return apiRequest<Refund[]>(`/api/refunds?status=${encodeURIComponent(status)}`);
}

export async function getRefundById(id: number): Promise<Refund> {
  return apiRequest<Refund>(`/api/refunds/${id}`);
}

export async function getRefundsByReturn(returnId: number): Promise<Refund[]> {
  return apiRequest<Refund[]>(`/api/refunds/return/${returnId}`);
}

export async function getRefundsByCustomer(customerId: number): Promise<Refund[]> {
  return apiRequest<Refund[]>(`/api/refunds/customer/${customerId}`);
}

export async function lookupRefundByCode(code: string): Promise<RefundLookup> {
  return apiRequest<RefundLookup>(
    `/api/refunds/lookup/code/${encodeURIComponent(code.trim())}`
  );
}

export async function lookupRefundByQr(qrCode: string): Promise<RefundLookup> {
  return apiRequest<RefundLookup>(
    `/api/refunds/lookup/qr/${encodeURIComponent(qrCode.trim())}`
  );
}

export async function createRefund(payload: CreateRefundRequest): Promise<Refund> {
  return apiRequest<Refund>('/api/refunds', {
    method: 'POST',
    body: {
      returnId: payload.returnId,
      amount: payload.amount,
      method: payload.method,
      reason: payload.reason.trim(),
      notes: payload.notes?.trim() || null,
      createdByUserId: payload.createdByUserId,
    },
  });
}

export async function approveRefund(
  id: number,
  payload: ApproveRefundRequest
): Promise<Refund> {
  return apiRequest<Refund>(`/api/refunds/${id}/approve`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function processRefund(
  id: number,
  payload: ProcessRefundRequest
): Promise<Refund> {
  return apiRequest<Refund>(`/api/refunds/${id}/process`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function cancelRefund(
  id: number,
  payload: CancelRefundRequest
): Promise<Refund> {
  return apiRequest<Refund>(`/api/refunds/${id}/cancel`, {
    method: 'PATCH',
    body: {
      reason: payload.reason.trim(),
      cancelledByUserId: payload.cancelledByUserId,
    },
  });
}

export function getRefundStatusLabel(status?: string | null): string {
  switch (status) {
    case 'PENDING':
      return 'Pendiente';
    case 'APPROVED':
      return 'Aprobado';
    case 'PROCESSED':
      return 'Procesado';
    case 'CANCELLED':
      return 'Cancelado';
    default:
      return status || 'Sin estado';
  }
}

export function getRefundMethodLabel(method?: string | null): string {
  switch (method) {
    case 'CASH':
      return 'Efectivo';
    case 'ORIGINAL_METHOD':
      return 'Método original';
    case 'STORE_CREDIT':
      return 'Saldo a favor';
    default:
      return method || 'Sin método';
  }
}

export function isRefundFinal(status?: string | null): boolean {
  return status === 'PROCESSED' || status === 'CANCELLED';
}
