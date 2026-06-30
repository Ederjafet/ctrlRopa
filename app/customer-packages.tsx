import AppShellPage from '@/components/layout/AppShellPage';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import ScreenPermissionHeaderAction from '@/components/ui/ScreenPermissionHeaderAction';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { hasPermission } from '@/services/accessControl';
import { getCustomerBalance } from '@/services/balanceService';
import { Customer, getCustomerById } from '@/services/customerService';
import {
  createCustomerPackage,
  CustomerPackage,
  CustomerPackageDetail,
  getCustomerPackageDetailsByBranch,
  getCustomerPackageDetailsByCustomer,
} from '@/services/customerPackageService';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

function formatMoney(value?: number | null) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function statusLabel(status?: string) {
  if (status === 'OPEN') return 'Abierto';
  if (status === 'READY') return 'Listo para envío';
  if (status === 'SHIPPED') return 'Enviado';
  if (status === 'DELIVERED') return 'Entregado';
  if (status === 'CANCELLED') return 'Cancelado';
  return status || 'Sin estado';
}

function paymentLabel(status?: string) {
  if (status === 'PAID') return 'Pagado';
  if (status === 'PARTIALLY_PAID' || status === 'PARTIAL') return 'Parcial';
  if (status === 'UNPAID' || status === 'PENDING') return 'Sin pago';
  return status || 'Sin pago';
}

type ShippingFilter = 'ALL' | 'NO_SHIPMENT' | 'PENDING' | 'PREPARING' | 'SHIPPED' | 'DELIVERED';
type ShippingTone = 'default' | 'success' | 'warning' | 'info';

const SHIPPING_FILTERS: { key: ShippingFilter; label: string }[] = [
  { key: 'ALL', label: 'Todos' },
  { key: 'NO_SHIPMENT', label: 'Sin envío' },
  { key: 'PENDING', label: 'Pendiente configurar' },
  { key: 'PREPARING', label: 'En preparacion' },
  { key: 'SHIPPED', label: 'Enviado' },
  { key: 'DELIVERED', label: 'Entregado' },
];

function getLatestPackageShipment(item: CustomerPackageDetail) {
  return item.shipments?.[0] ?? null;
}

function getPackageShippingVisibility(item: CustomerPackageDetail): {
  line: string;
  badge: string;
  tone: ShippingTone;
  group: Exclude<ShippingFilter, 'ALL'>;
} {
  const latestShipment = getLatestPackageShipment(item);

  if (!latestShipment) {
    if (item.status === 'READY') {
      return {
        line: 'Envío: Pendiente de configurar',
        badge: 'Pendiente',
        tone: 'warning',
        group: 'PENDING',
      };
    }

    return {
      line: 'Envío: Sin envío',
      badge: 'Sin envío',
      tone: 'default',
      group: 'NO_SHIPMENT',
    };
  }

  const status = latestShipment.shipmentStatus || latestShipment.packageShipmentStatus || item.status;
  const folio = latestShipment.shipmentFolio || `#${latestShipment.shipmentId}`;

  if (status === 'OUT_FOR_DELIVERY' || status === 'SHIPPED') {
    return {
      line: `Envío: Enviado - ${folio}`,
      badge: 'Enviado',
      tone: 'info',
      group: 'SHIPPED',
    };
  }

  if (status === 'DELIVERED') {
    return {
      line: `Envío: Entregado - ${folio}`,
      badge: 'Entregado',
      tone: 'success',
      group: 'DELIVERED',
    };
  }

  if (status === 'CANCELLED' || status === 'CLOSED_WITH_INCIDENTS') {
    return {
      line: `Envío: Pendiente de configurar - ${folio}`,
      badge: 'Pendiente',
      tone: 'warning',
      group: 'PENDING',
    };
  }

  return {
    line: `Envío: En preparacion - ${folio}`,
    badge: 'En preparacion',
    tone: 'info',
    group: 'PREPARING',
  };
}

function matchesShippingFilter(item: CustomerPackageDetail, filter: ShippingFilter) {
  const shipping = getPackageShippingVisibility(item);

  if (filter === 'ALL') return true;
  return shipping.group === filter;
}

function shippingToneColor(theme: ReturnType<typeof useAppTheme>['theme'], tone: ShippingTone) {
  if (tone === 'success') return theme.colors.success;
  if (tone === 'warning') return theme.colors.warning;
  if (tone === 'info') return theme.colors.accent;
  return theme.colors.mutedText;
}
function nextActionForPackage(item: CustomerPackageDetail) {
  if (item.status === 'CANCELLED') return 'Sin accion';
  if (item.status === 'SHIPPED' || item.status === 'DELIVERED') return 'Seguimiento';
  if (Number(item.pendingAmount ?? 0) > 0) return 'Registrar abono';
  if (getLatestPackageShipment(item)) return 'Ver envío';
  if (item.status === 'READY') return 'Crear envío';
  return 'Detalle';
}

