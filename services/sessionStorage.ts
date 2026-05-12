import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_KEY = 'user_session';

export type Channel = {
  id: number;
  code: string;
  name: string;
  status: string;
  enabled: boolean;
};

export type Role = {
  id: number;
  code: string;
  name: string;
};

export type Permission = {
  id: number;
  code: string;
  name: string;
};

export type UserSession = {
  userId: number;
  name: string;
  email: string;
  sessionToken?: string;
  passwordChangeRequired?: boolean;
  branchId: number;
  branchName: string;
  channels: Channel[];
  roles: Role[];
  effectivePermissions: Permission[];
  sessionTimeoutMinutes?: number;
  lastActivityAt?: string;
};

export async function saveSession(session: UserSession) {
  await AsyncStorage.setItem(
    USER_KEY,
    JSON.stringify({
      ...session,
      lastActivityAt: session.lastActivityAt ?? new Date().toISOString(),
    })
  );
}

export async function getSession(): Promise<UserSession | null> {
  const data = await AsyncStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
}

export async function clearSession() {
  await AsyncStorage.removeItem(USER_KEY);
}

export async function touchSession() {
  const session = await getSession();

  if (!session) return;

  await saveSession({
    ...session,
    lastActivityAt: new Date().toISOString(),
  });
}

export function isSessionExpired(session: UserSession | null): boolean {
  if (!session) return true;

  const timeoutMinutes = Number(session.sessionTimeoutMinutes || 30);
  const lastActivityAt = session.lastActivityAt
    ? new Date(session.lastActivityAt).getTime()
    : Date.now();

  if (!Number.isFinite(lastActivityAt)) return true;

  return Date.now() - lastActivityAt > timeoutMinutes * 60 * 1000;
}

export async function ensureSessionActive(): Promise<boolean> {
  const session = await getSession();

  if (!session) return false;

  if (isSessionExpired(session)) {
    await clearSession();
    return false;
  }

  return true;
}
