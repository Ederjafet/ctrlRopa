import { apiRequest } from '@/services/apiClient';

export type Box = {
  id: number;
  branchId?: number;
  code: string;
  description?: string | null;
  qrCode?: string | null;
  active?: boolean;
  status?: string;
};

function isActiveBox(box: Box) {
  if (box.active === false) return false;
  if (box.status && box.status !== 'ACTIVE') return false;
  return true;
}

export async function getBoxesByBranch(branchId: number): Promise<Box[]> {
  return apiRequest<Box[]>(`/api/boxes/branch/${branchId}`);
}

export async function getActiveBoxesByBranch(branchId: number): Promise<Box[]> {
  try {
    const boxes = await apiRequest<Box[]>(`/api/boxes/branch/${branchId}/active`);
    return Array.isArray(boxes) ? boxes.filter(isActiveBox) : [];
  } catch {
    const boxes = await getBoxesByBranch(branchId);
    return Array.isArray(boxes) ? boxes.filter(isActiveBox) : [];
  }
}

export async function getBoxById(id: number): Promise<Box> {
  return apiRequest<Box>(`/api/boxes/${id}`);
}
