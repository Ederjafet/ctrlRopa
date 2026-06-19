import AppShellPage from '@/components/layout/AppShellPage';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppOptionRow from '@/components/ui/AppOptionRow';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { Customer, getCustomerById, getCustomersByBranch } from '@/services/customerService';
import {
  createCustomerPackage,
  CustomerPackage,
  getCustomerPackagesByCustomer,
} from '@/services/customerPackageService';
import { getSession, UserSession } from '@/services/sessionStorage';
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
  if (status === 'READY') return 'Preparación cerrada';
  if (status === 'SHIPPED') return 'Enviado';
  if (status === 'DELIVERED') return 'Entregado';
  if (status === 'CANCELLED') return 'Cancelado';
  return status || 'Sin estado';
}

function getPackageNextAction(status?: string) {
  if (status === 'OPEN') return 'Preparar paquete';
  if (status === 'READY') return 'Listo para envio';
  if (status === 'SHIPPED') return 'Seguimiento de envio';
  if (status === 'DELIVERED') return 'Entregado';
  if (status === 'CANCELLED') return 'Cancelado';
  return 'Ver detalle';
}

function isActiveCustomer(customer: Customer) {
  return customer.status !== 'INACTIVE' && !customer.isGeneric;
}

export default function CustomerPackagesScreen() {
  const router = useRouter();
  const { customerId } = useLocalSearchParams<{ customerId?: string }>();
  const { theme } = useAppTheme();

  const selectedCustomerId = customerId ? Number(customerId) : null;

  const [session, setSession] = useState<UserSession | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [packages, setPackages] = useState<CustomerPackage[]>([]);
  const [search, setSearch] = useState('');
  const [notes, setNotes] = useState('');
  const [actionsPackage, setActionsPackage] = useState<CustomerPackage | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [customerId])
  );

  const loadData = async () => {
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
          getCustomerPackagesByCustomer(selectedCustomerId),
        ]);

        setCustomer(customerData);
        setPackages(packageData);
        setCustomers([]);
        return;
      }

      const customerData = await getCustomersByBranch(currentSession.branchId);
      setCustomers(customerData.filter(isActiveCustomer));
      setCustomer(null);
      setPackages([]);
    } catch (error: any) {
      Alert.alert('Paquetes', error.message || 'No se pudo cargar la información.');
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

  const openPackages = useMemo(
    () => packages.filter((item) => item.status === 'OPEN'),
    [packages]
  );

  const historicalPackages = useMemo(
    () => packages.filter((item) => item.status !== 'OPEN'),
    [packages]
  );

  const handleCreatePackage = async () => {
    if (!session || !selectedCustomerId) return;

    try {
      setIsCreating(true);
      const created = await createCustomerPackage({
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
          title="Volver"
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

  if (isLoading) {
    return (
      <AppShellPage
        title="Paquetes"
        subtitle="Gestion de paquetes, pago y preparacion de envio"
        activeRoute="customer-packages"
        compactHeader
        rightContent={renderHeaderActions()}
      >
        <ActivityIndicator />
      </AppShellPage>
    );
  }

  if (!selectedCustomerId) {
    return (
      <AppShellPage
        title="Paquetes"
        subtitle="Gestion de paquetes, pago y preparacion de envio"
        metadata="Selecciona un cliente para ver sus paquetes"
        activeRoute="customer-packages"
        compactHeader
        rightContent={renderHeaderActions()}
      >
        <AppCard>
          <AppText variant="subtitle" bold>
            Clientes con paquetes
          </AppText>
          <AppText color={theme.colors.mutedText}>
            Los paquetes se consultan por cliente porque el backend actual expone este read-model.
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
                onPress={() => router.push(`/customer-packages?customerId=${item.id}` as any)}
              />
            ))
          )}
        </AppCard>
      </AppShellPage>
    );
  }

  const renderPackage = (item: CustomerPackage) => (
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
          Paquete #{item.id} - {item.folio}
        </AppText>
        <AppText bold numberOfLines={1}>
          Cliente - {customer?.name || item.customerName || `#${item.customerId}`}
        </AppText>
      </View>
      <View style={styles.packageMeta}>
        <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
          {statusLabel(item.status)} - {getPackageNextAction(item.status)}
        </AppText>
        <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
          Creado: {formatDate(item.createdAt)}
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

  return (
    <AppShellPage
      title="Paquetes"
      subtitle="Gestion de paquetes, pago y preparacion de envio"
      metadata={customer?.name ? `Cliente: ${customer.name}` : undefined}
      activeRoute="customer-packages"
      compactHeader
      rightContent={renderHeaderActions()}
    >
      <AppCard>
        <AppText variant="subtitle" bold>
          {customer?.name || 'Cliente'}
        </AppText>
        <AppText color={theme.colors.mutedText}>{customer?.phone || 'Sin teléfono'}</AppText>
      </AppCard>

      <AppCard>
        <AppText variant="subtitle" bold>
          Paquetes abiertos
        </AppText>
        {openPackages.length === 0 ? (
          <AppText color={theme.colors.mutedText}>
            Este cliente no tiene paquetes abiertos.
          </AppText>
        ) : (
          openPackages.map(renderPackage)
        )}
      </AppCard>

      <AppCard>
        <AppText variant="subtitle" bold>
          Historial de paquetes
        </AppText>
        {historicalPackages.length === 0 ? (
          <AppText color={theme.colors.mutedText}>
            Este cliente todavía no tiene paquetes cerrados, enviados o cancelados.
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
          Crea un paquete abierto para agrupar prendas pagadas de este cliente.
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
                {customer?.name || actionsPackage.customerName || `Cliente #${actionsPackage.customerId}`}
              </AppText>
              <AppText variant="caption" color={theme.colors.mutedText}>
                {statusLabel(actionsPackage.status)} - {getPackageNextAction(actionsPackage.status)}
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
                title="Preparar para envio"
                variant="neutral"
                disabled
                disabledReason="Disponible desde el detalle cuando el paquete este pagado y listo."
              />
              <AppButton
                title="Registrar pago"
                variant="neutral"
                disabled
                disabledReason="El pago de paquete queda pendiente de flujo agregado."
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
    flex: 1.15,
    gap: 3,
    minWidth: 160,
  },
  packageMeta: {
    flex: 1,
    gap: 3,
    minWidth: 140,
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
});
