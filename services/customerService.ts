import { apiRequest } from '@/services/apiClient';

export type CustomerStatus = 'ACTIVE' | 'INACTIVE';
export type GenericType = 'DOOR' | 'CONSIGNMENT';

export type Customer = {
  id: number;
  branchId?: number;
  branchCode?: string;
  branchName?: string;
  ownerUserId?: number | null;
  createdByUserId?: number;
  name: string;
  phone?: string;
  email?: string | null;
  isGeneric?: boolean;
  genericType?: GenericType | null;
  status?: CustomerStatus;
};

export type CreateCustomerRequest = {
  ownerUserId?: number | null;
  createdByUserId: number;
  name: string;
  phone: string;
  email?: string | null;
  isGeneric: boolean;
  genericType?: GenericType | null;
  status: CustomerStatus;
};

export type UpdateCustomerRequest = {
  ownerUserId?: number | null;
  createdByUserId?: number;
  name: string;
  phone: string;
  email?: string | null;
  isGeneric: boolean;
  genericType?: GenericType | null;
  status: CustomerStatus;
};

export async function getCustomersByBranch(branchId: number): Promise<Customer[]> {
  return apiRequest<Customer[]>(`/api/customers/branch/${branchId}`);
}

export async function getCustomerById(id: number): Promise<Customer> {
  return apiRequest<Customer>(`/api/customers/${id}`);
}

export async function createCustomer(
  branchId: number,
  payload: CreateCustomerRequest
): Promise<Customer> {
  return apiRequest<Customer>(`/api/customers/branch/${branchId}`, {
    method: 'POST',
    body: payload,
  });
}

export async function updateCustomer(
  id: number,
  payload: UpdateCustomerRequest
): Promise<Customer> {
  return apiRequest<Customer>(`/api/customers/${id}`, {
    method: 'PUT',
    body: payload,
  });
}

export async function getGenericDoorSaleCustomer(branchId: number): Promise<Customer> {
  return apiRequest<Customer>(`/api/customers/branch/${branchId}/generic/DOOR`);
}