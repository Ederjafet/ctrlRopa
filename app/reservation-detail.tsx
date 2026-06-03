import AppBackButton from '@/components/ui/AppBackButton';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppOptionRow from '@/components/ui/AppOptionRow';
import AppResponsiveGrid from '@/components/ui/AppResponsiveGrid';
import RestrictedSection from '@/components/ui/RestrictedSection';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { hasEffectivePermission } from '@/services/accessControl';
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
import { getSession } from '@/services/sessionStorage';
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
      <AppScreen>
        <AppBackButton fallbackRoute={returnRoute || (isLiveContext ? '/live' : '/reservations')} />
        <AppText>Cargando apartado...</AppText>
      </AppScreen>
    );
  }

  if (!reservation) {
    return (
      <AppScreen>
        <AppBackButton fallbackRoute={returnRoute || (isLiveContext ? '/live' : '/reservations')} />
        <AppText variant="title" bold>
          {loadError?.category === 'not-found'
            ? 'Apartado no encontrado'
            : loadError?.message || 'No se encontro la informacion solicitada.'}
        </AppText>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <View style={styles.headerActions}>
        <AppBackButton fallbackRoute={returnRoute || (isLiveContext ? '/live' : '/reservations')} />
        <AppButton
          title="Menu principal"
          variant="secondary"
          onPress={() => router.replace('/system' as any)}
        />
      </View>

      <View style={styles.titleBlock}>
        <AppText variant="title" bold>
          Detalle del apartado
        </AppText>
        <View
          style={[
            styles.liveBadge,
            {
              backgroundColor: theme.isDark ? '#064e3b' : '#dcfce7',
              borderColor: theme.isDark ? '#059669' : '#86efac',
            },
          ]}
        >
          <AppText variant="caption" bold color={theme.isDark ? '#bbf7d0' : '#166534'}>
            {reservationBadge}
          </AppText>
        </View>
      </View>

      {isLiveContext ? (
        <AppButton
          title="Volver al live activo"
          variant="secondary"
          onPress={() => router.replace('/live' as any)}
          style={styles.buttonSpacing}
        />
      ) : null}

      <AppResponsiveGrid tabletColumns={2} desktopColumns={2} gap={12}>
        <AppCard style={styles.detailCard}>
          <AppText variant="subtitle" bold>
            Resumen del apartado
          </AppText>
          <InfoRow label="Estado" value={getReservationStatusLabel(reservation.status)} />
          <InfoRow label="Precio" value={formatMoney(reservation.price)} />
          <InfoRow
            label="Canal"
            value={getSalesChannelLabel(
              reservation.salesChannelCode,
              reservation.salesChannelName
            )}
          />
          <InfoRow label="Live relacionado" value={getLiveLabel(reservation)} />
          <InfoRow label="Fecha/hora" value={createdAtLabel} />
          <InfoRow label="Sucursal" value={branchName} />
          <InfoRow label="Registrado por" value={sellerLabel} />
          <InfoRow label="Caja" value={reservation.boxCode || 'Sin caja'} />
        </AppCard>

        <AppCard style={styles.detailCard}>
          <AppText variant="subtitle" bold>
            Cliente
          </AppText>
          <InfoRow label="Nombre" value={customerName} />
          <InfoRow label="Telefono" value={customerPhone} />
          <InfoRow label="Compras pasadas" value="No disponible" />
          <InfoRow label="Compras activas" value="No disponible" />
          <InfoRow label="Saldo pendiente" value="No disponible" />
        </AppCard>

        <AppCard style={styles.detailCard}>
          <AppText variant="subtitle" bold>
            Prenda
          </AppText>
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

        <AppCard style={styles.detailCard}>
          <AppText variant="subtitle" bold>
            LIVE
          </AppText>
          <InfoRow label="Live" value={reservation.liveId ? `Live #${reservation.liveId}` : 'Sin live asociado'} />
          <InfoRow label="Estado del live" value={liveStatus} />
          <InfoRow label="Sucursal" value={branchName} />
          <InfoRow label="Inicio" value="No capturado" />
          <InfoRow label="Cierre" value="No capturado" />
          <InfoRow label="Canal/URL" value="No capturado" />
        </AppCard>

        <AppCard style={styles.detailCard}>
          <AppText variant="subtitle" bold>
            Seguimiento operativo
          </AppText>
          <InfoRow label="Estado operativo LIVE" value={liveOperationalStatus} />
          <InfoRow
            label="Ultima actualizacion"
            value={formatDateTime(reservation.liveOperationalStatusUpdatedAt || reservation.createdAt)}
          />
          <InfoRow
            label="Acciones"
            value={canCancel ? 'Cancelar apartado disponible' : 'Sin acciones operativas disponibles'}
          />
        </AppCard>

        <AppCard style={styles.detailCard}>
          <AppText variant="subtitle" bold>
            Caja
          </AppText>

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
      </AppResponsiveGrid>

      {paymentAccessRestricted && paymentSectionError ? (
        <RestrictedSection error={paymentSectionError} />
      ) : (
        <AppCard>
          <AppText variant="subtitle" bold>
            Resumen de pago
          </AppText>

          <InfoRow label="Total" value={`$${total.toFixed(2)}`} />
          <InfoRow label="Pagado" value={`$${totalPaid.toFixed(2)}`} />

          <View
            style={[
              styles.remainingBox,
              {
                backgroundColor: theme.isDark ? '#451a03' : '#fff7ed',
                borderColor: theme.isDark ? '#92400e' : '#fed7aa',
              },
            ]}
          >
            <AppText color={theme.isDark ? '#fdba74' : '#9a3412'} bold>
              Restante: ${remaining.toFixed(2)}
            </AppText>
            {overpaid > 0 ? (
              <AppText color={theme.isDark ? '#fdba74' : '#9a3412'}>
                Excedente / saldo a favor: ${overpaid.toFixed(2)}
              </AppText>
            ) : null}
          </View>
        </AppCard>
      )}

      {!paymentAccessRestricted ? (
        isActive && remaining > 0 ? (
          <AppCard>
            <AppText variant="subtitle" bold>
              Registrar abono
            </AppText>

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
          <AppCard>
            <AppText color={theme.colors.mutedText}>
              {remaining <= 0
                ? 'Apartado completamente liquidado.'
                : 'Este apartado no esta activo.'}
            </AppText>
          </AppCard>
        )
      ) : null}

      {!paymentAccessRestricted && payments.length > 0 ? (
        <AppCard>
          <AppText variant="subtitle" bold>
            Pagos registrados
          </AppText>

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
    </AppScreen>
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
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    marginBottom: 8,
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

