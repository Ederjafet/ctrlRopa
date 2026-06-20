import AppShellPage from '@/components/layout/AppShellPage';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
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
  const [actionsShipment, setActionsShipment] = useState<Shipment | null>(null);
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

  const renderHeaderActions = () => (
    <View style={styles.headerActions}>
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
          placeholder="Folio, estado, tipo o guía"
          autoCapitalize="none"
        />

        {isLoading ? <ActivityIndicator /> : null}

        {!isLoading && filteredShipments.length === 0 ? (
          <AppCard>
            <AppText color={theme.colors.mutedText}>
              No hay envíos pendientes. Los paquetes listos para enviar aparecerán aquí.
            </AppText>
          </AppCard>
        ) : null}

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
