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
import { useAppTheme } from '@/context/AppThemeContext';
import { hasPermission } from '@/services/accessControl';
import {
  getActionableApiError,
  getActionableApiErrorMessage,
} from '@/services/apiError';
import { Box, getActiveBoxesByBranch } from '@/services/boxService';
import { prepareCustomerPackageFromReservation } from '@/services/customerPackageService';
import {
  assignReservationToBox,
  getReservationsByBranch,
  type Reservation,
} from '@/services/reservationService';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';

type ReservationFilter =
  | 'ACTIVE'
  | 'WITHOUT_BOX'
  | 'WITH_BOX'
  | 'IN_PACKAGE'
  | 'READY_TO_SHIP'
  | 'SHIPPED';

type ReservationAction = 'assignBox' | 'createPackage';

type OperationalTab = {
  key: ReservationFilter;
  label: string;
  enabled: boolean;
  disabledReason?: string;
};

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

function formatDateTime(value?: string | null) {
  if (!value) return 'Sin fecha';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';

  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function isActiveReservation(reservation: Reservation) {
  if (!reservation.status) return true;
  return reservation.status === 'ACTIVE';
}

function getHoldStateLabel(reservation: Reservation) {
  if (!isActiveReservation(reservation)) {
    return getReservationStatusLabel(reservation.status);
  }

  if (!reservation.boxId) return 'Apartado sin caja';

  return 'Apartado en caja';
}

function getNextActionLabel(reservation: Reservation) {
  if (!isActiveReservation(reservation)) return 'Sin accion pendiente';
  if (!reservation.customerId) return 'Validar cliente';
  if (!reservation.boxId) return 'Asignar caja';
  return 'Crear paquete';
}

function getPackageDisabledReason(reservation: Reservation, session: UserSession | null) {
  if (!hasPermission(session, 'CREATE_CLOSE_CUSTOMER_PACKAGE')) {
    return 'Tu usuario no tiene permiso para crear paquetes.';
  }

  if (!isActiveReservation(reservation)) {
    return 'Solo se pueden preparar paquetes desde apartados activos.';
  }

  if (!reservation.customerId) {
    return 'El apartado debe tener cliente antes de crear paquete.';
  }

  if (!reservation.itemId) {
    return 'El apartado debe tener prenda antes de crear paquete.';
  }

  if (!reservation.boxId) {
    return 'Primero asigna una caja o ubicacion fisica al apartado.';
  }

  return '';
}

function getAssignBoxDisabledReason(reservation: Reservation) {
  if (!isActiveReservation(reservation)) {
    return 'Solo se pueden asignar cajas a apartados activos.';
  }

  return '';
}

export default function ReservationsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string | string[] }>();
  const { t } = useTranslation('common');
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
  const [workingReservationId, setWorkingReservationId] = useState<number | null>(null);
  const [workingAction, setWorkingAction] = useState<ReservationAction | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isBoxModalVisible, setIsBoxModalVisible] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const navSections = useMemo(() => buildMainNavSections(session), [session]);

  const operationalTabs: OperationalTab[] = useMemo(
    () => [
      { key: 'ACTIVE', label: 'Activas', enabled: true },
      { key: 'WITHOUT_BOX', label: 'Sin caja', enabled: true },
      { key: 'WITH_BOX', label: 'Con caja', enabled: true },
      {
        key: 'IN_PACKAGE',
        label: 'En paquete',
        enabled: false,
        disabledReason: 'Pendiente de resumen agregado de paquetes por apartado.',
      },
      {
        key: 'READY_TO_SHIP',
        label: 'Listas para envio',
        enabled: false,
        disabledReason: 'Pendiente de liberacion segura con saldo pagado.',
      },
      {
        key: 'SHIPPED',
        label: 'Enviadas',
        enabled: false,
        disabledReason: 'Pendiente de trazabilidad de envio desde paquetes.',
      },
    ],
    []
  );

  const loadReservations = useCallback(
    async (refreshing = false) => {
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
          getReservationsByBranch(currentSession.branchId),
          getActiveBoxesByBranch(currentSession.branchId),
        ]);

        const active = reservationData.filter(isActiveReservation);

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
    [t]
  );

  useFocusEffect(
    useCallback(() => {
      loadReservations(false);
    }, [loadReservations])
  );

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    const data =
      filter === 'WITHOUT_BOX'
        ? reservations.filter((reservation) => !reservation.boxId)
        : filter === 'WITH_BOX'
          ? reservations.filter((reservation) => Boolean(reservation.boxId))
          : reservations;

    if (!query) return data;

    return data.filter((reservation) => {
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
  }, [filter, reservations, search]);

  const metrics = useMemo(() => {
    const active = reservations.filter(isActiveReservation);
    const withoutBox = active.filter((reservation) => !reservation.boxId);
    const withBox = active.filter((reservation) => Boolean(reservation.boxId));
    const readyForNextAction = active.filter((reservation) => {
      if (!reservation.customerId) return false;
      if (!reservation.boxId) return true;
      return Boolean(reservation.itemId);
    });

    return {
      active: active.length,
      withoutBox: withoutBox.length,
      withBox: withBox.length,
      readyForNextAction: readyForNextAction.length,
    };
  }, [reservations]);

  const changeFilter = (nextFilter: ReservationFilter) => {
    setFilter(nextFilter);
  };

  const openBoxModal = (reservation: Reservation) => {
    const disabledReason = getAssignBoxDisabledReason(reservation);

    if (disabledReason) {
      Alert.alert('Caja', disabledReason);
      return;
    }

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
      setWorkingReservationId(selectedReservation.id);
      setWorkingAction('assignBox');
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
      setWorkingReservationId(null);
      setWorkingAction(null);
    }
  };

  const handleManualRefresh = () => {
    loadReservations(true);
  };

  const openReservationDetail = (reservation: Reservation) => {
    router.push({
      pathname: '/reservation-detail',
      params: { id: String(reservation.id), returnTo: returnTo || '/reservations' },
    });
  };

  const openPaymentFlow = (reservation: Reservation) => {
    router.push({
      pathname: '/payments',
      params: {
        reservationId: String(reservation.id),
        returnTo: `/reservation-detail?id=${reservation.id}`,
      },
    } as any);
  };

  const handleCreatePackage = (reservation: Reservation) => {
    const disabledReason = getPackageDisabledReason(reservation, session);

    if (disabledReason) {
      Alert.alert('Crear paquete', disabledReason);
      return;
    }

    Alert.alert(
      'Crear paquete',
      `Se creara un paquete abierto para ${reservation.customerName || `cliente #${reservation.customerId}`} y se agregara la prenda ${reservation.itemCode || `#${reservation.itemId}`}.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Crear paquete',
          onPress: async () => {
            if (!session) return;

            try {
              setWorkingReservationId(reservation.id);
              setWorkingAction('createPackage');

              const detail = await prepareCustomerPackageFromReservation(reservation.id, {
                createdByUserId: session.userId,
              });

              Alert.alert(
                'Paquete creado',
                `Paquete ${detail.folio || `#${detail.id}`} creado correctamente.`,
                [
                  {
                    text: 'Ver paquete',
                    onPress: () =>
                      router.push({
                        pathname: '/customer-package-detail',
                        params: { id: String(detail.id) },
                      } as any),
                  },
                  { text: 'Seguir en apartados' },
                ]
              );

              await loadReservations(false);
            } catch (error: any) {
              const copy = getActionableApiError(error, t);
              Alert.alert(copy.title, copy.message, [{ text: copy.primaryActionLabel }]);
            } finally {
              setWorkingReservationId(null);
              setWorkingAction(null);
            }
          },
        },
      ]
    );
  };

  const renderMetric = (label: string, value: number, helper: string) => (
    <View
      style={[
        styles.metricCard,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <AppText variant="caption" color={theme.colors.mutedText} bold>
        {label}
      </AppText>
      <AppText variant="title" bold style={styles.metricValue}>
        {value}
      </AppText>
      <AppText variant="caption" color={theme.colors.mutedText}>
        {helper}
      </AppText>
    </View>
  );

  const renderReservation = ({ item }: { item: Reservation }) => {
    const nextAction = getNextActionLabel(item);
    const packageDisabledReason = getPackageDisabledReason(item, session);
    const assignBoxDisabledReason = getAssignBoxDisabledReason(item);
    const canViewPayments = hasPermission(session, 'VIEW_PAYMENTS');
    const canRegisterPayments = hasPermission(session, 'REGISTER_PAYMENTS');
    const isCreatingPackage = workingReservationId === item.id && workingAction === 'createPackage';
    const isAssigningCurrentBox = workingReservationId === item.id && workingAction === 'assignBox';

    return (
      <Pressable onPress={() => openReservationDetail(item)}>
        <AppCard variant="elevated">
          <View style={styles.cardHeader}>
            <View style={styles.cardTitle}>
              <AppText bold>Apartado #{item.id}</AppText>
              <AppText variant="caption" color={theme.colors.mutedText}>
                {getSalesChannelLabel(item.salesChannelCode, item.salesChannelName) || 'Canal no capturado'}
              </AppText>
            </View>
            <View style={styles.badgeStack}>
              <StatusBadge label={getHoldStateLabel(item)} tone={item.boxId ? 'info' : 'warning'} />
              <StatusBadge label={getReservationStatusLabel(item.status)} tone={getReservationTone(item.status)} />
            </View>
          </View>

          <View style={styles.cardGrid}>
            <InfoPill label="Cliente" value={item.customerName || `ID ${item.customerId}`} />
            <InfoPill label="Prenda" value={item.itemCode || `ID ${item.itemId}`} />
            <InfoPill
              label="Live / canal"
              value={item.liveId ? getLiveLabel(item) : getSalesChannelLabel(item.salesChannelCode, item.salesChannelName) || 'No capturado'}
            />
            <InfoPill label="Caja / ubicacion" value={item.boxCode || 'Sin caja'} tone={!item.boxId ? 'warning' : 'neutral'} />
            <InfoPill label="Monto" value={formatMoney(item.price)} />
            <InfoPill label="Fecha" value={formatDateTime(item.createdAt)} />
          </View>

          <View
            style={[
              styles.nextActionBox,
              {
                backgroundColor: theme.colors.infoCardBackground,
                borderColor: theme.colors.infoCardBorder,
              },
            ]}
          >
            <AppText variant="caption" color={theme.colors.infoCardText} bold>
              Siguiente accion
            </AppText>
            <AppText color={theme.colors.infoCardText} bold>
              {nextAction}
            </AppText>
            <AppText variant="caption" color={theme.colors.infoCardText}>
              Abonado y saldo se validan en detalle para evitar llamadas N+1 de pagos.
            </AppText>
          </View>

          <View style={styles.actionsGrid}>
            <AppButton
              title="Ver detalle"
              variant="secondary"
              onPress={() => openReservationDetail(item)}
              style={styles.actionButton}
            />
            <AppButton
              title={item.boxId ? 'Cambiar caja' : 'Asignar caja'}
              variant={item.boxId ? 'neutral' : 'operation'}
              onPress={() => (item.boxId ? openReservationDetail(item) : openBoxModal(item))}
              loading={isAssigningCurrentBox}
              disabled={Boolean(assignBoxDisabledReason)}
              disabledReason={assignBoxDisabledReason || undefined}
              style={styles.actionButton}
            />
            <AppButton
              title="Crear paquete"
              variant="operation"
              onPress={() => handleCreatePackage(item)}
              loading={isCreatingPackage}
              disabled={Boolean(packageDisabledReason) || Boolean(workingReservationId)}
              disabledReason={packageDisabledReason || 'Ya hay una accion en proceso.'}
              style={styles.actionButton}
            />
            <AppButton
              title="Agregar a paquete"
              variant="neutral"
              disabled
              disabledReason="Pendiente: seleccionar paquete abierto existente sin romper reglas de cliente/sucursal."
              style={styles.actionButton}
            />
            <AppButton
              title="Ver pagos"
              variant="secondary"
              onPress={() => openReservationDetail(item)}
              disabled={!canViewPayments}
              disabledReason="Tu usuario no tiene permiso para ver pagos."
              style={styles.actionButton}
            />
            <AppButton
              title="Registrar abono"
              variant="secondary"
              onPress={() => openPaymentFlow(item)}
              disabled={!canRegisterPayments || !isActiveReservation(item)}
              disabledReason={
                !canRegisterPayments
                  ? 'Tu usuario no tiene permiso para registrar pagos.'
                  : 'Solo se puede abonar sobre apartados activos.'
              }
              style={styles.actionButton}
            />
            <AppButton
              title="Liberar envio"
              variant="neutral"
              disabled
              disabledReason="Pendiente: requiere resumen de paquete pagado y validacion backend de saldo completo."
              style={styles.actionButton}
            />
            <AppButton
              title="Marcar enviado"
              variant="neutral"
              disabled
              disabledReason="Pendiente: requiere paquete liberado y datos de envio."
              style={styles.actionButton}
            />
            <AppButton
              title="Cancelar apartado"
              variant="danger"
              onPress={() => openReservationDetail(item)}
              disabled={!hasPermission(session, 'CANCEL_RESERVATION') || !isActiveReservation(item)}
              disabledReason={
                !hasPermission(session, 'CANCEL_RESERVATION')
                  ? 'Tu usuario no tiene permiso para cancelar apartados.'
                  : 'Solo se puede cancelar desde apartados activos.'
              }
              style={styles.actionButton}
            />
          </View>
        </AppCard>
      </Pressable>
    );
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
      <View
        style={[
          styles.operationalHeader,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.headerTextBlock}>
          <AppText variant="caption" color={theme.colors.accent} bold>
            PANEL OPERATIVO
          </AppText>
          <AppText variant="title" bold>
            Apartados y reservas
          </AppText>
          <AppText color={theme.colors.mutedText}>
            Control de apartados, caja, paquete, cobro y envio
          </AppText>
          <AppText variant="caption" color={theme.colors.mutedText}>
            {getSessionScopeLabel(session)}
          </AppText>
        </View>
        <AppButton
          title={isRefreshing ? 'Actualizando...' : 'Actualizar'}
          variant="secondary"
          onPress={handleManualRefresh}
          loading={isRefreshing}
          disabled={isRefreshing}
          style={styles.refreshButton}
        />
      </View>

      <View style={styles.metricsGrid}>
        {renderMetric('Apartados activos', metrics.active, 'Reservas activas cargadas')}
        {renderMetric('Sin caja', metrics.withoutBox, 'Requieren ubicacion fisica')}
        {renderMetric('Con caja', metrics.withBox, 'Listas para preparar paquete')}
        {renderMetric('Siguiente accion', metrics.readyForNextAction, 'Con accion operativa visible')}
      </View>

      <View style={styles.filterRow}>
        {operationalTabs.map((tab) => (
          <AppButton
            key={tab.key}
            title={tab.label}
            variant={filter === tab.key ? 'primary' : 'neutral'}
            onPress={() => changeFilter(tab.key)}
            disabled={!tab.enabled}
            disabledReason={tab.disabledReason}
            style={styles.filterButton}
          />
        ))}
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
        renderItem={renderReservation}
        refreshing={isRefreshing}
        onRefresh={handleManualRefresh}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            title={
              filter === 'WITHOUT_BOX'
                ? 'No hay apartados activos sin caja'
                : filter === 'WITH_BOX'
                  ? 'No hay apartados activos con caja'
                  : 'No hay apartados activos'
            }
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

type InfoPillProps = {
  label: string;
  value: string;
  tone?: 'neutral' | 'warning';
};

function InfoPill({ label, value, tone = 'neutral' }: InfoPillProps) {
  const { theme } = useAppTheme();
  const isWarning = tone === 'warning';

  return (
    <View
      style={[
        styles.infoPill,
        {
          backgroundColor: isWarning ? theme.colors.warningBackground : theme.colors.surfaceAlt,
          borderColor: isWarning ? theme.colors.warning : theme.colors.border,
        },
      ]}
    >
      <AppText variant="caption" color={isWarning ? theme.colors.warning : theme.colors.mutedText} bold>
        {label}
      </AppText>
      <AppText numberOfLines={2}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    minWidth: 150,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  badgeStack: {
    alignItems: 'flex-end',
    gap: 6,
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
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    minWidth: 126,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  headerTextBlock: {
    flex: 1,
    minWidth: 240,
  },
  infoPill: {
    borderRadius: 10,
    borderWidth: 1,
    flexBasis: 190,
    flexGrow: 1,
    gap: 2,
    padding: 10,
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
  metricCard: {
    borderRadius: 12,
    borderWidth: 1,
    flexBasis: 170,
    flexGrow: 1,
    padding: 12,
  },
  metricValue: {
    marginBottom: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  nextActionBox: {
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    padding: 12,
  },
  operationalHeader: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
    padding: 16,
  },
  refreshButton: {
    minWidth: 150,
  },
  retryButton: {
    marginTop: 12,
  },
  savingText: {
    marginTop: 12,
  },
});
