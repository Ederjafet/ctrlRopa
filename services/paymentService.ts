import { apiRequest } from '@/services/apiClient';

export type CreatePaymentRequest = {
  saleId?: number;
  reservationId?: number;
  amount: number;
  paymentMethodId: number;
  reference?: string;
  createdByUserId: number;
};

export type CreatePackagePaymentRequest = {
  amount: number;
  paymentMethodId: number;
  reference?: string;
  createdByUserId: number;
};

export type Payment = {
  id: number;
  saleId?: number | null;
  reservationId?: number | null;
  amount?: number;
  receivedAmount?: number;
  status?: string;
  reference?: string | null;
  paymentMethodId?: number;
  paymentMethodName?: string;
  paymentMethodCode?: string;
  method?: string;
  type?: string;
  createdAt?: string;
  paymentMethod?: {
    id?: number;
    name?: string;
    code?: string;
  } | null;
};

export async function createPayment(
  payload: CreatePaymentRequest
): Promise<Payment> {
  return apiRequest<Payment>('/api/payments', {
    method: 'POST',
    body: payload,
  });
}

export async function createPaymentByPackageFolio(
  folio: string,
  payload: CreatePackagePaymentRequest
): Promise<Payment> {
  return apiRequest<Payment>(`/api/payments/package-folio/${encodeURIComponent(folio)}`, {
    method: 'POST',
    body: payload,
  });
}

export async function getPaymentById(id: number): Promise<Payment> {
  return apiRequest<Payment>(`/api/payments/${id}`);
}

export async function getPaymentsByCustomer(
  customerId: number
): Promise<Payment[]> {
  return apiRequest<Payment[]>(`/api/payments/customer/${customerId}`);
}

export async function getPaymentsByReservation(
  reservationId: number
): Promise<Payment[]> {
  return apiRequest<Payment[]>(`/api/payments/reservation/${reservationId}`);
}

export async function voidPayment(
  paymentId: number,
  reason: string,
  voidedByUserId: number
): Promise<Payment> {
  return apiRequest<Payment>(`/api/payments/${paymentId}/void`, {
    method: 'PATCH',
    body: {
      reason,
      voidedByUserId,
    },
  });
}
