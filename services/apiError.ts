import { ApiError } from '@/services/apiClient';

export type NormalizedApiError = {
  status?: number;
  category:
    | 'unauthorized'
    | 'forbidden'
    | 'not-found'
    | 'conflict'
    | 'validation'
    | 'server'
    | 'network'
    | 'unknown';
  message: string;
  requiredPermission?: string;
  raw?: unknown;
};

function parseRaw(value: unknown): any {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return { message: value };
    }
  }
  return value;
}

function getStatus(error: any): number | undefined {
  const candidates = [
    error?.status,
    error?.response?.status,
    error?.error?.status,
    error?.body?.status,
    error?.data?.status,
  ];

  const status = candidates.find((candidate) => Number.isFinite(Number(candidate)));
  return status === undefined ? undefined : Number(status);
}

export function getRequiredPermission(error: unknown): string | undefined {
  const apiError = error as any;
  const raw = parseRaw(apiError?.rawMessage ?? apiError?.message ?? apiError);
  const candidates = [
    apiError?.requiredPermission,
    apiError?.permission,
    apiError?.data?.requiredPermission,
    apiError?.data?.permission,
    apiError?.body?.requiredPermission,
    apiError?.body?.permission,
    raw?.requiredPermission,
    raw?.permission,
    raw?.detail?.requiredPermission,
    raw?.detail?.permission,
  ];

  const direct = candidates.find(
    (candidate) => typeof candidate === 'string' && candidate.trim()
  );
  if (direct) return direct.trim();

  const text = JSON.stringify(raw ?? apiError ?? '');
  const match = text.match(/\b[A-Z][A-Z0-9_]{2,}\b/);
  return match?.[0];
}

export function normalizeApiError(error: unknown): NormalizedApiError {
  const apiError = error as any;
  const raw = parseRaw(apiError?.rawMessage ?? apiError?.message ?? apiError);
  const status = getStatus(apiError) ?? getStatus(raw);
  const requiredPermission = getRequiredPermission(error);

  if (!status && !(error instanceof ApiError)) {
    const message = String(apiError?.message ?? '');
    const category = message.includes('NetworkError') || message.includes('fetch')
      ? 'network'
      : 'unknown';
    return {
      category,
      message:
        category === 'network'
          ? 'No se pudo conectar con el servidor.'
          : message || 'No se pudo completar la solicitud.',
      requiredPermission,
      raw: error,
    };
  }

  if (status === 401) {
    return {
      status,
      category: 'unauthorized',
      message: 'Tu sesion expiro. Inicia sesion nuevamente.',
      requiredPermission,
      raw: error,
    };
  }

  if (status === 403) {
    return {
      status,
      category: 'forbidden',
      message: 'No tienes permiso para consultar esta informacion.',
      requiredPermission,
      raw: error,
    };
  }

  if (status === 404) {
    return {
      status,
      category: 'not-found',
      message: 'No se encontro la informacion solicitada.',
      requiredPermission,
      raw: error,
    };
  }

  if (status === 409) {
    return {
      status,
      category: 'conflict',
      message: 'La accion no se puede completar por el estado actual.',
      requiredPermission,
      raw: error,
    };
  }

  if (status === 422) {
    return {
      status,
      category: 'validation',
      message: 'Revisa la informacion capturada e intenta de nuevo.',
      requiredPermission,
      raw: error,
    };
  }

  if (status && status >= 500) {
    return {
      status,
      category: 'server',
      message: 'Ocurrio un error al cargar la informacion.',
      requiredPermission,
      raw: error,
    };
  }

  return {
    status,
    category: 'unknown',
    message: apiError?.message || 'No se pudo completar la solicitud.',
    requiredPermission,
    raw: error,
  };
}

export function isUnauthorizedError(error: unknown): boolean {
  return normalizeApiError(error).category === 'unauthorized';
}

export function isForbiddenError(error: unknown): boolean {
  return normalizeApiError(error).category === 'forbidden';
}

export function isNotFoundError(error: unknown): boolean {
  return normalizeApiError(error).category === 'not-found';
}

export function getUserFacingApiErrorMessage(error: unknown): string {
  return normalizeApiError(error).message;
}
