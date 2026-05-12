import AppBackButton from '@/components/ui/AppBackButton';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppOptionRow from '@/components/ui/AppOptionRow';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { apiRequest } from '@/services/apiClient';
import { Box, getActiveBoxesByBranch } from '@/services/boxService';
import { getPaymentMethods, PaymentMethod } from '@/services/catalogService';
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
  if (!reservation.liveId) return 'No aplica';

  const notes = reservation.liveNotes?.trim();
  const status = reservation.liveStatus ? ` (${reservation.liveStatus})` : '';
  return notes ? `Live #${reservation.liveId} - ${notes}${status}` : `Live #${reservation.liveId}${status}`;
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
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [boxes, setBoxes] = useState<Box[]>([]);
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

      const session = await getSession();
      const [reservationData, paymentsData, paymentMethodsData, boxesData] =
        await Promise.all([
          apiRequest<Reservation>(`/api/reservations/${reservationId}`),
          apiRequest<Payment[]>(`/api/payments/reservation/${reservationId}`),
          session ? getPaymentMethods(session.branchId) : Promise.resolve([]),
          session ? getActiveBoxesByBranch(session.branchId) : Promise.resolve([]),
        ]);

      setReservation(reservationData);
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      setPaymentMethods(Array.isArray(paymentMethodsData) ? paymentMethodsData : []);
      setBoxes(Array.isArray(boxesData) ? boxesData : []);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo cargar el apartado.');
    } finally {
      setIsLoading(false);
    }
  }, [reservationId, router]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const totalPaid = payments.reduce(
    (sum, payment) => sum + getPaymentAmount(payment),
    0
  );

  const total = Number(reservation?.price || 0);
  const remaining = Math.max(total - totalPaid, 0);
  const overpaid = Math.max(totalPaid - total, 0);
  const isActive = reservation?.status === 'ACTIVE';
  const canCancel = isActive && totalPaid <= 0;
  const isLiveContext =
    returnRoute === '/live' ||
    !!reservation?.liveId ||
    reservation?.salesChannelCode === 'LIVE' ||
    reservation?.salesChannelName?.toUpperCase() === 'LIVE';


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
          Apartado no encontrado
        </AppText>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <AppBackButton fallbackRoute={returnRoute || (isLiveContext ? '/live' : '/reservations')} />

      <AppText variant="title" bold>
        Detalle apartado
      </AppText>

      {isLiveContext ? (
        <AppButton
          title="Volver al live activo"
          variant="secondary"
          onPress={() => router.replace('/live' as any)}
          style={styles.buttonSpacing}
        />
      ) : null}

      <AppCard>
        <InfoRow label="Cliente" value={reservation.customerName || 'Sin cliente'} />
        <InfoRow label="Producto" value={reservation.itemCode || 'Sin código'} />
        <InfoRow
          label="Canal"
          value={getSalesChannelLabel(
            reservation.salesChannelCode,
            reservation.salesChannelName
          )}
        />
        {reservation.liveId ? (
          <InfoRow label="Live" value={getLiveLabel(reservation)} />
        ) : null}
        <InfoRow label="Estado" value={getReservationStatusLabel(reservation.status)} />
        <InfoRow label="Caja" value={reservation.boxCode || 'Sin caja'} />
      </AppCard>

      {isActive ? (
        <AppCard>
          <AppText variant="subtitle" bold>
            Caja
          </AppText>

          {reservation.boxId ? (
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
          )}
        </AppCard>
      ) : null}

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

      {isActive && remaining > 0 ? (
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
      )}

      {payments.length > 0 ? (
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

