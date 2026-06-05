import AppBackButton from '@/components/ui/AppBackButton';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppShell from '@/components/layout/AppShell';
import AppOptionRow from '@/components/ui/AppOptionRow';
import RestrictedSection from '@/components/ui/RestrictedSection';
import AppText from '@/components/ui/AppText';
import DetailTemplate from '@/components/templates/DetailTemplate';
import EmptyState from '@/components/ui/EmptyState';
import EntitySummaryCard from '@/components/ui/EntitySummaryCard';
import SectionHeader from '@/components/ui/SectionHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import { SidebarSection } from '@/components/layout/Sidebar';
import { useAppTheme } from '@/context/AppThemeContext';
import {
  canAccess,
  canAccessByPermission,
  hasEffectivePermission,
  isAdmin,
} from '@/services/accessControl';
import { apiRequest } from '@/services/apiClient';
import {
  isNotFoundError,
  normalizeApiError,
  NormalizedApiError,
} from '@/services/apiError';
import { Box, getActiveBoxesByBranch } from '@/services/boxService';
import { getPaymentMethods, PaymentMethod } from '@/services/catalogService';
import { Customer, getCustomerById } from '@/services/customerService';
import { getItemById, Item } from '@/services/itemService';
import {
  assignReservationToBox,
  cancelReservation,
  removeReservationFromBox,
} from '@/services/reservationService';
import { canViewLive } from '@/services/livePermissionGuards';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

type Reservation = {
  id: number;
  customerId?: number;
  customerName?: string;
  itemId?: number;
  itemCode?: string;
  price?: number;
  status?: string;
  liveId?: number | null;
  liveStatus?: string | null;
  liveNotes?: string | null;
  salesChannelId?: number;
  salesChannelCode?: string;
  salesChannelName?: string;
  boxId?: number | null;
  boxCode?: string | null;
  createdAt?: string;
  branchName?: string | null;
  sellerUserName?: string | null;
  sellerUserId?: number | null;
  liveOperationalStatus?: string | null;
  liveOperationalStatusUpdatedAt?: string | null;
};

type Payment = {
  id: number;
  amount?: number;
  receivedAmount?: number;
  status?: string;
  paymentMethodId?: number;
  paymentMethodName?: string;
  paymentMethodCode?: string;
  method?: string;
  type?: string;
  createdAt?: string;
  paymentMethod?: {
    id?: number;
    name?: string;
    code?: string;
  } | null;
};

function getReservationStatusLabel(status?: string) {
  switch (status) {
    case 'ACTIVE':
      return 'Activo';
    case 'CANCELLED':
      return 'Cancelado';
    case 'COMPLETED':
      return 'Completado';
    case 'CONVERTED_TO_SALE':
      return 'Convertido a venta';
    default:
      return status || 'Sin estado';
  }
}

function getSalesChannelLabel(code?: string | null, name?: string | null) {
  if (name) return name;

  switch (code) {
    case 'LIVE':
      return 'Live';
    case 'DOOR_RESERVATION':
      return 'Apartado puerta';
    case 'DOOR_SALE':
      return 'Venta puerta';
    case 'CONSIGNMENT':
      return 'Consignacion';
    default:
      return code || 'No especificado';
  }
}

function getLiveLabel(reservation: Reservation) {
  if (!reservation.liveId) return 'Sin live asociado';

  const notes = reservation.liveNotes?.trim();
  const status = reservation.liveStatus ? ` (${reservation.liveStatus})` : '';
  return notes ? `Live #${reservation.liveId} - ${notes}${status}` : `Live #${reservation.liveId}${status}`;
}

function formatMoney(value?: number | null) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return 'Sin fecha';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';

  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function getLiveOperationalStatusLabel(status?: string | null) {
  switch ((status || '').toUpperCase()) {
    case 'PENDING':
      return 'Pendiente';
    case 'RESERVED':
      return 'Apartado';
    case 'OPERATIONAL_SOLD':
      return 'Vendido operativo';
    case 'CANCELLED':
      return 'Cancelado operativo';
    default:
      return status || 'No disponible';
  }
}

function getItemStatusLabel(status?: string | null) {
  switch ((status || '').toUpperCase()) {
    case 'AVAILABLE':
      return 'Disponible';
    case 'RESERVED':
      return 'Reservada';
    case 'SOLD':
      return 'Vendida';
    case 'DISABLED':
      return 'Deshabilitada';
    case 'ON_CONSIGNMENT':
      return 'Consignacion';
    default:
      return status || 'No disponible';
  }
}