export default function CustomerPackagesScreen() {
  const router = useRouter();
  const { customerId } = useLocalSearchParams<{ customerId?: string }>();
  const { theme } = useAppTheme();

  const selectedCustomerId = customerId ? Number(customerId) : null;

  const [session, setSession] = useState<UserSession | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [packages, setPackages] = useState<CustomerPackageDetail[]>([]);
  const [customerBalances, setCustomerBalances] = useState<Record<number, number>>({});
  const [search, setSearch] = useState('');
  const [shippingFilter, setShippingFilter] = useState<ShippingFilter>('ALL');
  const [notes, setNotes] = useState('');
  const [actionsPackage, setActionsPackage] = useState<CustomerPackageDetail | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const loadBalances = async (packageData: CustomerPackageDetail[]) => {
    const customerIds = Array.from(new Set(packageData.map((item) => item.customerId)));
    const entries = await Promise.all(
      customerIds.map(async (id) => {
        try {
          const balance = await getCustomerBalance(id);
          return [id, Number(balance.balance ?? 0)] as const;
        } catch {
          return [id, 0] as const;
        }
      })
    );
    setCustomerBalances(Object.fromEntries(entries));
  };

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const currentSession = await getSession();

      if (!currentSession) {
        router.replace('/login');
        return;
      }

      setSession(currentSession);

      if (selectedCustomerId) {
        const [customerData, packageData] = await Promise.all([
          getCustomerById(selectedCustomerId),
          getCustomerPackageDetailsByCustomer(selectedCustomerId),
        ]);

        setCustomer(customerData);
        setPackages(packageData);
        await loadBalances(packageData);
        return;
      }

      const packageData = await getCustomerPackageDetailsByBranch(currentSession.branchId);
      setCustomer(null);
      setPackages(packageData);
      await loadBalances(packageData);
    } catch (error: any) {
      Alert.alert('Paquetes', error.message || 'No se pudo cargar la informacion.');
    } finally {
      setIsLoading(false);
    }
  }, [router, selectedCustomerId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const filteredPackages = useMemo(() => {
    const term = search.trim().toLowerCase();
    const searchedPackages = term
      ? packages.filter((item) => {
          const shipping = getPackageShippingVisibility(item);
          const text = `${item.folio || ''} ${item.id} ${item.customerName || ''} ${
            item.customerPhone || ''
          } ${item.status || ''} ${item.paymentStatus || ''} ${item.deliveryType || ''} ${item.shippingCarrier || ''} ${shipping.line} ${shipping.badge}`.toLowerCase();
          return text.includes(term);
        })
      : packages;

    return searchedPackages.filter((item) => matchesShippingFilter(item, shippingFilter));
  }, [packages, search, shippingFilter]);

  const openPackages = useMemo(
    () => filteredPackages.filter((item) => item.status === 'OPEN' || item.status === 'READY'),
    [filteredPackages]
  );

  const canCreatePackage = hasPermission(session, 'CREATE_CUSTOMER_PACKAGE');
  const canManageShipments = hasPermission(session, 'MANAGE_SHIPMENTS');

  const historicalPackages = useMemo(
    () => filteredPackages.filter((item) => item.status !== 'OPEN' && item.status !== 'READY'),
    [filteredPackages]
  );

  const handleCreatePackage = async () => {
    if (!session || !selectedCustomerId) return;

    try {
      setIsCreating(true);
      const created: CustomerPackage = await createCustomerPackage({
        customerId: selectedCustomerId,
        branchId: session.branchId,
        notes: notes.trim() || null,
        createdByUserId: session.userId,
      });

      setCreateModalVisible(false);
      setNotes('');
      router.push(`/customer-package-detail?id=${created.id}` as any);
    } catch (error: any) {
      Alert.alert('Paquetes', error.message || 'No se pudo crear el paquete.');
    } finally {
      setIsCreating(false);
    }
  };

  const renderHeaderActions = () => (
    <View style={styles.headerActions}>
      <ScreenPermissionHeaderAction
        screenKey="customerPackages"
        screenTitle="Paquetes"
        session={session}
        buttonStyle={styles.headerButton}
      />
      {canCreatePackage ? (
        <AppButton
          title="Nuevo paquete"
          variant="cta"
          onPress={() => setCreateModalVisible(true)}
          disabled={!selectedCustomerId}
          disabledReason="Para crear un paquete, primero selecciona un cliente formal o crea el paquete desde Apartados para elegir prendas elegibles."
          style={styles.headerCtaButton}
        />
      ) : null}
      {selectedCustomerId ? (
        <AppButton
          title="Ver todos"
          variant="secondary"
          onPress={() => router.replace('/customer-packages' as any)}
          style={styles.headerButton}
        />
      ) : null}
    </View>
  );

  const renderPackage = (item: CustomerPackageDetail) => {
    const balance = customerBalances[item.customerId] ?? 0;
    const pending = Number(item.pendingAmount ?? 0);
    const shipping = getPackageShippingVisibility(item);
    const shippingColor = shippingToneColor(theme, shipping.tone);
    const latestShipment = getLatestPackageShipment(item);

    return (
      <View
        key={item.id}
        style={[
          styles.packageRow,
          {
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
          },
        ]}
      >
        <View style={styles.packageIdentity}>
          <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
            Paquete {item.folio || `#${item.id}`} - Cliente
          </AppText>
          <AppText bold numberOfLines={1}>
            {item.customerName || `Cliente #${item.customerId}`}
          </AppText>
          <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
            {item.customerPhone || 'Sin teléfono'} - {item.totalItems || 0} prendas
          </AppText>
        </View>

        <View style={styles.packageMeta}>
          <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
            {paymentLabel(item.paymentStatus)} - Total mercancía {formatMoney(item.itemSubtotalAmount ?? item.totalAmount)}
          </AppText>
          <AppText variant="caption" color={pending > 0 ? theme.colors.warning : theme.colors.success} numberOfLines={1}>
            Abonado mercancía {formatMoney(item.paidAmount)} - Saldo mercancía {formatMoney(item.pendingAmount)}
          </AppText>
          {balance > 0 ? (
            <AppText variant="caption" color={theme.colors.success} numberOfLines={1}>
              Saldo a favor cliente: {formatMoney(balance)}
            </AppText>
          ) : null}
        </View>

        <View style={styles.packageMeta}>
          <View style={styles.shippingLine}>
            <AppText variant="caption" color={shippingColor} numberOfLines={1} style={styles.shippingLineText}>
              {shipping.line}
            </AppText>
            <View style={[styles.shippingBadge, { borderColor: shippingColor, backgroundColor: theme.colors.surfaceAlt }]}>
              <AppText variant="caption" bold color={shippingColor} numberOfLines={1}>
                {shipping.badge}
              </AppText>
            </View>
          </View>
          <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
            Estado: {statusLabel(item.status)}
          </AppText>
          <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
            Siguiente: {nextActionForPackage(item)}
          </AppText>
        </View>

        <View style={styles.packageActions}>
          <AppButton
            title="Detalle"
            variant="secondary"
            onPress={() => router.push(`/customer-package-detail?id=${item.id}` as any)}
            style={styles.compactButton}
          />
          {canManageShipments ? (
            <AppButton
              title={latestShipment ? 'Ver envío' : 'Crear envío'}
              variant={latestShipment ? 'secondary' : 'operation'}
              onPress={() =>
                latestShipment
                  ? router.push(`/shipment-detail?id=${latestShipment.shipmentId}` as any)
                  : router.push('/shipments' as any)
              }
              style={styles.compactButton}
            />
          ) : null}
          <AppButton
            title="Mas"
            variant="secondary"
            onPress={() => setActionsPackage(item)}
            style={styles.compactButton}
          />
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <AppShellPage
        title="Paquetes"
        subtitle="Bandeja operativa de paquetes y mercancía"
        activeRoute="customer-packages"
        compactHeader
        rightContent={renderHeaderActions()}
      >
        <ActivityIndicator />
      </AppShellPage>
    );
  }

  return (
    <AppShellPage
      title="Paquetes"
      subtitle="Bandeja operativa de paquetes y mercancía"
      metadata={customer?.name ? `Cliente: ${customer.name}` : 'Paquetes por sucursal'}
      activeRoute="customer-packages"
      compactHeader
      rightContent={renderHeaderActions()}
    >
      <AppCard>
        <View style={styles.searchHeader}>
          <View style={styles.searchTitle}>
            <AppText variant="subtitle" bold>
              {selectedCustomerId ? 'Paquetes del cliente' : 'Bandeja de paquetes'}
            </AppText>
            <AppText color={theme.colors.mutedText}>
              {selectedCustomerId
                ? `${customer?.name || 'Cliente'} - ${customer?.phone || 'Sin teléfono'}`
                : 'Busca por folio, cliente, teléfono o estado.'}
            </AppText>
          </View>
          <AppInput
            label="Buscar"
            placeholder="Cliente, folio o estado"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>
        <View style={styles.filterChips}>
          {SHIPPING_FILTERS.map((filter) => (
            <AppButton
              key={filter.key}
              title={filter.label}
              variant={shippingFilter === filter.key ? 'operation' : 'neutral'}
              onPress={() => setShippingFilter(filter.key)}
              style={styles.filterButton}
            />
          ))}
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="subtitle" bold>
          Activos
        </AppText>
        {openPackages.length === 0 ? (
          <AppText color={theme.colors.mutedText}>
            No hay paquetes activos para mostrar.
          </AppText>
        ) : (
          openPackages.map(renderPackage)
        )}
      </AppCard>

      <AppCard>
        <AppText variant="subtitle" bold>
          Historial
        </AppText>
        {historicalPackages.length === 0 ? (
          <AppText color={theme.colors.mutedText}>
            No hay paquetes cerrados, enviados o cancelados con los filtros actuales.
          </AppText>
        ) : (
          historicalPackages.map(renderPackage)
        )}
      </AppCard>

      <AppBottomModal
        visible={createModalVisible}
        title="Nuevo paquete"
        onClose={() => setCreateModalVisible(false)}
      >
        <AppText color={theme.colors.mutedText}>
          Crea un paquete vacio solo para cliente formal. Agrega prendas desde Apartados o desde el detalle del paquete.
        </AppText>

        <AppInput
          label="Notas"
          value={notes}
          onChangeText={setNotes}
          placeholder="Notas opcionales"
          multiline
        />

        <AppButton
          title={isCreating ? 'Creando...' : 'Crear paquete'}
          variant="cta"
          onPress={handleCreatePackage}
          loading={isCreating}
          disabled={isCreating}
        />
      </AppBottomModal>

      <AppBottomModal
        visible={Boolean(actionsPackage)}
        title={actionsPackage ? `Paquete ${actionsPackage.folio}` : 'Paquete'}
        onClose={() => setActionsPackage(null)}
      >
        {actionsPackage ? (
          <>
            <AppCard variant="subtle" style={styles.actionSummary}>
              <AppText bold>
                {actionsPackage.customerName || `Cliente #${actionsPackage.customerId}`}
              </AppText>
              <AppText variant="caption" color={theme.colors.mutedText}>
                Mercancia {formatMoney(actionsPackage.itemSubtotalAmount ?? actionsPackage.totalAmount)} - Saldo mercancía {formatMoney(actionsPackage.pendingAmount)}
              </AppText>
              <AppText variant="caption" color={shippingToneColor(theme, getPackageShippingVisibility(actionsPackage).tone)}>
                {getPackageShippingVisibility(actionsPackage).line}
              </AppText>
            </AppCard>
            <View style={styles.modalActionsStack}>
              <AppButton
                title="Detalle"
                variant="secondary"
                onPress={() => {
                  const id = actionsPackage.id;
                  setActionsPackage(null);
                  router.push(`/customer-package-detail?id=${id}` as any);
                }}
              />
              {canManageShipments ? (
                <AppButton
                  title={getLatestPackageShipment(actionsPackage) ? 'Ver envío' : 'Crear envío'}
                  variant="secondary"
                  onPress={() => {
                    const shipment = getLatestPackageShipment(actionsPackage);
                    setActionsPackage(null);
                    if (shipment) {
                      router.push(`/shipment-detail?id=${shipment.shipmentId}` as any);
                    } else {
                      router.push('/shipments' as any);
                    }
                  }}
                />
              ) : null}
              <AppButton
                title="Registrar abono"
                variant="operation"
                onPress={() => {
                  const id = actionsPackage.id;
                  setActionsPackage(null);
                  router.push(`/customer-package-detail?id=${id}` as any);
                }}
                disabled={Number(actionsPackage.pendingAmount ?? 0) <= 0}
                disabledReason="El paquete ya esta liquidado."
              />
            </View>
          </>
        ) : null}
      </AppBottomModal>
    </AppShellPage>
  );
}

const styles = StyleSheet.create({
  actionSummary: {
    marginBottom: 10,
  },
  compactButton: {
    minHeight: 30,
    minWidth: 66,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  filterButton: {
    minHeight: 30,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-end',
  },
  headerButton: {
    minHeight: 30,
    minWidth: 94,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerCtaButton: {
    minHeight: 52,
    minWidth: 150,
    paddingHorizontal: 24,
    paddingVertical: 15,
  },
  modalActionsStack: {
    gap: 8,
  },
  packageActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-end',
  },
  packageIdentity: {
    flex: 1.2,
    gap: 3,
    minWidth: 170,
  },
  packageMeta: {
    flex: 1,
    gap: 3,
    minWidth: 150,
  },
  packageRow: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
    padding: 12,
  },
  shippingBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  shippingLine: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  shippingLineText: {
    flexShrink: 1,
    minWidth: 160,
  },
  searchHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  searchInput: {
    flex: 1,
    minWidth: 220,
  },
  searchTitle: {
    flex: 1.2,
    minWidth: 220,
  },
});
