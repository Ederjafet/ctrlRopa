import AppBackButton from '@/components/ui/AppBackButton';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import {
  approveRefund,
  cancelRefund,
  getRefundById,
  getRefundMethodLabel,
  getRefundStatusLabel,
  isRefundFinal,
  processRefund,
  Refund,
} from '@/services/refundService';
import { getSession } from '@/services/sessionStorage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

type RefundAction = 'APPROVE' | 'PROCESS' | 'CANCEL';

function formatMoney(value?: number | null) {
  if (value === null || value === undefined) return '$0.00';
  return `$${Number(value).toFixed(2)}`;
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function getStatusColor(theme: any, status?: string | null) {
  if (status === 'PROCESSED') return theme.colors.success;
  if (status === 'CANCELLED') return theme.colors.danger;
  if (status === 'APPROVED') return theme.colors.accent;
  return theme.colors.text;
}

export default function RefundDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { theme } = useAppTheme();

  const refundId = Number(id);

  const [refund, setRefund] = useState<Refund | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelModalVisible, setCancelModalVisible] = useState(false);

  const load = useCallback(async () => {
    if (!refundId || Number.isNaN(refundId)) {
      Alert.alert('Refund', 'Refund no válido.');
      router.replace('/refunds');
      return;
    }

    setLoading(true);

    try {
      const data = await getRefundById(refundId);
      setRefund(data);
    } catch (err: any) {
      Alert.alert('Refund', err?.message || 'No se pudo cargar el refund.');
    } finally {
      setLoading(false);
    }
  }, [refundId, router]);

  useEffect(() => {
    load();
  }, [load]);

  const finalRefund = isRefundFinal(refund?.status);

  const availableActions = useMemo<RefundAction[]>(() => {
    if (!refund || finalRefund) return [];

    if (refund.status === 'PENDING') {
      return ['APPROVE', 'CANCEL'];
    }

    if (refund.status === 'APPROVED') {
      return ['PROCESS', 'CANCEL'];
    }

    return [];
  }, [refund, finalRefund]);

  const handleApprove = () => {
    if (!refund) return;

    Alert.alert('Aprobar refund', '¿Quieres aprobar este refund?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Aprobar',
        onPress: async () => {
          const session = await getSession();

          if (!session) {
            router.replace('/login');
            return;
          }

          setActionLoading(true);

          try {
            const updated = await approveRefund(refund.id, {
              approvedByUserId: session.userId,
            });
            setRefund(updated);
            await load();
          } catch (err: any) {
            Alert.alert('Refund', err?.message || 'No se pudo aprobar.');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleProcess = () => {
    if (!refund) return;

    Alert.alert(
      'Procesar refund',
      refund.method === 'STORE_CREDIT'
        ? 'Al procesar se generará saldo a favor para el cliente.'
        : '¿Quieres marcar este refund como procesado?',
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
              const updated = await processRefund(refund.id, {
                processedByUserId: session.userId,
              });
              setRefund(updated);
              await load();
            } catch (err: any) {
              Alert.alert('Refund', err?.message || 'No se pudo procesar.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCancel = async () => {
    if (!refund) return;

    if (!cancelReason.trim()) {
      Alert.alert('Cancelar refund', 'Captura el motivo de cancelación.');
      return;
    }

    const session = await getSession();

    if (!session) {
      router.replace('/login');
      return;
    }

    setActionLoading(true);

    try {
      const updated = await cancelRefund(refund.id, {
        reason: cancelReason,
        cancelledByUserId: session.userId,
      });
      setRefund(updated);
      setCancelReason('');
      setCancelModalVisible(false);
      await load();
    } catch (err: any) {
      Alert.alert('Refund', err?.message || 'No se pudo cancelar.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <AppScreen>
        <ActivityIndicator />
      </AppScreen>
    );
  }

  if (!refund) {
    return (
      <AppScreen>
        <AppBackButton fallbackRoute="/refunds" />
        <AppText>No se encontró el refund.</AppText>
      </AppScreen>
    );
  }

  const color = getStatusColor(theme, refund.status);

  return (
    <>
      <AppScreen>
        <AppBackButton fallbackRoute="/refunds" />

        <AppText variant="title" bold>
          Refund #{refund.id}
        </AppText>

        <AppCard>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <AppText variant="subtitle" bold>
                {formatMoney(refund.amount)}
              </AppText>
              <AppText color={theme.colors.mutedText}>
                {getRefundMethodLabel(refund.method)}
              </AppText>
            </View>

            <View
              style={[
                styles.statusPill,
                { borderColor: color, backgroundColor: theme.colors.surface },
              ]}
            >
              <AppText variant="caption" bold color={color}>
                {getRefundStatusLabel(refund.status)}
              </AppText>
            </View>
          </View>

          <AppText>Motivo: {refund.reason}</AppText>
          {refund.notes ? (
            <AppText color={theme.colors.mutedText}>Notas: {refund.notes}</AppText>
          ) : null}
        </AppCard>

        <AppCard>
          <AppText variant="subtitle" bold>
            Relación
          </AppText>
          <InfoLine label="Return" value={`#${refund.returnId}`} />
          <InfoLine label="Venta" value={`#${refund.saleId}`} />
          <InfoLine label="Cliente" value={`#${refund.customerId}`} />
          <InfoLine label="Sucursal" value={`#${refund.branchId}`} />
          {refund.customerOrderId ? (
            <InfoLine label="Pedido" value={`#${refund.customerOrderId}`} />
          ) : null}
        </AppCard>

        <AppCard>
          <AppText variant="subtitle" bold>
            Trazabilidad
          </AppText>
          <InfoLine label="Creado" value={formatDate(refund.createdAt)} />
          <InfoLine
            label="Usuario creador"
            value={refund.createdByUserId ? `#${refund.createdByUserId}` : '—'}
          />
          <InfoLine label="Aprobado" value={formatDate(refund.approvedAt)} />
          <InfoLine
            label="Usuario aprobador"
            value={refund.approvedByUserId ? `#${refund.approvedByUserId}` : '—'}
          />
          <InfoLine label="Procesado" value={formatDate(refund.processedAt)} />
          <InfoLine
            label="Usuario procesador"
            value={refund.processedByUserId ? `#${refund.processedByUserId}` : '—'}
          />
          <InfoLine label="Cancelado" value={formatDate(refund.cancelledAt)} />
          <InfoLine
            label="Usuario cancelador"
            value={refund.cancelledByUserId ? `#${refund.cancelledByUserId}` : '—'}
          />
          {refund.cancelReason ? (
            <InfoLine label="Motivo cancelación" value={refund.cancelReason} />
          ) : null}
        </AppCard>

        {finalRefund ? (
          <AppCard>
            <AppText color={theme.colors.mutedText}>
              Este refund ya está finalizado.
            </AppText>
          </AppCard>
        ) : (
          <AppCard>
            <AppText variant="subtitle" bold>
              Acciones
            </AppText>

            <View style={styles.buttonGroup}>
              {availableActions.includes('APPROVE') ? (
                <AppButton
                  title="Aprobar refund"
                  onPress={handleApprove}
                  loading={actionLoading}
                  disabled={actionLoading}
                />
              ) : null}

              {availableActions.includes('PROCESS') ? (
                <AppButton
                  title="Procesar refund"
                  onPress={handleProcess}
                  loading={actionLoading}
                  disabled={actionLoading}
                />
              ) : null}

              {availableActions.includes('CANCEL') ? (
                <AppButton
                  title="Cancelar refund"
                  variant="danger"
                  onPress={() => setCancelModalVisible(true)}
                  disabled={actionLoading}
                />
              ) : null}
            </View>
          </AppCard>
        )}
      </AppScreen>

      <AppBottomModal
        visible={cancelModalVisible}
        title="Cancelar refund"
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
  statusPill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});
