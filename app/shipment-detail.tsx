import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppShellPage from '@/components/layout/AppShellPage';
import ScreenPermissionHeaderAction from '@/components/ui/ScreenPermissionHeaderAction';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { hasPermission } from '@/services/accessControl';
import {
  CustomerPackageDetail,
  getCustomerPackageDetail,
} from '@/services/customerPackageService';
import {
  cancelShipment,
  confirmShipmentReceived,
  collectionStatusLabel,
  dispatchShipment,
  getShipmentDetail,
  paymentModeLabel,
  reopenShipment,
  resolveShipmentPackage,
  ShipmentDetail,
  ShipmentPackageLine,
  ShipmentPackageStatus,
  shipmentDeliveryTypeLabel,
  shipmentPackageStatusLabel,
  shipmentStatusLabel,
} from '@/services/shipmentService';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

type NoticeTone = 'success' | 'warning' | 'danger' | 'info';
type NoticeState = {
  tone: NoticeTone;
  title: string;
  message?: string;
} | null;

type ConfirmAction = 'dispatch' | 'receive' | 'cancel' | 'reopen';
type TimelineStep = {
  label: string;
  value: string;
  done: boolean;
  tone?: NoticeTone;
};

function money(value?: number | null) {
  return `$${Number(value ?? 0).toFixed(2)} MXN`;
}

