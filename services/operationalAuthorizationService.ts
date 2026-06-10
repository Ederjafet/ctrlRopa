import { apiRequest } from '@/services/apiClient';

export type OperationalAuthorizationStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'APPLIED'
  | 'EXPIRED'
  | 'CANCELLED';

export type OperationalAuthorizationType =
  | 'CANCEL_RESERVATION_WITH_PAYMENT'
  | 'RELEASE_RESERVED_ITEM'
  | 'UNDO_LIVE_OPERATIONAL_SALE'
  | 'REASSIGN_RESERVATION'
  | 'EDIT_LOCKED_ITEM';

export type OperationalAuthorizationTargetType =
  | 'LIVE'
  | 'RESERVATION'
  | 'ITEM'
  | 'PAYMENT'
  | 'SALE';

export type OperationalAuthorization = {
  id: number;
  operationType: OperationalAuthorizationType;
  status: OperationalAuthorizationStatus;
  companyId: number;
  branchId: number;
  requestedByUserId: number;
  requestedAt: string;
  decidedByUserId?: number | null;
  decidedAt?: string | null;
  appliedByUserId?: number | null;
  appliedAt?: string | null;
  expiresAt: string;
  targetType: OperationalAuthorizationTargetType;
  targetId: number;
  liveId?: number | null;
  reservationId?: number | null;
  itemId?: number | null;
  paymentId?: number | null;
  saleId?: number | null;
  reason: string;
  decisionReason?: string | null;
  currentStateHash?: string | null;
  snapshotJson?: string | null;
  payloadJson?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateOperationalAuthorizationRequest = {
  operationType: OperationalAuthorizationType;
  targetType: OperationalAuthorizationTargetType;
  targetId: number;
  branchId: number;
  liveId?: number;
  reservationId?: number;
  itemId?: number;
  paymentId?: number;
  saleId?: number;
  reason: string;
  payloadJson?: string;
};

export type OperationalAuthorizationDecisionRequest = {
  reason?: string;
};

const BASE_PATH = '/api/operational-authorizations';

export async function getOperationalAuthorizationsByBranch(
  branchId: number
): Promise<OperationalAuthorization[]> {
  return apiRequest<OperationalAuthorization[]>(`${BASE_PATH}/branch/${branchId}`);
}

export async function getPendingOperationalAuthorizations(
  branchId: number
): Promise<OperationalAuthorization[]> {
  return apiRequest<OperationalAuthorization[]>(`${BASE_PATH}/pending/branch/${branchId}`);
}

export async function getMyOperationalAuthorizations(
  branchId: number
): Promise<OperationalAuthorization[]> {
  return apiRequest<OperationalAuthorization[]>(`${BASE_PATH}/mine/branch/${branchId}`);
}

export async function getOperationalAuthorizationById(
  id: number
): Promise<OperationalAuthorization> {
  return apiRequest<OperationalAuthorization>(`${BASE_PATH}/${id}`);
}

export async function createOperationalAuthorization(
  payload: CreateOperationalAuthorizationRequest
): Promise<OperationalAuthorization> {
  return apiRequest<OperationalAuthorization>(BASE_PATH, {
    method: 'POST',
    body: payload,
  });
}

export async function approveOperationalAuthorization(
  id: number,
  payload: OperationalAuthorizationDecisionRequest
): Promise<OperationalAuthorization> {
  return apiRequest<OperationalAuthorization>(`${BASE_PATH}/${id}/approve`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function rejectOperationalAuthorization(
  id: number,
  payload: OperationalAuthorizationDecisionRequest
): Promise<OperationalAuthorization> {
  return apiRequest<OperationalAuthorization>(`${BASE_PATH}/${id}/reject`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function applyOperationalAuthorization(
  id: number,
  payload: OperationalAuthorizationDecisionRequest
): Promise<OperationalAuthorization> {
  return apiRequest<OperationalAuthorization>(`${BASE_PATH}/${id}/apply`, {
    method: 'POST',
    body: payload,
  });
}
