import { apiRequest } from '@/services/apiClient';

export type SystemLogLine = {
  id: number;
  eventType: string;
  httpMethod: string;
  requestPath: string;
  statusCode?: number | null;
  branchId?: number | null;
  branchName?: string | null;
  userId?: number | null;
  userName?: string | null;
  detail?: string | null;
  createdAt: string;
};

export type SystemLogResponse = {
  lines: SystemLogLine[];
};

export async function getSystemLogs(limit = 100): Promise<SystemLogResponse> {
  return apiRequest<SystemLogResponse>(`/api/system/logs?limit=${limit}`);
}
