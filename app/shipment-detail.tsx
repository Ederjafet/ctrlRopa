import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppOptionRow from '@/components/ui/AppOptionRow';
import AppShellPage from '@/components/layout/AppShellPage';
import ScreenPermissionHeaderAction from '@/components/ui/ScreenPermissionHeaderAction';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { hasPermission } from '@/services/accessControl';
import { Customer, getCustomersByBranch } from '@/services/customerService';
import { CustomerAddress, getCustomerAddresses } from '@/services/customerAddressService';
import {
  CustomerPackage,
  CustomerPackageDetail,
  getCustomerPackageDetail,
  getCustomerPackagesByCustomer,
} from '@/services/customerPackageService';
import {
  addPackageToShipment,
  cancelShipment,
  collectionStatusLabel,
  dispatchShipment,
  getShipmentDetail,
  paymentModeLabel,
  reopenShipment,
  resolveShipmentPackage,
  ShipmentDetail,
  ShipmentPackageLine,
  ShipmentPackagePaymentMode,
  ShipmentPackageStatus,
  shipmentDeliveryTypeLabel,
  shipmentPackageStatusLabel,
  shipmentStatusLabel,
} from '@/services/shipmentService';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

type NoticeTone = 'success' | 'warning' | 'danger' | 'info';
type NoticeState = {
  tone: NoticeTone;
  title: string;
  message?: string;
} | null;

function money(value?: number | null) {
  return `$${Number(value ?? 0).toFixed(2)} MXN`;
}

