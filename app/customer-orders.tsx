import AppShellPage from '@/components/layout/AppShellPage';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppOptionRow from '@/components/ui/AppOptionRow';
import AppText from '@/components/ui/AppText';
import ScreenPermissionHeaderAction from '@/components/ui/ScreenPermissionHeaderAction';
import { useAppTheme } from '@/context/AppThemeContext';
import { canAccessByPermission } from '@/services/accessControl';
import { getCustomerBalance, type BalanceSummary } from '@/services/balanceService';
import { Customer, getCustomerById, getCustomersByBranch } from '@/services/customerService';
import {
  CustomerOrder,
  findOpenCustomerOrder,
  getCustomerOrdersByCustomer,
} from '@/services/customerOrderService';
import {
  CustomerPackageDetail,
  getCustomerPackageDetailsByCustomer,
} from '@/services/customerPackageService';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

type FilterKey = 'all' | 'orders' | 'open' | 'pending' | 'ready' | 'shipped' | 'closed';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'orders', label: 'Pedidos' },
  { key: 'open', label: 'Abiertos' },
  { key: 'pending', label: 'Pendientes de pago' },
  { key: 'ready', label: 'Listos envio' },
  { key: 'shipped', label: 'Enviados' },
  { key: 'closed', label: 'Cerrados' },
];

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function isValidId(value?: string) {
  return Boolean(value && /^\d+$/.test(value));
}

function money(value?: number | null) {
  return `$${Number(value ?? 0).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} MXN`;
}

function formatDate(value?: string) {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('es-MX');
}

function packageStatusLabel(status?: string) {
  if (status === 'OPEN') return 'En preparacion';
  if (status === 'READY') return 'Listo para envio';
  if (status === 'SHIPPED') return 'Enviado';
  if (status === 'DELIVERED') return 'Entregado';
  if (status === 'CANCELLED') return 'Cancelado';
  return status || 'Sin estado';
}

function orderStatusLabel(status?: string) {
  if (status === 'OPEN') return 'Abierto';
  if (status === 'CLOSED') return 'Cerrado';
  if (status === 'CANCELLED') return 'Cancelado';
  return status || 'Sin estado';
}

function salesChannelLabel(code?: string | null) {
  if (code === 'DOOR_SALE') return 'Venta puerta';
  if (code === 'DOOR_RESERVATION') return 'Apartado mostrador';
  if (code === 'MIXED') return 'Mixto';
  return code || 'Sin canal';
}

async function safeLoad<T>(loader: Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader;
  } catch {
    return fallback;
  }
}

