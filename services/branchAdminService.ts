import { apiRequest } from '@/services/apiClient';

export type BranchStatus = 'ACTIVE' | 'INACTIVE';

export type Branch = {
  id: number;
  code: string;
  name: string;
  status: BranchStatus | string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  createdAt?: string;
  updatedAt?: string;
};

export type BranchFormPayload = {
  code: string;
  name: string;
  status: BranchStatus;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

function normalizeBranchPayload(payload: BranchFormPayload): BranchFormPayload {
  return {
    code: payload.code.trim().toUpperCase(),
    name: payload.name.trim(),
    status: payload.status,
    addressLine1: payload.addressLine1.trim(),
    addressLine2: payload.addressLine2?.trim() || null,
    city: payload.city.trim(),
    state: payload.state.trim(),
    postalCode: payload.postalCode.trim(),
    country: payload.country.trim() || 'México',
  };
}

export async function getBranches(): Promise<Branch[]> {
  return apiRequest<Branch[]>('/api/branches');
}

export async function getActiveBranches(): Promise<Branch[]> {
  return apiRequest<Branch[]>('/api/branches/active');
}

export async function getBranch(id: number): Promise<Branch> {
  return apiRequest<Branch>(`/api/branches/${id}`);
}

export async function createBranch(payload: BranchFormPayload): Promise<Branch> {
  return apiRequest<Branch>('/api/branches', {
    method: 'POST',
    body: normalizeBranchPayload(payload),
  });
}

export async function updateBranch(
  id: number,
  payload: BranchFormPayload
): Promise<Branch> {
  return apiRequest<Branch>(`/api/branches/${id}`, {
    method: 'PUT',
    body: normalizeBranchPayload(payload),
  });
}

export async function deactivateBranch(id: number): Promise<Branch> {
  return apiRequest<Branch>(`/api/branches/${id}/deactivate`, {
    method: 'PATCH',
  });
}

export async function activateBranch(branch: Branch): Promise<Branch> {
  return updateBranch(branch.id, {
    code: branch.code,
    name: branch.name,
    status: 'ACTIVE',
    addressLine1: branch.addressLine1,
    addressLine2: branch.addressLine2 ?? null,
    city: branch.city,
    state: branch.state,
    postalCode: branch.postalCode,
    country: branch.country,
  });
}

export function isBranchActive(branch: Branch): boolean {
  return branch.status === 'ACTIVE';
}
