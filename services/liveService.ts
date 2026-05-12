import { apiRequest } from '@/services/apiClient';

export type LiveStatus = 'OPEN' | 'ACTIVE' | 'CLOSED';

export type Live = {
  id: number;
  branchId: number;
  branchCode?: string;
  branchName?: string;
  status: LiveStatus | string;
  notes?: string | null;
  createdByUserId?: number;
  createdAt?: string;
  startedAt?: string | null;
  endedAt?: string | null;
};

export type CreateLiveRequest = {
  notes?: string | null;
  status?: LiveStatus;
};

export async function getLivesByBranch(branchId: number): Promise<Live[]> {
  return apiRequest<Live[]>(`/api/lives/branch/${branchId}`);
}

export async function getLiveById(id: number): Promise<Live> {
  return apiRequest<Live>(`/api/lives/${id}`);
}

export async function createLive(
  branchId: number,
  payload: CreateLiveRequest
): Promise<Live> {
  return apiRequest<Live>(`/api/lives/branch/${branchId}`, {
    method: 'POST',
    body: payload,
  });
}

export async function activateLive(id: number): Promise<Live> {
  return apiRequest<Live>(`/api/lives/${id}/activate`, {
    method: 'PATCH',
  });
}

export async function closeLive(id: number): Promise<Live> {
  return apiRequest<Live>(`/api/lives/${id}/close`, {
    method: 'PATCH',
  });
}

export function isLiveOperable(live: Live | null): boolean {
  return !!live && (live.status === 'OPEN' || live.status === 'ACTIVE');
}

export function getLiveStatusLabel(status?: string | null): string {
  switch (status) {
    case 'OPEN':
      return 'Abierto';
    case 'ACTIVE':
      return 'Activo';
    case 'CLOSED':
      return 'Cerrado';
    default:
      return status || 'Sin estado';
  }
}
