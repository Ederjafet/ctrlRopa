import AppBackButton from '@/components/ui/AppBackButton';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppOptionRow from '@/components/ui/AppOptionRow';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { apiRequest } from '@/services/apiClient';
import { getPaymentMethods, PaymentMethod } from '@/services/catalogService';
import {
  CustomerOrderDetail,
  CustomerOrderItemLine,
  CustomerOrderPendingPayment,
  CustomerOrderSettlement,
  getCustomerOrderDetail,
  getCustomerOrderSettlement,
  getPendingPaymentOrdersByBranch,
} from '@/services/customerOrderService';
import {
  createPayment,
  getPaymentsByReservation,
  Payment,
} from '@/services/paymentService';
import { getSession } from '@/services/sessionStorage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

type PaymentTargetType = 'reservation' | 'order';

type ReservationSummary = {
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
  salesChannelCode?: string;
  salesChannelName?: string;
};

type PayableOrderReservation = {
  line: CustomerOrderItemLine;
  paid: number;
  pending: number;
};

function firstParam(value?: string | string[]) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function normalizeNumber(value?: string | number | null) {
  if (value === null || value === undefined || value === '') return 0;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function formatMoney(value?: number | null) {
  return `$${normalizeNumber(value).toFixed(2)}`;
}

function getPaymentAmount(payment: Payment) {
  return normalizeNumber(payment.receivedAmount ?? payment.amount ?? 0);
}

function normalizeStatus(value?: string | null) {
  return (value || '').trim().toUpperCase();
}

function isVoidedPayment(payment: Payment) {
  const status = normalizeStatus(payment.status);
  return ['VOID', 'VOIDED', 'CANCELLED', 'CANCELED'].includes(status);
}

function isClosedReservationStatus(status?: string | null) {
  return ['CANCELLED', 'CANCELED', 'COMPLETED', 'CONVERTED_TO_SALE'].includes(
    normalizeStatus(status)
  );
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

    return methodByCode?.name || rawCode;
  }

  return 'Metodo no especificado';
}

function getReservationTotal(reservation: ReservationSummary | null) {
  if (!reservation) return 0;
  return normalizeNumber(reservation.price ?? 0);
}

function getSalesChannelLabel(code?: string | null) {
  if (code === 'LIVE') return 'Live';
  if (code === 'DOOR_RESERVATION') return 'Apartado puerta';
  if (code === 'DOOR_SALE') return 'Venta puerta';
  if (code === 'MIXED') return 'Mixto';
  return code || 'Sin tipo';
}

function getLiveLabel(reservation: ReservationSummary) {
  if (!reservation.liveId) return '';

  const notes = reservation.liveNotes?.trim();
  const status = reservation.liveStatus ? ` (${reservation.liveStatus})` : '';
  return notes ? `Live #${reservation.liveId} - ${notes}${status}` : `Live #${reservation.liveId}${status}`;
}

