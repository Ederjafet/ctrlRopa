import AppBackButton from '@/components/ui/AppBackButton';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { hasPermission } from '@/services/accessControl';
import {
  getSecurityAuditEvents,
  SecurityAuditEventFilters,
  SecurityAuditEventLine,
} from '@/services/securityAuditService';
import { getSession } from '@/services/sessionStorage';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, TextInput, View } from 'react-native';

const DEFAULT_FILTERS: SecurityAuditEventFilters = {
  eventType: '',
  email: '',
  statusCode: '',
  path: '',
  dateFrom: '',
  dateTo: '',
  page: 0,
  size: 20,
};

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

export default function SystemSecurityAuditScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SecurityAuditEventFilters>(DEFAULT_FILTERS);
  const [events, setEvents] = useState<SecurityAuditEventLine[]>([]);
  const [total, setTotal] = useState(0);

  const page = filters.page ?? 0;
  const size = filters.size ?? 20;
  const hasPreviousPage = page > 0;
  const hasNextPage = useMemo(() => (page + 1) * size < total, [page, size, total]);

  const loadEvents = useCallback(async (nextFilters: SecurityAuditEventFilters) => {
    setLoading(true);
    try {
      const data = await getSecurityAuditEvents(nextFilters);
      setEvents(data.events ?? []);
      setTotal(data.total ?? 0);
      setFilters({
        ...nextFilters,
        page: data.page ?? nextFilters.page ?? 0,
        size: data.size ?? nextFilters.size ?? 20,
      });
    } catch (err: any) {
      Alert.alert(
        'Auditoria de seguridad',
        err?.message || 'No se pudo cargar la auditoria.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getSession().then((session) => {
      if (!hasPermission(session, 'VIEW_SECURITY_AUDIT')) {
        router.replace('/access-denied');
        return;
      }
      setAuthorized(true);
      void loadEvents(DEFAULT_FILTERS);
    });
  }, [loadEvents, router]);

  const updateFilter = (key: keyof SecurityAuditEventFilters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value, page: 0 }));
  };

  const search = () => {
    void loadEvents({ ...filters, page: 0 });
  };

  const clear = () => {
    void loadEvents(DEFAULT_FILTERS);
  };

  const goToPage = (nextPage: number) => {
    void loadEvents({ ...filters, page: nextPage });
  };

  if (!authorized) {
    return (
      <AppScreen>
        <AppBackButton fallbackRoute="/system" />
        <ActivityIndicator />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <AppBackButton fallbackRoute="/system" />

      <AppText variant="title" bold>
        Auditoria de seguridad
      </AppText>

      <AppCard>
        <AppText variant="subtitle" bold>
          Eventos bloqueados
        </AppText>
        <AppText color={theme.colors.mutedText}>
          Consulta eventos de acceso denegado, tokens revocados y bloqueos de seguridad.
        </AppText>
      </AppCard>

      <AppCard>
        <AppText variant="subtitle" bold>
          Filtros
        </AppText>
        <View style={styles.filterGrid}>
          <AuditInput
            label="Tipo de evento"
            value={filters.eventType}
            placeholder="TOKEN_REVOKED"
            onChangeText={(value) => updateFilter('eventType', value)}
          />
          <AuditInput
            label="Email"
            value={filters.email}
            placeholder="qa.soporte@local.test"
            onChangeText={(value) => updateFilter('email', value)}
          />
          <AuditInput
            label="Status"
            value={filters.statusCode}
            placeholder="401"
            keyboardType="number-pad"
            onChangeText={(value) => updateFilter('statusCode', value)}
          />
          <AuditInput
            label="Ruta"
            value={filters.path}
            placeholder="/api/me"
            onChangeText={(value) => updateFilter('path', value)}
          />
          <AuditInput
            label="Desde"
            value={filters.dateFrom}
            placeholder="2026-05-27T00:00:00"
            onChangeText={(value) => updateFilter('dateFrom', value)}
          />
          <AuditInput
            label="Hasta"
            value={filters.dateTo}
            placeholder="2026-05-27T23:59:59"
            onChangeText={(value) => updateFilter('dateTo', value)}
          />
        </View>

        <View style={styles.actions}>
          <AppButton
            title={loading ? 'Buscando...' : 'Buscar'}
            onPress={search}
            loading={loading}
            disabled={loading}
            style={styles.actionButton}
          />
          <AppButton
            title="Limpiar"
            variant="secondary"
            onPress={clear}
            disabled={loading}
            style={styles.actionButton}
          />
        </View>
      </AppCard>

      <AppCard>
        <View style={styles.listHeader}>
          <AppText variant="subtitle" bold>
            Resultados
          </AppText>
          <AppText color={theme.colors.mutedText}>
            {total} eventos
          </AppText>
        </View>

        {loading ? (
          <ActivityIndicator />
        ) : events.length === 0 ? (
          <AppText color={theme.colors.mutedText}>No hay eventos con esos filtros.</AppText>
        ) : (
          events.map((event) => <AuditEventRow key={event.id} event={event} />)
        )}

        <View style={styles.pagination}>
          <AppButton
            title="Anterior"
            variant="secondary"
            onPress={() => goToPage(page - 1)}
            disabled={!hasPreviousPage || loading}
            style={styles.pageButton}
          />
          <AppText color={theme.colors.mutedText}>
            Pagina {page + 1}
          </AppText>
          <AppButton
            title="Siguiente"
            variant="secondary"
            onPress={() => goToPage(page + 1)}
            disabled={!hasNextPage || loading}
            style={styles.pageButton}
          />
        </View>
      </AppCard>
    </AppScreen>
  );
}

