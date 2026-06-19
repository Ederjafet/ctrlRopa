import { apiRequest } from '@/services/apiClient';

export type BalanceSummary = {
  customerId: number;
  balance: number;
};

export async function getBalanceByPackageFolio(folio: string): Promise<BalanceSummary> {
  return apiRequest<BalanceSummary>(`/api/balance/package-folio/${encodeURIComponent(folio)}`);
}
