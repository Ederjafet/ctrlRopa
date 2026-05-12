import AppBackButton from '@/components/ui/AppBackButton';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppOptionRow from '@/components/ui/AppOptionRow';
import AppScreen from '@/components/ui/AppScreen';
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
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

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

  if (isLoading) {
    return (
      <AppScreen>
        <ActivityIndicator />
      </AppScreen>
    );
  }

  if (!selectedCustomerId) {
    return (
      <AppScreen>
        <AppBackButton fallbackRoute="/" />

        <AppText variant="title" bold>
          Paquetes
        </AppText>

        <AppCard>
          <AppText variant="subtitle" bold>
            Selecciona cliente
          </AppText>
          <AppText color={theme.colors.mutedText}>
            Los paquetes se preparan por cliente para entrega o envío. Venta puerta no genera paquete porque se entrega de inmediato.
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
      </AppScreen>
    );
  }

  const renderPackage = (item: CustomerPackage) => (
    <Pressable
      key={item.id}
      onPress={() => router.push(`/customer-package-detail?id=${item.id}` as any)}
      style={({ pressed }) => [
        styles.packageRow,
        {
          borderBottomColor: theme.colors.border,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <View style={styles.packageText}>
        <AppText bold>{item.folio}</AppText>
        <AppText>Estado: {statusLabel(item.status)}</AppText>
        <AppText color={theme.colors.mutedText}>Fecha: {formatDate(item.createdAt)}</AppText>
        {item.notes ? <AppText>Notas: {item.notes}</AppText> : null}
      </View>
      <AppButton title="Ver" variant="secondary" onPress={() => router.push(`/customer-package-detail?id=${item.id}` as any)} />
    </Pressable>
  );

  return (
    <AppScreen>
      <AppBackButton fallbackRoute="/customer-packages" />

      <AppText variant="title" bold>
        Paquetes del cliente
      </AppText>

      <AppCard>
        <AppText variant="subtitle" bold>
          {customer?.name || 'Cliente'}
        </AppText>
        <AppText color={theme.colors.mutedText}>{customer?.phone || 'Sin teléfono'}</AppText>
      </AppCard>

      <AppButton title="+ Nuevo paquete" onPress={() => setCreateModalVisible(true)} />

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
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  packageRow: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  packageText: {
    marginBottom: 8,
  },
});
