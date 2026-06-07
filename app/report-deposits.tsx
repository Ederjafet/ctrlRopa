import AppShellPage from '@/components/layout/AppShellPage';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppDateField from '@/components/ui/AppDateField';
import AppInput from '@/components/ui/AppInput';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { Branch, getActiveBranches } from '@/services/branchAdminService';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { DailyDepositsReport, getDailyDepositsReport } from '@/services/reportService';

function todayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatMoney(value?: number | null) {
  if (value === null || value === undefined) return '$0.00';
  return `$${Number(value).toFixed(2)}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

function normalize(value?: string | number | null) {
  return String(value ?? '').toLowerCase().trim();
}

function SummaryValue({ label, value, color }: { label: string; value: string | number; color?: string }) {
  const { theme } = useAppTheme();

  return (
    <AppCard style={sharedStyles.summaryCard}>
      <AppText variant="caption" color={theme.colors.mutedText}>
        {label}
      </AppText>
      <AppText variant="subtitle" bold color={color}>
        {value}
      </AppText>
    </AppCard>
  );
}

function BranchSelector({
  branches,
  selectedBranchId,
  onSelect,
}: {
  branches: Branch[];
  selectedBranchId: number | null;
  onSelect: (branchId: number) => void;
}) {
  const { theme } = useAppTheme();

  return (
    <View style={sharedStyles.branchList}>
      {branches.map((branch) => {
        const selected = selectedBranchId === branch.id;

        return (
          <Pressable
            key={branch.id}
            onPress={() => onSelect(branch.id)}
            style={({ pressed }) => [
              sharedStyles.branchPill,
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
            <AppText bold={selected}>{branch.name}</AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {branch.code}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function ReportDepositsScreen() {
  const { theme } = useAppTheme();
  const { t } = useTranslation('common');

  const [session, setSession] = useState<UserSession | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [date, setDate] = useState(todayIsoDate());
  const [search, setSearch] = useState('');
  const [report, setReport] = useState<DailyDepositsReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    setInitialLoading(true);

    try {
      const [currentSession, branchData] = await Promise.all([
        getSession(),
        getActiveBranches(),
      ]);

      if (!currentSession) return;

      setSession(currentSession);
      setBranches(branchData);
      setSelectedBranchId(currentSession.branchId);
    } catch (err: any) {
      Alert.alert('Reportes', err?.message || 'No se pudo inicializar el reporte.');
    } finally {
      setInitialLoading(false);
    }
  };

  const loadReport = async () => {
    if (!selectedBranchId) {
      Alert.alert('Reporte', 'Selecciona una sucursal.');
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
      Alert.alert('Reporte', 'Captura la fecha en formato YYYY-MM-DD.');
      return;
    }

    setLoading(true);

    try {
      const data = await getDailyDepositsReport({
        branchId: selectedBranchId,
        date: date.trim(),
      });

      setReport(data);
    } catch (err: any) {
      Alert.alert('Depositos diarios', err?.message || 'No se pudo cargar el reporte.');
    } finally {
      setLoading(false);
    }
  };

  const filteredLines = useMemo(() => {
    const term = normalize(search);
    const lines = report?.screenLines ?? [];

    if (!term) return lines;

    return lines.filter((line: any) =>
      ['paymentId', 'customerName', 'method', 'reference', 'status', 'createdBy', 'observation']
        .map((key) => normalize(line[key]))
        .join(' ')
        .includes(term)
    );
  }, [report, search]);

  if (initialLoading) {
    return (
      <AppShellPage
        title={t('reports.dailyDepositsTitle')}
        subtitle={t('reports.dailyDepositsDescription')}
        activeRoute="report-deposits"
        session={session}
      >
        <ActivityIndicator />
      </AppShellPage>
    );
  }

  return (
    <AppShellPage
      title={t('reports.dailyDepositsTitle')}
      subtitle={t('reports.dailyDepositsDescription')}
      activeRoute="report-deposits"
      session={session}
    >
      <AppCard>
        <AppText variant="subtitle" bold>
          {t('common.filters')}
        </AppText>

        <View style={sharedStyles.filters}>
          <AppDateField
            label={t('common.date')}
            value={date}
            onChange={setDate}
          />

          <AppText variant="subtitle" bold>
            {t('common.branch')}
          </AppText>

          <BranchSelector
            branches={branches}
            selectedBranchId={selectedBranchId}
            onSelect={setSelectedBranchId}
          />

          <AppButton
            title={loading ? t('reports.querying') : t('reports.query')}
            onPress={loadReport}
            loading={loading}
            disabled={loading}
          />
        </View>
      </AppCard>

      {report ? (
        <>
          <AppCard>
            <AppText variant="subtitle" bold>
              Resumen - {report.branchName || report.branchCode || 'Sucursal'} - {report.date}
            </AppText>

            <View style={sharedStyles.summaryGrid}>
              <SummaryValue label="Total depositos" value={formatMoney(report.summary?.totalDeposits)} color={theme.colors.success} />
              <SummaryValue label="Operaciones" value={report.summary?.totalOperations ?? 0} />
              <SummaryValue label="Promedio" value={formatMoney(report.summary?.averageDeposit)} />
            </View>
          </AppCard>

          <AppInput
            label="Buscar en lineas"
            placeholder="Cliente, folio, estado, referencia..."
            value={search}
            onChangeText={setSearch}
          />

          <AppCard>
            <AppText variant="subtitle" bold>
              Detalle ({filteredLines.length})
            </AppText>

            {filteredLines.length === 0 ? (
              <AppText color={theme.colors.mutedText}>
                No hay lineas para mostrar.
              </AppText>
            ) : (
              filteredLines.map((line: any, index: number) => (
                <View
                  key={`${index}-${line.paymentId ?? index}`}
                  style={[
                    sharedStyles.lineRow,
                    { borderBottomColor: theme.colors.border },
                  ]}
                >
                  <View style={sharedStyles.headerRow}>
                    <View style={sharedStyles.headerText}>
                      <AppText bold>{line.customerName || 'Cliente sin nombre'}</AppText>
                      <AppText color={theme.colors.mutedText}>
                        {line.method || 'Metodo'} - {formatMoney(line.amount)}
                      </AppText>
                    </View>
                    <AppText variant="caption" color={theme.colors.mutedText}>
                      #{line.paymentId ?? '-'}
                    </AppText>
                  </View>
                  <View style={sharedStyles.meta}>
                    <AppText color={theme.colors.mutedText}>Referencia: {line.reference || '-'}</AppText>
                    <AppText color={theme.colors.mutedText}>Estado: {line.status || '-'}</AppText>
                    <AppText color={theme.colors.mutedText}>Usuario: {line.createdBy || '-'}</AppText>
                    <AppText variant="caption" color={theme.colors.mutedText}>
                      {formatDateTime(line.createdAt)}
                    </AppText>
                    {line.observation ? <AppText>{line.observation}</AppText> : null}
                  </View>
                </View>
              ))
            )}
          </AppCard>
        </>
      ) : (
        <AppCard>
          <AppText color={theme.colors.mutedText}>
            {t('reports.selectDateBranchHint')}
          </AppText>
        </AppCard>
      )}
    </AppShellPage>
  );
}

const sharedStyles = StyleSheet.create({
  branchList: {
    gap: 8,
  },
  branchPill: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filters: {
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
  lineRow: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  meta: {
    gap: 3,
    marginTop: 8,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryCard: {
    flexGrow: 1,
    minWidth: 145,
  },
});
