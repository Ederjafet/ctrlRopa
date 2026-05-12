import { apiRequest } from '@/services/apiClient';

export type BranchTransferStatus =
  | 'OPEN'
  | 'IN_TRANSIT'
  | 'RECEIVED'
  | 'CANCELLED';

export type BranchTransferItemLine = {
  transferItemId: number;
  itemId: number;
  itemCode: string;
  itemQrCode?: string | null;
  itemStatus?: string | null;
  receivedAt?: string | null;
  receivedByUserId?: number | null;
};

export type BranchTransfer = {
  id: number;
  folio: string;
  fromBranchId: number;
  fromBranchCode?: string | null;
  fromBranchName?: string | null;
  toBranchId: number;
  toBranchCode?: string | null;
  toBranchName?: string | null;
  customerOrderId?: number | null;
  status: BranchTransferStatus | string;
  notes?: string | null;
  createdAt?: string | null;
  createdByUserId?: number | null;
  sentAt?: string | null;
  receivedAt?: string | null;
  totalItems: number;
  receivedItems: number;
  items: BranchTransferItemLine[];
};

export type CreateBranchTransferRequest = {
  fromBranchId: number;
  toBranchId: number;
  customerOrderId?: number | null;
  notes?: string | null;
  itemIds: number[];
};

export type ReceiveTransferItemRequest = {
  itemId?: number;
  itemCode?: string;
  qrCode?: string;
};

export async function getTransfersByBranch(
  branchId: number
): Promise<BranchTransfer[]> {
  return apiRequest<BranchTransfer[]>(`/api/transfers/branch/${branchId}`);
}

export async function getTransfersByStatus(
  status: BranchTransferStatus
): Promise<BranchTransfer[]> {
  return apiRequest<BranchTransfer[]>(`/api/transfers/status/${status}`);
}

export async function getTransferById(id: number): Promise<BranchTransfer> {
  return apiRequest<BranchTransfer>(`/api/transfers/${id}`);
}

export async function getTransferByFolio(
  folio: string
): Promise<BranchTransfer> {
  return apiRequest<BranchTransfer>(
    `/api/transfers/folio/${encodeURIComponent(folio)}`
  );
}

export async function createTransfer(
  payload: CreateBranchTransferRequest
): Promise<BranchTransfer> {
  return apiRequest<BranchTransfer>('/api/transfers', {
    method: 'POST',
    body: {
      ...payload,
      notes: payload.notes?.trim() || null,
      customerOrderId: payload.customerOrderId || null,
      itemIds: payload.itemIds,
    },
  });
}

export async function addTransferItem(
  transferId: number,
  itemId: number
): Promise<BranchTransfer> {
  return apiRequest<BranchTransfer>(
    `/api/transfers/${transferId}/items/${itemId}`,
    { method: 'POST' }
  );
}

export async function sendTransfer(
  transferId: number
): Promise<BranchTransfer> {
  return apiRequest<BranchTransfer>(`/api/transfers/${transferId}/send`, {
    method: 'PATCH',
  });
}

export async function receiveTransferItem(
  transferId: number,
  payload: ReceiveTransferItemRequest
): Promise<BranchTransfer> {
  return apiRequest<BranchTransfer>(
    `/api/transfers/${transferId}/receive-item`,
    {
      method: 'PATCH',
      body: payload,
    }
  );
}

export async function cancelTransfer(
  transferId: number,
  reason?: string
): Promise<BranchTransfer> {
  return apiRequest<BranchTransfer>(`/api/transfers/${transferId}/cancel`, {
    method: 'PATCH',
    body: { reason: reason?.trim() || null },
  });
}

export function getTransferStatusLabel(status?: string | null): string {
  switch (status) {
    case 'OPEN':
      return 'Abierta';
    case 'IN_TRANSIT':
      return 'En tránsito';
    case 'RECEIVED':
      return 'Recibida';
    case 'CANCELLED':
      return 'Cancelada';
    default:
      return status || 'Sin estado';
  }
}

export function isTransferEditable(transfer?: BranchTransfer | null): boolean {
  return transfer?.status === 'OPEN';
}

export function isTransferReceivable(transfer?: BranchTransfer | null): boolean {
  return transfer?.status === 'IN_TRANSIT';
}