function isVoidedPayment(payment: Payment) {
  const status = (payment.status || '').toUpperCase();
  return ['VOIDED', 'CANCELLED', 'CANCELED'].includes(status);
}

function getPaymentAmount(payment: Payment) {
  if (isVoidedPayment(payment)) return 0;
  return Number(payment.receivedAmount ?? payment.amount ?? 0);
}

function normalizeText(value?: string | null) {
  return (value || '').trim().toLowerCase();
}

function getPaymentMethodLabel(
  payment: Payment,
  paymentMethods: PaymentMethod[]
) {
  if (payment.paymentMethodName) return payment.paymentMethodName;
  if (payment.paymentMethod?.name) return payment.paymentMethod.name;

  const methodById = payment.paymentMethodId
    ? paymentMethods.find((method) => method.id === payment.paymentMethodId)
    : undefined;

  if (methodById?.name) return methodById.name;

  const rawCode =
    payment.paymentMethodCode ||
    payment.paymentMethod?.code ||
    payment.method ||
    payment.type;

  if (rawCode) {
    const methodByCode = paymentMethods.find(
      (method) => normalizeText(method.code) === normalizeText(rawCode)
    );

    if (methodByCode?.name) return methodByCode.name;
    return rawCode;
  }

  return 'Metodo no especificado';
}

function buildNavSections(session: UserSession | null): SidebarSection[] {
  const liveAllowed = canViewLive(session);
  const customersAllowed = canAccessByPermission(session, 'VIEW_CUSTOMERS');
  const reservationsAllowed =
    canAccess(session, 'DOOR_RESERVATION', 'DO_DOOR_RESERVATION') || liveAllowed;
  const usersAllowed = canAccessByPermission(session, 'MANAGE_USERS') || isAdmin(session);
  const systemAllowed =
    canAccessByPermission(session, 'MANAGE_ROLES') ||
    canAccessByPermission(session, 'MANAGE_BRANCH_CHANNELS') ||
    isAdmin(session);
  const reportsAllowed = canAccessByPermission(session, 'VIEW_REPORTS') || isAdmin(session);
  const adminAllowed = isAdmin(session);

  const primaryItems = [
    { key: 'home', label: 'Inicio', route: '/', icon: 'space-dashboard' as const },
    liveAllowed ? { key: 'live', label: 'LIVE', route: '/live', icon: 'live-tv' as const } : null,
    customersAllowed
      ? { key: 'customers', label: 'Clientes', route: '/customers', icon: 'groups' as const }
      : null,
    reservationsAllowed
      ? { key: 'reservations', label: 'Reservas', route: '/reservations', icon: 'bookmark' as const }
      : null,
  ].filter(Boolean);

  const controlItems = [
    usersAllowed
      ? { key: 'users', label: 'Usuarios', route: '/users', icon: 'manage-accounts' as const }
      : null,
    systemAllowed
      ? { key: 'system', label: 'Sistema', route: '/system', icon: 'settings' as const }
      : null,
    reportsAllowed
      ? { key: 'reports', label: 'Reportes', route: '/reports', icon: 'analytics' as const }
      : null,
  ].filter(Boolean);

  const developmentItems = [
    adminAllowed
      ? { key: 'ui-kit', label: 'UI Kit', route: '/ui-kit', icon: 'dashboard-customize' as const }
      : null,
  ].filter(Boolean);

  return [
    { title: 'Operacion', items: primaryItems },
    { title: 'Control', items: controlItems },
    { title: 'Desarrollo', items: developmentItems },
  ].filter((section) => section.items.length > 0) as SidebarSection[];
}

