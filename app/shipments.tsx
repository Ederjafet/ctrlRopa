import AppShellPage from '@/components/layout/AppShellPage';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import ScreenPermissionHeaderAction from '@/components/ui/ScreenPermissionHeaderAction';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { hasPermission, hasRole } from '@/services/accessControl';
import {
  CustomerPackageDetail,
  getReadyCustomerPackagesForShipment,
} from '@/services/customerPackageService';
import {
  createShipment,
  getShipmentsByBranch,
  Shipment,
  ShipmentDeliveryType,
  shipmentDeliveryTypeLabel,
  shipmentStatusLabel,
} from '@/services/shipmentService';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

type ShipmentFilter =
  | 'all'
  | 'ready'
  | 'pendingGuide'
  | 'preparing'
  | 'shipped'
  | 'delivered'
  | 'attention'
  | 'history';

type InboxReadyItem = {
  key: string;
  kind: 'readyPackage';
  customerPackage: CustomerPackageDetail;
  filterGroup: ShipmentFilter;
  attentionReason: string | null;
  searchText: string;
};

type InboxShipmentItem = {
  key: string;
  kind: 'shipment';
  shipment: Shipment;
  filterGroup: ShipmentFilter;
  attentionReason: string | null;
  searchText: string;
};

type InboxItem = InboxReadyItem | InboxShipmentItem;

const FILTERS: { key: ShipmentFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'ready', label: 'Listos' },
  { key: 'pendingGuide', label: 'Pendientes de guia' },
  { key: 'preparing', label: 'En preparacion' },
  { key: 'shipped', label: 'Enviados' },
  { key: 'delivered', label: 'Entregados' },
  { key: 'attention', label: 'Con atencion' },
  { key: 'history', label: 'Historial' },
];

function money(value?: number | null) {
  return `$${Number(value ?? 0).toFixed(2)} MXN`;
}

function normalize(value?: string | null) {
  return (value ?? '').toLowerCase().trim();
}

function daysSince(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const diff = Date.now() - date.getTime();
  return Math.max(0, Math.floor(diff / 86_400_000));
}

function daysLabel(value?: string | null) {
  const days = daysSince(value);
  if (days === null) return 'Sin fecha';
  if (days === 0) return 'Hoy';
  if (days === 1) return '1 dia';
  return `${days} dias`;
}

function packageDeliveryTypeLabel(type?: string | null) {
  if (type === 'PARCEL_SERVICE') return 'Paqueteria';
  if (type === 'LOCAL_DELIVERY') return 'Entrega local';
  if (type === 'STORE_PICKUP') return 'Recoleccion en tienda';
  if (type === 'CUSTOMER_PROVIDED_LABEL') return 'Cliente envia guia';
  if (type === 'COLLECT_SHIPPING') return 'Envio por cobrar';
  return type || 'Sin tipo';
}

function logisticsSourceLabel(source?: string | null) {
  if (source === 'SHIPMENT') return 'Datos del envio';
  if (source === 'SHIPMENT_WITH_LEGACY_FALLBACK') return 'Envio + legacy';
  if (source === 'LEGACY_PACKAGE') return 'Legacy paquete';
  if (source === 'MIXED_LEGACY') return 'Legacy por definir';
  return 'Sin datos logisticos';
}

function getPackageDestinationForShipment(customerPackage: CustomerPackageDetail) {
  const address = formatPackageAddress(customerPackage);
  return address !== 'Sin direccion' ? address : packageDeliveryTypeLabel(customerPackage.deliveryType);
}

