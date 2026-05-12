import AppBackButton from '@/components/ui/AppBackButton';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppDateField from '@/components/ui/AppDateField';
import AppInput from '@/components/ui/AppInput';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { Branch, getActiveBranches, getBranches } from '@/services/branchAdminService';
import {
  getMovementHistoryReport,
  MovementHistoryLine,
  MovementHistoryReport,
  MovementHistoryRequest,
} from '@/services/reportService';
import { getSaleById } from '@/services/saleService';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

type MovementType = NonNullable<MovementHistoryRequest['movementType']>;

const movementTypes: { label: string; value: MovementType }[] = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Financieros', value: 'FINANCIAL' },
  { label: 'No financieros', value: 'NON_FINANCIAL' },
];

const eventLabels: Record<string, string> = {
  PAYMENT_RECEIVED: 'Pago recibido',
  PAYMENT_VOIDED: 'Pago anulado',
  SALE_CREATED: 'Venta creada',
  BALANCE_MOVEMENT: 'Saldo de cliente',
  REFUND_CREATED: 'Refund creado',
  CASH_EXPENSE: 'Gasto de caja',
  CUSTOMER_CREATED: 'Alta de cliente',
  RESERVATION_CREATED: 'Apartado creado',
  ITEM_CREATED: 'Alta de prenda',
  PACKAGE_CREATED: 'Paquete creado',
  SHIPMENT_CREATED: 'Envio creado',
  TRANSFER_CREATED: 'Transferencia creada',
  INCIDENT_CREATED: 'Incidencia creada',
  BATCH_CREATED: 'Lote creado',
  SYSTEM_BRANDS_CREATE: 'Marca creada',
  SYSTEM_BRANDS_UPDATE: 'Marca actualizada',
  SYSTEM_BRANDS_CHANGE: 'Cambio en marca',
  SYSTEM_SIZES_CREATE: 'Talla creada',
  SYSTEM_SIZES_UPDATE: 'Talla actualizada',
  SYSTEM_PRODUCT_TYPES_CREATE: 'Tipo de prenda creado',
  SYSTEM_PRODUCT_TYPES_UPDATE: 'Tipo de prenda actualizado',
  SYSTEM_PAYMENT_METHODS_CREATE: 'Metodo de pago creado',
  SYSTEM_PAYMENT_METHODS_UPDATE: 'Metodo de pago actualizado',
  SYSTEM_SALES_CHANNELS_CREATE: 'Canal de venta creado',
  SYSTEM_SALES_CHANNELS_UPDATE: 'Canal de venta actualizado',
  SYSTEM_STORAGE_LOCATIONS_CREATE: 'Ubicacion creada',
  SYSTEM_STORAGE_LOCATIONS_UPDATE: 'Ubicacion actualizada',
  SYSTEM_BOXES_CREATE: 'Caja creada',
  SYSTEM_BOXES_UPDATE: 'Caja actualizada',
  SYSTEM_BATCHES_CREATE: 'Lote creado',
  SYSTEM_BATCHES_UPDATE: 'Lote actualizado',
  SYSTEM_BATCHES_CHANGE: 'Cambio en lote',
  SYSTEM_USERS_CREATE: 'Usuario creado',
  SYSTEM_USERS_UPDATE: 'Usuario actualizado',
  SYSTEM_BRANCHES_CREATE: 'Sucursal creada',
  SYSTEM_BRANCHES_UPDATE: 'Sucursal actualizada',
  SYSTEM_APPEARANCE_UPDATE: 'Apariencia actualizada',
};

function todayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatMoney(value?: number | null) {
  if (value === null || value === undefined) return '';
  return `$${Number(value).toFixed(2)}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

function normalize(value?: string | number | null) {
  return String(value ?? '').toLowerCase().trim();
}

function isSystemEvent(line: MovementHistoryLine) {
  return String(line.eventType ?? '').startsWith('SYSTEM_');
}

function parseBranchIdFromPath(value?: string | null) {
  const match = String(value ?? '').match(/\/api\/branches\/(\d+)/);
  return match ? Number(match[1]) : null;
}

function getSystemArea(line: MovementHistoryLine) {
  const eventType = String(line.eventType ?? '');
  const detail = String(line.detail ?? line.reference ?? '');

  if (eventType.includes('_BRANDS_') || detail.includes('/api/brands')) return 'Catalogo de marcas';
  if (eventType.includes('_SIZES_') || detail.includes('/api/sizes')) return 'Catalogo de tallas';
  if (eventType.includes('_PRODUCT_TYPES_') || detail.includes('/api/product-types')) return 'Catalogo de tipos de prenda';
  if (eventType.includes('_PAYMENT_METHODS_') || detail.includes('/api/payment-methods')) return 'Catalogo de metodos de pago';
  if (eventType.includes('_SALES_CHANNELS_') || detail.includes('/api/sales-channels')) return 'Canales de venta';
  if (eventType.includes('_STORAGE_LOCATIONS_') || detail.includes('/api/storage-locations')) return 'Ubicaciones';
  if (eventType.includes('_BOXES_') || detail.includes('/api/boxes')) return 'Cajas';
  if (eventType.includes('_USERS_') || detail.includes('/api/users')) return 'Usuarios';
  if (eventType.includes('_BRANCHES_') || detail.includes('/api/branches')) return 'Sucursales';
  if (eventType.includes('_APPEARANCE_') || detail.includes('/api/appearance')) return 'Apariencia';
  if (eventType.includes('_BATCHES_') || detail.includes('/api/batches')) return 'Lotes';

  return 'Configuración del sistema';
}

function getLineDetail(line: MovementHistoryLine) {
  if (!isSystemEvent(line)) return line.detail || '-';

  const label = eventLabels[String(line.eventType ?? '')] ?? 'Movimiento de sistema';
  return `${label} en ${getSystemArea(line)}.`;
}

function minutesBetween(left?: string | null, right?: string | null) {
  if (!left || !right) return Number.POSITIVE_INFINITY;

  const leftTime = new Date(left).getTime();
  const rightTime = new Date(right).getTime();

  if (Number.isNaN(leftTime) || Number.isNaN(rightTime)) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.abs(leftTime - rightTime) / 60000;
}

function findCreatedBranch(line: MovementHistoryLine, branches: Branch[]) {
  if (line.eventType !== 'SYSTEM_BRANCHES_CREATE') return null;

  const candidates = branches
    .map((branch) => ({
      branch,
      distance: minutesBetween(line.eventAt, branch.createdAt),
    }))
    .filter((candidate) => candidate.distance <= 3)
    .sort((left, right) => left.distance - right.distance);

  return candidates[0]?.branch ?? null;
}

function findBranchForSystemEvent(line: MovementHistoryLine, branches: Branch[]) {
  const branchId = parseBranchIdFromPath(line.detail) ?? parseBranchIdFromPath(line.reference);

  if (branchId) {
    return branches.find((branch) => branch.id === branchId) ?? null;
  }

  return findCreatedBranch(line, branches);
}

function getLineReference(line: MovementHistoryLine, branches: Branch[]) {
  const affectedBranch = findBranchForSystemEvent(line, branches);
  if (affectedBranch) return `Sucursal ${affectedBranch.name}`;

  if (line.customerName) return line.customerName;
  if (line.itemCode) return `Prenda ${line.itemCode}`;
  if (isSystemEvent(line)) return getSystemArea(line);
  if (line.branchName) return `Sucursal ${line.branchName}`;
  return 'Sin referencia';
}

function getOperationTarget(line: MovementHistoryLine, branches: Branch[]) {
  const sourceId = line.sourceId ? String(line.sourceId) : '';
  const affectedBranch = findBranchForSystemEvent(line, branches);

  if (affectedBranch) {
    return {
      label: 'Ver sucursal',
      route: { pathname: '/branches-form', params: { id: String(affectedBranch.id) } },
    };
  }

  switch (line.eventType) {
    case 'CUSTOMER_CREATED':
      return sourceId ? { label: 'Ver cliente', route: `/customers/${sourceId}` } : null;
    case 'SALE_CREATED':
      return sourceId ? { label: 'Ver venta', route: null } : null;
    case 'ITEM_CREATED':
      return sourceId
        ? { label: 'Ver prenda', route: { pathname: '/items/[id]', params: { id: sourceId } } }
        : null;
    case 'RESERVATION_CREATED':
      return sourceId
        ? { label: 'Ver apartado', route: { pathname: '/reservation-detail', params: { id: sourceId } } }
        : null;
    case 'PACKAGE_CREATED':
      return sourceId
        ? { label: 'Ver paquete', route: { pathname: '/customer-package-detail', params: { id: sourceId } } }
        : null;
    case 'SHIPMENT_CREATED':
      return sourceId
        ? { label: 'Ver envio', route: { pathname: '/shipment-detail', params: { id: sourceId } } }
        : null;
    case 'TRANSFER_CREATED':
      return sourceId
        ? { label: 'Ver transferencia', route: { pathname: '/transfer-detail', params: { id: sourceId } } }
        : null;
    case 'INCIDENT_CREATED':
      return sourceId
        ? { label: 'Ver incidencia', route: { pathname: '/incident-detail', params: { id: sourceId } } }
        : null;
    case 'BATCH_CREATED':
      return sourceId
        ? { label: 'Ver lote', route: { pathname: '/batch-detail', params: { id: sourceId } } }
        : null;
    case 'REFUND_CREATED':
      return sourceId
        ? { label: 'Ver devolucion', route: { pathname: '/refund-detail', params: { id: sourceId } } }
        : null;
    default:
      return null;
  }
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
    <View style={styles.branchList}>
      {branches.map((branch) => {
        const selected = selectedBranchId === branch.id;

        return (
          <Pressable
            key={branch.id}
            onPress={() => onSelect(branch.id)}
            style={({ pressed }) => [
              styles.branchPill,
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

function TypeSelector({
  value,
  onChange,
}: {
  value: MovementType;
  onChange: (type: MovementType) => void;
}) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.typeRow}>
      {movementTypes.map((type) => {
        const selected = value === type.value;

        return (
          <Pressable
            key={type.value}
            onPress={() => onChange(type.value)}
            style={({ pressed }) => [
              styles.typePill,
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
            <AppText bold={selected}>{type.label}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

function SummaryBox({ label, value }: { label: string; value: string | number }) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.summaryBox, { borderColor: theme.colors.border }]}>
      <AppText variant="caption" color={theme.colors.mutedText}>
        {label}
      </AppText>
      <AppText variant="subtitle" bold>
        {value}
      </AppText>
    </View>
  );
}

function MovementRow({
  line,
  branches,
}: {
  line: MovementHistoryLine;
  branches: Branch[];
}) {
  const { theme } = useAppTheme();
  const { isPhone } = useResponsiveLayout();
  const router = useRouter();
  const isFinancial = line.category === 'FINANCIAL';
  const label = eventLabels[String(line.eventType ?? '')] ?? line.eventType ?? 'Movimiento';
  const systemEvent = isSystemEvent(line);
  const target = getOperationTarget(line, branches);

  const openTarget = async () => {
    if (!target) return;

    if (line.eventType === 'SALE_CREATED' && line.sourceId) {
      try {
        const sale = await getSaleById(line.sourceId);

        if (sale.customerOrderId) {
          router.push({
            pathname: '/customer-order-detail',
            params: { id: String(sale.customerOrderId), returnTo: '/movement-history' },
          } as any);
          return;
        }

        if (sale.itemId) {
          router.push({
            pathname: '/items/[id]',
            params: { id: String(sale.itemId), returnTo: '/movement-history' },
          } as any);
          return;
        }

        if (sale.customerId) {
          router.push(`/customers/${sale.customerId}` as any);
          return;
        }
      } catch (err: any) {
        Alert.alert('Historico', err?.message || 'No se pudo abrir la venta.');
      }

      return;
    }

    if (target.route) {
      router.push(target.route as any);
    }
  };

  return (
    <Pressable
      disabled={!target}
      onPress={openTarget}
      style={({ pressed }) => [
        styles.lineRow,
        {
          borderBottomColor: theme.colors.border,
          opacity: pressed ? 0.78 : 1,
        },
      ]}
    >
      <View style={[styles.headerRow, isPhone ? styles.mobileHeaderRow : null]}>
        <View style={styles.headerText}>
          <AppText bold>{label}</AppText>
          <AppText color={theme.colors.mutedText}>
            {getLineReference(line, branches)}
          </AppText>
        </View>
        <View style={[styles.amountBox, isPhone ? styles.mobileAmountBox : null]}>
          {line.amount !== null && line.amount !== undefined ? (
            <AppText bold color={Number(line.amount) < 0 ? theme.colors.danger : theme.colors.accent}>
              {formatMoney(line.amount)}
            </AppText>
          ) : (
            <AppText variant="caption" color={theme.colors.mutedText}>
              {isFinancial ? '$0.00' : 'Operacion'}
            </AppText>
          )}
          <AppText variant="caption" color={theme.colors.mutedText}>
            #{line.sourceId ?? '-'}
          </AppText>
        </View>
      </View>

      <View style={styles.meta}>
        <AppText color={theme.colors.mutedText}>Detalle: {getLineDetail(line)}</AppText>
        {line.itemCode ? (
          <AppText color={theme.colors.mutedText}>Prenda: {line.itemCode}</AppText>
        ) : null}
        {systemEvent && line.branchName ? (
          <AppText color={theme.colors.mutedText}>
            Sucursal del usuario: {line.branchName}
          </AppText>
        ) : null}
        <AppText color={theme.colors.mutedText}>Estado: {line.status || '-'}</AppText>
        <AppText color={theme.colors.mutedText}>Usuario: {line.userName || '-'}</AppText>
        {line.reference && !systemEvent ? (
          <AppText color={theme.colors.mutedText}>Referencia: {line.reference}</AppText>
        ) : null}
        <AppText variant="caption" color={theme.colors.mutedText}>
          {formatDateTime(line.eventAt)}
        </AppText>
        {target ? (
          <AppText bold color={theme.colors.accent} style={styles.openLink}>
            {target.label}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function MovementHistoryScreen() {
  const { theme } = useAppTheme();

  const [session, setSession] = useState<UserSession | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [allBranches, setAllBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState(todayIsoDate());
  const [endDate, setEndDate] = useState(todayIsoDate());
  const [movementType, setMovementType] = useState<MovementType>('ALL');
  const [search, setSearch] = useState('');
  const [report, setReport] = useState<MovementHistoryReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    setInitialLoading(true);
    setLoadError('');

    try {
      const currentSession = await getSession();

      if (!currentSession) return;

      setSession(currentSession);
      setSelectedBranchId(currentSession.branchId);

      const sessionBranch: Branch = {
        id: currentSession.branchId,
        code: '',
        name: currentSession.branchName || 'Sucursal actual',
        status: 'ACTIVE',
        addressLine1: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      };

      try {
        const branchData = await getActiveBranches();
        setBranches(branchData.length > 0 ? branchData : [sessionBranch]);
      } catch (err: any) {
        setBranches([sessionBranch]);
        setLoadError(err?.message || 'No se pudieron cargar sucursales. Se usara la sucursal de la sesión.');
      }

      try {
        const allBranchData = await getBranches();
        setAllBranches(allBranchData.length > 0 ? allBranchData : [sessionBranch]);
      } catch {
        setAllBranches([sessionBranch]);
      }
    } catch (err: any) {
      const message = err?.message || 'No se pudo inicializar.';
      setLoadError(message);
      Alert.alert('Historico', message);
    } finally {
      setInitialLoading(false);
    }
  };

  const loadReport = async () => {
    if (!selectedBranchId) {
      Alert.alert('Historico', 'Selecciona una sucursal.');
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate.trim()) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate.trim())) {
      Alert.alert('Historico', 'Captura fechas en formato YYYY-MM-DD.');
      return;
    }

    setLoading(true);

    try {
      const data = await getMovementHistoryReport({
        branchId: selectedBranchId,
        startDate: startDate.trim(),
        endDate: endDate.trim(),
        movementType,
      });

      setReport(data);
    } catch (err: any) {
      setLoadError(err?.message || 'No se pudo cargar el historico.');
      Alert.alert('Historico de movimientos', err?.message || 'No se pudo cargar el historico.');
    } finally {
      setLoading(false);
    }
  };

  const filteredLines = useMemo(() => {
    const term = normalize(search);
    const lines = report?.screenLines ?? [];

    if (!term) return lines;

    return lines.filter((line) =>
      [
        line.eventType,
        eventLabels[String(line.eventType ?? '')],
        line.customerName,
        line.itemCode,
        line.status,
        line.reference,
        line.userName,
        line.detail,
        line.sourceId,
      ]
        .map((value) => normalize(value))
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
      <AppBackButton fallbackRoute="/" />

      <AppText variant="title" bold>
        Historico de movimientos
      </AppText>

      <AppCard>
        <AppText variant="subtitle" bold>
          Filtros
        </AppText>

        <View style={styles.filters}>
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <AppDateField
                label="Desde"
                value={startDate}
                onChange={setStartDate}
              />
            </View>
            <View style={styles.dateField}>
              <AppDateField
                label="Hasta"
                value={endDate}
                onChange={setEndDate}
              />
            </View>
          </View>

          <AppText variant="subtitle" bold>
            Tipo
          </AppText>
          <TypeSelector value={movementType} onChange={setMovementType} />

          <AppText variant="subtitle" bold>
            Sucursal
          </AppText>
          {loadError ? (
            <AppText color={theme.colors.danger}>{loadError}</AppText>
          ) : null}
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
              Resumen {report.branchName ? `- ${report.branchName}` : ''}
            </AppText>
            <View style={styles.summaryGrid}>
              <SummaryBox label="Movimientos" value={report.summary?.totalMovements ?? 0} />
              <SummaryBox label="Financieros" value={report.summary?.financialMovements ?? 0} />
              <SummaryBox label="No financieros" value={report.summary?.nonFinancialMovements ?? 0} />
              <SummaryBox label="Total financiero" value={formatMoney(report.summary?.financialTotal) || '$0.00'} />
            </View>
          </AppCard>

          <AppInput
            label="Buscar"
            placeholder="Cliente, prenda, estado, usuario..."
            value={search}
            onChangeText={setSearch}
          />

          <AppCard>
            <AppText variant="subtitle" bold>
              Detalle ({filteredLines.length})
            </AppText>

            {filteredLines.length === 0 ? (
              <AppText color={theme.colors.mutedText}>
                No hay movimientos para mostrar.
              </AppText>
            ) : (
              filteredLines.map((line, index) => (
                <MovementRow
                  key={`${line.eventType}-${line.sourceId}-${index}`}
                  line={line}
                  branches={allBranches}
                />
              ))
            )}
          </AppCard>
        </>
      ) : (
        <AppCard>
          <AppText color={theme.colors.mutedText}>
            Selecciona filtros y consulta el historico de la sucursal.
          </AppText>
        </AppCard>
      )}

      {session ? (
        <AppText variant="caption" color={theme.colors.mutedText} style={styles.footerNote}>
          Usuario: {session.name || 'Sin nombre'}
        </AppText>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  amountBox: {
    alignItems: 'flex-end',
    minWidth: 88,
  },
  branchList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  branchPill: {
    borderWidth: 1,
    flexGrow: 1,
    minWidth: 140,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateField: {
    flex: 1,
    minWidth: 145,
  },
  dateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filters: {
    gap: 10,
  },
  footerNote: {
    marginTop: 8,
    textAlign: 'center',
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  mobileAmountBox: {
    alignItems: 'flex-start',
    minWidth: '100%',
  },
  mobileHeaderRow: {
    flexDirection: 'column',
  },
  openLink: {
    marginTop: 6,
  },
  summaryBox: {
    borderWidth: 1,
    flexGrow: 1,
    minWidth: 135,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  typePill: {
    borderWidth: 1,
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
