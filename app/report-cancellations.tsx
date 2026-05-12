import AppBackButton from '@/components/ui/AppBackButton';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppDateField from '@/components/ui/AppDateField';
import AppInput from '@/components/ui/AppInput';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { Branch, getActiveBranches } from '@/services/branchAdminService';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { DailyCancellationLine, DailyCancellationsReport, getDailyCancellationsReport } from '@/services/reportService';

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
  if (!value) return '—';
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

export default function ReportCancellationsScreen() {
  const { theme } = useAppTheme();

  const [session, setSession] = useState<UserSession | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [date, setDate] = useState(todayIsoDate());
  const [search, setSearch] = useState('');
  const [report, setReport] = useState<DailyCancellationsReport | null>(null);
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
      const data = await getDailyCancellationsReport({
        branchId: selectedBranchId,
        date: date.trim(),
      });

      setReport(data);
    } catch (err: any) {
      Alert.alert('Cancelaciones diarias', err?.message || 'No se pudo cargar el reporte.');
    } finally {
      setLoading(false);
    }
  };

  const filteredLines = useMemo(() => {
    const term = normalize(search);
    const lines = report?.screenLines ?? [];

    if (!term) return lines;

    return lines.filter((line: any) =>
      ['sourceType', 'sourceId', 'folio', 'customerName', 'itemCode', 'status', 'cancelledByUserName', 'cancelReason', 'refundStatus']
        .map((key) => normalize(line[key]))
        .join(' ')
        .includes(term)
    );
  }, [report, search]);

  if (initialLoading) {
    return (
      <AppScreen>
        <ActivityIndicator />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <AppBackButton fallbackRoute="/reports" />

      <AppText variant="title" bold>
        Cancelaciones diarias
      </AppText>

      <AppCard>
        <AppText variant="subtitle" bold>
          Filtros
        </AppText>

        <View style={sharedStyles.filters}>
          <AppDateField
            label="Fecha"
            value={date}
            onChange={setDate}
          />

          <AppText variant="subtitle" bold>
            Sucursal
          </AppText>

          <BranchSelector
            branches={branches}
            selectedBranchId={selectedBranchId}
            onSelect={setSelectedBranchId}
          />

          <AppButton
            title={loading ? 'Consultando...' : 'Consultar'}
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
              Resumen · {report.branchName || report.branchCode || 'Sucursal'} · {report.date}
            </AppText>

            <View style={sharedStyles.summaryGrid}>
              <SummaryValue label="Total cancelado" value={formatMoney(report.summary?.totalCancelled)} color={theme.colors.danger} />
              <SummaryValue label="Cancelaciones" value={report.summary?.totalCancellations ?? 0} />
              <SummaryValue label="Ventas canceladas" value={report.summary?.cancelledSales ?? 0} />
              <SummaryValue label="Reservas canceladas" value={report.summary?.cancelledReservations ?? 0} />
              <SummaryValue label="Refunds procesados" value={report.summary?.processedRefunds ?? 0} />
              <SummaryValue label="Monto refunds" value={formatMoney(report.summary?.processedRefundAmount)} />
            </View>
          </AppCard>

          <AppInput
            label="Buscar en líneas"
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
                No hay líneas para mostrar.
              </AppText>
            ) : (
              filteredLines.map((line: any, index: number) => (
                <View
                  key={`${index}-${line.sourceId ?? index}`}
                  style={[
                    sharedStyles.lineRow,
                    { borderBottomColor: theme.colors.border },
                  ]}
                >
                  <View style={sharedStyles.headerRow}>
                    <View style={sharedStyles.headerText}>
                      <AppText bold>{line.folio || `${line.sourceType || 'Origen'} #${line.sourceId || '—'}`}</AppText>
                      <AppText color={theme.colors.mutedText}>
                        {line.customerName || 'Cliente sin nombre'} · {line.itemCode || 'Sin item'}
                      </AppText>
                    </View>
                    <AppText bold color={theme.colors.danger}>
                      {formatMoney(line.total)}
                    </AppText>
                  </View>
                  <View style={sharedStyles.meta}>
                    <AppText color={theme.colors.mutedText}>Estado: {line.status || '—'}</AppText>
                    <AppText color={theme.colors.mutedText}>Canceló: {line.cancelledByUserName || line.cancelledByUserId || '—'}</AppText>
                    <AppText color={theme.colors.mutedText}>Refund: {line.refundStatus || '—'} · {formatMoney(line.refundAmount)}</AppText>
                    <AppText variant="caption" color={theme.colors.mutedText}>
                      {formatDateTime(line.cancelledAt)}
                    </AppText>
                    {line.cancelReason ? <AppText>Motivo: {line.cancelReason}</AppText> : null}
                  </View>
                </View>
              ))
            )}
          </AppCard>
        </>
      ) : (
        <AppCard>
          <AppText color={theme.colors.mutedText}>
            Selecciona fecha y sucursal, luego consulta el reporte.
          </AppText>
        </AppCard>
      )}
    </AppScreen>
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
