import { API_BASE_URL } from '@/constants/api';
import { clearSession, getSession, isSessionExpired, touchSession } from '@/services/sessionStorage';

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

  constructor(status: number, rawMessage: string) {
    super(extractApiErrorMessage(rawMessage) || friendlyStatusMessage(status));
    this.status = status;
    this.rawMessage = rawMessage;
  }
}

function friendlyStatusMessage(status: number): string {
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

export async function apiRequest<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const method = options.method ?? 'GET';
  const includeSession = options.includeSession ?? true;
  const session = includeSession ? await getSession() : null;
  const url = `${API_BASE_URL}${path}`;
  const startedAt = Date.now();

  if (includeSession && session && isSessionExpired(session)) {
    await clearSession();
    throw new ApiError(401, JSON.stringify({ message: 'La sesión expiró por inactividad.' }));
  }

  let response: Response;

  try {
    console.info(`[api] ${method} ${url}`);
    response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(session?.sessionToken ? { Authorization: `Bearer ${session.sessionToken}` } : {}),
        ...(options.headers ?? {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch (error) {
    console.warn(`[api] ${method} ${url} NETWORK_ERROR ${Date.now() - startedAt}ms`, error);
    throw error;
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
      await clearSession();
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
