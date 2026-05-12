import AppBackButton from '@/components/ui/AppBackButton';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import {
  CustomerReturn,
  getReturnsByStatus,
  getReturnStatusLabel,
  getReturnTypeLabel,
  ReturnStatus,
} from '@/services/returnService';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

const filters: Array<{ label: string; value: ReturnStatus }> = [
  { label: 'Abiertas', value: 'OPEN' },
  { label: 'Procesadas', value: 'PROCESSED' },
  { label: 'Canceladas', value: 'CANCELLED' },
];

function normalize(value?: string | number | null) {
  return String(value ?? '').toLowerCase().trim();
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function statusColor(theme: any, status?: string | null) {
  if (status === 'PROCESSED') return theme.colors.success;
  if (status === 'CANCELLED') return theme.colors.danger;
  return theme.colors.warning;
}

export default function ReturnsScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const [status, setStatus] = useState<ReturnStatus>('OPEN');
  const [returns, setReturns] = useState<CustomerReturn[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      load(status);
    }, [status])
  );

  const load = async (selectedStatus: ReturnStatus) => {
    setLoading(true);
    setError('');

    try {
      const data = await getReturnsByStatus(selectedStatus);
      setReturns(data);
    } catch (err: any) {
      setError(err?.message || 'No se pudieron cargar las devoluciones.');
    } finally {
      setLoading(false);
    }
  };

  const filteredReturns = useMemo(() => {
    const term = normalize(search);

    if (!term) return returns;

    return returns.filter((item) => {
      const content = [
        item.id,
        item.saleId,
        item.customerName,
        item.customerId,
        item.itemCode,
        item.reason,
        item.notes,
        item.status,
        item.type,
      ]
        .map(normalize)
        .join(' ');

      return content.includes(term);
    });
  }, [returns, search]);

  return (
    <AppScreen>
      <AppBackButton fallbackRoute="/" />

      <AppText variant="title" bold>
        Devoluciones
      </AppText>

      <AppCard>
        <AppText variant="subtitle" bold>
          Returns
        </AppText>
        <AppText color={theme.colors.mutedText}>
          Gestiona devoluciones físicas posteriores a una venta. Después de
          procesarlas se puede continuar con Refunds si corresponde.
        </AppText>
      </AppCard>

      <AppButton
        title="+ Nueva devolución"
        onPress={() => router.push('/return-create')}
      />

      <AppInput
        label="Buscar"
        placeholder="Cliente, item, venta, motivo..."
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

      {!loading && filteredReturns.length === 0 ? (
        <AppCard>
          <AppText color={theme.colors.mutedText}>
            No hay devoluciones para mostrar.
          </AppText>
        </AppCard>
      ) : null}

      {filteredReturns.map((item) => {
        const color = statusColor(theme, item.status);

        return (
          <Pressable
            key={item.id}
            onPress={() =>
              router.push({
                pathname: '/return-detail',
                params: { id: String(item.id) },
              })
            }
            style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
          >
            <AppCard>
              <View style={styles.headerRow}>
                <View style={styles.headerText}>
                  <AppText variant="subtitle" bold>
                    Devolución #{item.id}
                  </AppText>
                  <AppText color={theme.colors.mutedText}>
                    Venta #{item.saleId} · {getReturnTypeLabel(item.type)}
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
                    {getReturnStatusLabel(item.status)}
                  </AppText>
                </View>
              </View>

              <AppText>{item.customerName || `Cliente #${item.customerId || '—'}`}</AppText>

              {item.itemCode ? (
                <AppText color={theme.colors.mutedText}>Item: {item.itemCode}</AppText>
              ) : null}

              <AppText color={theme.colors.mutedText}>Motivo: {item.reason}</AppText>
              <AppText variant="caption" color={theme.colors.mutedText}>
                Creada: {formatDate(item.createdAt)}
              </AppText>
            </AppCard>
          </Pressable>
        );
      })}

      <AppButton
        title="Actualizar"
        variant="secondary"
        onPress={() => load(status)}
        disabled={loading}
      />
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