function getPackageShippingCostForShipment(customerPackage: CustomerPackageDetail) {
  if (customerPackage.shippingCostConfirmed && !customerPackage.shippingCollect && !customerPackage.customerProvidedLabel) {
    return customerPackage.shippingCostWaived ? 0 : Number(customerPackage.shippingCostAmount ?? 0);
  }
  return null;
}
function packageStatusLabel(status?: string | null) {
  if (status === 'READY_FOR_SHIPMENT') return 'Listo para envio';
  if (status === 'OPEN') return 'Abierto';
  if (status === 'CLOSED') return 'Cerrado';
  if (status === 'CANCELLED') return 'Cancelado';
  return status || 'Sin estado';
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

function requiresDeliveryAddress(customerPackage: CustomerPackageDetail) {
  return customerPackage.deliveryType === 'PARCEL_SERVICE' || customerPackage.deliveryType === 'LOCAL_DELIVERY' || customerPackage.deliveryType === 'COLLECT_SHIPPING';
}

function requiresCarrierGuide(customerPackage: CustomerPackageDetail) {
  return customerPackage.deliveryType === 'PARCEL_SERVICE';
}

function getReadyPackageAttentionReason(customerPackage: CustomerPackageDetail) {
  if (requiresDeliveryAddress(customerPackage) && !customerPackage.shippingAddressConfirmed) {
    return 'Falta confirmar direccion';
  }

  if (
    !customerPackage.shippingCostConfirmed &&
    !customerPackage.shippingCostWaived &&
    !customerPackage.shippingCollect &&
    !customerPackage.customerProvidedLabel
  ) {
    return 'Falta confirmar costo';
  }

  if (requiresCarrierGuide(customerPackage) && !customerPackage.trackingNumber?.trim()) {
    return 'Falta guia';
  }

  return null;
}

function getShipmentAttentionReason(shipment: Shipment) {
  if (shipment.requiresAttention && shipment.attentionReason) {
    return shipment.attentionReason;
  }

  if ((shipment.packageCount ?? 0) === 0) {
    return 'Sin paquete asociado';
  }

  if (
    shipment.status === 'OPEN' &&
    shipment.deliveryType === 'CARRIER' &&
    !shipment.guideReference?.trim() &&
    !shipment.packageTrackingNumber?.trim()
  ) {
    return 'Falta guia';
  }

  if (shipment.status === 'OUT_FOR_DELIVERY' && (daysSince(shipment.dispatchedAt) ?? 0) >= 3) {
    return 'Confirmar recibido';
  }

  return null;
}

function getShipmentFilterGroup(shipment: Shipment, attentionReason: string | null): ShipmentFilter {
  if (attentionReason === 'Falta guia') return 'pendingGuide';
  if (attentionReason === 'Sin paquete asociado') return 'attention';
  if (shipment.status === 'OPEN') return 'preparing';
  if (shipment.status === 'OUT_FOR_DELIVERY') return 'shipped';
  if (shipment.status === 'DELIVERED') return 'delivered';
  if (shipment.status === 'CLOSED_WITH_INCIDENTS' || shipment.status === 'CANCELLED') return 'history';
  return 'preparing';
}

function getReadyPackageFilterGroup(attentionReason: string | null): ShipmentFilter {
  if (attentionReason === 'Falta guia') return 'pendingGuide';
  if (attentionReason) return 'attention';
  return 'ready';
}

export default function ShipmentsScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const [session, setSession] = useState<UserSession | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [readyPackages, setReadyPackages] = useState<CustomerPackageDetail[]>([]);
  const [activeFilter, setActiveFilter] = useState<ShipmentFilter>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPreparingPackage, setIsPreparingPackage] = useState(false);
  const [prepareModalVisible, setPrepareModalVisible] = useState(false);
  const [actionsShipment, setActionsShipment] = useState<Shipment | null>(null);
  const [selectedReadyPackage, setSelectedReadyPackage] = useState<CustomerPackageDetail | null>(null);
  const [deliveryType, setDeliveryType] = useState<ShipmentDeliveryType>('LOCAL');
  const [guideReference, setGuideReference] = useState('');

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const currentSession = await getSession();

      if (!currentSession) {
        router.replace('/login');
        return;
      }

      setSession(currentSession);
      const [shipmentData, readyPackageData] = await Promise.all([
        getShipmentsByBranch(currentSession.branchId),
        getReadyCustomerPackagesForShipment(currentSession.branchId),
      ]);
      setShipments(shipmentData);
      setReadyPackages(readyPackageData);
    } catch (error: any) {
      Alert.alert('Envios', error.message || 'No se pudieron cargar los envios.');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const canManageShipments = hasPermission(session, 'MANAGE_SHIPMENTS');
  const canViewPackages = hasPermission(session, 'CREATE_CLOSE_CUSTOMER_PACKAGE');
  const isCourier = hasRole(session, 'COURIER');

  const visibleShipments = useMemo(() => {
    if (isCourier) {
      return shipments.filter((shipment) => shipment.status === 'OUT_FOR_DELIVERY');
    }

    return shipments;
  }, [isCourier, shipments]);

  const inboxItems = useMemo<InboxItem[]>(() => {
    const readyItems: InboxReadyItem[] = isCourier
      ? []
      : readyPackages.map((customerPackage) => {
          const attentionReason = getReadyPackageAttentionReason(customerPackage);
          const searchText = normalize(
            [
              customerPackage.folio,
              customerPackage.customerName,
              customerPackage.customerPhone,
              customerPackage.status,
              customerPackage.shippingCarrier,
              customerPackage.trackingNumber,
              packageDeliveryTypeLabel(customerPackage.deliveryType),
              formatPackageAddress(customerPackage),
            ].join(' ')
          );

          return {
            key: `ready-${customerPackage.id}`,
            kind: 'readyPackage',
            customerPackage,
            filterGroup: getReadyPackageFilterGroup(attentionReason),
            attentionReason,
            searchText,
          };
        });

    const shipmentItems: InboxShipmentItem[] = visibleShipments.map((shipment) => {
      const attentionReason = getShipmentAttentionReason(shipment);
      const searchText = normalize(
        [
          shipment.folio,
          shipment.status,
          shipmentDeliveryTypeLabel(shipment.deliveryType),
          shipmentStatusLabel(shipment.status),
          shipment.guideReference,
          shipment.packageTrackingNumber,
          shipment.packageCount,
          shipment.primaryPackageFolio,
          shipment.primaryPackageStatus,
          shipment.customerName,
          shipment.customerPhone,
          shipment.recipientName,
          shipment.recipientPhone,
          shipment.destinationSummary,
          shipment.destinationCity,
          shipment.destinationState,
          shipment.destinationPostalCode,
          shipment.shippingCarrier,
          shipment.packageDeliveryType ? packageDeliveryTypeLabel(shipment.packageDeliveryType) : null,
        ].join(' ')
      );

      return {
        key: `shipment-${shipment.id}`,
        kind: 'shipment',
        shipment,
        filterGroup: getShipmentFilterGroup(shipment, attentionReason),
        attentionReason,
        searchText,
      };
    });

    return [...readyItems, ...shipmentItems];
  }, [isCourier, readyPackages, visibleShipments]);

  const filteredInboxItems = useMemo(() => {
    const term = normalize(search);

    return inboxItems.filter((item) => {
      const matchesFilter =
        activeFilter === 'all' ||
        item.filterGroup === activeFilter ||
        (activeFilter === 'attention' && Boolean(item.attentionReason));

      const matchesSearch = !term || item.searchText.includes(term);
      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, inboxItems, search]);

  const summary = useMemo(() => {
    const readyCount = readyPackages.length;
    const pendingGuideCount =
      readyPackages.filter((customerPackage) => getReadyPackageAttentionReason(customerPackage) === 'Falta guia').length +
      visibleShipments.filter((shipment) => getShipmentAttentionReason(shipment) === 'Falta guia').length;
    const preparingCount = visibleShipments.filter((shipment) => shipment.status === 'OPEN').length;
    const shippedCount = visibleShipments.filter((shipment) => shipment.status === 'OUT_FOR_DELIVERY').length;
    const deliveredCount = visibleShipments.filter((shipment) => shipment.status === 'DELIVERED').length;
    const attentionCount =
      readyPackages.filter((customerPackage) => Boolean(getReadyPackageAttentionReason(customerPackage))).length +
      visibleShipments.filter((shipment) => Boolean(getShipmentAttentionReason(shipment))).length;

    return {
      readyCount,
      pendingGuideCount,
      preparingCount,
      shippedCount,
      deliveredCount,
      attentionCount,
    };
  }, [readyPackages, visibleShipments]);

  const openPreparePackageModal = (customerPackage: CustomerPackageDetail) => {
    setSelectedReadyPackage(customerPackage);
    setDeliveryType(customerPackage.deliveryType === 'PARCEL_SERVICE' ? 'CARRIER' : 'LOCAL');
    setGuideReference(customerPackage.trackingNumber?.trim() || '');
    setPrepareModalVisible(true);
  };

  const handlePrepareReadyPackage = async () => {
    if (!session || !selectedReadyPackage) return;

    if (deliveryType === 'CARRIER' && !guideReference.trim()) {
      Alert.alert('Envios', 'Captura la guia o referencia para envios por paqueteria.');
      return;
    }

    try {
      setIsPreparingPackage(true);
      const created = await createShipment({
        branchId: session.branchId,
        customerPackageId: selectedReadyPackage.id,
        deliveryAddressId: selectedReadyPackage.sourceCustomerAddressId ?? null,
        paymentMode: 'PREPAID',
        expectedCodAmount: null,
        deliveryType,
        guideReference: guideReference.trim() || null,
        recipientName: selectedReadyPackage.shipToName || selectedReadyPackage.customerName || null,
        recipientPhone: selectedReadyPackage.shipToPhone || selectedReadyPackage.customerPhone || null,
        destinationSummary: getPackageDestinationForShipment(selectedReadyPackage),
        destinationCity: selectedReadyPackage.shipToCity || null,
        destinationState: selectedReadyPackage.shipToState || null,
        destinationPostalCode: selectedReadyPackage.shipToPostalCode || null,
        shippingCarrier: selectedReadyPackage.shippingCarrier || null,
        realShippingCost: getPackageShippingCostForShipment(selectedReadyPackage),
        shippingNotes: selectedReadyPackage.shippingNotes || null,
        createdByUserId: session.userId,
      });

      setPrepareModalVisible(false);
      setSelectedReadyPackage(null);
      setGuideReference('');
      setDeliveryType('LOCAL');
      await loadData();
      router.push(`/shipment-detail?id=${created.id}&returnTo=${encodeURIComponent('/shipments')}` as any);
    } catch (error: any) {
      Alert.alert('Envios', error.message || 'No se pudo preparar el envio del paquete.');
      await loadData();
    } finally {
      setIsPreparingPackage(false);
    }
  };

  const openPackageDetail = (customerPackageId: number) => {
    router.push(`/customer-package-detail?id=${customerPackageId}&returnTo=${encodeURIComponent('/shipments')}` as any);
  };

  const openShipmentDetail = (shipmentId: number) => {
    router.push(`/shipment-detail?id=${shipmentId}&returnTo=${encodeURIComponent('/shipments')}` as any);
  };

  const renderHeaderActions = () => (
    <View style={styles.headerActions}>
      <ScreenPermissionHeaderAction
        screenKey="shipments"
        screenTitle="Envios"
        session={session}
        buttonStyle={styles.headerButton}
      />
    </View>
  );

  const renderSummaryCard = (label: string, value: number, tone: 'default' | 'warning' | 'success' | 'info') => {
    const toneColor =
      tone === 'warning'
        ? theme.colors.warning
        : tone === 'success'
          ? theme.colors.success
          : tone === 'info'
            ? theme.colors.info
            : theme.colors.accent;

    return (
      <View
        key={label}
        style={[
          styles.summaryCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
          {label}
        </AppText>
        <AppText variant="title" color={toneColor}>
          {value}
        </AppText>
      </View>
    );
  };

  const renderFilterChip = (filter: { key: ShipmentFilter; label: string }) => {
    const selected = activeFilter === filter.key;

    return (
      <Pressable
        key={filter.key}
        onPress={() => setActiveFilter(filter.key)}
        style={({ pressed }) => [
          styles.filterChip,
          {
            backgroundColor: selected ? theme.colors.optionPressedBackground : theme.colors.surface,
            borderColor: selected ? theme.colors.accent : theme.colors.border,
            opacity: pressed ? 0.75 : 1,
          },
        ]}
      >
        <AppText
          variant="caption"
          bold={selected}
          color={selected ? theme.colors.accent : theme.colors.mutedText}
          numberOfLines={1}
        >
          {filter.label}
        </AppText>
      </Pressable>
    );
  };

  const renderReadyPackageCard = (item: InboxReadyItem) => {
    const customerPackage = item.customerPackage;
    const hasGuide = Boolean(customerPackage.trackingNumber?.trim());
    const primaryDisabledReason = !canManageShipments
      ? 'No tienes permiso para preparar envios. Permiso requerido: MANAGE_SHIPMENTS.'
      : item.attentionReason === 'Falta confirmar direccion'
        ? 'Completa la direccion del paquete antes de preparar el envio.'
        : item.attentionReason === 'Falta confirmar costo'
          ? 'Confirma el costo de envio antes de preparar el envio.'
          : null;
    const primaryTitle = item.attentionReason === 'Falta guia' ? 'Registrar guia' : 'Preparar envio';

    return (
      <View
        key={item.key}
        style={[
          styles.inboxCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: item.attentionReason ? theme.colors.warning : theme.colors.border,
          },
        ]}
      >
        <View style={styles.cardMain}>
          <View style={styles.cardTitleRow}>
            <View style={styles.cardTitleBlock}>
              <AppText variant="caption" color={theme.colors.warning} bold>
                Paquete listo sin envio creado
              </AppText>
              <AppText bold numberOfLines={1}>
                {customerPackage.folio} - {customerPackage.customerName || `Cliente #${customerPackage.customerId}`}
              </AppText>
              <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
                {customerPackage.customerPhone || 'Sin telefono'} - {packageDeliveryTypeLabel(customerPackage.deliveryType)}
              </AppText>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: theme.colors.warningBackground }]}>
              <AppText variant="caption" color={theme.colors.warning} bold numberOfLines={1}>
                {packageStatusLabel(customerPackage.status)}
              </AppText>
            </View>
          </View>

          <View style={styles.metaGrid}>
            <View style={styles.metaCell}>
              <AppText variant="caption" color={theme.colors.mutedText}>
                Total
              </AppText>
              <AppText bold>{money(customerPackage.totalAmount)}</AppText>
            </View>
            <View style={styles.metaCell}>
              <AppText variant="caption" color={theme.colors.mutedText}>
                Envio
              </AppText>
              <AppText bold>
                {customerPackage.shippingCostWaived || customerPackage.shippingCollect || customerPackage.customerProvidedLabel
                  ? customerPackage.shippingCollect
                    ? 'Por cobrar'
                    : 'Sin costo'
                  : money(customerPackage.shippingCostAmount)}
              </AppText>
            </View>
            <View style={styles.metaCell}>
              <AppText variant="caption" color={theme.colors.mutedText}>
                Prendas
              </AppText>
              <AppText bold>{customerPackage.totalItems ?? 0}</AppText>
            </View>
            <View style={styles.metaCell}>
              <AppText variant="caption" color={theme.colors.mutedText}>
                Listo hace
              </AppText>
              <AppText bold>{daysLabel(customerPackage.closedAt || customerPackage.createdAt)}</AppText>
            </View>
          </View>

          <View style={[styles.addressBlock, { backgroundColor: theme.colors.surfaceAlt }]}>
            <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
              Recibe: {customerPackage.shipToName || customerPackage.customerName || 'No aplica'} - {customerPackage.shipToPhone || customerPackage.customerPhone || 'Sin telefono'}
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={2}>
              {formatPackageAddress(customerPackage)}
            </AppText>
          </View>

          <View style={styles.nextStepRow}>
            <AppText variant="caption" color={item.attentionReason ? theme.colors.warning : theme.colors.success} bold>
              {item.attentionReason
                ? `Atencion: ${item.attentionReason}`
                : hasGuide
                  ? 'Siguiente paso: preparar envio y abrir detalle.'
                  : 'Siguiente paso: capturar guia al preparar el envio.'}
            </AppText>
          </View>
        </View>

        <View style={styles.cardActions}>
          <AppButton
            title={primaryTitle}
            onPress={() => openPreparePackageModal(customerPackage)}
            loading={isPreparingPackage && selectedReadyPackage?.id === customerPackage.id}
            disabled={Boolean(primaryDisabledReason) || isPreparingPackage}
            disabledReason={primaryDisabledReason || undefined}
            style={styles.actionButton}
          />
          <AppButton
            title="Ver paquete"
            variant="secondary"
            onPress={() => openPackageDetail(customerPackage.id)}
            disabled={!canViewPackages}
            disabledReason="No tienes permiso para ver paquetes. Permiso requerido: CREATE_CLOSE_CUSTOMER_PACKAGE."
            style={styles.actionButton}
          />
        </View>
      </View>
    );
  };

  const renderShipmentCard = (item: InboxShipmentItem) => {
    const shipment = item.shipment;
    const isOpen = shipment.status === 'OPEN';
    const isShipped = shipment.status === 'OUT_FOR_DELIVERY';
    const isDelivered = shipment.status === 'DELIVERED';
    const isOrphan = (shipment.packageCount ?? 0) === 0;
    const effectiveGuide = shipment.guideReference || shipment.packageTrackingNumber;
    const primaryTitle = isOrphan
      ? 'Revisar incidencia'
      : isOpen
      ? shipment.deliveryType === 'CARRIER' && !effectiveGuide?.trim()
        ? 'Registrar guia'
        : 'Preparar envio'
      : isShipped
        ? 'Confirmar recibido'
        : 'Ver detalle';
    const primaryReason = !canManageShipments
      ? 'No tienes permiso para gestionar envios. Permiso requerido: MANAGE_SHIPMENTS.'
      : null;
    const statusTone = isDelivered
      ? theme.colors.success
      : isShipped
        ? theme.colors.info
        : item.attentionReason
          ? theme.colors.warning
          : theme.colors.accent;

    return (
      <View
        key={item.key}
        style={[
          styles.inboxCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: item.attentionReason ? theme.colors.warning : theme.colors.border,
          },
        ]}
      >
        <View style={styles.cardMain}>
          <View style={styles.cardTitleRow}>
            <View style={styles.cardTitleBlock}>
              <AppText variant="caption" color={theme.colors.mutedText} bold>
                Envio real #{shipment.id}
              </AppText>
              <AppText bold numberOfLines={1}>
                {shipment.folio} - {shipmentDeliveryTypeLabel(shipment.deliveryType)}
              </AppText>
              <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
                {shipment.packageCount ?? 0} paquete{shipment.packageCount === 1 ? '' : 's'} - {shipment.guideReference ? `Guia ${shipment.guideReference}` : 'Sin guia'}
              </AppText>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: theme.colors.surfaceAlt }]}>
              <AppText variant="caption" color={statusTone} bold numberOfLines={1}>
                {shipmentStatusLabel(shipment.status)}
              </AppText>
            </View>
          </View>

          <View style={styles.metaGrid}>
            <View style={styles.metaCell}>
              <AppText variant="caption" color={theme.colors.mutedText}>
                Estado
              </AppText>
              <AppText bold>{shipmentStatusLabel(shipment.status)}</AppText>
            </View>
            <View style={styles.metaCell}>
              <AppText variant="caption" color={theme.colors.mutedText}>
                Tipo
              </AppText>
              <AppText bold>{shipmentDeliveryTypeLabel(shipment.deliveryType)}</AppText>
            </View>
            <View style={styles.metaCell}>
              <AppText variant="caption" color={theme.colors.mutedText}>
                Guia
              </AppText>
              <AppText bold numberOfLines={1}>
                {effectiveGuide || 'Pendiente'}
              </AppText>
            </View>
            <View style={styles.metaCell}>
              <AppText variant="caption" color={theme.colors.mutedText}>
                En estado
              </AppText>
              <AppText bold>{daysLabel(shipment.dispatchedAt || shipment.createdAt)}</AppText>
            </View>
          </View>

          <View style={styles.metaGrid}>
            <View style={styles.metaCell}>
              <AppText variant="caption" color={theme.colors.mutedText}>
                Cliente
              </AppText>
              <AppText bold numberOfLines={1}>
                {shipment.customerName || 'No indicado'}
              </AppText>
            </View>
            <View style={styles.metaCell}>
              <AppText variant="caption" color={theme.colors.mutedText}>
                Telefono
              </AppText>
              <AppText bold numberOfLines={1}>
                {shipment.customerPhone || 'Sin telefono'}
              </AppText>
            </View>
            <View style={styles.metaCell}>
              <AppText variant="caption" color={theme.colors.mutedText}>
                Paquete
              </AppText>
              <AppText bold numberOfLines={1}>
                {shipment.primaryPackageFolio || 'Sin paquete'}
              </AppText>
            </View>
            <View style={styles.metaCell}>
              <AppText variant="caption" color={theme.colors.mutedText}>
                Prendas
              </AppText>
              <AppText bold>{shipment.packageItemCount ?? 0}</AppText>
            </View>
            <View style={styles.metaCell}>
              <AppText variant="caption" color={theme.colors.mutedText}>
                Costo envio
              </AppText>
              <AppText bold numberOfLines={1}>
                {shipment.shippingCostAmount != null ? money(shipment.shippingCostAmount) : 'No aplica'}
              </AppText>
            </View>
            <View style={styles.metaCell}>
              <AppText variant="caption" color={theme.colors.mutedText}>
                Total paquete
              </AppText>
              <AppText bold numberOfLines={1}>
                {shipment.packageTotalAmount != null ? money(shipment.packageTotalAmount) : 'Sin total'}
              </AppText>
            </View>
          </View>

          <View style={[styles.addressBlock, { backgroundColor: theme.colors.surfaceAlt }]}>
            <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
              Recibe: {shipment.recipientName || shipment.customerName || 'No indicado'} - {shipment.recipientPhone || shipment.customerPhone || 'Sin telefono'}
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={2}>
              {shipment.destinationSummary || (isOrphan ? 'Este envio no tiene paquete asociado.' : 'Sin destino registrado')}
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
              Paqueteria: {shipment.shippingCarrier || shipmentDeliveryTypeLabel(shipment.deliveryType)} - Estado paquete: {packageStatusLabel(shipment.primaryPackageStatus)}
            </AppText>
            <AppText variant="caption" color={shipment.logisticsWarning ? theme.colors.warning : theme.colors.mutedText} numberOfLines={2}>
              Logistica: {logisticsSourceLabel(shipment.logisticsSource)}{shipment.logisticsWarning ? ` - ${shipment.logisticsWarning}` : ''}
            </AppText>
          </View>

          <View style={styles.nextStepRow}>
            <AppText variant="caption" color={item.attentionReason ? theme.colors.warning : theme.colors.mutedText} bold>
              {item.attentionReason
                ? `Atencion: ${item.attentionReason}`
                : shipment.nextStep
                  ? `Siguiente paso: ${shipment.nextStep}`
                  : isOpen
                  ? 'Siguiente paso: revisar paquetes y despachar desde el detalle.'
                  : isShipped
                    ? 'Siguiente paso: confirmar recibido desde el detalle.'
                    : isDelivered
                      ? 'Entrega registrada.'
                      : 'Revisar detalle del envio.'}
            </AppText>
          </View>
        </View>

        <View style={styles.cardActions}>
          <AppButton
            title={primaryTitle}
            onPress={() => openShipmentDetail(shipment.id)}
            disabled={Boolean(primaryReason)}
            disabledReason={primaryReason || undefined}
            style={styles.actionButton}
          />
          <AppButton
            title="Detalle"
            variant="secondary"
            onPress={() => openShipmentDetail(shipment.id)}
            disabled={!canManageShipments}
            disabledReason="No tienes permiso para ver envios. Permiso requerido: MANAGE_SHIPMENTS."
            style={styles.actionButton}
          />
          {shipment.primaryPackageId ? (
            <AppButton
              title="Ver paquete"
              variant="secondary"
              onPress={() => openPackageDetail(shipment.primaryPackageId as number)}
              disabled={!canViewPackages}
              disabledReason="No tienes permiso para ver paquetes. Permiso requerido: CREATE_CLOSE_CUSTOMER_PACKAGE."
              style={styles.actionButton}
            />
          ) : null}
          <AppButton
            title="Mas"
            variant="secondary"
            onPress={() => setActionsShipment(shipment)}
            disabled={!canManageShipments}
            disabledReason="No tienes permiso para gestionar envios. Permiso requerido: MANAGE_SHIPMENTS."
            style={styles.actionButtonSmall}
          />
        </View>
      </View>
    );
  };

  const emptyMessage =
    activeFilter === 'all' && !search.trim()
      ? 'No hay paquetes listos para envio. Cuando un paquete este pagado y marcado como listo, aparecera aqui.'
      : 'No hay envios con este filtro o busqueda.';

  return (
    <>
      <AppShellPage
        title="Envios"
        subtitle="Bandeja operativa para preparar, enviar y confirmar paquetes."
        activeRoute="shipments"
        session={session}
        compactHeader
        rightContent={renderHeaderActions()}
      >
        <View style={styles.summaryGrid}>
          {renderSummaryCard('Listos para envio', summary.readyCount, 'info')}
          {renderSummaryCard('Pendientes de guia', summary.pendingGuideCount, 'warning')}
          {renderSummaryCard('En preparacion', summary.preparingCount, 'default')}
          {renderSummaryCard('Enviados', summary.shippedCount, 'info')}
          {renderSummaryCard('Entregados', summary.deliveredCount, 'success')}
          {renderSummaryCard('Con atencion', summary.attentionCount, 'warning')}
        </View>

        <View style={styles.filterRow}>{FILTERS.map(renderFilterChip)}</View>

        <AppInput
          label="Buscar en bandeja"
          value={search}
          onChangeText={setSearch}
          placeholder="Cliente, paquete, guia, paqueteria o telefono"
          autoCapitalize="none"
        />

        {isLoading ? <ActivityIndicator /> : null}

        {!isLoading && filteredInboxItems.length === 0 ? (
          <AppCard variant="subtle">
            <AppText bold>Sin resultados</AppText>
            <AppText color={theme.colors.mutedText}>{emptyMessage}</AppText>
          </AppCard>
        ) : null}

        {!isLoading ? (
          <View style={styles.inboxList}>
            {filteredInboxItems.map((item) =>
              item.kind === 'readyPackage' ? renderReadyPackageCard(item) : renderShipmentCard(item)
            )}
          </View>
        ) : null}
      </AppShellPage>

      <AppBottomModal
        visible={prepareModalVisible}
        title={selectedReadyPackage ? `Preparar ${selectedReadyPackage.folio}` : 'Preparar envio'}
        onClose={() => {
          if (isPreparingPackage) return;
          setPrepareModalVisible(false);
          setSelectedReadyPackage(null);
        }}
        maxHeight="90%"
      >
        {selectedReadyPackage ? (
          <View style={styles.modalActionsStack}>
            <AppCard variant="subtle">
              <AppText bold>{selectedReadyPackage.customerName || `Cliente #${selectedReadyPackage.customerId}`}</AppText>
              <AppText color={theme.colors.mutedText}>
                Total {money(selectedReadyPackage.totalAmount)} - Envio {selectedReadyPackage.shippingCostWaived ? 'sin costo' : money(selectedReadyPackage.shippingCostAmount)}
              </AppText>
            </AppCard>

            <AppText bold>Direccion de entrega</AppText>
            <AppCard variant="subtle">
              <AppText bold>{packageDeliveryTypeLabel(selectedReadyPackage.deliveryType)}</AppText>
              <AppText color={theme.colors.mutedText}>
                Recibe: {selectedReadyPackage.shipToName || selectedReadyPackage.customerName || 'No aplica'}
              </AppText>
              <AppText color={theme.colors.mutedText}>
                Telefono: {selectedReadyPackage.shipToPhone || selectedReadyPackage.customerPhone || 'No aplica'}
              </AppText>
              <AppText color={theme.colors.mutedText}>{formatPackageAddress(selectedReadyPackage)}</AppText>
              {selectedReadyPackage.shipToReferences ? (
                <AppText color={theme.colors.mutedText}>Referencias: {selectedReadyPackage.shipToReferences}</AppText>
              ) : null}
            </AppCard>

            <AppText bold>Tipo de entrega</AppText>
            <View style={styles.typeRow}>
              <Pressable
                onPress={() => setDeliveryType('LOCAL')}
                style={({ pressed }) => [
                  styles.typeOption,
                  {
                    borderColor: deliveryType === 'LOCAL' ? theme.colors.accent : theme.colors.border,
                    backgroundColor: deliveryType === 'LOCAL' ? theme.colors.optionPressedBackground : theme.colors.surface,
                    borderRadius: theme.radius.md,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <AppText bold>Local</AppText>
              </Pressable>

              <Pressable
                onPress={() => setDeliveryType('CARRIER')}
                style={({ pressed }) => [
                  styles.typeOption,
                  {
                    borderColor: deliveryType === 'CARRIER' ? theme.colors.accent : theme.colors.border,
                    backgroundColor: deliveryType === 'CARRIER' ? theme.colors.optionPressedBackground : theme.colors.surface,
                    borderRadius: theme.radius.md,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <AppText bold>Paqueteria</AppText>
              </Pressable>
            </View>

            <AppInput
              label="Guia / referencia"
              value={guideReference}
              onChangeText={setGuideReference}
              placeholder={deliveryType === 'CARRIER' ? 'Obligatoria para paqueteria' : 'Opcional'}
              autoCapitalize="characters"
            />

            <AppButton
              title={isPreparingPackage ? 'Preparando...' : 'Crear envio y abrir detalle'}
              onPress={handlePrepareReadyPackage}
              loading={isPreparingPackage}
              disabled={isPreparingPackage || !canManageShipments}
              disabledReason="No tienes permiso para preparar envios. Permiso requerido: MANAGE_SHIPMENTS."
            />
          </View>
        ) : null}
      </AppBottomModal>

      <AppBottomModal
        visible={Boolean(actionsShipment)}
        title={actionsShipment ? `Envio ${actionsShipment.folio}` : 'Envio'}
        onClose={() => setActionsShipment(null)}
      >
        {actionsShipment ? (
          <View style={styles.modalActionsStack}>
            {(actionsShipment.packageCount ?? 0) === 0 ? (
              <AppCard variant="warning">
                <AppText bold>Sin paquete asociado</AppText>
                <AppText color={theme.colors.mutedText}>
                  Este envio no puede operarse como normal. Abre el detalle para revisar o cancelar.
                </AppText>
              </AppCard>
            ) : null}
            <AppButton
              title="Abrir detalle"
              variant="secondary"
              onPress={() => {
                const id = actionsShipment.id;
                setActionsShipment(null);
                openShipmentDetail(id);
              }}
            />
            {(actionsShipment.packageCount ?? 0) > 0 ? (
              <>
                <AppButton
                  title="Registrar guia / paqueteria"
                  variant="operation"
                  onPress={() => {
                    const id = actionsShipment.id;
                    setActionsShipment(null);
                    openShipmentDetail(id);
                  }}
                  disabled={!canManageShipments}
                  disabledReason="No tienes permiso para actualizar envios. Permiso requerido: MANAGE_SHIPMENTS."
                />
                <AppButton
                  title="Marcar enviado / confirmar recibido"
                  variant="neutral"
                  onPress={() => {
                    const id = actionsShipment.id;
                    setActionsShipment(null);
                    openShipmentDetail(id);
                  }}
                  disabled={!canManageShipments}
                  disabledReason="Disponible desde el detalle del envio con permiso MANAGE_SHIPMENTS."
                />
              </>
            ) : null}
          </View>
        ) : null}
      </AppBottomModal>
    </>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    minHeight: 32,
    minWidth: 126,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  actionButtonSmall: {
    minHeight: 32,
    minWidth: 64,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  addressBlock: {
    borderRadius: 8,
    gap: 3,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  cardActions: {
    alignItems: 'flex-end',
    gap: 6,
    justifyContent: 'center',
    minWidth: 160,
  },
  cardMain: {
    flex: 1,
    gap: 8,
    minWidth: 260,
  },
  cardTitleBlock: {
    flex: 1,
    gap: 2,
    minWidth: 180,
  },
  cardTitleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 30,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-end',
  },
  headerButton: {
    minHeight: 30,
    minWidth: 100,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  inboxCard: {
    alignItems: 'stretch',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 12,
  },
  inboxList: {
    gap: 10,
  },
  metaCell: {
    flex: 1,
    gap: 2,
    minWidth: 98,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalActionsStack: {
    gap: 8,
  },
  nextStepRow: {
    marginTop: 2,
  },
  statusBadge: {
    alignItems: 'center',
    borderRadius: 999,
    minHeight: 26,
    justifyContent: 'center',
    maxWidth: 180,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  summaryCard: {
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    minHeight: 64,
    minWidth: 128,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  typeOption: {
    alignItems: 'center',
    borderWidth: 1,
    flex: 1,
    padding: 12,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    marginTop: 8,
  },
});
