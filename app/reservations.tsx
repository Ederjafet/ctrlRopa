import AppShell from '@/components/layout/AppShell';
import AppShellPage from '@/components/layout/AppShellPage';
import { buildMainNavSections, getSessionScopeLabel } from '@/components/layout/appNavigation';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppOptionRow from '@/components/ui/AppOptionRow';
import AppText from '@/components/ui/AppText';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  getActionableApiError,
  getActionableApiErrorMessage,
} from '@/services/apiError';
import { Box, getActiveBoxesByBranch } from '@/services/boxService';
import {
  assignReservationToBox,
  getReservationsByBranch,
  getReservationsWithoutBox,
  type Reservation,
} from '@/services/reservationService';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';

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

function getReservationTone(status?: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'CANCELLED':
      return 'danger';
    case 'COMPLETED':
    case 'CONVERTED_TO_SALE':
      return 'info';
    default:
      return 'neutral';
  }
}

export default function ReservationsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string | string[] }>();
  const { t } = useTranslation('common');
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
  const [session, setSession] = useState<UserSession | null>(null);
  const navSections = useMemo(() => buildMainNavSections(session), [session]);

  const loadReservations = useCallback(
    async (refreshing = false, nextFilter: ReservationFilter = filter) => {
      const currentSession = await getSession();
      setSession(currentSession);

      if (!currentSession?.branchId) {
        setReservations([]);
        setBoxes([]);
        setErrorMessage('No se encontro sucursal activa en la sesion.');
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
            ? getReservationsWithoutBox(currentSession.branchId)
            : getReservationsByBranch(currentSession.branchId),
          getActiveBoxesByBranch(currentSession.branchId),
        ]);

        const active = reservationData.filter((reservation) => {
          if (!reservation.status) return true;
          return reservation.status === 'ACTIVE';
        });

        setReservations(active);
        setBoxes(boxData);
      } catch (error) {
        console.log('Error cargando reservaciones', error);
        setErrorMessage(getActionableApiErrorMessage(error, t));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [filter, t]
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
      const copy = getActionableApiError(error, t);
      Alert.alert(copy.title, copy.message, [{ text: copy.primaryActionLabel }]);
    } finally {
      setIsAssigningBox(false);
    }
  };

  if (isLoading) {
    return (
      <AppShellPage
        title="Reservas"
        subtitle="Apartados activos, cajas y seguimiento"
        activeRoute="reservations"
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator />
          <AppText style={styles.loadingText}>Cargando apartados...</AppText>
        </View>
      </AppShellPage>
    );
  }

  return (
    <AppShell
      title="Reservas"
      subtitle="Apartados activos, cajas y seguimiento"
      contextTitle="Apartados y reservas"
      contextSubtitle={getSessionScopeLabel(session)}
      activeRoute="reservations"
      session={session}
      navSections={navSections}
      rightContent={
        isLiveContext ? (
          <AppButton title="Volver al live" variant="secondary" onPress={() => router.replace('/live' as any)} />
        ) : null
      }
    >
      <View style={styles.filterRow}>
        <AppButton
          title="Activas"
          variant={filter === 'ACTIVE' ? 'primary' : 'neutral'}
          onPress={() => changeFilter('ACTIVE')}
          style={styles.filterButton}
        />
        <AppButton
          title="Sin caja"
          variant={filter === 'WITHOUT_BOX' ? 'primary' : 'neutral'}
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
        <AppCard variant="danger">
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
            <AppCard variant="elevated">
              <View style={styles.cardHeader}>
                <View style={styles.cardTitle}>
                  <AppText bold>Apartado #{item.id}</AppText>
                  <AppText variant="caption">
                    {getSalesChannelLabel(item.salesChannelCode, item.salesChannelName) || 'Canal no capturado'}
                  </AppText>
                </View>
                <StatusBadge label={getReservationStatusLabel(item.status)} tone={getReservationTone(item.status)} />
              </View>

              <AppText>Cliente: {item.customerName || `ID ${item.customerId}`}</AppText>
              <AppText>Prenda: {item.itemCode || `ID ${item.itemId}`}</AppText>
              {item.liveId ? <AppText>Live: {getLiveLabel(item)}</AppText> : null}
              <AppText>Caja: {item.boxCode || 'Sin caja'}</AppText>

              <View style={styles.row}>
                <AppText bold>{formatMoney(item.price)}</AppText>
                <AppText variant="caption">Tocar para ver detalle</AppText>
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
          <EmptyState
            title={filter === 'WITHOUT_BOX' ? 'No hay apartados activos sin caja' : 'No hay apartados activos'}
            message="Cuando existan reservas para este filtro, apareceran aqui."
          />
        }
      />

      <AppBottomModal visible={isBoxModalVisible} title="Asignar caja" onClose={closeBoxModal}>
        {selectedReservation ? (
          <AppCard variant="subtle">
            <AppText bold>Apartado #{selectedReservation.id}</AppText>
            <AppText>
              Cliente: {selectedReservation.customerName || `ID ${selectedReservation.customerId}`}
            </AppText>
            <AppText>Prenda: {selectedReservation.itemCode || `ID ${selectedReservation.itemId}`}</AppText>
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
          <AppText>No hay cajas activas configuradas para esta sucursal.</AppText>
        )}

        {isAssigningBox ? <AppText style={styles.savingText}>Asignando caja...</AppText> : null}
      </AppBottomModal>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  assignButton: {
    marginTop: 12,
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitle: {
    flex: 1,
    minWidth: 0,
  },
  filterButton: {
    flex: 1,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 12,
    paddingBottom: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  retryButton: {
    marginTop: 12,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginTop: 10,
  },
  savingText: {
    marginTop: 12,
  },
});