export default function CustomerOrdersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ customerId?: string | string[]; returnTo?: string | string[] }>();
  const { theme } = useAppTheme();

  const customerIdParam = firstParam(params.customerId);
  const returnRoute = firstParam(params.returnTo);
  const validCustomerId = customerIdParam ? isValidId(customerIdParam) : true;
  const selectedCustomerId = customerIdParam && validCustomerId ? Number(customerIdParam) : null;
  const customerRoute = selectedCustomerId ? `/customers/${selectedCustomerId}` : '/customers';
  const backRoute = returnRoute || customerRoute;
  const currentRoute = selectedCustomerId
    ? `/customer-orders?customerId=${selectedCustomerId}${returnRoute ? `&returnTo=${encodeURIComponent(returnRoute)}` : ''}`
    : '/customer-orders';

  const [session, setSession] = useState<UserSession | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [packages, setPackages] = useState<CustomerPackageDetail[]>([]);
  const [balance, setBalance] = useState<BalanceSummary | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [notice, setNotice] = useState<{ tone: 'warning' | 'danger'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [customerIdParam])
  );

  const canViewPackages = canAccessByPermission(session, 'CREATE_CLOSE_CUSTOMER_PACKAGE');
  const canViewPayments = canAccessByPermission(session, 'VIEW_PAYMENTS');
  const canManageShipments = canAccessByPermission(session, 'MANAGE_SHIPMENTS');

  async function loadData() {
    try {
      setIsLoading(true);
      setNotice(null);

      const currentSession = await getSession();
      setSession(currentSession);

      if (!currentSession) {
        router.replace('/login' as any);
        return;
      }

      if (!canAccessByPermission(currentSession, 'VIEW_CUSTOMERS')) {
        router.replace('/access-denied' as any);
        return;
      }

      if (customerIdParam && !validCustomerId) return;

      if (selectedCustomerId) {
        const canLoadPackages = canAccessByPermission(currentSession, 'CREATE_CLOSE_CUSTOMER_PACKAGE');
        const canLoadPayments = canAccessByPermission(currentSession, 'VIEW_PAYMENTS');
        const [customerData, orderData, packageData, balanceData] = await Promise.all([
          getCustomerById(selectedCustomerId),
          safeLoad(getCustomerOrdersByCustomer(selectedCustomerId), []),
          canLoadPackages ? safeLoad(getCustomerPackageDetailsByCustomer(selectedCustomerId), []) : Promise.resolve([]),
          canLoadPayments ? safeLoad(getCustomerBalance(selectedCustomerId), null) : Promise.resolve(null),
        ]);

        setCustomer(customerData);
        setOrders(orderData);
        setPackages(packageData);
        setBalance(balanceData);
        setCustomers([]);
        return;
      }

      const data = await getCustomersByBranch(currentSession.branchId);
      setCustomers(data.filter((item) => item.status !== 'INACTIVE'));
      setCustomer(null);
      setOrders([]);
      setPackages([]);
      setBalance(null);
    } catch (error: any) {
      setNotice({ tone: 'danger', message: error.message || 'No se pudo cargar la informacion.' });
    } finally {
      setIsLoading(false);
    }
  }

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((item) => `${item.name || ''} ${item.phone || ''}`.toLowerCase().includes(term));
  }, [customers, search]);

  const openOrder = useMemo(() => findOpenCustomerOrder(orders), [orders]);
  const pendingTotal = useMemo(
    () => packages.reduce((sum, item) => sum + Number(item.pendingAmount ?? 0), 0),
    [packages]
  );
  const packageCounts = useMemo(
    () => ({
      open: packages.filter((item) => item.status === 'OPEN').length,
      ready: packages.filter((item) => item.status === 'READY').length,
      shipped: packages.filter((item) => item.status === 'SHIPPED').length,
      closed: packages.filter((item) => item.status === 'DELIVERED' || item.status === 'CANCELLED').length,
      pending: packages.filter((item) => Number(item.pendingAmount ?? 0) > 0).length,
    }),
    [packages]
  );

  const visiblePackages = useMemo(() => {
    const term = search.trim().toLowerCase();
    return packages.filter((item) => {
      const text = `${item.folio || ''} ${item.customerName || ''} ${item.status || ''} ${item.shippingCarrier || ''} ${item.trackingNumber || ''}`.toLowerCase();
      const matchesSearch = !term || text.includes(term);
      if (!matchesSearch) return false;
      if (filter === 'all') return true;
      if (filter === 'open') return item.status === 'OPEN';
      if (filter === 'pending') return Number(item.pendingAmount ?? 0) > 0;
      if (filter === 'ready') return item.status === 'READY';
      if (filter === 'shipped') return item.status === 'SHIPPED';
      if (filter === 'closed') return item.status === 'DELIVERED' || item.status === 'CANCELLED';
      if (filter === 'orders') return false;
      return true;
    });
  }, [filter, packages, search]);

  const visibleOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      const text = `pedido ${order.id} ${order.status || ''} ${order.salesChannelCode || ''}`.toLowerCase();
      const matchesSearch = !term || text.includes(term);
      if (!matchesSearch) return false;
      if (filter === 'all' || filter === 'orders') return true;
      if (filter === 'open') return order.status === 'OPEN';
      if (filter === 'closed') return order.status === 'CLOSED' || order.status === 'CANCELLED';
      return false;
    });
  }, [filter, orders, search]);

  if (isLoading) {
    return (
      <AppShellPage title="Pedidos" subtitle="Pedidos, paquetes y actividad por cliente" activeRoute="customers" session={session}>
        <ActivityIndicator />
      </AppShellPage>
    );
  }

  if (customerIdParam && !validCustomerId) {
    return (
      <AppShellPage title="Cliente no valido" subtitle="No se pudo abrir actividad" activeRoute="customers" session={session}>
        <AppCard variant="warning">
          <AppText bold>Cliente no valido.</AppText>
          <AppText color={theme.colors.mutedText}>La ruta debe usar un identificador numerico.</AppText>
        </AppCard>
        <AppButton title="Volver a clientes" variant="secondary" onPress={() => router.replace('/customers' as any)} />
      </AppShellPage>
    );
  }

  if (!selectedCustomerId) {
    return (
      <AppShellPage
        title="Pedidos"
        subtitle="Selecciona un cliente para ver su actividad"
        activeRoute="customers"
        session={session}
        rightContent={<ScreenPermissionHeaderAction screenKey="customerOrders" screenTitle="Pedidos del cliente" session={session} />}
        compactHeader
      >
        {notice ? (
          <AppCard variant={notice.tone}>
            <AppText>{notice.message}</AppText>
          </AppCard>
        ) : null}

        <AppCard>
          <AppText variant="subtitle" bold>Selecciona cliente</AppText>
          <AppText color={theme.colors.mutedText}>Los pedidos y paquetes se consultan por cliente.</AppText>
          <AppInput label="Buscar cliente" placeholder="Nombre o telefono" value={search} onChangeText={setSearch} />
        </AppCard>

        <AppCard>
          {filteredCustomers.length === 0 ? (
            <AppText color={theme.colors.mutedText}>No hay clientes que coincidan con la busqueda.</AppText>
          ) : (
            filteredCustomers.map((item) => (
              <AppOptionRow
                key={item.id}
                title={item.name}
                subtitle={item.phone || 'Sin telefono'}
                onPress={() => router.push(`/customer-orders?customerId=${item.id}&returnTo=${encodeURIComponent(`/customers/${item.id}`)}` as any)}
              />
            ))
          )}
        </AppCard>
      </AppShellPage>
    );
  }

  return (
    <AppShellPage
      title="Pedidos del cliente"
      subtitle={customer ? `${customer.name} - ${customer.phone || 'Sin telefono'}` : 'Actividad del cliente'}
      metadata={`Cliente #${selectedCustomerId}`}
      activeRoute="customers"
      session={session}
      rightContent={
        <View style={styles.headerActions}>
          <ScreenPermissionHeaderAction screenKey="customerOrders" screenTitle="Pedidos del cliente" session={session} />
          <AppButton title={returnRoute ? 'Volver al cliente' : 'Volver'} variant="secondary" onPress={() => router.replace(backRoute as any)} />
        </View>
      }
      compactHeader
    >
      {notice ? (
        <AppCard variant={notice.tone}>
          <AppText>{notice.message}</AppText>
        </AppCard>
      ) : null}

      <View style={styles.metricGrid}>
        <Metric label="Paquetes abiertos" value={canViewPackages ? String(packageCounts.open) : 'Sin permiso'} tone="info" />
        <Metric label="Listos para envio" value={canViewPackages ? String(packageCounts.ready) : 'Sin permiso'} tone={packageCounts.ready > 0 ? 'success' : 'default'} />
        <Metric label="Enviados" value={canViewPackages ? String(packageCounts.shipped) : 'Sin permiso'} tone="default" />
        <Metric label="Pendientes pago" value={canViewPackages ? money(pendingTotal) : 'Sin permiso'} tone={pendingTotal > 0 ? 'warning' : 'success'} />
        <Metric label="Saldo a favor" value={canViewPayments ? money(balance?.balance) : 'Sin permiso'} tone={Number(balance?.balance ?? 0) > 0 ? 'success' : 'default'} />
      </View>

      <AppCard>
        <View style={styles.toolbar}>
          <View style={styles.searchBox}>
            <AppInput label="Buscar" placeholder="Paquete, guia, estado o pedido" value={search} onChangeText={setSearch} />
          </View>
          <View style={styles.filters}>
            {FILTERS.map((item) => (
              <AppButton
                key={item.key}
                title={item.label}
                variant={filter === item.key ? 'operation' : 'neutral'}
                onPress={() => setFilter(item.key)}
                style={styles.filterButton}
              />
            ))}
          </View>
        </View>
      </AppCard>

      {!canViewPackages ? (
        <AppCard variant="warning">
          <AppText>No tienes permiso para consultar paquetes. Permiso requerido: CREATE_CLOSE_CUSTOMER_PACKAGE.</AppText>
        </AppCard>
      ) : null}

      <View style={styles.contentGrid}>
        <View style={styles.mainColumn}>
          <AppCard>
            <AppText variant="subtitle" bold>Paquetes</AppText>
            {canViewPackages && visiblePackages.length === 0 ? (
              <AppText color={theme.colors.mutedText}>No hay paquetes con este filtro.</AppText>
            ) : null}
            {canViewPackages
              ? visiblePackages.map((item) => {
                  const latestShipment = item.shipments?.[0] ?? null;
                  return (
                    <View key={item.id} style={[styles.activityRow, { borderColor: theme.colors.borderSubtle }]}>
                      <View style={styles.activityMain}>
                        <View style={styles.inlineTitle}>
                          <AppText bold>{item.folio || `Paquete #${item.id}`}</AppText>
                          <StatusPill label={packageStatusLabel(item.status)} tone={item.status === 'READY' ? 'success' : item.status === 'OPEN' ? 'warning' : 'default'} />
                        </View>
                        <AppText color={theme.colors.mutedText}>
                          {Number(item.totalItems ?? 0)} prendas - Creado {formatDate(item.createdAt)}
                        </AppText>
                        <AppText>
                          Total {money(item.totalAmount)} - Abonado {money(item.paidAmount)} - Pendiente {money(item.pendingAmount)}
                        </AppText>
                        <AppText color={theme.colors.mutedText}>
                          Envio: {item.deliveryType || 'Sin tipo'} - {item.shippingCarrier || 'Sin paqueteria'} {item.trackingNumber ? `- Guia ${item.trackingNumber}` : ''}
                        </AppText>
                      </View>
                      <View style={styles.rowActions}>
                        <AppButton
                          title="Ver paquete"
                          variant="secondary"
                          onPress={() => router.push(`/customer-package-detail?id=${item.id}&returnTo=${encodeURIComponent(currentRoute)}` as any)}
                        />
                        {latestShipment ? (
                          <AppButton
                            title="Ver envio"
                            variant="neutral"
                            onPress={() => router.push(`/shipment-detail?id=${latestShipment.shipmentId}&returnTo=${encodeURIComponent(currentRoute)}` as any)}
                            disabled={!canManageShipments}
                            disabledReason="No tienes permiso para gestionar envios. Permiso requerido: MANAGE_SHIPMENTS."
                          />
                        ) : null}
                      </View>
                    </View>
                  );
                })
              : null}
          </AppCard>
        </View>

        <View style={styles.sideColumn}>
          <AppCard>
            <AppText variant="subtitle" bold>Pedidos operativos</AppText>
            {openOrder ? (
              <View style={[styles.orderHighlight, { borderColor: theme.colors.borderSubtle }]}>
                <AppText bold>Pedido activo #{openOrder.id}</AppText>
                <AppText>{salesChannelLabel(openOrder.salesChannelCode)} - {orderStatusLabel(openOrder.status)}</AppText>
                <AppButton
                  title="Ver pedido"
                  variant="secondary"
                  onPress={() =>
                    router.push({
                      pathname: '/customer-order-detail',
                      params: { id: String(openOrder.id), returnTo: currentRoute },
                    } as any)
                  }
                  style={styles.actionButton}
                />
              </View>
            ) : (
              <AppText color={theme.colors.mutedText}>Sin pedido operativo abierto.</AppText>
            )}

            {visibleOrders.length === 0 ? (
              <AppText color={theme.colors.mutedText}>No hay pedidos con este filtro.</AppText>
            ) : (
              visibleOrders.map((order) => (
                <View key={order.id} style={[styles.compactLine, { borderColor: theme.colors.borderSubtle }]}>
                  <AppText bold>Pedido #{order.id}</AppText>
                  <AppText color={theme.colors.mutedText}>
                    {salesChannelLabel(order.salesChannelCode)} - {orderStatusLabel(order.status)} - {formatDate(order.createdAt)}
                  </AppText>
                  <AppButton
                    title="Ver"
                    variant="secondary"
                    onPress={() =>
                      router.push({
                        pathname: '/customer-order-detail',
                        params: { id: String(order.id), returnTo: currentRoute },
                      } as any)
                    }
                    style={styles.actionButton}
                  />
                </View>
              ))
            )}
          </AppCard>

          <AppCard variant="info">
            <AppText variant="subtitle" bold>Siguiente paso</AppText>
            <AppText>
              {packageCounts.ready > 0
                ? 'Hay paquetes listos para continuar en Envios.'
                : pendingTotal > 0
                  ? 'Hay saldo pendiente antes de liberar envio.'
                  : packages.length > 0
                    ? 'Revisa el paquete mas reciente o crea uno nuevo si aplica.'
                    : 'Este cliente todavia no tiene paquetes.'}
            </AppText>
            <AppButton title="Volver al cliente" variant="secondary" onPress={() => router.replace(backRoute as any)} style={styles.actionButton} />
          </AppCard>
        </View>
      </View>
    </AppShellPage>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: 'default' | 'success' | 'warning' | 'info' }) {
  const { theme } = useAppTheme();
  const color =
    tone === 'success'
      ? theme.colors.success
      : tone === 'warning'
        ? theme.colors.warning
        : tone === 'info'
          ? theme.colors.info
          : theme.colors.text;

  return (
    <View style={[styles.metric, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.borderSubtle }]}>
      <AppText variant="caption" color={theme.colors.mutedText}>{label}</AppText>
      <AppText bold color={color}>{value}</AppText>
    </View>
  );
}

function StatusPill({ label, tone }: { label: string; tone: 'success' | 'warning' | 'default' }) {
  const { theme } = useAppTheme();
  const color = tone === 'success' ? theme.colors.success : tone === 'warning' ? theme.colors.warning : theme.colors.textSecondary;
  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <AppText variant="caption" color={color} bold>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  metric: {
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 155,
    padding: 12,
  },
  toolbar: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  searchBox: {
    flex: 1,
    minWidth: 240,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    minWidth: 92,
  },
  contentGrid: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  mainColumn: {
    flex: 2,
    minWidth: 360,
  },
  sideColumn: {
    flex: 1,
    minWidth: 300,
  },
  activityRow: {
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  activityMain: {
    flex: 1,
    gap: 4,
    minWidth: 260,
  },
  inlineTitle: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rowActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  compactLine: {
    borderBottomWidth: 1,
    gap: 4,
    paddingVertical: 10,
  },
  orderHighlight: {
    borderBottomWidth: 1,
    gap: 6,
    marginBottom: 10,
    paddingBottom: 10,
  },
  actionButton: {
    marginTop: 10,
  },
  pill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
});
