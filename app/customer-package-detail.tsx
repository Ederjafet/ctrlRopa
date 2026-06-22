import AppShellPage from '@/components/layout/AppShellPage';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppNoticeDropdown from '@/components/ui/AppNoticeDropdown';
import AppOptionRow from '@/components/ui/AppOptionRow';
import AppResponsiveGrid from '@/components/ui/AppResponsiveGrid';
import ScreenPermissionHeaderAction from '@/components/ui/ScreenPermissionHeaderAction';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { hasPermission } from '@/services/accessControl';
import { getBalanceByPackageFolio, type BalanceSummary } from '@/services/balanceService';
import { getPaymentMethods, type PaymentMethod } from '@/services/catalogService';
import {
  addCustomerPackageItemByCode,
  addCustomerPackageItemByQr,
  canMarkCustomerPackageReady,
  cancelCustomerPackage,
  CustomerPackageDetail,
  CustomerPackageItemLine,
  CustomerPackageShipmentLine,
  getCustomerPackageDetail,
  getCustomerPackageDetailByFolio,
  isCustomerPackageOpen,
  markCustomerPackageReady,
} from '@/services/customerPackageService';
import { getItemsByBranch, Item } from '@/services/itemService';
import { createPaymentByPackageFolio } from '@/services/paymentService';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

function money(value?: number | null) {
  return `$${Number(value ?? 0).toFixed(2)} MXN`;
}

