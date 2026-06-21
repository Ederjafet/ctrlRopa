import AppShellPage from '@/components/layout/AppShellPage';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppResponsiveGrid from '@/components/ui/AppResponsiveGrid';
import AppText from '@/components/ui/AppText';
import ScreenPermissionHeaderAction from '@/components/ui/ScreenPermissionHeaderAction';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAppTheme } from '@/context/AppThemeContext';
import {
  Batch,
  canCancelBatch,
  canClassifyBatch,
  canReceiveBatch,
  cancelBatch,
  getBatchById,
  getBatchStatusLabel,
  receiveBatch,
  reconcileBatch,
  saveBatchClassification,
} from '@/services/batchService';
import { getProductTypes } from '@/services/catalogService';
import { getItemStatusLabel } from '@/services/itemLabels';
import { getItemsByBranch, Item, ItemStatus } from '@/services/itemService';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

type ClassificationDraft = {
  productTypeId: number;
  productTypeName: string;
  quantityText: string;
};

type BatchItemStatusFilter = 'ALL' | ItemStatus;

function asNumber(value?: number | null) {
  return value ?? 0;
}

function formatDateTime(value?: string | null) {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('es-MX');
}

const moneyFormatter = new Intl.NumberFormat('es-MX', {
  currency: 'MXN',
  style: 'currency',
});

function formatMoney(value?: number | null) {
  if (value === null || value === undefined) return 'Sin precio';
  return moneyFormatter.format(value);
}

function hasEffectivePermission(session: UserSession | null, code: string) {
  return session?.effectivePermissions?.some((permission) => permission.code === code) ?? false;
}

function getItemStatusTone(status: ItemStatus) {
  switch (status) {
    case 'AVAILABLE':
      return 'success' as const;
    case 'RESERVED':
      return 'reserved' as const;
    case 'SOLD':
      return 'neutral' as const;
    case 'DISABLED':
      return 'danger' as const;
    case 'ON_CONSIGNMENT':
      return 'info' as const;
    default:
      return 'neutral' as const;
  }
}

function getBatchStatusTone(status: Batch['status']) {
  switch (status) {
    case 'RECONCILED':
      return 'success' as const;
    case 'RECEIVED':
      return 'info' as const;
    case 'CANCELLED':
      return 'danger' as const;
    case 'ANNOUNCED':
    default:
      return 'warning' as const;
  }
}

function getNextStep(batch: Batch, classifiedTotal: number) {
  if (batch.status === 'CANCELLED') {
    return 'Lote cancelado. Solo consulta historica.';
  }

  if (batch.receivedQuantity === null || batch.receivedQuantity === undefined) {
    return 'Registrar recepcion para confirmar cuantas prendas llegaron.';
  }

  if (classifiedTotal < asNumber(batch.receivedQuantity)) {
    return 'Completar clasificacion por tipo de prenda.';
  }

  if (batch.status !== 'RECONCILED') {
    return 'Cerrar lote cuando recepcion y clasificacion coincidan.';
  }

  if (asNumber(batch.itemCount) <= 0) {
    return 'Crear prendas asociadas a este lote.';
  }

  return 'Revisar prendas del lote y continuar operacion.';
}

const qualityOptions = [
  { value: '1', title: '1 Mala' },
  { value: '2', title: '2 Baja' },
  { value: '3', title: '3 Regular' },
  { value: '4', title: '4 Buena' },
  { value: '5', title: '5 Excelente' },
];

const itemStatusFilters: { label: string; value: BatchItemStatusFilter }[] = [
  { label: 'Todas', value: 'ALL' },
  { label: 'Disponibles', value: 'AVAILABLE' },
  { label: 'Apartadas', value: 'RESERVED' },
  { label: 'Vendidas', value: 'SOLD' },
  { label: 'Deshabilitadas', value: 'DISABLED' },
];

