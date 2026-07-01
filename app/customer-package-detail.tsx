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
import { getCustomerAddresses, type CustomerAddress } from '@/services/customerAddressService';
import {
  addCustomerPackageItemByCode,
  addCustomerPackageItemByQr,
  canMarkCustomerPackageReady,
  cancelCustomerPackage,
  CustomerPackageAddressSource,
  CustomerPackageDetail,
  CustomerPackageDeliveryType,
  CustomerPackageItemLine,
  CustomerPackageShipmentLine,
  getCustomerPackageDetail,
  getCustomerPackageDetailByFolio,
  isCustomerPackageOpen,
  markCustomerPackageReady,
  removeCustomerPackageItem,
  updateCustomerPackageShipping,
} from '@/services/customerPackageService';
import { getItemsByBranch, Item } from '@/services/itemService';
import { createPaymentByPackageFolio } from '@/services/paymentService';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ReactNode, useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
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
  if (status === 'READY') return 'Listo para envío';
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

function deliveryTypeLabel(type?: string | null) {
  if (type === 'PARCEL_SERVICE') return 'Paqueteria';
  if (type === 'LOCAL_DELIVERY') return 'Entrega local';
  if (type === 'STORE_PICKUP') return 'Recoleccion en tienda';
  if (type === 'CUSTOMER_PROVIDED_LABEL') return 'Cliente envia guía';
  if (type === 'COLLECT_SHIPPING') return 'Envío por cobrar';
  if (type === 'OTHER') return 'Otro';
  return type || 'Sin definir';
}

function addressSourceLabel(source?: string | null) {
  if (source === 'CUSTOMER_PRIMARY_ADDRESS') return 'Dirección principal';
  if (source === 'CUSTOMER_SAVED_ADDRESS') return 'Dirección guardada';
  if (source === 'CUSTOM_PACKAGE_ADDRESS') return 'Dirección del paquete';
  if (source === 'PICKUP_NO_ADDRESS') return 'Sin dirección';
  if (source === 'CUSTOMER_PROVIDED_LABEL') return 'Guia del cliente';
  if (source === 'LOCAL_DELIVERY') return 'Entrega local';
  return source || 'Sin fuente';
}

function deliveryRequiresAddress(type?: string | null) {
  return type === 'PARCEL_SERVICE' || type === 'LOCAL_DELIVERY' || type === 'COLLECT_SHIPPING';
}

function deliveryUsesPackageCost(type?: string | null) {
  return Boolean(type) && type !== 'STORE_PICKUP' && type !== 'CUSTOMER_PROVIDED_LABEL' && type !== 'COLLECT_SHIPPING';
}

const DELIVERY_TYPE_OPTIONS: {
  type: CustomerPackageDeliveryType;
  title: string;
  description: string;
}[] = [
  {
    type: 'PARCEL_SERVICE',
    title: 'Paqueteria',
    description: 'Requiere dirección y costo de envío o por cobrar.',
  },
  {
    type: 'LOCAL_DELIVERY',
    title: 'Entrega local',
    description: 'Requiere dirección y costo o envío sin costo.',
  },
  {
    type: 'STORE_PICKUP',
    title: 'Recoleccion',
    description: 'No requiere dirección y confirma costo cero.',
  },
  {
    type: 'CUSTOMER_PROVIDED_LABEL',
    title: 'Cliente envia guía',
    description: 'No suma costo al paquete; captura guía o nota.',
  },
  {
    type: 'COLLECT_SHIPPING',
    title: 'Por cobrar',
    description: 'Requiere dirección; el cliente paga al recibir.',
  },
];