function formatDate(value?: string | null) {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function statusLabel(status?: string | null) {
  if (status === 'OPEN') return 'En preparacion';
  if (status === 'READY') return 'Listo para envio';
  if (status === 'SHIPPED') return 'Enviado';
  if (status === 'DELIVERED') return 'Entregado';
  if (status === 'CANCELLED') return 'Cancelado';
  if (status === 'ACTIVE') return 'Activo';
  if (status === 'SOLD') return 'Vendido';
  if (status === 'AVAILABLE') return 'Disponible';
  if (status === 'RESERVED') return 'Apartado';
  return status || 'Sin estado';
}

function paymentStatusLabel(status?: string | null) {
  if (status === 'PAID') return 'Pagado';
  if (status === 'PARTIAL') return 'Parcial';
  if (status === 'PENDING') return 'Pendiente';
  if (status === 'UNPAID') return 'Pendiente';
  return status || 'Sin estado';
}

function sourceTypeLabel(type?: string | null) {
  if (type === 'SALE') return 'Venta';
  if (type === 'RESERVATION') return 'Apartado';
  return type || 'Movimiento';
}

function collectionStatusLabel(status?: string | null) {
  if (status === 'COLLECTED') return 'Cobrado';
  if (status === 'PENDING') return 'Pendiente';
  if (status === 'DIFFERENCE') return 'Diferencia';
  return status || 'Sin estado';
}

function compactDate(value?: string | null) {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function getShipmentState(detail: CustomerPackageDetail, shipments: CustomerPackageShipmentLine[]) {
  if (shipments.length > 0) {
    const latest = shipments[0];
    return `${statusLabel(latest.shipmentStatus)} / ${statusLabel(latest.packageShipmentStatus)}`;
  }

  if (detail.status === 'READY') return 'Listo, sin envio';
  if (detail.status === 'SHIPPED') return 'Enviado';
  if (detail.status === 'DELIVERED') return 'Entregado';
  return 'Sin envio';
}

function getNextStep(
  detail: CustomerPackageDetail,
  hasPending: boolean,
  canReady: boolean,
  shipments: CustomerPackageShipmentLine[]
) {
  if (detail.status === 'CANCELLED') return 'Paquete cancelado. No requiere acciones operativas.';
  if (detail.status === 'DELIVERED') return 'Paquete entregado. Conserva la consulta de pagos y envio.';
  if (shipments.length > 0 && detail.status === 'SHIPPED') {
    return 'Enviado. Da seguimiento desde el detalle del envio asociado.';
  }
  if (detail.status === 'READY') return 'Listo para envio. Registra o revisa el envio asociado.';
  if (hasPending) return 'Falta registrar abono para liberar el envio.';
  if ((detail.totalItems ?? 0) <= 0) return 'Agrega prendas antes de preparar el envio.';
  if (canReady) return 'Paquete pagado. Puedes marcarlo listo para envio.';
  return 'Revisa prendas, pagos y permisos antes de continuar.';
}

function PackageLabel({ detail }: { detail: CustomerPackageDetail }) {
  return (
    <View style={styles.labelBox}>
      <QRCode value={detail.folio} size={104} backgroundColor="#ffffff" color="#000000" />
      <Text style={[styles.labelText, styles.labelFolio]}>{detail.folio}</Text>
      <Text style={styles.labelText}>{detail.customerName}</Text>
      <Text style={styles.labelText}>Prendas: {detail.totalItems ?? 0}</Text>
      <Text style={styles.labelText}>Estado: {statusLabel(detail.status)}</Text>
    </View>
  );
}

function StatusPill({
  label,
  tone = 'default',
}: {
  label: string;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}) {
  const { theme } = useAppTheme();
  const color =
    tone === 'success'
      ? theme.colors.success
      : tone === 'warning'
        ? theme.colors.warning
        : tone === 'danger'
          ? theme.colors.danger
          : tone === 'info'
            ? theme.colors.accent
            : theme.colors.mutedText;

  return (
    <View style={[styles.pill, { borderColor: color, backgroundColor: theme.colors.surfaceAlt }]}>
      <AppText variant="caption" bold color={color}>
        {label}
      </AppText>
    </View>
  );
}

function MetricCard({
  label,
  value,
  helper,
  tone = 'default',
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}) {
  const { theme } = useAppTheme();
  const color =
    tone === 'success'
      ? theme.colors.success
      : tone === 'warning'
        ? theme.colors.warning
        : tone === 'danger'
          ? theme.colors.danger
          : tone === 'info'
            ? theme.colors.accent
            : theme.colors.text;

  return (
    <View style={[styles.metricCard, { borderColor: theme.colors.borderSubtle, backgroundColor: theme.colors.surfaceAlt }]}>
      <AppText variant="caption" color={theme.colors.mutedText}>
        {label}
      </AppText>
      <AppText variant="subtitle" bold color={color} numberOfLines={1}>
        {value}
      </AppText>
      {helper ? (
        <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={2}>
          {helper}
        </AppText>
      ) : null}
    </View>
  );
}

function InfoRow({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const { theme } = useAppTheme();
  const color =
    tone === 'success'
      ? theme.colors.success
      : tone === 'warning'
        ? theme.colors.warning
        : tone === 'danger'
          ? theme.colors.danger
          : theme.colors.text;

  return (
    <View style={styles.infoRow}>
      <AppText variant="caption" color={theme.colors.mutedText}>
        {label}
      </AppText>
      <AppText bold color={color} numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
}

function PackageItemLine({
  item,
  onOpenItem,
}: {
  item: CustomerPackageItemLine;
  onOpenItem: (itemId: number) => void;
}) {
  const { theme } = useAppTheme();
  const pending = Number(item.pendingAmount ?? 0);

  return (
    <View style={[styles.compactLine, { borderColor: theme.colors.borderSubtle, backgroundColor: theme.colors.surfaceAlt }]}>
      <View style={styles.lineMain}>
        <View style={styles.lineTitleBlock}>
          <AppText bold numberOfLines={1}>
            {item.itemCode || `Prenda #${item.itemId}`}
          </AppText>
          <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
            {item.productType || 'Sin tipo'} {item.size ? `- ${item.size}` : ''} {item.brand ? `- ${item.brand}` : ''}
          </AppText>
        </View>
        <StatusPill label={statusLabel(item.sourceStatus || item.itemStatus)} tone={pending > 0 ? 'warning' : 'success'} />
      </View>
      <View style={styles.lineMetaGrid}>
        <InfoRow label="Origen" value={sourceTypeLabel(item.sourceType)} />
        <InfoRow label="Precio" value={money(item.price)} />
        <InfoRow label="Pagado" value={money(item.paidAmount)} tone={Number(item.paidAmount ?? 0) > 0 ? 'success' : 'default'} />
        <InfoRow label="Pendiente" value={money(item.pendingAmount)} tone={pending > 0 ? 'danger' : 'success'} />
      </View>
      <View style={styles.lineActions}>
        <AppText variant="caption" color={theme.colors.mutedText}>
          Agregado: {compactDate(item.createdAt)}
        </AppText>
        <AppButton
          title="Ver prenda"
          variant="secondary"
          onPress={() => onOpenItem(item.itemId)}
          style={styles.lineButton}
        />
      </View>
    </View>
  );
}

function ShipmentLine({ shipment }: { shipment: CustomerPackageShipmentLine }) {
  const { theme } = useAppTheme();
  const expected = Number(shipment.expectedCollectionAmount ?? 0);
  const collected = Number(shipment.collectedAmount ?? 0);

  return (
    <View style={[styles.compactLine, { borderColor: theme.colors.borderSubtle, backgroundColor: theme.colors.surfaceAlt }]}>
      <View style={styles.lineMain}>
        <View style={styles.lineTitleBlock}>
          <AppText bold numberOfLines={1}>
            {shipment.shipmentFolio || `Envio #${shipment.shipmentId}`}
          </AppText>
          <AppText variant="caption" color={theme.colors.mutedText}>
            Paquete: {statusLabel(shipment.packageShipmentStatus)}
          </AppText>
        </View>
        <StatusPill label={statusLabel(shipment.shipmentStatus)} tone="info" />
      </View>
      <View style={styles.lineMetaGrid}>
        <InfoRow label="Modo" value={shipment.paymentMode || 'Sin modo'} />
        <InfoRow label="Por cobrar" value={money(expected)} tone={expected > 0 ? 'warning' : 'default'} />
        <InfoRow label="Cobrado" value={money(collected)} tone={collected > 0 ? 'success' : 'default'} />
        <InfoRow label="Cobranza" value={collectionStatusLabel(shipment.collectionStatus)} />
      </View>
    </View>
  );
}

export default function CustomerPackageDetailScreen() {
  const router = useRouter();
  const { id, folio } = useLocalSearchParams<{ id?: string; folio?: string }>();
  const { theme } = useAppTheme();
  const { isDesktop } = useResponsiveLayout();

  const packageId = id ? Number(id) : null;

  const [session, setSession] = useState<UserSession | null>(null);
  const [detail, setDetail] = useState<CustomerPackageDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [codeModalVisible, setCodeModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [itemSearchModalVisible, setItemSearchModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentMethodPickerVisible, setPaymentMethodPickerVisible] = useState(false);
  const [code, setCode] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<number | null>(null);
  const [cancelNotes, setCancelNotes] = useState('');
  const [branchItems, setBranchItems] = useState<Item[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [balanceSummary, setBalanceSummary] = useState<BalanceSummary | null>(null);
  const [notice, setNotice] = useState<{
    title: string;
    message: string;
    tone: 'success' | 'warning' | 'danger' | 'info';
  } | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const currentSession = await getSession();

      if (!currentSession) {
        router.replace('/login');
        return;
      }

      setSession(currentSession);

      const packageDetail = packageId
        ? await getCustomerPackageDetail(packageId)
        : await getCustomerPackageDetailByFolio(String(folio || ''));

      setDetail(packageDetail);
      const [itemsData, methodsData, balanceData] = await Promise.all([
        getItemsByBranch(packageDetail.branchId),
        getPaymentMethods(packageDetail.branchId),
        getBalanceByPackageFolio(packageDetail.folio),
      ]);
      setBranchItems(itemsData);
      setPaymentMethods(methodsData);
      setSelectedPaymentMethodId((current) => current ?? methodsData[0]?.id ?? null);
      setBalanceSummary(balanceData);
    } catch (error: any) {
      Alert.alert('Paquete', error.message || 'No se pudo cargar el paquete.');
    } finally {
      setIsLoading(false);
    }
  }, [folio, packageId, router]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const fallbackRoute = useMemo(() => {
    if (detail?.customerId) return `/customer-packages?customerId=${detail.customerId}`;
    return '/customer-packages';
  }, [detail?.customerId]);

  const canEdit = isCustomerPackageOpen(detail);
  const canReady = canMarkCustomerPackageReady(detail);
  const hasPending = Number(detail?.pendingAmount ?? 0) > 0;
  const items = useMemo(() => detail?.items ?? [], [detail?.items]);
  const shipments = useMemo(() => detail?.shipments ?? [], [detail?.shipments]);

  const canManagePackage = hasPermission(session, 'CREATE_CLOSE_CUSTOMER_PACKAGE');
  const canRegisterPayments = hasPermission(session, 'REGISTER_PAYMENTS');
  const canApplyCustomerBalance = hasPermission(session, 'APPLY_CUSTOMER_BALANCE');
  const canManageInventory = hasPermission(session, 'MANAGE_INVENTORY');
  const canManageShipments = hasPermission(session, 'MANAGE_SHIPMENTS');

  const filteredBranchItems = useMemo(() => {
    const term = itemSearch.trim().toLowerCase();
    const existingItemIds = new Set(items.map((item) => item.itemId));

    return branchItems
      .filter((item) => !existingItemIds.has(item.id))
      .filter((item) => item.status === 'AVAILABLE')
      .filter((item) => {
        if (!term) return true;
        return `${item.code ?? ''} ${item.qrCode ?? ''} ${item.productTypeName ?? ''} ${item.brandName ?? ''} ${item.sizeName ?? ''}`
          .toLowerCase()
          .includes(term);
      })
      .slice(0, 50);
  }, [branchItems, itemSearch, items]);

  const handleAddByCode = async () => {
    if (!detail) return;

    if (!canManageInventory) {
      setNotice({
        title: 'Permiso requerido',
        message: 'No tienes permiso para agregar prendas al paquete. Permiso requerido: MANAGE_INVENTORY.',
        tone: 'warning',
      });
      return;
    }

    const cleanCode = code.trim();

    if (!cleanCode) {
      Alert.alert('Paquete', 'Captura el codigo del item.');
      return;
    }

    try {
      setIsWorking(true);
      const updated = await addCustomerPackageItemByCode(detail.folio, cleanCode);
      setDetail(updated);
      setCode('');
      setCodeModalVisible(false);
      setNotice({
        title: 'Prenda agregada',
        message: 'Prenda agregada al paquete.',
        tone: 'success',
      });
    } catch (error: any) {
      setNotice({
        title: 'No se pudo agregar',
        message: error.message || 'No se pudo agregar la prenda al paquete.',
        tone: 'danger',
      });
    } finally {
      setIsWorking(false);
    }
  };

  const handleAddByQr = async () => {
    if (!detail) return;

    if (!canManageInventory) {
      setNotice({
        title: 'Permiso requerido',
        message: 'No tienes permiso para agregar prendas al paquete. Permiso requerido: MANAGE_INVENTORY.',
        tone: 'warning',
      });
      return;
    }

    const cleanQr = qrCode.trim();

    if (!cleanQr) {
      Alert.alert('Paquete', 'Captura o escanea el QR del item.');
      return;
    }

    try {
      setIsWorking(true);
      const updated = await addCustomerPackageItemByQr(detail.folio, cleanQr);
      setDetail(updated);
      setQrCode('');
      setQrModalVisible(false);
      setNotice({
        title: 'Prenda agregada',
        message: 'Prenda agregada al paquete.',
        tone: 'success',
      });
    } catch (error: any) {
      setNotice({
        title: 'No se pudo agregar',
        message: error.message || 'No se pudo agregar la prenda al paquete.',
        tone: 'danger',
      });
    } finally {
      setIsWorking(false);
    }
  };

  const handleAddSearchedItem = async (item: Item) => {
    if (!detail) return;

    if (!canManageInventory) {
      setNotice({
        title: 'Permiso requerido',
        message: 'No tienes permiso para agregar prendas al paquete. Permiso requerido: MANAGE_INVENTORY.',
        tone: 'warning',
      });
      return;
    }

    try {
      setIsWorking(true);
      const updated = await addCustomerPackageItemByCode(detail.folio, item.code);
      setDetail(updated);
      setItemSearch('');
      setItemSearchModalVisible(false);
      setNotice({
        title: 'Prenda agregada',
        message: `${item.code} se agrego correctamente al paquete.`,
        tone: 'success',
      });
    } catch (error: any) {
      setNotice({
        title: 'No se pudo agregar',
        message:
          error.message ||
          'Revisa que la prenda pertenezca a la sucursal y este libre, vendida o apartada de forma valida.',
        tone: 'danger',
      });
    } finally {
      setIsWorking(false);
    }
  };

  const openPaymentModal = () => {
    if (!detail) return;

    if (!canRegisterPayments) {
      setNotice({
        title: 'Permiso requerido',
        message: 'No tienes permiso para registrar abonos. Permiso requerido: REGISTER_PAYMENTS.',
        tone: 'warning',
      });
      return;
    }

    if (!hasPending) {
      setNotice({
        title: 'Paquete liquidado',
        message: 'Este paquete no tiene saldo pendiente para registrar abono.',
        tone: 'info',
      });
      return;
    }

    setPaymentAmount(String(Number(detail.pendingAmount ?? 0).toFixed(2)));
    setPaymentReference(`Abono paquete ${detail.folio}`);
    setSelectedPaymentMethodId((current) => current ?? paymentMethods[0]?.id ?? null);
    setPaymentModalVisible(true);
  };

  const closePaymentModal = () => {
    if (isWorking) return;

    setPaymentModalVisible(false);
    setPaymentMethodPickerVisible(false);
    setPaymentAmount('');
    setPaymentReference('');
  };

  const handleRegisterPackagePayment = async () => {
    if (!detail || !session) return;

    if (!canRegisterPayments) {
      Alert.alert('Permiso requerido', 'No tienes permiso para registrar abonos. Permiso requerido: REGISTER_PAYMENTS.');
      return;
    }

    const amount = Number(paymentAmount.replace(',', '.'));

    if (!selectedPaymentMethodId) {
      Alert.alert('Abono paquete', 'Selecciona un metodo de pago.');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Abono paquete', 'Captura un monto mayor a 0.');
      return;
    }

    try {
      setIsWorking(true);
      await createPaymentByPackageFolio(detail.folio, {
        amount,
        paymentMethodId: selectedPaymentMethodId,
        reference: paymentReference.trim() || `Abono paquete ${detail.folio}`,
        createdByUserId: session.userId,
      });

      const [updatedDetail, updatedBalance] = await Promise.all([
        getCustomerPackageDetail(detail.id),
        getBalanceByPackageFolio(detail.folio),
      ]);

      setDetail(updatedDetail);
      setBalanceSummary(updatedBalance);
      setPaymentModalVisible(false);
      setPaymentAmount('');
      setPaymentReference('');
      setNotice({
        title: 'Pago registrado',
        message: 'Pago registrado correctamente. Si hubo sobrepago, quedo como saldo a favor del cliente.',
        tone: 'success',
      });
      Alert.alert(
        'Pago registrado',
        'Pago registrado correctamente. Si hubo sobrepago, quedo como saldo a favor del cliente.'
      );
    } catch (error: any) {
      Alert.alert('No se pudo registrar', error.message || 'No se pudo registrar el abono del paquete.');
      setNotice({
        title: 'No se pudo registrar',
        message: error.message || 'No se pudo registrar el abono del paquete.',
        tone: 'danger',
      });
    } finally {
      setIsWorking(false);
    }
  };

  const handleMarkReady = async () => {
    if (!detail || !session) return;

    if (!canManagePackage) {
      setNotice({
        title: 'Permiso requerido',
        message: 'No tienes permiso para marcar listo para envio. Permiso requerido: CREATE_CLOSE_CUSTOMER_PACKAGE.',
        tone: 'warning',
      });
      return;
    }

    if (!canReady) {
      setNotice({
        title: 'Falta completar el paquete',
        message: hasPending
          ? 'Antes de marcar listo para envio, liquida el saldo pendiente del paquete.'
          : 'Antes de marcar listo para envio, agrega al menos una prenda al paquete.',
        tone: 'warning',
      });
      return;
    }

    Alert.alert('Marcar listo para envio', `Quieres marcar el paquete ${detail.folio} como listo para envio?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Marcar listo',
        onPress: async () => {
          try {
            setIsWorking(true);
            const updated = await markCustomerPackageReady(detail.id, session.userId);
            setDetail(updated);
            setNotice({
              title: 'Paquete listo para envio',
              message: 'Paquete marcado listo para envio.',
              tone: 'success',
            });
          } catch (error: any) {
            setNotice({
              title: 'No se pudo marcar listo',
              message: error.message || 'No se pudo marcar el paquete como listo.',
              tone: 'danger',
            });
          } finally {
            setIsWorking(false);
          }
        },
      },
    ]);
  };

  const handleCancel = async () => {
    if (!detail || !session) return;

    if (!canManagePackage) {
      Alert.alert('Permiso requerido', 'No tienes permiso para cancelar paquetes. Permiso requerido: CREATE_CLOSE_CUSTOMER_PACKAGE.');
      return;
    }

    if (!cancelNotes.trim()) {
      Alert.alert('Paquete', 'Captura el motivo de cancelacion.');
      return;
    }

    try {
      setIsWorking(true);
      const updated = await cancelCustomerPackage(detail.id, cancelNotes.trim(), session.userId);
      setDetail(updated);
      setCancelModalVisible(false);
      setCancelNotes('');
      setNotice({
        title: 'Paquete cancelado',
        message: 'Paquete cancelado.',
        tone: 'success',
      });
    } catch (error: any) {
      Alert.alert('Paquete', error.message || 'No se pudo cancelar el paquete.');
    } finally {
      setIsWorking(false);
    }
  };

  if (isLoading || !detail) {
    return (
      <AppShellPage
        title="Detalle de paquete"
        subtitle="Preparacion, pagos y envio"
        activeRoute="customer-packages"
      >
        <ActivityIndicator />
      </AppShellPage>
    );
  }

  const totalAmount = Number(detail.totalAmount ?? 0);
  const paidAmount = Number(detail.paidAmount ?? 0);
  const pendingAmount = Number(detail.pendingAmount ?? 0);
  const customerBalance = Number(balanceSummary?.balance ?? 0);
  const itemCount = Number(detail.totalItems ?? items.length);
  const shipmentCollectAmount = shipments.reduce(
    (sum, shipment) => sum + Number(shipment.expectedCollectionAmount ?? 0),
    0
  );
  const shipmentCollectedAmount = shipments.reduce(
    (sum, shipment) => sum + Number(shipment.collectedAmount ?? 0),
    0
  );
  const latestShipment = shipments[0] ?? null;
  const shipmentState = getShipmentState(detail, shipments);
  const nextStep = getNextStep(detail, hasPending, canReady, shipments);
  const isTerminalPackage = detail.status === 'CANCELLED' || detail.status === 'DELIVERED';
  const primaryAction =
    isTerminalPackage
      ? {
          title: 'Volver a paquetes',
          onPress: () => router.replace(fallbackRoute as any),
          disabled: false,
          disabledReason: '',
        }
      : detail.status === 'READY' || detail.status === 'SHIPPED'
      ? {
          title: latestShipment ? 'Ver envio' : 'Ir a envios',
          onPress: () =>
            latestShipment
              ? router.push(`/shipment-detail?id=${latestShipment.shipmentId}` as any)
              : router.push('/shipments' as any),
          disabled: !canManageShipments,
          disabledReason: 'No tienes permiso para gestionar envios. Permiso requerido: MANAGE_SHIPMENTS.',
        }
        : hasPending
          ? {
              title: 'Registrar abono',
              onPress: openPaymentModal,
              disabled: !canRegisterPayments || isWorking,
              disabledReason: !canRegisterPayments
                ? 'No tienes permiso para registrar abonos. Permiso requerido: REGISTER_PAYMENTS.'
                : 'Ya hay una accion en proceso.',
            }
          : {
              title: 'Marcar listo para envio',
              onPress: handleMarkReady,
              disabled: !canReady || !canManagePackage || isWorking,
              disabledReason: !canManagePackage
                ? 'No tienes permiso para preparar paquetes. Permiso requerido: CREATE_CLOSE_CUSTOMER_PACKAGE.'
                : hasPending
                  ? 'Liquida el saldo pendiente antes de liberar envio.'
                  : itemCount <= 0
                    ? 'Agrega al menos una prenda antes de liberar envio.'
                    : 'Ya hay una accion en proceso.',
            };

  return (
    <AppShellPage
      title="Detalle de paquete"
      subtitle={`${detail.folio} - ${detail.customerName || 'Sin cliente'}`}
      activeRoute="customer-packages"
      rightContent={
        <View style={styles.headerActions}>
          <ScreenPermissionHeaderAction
            screenKey="customerPackageDetail"
            screenTitle="Detalle de paquete"
            session={session}
            buttonStyle={styles.compactActionButton}
          />
          <AppButton
            title="Volver"
            variant="secondary"
            onPress={() => router.replace(fallbackRoute as any)}
            style={styles.compactActionButton}
          />
        </View>
      }
    >
      {notice ? (
        <AppNoticeDropdown
          title={notice.title}
          message={notice.message}
          tone={notice.tone}
          onClose={() => setNotice(null)}
        />
      ) : null}

      <AppCard style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.heroIdentity}>
            <AppText variant="caption" color={theme.colors.mutedText}>
              Paquete {detail.folio}
            </AppText>
            <AppText variant="title" bold numberOfLines={1}>
              {detail.customerName || 'Sin cliente'}
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {detail.customerPhone || 'Sin telefono'} - {detail.branchName || detail.branchCode || 'Sin sucursal'} - {formatDate(detail.createdAt)}
            </AppText>
          </View>
          <View style={styles.heroBadges}>
            <StatusPill label={statusLabel(detail.status)} tone={detail.status === 'CANCELLED' ? 'danger' : 'info'} />
            <StatusPill label={paymentStatusLabel(detail.paymentStatus)} tone={hasPending ? 'warning' : 'success'} />
            <StatusPill label={shipmentState} tone={shipments.length > 0 ? 'info' : 'default'} />
          </View>
        </View>

        <AppResponsiveGrid phoneColumns={2} tabletColumns={3} desktopColumns={6} gap={8} style={styles.metricsGrid}>
          <MetricCard label="Total paquete" value={money(totalAmount)} />
          <MetricCard label="Abonado" value={money(paidAmount)} tone={paidAmount > 0 ? 'success' : 'default'} />
          <MetricCard
            label="Saldo pendiente"
            value={pendingAmount > 0 ? money(pendingAmount) : 'Pagado'}
            tone={pendingAmount > 0 ? 'danger' : 'success'}
          />
          <MetricCard
            label="Saldo a favor"
            value={money(customerBalance)}
            tone={customerBalance > 0 ? 'success' : 'default'}
          />
          <MetricCard
            label="Envio por cobrar"
            value={shipments.length > 0 ? money(shipmentCollectAmount) : 'Sin envio'}
            helper={shipments.length > 0 ? `Cobrado ${money(shipmentCollectedAmount)}` : undefined}
            tone={shipmentCollectAmount > shipmentCollectedAmount ? 'warning' : 'default'}
          />
          <MetricCard label="Prendas" value={String(itemCount)} helper={`${items.length} lineas`} />
        </AppResponsiveGrid>

        <View style={[styles.nextStepRow, { borderTopColor: theme.colors.borderSubtle }]}>
          <View style={styles.nextStepText}>
            <AppText variant="caption" color={theme.colors.mutedText} bold>
              Siguiente paso
            </AppText>
            <AppText>{nextStep}</AppText>
          </View>
          <AppButton
            title={primaryAction.title}
            variant="operation"
            onPress={primaryAction.onPress}
            disabled={primaryAction.disabled}
            disabledReason={primaryAction.disabledReason}
            style={styles.primaryAction}
          />
        </View>
      </AppCard>

      <View style={[styles.contentGrid, !isDesktop ? styles.contentGridStacked : null]}>
        <View style={styles.mainColumn}>
          <AppCard>
            <View style={styles.sectionHeader}>
              <View>
                <AppText variant="subtitle" bold>
                  Prendas del paquete
                </AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  {items.length} prendas incluidas
                </AppText>
              </View>
              <View style={styles.sectionActions}>
                <AppButton
                  title="Buscar prenda"
                  variant="secondary"
                  onPress={() => setItemSearchModalVisible(true)}
                  disabled={!canEdit || !canManageInventory || isWorking}
                  disabledReason={
                    !canManageInventory
                      ? 'No tienes permiso para agregar prendas. Permiso requerido: MANAGE_INVENTORY.'
                      : !canEdit
                        ? 'Solo puedes agregar prendas a paquetes en preparacion.'
                        : 'Ya hay una accion en proceso.'
                  }
                  style={styles.compactActionButton}
                />
                <AppButton
                  title="Por codigo"
                  variant="neutral"
                  onPress={() => setCodeModalVisible(true)}
                  disabled={!canEdit || !canManageInventory || isWorking}
                  disabledReason={
                    !canManageInventory
                      ? 'No tienes permiso para agregar prendas. Permiso requerido: MANAGE_INVENTORY.'
                      : !canEdit
                        ? 'Solo puedes agregar prendas a paquetes en preparacion.'
                        : 'Ya hay una accion en proceso.'
                  }
                  style={styles.compactActionButton}
                />
              </View>
            </View>

            {items.length === 0 ? (
              <View style={[styles.emptyState, { borderColor: theme.colors.borderSubtle }]}>
                <AppText bold>Este paquete todavia no tiene prendas.</AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  Agrega una prenda disponible o vinculada al cliente para continuar.
                </AppText>
              </View>
            ) : (
              <View style={styles.lineList}>
                {items.map((item) => (
                  <PackageItemLine
                    key={item.id}
                    item={item}
                    onOpenItem={(itemId) => router.push(`/items/${itemId}?returnTo=/customer-package-detail?id=${detail.id}` as any)}
                  />
                ))}
              </View>
            )}
          </AppCard>

          <AppCard>
            <View style={styles.sectionHeader}>
              <View>
                <AppText variant="subtitle" bold>
                  Pagos y abonos
                </AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  Resumen financiero del paquete
                </AppText>
              </View>
              <AppButton
                title="Registrar abono"
                variant="operation"
                onPress={openPaymentModal}
                disabled={!hasPending || !canRegisterPayments || isWorking}
                disabledReason={
                  !canRegisterPayments
                    ? 'No tienes permiso para registrar abonos. Permiso requerido: REGISTER_PAYMENTS.'
                    : !hasPending
                      ? 'El paquete ya esta pagado.'
                      : 'Ya hay una accion en proceso.'
                }
                style={styles.compactActionButton}
              />
            </View>

            <AppResponsiveGrid phoneColumns={1} tabletColumns={2} desktopColumns={4} gap={8}>
              <MetricCard label="Total" value={money(totalAmount)} />
              <MetricCard label="Abonado" value={money(paidAmount)} tone={paidAmount > 0 ? 'success' : 'default'} />
              <MetricCard label="Pendiente" value={money(pendingAmount)} tone={pendingAmount > 0 ? 'danger' : 'success'} />
              <MetricCard label="Estado" value={paymentStatusLabel(detail.paymentStatus)} tone={pendingAmount > 0 ? 'warning' : 'success'} />
            </AppResponsiveGrid>

            <View style={[styles.emptyState, { borderColor: theme.colors.borderSubtle }]}>
              <AppText bold>
                {paidAmount > 0 ? 'Abonos aplicados al paquete' : 'Aun no hay pagos registrados para este paquete.'}
              </AppText>
              <AppText variant="caption" color={theme.colors.mutedText}>
                El endpoint actual devuelve acumulados de pago por paquete. El historial detallado queda disponible como backlog read-only.
              </AppText>
            </View>
          </AppCard>
        </View>

        <View style={styles.sideColumn}>
          <AppCard>
            <AppText variant="subtitle" bold>
              Acciones
            </AppText>
            <View style={styles.actionsList}>
              <AppButton
                title="Registrar abono"
                onPress={openPaymentModal}
                disabled={!hasPending || !canRegisterPayments || isWorking}
                disabledReason={
                  !canRegisterPayments
                    ? 'No tienes permiso para registrar abonos. Permiso requerido: REGISTER_PAYMENTS.'
                    : !hasPending
                      ? 'El paquete ya esta pagado.'
                      : 'Ya hay una accion en proceso.'
                }
              />
              <AppButton
                title="Aplicar saldo a favor"
                variant="neutral"
                disabled
                disabledReason={
                  !canApplyCustomerBalance
                    ? 'No tienes permiso para aplicar saldo a favor. Permiso requerido: APPLY_CUSTOMER_BALANCE.'
                    : 'Pendiente: aplicar saldo directo a paquete requiere trazabilidad especifica paquete-saldo.'
                }
              />
              <AppButton
                title="Agregar por QR"
                variant="secondary"
                onPress={() => setQrModalVisible(true)}
                disabled={!canEdit || !canManageInventory || isWorking}
                disabledReason={
                  !canManageInventory
                    ? 'No tienes permiso para agregar prendas. Permiso requerido: MANAGE_INVENTORY.'
                    : !canEdit
                      ? 'Solo puedes agregar prendas a paquetes en preparacion.'
                      : 'Ya hay una accion en proceso.'
                }
              />
              <AppButton
                title="Marcar listo para envio"
                variant="secondary"
                onPress={handleMarkReady}
                loading={isWorking}
                disabled={!canReady || !canManagePackage || isWorking}
                disabledReason={
                  !canManagePackage
                    ? 'No tienes permiso para preparar paquetes. Permiso requerido: CREATE_CLOSE_CUSTOMER_PACKAGE.'
                    : hasPending
                      ? 'Liquida el saldo pendiente antes de liberar envio.'
                      : itemCount <= 0
                        ? 'Agrega al menos una prenda antes de liberar envio.'
                        : 'Ya hay una accion en proceso.'
                }
              />
              <AppButton
                title="Cancelar paquete"
                variant="danger"
                onPress={() => setCancelModalVisible(true)}
                disabled={!canEdit || !canManagePackage || isWorking}
                disabledReason={
                  !canManagePackage
                    ? 'No tienes permiso para cancelar paquetes. Permiso requerido: CREATE_CLOSE_CUSTOMER_PACKAGE.'
                    : !canEdit
                      ? 'Solo puedes cancelar paquetes en preparacion.'
                      : 'Ya hay una accion en proceso.'
                }
              />
            </View>
          </AppCard>

          <AppCard>
            <AppText variant="subtitle" bold>
              Envio
            </AppText>
            <InfoRow label="Estado" value={shipmentState} />
            <InfoRow label="Por cobrar" value={shipments.length > 0 ? money(shipmentCollectAmount) : 'Sin envio'} />
            <InfoRow label="Cobrado" value={shipments.length > 0 ? money(shipmentCollectedAmount) : 'Sin envio'} />
            <InfoRow label="Ultimo envio" value={latestShipment?.shipmentFolio || 'Sin envio'} />
            <View style={styles.sideAction}>
              <AppButton
                title={latestShipment ? 'Ver envio' : 'Ir a envios'}
                variant="secondary"
                onPress={() =>
                  latestShipment
                    ? router.push(`/shipment-detail?id=${latestShipment.shipmentId}` as any)
                    : router.push('/shipments' as any)
                }
                disabled={!canManageShipments}
                disabledReason="No tienes permiso para gestionar envios. Permiso requerido: MANAGE_SHIPMENTS."
              />
            </View>
            {shipments.length > 0 ? (
              <View style={styles.lineList}>
                {shipments.map((shipment) => (
                  <ShipmentLine key={shipment.shipmentPackageId} shipment={shipment} />
                ))}
              </View>
            ) : (
              <AppText variant="caption" color={theme.colors.mutedText}>
                Este paquete todavia no tiene envio asociado.
              </AppText>
            )}
          </AppCard>

          <AppCard>
            <AppText variant="subtitle" bold>
              Cliente y etiqueta
            </AppText>
            <InfoRow label="Cliente" value={detail.customerName || 'Sin cliente'} />
            <InfoRow label="Telefono" value={detail.customerPhone || 'Sin telefono'} />
            <InfoRow label="Sucursal" value={detail.branchName || detail.branchCode || 'Sin sucursal'} />
            {detail.notes ? <InfoRow label="Notas" value={detail.notes} /> : null}
            <PackageLabel detail={detail} />
          </AppCard>
        </View>
      </View>

      <AppBottomModal
        visible={codeModalVisible}
        title="Agregar por codigo"
        onClose={() => setCodeModalVisible(false)}
      >
        <AppInput
          label="Codigo de item"
          value={code}
          onChangeText={setCode}
          placeholder="Ej. IT-0001"
          autoCapitalize="characters"
        />
        <AppButton title="Agregar" onPress={handleAddByCode} loading={isWorking} disabled={isWorking} />
      </AppBottomModal>

      <AppBottomModal
        visible={qrModalVisible}
        title="Agregar por QR"
        onClose={() => setQrModalVisible(false)}
      >
        <AppInput
          label="QR del item"
          value={qrCode}
          onChangeText={setQrCode}
          placeholder="Escanea o captura el QR"
          autoCapitalize="characters"
        />
        <AppButton title="Agregar" onPress={handleAddByQr} loading={isWorking} disabled={isWorking} />
      </AppBottomModal>

      <AppBottomModal
        visible={itemSearchModalVisible}
        title="Buscar prenda"
        onClose={() => setItemSearchModalVisible(false)}
        scroll={false}
      >
        <AppInput
          label="Busqueda"
          value={itemSearch}
          onChangeText={setItemSearch}
          placeholder="Codigo, QR, tipo, marca o talla"
          autoCapitalize="characters"
        />

        <FlatList
          data={filteredBranchItems}
          style={styles.modalList}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <AppOptionRow
              title={item.code}
              subtitle={`${item.productTypeName || 'Sin tipo'} | ${item.brandName || 'Sin marca'} | ${item.sizeName || 'Sin talla'} | ${item.status}`}
              onPress={() => handleAddSearchedItem(item)}
            />
          )}
          ListEmptyComponent={
            <AppText color={theme.colors.mutedText}>
              No hay prendas que coincidan con la busqueda.
            </AppText>
          }
        />
      </AppBottomModal>

      <AppBottomModal
        visible={paymentModalVisible}
        title="Registrar abono"
        onClose={closePaymentModal}
      >
        <AppCard variant="subtle">
          <InfoRow label="Paquete" value={detail.folio} />
          <InfoRow label="Pendiente actual" value={money(detail.pendingAmount)} tone={hasPending ? 'danger' : 'success'} />
          <InfoRow label="Saldo a favor" value={money(balanceSummary?.balance)} tone={customerBalance > 0 ? 'success' : 'default'} />
        </AppCard>

        <AppInput
          label="Monto"
          value={paymentAmount}
          onChangeText={setPaymentAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />
        <AppInput
          label="Referencia"
          value={paymentReference}
          onChangeText={setPaymentReference}
          placeholder="Referencia opcional"
        />

        <View style={styles.compactSelector}>
          <AppText variant="caption" color={theme.colors.mutedText} bold>
            Metodo de pago
          </AppText>
          <AppButton
            title={
              paymentMethods.find((method) => method.id === selectedPaymentMethodId)?.name ||
              'Seleccionar metodo'
            }
            variant="secondary"
            onPress={() => setPaymentMethodPickerVisible((current) => !current)}
            disabled={paymentMethods.length === 0 || isWorking}
            disabledReason="No hay metodos de pago activos para esta sucursal."
          />
          {paymentMethodPickerVisible ? (
            <View style={styles.paymentMethodsList}>
              {paymentMethods.map((method) => {
                const selected = selectedPaymentMethodId === method.id;

                return (
                  <AppOptionRow
                    key={method.id}
                    title={`${selected ? '[x] ' : ''}${method.name}`}
                    subtitle={method.code || 'Metodo activo'}
                    onPress={() => {
                      setSelectedPaymentMethodId(method.id);
                      setPaymentMethodPickerVisible(false);
                    }}
                  />
                );
              })}
            </View>
          ) : null}
        </View>

        <AppButton
          title="Registrar abono"
          variant="operation"
          onPress={handleRegisterPackagePayment}
          loading={isWorking}
          disabled={isWorking || !selectedPaymentMethodId || !canRegisterPayments}
          disabledReason={
            !canRegisterPayments
              ? 'No tienes permiso para registrar abonos. Permiso requerido: REGISTER_PAYMENTS.'
              : 'Selecciona metodo de pago y captura un monto valido.'
          }
        />
      </AppBottomModal>

      <AppBottomModal
        visible={cancelModalVisible}
        title="Cancelar paquete"
        onClose={() => setCancelModalVisible(false)}
      >
        <AppInput
          label="Motivo"
          value={cancelNotes}
          onChangeText={setCancelNotes}
          placeholder="Motivo de cancelacion"
          multiline
        />
        <AppButton
          title="Confirmar cancelacion"
          variant="danger"
          onPress={handleCancel}
          loading={isWorking}
          disabled={isWorking || !canManagePackage}
          disabledReason="No tienes permiso para cancelar paquetes. Permiso requerido: CREATE_CLOSE_CUSTOMER_PACKAGE."
        />
      </AppBottomModal>
    </AppShellPage>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
  },
  heroCard: {
    marginBottom: 12,
  },
  heroHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  heroIdentity: {
    flex: 1,
    minWidth: 240,
  },
  heroBadges: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
  },
  metricsGrid: {
    marginTop: 12,
  },
  metricCard: {
    borderWidth: 1,
    gap: 2,
    marginBottom: 8,
    minHeight: 78,
    padding: 10,
  },
  pill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  nextStepRow: {
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
  },
  nextStepText: {
    flex: 1,
    minWidth: 240,
  },
  primaryAction: {
    minWidth: 180,
  },
  contentGrid: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 14,
  },
  contentGridStacked: {
    flexDirection: 'column',
  },
  mainColumn: {
    flex: 2,
    minWidth: 0,
    width: '100%',
  },
  sideColumn: {
    flex: 1,
    minWidth: 300,
    width: '100%',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
  },
  compactActionButton: {
    minHeight: 32,
    minWidth: 116,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  compactSelector: {
    gap: 8,
    marginBottom: 12,
  },
  actionsList: {
    gap: 8,
  },
  sideAction: {
    marginBottom: 10,
    marginTop: 8,
  },
  lineList: {
    gap: 8,
  },
  compactLine: {
    borderWidth: 1,
    gap: 8,
    padding: 10,
  },
  lineMain: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  lineTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  lineMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  lineActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  lineButton: {
    minWidth: 104,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  infoRow: {
    flexGrow: 1,
    minWidth: 116,
  },
  emptyState: {
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  modalList: {
    maxHeight: 420,
  },
  paymentMethodsList: {
    gap: 8,
    marginBottom: 12,
    marginTop: 8,
  },
  labelBox: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dddddd',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 14,
  },
  labelText: {
    color: '#000000',
    fontSize: 12,
    marginTop: 3,
    textAlign: 'center',
  },
  labelFolio: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    marginTop: 10,
  },
});