function formatDate(value?: string | null) {
  if (!value) return 'Pendiente';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function packageDeliveryTypeLabel(type?: string | null) {
  if (type === 'PARCEL_SERVICE') return 'Paqueteria';
  if (type === 'LOCAL_DELIVERY') return 'Entrega local';
  if (type === 'STORE_PICKUP') return 'Recoleccion en tienda';
  if (type === 'CUSTOMER_PROVIDED_LABEL') return 'Cliente envia guia';
  if (type === 'COLLECT_SHIPPING') return 'Envio por cobrar';
  if (type === 'OTHER') return 'Otro';
  return type || 'Sin tipo';
}

function addressSourceLabel(source?: string | null) {
  if (source === 'CUSTOMER_PRIMARY_ADDRESS') return 'Direccion principal';
  if (source === 'CUSTOMER_SAVED_ADDRESS') return 'Direccion guardada';
  if (source === 'CUSTOM_PACKAGE_ADDRESS') return 'Direccion de este paquete';
  if (source === 'PICKUP_NO_ADDRESS') return 'Recoleccion en tienda';
  if (source === 'CUSTOMER_PROVIDED_LABEL') return 'Cliente envia guia';
  if (source === 'LOCAL_DELIVERY') return 'Entrega local';
  return source || 'Sin fuente';
}

function formatPackageAddress(customerPackage?: CustomerPackageDetail | null) {
  const parts = [
    customerPackage?.shipToLine1,
    customerPackage?.shipToLine2,
    customerPackage?.shipToCity,
    customerPackage?.shipToState,
    customerPackage?.shipToPostalCode,
    customerPackage?.shipToCountry,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Sin direccion';
}

function formatLineAddress(line: ShipmentPackageLine, customerPackage?: CustomerPackageDetail | null) {
  if (line.deliveryAddressText) return line.deliveryAddressText;
  if (customerPackage) {
    const snapshot = formatPackageAddress(customerPackage);
    if (snapshot !== 'Sin direccion') return snapshot;
  }
  return line.deliveryAddressLabel || (line.deliveryAddressId ? `Direccion #${line.deliveryAddressId}` : 'Sin direccion');
}

function packageStatusLabel(status?: string | null) {
  if (status === 'READY') return 'Listo para envio';
  if (status === 'OPEN') return 'Abierto';
  if (status === 'SHIPPED') return 'Enviado';
  if (status === 'DELIVERED') return 'Entregado';
  if (status === 'CANCELLED') return 'Cancelado';
  return status || 'Sin estado';
}

function paymentStatusLabel(status?: string | null) {
  if (status === 'PAID') return 'Pagado';
  if (status === 'PARTIAL') return 'Parcial';
  if (status === 'PENDING') return 'Pendiente';
  if (status === 'UNPAID') return 'Sin pago';
  return status || 'Sin estado';
}

function shippingCostLabel(line: ShipmentPackageLine, customerPackage?: CustomerPackageDetail | null) {
  if (line.shippingCollect || customerPackage?.shippingCollect) return 'Por cobrar';
  if (line.customerProvidedLabel || customerPackage?.customerProvidedLabel) return 'Cliente envia guia';
  if (line.shippingCostWaived || customerPackage?.shippingCostWaived) return 'Sin costo';
  return money(line.shippingCostAmount ?? customerPackage?.shippingCostAmount);
}

function requiresGuide(detail: ShipmentDetail) {
  return detail.deliveryType === 'CARRIER';
}

function getEffectiveGuide(detail: ShipmentDetail | null, packageDetails: Record<number, CustomerPackageDetail>) {
  if (!detail) return '';
  const shipmentGuide = detail.guideReference?.trim();
  if (shipmentGuide) return shipmentGuide;

  for (const line of detail.packages) {
    const packageGuide = packageDetails[line.customerPackageId]?.trackingNumber?.trim();
    if (packageGuide) return packageGuide;
  }

  return '';
}

function getDeliveredAt(detail: ShipmentDetail) {
  const dates = detail.packages
    .map((line) => line.deliveredAt)
    .filter((value): value is string => Boolean(value));
  return dates[0] ?? null;
}

function completedOrPending(dateValue?: string | null, isDone?: boolean) {
  if (dateValue) return formatDate(dateValue);
  return isDone ? 'Completado' : 'Pendiente';
}

function buildShipmentTimeline(detail: ShipmentDetail, effectiveGuide: string): TimelineStep[] {
  const deliveredAt = getDeliveredAt(detail);
  const isCancelled = detail.status === 'CANCELLED';
  const isDelivered = detail.status === 'DELIVERED';
  const isInTransit = detail.status === 'OUT_FOR_DELIVERY';
  const hasGuideValue = Boolean(effectiveGuide);
  const showGuideStep = hasGuideValue || detail.deliveryType === 'CARRIER';

  if (isCancelled) {
    const cancelledSteps: TimelineStep[] = [
      { label: 'Envío creado', value: formatDate(detail.createdAt), done: Boolean(detail.createdAt) },
    ];

    if (hasGuideValue) {
      cancelledSteps.push({ label: 'Guía registrada', value: effectiveGuide, done: true });
    }

    cancelledSteps.push({
      label: 'Cancelado',
      value: formatDate(detail.cancelledAt),
      done: true,
      tone: 'danger',
    });

    return cancelledSteps;
  }

  const steps: TimelineStep[] = [
    { label: 'Envío creado', value: formatDate(detail.createdAt), done: Boolean(detail.createdAt) },
  ];

  if (showGuideStep) {
    steps.push({ label: 'Guía registrada', value: effectiveGuide || 'Pendiente', done: hasGuideValue });
  }

  const sentDone = Boolean(detail.dispatchedAt) || isInTransit || isDelivered || detail.status === 'CLOSED_WITH_INCIDENTS';
  steps.push({
    label: 'Marcado enviado',
    value: completedOrPending(detail.dispatchedAt, sentDone),
    done: sentDone,
  });

  if (detail.status === 'CLOSED_WITH_INCIDENTS') {
    steps.push({
      label: 'Resuelto con incidencias',
      value: completedOrPending(deliveredAt, true),
      done: true,
      tone: 'warning',
    });
    return steps;
  }

  const receivedDone = Boolean(deliveredAt) || isDelivered;
  steps.push({
    label: 'Recibido',
    value: completedOrPending(deliveredAt, receivedDone),
    done: receivedDone,
  });

  return steps;
}

async function fetchPackageDetails(lines: ShipmentPackageLine[]) {
  const entries = await Promise.all(
    lines.map(async (line) => {
      try {
        const customerPackage = await getCustomerPackageDetail(line.customerPackageId);
        return [line.customerPackageId, customerPackage] as const;
      } catch {
        return [line.customerPackageId, null] as const;
      }
    })
  );

  return entries.reduce<Record<number, CustomerPackageDetail>>((acc, [packageId, customerPackage]) => {
    if (customerPackage) {
      acc[packageId] = customerPackage;
    }
    return acc;
  }, {});
}

export default function ShipmentDetailScreen() {
  const router = useRouter();
  const { id, returnTo } = useLocalSearchParams<{
    id?: string | string[];
    returnTo?: string | string[];
  }>();
  const shipmentId = id ? Number(Array.isArray(id) ? id[0] : id) : null;
  const returnRoute = Array.isArray(returnTo) ? returnTo[0] : returnTo;
  const backRoute = returnRoute || '/shipments';
  const backTitle = backRoute.includes('/shipments') ? 'Volver a Envios' : 'Volver';
  const { theme } = useAppTheme();

  const [session, setSession] = useState<UserSession | null>(null);
  const [detail, setDetail] = useState<ShipmentDetail | null>(null);
  const [packageDetails, setPackageDetails] = useState<Record<number, CustomerPackageDetail>>({});
  const [notice, setNotice] = useState<NoticeState>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);

  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [selectedLine, setSelectedLine] = useState<ShipmentPackageLine | null>(null);

  const [resolutionStatus, setResolutionStatus] = useState<ShipmentPackageStatus>('DELIVERED');
  const [collectedAmount, setCollectedAmount] = useState('');
  const [collectionNotes, setCollectionNotes] = useState('');
  const [receivedNotes, setReceivedNotes] = useState('');

  const updateDetail = useCallback(async (shipmentDetail: ShipmentDetail) => {
    setDetail(shipmentDetail);
    const relatedPackages = await fetchPackageDetails(shipmentDetail.packages ?? []);
    setPackageDetails(relatedPackages);
  }, []);

  const loadData = useCallback(async () => {
    if (!shipmentId) {
      setNotice({
        tone: 'danger',
        title: 'No se recibio el id del envio.',
        message: 'Regresa a la bandeja de Envios y abre un registro valido.',
      });
      router.replace('/shipments');
      return;
    }

    try {
      setIsLoading(true);
      const currentSession = await getSession();

      if (!currentSession) {
        router.replace('/login');
        return;
      }

      setSession(currentSession);
      const shipmentDetail = await getShipmentDetail(shipmentId);
      await updateDetail(shipmentDetail);
    } catch (error: any) {
      setNotice({
        tone: 'danger',
        title: 'No se pudo cargar el envio.',
        message: error.message || 'Intenta de nuevo o vuelve a la bandeja.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [router, shipmentId, updateDetail]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const canManageShipments = hasPermission(session, 'MANAGE_SHIPMENTS');
  const canViewPackages = hasPermission(session, 'CREATE_CLOSE_CUSTOMER_PACKAGE');
  const effectiveGuide = useMemo(() => getEffectiveGuide(detail, packageDetails), [detail, packageDetails]);
  const hasGuide = Boolean(effectiveGuide);
  const canResolve = detail?.status === 'OUT_FOR_DELIVERY';
  const canCancel = detail?.status === 'OPEN';
  const canReopen = detail?.status === 'CANCELLED' || detail?.status === 'CLOSED_WITH_INCIDENTS';
  const pendingLine = detail?.packages.find((line) => line.status === 'PENDING') ?? null;
  const primaryLine = detail?.packages[0] ?? null;
  const primaryPackage = primaryLine ? packageDetails[primaryLine.customerPackageId] : null;
  const packageCount = detail?.packages.length ?? 0;
  const itemCount = detail?.packages.reduce((total, line) => {
    const customerPackage = packageDetails[line.customerPackageId];
    return total + (customerPackage?.items?.length ?? 0);
  }, 0) ?? 0;
  const customerName = primaryLine?.customerName || primaryPackage?.customerName || 'Cliente no indicado';

  const dispatchBlockedReason = useMemo(() => {
    if (!detail) return 'No se ha cargado el envio.';
    if (!canManageShipments) return 'No tienes permiso para marcar envios. Permiso requerido: MANAGE_SHIPMENTS.';
    if (isWorking) return 'Espera a que termine la accion actual.';
    if (detail.status !== 'OPEN') return 'Solo los envios abiertos pueden marcarse como enviados.';
    if (detail.packages.length === 0) return 'Agrega al menos un paquete antes de marcar enviado.';
    if (requiresGuide(detail) && !hasGuide) return 'Captura la guia o referencia antes de marcar como enviado.';
    return null;
  }, [canManageShipments, detail, hasGuide, isWorking]);

  const receiveBlockedReason = useMemo(() => {
    if (!detail) return 'No se ha cargado el envio.';
    if (!canManageShipments) return 'No tienes permiso para confirmar recibido. Permiso requerido: MANAGE_SHIPMENTS.';
    if (isWorking) return 'Espera a que termine la accion actual.';
    if (detail.status === 'DELIVERED') return 'Este envio ya fue confirmado como recibido.';
    if (detail.status === 'CANCELLED') return 'No puedes confirmar recibido en un envio cancelado.';
    if (detail.status === 'CLOSED_WITH_INCIDENTS') return 'No puedes confirmar recibido en un envio cerrado con incidencias.';
    if (detail.status !== 'OUT_FOR_DELIVERY') return 'El envio debe estar marcado como enviado antes de confirmar recibido.';
    if (detail.packages.length === 0) return 'El envio no tiene paquete relacionado.';
    if (!pendingLine) return 'Este envio ya no tiene paquetes pendientes por recibir.';
    if (detail.packages.some((line) => line.status === 'PENDING' && line.paymentMode === 'COD')) {
      return 'Este envio tiene cobro contra entrega. Resuelve la entrega capturando el monto cobrado.';
    }
    return null;
  }, [canManageShipments, detail, isWorking, pendingLine]);

  const cancelBlockedReason = useMemo(() => {
    if (!detail) return 'No se ha cargado el envio.';
    if (!canManageShipments) return 'No tienes permiso para cancelar envios. Permiso requerido: MANAGE_SHIPMENTS.';
    if (isWorking) return 'Espera a que termine la accion actual.';
    if (detail.status === 'CANCELLED') return 'Este envio ya esta cancelado.';
    if (detail.status === 'OUT_FOR_DELIVERY') return 'No puedes cancelar un envio que ya fue marcado como enviado.';
    if (detail.status === 'DELIVERED' || detail.status === 'CLOSED_WITH_INCIDENTS') {
      return 'No puedes cancelar un envio finalizado.';
    }
    if (detail.status !== 'OPEN') return 'Este envio no puede cancelarse en su estado actual.';
    return null;
  }, [canManageShipments, detail, isWorking]);

  const reopenBlockedReason = useMemo(() => {
    if (!detail) return 'No se ha cargado el envio.';
    if (!canManageShipments) return 'No tienes permiso para reabrir envios. Permiso requerido: MANAGE_SHIPMENTS.';
    if (isWorking) return 'Espera a que termine la accion actual.';
    if (detail.status !== 'CANCELLED' && detail.status !== 'CLOSED_WITH_INCIDENTS') {
      return 'Solo puedes reabrir envios cancelados o cerrados con incidencias.';
    }
    return null;
  }, [canManageShipments, detail, isWorking]);

  const nextStep = useMemo(() => {
    if (!detail) {
      return {
        tone: 'warning' as NoticeTone,
        title: 'Envio no cargado',
        message: 'Vuelve a la bandeja e intenta abrir el detalle nuevamente.',
      };
    }

    if (!canManageShipments) {
      return {
        tone: 'warning' as NoticeTone,
        title: 'Solo lectura',
        message: 'No tienes MANAGE_SHIPMENTS para modificar este envio.',
      };
    }

    if (detail.status === 'OPEN') {
      if (detail.packages.length === 0) {
        return {
          tone: 'warning' as NoticeTone,
          title: 'Envio sin paquete asociado',
          message: 'Este envio no puede operarse hasta corregirse o cancelarse. No se puede marcar enviado ni recibido.',
        };
      }

      if (requiresGuide(detail) && !hasGuide) {
        return {
          tone: 'warning' as NoticeTone,
          title: 'Capturar guia',
          message: 'Este envio por paqueteria necesita guia o referencia antes de marcarse enviado.',
        };
      }

      return {
        tone: 'success' as NoticeTone,
        title: 'Listo para enviar',
        message: 'El envio tiene paquetes y datos minimos. Puedes marcarlo como enviado.',
      };
    }

    if (detail.status === 'OUT_FOR_DELIVERY') {
      return {
        tone: 'info' as NoticeTone,
        title: 'Confirmar recibido',
        message: receiveBlockedReason
          ? receiveBlockedReason
          : 'Confirma la recepcion cuando el cliente haya recibido el paquete.',
      };
    }

    if (detail.status === 'DELIVERED') {
      return {
        tone: 'success' as NoticeTone,
        title: 'Entrega registrada',
        message: 'El envio ya fue marcado como entregado. Revisa el paquete relacionado si necesitas cerrar ciclo.',
      };
    }

    if (detail.status === 'CANCELLED') {
      return {
        tone: 'danger' as NoticeTone,
        title: 'Envio cancelado',
        message: 'Este envio no tiene acciones operativas salvo reabrirlo con permiso.',
      };
    }

    return {
      tone: 'info' as NoticeTone,
      title: shipmentStatusLabel(detail.status),
      message: 'Revisa el estado y las acciones disponibles.',
    };
  }, [canManageShipments, detail, hasGuide, receiveBlockedReason]);

  const openConfirmation = (action: ConfirmAction, blockedReason?: string | null) => {
    if (!detail || !session) return;

    if (blockedReason) {
      setNotice({
        tone: 'warning',
        title: 'Accion no disponible',
        message: blockedReason,
      });
      return;
    }

    setConfirmAction(action);
  };

  const handleDispatch = () => {
    openConfirmation('dispatch', dispatchBlockedReason);
  };

  const handleReceive = () => {
    setReceivedNotes('');
    openConfirmation('receive', receiveBlockedReason);
  };

  const handleCancel = () => {
    openConfirmation('cancel', cancelBlockedReason);
  };

  const handleReopen = () => {
    openConfirmation('reopen', reopenBlockedReason);
  };

  const closeConfirmation = () => {
    if (!isWorking) {
      setConfirmAction(null);
      setReceivedNotes('');
    }
  };

  const handleConfirmAction = async () => {
    if (!detail || !session || !confirmAction) return;

    const blockedReason =
      confirmAction === 'dispatch'
        ? dispatchBlockedReason
        : confirmAction === 'receive'
          ? receiveBlockedReason
        : confirmAction === 'cancel'
          ? cancelBlockedReason
          : reopenBlockedReason;

    if (blockedReason) {
      setNotice({
        tone: 'warning',
        title: 'Accion no disponible',
        message: blockedReason,
      });
      setConfirmAction(null);
      return;
    }

    try {
      setIsWorking(true);
      const updated =
        confirmAction === 'dispatch'
          ? await dispatchShipment(detail.id, session.userId)
          : confirmAction === 'receive'
            ? await confirmShipmentReceived(detail.id, {
                deliveryConfirmedByUserId: session.userId,
                notes: receivedNotes.trim() || null,
              })
          : confirmAction === 'cancel'
            ? await cancelShipment(detail.id, session.userId)
            : await reopenShipment(detail.id, session.userId);

      await updateDetail(updated);
      setConfirmAction(null);
      setReceivedNotes('');
      setNotice(
        confirmAction === 'dispatch'
          ? {
              tone: 'success',
              title: 'Envio marcado como enviado.',
              message: 'La linea de tiempo se actualizo. Ahora puedes confirmar recibido cuando se complete la entrega.',
            }
          : confirmAction === 'receive'
            ? {
                tone: 'success',
                title: 'Recepcion confirmada correctamente.',
                message: 'El envio y el paquete relacionado quedaron como entregados. El cierre operativo del paquete queda separado.',
              }
          : confirmAction === 'cancel'
            ? {
                tone: 'success',
                title: 'Envio cancelado.',
                message: 'El estado se actualizo correctamente.',
              }
            : {
                tone: 'success',
                title: 'Envio reabierto.',
                message: 'Ya puedes continuar el flujo operativo.',
              }
      );
    } catch (error: any) {
      setNotice({
        tone: 'danger',
        title:
          confirmAction === 'dispatch'
            ? 'No se pudo marcar enviado.'
            : confirmAction === 'receive'
              ? 'No se pudo confirmar recibido.'
            : confirmAction === 'cancel'
              ? 'No se pudo cancelar el envio.'
              : 'No se pudo reabrir el envio.',
        message: error.message || 'Intenta de nuevo.',
      });
    } finally {
      setIsWorking(false);
    }
  };

  const openResolveModal = (line: ShipmentPackageLine, status: ShipmentPackageStatus) => {
    setSelectedLine(line);
    setResolutionStatus(status);
    setCollectedAmount(
      line.paymentMode === 'COD' && status === 'DELIVERED'
        ? String(line.expectedCollectionAmount ?? '')
        : '0'
    );
    setCollectionNotes('');
    setResolveModalVisible(true);
  };

  const handleResolve = async () => {
    if (!detail || !session || !selectedLine) return;

    const amount = collectedAmount.trim() ? Number(collectedAmount) : 0;
    if (Number.isNaN(amount) || amount < 0) {
      setNotice({
        tone: 'warning',
        title: 'Monto invalido',
        message: 'Captura un monto cobrado valido.',
      });
      return;
    }

    if (selectedLine.paymentMode === 'COD' && resolutionStatus === 'DELIVERED' && amount <= 0) {
      setNotice({
        tone: 'warning',
        title: 'Cobro contra entrega requerido',
        message: 'El cobro contra entrega debe ser mayor a 0.',
      });
      return;
    }

    try {
      setIsWorking(true);
      const updated = await resolveShipmentPackage(detail.id, selectedLine.id, {
        status: resolutionStatus,
        collectedAmount: amount,
        collectionNotes: collectionNotes.trim() || null,
        deliveryConfirmedByUserId: session.userId,
      });

      await updateDetail(updated);
      setResolveModalVisible(false);
      setSelectedLine(null);
      setNotice({
        tone: 'success',
        title: resolutionStatus === 'DELIVERED' ? 'Recepcion confirmada correctamente.' : 'Entrega actualizada.',
        message: 'El estado del envio se actualizo con el resultado registrado.',
      });
    } catch (error: any) {
      setNotice({
        tone: 'danger',
        title: 'No se pudo resolver la entrega.',
        message: error.message,
      });
    } finally {
      setIsWorking(false);
    }
  };

  const goBack = () => {
    router.replace(backRoute as any);
  };

  const openPackageDetail = (customerPackageId: number) => {
    if (!detail) return;
    const shipmentReturn = `/shipment-detail?id=${detail.id}&returnTo=${encodeURIComponent(backRoute)}`;
    router.push(`/customer-package-detail?id=${customerPackageId}&returnTo=${encodeURIComponent(shipmentReturn)}` as any);
  };

  const renderNotice = (currentNotice: NoticeState) => {
    if (!currentNotice) return null;
    return (
      <AppCard variant={currentNotice.tone}>
        <AppText bold color={currentNotice.tone === 'danger' ? theme.colors.danger : undefined}>
          {currentNotice.title}
        </AppText>
        {currentNotice.message ? (
          <AppText color={theme.colors.mutedText}>{currentNotice.message}</AppText>
        ) : null}
      </AppCard>
    );
  };

  const renderMetric = (label: string, value: string, tone?: NoticeTone) => {
    const toneColor =
      tone === 'warning'
        ? theme.colors.warning
        : tone === 'success'
          ? theme.colors.success
          : tone === 'danger'
            ? theme.colors.danger
            : tone === 'info'
              ? theme.colors.info
              : theme.colors.text;

    return (
      <View style={[styles.metricCard, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.borderSubtle }]}>
        <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
          {label}
        </AppText>
        <AppText bold color={toneColor} numberOfLines={1}>
          {value}
        </AppText>
      </View>
    );
  };

  const renderStatusHero = () => {
    if (!detail) return null;
    const tone =
      nextStep.tone === 'danger'
        ? theme.colors.danger
        : nextStep.tone === 'warning'
          ? theme.colors.warning
          : nextStep.tone === 'success'
            ? theme.colors.success
            : theme.colors.info;

    return (
      <AppCard variant={nextStep.tone}>
        <View style={styles.heroHeader}>
          <View style={styles.heroTitleBlock}>
            <AppText variant="caption" color={theme.colors.mutedText} bold>
              Estado actual
            </AppText>
            <AppText variant="title" color={tone}>
              {shipmentStatusLabel(detail.status)}
            </AppText>
            <AppText color={theme.colors.mutedText}>
              {nextStep.title}. {nextStep.message}
            </AppText>
          </View>
          <View style={[styles.statusBadge, { borderColor: tone, backgroundColor: theme.colors.surfaceAlt }]}>
            <AppText variant="caption" bold color={tone} numberOfLines={1}>
              {shipmentDeliveryTypeLabel(detail.deliveryType)}
            </AppText>
          </View>
        </View>
        <View style={styles.metricGrid}>
          {renderMetric('Paquetes', String(packageCount), packageCount > 0 ? 'success' : 'warning')}
          {renderMetric('Prendas', String(itemCount), itemCount > 0 ? 'success' : 'warning')}
          {renderMetric('Guia', effectiveGuide || 'Pendiente', requiresGuide(detail) && !hasGuide ? 'warning' : 'success')}
          {renderMetric('Creado', formatDate(detail.createdAt), 'info')}
        </View>
      </AppCard>
    );
  };

  const renderDestination = () => {
    if (!detail) return null;

    return (
      <AppCard>
        <View style={styles.sectionHeader}>
          <View>
            <AppText variant="subtitle" bold>
              Destino
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              Direccion snapshot desde paquete/envio.
            </AppText>
          </View>
        </View>

        {detail.packages.length === 0 ? (
          <AppText color={theme.colors.mutedText}>Este envio aun no tiene destino porque no tiene paquetes.</AppText>
        ) : (
          <View style={styles.compactStack}>
            {detail.packages.map((line) => {
              const customerPackage = packageDetails[line.customerPackageId];
              const addressText = formatLineAddress(line, customerPackage);
              const deliveryType = line.deliveryType || customerPackage?.deliveryType;
              const noAddressRequired =
                deliveryType === 'STORE_PICKUP' ||
                deliveryType === 'CUSTOMER_PROVIDED_LABEL';

              return (
                <View
                  key={line.id}
                  style={[styles.infoPanel, { borderColor: theme.colors.borderSubtle, backgroundColor: theme.colors.surfaceAlt }]}
                >
                  <View style={styles.rowBetween}>
                    <View style={styles.flex1}>
                      <AppText bold>{line.recipientName || customerPackage?.shipToName || line.customerName || customerPackage?.customerName || 'Recibe no indicado'}</AppText>
                      <AppText variant="caption" color={theme.colors.mutedText}>
                        {line.recipientPhone || customerPackage?.shipToPhone || customerPackage?.customerPhone || 'Sin telefono'}
                      </AppText>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                      <AppText variant="caption" bold color={theme.colors.accent}>
                        {packageDeliveryTypeLabel(deliveryType)}
                      </AppText>
                    </View>
                  </View>
                  <AppText color={noAddressRequired ? theme.colors.mutedText : theme.colors.text}>
                    {noAddressRequired ? 'No requiere direccion de envio.' : addressText}
                  </AppText>
                  {line.deliveryReferences || customerPackage?.shipToReferences ? (
                    <AppText variant="caption" color={theme.colors.mutedText}>
                      Referencias: {line.deliveryReferences || customerPackage?.shipToReferences}
                    </AppText>
                  ) : null}
                  <AppText variant="caption" color={theme.colors.mutedText}>
                    Fuente: {addressSourceLabel(line.shippingAddressSource || customerPackage?.shippingAddressSource)}
                  </AppText>
                </View>
              );
            })}
          </View>
        )}
      </AppCard>
    );
  };

  const renderGuide = () => {
    if (!detail) return null;
    const firstLine = detail.packages[0];
    const firstPackage = firstLine ? packageDetails[firstLine.customerPackageId] : null;
    const guide = effectiveGuide;
    const carrier = firstPackage?.shippingCarrier || (detail.deliveryType === 'LOCAL' ? 'Local' : null);

    return (
      <AppCard>
        <AppText variant="subtitle" bold>
          Paqueteria y guia
        </AppText>
        <View style={styles.detailGrid}>
          {renderMetric('Paqueteria', carrier || 'Pendiente', carrier ? 'success' : 'warning')}
          {renderMetric('Guia / referencia', guide || 'Pendiente', guide ? 'success' : 'warning')}
          {renderMetric('Costo envio', firstLine ? shippingCostLabel(firstLine, firstPackage) : 'Sin paquete', 'info')}
          {renderMetric('Cobro', firstLine ? paymentModeLabel(firstLine.paymentMode) : 'Sin paquete', 'info')}
        </View>

        {requiresGuide(detail) && !effectiveGuide ? (
          <View style={[styles.inlineNotice, { borderColor: theme.colors.warning, backgroundColor: theme.colors.surfaceAlt }]}>
            <AppText variant="caption" bold color={theme.colors.warning}>
              Captura la guia antes de marcar enviado.
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              En esta version la guia se define al preparar o crear el envio desde la bandeja. Este detalle bloquea el despacho para evitar una salida sin referencia.
            </AppText>
          </View>
        ) : null}
      </AppCard>
    );
  };

  const renderPackage = (line: ShipmentPackageLine) => {
    const customerPackage = packageDetails[line.customerPackageId];
    return (
      <View
        key={line.id}
        style={[styles.packageCard, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.borderSubtle }]}
      >
        <View style={styles.rowBetween}>
          <View style={styles.flex1}>
            <AppText bold>{line.customerPackageFolio || customerPackage?.folio || `Paquete #${line.customerPackageId}`}</AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {line.customerName || customerPackage?.customerName || `Cliente #${line.customerId}`}
            </AppText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <AppText variant="caption" bold color={theme.colors.accent}>
              {shipmentPackageStatusLabel(line.status)}
            </AppText>
          </View>
        </View>

        <View style={styles.detailGrid}>
          {renderMetric('Total paquete', money(customerPackage?.totalAmount), 'info')}
          {renderMetric('Envio', shippingCostLabel(line, customerPackage), 'info')}
          {renderMetric('Pago', paymentStatusLabel(customerPackage?.paymentStatus), customerPackage?.paymentStatus === 'PAID' ? 'success' : 'warning')}
          {renderMetric('Estado paquete', packageStatusLabel(customerPackage?.status), 'info')}
        </View>

        <View style={styles.packageActions}>
          <AppButton
            title="Ver paquete"
            variant="secondary"
            onPress={() => openPackageDetail(line.customerPackageId)}
            disabled={!canViewPackages}
            disabledReason="No tienes permiso para ver paquetes. Permiso requerido: CREATE_CLOSE_CUSTOMER_PACKAGE."
            style={styles.smallActionButton}
          />
          {canResolve && line.status === 'PENDING' ? (
            <>
              <AppButton
                title="Confirmar recibido"
                onPress={() => openResolveModal(line, 'DELIVERED')}
                disabled={!canManageShipments || isWorking}
                disabledReason="No tienes permiso para confirmar entrega. Permiso requerido: MANAGE_SHIPMENTS."
                style={styles.smallActionButton}
              />
              <AppButton
                title="No entregado"
                variant="secondary"
                onPress={() => openResolveModal(line, 'NOT_DELIVERED')}
                disabled={!canManageShipments || isWorking}
                disabledReason="No tienes permiso para confirmar entrega. Permiso requerido: MANAGE_SHIPMENTS."
                style={styles.smallActionButton}
              />
              <AppButton
                title="Devuelto"
                variant="secondary"
                onPress={() => openResolveModal(line, 'RETURNED')}
                disabled={!canManageShipments || isWorking}
                disabledReason="No tienes permiso para confirmar entrega. Permiso requerido: MANAGE_SHIPMENTS."
                style={styles.smallActionButton}
              />
            </>
          ) : null}
        </View>

        {line.status !== 'PENDING' ? (
          <View style={[styles.inlineNotice, { borderColor: theme.colors.borderSubtle, backgroundColor: theme.colors.surface }]}>
            <AppText variant="caption" color={theme.colors.mutedText}>
              Cobrado: {money(line.collectedAmount)} - Diferencia: {money(line.collectionDifference)} - Resultado: {collectionStatusLabel(line.collectionStatus)}
            </AppText>
            {line.collectionNotes ? (
              <AppText variant="caption" color={theme.colors.mutedText}>
                Notas: {line.collectionNotes}
              </AppText>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  };

  const renderPackages = () => {
    if (!detail) return null;
    return (
      <AppCard>
        <View style={styles.sectionHeader}>
          <View>
            <AppText variant="subtitle" bold>
              Paquete relacionado
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              Total, pago, costo de envio y estado del paquete.
            </AppText>
          </View>
        </View>
        {detail.packages.length === 0 ? (
          <AppText color={theme.colors.mutedText}>Este envio todavia no tiene paquetes asociados.</AppText>
        ) : (
          <View style={styles.compactStack}>{detail.packages.map(renderPackage)}</View>
        )}
      </AppCard>
    );
  };

  const renderItems = () => {
    if (!detail) return null;
    const itemLines = detail.packages.flatMap((line) => {
      const customerPackage = packageDetails[line.customerPackageId];
      return (customerPackage?.items ?? []).map((item) => ({
        ...item,
        packageFolio: line.customerPackageFolio || customerPackage?.folio || `Paquete #${line.customerPackageId}`,
      }));
    });

    return (
      <AppCard>
        <View style={styles.sectionHeader}>
          <View>
            <AppText variant="subtitle" bold>
              Prendas incluidas
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              Prendas del paquete que viaja en este envio.
            </AppText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border }]}>
            <AppText variant="caption" bold>
              {itemLines.length}
            </AppText>
          </View>
        </View>

        {itemLines.length === 0 ? (
          <AppText color={theme.colors.mutedText}>
            No se encontraron prendas asociadas en el detalle cargado. Abre el paquete para revisar su contenido.
          </AppText>
        ) : (
          <View style={styles.itemList}>
            {itemLines.map((item) => (
              <View key={`${item.packageFolio}-${item.id}`} style={[styles.itemRow, { borderColor: theme.colors.borderSubtle }]}>
                <View style={styles.flex1}>
                  <AppText bold numberOfLines={1}>
                    {item.itemCode || item.itemQrCode || `Prenda #${item.itemId}`}
                  </AppText>
                  <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
                    {[item.productType, item.size, item.brand].filter(Boolean).join(' - ') || item.packageFolio}
                  </AppText>
                </View>
                <View style={styles.itemAmount}>
                  <AppText bold>{money(item.price)}</AppText>
                  <AppText variant="caption" color={theme.colors.mutedText}>
                    {item.itemStatus || 'Sin estado'}
                  </AppText>
                </View>
              </View>
            ))}
          </View>
        )}
      </AppCard>
    );
  };

  const renderTimeline = () => {
    if (!detail) return null;
    const steps = buildShipmentTimeline(detail, effectiveGuide);

    return (
      <AppCard>
        <AppText variant="subtitle" bold>
          Línea de tiempo
        </AppText>
        <View style={styles.timeline}>
          {steps.map((step) => {
            const stepColor =
              step.tone === 'danger'
                ? theme.colors.danger
                : step.tone === 'warning'
                  ? theme.colors.warning
                  : theme.colors.success;

            return (
              <View key={step.label} style={styles.timelineRow}>
                <View
                  style={[
                    styles.timelineDot,
                    {
                      backgroundColor: step.done ? stepColor : theme.colors.surfaceAlt,
                      borderColor: step.done ? stepColor : theme.colors.border,
                    },
                  ]}
                />
                <View style={styles.flex1}>
                  <AppText
                    bold={step.done}
                    color={step.done && step.tone === 'danger' ? theme.colors.danger : undefined}
                  >
                    {step.label}
                  </AppText>
                  <AppText variant="caption" color={theme.colors.mutedText}>
                    {step.value}
                  </AppText>
                </View>
              </View>
            );
          })}
        </View>
      </AppCard>
    );
  };

  const renderActions = () => {
    if (!detail) return null;
    const isOutForDelivery = detail.status === 'OUT_FOR_DELIVERY';

    if (packageCount === 0) {
      return (
        <AppCard>
          <AppText variant="subtitle" bold>
            Acciones
          </AppText>
          <View style={styles.actionStack}>
            <AppCard variant="warning">
              <AppText bold>Envio sin paquete asociado</AppText>
              <AppText color={theme.colors.mutedText}>
                No puede marcarse enviado ni recibido. Cancela este envio invalido si ya no corresponde a un paquete real.
              </AppText>
            </AppCard>

            {canCancel ? (
              <AppButton
                title="Cancelar envio invalido"
                variant="danger"
                onPress={handleCancel}
                loading={isWorking}
                disabled={Boolean(cancelBlockedReason)}
                disabledReason={cancelBlockedReason || undefined}
              />
            ) : null}
          </View>
        </AppCard>
      );
    }

    return (
      <AppCard>
        <AppText variant="subtitle" bold>
          Acciones
        </AppText>
        <View style={styles.actionStack}>
          {detail.status === 'OPEN' ? (
            <AppButton
              title="Marcar enviado"
              onPress={handleDispatch}
              loading={isWorking}
              disabled={Boolean(dispatchBlockedReason)}
              disabledReason={dispatchBlockedReason || undefined}
            />
          ) : null}

          {isOutForDelivery ? (
            <AppButton
              title="Confirmar recibido"
              onPress={handleReceive}
              loading={isWorking}
              disabled={Boolean(receiveBlockedReason)}
              disabledReason={receiveBlockedReason || undefined}
            />
          ) : null}

          {primaryLine ? (
            <AppButton
              title="Ver paquete"
              variant="secondary"
              onPress={() => openPackageDetail(primaryLine.customerPackageId)}
              disabled={!canViewPackages}
              disabledReason="No tienes permiso para ver paquetes. Permiso requerido: CREATE_CLOSE_CUSTOMER_PACKAGE."
            />
          ) : null}

          {canCancel ? (
            <AppButton
              title="Cancelar envio"
              variant="danger"
              onPress={handleCancel}
              loading={isWorking}
              disabled={Boolean(cancelBlockedReason)}
              disabledReason={cancelBlockedReason || undefined}
            />
          ) : null}

          {canReopen ? (
            <AppButton
              title="Reabrir envio"
              onPress={handleReopen}
              loading={isWorking}
              disabled={Boolean(reopenBlockedReason)}
              disabledReason={reopenBlockedReason || undefined}
            />
          ) : null}

          {detail.status === 'OPEN' && dispatchBlockedReason ? (
            <View style={[styles.inlineNotice, { borderColor: theme.colors.warning, backgroundColor: theme.colors.surfaceAlt }]}>
              <AppText variant="caption" bold color={theme.colors.warning}>
                Marcar enviado bloqueado
              </AppText>
              <AppText variant="caption" color={theme.colors.mutedText}>
                {dispatchBlockedReason}
              </AppText>
            </View>
          ) : null}

          {isOutForDelivery && receiveBlockedReason ? (
            <View style={[styles.inlineNotice, { borderColor: theme.colors.warning, backgroundColor: theme.colors.surfaceAlt }]}>
              <AppText variant="caption" bold color={theme.colors.warning}>
                Confirmar recibido bloqueado
              </AppText>
              <AppText variant="caption" color={theme.colors.mutedText}>
                {receiveBlockedReason}
              </AppText>
            </View>
          ) : null}
        </View>
      </AppCard>
    );
  };

  const confirmationCopy = (() => {
    if (!detail || !confirmAction) return null;

    if (confirmAction === 'dispatch') {
      return {
        title: 'Marcar envio como enviado',
        body: 'Vas a registrar la salida de este envio y moverlo al estado En ruta.',
        warning: 'Esta accion registrara la fecha de envio y actualizara el paquete relacionado.',
        confirmTitle: 'Marcar enviado',
        loadingTitle: 'Marcando...',
        variant: 'primary' as const,
      };
    }

    if (confirmAction === 'receive') {
      return {
        title: 'Confirmar recibido',
        body: 'Confirma esta accion solo cuando el cliente haya recibido el paquete.',
        warning: 'Se registrara la fecha de recepcion y el paquete relacionado quedara como entregado. Pagos, saldo y costo de envio no cambian.',
        confirmTitle: 'Confirmar recibido',
        loadingTitle: 'Confirmando...',
        variant: 'primary' as const,
      };
    }

    if (confirmAction === 'cancel') {
      return {
        title: 'Cancelar envio',
        body: 'Vas a cancelar este envio antes de que salga a ruta.',
        warning: 'El envio dejara de estar disponible para despacho. Reabrelo solo si necesitas continuar el flujo.',
        confirmTitle: 'Cancelar envio',
        loadingTitle: 'Cancelando...',
        variant: 'danger' as const,
      };
    }

    return {
      title: 'Reabrir envio',
      body: 'Vas a reabrir este envio para continuar su operacion.',
      warning: 'El envio volvera a estado abierto cuando backend lo permita.',
      confirmTitle: 'Reabrir envio',
      loadingTitle: 'Reabriendo...',
      variant: 'primary' as const,
    };
  })();

  if (isLoading) {
    return (
      <AppShellPage
        title="Detalle de envio"
        subtitle="Cargando datos operativos"
        activeRoute="shipments"
        compactHeader
      >
        <ActivityIndicator />
      </AppShellPage>
    );
  }

  if (!detail) {
    return (
      <AppShellPage
        title="Detalle de envio"
        subtitle="No se encontro el envio"
        activeRoute="shipments"
        compactHeader
        rightContent={
          <View style={styles.headerActions}>
            <ScreenPermissionHeaderAction
              screenKey="shipmentDetail"
              screenTitle="Detalle de envio"
              session={session}
              buttonStyle={styles.headerButton}
            />
            <AppButton
              title={backTitle}
              variant="secondary"
              onPress={goBack}
              style={styles.headerButton}
            />
          </View>
        }
      >
        {renderNotice(notice)}
        <AppText>No se encontro el envio.</AppText>
      </AppShellPage>
    );
  }

  return (
    <>
      <AppShellPage
        title="Detalle de envio"
        subtitle={`${detail.folio} - ${primaryLine?.customerPackageFolio || primaryPackage?.folio || 'Sin paquete'} - ${customerName}`}
        activeRoute="shipments"
        session={session}
        compactHeader
        rightContent={
          <View style={styles.headerActions}>
            <ScreenPermissionHeaderAction
              screenKey="shipmentDetail"
              screenTitle="Detalle de envio"
              session={session}
              buttonStyle={styles.headerButton}
            />
            <AppButton
              title={backTitle}
              variant="secondary"
              onPress={goBack}
              style={styles.headerButton}
            />
          </View>
        }
      >
        {renderNotice(notice)}
        {renderStatusHero()}

        <View style={styles.layoutGrid}>
          <View style={styles.mainColumn}>
            {renderDestination()}
            {renderPackages()}
            {renderItems()}
          </View>
          <View style={styles.sideColumn}>
            {renderGuide()}
            {renderTimeline()}
            {renderActions()}
          </View>
        </View>
      </AppShellPage>

      <AppBottomModal
        visible={resolveModalVisible}
        title={resolutionStatus === 'DELIVERED' ? 'Confirmar recibido' : 'Resolver entrega'}
        onClose={() => setResolveModalVisible(false)}
      >
        <AppText bold>
          {selectedLine?.customerPackageFolio || 'Paquete'} - {shipmentPackageStatusLabel(resolutionStatus)}
        </AppText>
        <AppText color={theme.colors.mutedText}>
          Registra el resultado de entrega. Los importes COD se comparan contra el monto esperado.
        </AppText>

        <AppInput
          label="Monto cobrado"
          value={collectedAmount}
          onChangeText={setCollectedAmount}
          keyboardType="numeric"
          placeholder="0.00"
        />

        <AppInput
          label="Notas"
          value={collectionNotes}
          onChangeText={setCollectionNotes}
          placeholder="Notas de entrega/cobro"
          multiline
        />

        <AppButton
          title={isWorking ? 'Guardando...' : 'Confirmar'}
          onPress={handleResolve}
          loading={isWorking}
          disabled={isWorking}
          disabledReason="Espera a que termine la operacion."
        />
      </AppBottomModal>

      <AppBottomModal
        visible={Boolean(confirmAction)}
        title={confirmationCopy?.title || 'Confirmar accion'}
        onClose={closeConfirmation}
        footer={
          <View style={styles.confirmFooter}>
            <AppButton
              title="Cancelar"
              variant="cancel"
              onPress={closeConfirmation}
              disabled={isWorking}
              disabledReason="Espera a que termine la operacion."
              style={styles.confirmButton}
            />
            <AppButton
              title={isWorking ? confirmationCopy?.loadingTitle || 'Procesando...' : confirmationCopy?.confirmTitle || 'Confirmar'}
              variant={confirmationCopy?.variant || 'primary'}
              onPress={handleConfirmAction}
              loading={isWorking}
              disabled={isWorking}
              disabledReason="Espera a que termine la operacion."
              style={styles.confirmButton}
            />
          </View>
        }
      >
        <View style={styles.compactStack}>
          <AppText>{confirmationCopy?.body}</AppText>
          <View style={styles.detailGrid}>
            {renderMetric('Cliente', customerName, 'info')}
            {renderMetric('Paquete', primaryLine?.customerPackageFolio || primaryPackage?.folio || 'Sin paquete', primaryLine ? 'success' : 'warning')}
            {renderMetric('Paqueteria', shipmentDeliveryTypeLabel(detail.deliveryType), 'info')}
            {renderMetric('Guia', effectiveGuide || 'Pendiente', effectiveGuide ? 'success' : 'warning')}
          </View>
          {confirmAction === 'receive' ? (
            <AppInput
              label="Nota de recepcion"
              value={receivedNotes}
              onChangeText={setReceivedNotes}
              placeholder="Ej. Cliente confirmo recibido por WhatsApp"
              multiline
            />
          ) : null}
          <View style={[styles.inlineNotice, { borderColor: theme.colors.warning, backgroundColor: theme.colors.surfaceAlt }]}>
            <AppText variant="caption" bold color={theme.colors.warning}>
              Confirmacion requerida
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {confirmationCopy?.warning}
            </AppText>
          </View>
        </View>
      </AppBottomModal>
    </>
  );
}

const styles = StyleSheet.create({
  actionStack: {
    gap: 10,
  },
  confirmButton: {
    flex: 1,
    minWidth: 150,
  },
  confirmFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  compactStack: {
    gap: 10,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  flex1: {
    flex: 1,
    minWidth: 0,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
  },
  headerButton: {
    minWidth: 132,
  },
  heroHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  heroTitleBlock: {
    flex: 1,
    minWidth: 240,
  },
  infoPanel: {
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 12,
  },
  inlineNotice: {
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    marginTop: 12,
    padding: 10,
  },
  itemAmount: {
    alignItems: 'flex-end',
    minWidth: 120,
  },
  itemList: {
    gap: 8,
  },
  itemRow: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 8,
  },
  layoutGrid: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  mainColumn: {
    flex: 2,
    minWidth: 320,
  },
  metricCard: {
    borderRadius: 8,
    borderWidth: 1,
    flexGrow: 1,
    minWidth: 126,
    padding: 10,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  packageActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  packageCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  rowBetween: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  sectionHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sideColumn: {
    flex: 1,
    minWidth: 280,
  },
  smallActionButton: {
    minWidth: 150,
  },
  statusBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  timeline: {
    gap: 12,
    marginTop: 12,
  },
  timelineDot: {
    borderRadius: 999,
    borderWidth: 1,
    height: 12,
    marginTop: 4,
    width: 12,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 10,
  },
});
