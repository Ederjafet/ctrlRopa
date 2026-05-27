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

export type SecurityAuditCountLine = {
  key: string;
  count: number;
};

export type SecurityAuditCriticalEventLine = {
  id: number;
  occurredAt?: string | null;
  eventType: string;
  email?: string | null;
  companyId?: number | null;
  branchId?: number | null;
  httpMethod?: string | null;
  path?: string | null;
  statusCode?: number | null;
  reason?: string | null;
};

export type SecurityAuditSummaryResponse = {
  totalEvents: number;
  total401: number;
  total403: number;
  byEventType: SecurityAuditCountLine[];
  byStatusCode: SecurityAuditCountLine[];
  byCompany: SecurityAuditCountLine[];
  byBranch: SecurityAuditCountLine[];
  topEmails: SecurityAuditCountLine[];
  topPaths: SecurityAuditCountLine[];
  recentCriticalEvents: SecurityAuditCriticalEventLine[];
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

export async function getSecurityAuditSummary(
  filters: Pick<SecurityAuditEventFilters, 'eventType' | 'email' | 'dateFrom' | 'dateTo'>
): Promise<SecurityAuditSummaryResponse> {
  const query = new URLSearchParams();

  addParam(query, 'eventType', filters.eventType);
  addParam(query, 'email', filters.email);
  addParam(query, 'dateFrom', filters.dateFrom);
  addParam(query, 'dateTo', filters.dateTo);

  const suffix = query.toString();
  return apiRequest<SecurityAuditSummaryResponse>(
    `/api/security/audit-events/summary${suffix ? `?${suffix}` : ''}`
  );
}

function addParam(query: URLSearchParams, name: string, value?: string) {
  if (value && value.trim()) {
    query.set(name, value.trim());
  }
}