function AuditInput({
  label,
  value,
  placeholder,
  keyboardType,
  onChangeText,
}: {
  label: string;
  value?: string;
  placeholder: string;
  keyboardType?: 'default' | 'number-pad';
  onChangeText: (value: string) => void;
}) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.inputGroup}>
      <AppText variant="caption" bold>
        {label}
      </AppText>
      <TextInput
        value={value}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.mutedText}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        autoCapitalize="none"
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
            color: theme.colors.text,
          },
        ]}
      />
    </View>
  );
}

function AuditEventRow({ event }: { event: SecurityAuditEventLine }) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.eventRow, { borderBottomColor: theme.colors.border }]}>
      <View style={styles.eventHeader}>
        <View style={styles.eventTitle}>
          <AppText bold>{event.eventType}</AppText>
          <AppText variant="caption" color={theme.colors.mutedText}>
            {formatDate(event.occurredAt)}
          </AppText>
        </View>
        <AppText bold color={event.statusCode === 401 ? theme.colors.danger : theme.colors.accent}>
          {event.statusCode ?? '-'}
        </AppText>
      </View>

      <View style={styles.detailGrid}>
        <AuditDetail label="Email" value={event.email} />
        <AuditDetail label="Company" value={event.companyId} />
        <AuditDetail label="Branch" value={event.branchId} />
        <AuditDetail label="Metodo" value={event.httpMethod} />
        <AuditDetail label="Ruta" value={event.path} wide />
        <AuditDetail label="Motivo" value={event.reason} wide />
      </View>
    </View>
  );
}

function AuditDetail({
  label,
  value,
  wide,
}: {
  label: string;
  value?: string | number | null;
  wide?: boolean;
}) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.detail, wide ? styles.detailWide : null]}>
      <AppText variant="caption" color={theme.colors.mutedText}>
        {label}
      </AppText>
      <AppText>{value ?? '-'}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    minWidth: 140,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  detail: {
    flex: 1,
    minWidth: 140,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  detailWide: {
    minWidth: 260,
  },
  eventHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  eventRow: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  eventTitle: {
    flex: 1,
    minWidth: 0,
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputGroup: {
    flex: 1,
    gap: 6,
    minWidth: 220,
  },
  listHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pageButton: {
    minWidth: 120,
  },
  pagination: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    marginTop: 14,
  },
});
