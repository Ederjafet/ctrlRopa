import { apiRequest } from '@/services/apiClient';

export type BatchStatus = 'ANNOUNCED' | 'RECEIVED' | 'RECONCILED' | 'CANCELLED';

export type BatchClassificationDetail = {
  id: number;
  productTypeId: number;
  productTypeCode?: string | null;
  productTypeName?: string | null;
  quantity: number;
};

export type Batch = {
  id: number;
  branchId: number;
  branchCode?: string | null;
  branchName?: string | null;
  supplierId?: number | null;
  supplierName?: string | null;
  folio: string;
  expectedQuantity: number;
  receivedQuantity?: number | null;
  receivedAt?: string | null;
  classifiedQuantity?: number | null;
  itemCount?: number | null;
  status: BatchStatus | string;
  qualityScore?: number | null;
  qualityNotes?: string | null;
  notes?: string | null;
  createdByUserId?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  classificationDetails?: BatchClassificationDetail[];
};

export type CreateBatchRequest = {
  expectedQuantity: number;
  supplierId?: number | null;
  notes?: string | null;
};

export type ReceiveBatchRequest = {
  receivedQuantity: number;
  qualityScore?: number | null;
  qualityNotes?: string | null;
  notes?: string | null;
};

export type BatchClassificationDetailRequest = {
  productTypeId: number;
  quantity: number;
};

export type SaveBatchClassificationRequest = {
  details: BatchClassificationDetailRequest[];
};

export type CancelBatchRequest = {
  reason: string;
};

export async function getBatchesByBranch(branchId: number): Promise<Batch[]> {
  return apiRequest<Batch[]>(`/api/batches/branch/${branchId}`);
}

export async function getBatchById(id: number): Promise<Batch> {
  return apiRequest<Batch>(`/api/batches/${id}`);
}

export async function getBatchByFolio(folio: string): Promise<Batch> {
  return apiRequest<Batch>(`/api/batches/folio/${encodeURIComponent(folio)}`);
}

export async function createBatch(
  branchId: number,
  payload: CreateBatchRequest
): Promise<Batch> {
  return apiRequest<Batch>(`/api/batches/branch/${branchId}`, {
    method: 'POST',
    body: {
      expectedQuantity: payload.expectedQuantity,
      supplierId: payload.supplierId ?? null,
      notes: payload.notes?.trim() || null,
    },
  });
}

export async function receiveBatch(
  id: number,
  payload: ReceiveBatchRequest
): Promise<Batch> {
  return apiRequest<Batch>(`/api/batches/${id}/receive`, {
    method: 'PATCH',
    body: {
      receivedQuantity: payload.receivedQuantity,
      qualityScore: payload.qualityScore ?? null,
      qualityNotes: payload.qualityNotes?.trim() || null,
      notes: payload.notes?.trim() || null,
    },
  });
}

export async function saveBatchClassification(
  id: number,
  payload: SaveBatchClassificationRequest
): Promise<Batch> {
  return apiRequest<Batch>(`/api/batches/${id}/classification`, {
    method: 'PUT',
    body: payload,
  });
}

export async function reconcileBatch(id: number): Promise<Batch> {
  return apiRequest<Batch>(`/api/batches/${id}/reconcile`, {
    method: 'PATCH',
  });
}

export async function cancelBatch(
  id: number,
  payload: CancelBatchRequest
): Promise<Batch> {
  return apiRequest<Batch>(`/api/batches/${id}/cancel`, {
    method: 'PATCH',
    body: {
      reason: payload.reason.trim(),
    },
  });
}

export function getBatchStatusLabel(status?: string | null): string {
  switch (status) {
    case 'ANNOUNCED':
      return 'Pendiente por recibir';
    case 'RECEIVED':
      return 'Recibido';
    case 'RECONCILED':
      return 'Cerrado / conciliado';
    case 'CANCELLED':
      return 'Cancelado';
    default:
      return status || 'Sin estado';
  }
}

export function canReceiveBatch(batch: Batch): boolean {
  return batch.status === 'ANNOUNCED' || batch.status === 'RECEIVED';
}

export function canClassifyBatch(batch: Batch): boolean {
  return batch.status === 'RECEIVED';
}

export function canReconcileBatch(batch: Batch): boolean {
  return batch.status === 'RECEIVED';
}

export function canCancelBatch(batch: Batch): boolean {
  return batch.status !== 'CANCELLED' && batch.status !== 'RECONCILED';
}
