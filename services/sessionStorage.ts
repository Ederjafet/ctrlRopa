import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_KEY = 'user_session';
const AUTH_NOTICE_KEY = 'auth_notice';

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
  companyId?: number;
  companyCode?: string;
  companyName?: string;
  branchId: number;
  branchName: string;
  channels: Channel[];
  roles: Role[];
  effectivePermissions: Permission[];
  enabledModules?: string[];
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
  const keys = await AsyncStorage.getAllKeys();
  const sessionKeys = keys.filter((key) =>
    [
      USER_KEY,
      'session',
      'auth_session',
      'auth_token',
      'token',
      'user',
      'current_user',
    ].includes(key) || key.startsWith('selected_live_')
  );

  if (sessionKeys.length > 0) {
    await AsyncStorage.multiRemove(sessionKeys);
  }
}

export async function saveAuthNotice(message: string) {
  await AsyncStorage.setItem(AUTH_NOTICE_KEY, message);
}

export async function consumeAuthNotice(): Promise<string> {
  const message = await AsyncStorage.getItem(AUTH_NOTICE_KEY);
  await AsyncStorage.removeItem(AUTH_NOTICE_KEY);
  return message ?? '';
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
