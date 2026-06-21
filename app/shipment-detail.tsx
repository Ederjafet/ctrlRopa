import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppOptionRow from '@/components/ui/AppOptionRow';
import AppShellPage from '@/components/layout/AppShellPage';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { Customer, getCustomersByBranch } from '@/services/customerService';
import { CustomerAddress, getCustomerAddresses } from '@/services/customerAddressService';
import {
  CustomerPackage,
  getCustomerPackagesByCustomer,
} from '@/services/customerPackageService';
import {
  addPackageToShipment,
  cancelShipment,
  collectionStatusLabel,
  dispatchShipment,
  getShipmentDetail,
  paymentModeLabel,
  reopenShipment,
  resolveShipmentPackage,
  ShipmentDetail,
  ShipmentPackageLine,
  ShipmentPackagePaymentMode,
  ShipmentPackageStatus,
  shipmentDeliveryTypeLabel,
  shipmentPackageStatusLabel,
  shipmentStatusLabel,
} from '@/services/shipmentService';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

function money(value?: number | null) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function formatDate(value?: string | null) {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function normalize(value?: string | null) {
  return (value ?? '').toLowerCase().trim();
}

function isActiveCustomer(customer: Customer) {
  return customer.status !== 'INACTIVE' && !customer.isGeneric;
}

function isActiveAddress(address: CustomerAddress) {
  return address.status !== 'INACTIVE';
}

export default function ShipmentDetailScreen() {
  const router = useRouter();
  const { id, returnTo } = useLocalSearchParams<{
    id?: string | string[];
    returnTo?: string | string[];
  }>();
  const shipmentId = id ? Number(Array.isArray(id) ? id[0] : id) : null;
  const returnRoute = Array.isArray(returnTo) ? returnTo[0] : returnTo;
  const { theme } = useAppTheme();

  const [session, setSession] = useState<UserSession | null>(null);
  const [detail, setDetail] = useState<ShipmentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [selectedLine, setSelectedLine] = useState<ShipmentPackageLine | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [packages, setPackages] = useState<CustomerPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<CustomerPackage | null>(null);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<CustomerAddress | null>(null);
  const [paymentMode, setPaymentMode] = useState<ShipmentPackagePaymentMode>('PREPAID');
  const [expectedCodAmount, setExpectedCodAmount] = useState('');

  const [resolutionStatus, setResolutionStatus] = useState<ShipmentPackageStatus>('DELIVERED');
  const [collectedAmount, setCollectedAmount] = useState('');
  const [collectionNotes, setCollectionNotes] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [id])
  );

  const loadData = async () => {
    if (!shipmentId) {
      Alert.alert('Envío', 'No se recibió el id del envío.');
      router.replace('/shipments');
      return;
    }

    try {
      setIsLoading(true);
      const currentSession = await getSession();

      if (!currentSession) {
        router.replace('/login');
        return;
      }

      setSession(currentSession);
      const shipmentDetail = await getShipmentDetail(shipmentId);
      setDetail(shipmentDetail);
    } catch (error: any) {
      Alert.alert('Envío', error.message || 'No se pudo cargar el envío.');
    } finally {
      setIsLoading(false);
    }
  };

  const canEdit = detail?.status === 'OPEN';
  const canDispatch = detail?.status === 'OPEN' && (detail.packages?.length ?? 0) > 0;
  const canResolve = detail?.status === 'OUT_FOR_DELIVERY';
  const canCancel = detail?.status === 'OPEN';
  const canReopen = detail?.status === 'CANCELLED' || detail?.status === 'CLOSED_WITH_INCIDENTS';
  const addPackageBlockedReason = isWorking
    ? 'Espera a que termine la accion actual.'
    : !selectedPackage && !selectedAddress
      ? 'Selecciona un paquete listo y una direccion activa.'
      : !selectedPackage
        ? 'Selecciona un paquete listo.'
        : !selectedAddress
          ? 'Selecciona una direccion activa.'
          : undefined;

  const filteredCustomers = useMemo(() => {
    const term = normalize(customerSearch);
    const active = customers.filter(isActiveCustomer);
    if (!term) return active.slice(0, 25);
    return active
      .filter((customer) => `${customer.name ?? ''} ${customer.phone ?? ''}`.toLowerCase().includes(term))
      .slice(0, 25);
  }, [customers, customerSearch]);

  const readyPackages = useMemo(
    () => packages.filter((customerPackage) => customerPackage.status === 'READY'),
    [packages]
  );

  const activeAddresses = useMemo(
    () => addresses.filter(isActiveAddress),
    [addresses]
  );

  const resetAddModal = () => {
    setCustomerSearch('');
    setSelectedCustomer(null);
    setPackages([]);
    setSelectedPackage(null);
    setAddresses([]);
    setSelectedAddress(null);
    setPaymentMode('PREPAID');
    setExpectedCodAmount('');
  };

  const openAddModal = async () => {
    if (!session) return;

    try {
      setIsWorking(true);
      const customerData = await getCustomersByBranch(session.branchId);
      setCustomers(customerData);
      resetAddModal();
      setAddModalVisible(true);
    } catch (error: any) {
      Alert.alert('Envío', error.message || 'No se pudieron cargar los clientes.');
    } finally {
      setIsWorking(false);
    }
  };

  const selectCustomer = async (customer: Customer) => {
    try {
      setIsWorking(true);
      setSelectedCustomer(customer);
      setSelectedPackage(null);
      setSelectedAddress(null);

      const [packageData, addressData] = await Promise.all([
        getCustomerPackagesByCustomer(customer.id),
        getCustomerAddresses(customer.id),
      ]);

      setPackages(packageData);
      setAddresses(addressData);
    } catch (error: any) {
      Alert.alert('Envío', error.message || 'No se pudieron cargar paquetes/direcciones.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleAddPackage = async () => {
    if (!detail || !selectedPackage || !selectedAddress) {
      Alert.alert('Envío', 'Selecciona paquete y dirección.');
      return;
    }

    const expected = Number(expectedCodAmount);
    if (paymentMode === 'COD' && (!expectedCodAmount.trim() || Number.isNaN(expected) || expected <= 0)) {
      Alert.alert('Envío', 'Captura el monto contra entrega esperado.');
      return;
    }

    try {
      setIsWorking(true);
      const updated = await addPackageToShipment(detail.id, {
        customerPackageId: selectedPackage.id,
        deliveryAddressId: selectedAddress.id,
        paymentMode,
        expectedCodAmount: paymentMode === 'COD' ? expected : null,
      });

      setDetail(updated);
      setAddModalVisible(false);
      resetAddModal();
    } catch (error: any) {
      Alert.alert('Envío', error.message || 'No se pudo agregar el paquete.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleDispatch = () => {
    if (!detail || !session) return;

    Alert.alert('Despachar envío', `¿Quieres despachar el envío ${detail.folio}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Despachar',
        onPress: async () => {
          try {
            setIsWorking(true);
            const updated = await dispatchShipment(detail.id, session.userId);
            setDetail(updated);
          } catch (error: any) {
            Alert.alert('Envío', error.message || 'No se pudo despachar el envío.');
          } finally {
            setIsWorking(false);
          }
        },
      },
    ]);
  };

  const handleCancel = () => {
    if (!detail || !session) return;

    Alert.alert('Cancelar envío', `¿Quieres cancelar el envío ${detail.folio}?`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Cancelar envío',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsWorking(true);
            const updated = await cancelShipment(detail.id, session.userId);
            setDetail(updated);
          } catch (error: any) {
            Alert.alert('Envío', error.message || 'No se pudo cancelar el envío.');
          } finally {
            setIsWorking(false);
          }
        },
      },
    ]);
  };

  const handleReopen = () => {
    if (!detail || !session) return;

    Alert.alert('Reabrir envío', `¿Quieres reabrir el envío ${detail.folio}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Reabrir',
        onPress: async () => {
          try {
            setIsWorking(true);
            const updated = await reopenShipment(detail.id, session.userId);
            setDetail(updated);
          } catch (error: any) {
            Alert.alert('Envío', error.message || 'No se pudo reabrir el envío.');
          } finally {
            setIsWorking(false);
          }
        },
      },
    ]);
  };

  const openResolveModal = (line: ShipmentPackageLine, status: ShipmentPackageStatus) => {
    setSelectedLine(line);
    setResolutionStatus(status);
    setCollectedAmount(
      line.paymentMode === 'COD' && status === 'DELIVERED'
        ? String(line.expectedCollectionAmount ?? '')
        : '0'
    );
    setCollectionNotes('');
    setResolveModalVisible(true);
  };

  const handleResolve = async () => {
    if (!detail || !session || !selectedLine) return;

    const amount = collectedAmount.trim() ? Number(collectedAmount) : 0;
    if (Number.isNaN(amount) || amount < 0) {
      Alert.alert('Entrega', 'Captura un monto cobrado válido.');
      return;
    }

    if (selectedLine.paymentMode === 'COD' && resolutionStatus === 'DELIVERED' && amount <= 0) {
      Alert.alert('Entrega', 'El cobro contra entrega debe ser mayor a 0.');
      return;
    }

    try {
      setIsWorking(true);
      const updated = await resolveShipmentPackage(detail.id, selectedLine.id, {
        status: resolutionStatus,
        collectedAmount: amount,
        collectionNotes: collectionNotes.trim() || null,
        deliveryConfirmedByUserId: session.userId,
      });

      setDetail(updated);
      setResolveModalVisible(false);
      setSelectedLine(null);
    } catch (error: any) {
      Alert.alert('Entrega', error.message || 'No se pudo resolver la entrega.');
    } finally {
      setIsWorking(false);
    }
  };

  if (isLoading) {
    return (
      <AppShellPage
        title="Detalle de envio"
        subtitle="Paquetes y entrega"
        activeRoute="shipments"
        compactHeader
      >
        <ActivityIndicator />
      </AppShellPage>
    );
  }

  if (!detail) {
    return (
      <AppShellPage
        title="Detalle de envio"
        subtitle="Paquetes y entrega"
        activeRoute="shipments"
        compactHeader
        rightContent={
          <AppButton
            title="Volver"
            variant="secondary"
            onPress={() => router.replace((returnRoute || '/shipments') as any)}
          />
        }
      >
        <AppText>No se encontró el envío.</AppText>
      </AppShellPage>
    );
  }

  return (
    <>
      <AppShellPage
        title={`Envio ${detail.folio}`}
        subtitle="Paquetes y entrega"
        activeRoute="shipments"
        compactHeader
        rightContent={
          <AppButton
            title="Volver"
            variant="secondary"
            onPress={() => router.replace((returnRoute || '/shipments') as any)}
          />
        }
      >
        <AppCard>
          <AppText variant="subtitle" bold>
            Información
          </AppText>
          <AppText>Estado: {shipmentStatusLabel(detail.status)}</AppText>
          <AppText>Tipo: {shipmentDeliveryTypeLabel(detail.deliveryType)}</AppText>
          {detail.guideReference ? <AppText>Guía: {detail.guideReference}</AppText> : null}
          <AppText color={theme.colors.mutedText}>Creado: {formatDate(detail.createdAt)}</AppText>
          {detail.dispatchedAt ? (
            <AppText color={theme.colors.mutedText}>Despachado: {formatDate(detail.dispatchedAt)}</AppText>
          ) : null}
        </AppCard>

        <View style={styles.actionStack}>
          {canEdit ? <AppButton title="Agregar paquete" onPress={openAddModal} loading={isWorking} /> : null}
          {canDispatch ? <AppButton title="Despachar envío" onPress={handleDispatch} loading={isWorking} /> : null}
          {canCancel ? <AppButton title="Cancelar envío" variant="danger" onPress={handleCancel} loading={isWorking} /> : null}
          {canReopen ? <AppButton title="Reabrir envío" onPress={handleReopen} loading={isWorking} /> : null}
        </View>

        <AppCard>
          <AppText variant="subtitle" bold>
            Paquetes
          </AppText>

          {detail.packages.length === 0 ? (
            <AppText color={theme.colors.mutedText}>Este envío todavía no tiene paquetes.</AppText>
          ) : (
            detail.packages.map((line) => (
              <View key={line.id} style={[styles.packageLine, { borderBottomColor: theme.colors.border }]}> 
                <AppText bold>{line.customerPackageFolio || `Paquete #${line.customerPackageId}`}</AppText>
                <AppText>Cliente: {line.customerName || `#${line.customerId}`}</AppText>
                <AppText>Dirección: {line.deliveryAddressLabel || `#${line.deliveryAddressId}`}</AppText>
                <AppText>Pago: {paymentModeLabel(line.paymentMode)}</AppText>
                {line.paymentMode === 'COD' ? (
                  <AppText>Contra entrega esperado: {money(line.expectedCollectionAmount)}</AppText>
                ) : null}
                <AppText>Estado: {shipmentPackageStatusLabel(line.status)}</AppText>

                {line.status !== 'PENDING' ? (
                  <>
                    <AppText>Cobrado: {money(line.collectedAmount)}</AppText>
                    <AppText>Diferencia: {money(line.collectionDifference)}</AppText>
                    <AppText>Resultado cobro: {collectionStatusLabel(line.collectionStatus)}</AppText>
                    {line.collectionNotes ? <AppText>Notas: {line.collectionNotes}</AppText> : null}
                  </>
                ) : null}

                {canResolve && line.status === 'PENDING' ? (
                  <View style={styles.resolveButtons}>
                    <View style={styles.resolveButton}>
                      <AppButton title="Entregado" onPress={() => openResolveModal(line, 'DELIVERED')} />
                    </View>
                    <View style={styles.resolveButton}>
                      <AppButton title="No entregado" variant="secondary" onPress={() => openResolveModal(line, 'NOT_DELIVERED')} />
                    </View>
                    <View style={styles.resolveButton}>
                      <AppButton title="Devuelto" variant="secondary" onPress={() => openResolveModal(line, 'RETURNED')} />
                    </View>
                  </View>
                ) : null}
              </View>
            ))
          )}
        </AppCard>
      </AppShellPage>

      <AppBottomModal
        visible={addModalVisible}
        title="Agregar paquete al envío"
        onClose={() => setAddModalVisible(false)}
        maxHeight="90%"
      >
        <AppText bold>Cliente</AppText>
        {selectedCustomer ? (
          <AppCard>
            <AppText bold>{selectedCustomer.name}</AppText>
            <AppText color={theme.colors.mutedText}>{selectedCustomer.phone || 'Sin teléfono'}</AppText>
            <AppButton title="Cambiar cliente" variant="secondary" onPress={() => setSelectedCustomer(null)} />
          </AppCard>
        ) : (
          <>
            <AppInput placeholder="Buscar cliente" value={customerSearch} onChangeText={setCustomerSearch} />
            {filteredCustomers.map((customer) => (
              <AppOptionRow
                key={customer.id}
                title={customer.name}
                subtitle={customer.phone || 'Sin teléfono'}
                onPress={() => selectCustomer(customer)}
              />
            ))}
          </>
        )}

        {selectedCustomer ? (
          <>
            <AppText bold style={styles.modalSectionTitle}>Paquete listo</AppText>
            {readyPackages.length === 0 ? (
              <AppText color={theme.colors.mutedText}>Este cliente no tiene paquetes READY.</AppText>
            ) : (
              readyPackages.map((customerPackage) => (
                <AppOptionRow
                  key={customerPackage.id}
                  title={customerPackage.folio}
                  subtitle={`Estado: ${customerPackage.status}`}
                  onPress={() => setSelectedPackage(customerPackage)}
                >
                  {selectedPackage?.id === customerPackage.id ? <AppText bold>Seleccionado</AppText> : null}
                </AppOptionRow>
              ))
            )}

            <AppText bold style={styles.modalSectionTitle}>Dirección</AppText>
            {activeAddresses.length === 0 ? (
              <AppText color={theme.colors.mutedText}>Este cliente no tiene direcciones activas.</AppText>
            ) : (
              activeAddresses.map((address) => (
                <AppOptionRow
                  key={address.id}
                  title={address.label}
                  subtitle={`${address.line1}${address.city ? ` · ${address.city}` : ''}`}
                  onPress={() => setSelectedAddress(address)}
                >
                  {selectedAddress?.id === address.id ? <AppText bold>Seleccionada</AppText> : null}
                </AppOptionRow>
              ))
            )}

            <AppText bold style={styles.modalSectionTitle}>Modo de cobro</AppText>
            <View style={styles.typeRow}>
              <Pressable
                onPress={() => setPaymentMode('PREPAID')}
                style={({ pressed }) => [
                  styles.typeOption,
                  {
                    borderColor: paymentMode === 'PREPAID' ? theme.colors.accent : theme.colors.border,
                    backgroundColor: paymentMode === 'PREPAID' ? theme.colors.optionPressedBackground : theme.colors.surface,
                    borderRadius: theme.radius.md,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <AppText bold>Pagado</AppText>
              </Pressable>

              <Pressable
                onPress={() => setPaymentMode('COD')}
                style={({ pressed }) => [
                  styles.typeOption,
                  {
                    borderColor: paymentMode === 'COD' ? theme.colors.accent : theme.colors.border,
                    backgroundColor: paymentMode === 'COD' ? theme.colors.optionPressedBackground : theme.colors.surface,
                    borderRadius: theme.radius.md,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <AppText bold>Contra entrega</AppText>
              </Pressable>
            </View>

            {paymentMode === 'COD' ? (
              <AppInput
                label="Monto esperado COD"
                value={expectedCodAmount}
                onChangeText={setExpectedCodAmount}
                keyboardType="numeric"
                placeholder="0.00"
              />
            ) : null}

            <AppButton
              title={isWorking ? 'Agregando...' : 'Agregar paquete'}
              onPress={handleAddPackage}
              loading={isWorking}
              disabled={isWorking || !selectedPackage || !selectedAddress}
              disabledReason={addPackageBlockedReason}
            />
          </>
        ) : null}
      </AppBottomModal>

      <AppBottomModal
        visible={resolveModalVisible}
        title="Resolver entrega"
        onClose={() => setResolveModalVisible(false)}
      >
        <AppText bold>
          {selectedLine?.customerPackageFolio || 'Paquete'} · {shipmentPackageStatusLabel(resolutionStatus)}
        </AppText>

        <AppInput
          label="Monto cobrado"
          value={collectedAmount}
          onChangeText={setCollectedAmount}
          keyboardType="numeric"
          placeholder="0.00"
        />

        <AppInput
          label="Notas"
          value={collectionNotes}
          onChangeText={setCollectionNotes}
          placeholder="Notas de entrega/cobro"
          multiline
        />

        <AppButton
          title={isWorking ? 'Guardando...' : 'Confirmar'}
          onPress={handleResolve}
          loading={isWorking}
          disabled={isWorking}
        />
      </AppBottomModal>
    </>
  );
}

const styles = StyleSheet.create({
  actionStack: {
    gap: 10,
  },
  modalSectionTitle: {
    marginTop: 14,
  },
  packageLine: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  resolveButton: {
    flex: 1,
    minWidth: 130,
  },
  resolveButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  typeOption: {
    alignItems: 'center',
    borderWidth: 1,
    flex: 1,
    padding: 12,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    marginTop: 8,
  },
});
