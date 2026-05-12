import { apiRequest } from '@/services/apiClient';

export type ReservationStatus =
  | 'ACTIVE'
  | 'CANCELLED'
  | 'CONVERTED_TO_SALE'
  | 'COMPLETED';

export type CreateReservationRequest = {
  itemId: number;
  customerId: number;
  branchId: number;
  liveId?: number;
  salesChannelId: number;
  price: number;
  createdByUserId: number;
};

export type Reservation = {
  id: number;
  itemId: number;
  itemCode?: string;
  customerId: number;
  customerName?: string;
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
  boxId?: number | null;
  boxCode?: string | null;
  createdAt?: string;
};

export async function createReservation(
  payload: CreateReservationRequest
): Promise<Reservation> {
  return apiRequest<Reservation>('/api/reservations', {
    method: 'POST',
    body: payload,
  });
}

export async function getReservationsByBranch(
  branchId: number
): Promise<Reservation[]> {
  return apiRequest<Reservation[]>(`/api/reservations/branch/${branchId}`);
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
