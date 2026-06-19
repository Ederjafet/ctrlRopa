import { apiRequest } from '@/services/apiClient';

export type BalanceSummary = {
  customerId: number;
  balance: number;
};

export async function getBalanceByPackageFolio(folio: string): Promise<BalanceSummary> {
  return apiRequest<BalanceSummary>(`/api/balance/package-folio/${encodeURIComponent(folio)}`);
}

export async function getCustomerBalance(customerId: number): Promise<BalanceSummary> {
  const response = await apiRequest<number | BalanceSummary>(`/api/balance/${customerId}`);

  if (typeof response === 'number') {
    return { customerId, balance: response };
  }

  return response;
}
