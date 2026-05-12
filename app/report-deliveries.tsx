
import AppBackButton from '@/components/ui/AppBackButton';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppDateField from '@/components/ui/AppDateField';
import AppInput from '@/components/ui/AppInput';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { Branch, getActiveBranches } from '@/services/branchAdminService';
import {
  DailyDeliveryLine,
  DailyDeliveriesReport,
  getDailyDeliveriesReport,
} from '@/services/reportService';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useEffect, useMemo, useState } from 'react';
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

export default function ReportDeliveriesScreen() {
  const { theme } = useAppTheme();

  const [session, setSession] = useState<UserSession | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [date, setDate] = useState(todayIsoDate());
  const [search, setSearch] = useState('');
  const [report, setReport] = useState<DailyDeliveriesReport | null>(null);
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
      const data = await getDailyDeliveriesReport({
        branchId: selectedBranchId,
        date: date.trim(),
      });

      setReport(data);
    } catch (err: any) {
      Alert.alert('Entregas diarias', err?.message || 'No se pudo cargar el reporte.');
    } finally {
      setLoading(false);
    }
  };

  const filteredLines = useMemo(() => {
    const term = normalize(search);
    const lines = report?.screenLines ?? [];

    if (!term) return lines;

    return lines.filter((line: DailyDeliveryLine) =>
      [
        line.shipmentFolio,
        line.shipmentStatus,
        line.packageFolio,
        line.packageStatus,
        line.customerName,
        line.customerPhone,
        line.addressText,
        line.paymentStatus,
        line.deliveryType,
        line.observation,
      ]
        .map(normalize)
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
        Entregas diarias
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
        </View>

        <AppButton
          title={loading ? 'Consultando...' : 'Consultar'}
          onPress={loadReport}
          loading={loading}
          disabled={loading}
        />
      </AppCard>

      {report ? (
        <>
          <AppCard>
            <AppText variant="subtitle" bold>
              {report.branchName || report.branchCode || 'Sucursal'} · {report.date}
            </AppText>
            <AppText color={theme.colors.mutedText}>
              Seguimiento de paquetes en ruta, entregados, devueltos y pendientes.
            </AppText>
          </AppCard>

          <View style={sharedStyles.summaryGrid}>
            <SummaryValue label="Paquetes" value={report.summary?.totalPackages ?? 0} />
            <SummaryValue label="En ruta" value={report.summary?.inRoutePackages ?? 0} color={theme.colors.accent} />
            <SummaryValue label="Entregados" value={report.summary?.deliveredPackages ?? 0} color={theme.colors.success} />
            <SummaryValue label="Devueltos" value={report.summary?.returnedPackages ?? 0} color={theme.colors.warning} />
            <SummaryValue label="Total" value={formatMoney(report.summary?.totalAmount)} />
            <SummaryValue label="Pagado" value={formatMoney(report.summary?.totalPaid)} color={theme.colors.success} />
            <SummaryValue label="Pendiente" value={formatMoney(report.summary?.totalPending)} color={Number(report.summary?.totalPending ?? 0) > 0 ? theme.colors.warning : theme.colors.text} />
          </View>

          <AppInput
            label="Buscar en entregas"
            placeholder="Envío, paquete, cliente, dirección, estado..."
            value={search}
            onChangeText={setSearch}
          />

          <AppCard>
            <AppText variant="subtitle" bold>
              Entregas ({filteredLines.length})
            </AppText>

            {filteredLines.length === 0 ? (
              <AppText color={theme.colors.mutedText}>Sin entregas.</AppText>
            ) : (
              filteredLines.map((line, index) => (
                <View
                  key={`${line.shipmentId}-${line.packageId}-${index}`}
                  style={[sharedStyles.lineRow, { borderColor: theme.colors.border }]}
                >
                  <View style={sharedStyles.headerRow}>
                    <View style={sharedStyles.headerText}>
                      <AppText bold>
                        {line.packageFolio || `Paquete #${line.packageId || index + 1}`}
                      </AppText>
                      <AppText color={theme.colors.mutedText}>
                        Envío {line.shipmentFolio || `#${line.shipmentId || '—'}`} · {line.deliveryType || 'Entrega'}
                      </AppText>
                    </View>
                    <AppText bold>{formatMoney(line.total)}</AppText>
                  </View>

                  <View style={sharedStyles.meta}>
                    <AppText>
                      {line.customerName || 'Sin cliente'} {line.customerPhone ? `· ${line.customerPhone}` : ''}
                    </AppText>
                    {line.addressText ? (
                      <AppText color={theme.colors.mutedText}>{line.addressText}</AppText>
                    ) : null}
                    <AppText color={theme.colors.mutedText}>
                      Pagado {formatMoney(line.paid)} · Pendiente {formatMoney(line.pending)} · Pago {line.paymentStatus || '—'}
                    </AppText>
                    <AppText variant="caption" color={theme.colors.mutedText}>
                      Envío: {line.shipmentStatus || '—'} · Paquete: {line.packageStatus || '—'}
                    </AppText>
                    <AppText variant="caption" color={theme.colors.mutedText}>
                      Creado: {formatDateTime(line.createdAt)} · Enviado: {formatDateTime(line.sentAt)} · Entregado: {formatDateTime(line.deliveredAt)}
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
            Selecciona fecha y sucursal para consultar el reporte.
          </AppText>
        </AppCard>
      )}
    </AppScreen>
  );
}
