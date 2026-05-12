import AppBackButton from '@/components/ui/AppBackButton';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppOptionRow from '@/components/ui/AppOptionRow';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';

import { Box, getActiveBoxesByBranch } from '@/services/boxService';
import {
  assignReservationToBox,
  getReservationsByBranch,
  getReservationsWithoutBox,
  type Reservation,
} from '@/services/reservationService';
import { getSession } from '@/services/sessionStorage';

import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

type ReservationFilter = 'ACTIVE' | 'WITHOUT_BOX';

function getReservationStatusLabel(status?: string) {
  switch (status) {
    case 'ACTIVE':
      return 'Activa';
    case 'CANCELLED':
      return 'Cancelada';
    case 'COMPLETED':
      return 'Completada';
    case 'CONVERTED_TO_SALE':
      return 'Convertida a venta';
    default:
      return status || 'Sin estado';
  }
}

function getSalesChannelLabel(code?: string | null, name?: string | null) {
  if (name) return name;

  switch (code) {
    case 'LIVE':
      return 'Live';
    case 'DOOR_RESERVATION':
      return 'Apartado puerta';
    case 'DOOR_SALE':
      return 'Venta puerta';
    case 'CONSIGNMENT':
      return 'Consignacion';
    default:
      return code || '';
  }
}

function getLiveLabel(reservation: Reservation) {
  if (!reservation.liveId) return '';

  const notes = reservation.liveNotes?.trim();
  return notes ? `Live #${reservation.liveId} - ${notes}` : `Live #${reservation.liveId}`;
}

function formatMoney(value?: number | null) {
  if (value === null || value === undefined) return '$0.00';
  return `$${Number(value).toFixed(2)}`;
}

