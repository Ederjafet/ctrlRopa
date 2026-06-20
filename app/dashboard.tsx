import AppBackButton from '@/components/ui/AppBackButton';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppResponsiveGrid from '@/components/ui/AppResponsiveGrid';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import {
  BranchDashboard,
  DashboardAction,
  DashboardMetricDetail,
  DashboardMetricDetailItem,
  getDashboardMetricDetail,
  getUserDashboard,
  UserDashboard,
} from '@/services/dashboardService';
import { useRouter } from 'expo-router';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

function money(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return amount.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
  });
}

function numberValue(value: number | null | undefined) {
  return String(value ?? 0);
}

function MetricTile({
  label,
  value,
  accent,
  onPress,
}: {
  label: string;
  value: string;
  accent?: string;
  onPress?: () => void;
}) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.metricTile,
        {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.dashboardMetricBackground,
          borderRadius: theme.radius.md,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <AppText variant="caption" color={theme.colors.dashboardMetricText}>
        {label}
      </AppText>
      <AppText bold style={[styles.metricValue, { color: accent || theme.colors.dashboardAccent }]}>
        {value}
      </AppText>
      <AppText variant="caption" color={theme.colors.mutedText}>
        Ver detalle
      </AppText>
    </Pressable>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <AppCard>
      <AppText variant="subtitle" bold>
        {title}
      </AppText>
      {children}
    </AppCard>
  );
}

