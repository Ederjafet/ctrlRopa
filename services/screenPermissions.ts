import { isPermissionDiagnosticsEnabled } from '@/constants/permissionDiagnostics';
import {
  hasPermission,
  hasRole,
  isAdmin,
  isPlatformOwner,
} from '@/services/accessControl';
import { formatPermissionCode } from '@/services/permissionDependencies';
import { UserSession } from '@/services/sessionStorage';

export type ScreenPermissionKey =
  | 'payments'
  | 'live'
  | 'doorSale'
  | 'doorReservation'
  | 'reservations'
  | 'reservationDetail'
  | 'customerPackages'
  | 'customerPackageDetail'
  | 'shipments'
  | 'shipmentDetail'
  | 'liveAuthorizations'
  | 'itemsCreate';

export type ScreenPermissionActionKey = string;

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
  live: {
    key: 'live',
    title: 'En vivo',
    requiredToView: ['VIEW_LIVE'],
    actions: [
      {
        key: 'viewLive',
        label: 'Ver LIVE',
        permissionCode: 'VIEW_LIVE',
        allowedMessage: 'Puedes entrar al modulo En vivo y consultar la operacion actual.',
        deniedMessage: 'No puedes ver el modulo En vivo.',
      },
      {
        key: 'operateLive',
        label: 'Operar LIVE',
        permissionCode: 'OPERATE_LIVE',
        allowedMessage: 'Puedes iniciar, cerrar y controlar sesiones LIVE.',
        deniedMessage: 'No puedes operar sesiones LIVE.',
      },
      {
        key: 'prepareLiveItem',
        label: 'Preparar prenda al aire',
        permissionCode: 'PREPARE_LIVE_ITEM',
        allowedMessage: 'Puedes preparar prendas antes de ponerlas al aire.',
        deniedMessage: 'No puedes preparar prendas para LIVE.',
      },
      {
        key: 'changeLiveItem',
        label: 'Cambiar prenda al aire',
        permissionCode: 'CHANGE_LIVE_ACTIVE_ITEM',
        allowedMessage: 'Puedes cambiar la prenda activa durante el LIVE.',
        deniedMessage: 'No puedes cambiar la prenda activa.',
      },
      {
        key: 'removeLiveItem',
        label: 'Retirar prenda al aire',
        permissionCode: 'REMOVE_LIVE_ACTIVE_ITEM',
        allowedMessage: 'Puedes retirar la prenda activa cuando corresponda.',
        deniedMessage: 'No puedes retirar la prenda activa.',
      },
      {
        key: 'createLiveReservation',
        label: 'Crear apartado LIVE',
        permissionCode: 'DO_LIVE_RESERVATION',
        allowedMessage: 'Puedes crear apartados desde el flujo LIVE.',
        deniedMessage: 'No puedes crear apartados desde LIVE.',
      },
      {
        key: 'createCustomerFromLive',
        label: 'Crear cliente desde alias',
        permissionCode: 'CREATE_CUSTOMER',
        allowedMessage: 'Puedes convertir un alias/interesado en cliente formal.',
        deniedMessage: 'No puedes crear clientes desde alias.',
      },
    ],
  },
  doorSale: {
    key: 'doorSale',
    title: 'Venta puerta',
    requiredToView: ['DO_DOOR_SALE'],
    actions: [
      {
        key: 'createDoorSale',
        label: 'Crear venta puerta',
        permissionCode: 'DO_DOOR_SALE',
        allowedMessage: 'Puedes registrar ventas de mostrador.',
        deniedMessage: 'No puedes registrar ventas de mostrador.',
      },
      {
        key: 'selectCustomer',
        label: 'Seleccionar cliente',
        permissionCode: 'VIEW_CUSTOMERS',
        allowedMessage: 'Puedes buscar y seleccionar clientes existentes.',
        deniedMessage: 'No puedes consultar clientes.',
      },
      {
        key: 'addItems',
        label: 'Agregar prendas',
        permissionCode: 'VIEW_INVENTORY',
        allowedMessage: 'Puedes consultar prendas disponibles para la venta.',
        deniedMessage: 'No puedes consultar prendas disponibles.',
      },
      {
        key: 'registerPayment',
        label: 'Registrar pago',
        permissionCode: 'REGISTER_PAYMENTS',
        allowedMessage: 'Puedes registrar el cobro de la venta.',
        deniedMessage: 'No puedes registrar pagos.',
      },
      {
        key: 'applyCustomerBalance',
        label: 'Usar saldo a favor',
        permissionCode: 'APPLY_CUSTOMER_BALANCE',
        allowedMessage: 'Puedes aplicar saldo a favor del cliente si el flujo lo permite.',
        deniedMessage: 'No puedes aplicar saldo a favor.',
      },
    ],
  },
  doorReservation: {
    key: 'doorReservation',
    title: 'Nuevo apartado',
    requiredToView: ['DO_DOOR_RESERVATION'],
    actions: [
      {
        key: 'createDoorReservation',
        label: 'Crear apartado',
        permissionCode: 'DO_DOOR_RESERVATION',
        allowedMessage: 'Puedes crear apartados de mostrador.',
        deniedMessage: 'No puedes crear apartados de mostrador.',
      },
      {
        key: 'selectCustomer',
        label: 'Seleccionar cliente',
        permissionCode: 'VIEW_CUSTOMERS',
        allowedMessage: 'Puedes buscar clientes para el apartado.',
        deniedMessage: 'No puedes consultar clientes.',
      },
      {
        key: 'createCustomer',
        label: 'Crear cliente',
        permissionCode: 'CREATE_CUSTOMER',
        allowedMessage: 'Puedes crear clientes si el flujo lo requiere.',
        deniedMessage: 'No puedes crear clientes.',
      },
      {
        key: 'addItems',
        label: 'Agregar prendas',
        permissionCode: 'VIEW_INVENTORY',
        allowedMessage: 'Puedes consultar prendas disponibles para apartar.',
        deniedMessage: 'No puedes consultar inventario disponible.',
      },
      {
        key: 'createQuickItem',
        label: 'Crear prenda rapida',
        permissionCode: 'MANAGE_INVENTORY',
        allowedMessage: 'Puedes crear prendas rapidas para este apartado.',
        deniedMessage: 'No puedes crear prendas rapidas.',
      },
      {
        key: 'registerAdvancePayment',
        label: 'Registrar anticipo',
        permissionCode: 'REGISTER_PAYMENTS',
        allowedMessage: 'Puedes registrar anticipos del apartado.',
        deniedMessage: 'No puedes registrar anticipos.',
      },
    ],
  },
  reservations: {
    key: 'reservations',
    title: 'Apartados',
    requiredToView: ['DO_DOOR_RESERVATION'],
    actions: [
      {
        key: 'viewReservations',
        label: 'Ver apartados',
        permissionCode: 'DO_DOOR_RESERVATION',
        allowedMessage: 'Puedes consultar apartados operativos.',
        deniedMessage: 'No puedes consultar apartados operativos.',
      },
      {
        key: 'createReservation',
        label: 'Crear apartado',
        permissionCode: 'DO_DOOR_RESERVATION',
        allowedMessage: 'Puedes iniciar un nuevo apartado.',
        deniedMessage: 'No puedes crear apartados.',
      },
      {
        key: 'createCustomer',
        label: 'Convertir alias en cliente',
        permissionCode: 'CREATE_CUSTOMER',
        allowedMessage: 'Puedes convertir interesados en clientes formales.',
        deniedMessage: 'No puedes crear clientes formales.',
      },
      {
        key: 'createPackage',
        label: 'Crear paquete',
        permissionCode: 'CREATE_CLOSE_CUSTOMER_PACKAGE',
        allowedMessage: 'Puedes crear paquetes para clientes con apartados elegibles.',
        deniedMessage: 'No puedes crear paquetes.',
      },
      {
        key: 'viewPayments',
        label: 'Ver pagos',
        permissionCode: 'VIEW_PAYMENTS',
        allowedMessage: 'Puedes consultar pagos relacionados con apartados.',
        deniedMessage: 'No puedes consultar pagos.',
      },
      {
        key: 'cancelReservation',
        label: 'Cancelar apartado',
        permissionCode: 'CANCEL_RESERVATION',
        allowedMessage: 'Puedes cancelar apartados cuando el flujo lo permita.',
        deniedMessage: 'No puedes cancelar apartados.',
      },
    ],
  },
  reservationDetail: {
    key: 'reservationDetail',
    title: 'Detalle del apartado',
    requiredToView: ['DO_DOOR_RESERVATION'],
    actions: [
      {
        key: 'viewReservationDetail',
        label: 'Ver detalle de apartado',
        permissionCode: 'DO_DOOR_RESERVATION',
        allowedMessage: 'Puedes consultar el detalle operativo del apartado.',
        deniedMessage: 'No puedes consultar el detalle del apartado.',
      },
      {
        key: 'createCustomer',
        label: 'Vincular o crear cliente',
        permissionCode: 'CREATE_CUSTOMER',
        allowedMessage: 'Puedes crear o vincular cliente cuando el apartado viene de alias.',
        deniedMessage: 'No puedes crear clientes.',
      },
      {
        key: 'createPackage',
        label: 'Crear o agregar a paquete',
        permissionCode: 'CREATE_CLOSE_CUSTOMER_PACKAGE',
        allowedMessage: 'Puedes mover el apartado hacia un paquete del cliente.',
        deniedMessage: 'No puedes gestionar paquetes.',
      },
      {
        key: 'viewPayments',
        label: 'Ver pagos',
        permissionCode: 'VIEW_PAYMENTS',
        allowedMessage: 'Puedes consultar pagos del apartado.',
        deniedMessage: 'No puedes consultar pagos.',
      },
      {
        key: 'registerPayment',
        label: 'Registrar abono',
        permissionCode: 'REGISTER_PAYMENTS',
        allowedMessage: 'Puedes registrar abonos del apartado.',
        deniedMessage: 'No puedes registrar abonos.',
      },
    ],
  },
  customerPackages: {
    key: 'customerPackages',
    title: 'Paquetes',
    requiredToView: ['CREATE_CLOSE_CUSTOMER_PACKAGE'],
    actions: [
      {
        key: 'viewPackages',
        label: 'Ver paquetes',
        permissionCode: 'CREATE_CLOSE_CUSTOMER_PACKAGE',
        allowedMessage: 'Puedes consultar la bandeja de paquetes.',
        deniedMessage: 'No puedes consultar paquetes.',
      },
      {
        key: 'createPackage',
        label: 'Crear paquete',
        permissionCode: 'CREATE_CLOSE_CUSTOMER_PACKAGE',
        allowedMessage: 'Puedes crear paquetes de cliente.',
        deniedMessage: 'No puedes crear paquetes.',
      },
      {
        key: 'viewPaymentStatus',
        label: 'Ver saldos',
        permissionCode: 'VIEW_PAYMENTS',
        allowedMessage: 'Puedes revisar saldos y pagos visibles del paquete.',
        deniedMessage: 'No puedes consultar pagos del paquete.',
      },
      {
        key: 'prepareShipment',
        label: 'Preparar para envio',
        permissionCode: 'MANAGE_SHIPMENTS',
        allowedMessage: 'Puedes continuar el flujo hacia envios si el paquete esta listo.',
        deniedMessage: 'No puedes administrar envios.',
      },
    ],
  },
  customerPackageDetail: {
    key: 'customerPackageDetail',
    title: 'Detalle de paquete',
    requiredToView: ['CREATE_CLOSE_CUSTOMER_PACKAGE'],
    actions: [
      {
        key: 'viewPackageDetail',
        label: 'Ver detalle de paquete',
        permissionCode: 'CREATE_CLOSE_CUSTOMER_PACKAGE',
        allowedMessage: 'Puedes consultar prendas, saldos y estado del paquete.',
        deniedMessage: 'No puedes consultar el detalle del paquete.',
      },
      {
        key: 'addFreeItem',
        label: 'Agregar prenda libre',
        permissionCode: 'MANAGE_INVENTORY',
        allowedMessage: 'Puedes agregar prendas libres disponibles al paquete.',
        deniedMessage: 'No puedes agregar prendas libres.',
      },
      {
        key: 'registerPayment',
        label: 'Registrar abono',
        permissionCode: 'REGISTER_PAYMENTS',
        allowedMessage: 'Puedes registrar abonos al paquete.',
        deniedMessage: 'No puedes registrar abonos.',
      },
      {
        key: 'applyCustomerBalance',
        label: 'Aplicar saldo a favor',
        permissionCode: 'APPLY_CUSTOMER_BALANCE',
        allowedMessage: 'Puedes aplicar saldo a favor al paquete.',
        deniedMessage: 'No puedes aplicar saldo a favor.',
      },
      {
        key: 'markReadyForShipping',
        label: 'Marcar listo para envio',
        permissionCode: 'CREATE_CLOSE_CUSTOMER_PACKAGE',
        allowedMessage: 'Puedes marcar paquetes como listos para envio cuando cumplan reglas.',
        deniedMessage: 'No puedes preparar paquetes para envio.',
      },
      {
        key: 'manageShipment',
        label: 'Gestionar envio',
        permissionCode: 'MANAGE_SHIPMENTS',
        allowedMessage: 'Puedes continuar la entrega desde envios.',
        deniedMessage: 'No puedes gestionar envios.',
      },
    ],
  },
  shipments: {
    key: 'shipments',
    title: 'Envios',
    requiredToView: ['MANAGE_SHIPMENTS'],
    actions: [
      {
        key: 'viewShipments',
        label: 'Ver envios',
        permissionCode: 'MANAGE_SHIPMENTS',
        allowedMessage: 'Puedes consultar la bandeja de envios.',
        deniedMessage: 'No puedes consultar envios.',
      },
      {
        key: 'createShipment',
        label: 'Crear envio',
        permissionCode: 'MANAGE_SHIPMENTS',
        allowedMessage: 'Puedes crear envios desde paquetes listos.',
        deniedMessage: 'No puedes crear envios.',
      },
      {
        key: 'updateShipment',
        label: 'Cambiar estado de envio',
        permissionCode: 'MANAGE_SHIPMENTS',
        allowedMessage: 'Puedes actualizar seguimiento y estado de envios.',
        deniedMessage: 'No puedes actualizar envios.',
      },
      {
        key: 'viewPackages',
        label: 'Ver paquetes relacionados',
        permissionCode: 'CREATE_CLOSE_CUSTOMER_PACKAGE',
        allowedMessage: 'Puedes revisar paquetes asociados a envios.',
        deniedMessage: 'No puedes consultar paquetes asociados.',
      },
    ],
  },
  shipmentDetail: {
    key: 'shipmentDetail',
    title: 'Detalle de envio',
    requiredToView: ['MANAGE_SHIPMENTS'],
    actions: [
      {
        key: 'viewShipmentDetail',
        label: 'Ver detalle de envio',
        permissionCode: 'MANAGE_SHIPMENTS',
        allowedMessage: 'Puedes consultar datos y paquetes del envio.',
        deniedMessage: 'No puedes consultar el detalle del envio.',
      },
      {
        key: 'addPackage',
        label: 'Agregar paquete',
        permissionCode: 'MANAGE_SHIPMENTS',
        allowedMessage: 'Puedes agregar paquetes elegibles al envio.',
        deniedMessage: 'No puedes agregar paquetes al envio.',
      },
      {
        key: 'dispatchShipment',
        label: 'Despachar envio',
        permissionCode: 'MANAGE_SHIPMENTS',
        allowedMessage: 'Puedes despachar o actualizar el estado del envio.',
        deniedMessage: 'No puedes despachar envios.',
      },
      {
        key: 'confirmDelivery',
        label: 'Confirmar entrega',
        permissionCode: 'MANAGE_SHIPMENTS',
        allowedMessage: 'Puedes confirmar resultados de entrega.',
        deniedMessage: 'No puedes confirmar entregas.',
      },
    ],
  },
  liveAuthorizations: {
    key: 'liveAuthorizations',
    title: 'Autorizaciones LIVE',
    requiredToView: ['VIEW_LIVE_OPERATION_AUTHORIZATIONS'],
    actions: [
      {
        key: 'viewAuthorizations',
        label: 'Ver autorizaciones LIVE',
        permissionCode: 'VIEW_LIVE_OPERATION_AUTHORIZATIONS',
        allowedMessage: 'Puedes consultar solicitudes operativas LIVE.',
        deniedMessage: 'No puedes consultar autorizaciones LIVE.',
      },
      {
        key: 'requestAuthorization',
        label: 'Solicitar autorizacion',
        permissionCode: 'REQUEST_LIVE_OPERATION_AUTHORIZATION',
        allowedMessage: 'Puedes solicitar autorizaciones operativas.',
        deniedMessage: 'No puedes solicitar autorizaciones.',
      },
      {
        key: 'approveAuthorization',
        label: 'Aprobar autorizacion',
        permissionCode: 'APPROVE_LIVE_OPERATION_AUTHORIZATION',
        allowedMessage: 'Puedes aprobar o rechazar solicitudes operativas.',
        deniedMessage: 'No puedes aprobar autorizaciones.',
      },
      {
        key: 'applyAuthorization',
        label: 'Aplicar autorizacion',
        permissionCode: 'APPLY_LIVE_OPERATION_AUTHORIZATION',
        allowedMessage: 'Puedes aplicar autorizaciones aprobadas.',
        deniedMessage: 'No puedes aplicar autorizaciones.',
      },
    ],
  },
  itemsCreate: {
    key: 'itemsCreate',
    title: 'Alta de prendas',
    requiredToView: ['MANAGE_INVENTORY'],
    actions: [
      {
        key: 'viewInventory',
        label: 'Ver inventario',
        permissionCode: 'VIEW_INVENTORY',
        allowedMessage: 'Puedes consultar catalogos y prendas existentes.',
        deniedMessage: 'No puedes consultar inventario.',
      },
      {
        key: 'createItem',
        label: 'Crear prenda',
        permissionCode: 'MANAGE_INVENTORY',
        allowedMessage: 'Puedes crear prendas nuevas.',
        deniedMessage: 'No puedes crear prendas.',
      },
      {
        key: 'createMultipleItems',
        label: 'Crear multiples prendas',
        permissionCode: 'MANAGE_INVENTORY',
        allowedMessage: 'Puedes generar varias prendas en una sola alta.',
        deniedMessage: 'No puedes generar prendas.',
      },
      {
        key: 'assignCatalogs',
        label: 'Asignar lote, marca y ubicacion',
        permissionCode: 'MANAGE_INVENTORY',
        allowedMessage: 'Puedes clasificar prendas con catalogos operativos.',
        deniedMessage: 'No puedes editar clasificacion de prendas.',
      },
    ],
  },
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
  if (!isPermissionDiagnosticsEnabled()) return false;

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
