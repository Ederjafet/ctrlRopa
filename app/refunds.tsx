import AppBackButton from '@/components/ui/AppBackButton';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import {
  getRefundMethodLabel,
  getRefundsByStatus,
  getRefundStatusLabel,
  Refund,
  RefundStatus,
} from '@/services/refundService';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

const filters: Array<{ label: string; value: RefundStatus }> = [
  { label: 'Pendientes', value: 'PENDING' },
  { label: 'Aprobados', value: 'APPROVED' },
  { label: 'Procesados', value: 'PROCESSED' },
  { label: 'Cancelados', value: 'CANCELLED' },
];

function normalize(value?: string | number | null) {
  return String(value ?? '').toLowerCase().trim();
}

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

export default function RefundsScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const [status, setStatus] = useState<RefundStatus>('PENDING');
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      load(status);
    }, [status])
  );

  const load = async (selectedStatus: RefundStatus) => {
    setLoading(true);
    setError('');

    try {
      const data = await getRefundsByStatus(selectedStatus);
      setRefunds(data);
    } catch (err: any) {
      setError(err?.message || 'No se pudieron cargar los refunds.');
    } finally {
      setLoading(false);
    }
  };

  const filteredRefunds = useMemo(() => {
    const term = normalize(search);

    if (!term) return refunds;

    return refunds.filter((refund) => {
      const content = [
        refund.id,
        refund.returnId,
        refund.saleId,
        refund.customerId,
        refund.customerOrderId,
        refund.branchId,
        refund.status,
        getRefundStatusLabel(refund.status),
        refund.method,
        getRefundMethodLabel(refund.method),
        refund.reason,
        refund.notes,
        refund.amount,
      ]
        .map(normalize)
        .join(' ');

      return content.includes(term);
    });
  }, [refunds, search]);

  return (
    <AppScreen>
      <AppBackButton fallbackRoute="/" />

      <AppText variant="title" bold>
        Refunds
      </AppText>

      <AppCard>
        <AppText variant="subtitle" bold>
          Devoluciones financieras
        </AppText>
        <AppText color={theme.colors.mutedText}>
          Crea, aprueba y procesa refunds derivados de devoluciones físicas ya
          procesadas. El método STORE_CREDIT genera saldo a favor.
        </AppText>
      </AppCard>

      <AppButton
        title="+ Nuevo refund"
        onPress={() => router.push('/refund-create')}
      />

      <AppInput
        label="Buscar"
        placeholder="Return, venta, cliente, método, motivo..."
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.filterRow}>
        {filters.map((filter) => {
          const selected = status === filter.value;

          return (
            <Pressable
              key={filter.value}
              onPress={() => setStatus(filter.value)}
              style={({ pressed }) => [
                styles.filterPill,
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
              <AppText bold={selected}>{filter.label}</AppText>
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <AppCard style={{ borderColor: theme.colors.danger }}>
          <AppText color={theme.colors.danger}>{error}</AppText>
        </AppCard>
      ) : null}

      {loading ? <ActivityIndicator /> : null}

      {!loading && filteredRefunds.length === 0 ? (
        <AppCard>
          <AppText color={theme.colors.mutedText}>
            No hay refunds para mostrar.
          </AppText>
        </AppCard>
      ) : null}

      {filteredRefunds.map((refund) => {
        const color = getStatusColor(theme, refund.status);

        return (
          <Pressable
            key={refund.id}
            onPress={() =>
              router.push({
                pathname: '/refund-detail',
                params: { id: String(refund.id) },
              })
            }
            style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
          >
            <AppCard>
              <View style={styles.headerRow}>
                <View style={styles.headerText}>
                  <AppText variant="subtitle" bold>
                    Refund #{refund.id}
                  </AppText>
                  <AppText color={theme.colors.mutedText}>
                    Return #{refund.returnId} · Venta #{refund.saleId}
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

              <AppText variant="subtitle" bold>
                {formatMoney(refund.amount)}
              </AppText>
              <AppText color={theme.colors.mutedText}>
                Método: {getRefundMethodLabel(refund.method)}
              </AppText>
              <AppText color={theme.colors.mutedText}>
                Motivo: {refund.reason}
              </AppText>
              <AppText variant="caption" color={theme.colors.mutedText}>
                Creado: {formatDate(refund.createdAt)}
              </AppText>
            </AppCard>
          </Pressable>
        );
      })}

    </AppScreen>
  );
}

const styles = StyleSheet.create({
  filterPill: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
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
  statusPill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});
