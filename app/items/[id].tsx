import ItemLabel from '@/components/items/ItemLabel';
import AppShellPage from '@/components/layout/AppShellPage';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppOptionRow from '@/components/ui/AppOptionRow';
import AppResponsiveGrid from '@/components/ui/AppResponsiveGrid';
import AppSelectorField from '@/components/ui/AppSelectorField';
import AppText from '@/components/ui/AppText';
import PermissionBlockedHint from '@/components/ui/PermissionBlockedHint';
import ScreenPermissionHeaderAction from '@/components/ui/ScreenPermissionHeaderAction';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAppTheme } from '@/context/AppThemeContext';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { Batch, getBatchById, getBatchStatusLabel } from '@/services/batchService';
import {
  Brand,
  getBrands,
  getProductTypes,
  getSizes,
  getStorageLocations,
  ProductType,
  Size,
  StorageLocation,
} from '@/services/catalogService';
import {
  CustomerPackageDetail,
  CustomerPackageItemLine,
  getCustomerPackageDetail,
} from '@/services/customerPackageService';
import { getItemStatusLabel } from '@/services/itemLabels';
import { getItemById, Item, ItemStatus, updateItem } from '@/services/itemService';
import { printItemLabel } from '@/services/printService';
import { hasPermission } from '@/services/accessControl';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

type CatalogOption = {
  id: number;
  name: string;
};

type SelectorConfig = {
  title: string;
  options: CatalogOption[];
  onSelect: (option: CatalogOption | null) => void;
  allowClear?: boolean;
};

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'reserved';

const moneyFormatter = new Intl.NumberFormat('es-MX', {
  currency: 'MXN',
  style: 'currency',
});

function formatMoney(value?: number | null) {
  if (value === null || value === undefined) return 'Sin precio';
  return `${moneyFormatter.format(value)} MXN`;
}

function formatDateTime(value?: string | null) {
  if (!value) return 'No disponible';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('es-MX');
}

function getPackageIdFromReturnRoute(route?: string | null) {
  if (!route || !route.startsWith('/customer-package-detail')) return null;
  const match = route.match(/[?&]id=([^&]+)/);
  if (!match) return null;
  const parsed = Number(decodeURIComponent(match[1]));
  return Number.isFinite(parsed) ? parsed : null;
}

function isPackageReturnRoute(route?: string | null) {
  return getPackageIdFromReturnRoute(route) !== null;
}

function getItemStatusTone(status?: ItemStatus | string | null): Tone {
  switch (status) {
    case 'AVAILABLE':
      return 'success';
    case 'RESERVED':
      return 'reserved';
    case 'SOLD':
      return 'neutral';
    case 'DISABLED':
      return 'danger';
    case 'ON_CONSIGNMENT':
      return 'info';
    default:
      return 'neutral';
  }
}

function getPackageStatusLabel(status?: string | null) {
  switch (status) {
    case 'OPEN':
      return 'Abierto';
    case 'READY':
      return 'Listo para envio';
    case 'SHIPPED':
      return 'Enviado';
    case 'DELIVERED':
      return 'Entregado';
    case 'CANCELLED':
      return 'Cancelado';
    default:
      return status || 'Sin estado';
  }
}

function getPaymentStatusLabel(status?: string | null) {
  switch (status) {
    case 'PAID':
      return 'Pagado';
    case 'PARTIAL':
      return 'Pago parcial';
    case 'PENDING':
    case 'UNPAID':
      return 'Saldo pendiente';
    default:
      return status || 'Sin dato';
  }
}

function getSafeRoute(route?: string | null) {
  return route || '/items';
}

function buildItemDescription(item: Item, selectedProductType?: ProductType | null, selectedBrand?: Brand | null, selectedSize?: Size | null) {
  return [
    selectedProductType?.name || item.productTypeName,
    selectedBrand?.name || item.brandName,
    selectedSize?.name || item.sizeName,
  ]
    .filter(Boolean)
    .join(' - ') || 'Sin clasificacion';
}

