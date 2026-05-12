import { apiRequest } from '@/services/apiClient';

export type UserLoginSecurityLine = {
  userId: number;
  userName: string;
  email: string;
  branchName?: string | null;
  failedLoginAttempts: number;
  lockedUntil?: string | null;
  lastFailedLoginAt?: string | null;
  lastSuccessLoginAt?: string | null;
  lastLoginIp?: string | null;
  lastLoginUserAgent?: string | null;
};

export type ApiSessionLine = {
  id: number;
  userId: number;
  userName: string;
  email: string;
  branchName?: string | null;
  expiresAt?: string | null;
  absoluteExpiresAt?: string | null;
  lastSeenAt?: string | null;
  revokedAt?: string | null;
  createdAt?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type SecuritySessionsResponse = {
  users: UserLoginSecurityLine[];
  sessions: ApiSessionLine[];
};

export async function getSecuritySessions(): Promise<SecuritySessionsResponse> {
  return apiRequest<SecuritySessionsResponse>('/api/security/sessions');
}

export async function unlockSecurityUser(userId: number): Promise<void> {
  await apiRequest<void>(`/api/security/sessions/users/${userId}/unlock`, {
    method: 'POST',
  });
}

export async function revokeSecurityUserSessions(userId: number): Promise<void> {
  await apiRequest<void>(`/api/security/sessions/users/${userId}/revoke-sessions`, {
    method: 'POST',
  });
}

export async function revokeSecuritySession(sessionId: number): Promise<void> {
  await apiRequest<void>(`/api/security/sessions/${sessionId}/revoke`, {
    method: 'POST',
  });
}

export async function revokeAllSecuritySessions(): Promise<void> {
  await apiRequest<void>('/api/security/sessions/revoke-all', {
    method: 'POST',
  });
}