function formatPackageAddress(detail?: CustomerPackageDetail | null) {
  const parts = [
    detail?.shipToLine1,
    detail?.shipToLine2,
    detail?.shipToCity,
    detail?.shipToState,
    detail?.shipToPostalCode,
    detail?.shipToCountry,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Sin dirección';
}

function hasPackageAddressSnapshot(detail?: CustomerPackageDetail | null) {
  return Boolean(
    detail?.shipToName ||
      detail?.shipToPhone ||
      detail?.shipToLine1 ||
      detail?.shipToCity ||
      detail?.shipToState ||
      detail?.shipToPostalCode
  );
}

function getShippingCostText(detail?: CustomerPackageDetail | null) {
  if (!detail?.shippingCostConfirmed) {
    return detail?.shippingCostAmount != null ? `Capturado: ${money(detail.shippingCostAmount)}` : 'Pendiente';
  }

  if (detail.shippingCollect) return 'Por cobrar';
  if (detail.customerProvidedLabel) return 'Guia del cliente';
  if (detail.shippingCostWaived) return 'Sin costo';
  return money(detail.shippingCostAmount);
}

function getShippingReadiness(detail: CustomerPackageDetail | null, hasPending: boolean) {
  if (!detail) {
    return {
      label: 'Incompleto',
      tone: 'warning' as const,
      nextStep: 'Carga el paquete para revisar dirección y envío.',
      typeReady: false,
      addressReady: false,
      costReady: false,
      paymentReady: false,
    };
  }

  const typeReady = Boolean(detail.deliveryType);
  const addressRequired = deliveryRequiresAddress(detail.deliveryType);
  const addressReady =
    typeReady &&
    (!addressRequired ||
      (detail.shippingAddressConfirmed === true &&
        Boolean(detail.shippingAddressSource) &&
        hasPackageAddressSnapshot(detail)));
  const costReady = typeReady && detail.shippingCostConfirmed === true;
  const paymentReady = !hasPending;

  if (!typeReady) {
    return {
      label: 'Incompleto',
      tone: 'warning' as const,
      nextStep: 'Selecciona el tipo de entrega.',
      typeReady,
      addressReady: false,
      costReady: false,
      paymentReady,
    };
  }

  if (!addressReady) {
    return {
      label: 'Dirección pendiente',
      tone: 'warning' as const,
      nextStep: 'Captura o selecciona la dirección de envío.',
      typeReady,
      addressReady,
      costReady,
      paymentReady,
    };
  }

  if (!costReady) {
    return {
      label: 'Costo pendiente',
      tone: 'warning' as const,
      nextStep: 'Confirma costo de envío, envío sin costo, por cobrar o guía del cliente.',
      typeReady,
      addressReady,
      costReady,
      paymentReady,
    };
  }

  if (!paymentReady) {
    return {
      label: 'Listo para cobrar',
      tone: 'info' as const,
      nextStep: `Falta cubrir saldo pendiente de ${money(detail.pendingAmount)}.`,
      typeReady,
      addressReady,
      costReady,
      paymentReady,
    };
  }

  return {
    label: 'Listo para envío',
    tone: 'success' as const,
    nextStep: 'Mercancia pagada. Revisa el envío asociado desde Envíos.',
    typeReady,
    addressReady,
    costReady,
    paymentReady,
  };
}

function compactDate(value?: string | null) {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function getRemoveItemBlockedReason(
  item: CustomerPackageItemLine,
  canEditPackage: boolean,
  canManagePackage: boolean,
  isWorking: boolean
) {
  if (isWorking) return 'Ya hay una accion en proceso.';
  if (item.canRemove === true) return '';
  if (item.canRemove === false && item.removeBlockedReason) return item.removeBlockedReason;
  if (!canManagePackage) return 'No tienes permiso para quitar prendas del paquete.';
  if (!canEditPackage) return 'No puedes quitar prendas cuando el paquete ya esta listo para envío, enviado, cerrado o cancelado.';
  if (Number(item.paidAmount ?? 0) > 0) {
    return 'Esta prenda ya tiene abono aplicado. Para quitarla se requiere ajustar el pago o generar saldo a favor.';
  }
  return '';
}

function getRemoveBlockedSummary(reason: string) {
  if (reason.includes('abono')) return 'Tiene abono aplicado.';
  if (reason.includes('permiso')) return 'Sin permiso para quitar.';
  if (reason.includes('listo') || reason.includes('enviado') || reason.includes('cancelado')) {
    return 'Paquete no editable.';
  }
  if (reason.includes('accion en proceso')) return 'Accion en proceso.';
  return reason;
}

function getMarkReadyBlockedReason(
  detail: CustomerPackageDetail | null,
  canManagePackage: boolean,
  isWorking: boolean
) {
  if (isWorking) return 'Ya hay una accion en proceso.';
  if (!detail) return 'No se pudo cargar el paquete.';
  if (!canManagePackage) return 'No tienes permiso para marcar listo para envío. Permiso requerido: CREATE_CLOSE_CUSTOMER_PACKAGE.';
  if (detail.status !== 'OPEN') return `El paquete no puede prepararse para envío en su estado actual: ${statusLabel(detail.status)}.`;
  if (Number(detail.totalItems ?? 0) <= 0) return 'Agrega al menos una prenda antes de liberar envío.';
  if (!detail.deliveryType) return 'Selecciona el tipo de entrega antes de marcar listo para envío.';
  if (
    deliveryRequiresAddress(detail.deliveryType) &&
    (detail.shippingAddressConfirmed !== true || !detail.shippingAddressSource || !hasPackageAddressSnapshot(detail))
  ) {
    return 'Captura o selecciona la dirección de envío antes de marcar listo para envío.';
  }
  if (detail.shippingCostConfirmed !== true) {
    return 'Confirma el costo de envío o marca una opcion sin costo/por cobrar.';
  }
  if (Number(Number(detail.pendingAmount ?? 0).toFixed(2)) > 0) {
    return `No puedes marcar listo para envío porque el paquete tiene saldo pendiente de ${money(detail.pendingAmount)}.`;
  }
  if (detail.canMarkReadyForShipment === true) return '';
  if (detail.markReadyForShipmentBlockedReason) return detail.markReadyForShipmentBlockedReason;
  return '';
}

function getShipmentState(detail: CustomerPackageDetail, shipments: CustomerPackageShipmentLine[]) {
  if (shipments.length > 0) {
    const latest = shipments[0];
    return `${statusLabel(latest.shipmentStatus)} / ${statusLabel(latest.packageShipmentStatus)}`;
  }

  if (detail.status === 'READY') return 'Listo, sin envío';
  if (detail.status === 'SHIPPED') return 'Enviado';
  if (detail.status === 'DELIVERED') return 'Entregado';
  return 'Sin envío';
}

function getNextStep(
  detail: CustomerPackageDetail,
  hasPending: boolean,
  canReady: boolean,
  shippingConfirmed: boolean,
  addressReady: boolean,
  shipments: CustomerPackageShipmentLine[]
) {
  if (detail.status === 'CANCELLED') return 'Paquete cancelado. No requiere acciones operativas.';
  if (detail.status === 'DELIVERED') return 'Paquete entregado. Conserva la consulta de pagos y envío.';
  if (shipments.length > 0 && detail.status === 'SHIPPED') {
    return 'Enviado. Da seguimiento desde el detalle del envío asociado.';
  }
  if (detail.status === 'READY') return 'Listo para envío. Registra o revisa el envío asociado.';
  if (!detail.deliveryType) return 'Falta seleccionar el tipo de entrega.';
  if (!addressReady) return 'Falta confirmar la dirección o modalidad de entrega.';
  if (!shippingConfirmed) return 'Mercancia pagada. Crea o revisa el envío desde Envíos.';
  if (hasPending) return 'Falta registrar abono para liberar el envío.';
  if ((detail.totalItems ?? 0) <= 0) return 'Agrega prendas antes de preparar el envío.';
  if (canReady) return 'Paquete pagado. Puedes marcarlo listo para envío.';
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

function ShippingStep({
  number,
  title,
  status,
  tone = 'default',
  children,
}: {
  number: number;
  title: string;
  status: string;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  children: ReactNode;
}) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.shippingStep, { borderColor: theme.colors.borderSubtle, backgroundColor: theme.colors.surfaceAlt }]}>
      <View style={styles.shippingStepHeader}>
        <View style={[styles.stepNumber, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <AppText variant="caption" bold>
            {number}
          </AppText>
        </View>
        <View style={styles.stepTitleBlock}>
          <AppText bold>{title}</AppText>
        </View>
        <StatusPill label={status} tone={tone} />
      </View>
      <View style={styles.shippingStepBody}>{children}</View>
    </View>
  );
}

function SelectableCard({
  title,
  subtitle,
  selected,
  disabled,
  disabledReason,
  onPress,
}: {
  title: string;
  subtitle: string;
  selected: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      onPress={() => {
        if (disabled) {
          Alert.alert('Accion no disponible', disabledReason || 'Revisa los datos requeridos antes de continuar.');
          return;
        }
        onPress();
      }}
      style={({ pressed }) => [
        styles.selectableCard,
        {
          borderColor: selected ? theme.colors.accent : theme.colors.border,
          backgroundColor: selected ? theme.colors.optionPressedBackground : theme.colors.surface,
          opacity: disabled ? 0.5 : pressed ? 0.78 : 1,
        },
      ]}
    >
      <AppText bold color={selected ? theme.colors.accent : theme.colors.text}>
        {title}
      </AppText>
      <AppText variant="caption" color={theme.colors.mutedText}>
        {subtitle}
      </AppText>
    </Pressable>
  );
}

function PackageItemLine({
  item,
  onOpenItem,
  onRemoveItem,
  removeBlockedReason,
}: {
  item: CustomerPackageItemLine;
  onOpenItem: (itemId: number) => void;
  onRemoveItem: (item: CustomerPackageItemLine) => void;
  removeBlockedReason: string;
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
        <AppButton
          title="Quitar"
          variant="neutral"
          onPress={() => onRemoveItem(item)}
          style={styles.lineButton}
        />
        {removeBlockedReason ? (
          <AppText variant="caption" color={theme.colors.mutedText} style={styles.removeBlockedText}>
            {getRemoveBlockedSummary(removeBlockedReason)}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

function ShipmentLine({ shipment }: { shipment: CustomerPackageShipmentLine }) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.compactLine, { borderColor: theme.colors.borderSubtle, backgroundColor: theme.colors.surfaceAlt }]}>
      <View style={styles.lineMain}>
        <View style={styles.lineTitleBlock}>
          <AppText bold numberOfLines={1}>
            {shipment.shipmentFolio || `Envío #${shipment.shipmentId}`}
          </AppText>
          <AppText variant="caption" color={theme.colors.mutedText}>
            Paquete vinculado: {statusLabel(shipment.packageShipmentStatus)}
          </AppText>
        </View>
        <StatusPill label={statusLabel(shipment.shipmentStatus)} tone="info" />
      </View>
      <AppText variant="caption" color={theme.colors.mutedText}>
        La dirección, guía, costo, reparto y pagos se consultan en Envíos.
      </AppText>
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
  const [removeItemCandidate, setRemoveItemCandidate] = useState<CustomerPackageItemLine | null>(null);
  const [removeItemError, setRemoveItemError] = useState<string | null>(null);
  const [markReadyModalVisible, setMarkReadyModalVisible] = useState(false);
  const [markReadyError, setMarkReadyError] = useState<string | null>(null);
  const [itemSearchModalVisible, setItemSearchModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentMethodPickerVisible, setPaymentMethodPickerVisible] = useState(false);
  const [code, setCode] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<number | null>(null);
  const [customerAddresses, setCustomerAddresses] = useState<CustomerAddress[]>([]);
  const [deliveryType, setDeliveryType] = useState<CustomerPackageDeliveryType | null>(null);
  const [addressSource, setAddressSource] = useState<CustomerPackageAddressSource>('CUSTOM_PACKAGE_ADDRESS');
  const [sourceCustomerAddressId, setSourceCustomerAddressId] = useState<number | null>(null);
  const [addressLabel, setAddressLabel] = useState('');
  const [shipToName, setShipToName] = useState('');
  const [shipToPhone, setShipToPhone] = useState('');
  const [shipToLine1, setShipToLine1] = useState('');
  const [shipToLine2, setShipToLine2] = useState('');
  const [shipToCity, setShipToCity] = useState('');
  const [shipToState, setShipToState] = useState('');
  const [shipToPostalCode, setShipToPostalCode] = useState('');
  const [shipToCountry, setShipToCountry] = useState('Mexico');
  const [shipToReferences, setShipToReferences] = useState('');
  const [saveAddressToCustomer, setSaveAddressToCustomer] = useState(false);
  const [makePrimaryAddress, setMakePrimaryAddress] = useState(false);
  const [shippingCostInput, setShippingCostInput] = useState('');
  const [shippingCostWaived, setShippingCostWaived] = useState(false);
  const [shippingCarrier, setShippingCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingNotes, setShippingNotes] = useState('');
  const [isSavingShipping, setIsSavingShipping] = useState(false);
  const [cancelNotes, setCancelNotes] = useState('');
  const [branchItems, setBranchItems] = useState<Item[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [balanceSummary, setBalanceSummary] = useState<BalanceSummary | null>(null);
  const [notice, setNotice] = useState<{
    title: string;
    message: string;
    tone: 'success' | 'warning' | 'danger' | 'info';
  } | null>(null);

  const syncShippingForm = useCallback((packageDetail: CustomerPackageDetail) => {
    const confirmed = packageDetail.shippingCostConfirmed === true;
    const nextDeliveryType = packageDetail.deliveryType ?? null;
    const nextAddressSource = packageDetail.shippingAddressSource ?? (nextDeliveryType && deliveryRequiresAddress(nextDeliveryType) ? 'CUSTOM_PACKAGE_ADDRESS' : 'PICKUP_NO_ADDRESS');
    setDeliveryType(nextDeliveryType);
    setAddressSource(nextAddressSource);
    setSourceCustomerAddressId(packageDetail.sourceCustomerAddressId ?? null);
    setShipToName(packageDetail.shipToName ?? packageDetail.customerName ?? '');
    setShipToPhone(packageDetail.shipToPhone ?? packageDetail.customerPhone ?? '');
    setShipToLine1(packageDetail.shipToLine1 ?? '');
    setShipToLine2(packageDetail.shipToLine2 ?? '');
    setShipToCity(packageDetail.shipToCity ?? '');
    setShipToState(packageDetail.shipToState ?? '');
    setShipToPostalCode(packageDetail.shipToPostalCode ?? '');
    setShipToCountry(packageDetail.shipToCountry ?? 'Mexico');
    setShipToReferences(packageDetail.shipToReferences ?? '');
    setSaveAddressToCustomer(false);
    setMakePrimaryAddress(false);
    setAddressLabel('');
    setShippingCostWaived(packageDetail.shippingCostWaived === true);
    setShippingCostInput(
      confirmed && packageDetail.shippingCostAmount != null
        ? Number(packageDetail.shippingCostAmount).toFixed(2)
        : ''
    );
    setShippingCarrier(packageDetail.shippingCarrier ?? '');
    setTrackingNumber(packageDetail.trackingNumber ?? '');
    setShippingNotes(packageDetail.shippingNotes ?? '');
  }, []);

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
      syncShippingForm(packageDetail);
      const [itemsData, methodsData, balanceData, addressesData] = await Promise.all([
        getItemsByBranch(packageDetail.branchId),
        getPaymentMethods(packageDetail.branchId),
        getBalanceByPackageFolio(packageDetail.folio),
        getCustomerAddresses(packageDetail.customerId),
      ]);
      setBranchItems(itemsData);
      setPaymentMethods(methodsData);
      setCustomerAddresses(addressesData.filter((address) => address.status !== 'INACTIVE'));
      setSelectedPaymentMethodId((current) => current ?? methodsData[0]?.id ?? null);
      setBalanceSummary(balanceData);
    } catch (error: any) {
      Alert.alert('Paquete', error.message || 'No se pudo cargar el paquete.');
    } finally {
      setIsLoading(false);
    }
  }, [folio, packageId, router, syncShippingForm]);

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
  const canEditShipping = detail?.status === 'OPEN' || detail?.status === 'READY';
  const canReady = canMarkCustomerPackageReady(detail);
  const hasPending = Number(Number(detail?.pendingAmount ?? 0).toFixed(2)) > 0;
  const items = useMemo(() => detail?.items ?? [], [detail?.items]);
  const shipments = useMemo(() => detail?.shipments ?? [], [detail?.shipments]);
  const shippingConfirmed = detail?.shippingCostConfirmed === true;
  const addressConfirmed = detail?.shippingAddressConfirmed === true;
  const requiresAddress = deliveryRequiresAddress(deliveryType);
  const costEditable = deliveryUsesPackageCost(deliveryType);
  const currentShippingCost = shippingConfirmed ? Number(detail?.shippingCostAmount ?? 0) : 0;
  const currentShippingWaived = detail?.shippingCostWaived === true;
  const shippingStatusText = !shippingConfirmed
    ? 'No definido'
    : detail?.shippingCollect
      ? 'Por cobrar'
      : detail?.customerProvidedLabel
        ? 'Guia del cliente'
        : currentShippingWaived
      ? 'Sin costo'
      : 'Confirmado';
  const primaryAddress = customerAddresses.find((address) => address.isDefault) ?? null;
  const selectedSavedAddress = sourceCustomerAddressId
    ? customerAddresses.find((address) => address.id === sourceCustomerAddressId) ?? null
    : null;
  const shippingReadiness = getShippingReadiness(detail, hasPending);
  const savedRequiresAddress = deliveryRequiresAddress(detail?.deliveryType);
  const savedAddressText =
    !detail?.deliveryType
      ? 'Pendiente'
      : savedRequiresAddress
        ? shippingReadiness.addressReady
          ? 'Confirmada'
          : 'Pendiente'
        : 'No aplica';
  const savedAddressSourceText =
    !detail?.deliveryType
      ? 'Pendiente'
      : savedRequiresAddress
        ? detail.shippingAddressSource
          ? addressSourceLabel(detail.shippingAddressSource)
          : 'Pendiente'
        : addressSourceLabel(detail.shippingAddressSource);
  const hasLegacyPartialShipping = Boolean(
    detail &&
      !detail.deliveryType &&
      (detail.shippingCostConfirmed ||
        detail.shippingAddressConfirmed ||
        detail.shippingCarrier ||
        detail.trackingNumber ||
        detail.shippingCostAmount != null)
  );
  const savedFormAddressSource =
    detail?.shippingAddressSource ?? (detail?.deliveryType && deliveryRequiresAddress(detail.deliveryType) ? 'CUSTOM_PACKAGE_ADDRESS' : 'PICKUP_NO_ADDRESS');
  const typeDraftChanged = Boolean(detail && deliveryType !== (detail.deliveryType ?? null));
  const addressDraftChanged = Boolean(
    detail &&
      (addressSource !== savedFormAddressSource ||
        sourceCustomerAddressId !== (detail.sourceCustomerAddressId ?? null) ||
        shipToName !== (detail.shipToName ?? detail.customerName ?? '') ||
        shipToPhone !== (detail.shipToPhone ?? detail.customerPhone ?? '') ||
        shipToLine1 !== (detail.shipToLine1 ?? '') ||
        shipToLine2 !== (detail.shipToLine2 ?? '') ||
        shipToCity !== (detail.shipToCity ?? '') ||
        shipToState !== (detail.shipToState ?? '') ||
        shipToPostalCode !== (detail.shipToPostalCode ?? '') ||
        shipToCountry !== (detail.shipToCountry ?? 'Mexico') ||
        shipToReferences !== (detail.shipToReferences ?? ''))
  );
  const costDraftChanged = Boolean(
    detail &&
      (shippingCostWaived !== (detail.shippingCostWaived === true) ||
        shippingCostInput !== (detail.shippingCostConfirmed === true && detail.shippingCostAmount != null ? Number(detail.shippingCostAmount).toFixed(2) : '') ||
        shippingCarrier !== (detail.shippingCarrier ?? '') ||
        trackingNumber !== (detail.trackingNumber ?? '') ||
        shippingNotes !== (detail.shippingNotes ?? ''))
  );
  const hasShippingDraftChanges = Boolean(
    detail &&
      (typeDraftChanged || addressDraftChanged || costDraftChanged)
  );

  const canManagePackage = hasPermission(session, 'CREATE_CLOSE_CUSTOMER_PACKAGE');
  const canRegisterPayments = hasPermission(session, 'REGISTER_PAYMENTS');
  const canApplyCustomerBalance = hasPermission(session, 'APPLY_CUSTOMER_BALANCE');
  const canManageInventory = hasPermission(session, 'MANAGE_INVENTORY');
  const canManageShipments = hasPermission(session, 'MANAGE_SHIPMENTS');
  const markReadyBlockedReason = getMarkReadyBlockedReason(detail, canManagePackage, isWorking);

  const handleSelectDeliveryType = (type: CustomerPackageDeliveryType) => {
    setDeliveryType(type);

    if (type === 'STORE_PICKUP') {
      setAddressSource('PICKUP_NO_ADDRESS');
      setSourceCustomerAddressId(null);
      setShippingCostWaived(true);
      setShippingCostInput('0.00');
      return;
    }

    if (type === 'CUSTOMER_PROVIDED_LABEL') {
      setAddressSource('CUSTOMER_PROVIDED_LABEL');
      setSourceCustomerAddressId(null);
      setShippingCostWaived(true);
      setShippingCostInput('0.00');
      return;
    }

    if (type === 'COLLECT_SHIPPING') {
      setShippingCostWaived(true);
      setShippingCostInput('0.00');
      setAddressSource(primaryAddress ? 'CUSTOMER_PRIMARY_ADDRESS' : 'CUSTOM_PACKAGE_ADDRESS');
      setSourceCustomerAddressId(primaryAddress?.id ?? null);
      return;
    }

    setAddressSource(primaryAddress ? 'CUSTOMER_PRIMARY_ADDRESS' : 'CUSTOM_PACKAGE_ADDRESS');
    setSourceCustomerAddressId(primaryAddress?.id ?? null);
    if (detail?.deliveryType !== type && (detail?.shippingCollect || detail?.customerProvidedLabel)) {
      setShippingCostWaived(false);
      setShippingCostInput('');
    }
  };

  const removeItemPreview = useMemo(() => {
    if (!detail || !removeItemCandidate) return null;

    const nextSubtotal = Math.max(0, Number(detail.itemSubtotalAmount ?? 0) - Number(removeItemCandidate.price ?? 0));
    const nextPaid = Math.max(0, Number(detail.paidAmount ?? 0) - Number(removeItemCandidate.paidAmount ?? 0));
    const nextTotal = nextSubtotal + currentShippingCost;
    const nextPending = Math.max(0, nextTotal - nextPaid);
    const credit = Number(removeItemCandidate.creditAmount ?? removeItemCandidate.paidAmount ?? 0);

    return {
      subtotal: nextSubtotal,
      shipping: currentShippingCost,
      total: nextTotal,
      paid: nextPaid,
      pending: nextPending,
      credit,
    };
  }, [currentShippingCost, detail, removeItemCandidate]);

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

  const handleRemovePackageItem = (item: CustomerPackageItemLine) => {
    if (!detail) return;

    const blockedReason = getRemoveItemBlockedReason(item, canEdit, canManagePackage, isWorking);
    if (blockedReason) {
      setNotice({
        title: 'No se puede quitar',
        message: blockedReason,
        tone: 'warning',
      });
      return;
    }

    setRemoveItemError(null);
    setRemoveItemCandidate(item);
  };

  const closeRemoveItemModal = () => {
    if (isWorking) return;
    setRemoveItemCandidate(null);
    setRemoveItemError(null);
  };

  const handleConfirmRemovePackageItem = async () => {
    if (!detail || !removeItemCandidate) return;

    const blockedReason = getRemoveItemBlockedReason(removeItemCandidate, canEdit, canManagePackage, isWorking);
    if (blockedReason) {
      setRemoveItemError(blockedReason);
      setNotice({
        title: 'No se puede quitar',
        message: blockedReason,
        tone: 'warning',
      });
      return;
    }

    try {
      setIsWorking(true);
      setRemoveItemError(null);
      const createsCredit = Number(removeItemCandidate.creditAmount ?? removeItemCandidate.paidAmount ?? 0) > 0;
      const updated = await removeCustomerPackageItem(detail.id, removeItemCandidate.id, {
        confirmCredit: createsCredit,
      });
      setDetail(updated);
      syncShippingForm(updated);
      try {
        const updatedBalance = await getBalanceByPackageFolio(updated.folio);
        setBalanceSummary(updatedBalance);
      } catch {
        // El paquete ya fue actualizado; el saldo se refrescara al recargar si esta consulta falla.
      }
      setRemoveItemCandidate(null);
      setNotice({
        title: createsCredit ? 'Saldo a favor generado' : 'Prenda quitada',
        message: createsCredit
          ? 'Prenda quitada. El abono quedo como saldo a favor del cliente.'
          : 'Prenda quitada del paquete correctamente.',
        tone: 'success',
      });
    } catch (error: any) {
      const message = error.message || 'No se pudo quitar la prenda. Intenta de nuevo.';
      setRemoveItemError(message);
      setNotice({
        title: 'No se pudo quitar',
        message,
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

  const handleSaveShipping = async () => {
    if (!detail) return;

    if (!canManagePackage) {
      setNotice({
        title: 'Permiso requerido',
        message: 'No tienes permiso para modificar datos de envío. Permiso requerido: CREATE_CLOSE_CUSTOMER_PACKAGE.',
        tone: 'warning',
      });
      return;
    }

    if (!canEditShipping) {
      setNotice({
        title: 'Paquete no editable para envío',
        message: 'Solo paquetes en preparacion o listos sin enviar pueden modificar datos de envío.',
        tone: 'warning',
      });
      return;
    }

    if (!deliveryType) {
      setNotice({
        title: 'Tipo de entrega requerido',
        message: 'Selecciona el tipo de entrega antes de guardar dirección y envío.',
        tone: 'warning',
      });
      return;
    }

    const effectiveCostWaived =
      shippingCostWaived ||
      deliveryType === 'STORE_PICKUP' ||
      deliveryType === 'CUSTOMER_PROVIDED_LABEL' ||
      deliveryType === 'COLLECT_SHIPPING';
    const shippingCost = effectiveCostWaived ? 0 : Number(shippingCostInput.replace(',', '.'));

    if (deliveryRequiresAddress(deliveryType)) {
      if (addressSource === 'CUSTOMER_SAVED_ADDRESS' && !sourceCustomerAddressId) {
        setNotice({
          title: 'Dirección requerida',
          message: 'Selecciona una dirección guardada del cliente.',
          tone: 'warning',
        });
        return;
      }

      if ((addressSource === 'CUSTOM_PACKAGE_ADDRESS' || addressSource === 'LOCAL_DELIVERY') &&
        (!shipToName.trim() || !shipToPhone.trim() || !shipToLine1.trim() || !shipToCity.trim() || !shipToState.trim() || !shipToPostalCode.trim())) {
        setNotice({
          title: 'Dirección incompleta',
          message: 'Captura quien recibe, teléfono, calle, ciudad, estado y codigo postal.',
          tone: 'warning',
        });
        return;
      }
    }

    if (deliveryType === 'CUSTOMER_PROVIDED_LABEL' && !trackingNumber.trim() && !shippingNotes.trim()) {
      setNotice({
        title: 'Guia o nota requerida',
        message: 'Captura la guía o una nota del envío proporcionado por el cliente.',
        tone: 'warning',
      });
      return;
    }

    if (!effectiveCostWaived && (!Number.isFinite(shippingCost) || shippingCost <= 0)) {
      setNotice({
        title: 'Costo de envío requerido',
        message:
          shippingCost === 0
            ? 'Para costo 0 marca explicitamente envío sin costo.'
            : 'Captura un costo de paquetería mayor a 0 o marca envío sin costo.',
        tone: 'warning',
      });
      return;
    }

    try {
      setIsWorking(true);
      setIsSavingShipping(true);
      const updated = await updateCustomerPackageShipping(detail.id, {
        deliveryType,
        addressSource:
          deliveryType === 'STORE_PICKUP'
            ? 'PICKUP_NO_ADDRESS'
            : deliveryType === 'CUSTOMER_PROVIDED_LABEL'
              ? 'CUSTOMER_PROVIDED_LABEL'
              : addressSource,
        sourceCustomerAddressId,
        addressLabel: addressLabel.trim() || null,
        recipientName: shipToName.trim() || null,
        recipientPhone: shipToPhone.trim() || null,
        line1: shipToLine1.trim() || null,
        line2: shipToLine2.trim() || null,
        city: shipToCity.trim() || null,
        state: shipToState.trim() || null,
        postalCode: shipToPostalCode.trim() || null,
        country: shipToCountry.trim() || 'Mexico',
        references: shipToReferences.trim() || null,
        saveAddressToCustomer,
        makePrimaryAddress,
        shippingCostAmount: effectiveCostWaived ? 0 : shippingCost,
        shippingCostWaived: effectiveCostWaived,
        collectShipping: deliveryType === 'COLLECT_SHIPPING',
        customerProvidedLabel: deliveryType === 'CUSTOMER_PROVIDED_LABEL',
        shippingCarrier: shippingCarrier.trim() || null,
        trackingNumber: trackingNumber.trim() || null,
        shippingNotes: shippingNotes.trim() || null,
      });
      setDetail(updated);
      syncShippingForm(updated);
      setNotice({
        title: deliveryType === 'STORE_PICKUP' ? 'Recoleccion confirmada' : 'Dirección y envío guardados',
        message:
          deliveryType === 'STORE_PICKUP'
            ? 'Recoleccion en tienda confirmada sin costo de envío.'
            : 'Dirección y datos de envío guardados correctamente. El total y saldo del paquete fueron actualizados.',
        tone: 'success',
      });
    } catch (error: any) {
      setNotice({
        title: 'No se pudo guardar envío',
        message: error.message || 'No se pudieron guardar los datos de envío.',
        tone: 'danger',
      });
    } finally {
      setIsSavingShipping(false);
      setIsWorking(false);
    }
  };

  const handleMarkReady = async () => {
    if (!detail || !session) return;

    const blockedReason = getMarkReadyBlockedReason(detail, canManagePackage, isWorking);
    if (blockedReason) {
      setNotice({
        title: 'No se puede liberar envío',
        message: blockedReason,
        tone: 'warning',
      });
      return;
    }

    setMarkReadyError(null);
    setMarkReadyModalVisible(true);
  };

  const closeMarkReadyModal = () => {
    if (isWorking) return;
    setMarkReadyModalVisible(false);
    setMarkReadyError(null);
  };

  const handleConfirmMarkReady = async () => {
    if (!detail || !session) return;

    const blockedReason = getMarkReadyBlockedReason(detail, canManagePackage, isWorking);
    if (blockedReason) {
      setMarkReadyError(blockedReason);
      setNotice({
        title: 'No se puede liberar envío',
        message: blockedReason,
        tone: 'warning',
      });
      return;
    }

    try {
      setIsWorking(true);
      setMarkReadyError(null);
      const updated = await markCustomerPackageReady(detail.id, session.userId);
      setDetail(updated);
      setMarkReadyModalVisible(false);
      setNotice({
        title: 'Paquete listo para envío',
        message: 'Paquete marcado listo para envío. Ya aparece en la bandeja de Envíos para prepararlo.',
        tone: 'success',
      });
    } catch (error: any) {
      const message = error.message || 'No se pudo marcar el paquete como listo.';
      setMarkReadyError(message);
      setNotice({
        title: 'No se pudo marcar listo',
        message,
        tone: 'danger',
      });
    } finally {
      setIsWorking(false);
    }
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
        subtitle="Preparacion, prendas y pagos de mercancía"
        activeRoute="customer-packages"
      >
        <ActivityIndicator />
      </AppShellPage>
    );
  }

  const totalAmount = Number(detail.totalAmount ?? 0);
  const itemSubtotalAmount = Number(
    detail.itemSubtotalAmount ??
      items.reduce((sum, item) => sum + Number(item.price ?? 0), 0)
  );
  const paidAmount = Number(detail.paidAmount ?? 0);
  const pendingAmount = Number(detail.pendingAmount ?? 0);
  const customerBalance = Number(balanceSummary?.balance ?? 0);
  const removeCreditAmount = Number(removeItemCandidate?.creditAmount ?? removeItemCandidate?.paidAmount ?? 0);
  const removeCreatesCredit = removeCreditAmount > 0;
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
  const nextStep = getNextStep(detail, hasPending, canReady, shippingConfirmed, addressConfirmed || !deliveryRequiresAddress(detail.deliveryType), shipments);
  const isTerminalPackage = detail.status === 'CANCELLED' || detail.status === 'DELIVERED';
  const shippingReadyForOperations =
    shippingReadiness.typeReady && shippingReadiness.addressReady && shippingReadiness.costReady;
  const primaryAction =
    isTerminalPackage
      ? {
          title: 'Volver a paquetes',
          onPress: () => router.replace(fallbackRoute as any),
          disabled: false,
          disabledReason: '',
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
            title: latestShipment ? 'Ver envío' : 'Crear envío',
            onPress: () =>
              latestShipment
                ? router.push(`/shipment-detail?id=${latestShipment.shipmentId}` as any)
                : router.push('/shipments' as any),
            disabled: !canManageShipments || isWorking,
            disabledReason: !canManageShipments ? 'No tienes permiso para gestionar envíos.' : 'Ya hay una accion en proceso.',
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
              {detail.customerPhone || 'Sin teléfono'} - {detail.branchName || detail.branchCode || 'Sin sucursal'} - {formatDate(detail.createdAt)}
            </AppText>
          </View>
          <View style={styles.heroBadges}>
            <StatusPill label={statusLabel(detail.status)} tone={detail.status === 'CANCELLED' ? 'danger' : 'info'} />
            <StatusPill label={paymentStatusLabel(detail.paymentStatus)} tone={hasPending ? 'warning' : 'success'} />
            <StatusPill label={shipmentState} tone={shipments.length > 0 ? 'info' : 'default'} />
          </View>
        </View>

        <AppResponsiveGrid phoneColumns={2} tabletColumns={3} desktopColumns={6} gap={8} style={styles.metricsGrid}>
          <MetricCard label="Subtotal prendas" value={money(itemSubtotalAmount)} />
          <MetricCard label="Total mercancía" value={money(itemSubtotalAmount)} />
          <MetricCard label="Abonado mercancía" value={money(paidAmount)} tone={paidAmount > 0 ? 'success' : 'default'} />
          <MetricCard
            label="Saldo mercancía"
            value={pendingAmount > 0 ? money(pendingAmount) : 'Pagado'}
            tone={pendingAmount > 0 ? 'danger' : 'success'}
          />
          <MetricCard
            label="Saldo a favor"
            value={money(customerBalance)}
            tone={customerBalance > 0 ? 'success' : 'default'}
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
                <AppText bold>Este paquete todavía no tiene prendas.</AppText>
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
                    onRemoveItem={handleRemovePackageItem}
                    removeBlockedReason={getRemoveItemBlockedReason(item, canEdit, canManagePackage, isWorking)}
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
                  Resumen de abonos de mercancía
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

            <AppResponsiveGrid phoneColumns={1} tabletColumns={2} desktopColumns={5} gap={8}>
              <MetricCard label="Subtotal prendas" value={money(itemSubtotalAmount)} />
              <MetricCard label="Total mercancía" value={money(itemSubtotalAmount)} />
              <MetricCard label="Abonado mercancía" value={money(paidAmount)} tone={paidAmount > 0 ? 'success' : 'default'} />
              <MetricCard label="Saldo mercancía" value={money(pendingAmount)} tone={pendingAmount > 0 ? 'danger' : 'success'} />
              <MetricCard label="Estado" value={paymentStatusLabel(detail.paymentStatus)} tone={pendingAmount > 0 ? 'warning' : 'success'} />
            </AppResponsiveGrid>

            <View style={[styles.emptyState, { borderColor: theme.colors.borderSubtle }]}>
              <AppText bold>
                {paidAmount > 0 ? 'Abonos aplicados al paquete' : 'Aun no hay pagos registrados para este paquete.'}
              </AppText>
              <AppText variant="caption" color={theme.colors.mutedText}>
                Los abonos de esta sección aplican únicamente a mercancía. Los pagos de envío se registran desde el modulo Envíos.
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
            <View style={styles.sectionHeader}>
              <View>
                <AppText variant="subtitle" bold>
                  Resumen de envío
                </AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  La dirección, guía, paquetería, costo, reparto y pagos de envío se gestionan desde Envíos.
                </AppText>
              </View>
            </View>

            <View style={styles.shippingSummary}>
              <InfoRow label="Estado de envío" value={shipmentState} />
              <InfoRow label="Envío asociado" value={latestShipment?.shipmentFolio || 'Sin envío'} />
            </View>

            <View style={[styles.shippingNotice, { borderColor: theme.colors.borderSubtle, backgroundColor: theme.colors.surfaceAlt }]}>
              <AppText variant="caption" color={theme.colors.mutedText}>
                Paquetes conserva mercancía, prendas, abonos y saldo de mercancía. Envíos es la verdad para logística y cobro/pago de envío.
              </AppText>
            </View>

            {canManageShipments ? (
              <View style={styles.sideAction}>
                <AppButton
                  title={latestShipment ? 'Ver envío' : 'Crear envío'}
                  variant="secondary"
                  onPress={() =>
                    latestShipment
                      ? router.push(`/shipment-detail?id=${latestShipment.shipmentId}` as any)
                      : router.push('/shipments' as any)
                  }
                />
              </View>
            ) : (
              <AppText variant="caption" color={theme.colors.mutedText}>
                Tu usuario puede consultar el resumen del paquete. Las acciones operativas de envío se realizan en Envíos con permiso correspondiente.
              </AppText>
            )}

            {shipments.length > 0 ? (
              <View style={styles.lineList}>
                {shipments.map((shipment) => (
                  <ShipmentLine key={shipment.shipmentPackageId} shipment={shipment} />
                ))}
              </View>
            ) : (
              <AppText variant="caption" color={theme.colors.mutedText}>
                Este paquete todavía no tiene envío asociado.
              </AppText>
            )}
          </AppCard>


          <AppCard>
            <AppText variant="subtitle" bold>
              Cliente y etiqueta
            </AppText>
            <InfoRow label="Cliente" value={detail.customerName || 'Sin cliente'} />
            <InfoRow label="Telefono" value={detail.customerPhone || 'Sin teléfono'} />
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
        visible={markReadyModalVisible}
        title="Ver envío"
        onClose={closeMarkReadyModal}
        footer={
          <View style={styles.modalActions}>
            <AppButton
              title="Cancelar"
              variant="cancel"
              onPress={closeMarkReadyModal}
              disabled={isWorking}
              disabledReason="Espera a que termine la operacion."
            />
            <AppButton
              title="Marcar listo"
              variant="operation"
              onPress={handleConfirmMarkReady}
              loading={isWorking}
              disabled={isWorking}
            />
          </View>
        }
      >
        {detail ? (
          <View style={styles.removeConfirmContent}>
            <AppCard variant="subtle">
              <InfoRow label="Paquete" value={detail.folio} />
              <InfoRow label="Estado actual" value={statusLabel(detail.status)} />
              <InfoRow label="Prendas" value={String(detail.totalItems ?? 0)} />
              <InfoRow label="Envío asociado" value={latestShipment?.shipmentFolio || 'Sin envío'} />
            </AppCard>

            <AppResponsiveGrid phoneColumns={1} tabletColumns={2} desktopColumns={5} gap={8}>
              <MetricCard label="Subtotal prendas" value={money(detail.itemSubtotalAmount)} />
              <MetricCard label="Total mercancía" value={money(detail.itemSubtotalAmount)} />
              <MetricCard label="Abonado mercancía" value={money(detail.paidAmount)} tone={Number(detail.paidAmount ?? 0) > 0 ? 'success' : 'default'} />
              <MetricCard label="Saldo mercancía" value={money(detail.pendingAmount)} tone={Number(detail.pendingAmount ?? 0) > 0 ? 'danger' : 'success'} />
            </AppResponsiveGrid>

            <View style={[styles.shippingNotice, { borderColor: theme.colors.success, backgroundColor: theme.colors.surfaceAlt }]}>
              <AppText variant="caption" bold color={theme.colors.success}>
                Listo para liberar a envío
              </AppText>
              <AppText variant="caption" color={theme.colors.mutedText}>
                El paquete tiene envío confirmado y saldo cubierto. Al confirmar cambiara a listo para envío.
              </AppText>
            </View>

            {markReadyError ? (
              <View style={[styles.shippingNotice, { borderColor: theme.colors.danger, backgroundColor: theme.colors.surfaceAlt }]}>
                <AppText variant="caption" bold color={theme.colors.danger}>
                  No se pudo marcar listo
                </AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  {markReadyError}
                </AppText>
              </View>
            ) : null}
          </View>
        ) : null}
      </AppBottomModal>

      <AppBottomModal
        visible={Boolean(removeItemCandidate)}
        title={removeCreatesCredit ? 'Quitar prenda con abono aplicado' : 'Quitar prenda del paquete'}
        onClose={closeRemoveItemModal}
        footer={
          <View style={styles.modalActions}>
            <AppButton
              title="Cancelar"
              variant="cancel"
              onPress={closeRemoveItemModal}
              disabled={isWorking}
              disabledReason="Espera a que termine la operacion."
            />
            <AppButton
              title={removeCreatesCredit ? 'Quitar y generar saldo a favor' : 'Quitar prenda'}
              variant="danger"
              onPress={handleConfirmRemovePackageItem}
              loading={isWorking}
              disabled={isWorking}
            />
          </View>
        }
      >
        {removeItemCandidate ? (
          <View style={styles.removeConfirmContent}>
            <AppCard variant="subtle">
              <InfoRow label="Prenda" value={removeItemCandidate.itemCode || `Prenda #${removeItemCandidate.itemId}`} />
              <InfoRow label="Precio" value={money(removeItemCandidate.price)} />
              <InfoRow label="Pagado aplicado" value={money(removeItemCandidate.paidAmount)} />
              <InfoRow label="Pendiente linea" value={money(removeItemCandidate.pendingAmount)} />
            </AppCard>

            <View style={[styles.shippingNotice, { borderColor: theme.colors.warning, backgroundColor: theme.colors.surfaceAlt }]}>
              <AppText variant="caption" bold color={theme.colors.warning}>
                {removeCreatesCredit ? 'Esta prenda tiene abono aplicado' : 'El total y saldo se recalcularan'}
              </AppText>
              <AppText variant="caption" color={theme.colors.mutedText}>
                {removeCreatesCredit
                  ? 'Si continuas, la prenda saldra del paquete, el pago no se borrara y el monto pagado quedara como saldo a favor del cliente.'
                  : 'No se tocaran pagos ya registrados. Si venia de un apartado, permanecera fuera del paquete; si fue agregada desde inventario libre, conservara la reserva creada por el flujo actual.'}
              </AppText>
            </View>

            {removeItemPreview ? (
              <AppResponsiveGrid phoneColumns={1} tabletColumns={2} desktopColumns={5} gap={8}>
                <MetricCard label="Subtotal despues" value={money(removeItemPreview.subtotal)} />
                <MetricCard label="Total despues" value={money(removeItemPreview.total)} />
                <MetricCard label="Abonado" value={money(removeItemPreview.paid)} />
                <MetricCard label="Pendiente" value={money(removeItemPreview.pending)} tone={removeItemPreview.pending > 0 ? 'danger' : 'success'} />
                {removeCreatesCredit ? (
                  <MetricCard label="Saldo a favor" value={money(removeItemPreview.credit)} tone="success" />
                ) : null}
              </AppResponsiveGrid>
            ) : null}

            {removeItemError ? (
              <View style={[styles.shippingNotice, { borderColor: theme.colors.danger, backgroundColor: theme.colors.surfaceAlt }]}>
                <AppText variant="caption" bold color={theme.colors.danger}>
                  No se pudo quitar
                </AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  {removeItemError}
                </AppText>
              </View>
            ) : null}
          </View>
        ) : null}
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
  selectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectableCard: {
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    minHeight: 84,
    minWidth: 148,
    padding: 10,
  },
  addressList: {
    gap: 8,
  },
  addressFields: {
    gap: 8,
  },
  inlineFields: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  inlineField: {
    flex: 1,
    minWidth: 120,
  },
  actionsList: {
    gap: 8,
  },
  sideAction: {
    marginBottom: 10,
    marginTop: 8,
  },
  shippingSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
    marginTop: 8,
  },
  shippingHero: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    marginTop: 8,
    padding: 10,
  },
  shippingHeroMain: {
    flex: 1,
    gap: 6,
    minWidth: 220,
  },
  shippingNotice: {
    borderWidth: 1,
    gap: 4,
    marginBottom: 12,
    padding: 10,
  },
  shippingForm: {
    gap: 10,
  },
  shippingStep: {
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 10,
  },
  shippingStepHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  shippingStepBody: {
    gap: 8,
  },
  stepNumber: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  stepTitleBlock: {
    flex: 1,
    minWidth: 140,
  },
  shippingLogistics: {
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
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
  removeBlockedText: {
    flexBasis: '100%',
    textAlign: 'right',
  },
  removeConfirmContent: {
    gap: 12,
  },
  modalActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-end',
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