export default function ItemDetailScreen() {
  const router = useRouter();
  const { id, returnTo } = useLocalSearchParams<{
    id?: string | string[];
    returnTo?: string | string[];
  }>();
  const { theme } = useAppTheme();
  const { isDesktop } = useResponsiveLayout();

  const itemIdParam = Array.isArray(id) ? id[0] : id;
  const returnRoute = Array.isArray(returnTo) ? returnTo[0] : returnTo;
  const packageContextId = getPackageIdFromReturnRoute(returnRoute);
  const isPackageContext = isPackageReturnRoute(returnRoute);
  const backLabel = isPackageContext ? 'Volver al paquete' : 'Volver';

  const [session, setSession] = useState<UserSession | null>(null);
  const [item, setItem] = useState<Item | null>(null);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [packageDetail, setPackageDetail] = useState<CustomerPackageDetail | null>(null);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [productTypeId, setProductTypeId] = useState<number | null>(null);
  const [brandId, setBrandId] = useState<number | null>(null);
  const [sizeId, setSizeId] = useState<number | null>(null);
  const [storageLocationId, setStorageLocationId] = useState<number | null>(null);
  const [price, setPrice] = useState('');
  const [comments, setComments] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);

  const [selector, setSelector] = useState<SelectorConfig | null>(null);
  const [isLabelModalVisible, setIsLabelModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      const currentSession = await getSession();
      if (!currentSession) return;
      setSession(currentSession);

      const itemId = Number(itemIdParam);
      const itemData = await getItemById(itemId);
      const canLoadPackageContext =
        packageContextId !== null &&
        hasPermission(currentSession, 'CREATE_CLOSE_CUSTOMER_PACKAGE');

      const [
        productTypeData,
        brandData,
        sizeData,
        locationData,
        batchData,
        packageData,
      ] = await Promise.all([
        getProductTypes(currentSession.branchId),
        getBrands(currentSession.branchId),
        getSizes(currentSession.branchId),
        getStorageLocations(currentSession.branchId),
        itemData.batchId ? getBatchById(itemData.batchId).catch(() => null) : Promise.resolve(null),
        canLoadPackageContext && packageContextId
          ? getCustomerPackageDetail(packageContextId).catch(() => null)
          : Promise.resolve(null),
      ]);

      setItem(itemData);
      setBatch(batchData);
      setPackageDetail(packageData);
      setProductTypes(productTypeData);
      setBrands(brandData);
      setSizes(sizeData);
      setLocations(locationData);
      syncForm(itemData);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo cargar la prenda.');
    } finally {
      setIsLoading(false);
    }
  }, [itemIdParam, packageContextId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function syncForm(nextItem: Item) {
    setProductTypeId(nextItem.productTypeId);
    setBrandId(nextItem.brandId ?? null);
    setSizeId(nextItem.sizeId ?? null);
    setStorageLocationId(nextItem.storageLocationId ?? null);
    setPrice(
      nextItem.price !== null && nextItem.price !== undefined
        ? String(nextItem.price)
        : ''
    );
    setComments(nextItem.comments ?? '');
  }

  const selectedProductType = useMemo(
    () => productTypes.find((option) => option.id === productTypeId) ?? null,
    [productTypes, productTypeId]
  );

  const selectedBrand = useMemo(
    () => brands.find((option) => option.id === brandId) ?? null,
    [brands, brandId]
  );

  const selectedSize = useMemo(
    () => sizes.find((option) => option.id === sizeId) ?? null,
    [sizes, sizeId]
  );

  const selectedLocation = useMemo(
    () => locations.find((option) => option.id === storageLocationId) ?? null,
    [locations, storageLocationId]
  );

  const relatedPackageLine = useMemo<CustomerPackageItemLine | null>(() => {
    if (!item || !packageDetail?.items) return null;
    return packageDetail.items.find((line) => line.itemId === item.id) ?? null;
  }, [item, packageDetail]);

  const canManageInventory = hasPermission(session, 'MANAGE_INVENTORY');
  const canViewPackage = hasPermission(session, 'CREATE_CLOSE_CUSTOMER_PACKAGE');
  const canEditAvailableItem = item?.status === 'AVAILABLE';
  const canEditForm = canManageInventory && canEditAvailableItem;
  const itemDescription = item
    ? buildItemDescription(item, selectedProductType, selectedBrand, selectedSize)
    : '';
  const editBlockedMessage = !canManageInventory
    ? 'No tienes permiso para modificar esta prenda. Permiso requerido: MANAGE_INVENTORY.'
    : !canEditAvailableItem
      ? 'Solo se pueden editar prendas disponibles. El estado cambia mediante reservas, ventas o devoluciones.'
      : undefined;
  const packageLabel = packageDetail
    ? `Paquete ${packageDetail.folio || `#${packageDetail.id}`}`
    : packageContextId
      ? `Paquete #${packageContextId}`
      : 'Sin paquete';
  const packagePendingAmount = packageDetail?.pendingAmount;

  const openSelector = (config: SelectorConfig) => {
    if (!canEditForm) return;
    setSelector(config);
  };

  const closeSelector = () => {
    setSelector(null);
  };

  const goBack = () => {
    router.replace(getSafeRoute(returnRoute) as any);
  };

  const goToPackage = () => {
    if (returnRoute && isPackageContext) {
      router.push(returnRoute as any);
      return;
    }

    if (packageDetail) {
      router.push(`/customer-package-detail?id=${packageDetail.id}` as any);
    }
  };

  const handleSave = async () => {
    if (!item) return;

    if (!canManageInventory) {
      Alert.alert(
        'Permiso requerido',
        'No tienes permiso para modificar esta prenda. Permiso requerido: MANAGE_INVENTORY.'
      );
      return;
    }

    if (!canEditAvailableItem) {
      Alert.alert(
        'Inventario',
        'Solo se pueden editar prendas disponibles. El estado cambia mediante reservas, ventas o devoluciones.'
      );
      return;
    }

    if (!productTypeId) {
      Alert.alert('Validacion', 'Selecciona el tipo de prenda.');
      return;
    }

    const parsedPrice = price.trim() ? Number(price) : null;

    if (parsedPrice !== null && (Number.isNaN(parsedPrice) || parsedPrice < 0)) {
      Alert.alert('Validacion', 'El precio sugerido no es valido.');
      return;
    }

    try {
      setIsSaving(true);
      setSuccessMessage('');

      const updated = await updateItem(item.id, {
        code: item.code,
        qrCode: item.qrCode || item.code,
        productTypeId,
        brandId,
        sizeId,
        comments: comments.trim() || null,
        price: parsedPrice,
        status: item.status,
        storageLocationId,
      });

      setItem(updated);
      syncForm(updated);

      const message = 'Prenda actualizada correctamente.';
      setSuccessMessage(message);
      Alert.alert('Inventario', message);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo actualizar.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintLabel = async () => {
    if (!item) return;

    try {
      setIsPrinting(true);
      await printItemLabel(item);
    } catch (e: any) {
      Alert.alert('Impresion', e.message || 'No se pudo imprimir la etiqueta.');
    } finally {
      setIsPrinting(false);
    }
  };

  if (isLoading || !item) {
    return (
      <AppShellPage
        title="Detalle de prenda"
        subtitle="Ficha operativa de inventario"
        activeRoute="items"
        session={session}
      >
        <ActivityIndicator />
      </AppShellPage>
    );
  }

  return (
    <AppShellPage
      title="Detalle de prenda"
      subtitle={`${item.code} - ${getItemStatusLabel(item.status)}`}
      activeRoute="items"
      session={session}
      rightContent={
        <View style={styles.headerActions}>
          <ScreenPermissionHeaderAction
            screenKey="itemDetail"
            screenTitle="Detalle de prenda"
            session={session}
          />
          <AppButton title={backLabel} variant="secondary" onPress={goBack} />
        </View>
      }
    >
      <AppCard style={styles.heroCard}>
        <View style={[styles.heroRow, !isDesktop && styles.heroRowStacked]}>
          <View style={styles.heroTitle}>
            <View style={styles.badgeRow}>
              <StatusBadge
                label={getItemStatusLabel(item.status)}
                tone={getItemStatusTone(item.status)}
              />
              {isPackageContext ? (
                <StatusBadge label="Desde paquete" tone="info" />
              ) : null}
              {batch?.supplierName ? (
                <StatusBadge label="Proveedor asignado" tone="success" />
              ) : null}
            </View>

            <AppText variant="title" bold>
              {item.code}
            </AppText>
            <AppText color={theme.colors.mutedText}>
              {itemDescription}
            </AppText>
          </View>

          <View
            style={[
              styles.nextStepBox,
              {
                backgroundColor: theme.colors.infoCardBackground,
                borderColor: theme.colors.infoCardBorder,
                borderRadius: theme.radius.md,
              },
            ]}
          >
            <AppText variant="caption" color={theme.colors.infoCardText} bold>
              Contexto
            </AppText>
            <AppText color={theme.colors.infoCardText}>
              {isPackageContext
                ? `Esta prenda se revisa desde ${packageLabel}.`
                : 'Ficha operativa de inventario.'}
            </AppText>
            <View style={styles.contextAction}>
              <AppButton
                title={isPackageContext ? 'Volver al paquete' : 'Volver a inventario'}
                variant="secondary"
                onPress={goBack}
              />
            </View>
          </View>
        </View>
      </AppCard>

      {successMessage ? (
        <View
          style={[
            styles.successBox,
            {
              backgroundColor: theme.colors.successBackground,
              borderColor: theme.colors.success,
              borderRadius: theme.radius.md,
            },
          ]}
        >
          <AppText color={theme.colors.success} bold>
            {successMessage}
          </AppText>
        </View>
      ) : null}

      {editBlockedMessage ? (
        <PermissionBlockedHint message={editBlockedMessage} />
      ) : null}

      <AppResponsiveGrid phoneColumns={2} tabletColumns={3} desktopColumns={6}>
        <MetricCard label="Estado" value={getItemStatusLabel(item.status)} tone={getItemStatusTone(item.status)} />
        <MetricCard label="Precio" value={formatMoney(item.price)} tone="info" />
        <MetricCard label="Sucursal" value={`#${item.branchId}`} />
        <MetricCard label="Ubicacion" value={selectedLocation?.name || item.storageLocationName || 'No asignada'} />
        <MetricCard label="Lote" value={item.batchFolio || (item.batchId ? `#${item.batchId}` : 'Sin lote')} />
        <MetricCard label="Paquete" value={isPackageContext ? packageLabel : 'Sin contexto'} tone={isPackageContext ? 'info' : 'neutral'} />
      </AppResponsiveGrid>

      <View style={[styles.contentLayout, !isDesktop && styles.contentLayoutStacked]}>
        <View style={styles.mainColumn}>
          <AppCard style={styles.panelCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitle}>
                <AppText variant="subtitle" bold>
                  Datos de la prenda
                </AppText>
                <AppText color={theme.colors.mutedText}>
                  Clasificacion, precio y ubicacion operativa.
                </AppText>
              </View>
              <StatusBadge
                label={canEditForm ? 'Editable' : 'Solo lectura'}
                tone={canEditForm ? 'success' : 'warning'}
              />
            </View>

            <View style={styles.formGrid}>
              <View style={styles.formCell}>
                <AppSelectorField
                  label="Tipo de prenda"
                  value={selectedProductType?.name || item.productTypeName}
                  placeholder="Seleccionar tipo"
                  disabled={!canEditForm}
                  onPress={() =>
                    openSelector({
                      title: 'Seleccionar tipo de prenda',
                      options: productTypes,
                      onSelect: (option) => setProductTypeId(option?.id ?? null),
                    })
                  }
                />
              </View>

              <View style={styles.formCell}>
                <AppSelectorField
                  label="Marca"
                  value={selectedBrand?.name || item.brandName || undefined}
                  placeholder="Sin marca"
                  disabled={!canEditForm}
                  onPress={() =>
                    openSelector({
                      title: 'Seleccionar marca',
                      options: brands,
                      onSelect: (option) => setBrandId(option?.id ?? null),
                      allowClear: true,
                    })
                  }
                />
              </View>

              <View style={styles.formCell}>
                <AppSelectorField
                  label="Talla"
                  value={selectedSize?.name || item.sizeName || undefined}
                  placeholder="Sin talla"
                  disabled={!canEditForm}
                  onPress={() =>
                    openSelector({
                      title: 'Seleccionar talla',
                      options: sizes,
                      onSelect: (option) => setSizeId(option?.id ?? null),
                      allowClear: true,
                    })
                  }
                />
              </View>

              <View style={styles.formCell}>
                <AppSelectorField
                  label="Ubicacion"
                  value={selectedLocation?.name || item.storageLocationName || undefined}
                  placeholder="Sin ubicacion"
                  disabled={!canEditForm}
                  onPress={() =>
                    openSelector({
                      title: 'Seleccionar ubicacion',
                      options: locations,
                      onSelect: (option) => setStorageLocationId(option?.id ?? null),
                      allowClear: true,
                    })
                  }
                />
              </View>

              <View style={styles.formCell}>
                <AppInput
                  label="Precio sugerido"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  editable={canEditForm}
                />
              </View>

              <View style={styles.formCell}>
                <AppInput
                  label="Comentarios"
                  value={comments}
                  onChangeText={setComments}
                  editable={canEditForm}
                />
              </View>
            </View>

            <View style={styles.formActions}>
              <AppButton
                title={canEditForm ? 'Guardar cambios' : 'Sin permiso para editar'}
                onPress={handleSave}
                loading={isSaving}
                disabled={!canEditForm || isSaving}
                disabledReason={editBlockedMessage}
              />
              <AppButton
                title="Ver etiqueta QR"
                variant="secondary"
                onPress={() => setIsLabelModalVisible(true)}
              />
            </View>
          </AppCard>

          <AppCard style={styles.panelCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitle}>
                <AppText variant="subtitle" bold>
                  Relacion operativa
                </AppText>
                <AppText color={theme.colors.mutedText}>
                  Paquete, apartado o cliente relacionado cuando el contexto lo permite.
                </AppText>
              </View>
              <StatusBadge
                label={isPackageContext ? 'Con paquete' : 'Prenda libre'}
                tone={isPackageContext ? 'info' : 'success'}
              />
            </View>

            {isPackageContext ? (
              <View style={styles.detailGrid}>
                <DetailValue label="Paquete" value={packageLabel} />
                <DetailValue label="Cliente" value={packageDetail?.customerName || 'No disponible'} />
                <DetailValue label="Estado paquete" value={getPackageStatusLabel(packageDetail?.status)} />
                <DetailValue label="Estado pago" value={getPaymentStatusLabel(packageDetail?.paymentStatus)} />
                <DetailValue label="Saldo paquete" value={formatMoney(packagePendingAmount)} />
                <DetailValue
                  label="Linea de prenda"
                  value={relatedPackageLine ? formatMoney(relatedPackageLine.price) : 'No confirmada'}
                />
              </View>
            ) : (
              <View
                style={[
                  styles.infoBox,
                  {
                    backgroundColor: theme.colors.successBackground,
                    borderColor: theme.colors.success,
                    borderRadius: theme.radius.md,
                  },
                ]}
              >
                <AppText color={theme.colors.success} bold>
                  Sin paquete en el contexto actual.
                </AppText>
                <AppText color={theme.colors.text}>
                  Si la prenda esta libre, puede usarse en apartados, ventas o paquetes segun permisos y estado.
                </AppText>
              </View>
            )}

            <View style={styles.cardAction}>
              <AppButton
                title="Ver paquete"
                variant="secondary"
                onPress={goToPackage}
                disabled={!isPackageContext || !canViewPackage}
                disabledReason={
                  !isPackageContext
                    ? 'Esta ficha no tiene paquete relacionado en el contexto actual.'
                    : 'No tienes permiso para consultar paquetes. Permiso requerido: CREATE_CLOSE_CUSTOMER_PACKAGE.'
                }
              />
            </View>
          </AppCard>
        </View>

        <View style={styles.sideColumn}>
          <AppCard style={styles.panelCard}>
            <AppText variant="subtitle" bold>
              Origen / lote
            </AppText>
            <AppText color={theme.colors.mutedText}>
              Trazabilidad de recepcion y proveedor.
            </AppText>

            <View style={styles.detailGrid}>
              <DetailValue label="Lote" value={item.batchFolio || (item.batchId ? `#${item.batchId}` : 'Sin lote')} />
              <DetailValue label="Proveedor" value={batch?.supplierName || 'Proveedor no asignado'} />
              <DetailValue label="Sucursal lote" value={batch?.branchName || `Sucursal #${item.branchId}`} />
              <DetailValue label="Estado lote" value={batch ? getBatchStatusLabel(batch.status) : 'No disponible'} />
              <DetailValue label="Recepcion" value={formatDateTime(batch?.receivedAt)} />
              <DetailValue label="Referencia" value={batch?.notes || 'Sin notas'} />
            </View>

            <View style={styles.cardAction}>
              <AppButton
                title="Ver lote"
                variant="secondary"
                onPress={() => item.batchId && router.push(`/batch-detail?id=${item.batchId}` as any)}
                disabled={!item.batchId}
                disabledReason="Esta prenda no tiene lote asignado."
              />
            </View>
          </AppCard>

          <AppCard style={styles.panelCard}>
            <AppText variant="subtitle" bold>
              Acciones disponibles
            </AppText>
            <AppText color={theme.colors.mutedText}>
              Acciones permitidas por estado y permisos del usuario.
            </AppText>

            <View style={styles.actionGrid}>
              <AppButton
                title={backLabel}
                variant="secondary"
                onPress={goBack}
              />
              <AppButton
                title="Guardar cambios"
                onPress={handleSave}
                loading={isSaving}
                disabled={!canEditForm || isSaving}
                disabledReason={editBlockedMessage}
              />
              <AppButton
                title="Etiqueta QR"
                variant="neutral"
                onPress={() => setIsLabelModalVisible(true)}
              />
            </View>
          </AppCard>
        </View>
      </View>

      <AppBottomModal
        visible={!!selector}
        title={selector?.title ?? ''}
        onClose={closeSelector}
      >
        {selector?.allowClear ? (
          <AppOptionRow
            title="Sin seleccion"
            onPress={() => {
              selector.onSelect(null);
              closeSelector();
            }}
          />
        ) : null}

        {selector?.options.map((option) => (
          <AppOptionRow
            key={option.id}
            title={option.name}
            onPress={() => {
              selector.onSelect(option);
              closeSelector();
            }}
          />
        ))}
      </AppBottomModal>

      <AppBottomModal
        visible={isLabelModalVisible}
        title="Etiqueta de prenda"
        onClose={() => setIsLabelModalVisible(false)}
        showCancelButton={false}
      >
        <View
          style={[
            styles.labelContainer,
            {
              backgroundColor: theme.isDark ? '#ffffff' : theme.colors.surface,
              borderRadius: theme.radius.md,
              padding: theme.spacing.md,
            },
          ]}
        >
          <ItemLabel item={item} />
        </View>

        <AppButton
          title="Imprimir etiqueta"
          onPress={handlePrintLabel}
          loading={isPrinting}
        />

        <View style={styles.actionSpacing}>
          <AppButton
            title="Cerrar"
            variant="secondary"
            onPress={() => setIsLabelModalVisible(false)}
          />
        </View>
      </AppBottomModal>
    </AppShellPage>
  );
}

function MetricCard({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: Tone;
}) {
  const { theme } = useAppTheme();
  const color =
    tone === 'success'
      ? theme.colors.success
      : tone === 'warning'
        ? theme.colors.warning
        : tone === 'danger' || tone === 'reserved'
          ? theme.colors.danger
          : tone === 'info'
            ? theme.colors.info
            : theme.colors.text;
  const backgroundColor =
    tone === 'success'
      ? theme.colors.successBackground
      : tone === 'warning'
        ? theme.colors.warningBackground
        : tone === 'danger' || tone === 'reserved'
          ? theme.colors.dangerBackground
          : tone === 'info'
            ? theme.colors.infoCardBackground
            : theme.colors.surfaceElevated;

  return (
    <View
      style={[
        styles.metricCard,
        {
          backgroundColor,
          borderColor: color,
          borderRadius: theme.radius.md,
        },
      ]}
    >
      <AppText variant="caption" color={theme.colors.mutedText} bold numberOfLines={1}>
        {label}
      </AppText>
      <AppText color={color} bold numberOfLines={2}>
        {value}
      </AppText>
    </View>
  );
}

function DetailValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.detailValue,
        {
          backgroundColor: theme.colors.surfaceAlt,
          borderColor: theme.colors.borderSubtle,
          borderRadius: theme.radius.md,
        },
      ]}
    >
      <AppText variant="caption" color={theme.colors.mutedText} bold numberOfLines={1}>
        {label}
      </AppText>
      <AppText numberOfLines={2}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  actionGrid: {
    gap: 10,
    marginTop: 12,
  },
  actionSpacing: {
    marginTop: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardAction: {
    marginTop: 12,
  },
  contentLayout: {
    flexDirection: 'row',
    gap: 14,
  },
  contentLayoutStacked: {
    flexDirection: 'column',
  },
  contextAction: {
    marginTop: 10,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  detailValue: {
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    minWidth: 150,
    padding: 10,
  },
  formActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  formCell: {
    flexBasis: '48%',
    flexGrow: 1,
    minWidth: 220,
  },
  formGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  heroCard: {
    marginBottom: 12,
  },
  heroRow: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'space-between',
  },
  heroRowStacked: {
    flexDirection: 'column',
  },
  heroTitle: {
    flex: 1,
    gap: 8,
    minWidth: 0,
  },
  infoBox: {
    borderWidth: 1,
    gap: 4,
    marginTop: 12,
    padding: 12,
  },
  labelContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  mainColumn: {
    flex: 1.45,
    minWidth: 0,
  },
  metricCard: {
    borderWidth: 1,
    gap: 4,
    marginBottom: 12,
    minHeight: 74,
    padding: 12,
  },
  nextStepBox: {
    borderWidth: 1,
    flexBasis: 300,
    gap: 4,
    padding: 12,
  },
  panelCard: {
    marginBottom: 14,
  },
  sectionHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    flex: 1,
    minWidth: 220,
  },
  sideColumn: {
    flex: 0.9,
    minWidth: 280,
  },
  successBox: {
    borderWidth: 1,
    marginBottom: 12,
    padding: 12,
  },
});
