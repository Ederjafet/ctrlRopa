import AppShellPage from '@/components/layout/AppShellPage';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import ScreenPermissionHeaderAction from '@/components/ui/ScreenPermissionHeaderAction';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { hasRole } from '@/services/accessControl';
import {
  CustomerPackageDetail,
  getReadyCustomerPackagesForShipment,
} from '@/services/customerPackageService';
import {
  addPackageToShipment,
  createShipment,
  getShipmentsByBranch,
  Shipment,
  ShipmentDeliveryType,
  shipmentDeliveryTypeLabel,
  shipmentStatusLabel,
} from '@/services/shipmentService';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

function money(value?: number | null) {
  return `$${Number(value ?? 0).toFixed(2)} MXN`;
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

function packageDeliveryTypeLabel(type?: string | null) {
  if (type === 'PARCEL_SERVICE') return 'Paqueteria';
  if (type === 'LOCAL_DELIVERY') return 'Entrega local';
  if (type === 'STORE_PICKUP') return 'Recoleccion en tienda';
  if (type === 'CUSTOMER_PROVIDED_LABEL') return 'Cliente envia guia';
  if (type === 'COLLECT_SHIPPING') return 'Envio por cobrar';
  return type || 'Sin tipo';
}

function formatPackageAddress(customerPackage?: CustomerPackageDetail | null) {
  const parts = [
    customerPackage?.shipToLine1,
    customerPackage?.shipToLine2,
    customerPackage?.shipToCity,
    customerPackage?.shipToState,
    customerPackage?.shipToPostalCode,
    customerPackage?.shipToCountry,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Sin direccion';
}

export default function ShipmentsScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const [session, setSession] = useState<UserSession | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [readyPackages, setReadyPackages] = useState<CustomerPackageDetail[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isPreparingPackage, setIsPreparingPackage] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [prepareModalVisible, setPrepareModalVisible] = useState(false);
  const [actionsShipment, setActionsShipment] = useState<Shipment | null>(null);
  const [selectedReadyPackage, setSelectedReadyPackage] = useState<CustomerPackageDetail | null>(null);
  const [deliveryType, setDeliveryType] = useState<ShipmentDeliveryType>('LOCAL');
  const [guideReference, setGuideReference] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
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
      const [shipmentData, readyPackageData] = await Promise.all([
        getShipmentsByBranch(currentSession.branchId),
        getReadyCustomerPackagesForShipment(currentSession.branchId),
      ]);
      setShipments(shipmentData);
      setReadyPackages(readyPackageData);
    } catch (error: any) {
      Alert.alert('Envíos', error.message || 'No se pudieron cargar los envíos.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredShipments = useMemo(() => {
    const term = normalize(search);
    const visibleShipments = hasRole(session, 'COURIER')
      ? shipments.filter((shipment) => shipment.status === 'OUT_FOR_DELIVERY')
      : shipments;

    if (!term) return visibleShipments;

    return visibleShipments.filter((shipment) => {
      const text = `${shipment.folio ?? ''} ${shipment.status ?? ''} ${shipment.deliveryType ?? ''} ${shipment.guideReference ?? ''}`.toLowerCase();
      return text.includes(term);
    });
  }, [session, shipments, search]);

  const filteredReadyPackages = useMemo(() => {
    if (hasRole(session, 'COURIER')) return [];
    const term = normalize(search);

    if (!term) return readyPackages;

    return readyPackages.filter((customerPackage) => {
      const text = `${customerPackage.folio ?? ''} ${customerPackage.customerName ?? ''} ${customerPackage.status ?? ''} ${customerPackage.shippingCarrier ?? ''} ${customerPackage.trackingNumber ?? ''}`.toLowerCase();
      return text.includes(term);
    });
  }, [session, readyPackages, search]);

  const handleCreate = async () => {
    if (!session) return;

    if (deliveryType === 'CARRIER' && !guideReference.trim()) {
      Alert.alert('Envíos', 'Captura la guía o referencia para envíos por paquetería.');
      return;
    }

    try {
      setIsCreating(true);
      const created = await createShipment({
        branchId: session.branchId,
        deliveryType,
        guideReference: guideReference.trim() || null,
        createdByUserId: session.userId,
      });

      setCreateModalVisible(false);
      setGuideReference('');
      setDeliveryType('LOCAL');
      router.push(`/shipment-detail?id=${created.id}` as any);
    } catch (error: any) {
      Alert.alert('Envíos', error.message || 'No se pudo crear el envío.');
    } finally {
      setIsCreating(false);
    }
  };

  const openPreparePackageModal = (customerPackage: CustomerPackageDetail) => {
    setSelectedReadyPackage(customerPackage);
    setDeliveryType(customerPackage.deliveryType === 'PARCEL_SERVICE' ? 'CARRIER' : 'LOCAL');
    setGuideReference(customerPackage.trackingNumber?.trim() || '');
    setPrepareModalVisible(true);
  };

  const handlePrepareReadyPackage = async () => {
    if (!session || !selectedReadyPackage) return;

    if (deliveryType === 'CARRIER' && !guideReference.trim()) {
      Alert.alert('Envios', 'Captura la guia o referencia para envios por paqueteria.');
      return;
    }

    try {
      setIsPreparingPackage(true);
      const created = await createShipment({
        branchId: session.branchId,
        deliveryType,
        guideReference: guideReference.trim() || null,
        createdByUserId: session.userId,
      });

      const detail = await addPackageToShipment(created.id, {
        customerPackageId: selectedReadyPackage.id,
        deliveryAddressId: selectedReadyPackage.sourceCustomerAddressId ?? null,
        paymentMode: 'PREPAID',
        expectedCodAmount: null,
      });

      setPrepareModalVisible(false);
      setSelectedReadyPackage(null);
      setGuideReference('');
      setDeliveryType('LOCAL');
      await loadData();
      router.push(`/shipment-detail?id=${detail.id}` as any);
    } catch (error: any) {
      Alert.alert('Envios', error.message || 'No se pudo preparar el envio del paquete.');
      await loadData();
    } finally {
      setIsPreparingPackage(false);
    }
  };

  const renderHeaderActions = () => (
    <View style={styles.headerActions}>
      <ScreenPermissionHeaderAction
        screenKey="shipments"
        screenTitle="Envios"
        session={session}
        buttonStyle={styles.headerButton}
      />
      <AppButton
        title="Nuevo envío"
        onPress={() => setCreateModalVisible(true)}
        style={styles.headerButton}
      />
    </View>
  );

  return (
    <>
      <AppShellPage
        title="Envíos"
        subtitle="Seguimiento de paquetes listos para enviar"
        activeRoute="shipments"
        session={session}
        compactHeader
        rightContent={renderHeaderActions()}
      >
        <View style={styles.kpiRow}>
          <View
            style={[
              styles.kpiPill,
              {
                backgroundColor: theme.colors.surfaceAlt,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <AppText variant="caption" color={theme.colors.mutedText} bold>
              Listos por preparar: {readyPackages.length}
            </AppText>
          </View>
          <View
            style={[
              styles.kpiPill,
              {
                backgroundColor: theme.colors.surfaceAlt,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <AppText variant="caption" color={theme.colors.mutedText} bold>
              Envíos: {shipments.length}
            </AppText>
          </View>
          <View
            style={[
              styles.kpiPill,
              {
                backgroundColor: theme.colors.surfaceAlt,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <AppText variant="caption" color={theme.colors.mutedText} bold>
              En ruta: {shipments.filter((shipment) => shipment.status === 'OUT_FOR_DELIVERY').length}
            </AppText>
          </View>
        </View>

        <AppInput
          label="Buscar"
          value={search}
          onChangeText={setSearch}
          placeholder="Folio, cliente, estado, tipo o guia"
          autoCapitalize="none"
        />

        {isLoading ? <ActivityIndicator /> : null}

        {!isLoading && filteredShipments.length === 0 && filteredReadyPackages.length === 0 ? (
          <AppCard>
            <AppText color={theme.colors.mutedText}>
              No hay envíos pendientes. Los paquetes listos para enviar aparecerán aquí.
            </AppText>
          </AppCard>
        ) : null}

        {filteredReadyPackages.map((customerPackage) => (
          <View
            key={`ready-${customerPackage.id}`}
            style={[
              styles.rowCard,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            <View style={styles.shipmentIdentity}>
              <AppText variant="caption" color={theme.colors.warning} numberOfLines={1}>
                Pendiente de preparar envio
              </AppText>
              <AppText bold numberOfLines={1}>
                {customerPackage.folio} · {customerPackage.customerName || `Cliente #${customerPackage.customerId}`}
              </AppText>
            </View>

            <View style={styles.shipmentMeta}>
              <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
                {customerPackage.totalItems ?? 0} prenda{customerPackage.totalItems === 1 ? '' : 's'} · Total {money(customerPackage.totalAmount)}
              </AppText>
              <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
                Envio: {customerPackage.shippingCostWaived ? 'Sin costo' : money(customerPackage.shippingCostAmount)}
              </AppText>
            </View>

            <View style={styles.shipmentActions}>
              <View style={styles.shipmentDateBlock}>
                <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
                  Listo: {formatDate(customerPackage.closedAt || customerPackage.createdAt)}
                </AppText>
                <AppText variant="caption" color={theme.colors.success} numberOfLines={1}>
                  Saldo cubierto
                </AppText>
              </View>
              <AppButton
                title="Preparar"
                onPress={() => openPreparePackageModal(customerPackage)}
                loading={isPreparingPackage && selectedReadyPackage?.id === customerPackage.id}
                disabled={isPreparingPackage}
                style={styles.compactButton}
              />
              <AppButton
                title="Paquete"
                variant="secondary"
                onPress={() => router.push(`/customer-package-detail?id=${customerPackage.id}` as any)}
                style={styles.compactButton}
              />
            </View>
          </View>
        ))}

        {filteredShipments.map((shipment) => (
          <View
            key={shipment.id}
            style={[
              styles.rowCard,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            <View style={styles.shipmentIdentity}>
              <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
                Envío #{shipment.id} · {shipment.folio}
              </AppText>
              <AppText bold numberOfLines={1}>
                {shipmentDeliveryTypeLabel(shipment.deliveryType)} · {shipmentStatusLabel(shipment.status)}
              </AppText>
            </View>

            <View style={styles.shipmentMeta}>
              <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
                {(shipment.packageCount ?? 0) > 0
                  ? `${shipment.packageCount} paquete${shipment.packageCount === 1 ? '' : 's'}`
                  : 'Sin paquetes'}
              </AppText>
              <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
                {shipment.guideReference ? `Guía: ${shipment.guideReference}` : 'Sin guía'}
              </AppText>
            </View>

            <View style={styles.shipmentActions}>
              <View style={styles.shipmentDateBlock}>
                <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
                  {shipment.dispatchedAt ? `Despachado: ${formatDate(shipment.dispatchedAt)}` : formatDate(shipment.createdAt)}
                </AppText>
                {(shipment.packageCount ?? 0) === 0 ? (
                  <AppText variant="caption" color={theme.colors.warning} numberOfLines={1}>
                    Pendiente: agregar paquetes
                  </AppText>
                ) : null}
              </View>
              <AppButton
                title="Detalle"
                variant="secondary"
                onPress={() => router.push(`/shipment-detail?id=${shipment.id}` as any)}
                style={styles.compactButton}
              />
              <AppButton
                title="Más"
                variant="secondary"
                onPress={() => setActionsShipment(shipment)}
                style={styles.compactButton}
              />
            </View>
          </View>
        ))}
      </AppShellPage>

      <AppBottomModal
        visible={createModalVisible}
        title="Nuevo envío"
        onClose={() => setCreateModalVisible(false)}
      >
        <AppText bold>Tipo de entrega</AppText>
        <View style={styles.typeRow}>
          <Pressable
            onPress={() => setDeliveryType('LOCAL')}
            style={({ pressed }) => [
              styles.typeOption,
              {
                borderColor: deliveryType === 'LOCAL' ? theme.colors.accent : theme.colors.border,
                backgroundColor: deliveryType === 'LOCAL' ? theme.colors.optionPressedBackground : theme.colors.surface,
                borderRadius: theme.radius.md,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <AppText bold>Local</AppText>
          </Pressable>

          <Pressable
            onPress={() => setDeliveryType('CARRIER')}
            style={({ pressed }) => [
              styles.typeOption,
              {
                borderColor: deliveryType === 'CARRIER' ? theme.colors.accent : theme.colors.border,
                backgroundColor: deliveryType === 'CARRIER' ? theme.colors.optionPressedBackground : theme.colors.surface,
                borderRadius: theme.radius.md,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <AppText bold>Paquetería</AppText>
          </Pressable>
        </View>

        <AppInput
          label="Guía / referencia"
          value={guideReference}
          onChangeText={setGuideReference}
          placeholder={deliveryType === 'CARRIER' ? 'Obligatoria para paqueteria' : 'Opcional'}
          autoCapitalize="characters"
        />

        <AppButton
          title={isCreating ? 'Creando...' : 'Crear envío'}
          onPress={handleCreate}
          loading={isCreating}
          disabled={isCreating}
        />
      </AppBottomModal>

      <AppBottomModal
        visible={prepareModalVisible}
        title={selectedReadyPackage ? `Preparar ${selectedReadyPackage.folio}` : 'Preparar envio'}
        onClose={() => {
          if (isPreparingPackage) return;
          setPrepareModalVisible(false);
          setSelectedReadyPackage(null);
        }}
        maxHeight="90%"
      >
        {selectedReadyPackage ? (
          <View style={styles.modalActionsStack}>
            <AppCard>
              <AppText bold>{selectedReadyPackage.customerName || `Cliente #${selectedReadyPackage.customerId}`}</AppText>
              <AppText color={theme.colors.mutedText}>
                Total {money(selectedReadyPackage.totalAmount)} · Envio {selectedReadyPackage.shippingCostWaived ? 'sin costo' : money(selectedReadyPackage.shippingCostAmount)}
              </AppText>
            </AppCard>

            <AppText bold>Direccion de entrega</AppText>
            <AppCard>
              <AppText bold>{packageDeliveryTypeLabel(selectedReadyPackage.deliveryType)}</AppText>
              <AppText color={theme.colors.mutedText}>
                Recibe: {selectedReadyPackage.shipToName || selectedReadyPackage.customerName || 'No aplica'}
              </AppText>
              <AppText color={theme.colors.mutedText}>
                Telefono: {selectedReadyPackage.shipToPhone || selectedReadyPackage.customerPhone || 'No aplica'}
              </AppText>
              <AppText color={theme.colors.mutedText}>
                {formatPackageAddress(selectedReadyPackage)}
              </AppText>
              {selectedReadyPackage.shipToReferences ? (
                <AppText color={theme.colors.mutedText}>Referencias: {selectedReadyPackage.shipToReferences}</AppText>
              ) : null}
            </AppCard>

            <AppText bold>Tipo de entrega</AppText>
            <View style={styles.typeRow}>
              <Pressable
                onPress={() => setDeliveryType('LOCAL')}
                style={({ pressed }) => [
                  styles.typeOption,
                  {
                    borderColor: deliveryType === 'LOCAL' ? theme.colors.accent : theme.colors.border,
                    backgroundColor: deliveryType === 'LOCAL' ? theme.colors.optionPressedBackground : theme.colors.surface,
                    borderRadius: theme.radius.md,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <AppText bold>Local</AppText>
              </Pressable>

              <Pressable
                onPress={() => setDeliveryType('CARRIER')}
                style={({ pressed }) => [
                  styles.typeOption,
                  {
                    borderColor: deliveryType === 'CARRIER' ? theme.colors.accent : theme.colors.border,
                    backgroundColor: deliveryType === 'CARRIER' ? theme.colors.optionPressedBackground : theme.colors.surface,
                    borderRadius: theme.radius.md,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <AppText bold>Paqueteria</AppText>
              </Pressable>
            </View>

            <AppInput
              label="Guia / referencia"
              value={guideReference}
              onChangeText={setGuideReference}
              placeholder={deliveryType === 'CARRIER' ? 'Obligatoria para paqueteria' : 'Opcional'}
              autoCapitalize="characters"
            />

            <AppButton
              title={isPreparingPackage ? 'Preparando...' : 'Crear envio y abrir detalle'}
              onPress={handlePrepareReadyPackage}
              loading={isPreparingPackage}
              disabled={isPreparingPackage}
            />
          </View>
        ) : null}
      </AppBottomModal>

      <AppBottomModal
        visible={Boolean(actionsShipment)}
        title={actionsShipment ? `Envío ${actionsShipment.folio}` : 'Envío'}
        onClose={() => setActionsShipment(null)}
      >
        {actionsShipment ? (
          <View style={styles.modalActionsStack}>
            <AppButton
              title="Detalle"
              variant="secondary"
              onPress={() => {
                const id = actionsShipment.id;
                setActionsShipment(null);
                router.push(`/shipment-detail?id=${id}` as any);
              }}
            />
            <AppButton
              title="Gestionar paquetes"
              variant="operation"
              onPress={() => {
                const id = actionsShipment.id;
                setActionsShipment(null);
                router.push(`/shipment-detail?id=${id}` as any);
              }}
            />
            <AppButton
              title="Marcar enviado"
              variant="neutral"
              disabled
              disabledReason="Disponible desde el detalle cuando el envío tenga paquetes listos."
            />
          </View>
        ) : null}
      </AppBottomModal>
    </>
  );
}

const styles = StyleSheet.create({
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
  kpiPill: {
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 30,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  modalActionsStack: {
    gap: 8,
  },
  rowCard: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
    padding: 12,
  },
  shipmentActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-end',
    minWidth: 220,
  },
  shipmentDateBlock: {
    alignItems: 'flex-end',
    gap: 2,
    minWidth: 130,
  },
  shipmentIdentity: {
    flex: 1.15,
    gap: 3,
    minWidth: 160,
  },
  shipmentMeta: {
    flex: 1,
    gap: 3,
    minWidth: 140,
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
