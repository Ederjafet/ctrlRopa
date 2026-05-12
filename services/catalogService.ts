import { apiRequest } from '@/services/apiClient';
import { getBatchesByBranch } from '@/services/batchService';

export type PaymentMethod = {
  id: number;
  code?: string;
  name: string;
  active?: boolean;
  status?: string;
};

export type ProductType = {
  id: number;
  code?: string;
  name: string;
};

export type Brand = {
  id: number;
  code?: string;
  name: string;
};

export type Size = {
  id: number;
  code?: string;
  name: string;
};

export type StorageLocation = {
  id: number;
  code?: string;
  name: string;
};

export type Batch = {
  id: number;
  folio: string;
  expectedQuantity?: number;
  receivedQuantity?: number | null;
  status?: string;
  notes?: string | null;
};

export type BootstrapCatalogs = {
  paymentMethods?: PaymentMethod[];
  productTypes?: ProductType[];
  brands?: Brand[];
  sizes?: Size[];
  storageLocations?: StorageLocation[];
  batches?: Batch[];
  [key: string]: any;
};

export async function getBootstrap(branchId: number): Promise<BootstrapCatalogs> {
  return apiRequest(`/api/catalogs/bootstrap?branchId=${branchId}`);
}

export async function getPaymentMethods(branchId: number): Promise<PaymentMethod[]> {
  const bootstrap = await getBootstrap(branchId);

  return (bootstrap.paymentMethods ?? []).filter((method) => {
    if (method.active === false) return false;
    if (method.status && method.status !== 'ACTIVE') return false;
    return true;
  });
}

export async function getProductTypes(branchId: number): Promise<ProductType[]> {
  const bootstrap = await getBootstrap(branchId);
  return bootstrap.productTypes ?? [];
}

export async function getBrands(branchId: number): Promise<Brand[]> {
  const bootstrap = await getBootstrap(branchId);
  return bootstrap.brands ?? [];
}

export async function getSizes(branchId: number): Promise<Size[]> {
  const bootstrap = await getBootstrap(branchId);
  return bootstrap.sizes ?? [];
}

export async function getStorageLocations(branchId: number): Promise<StorageLocation[]> {
  const bootstrap = await getBootstrap(branchId);
  return bootstrap.storageLocations ?? [];
}

export async function getBatches(branchId: number): Promise<Batch[]> {
  return getBatchesByBranch(branchId);
}
