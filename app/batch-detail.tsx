import AppShellPage from '@/components/layout/AppShellPage';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppText from '@/components/ui/AppText';
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
import { getSession } from '@/services/sessionStorage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

type ClassificationDraft = {
  productTypeId: number;
  productTypeName: string;
  quantityText: string;
};

function asNumber(value?: number | null) {
  return value ?? 0;
}

function formatDateTime(value?: string | null) {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('es-MX');
}

const qualityOptions = [
  { value: '1', title: '1 Mala' },
  { value: '2', title: '2 Baja' },
  { value: '3', title: '3 Regular' },
  { value: '4', title: '4 Buena' },
  { value: '5', title: '5 Excelente' },
];

export default function BatchDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { theme } = useAppTheme();

  const batchId = id ? Number(id) : null;

  const [batch, setBatch] = useState<Batch | null>(null);
  const [classificationDraft, setClassificationDraft] = useState<ClassificationDraft[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      Alert.alert('Lotes', 'No se encontró el lote solicitado.');
      router.replace('/batches');
      return;
    }

    const session = await getSession();
    if (!session) return;

    setCanManageInventory(
      session.effectivePermissions?.some(
        (permission) => permission.code === 'MANAGE_INVENTORY'
      ) ?? false
    );

    setLoading(true);

    try {
      const [batchResult, productTypeResult] = await Promise.allSettled([
        getBatchById(batchId),
        getProductTypes(session.branchId),
      ]);

      if (batchResult.status === 'rejected') {
        throw batchResult.reason;
      }

      const batchData = batchResult.value;
      const productTypeData =
        productTypeResult.status === 'fulfilled' ? productTypeResult.value : [];

      setBatch(batchData);
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
      Alert.alert('Validación', 'La cantidad recibida debe ser un entero cero o mayor.');
      return;
    }

    const cleanQualityScore = qualityScore.trim() ? Number(qualityScore) : null;
    if (cleanQualityScore === null) {
      Alert.alert('Validación', 'Selecciona la calidad del lote antes de confirmar.');
      return;
    }
    if (
      !Number.isInteger(cleanQualityScore) ||
      cleanQualityScore < 1 ||
      cleanQualityScore > 5
    ) {
      Alert.alert('Validación', 'La calidad del lote debe estar entre 1 y 5.');
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
      Alert.alert('Lotes', 'Recepción registrada correctamente.');
    } catch (err: any) {
      Alert.alert('Lotes', err?.message || 'No se pudo registrar la recepción.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveClassification = async () => {
    if (!batch) return;

    if (batch.receivedQuantity === null || batch.receivedQuantity === undefined) {
      Alert.alert(
        'Validación',
        'Primero registra la recepcion del lote para poder guardar la clasificacion.'
      );
      return;
    }

    for (const detail of classificationDraft) {
      if (!detail.quantityText.trim()) continue;
      const qty = Number(detail.quantityText);
      if (!Number.isInteger(qty) || qty < 0) {
        Alert.alert('Validación', `Cantidad inválida en ${detail.productTypeName}.`);
        return;
      }
    }

    if (batch.receivedQuantity !== null && batch.receivedQuantity !== undefined) {
      if (classifiedTotal > batch.receivedQuantity) {
        Alert.alert(
          'Validación',
          'La clasificación no puede superar la cantidad recibida.'
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
      Alert.alert('Lotes', 'Clasificación guardada correctamente.');
    } catch (err: any) {
      Alert.alert('Lotes', err?.message || 'No se pudo guardar la clasificación.');
    } finally {
      setSaving(false);
    }
  };

  const handleReconcile = () => {
    if (!batch) return;

    if (batch.receivedQuantity === null || batch.receivedQuantity === undefined) {
      Alert.alert(
        'Validación',
        'Primero registra la recepcion del lote para poder conciliarlo.'
      );
      return;
    }

    if (asNumber(batch.classifiedQuantity) <= 0) {
      Alert.alert(
        'Validación',
        'Primero guarda la clasificacion del lote para poder conciliarlo.'
      );
      return;
    }

    if (classifiedTotal !== asNumber(batch.receivedQuantity)) {
      Alert.alert(
        'Validación',
        'Para conciliar, la clasificación debe coincidir con la cantidad recibida.'
      );
      return;
    }

    Alert.alert(
      'Conciliar lote',
      'Al conciliar se cierra el lote y ya no se podrá modificar su clasificación.',
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
      Alert.alert('Validación', 'Captura el motivo de cancelación.');
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
        'Validación',
        'Primero registra la recepcion del lote para poder crear prendas.'
      );
      return;
    }

    if (asNumber(batch.classifiedQuantity) <= 0) {
      Alert.alert(
        'Validación',
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

  return (
    <>
      <AppShellPage
        title={`Lote ${batch.folio}`}
        subtitle="Recepcion, clasificacion y cierre"
        activeRoute="batches"
        rightContent={
          <AppButton
            title="Volver"
            variant="secondary"
            onPress={() => router.replace('/batches' as any)}
          />
        }
      >

        <AppCard>
          <View style={styles.headerRow}>
            <View style={styles.titleBlock}>
              <AppText variant="subtitle" bold>
                Resumen
              </AppText>
              <AppText color={theme.colors.mutedText}>{batch.branchName}</AppText>
              <AppText color={theme.colors.mutedText}>
                Proveedor: {batch.supplierName || 'Sin proveedor'}
              </AppText>
            </View>

            <View
              style={[
                styles.statusPill,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.optionPressedBackground,
                  borderRadius: theme.radius.md,
                },
              ]}
            >
              <AppText variant="caption" bold>
                {statusLabel}
              </AppText>
            </View>
          </View>

          <View style={styles.metricsRow}>
            <AppText>Esperado: {batch.expectedQuantity}</AppText>
            <AppText>Recibido: {batch.receivedQuantity ?? '-'}</AppText>
          </View>

          <View style={styles.metricsRow}>
            <AppText>Clasificado: {batch.classifiedQuantity ?? 0}</AppText>
            <AppText>Items creados: {batch.itemCount ?? 0}</AppText>
          </View>

          <View style={styles.metricsRow}>
            <AppText>Calidad: {batch.qualityScore ? `${batch.qualityScore}/5` : '-'}</AppText>
          </View>

          <View style={styles.dateBlock}>
            <AppText variant="caption" color={theme.colors.mutedText}>
              Creado: {formatDateTime(batch.createdAt)}
            </AppText>
            {hasRegisteredReception ? (
              <AppText variant="caption" color={theme.colors.mutedText}>
                Recepcion registrada: {formatDateTime(batch.receivedAt ?? batch.updatedAt)}
              </AppText>
            ) : null}
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

        <AppCard>
          <AppText variant="subtitle" bold>
            Recepción
          </AppText>
          <AppText color={theme.colors.mutedText}>
            Registra la cantidad real recibida. Puede ser menor o mayor a la esperada.
          </AppText>

          <View style={styles.cardAction}>
            <AppButton
              title="Registrar / editar recepción"
              onPress={() => setShowReceiveModal(true)}
              disabled={!canManageInventory || !canReceive || saving}
            />
          </View>
        </AppCard>

        <AppCard>
          <AppText variant="subtitle" bold>
            Clasificación por tipo de prenda
          </AppText>
          <AppText color={theme.colors.mutedText}>
            {hasRegisteredReception
              ? `Total capturado: ${classifiedTotal} / ${batch.receivedQuantity ?? 0}. Pendiente: ${pendingToClassify}.`
              : 'Primero registra la recepcion del lote para habilitar la clasificacion.'}
          </AppText>

          {!hasRegisteredReception ? (
            <View style={styles.cardAction}>
              <AppButton
                title="Registrar recepcion para continuar"
                onPress={() => setShowReceiveModal(true)}
                disabled={!canManageInventory || !canReceive || saving}
              />
            </View>
          ) : (
            classificationDraft.map((detail) => (
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
            ))
          )}

          <AppButton
            title="Guardar clasificación"
            onPress={handleSaveClassification}
            loading={saving}
            disabled={!canManageInventory || !canClassify || saving}
          />
        </AppCard>

        <AppCard>
          <AppText variant="subtitle" bold>
            Prendas del lote
          </AppText>
          <AppText color={theme.colors.mutedText}>
            Crea prendas asociadas a este lote. La pantalla de alta abrirá con este lote preseleccionado.
          </AppText>

          <View style={styles.cardAction}>
            <AppButton
              title="Alta de prendas de este lote"
              onPress={goToCreateItems}
              disabled={
                !canManageInventory ||
                batch.status === 'CANCELLED'
              }
            />
          </View>
          {!hasRegisteredReception || !hasSavedClassification ? (
            <AppText variant="caption" color={theme.colors.mutedText}>
              Para crear prendas, primero registra recepcion y guarda la clasificacion.
            </AppText>
          ) : null}
        </AppCard>

        <AppCard>
          <AppText variant="subtitle" bold>
            Cierre del lote
          </AppText>
          <AppText color={theme.colors.mutedText}>
            Cerrar / conciliar confirma que lo recibido y lo clasificado coinciden. Despues ya no se podra editar la clasificacion.
          </AppText>

          <View style={styles.buttonRow}>
            <View style={styles.buttonFill}>
              <AppButton
                title="Cerrar lote (conciliar)"
                onPress={handleReconcile}
                loading={saving}
                disabled={!canManageInventory || saving}
              />
            </View>

            <View style={styles.buttonFill}>
              <AppButton
                title="Cancelar lote"
                variant="danger"
                onPress={() => setShowCancelModal(true)}
                disabled={!canManageInventory || !canCancel || saving}
              />
            </View>
          </View>
        </AppCard>
      </AppShellPage>

      <AppBottomModal
        visible={showReceiveModal}
        title="Recepción de lote"
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
          label="Notas de recepción"
          value={receiveNotes}
          onChangeText={setReceiveNotes}
          placeholder="Opcional"
          multiline
        />

        <AppButton
          title="Confirmar recepción"
          onPress={handleReceive}
          loading={saving}
        />
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
          placeholder="Motivo de cancelación"
          multiline
        />

        <AppButton
          title="Confirmar cancelación"
          variant="danger"
          onPress={handleCancel}
          loading={saving}
        />
      </AppBottomModal>
    </>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleBlock: {
    flex: 1,
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 8,
  },
  note: {
    marginTop: 8,
  },
  cardAction: {
    marginTop: 12,
  },
  dateBlock: {
    gap: 2,
    marginTop: 10,
  },
  classificationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  classificationName: {
    flex: 1,
  },
  quantityInput: {
    width: 110,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  buttonFill: {
    flex: 1,
    minWidth: 140,
  },
  qualityBlock: {
    gap: 8,
    marginBottom: 12,
  },
  qualityOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  qualityOption: {
    flexGrow: 1,
    minWidth: 120,
  },
});