export default function ReservationDetailScreen() {
  const { id, returnTo } = useLocalSearchParams<{
    id?: string | string[];
    returnTo?: string | string[];
  }>();
  const router = useRouter();
  const { theme } = useAppTheme();

  const reservationId = useMemo(() => {
    const rawId = Array.isArray(id) ? id[0] : id;
    return Number(rawId);
  }, [id]);
  const returnRoute = Array.isArray(returnTo) ? returnTo[0] : returnTo;

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [item, setItem] = useState<Item | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [session, setSession] = useState<UserSession | null>(null);
  const [paymentSectionError, setPaymentSectionError] =
    useState<NormalizedApiError | null>(null);
  const [loadError, setLoadError] = useState<NormalizedApiError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isBoxModalVisible, setIsBoxModalVisible] = useState(false);

  const load = useCallback(async () => {
    if (!reservationId || Number.isNaN(reservationId)) {
      Alert.alert('Apartado', 'No se recibio un apartado valido.');
      router.replace('/reservations' as any);
      return;
    }

    try {
      setIsLoading(true);
      setLoadError(null);
      setPaymentSectionError(null);

      const session = await getSession();
      setSession(session);
      const reservationData = await apiRequest<Reservation>(
        `/api/reservations/${reservationId}`
      );
      const canViewPayments = hasEffectivePermission(session, 'VIEW_PAYMENTS');

      const restrictedPaymentError = normalizeApiError({
        status: 403,
        requiredPermission: 'VIEW_PAYMENTS',
        message: 'Acceso restringido',
      });

      const [paymentsResult, paymentMethodsResult, boxesResult, customerResult, itemResult] =
        await Promise.allSettled([
          canViewPayments
            ? apiRequest<Payment[]>(`/api/payments/reservation/${reservationId}`)
            : Promise.reject(restrictedPaymentError),
          canViewPayments && session
            ? getPaymentMethods(session.branchId)
            : Promise.resolve([]),
          session ? getActiveBoxesByBranch(session.branchId) : Promise.resolve([]),
          reservationData.customerId
            ? getCustomerById(reservationData.customerId)
            : Promise.resolve(null),
          reservationData.itemId
            ? getItemById(reservationData.itemId)
            : Promise.resolve(null),
        ]);

      setReservation(reservationData);
      setCustomer(
        customerResult.status === 'fulfilled' && customerResult.value
          ? customerResult.value
          : null
      );
      setItem(
        itemResult.status === 'fulfilled' && itemResult.value ? itemResult.value : null
      );
      setPayments(
        paymentsResult.status === 'fulfilled' && Array.isArray(paymentsResult.value)
          ? paymentsResult.value
          : []
      );
      setPaymentMethods(
        paymentMethodsResult.status === 'fulfilled' &&
          Array.isArray(paymentMethodsResult.value)
          ? paymentMethodsResult.value
          : []
      );
      setBoxes(
        boxesResult.status === 'fulfilled' && Array.isArray(boxesResult.value)
          ? boxesResult.value
          : []
      );

      if (paymentsResult.status === 'rejected') {
        setPaymentSectionError(normalizeApiError(paymentsResult.reason));
      }
    } catch (e: any) {
      const normalized = normalizeApiError(e);
      setLoadError(normalized);
      if (!isNotFoundError(e)) {
        Alert.alert('Error', normalized.message || 'No se pudo cargar el apartado.');
      }
      setReservation(null);
      setCustomer(null);
      setItem(null);
    } finally {
      setIsLoading(false);
    }
  }, [reservationId, router]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const paymentAccessRestricted = paymentSectionError?.category === 'forbidden';
  const totalPaid = paymentAccessRestricted
    ? 0
    : payments.reduce(
    (sum, payment) => sum + getPaymentAmount(payment),
    0
  );

  const total = Number(reservation?.price || 0);
  const remaining = Math.max(total - totalPaid, 0);
  const overpaid = Math.max(totalPaid - total, 0);
  const isActive = reservation?.status === 'ACTIVE';
  const canCancel = isActive && !paymentAccessRestricted && totalPaid <= 0;
  const navSections = useMemo(() => buildNavSections(session), [session]);
  const isLiveContext =
    returnRoute === '/live' ||
    !!reservation?.liveId ||
    reservation?.salesChannelCode === 'LIVE' ||
    reservation?.salesChannelName?.toUpperCase() === 'LIVE';
  const reservationBadge = isLiveContext ? 'Reserva LIVE' : 'Apartado';
  const customerName = reservation?.customerName || customer?.name || 'Sin cliente';
  const customerPhone = customer?.phone || 'Sin telefono';
  const branchName =
    reservation?.branchName || customer?.branchName || 'No capturado';
  const itemName =
    item?.productTypeName || item?.brandName || reservation?.itemCode || 'No disponible';
  const itemCode = item?.code || reservation?.itemCode || 'Sin codigo';
  const itemPrice = item?.price ?? reservation?.price ?? 0;
  const sellerLabel = reservation?.sellerUserName
    || (reservation?.sellerUserId ? `Usuario #${reservation.sellerUserId}` : 'No capturado');
  const liveOperationalStatus = getLiveOperationalStatusLabel(
    reservation?.liveOperationalStatus
  );
  const liveStatus = reservation?.liveStatus || 'No disponible';
  const createdAtLabel = formatDateTime(reservation?.createdAt);


  const handleCancel = async () => {
    if (!reservation) return;

    if (totalPaid > 0) {
      Alert.alert(
        'Cancelar apartado',
        'Este apartado ya tiene abonos. No se puede cancelar desde esta pantalla.'
      );
      return;
    }

    Alert.alert(
      'Cancelar apartado',
      'Seguro que deseas cancelar este apartado?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Si, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSaving(true);

              const session = await getSession();
              await cancelReservation(
                reservation.id,
                'Cancelado desde app',
                session?.userId || 0
              );

              Alert.alert('OK', 'Apartado cancelado.');
              router.replace('/reservations' as any);
            } catch (e: any) {
              Alert.alert('Error', e.message || 'No se pudo cancelar.');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleAssignBox = async (box: Box) => {
    if (!reservation) return;

    try {
      setIsSaving(true);
      await assignReservationToBox(reservation.id, box.id);
      Alert.alert('Caja', `Apartado asignado a ${box.code}.`);
      setIsBoxModalVisible(false);
      await load();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo asignar la caja.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveBox = async () => {
    if (!reservation) return;

    Alert.alert('Quitar de caja', 'Seguro que deseas quitar este apartado de la caja?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Si, quitar',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsSaving(true);
            await removeReservationFromBox(reservation.id);
            Alert.alert('Caja', 'Apartado quitado de la caja.');
            await load();
          } catch (e: any) {
            Alert.alert('Error', e.message || 'No se pudo quitar de la caja.');
          } finally {
            setIsSaving(false);
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <AppShell
        title="Detalle del apartado"
        subtitle="Cargando informacion"
        activeRoute="reservations"
        session={session}
        navSections={navSections}
      >
        <AppBackButton fallbackRoute={returnRoute || (isLiveContext ? '/live' : '/reservations')} />
        <EmptyState title="Cargando apartado..." message="Estamos preparando el detalle." />
      </AppShell>
    );
  }

  if (!reservation) {
    return (
      <AppShell
        title="Detalle del apartado"
        subtitle="No se pudo cargar la informacion"
        activeRoute="reservations"
        session={session}
        navSections={navSections}
      >
        <AppBackButton fallbackRoute={returnRoute || (isLiveContext ? '/live' : '/reservations')} />
        <EmptyState
          title={loadError?.category === 'not-found' ? 'Apartado no encontrado' : 'No se pudo cargar el apartado'}
          message={loadError?.message || 'No se encontro la informacion solicitada.'}
          icon={loadError?.category === 'not-found' ? 'search-off' : 'error-outline'}
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Detalle del apartado"
      subtitle={isLiveContext ? 'Apartado generado en vivo' : 'Resumen y seguimiento'}
      activeRoute="reservations"
      session={session}
      navSections={navSections}
    >
      <DetailTemplate
        header={
          <View style={styles.headerStack}>
            <View style={styles.headerActions}>
              <AppBackButton fallbackRoute={returnRoute || (isLiveContext ? '/live' : '/reservations')} />
              <View style={styles.headerButtons}>
                {isLiveContext ? (
                  <AppButton
                    title="Volver al live activo"
                    variant="secondary"
                    onPress={() => router.replace('/live' as any)}
                  />
                ) : null}
                <AppButton
                  title="Menu principal"
                  variant="secondary"
                  onPress={() => router.replace('/' as any)}
                />
              </View>
            </View>
            <SectionHeader
              title="Detalle del apartado"
              subtitle="Informacion operativa agrupada por cliente, prenda, live, seguimiento y pagos."
              rightContent={<StatusBadge label={reservationBadge} tone={isLiveContext ? 'success' : 'info'} />}
            />
          </View>
        }
        primaryInfo={
          <>
            <EntitySummaryCard
              title="Resumen del apartado"
              subtitle={`Apartado #${reservation.id}`}
              badge={getReservationStatusLabel(reservation.status)}
              meta={[
                { label: 'Precio', value: formatMoney(reservation.price) },
                {
                  label: 'Canal',
                  value: getSalesChannelLabel(
                    reservation.salesChannelCode,
                    reservation.salesChannelName
                  ),
                },
                { label: 'Fecha/hora', value: createdAtLabel },
                { label: 'Sucursal', value: branchName },
                { label: 'Registrado por', value: sellerLabel },
                { label: 'Caja', value: reservation.boxCode || 'Sin caja' },
              ]}
            />

            <AppCard style={styles.detailCard}>
              <SectionHeader title="Prenda" subtitle="Producto asociado al apartado" />
              <View
                style={[
                  styles.itemPlaceholder,
                  { borderColor: theme.colors.border, backgroundColor: theme.colors.background },
                ]}
              >
                <AppText variant="caption" color={theme.colors.mutedText}>
                  Sin foto
                </AppText>
              </View>
              <InfoRow label="Producto" value={itemName} />
              <InfoRow label="Codigo" value={itemCode} />
              <InfoRow label="Talla" value={item?.sizeName || 'Sin talla'} />
              <InfoRow label="Color" value="Sin color" />
              <InfoRow label="Precio" value={formatMoney(itemPrice)} />
              <InfoRow label="Estado de disponibilidad" value={getItemStatusLabel(item?.status)} />
            </AppCard>

            {paymentAccessRestricted && paymentSectionError ? (
              <RestrictedSection error={paymentSectionError} />
            ) : (
              <AppCard>
                <SectionHeader title="Pagos" subtitle="Resumen de pago del apartado" />
                <InfoRow label="Total" value={`$${total.toFixed(2)}`} />
                <InfoRow label="Pagado" value={`$${totalPaid.toFixed(2)}`} />
                <View
                  style={[
                    styles.remainingBox,
                    {
                      backgroundColor: theme.colors.warningBackground,
                      borderColor: theme.colors.warning,
                    },
                  ]}
                >
                  <AppText color={theme.colors.warning} bold>
                    Restante: ${remaining.toFixed(2)}
                  </AppText>
                  {overpaid > 0 ? (
                    <AppText color={theme.colors.warning}>
                      Excedente / saldo a favor: ${overpaid.toFixed(2)}
                    </AppText>
                  ) : null}
                </View>
              </AppCard>
            )}

            {!paymentAccessRestricted && payments.length > 0 ? (
              <AppCard>
                <SectionHeader title="Pagos registrados" />
                {payments.map((payment) => (
                  <View
                    key={payment.id}
                    style={[styles.paymentRow, { borderBottomColor: theme.colors.border }]}
                  >
                    <AppText bold>${getPaymentAmount(payment).toFixed(2)}</AppText>
                    <AppText variant="caption" color={theme.colors.mutedText}>
                      Metodo: {getPaymentMethodLabel(payment, paymentMethods)}
                    </AppText>
                    {isVoidedPayment(payment) ? (
                      <AppText variant="caption" color={theme.colors.danger}>
                        Pago anulado / cancelado
                      </AppText>
                    ) : null}
                  </View>
                ))}
              </AppCard>
            ) : null}
          </>
        }
        secondaryInfo={
          <>
            <EntitySummaryCard
              title="Cliente"
              subtitle={customerPhone}
              badge={customer?.status || 'No disponible'}
              meta={[
                { label: 'Nombre', value: customerName },
                { label: 'Telefono', value: customerPhone },
                { label: 'Email', value: customer?.email || 'No capturado' },
                { label: 'Compras pasadas', value: 'No disponible' },
                { label: 'Compras activas', value: 'No disponible' },
                { label: 'Saldo pendiente', value: 'No disponible' },
              ]}
            />

            <EntitySummaryCard
              title="LIVE / canal"
              subtitle={getLiveLabel(reservation)}
              badge={isLiveContext ? 'LIVE' : 'Canal'}
              meta={[
                { label: 'Live', value: reservation.liveId ? `Live #${reservation.liveId}` : 'Sin live asociado' },
                { label: 'Estado del live', value: liveStatus },
                { label: 'Canal', value: getSalesChannelLabel(reservation.salesChannelCode, reservation.salesChannelName) },
                { label: 'Sucursal', value: branchName },
                { label: 'URL', value: 'No capturada' },
              ]}
            />

            <EntitySummaryCard
              title="Seguimiento operativo"
              subtitle="Estado y acciones seguras"
              badge={liveOperationalStatus}
              meta={[
                { label: 'Estado LIVE', value: liveOperationalStatus },
                {
                  label: 'Ultima actualizacion',
                  value: formatDateTime(reservation.liveOperationalStatusUpdatedAt || reservation.createdAt),
                },
                {
                  label: 'Acciones',
                  value: canCancel ? 'Cancelar apartado disponible' : 'Sin acciones operativas disponibles',
                },
              ]}
            />

            <AppCard style={styles.detailCard}>
              <SectionHeader title="Caja" subtitle="Asignacion operativa" />
              {isActive ? (
                reservation.boxId ? (
                  <>
                    <AppText>Asignado a: {reservation.boxCode || `Caja ${reservation.boxId}`}</AppText>
                    <AppButton
                      title="Quitar de caja"
                      variant="secondary"
                      onPress={handleRemoveBox}
                      loading={isSaving}
                      disabled={isSaving}
                      style={styles.buttonSpacing}
                    />
                  </>
                ) : (
                  <>
                    <AppText color={theme.colors.mutedText}>
                      Este apartado todavia no esta asignado a una caja.
                    </AppText>
                    <AppButton
                      title="Asignar caja"
                      variant="secondary"
                      onPress={() => setIsBoxModalVisible(true)}
                      disabled={isSaving}
                      style={styles.buttonSpacing}
                    />
                  </>
                )
              ) : (
                <AppText color={theme.colors.mutedText}>
                  Este apartado ya no esta activo para asignacion de caja.
                </AppText>
              )}
            </AppCard>
          </>
        }
        actions={
          <>
            {!paymentAccessRestricted ? (
              isActive && remaining > 0 ? (
                <AppCard>
                  <SectionHeader title="Registrar abono" />
                  <AppText color={theme.colors.mutedText}>
                    Restante por cobrar: ${remaining.toFixed(2)}
                  </AppText>
                  <AppButton
                    title="Cobrar apartado"
                    onPress={() =>
                      router.push({
                        pathname: '/payments',
                        params: {
                          reservationId: String(reservationId),
                          returnTo: isLiveContext ? '/live' : `/reservation-detail?id=${reservationId}`,
                        },
                      } as any)
                    }
                    style={styles.buttonSpacing}
                  />
                </AppCard>
              ) : (
                <EmptyState
                  title={remaining <= 0 ? 'Apartado liquidado' : 'Apartado no activo'}
                  message={
                    remaining <= 0
                      ? 'Apartado completamente liquidado.'
                      : 'Este apartado no esta activo.'
                  }
                />
              )
            ) : null}

            {!isActive ? (
              <AppText color={theme.colors.danger} style={styles.statusMessage} bold>
                Este apartado ya no esta activo.
              </AppText>
            ) : null}

            {canCancel ? (
              <AppButton
                title="Cancelar apartado"
                variant="danger"
                onPress={handleCancel}
                loading={isSaving}
                disabled={isSaving}
                style={styles.cancelButton}
              />
            ) : null}
          </>
        }
      />

      <AppBottomModal
        visible={isBoxModalVisible}
        title="Asignar caja"
        onClose={() => setIsBoxModalVisible(false)}
      >
        {boxes.length > 0 ? (
          boxes.map((box) => (
            <AppOptionRow
              key={box.id}
              title={box.code}
              subtitle={box.description || 'Caja activa'}
              onPress={() => handleAssignBox(box)}
            />
          ))
        ) : (
          <AppText color={theme.colors.mutedText}>
            No hay cajas activas configuradas para esta sucursal.
          </AppText>
        )}
      </AppBottomModal>
    </AppShell>
  );
}

type InfoRowProps = {
  label: string;
  value: string;
};

function InfoRow({ label, value }: InfoRowProps) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.infoRow}>
      <AppText variant="caption" color={theme.colors.mutedText} bold>
        {label}
      </AppText>
      <AppText>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  headerStack: {
    gap: 12,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  titleBlock: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  liveBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  detailCard: {
    minHeight: 0,
  },
  itemPlaceholder: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    height: 80,
    justifyContent: 'center',
    marginBottom: 12,
  },
  infoRow: {
    marginBottom: 10,
  },
  remainingBox: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 10,
    padding: 12,
  },
  buttonSpacing: {
    marginTop: 10,
  },
  paymentRow: {
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  statusMessage: {
    marginTop: 10,
    marginBottom: 10,
  },
  cancelButton: {
    marginTop: 8,
  },
});

