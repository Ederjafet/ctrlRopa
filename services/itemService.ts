import { apiRequest } from '@/services/apiClient';

export type ItemStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'SOLD'
  | 'DISABLED'
  | 'ON_CONSIGNMENT';

export type Item = {
  id: number;
  code: string;
  qrCode?: string | null;
  branchId: number;
  productTypeId: number;
  productTypeName?: string;
  brandId?: number | null;
  batchId?: number | null;
  batchFolio?: string | null;
  brandName?: string | null;
  sizeId?: number | null;
  sizeName?: string | null;
  comments?: string | null;
  price?: number | null;
  status: ItemStatus;
  storageLocationId?: number | null;
  storageLocationName?: string | null;
};

export type CreateItemRequest = {
  code: string;
  qrCode: string;
  branchId: number;
  batchId?: number | null;
  productTypeId: number;
  brandId?: number | null;
  sizeId?: number | null;
  comments?: string | null;
  price?: number | null;
  status?: ItemStatus;
  storageLocationId?: number | null;
  createdByUserId: number;
};

export type UpdateItemRequest = {
  code: string;
  qrCode: string;
  productTypeId: number;
  brandId?: number | null;
  sizeId?: number | null;
  comments?: string | null;
  price?: number | null;
  status: ItemStatus;
  storageLocationId?: number | null;
};

export async function createItem(payload: CreateItemRequest): Promise<Item> {
  return apiRequest<Item>('/api/items', {
    method: 'POST',
    body: payload,
  });
}

export async function getItemsByBranch(branchId: number): Promise<Item[]> {
  return apiRequest<Item[]>(`/api/items/branch/${branchId}`);
}

export async function getItemById(id: number): Promise<Item> {
  return apiRequest<Item>(`/api/items/${id}`);
}

export async function updateItem(
  id: number,
  payload: UpdateItemRequest
): Promise<Item> {
  return apiRequest<Item>(`/api/items/${id}`, {
    method: 'PUT',
    body: payload,
  });
}

export async function updateItemLocation(
  itemId: number,
  storageLocationId: number
): Promise<void> {
  return apiRequest<void>(
    `/api/items/${itemId}/location/${storageLocationId}`,
    {
      method: 'PATCH',
    }
  );
}