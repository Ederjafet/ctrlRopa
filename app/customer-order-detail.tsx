import AppShellPage from '@/components/layout/AppShellPage';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import {
  CustomerOrderDetail,
  CustomerOrderSettlement,
  getCustomerOrderDetail,
  getCustomerOrderSettlement,
} from '@/services/customerOrderService';
import { prepareCustomerPackageFromOrder } from '@/services/customerPackageService';
import { getSession } from '@/services/sessionStorage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

function money(value?: number | null) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function formatDate(value?: string) {
  if (!value) return 'Sin fecha';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

function statusLabel(status?: string) {
  if (status === 'OPEN') return 'Abierto';
  if (status === 'CLOSED') return 'Cerrado';
  if (status === 'CANCELLED') return 'Cancelado';
  if (status === 'ACTIVE') return 'Activo';
  if (status === 'COMPLETED') return 'Completado';
  if (status === 'CONVERTED_TO_SALE') return 'Convertido a venta';
  return status || 'Sin estado';
}

function paymentStatusLabel(status?: string) {
  if (status === 'PAID') return 'Pagado';
  if (status === 'PARTIALLY_PAID') return 'Parcial';
  if (status === 'PARTIAL') return 'Parcial';
  if (status === 'PENDING') return 'Pendiente';
  if (status === 'UNPAID') return 'Pendiente';
  return status || 'Sin estado';
}

function orderLineTypeLabel(type?: string) {
  if (type === 'RESERVATION') return 'Apartado';
  if (type === 'SALE') return 'Venta';
  return 'Movimiento';
}

function salesChannelLabel(code?: string) {
  if (code === 'DOOR_SALE') return 'Venta puerta';
  if (code === 'DOOR_RESERVATION') return 'Apartado puerta';
  return code || 'Sin canal';
}

export default function CustomerOrderDetailScreen() {
  const router = useRouter();
  const { id, returnTo } = useLocalSearchParams<{
    id?: string | string[];
    returnTo?: string | string[];
  }>();
  const { theme } = useAppTheme();

  const orderId = Number(Array.isArray(id) ? id[0] : id);
  const returnRoute = Array.isArray(returnTo) ? returnTo[0] : returnTo;

  const [detail, setDetail] = useState<CustomerOrderDetail | null>(null);
  const [settlement, setSettlement] =
    useState<CustomerOrderSettlement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreparingPackage, setIsPreparingPackage] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [id])
  );

  const loadData = async () => {
    if (!orderId) return;

    try {
      setIsLoading(true);

      const [detailData, settlementData] = await Promise.all([
        getCustomerOrderDetail(orderId),
        getCustomerOrderSettlement(orderId),
      ]);

      setDetail(detailData);
      setSettlement(settlementData);
    } catch (e: any) {
      Alert.alert('Pedido', e.message || 'No se pudo cargar el pedido.');
    } finally {
      setIsLoading(false);
    }
  };

  const fallbackRoute = useMemo(() => {
    if (returnRoute) return returnRoute;

    if (detail?.customerId) {
      return `/customer-orders?customerId=${detail.customerId}`;
    }

    return '/customer-orders';
  }, [detail?.customerId, returnRoute]);

  const handlePreparePackage = async () => {
    if (!detail) return;

    try {
      setIsPreparingPackage(true);
      const session = await getSession();

      if (!session) {
        router.replace('/login');
        return;
      }

      const customerPackage = await prepareCustomerPackageFromOrder(detail.id, {
        createdByUserId: session.userId,
      });

      router.push(`/customer-package-detail?id=${customerPackage.id}` as any);
    } catch (error: any) {
      Alert.alert(
        'Preparar paquete',
        error.message || 'No se pudo preparar el paquete de este pedido.'
      );
    } finally {
      setIsPreparingPackage(false);
    }
  };

  if (isLoading || !detail) {
    return (
      <AppShellPage
        title="Detalle de pedido"
        subtitle="Resumen financiero y prendas"
        activeRoute="customers"
      >
        <ActivityIndicator />
      </AppShellPage>
    );
  }

  const orderItems = detail.items ?? [];
  const hasActiveReservations = orderItems.some(
    (line) => line.type === 'RESERVATION' && line.status === 'ACTIVE'
  );
  const pending = settlement?.pending ?? 0;
  const isClosed = detail.status === 'CLOSED' || settlement?.status === 'CLOSED';

  return (
    <AppShellPage
      title={`Pedido #${detail.id}`}
      subtitle="Resumen financiero y prendas"
      activeRoute="customers"
      rightContent={
        <AppButton
          title="Volver"
          variant="secondary"
          onPress={() => router.replace(fallbackRoute as any)}
        />
      }
    >
      <AppCard>
        <View style={styles.summaryRow}>
          <AppText bold>Cliente</AppText>
          <AppText>{detail.customerName || 'Sin cliente'}</AppText>
        </View>

        <View style={styles.summaryRow}>
          <AppText bold>Estado</AppText>
          <AppText bold color={isClosed ? '#2e7d32' : theme.colors.text}>
            {statusLabel(settlement?.status || detail.status)}
          </AppText>
        </View>

        <View style={styles.summaryRow}>
          <AppText bold>Fecha</AppText>
          <AppText>{formatDate(detail.createdAt)}</AppText>
        </View>

        {pending > 0 && hasActiveReservations ? (
          <View style={styles.actionSpacer}>
            <AppButton
              title="Cobrar apartado"
              onPress={() =>
                router.push({
                  pathname: '/payments',
                  params: {
                    orderId: String(detail.id),
                    returnTo: `/customer-order-detail?id=${detail.id}`,
                  },
                } as any)
              }
            />
          </View>
        ) : null}
      </AppCard>

      <AppCard>
        <AppText variant="subtitle" bold>
          Resumen financiero
        </AppText>

        <View style={styles.summaryRow}>
          <AppText>Total</AppText>
          <AppText bold>{money(settlement?.total ?? detail.total)}</AppText>
        </View>

        <View style={styles.summaryRow}>
          <AppText>Pagado directo</AppText>
          <AppText>{money(settlement?.directPaid)}</AppText>
        </View>

        <View style={styles.summaryRow}>
          <AppText>Saldo aplicado</AppText>
          <AppText>{money(settlement?.appliedBalance)}</AppText>
        </View>

        <View style={styles.summaryRow}>
          <AppText bold>Pendiente</AppText>
          <AppText bold color={pending <= 0 ? '#2e7d32' : theme.colors.text}>
            {money(pending)}
          </AppText>
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="subtitle" bold>
          Prendas del pedido
        </AppText>

        {orderItems.length === 0 ? (
          <AppText color={theme.colors.mutedText}>
            Este pedido todavía no tiene prendas asociadas.
          </AppText>
        ) : (
          orderItems.map((line) => {
            return (
              <View
                key={line.orderItemId}
                style={[styles.itemRow, { borderBottomColor: theme.colors.border }]}
              >
                <View style={styles.itemText}>
                  <AppText bold>{line.itemCode || `Item #${line.itemId}`}</AppText>
                  <AppText>Tipo: {orderLineTypeLabel(line.type)}</AppText>
                  <AppText>Precio: {money(line.price)}</AppText>
                  <AppText>Canal: {salesChannelLabel(line.salesChannelCode)}</AppText>
                  <AppText>Estado: {statusLabel(line.status)}</AppText>
                  {line.type === 'SALE' ? (
                    <AppText>Pago: {paymentStatusLabel(line.paymentStatus)}</AppText>
                  ) : null}
                </View>

                <View style={styles.itemActions}>
                  <AppButton
                    title="Ver prenda"
                    variant="secondary"
                    onPress={() =>
                      router.push({
                        pathname: '/items/[id]',
                        params: {
                          id: String(line.itemId),
                          returnTo: `/customer-order-detail?id=${detail.id}`,
                        },
                      } as any)
                    }
                  />

                </View>
              </View>
            );
          })
        )}
      </AppCard>

      {pending <= 0 && orderItems.length > 0 ? (
        <AppCard>
          <AppText bold color="#2e7d32">
            Pedido liquidado
          </AppText>
          <AppText color={theme.colors.mutedText}>
            Ya no hay saldo pendiente por cobrar en este pedido.
          </AppText>

          <View style={styles.actionSpacer}>
            <AppButton
              title={isPreparingPackage ? 'Preparando...' : 'Preparar paquete'}
              onPress={handlePreparePackage}
              loading={isPreparingPackage}
              disabled={isPreparingPackage}
            />
          </View>
        </AppCard>
      ) : null}
    </AppShellPage>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  itemText: {
    marginBottom: 10,
  },
  itemActions: {
    gap: 8,
  },
  actionSpacer: {
    marginTop: 8,
  },
});
