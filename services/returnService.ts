import { apiRequest } from '@/services/apiClient';

export type ReturnStatus = 'OPEN' | 'PROCESSED' | 'CANCELLED';
export type ReturnType = 'TOTAL' | 'PARTIAL';
export type ReturnItemCondition = 'GOOD' | 'DAMAGED' | 'DEFECTIVE' | 'UNSELLABLE';

export type ReturnItemLine = {
  id: number;
  itemId: number;
  itemCode: string;
  condition: ReturnItemCondition | string;
  createdAt?: string | null;
};

export type CustomerReturn = {
  id: number;
  saleId: number;
  customerId?: number | null;
  customerName?: string | null;
  itemId?: number | null;
  itemCode?: string | null;
  type: ReturnType | string;
  reason: string;
  status: ReturnStatus | string;
  processedByUserId?: number | null;
  createdByUserId?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  processedAt?: string | null;
  cancelledAt?: string | null;
  cancelledByUserId?: number | null;
  cancelReason?: string | null;
  notes?: string | null;
  items?: ReturnItemLine[];
};

export type CreateReturnRequest = {
  saleId: number;
  type: ReturnType;
  reason: string;
  notes?: string | null;
  createdByUserId: number;
};

export type CreateReturnByItemRequest = {
  type: ReturnType;
  condition: ReturnItemCondition;
  reason: string;
  notes?: string | null;
  createdByUserId: number;
};

export type AddReturnItemRequest = {
  itemId: number;
  condition: ReturnItemCondition;
};

export type ProcessReturnRequest = {
  processedByUserId: number;
};

export type CancelReturnRequest = {
  reason: string;
  cancelledByUserId: number;
};

export async function getReturnsByStatus(
  status: ReturnStatus = 'OPEN'
): Promise<CustomerReturn[]> {
  return apiRequest<CustomerReturn[]>(
    `/api/returns?status=${encodeURIComponent(status)}`
  );
}

export async function getReturnById(id: number): Promise<CustomerReturn> {
  return apiRequest<CustomerReturn>(`/api/returns/${id}`);
}

export async function getReturnsBySale(saleId: number): Promise<CustomerReturn[]> {
  return apiRequest<CustomerReturn[]>(`/api/returns/sale/${saleId}`);
}

export async function createReturn(
  payload: CreateReturnRequest
): Promise<CustomerReturn> {
  return apiRequest<CustomerReturn>('/api/returns', {
    method: 'POST',
    body: {
      ...payload,
      reason: payload.reason.trim(),
      notes: payload.notes?.trim() || null,
    },
  });
}

export async function createReturnByItemCode(
  code: string,
  payload: CreateReturnByItemRequest
): Promise<CustomerReturn> {
  return apiRequest<CustomerReturn>(
    `/api/returns/item-code/${encodeURIComponent(code.trim())}`,
    {
      method: 'POST',
      body: {
        ...payload,
        reason: payload.reason.trim(),
        notes: payload.notes?.trim() || null,
      },
    }
  );
}

export async function createReturnByQr(
  qrCode: string,
  payload: CreateReturnByItemRequest
): Promise<CustomerReturn> {
  return apiRequest<CustomerReturn>(
    `/api/returns/qr/${encodeURIComponent(qrCode.trim())}`,
    {
      method: 'POST',
      body: {
        ...payload,
        reason: payload.reason.trim(),
        notes: payload.notes?.trim() || null,
      },
    }
  );
}

export async function addReturnItem(
  id: number,
  payload: AddReturnItemRequest
): Promise<CustomerReturn> {
  return apiRequest<CustomerReturn>(`/api/returns/${id}/items`, {
    method: 'POST',
    body: payload,
  });
}

export async function processReturn(
  id: number,
  payload: ProcessReturnRequest
): Promise<CustomerReturn> {
  return apiRequest<CustomerReturn>(`/api/returns/${id}/process`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function cancelReturn(
  id: number,
  payload: CancelReturnRequest
): Promise<CustomerReturn> {
  return apiRequest<CustomerReturn>(`/api/returns/${id}/cancel`, {
    method: 'PATCH',
    body: {
      reason: payload.reason.trim(),
      cancelledByUserId: payload.cancelledByUserId,
    },
  });
}

export function getReturnStatusLabel(status?: string | null): string {
  switch (status) {
    case 'OPEN':
      return 'Abierta';
    case 'PROCESSED':
      return 'Procesada';
    case 'CANCELLED':
      return 'Cancelada';
    default:
      return status || 'Sin estado';
  }
}

export function getReturnTypeLabel(type?: string | null): string {
  switch (type) {
    case 'TOTAL':
      return 'Total';
    case 'PARTIAL':
      return 'Parcial';
    default:
      return type || 'Sin tipo';
  }
}

export function getReturnConditionLabel(condition?: string | null): string {
  switch (condition) {
    case 'GOOD':
      return 'Buen estado';
    case 'DAMAGED':
      return 'Dañada';
    case 'DEFECTIVE':
      return 'Defectuosa';
    case 'UNSELLABLE':
      return 'No vendible';
    default:
      return condition || 'Sin condición';
  }
}

export function isReturnFinal(status?: string | null): boolean {
  return status === 'PROCESSED' || status === 'CANCELLED';
}
