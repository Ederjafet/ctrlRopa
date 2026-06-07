import AppShellPage from '@/components/layout/AppShellPage';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { hasPermission } from '@/services/accessControl';
import {
  exportSecurityAuditAlertsCsv,
  exportSecurityAuditEventsCsv,
  getSecurityAuditAlerts,
  getSecurityAuditEvents,
  getSecurityAuditSummary,
  SecurityAuditAlertLine,
  SecurityAuditAlertsResponse,
  SecurityAuditCountLine,
  SecurityAuditCriticalEventLine,
  SecurityAuditEventFilters,
  SecurityAuditEventLine,
  SecurityAuditSummaryResponse,
} from '@/services/securityAuditService';
import { getSession } from '@/services/sessionStorage';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('common');
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertsError, setAlertsError] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<SecurityAuditAlertsResponse | null>(null);
  const [filters, setFilters] = useState<SecurityAuditEventFilters>(DEFAULT_FILTERS);
  const [events, setEvents] = useState<SecurityAuditEventLine[]>([]);
  const [summary, setSummary] = useState<SecurityAuditSummaryResponse | null>(null);
  const [total, setTotal] = useState(0);
  const [exporting, setExporting] = useState(false);

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
        t('securityAudit.title'),
        err?.message || t('securityAudit.loadError')
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadSummary = useCallback(async (nextFilters: SecurityAuditEventFilters) => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const data = await getSecurityAuditSummary({
        eventType: nextFilters.eventType,
        email: nextFilters.email,
        dateFrom: nextFilters.dateFrom,
        dateTo: nextFilters.dateTo,
      });
      setSummary(data);
    } catch (err: any) {
      setSummary(null);
      setSummaryError(err?.message || t('securityAudit.summaryError'));
    } finally {
      setSummaryLoading(false);
    }
  }, [t]);

  const loadAlerts = useCallback(async (nextFilters: SecurityAuditEventFilters) => {
    setAlertsLoading(true);
    setAlertsError(null);
    try {
      const data = await getSecurityAuditAlerts({
        email: nextFilters.email,
        windowMinutes: 60,
        threshold: 5,
      });
      setAlerts(data);
    } catch (err: any) {
      setAlerts(null);
      setAlertsError(err?.message || t('securityAudit.alertsError'));
    } finally {
      setAlertsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    getSession().then((session) => {
      if (!hasPermission(session, 'VIEW_SECURITY_AUDIT')) {
        router.replace('/access-denied');
        return;
      }
      setAuthorized(true);
      void loadAlerts(DEFAULT_FILTERS);
      void loadSummary(DEFAULT_FILTERS);
      void loadEvents(DEFAULT_FILTERS);
    });
  }, [loadAlerts, loadEvents, loadSummary, router]);

  const updateFilter = (key: keyof SecurityAuditEventFilters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value, page: 0 }));
  };

  const search = () => {
    const nextFilters = { ...filters, page: 0 };
    void loadAlerts(nextFilters);
    void loadSummary(nextFilters);
    void loadEvents(nextFilters);
  };

  const clear = () => {
    void loadAlerts(DEFAULT_FILTERS);
    void loadSummary(DEFAULT_FILTERS);
    void loadEvents(DEFAULT_FILTERS);
  };

  const goToPage = (nextPage: number) => {
    void loadEvents({ ...filters, page: nextPage });
  };

  const downloadCsv = (filename: string, csv: string) => {
    if (typeof document === 'undefined') {
      Alert.alert(t('securityAudit.title'), t('securityAudit.exportBrowserOnly'));
      return;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportEvents = async () => {
    setExporting(true);
    try {
      const csv = await exportSecurityAuditEventsCsv(filters);
      downloadCsv('security-audit-events.csv', csv);
    } catch (err: any) {
      Alert.alert(t('securityAudit.title'), err?.message || t('securityAudit.exportEventsError'));
    } finally {
      setExporting(false);
    }
  };

  const exportAlerts = async () => {
    setExporting(true);
    try {
      const csv = await exportSecurityAuditAlertsCsv({
        email: filters.email,
        windowMinutes: 60,
        threshold: 5,
      });
      downloadCsv('security-audit-alerts.csv', csv);
    } catch (err: any) {
      Alert.alert(t('securityAudit.title'), err?.message || t('securityAudit.exportAlertsError'));
    } finally {
      setExporting(false);
    }
  };

  if (!authorized) {
    return (
      <AppShellPage
        title={t('securityAudit.title')}
        subtitle={t('securityAudit.help')}
        activeRoute="system-security-audit"
      >
        <ActivityIndicator />
      </AppShellPage>
    );
  }

  return (
    <AppShellPage
      title={t('securityAudit.title')}
      subtitle={t('securityAudit.help')}
      activeRoute="system-security-audit"
    >
      <AppCard>
        <AppText variant="subtitle" bold>
          {t('securityAudit.blockedEvents')}
        </AppText>
        <AppText color={theme.colors.mutedText}>
          {t('securityAudit.help')}
        </AppText>
      </AppCard>

      <SecurityAuditSummaryDashboard
        summary={summary}
        loading={summaryLoading}
        error={summaryError}
      />

      <SecurityAuditAlertsPanel
        alerts={alerts}
        loading={alertsLoading}
        error={alertsError}
      />

      <AppCard>
        <AppText variant="subtitle" bold>
          {t('common.filters')}
        </AppText>
        <View style={styles.filterGrid}>
          <AuditInput
            label={t('securityAudit.eventType')}
            value={filters.eventType}
            placeholder="TOKEN_REVOKED"
            onChangeText={(value) => updateFilter('eventType', value)}
          />
          <AuditInput
            label={t('securityAudit.email')}
            value={filters.email}
            placeholder="qa.soporte@local.test"
            onChangeText={(value) => updateFilter('email', value)}
          />
          <AuditInput
            label={t('securityAudit.status')}
            value={filters.statusCode}
            placeholder="401"
            keyboardType="number-pad"
            onChangeText={(value) => updateFilter('statusCode', value)}
          />
          <AuditInput
            label={t('securityAudit.path')}
            value={filters.path}
            placeholder="/api/me"
            onChangeText={(value) => updateFilter('path', value)}
          />
          <AuditInput
            label={t('securityAudit.from')}
            value={filters.dateFrom}
            placeholder="2026-05-27T00:00:00"
            onChangeText={(value) => updateFilter('dateFrom', value)}
          />
          <AuditInput
            label={t('securityAudit.to')}
            value={filters.dateTo}
            placeholder="2026-05-27T23:59:59"
            onChangeText={(value) => updateFilter('dateTo', value)}
          />
        </View>

        <View style={styles.actions}>
          <AppButton
            title={loading ? t('securityAudit.searching') : t('common.search')}
            onPress={search}
            loading={loading}
            disabled={loading}
            style={styles.actionButton}
          />
          <AppButton
            title={t('securityAudit.clear')}
            variant="secondary"
            onPress={clear}
            disabled={loading}
            style={styles.actionButton}
          />
          <AppButton
            title={t('securityAudit.exportEvents')}
            variant="secondary"
            onPress={exportEvents}
            loading={exporting}
            disabled={exporting}
            style={styles.exportButton}
          />
          <AppButton
            title={t('securityAudit.exportAlerts')}
            variant="secondary"
            onPress={exportAlerts}
            loading={exporting}
            disabled={exporting}
            style={styles.exportButton}
          />
        </View>
      </AppCard>

      <AppCard>
        <View style={styles.listHeader}>
          <AppText variant="subtitle" bold>
            {t('securityAudit.results')}
          </AppText>
          <AppText color={theme.colors.mutedText}>
            {t('securityAudit.eventsCount', { count: total })}
          </AppText>
        </View>

        {loading ? (
          <ActivityIndicator />
        ) : events.length === 0 ? (
          <AppText color={theme.colors.mutedText}>{t('securityAudit.noEvents')}</AppText>
        ) : (
          events.map((event) => <AuditEventRow key={event.id} event={event} />)
        )}

        <View style={styles.pagination}>
          <AppButton
            title={t('securityAudit.previous')}
            variant="secondary"
            onPress={() => goToPage(page - 1)}
            disabled={!hasPreviousPage || loading}
            style={styles.pageButton}
          />
          <AppText color={theme.colors.mutedText}>
            {t('securityAudit.page', { page: page + 1 })}
          </AppText>
          <AppButton
            title={t('securityAudit.next')}
            variant="secondary"
            onPress={() => goToPage(page + 1)}
            disabled={!hasNextPage || loading}
            style={styles.pageButton}
          />
        </View>
      </AppCard>
    </AppShellPage>
  );
}

function SecurityAuditAlertsPanel({
  alerts,
  loading,
  error,
}: {
  alerts: SecurityAuditAlertsResponse | null;
  loading: boolean;
  error: string | null;
}) {
  const { theme } = useAppTheme();
  const { t } = useTranslation('common');
  const lines = alerts?.alerts ?? [];

  return (
    <AppCard>
      <View style={styles.listHeader}>
        <View>
          <AppText variant="subtitle" bold>
            {t('securityAudit.alertsRecent')}
          </AppText>
          <AppText color={theme.colors.mutedText}>
            {t('securityAudit.alertsHelp')}
          </AppText>
        </View>
        {loading ? <ActivityIndicator /> : null}
      </View>

      {error ? (
        <View style={[styles.summaryWarning, { borderColor: theme.colors.warning }]}>
          <AppText color={theme.colors.warning}>{error}</AppText>
        </View>
      ) : null}

      {!loading && !error && lines.length === 0 ? (
        <AppText color={theme.colors.mutedText}>{t('securityAudit.noCriticalAlerts')}</AppText>
      ) : (
        <View style={styles.alertGrid}>
          {lines.map((alert, index) => (
            <SecurityAuditAlertCard key={`${alert.alertType}-${index}`} alert={alert} />
          ))}
        </View>
      )}
    </AppCard>
  );
}

function SecurityAuditAlertCard({ alert }: { alert: SecurityAuditAlertLine }) {
  const { theme } = useAppTheme();
  const { t } = useTranslation('common');
  const color = alert.severity === 'CRITICAL' || alert.severity === 'HIGH'
    ? theme.colors.danger
    : alert.severity === 'MEDIUM'
      ? theme.colors.warning
      : theme.colors.accent;

  return (
    <View style={[styles.alertCard, { borderColor: color }]}>
      <View style={styles.alertHeader}>
        <AppText bold color={color}>{alert.severity}</AppText>
        <AppText bold>{alert.count}</AppText>
      </View>
      <AppText bold>{alert.alertType}</AppText>
      <AppText color={theme.colors.mutedText}>{alert.description}</AppText>
      {alert.email ? <AuditDetail label={t('securityAudit.email')} value={alert.email} /> : null}
      {alert.path ? <AuditDetail label={t('securityAudit.path')} value={alert.path} /> : null}
      <View style={styles.detailGrid}>
        <AuditDetail label={t('securityAudit.company')} value={alert.companyId} />
        <AuditDetail label={t('securityAudit.branch')} value={alert.branchId} />
      </View>
      <AppText variant="caption" color={theme.colors.mutedText}>
        {formatDate(alert.firstSeen)} - {formatDate(alert.lastSeen)}
      </AppText>
    </View>
  );
}

function SecurityAuditSummaryDashboard({
  summary,
  loading,
  error,
}: {
  summary: SecurityAuditSummaryResponse | null;
  loading: boolean;
  error: string | null;
}) {
  const { theme } = useAppTheme();
  const { t } = useTranslation('common');

  return (
    <AppCard>
      <View style={styles.listHeader}>
        <View>
          <AppText variant="subtitle" bold>
            {t('securityAudit.summaryTitle')}
          </AppText>
          <AppText color={theme.colors.mutedText}>
            {t('securityAudit.summaryHelp')}
          </AppText>
        </View>
        {loading ? <ActivityIndicator /> : null}
      </View>

      {error ? (
        <View style={[styles.summaryWarning, { borderColor: theme.colors.warning }]}>
          <AppText color={theme.colors.warning}>{error}</AppText>
        </View>
      ) : null}

      <View style={styles.metricGrid}>
        <AuditMetricCard label={t('securityAudit.metricTotalEvents')} value={summary?.totalEvents ?? 0} />
        <AuditMetricCard label={t('securityAudit.metricTotal401')} value={summary?.total401 ?? 0} tone="danger" />
        <AuditMetricCard label={t('securityAudit.metricTotal403')} value={summary?.total403 ?? 0} tone="warning" />
      </View>

      <View style={styles.summaryGrid}>
        <AuditSummarySection title={t('securityAudit.byEventType')} items={summary?.byEventType ?? []} />
        <AuditSummarySection title={t('securityAudit.byStatusCode')} items={summary?.byStatusCode ?? []} />
        <AuditSummarySection title={t('securityAudit.topUsers')} items={summary?.topEmails ?? []} />
        <AuditSummarySection title={t('securityAudit.topEndpoints')} items={summary?.topPaths ?? []} />
      </View>

      <View style={styles.criticalSection}>
        <AppText bold>{t('securityAudit.recentCriticalEvents')}</AppText>
        {summary?.recentCriticalEvents?.length ? (
          summary.recentCriticalEvents.map((event) => (
            <CriticalEventRow key={event.id} event={event} />
          ))
        ) : (
          <AppText color={theme.colors.mutedText}>
            {t('securityAudit.noRecentCriticalEvents')}
          </AppText>
        )}
      </View>
    </AppCard>
  );
}

function AuditMetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'danger' | 'warning';
}) {
  const { theme } = useAppTheme();
  const color = tone === 'danger'
    ? theme.colors.danger
    : tone === 'warning'
      ? theme.colors.warning
      : theme.colors.text;

  return (
    <View style={[styles.metricCard, { borderColor: theme.colors.border }]}>
      <AppText variant="caption" color={theme.colors.mutedText}>
        {label}
      </AppText>
      <AppText variant="title" bold color={color}>
        {value}
      </AppText>
    </View>
  );
}

