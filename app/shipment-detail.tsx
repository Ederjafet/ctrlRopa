import AppShellPage from '@/components/layout/AppShellPage';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppText from '@/components/ui/AppText';
import ScreenPermissionHeaderAction from '@/components/ui/ScreenPermissionHeaderAction';
import { useAppTheme } from '@/context/AppThemeContext';
import { hasPermission } from '@/services/accessControl';
import {
  cancelShipment,
  cancelShipmentShippingPayment,
  collectionStatusLabel,
  confirmShipmentReceived,
  dispatchShipment,
  getShipmentCostShares,
  getShipmentDetail,
  getShipmentDetailByFolio,
  getShipmentShippingPayments,
  paymentModeLabel,
  registerShipmentShippingPayment,
  reopenShipment,
  shipmentDeliveryTypeLabel,
  ShipmentCostShareMethod,
  ShipmentCostShareResponse,
  ShipmentDetail,
  ShipmentPackageLine,
  ShipmentShippingPaymentLine,
  ShipmentShippingPaymentShare,
  ShipmentShippingPaymentsResponse,
  shipmentPackageStatusLabel,
  shipmentStatusLabel,
  updateShipmentCostShares,
  updateShipmentLogistics,
} from '@/services/shipmentService';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

type NoticeTone = 'success' | 'warning' | 'danger' | 'info';
type NoticeState = {
  tone: NoticeTone;
  title: string;
  message?: string;
} | null;

type ShareDraftLine = {
  packageId: number;
  packageCode?: string | null;
  customerId: number;
  customerName?: string | null;
  assignedAmount: string;
  notes: string;
};

const shareMethodLabels: Record<string, string> = {
  EQUAL_SPLIT: 'Igualitario',
  MANUAL: 'Manual',
  STORE_ABSORBED: 'Tienda absorbe',
};

function money(value?: number | null) {
  return `$${Number(value ?? 0).toFixed(2)} MXN`;
}

function numberOrZero(value?: number | string | null) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDate(value?: string | null) {
  if (!value) return 'Pendiente';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function logisticsStatus(detail: ShipmentDetail | null, payments: ShipmentShippingPaymentsResponse | null) {
  if (!detail) return 'Sin envío';
  if (detail.status === 'DELIVERED') return 'Recibido';
  if (detail.status === 'OUT_FOR_DELIVERY') return 'Enviado';
  if (!detail.destinationSummary && !detail.destinationCity && !detail.destinationState) return 'Sin destino definido';
  if (!detail.shippingCarrier && !detail.packageTrackingNumber) return 'Pendiente de paquetería';
  if (numberOrZero(detail.shippingCostAmount) <= 0) return 'Pendiente de cotizar';
  if (payments && numberOrZero(payments.shippingBalance) <= 0) return 'Listo para despachar';
  return 'Con logística capturada';
}

function isRegisteredPayment(payment: ShipmentShippingPaymentLine) {
  return payment.status !== 'CANCELLED';
}

function packageReference(line: ShipmentPackageLine) {
  return line.customerPackageFolio || `Paquete #${line.customerPackageId}`;
}

function buildShareDraftFromDetail(
  detail: ShipmentDetail,
  costShares: ShipmentCostShareResponse | null,
  method: ShipmentCostShareMethod
): ShareDraftLine[] {
  const existingByPackage = new Map((costShares?.shares ?? []).map((share) => [share.packageId, share]));

  return (detail.packages ?? []).map((line) => {
    const existing = existingByPackage.get(line.customerPackageId);
    return {
      packageId: line.customerPackageId,
      packageCode: existing?.packageCode ?? line.customerPackageFolio,
      customerId: line.customerId,
      customerName: existing?.customerName ?? line.customerName,
      assignedAmount:
        method === 'STORE_ABSORBED'
          ? '0'
          : existing?.assignedAmount != null
            ? String(existing.assignedAmount)
            : '',
      notes: existing?.notes ?? '',
    };
  });
}

function splitEqually(total: number, count: number) {
  if (count <= 0) return [];
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / count);
  const remainder = cents - base * count;

  return Array.from({ length: count }, (_, index) => {
    const extra = index === count - 1 ? remainder : 0;
    return ((base + extra) / 100).toFixed(2);
  });
}

