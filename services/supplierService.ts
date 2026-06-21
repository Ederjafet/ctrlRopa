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

export async function createSupplier(payload: {
  code: string;
  name: string;
  description?: string | null;
}): Promise<Supplier> {
  return apiRequest<Supplier>('/api/suppliers', {
    method: 'POST',
    body: {
      code: payload.code.trim(),
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
      status: 'ACTIVE',
    },
  });
}

export async function updateSupplier(
  id: number,
  payload: {
    code: string;
    name: string;
    description?: string | null;
    status?: string | null;
  }
): Promise<Supplier> {
  return apiRequest<Supplier>(`/api/suppliers/${id}`, {
    method: 'PUT',
    body: {
      code: payload.code.trim(),
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
      status: payload.status || 'ACTIVE',
    },
  });
}

export function getActiveSuppliers(suppliers: Supplier[]) {
  return suppliers.filter((supplier) => (supplier.status ?? 'ACTIVE') === 'ACTIVE');
}
