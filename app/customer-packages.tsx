import AppShellPage from '@/components/layout/AppShellPage';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
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
  if (status === 'READY') return 'Listo para envio';
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

function nextActionForPackage(item: CustomerPackageDetail) {
  if (item.status === 'CANCELLED') return 'Sin accion';
  if (item.status === 'SHIPPED' || item.status === 'DELIVERED') return 'Seguimiento';
  if (Number(item.pendingAmount ?? 0) > 0) return 'Registrar abono';
  if (item.status === 'OPEN') return 'Liberar envio';
  if (item.status === 'READY') return 'Marcar enviado';
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
    if (!term) return packages;

    return packages.filter((item) => {
      const text = `${item.folio || ''} ${item.id} ${item.customerName || ''} ${
        item.customerPhone || ''
      } ${item.status || ''} ${item.paymentStatus || ''}`.toLowerCase();
      return text.includes(term);
    });
  }, [packages, search]);

  const openPackages = useMemo(
    () => filteredPackages.filter((item) => item.status === 'OPEN' || item.status === 'READY'),
    [filteredPackages]
  );

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
      {selectedCustomerId ? (
        <AppButton
          title="Nuevo paquete"
          onPress={() => setCreateModalVisible(true)}
          style={styles.headerButton}
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
      <AppButton
        title="Actualizar"
        variant="secondary"
        onPress={loadData}
        loading={isLoading}
        disabled={isLoading}
        style={styles.headerButton}
      />
    </View>
  );

  const renderPackage = (item: CustomerPackageDetail) => {
    const balance = customerBalances[item.customerId] ?? 0;
    const pending = Number(item.pendingAmount ?? 0);

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
            {item.customerPhone || 'Sin telefono'} - {item.totalItems || 0} prendas
          </AppText>
        </View>

        <View style={styles.packageMeta}>
          <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
            {paymentLabel(item.paymentStatus)} - Total {formatMoney(item.totalAmount)}
          </AppText>
          <AppText variant="caption" color={pending > 0 ? theme.colors.warning : theme.colors.success} numberOfLines={1}>
            Abonado {formatMoney(item.paidAmount)} - Saldo {formatMoney(item.pendingAmount)}
          </AppText>
          {balance > 0 ? (
            <AppText variant="caption" color={theme.colors.success} numberOfLines={1}>
              Saldo a favor cliente: {formatMoney(balance)}
            </AppText>
          ) : null}
        </View>

        <View style={styles.packageMeta}>
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
        subtitle="Bandeja operativa de paquetes, pagos y envio"
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
      subtitle="Bandeja operativa de paquetes, pagos y envio"
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
                ? `${customer?.name || 'Cliente'} - ${customer?.phone || 'Sin telefono'}`
                : 'Busca por folio, cliente, telefono o estado.'}
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
                Total {formatMoney(actionsPackage.totalAmount)} - Saldo {formatMoney(actionsPackage.pendingAmount)}
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
              <AppButton
                title="Liberar envio"
                variant="neutral"
                disabled={Number(actionsPackage.pendingAmount ?? 0) > 0}
                disabledReason="Este paquete tiene saldo pendiente."
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
