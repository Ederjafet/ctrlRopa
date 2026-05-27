import { apiRequest } from '@/services/apiClient';

export type SecurityAuditEventLine = {
  id: number;
  occurredAt: string;
  userId?: number | null;
  email?: string | null;
  companyId?: number | null;
  branchId?: number | null;
  eventType: string;
  httpMethod?: string | null;
  path?: string | null;
  statusCode?: number | null;
  reason?: string | null;
  remoteIp?: string | null;
  userAgent?: string | null;
  targetResourceType?: string | null;
  targetResourceId?: string | null;
  metadataJson?: string | null;
};

export type SecurityAuditEventFilters = {
  eventType?: string;
  email?: string;
  statusCode?: string;
  path?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  size?: number;
};

export type SecurityAuditEventResponse = {
  events: SecurityAuditEventLine[];
  page: number;
  size: number;
  total: number;
};

export async function getSecurityAuditEvents(
  filters: SecurityAuditEventFilters
): Promise<SecurityAuditEventResponse> {
  const query = new URLSearchParams();

  addParam(query, 'eventType', filters.eventType);
  addParam(query, 'email', filters.email);
  addParam(query, 'statusCode', filters.statusCode);
  addParam(query, 'path', filters.path);
  addParam(query, 'dateFrom', filters.dateFrom);
  addParam(query, 'dateTo', filters.dateTo);
  query.set('page', String(filters.page ?? 0));
  query.set('size', String(filters.size ?? 20));

  return apiRequest<SecurityAuditEventResponse>(
    `/api/security/audit-events?${query.toString()}`
  );
}

function addParam(query: URLSearchParams, name: string, value?: string) {
  if (value && value.trim()) {
    query.set(name, value.trim());
  }
}