export default function ShipmentDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; shipmentId?: string; folio?: string }>();
  const { theme } = useAppTheme();

  const [session, setSession] = useState<UserSession | null>(null);
  const [detail, setDetail] = useState<ShipmentDetail | null>(null);
  const [costShares, setCostShares] = useState<ShipmentCostShareResponse | null>(null);
  const [shippingPayments, setShippingPayments] = useState<ShipmentShippingPaymentsResponse | null>(null);
  const [notice, setNotice] = useState<NoticeState>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);

  const [logisticsModalVisible, setLogisticsModalVisible] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [destinationSummary, setDestinationSummary] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [destinationState, setDestinationState] = useState('');
  const [destinationPostalCode, setDestinationPostalCode] = useState('');
  const [shippingCarrier, setShippingCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [realShippingCost, setRealShippingCost] = useState('');
  const [shippingNotes, setShippingNotes] = useState('');

  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareMethod, setShareMethod] = useState<ShipmentCostShareMethod>('EQUAL_SPLIT');
  const [shareDraftLines, setShareDraftLines] = useState<ShareDraftLine[]>([]);

  const [shippingPaymentModalVisible, setShippingPaymentModalVisible] = useState(false);
  const [selectedShippingPaymentShare, setSelectedShippingPaymentShare] =
    useState<ShipmentShippingPaymentShare | null>(null);
  const [shippingPaymentAmount, setShippingPaymentAmount] = useState('');
  const [shippingPaymentMethod, setShippingPaymentMethod] = useState('');
  const [shippingPaymentReference, setShippingPaymentReference] = useState('');
  const [shippingPaymentPaidByCustomerId, setShippingPaymentPaidByCustomerId] = useState<number | null>(null);
  const [shippingPaymentNotes, setShippingPaymentNotes] = useState('');
  const [shippingPaymentRegisteredAt, setShippingPaymentRegisteredAt] = useState('');

  const [cancelPaymentModalVisible, setCancelPaymentModalVisible] = useState(false);
  const [selectedShippingPayment, setSelectedShippingPayment] = useState<ShipmentShippingPaymentLine | null>(null);
  const [shippingPaymentCancelReason, setShippingPaymentCancelReason] = useState('');

  const shipmentId = Number(params.id ?? params.shipmentId);
  const canManageShipments = hasPermission(session, 'MANAGE_SHIPMENTS');
  const currentUserId = session?.userId ?? 0;
  const shipmentStatus = detail?.status;
  const isFinalShipmentStatus =
    shipmentStatus === 'DELIVERED' || shipmentStatus === 'CLOSED_WITH_INCIDENTS' || shipmentStatus === 'CANCELLED';
  const hasShippingPaymentHistory = (shippingPayments?.payments.length ?? 0) > 0;
  const logisticsDisabledReason = !canManageShipments
    ? 'No tienes acceso para editar datos de envio.'
    : shipmentStatus !== 'OPEN'
      ? 'Solo se pueden editar datos logisticos mientras el envio esta en preparacion.'
      : undefined;
  const costShareDisabledReason = !canManageShipments
    ? 'No tienes acceso para modificar el reparto de envio.'
    : shipmentStatus !== 'OPEN'
      ? 'Solo se puede modificar el reparto mientras el envio esta en preparacion.'
      : hasShippingPaymentHistory
        ? 'No se puede modificar el reparto porque ya existen pagos de envio registrados o cancelados.'
        : undefined;
  const shippingPaymentDisabledReason = !canManageShipments
    ? 'No tienes acceso para registrar pagos de envio.'
    : isFinalShipmentStatus
      ? 'Los pagos de envio quedan bloqueados cuando el envio esta finalizado o cancelado.'
      : undefined;
  const dispatchDisabledReason = !canManageShipments
    ? 'No tienes acceso para marcar envios como enviados.'
    : shipmentStatus !== 'OPEN'
      ? 'Solo se puede marcar como enviado un envio en preparacion.'
      : detail?.blockedReason || undefined;
  const confirmDisabledReason = !canManageShipments
    ? 'No tienes acceso para confirmar recibido.'
    : shipmentStatus !== 'OUT_FOR_DELIVERY'
      ? 'Primero marca el envio como enviado.'
      : detail?.blockedReason || undefined;

  const includedShippingCustomers = useMemo(() => {
    const source = shippingPayments?.shares ?? costShares?.shares ?? [];
    const map = new Map<number, string>();
    source.forEach((share) => {
      if (share.customerId) {
        map.set(share.customerId, share.customerName || `Cliente #${share.customerId}`);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [costShares, shippingPayments]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setNotice(null);

    try {
      const currentSession = await getSession();
      setSession(currentSession);

      const shipmentDetail =
        Number.isFinite(shipmentId) && shipmentId > 0
          ? await getShipmentDetail(shipmentId)
          : await getShipmentDetailByFolio(String(params.folio ?? ''));

      setDetail(shipmentDetail);

      const [sharesResponse, paymentsResponse] = await Promise.all([
        getShipmentCostShares(shipmentDetail.id),
        getShipmentShippingPayments(shipmentDetail.id),
      ]);

      setCostShares(sharesResponse);
      setShippingPayments(paymentsResponse);
    } catch (error) {
      setNotice({
        tone: 'danger',
        title: 'No se pudo cargar el envío',
        message: error instanceof Error ? error.message : 'Intenta de nuevo.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [params.folio, shipmentId]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  const refreshDerivedSections = async (shipmentDetail: ShipmentDetail) => {
    const [sharesResponse, paymentsResponse] = await Promise.all([
      getShipmentCostShares(shipmentDetail.id),
      getShipmentShippingPayments(shipmentDetail.id),
    ]);
    setCostShares(sharesResponse);
    setShippingPayments(paymentsResponse);
  };

  const setDetailAndRefresh = async (shipmentDetail: ShipmentDetail) => {
    setDetail(shipmentDetail);
    await refreshDerivedSections(shipmentDetail);
  };

  const openLogisticsModal = () => {
    if (!detail) return;
    if (logisticsDisabledReason) {
      setNotice({ tone: 'warning', title: 'Logistica bloqueada', message: logisticsDisabledReason });
      return;
    }
    setRecipientName(detail.recipientName ?? '');
    setRecipientPhone(detail.recipientPhone ?? '');
    setDestinationSummary(detail.destinationSummary ?? '');
    setDestinationCity(detail.destinationCity ?? '');
    setDestinationState(detail.destinationState ?? '');
    setDestinationPostalCode(detail.destinationPostalCode ?? '');
    setShippingCarrier(detail.shippingCarrier ?? '');
    setTrackingNumber(detail.packageTrackingNumber ?? detail.guideReference ?? '');
    setRealShippingCost(detail.shippingCostAmount != null ? String(detail.shippingCostAmount) : '');
    setShippingNotes(detail.shippingNotes ?? '');
    setLogisticsModalVisible(true);
  };

  const handleSaveLogistics = async () => {
    if (!detail) return;
    const parsedCost = realShippingCost.trim() ? Number(realShippingCost) : null;
    if (parsedCost != null && (!Number.isFinite(parsedCost) || parsedCost < 0)) {
      setNotice({
        tone: 'warning',
        title: 'Costo inválido',
        message: 'El costo real del envío no puede ser negativo.',
      });
      return;
    }

    setIsWorking(true);
    try {
      const updated = await updateShipmentLogistics(detail.id, {
        deliveryType: detail.deliveryType === 'LOCAL' ? 'LOCAL' : 'CARRIER',
        recipientName: recipientName.trim() || null,
        recipientPhone: recipientPhone.trim() || null,
        destinationSummary: destinationSummary.trim() || null,
        destinationCity: destinationCity.trim() || null,
        destinationState: destinationState.trim() || null,
        destinationPostalCode: destinationPostalCode.trim() || null,
        shippingCarrier: shippingCarrier.trim() || null,
        trackingNumber: trackingNumber.trim() || null,
        realShippingCost: parsedCost,
        shippingNotes: shippingNotes.trim() || null,
      });
      setLogisticsModalVisible(false);
      await setDetailAndRefresh(updated);
      setNotice({ tone: 'success', title: 'Logística actualizada' });
    } catch (error) {
      setNotice({
        tone: 'danger',
        title: 'No se pudo guardar la logística',
        message: error instanceof Error ? error.message : 'Intenta de nuevo.',
      });
    } finally {
      setIsWorking(false);
    }
  };

  const openShareModal = () => {
    if (!detail) return;
    if (costShareDisabledReason) {
      setNotice({ tone: 'warning', title: 'Reparto bloqueado', message: costShareDisabledReason });
      return;
    }
    const initialMethod = costShares?.shareMethod ?? 'EQUAL_SPLIT';
    setShareMethod(initialMethod);
    setShareDraftLines(buildShareDraftFromDetail(detail, costShares, initialMethod));
    setShareModalVisible(true);
  };

  const applyShareMethod = (method: ShipmentCostShareMethod) => {
    if (!detail) return;
    setShareMethod(method);

    if (method === 'EQUAL_SPLIT') {
      const amounts = splitEqually(numberOrZero(detail.shippingCostAmount), detail.packages.length);
      setShareDraftLines((current) =>
        current.map((line, index) => ({ ...line, assignedAmount: amounts[index] ?? '0' }))
      );
      return;
    }

    if (method === 'STORE_ABSORBED') {
      setShareDraftLines((current) => current.map((line) => ({ ...line, assignedAmount: '0' })));
    }
  };

  const updateShareDraftAmount = (packageId: number, value: string) => {
    setShareDraftLines((current) =>
      current.map((line) => (line.packageId === packageId ? { ...line, assignedAmount: value } : line))
    );
  };

  const updateShareDraftNotes = (packageId: number, value: string) => {
    setShareDraftLines((current) =>
      current.map((line) => (line.packageId === packageId ? { ...line, notes: value } : line))
    );
  };

  const handleSaveShares = async () => {
    if (!detail) return;
    const invalid = shareDraftLines.some((line) => numberOrZero(line.assignedAmount) < 0);
    if (invalid) {
      setNotice({
        tone: 'warning',
        title: 'Monto inválido',
        message: 'El reparto de envío no permite montos negativos.',
      });
      return;
    }

    setIsWorking(true);
    try {
      const response = await updateShipmentCostShares(detail.id, {
        shareMethod,
        shares: shareDraftLines.map((line) => ({
          packageId: line.packageId,
          assignedAmount: numberOrZero(line.assignedAmount),
          notes: line.notes.trim() || null,
        })),
      });
      setCostShares(response);
      setShippingPayments(await getShipmentShippingPayments(detail.id));
      setShareModalVisible(false);
      setNotice({ tone: 'success', title: 'Reparto actualizado' });
    } catch (error) {
      setNotice({
        tone: 'danger',
        title: 'No se pudo guardar el reparto',
        message: error instanceof Error ? error.message : 'Intenta de nuevo.',
      });
    } finally {
      setIsWorking(false);
    }
  };

  const openShippingPaymentModal = (share: ShipmentShippingPaymentShare) => {
    if (shippingPaymentDisabledReason) {
      setNotice({ tone: 'warning', title: 'Pago de envio bloqueado', message: shippingPaymentDisabledReason });
      return;
    }
    if (numberOrZero(share.balanceAmount) <= 0) {
      setNotice({ tone: 'info', title: 'Parte cubierta', message: 'Esta parte del envio no tiene saldo pendiente.' });
      return;
    }
    setSelectedShippingPaymentShare(share);
    setShippingPaymentAmount(
      numberOrZero(share.balanceAmount) > 0 ? numberOrZero(share.balanceAmount).toFixed(2) : ''
    );
    setShippingPaymentMethod('');
    setShippingPaymentReference('');
    setShippingPaymentPaidByCustomerId(share.customerId);
    setShippingPaymentNotes('');
    setShippingPaymentRegisteredAt('');
    setShippingPaymentModalVisible(true);
  };

  const closeShippingPaymentModal = () => {
    setShippingPaymentModalVisible(false);
    setSelectedShippingPaymentShare(null);
    setShippingPaymentAmount('');
    setShippingPaymentMethod('');
    setShippingPaymentReference('');
    setShippingPaymentPaidByCustomerId(null);
    setShippingPaymentNotes('');
    setShippingPaymentRegisteredAt('');
  };

  const handleRegisterShippingPayment = async () => {
    if (!detail || !selectedShippingPaymentShare) return;
    if (shippingPaymentDisabledReason) {
      setNotice({ tone: 'warning', title: 'Pago de envio bloqueado', message: shippingPaymentDisabledReason });
      return;
    }
    const amount = Number(shippingPaymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setNotice({
        tone: 'warning',
        title: 'Monto inválido',
        message: 'El pago de envío debe ser mayor a cero.',
      });
      return;
    }

    setIsWorking(true);
    try {
      const response = await registerShipmentShippingPayment(detail.id, {
        costShareId: selectedShippingPaymentShare.costShareId,
        packageId: selectedShippingPaymentShare.packageId,
        customerId: selectedShippingPaymentShare.customerId,
        paidByCustomerId: shippingPaymentPaidByCustomerId,
        amount,
        paymentMethod: shippingPaymentMethod.trim() || null,
        reference: shippingPaymentReference.trim() || null,
        notes: shippingPaymentNotes.trim() || null,
        registeredAt: shippingPaymentRegisteredAt.trim() || null,
      });
      setShippingPayments(response);
      closeShippingPaymentModal();
      setNotice({ tone: 'success', title: 'Pago de envío registrado' });
    } catch (error) {
      setNotice({
        tone: 'danger',
        title: 'No se pudo registrar el pago de envío',
        message: error instanceof Error ? error.message : 'Intenta de nuevo.',
      });
    } finally {
      setIsWorking(false);
    }
  };

  const openCancelPaymentModal = (payment: ShipmentShippingPaymentLine) => {
    if (shippingPaymentDisabledReason) {
      setNotice({ tone: 'warning', title: 'Cancelacion bloqueada', message: shippingPaymentDisabledReason });
      return;
    }
    setSelectedShippingPayment(payment);
    setShippingPaymentCancelReason('');
    setCancelPaymentModalVisible(true);
  };

  const handleCancelShippingPayment = async () => {
    if (!detail || !selectedShippingPayment) return;
    if (shippingPaymentDisabledReason) {
      setNotice({ tone: 'warning', title: 'Cancelacion bloqueada', message: shippingPaymentDisabledReason });
      return;
    }
    setIsWorking(true);
    try {
      const response = await cancelShipmentShippingPayment(detail.id, selectedShippingPayment.id, {
        cancelReason: shippingPaymentCancelReason.trim() || null,
      });
      setShippingPayments(response);
      setCancelPaymentModalVisible(false);
      setNotice({ tone: 'success', title: 'Pago de envío cancelado' });
    } catch (error) {
      setNotice({
        tone: 'danger',
        title: 'No se pudo cancelar el pago de envío',
        message: error instanceof Error ? error.message : 'Intenta de nuevo.',
      });
    } finally {
      setIsWorking(false);
    }
  };

  const handleShipmentAction = async (action: 'dispatch' | 'receive' | 'cancel' | 'reopen') => {
    if (!detail || !currentUserId) return;
    const actionBlockReason = action === 'dispatch' ? dispatchDisabledReason : action === 'receive' ? confirmDisabledReason : undefined;
    if (actionBlockReason) {
      setNotice({ tone: 'warning', title: 'Accion bloqueada', message: actionBlockReason });
      return;
    }
    setIsWorking(true);
    try {
      let updated: ShipmentDetail;
      if (action === 'dispatch') updated = await dispatchShipment(detail.id, currentUserId);
      else if (action === 'receive') {
        updated = await confirmShipmentReceived(detail.id, {
          deliveryConfirmedByUserId: currentUserId,
          receivedAt: new Date().toISOString(),
        });
      } else if (action === 'cancel') updated = await cancelShipment(detail.id, currentUserId);
      else updated = await reopenShipment(detail.id, currentUserId);

      await setDetailAndRefresh(updated);
      setNotice({ tone: 'success', title: 'Envío actualizado' });
    } catch (error) {
      setNotice({
        tone: 'danger',
        title: 'No se pudo actualizar el envío',
        message: error instanceof Error ? error.message : 'Intenta de nuevo.',
      });
    } finally {
      setIsWorking(false);
    }
  };

  const renderNotice = () => {
    if (!notice) return null;
    return (
      <View
        style={[
          styles.notice,
          {
            backgroundColor:
              notice.tone === 'danger'
                ? theme.colors.dangerBackground
                : notice.tone === 'warning'
                  ? theme.colors.warningBackground
                  : notice.tone === 'success'
                    ? theme.colors.successBackground
                    : theme.colors.infoSoft,
            borderColor:
              notice.tone === 'danger'
                ? theme.colors.danger
                : notice.tone === 'warning'
                  ? theme.colors.warning
                  : notice.tone === 'success'
                    ? theme.colors.success
                    : theme.colors.info,
          },
        ]}
      >
        <AppText bold>{notice.title}</AppText>
        {notice.message ? (
          <AppText variant="caption" color={theme.colors.textSecondary}>
            {notice.message}
          </AppText>
        ) : null}
      </View>
    );
  };

  const renderMetric = (label: string, value: string, tone: NoticeTone = 'info') => (
    <View style={[styles.metric, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}>
      <AppText variant="caption" color={theme.colors.textSecondary}>
        {label}
      </AppText>
      <AppText
        bold
        color={
          tone === 'danger'
            ? theme.colors.danger
            : tone === 'warning'
              ? theme.colors.warning
              : tone === 'success'
                ? theme.colors.success
                : theme.colors.text
        }
      >
        {value}
      </AppText>
    </View>
  );

  const renderHero = () => {
    if (!detail) return null;
    const packageCount = detail.packages?.length ?? 0;
    const itemCount = detail.packageItemCount ?? 0;

    return (
      <AppCard>
        <View style={styles.sectionHeader}>
          <View style={styles.flex}>
            <AppText variant="subtitle" bold>
              {detail.folio}
            </AppText>
            <AppText color={theme.colors.textSecondary}>
              {shipmentStatusLabel(detail.status)} - {logisticsStatus(detail, shippingPayments)}
            </AppText>
          </View>
          <AppButton
            title="Editar datos de envío"
            variant="cta"
            onPress={openLogisticsModal}
            disabled={Boolean(logisticsDisabledReason)}
            disabledReason={logisticsDisabledReason}
          />
        </View>

        {detail.blockedReason ? (
          <View
            style={[
              styles.notice,
              { backgroundColor: theme.colors.warningBackground, borderColor: theme.colors.warning },
            ]}
          >
            <AppText bold>Bloqueo operativo</AppText>
            <AppText variant="caption" color={theme.colors.textSecondary}>
              {detail.blockedReason}
            </AppText>
          </View>
        ) : null}

        {detail.logisticsWarning ? (
          <View
            style={[
              styles.notice,
              { backgroundColor: theme.colors.warningBackground, borderColor: theme.colors.warning },
            ]}
          >
            <AppText bold>Revisa la logística</AppText>
            <AppText variant="caption" color={theme.colors.textSecondary}>
              {detail.logisticsWarning}
            </AppText>
          </View>
        ) : null}

        <View style={styles.metricGrid}>
          {renderMetric('Paquetes incluidos', String(packageCount), packageCount > 0 ? 'success' : 'warning')}
          {renderMetric('Prendas', String(itemCount), itemCount > 0 ? 'success' : 'warning')}
          {renderMetric(
            'Costo real del envío',
            money(detail.shippingCostAmount),
            numberOrZero(detail.shippingCostAmount) > 0 ? 'success' : 'warning'
          )}
          {renderMetric(
            'Saldo de envío',
            money(shippingPayments?.shippingBalance),
            numberOrZero(shippingPayments?.shippingBalance) <= 0 ? 'success' : 'warning'
          )}
          {renderMetric('Creado', formatDate(detail.createdAt), 'info')}
        </View>
      </AppCard>
    );
  };

  const renderLogistics = () => {
    if (!detail) return null;
    const addressParts = [
      detail.destinationSummary,
      detail.destinationCity,
      detail.destinationState,
      detail.destinationPostalCode,
    ].filter(Boolean);

    return (
      <AppCard>
        <View style={styles.sectionHeader}>
          <View>
            <AppText variant="subtitle" bold>
              Datos del envío
            </AppText>
            <AppText variant="caption" color={theme.colors.textSecondary}>
              La dirección, guía, paquetería y costo real pertenecen al envío.
            </AppText>
          </View>
        </View>

        <View style={styles.metricGrid}>
          {renderMetric('Tipo', shipmentDeliveryTypeLabel(detail.deliveryType), 'info')}
          {renderMetric('Destinatario', detail.recipientName || 'Pendiente', detail.recipientName ? 'success' : 'warning')}
          {renderMetric('Teléfono', detail.recipientPhone || 'Pendiente', detail.recipientPhone ? 'success' : 'warning')}
          {renderMetric('Paquetería', detail.shippingCarrier || 'Pendiente', detail.shippingCarrier ? 'success' : 'warning')}
          {renderMetric(
            'Guía',
            detail.packageTrackingNumber || detail.guideReference || 'Pendiente',
            detail.packageTrackingNumber || detail.guideReference ? 'success' : 'warning'
          )}
          {renderMetric('Cotizado', formatDate(detail.quotedAt), detail.quotedAt ? 'success' : 'warning')}
        </View>

        <View style={[styles.infoBlock, { backgroundColor: theme.colors.surfaceMuted }]}>
          <AppText variant="caption" color={theme.colors.textSecondary}>
            Destino
          </AppText>
          <AppText>{addressParts.length > 0 ? addressParts.join(', ') : 'Sin destino definido'}</AppText>
          {detail.shippingNotes ? (
            <AppText variant="caption" color={theme.colors.textSecondary}>
              {detail.shippingNotes}
            </AppText>
          ) : null}
        </View>
      </AppCard>
    );
  };

  const renderPackageLine = (line: ShipmentPackageLine) => (
    <View key={line.id} style={[styles.listItem, { borderColor: theme.colors.border }]}>
      <View style={styles.flex}>
        <AppText bold>{packageReference(line)}</AppText>
        <AppText variant="caption" color={theme.colors.textSecondary}>
          {line.customerName || `Cliente #${line.customerId}`}
        </AppText>
      </View>
      <View style={styles.metricGrid}>
        {renderMetric('Estado', shipmentPackageStatusLabel(line.status), line.status === 'DELIVERED' ? 'success' : 'info')}
        {renderMetric('Cobro', paymentModeLabel(line.paymentMode), 'info')}
        {renderMetric('Resultado', collectionStatusLabel(line.collectionStatus), 'info')}
        {renderMetric('Entregado', formatDate(line.deliveredAt), line.deliveredAt ? 'success' : 'warning')}
      </View>
    </View>
  );

  const renderPackages = () => {
    if (!detail) return null;
    return (
      <AppCard>
        <View style={styles.sectionHeader}>
          <View>
            <AppText variant="subtitle" bold>
              Paquetes incluidos
            </AppText>
            <AppText variant="caption" color={theme.colors.textSecondary}>
              Este envío puede contener uno o varios paquetes.
            </AppText>
          </View>
        </View>
        <View style={styles.stack}>{detail.packages.map(renderPackageLine)}</View>
      </AppCard>
    );
  };

  const renderCostShares = () => {
    const shares = costShares?.shares ?? [];
    const assignedTotal = costShares?.assignedTotal ?? shippingPayments?.assignedTotal ?? 0;
    const absorbedAmount = costShares?.absorbedAmount ?? shippingPayments?.absorbedAmount ?? 0;
    const overAssignedAmount = costShares?.overAssignedAmount ?? shippingPayments?.overAssignedAmount ?? 0;

    return (
      <AppCard>
        <View style={styles.sectionHeader}>
          <View style={styles.flex}>
            <AppText variant="subtitle" bold>
              Reparto del costo de envío
            </AppText>
            <AppText variant="caption" color={theme.colors.textSecondary}>
              Define cuánto corresponde pagar por envío. Esto todavía no registra pagos.
            </AppText>
          </View>
          <AppButton
            title="Repartir costo"
            variant="secondary"
            onPress={openShareModal}
            disabled={Boolean(costShareDisabledReason)}
            disabledReason={costShareDisabledReason}
          />
        </View>

        <View style={styles.metricGrid}>
          {renderMetric('Costo real', money(detail?.shippingCostAmount), 'info')}
          {renderMetric('Asignado a clientes', money(assignedTotal), 'info')}
          {renderMetric('Absorbido por tienda', money(absorbedAmount), absorbedAmount > 0 ? 'warning' : 'success')}
          {renderMetric('Sobreasignado', money(overAssignedAmount), overAssignedAmount > 0 ? 'warning' : 'success')}
        </View>

        {(shippingPayments?.payments.length ?? 0) > 0 ? (
          <View style={[styles.infoBlock, { backgroundColor: theme.colors.warningBackground }]}>
            <AppText bold>Reparto bloqueado por pagos de envío</AppText>
            <AppText variant="caption" color={theme.colors.textSecondary}>
              Para conservar trazabilidad, no se puede modificar el reparto cuando ya existen pagos registrados o cancelados.
            </AppText>
          </View>
        ) : null}
        {shares.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.colors.surfaceMuted }]}>
            <AppText>No hay reparto de envío definido.</AppText>
            <AppText variant="caption" color={theme.colors.textSecondary}>
              Reparte el costo antes de registrar pagos de envío.
            </AppText>
          </View>
        ) : (
          <View style={styles.stack}>
            {shares.map((share) => (
              <View key={`${share.packageId}-${share.customerId}`} style={[styles.listItem, { borderColor: theme.colors.border }]}>
                <View style={styles.flex}>
                  <AppText bold>{share.packageCode || `Paquete #${share.packageId}`}</AppText>
                  <AppText variant="caption" color={theme.colors.textSecondary}>
                    {share.customerName || `Cliente #${share.customerId}`}
                  </AppText>
                </View>
                <AppText>{money(share.assignedAmount)}</AppText>
              </View>
            ))}
          </View>
        )}
      </AppCard>
    );
  };

  const renderShippingPayments = () => {
    const shares = shippingPayments?.shares ?? [];
    return (
      <AppCard>
        <View style={styles.sectionHeader}>
          <View>
            <AppText variant="subtitle" bold>
              Pagos de envío
            </AppText>
            <AppText variant="caption" color={theme.colors.textSecondary}>
              Estos pagos corresponden únicamente al envío. No modifican el saldo de mercancía del paquete.
            </AppText>
          </View>
        </View>

        <View style={styles.metricGrid}>
          {renderMetric('Costo real del envío', money(shippingPayments?.realShippingCost ?? detail?.shippingCostAmount), 'info')}
          {renderMetric('Asignado a clientes', money(shippingPayments?.assignedTotal), 'info')}
          {renderMetric(
            'Pagado de envío',
            money(shippingPayments?.paidTotal),
            numberOrZero(shippingPayments?.paidTotal) > 0 ? 'success' : 'warning'
          )}
          {renderMetric(
            'Saldo de envío',
            money(shippingPayments?.shippingBalance),
            numberOrZero(shippingPayments?.shippingBalance) <= 0 ? 'success' : 'warning'
          )}
          {renderMetric(
            'Absorbido por tienda',
            money(shippingPayments?.absorbedAmount),
            numberOrZero(shippingPayments?.absorbedAmount) > 0 ? 'warning' : 'success'
          )}
        </View>


        {shares.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.colors.surfaceMuted }]}>
            <AppText>No hay reparto para registrar pagos de envío.</AppText>
            <AppText variant="caption" color={theme.colors.textSecondary}>
              Primero define el reparto del costo de envío.
            </AppText>
          </View>
        ) : (
          <View style={styles.stack}>
            {shares.map((share) => (
              <View key={share.costShareId} style={[styles.listItem, { borderColor: theme.colors.border }]}>
                <View style={styles.sectionHeader}>
                  <View style={styles.flex}>
                    <AppText bold>{share.packageReference || `Paquete #${share.packageId}`}</AppText>
                    <AppText variant="caption" color={theme.colors.textSecondary}>
                      {share.customerName || `Cliente #${share.customerId}`}
                    </AppText>
                  </View>
                  <AppButton
                    title="Registrar pago"
                    variant="cta"
                    onPress={() => openShippingPaymentModal(share)}
                    disabled={Boolean(shippingPaymentDisabledReason) || numberOrZero(share.balanceAmount) <= 0}
                    disabledReason={shippingPaymentDisabledReason || 'Esta parte del envio no tiene saldo pendiente.'}
                  />
                </View>

                <View style={styles.metricGrid}>
                  {renderMetric('Asignado', money(share.assignedAmount), 'info')}
                  {renderMetric('Pagado', money(share.paidAmount), numberOrZero(share.paidAmount) > 0 ? 'success' : 'warning')}
                  {renderMetric('Saldo', money(share.balanceAmount), numberOrZero(share.balanceAmount) <= 0 ? 'success' : 'warning')}
                </View>

                {share.payments.length > 0 ? (
                  <View style={styles.stack}>
                    {share.payments.map((payment) => (
                      <View key={payment.id} style={[styles.paymentRow, { backgroundColor: theme.colors.surfaceMuted }]}>
                        <View style={styles.flex}>
                          <AppText bold>{money(payment.amount)}</AppText>
                          <AppText variant="caption" color={theme.colors.textSecondary}>
                            {isRegisteredPayment(payment) ? 'Registrado' : 'Cancelado'} - {formatDate(payment.registeredAt)}
                          </AppText>
                          <AppText variant="caption" color={theme.colors.textSecondary}>
                            Pagado por: {payment.paidByCustomerName || 'No disponible'}
                          </AppText>
                          {payment.paymentMethod || payment.reference ? (
                            <AppText variant="caption" color={theme.colors.textSecondary}>
                              {[payment.paymentMethod, payment.reference].filter(Boolean).join(' - ')}
                            </AppText>
                          ) : null}
                          {payment.cancelReason ? (
                            <AppText variant="caption" color={theme.colors.danger}>
                              Cancelación: {payment.cancelReason}
                            </AppText>
                          ) : null}
                        </View>
                        {isRegisteredPayment(payment) ? (
                          <AppButton
                            title="Cancelar"
                            variant="danger"
                            onPress={() => openCancelPaymentModal(payment)}
                            disabled={Boolean(shippingPaymentDisabledReason)}
                            disabledReason={shippingPaymentDisabledReason}
                          />
                        ) : null}
                      </View>
                    ))}
                  </View>
                ) : (
                  <AppText variant="caption" color={theme.colors.textSecondary}>
                    Sin pagos de envío registrados para esta parte.
                  </AppText>
                )}
              </View>
            ))}
          </View>
        )}
      </AppCard>
    );
  };

  const renderActions = () => {
    if (!detail) return null;
    return (
      <AppCard>
        <AppText variant="subtitle" bold>
          Acciones del envío
        </AppText>
        <View style={styles.actions}>
          <AppButton
            title="Marcar enviado"
            variant="cta"
            onPress={() => void handleShipmentAction('dispatch')}
            disabled={Boolean(dispatchDisabledReason)}
            disabledReason={dispatchDisabledReason}
          />
          <AppButton
            title="Confirmar recibido"
            variant="primary"
            onPress={() => void handleShipmentAction('receive')}
            disabled={Boolean(confirmDisabledReason)}
            disabledReason={confirmDisabledReason}
          />
          <AppButton
            title="Reabrir"
            variant="secondary"
            onPress={() => void handleShipmentAction('reopen')}
            disabled={!canManageShipments || detail.status !== 'CANCELLED'}
          />
          <AppButton
            title="Cancelar envío"
            variant="danger"
            onPress={() => void handleShipmentAction('cancel')}
            disabled={!canManageShipments || detail.status === 'CANCELLED' || detail.status === 'DELIVERED'}
          />
        </View>
      </AppCard>
    );
  };

  const renderLogisticsModal = () => (
    <AppBottomModal
      visible={logisticsModalVisible}
      title="Editar datos de envío"
      onClose={() => setLogisticsModalVisible(false)}
      footer={
        <View style={styles.modalFooter}>
          <AppButton title="Cancelar" variant="neutral" onPress={() => setLogisticsModalVisible(false)} />
          <AppButton title="Guardar logística" variant="cta" loading={isWorking} onPress={() => void handleSaveLogistics()} />
        </View>
      }
    >
      <View style={styles.stack}>
        <AppInput label="Destinatario" value={recipientName} onChangeText={setRecipientName} />
        <AppInput label="Teléfono" value={recipientPhone} onChangeText={setRecipientPhone} keyboardType="phone-pad" />
        <AppInput label="Dirección / resumen destino" value={destinationSummary} onChangeText={setDestinationSummary} multiline />
        <View style={styles.formRow}>
          <View style={styles.formHalf}>
            <AppInput label="Ciudad" value={destinationCity} onChangeText={setDestinationCity} />
          </View>
          <View style={styles.formHalf}>
            <AppInput label="Estado" value={destinationState} onChangeText={setDestinationState} />
          </View>
        </View>
        <AppInput label="Código postal" value={destinationPostalCode} onChangeText={setDestinationPostalCode} keyboardType="number-pad" />
        <AppInput label="Paquetería" value={shippingCarrier} onChangeText={setShippingCarrier} />
        <AppInput label="Guía" value={trackingNumber} onChangeText={setTrackingNumber} />
        <AppInput label="Costo real del envío" value={realShippingCost} onChangeText={setRealShippingCost} keyboardType="decimal-pad" />
        <AppInput label="Notas" value={shippingNotes} onChangeText={setShippingNotes} multiline />
      </View>
    </AppBottomModal>
  );

  const renderShareModal = () => (
    <AppBottomModal
      visible={shareModalVisible}
      title="Repartir costo de envío"
      onClose={() => setShareModalVisible(false)}
      footer={
        <View style={styles.modalFooter}>
          <AppButton title="Cancelar" variant="neutral" onPress={() => setShareModalVisible(false)} />
          <AppButton title="Guardar reparto" variant="cta" loading={isWorking} onPress={() => void handleSaveShares()} />
        </View>
      }
    >
      <View style={styles.stack}>
        <AppText color={theme.colors.textSecondary}>Costo real del envío: {money(detail?.shippingCostAmount)}</AppText>
        <View style={styles.actions}>
          {(['EQUAL_SPLIT', 'MANUAL', 'STORE_ABSORBED'] as ShipmentCostShareMethod[]).map((method) => (
            <AppButton
              key={method}
              title={shareMethodLabels[method] ?? method}
              variant={shareMethod === method ? 'primary' : 'secondary'}
              onPress={() => applyShareMethod(method)}
            />
          ))}
        </View>

        {shareDraftLines.map((line) => (
          <View key={line.packageId} style={[styles.listItem, { borderColor: theme.colors.border }]}>
            <AppText bold>{line.packageCode || `Paquete #${line.packageId}`}</AppText>
            <AppText variant="caption" color={theme.colors.textSecondary}>
              {line.customerName || `Cliente #${line.customerId}`}
            </AppText>
            <AppInput
              label="Monto asignado"
              value={line.assignedAmount}
              onChangeText={(value) => updateShareDraftAmount(line.packageId, value)}
              keyboardType="decimal-pad"
              editable={shareMethod !== 'STORE_ABSORBED'}
            />
            <AppInput
              label="Notas"
              value={line.notes}
              onChangeText={(value) => updateShareDraftNotes(line.packageId, value)}
              multiline
            />
          </View>
        ))}
      </View>
    </AppBottomModal>
  );

  const renderShippingPaymentModal = () => (
    <AppBottomModal
      visible={shippingPaymentModalVisible}
      title="Registrar pago de envío"
      onClose={closeShippingPaymentModal}
      footer={
        <View style={styles.modalFooter}>
          <AppButton title="Cancelar" variant="neutral" onPress={closeShippingPaymentModal} />
          <AppButton
            title="Registrar pago de envío"
            variant="cta"
            loading={isWorking}
            onPress={() => void handleRegisterShippingPayment()}
          />
        </View>
      }
    >
      <View style={styles.stack}>
        <View style={[styles.infoBlock, { backgroundColor: theme.colors.surfaceMuted }]}>
          <AppText bold>{selectedShippingPaymentShare?.packageReference || 'Paquete'}</AppText>
          <AppText color={theme.colors.textSecondary}>
            {selectedShippingPaymentShare?.customerName || 'Cliente no disponible'}
          </AppText>
          <AppText color={theme.colors.textSecondary}>
            Saldo de envío: {money(selectedShippingPaymentShare?.balanceAmount)}
          </AppText>
        </View>
        <AppInput label="Monto" value={shippingPaymentAmount} onChangeText={setShippingPaymentAmount} keyboardType="decimal-pad" />
        <AppInput label="Método de pago" value={shippingPaymentMethod} onChangeText={setShippingPaymentMethod} />
        <AppInput label="Referencia" value={shippingPaymentReference} onChangeText={setShippingPaymentReference} />
        <AppInput
          label="Fecha"
          value={shippingPaymentRegisteredAt}
          onChangeText={setShippingPaymentRegisteredAt}
          placeholder="YYYY-MM-DDTHH:mm:ss"
        />
        <AppText variant="caption" color={theme.colors.textSecondary}>
          Pagado por
        </AppText>
        <View style={styles.actions}>
          {includedShippingCustomers.map((customer) => (
            <AppButton
              key={customer.id}
              title={customer.name}
              variant={shippingPaymentPaidByCustomerId === customer.id ? 'primary' : 'secondary'}
              onPress={() => setShippingPaymentPaidByCustomerId(customer.id)}
            />
          ))}
        </View>
        <AppInput label="Notas" value={shippingPaymentNotes} onChangeText={setShippingPaymentNotes} multiline />
      </View>
    </AppBottomModal>
  );

  const renderCancelPaymentModal = () => (
    <AppBottomModal
      visible={cancelPaymentModalVisible}
      title="Cancelar pago de envío"
      onClose={() => setCancelPaymentModalVisible(false)}
      footer={
        <View style={styles.modalFooter}>
          <AppButton title="Volver" variant="neutral" onPress={() => setCancelPaymentModalVisible(false)} />
          <AppButton
            title="Cancelar pago"
            variant="danger"
            loading={isWorking}
            onPress={() => void handleCancelShippingPayment()}
            disabled={Boolean(shippingPaymentDisabledReason)}
            disabledReason={shippingPaymentDisabledReason}
          />
        </View>
      }
    >
      <View style={styles.stack}>
        <AppText>El pago se marcará como cancelado y el saldo de envío se recalculará. No se elimina físicamente.</AppText>
        <AppInput
          label="Motivo"
          value={shippingPaymentCancelReason}
          onChangeText={setShippingPaymentCancelReason}
          multiline
        />
      </View>
    </AppBottomModal>
  );

  if (isLoading) {
    return (
      <AppShellPage
        title="Detalle de envío"
        subtitle="Cargando información logística."
        activeRoute="/shipments"
        session={session}
      >
        <View style={styles.loading}>
          <ActivityIndicator />
          <AppText>Cargando envío...</AppText>
        </View>
      </AppShellPage>
    );
  }

  return (
    <AppShellPage
      title={detail ? `Envío ${detail.folio}` : 'Detalle de envío'}
      subtitle="Logística, reparto y pagos de envío separados de mercancía."
      activeRoute="/shipments"
      session={session}
      rightContent={
        <ScreenPermissionHeaderAction
          screenKey="shipmentDetail"
          screenTitle="Detalle de envío"
          session={session}
        />
      }
    >
      <View style={styles.page}>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <AppText color={theme.colors.textSecondary}>Volver</AppText>
        </Pressable>
        {renderNotice()}
        {!detail ? (
          <AppCard>
            <AppText>No se encontró el envío solicitado.</AppText>
          </AppCard>
        ) : (
          <>
            {renderHero()}
            {renderLogistics()}
            {renderPackages()}
            {renderCostShares()}
            {renderShippingPayments()}
            {renderActions()}
          </>
        )}
      </View>
      {renderLogisticsModal()}
      {renderShareModal()}
      {renderShippingPaymentModal()}
      {renderCancelPaymentModal()}
    </AppShellPage>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 16,
    paddingBottom: 32,
  },
  loading: {
    alignItems: 'center',
    gap: 12,
    padding: 32,
  },
  backLink: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  sectionHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  flex: {
    flex: 1,
    minWidth: 220,
  },
  stack: {
    gap: 12,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  metric: {
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 150,
    padding: 12,
  },
  notice: {
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  infoBlock: {
    borderRadius: 12,
    gap: 4,
    marginTop: 12,
    padding: 12,
  },
  emptyState: {
    borderRadius: 12,
    gap: 4,
    marginTop: 12,
    padding: 14,
  },
  listItem: {
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  paymentRow: {
    alignItems: 'flex-start',
    borderRadius: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: 10,
  },
  modalFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-end',
  },
  formRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  formHalf: {
    flex: 1,
    minWidth: 180,
  },
});
