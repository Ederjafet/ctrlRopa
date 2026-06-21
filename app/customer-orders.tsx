import AppShellPage from '@/components/layout/AppShellPage';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppOptionRow from '@/components/ui/AppOptionRow';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { Customer, getCustomerById, getCustomersByBranch } from '@/services/customerService';
import {
  CustomerOrder,
  findOpenCustomerOrder,
  getCustomerOrdersByCustomer,
} from '@/services/customerOrderService';
import { getSession } from '@/services/sessionStorage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

function formatDate(value?: string) {
  if (!value) return 'Sin fecha';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString();
}

function statusLabel(status?: string) {
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

export default function CustomerOrdersScreen() {
  const router = useRouter();
  const { customerId, returnTo } = useLocalSearchParams<{
    customerId?: string | string[];
    returnTo?: string | string[];
  }>();
  const { theme } = useAppTheme();

  const customerIdParam = Array.isArray(customerId) ? customerId[0] : customerId;
  const returnRoute = Array.isArray(returnTo) ? returnTo[0] : returnTo;
  const selectedCustomerId = customerIdParam ? Number(customerIdParam) : null;
  const currentCustomerOrdersRoute = selectedCustomerId
    ? `/customer-orders?customerId=${selectedCustomerId}${returnRoute ? `&returnTo=${encodeURIComponent(returnRoute)}` : ''}`
    : '/customer-orders';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [customerId])
  );

  const loadData = async () => {
    try {
      setIsLoading(true);

      const session = await getSession();
      if (!session) {
        router.replace('/login');
        return;
      }

      if (selectedCustomerId) {
        const [customerData, orderData] = await Promise.all([
          getCustomerById(selectedCustomerId),
          getCustomerOrdersByCustomer(selectedCustomerId),
        ]);

        setCustomer(customerData);
        setOrders(orderData);
        setCustomers([]);
        return;
      }

      const data = await getCustomersByBranch(session.branchId);
      setCustomers(data.filter((item) => item.status !== 'INACTIVE'));
      setCustomer(null);
      setOrders([]);
    } catch (e: any) {
      Alert.alert('Pedidos', e.message || 'No se pudo cargar la información.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return customers;

    return customers.filter((item) => {
      const text = `${item.name || ''} ${item.phone || ''}`.toLowerCase();
      return text.includes(term);
    });
  }, [customers, search]);

  const openOrder = useMemo(() => findOpenCustomerOrder(orders), [orders]);
  const historicalOrders = useMemo(
    () => orders.filter((order) => order.id !== openOrder?.id),
    [openOrder?.id, orders]
  );

  if (isLoading) {
    return (
      <AppShellPage
        title="Pedidos"
        subtitle="Pedidos y seguimiento por cliente"
        activeRoute="customers"
      >
        <ActivityIndicator />
      </AppShellPage>
    );
  }

  if (!selectedCustomerId) {
    return (
      <AppShellPage
        title="Pedidos"
        subtitle="Pedidos y seguimiento por cliente"
        activeRoute="customers"
      >
        <AppCard>
          <AppText variant="subtitle" bold>
            Selecciona cliente
          </AppText>
          <AppText color={theme.colors.mutedText}>
            Los pedidos se consultan por cliente.
          </AppText>

          <AppInput
            label="Buscar cliente"
            placeholder="Nombre o teléfono"
            value={search}
            onChangeText={setSearch}
          />
        </AppCard>

        <AppCard>
          {filteredCustomers.length === 0 ? (
            <AppText color={theme.colors.mutedText}>
              No hay clientes que coincidan con la búsqueda.
            </AppText>
          ) : (
            filteredCustomers.map((item) => (
              <AppOptionRow
                key={item.id}
                title={item.name}
                subtitle={item.phone || 'Sin teléfono'}
                onPress={() => router.push(`/customer-orders?customerId=${item.id}` as any)}
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
      subtitle="Pedido activo e historial comercial"
      activeRoute="customers"
      rightContent={
        <AppButton
          title="Volver"
          variant="secondary"
          onPress={() => router.replace((returnRoute || '/customer-orders') as any)}
        />
      }
    >
      <AppCard>
        <AppText variant="subtitle" bold>
          {customer?.name || 'Cliente'}
        </AppText>
        <AppText color={theme.colors.mutedText}>
          {customer?.phone || 'Sin teléfono'}
        </AppText>
      </AppCard>

      <AppCard>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <AppText variant="subtitle" bold>
              Pedido activo
            </AppText>
            <AppText color={theme.colors.mutedText}>
              Se crea automaticamente al registrar una reserva o venta.
            </AppText>
          </View>
        </View>

        {openOrder ? (
          <View style={styles.openOrderBox}>
            <AppText bold>Pedido #{openOrder.id}</AppText>
            <AppText>Tipo: {salesChannelLabel(openOrder.salesChannelCode)}</AppText>
            <AppText>Estado: {statusLabel(openOrder.status)}</AppText>
            <AppText>Fecha: {formatDate(openOrder.createdAt)}</AppText>

            <View style={styles.actionSpacer}>
              <AppButton
                title="Ver pedido activo"
                onPress={() =>
                  router.push({
                    pathname: '/customer-order-detail',
                    params: {
                      id: String(openOrder.id),
                      returnTo: currentCustomerOrdersRoute,
                    },
                  } as any)
                }
              />
            </View>
          </View>
        ) : (
          <AppText color={theme.colors.mutedText}>
            Este cliente no tiene un pedido activo. Registra una reserva o venta para generarlo automaticamente.
          </AppText>
        )}
      </AppCard>

      <AppCard>
        <AppText variant="subtitle" bold>
          Historial de pedidos
        </AppText>

        {historicalOrders.length === 0 ? (
          <AppText color={theme.colors.mutedText}>
            Este cliente todavia no tiene pedidos cerrados o cancelados.
          </AppText>
        ) : (
          historicalOrders.map((order) => (
            <View key={order.id} style={[styles.orderRow, { borderBottomColor: theme.colors.border }]}>
              <View style={styles.orderText}>
                <AppText bold>Pedido #{order.id}</AppText>
                <AppText>Tipo: {salesChannelLabel(order.salesChannelCode)}</AppText>
                <AppText>Estado: {statusLabel(order.status)}</AppText>
                <AppText color={theme.colors.mutedText}>
                  Fecha: {formatDate(order.createdAt)}
                </AppText>
              </View>

              <View style={styles.orderAction}>
                <AppButton
                  title="Ver"
                  variant="secondary"
                  onPress={() =>
                    router.push({
                      pathname: '/customer-order-detail',
                      params: {
                        id: String(order.id),
                        returnTo: currentCustomerOrdersRoute,
                      },
                    } as any)
                  }
                />
              </View>
            </View>
          ))
        )}
      </AppCard>
    </AppShellPage>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  openOrderBox: {
    marginTop: 10,
  },
  actionSpacer: {
    marginTop: 12,
  },
  orderRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  orderText: {
    marginBottom: 8,
  },
  orderAction: {
    marginTop: 4,
  },
});