function formatDate(value?: string | null) {
  if (!value) return 'Pendiente';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function normalize(value?: string | null) {
  return (value ?? '').toLowerCase().trim();
}

function isActiveCustomer(customer: Customer) {
  return customer.status !== 'INACTIVE' && !customer.isGeneric;
}

function isActiveAddress(address: CustomerAddress) {
  return address.status !== 'INACTIVE';
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

function getDeliveredAt(detail: ShipmentDetail) {
  const dates = detail.packages
    .map((line) => line.deliveredAt)
    .filter((value): value is string => Boolean(value));
  return dates[0] ?? null;
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

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [selectedLine, setSelectedLine] = useState<ShipmentPackageLine | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [packages, setPackages] = useState<CustomerPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<CustomerPackage | null>(null);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<CustomerAddress | null>(null);
  const [paymentMode, setPaymentMode] = useState<ShipmentPackagePaymentMode>('PREPAID');
  const [expectedCodAmount, setExpectedCodAmount] = useState('');

  const [resolutionStatus, setResolutionStatus] = useState<ShipmentPackageStatus>('DELIVERED');
  const [collectedAmount, setCollectedAmount] = useState('');
  const [collectionNotes, setCollectionNotes] = useState('');

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
  const hasGuide = Boolean(detail?.guideReference?.trim());
  const canEdit = detail?.status === 'OPEN';
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

  const filteredCustomers = useMemo(() => {
    const term = normalize(customerSearch);
    const active = customers.filter(isActiveCustomer);
    if (!term) return active.slice(0, 25);
    return active
      .filter((customer) => `${customer.name ?? ''} ${customer.phone ?? ''}`.toLowerCase().includes(term))
      .slice(0, 25);
  }, [customers, customerSearch]);

  const readyPackages = useMemo(
    () => packages.filter((customerPackage) => customerPackage.status === 'READY'),
    [packages]
  );

  const activeAddresses = useMemo(
    () => addresses.filter(isActiveAddress),
    [addresses]
  );

  const dispatchBlockedReason = useMemo(() => {
    if (!detail) return 'No se ha cargado el envio.';
    if (!canManageShipments) return 'No tienes permiso para marcar envios. Permiso requerido: MANAGE_SHIPMENTS.';
    if (isWorking) return 'Espera a que termine la accion actual.';
    if (detail.status !== 'OPEN') return 'Solo los envios abiertos pueden marcarse como enviados.';
    if (detail.packages.length === 0) return 'Agrega al menos un paquete antes de marcar enviado.';
    if (requiresGuide(detail) && !hasGuide) return 'Captura la guia o referencia antes de marcar como enviado.';
    return null;
  }, [canManageShipments, detail, hasGuide, isWorking]);

  const addPackageBlockedReason = isWorking
    ? 'Espera a que termine la accion actual.'
    : !canManageShipments
      ? 'No tienes permiso para agregar paquetes. Permiso requerido: MANAGE_SHIPMENTS.'
      : !selectedPackage && !selectedAddress
        ? 'Selecciona un paquete listo y una direccion activa.'
        : !selectedPackage
          ? 'Selecciona un paquete listo.'
          : !selectedAddress
            ? 'Selecciona una direccion activa.'
            : undefined;

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
          title: 'Agregar paquete',
          message: 'Agrega un paquete listo para envio antes de marcarlo como enviado.',
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
        message: pendingLine
          ? 'Registra si cada paquete fue entregado, no entregado o devuelto.'
          : 'Todas las lineas fueron resueltas. Revisa el resultado de entrega.',
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
  }, [canManageShipments, detail, hasGuide, pendingLine]);

  const resetAddModal = () => {
    setCustomerSearch('');
    setSelectedCustomer(null);
    setPackages([]);
    setSelectedPackage(null);
    setAddresses([]);
    setSelectedAddress(null);
    setPaymentMode('PREPAID');
    setExpectedCodAmount('');
  };

  const openAddModal = async () => {
    if (!session) return;

    try {
      setIsWorking(true);
      const customerData = await getCustomersByBranch(session.branchId);
      setCustomers(customerData);
      resetAddModal();
      setAddModalVisible(true);
    } catch (error: any) {
      setNotice({
        tone: 'danger',
        title: 'No se pudieron cargar los clientes.',
        message: error.message,
      });
    } finally {
      setIsWorking(false);
    }
  };

  const selectCustomer = async (customer: Customer) => {
    try {
      setIsWorking(true);
      setSelectedCustomer(customer);
      setSelectedPackage(null);
      setSelectedAddress(null);

      const [packageData, addressData] = await Promise.all([
        getCustomerPackagesByCustomer(customer.id),
        getCustomerAddresses(customer.id),
      ]);

      setPackages(packageData);
      setAddresses(addressData);
    } catch (error: any) {
      setNotice({
        tone: 'danger',
        title: 'No se pudieron cargar paquetes o direcciones.',
        message: error.message,
      });
    } finally {
      setIsWorking(false);
    }
  };

  const handleAddPackage = async () => {
    if (!detail || !selectedPackage || !selectedAddress) {
      setNotice({
        tone: 'warning',
        title: 'Seleccion incompleta',
        message: 'Selecciona paquete y direccion antes de agregar.',
      });
      return;
    }

    const expected = Number(expectedCodAmount);
    if (paymentMode === 'COD' && (!expectedCodAmount.trim() || Number.isNaN(expected) || expected <= 0)) {
      setNotice({
        tone: 'warning',
        title: 'Monto contra entrega requerido',
        message: 'Captura un monto esperado mayor a 0.',
      });
      return;
    }

    try {
      setIsWorking(true);
      const updated = await addPackageToShipment(detail.id, {
        customerPackageId: selectedPackage.id,
        deliveryAddressId: selectedAddress.id,
        paymentMode,
        expectedCodAmount: paymentMode === 'COD' ? expected : null,
      });

      await updateDetail(updated);
      setAddModalVisible(false);
      resetAddModal();
      setNotice({
        tone: 'success',
        title: 'Paquete agregado al envio.',
        message: 'La vista se actualizo con el paquete relacionado.',
      });
    } catch (error: any) {
      setNotice({
        tone: 'danger',
        title: 'No se pudo agregar el paquete.',
        message: error.message,
      });
    } finally {
      setIsWorking(false);
    }
  };

  const handleDispatch = () => {
    if (!detail || !session) return;

    if (dispatchBlockedReason) {
      setNotice({
        tone: 'warning',
        title: 'No se puede marcar enviado',
        message: dispatchBlockedReason,
      });
      return;
    }

    Alert.alert('Marcar enviado', `Quieres marcar el envio ${detail.folio} como enviado?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Marcar enviado',
        onPress: async () => {
          try {
            setIsWorking(true);
            const updated = await dispatchShipment(detail.id, session.userId);
            await updateDetail(updated);
            setNotice({
              tone: 'success',
              title: 'Envio marcado como enviado.',
              message: 'Ahora puedes confirmar recibido cuando se complete la entrega.',
            });
          } catch (error: any) {
            setNotice({
              tone: 'danger',
              title: 'No se pudo marcar enviado.',
              message: error.message,
            });
          } finally {
            setIsWorking(false);
          }
        },
      },
    ]);
  };

  const handleCancel = () => {
    if (!detail || !session) return;

    Alert.alert('Cancelar envio', `Quieres cancelar el envio ${detail.folio}?`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Cancelar envio',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsWorking(true);
            const updated = await cancelShipment(detail.id, session.userId);
            await updateDetail(updated);
            setNotice({
              tone: 'success',
              title: 'Envio cancelado.',
              message: 'El estado se actualizo correctamente.',
            });
          } catch (error: any) {
            setNotice({
              tone: 'danger',
              title: 'No se pudo cancelar el envio.',
              message: error.message,
            });
          } finally {
            setIsWorking(false);
          }
        },
      },
    ]);
  };

  const handleReopen = () => {
    if (!detail || !session) return;

    Alert.alert('Reabrir envio', `Quieres reabrir el envio ${detail.folio}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Reabrir',
        onPress: async () => {
          try {
            setIsWorking(true);
            const updated = await reopenShipment(detail.id, session.userId);
            await updateDetail(updated);
            setNotice({
              tone: 'success',
              title: 'Envio reabierto.',
              message: 'Ya puedes continuar el flujo operativo.',
            });
          } catch (error: any) {
            setNotice({
              tone: 'danger',
              title: 'No se pudo reabrir el envio.',
              message: error.message,
            });
          } finally {
            setIsWorking(false);
          }
        },
      },
    ]);
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
          {renderMetric('Guia', detail.guideReference || 'Pendiente', requiresGuide(detail) && !hasGuide ? 'warning' : 'success')}
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
    const guide = detail.guideReference || firstPackage?.trackingNumber;
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

        {requiresGuide(detail) && !detail.guideReference?.trim() ? (
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
              Cobrado: {money(line.collectedAmount)} · Diferencia: {money(line.collectionDifference)} · Resultado: {collectionStatusLabel(line.collectionStatus)}
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
                    {[item.productType, item.size, item.brand].filter(Boolean).join(' · ') || item.packageFolio}
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
    const deliveredAt = getDeliveredAt(detail);
    const steps = [
      { label: 'Envio creado', value: formatDate(detail.createdAt), done: Boolean(detail.createdAt) },
      { label: 'Guia registrada', value: detail.guideReference || 'Pendiente', done: hasGuide },
      { label: 'Marcado enviado', value: formatDate(detail.dispatchedAt), done: Boolean(detail.dispatchedAt) },
      { label: 'Recibido / resuelto', value: formatDate(deliveredAt), done: Boolean(deliveredAt) || detail.status === 'DELIVERED' },
      { label: 'Cancelado', value: formatDate(detail.cancelledAt), done: Boolean(detail.cancelledAt) },
    ];

    return (
      <AppCard>
        <AppText variant="subtitle" bold>
          Linea de tiempo
        </AppText>
        <View style={styles.timeline}>
          {steps.map((step) => (
            <View key={step.label} style={styles.timelineRow}>
              <View
                style={[
                  styles.timelineDot,
                  {
                    backgroundColor: step.done ? theme.colors.success : theme.colors.surfaceAlt,
                    borderColor: step.done ? theme.colors.success : theme.colors.border,
                  },
                ]}
              />
              <View style={styles.flex1}>
                <AppText bold={step.done}>{step.label}</AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  {step.value}
                </AppText>
              </View>
            </View>
          ))}
        </View>
      </AppCard>
    );
  };

  const renderActions = () => {
    if (!detail) return null;
    const canConfirm = Boolean(pendingLine) && detail.status === 'OUT_FOR_DELIVERY';

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

          {canConfirm && pendingLine ? (
            <AppButton
              title="Confirmar recibido"
              onPress={() => openResolveModal(pendingLine, 'DELIVERED')}
              loading={isWorking}
              disabled={!canManageShipments || isWorking}
              disabledReason="No tienes permiso para confirmar entrega. Permiso requerido: MANAGE_SHIPMENTS."
            />
          ) : null}

          {canEdit ? (
            <AppButton
              title="Agregar paquete"
              variant="secondary"
              onPress={openAddModal}
              loading={isWorking}
              disabled={!canManageShipments || isWorking}
              disabledReason="No tienes permiso para agregar paquetes. Permiso requerido: MANAGE_SHIPMENTS."
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
              disabled={!canManageShipments || isWorking}
              disabledReason="No tienes permiso para cancelar envios. Permiso requerido: MANAGE_SHIPMENTS."
            />
          ) : null}

          {canReopen ? (
            <AppButton
              title="Reabrir envio"
              onPress={handleReopen}
              loading={isWorking}
              disabled={!canManageShipments || isWorking}
              disabledReason="No tienes permiso para reabrir envios. Permiso requerido: MANAGE_SHIPMENTS."
            />
          ) : null}
        </View>
      </AppCard>
    );
  };

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
        subtitle={`${detail.folio} · ${primaryLine?.customerPackageFolio || primaryPackage?.folio || 'Sin paquete'} · ${customerName}`}
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
        visible={addModalVisible}
        title="Agregar paquete al envio"
        onClose={() => setAddModalVisible(false)}
        maxHeight="90%"
      >
        <AppText bold>Cliente</AppText>
        {selectedCustomer ? (
          <AppCard>
            <AppText bold>{selectedCustomer.name}</AppText>
            <AppText color={theme.colors.mutedText}>{selectedCustomer.phone || 'Sin telefono'}</AppText>
            <AppButton title="Cambiar cliente" variant="secondary" onPress={() => setSelectedCustomer(null)} />
          </AppCard>
        ) : (
          <>
            <AppInput placeholder="Buscar cliente" value={customerSearch} onChangeText={setCustomerSearch} />
            {filteredCustomers.map((customer) => (
              <AppOptionRow
                key={customer.id}
                title={customer.name}
                subtitle={customer.phone || 'Sin telefono'}
                onPress={() => selectCustomer(customer)}
              />
            ))}
          </>
        )}

        {selectedCustomer ? (
          <>
            <AppText bold style={styles.modalSectionTitle}>Paquete listo</AppText>
            {readyPackages.length === 0 ? (
              <AppText color={theme.colors.mutedText}>Este cliente no tiene paquetes READY.</AppText>
            ) : (
              readyPackages.map((customerPackage) => (
                <AppOptionRow
                  key={customerPackage.id}
                  title={customerPackage.folio}
                  subtitle={`Estado: ${customerPackage.status}`}
                  onPress={() => setSelectedPackage(customerPackage)}
                >
                  {selectedPackage?.id === customerPackage.id ? <AppText bold>Seleccionado</AppText> : null}
                </AppOptionRow>
              ))
            )}

            <AppText bold style={styles.modalSectionTitle}>Direccion</AppText>
            {activeAddresses.length === 0 ? (
              <AppText color={theme.colors.mutedText}>Este cliente no tiene direcciones activas.</AppText>
            ) : (
              activeAddresses.map((address) => (
                <AppOptionRow
                  key={address.id}
                  title={address.label}
                  subtitle={`${address.line1}${address.city ? ` · ${address.city}` : ''}`}
                  onPress={() => setSelectedAddress(address)}
                >
                  {selectedAddress?.id === address.id ? <AppText bold>Seleccionada</AppText> : null}
                </AppOptionRow>
              ))
            )}

            <AppText bold style={styles.modalSectionTitle}>Modo de cobro</AppText>
            <View style={styles.typeRow}>
              <Pressable
                onPress={() => setPaymentMode('PREPAID')}
                style={({ pressed }) => [
                  styles.typeOption,
                  {
                    borderColor: paymentMode === 'PREPAID' ? theme.colors.accent : theme.colors.border,
                    backgroundColor: paymentMode === 'PREPAID' ? theme.colors.optionPressedBackground : theme.colors.surface,
                    borderRadius: theme.radius.md,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <AppText bold>Pagado</AppText>
              </Pressable>

              <Pressable
                onPress={() => setPaymentMode('COD')}
                style={({ pressed }) => [
                  styles.typeOption,
                  {
                    borderColor: paymentMode === 'COD' ? theme.colors.accent : theme.colors.border,
                    backgroundColor: paymentMode === 'COD' ? theme.colors.optionPressedBackground : theme.colors.surface,
                    borderRadius: theme.radius.md,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <AppText bold>Contra entrega</AppText>
              </Pressable>
            </View>

            {paymentMode === 'COD' ? (
              <AppInput
                label="Monto esperado COD"
                value={expectedCodAmount}
                onChangeText={setExpectedCodAmount}
                keyboardType="numeric"
                placeholder="0.00"
              />
            ) : null}

            <AppButton
              title={isWorking ? 'Agregando...' : 'Agregar paquete'}
              onPress={handleAddPackage}
              loading={isWorking}
              disabled={Boolean(addPackageBlockedReason)}
              disabledReason={addPackageBlockedReason}
            />
          </>
        ) : null}
      </AppBottomModal>

      <AppBottomModal
        visible={resolveModalVisible}
        title={resolutionStatus === 'DELIVERED' ? 'Confirmar recibido' : 'Resolver entrega'}
        onClose={() => setResolveModalVisible(false)}
      >
        <AppText bold>
          {selectedLine?.customerPackageFolio || 'Paquete'} · {shipmentPackageStatusLabel(resolutionStatus)}
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
    </>
  );
}

const styles = StyleSheet.create({
  actionStack: {
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
  modalSectionTitle: {
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