export default function PaymentsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    orderId?: string | string[];
    reservationId?: string | string[];
    returnTo?: string | string[];
  }>();
  const { theme } = useAppTheme();

  const initialOrderId = firstParam(params.orderId);
  const initialReservationId = firstParam(params.reservationId);
  const returnTo = firstParam(params.returnTo);

  const initialTargetType: PaymentTargetType = initialReservationId
    ? 'reservation'
    : 'order';

  const [targetType, setTargetType] = useState<PaymentTargetType>(initialTargetType);
  const [targetIdText, setTargetIdText] = useState(
    initialReservationId || initialOrderId || ''
  );
  const [amountText, setAmountText] = useState('');
  const [reference, setReference] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod | null>(null);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [reservation, setReservation] = useState<ReservationSummary | null>(null);
  const [orderDetail, setOrderDetail] = useState<CustomerOrderDetail | null>(null);
  const [orderSettlement, setOrderSettlement] =
    useState<CustomerOrderSettlement | null>(null);
  const [payableOrderReservations, setPayableOrderReservations] = useState<
    PayableOrderReservation[]
  >([]);
  const [pendingOrders, setPendingOrders] = useState<CustomerOrderPendingPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingTarget, setIsLoadingTarget] = useState(false);

  useEffect(() => {
    if (initialReservationId) {
      setTargetType('reservation');
      setTargetIdText(initialReservationId);
      return;
    }

    if (initialOrderId) {
      setTargetType('order');
      setTargetIdText(initialOrderId);
      return;
    }

  }, [initialOrderId, initialReservationId]);

  const targetId = useMemo(() => normalizeNumber(targetIdText), [targetIdText]);

  const fallbackRoute = useMemo(() => {
    if (returnTo) return returnTo;
    if (initialOrderId) {
      return `/customer-order-detail?id=${initialOrderId}`;
    }
    if (initialReservationId) {
      return `/reservation-detail?id=${initialReservationId}`;
    }
    return '/';
  }, [initialOrderId, initialReservationId, returnTo]);

  const activePayments = useMemo(
    () => payments.filter((payment) => !isVoidedPayment(payment)),
    [payments]
  );

  const totalPaid = useMemo(
    () => activePayments.reduce((sum, payment) => sum + getPaymentAmount(payment), 0),
    [activePayments]
  );

  const total =
    targetType === 'reservation'
      ? getReservationTotal(reservation)
      : normalizeNumber(orderSettlement?.total ?? orderDetail?.total ?? 0);
  const effectivePaid =
    targetType === 'order' ? normalizeNumber(orderSettlement?.paid ?? 0) : totalPaid;
  const remainingRaw =
    targetType === 'order'
      ? normalizeNumber(orderSettlement?.pending ?? total - effectivePaid)
      : total - effectivePaid;
  const remaining = Math.max(remainingRaw, 0);
  const overpaidAmount = Math.max(effectivePaid - total, 0);
  const targetWasLoaded =
    targetType === 'reservation'
      ? !!reservation
      : !!orderDetail;
  const targetIsContextual = !!initialOrderId || !!initialReservationId;
  const hasSelectedPendingOrder = !targetIsContextual && targetType === 'order' && targetId > 0;
  const hasSelectedTarget = targetIsContextual || hasSelectedPendingOrder;
  const isLiveContext =
    returnTo === '/live' ||
    !!reservation?.liveId ||
    reservation?.salesChannelCode === 'LIVE' ||
    reservation?.salesChannelName?.toUpperCase() === 'LIVE';

  const isReservationSettled =
    targetType === 'reservation' &&
    !!reservation &&
    total > 0 &&
    remainingRaw <= 0;
  const isOrderSettled =
    targetType === 'order' && !!orderDetail && total > 0 && remainingRaw <= 0;

  const isTargetClosed =
    targetType === 'reservation'
      ? isClosedReservationStatus(reservation?.status)
      : orderDetail?.status === 'CLOSED' || orderSettlement?.status === 'CLOSED';

  const cannotRegisterPayment =
    !selectedPaymentMethod ||
    !targetWasLoaded ||
    isSaving ||
    isTargetClosed ||
    isReservationSettled ||
    isOrderSettled;

  const registerPaymentBlockedReason = isSaving
    ? 'Espera a que termine el guardado actual.'
    : !targetWasLoaded
      ? 'Primero selecciona o carga una reserva/pedido.'
      : !selectedPaymentMethod
        ? 'Selecciona un metodo de pago.'
        : isTargetClosed
          ? 'Este movimiento esta cancelado o cerrado.'
          : isReservationSettled
            ? 'Esta reserva ya esta liquidada.'
            : isOrderSettled
              ? 'Este pedido ya esta liquidado.'
              : undefined;

  const loadPaymentMethods = useCallback(async () => {
    const session = await getSession();
    if (!session) return;

    const data = await getPaymentMethods(session.branchId);
    setPaymentMethods(data);

    if (!selectedPaymentMethod && data.length > 0) {
      setSelectedPaymentMethod(data[0]);
    }
  }, [selectedPaymentMethod]);

  const loadPendingOrders = useCallback(async () => {
    const session = await getSession();
    if (!session) {
      setPendingOrders([]);
      return;
    }

    const data = await getPendingPaymentOrdersByBranch(session.branchId);
    setPendingOrders(Array.isArray(data) ? data : []);
  }, []);

  const loadTargetData = useCallback(async () => {
    if (!targetId || targetId <= 0) {
      setReservation(null);
      setOrderDetail(null);
      setOrderSettlement(null);
      setPayableOrderReservations([]);
      setPayments([]);
      return;
    }

    try {
      setIsLoadingTarget(true);

      if (targetType === 'reservation') {
        const [reservationData, paymentsData] = await Promise.all([
          apiRequest<ReservationSummary>(`/api/reservations/${targetId}`),
          getPaymentsByReservation(targetId),
        ]);

        setReservation(reservationData);
        setOrderDetail(null);
        setOrderSettlement(null);
        setPayableOrderReservations([]);
        setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      } else if (targetType === 'order') {
        const [detailData, settlementData] = await Promise.all([
          getCustomerOrderDetail(targetId),
          getCustomerOrderSettlement(targetId),
        ]);

        const activeReservations = (detailData.items ?? []).filter(
          (line) =>
            line.type === 'RESERVATION' &&
            line.reservationId &&
            line.status === 'ACTIVE'
        );

        const reservationPayments = await Promise.all(
          activeReservations.map(async (line) => ({
            line,
            payments: await getPaymentsByReservation(Number(line.reservationId)),
          }))
        );

        const payableReservations = reservationPayments.map(({ line, payments }) => {
          const paid = payments
            .filter((payment) => !isVoidedPayment(payment))
            .reduce((sum, payment) => sum + getPaymentAmount(payment), 0);
          const pending = Math.max(normalizeNumber(line.price) - paid, 0);

          return { line, paid, pending };
        });

        setOrderDetail(detailData);
        setOrderSettlement(settlementData);
        setPayableOrderReservations(payableReservations);
        setReservation(null);
        setPayments(reservationPayments.flatMap((entry) => entry.payments));
      }
    } catch (e: any) {
      setReservation(null);
      setOrderDetail(null);
      setOrderSettlement(null);
      setPayableOrderReservations([]);
      setPayments([]);
      Alert.alert(
        'Pagos',
        e.message || 'No se pudo cargar la información del cobro.'
      );
    } finally {
      setIsLoadingTarget(false);
    }
  }, [targetId, targetType]);

  useEffect(() => {
    if (hasSelectedPendingOrder) {
      loadTargetData();
    }
  }, [hasSelectedPendingOrder, loadTargetData]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const load = async () => {
        try {
          setIsLoading(true);
          await loadPaymentMethods();
          await loadPendingOrders();
          await loadTargetData();
        } catch (err: any) {
          Alert.alert(
            'Pagos',
            err?.message || 'No se pudieron cargar los cobros pendientes.'
          );
        } finally {
          if (isActive) setIsLoading(false);
        }
      };

      load();

      return () => {
        isActive = false;
      };
    }, [loadPaymentMethods, loadPendingOrders, loadTargetData])
  );

  const reloadTarget = async () => {
    await loadTargetData();
  };

  const selectPaymentMethod = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    setIsPaymentModalVisible(false);
  };

  const selectPendingOrder = (order: CustomerOrderPendingPayment) => {
    setTargetType('order');
    setTargetIdText(String(order.id));
    setAmountText('');
    setReference('');
  };

  const clearSelectedPendingOrder = () => {
    setTargetIdText('');
    setOrderDetail(null);
    setOrderSettlement(null);
    setPayableOrderReservations([]);
    setPayments([]);
    setAmountText('');
    setReference('');
  };

  const getAmountToPay = () => {
    const trimmedAmount = amountText.trim();

    if (!trimmedAmount) {
      return remaining > 0 ? remaining : 0;
    }

    return normalizeNumber(trimmedAmount);
  };

  const handleRegisterPayment = async () => {
    const session = await getSession();

    if (!session) {
      Alert.alert('Sesión', 'No se encontro sesión activa.');
      return;
    }

    if (!targetId || targetId <= 0) {
      Alert.alert('Pagos', 'Captura un ID valido.');
      return;
    }

    if (!selectedPaymentMethod) {
      Alert.alert('Pagos', 'Selecciona un metodo de pago.');
      return;
    }

    if (!targetWasLoaded) {
      Alert.alert(
        'Pagos',
        'Primero confirma que la reserva o pedido exista cargando su información.'
      );
      return;
    }

    if (isTargetClosed) {
      Alert.alert(
        'Pagos',
        'No se pueden registrar pagos en un movimiento cancelado o cerrado.'
      );
      return;
    }

    if (isReservationSettled) {
      Alert.alert('Pagos', 'Esta reserva ya esta liquidada.');
      return;
    }

    if (isOrderSettled) {
      Alert.alert('Pagos', 'Este pedido ya esta liquidado.');
      return;
    }

    const amount = getAmountToPay();

    if (amount <= 0) {
      Alert.alert('Pagos', 'Captura un monto valido.');
      return;
    }

    try {
      setIsSaving(true);

      if (targetType === 'order') {
        const payableReservations = payableOrderReservations.filter(
          (entry) => entry.pending > 0 && entry.line.reservationId
        );

        if (payableReservations.length === 0) {
          Alert.alert(
            'Pagos',
            'Este pedido no tiene apartados activos con saldo pendiente.'
          );
          return;
        }

        let remainingPayment = amount;

        for (let index = 0; index < payableReservations.length; index++) {
          if (remainingPayment <= 0) break;

          const entry = payableReservations[index];
          const isLast = index === payableReservations.length - 1;
          const amountForReservation = isLast
            ? remainingPayment
            : Math.min(entry.pending, remainingPayment);

          await createPayment({
            reservationId: Number(entry.line.reservationId),
            amount: amountForReservation,
            paymentMethodId: selectedPaymentMethod.id,
            reference: reference.trim() || undefined,
            createdByUserId: session.userId,
          });

          remainingPayment -= amountForReservation;
        }
      } else {
        await createPayment({
          reservationId: targetType === 'reservation' ? targetId : undefined,
          amount,
          paymentMethodId: selectedPaymentMethod.id,
          reference: reference.trim() || undefined,
          createdByUserId: session.userId,
        });
      }

      setAmountText('');
      setReference('');
      await reloadTarget();
      await loadPendingOrders();
      if (hasSelectedPendingOrder) {
        clearSelectedPendingOrder();
      }

      Alert.alert(
        'Pagos',
        amount > remaining && remaining > 0
          ? 'Pago registrado. El excedente se manejara como saldo a favor si corresponde.'
          : 'Pago registrado correctamente.'
      );
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo registrar el pago.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AppScreen scroll={false}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator />
          <AppText style={styles.loadingText}>Cargando pagos...</AppText>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <AppBackButton
        fallbackRoute={fallbackRoute}
        onPress={hasSelectedPendingOrder ? clearSelectedPendingOrder : undefined}
      />

      <AppText variant="title" bold>
        Pagos / Cobros
      </AppText>

      {isLiveContext ? (
        <AppButton
          title="Volver al live activo"
          variant="secondary"
          onPress={() => router.replace('/live' as any)}
          style={styles.methodButton}
        />
      ) : null}

      {hasSelectedTarget ? (
        <AppCard>
          <AppText variant="subtitle" bold>
            {targetType === 'order'
              ? `Cobrar pedido #${targetIdText}`
              : `Cobrar reserva #${targetIdText}`}
          </AppText>

          <AppText color={theme.colors.mutedText}>
            {hasSelectedPendingOrder
              ? 'Este cobro viene de la lista de pendientes, por eso ya esta vinculado.'
              : 'Este cobro viene desde el detalle del movimiento, por eso ya esta vinculado.'}
          </AppText>

          {hasSelectedPendingOrder ? (
            <View style={styles.methodButton}>
              <AppButton
                title="Elegir otro pendiente"
                variant="secondary"
                onPress={clearSelectedPendingOrder}
                disabled={isSaving}
              />
            </View>
          ) : null}
        </AppCard>
      ) : (
        <AppCard>
          <AppText variant="subtitle" bold>
            Pendientes por cobrar
          </AppText>

          {pendingOrders.length === 0 ? (
            <AppText color={theme.colors.mutedText}>
              No hay pedidos con apartados pendientes de pago.
            </AppText>
          ) : (
            pendingOrders.map((order) => (
              <View
                key={order.id}
                style={[styles.pendingOrderRow, { borderBottomColor: theme.colors.border }]}
              >
                <View style={styles.paymentHeader}>
                  <AppText bold>Pedido #{order.id}</AppText>
                  <AppText bold>{formatMoney(order.pending)}</AppText>
                </View>

                <AppText>{order.customerName || `Cliente #${order.customerId}`}</AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  {getSalesChannelLabel(order.salesChannelCode)} | Prendas: {order.itemCount}
                </AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  Total {formatMoney(order.total)} | Pagado {formatMoney(order.paid)}
                </AppText>

                <View style={styles.pendingActions}>
                  <View style={styles.pendingActionButton}>
                    <AppButton
                      title="Cobrar"
                      onPress={() => selectPendingOrder(order)}
                    />
                  </View>
                  <View style={styles.pendingActionButton}>
                    <AppButton
                      title="Ver detalle"
                      variant="secondary"
                      onPress={() =>
                        router.push({
                          pathname: '/customer-order-detail',
                          params: {
                            id: String(order.id),
                            returnTo: '/payments',
                          },
                        } as any)
                      }
                    />
                  </View>
                </View>
              </View>
            ))
          )}
        </AppCard>
      )}

      {hasSelectedTarget ? (
        <>
      <AppCard>
        <AppText variant="subtitle" bold>
          Detalle
        </AppText>

        {isLoadingTarget ? (
          <AppText>Cargando detalle...</AppText>
        ) : targetType === 'reservation' && reservation ? (
          <>
            <InfoRow label="Reserva" value={`#${reservation.id}`} />
            <InfoRow
              label="Cliente"
              value={reservation.customerName || `ID ${reservation.customerId || '-'}`}
            />
            <InfoRow
              label="Prenda"
              value={reservation.itemCode || `ID ${reservation.itemId || '-'}`}
            />
            <InfoRow label="Estado" value={reservation.status || 'Sin estado'} />
            <InfoRow
              label="Canal"
              value={getSalesChannelLabel(reservation.salesChannelCode)}
            />
            {reservation.liveId ? (
              <InfoRow label="Live" value={getLiveLabel(reservation)} />
            ) : null}
            <InfoRow label="Total" value={formatMoney(total)} />
            <InfoRow label="Pagado" value={formatMoney(totalPaid)} />
            <InfoRow label="Pendiente" value={formatMoney(remaining)} />
            {overpaidAmount > 0 ? (
              <InfoRow label="Saldo a favor" value={formatMoney(overpaidAmount)} />
            ) : null}
            {isReservationSettled ? (
              <AppText variant="caption" color={theme.colors.mutedText}>
                Reserva liquidada. Ya no se permiten nuevos abonos normales desde esta pantalla.
              </AppText>
            ) : null}
          </>
        ) : targetType === 'order' && orderDetail ? (
          <>
            <InfoRow label="Pedido" value={`#${orderDetail.id}`} />
            <InfoRow
              label="Cliente"
              value={orderDetail.customerName || `ID ${orderDetail.customerId || '-'}`}
            />
            <InfoRow label="Estado" value={orderDetail.status || 'Sin estado'} />
            <InfoRow label="Total" value={formatMoney(total)} />
            <InfoRow label="Pagado" value={formatMoney(effectivePaid)} />
            <InfoRow label="Pendiente" value={formatMoney(remaining)} />
            <InfoRow
              label="Prendas activas"
              value={String(payableOrderReservations.filter((entry) => entry.pending > 0).length)}
            />
            {isOrderSettled ? (
              <AppText variant="caption" color={theme.colors.mutedText}>
                Pedido liquidado. Ya no se permiten nuevos abonos normales desde esta pantalla.
              </AppText>
            ) : null}
          </>
        ) : (
          <AppText color={theme.colors.mutedText}>
            Selecciona un pendiente para registrar el pago.
          </AppText>
        )}
      </AppCard>

      <AppCard>
        <AppText variant="subtitle" bold>
          Registrar pago
        </AppText>

        {isReservationSettled || isOrderSettled ? (
          <AppText color={theme.colors.mutedText}>
            Este cobro ya esta liquidado. Puedes consultar su historial de pagos, pero no registrar otro abono normal.
          </AppText>
        ) : isTargetClosed ? (
          <AppText color={theme.colors.mutedText}>
            Este movimiento esta cancelado o cerrado. No permite nuevos pagos.
          </AppText>
        ) : (
          <>
            <AppInput
              label="Monto"
              value={amountText}
              onChangeText={setAmountText}
              keyboardType="numeric"
              placeholder={remaining > 0 ? `Dejar vacio para liquidar ${formatMoney(remaining)}` : 'Ej. 150.00'}
            />

            <AppInput
              label="Referencia / nota"
              value={reference}
              onChangeText={setReference}
              placeholder="Opcional"
            />

            <AppText variant="caption" color={theme.colors.mutedText}>
              Metodo de pago
            </AppText>

            {paymentMethods.length > 0 ? (
              <>
                <AppText>
                  {selectedPaymentMethod
                    ? selectedPaymentMethod.name
                    : 'Sin seleccionar'}
                </AppText>

                <View style={styles.methodButton}>
                  <AppButton
                    title="Seleccionar metodo de pago"
                    variant="secondary"
                    onPress={() => setIsPaymentModalVisible(true)}
                    disabled={isSaving}
                  />
                </View>
              </>
            ) : (
              <AppText color={theme.colors.mutedText}>
                No hay metodos de pago activos configurados.
              </AppText>
            )}

            <View style={styles.submitButton}>
              <AppButton
                title="Registrar pago"
                onPress={handleRegisterPayment}
                loading={isSaving}
                disabled={cannotRegisterPayment}
                disabledReason={registerPaymentBlockedReason}
              />
            </View>
          </>
        )}
      </AppCard>

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
              <View style={styles.paymentHeader}>
                <AppText bold>{formatMoney(getPaymentAmount(payment))}</AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  {payment.status || 'Registrado'}
                </AppText>
              </View>

              <AppText variant="caption" color={theme.colors.mutedText}>
                Metodo: {getPaymentMethodLabel(payment, paymentMethods)}
              </AppText>

              {payment.reference ? (
                <AppText variant="caption" color={theme.colors.mutedText}>
                  Ref: {payment.reference}
                </AppText>
              ) : null}
            </View>
          ))}
        </AppCard>
      ) : null}
        </>
      ) : null}

      <AppBottomModal
        visible={isPaymentModalVisible}
        title="Metodo de pago"
        onClose={() => setIsPaymentModalVisible(false)}
      >
        {paymentMethods.map((method) => (
          <AppOptionRow
            key={method.id}
            title={method.name}
            subtitle={method.code || undefined}
            onPress={() => selectPaymentMethod(method)}
          >
            {selectedPaymentMethod?.id === method.id ? (
              <AppText variant="caption" color={theme.colors.accent} bold>
                Seleccionado
              </AppText>
            ) : null}
          </AppOptionRow>
        ))}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  infoRow: {
    marginBottom: 10,
  },
  submitButton: {
    marginTop: 12,
  },
  methodButton: {
    marginTop: 10,
  },
  paymentRow: {
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  pendingOrderRow: {
    borderBottomWidth: 1,
    paddingVertical: 12,
    gap: 4,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  pendingActionButton: {
    flex: 1,
  },
});


