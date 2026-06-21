import { ApiError } from '@/services/apiClient';

export type NormalizedApiError = {
  status?: number;
  category:
    | 'unauthorized'
    | 'forbidden'
    | 'not-found'
    | 'conflict'
    | 'validation'
    | 'timeout'
    | 'server'
    | 'network'
    | 'unknown';
  message: string;
  requiredPermission?: string;
  raw?: unknown;
};

export type ActionableErrorKind =
  | 'connection'
  | 'timeout'
  | 'sessionExpired'
  | 'forbidden'
  | 'notFound'
  | 'conflict'
  | 'validation'
  | 'internal'
  | 'unknown';

export type ActionableErrorCopy = {
  kind: ActionableErrorKind;
  status?: number;
  title: string;
  message: string;
  primaryActionLabel: string;
  variant: 'info' | 'warning' | 'danger';
  requiredPermission?: string;
};

type ErrorTranslator = (key: string) => unknown;

const DEFAULT_ERROR_TEXT: Record<string, string> = {
  'errors.connection.title': 'No se pudo conectar con el servidor.',
  'errors.connection.message': 'Revisa tu conexion o intenta nuevamente.',
  'errors.timeout.title': 'El servidor tardo demasiado en responder.',
  'errors.timeout.message': 'Intenta nuevamente en unos segundos.',
  'errors.sessionExpired.title': 'Tu sesion expiro.',
  'errors.sessionExpired.message': 'Vuelve a iniciar sesion para continuar.',
  'errors.forbidden.title': 'No tienes permiso para realizar esta accion.',
  'errors.forbidden.message': 'Solicita acceso a tu supervisor.',
  'errors.notFound.title': 'No se encontro la informacion solicitada.',
  'errors.notFound.message': 'Puede haber sido eliminada o ya no estar disponible.',
  'errors.conflict.title': 'La operacion no se puede completar porque la informacion cambio.',
  'errors.conflict.message': 'Actualiza la pantalla e intenta nuevamente.',
  'errors.validation.title': 'Revisa los datos capturados.',
  'errors.validation.message': 'Hay informacion pendiente o invalida.',
  'errors.internal.title': 'No se pudo completar la operacion.',
  'errors.internal.message': 'Intenta nuevamente. Si continua, reporta el caso a soporte.',
  'errors.unknown.title': 'No se pudo completar la solicitud.',
  'errors.unknown.message': 'Intenta nuevamente. Si continua, reporta el caso a soporte.',
  'errors.retry': 'Reintentar',
  'errors.close': 'Cerrar',
  'errors.refresh': 'Actualizar',
  'errors.goToLogin': 'Ir a iniciar sesion',
  'errors.requestAccess': 'Solicitar acceso',
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

function translateError(t: ErrorTranslator | undefined, key: string) {
  const fallback = DEFAULT_ERROR_TEXT[key] ?? key;
  if (!t) return fallback;

  const translated = t(key);
  return typeof translated === 'string' && translated && translated !== key
    ? translated
    : fallback;
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

function normalizeMessage(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getMessageCandidate(error: any, raw: any) {
  const candidates = [
    raw?.message,
    raw?.error,
    raw?.detail,
    error?.message,
  ];

  const value = candidates.find(
    (candidate) => typeof candidate === 'string' && candidate.trim()
  );

  return typeof value === 'string' ? value.trim() : '';
}

function isTimeoutMessage(message: string) {
  const normalized = normalizeMessage(message);
  return (
    normalized.includes('timeout') ||
    normalized.includes('timed out') ||
    normalized.includes('tiempo de espera') ||
    normalized.includes('tardo demasiado') ||
    normalized.includes('demasiado en responder')
  );
}

function isNetworkMessage(message: string) {
  const normalized = normalizeMessage(message);
  return (
    normalized.includes('networkerror') ||
    normalized.includes('network request failed') ||
    normalized.includes('failed to fetch') ||
    normalized.includes('fetch') ||
    normalized.includes('no se pudo conectar') ||
    normalized.includes('connection refused')
  );
}

function isGenericInternalMessage(message: string) {
  const normalized = normalizeMessage(message);
  return (
    normalized.includes('ocurrio un error interno inesperado') ||
    normalized.includes('error interno inesperado') ||
    normalized.includes('internal server error') ||
    normalized.includes('unexpected internal') ||
    normalized.includes('something went wrong')
  );
}

function hasSensitiveTechnicalDetails(message: string) {
  const normalized = normalizeMessage(message);
  return (
    /https?:\/\//i.test(message) ||
    /\b(select|insert|update|delete|from|where)\b/i.test(message) ||
    /\b(stacktrace|trace|exception|java\.|org\.springframework|hibernate|sql|jdbc)\b/i.test(message) ||
    normalized.includes('/api/') ||
    normalized.includes('nullpointer') ||
    normalized.includes('constraint violation')
  );
}

function getSafeUnknownMessage(message: string) {
  if (!message.trim()) return '';
  if (message.length > 220) return '';
  if (isGenericInternalMessage(message)) return '';
  if (hasSensitiveTechnicalDetails(message)) return '';
  return message.trim();
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
  const messageCandidate = getMessageCandidate(apiError, raw);

  if (status === 408 || status === 504 || (!status && isTimeoutMessage(messageCandidate))) {
    return {
      status,
      category: 'timeout',
      message: DEFAULT_ERROR_TEXT['errors.timeout.message'],
      requiredPermission,
      raw: error,
    };
  }

  if (!status && !(error instanceof ApiError)) {
    const message = String(messageCandidate || apiError?.message || '');
    const category = isNetworkMessage(message)
      ? 'network'
      : 'unknown';
    return {
      category,
      message:
        category === 'network'
          ? DEFAULT_ERROR_TEXT['errors.connection.title']
          : getSafeUnknownMessage(message) || DEFAULT_ERROR_TEXT['errors.unknown.message'],
      requiredPermission,
      raw: error,
    };
  }

  if (status === 0) {
    return {
      status,
      category: 'network',
      message: DEFAULT_ERROR_TEXT['errors.connection.message'],
      requiredPermission,
      raw: error,
    };
  }

  if (status === 401) {
    return {
      status,
      category: 'unauthorized',
      message: DEFAULT_ERROR_TEXT['errors.sessionExpired.message'],
      requiredPermission,
      raw: error,
    };
  }

  if (status === 403) {
    return {
      status,
      category: 'forbidden',
      message: DEFAULT_ERROR_TEXT['errors.forbidden.message'],
      requiredPermission,
      raw: error,
    };
  }

  if (status === 404) {
    return {
      status,
      category: 'not-found',
      message: DEFAULT_ERROR_TEXT['errors.notFound.message'],
      requiredPermission,
      raw: error,
    };
  }

  if (status === 409) {
    return {
      status,
      category: 'conflict',
      message: DEFAULT_ERROR_TEXT['errors.conflict.message'],
      requiredPermission,
      raw: error,
    };
  }

  if (status === 400 || status === 422) {
    return {
      status,
      category: 'validation',
      message: DEFAULT_ERROR_TEXT['errors.validation.message'],
      requiredPermission,
      raw: error,
    };
  }

  if (status && status >= 500) {
    return {
      status,
      category: 'server',
      message: DEFAULT_ERROR_TEXT['errors.internal.message'],
      requiredPermission,
      raw: error,
    };
  }

  return {
    status,
    category: 'unknown',
    message:
      getSafeUnknownMessage(messageCandidate || apiError?.message || '') ||
      DEFAULT_ERROR_TEXT['errors.unknown.message'],
    requiredPermission,
    raw: error,
  };
}

function getActionableKind(category: NormalizedApiError['category']): ActionableErrorKind {
  switch (category) {
    case 'network':
      return 'connection';
    case 'timeout':
      return 'timeout';
    case 'unauthorized':
      return 'sessionExpired';
    case 'forbidden':
      return 'forbidden';
    case 'not-found':
      return 'notFound';
    case 'conflict':
      return 'conflict';
    case 'validation':
      return 'validation';
    case 'server':
      return 'internal';
    default:
      return 'unknown';
  }
}

function getActionKey(kind: ActionableErrorKind) {
  switch (kind) {
    case 'connection':
    case 'timeout':
    case 'internal':
      return 'errors.retry';
    case 'sessionExpired':
      return 'errors.goToLogin';
    case 'forbidden':
      return 'errors.requestAccess';
    case 'conflict':
      return 'errors.refresh';
    default:
      return 'errors.close';
  }
}

function getVariant(kind: ActionableErrorKind): ActionableErrorCopy['variant'] {
  switch (kind) {
    case 'internal':
      return 'danger';
    case 'connection':
    case 'timeout':
    case 'sessionExpired':
    case 'forbidden':
    case 'conflict':
    case 'validation':
      return 'warning';
    default:
      return 'info';
  }
}

function getKindKey(kind: ActionableErrorKind) {
  switch (kind) {
    case 'sessionExpired':
      return 'sessionExpired';
    case 'notFound':
      return 'notFound';
    default:
      return kind;
  }
}

export function getActionableApiError(
  error: unknown,
  t?: ErrorTranslator
): ActionableErrorCopy {
  const normalized = normalizeApiError(error);
  const kind = getActionableKind(normalized.category);
  const kindKey = getKindKey(kind);
  const isSafeUnknown =
    kind === 'unknown' &&
    normalized.message &&
    normalized.message !== DEFAULT_ERROR_TEXT['errors.unknown.message'];
  const permissionMessage =
    kind === 'forbidden' && normalized.requiredPermission
      ? `No tienes permiso para realizar esta accion. Permiso requerido: ${normalized.requiredPermission}.`
      : null;

  return {
    kind,
    status: normalized.status,
    title: translateError(t, `errors.${kindKey}.title`),
    message: permissionMessage
      ? permissionMessage
      : isSafeUnknown
      ? normalized.message
      : translateError(t, `errors.${kindKey}.message`),
    primaryActionLabel: translateError(t, getActionKey(kind)),
    variant: getVariant(kind),
    requiredPermission: normalized.requiredPermission,
  };
}

export function getActionableApiErrorMessage(
  error: unknown,
  t?: ErrorTranslator
): string {
  return getActionableApiError(error, t).message;
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
  return getActionableApiErrorMessage(error);
}
