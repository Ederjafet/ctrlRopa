import AppBackButton from '@/components/ui/AppBackButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import {
  getIncidentsByBranch,
  getIncidentStatusLabel,
  getIncidentTypeLabel,
  Incident,
  IncidentStatus,
} from '@/services/incidentService';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

const statusFilters: Array<{ label: string; value: IncidentStatus | 'ALL' }> = [
  { label: 'Todas', value: 'ALL' },
  { label: 'Abiertas', value: 'OPEN' },
  { label: 'En seguimiento', value: 'IN_PROGRESS' },
  { label: 'Resueltas', value: 'RESOLVED' },
  { label: 'Canceladas', value: 'CANCELLED' },
];

function normalize(value?: string | number | null) {
  return String(value ?? '').toLowerCase().trim();
}

function formatMoney(value?: number | null) {
  if (value === null || value === undefined) return '—';
  return `$${Number(value).toFixed(2)}`;
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function getStatusColor(theme: any, status?: string | null) {
  if (status === 'RESOLVED') return theme.colors.success;
  if (status === 'CANCELLED') return theme.colors.danger;
  if (status === 'IN_PROGRESS') return theme.colors.accent;
  return theme.colors.danger;
}

export default function IncidentsScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const [session, setSession] = useState<UserSession | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [status, setStatus] = useState<IncidentStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      load(status);
    }, [status])
  );

  const load = async (selectedStatus: IncidentStatus | 'ALL') => {
    setLoading(true);
    setError('');

    try {
      const currentSession = await getSession();

      if (!currentSession) {
        router.replace('/login');
        return;
      }

      setSession(currentSession);

      const data = await getIncidentsByBranch(
        currentSession.branchId,
        selectedStatus
      );

      setIncidents(data);
    } catch (err: any) {
      setError(err?.message || 'No se pudieron cargar las incidencias.');
    } finally {
      setLoading(false);
    }
  };

  const filteredIncidents = useMemo(() => {
    const term = normalize(search);

    if (!term) return incidents;

    return incidents.filter((incident) => {
      const content = [
        incident.id,
        incident.type,
        getIncidentTypeLabel(incident.type),
        incident.status,
        getIncidentStatusLabel(incident.status),
        incident.customerId,
        incident.itemId,
        incident.shipmentId,
        incident.shipmentPackageId,
        incident.customerOrderId,
        incident.expectedAmount,
        incident.receivedAmount,
        incident.differenceAmount,
        incident.description,
      ]
        .map(normalize)
        .join(' ');

      return content.includes(term);
    });
  }, [incidents, search]);

  const openCount = incidents.filter((incident) => incident.status === 'OPEN').length;
  const inProgressCount = incidents.filter(
    (incident) => incident.status === 'IN_PROGRESS'
  ).length;

  return (
    <AppScreen>
      <AppBackButton fallbackRoute="/" />

      <AppText variant="title" bold>
        Incidencias
      </AppText>

      <AppCard>
        <AppText variant="subtitle" bold>
          Gestión de incidencias operativas
        </AppText>
        <AppText color={theme.colors.mutedText}>
          Las incidencias se registran desde la operación, especialmente al
          resolver entregas con diferencias de cobranza. Aquí se revisan, se
          atienden y se cierran.
        </AppText>
      </AppCard>

      <View style={styles.summaryRow}>
        <AppCard style={styles.summaryCard}>
          <AppText variant="caption" color={theme.colors.mutedText}>
            Abiertas
          </AppText>
          <AppText variant="subtitle" bold color={theme.colors.danger}>
            {openCount}
          </AppText>
        </AppCard>

        <AppCard style={styles.summaryCard}>
          <AppText variant="caption" color={theme.colors.mutedText}>
            En seguimiento
          </AppText>
          <AppText variant="subtitle" bold color={theme.colors.accent}>
            {inProgressCount}
          </AppText>
        </AppCard>
      </View>

      <AppInput
        label="Buscar"
        placeholder="Folio, envío, pedido, cliente, descripción..."
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.filterRow}>
        {statusFilters.map((filter) => {
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

      {!loading && filteredIncidents.length === 0 ? (
        <AppCard>
          <AppText color={theme.colors.mutedText}>
            No hay incidencias para mostrar.
          </AppText>
        </AppCard>
      ) : null}

      {filteredIncidents.map((incident) => {
        const statusColor = getStatusColor(theme, incident.status);

        return (
          <Pressable
            key={incident.id}
            onPress={() =>
              router.push({
                pathname: '/incident-detail',
                params: { id: String(incident.id) },
              })
            }
            style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
          >
            <AppCard>
              <View style={styles.headerRow}>
                <View style={styles.headerText}>
                  <AppText variant="subtitle" bold>
                    Incidencia #{incident.id}
                  </AppText>
                  <AppText color={theme.colors.mutedText}>
                    {getIncidentTypeLabel(incident.type)}
                  </AppText>
                </View>

                <View
                  style={[
                    styles.statusPill,
                    {
                      borderColor: statusColor,
                      backgroundColor: theme.colors.surface,
                    },
                  ]}
                >
                  <AppText variant="caption" bold color={statusColor}>
                    {getIncidentStatusLabel(incident.status)}
                  </AppText>
                </View>
              </View>

              {incident.description ? (
                <AppText style={styles.description}>{incident.description}</AppText>
              ) : null}

              <View style={styles.metaBlock}>
                {incident.shipmentId ? (
                  <AppText color={theme.colors.mutedText}>
                    Envío: #{incident.shipmentId}
                  </AppText>
                ) : null}

                {incident.customerOrderId ? (
                  <AppText color={theme.colors.mutedText}>
                    Pedido: #{incident.customerOrderId}
                  </AppText>
                ) : null}

                {incident.itemId ? (
                  <AppText color={theme.colors.mutedText}>
                    Item: #{incident.itemId}
                  </AppText>
                ) : null}

                {incident.expectedAmount !== null ||
                incident.receivedAmount !== null ||
                incident.differenceAmount !== null ? (
                  <AppText color={theme.colors.mutedText}>
                    Esperado {formatMoney(incident.expectedAmount)} · Recibido{' '}
                    {formatMoney(incident.receivedAmount)} · Dif.{' '}
                    {formatMoney(incident.differenceAmount)}
                  </AppText>
                ) : null}

                <AppText variant="caption" color={theme.colors.mutedText}>
                  Creada: {formatDate(incident.createdAt)}
                </AppText>
              </View>
            </AppCard>
          </Pressable>
        );
      })}

    </AppScreen>
  );
}

const styles = StyleSheet.create({
  description: {
    marginTop: 8,
  },
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
  metaBlock: {
    gap: 3,
    marginTop: 10,
  },
  statusPill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  summaryCard: {
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
});
