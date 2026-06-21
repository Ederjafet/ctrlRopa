import AppBottomModal from '@/components/ui/AppBottomModal';
import AppShellPage from '@/components/layout/AppShellPage';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppOptionRow from '@/components/ui/AppOptionRow';
import AppResponsiveGrid from '@/components/ui/AppResponsiveGrid';
import AppText from '@/components/ui/AppText';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAppTheme } from '@/context/AppThemeContext';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { canAccessByPermission } from '@/services/accessControl';
import { apiRequest } from '@/services/apiClient';
import { getCustomerBalance, type BalanceSummary } from '@/services/balanceService';
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
import { getSession, UserSession } from '@/services/sessionStorage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

type PaymentTargetType = 'reservation' | 'order';
type PaymentStatusFilter = 'ALL' | 'ACTIVE' | 'VOIDED';

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

function formatDate(value?: string | null) {
  if (!value) return 'Sin fecha';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
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

function getStatusTone(status?: string | null) {
  const normalized = normalizeStatus(status);
  if (['VOID', 'VOIDED', 'CANCELLED', 'CANCELED'].includes(normalized)) return 'danger';
  if (['ACTIVE', 'PAID', 'COMPLETED', 'SETTLED'].includes(normalized)) return 'success';
  return 'neutral';
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

function getSalesChannelLabel(
  code?: string | null,
  t?: (key: string) => string
) {
  if (code === 'LIVE') return t ? t('payments.channelLive') : 'En vivo';
  if (code === 'DOOR_RESERVATION') {
    return t ? t('payments.channelDoorReservation') : 'Reserva de mostrador';
  }
  if (code === 'DOOR_SALE') return t ? t('payments.channelDoorSale') : 'Venta de mostrador';
  if (code === 'MIXED') return t ? t('payments.channelMixed') : 'Mixto';
  return code || (t ? t('payments.noType') : 'Sin tipo');
}

function getLiveLabel(reservation: ReservationSummary, t?: (key: string) => string) {
  if (!reservation.liveId) return '';

  const notes = reservation.liveNotes?.trim();
  const status = reservation.liveStatus ? ` (${reservation.liveStatus})` : '';
  const label = t ? t('payments.liveLabel') : 'En vivo';
  return notes ? `${label} #${reservation.liveId} - ${notes}${status}` : `${label} #${reservation.liveId}${status}`;
}

export default function PaymentsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    orderId?: string | string[];
    reservationId?: string | string[];
    returnTo?: string | string[];
  }>();
  const { theme } = useAppTheme();
  const { isPhone } = useResponsiveLayout();
  const { t } = useTranslation('common');

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
  const [isMethodFilterModalVisible, setIsMethodFilterModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatusFilter>('ALL');
  const [methodFilterId, setMethodFilterId] = useState<number | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [reservation, setReservation] = useState<ReservationSummary | null>(null);
  const [customerBalance, setCustomerBalance] = useState<BalanceSummary | null>(null);
  const [orderDetail, setOrderDetail] = useState<CustomerOrderDetail | null>(null);
  const [orderSettlement, setOrderSettlement] =
    useState<CustomerOrderSettlement | null>(null);
  const [payableOrderReservations, setPayableOrderReservations] = useState<
    PayableOrderReservation[]
  >([]);
  const [pendingOrders, setPendingOrders] = useState<CustomerOrderPendingPayment[]>([]);
  const [session, setSession] = useState<UserSession | null>(null);
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

  const activePayments = useMemo(
    () => payments.filter((payment) => !isVoidedPayment(payment)),
    [payments]
  );

  const filteredPayments = useMemo(() => {
    const text = normalizeText(searchText);

    return payments
      .filter((payment) => {
        if (statusFilter === 'ACTIVE' && isVoidedPayment(payment)) return false;
        if (statusFilter === 'VOIDED' && !isVoidedPayment(payment)) return false;
        return true;
      })
      .filter((payment) => {
        if (!methodFilterId) return true;
        return payment.paymentMethodId === methodFilterId || payment.paymentMethod?.id === methodFilterId;
      })
      .filter((payment) => {
        if (!text) return true;
        return normalizeText(
          [
            payment.id,
            payment.reference,
            payment.status,
            getPaymentMethodLabel(payment, paymentMethods),
            reservation?.customerName,
            orderDetail?.customerName,
            reservation?.itemCode,
          ]
            .filter(Boolean)
            .join(' ')
        ).includes(text);
      });
  }, [methodFilterId, orderDetail?.customerName, paymentMethods, payments, reservation?.customerName, reservation?.itemCode, searchText, statusFilter]);

  const filteredPendingOrders = useMemo(() => {
    const text = normalizeText(searchText);

    return pendingOrders.filter((order) => {
      if (!text) return true;
      return normalizeText(
        [
          order.id,
          order.customerName,
          order.customerId,
          order.status,
          order.salesChannelCode,
        ]
          .filter(Boolean)
          .join(' ')
      ).includes(text);
    });
  }, [pendingOrders, searchText]);

  const totalPaid = useMemo(
    () => activePayments.reduce((sum, payment) => sum + getPaymentAmount(payment), 0),
    [activePayments]
  );
  const filteredPaidTotal = useMemo(
    () =>
      filteredPayments
        .filter((payment) => !isVoidedPayment(payment))
        .reduce((sum, payment) => sum + getPaymentAmount(payment), 0),
    [filteredPayments]
  );
  const pendingOrdersTotal = useMemo(
    () => filteredPendingOrders.reduce((sum, order) => sum + normalizeNumber(order.pending), 0),
    [filteredPendingOrders]
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
  const canRegisterPayments = canAccessByPermission(session, 'REGISTER_PAYMENTS');
  const selectedMethodFilterLabel = methodFilterId
    ? paymentMethods.find((method) => method.id === methodFilterId)?.name ?? 'Metodo seleccionado'
    : 'Todos los metodos';

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
      setCustomerBalance(null);
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
        setCustomerBalance(
          reservationData.customerId
            ? await getCustomerBalance(reservationData.customerId)
            : null
        );
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
        setCustomerBalance(
          detailData.customerId ? await getCustomerBalance(detailData.customerId) : null
        );
      }
    } catch (e: any) {
      setReservation(null);
      setOrderDetail(null);
      setOrderSettlement(null);
      setPayableOrderReservations([]);
      setPayments([]);
      setCustomerBalance(null);
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
          const currentSession = await getSession();
          setSession(currentSession);
          if (!currentSession || !canAccessByPermission(currentSession, 'VIEW_PAYMENTS')) {
            router.replace('/access-denied' as any);
            return;
          }
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

  const clearFilters = () => {
    setSearchText('');
    setStatusFilter('ALL');
    setMethodFilterId(null);
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

    if (!canAccessByPermission(session, 'REGISTER_PAYMENTS')) {
      Alert.alert('Pagos', 'No tienes permisos para registrar pagos.');
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
      <AppShellPage
        title="Pagos"
        subtitle="Cobros, abonos y saldo a favor"
        activeRoute="payments"
        compactHeader
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator />
          <AppText style={styles.loadingText}>Cargando pagos...</AppText>
        </View>
      </AppShellPage>
    );
  }

  return (
    <AppShellPage
      title="Pagos"
      subtitle="Cobros, abonos y saldo a favor"
      activeRoute="payments"
      compactHeader
    >
      <AppCard variant="info" style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.heroText}>
            <AppText variant="caption" color={theme.colors.accent} bold>
              FINANZAS
            </AppText>
            <AppText variant="title" bold>
              Pagos
            </AppText>
            <AppText color={theme.colors.mutedText}>
              Consulta abonos, pagos registrados y saldos a favor de clientes. Los cobros se registran solo cuando hay un pedido o apartado seleccionado.
            </AppText>
          </View>
          <View style={styles.permissionBadges}>
            <StatusBadge label="VIEW_PAYMENTS" tone="info" />
            <StatusBadge
              label={canRegisterPayments ? 'Puede registrar abonos' : 'Solo consulta'}
              tone={canRegisterPayments ? 'success' : 'neutral'}
            />
          </View>
        </View>
      </AppCard>

      {isLiveContext ? (
        <AppButton
          title={t('payments.backToLive')}
          variant="secondary"
          onPress={() => router.replace('/live' as any)}
          style={styles.methodButton}
        />
      ) : null}

      <AppResponsiveGrid tabletColumns={2} desktopColumns={4} style={styles.summaryGrid}>
        <PaymentSummaryTile
          label="Pendientes filtrados"
          value={String(filteredPendingOrders.length)}
          tone={filteredPendingOrders.length > 0 ? 'warning' : 'success'}
        />
        <PaymentSummaryTile
          label="Saldo pendiente"
          value={formatMoney(pendingOrdersTotal)}
          tone={pendingOrdersTotal > 0 ? 'warning' : 'success'}
        />
        <PaymentSummaryTile
          label="Pagos en contexto"
          value={String(filteredPayments.length)}
        />
        <PaymentSummaryTile
          label="Abonado visible"
          value={formatMoney(filteredPaidTotal)}
          tone={filteredPaidTotal > 0 ? 'success' : 'default'}
        />
      </AppResponsiveGrid>

      <AppCard style={styles.filterCard}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionTitleText}>
            <AppText variant="subtitle" bold>
              Filtros
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              Busca por cliente, folio, referencia, metodo o estado.
            </AppText>
          </View>
          <AppButton
            title="Limpiar"
            variant="secondary"
            onPress={clearFilters}
            style={styles.compactAction}
          />
        </View>

        <AppResponsiveGrid tabletColumns={2} desktopColumns={3}>
          <AppInput
            label="Buscar"
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Cliente, referencia, pedido..."
          />
          <View style={styles.filterGroup}>
            <AppText variant="subtitle" bold>
              Estado
            </AppText>
            <View style={styles.filterButtons}>
              <AppButton
                title="Todos"
                variant={statusFilter === 'ALL' ? 'primary' : 'neutral'}
                onPress={() => setStatusFilter('ALL')}
                style={styles.filterButton}
              />
              <AppButton
                title="Activos"
                variant={statusFilter === 'ACTIVE' ? 'primary' : 'neutral'}
                onPress={() => setStatusFilter('ACTIVE')}
                style={styles.filterButton}
              />
              <AppButton
                title="Anulados"
                variant={statusFilter === 'VOIDED' ? 'primary' : 'neutral'}
                onPress={() => setStatusFilter('VOIDED')}
                style={styles.filterButton}
              />
            </View>
          </View>
          <View style={styles.filterGroup}>
            <AppText variant="subtitle" bold>
              Metodo
            </AppText>
            <AppButton
              title={selectedMethodFilterLabel}
              variant="secondary"
              onPress={() => setIsMethodFilterModalVisible(true)}
              style={styles.methodFilterButton}
            />
          </View>
        </AppResponsiveGrid>
      </AppCard>

      {hasSelectedTarget ? (
        <AppCard style={styles.contextCard}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionTitleText}>
              <AppText variant="subtitle" bold>
                {targetType === 'order'
                  ? `Pedido #${targetIdText}`
                  : `Apartado #${targetIdText}`}
              </AppText>
              <AppText color={theme.colors.mutedText}>
                {hasSelectedPendingOrder
                  ? 'Cobro seleccionado desde pendientes.'
                  : 'Cobro abierto desde el detalle del movimiento.'}
              </AppText>
            </View>
            <StatusBadge
              label={remaining > 0 ? `Saldo ${formatMoney(remaining)}` : 'Liquidado'}
              tone={remaining > 0 ? 'warning' : 'success'}
            />
          </View>

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
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionTitleText}>
              <AppText variant="subtitle" bold>
                Pendientes por cobrar
              </AppText>
              <AppText variant="caption" color={theme.colors.mutedText}>
                Selecciona un pedido para registrar abono. No hay registro global sin contexto.
              </AppText>
            </View>
            <StatusBadge
              label={`${filteredPendingOrders.length} pendiente${filteredPendingOrders.length === 1 ? '' : 's'}`}
              tone={filteredPendingOrders.length > 0 ? 'warning' : 'success'}
            />
          </View>

          {filteredPendingOrders.length === 0 ? (
            <AppText color={theme.colors.mutedText}>
              No hay pagos registrados o pendientes con los filtros actuales.
            </AppText>
          ) : (
            filteredPendingOrders.map((order) => (
              <View
                key={order.id}
                style={[styles.pendingOrderRow, { borderBottomColor: theme.colors.border }]}
              >
                <View style={styles.paymentHeader}>
                  <View style={styles.rowTitleBlock}>
                    <AppText bold>Pedido #{order.id}</AppText>
                    <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
                      {order.customerName || `Cliente #${order.customerId}`}
                    </AppText>
                  </View>
                  <View style={styles.amountBlock}>
                    <AppText bold>{formatMoney(order.pending)}</AppText>
                    <StatusBadge label={order.status || 'Pendiente'} tone="warning" />
                  </View>
                </View>

                <AppText variant="caption" color={theme.colors.mutedText}>
                  {getSalesChannelLabel(order.salesChannelCode, t)} | {order.itemCount} prenda{order.itemCount === 1 ? '' : 's'}
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
          {t('payments.detailTitle')}
        </AppText>

        {isLoadingTarget ? (
          <AppText>{t('payments.loadingDetail')}</AppText>
        ) : targetType === 'reservation' && reservation ? (
          <>
            <AppResponsiveGrid tabletColumns={2} desktopColumns={3} style={styles.detailGrid}>
              <PaymentDetailTile
                title={t('payments.reservationStatusGroup')}
                rows={[
                  [t('payments.reservation'), `#${reservation.id}`],
                  [t('payments.status'), reservation.status || t('payments.noStatus')],
                ]}
              />
              <PaymentDetailTile
                title={t('payments.customerItemGroup')}
                rows={[
                  [
                    t('payments.customer'),
                    reservation.customerName || `ID ${reservation.customerId || '-'}`,
                  ],
                  [
                    t('payments.item'),
                    reservation.itemCode || `ID ${reservation.itemId || '-'}`,
                  ],
                ]}
              />
              <PaymentDetailTile
                title={t('payments.channelLiveGroup')}
                rows={[
                  [
                    t('payments.channel'),
                    getSalesChannelLabel(reservation.salesChannelCode, t),
                  ],
                  ...(reservation.liveId
                    ? [[t('payments.liveLabel'), getLiveLabel(reservation, t)] as [string, string]]
                    : []),
                ]}
              />
            </AppResponsiveGrid>

            <AppResponsiveGrid tabletColumns={3} desktopColumns={4} style={styles.summaryGrid}>
              <PaymentSummaryTile label={t('payments.total')} value={formatMoney(total)} />
              <PaymentSummaryTile label={t('payments.paid')} value={formatMoney(totalPaid)} />
              <PaymentSummaryTile
                label={t('payments.pending')}
                value={formatMoney(remaining)}
                tone={remaining > 0 ? 'warning' : 'success'}
              />
              {overpaidAmount > 0 ? (
                <PaymentSummaryTile
                  label={t('payments.overpaid')}
                  value={formatMoney(overpaidAmount)}
                />
              ) : null}
              <PaymentSummaryTile
                label="Saldo a favor disponible"
                value={formatMoney(customerBalance?.balance)}
                tone={Number(customerBalance?.balance ?? 0) > 0 ? 'success' : 'default'}
              />
            </AppResponsiveGrid>

            {isReservationSettled ? (
              <AppText variant="caption" color={theme.colors.mutedText}>
                {t('payments.reservationSettledHelp')}
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
            <InfoRow label="Saldo a favor disponible" value={formatMoney(customerBalance?.balance)} />
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

            <View style={styles.creditNotice}>
              <AppText variant="caption" color={theme.colors.mutedText}>
                Saldo a favor disponible
              </AppText>
              <AppText bold color={Number(customerBalance?.balance ?? 0) > 0 ? theme.colors.success : theme.colors.mutedText}>
                {formatMoney(customerBalance?.balance)}
              </AppText>
              <AppButton
                title="Aplicar saldo a favor"
                variant="neutral"
                disabled
                disabledReason="Disponible en siguiente fase con confirmacion y trazabilidad de aplicacion al apartado."
                style={styles.creditButton}
              />
            </View>

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

      {hasSelectedTarget ? (
        <AppCard>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionTitleText}>
              <AppText variant="subtitle" bold>
                Pagos registrados
              </AppText>
              <AppText variant="caption" color={theme.colors.mutedText}>
                Historial del movimiento seleccionado.
              </AppText>
            </View>
            <StatusBadge
              label={`${filteredPayments.length} registro${filteredPayments.length === 1 ? '' : 's'}`}
              tone={filteredPayments.length > 0 ? 'success' : 'neutral'}
            />
          </View>

          {!isPhone && filteredPayments.length > 0 ? (
            <View style={[styles.tableHeader, { borderBottomColor: theme.colors.border }]}>
              <AppText variant="caption" bold style={styles.tableDate}>Fecha</AppText>
              <AppText variant="caption" bold style={styles.tableOrigin}>Origen</AppText>
              <AppText variant="caption" bold style={styles.tableMethod}>Metodo</AppText>
              <AppText variant="caption" bold style={styles.tableAmount}>Monto</AppText>
              <AppText variant="caption" bold style={styles.tableStatus}>Estado</AppText>
            </View>
          ) : null}

          {filteredPayments.length === 0 ? (
            <AppText color={theme.colors.mutedText}>
              No hay pagos registrados con los filtros actuales.
            </AppText>
          ) : (
            filteredPayments.map((payment) => (
              <View
                key={payment.id}
                style={[styles.paymentRow, { borderBottomColor: theme.colors.border }]}
              >
                {isPhone ? (
                  <>
                    <View style={styles.paymentHeader}>
                      <View style={styles.rowTitleBlock}>
                        <AppText bold>Pago #{payment.id}</AppText>
                        <AppText variant="caption" color={theme.colors.mutedText}>
                          {formatDate(payment.createdAt)}
                        </AppText>
                      </View>
                      <View style={styles.amountBlock}>
                        <AppText bold>{formatMoney(getPaymentAmount(payment))}</AppText>
                        <StatusBadge
                          label={payment.status || 'Registrado'}
                          tone={getStatusTone(payment.status)}
                        />
                      </View>
                    </View>
                    <AppText variant="caption" color={theme.colors.mutedText}>
                      {targetType === 'order' ? `Pedido #${targetIdText}` : `Apartado #${targetIdText}`} | Metodo: {getPaymentMethodLabel(payment, paymentMethods)}
                    </AppText>
                    {payment.reference ? (
                      <AppText variant="caption" color={theme.colors.mutedText}>
                        Ref: {payment.reference}
                      </AppText>
                    ) : null}
                  </>
                ) : (
                  <View style={styles.tableRow}>
                    <AppText style={styles.tableDate}>{formatDate(payment.createdAt)}</AppText>
                    <AppText style={styles.tableOrigin}>
                      {targetType === 'order' ? `Pedido #${targetIdText}` : `Apartado #${targetIdText}`}
                    </AppText>
                    <AppText style={styles.tableMethod} numberOfLines={1}>
                      {getPaymentMethodLabel(payment, paymentMethods)}
                    </AppText>
                    <AppText bold style={styles.tableAmount}>
                      {formatMoney(getPaymentAmount(payment))}
                    </AppText>
                    <View style={styles.tableStatus}>
                      <StatusBadge
                        label={payment.status || 'Registrado'}
                        tone={getStatusTone(payment.status)}
                      />
                    </View>
                  </View>
                )}
                {payment.reference && !isPhone ? (
                  <AppText variant="caption" color={theme.colors.mutedText}>
                    Ref: {payment.reference}
                  </AppText>
                ) : null}
              </View>
            ))
          )}
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

      <AppBottomModal
        visible={isMethodFilterModalVisible}
        title="Filtrar por metodo"
        onClose={() => setIsMethodFilterModalVisible(false)}
      >
        <AppOptionRow
          title="Todos los metodos"
          subtitle="No limitar por metodo de pago"
          onPress={() => {
            setMethodFilterId(null);
            setIsMethodFilterModalVisible(false);
          }}
        >
          {!methodFilterId ? (
            <AppText variant="caption" color={theme.colors.accent} bold>
              Seleccionado
            </AppText>
          ) : null}
        </AppOptionRow>
        {paymentMethods.map((method) => (
          <AppOptionRow
            key={method.id}
            title={method.name}
            subtitle={method.code || undefined}
            onPress={() => {
              setMethodFilterId(method.id);
              setIsMethodFilterModalVisible(false);
            }}
          >
            {methodFilterId === method.id ? (
              <AppText variant="caption" color={theme.colors.accent} bold>
                Seleccionado
              </AppText>
            ) : null}
          </AppOptionRow>
        ))}
      </AppBottomModal>
    </AppShellPage>
  );
}

type InfoRowProps = {
  label: string;
  value: string;
};

type PaymentDetailTileProps = {
  title: string;
  rows: [string, string][];
};

type PaymentSummaryTileProps = {
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'warning';
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

function PaymentDetailTile({ title, rows }: PaymentDetailTileProps) {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.detailTile,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          padding: theme.spacing.md,
        },
      ]}
    >
      <AppText bold>{title}</AppText>
      {rows.map(([label, value]) => (
        <View key={label} style={styles.detailTileRow}>
          <AppText variant="caption" color={theme.colors.mutedText}>
            {label}
          </AppText>
          <AppText bold>{value}</AppText>
        </View>
      ))}
    </View>
  );
}

function PaymentSummaryTile({
  label,
  value,
  tone = 'default',
}: PaymentSummaryTileProps) {
  const { theme } = useAppTheme();
  const color =
    tone === 'success'
      ? theme.colors.success
      : tone === 'warning'
        ? theme.colors.warning
        : theme.colors.accent;

  return (
    <View
      style={[
        styles.summaryTile,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          padding: theme.spacing.md,
        },
      ]}
    >
      <AppText variant="caption" color={theme.colors.mutedText}>
        {label}
      </AppText>
      <AppText variant="subtitle" bold color={color}>
        {value}
      </AppText>
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
  amountBlock: {
    alignItems: 'flex-end',
    gap: 4,
  },
  compactAction: {
    minHeight: 34,
  },
  contextCard: {
    marginBottom: 12,
  },
  filterButton: {
    minHeight: 34,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  filterCard: {
    marginBottom: 12,
  },
  filterGroup: {
    marginBottom: 14,
  },
  heroCard: {
    marginBottom: 12,
  },
  heroHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
  },
  heroText: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  infoRow: {
    marginBottom: 10,
  },
  methodFilterButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    minHeight: 34,
  },
  permissionBadges: {
    alignItems: 'flex-end',
    gap: 8,
  },
  rowTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  sectionTitleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleText: {
    flex: 1,
    minWidth: 0,
  },
  tableAmount: {
    flexBasis: 110,
    textAlign: 'right',
  },
  tableDate: {
    flexBasis: 96,
  },
  tableHeader: {
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 8,
  },
  tableMethod: {
    flex: 1,
    minWidth: 0,
  },
  tableOrigin: {
    flexBasis: 120,
  },
  tableRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  tableStatus: {
    alignItems: 'flex-end',
    flexBasis: 120,
  },
  detailGrid: {
    marginTop: 12,
  },
  creditButton: {
    marginTop: 8,
    minHeight: 32,
  },
  creditNotice: {
    gap: 4,
    marginBottom: 12,
  },
  detailTile: {
    borderWidth: 1,
    gap: 10,
    marginBottom: 12,
    minHeight: 118,
  },
  detailTileRow: {
    gap: 2,
  },
  summaryGrid: {
    marginTop: 2,
  },
  summaryTile: {
    borderWidth: 1,
    gap: 4,
    marginBottom: 12,
    minHeight: 78,
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


