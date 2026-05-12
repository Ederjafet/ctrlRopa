import AppBackButton from '@/components/ui/AppBackButton';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import {
  addReturnItem,
  cancelReturn,
  CustomerReturn,
  getReturnById,
  getReturnConditionLabel,
  getReturnStatusLabel,
  getReturnTypeLabel,
  isReturnFinal,
  processReturn,
  ReturnItemCondition,
} from '@/services/returnService';
import { getSession } from '@/services/sessionStorage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

const conditions: Array<{ label: string; value: ReturnItemCondition }> = [
  { label: 'Buen estado', value: 'GOOD' },
  { label: 'Dañada', value: 'DAMAGED' },
  { label: 'Defectuosa', value: 'DEFECTIVE' },
  { label: 'No vendible', value: 'UNSELLABLE' },
];

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function statusColor(theme: any, status?: string | null) {
  if (status === 'PROCESSED') return theme.colors.success;
  if (status === 'CANCELLED') return theme.colors.danger;
  return theme.colors.warning;
}

export default function ReturnDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { theme } = useAppTheme();

  const returnId = Number(id);

  const [data, setData] = useState<CustomerReturn | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [newItemId, setNewItemId] = useState('');
  const [newItemCondition, setNewItemCondition] =
    useState<ReturnItemCondition>('GOOD');
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [addItemModalVisible, setAddItemModalVisible] = useState(false);

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    if (!returnId || Number.isNaN(returnId)) {
      Alert.alert('Devolución', 'Devolución no válida.');
      router.replace('/returns');
      return;
    }

    setLoading(true);

    try {
      const result = await getReturnById(returnId);
      setData(result);
    } catch (err: any) {
      Alert.alert(
        'Devolución',
        err?.message || 'No se pudo cargar la devolución.'
      );
    } finally {
      setLoading(false);
    }
  };

  const finalReturn = isReturnFinal(data?.status);
  const canProcess = data?.status === 'OPEN' && (data.items?.length ?? 0) > 0;

  const color = statusColor(theme, data?.status);

  const handleProcess = () => {
    if (!data) return;

    Alert.alert(
      'Procesar devolución',
      'Al procesar la devolución se aplicará el retorno físico del item según su condición.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Procesar',
          onPress: async () => {
            const session = await getSession();

            if (!session) {
              router.replace('/login');
              return;
            }

            setActionLoading(true);

            try {
              const updated = await processReturn(data.id, {
                processedByUserId: session.userId,
              });
              setData(updated);
              await load();
            } catch (err: any) {
              Alert.alert(
                'Procesar',
                err?.message || 'No se pudo procesar la devolución.'
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCancel = async () => {
    if (!data) return;

    if (!cancelReason.trim()) {
      Alert.alert('Cancelar', 'Captura el motivo de cancelación.');
      return;
    }

    const session = await getSession();

    if (!session) {
      router.replace('/login');
      return;
    }

    setActionLoading(true);

    try {
      const updated = await cancelReturn(data.id, {
        reason: cancelReason,
        cancelledByUserId: session.userId,
      });

      setData(updated);
      setCancelReason('');
      setCancelModalVisible(false);
      await load();
    } catch (err: any) {
      Alert.alert('Cancelar', err?.message || 'No se pudo cancelar.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!data) return;

    const itemId = Number(newItemId);

    if (!newItemId.trim() || Number.isNaN(itemId) || itemId <= 0) {
      Alert.alert('Agregar item', 'Captura un ID de item válido.');
      return;
    }

    setActionLoading(true);

    try {
      const updated = await addReturnItem(data.id, {
        itemId,
        condition: newItemCondition,
      });

      setData(updated);
      setNewItemId('');
      setNewItemCondition('GOOD');
      setAddItemModalVisible(false);
      await load();
    } catch (err: any) {
      Alert.alert('Agregar item', err?.message || 'No se pudo agregar el item.');
    } finally {
      setActionLoading(false);
    }
  };

  const itemLines = useMemo(() => data?.items ?? [], [data]);

  if (loading) {
    return (
      <AppScreen>
        <ActivityIndicator />
      </AppScreen>
    );
  }

  if (!data) {
    return (
      <AppScreen>
        <AppBackButton fallbackRoute="/returns" />
        <AppText>No se encontró la devolución.</AppText>
      </AppScreen>
    );
  }

  return (
    <>
      <AppScreen>
        <AppBackButton fallbackRoute="/returns" />

        <AppText variant="title" bold>
          Devolución #{data.id}
        </AppText>

        <AppCard>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <AppText variant="subtitle" bold>
                {getReturnTypeLabel(data.type)}
              </AppText>
              <AppText color={theme.colors.mutedText}>
                Venta #{data.saleId} · {data.customerName || `Cliente #${data.customerId || '—'}`}
              </AppText>
            </View>

            <View
              style={[
                styles.statusPill,
                {
                  borderColor: color,
                  backgroundColor: theme.colors.surface,
                },
              ]}
            >
              <AppText variant="caption" bold color={color}>
                {getReturnStatusLabel(data.status)}
              </AppText>
            </View>
          </View>

          <AppText>Motivo: {data.reason}</AppText>

          {data.notes ? (
            <AppText color={theme.colors.mutedText}>Notas: {data.notes}</AppText>
          ) : null}
        </AppCard>

        <AppCard>
          <AppText variant="subtitle" bold>
            Prendas devueltas
          </AppText>

          {itemLines.length === 0 ? (
            <AppText color={theme.colors.mutedText}>
              No hay items registrados en esta devolución.
            </AppText>
          ) : (
            itemLines.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.headerText}>
                  <AppText bold>{item.itemCode}</AppText>
                  <AppText variant="caption" color={theme.colors.mutedText}>
                    Item #{item.itemId}
                  </AppText>
                </View>

                <AppText bold>{getReturnConditionLabel(item.condition)}</AppText>
              </View>
            ))
          )}

          {!finalReturn ? (
            <View style={styles.spacing}>
              <AppButton
                title="Agregar item por ID"
                variant="secondary"
                onPress={() => setAddItemModalVisible(true)}
              />
            </View>
          ) : null}
        </AppCard>

        <AppCard>
          <AppText variant="subtitle" bold>
            Trazabilidad
          </AppText>

          <InfoLine label="Creada" value={formatDate(data.createdAt)} />
          <InfoLine label="Actualizada" value={formatDate(data.updatedAt)} />
          <InfoLine label="Procesada" value={formatDate(data.processedAt)} />
          <InfoLine label="Cancelada" value={formatDate(data.cancelledAt)} />

          {data.cancelReason ? (
            <InfoLine label="Motivo cancelación" value={data.cancelReason} />
          ) : null}
        </AppCard>

        {finalReturn ? (
          <AppCard>
            <AppText color={theme.colors.mutedText}>
              Esta devolución ya está finalizada.
            </AppText>
          </AppCard>
        ) : (
          <AppCard>
            <AppText variant="subtitle" bold>
              Acciones
            </AppText>

            <View style={styles.buttonGroup}>
              <AppButton
                title="Procesar devolución"
                onPress={handleProcess}
                loading={actionLoading}
                disabled={actionLoading || !canProcess}
              />

              <AppButton
                title="Cancelar devolución"
                variant="danger"
                onPress={() => setCancelModalVisible(true)}
                disabled={actionLoading}
              />
            </View>

            {!canProcess ? (
              <AppText variant="caption" color={theme.colors.mutedText}>
                Para procesar debe existir al menos un item físico registrado.
              </AppText>
            ) : null}
          </AppCard>
        )}
      </AppScreen>

      <AppBottomModal
        visible={cancelModalVisible}
        title="Cancelar devolución"
        onClose={() => setCancelModalVisible(false)}
      >
        <AppInput
          label="Motivo"
          placeholder="Motivo de cancelación"
          value={cancelReason}
          onChangeText={setCancelReason}
          multiline
        />

        <AppButton
          title="Confirmar cancelación"
          variant="danger"
          onPress={handleCancel}
          loading={actionLoading}
          disabled={actionLoading}
        />
      </AppBottomModal>

      <AppBottomModal
        visible={addItemModalVisible}
        title="Agregar item"
        onClose={() => setAddItemModalVisible(false)}
      >
        <AppInput
          label="ID de item"
          placeholder="Ej. 123"
          value={newItemId}
          onChangeText={setNewItemId}
          keyboardType="number-pad"
        />

        <AppText variant="subtitle" bold>
          Condición
        </AppText>

        <View style={styles.conditionGrid}>
          {conditions.map((condition) => {
            const selected = condition.value === newItemCondition;

            return (
              <Pressable
                key={condition.value}
                onPress={() => setNewItemCondition(condition.value)}
                style={({ pressed }) => [
                  styles.conditionOption,
                  {
                    borderColor: selected ? theme.colors.accent : theme.colors.border,
                    backgroundColor: selected
                      ? theme.colors.optionPressedBackground
                      : theme.colors.surface,
                    borderRadius: theme.radius.md,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <AppText bold={selected}>{condition.label}</AppText>
              </Pressable>
            );
          })}
        </View>

        <AppButton
          title="Agregar"
          onPress={handleAddItem}
          loading={actionLoading}
          disabled={actionLoading}
        />
      </AppBottomModal>
    </>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.infoLine}>
      <AppText color={theme.colors.mutedText}>{label}</AppText>
      <AppText bold>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonGroup: {
    gap: 10,
  },
  conditionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  conditionOption: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
  },
  infoLine: {
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  itemRow: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 12,
  },
  spacing: {
    marginTop: 12,
  },
  statusPill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});