export default function BatchDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { theme } = useAppTheme();

  const batchId = id ? Number(id) : null;

  const [batch, setBatch] = useState<Batch | null>(null);
  const [session, setSession] = useState<UserSession | null>(null);
  const [batchItems, setBatchItems] = useState<Item[]>([]);
  const [classificationDraft, setClassificationDraft] = useState<ClassificationDraft[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [itemSearch, setItemSearch] = useState('');
  const [itemStatusFilter, setItemStatusFilter] = useState<BatchItemStatusFilter>('ALL');
  const [receiveQuantity, setReceiveQuantity] = useState('');
  const [receiveNotes, setReceiveNotes] = useState('');
  const [qualityScore, setQualityScore] = useState('');
  const [qualityNotes, setQualityNotes] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [canManageInventory, setCanManageInventory] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!batchId || Number.isNaN(batchId)) {
      Alert.alert('Lotes', 'No se encontro el lote solicitado.');
      router.replace('/batches');
      return;
    }

    const sessionData = await getSession();
    setSession(sessionData);
    if (!sessionData) {
      setLoading(false);
      return;
    }

    setCanManageInventory(hasEffectivePermission(sessionData, 'MANAGE_INVENTORY'));
    setLoading(true);

    try {
      const [batchResult, productTypeResult, itemsResult] = await Promise.allSettled([
        getBatchById(batchId),
        getProductTypes(sessionData.branchId),
        getItemsByBranch(sessionData.branchId),
      ]);

      if (batchResult.status === 'rejected') {
        throw batchResult.reason;
      }

      const batchData = batchResult.value;
      const productTypeData =
        productTypeResult.status === 'fulfilled' ? productTypeResult.value : [];
      const branchItems = itemsResult.status === 'fulfilled' ? itemsResult.value : [];

      setBatch(batchData);
      setBatchItems(branchItems.filter((item) => item.batchId === batchData.id));
      setReceiveQuantity(
        batchData.receivedQuantity !== null && batchData.receivedQuantity !== undefined
          ? String(batchData.receivedQuantity)
          : ''
      );
      setQualityScore(
        batchData.qualityScore !== null && batchData.qualityScore !== undefined
          ? String(batchData.qualityScore)
          : ''
      );
      setQualityNotes(batchData.qualityNotes ?? '');

      setClassificationDraft(
        productTypeData.map((type) => {
          const existing = batchData.classificationDetails?.find(
            (detail) => detail.productTypeId === type.id
          );

          return {
            productTypeId: type.id,
            productTypeName: type.name,
            quantityText: existing ? String(existing.quantity) : '',
          };
        })
      );

      if (productTypeResult.status === 'rejected') {
        Alert.alert(
          'Lotes',
          productTypeResult.reason?.message ||
            'No se pudieron cargar los tipos de prenda para clasificar.'
        );
      }

      if (itemsResult.status === 'rejected') {
        Alert.alert(
          'Lotes',
          itemsResult.reason?.message || 'No se pudieron cargar las prendas del lote.'
        );
      }
    } catch (err: any) {
      Alert.alert('Lotes', err?.message || 'No se pudo cargar el lote.');
    } finally {
      setLoading(false);
    }
  }, [batchId, router]);

  useFocusEffect(
    useCallback(() => {
      loadDetail();
    }, [loadDetail])
  );

  const classifiedTotal = useMemo(() => {
    return classificationDraft.reduce((total, item) => {
      const qty = Number(item.quantityText || 0);
      return total + (Number.isFinite(qty) ? qty : 0);
    }, 0);
  }, [classificationDraft]);

  const pendingToClassify = batch
    ? Math.max(0, asNumber(batch.receivedQuantity) - classifiedTotal)
    : 0;

  const itemStatusCounts = useMemo(() => {
    return batchItems.reduce(
      (counts, item) => ({
        ...counts,
        [item.status]: counts[item.status] + 1,
      }),
      {
        AVAILABLE: 0,
        DISABLED: 0,
        ON_CONSIGNMENT: 0,
        RESERVED: 0,
        SOLD: 0,
      } as Record<ItemStatus, number>
    );
  }, [batchItems]);

  const hasPriceData = useMemo(() => {
    return batchItems.some((item) => typeof item.price === 'number' && item.price > 0);
  }, [batchItems]);

  const estimatedValue = useMemo(() => {
    return batchItems.reduce((total, item) => total + asNumber(item.price), 0);
  }, [batchItems]);

  const filteredItems = useMemo(() => {
    const text = itemSearch.trim().toLowerCase();
    const byStatus =
      itemStatusFilter === 'ALL'
        ? batchItems
        : batchItems.filter((item) => item.status === itemStatusFilter);

    if (!text) return byStatus;

    return byStatus.filter((item) => {
      const content = `
        ${item.code ?? ''}
        ${item.productTypeName ?? ''}
        ${item.brandName ?? ''}
        ${item.sizeName ?? ''}
        ${item.storageLocationName ?? ''}
      `.toLowerCase();

      return content.includes(text);
    });
  }, [batchItems, itemSearch, itemStatusFilter]);

  const updateClassificationQuantity = (productTypeId: number, value: string) => {
    setClassificationDraft((current) =>
      current.map((item) =>
        item.productTypeId === productTypeId
          ? { ...item, quantityText: value.replace(/[^0-9]/g, '') }
          : item
      )
    );
  };

  const handleReceive = async () => {
    if (!batch) return;

    const qty = Number(receiveQuantity);

    if (!Number.isInteger(qty) || qty < 0) {
      Alert.alert('Validacion', 'La cantidad recibida debe ser un entero cero o mayor.');
      return;
    }

    const cleanQualityScore = qualityScore.trim() ? Number(qualityScore) : null;
    if (cleanQualityScore === null) {
      Alert.alert('Validacion', 'Selecciona la calidad del lote antes de confirmar.');
      return;
    }
    if (
      !Number.isInteger(cleanQualityScore) ||
      cleanQualityScore < 1 ||
      cleanQualityScore > 5
    ) {
      Alert.alert('Validacion', 'La calidad del lote debe estar entre 1 y 5.');
      return;
    }

    setSaving(true);

    try {
      const updated = await receiveBatch(batch.id, {
        receivedQuantity: qty,
        qualityScore: cleanQualityScore,
        qualityNotes,
        notes: receiveNotes,
      });

      setBatch(updated);
      setShowReceiveModal(false);
      setReceiveNotes('');
      await loadDetail();
      Alert.alert('Lotes', 'Recepcion registrada correctamente.');
    } catch (err: any) {
      Alert.alert('Lotes', err?.message || 'No se pudo registrar la recepcion.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveClassification = async () => {
    if (!batch) return;

    if (batch.receivedQuantity === null || batch.receivedQuantity === undefined) {
      Alert.alert(
        'Validacion',
        'Primero registra la recepcion del lote para poder guardar la clasificacion.'
      );
      return;
    }

    for (const detail of classificationDraft) {
      if (!detail.quantityText.trim()) continue;
      const qty = Number(detail.quantityText);
      if (!Number.isInteger(qty) || qty < 0) {
        Alert.alert('Validacion', `Cantidad invalida en ${detail.productTypeName}.`);
        return;
      }
    }

    if (batch.receivedQuantity !== null && batch.receivedQuantity !== undefined) {
      if (classifiedTotal > batch.receivedQuantity) {
        Alert.alert(
          'Validacion',
          'La clasificacion no puede superar la cantidad recibida.'
        );
        return;
      }
    }

    const details = classificationDraft
      .map((item) => ({
        productTypeId: item.productTypeId,
        quantity: Number(item.quantityText || 0),
      }))
      .filter((item) => item.quantity > 0);

    setSaving(true);

    try {
      const updated = await saveBatchClassification(batch.id, { details });
      setBatch(updated);
      await loadDetail();
      Alert.alert('Lotes', 'Clasificacion guardada correctamente.');
    } catch (err: any) {
      Alert.alert('Lotes', err?.message || 'No se pudo guardar la clasificacion.');
    } finally {
      setSaving(false);
    }
  };

  const handleReconcile = () => {
    if (!batch) return;

    if (batch.receivedQuantity === null || batch.receivedQuantity === undefined) {
      Alert.alert(
        'Validacion',
        'Primero registra la recepcion del lote para poder conciliarlo.'
      );
      return;
    }

    if (asNumber(batch.classifiedQuantity) <= 0) {
      Alert.alert(
        'Validacion',
        'Primero guarda la clasificacion del lote para poder conciliarlo.'
      );
      return;
    }

    if (classifiedTotal !== asNumber(batch.receivedQuantity)) {
      Alert.alert(
        'Validacion',
        'Para conciliar, la clasificacion debe coincidir con la cantidad recibida.'
      );
      return;
    }

    Alert.alert(
      'Conciliar lote',
      'Al conciliar se cierra el lote y ya no se podra modificar su clasificacion.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Conciliar',
          onPress: async () => {
            setSaving(true);
            try {
              const updated = await reconcileBatch(batch.id);
              setBatch(updated);
              await loadDetail();
              Alert.alert('Lotes', 'Lote conciliado correctamente.');
            } catch (err: any) {
              Alert.alert('Lotes', err?.message || 'No se pudo conciliar el lote.');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleCancel = async () => {
    if (!batch) return;

    if (!cancelReason.trim()) {
      Alert.alert('Validacion', 'Captura el motivo de cancelacion.');
      return;
    }

    setSaving(true);

    try {
      const updated = await cancelBatch(batch.id, { reason: cancelReason });
      setBatch(updated);
      setShowCancelModal(false);
      setCancelReason('');
      await loadDetail();
      Alert.alert('Lotes', 'Lote cancelado correctamente.');
    } catch (err: any) {
      Alert.alert('Lotes', err?.message || 'No se pudo cancelar el lote.');
    } finally {
      setSaving(false);
    }
  };

  const goToCreateItems = () => {
    if (!batch) return;

    if (batch.receivedQuantity === null || batch.receivedQuantity === undefined) {
      Alert.alert(
        'Validacion',
        'Primero registra la recepcion del lote para poder crear prendas.'
      );
      return;
    }

    if (asNumber(batch.classifiedQuantity) <= 0) {
      Alert.alert(
        'Validacion',
        'Primero guarda la clasificacion del lote para poder crear prendas.'
      );
      return;
    }

    router.push({
      pathname: '/items-create',
      params: {
        batchId: String(batch.id),
        batchFolio: batch.folio,
        returnTo: `/batch-detail?id=${batch.id}`,
      },
    } as any);
  };

  const goToItemDetail = (item: Item) => {
    if (!batch) return;

    router.push({
      pathname: '/items/[id]',
      params: { id: String(item.id), returnTo: `/batch-detail?id=${batch.id}` },
    } as any);
  };

  if (loading || !batch) {
    return (
      <AppShellPage
        title="Detalle de lote"
        subtitle="Recepcion, clasificacion y cierre"
        activeRoute="batches"
      >
        <ActivityIndicator />
      </AppShellPage>
    );
  }

  const canReceive = canReceiveBatch(batch);
  const canClassify = canClassifyBatch(batch);
  const canCancel = canCancelBatch(batch);
  const hasRegisteredReception =
    batch.receivedQuantity !== null && batch.receivedQuantity !== undefined;
  const hasSavedClassification = asNumber(batch.classifiedQuantity) > 0;
  const statusLabel = getBatchStatusLabel(batch.status);
  const canManageCatalogs = hasEffectivePermission(session, 'MANAGE_CATALOGS');
  const nextStep = getNextStep(batch, classifiedTotal);
  const createItemsDisabled =
    !canManageInventory ||
    batch.status === 'CANCELLED' ||
    !hasRegisteredReception ||
    !hasSavedClassification;
  const createItemsDisabledReason = !canManageInventory
    ? 'Tu usuario necesita MANAGE_INVENTORY para agregar prendas al lote.'
    : batch.status === 'CANCELLED'
      ? 'No se pueden agregar prendas a un lote cancelado.'
      : !hasRegisteredReception
        ? 'Primero registra la recepcion del lote.'
        : !hasSavedClassification
          ? 'Primero guarda la clasificacion del lote.'
          : undefined;
  const supplierActionDisabled = !batch.supplierName && !canManageCatalogs;
  const supplierActionDisabledReason = supplierActionDisabled
    ? 'Tu usuario necesita MANAGE_CATALOGS para crear proveedores.'
    : undefined;

  return (
    <>
      <AppShellPage
        title="Detalle de lote"
        subtitle={`Lote ${batch.folio} · ${batch.branchName || 'Sucursal actual'}`}
        activeRoute="batches"
        rightContent={
          <View style={styles.headerActions}>
            <ScreenPermissionHeaderAction
              screenKey="batchDetail"
              screenTitle="Detalle de lote"
              session={session}
            />
            <AppButton
              title="Volver"
              variant="secondary"
              onPress={() => router.replace('/batches' as any)}
            />
          </View>
        }
      >
        <AppCard style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View style={styles.heroTitle}>
              <View style={styles.badgeRow}>
                <StatusBadge label={statusLabel} tone={getBatchStatusTone(batch.status)} />
                {batch.supplierName ? (
                  <StatusBadge label="Proveedor asignado" tone="success" />
                ) : (
                  <StatusBadge label="Sin proveedor" tone="warning" />
                )}
              </View>
              <AppText variant="title" bold>
                {batch.folio}
              </AppText>
              <AppText color={theme.colors.mutedText}>
                Sucursal: {batch.branchName || 'Sucursal actual'} · Proveedor:{' '}
                {batch.supplierName || 'No asignado'}
              </AppText>
            </View>

            <View
              style={[
                styles.nextStepBox,
                {
                  backgroundColor: theme.colors.infoCardBackground,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.md,
                },
              ]}
            >
              <AppText variant="caption" color={theme.colors.mutedText} bold>
                Proximo paso
              </AppText>
              <AppText>{nextStep}</AppText>
            </View>
          </View>

          <View style={styles.heroMeta}>
            <AppText variant="caption" color={theme.colors.mutedText}>
              Creado: {formatDateTime(batch.createdAt)}
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              Recepcion: {formatDateTime(batch.receivedAt)}
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              Calidad: {batch.qualityScore ? `${batch.qualityScore}/5` : 'Sin calificar'}
            </AppText>
          </View>

          {batch.qualityNotes ? (
            <AppText variant="caption" color={theme.colors.mutedText} style={styles.note}>
              Calidad: {batch.qualityNotes}
            </AppText>
          ) : null}

          {batch.notes ? (
            <AppText variant="caption" color={theme.colors.mutedText} style={styles.note}>
              {batch.notes}
            </AppText>
          ) : null}
        </AppCard>

        <AppResponsiveGrid phoneColumns={2} tabletColumns={3} desktopColumns={6}>
          <MetricCard label="Total prendas" value={String(batchItems.length || batch.itemCount || 0)} />
          <MetricCard label="Disponibles" value={String(itemStatusCounts.AVAILABLE)} tone="success" />
          <MetricCard label="Apartadas" value={String(itemStatusCounts.RESERVED)} tone="reserved" />
          <MetricCard label="Vendidas" value={String(itemStatusCounts.SOLD)} />
          <MetricCard label="Deshabilitadas" value={String(itemStatusCounts.DISABLED)} tone="danger" />
          <MetricCard
            label="Valor estimado"
            value={hasPriceData ? formatMoney(estimatedValue) : 'No disponible'}
            tone="info"
          />
        </AppResponsiveGrid>

        <View style={styles.twoColumnLayout}>
          <AppCard style={styles.panelCard}>
            <View style={styles.sectionHeader}>
              <View>
                <AppText variant="subtitle" bold>
                  Proveedor y entrada
                </AppText>
                <AppText color={theme.colors.mutedText}>
                  Referencia principal del lote.
                </AppText>
              </View>
              <StatusBadge
                label={batch.supplierName ? 'Asignado' : 'Pendiente'}
                tone={batch.supplierName ? 'success' : 'warning'}
              />
            </View>

            <View style={styles.detailGrid}>
              <DetailValue label="Proveedor" value={batch.supplierName || 'Proveedor no asignado'} />
              <DetailValue label="Sucursal" value={batch.branchName || 'Sucursal actual'} />
              <DetailValue label="Esperado" value={`${batch.expectedQuantity} prendas`} />
              <DetailValue
                label="Recibido"
                value={hasRegisteredReception ? `${batch.receivedQuantity} prendas` : 'Pendiente'}
              />
              <DetailValue label="Clasificado" value={`${batch.classifiedQuantity ?? 0} prendas`} />
              <DetailValue label="Items creados" value={`${batch.itemCount ?? 0}`} />
            </View>

            {!batch.supplierName ? (
              <View
                style={[
                  styles.warningBox,
                  {
                    backgroundColor: theme.colors.warningBackground,
                    borderColor: theme.colors.warning,
                    borderRadius: theme.radius.md,
                  },
                ]}
              >
                <AppText color={theme.colors.warning} bold>
                  Este lote no tiene proveedor asignado.
                </AppText>
                <AppText>
                  Si el lote requiere trazabilidad de compra, registra o asigna proveedor antes de continuar.
                </AppText>
              </View>
            ) : null}

            <View style={styles.cardAction}>
              <AppButton
                title={batch.supplierName ? 'Ver proveedores' : 'Crear proveedor'}
                variant="secondary"
                onPress={() => router.push('/suppliers' as any)}
                disabled={supplierActionDisabled}
                disabledReason={supplierActionDisabledReason}
              />
            </View>
          </AppCard>

          <AppCard style={styles.panelCard}>
            <AppText variant="subtitle" bold>
              Acciones del lote
            </AppText>
            <AppText color={theme.colors.mutedText}>
              Opera solo lo disponible para el estado actual y tus permisos.
            </AppText>

            <View style={styles.actionGrid}>
              <AppButton
                title="Registrar recepcion"
                onPress={() => setShowReceiveModal(true)}
                disabled={!canManageInventory || !canReceive || saving}
                disabledReason={
                  !canManageInventory
                    ? 'Tu usuario necesita MANAGE_INVENTORY para registrar recepcion.'
                    : 'Este lote ya no permite recepcion.'
                }
              />
              <AppButton
                title="Alta de prendas"
                variant="operation"
                onPress={goToCreateItems}
                disabled={createItemsDisabled}
                disabledReason={createItemsDisabledReason}
              />
              <AppButton
                title="Cerrar lote"
                variant="secondary"
                onPress={handleReconcile}
                loading={saving}
                disabled={!canManageInventory || saving}
                disabledReason="Tu usuario necesita MANAGE_INVENTORY o el lote aun no cumple recepcion/clasificacion."
              />
              <AppButton
                title="Cancelar lote"
                variant="danger"
                onPress={() => setShowCancelModal(true)}
                disabled={!canManageInventory || !canCancel || saving}
                disabledReason={
                  !canManageInventory
                    ? 'Tu usuario necesita MANAGE_INVENTORY para cancelar lotes.'
                    : 'Este lote ya no puede cancelarse.'
                }
              />
            </View>
          </AppCard>
        </View>

        <AppCard>
          <View style={styles.sectionHeader}>
            <View>
              <AppText variant="subtitle" bold>
                Clasificacion por tipo de prenda
              </AppText>
              <AppText color={theme.colors.mutedText}>
                {hasRegisteredReception
                  ? `Capturado: ${classifiedTotal} / ${batch.receivedQuantity ?? 0}. Pendiente: ${pendingToClassify}.`
                  : 'Primero registra la recepcion del lote para habilitar la clasificacion.'}
              </AppText>
            </View>
            <StatusBadge
              label={pendingToClassify === 0 && hasRegisteredReception ? 'Completa' : 'Pendiente'}
              tone={pendingToClassify === 0 && hasRegisteredReception ? 'success' : 'warning'}
            />
          </View>

          {!hasRegisteredReception ? (
            <View style={styles.cardAction}>
              <AppButton
                title="Registrar recepcion para continuar"
                onPress={() => setShowReceiveModal(true)}
                disabled={!canManageInventory || !canReceive || saving}
                disabledReason={
                  !canManageInventory
                    ? 'Tu usuario necesita MANAGE_INVENTORY para registrar recepcion.'
                    : 'Este lote no permite recepcion.'
                }
              />
            </View>
          ) : (
            <View style={styles.classificationGrid}>
              {classificationDraft.map((detail) => (
                <View key={detail.productTypeId} style={styles.classificationRow}>
                  <View style={styles.classificationName}>
                    <AppText bold>{detail.productTypeName}</AppText>
                  </View>
                  <View style={styles.quantityInput}>
                    <AppInput
                      value={detail.quantityText}
                      onChangeText={(value) =>
                        updateClassificationQuantity(detail.productTypeId, value)
                      }
                      keyboardType="number-pad"
                      placeholder="0"
                      editable={canManageInventory && canClassify && !saving}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.cardAction}>
            <AppButton
              title="Guardar clasificacion"
              onPress={handleSaveClassification}
              loading={saving}
              disabled={!canManageInventory || !canClassify || saving}
              disabledReason={
                !canManageInventory
                  ? 'Tu usuario necesita MANAGE_INVENTORY para clasificar lotes.'
                  : 'Este lote no permite editar clasificacion.'
              }
            />
          </View>
        </AppCard>

        <AppCard>
          <View style={styles.sectionHeader}>
            <View style={styles.itemsHeaderText}>
              <AppText variant="subtitle" bold>
                Prendas del lote
              </AppText>
              <AppText color={theme.colors.mutedText}>
                Consulta codigos, estado, ubicacion y valor de cada prenda asociada.
              </AppText>
            </View>
            <AppButton
              title="Agregar prendas"
              variant="operation"
              onPress={goToCreateItems}
              disabled={createItemsDisabled}
              disabledReason={createItemsDisabledReason}
            />
          </View>

          <AppInput
            placeholder="Buscar por codigo, tipo, marca, talla o ubicacion"
            value={itemSearch}
            onChangeText={setItemSearch}
          />

          <View style={styles.filterRow}>
            {itemStatusFilters.map((filter) => (
              <AppButton
                key={filter.value}
                title={filter.label}
                variant={itemStatusFilter === filter.value ? 'primary' : 'secondary'}
                onPress={() => setItemStatusFilter(filter.value)}
                style={styles.filterButton}
              />
            ))}
          </View>

          {filteredItems.length === 0 ? (
            <View
              style={[
                styles.emptyState,
                {
                  backgroundColor: theme.colors.surfaceMuted,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.md,
                },
              ]}
            >
              <AppText bold>Este lote todavia no tiene prendas con estos filtros.</AppText>
              <AppText color={theme.colors.mutedText}>
                Agrega prendas al lote o limpia los filtros para revisar el inventario asociado.
              </AppText>
              <View style={styles.emptyAction}>
                <AppButton
                  title="Agregar prendas al lote"
                  onPress={goToCreateItems}
                  disabled={createItemsDisabled}
                  disabledReason={createItemsDisabledReason}
                />
              </View>
            </View>
          ) : (
            <View style={styles.itemList}>
              {filteredItems.map((item) => (
                <Pressable key={item.id} onPress={() => goToItemDetail(item)}>
                  <View
                    style={[
                      styles.itemRow,
                      {
                        borderColor: theme.colors.border,
                        borderRadius: theme.radius.md,
                      },
                    ]}
                  >
                    <View style={styles.itemMain}>
                      <AppText bold>{item.code}</AppText>
                      <AppText color={theme.colors.mutedText}>
                        {item.productTypeName || 'Sin tipo'} · {item.brandName || 'Sin marca'} ·{' '}
                        {item.sizeName || 'Sin talla'}
                      </AppText>
                    </View>

                    <View style={styles.itemMeta}>
                      <AppText variant="caption" color={theme.colors.mutedText}>
                        Ubicacion
                      </AppText>
                      <AppText>{item.storageLocationName || 'Sin ubicacion'}</AppText>
                    </View>

                    <View style={styles.itemMeta}>
                      <AppText variant="caption" color={theme.colors.mutedText}>
                        Precio
                      </AppText>
                      <AppText>{formatMoney(item.price)}</AppText>
                    </View>

                    <View style={styles.itemStatus}>
                      <StatusBadge
                        label={getItemStatusLabel(item.status)}
                        tone={getItemStatusTone(item.status)}
                      />
                      <AppText variant="caption" color={theme.colors.mutedText}>
                        Ver detalle
                      </AppText>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </AppCard>
      </AppShellPage>

      <AppBottomModal
        visible={showReceiveModal}
        title="Recepcion de lote"
        onClose={() => setShowReceiveModal(false)}
      >
        <AppInput
          label="Cantidad recibida *"
          value={receiveQuantity}
          onChangeText={(value) => setReceiveQuantity(value.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          placeholder="Ej. 100"
        />

        <View style={styles.qualityBlock}>
          <AppText bold>Calidad del lote *</AppText>
          <AppText variant="caption" color={theme.colors.mutedText}>
            Selecciona como llego el lote. 1 es mala calidad y 5 es excelente.
          </AppText>
          <View style={styles.qualityOptions}>
            {qualityOptions.map((option) => (
              <View key={option.value} style={styles.qualityOption}>
                <AppButton
                  title={option.title}
                  variant={qualityScore === option.value ? 'primary' : 'secondary'}
                  onPress={() => setQualityScore(option.value)}
                  disabled={saving}
                />
              </View>
            ))}
          </View>
        </View>

        <AppInput
          label="Notas de calidad"
          value={qualityNotes}
          onChangeText={setQualityNotes}
          placeholder="Describe faltantes, manchas, mezcla de tallas o cualquier detalle de revision"
          multiline
        />

        <AppInput
          label="Notas de recepcion"
          value={receiveNotes}
          onChangeText={setReceiveNotes}
          placeholder="Opcional"
          multiline
        />

        <AppButton title="Confirmar recepcion" onPress={handleReceive} loading={saving} />
      </AppBottomModal>

      <AppBottomModal
        visible={showCancelModal}
        title="Cancelar lote"
        onClose={() => setShowCancelModal(false)}
      >
        <AppInput
          label="Motivo *"
          value={cancelReason}
          onChangeText={setCancelReason}
          placeholder="Motivo de cancelacion"
          multiline
        />

        <AppButton
          title="Confirmar cancelacion"
          variant="danger"
          onPress={handleCancel}
          loading={saving}
        />
      </AppBottomModal>
    </>
  );
}

function MetricCard({
  label,
  tone = 'neutral',
  value,
}: {
  label: string;
  tone?: 'danger' | 'info' | 'neutral' | 'reserved' | 'success' | 'warning';
  value: string;
}) {
  const { theme } = useAppTheme();

  return (
    <AppCard style={styles.metricCard}>
      <AppText variant="caption" color={theme.colors.mutedText}>
        {label}
      </AppText>
      <View style={styles.metricValueRow}>
        <AppText variant="subtitle" bold>
          {value}
        </AppText>
        {tone !== 'neutral' ? <StatusBadge label=" " tone={tone} style={styles.metricDot} /> : null}
      </View>
    </AppCard>
  );
}

function DetailValue({ label, value }: { label: string; value: string }) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.detailValue}>
      <AppText variant="caption" color={theme.colors.mutedText}>
        {label}
      </AppText>
      <AppText bold>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  cardAction: {
    marginTop: 12,
  },
  classificationGrid: {
    gap: 10,
    marginTop: 12,
  },
  classificationName: {
    flex: 1,
    minWidth: 180,
  },
  classificationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  detailValue: {
    flexGrow: 1,
    minWidth: 150,
  },
  emptyAction: {
    marginTop: 12,
  },
  emptyState: {
    borderWidth: 1,
    gap: 8,
    marginTop: 12,
    padding: 14,
  },
  filterButton: {
    flexGrow: 1,
    minWidth: 120,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  heroCard: {
    gap: 12,
  },
  heroMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  heroRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  heroTitle: {
    flex: 1,
    minWidth: 260,
  },
  itemList: {
    gap: 10,
    marginTop: 12,
  },
  itemMain: {
    flex: 2,
    minWidth: 220,
  },
  itemMeta: {
    flex: 1,
    minWidth: 130,
  },
  itemRow: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 12,
  },
  itemStatus: {
    alignItems: 'flex-start',
    gap: 4,
    minWidth: 130,
  },
  itemsHeaderText: {
    flex: 1,
    minWidth: 240,
  },
  metricCard: {
    minHeight: 86,
  },
  metricDot: {
    height: 12,
    overflow: 'hidden',
    paddingHorizontal: 5,
    paddingVertical: 0,
    width: 12,
  },
  metricValueRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  nextStepBox: {
    borderWidth: 1,
    maxWidth: 360,
    minWidth: 260,
    padding: 12,
  },
  note: {
    marginTop: 8,
  },
  panelCard: {
    flex: 1,
    minWidth: 280,
  },
  quantityInput: {
    width: 110,
  },
  qualityBlock: {
    gap: 8,
    marginBottom: 12,
  },
  qualityOption: {
    flexGrow: 1,
    minWidth: 120,
  },
  qualityOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  twoColumnLayout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  warningBox: {
    borderWidth: 1,
    gap: 6,
    marginTop: 12,
    padding: 12,
  },
});