export default function ReservationsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string | string[] }>();
  const { theme } = useAppTheme();
  const returnTo = Array.isArray(params.returnTo) ? params.returnTo[0] : params.returnTo;
  const isLiveContext = returnTo === '/live';

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ReservationFilter>('ACTIVE');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAssigningBox, setIsAssigningBox] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isBoxModalVisible, setIsBoxModalVisible] = useState(false);

  const loadReservations = useCallback(
    async (refreshing = false, nextFilter: ReservationFilter = filter) => {
      const session = await getSession();

      if (!session?.branchId) {
        setReservations([]);
        setBoxes([]);
        setErrorMessage('No se encontró sucursal activa en la sesión.');
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      try {
        setErrorMessage('');

        if (refreshing) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        const [reservationData, boxData] = await Promise.all([
          nextFilter === 'WITHOUT_BOX'
            ? getReservationsWithoutBox(session.branchId)
            : getReservationsByBranch(session.branchId),
          getActiveBoxesByBranch(session.branchId),
        ]);

        const active = reservationData.filter((reservation) => {
          if (!reservation.status) return true;
          return reservation.status === 'ACTIVE';
        });

        setReservations(active);
        setBoxes(boxData);
      } catch (error) {
        console.log('Error cargando reservaciones', error);
        setErrorMessage('No se pudieron cargar los apartados.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [filter]
  );

  useFocusEffect(
    useCallback(() => {
      loadReservations(false);
    }, [loadReservations])
  );

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return reservations;

    return reservations.filter((reservation) => {
      const content = `
        ${reservation.id ?? ''}
        ${reservation.itemCode ?? ''}
        ${reservation.customerName ?? ''}
        ${reservation.status ?? ''}
                ${reservation.salesChannelName ?? ''}
        ${reservation.liveId ?? ''}
        ${reservation.liveNotes ?? ''}
        ${reservation.boxCode ?? ''}
      `.toLowerCase();

      return content.includes(query);
    });
  }, [reservations, search]);

  const changeFilter = (nextFilter: ReservationFilter) => {
    setFilter(nextFilter);
    loadReservations(false, nextFilter);
  };

  const openBoxModal = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsBoxModalVisible(true);
  };

  const closeBoxModal = () => {
    if (isAssigningBox) return;
    setIsBoxModalVisible(false);
    setSelectedReservation(null);
  };

  const handleAssignBox = async (box: Box) => {
    if (!selectedReservation) return;

    try {
      setIsAssigningBox(true);
      await assignReservationToBox(selectedReservation.id, box.id);
      Alert.alert('Caja', `Apartado asignado a ${box.code}.`);
      setIsBoxModalVisible(false);
      setSelectedReservation(null);
      await loadReservations(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo asignar la caja.');
    } finally {
      setIsAssigningBox(false);
    }
  };

  if (isLoading) {
    return (
      <AppScreen scroll={false}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator />
          <AppText style={styles.loadingText}>Cargando apartados...</AppText>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen scroll={false}>
      <AppBackButton fallbackRoute={returnTo || '/'} />

      <View style={styles.header}>
        <AppText variant="title" bold>
          Apartados / Reservas
        </AppText>
        <AppText variant="caption">
          Reservas activas de la sucursal
        </AppText>
      </View>

      {isLiveContext ? (
        <AppButton
          title="Volver al live activo"
          variant="secondary"
          onPress={() => router.replace('/live' as any)}
          style={styles.liveReturnButton}
        />
      ) : null}

      <View style={styles.filterRow}>
        <AppButton
          title="Activas"
          variant={filter === 'ACTIVE' ? 'primary' : 'secondary'}
          onPress={() => changeFilter('ACTIVE')}
          style={styles.filterButton}
        />
        <AppButton
          title="Sin caja"
          variant={filter === 'WITHOUT_BOX' ? 'primary' : 'secondary'}
          onPress={() => changeFilter('WITHOUT_BOX')}
          style={styles.filterButton}
        />
      </View>

      <AppInput
        placeholder="Buscar por cliente, prenda, caja o canal"
        value={search}
        onChangeText={setSearch}
      />

      {errorMessage ? (
        <AppCard>
          <AppText>{errorMessage}</AppText>
          <AppButton
            title="Reintentar"
            variant="secondary"
            onPress={() => loadReservations(false)}
            style={styles.retryButton}
          />
        </AppCard>
      ) : null}

      <FlatList
        style={styles.list}
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/reservation-detail',
                params: { id: String(item.id), returnTo: returnTo || '/reservations' },
              })
            }
          >
            <AppCard>
              <View style={styles.cardHeader}>
                <AppText bold>Apartado #{item.id}</AppText>
                <AppText bold>{getReservationStatusLabel(item.status)}</AppText>
              </View>

              <AppText>
                Cliente: {item.customerName || `ID ${item.customerId}`}
              </AppText>

              <AppText>
                Prenda: {item.itemCode || `ID ${item.itemId}`}
              </AppText>

              {getSalesChannelLabel(item.salesChannelCode, item.salesChannelName) ? (
                <AppText>
                  Canal: {getSalesChannelLabel(item.salesChannelCode, item.salesChannelName)}
                </AppText>
              ) : null}

              {item.liveId ? (
                <AppText>
                  Live: {getLiveLabel(item)}
                </AppText>
              ) : null}

              <AppText>Caja: {item.boxCode || 'Sin caja'}</AppText>

              <View style={styles.row}>
                <AppText bold>{formatMoney(item.price)}</AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  Tocar para ver detalle
                </AppText>
              </View>

              {!item.boxId ? (
                <AppButton
                  title="Asignar caja"
                  variant="secondary"
                  onPress={() => openBoxModal(item)}
                  style={styles.assignButton}
                />
              ) : null}
            </AppCard>
          </Pressable>
        )}
        refreshing={isRefreshing}
        onRefresh={() => loadReservations(true)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <AppCard>
            <AppText>
              {filter === 'WITHOUT_BOX'
                ? 'No hay apartados activos sin caja.'
                : 'No hay apartados activos.'}
            </AppText>
          </AppCard>
        }
      />

      <AppBottomModal
        visible={isBoxModalVisible}
        title="Asignar caja"
        onClose={closeBoxModal}
      >
        {selectedReservation ? (
          <AppCard>
            <AppText bold>Apartado #{selectedReservation.id}</AppText>
            <AppText>
              Cliente: {selectedReservation.customerName || `ID ${selectedReservation.customerId}`}
            </AppText>
            <AppText>
              Prenda: {selectedReservation.itemCode || `ID ${selectedReservation.itemId}`}
            </AppText>
          </AppCard>
        ) : null}

        {boxes.length > 0 ? (
          boxes.map((box) => (
            <AppOptionRow
              key={box.id}
              title={box.code}
              subtitle={box.description || 'Caja activa'}
              onPress={() => handleAssignBox(box)}
            />
          ))
        ) : (
          <AppText color={theme.colors.mutedText}>
            No hay cajas activas configuradas para esta sucursal.
          </AppText>
        )}

        {isAssigningBox ? (
          <AppText color={theme.colors.mutedText} style={styles.savingText}>
            Asignando caja...
          </AppText>
        ) : null}
      </AppBottomModal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  header: {
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  liveReturnButton: {
    marginBottom: 12,
  },
  filterButton: {
    flex: 1,
  },
  retryButton: {
    marginTop: 12,
  },
  listContent: {
    paddingBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  row: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  assignButton: {
    marginTop: 12,
  },
  savingText: {
    marginTop: 12,
  },
});
