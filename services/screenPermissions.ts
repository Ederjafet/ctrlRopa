import {
  hasPermission,
  hasRole,
  isAdmin,
  isPlatformOwner,
} from '@/services/accessControl';
import { formatPermissionCode } from '@/services/permissionDependencies';
import { UserSession } from '@/services/sessionStorage';

export type ScreenPermissionKey = 'payments';

export type ScreenPermissionActionKey =
  | 'viewPayments'
  | 'registerPayment'
  | 'applyCustomerBalance'
  | 'viewPaymentDetail';

export type ScreenPermissionActionDefinition = {
  key: ScreenPermissionActionKey;
  label: string;
  permissionCode: string;
  allowedMessage: string;
  deniedMessage: string;
};

export type ScreenPermissionDefinition = {
  key: ScreenPermissionKey;
  title: string;
  requiredToView: string[];
  actions: ScreenPermissionActionDefinition[];
};

export type ScreenPermissionEvaluation = ScreenPermissionActionDefinition & {
  allowed: boolean;
  permissionLabel: string;
  userMessage: string;
  technicalMessage: string;
};

export const SCREEN_PERMISSIONS: Record<ScreenPermissionKey, ScreenPermissionDefinition> = {
  payments: {
    key: 'payments',
    title: 'Pagos',
    requiredToView: ['VIEW_PAYMENTS'],
    actions: [
      {
        key: 'viewPayments',
        label: 'Ver pagos',
        permissionCode: 'VIEW_PAYMENTS',
        allowedMessage: 'Puedes consultar pagos y abonos registrados.',
        deniedMessage: 'No puedes consultar pagos.',
      },
      {
        key: 'registerPayment',
        label: 'Registrar abonos',
        permissionCode: 'REGISTER_PAYMENTS',
        allowedMessage: 'Puedes registrar abonos desde un pedido o apartado seleccionado.',
        deniedMessage: 'No puedes registrar abonos.',
      },
      {
        key: 'applyCustomerBalance',
        label: 'Aplicar saldo a favor',
        permissionCode: 'APPLY_CUSTOMER_BALANCE',
        allowedMessage: 'Puedes aplicar saldo a favor cuando el flujo este disponible.',
        deniedMessage: 'No puedes aplicar saldo a favor.',
      },
      {
        key: 'viewPaymentDetail',
        label: 'Ver detalle de pago',
        permissionCode: 'VIEW_PAYMENTS',
        allowedMessage: 'Puedes revisar el detalle e historial visible de pagos.',
        deniedMessage: 'No puedes ver el detalle de pagos.',
      },
    ],
  },
};

export function getScreenPermissionDefinition(screenKey: ScreenPermissionKey) {
  return SCREEN_PERMISSIONS[screenKey];
}

export function getScreenPermissionSummary(
  screenKey: ScreenPermissionKey,
  session: UserSession | null,
  language = 'es'
): ScreenPermissionEvaluation[] {
  return getScreenPermissionDefinition(screenKey).actions.map((action) => {
    const allowed = hasPermission(session, action.permissionCode);
    const permissionLabel = formatPermissionCode(action.permissionCode, language);

    return {
      ...action,
      allowed,
      permissionLabel,
      userMessage: allowed ? action.allowedMessage : action.deniedMessage,
      technicalMessage: allowed
        ? `Permiso activo: ${action.permissionCode}`
        : `Permiso requerido: ${action.permissionCode}`,
    };
  });
}

export function canAccessScreen(
  screenKey: ScreenPermissionKey,
  session: UserSession | null
) {
  return getScreenPermissionDefinition(screenKey).requiredToView.every((permissionCode) =>
    hasPermission(session, permissionCode)
  );
}

export function canDoScreenAction(
  screenKey: ScreenPermissionKey,
  actionKey: ScreenPermissionActionKey,
  session: UserSession | null
) {
  const action = getScreenPermissionDefinition(screenKey).actions.find(
    (item) => item.key === actionKey
  );

  return action ? hasPermission(session, action.permissionCode) : false;
}

export function findScreenPermissionAction(
  evaluations: ScreenPermissionEvaluation[],
  actionKey: ScreenPermissionActionKey
) {
  return evaluations.find((item) => item.key === actionKey);
}

export function getMissingPermissionMessage(
  evaluation?: ScreenPermissionEvaluation | null
) {
  if (!evaluation || evaluation.allowed) return undefined;

  return `${evaluation.deniedMessage} Permiso requerido: ${evaluation.permissionLabel}. Solicita acceso a tu administrador.`;
}

export function canViewScreenPermissionDiagnostics(session: UserSession | null) {
  return (
    isPlatformOwner(session) ||
    isAdmin(session) ||
    hasRole(session, 'TENANT_ADMIN') ||
    hasRole(session, 'QA_TENANT_ADMIN') ||
    hasPermission(session, 'MANAGE_USERS') ||
    hasPermission(session, 'MANAGE_ROLES') ||
    hasPermission(session, 'MANAGE_TENANT_ADMINS')
  );
}
