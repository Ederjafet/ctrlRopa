import { apiRequest } from '@/services/apiClient';

export type CustomerOrderStatus = 'OPEN' | 'CLOSED' | 'CANCELLED';

export type CustomerOrder = {
  id: number;
  customerId: number;
  customerName?: string;
  branchId: number;
  branchCode?: string;
  status: CustomerOrderStatus | string;
  createdAt?: string;
  salesChannelCode?: string | null;
};

export type CustomerOrderSaleLine = {
  saleId: number;
  itemId: number;
  itemCode?: string;
  salesChannelId?: number;
  salesChannelCode?: string;
  price: number;
  status?: string;
  paymentStatus?: string;
  createdAt?: string;
};

export type CustomerOrderItemLine = {
  orderItemId: number;
  type: 'RESERVATION' | 'SALE' | 'UNKNOWN' | string;
  reservationId?: number | null;
  saleId?: number | null;
  itemId: number;
  itemCode?: string;
  salesChannelId?: number;
  salesChannelCode?: string;
  price: number;
  status?: string;
  paymentStatus?: string;
  createdAt?: string;
};

export type CustomerOrderReservationLine = {
  reservationId: number;
  itemId: number;
  itemCode?: string;
  salesChannelId?: number;
  salesChannelCode?: string;
  price: number;
  status?: string;
  createdAt?: string;
};

export type CustomerOrderDetail = CustomerOrder & {
  items?: CustomerOrderItemLine[];
  reservations?: CustomerOrderReservationLine[];
  sales?: CustomerOrderSaleLine[];
  total?: number;
};

export type CustomerOrderSettlement = {
  orderId: number;
  total: number;
  directPaid: number;
  appliedBalance: number;
  paid: number;
  pending: number;
  status: CustomerOrderStatus | string;
};

export type CustomerOrderPendingPayment = CustomerOrder & {
  total: number;
  paid: number;
  pending: number;
  itemCount: number;
  activeReservationCount: number;
};

export async function getCustomerOrdersByCustomer(
  customerId: number
): Promise<CustomerOrder[]> {
  return apiRequest<CustomerOrder[]>(`/api/customer-orders/customer/${customerId}`);
}

export async function getPendingPaymentOrdersByBranch(
  branchId: number
): Promise<CustomerOrderPendingPayment[]> {
  return apiRequest<CustomerOrderPendingPayment[]>(
    `/api/customer-orders/branch/${branchId}/pending-payment`
  );
}

export async function getCustomerOrderDetail(
  orderId: number
): Promise<CustomerOrderDetail> {
  return apiRequest<CustomerOrderDetail>(`/api/customer-orders/${orderId}`);
}

export async function getCustomerOrderSettlement(
  orderId: number
): Promise<CustomerOrderSettlement> {
  return apiRequest<CustomerOrderSettlement>(
    `/api/customer-orders/${orderId}/settlement`
  );
}

export function findOpenCustomerOrder(orders: CustomerOrder[]) {
  return orders.find((order) => order.status === 'OPEN') ?? null;
}
