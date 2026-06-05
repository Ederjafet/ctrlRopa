import { API_BASE_URL } from '@/constants/api';
import {
  clearSession,
  getSession,
  isSessionExpired,
  saveAuthNotice,
  saveSession,
  touchSession,
  UserSession,
} from '@/services/sessionStorage';
import { router } from 'expo-router';

type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type ApiOptions = {
  method?: ApiMethod;
  body?: unknown;
  headers?: Record<string, string>;
  includeSession?: boolean;
};

export class ApiError extends Error {
  status: number;
  rawMessage: string;
  suppressUserNotification: boolean;

  constructor(status: number, rawMessage: string, suppressUserNotification = false) {
    super(extractApiErrorMessage(rawMessage) || friendlyStatusMessage(status));
    this.status = status;
    this.rawMessage = rawMessage;
    this.suppressUserNotification = suppressUserNotification;
  }
}

export class SessionRedirectError extends ApiError {
  constructor(message: string) {
    super(401, JSON.stringify({ message }), true);
    this.name = 'SessionRedirectError';
  }
}

function friendlyStatusMessage(status: number): string {
  if (status === 0) return 'No se pudo conectar con el servidor. Revisa tu conexion o intenta nuevamente.';
  if (status === 400) return 'Revisa la información capturada e intenta de nuevo.';
  if (status === 401) return 'Tu sesión expiró. Inicia sesión nuevamente.';
  if (status === 403) return 'No tienes permisos para realizar esta acción.';
  if (status === 404) return 'No se encontró la información solicitada.';
  if (status === 409) return 'La acción no se puede completar por el estado actual.';
  if (status >= 500) return 'Ocurrió un error del servidor. Intenta de nuevo más tarde.';
  return `No se pudo completar la solicitud (${status}).`;
}

function extractApiErrorMessage(rawMessage: string): string {
  if (!rawMessage) return '';

  try {
    const parsed = JSON.parse(rawMessage);

    if (typeof parsed === 'string') return parsed;
    if (typeof parsed?.message === 'string') return parsed.message;
    if (typeof parsed?.error === 'string') return parsed.error;
  } catch {
    return rawMessage;
  }

  return rawMessage;
}

function isRevokedSessionMessage(message: string): boolean {
  const normalized = message
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  return (
    normalized.includes('sesion se cerro') ||
    normalized.includes('iniciaste sesion en otro dispositivo') ||
    normalized.includes('iniciaste sesion en otro equipo')
  );
}

async function handleUnauthorizedSession(rawMessage: string) {
  const apiMessage = extractApiErrorMessage(rawMessage);
  const message = isRevokedSessionMessage(apiMessage)
    ? 'Tu sesión se cerró porque iniciaste sesión en otro equipo.'
    : apiMessage || 'Tu sesión expiró. Inicia sesión nuevamente.';

  await clearSession();
  await saveAuthNotice(message);
  router.replace('/login');
}

async function redirectSessionToLogin(
  message = 'Tu sesión se cerró porque iniciaste sesión en otro equipo.'
): Promise<never> {
  await clearSession();
  await saveAuthNotice(message);
  router.replace('/login');
  throw new SessionRedirectError(message);
}

function shouldValidateSession(path: string): boolean {
  return !path.startsWith('/api/me') && !path.startsWith('/api/auth/');
}

function replaceBranchPath(path: string, previousBranchId: number, nextBranchId: number): string {
  return path.replace(`/branch/${previousBranchId}`, `/branch/${nextBranchId}`);
}

async function validateServerSession(session: UserSession): Promise<UserSession> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/api/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(session.sessionToken ? { Authorization: `Bearer ${session.sessionToken}` } : {}),
      },
    });
  } catch {
    return session;
  }

  const text = await response.text();

  if (response.status === 401) {
    const apiMessage = extractApiErrorMessage(text);
    await redirectSessionToLogin(
      isRevokedSessionMessage(apiMessage)
        ? 'Tu sesión se cerró porque iniciaste sesión en otro equipo.'
        : apiMessage || 'Tu sesión expiró. Inicia sesión nuevamente.'
    );
  }

  if (!response.ok || !text) return session;

  try {
    const me = JSON.parse(text);
    const nextBranchId = Number(me?.branch?.id);
    const nextCompanyId = me?.company?.id ? Number(me.company.id) : session.companyId;
    const hasBranchMismatch = Number.isFinite(nextBranchId) && nextBranchId !== session.branchId;
    const hasCompanyMismatch =
      Number.isFinite(nextCompanyId) &&
      session.companyId !== undefined &&
      nextCompanyId !== session.companyId;

    if (hasBranchMismatch || hasCompanyMismatch) {
      const updatedSession = {
        ...session,
        companyId: Number.isFinite(nextCompanyId) ? nextCompanyId : session.companyId,
        companyCode: me?.company?.code ?? session.companyCode,
        companyName: me?.company?.name ?? session.companyName,
        branchId: Number.isFinite(nextBranchId) ? nextBranchId : session.branchId,
        branchName: me?.branch?.name ?? session.branchName,
        channels: me?.channels ?? session.channels,
        roles: me?.roles ?? session.roles,
        effectivePermissions: me?.permissions ?? session.effectivePermissions,
        passwordChangeRequired: me?.passwordChangeRequired ?? session.passwordChangeRequired,
      };

      await saveSession(updatedSession);
      return updatedSession;
    }
  } catch {
    return session;
  }

  return session;
}

export async function apiRequest<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const method = options.method ?? 'GET';
  const includeSession = options.includeSession ?? true;
  const session = includeSession ? await getSession() : null;
  const startedAt = Date.now();
  let requestPath = path;
  let activeSession = session;

  if (includeSession && session && isSessionExpired(session)) {
    await clearSession();
    await saveAuthNotice('Tu sesión expiró. Inicia sesión nuevamente.');
    router.replace('/login');
    throw new ApiError(401, JSON.stringify({ message: 'La sesión expiró por inactividad.' }));
  }

  if (includeSession && session && shouldValidateSession(path)) {
    activeSession = await validateServerSession(session);
    if (activeSession.branchId !== session.branchId) {
      requestPath = replaceBranchPath(path, session.branchId, activeSession.branchId);
    }
  }

  const url = `${API_BASE_URL}${requestPath}`;

  let response: Response;

  try {
    console.info(`[api] ${method} ${url}`);
    response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(activeSession?.sessionToken ? { Authorization: `Bearer ${activeSession.sessionToken}` } : {}),
        ...(options.headers ?? {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch (error) {
    console.warn(`[api] ${method} ${url} NETWORK_ERROR ${Date.now() - startedAt}ms`, error);
    throw new ApiError(
      0,
      JSON.stringify({
        message: 'No se pudo conectar con el servidor. Revisa tu conexion o intenta nuevamente.',
      })
    );
  }

  const text = await response.text();
  const durationMs = Date.now() - startedAt;

  if (response.ok) {
    console.info(`[api] ${method} ${url} ${response.status} ${durationMs}ms`);
  } else {
    console.warn(`[api] ${method} ${url} ${response.status} ${durationMs}ms ${text}`);
  }

  if (!response.ok) {
    if (includeSession && response.status === 401) {
      await handleUnauthorizedSession(text);
    }
    throw new ApiError(response.status, text || friendlyStatusMessage(response.status));
  }

  if (includeSession && session) {
    await touchSession();
  }

  if (!text) {
    return null as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}