function AuditSummarySection({
  title,
  items,
}: {
  title: string;
  items: SecurityAuditCountLine[];
}) {
  const { theme } = useAppTheme();
  const { t } = useTranslation('common');

  return (
    <View style={[styles.summarySection, { borderColor: theme.colors.border }]}>
      <AppText bold>{title}</AppText>
      {items.length === 0 ? (
        <AppText color={theme.colors.mutedText}>{t('securityAudit.noData')}</AppText>
      ) : (
        items.map((item) => (
          <View key={`${title}-${item.key}`} style={styles.summaryLine}>
            <AppText style={styles.summaryKey}>{item.key || '-'}</AppText>
            <AppText bold>{item.count}</AppText>
          </View>
        ))
      )}
    </View>
  );
}

function CriticalEventRow({ event }: { event: SecurityAuditCriticalEventLine }) {
  const { theme } = useAppTheme();
  const { t } = useTranslation('common');

  return (
    <View style={[styles.criticalRow, { borderBottomColor: theme.colors.border }]}>
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
      <AppText color={theme.colors.mutedText}>
        {event.email || t('securityAudit.noEmail')} - {event.httpMethod || '-'} {event.path || '-'}
      </AppText>
      {event.reason ? <AppText>{event.reason}</AppText> : null}
    </View>
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
  const { t } = useTranslation('common');

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
        <AuditDetail label={t('securityAudit.email')} value={event.email} />
        <AuditDetail label={t('securityAudit.company')} value={event.companyId} />
        <AuditDetail label={t('securityAudit.branch')} value={event.branchId} />
        <AuditDetail label={t('securityAudit.method')} value={event.httpMethod} />
        <AuditDetail label={t('securityAudit.path')} value={event.path} wide />
        <AuditDetail label={t('securityAudit.reason')} value={event.reason} wide />
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
  alertCard: {
    borderWidth: 1,
    flex: 1,
    gap: 8,
    minWidth: 240,
    padding: 12,
  },
  alertGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  alertHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  criticalRow: {
    borderBottomWidth: 1,
    gap: 4,
    paddingVertical: 10,
  },
  criticalSection: {
    gap: 8,
    marginTop: 14,
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
  exportButton: {
    minWidth: 190,
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
  metricCard: {
    borderWidth: 1,
    flex: 1,
    gap: 4,
    minWidth: 150,
    padding: 12,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 14,
  },
  summaryKey: {
    flex: 1,
    minWidth: 0,
  },
  summaryLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  summarySection: {
    borderWidth: 1,
    flex: 1,
    gap: 8,
    minWidth: 220,
    padding: 12,
  },
  summaryWarning: {
    borderWidth: 1,
    marginTop: 10,
    padding: 10,
  },
});
