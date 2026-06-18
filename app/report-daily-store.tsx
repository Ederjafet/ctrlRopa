
import AppShellPage from '@/components/layout/AppShellPage';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppDateField from '@/components/ui/AppDateField';
import AppInput from '@/components/ui/AppInput';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { Branch, getActiveBranches } from '@/services/branchAdminService';
import {
  DailyStoreLine,
  DailyStoreReport,
  getDailyStoreReport,
} from '@/services/reportService';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

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
  if (!value) return 'â€”';
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

export default function ReportDailyStoreScreen() {
  const { theme } = useAppTheme();
  const { t } = useTranslation('common');

  const [session, setSession] = useState<UserSession | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [date, setDate] = useState(todayIsoDate());
  const [search, setSearch] = useState('');
  const [report, setReport] = useState<DailyStoreReport | null>(null);
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
      const data = await getDailyStoreReport({
        branchId: selectedBranchId,
        date: date.trim(),
      });

      setReport(data);
    } catch (err: any) {
      Alert.alert('Reporte diario', err?.message || 'No se pudo cargar el reporte.');
    } finally {
      setLoading(false);
    }
  };

  const filteredLines = useMemo(() => {
    const term = normalize(search);
    const lines = report?.screenLines ?? [];

    if (!term) return lines;

    return lines.filter((line: DailyStoreLine) =>
      [
        line.sourceType,
        line.sourceId,
        line.folio,
        line.customerName,
        line.channelCode,
        line.operationType,
        line.paymentStatus,
        line.status,
        line.attendedBy,
        line.observation,
      ]
        .map(normalize)
        .join(' ')
        .includes(term)
    );
  }, [report, search]);

  if (initialLoading) {
    return (
      <AppShellPage
        title={t('reports.dailyStoreTitle')}
        subtitle={t('reports.dailyStoreDescription')}
        activeRoute="report-daily-store"
        session={session}
      >
        <ActivityIndicator />
      </AppShellPage>
    );
  }

  return (
    <AppShellPage
      title={t('reports.dailyStoreTitle')}
      subtitle={t('reports.dailyStoreDescription')}
      activeRoute="report-daily-store"
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
        </View>

        <AppButton
          title={loading ? t('reports.querying') : t('reports.query')}
          onPress={loadReport}
          loading={loading}
          disabled={loading}
        />
      </AppCard>

      {report ? (
        <>
          <AppCard>
            <AppText variant="subtitle" bold>
              {report.branchName || report.branchCode || 'Sucursal'} Â· {report.date}
            </AppText>
            <AppText color={theme.colors.mutedText}>
              Resumen de operaciÃ³n, pagos y caja.
            </AppText>
          </AppCard>

          <View style={sharedStyles.summaryGrid}>
            <SummaryValue
              label="Recibido total"
              value={formatMoney(report.paymentSummary?.totalReceived)}
              color={theme.colors.success}
            />
            <SummaryValue label="Efectivo" value={formatMoney(report.paymentSummary?.cash)} />
            <SummaryValue label="Transferencia" value={formatMoney(report.paymentSummary?.transfer)} />
            <SummaryValue label="Tarjeta" value={formatMoney(report.paymentSummary?.card)} />
            <SummaryValue
              label="Saldo aplicado"
              value={formatMoney(report.paymentSummary?.balanceApplied)}
            />
            <SummaryValue
              label="Saldo generado"
              value={formatMoney(report.paymentSummary?.balanceGenerated)}
            />
          </View>

          <View style={sharedStyles.summaryGrid}>
            <SummaryValue
              label="Ventas activas"
              value={`${report.operationSummary?.activeSalesCount ?? 0} Â· ${formatMoney(
                report.operationSummary?.activeSalesTotal
              )}`}
            />
            <SummaryValue
              label="Apartados activos"
              value={`${report.operationSummary?.activeReservationsCount ?? 0} Â· ${formatMoney(
                report.operationSummary?.activeReservationsTotal
              )}`}
            />
            <SummaryValue
              label="Cancelaciones"
              value={`${(report.operationSummary?.cancelledSalesCount ?? 0) +
                (report.operationSummary?.cancelledReservationsCount ?? 0)} Â· ${formatMoney(
                Number(report.operationSummary?.cancelledSalesTotal ?? 0) +
                  Number(report.operationSummary?.cancelledReservationsTotal ?? 0)
              )}`}
              color={theme.colors.danger}
            />
            <SummaryValue
              label="Refunds procesados"
              value={`${report.operationSummary?.refundsCount ?? 0} Â· ${formatMoney(
                report.operationSummary?.processedRefundsTotal
              )}`}
            />
          </View>

          <View style={sharedStyles.summaryGrid}>
            <SummaryValue
              label="Efectivo esperado"
              value={formatMoney(report.cashSummary?.expectedCash)}
            />
            <SummaryValue label="Gastos" value={formatMoney(report.cashSummary?.expenses)} />
            <SummaryValue
              label="Efectivo entregado"
              value={formatMoney(report.cashSummary?.deliveredCash)}
            />
            <SummaryValue
              label="Diferencia caja"
              value={formatMoney(report.cashSummary?.difference)}
              color={Number(report.cashSummary?.difference ?? 0) === 0 ? theme.colors.text : theme.colors.danger}
            />
          </View>

          <AppInput
            label="Buscar en lÃ­neas"
            placeholder="Folio, cliente, canal, estado..."
            value={search}
            onChangeText={setSearch}
          />

          <AppCard>
            <AppText variant="subtitle" bold>
              Movimientos ({filteredLines.length})
            </AppText>

            {filteredLines.length === 0 ? (
              <AppText color={theme.colors.mutedText}>Sin movimientos.</AppText>
            ) : (
              filteredLines.map((line, index) => (
                <View
                  key={`${line.sourceType}-${line.sourceId}-${index}`}
                  style={[sharedStyles.lineRow, { borderColor: theme.colors.border }]}
                >
                  <View style={sharedStyles.headerRow}>
                    <View style={sharedStyles.headerText}>
                      <AppText bold>
                        {line.folio || `${line.sourceType || 'Movimiento'} #${line.sourceId || index + 1}`}
                      </AppText>
                      <AppText color={theme.colors.mutedText}>
                        {line.customerName || 'Sin cliente'} Â· {line.operationType || line.channelCode || 'OperaciÃ³n'}
                      </AppText>
                    </View>
                    <AppText bold>{formatMoney(line.total)}</AppText>
                  </View>

                  <View style={sharedStyles.meta}>
                    <AppText color={theme.colors.mutedText}>
                      Pagado {formatMoney(line.paid)} Â· Pendiente {formatMoney(line.pending)}
                    </AppText>
                    <AppText color={theme.colors.mutedText}>
                      Efectivo {formatMoney(line.cash)} Â· Transf. {formatMoney(line.transfer)} Â· Tarjeta {formatMoney(line.card)}
                    </AppText>
                    <AppText variant="caption" color={theme.colors.mutedText}>
                      Estado: {line.status || 'â€”'} Â· Pago: {line.paymentStatus || 'â€”'} Â· AtendiÃ³: {line.attendedBy || 'â€”'}
                    </AppText>
                    <AppText variant="caption" color={theme.colors.mutedText}>
                      Fecha: {formatDateTime(line.createdAt)}
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
