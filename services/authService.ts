import { apiRequest } from '@/services/apiClient';
import { clearSession, getSession, saveSession, UserSession } from '@/services/sessionStorage';

type LoginResponse = {
  userId: number;
  name: string;
  email: string;
  sessionToken?: string;
  passwordChangeRequired?: boolean;

  branch: {
    id: number;
    code: string;
    name: string;
  };

  channels: {
    id: number;
    code: string;
    name: string;
    status: string;
    enabled: boolean;
  }[];

  roles: {
    id: number;
    code: string;
    name: string;
  }[];

  effectivePermissions: {
    id: number;
    code: string;
    name: string;
  }[];
  sessionTimeoutMinutes?: number;
};

type MeResponse = Omit<LoginResponse, 'effectivePermissions'> & {
  permissions: LoginResponse['effectivePermissions'];
};

function toSession(data: LoginResponse | MeResponse): UserSession {
  const permissions =
    'effectivePermissions' in data ? data.effectivePermissions : data.permissions;

  return {
    userId: data.userId,
    name: data.name,
    email: data.email,
    sessionToken: data.sessionToken,
    passwordChangeRequired: data.passwordChangeRequired,
    branchId: data.branch.id,
    branchName: data.branch.name,
    channels: data.channels ?? [],
    roles: data.roles ?? [],
    effectivePermissions: permissions ?? [],
    sessionTimeoutMinutes: data.sessionTimeoutMinutes,
  };
}

export async function login(email: string, password: string): Promise<UserSession> {
  await clearSession();

  const data = await apiRequest<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: { email, password },
    includeSession: false,
  });

  const session = toSession(data);

  await saveSession(session);

  return session;
}

export async function refreshSession(): Promise<UserSession> {
  const currentSession = await getSession();
  const data = await apiRequest<MeResponse>('/api/me');
  const session = {
    ...toSession(data),
    sessionToken: currentSession?.sessionToken,
    sessionTimeoutMinutes: data.sessionTimeoutMinutes ?? currentSession?.sessionTimeoutMinutes,
    passwordChangeRequired: data.passwordChangeRequired ?? currentSession?.passwordChangeRequired,
  };

  await saveSession(session);

  return session;
}

export async function logout(): Promise<void> {
  try {
    await apiRequest<void>('/api/auth/logout', {
      method: 'POST',
    });
  } catch {
    // Local logout must still work if the backend is offline or the token already expired.
  } finally {
    await clearSession();
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await apiRequest<void>('/api/auth/change-password', {
    method: 'POST',
    body: {
      currentPassword,
      newPassword,
    },
  });

  const session = await getSession();
  if (session) {
    await saveSession({
      ...session,
      passwordChangeRequired: false,
    });
  }
}
