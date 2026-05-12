import { apiRequest } from '@/services/apiClient';

type CreateSaleRequest = {
  itemId: number;
  customerId: number;
  branchId: number;
  sellerUserId: number;
  customerOrderId?: number;
  salesChannelId: number;
  price: number;
  createdByUserId: number;
};

export type SaleResponse = {
  id: number;
  itemId?: number;
  itemCode?: string;
  customerId?: number;
  customerName?: string;
  branchId?: number;
  branchCode?: string;
  sellerUserId?: number;
  customerOrderId?: number;
  salesChannelId?: number;
  salesChannelCode?: string;
  price: number;
  status?: string;
  paymentStatus?: string;
  createdAt?: string;
  createdByUserId?: number;
};

export async function createSale(payload: CreateSaleRequest): Promise<SaleResponse> {
  return apiRequest<SaleResponse>('/api/sales', {
    method: 'POST',
    body: payload,
  });
}

export async function getSaleById(id: number): Promise<SaleResponse> {
  return apiRequest<SaleResponse>(`/api/sales/${id}`);
}
