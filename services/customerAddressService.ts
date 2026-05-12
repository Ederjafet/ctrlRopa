import { apiRequest } from '@/services/apiClient';

export type CustomerAddressStatus = 'ACTIVE' | 'INACTIVE';

export type CustomerAddress = {
  id: number;
  customerId?: number;
  label: string;
  line1: string;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  isDefault?: boolean;
  status?: CustomerAddressStatus;
};

export type CreateCustomerAddressRequest = {
  label: string;
  line1: string;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  isDefault: boolean;
  status: CustomerAddressStatus;
};

export type UpdateCustomerAddressRequest = CreateCustomerAddressRequest;

export async function getCustomerAddresses(
  customerId: number
): Promise<CustomerAddress[]> {
  return apiRequest<CustomerAddress[]>(
    `/api/customer-addresses/customer/${customerId}`
  );
}

export async function createCustomerAddress(
  customerId: number,
  payload: CreateCustomerAddressRequest
): Promise<CustomerAddress> {
  return apiRequest<CustomerAddress>(
    `/api/customer-addresses/customer/${customerId}`,
    {
      method: 'POST',
      body: payload,
    }
  );
}

export async function updateCustomerAddress(
  id: number,
  payload: UpdateCustomerAddressRequest
): Promise<CustomerAddress> {
  return apiRequest<CustomerAddress>(`/api/customer-addresses/${id}`, {
    method: 'PUT',
    body: payload,
  });
}

export async function deactivateCustomerAddress(id: number): Promise<void> {
  return apiRequest<void>(`/api/customer-addresses/${id}/deactivate`, {
    method: 'PATCH',
  });
}