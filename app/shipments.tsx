import AppBackButton from '@/components/ui/AppBackButton';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { hasRole } from '@/services/accessControl';
import {
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

function formatDate(value?: string | null) {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function normalize(value?: string | null) {
  return (value ?? '').toLowerCase().trim();
}

export default function ShipmentsScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const [session, setSession] = useState<UserSession | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
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
      const data = await getShipmentsByBranch(currentSession.branchId);
      setShipments(data);
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

  const handleCreate = async () => {
    if (!session) return;

    if (deliveryType === 'CARRIER' && !guideReference.trim()) {
      Alert.alert('Envíos', 'Captura la guia o referencia para envíos por paqueteria.');
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

  return (
    <>
      <AppScreen>
        <AppBackButton fallbackRoute="/" />

        <AppText variant="title" bold>
          Envíos
        </AppText>

        <AppCard>
          <AppText variant="subtitle" bold>
            Logística de paquetes
          </AppText>
          <AppText color={theme.colors.mutedText}>
            Agrupa paquetes listos, despáchalos y resuelve cada entrega.
          </AppText>
        </AppCard>

        <AppButton title="+ Nuevo envío" onPress={() => setCreateModalVisible(true)} />

        <AppInput
          label="Buscar"
          value={search}
          onChangeText={setSearch}
          placeholder="Folio, estado, tipo o guía"
          autoCapitalize="none"
        />

        {isLoading ? <ActivityIndicator /> : null}

        {!isLoading && filteredShipments.length === 0 ? (
          <AppCard>
            <AppText color={theme.colors.mutedText}>No hay envíos para mostrar.</AppText>
          </AppCard>
        ) : null}

        {filteredShipments.map((shipment) => (
          <Pressable
            key={shipment.id}
            onPress={() => router.push(`/shipment-detail?id=${shipment.id}` as any)}
            style={({ pressed }) => [
              styles.rowCard,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radius.lg,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <View style={styles.rowHeader}>
              <View style={styles.flex1}>
                <AppText variant="subtitle" bold>
                  {shipment.folio}
                </AppText>
                <AppText color={theme.colors.mutedText}>
                  {shipmentDeliveryTypeLabel(shipment.deliveryType)} · {shipmentStatusLabel(shipment.status)}
                </AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  {(shipment.packageCount ?? 0) > 0
                    ? `${shipment.packageCount} paquete${shipment.packageCount === 1 ? '' : 's'}`
                    : 'Sin paquetes'}
                </AppText>
              </View>
              <AppText variant="caption" color={theme.colors.mutedText}>
                {formatDate(shipment.createdAt)}
              </AppText>
            </View>

            {shipment.guideReference ? (
              <AppText>Guía / referencia: {shipment.guideReference}</AppText>
            ) : null}

            {(shipment.packageCount ?? 0) === 0 ? (
              <AppText color={theme.colors.warning}>
                Borrador pendiente de agregar paquetes.
              </AppText>
            ) : null}

            {shipment.dispatchedAt ? (
              <AppText color={theme.colors.mutedText}>
                Despachado: {formatDate(shipment.dispatchedAt)}
              </AppText>
            ) : null}
          </Pressable>
        ))}
      </AppScreen>

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
    </>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  rowCard: {
    borderWidth: 1,
    marginTop: 12,
    padding: 14,
  },
  rowHeader: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
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
