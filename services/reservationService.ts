import { apiRequest } from '@/services/apiClient';

export type ReservationStatus =
  | 'ACTIVE'
  | 'CANCELLED'
  | 'CONVERTED_TO_SALE'
  | 'COMPLETED';

export type LiveReservationOperationalStatus =
  | 'PENDING'
  | 'RESERVED'
  | 'OPERATIONAL_SOLD'
  | 'CANCELLED';

export type ReservationScope = 'active' | 'history' | 'all';

export type CreateReservationRequest = {
  itemId: number;
  customerId?: number | null;
  interestedAlias?: string | null;
  branchId: number;
  liveId?: number;
  salesChannelId: number;
  price: number;
  createdByUserId: number;
};

type CreateReservationOptions = {
  idempotencyKey?: string;
};

export type Reservation = {
  id: number;
  itemId: number;
  itemCode?: string;
  customerId?: number | null;
  customerName?: string;
  interestedAlias?: string | null;
  branchId: number;
  liveId?: number | null;
  liveStatus?: string | null;
  liveNotes?: string | null;
  salesChannelId: number;
  salesChannelCode?: string;
  salesChannelName?: string;
  sellerUserId?: number | null;
  sellerUserName?: string | null;
  price: number;
  status?: ReservationStatus;
  liveOperationalStatus?: LiveReservationOperationalStatus | null;
  liveOperationalStatusUpdatedAt?: string | null;
  liveOperationalStatusUpdatedByUserId?: number | null;
  liveOperationalStatusReason?: string | null;
  customerPackageId?: number | null;
  customerPackageFolio?: string | null;
  customerPackageStatus?: string | null;
  shipmentId?: number | null;
  shipmentFolio?: string | null;
  shipmentStatus?: string | null;
  operationalStatus?: string | null;
  operationalStatusLabel?: string | null;
  activeReservation?: boolean;
  historicalReservation?: boolean;
  boxId?: number | null;
  boxCode?: string | null;
  createdAt?: string;
};

export async function createReservation(
  payload: CreateReservationRequest,
  options: CreateReservationOptions = {}
): Promise<Reservation> {
  const idempotencyKey = options.idempotencyKey ?? createReservationIdempotencyKey();

  return apiRequest<Reservation>('/api/reservations', {
    method: 'POST',
    body: payload,
    headers: {
      'X-Idempotency-Key': idempotencyKey,
    },
  });
}

function createReservationIdempotencyKey(): string {
  const cryptoApi = globalThis.crypto;
  const randomUUID =
    cryptoApi && typeof cryptoApi.randomUUID === 'function'
      ? cryptoApi.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random()
          .toString(36)
          .slice(2)}`;

  return `reservation-${randomUUID}`;
}

export async function getReservationsByBranch(
  branchId: number,
  scope: ReservationScope = 'active'
): Promise<Reservation[]> {
  return apiRequest<Reservation[]>(`/api/reservations/branch/${branchId}?scope=${scope}`);
}

export async function getReservationsWithoutBox(
  branchId: number
): Promise<Reservation[]> {
  return apiRequest<Reservation[]>(`/api/reservations/branch/${branchId}/without-box`);
}

export async function getReservationsByBox(boxId: number): Promise<Reservation[]> {
  return apiRequest<Reservation[]>(`/api/reservations/box/${boxId}`);
}

export async function getReservationById(id: number): Promise<Reservation> {
  return apiRequest<Reservation>(`/api/reservations/${id}`);
}

export async function assignReservationToBox(
  reservationId: number,
  boxId: number
): Promise<Reservation> {
  return apiRequest<Reservation>(`/api/reservations/${reservationId}/box/${boxId}`, {
    method: 'PATCH',
  });
}

export async function removeReservationFromBox(
  reservationId: number
): Promise<Reservation> {
  return apiRequest<Reservation>(`/api/reservations/${reservationId}/remove-box`, {
    method: 'PATCH',
  });
}

export async function linkReservationCustomer(
  reservationId: number,
  customerId: number
): Promise<Reservation> {
  return apiRequest<Reservation>(`/api/reservations/${reservationId}/customer`, {
    method: 'PATCH',
    body: { customerId },
  });
}

export async function cancelReservation(
  reservationId: number,
  reason: string,
  cancelledByUserId?: number
): Promise<Reservation> {
  return apiRequest<Reservation>(`/api/reservations/${reservationId}/cancel`, {
    method: 'PATCH',
    body: cancelledByUserId
      ? {
          reason,
          cancelledByUserId,
        }
      : {
          reason,
        },
  });
}

export async function updateLiveReservationOperationalStatus(
  reservationId: number,
  status: LiveReservationOperationalStatus,
  reason?: string
): Promise<Reservation> {
  return apiRequest<Reservation>(
    `/api/reservations/${reservationId}/live-operational-status`,
    {
      method: 'PATCH',
      body: reason ? { status, reason } : { status },
    }
  );
}
