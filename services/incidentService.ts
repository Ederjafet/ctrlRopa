import { apiRequest } from '@/services/apiClient';

export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';

export type IncidentType =
  | 'COLLECTION_SHORT'
  | 'COLLECTION_OVER'
  | 'ADDRESS_ISSUE'
  | 'PACKAGE_DAMAGED'
  | 'PACKAGE_LOST'
  | 'ITEM_LOST';

export type Incident = {
  id: number;
  branchId: number;
  type: IncidentType | string;
  status: IncidentStatus | string;
  customerId?: number | null;
  itemId?: number | null;
  shipmentId?: number | null;
  shipmentPackageId?: number | null;
  customerOrderId?: number | null;
  expectedAmount?: number | null;
  receivedAmount?: number | null;
  differenceAmount?: number | null;
  description?: string | null;
  evidenceUrl?: string | null;
  createdAt?: string | null;
  createdByUserId?: number | null;
  inProgressAt?: string | null;
  resolvedAt?: string | null;
  resolvedByUserId?: number | null;
  cancelledAt?: string | null;
  cancelledByUserId?: number | null;
};

export type UpdateIncidentStatusRequest = {
  status: IncidentStatus;
  description?: string | null;
  evidenceUrl?: string | null;
  actedByUserId: number;
};

export async function getIncidentById(id: number): Promise<Incident> {
  return apiRequest<Incident>(`/api/incidents/${id}`);
}

export async function getIncidentsByBranch(
  branchId: number,
  status?: IncidentStatus | 'ALL'
): Promise<Incident[]> {
  const query = status && status !== 'ALL' ? `?status=${status}` : '';
  return apiRequest<Incident[]>(`/api/incidents/branch/${branchId}${query}`);
}

export async function getIncidentsByShipment(
  shipmentId: number
): Promise<Incident[]> {
  return apiRequest<Incident[]>(`/api/incidents/shipment/${shipmentId}`);
}

export async function getIncidentsByStatus(
  status: IncidentStatus
): Promise<Incident[]> {
  return apiRequest<Incident[]>(`/api/incidents?status=${status}`);
}

export async function updateIncidentStatus(
  incidentId: number,
  payload: UpdateIncidentStatusRequest
): Promise<Incident> {
  return apiRequest<Incident>(`/api/incidents/${incidentId}/status`, {
    method: 'PATCH',
    body: {
      status: payload.status,
      description: payload.description?.trim() || null,
      evidenceUrl: payload.evidenceUrl?.trim() || null,
      actedByUserId: payload.actedByUserId,
    },
  });
}

export function getIncidentStatusLabel(status?: string | null): string {
  switch (status) {
    case 'OPEN':
      return 'Abierta';
    case 'IN_PROGRESS':
      return 'En seguimiento';
    case 'RESOLVED':
      return 'Resuelta';
    case 'CANCELLED':
      return 'Cancelada';
    default:
      return status || 'Sin estado';
  }
}

export function getIncidentTypeLabel(type?: string | null): string {
  switch (type) {
    case 'COLLECTION_SHORT':
      return 'Faltante en cobranza';
    case 'COLLECTION_OVER':
      return 'Sobrante en cobranza';
    case 'ADDRESS_ISSUE':
      return 'Problema de dirección';
    case 'PACKAGE_DAMAGED':
      return 'Paquete dañado';
    case 'PACKAGE_LOST':
      return 'Paquete perdido';
    case 'ITEM_LOST':
      return 'Prenda perdida';
    default:
      return type || 'Sin tipo';
  }
}

export function isIncidentFinal(status?: string | null): boolean {
  return status === 'RESOLVED' || status === 'CANCELLED';
}
