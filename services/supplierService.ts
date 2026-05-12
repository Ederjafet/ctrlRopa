import { apiRequest } from '@/services/apiClient';

export type Supplier = {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  status?: string | null;
};

export async function getSuppliers(): Promise<Supplier[]> {
  return apiRequest<Supplier[]>('/api/suppliers');
}

export function getActiveSuppliers(suppliers: Supplier[]) {
  return suppliers.filter((supplier) => (supplier.status ?? 'ACTIVE') === 'ACTIVE');
}