function BranchSelector({
  branches,
  selectedBranchId,
  onSelect,
}: {
  branches: BranchDashboard[];
  selectedBranchId: number | null;
  onSelect: (branchId: number) => void;
}) {
  const { theme } = useAppTheme();

  if (branches.length <= 1) return null;

  return (
    <View style={styles.branchTabs}>
      {branches.map((branch) => {
        const selected = selectedBranchId === branch.branchId;
        return (
          <Pressable
            key={branch.branchId}
            onPress={() => onSelect(branch.branchId)}
            style={({ pressed }) => [
              styles.branchTab,
              {
                borderColor: selected ? theme.colors.accent : theme.colors.border,
                backgroundColor: selected
                  ? theme.colors.optionPressedBackground
                  : theme.colors.surface,
                borderRadius: theme.radius.md,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <AppText bold={selected}>{branch.branchName}</AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {branch.branchCode}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

function ActionRow({
  action,
  onMetricAction,
}: {
  action: DashboardAction;
  onMetricAction: (metric: string) => void;
}) {
  const router = useRouter();
  const { theme } = useAppTheme();
  const color =
    action.severity === 'DANGER'
      ? theme.colors.danger
      : action.severity === 'WARNING'
        ? theme.colors.warning
        : theme.colors.accent;

  const isMetricAction = action.route?.startsWith('metric:');
  const handlePress = () => {
    if (isMetricAction) {
      onMetricAction(action.route.replace('metric:', ''));
      return;
    }

    router.push(action.route as any);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.actionRow,
        {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.inputBackground,
          borderRadius: theme.radius.md,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={styles.actionText}>
        <AppText bold>{action.label}</AppText>
        <AppText variant="caption" color={theme.colors.mutedText}>
          {isMetricAction ? 'Ver pendientes' : 'Abrir detalle operativo'}
        </AppText>
      </View>
      <AppText bold color={color} style={styles.actionCount}>
        {action.count}
      </AppText>
    </Pressable>
  );
}

function DetailRow({
  item,
  onOpen,
}: {
  item: DashboardMetricDetailItem;
  onOpen: (route: string) => void;
}) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      onPress={() => item.route ? onOpen(item.route) : undefined}
      disabled={!item.route}
      style={({ pressed }) => [
        styles.detailRow,
        {
          borderBottomColor: theme.colors.border,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <View style={styles.detailText}>
        <AppText bold>{item.label}</AppText>
        {item.subtitle ? (
          <AppText variant="caption" color={theme.colors.mutedText}>
            {item.subtitle}
          </AppText>
        ) : null}
        {item.status ? (
          <AppText variant="caption" color={theme.colors.mutedText}>
            Estado: {item.status}
          </AppText>
        ) : null}
      </View>
      {item.amount !== null && item.amount !== undefined ? (
        <AppText bold color={theme.colors.dashboardAccent}>
          {money(item.amount)}
        </AppText>
      ) : null}
    </Pressable>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [dashboard, setDashboard] = useState<UserDashboard | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [detail, setDetail] = useState<DashboardMetricDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await getUserDashboard();
      setDashboard(data);
      setSelectedBranchId((current) => current ?? data.branches[0]?.branchId ?? null);
    } catch (error: any) {
      Alert.alert('No se pudo cargar el dashboard', error?.message ?? 'Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedBranch = useMemo(
    () =>
      dashboard?.branches.find((branch) => branch.branchId === selectedBranchId) ??
      dashboard?.branches[0] ??
      null,
    [dashboard, selectedBranchId]
  );

  const openMetricDetail = async (metric: string) => {
    if (!selectedBranch) return;

    setDetailLoading(true);
    setDetail({ metric, title: 'Cargando detalle', items: [] });

    try {
      setDetail(await getDashboardMetricDetail(selectedBranch.branchId, metric));
    } catch (error: any) {
      Alert.alert('No se pudo cargar el detalle', error?.message ?? 'Intenta nuevamente.');
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const openActionMetric = async (metric: string) => {
    if (!selectedBranch) return;

    setDetailLoading(true);
    setDetail({ metric, title: 'Cargando detalle', items: [] });

    try {
      const metricDetail = await getDashboardMetricDetail(selectedBranch.branchId, metric);
      if (metricDetail.items.length === 1 && metricDetail.items[0].route) {
        setDetail(null);
        router.push(metricDetail.items[0].route as any);
        return;
      }

      setDetail(metricDetail);
    } catch (error: any) {
      Alert.alert('No se pudo cargar el detalle', error?.message ?? 'Intenta nuevamente.');
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const openDetailRoute = (route: string) => {
    setDetail(null);
    router.push(route as any);
  };

  if (isLoading) {
    return (
      <AppScreen scroll={false}>
        <ActivityIndicator />
      </AppScreen>
    );
  }

  if (!dashboard || !selectedBranch) {
    return (
      <AppScreen>
        <AppBackButton fallbackRoute="/" preferHistory={false} />
        <AppText variant="title" bold>
          Mi dashboard
        </AppText>
        <AppCard>
          <AppText color={theme.colors.mutedText}>
            No hay sucursales activas asignadas a tu usuario.
          </AppText>
        </AppCard>
        <AppButton title="Menu principal" variant="menu" onPress={() => router.replace('/' as any)} />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <AppBackButton fallbackRoute="/" preferHistory={false} />

      <View style={styles.titleRow}>
        <View style={styles.titleText}>
          <AppText variant="title" bold>
            Mi dashboard
          </AppText>
          <AppText color={theme.colors.mutedText}>
            {selectedBranch.branchName} · {dashboard.date}
          </AppText>
        </View>
      </View>

      <BranchSelector
        branches={dashboard.branches}
        selectedBranchId={selectedBranch.branchId}
        onSelect={setSelectedBranchId}
      />

      <Section title="Ventas y caja">
        <AppResponsiveGrid tabletColumns={2} desktopColumns={3}>
          <MetricTile label="Ventas de hoy" value={money(selectedBranch.money.todaySales)} onPress={() => openMetricDetail('TODAY_SALES')} />
          <MetricTile label="Apartados de hoy" value={money(selectedBranch.money.todayReservations)} onPress={() => openMetricDetail('TODAY_RESERVATIONS')} />
          <MetricTile label="Cobrado hoy" value={money(selectedBranch.money.todayPayments)} onPress={() => openMetricDetail('TODAY_PAYMENTS')} />
          <MetricTile label="Efectivo hoy" value={money(selectedBranch.money.todayCash)} onPress={() => openMetricDetail('TODAY_CASH')} />
          <MetricTile
            label="Pendiente por cobrar"
            value={money(selectedBranch.money.pendingCollections)}
            accent={theme.colors.danger}
            onPress={() => openMetricDetail('PENDING_COLLECTIONS')}
          />
          <MetricTile
            label="Reembolsos pendientes"
            value={money(selectedBranch.money.pendingRefunds)}
            accent={theme.colors.danger}
            onPress={() => openMetricDetail('PENDING_REFUNDS')}
          />
        </AppResponsiveGrid>
      </Section>

      <Section title="Actividad del dia">
        <AppResponsiveGrid tabletColumns={2} desktopColumns={3}>
          <MetricTile label="Ventas" value={numberValue(selectedBranch.operations.todaySalesCount)} onPress={() => openMetricDetail('TODAY_SALES_COUNT')} />
          <MetricTile label="Apartados" value={numberValue(selectedBranch.operations.todayReservationsCount)} onPress={() => openMetricDetail('TODAY_RESERVATIONS_COUNT')} />
          <MetricTile label="Pagos" value={numberValue(selectedBranch.operations.todayPaymentsCount)} onPress={() => openMetricDetail('TODAY_PAYMENTS')} />
          <MetricTile label="Clientes con movimiento hoy" value={numberValue(selectedBranch.operations.activeCustomersToday)} onPress={() => openMetricDetail('ACTIVE_CUSTOMERS_TODAY')} />
          <MetricTile label="Lives activas" value={numberValue(selectedBranch.operations.activeLives)} onPress={() => openMetricDetail('ACTIVE_LIVES')} />
        </AppResponsiveGrid>
      </Section>

      <Section title="Inventario">
        <AppResponsiveGrid tabletColumns={2} desktopColumns={3}>
          <MetricTile label="Disponibles" value={numberValue(selectedBranch.inventory.availableItems)} onPress={() => openMetricDetail('AVAILABLE_ITEMS')} />
          <MetricTile label="Reservadas" value={numberValue(selectedBranch.inventory.reservedItems)} onPress={() => openMetricDetail('RESERVED_ITEMS')} />
          <MetricTile label="Vendidas hoy" value={numberValue(selectedBranch.inventory.soldItemsToday)} onPress={() => openMetricDetail('SOLD_ITEMS_TODAY')} />
          <MetricTile label="Lotes por recibir" value={numberValue(selectedBranch.inventory.announcedBatches)} onPress={() => openMetricDetail('ANNOUNCED_BATCHES')} />
          <MetricTile label="Lotes por conciliar" value={numberValue(selectedBranch.inventory.receivedBatches)} onPress={() => openMetricDetail('RECEIVED_BATCHES')} />
        </AppResponsiveGrid>
      </Section>

      <Section title="Pendientes">
        {selectedBranch.actions.length === 0 ? (
          <AppText color={theme.colors.mutedText}>Sin pendientes criticos por ahora.</AppText>
        ) : (
          <View style={styles.actionsList}>
            {selectedBranch.actions.map((action) => (
              <ActionRow
                key={`${action.route}-${action.label}`}
                action={action}
                onMetricAction={openActionMetric}
              />
            ))}
          </View>
        )}
      </Section>

      <AppBottomModal
        visible={detail !== null}
        title={detail?.title || 'Detalle'}
        onClose={() => setDetail(null)}
        cancelTitle="Cerrar"
      >
        {detailLoading ? (
          <ActivityIndicator />
        ) : detail && detail.items.length > 0 ? (
          <View style={styles.detailList}>
            {detail.items.map((item, index) => (
              <DetailRow
                key={`${item.label}-${index}`}
                item={item}
                onOpen={openDetailRoute}
              />
            ))}
          </View>
        ) : (
          <AppText color={theme.colors.mutedText}>
            No hay movimientos para este recuadro.
          </AppText>
        )}
      </AppBottomModal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  actionCount: {
    minWidth: 38,
    textAlign: 'right',
  },
  actionRow: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 10,
    padding: 12,
  },
  actionText: {
    flex: 1,
    minWidth: 0,
  },
  actionsList: {
    marginTop: 4,
  },
  branchTab: {
    borderWidth: 1,
    marginBottom: 10,
    padding: 12,
    width: '100%',
  },
  branchTabs: {
    marginBottom: 4,
  },
  detailList: {
    maxHeight: 520,
  },
  detailRow: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  detailText: {
    flex: 1,
    minWidth: 0,
  },
  metricTile: {
    borderWidth: 1,
    marginBottom: 12,
    minHeight: 76,
    padding: 12,
  },
  metricValue: {
    fontSize: 18,
    marginTop: 8,
  },
  titleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleText: {
    flex: 1,
    minWidth: 0,
  },
});
