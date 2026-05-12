import QRScannerModal from '@/components/qr/QRScannerModal';
import AppBackButton from '@/components/ui/AppBackButton';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInfoCard from '@/components/ui/AppInfoCard';
import AppInput from '@/components/ui/AppInput';
import AppNoticeDropdown from '@/components/ui/AppNoticeDropdown';
import AppOptionRow from '@/components/ui/AppOptionRow';
import AppResponsiveGrid from '@/components/ui/AppResponsiveGrid';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { Customer, getCustomersByBranch } from '@/services/customerService';
import { getItemsByBranch, Item } from '@/services/itemService';
import {
  consumePendingQuickItems,
} from '@/services/pendingQuickItems';
import { getPaymentsByReservation, Payment } from '@/services/paymentService';
import {
  activateLive,
  closeLive,
  createLive,
  getLivesByBranch,
  getLiveStatusLabel,
  isLiveOperable,
  Live,
} from '@/services/liveService';
import {
  clearSelectedLiveId,
  getSelectedLiveId,
  saveSelectedLiveId,
} from '@/services/liveWorkflowStorage';
import {
  createReservation,
  getReservationsByBranch,
  Reservation,
} from '@/services/reservationService';
import { validateRouteAccess } from '@/services/routeGuard';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

type RecentLiveReservation = {
  reservation: Reservation;
  customerName: string;
  itemCode: string;
};

type LiveNotice = {
  message: string;
  tone: 'success' | 'warning' | 'danger';
};

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return 'Sin fecha';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function normalize(value?: string | null) {
  return (value ?? '').toLowerCase().trim();
}

function normalizeStatus(value?: string | null) {
  return (value || '').trim().toUpperCase();
}

function isVoidedPayment(payment: Payment) {
  return ['VOID', 'VOIDED', 'CANCELLED', 'CANCELED'].includes(
    normalizeStatus(payment.status)
  );
}

function getPaymentAmount(payment: Payment) {
  return Number(payment.receivedAmount ?? payment.amount ?? 0);
}

function mapLiveReservations(
  reservations: Reservation[],
  liveId?: number | null
): RecentLiveReservation[] {
  if (!liveId) return [];

  return reservations
    .filter((reservation) => reservation.liveId === liveId)
    .slice(0, 10)
    .map((reservation) => ({
      reservation,
      customerName: reservation.customerName || `Cliente #${reservation.customerId}`,
      itemCode: reservation.itemCode || `Prenda #${reservation.itemId}`,
    }));
}

function getReservationSellerLabel(reservation: Reservation) {
  return reservation.sellerUserName || `Usuario #${reservation.sellerUserId || '-'}`;
}

function isReservationSettled(reservation: Reservation, paid: number) {
  return paid >= Number(reservation.price || 0) && Number(reservation.price || 0) > 0;
}

export default function LiveScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const [session, setSession] = useState<UserSession | null>(null);
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingLive, setIsSavingLive] = useState(false);
  const [isSavingReservation, setIsSavingReservation] = useState(false);
  const [liveNotice, setLiveNotice] = useState<LiveNotice | null>(null);
  const [closeLiveToConfirm, setCloseLiveToConfirm] = useState<Live | null>(null);
  const [reservationIssue, setReservationIssue] = useState<string | null>(null);

  const [lives, setLives] = useState<Live[]>([]);
  const [selectedLive, setSelectedLive] = useState<Live | null>(null);
  const [newLiveNotes, setNewLiveNotes] = useState('');

  const [items, setItems] = useState<Item[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [recentReservations, setRecentReservations] = useState<
    RecentLiveReservation[]
  >([]);
  const [branchReservations, setBranchReservations] = useState<Reservation[]>([]);
  const [paidByReservationId, setPaidByReservationId] = useState<Record<number, number>>({});

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [priceText, setPriceText] = useState('');
  const [scanInput, setScanInput] = useState('');

  const [customerSearch, setCustomerSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [isCustomerModalVisible, setIsCustomerModalVisible] = useState(false);
  const [isItemModalVisible, setIsItemModalVisible] = useState(false);
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  useFocusEffect(
    useCallback(() => {
      checkAccessAndLoad();
      // checkAccessAndLoad depends on the current screen state and intentionally
      // refreshes every time the route receives focus.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const checkAccessAndLoad = async () => {
    try {
      const allowed = await validateRouteAccess('LIVE', 'DO_LIVE_RESERVATION');

      if (!allowed) {
        router.replace('/access-denied');
        return;
      }

      setIsAllowed(true);
      await loadData();
    } catch (err: any) {
      Alert.alert('Live', err?.message || 'No se pudo cargar Live.');
      setIsLoading(false);
    }
  };

  const loadData = async () => {
    const currentSession = await getSession();

    if (!currentSession) {
      router.replace('/login');
      return;
    }

    setSession(currentSession);
    setIsLoading(true);

    try {
      const [liveResult, itemResult, customerResult, reservationResult] =
        await Promise.allSettled([
          getLivesByBranch(currentSession.branchId),
          getItemsByBranch(currentSession.branchId),
          getCustomersByBranch(currentSession.branchId),
          getReservationsByBranch(currentSession.branchId),
        ]);

      const liveData = liveResult.status === 'fulfilled' ? liveResult.value : [];
      const itemData = itemResult.status === 'fulfilled' ? itemResult.value : [];
      const customerData =
        customerResult.status === 'fulfilled' ? customerResult.value : [];
      const reservationData =
        reservationResult.status === 'fulfilled' ? reservationResult.value : [];

      const availableItems = itemData.filter(
        (item) => item.status === 'AVAILABLE'
      );

      const activeCustomers = customerData.filter(
        (customer) => customer.status !== 'INACTIVE'
      );

      setLives(liveData);
      setItems(availableItems);
      setCustomers(activeCustomers);
      setBranchReservations(reservationData);

      const savedLiveId = await getSelectedLiveId(
        currentSession.branchId,
        currentSession.userId
      );
      const savedLive = savedLiveId
        ? liveData.find(
            (live) => live.id === savedLiveId && live.status !== 'CLOSED'
          )
        : null;

      const refreshedSelectedLive = selectedLive
        ? liveData.find((live) => live.id === selectedLive.id)
        : null;

      const nextSelectedLive =
        refreshedSelectedLive && refreshedSelectedLive.status !== 'CLOSED'
          ? refreshedSelectedLive
          : (
          savedLive ??
          liveData.find((live) => live.status === 'ACTIVE') ??
          liveData.find((live) => live.status === 'OPEN') ??
          null
        );

      setSelectedLive(nextSelectedLive);
      await updateRecentReservations(reservationData, nextSelectedLive?.id);

      const pendingItemIds = await consumePendingQuickItems('live');
      const createdItems = pendingItemIds
        .map((itemId) => availableItems.find((item) => item.id === itemId))
        .filter((item): item is Item => !!item);

      if (createdItems.length > 0) {
        const createdItem = createdItems[0];
        setSelectedItem(createdItem);
        setPriceText(
          createdItem.price !== null && createdItem.price !== undefined
            ? String(createdItem.price)
            : ''
        );
        Alert.alert(
          'Live',
          `Prenda ${createdItem.code} lista para agregar a la reserva.`
        );
      }

      const errors = [liveResult, itemResult, customerResult, reservationResult]
        .filter((result) => result.status === 'rejected')
        .map((result) =>
          result.status === 'rejected'
            ? result.reason?.message || 'No se pudo cargar un recurso.'
            : ''
        )
        .filter(Boolean);

      if (errors.length > 0) {
        Alert.alert('Live', errors.join('\n'));
      }
    } catch (err: any) {
      Alert.alert('Live', err?.message || 'No se pudo cargar Live.');
    } finally {
      setIsLoading(false);
    }
  };

  const liveChannelId = useMemo(() => {
    return session?.channels?.find(
      (channel) => channel.code === 'LIVE' && channel.enabled === true
    )?.id;
  }, [session]);

  const filteredLives = useMemo(() => {
    return lives.filter((live) => live.status !== 'CLOSED').slice(0, 10);
  }, [lives]);

  const filteredCustomers = useMemo(() => {
    const term = normalize(customerSearch);

    if (!term) return customers.slice(0, 25);

    return customers
      .filter((customer) =>
        `${customer.name ?? ''} ${customer.phone ?? ''} ${customer.email ?? ''}`
          .toLowerCase()
          .includes(term)
      )
      .slice(0, 25);
  }, [customers, customerSearch]);

  const filteredItems = useMemo(() => {
    const term = normalize(itemSearch);

    if (!term) return items.slice(0, 30);

    return items
      .filter((item) =>
        `${item.code ?? ''} ${item.qrCode ?? ''} ${item.productTypeName ?? ''} ${
          item.brandName ?? ''
        } ${item.sizeName ?? ''}`
          .toLowerCase()
          .includes(term)
      )
      .slice(0, 30);
  }, [items, itemSearch]);

  const reservationPendingReason = !selectedLive || !isLiveOperable(selectedLive)
    ? 'Selecciona o crea un live abierto.'
    : !selectedCustomer
      ? 'Selecciona un cliente.'
      : !selectedItem
        ? 'Selecciona o crea una prenda.'
        : !priceText.trim() || Number.isNaN(Number(priceText)) || Number(priceText) <= 0
          ? 'Captura un precio mayor a cero.'
          : !liveChannelId
            ? 'El canal Live no esta habilitado para la sucursal.'
            : '';
  const selectedLiveIsOperable = isLiveOperable(selectedLive);
  const createLiveBlockedReason = !newLiveNotes.trim()
    ? 'Captura la ubicacion o notas del live antes de crearlo.'
    : isSavingLive
      ? 'Espera a que termine la accion en proceso.'
      : '';
  const goToReservationDetail = (reservationId: number) => {
    router.push({
      pathname: '/reservation-detail',
      params: { id: String(reservationId), returnTo: '/live' },
    });
  };

  const goToReservationPayment = (reservationId: number) => {
    router.push({
      pathname: '/payments',
      params: { reservationId: String(reservationId), returnTo: '/live' },
    });
  };

  const handleSelectLive = (live: Live) => {
    setSelectedLive(live);
    updateRecentReservations(branchReservations, live.id);
    if (session && live.status !== 'CLOSED') {
      void saveSelectedLiveId(session.branchId, session.userId, live.id);
    }
  };

  const updateRecentReservations = async (
    reservations: Reservation[],
    liveId?: number | null
  ) => {
    const mappedReservations = mapLiveReservations(reservations, liveId);
    setRecentReservations(mappedReservations);

    const entries = await Promise.all(
      mappedReservations.map(async ({ reservation }) => {
        try {
          const payments = await getPaymentsByReservation(reservation.id);
          const paid = payments
            .filter((payment) => !isVoidedPayment(payment))
            .reduce((sum, payment) => sum + getPaymentAmount(payment), 0);

          return [reservation.id, paid] as const;
        } catch {
          return [reservation.id, 0] as const;
        }
      })
    );

    setPaidByReservationId(Object.fromEntries(entries));
  };

  const handleCreateLive = async () => {
    if (!session) {
      Alert.alert('Sesión', 'No hay sesión activa.');
      return;
    }

    if (!newLiveNotes.trim()) {
      Alert.alert('Live', 'Captura la ubicacion o notas del live antes de crearlo.');
      return;
    }

    const branchId = Number(session.branchId);

    if (!Number.isFinite(branchId) || branchId <= 0) {
      Alert.alert('Live', 'No se encontro una sucursal valida para crear el live. Cierra sesión e inicia nuevamente.');
      return;
    }

    const liveNotes = newLiveNotes.trim();

    setIsSavingLive(true);

    try {
      const live = await createLive(branchId, {
        notes: liveNotes,
      });

      setNewLiveNotes('');
      setSelectedLive(live);
      await saveSelectedLiveId(session.branchId, session.userId, live.id);
      setLiveNotice({
        message: `Live #${live.id} creado correctamente: ${live.notes || liveNotes}`,
        tone: 'success',
      });
      await loadData();

      Alert.alert('Live', 'Live creado correctamente.');
    } catch (err: any) {
      Alert.alert('Live', err?.message || 'No se pudo crear el live.');
    } finally {
      setIsSavingLive(false);
    }
  };

  const handleActivateLive = async (live: Live) => {
    if (!session) return;

    setIsSavingLive(true);

    try {
      const updated = await activateLive(live.id);
      setSelectedLive(updated);
      await saveSelectedLiveId(session.branchId, session.userId, updated.id);
      await loadData();
    } catch (err: any) {
      Alert.alert('Live', err?.message || 'No se pudo activar el live.');
    } finally {
      setIsSavingLive(false);
    }
  };

  const handleCloseLive = (live: Live) => {
    setCloseLiveToConfirm(live);
    setLiveNotice({
      message: `Confirma si deseas cerrar el Live #${live.id}.`,
      tone: 'warning',
    });

  };

  const confirmCloseLive = async () => {
    if (!closeLiveToConfirm) return;

    setIsSavingLive(true);

    try {
      const closedLive = await closeLive(closeLiveToConfirm.id);
      setLives((current) =>
        current.map((candidate) =>
          candidate.id === closeLiveToConfirm.id ? closedLive : candidate
        )
      );
      setSelectedLive(null);
      setCloseLiveToConfirm(null);
      if (session) {
        await clearSelectedLiveId(session.branchId, session.userId);
      }
      await loadData();
      setLiveNotice({
        message: `Live #${closedLive.id} cerrado correctamente.`,
        tone: 'success',
      });
    } catch (err: any) {
      setLiveNotice({
        message: err?.message || 'No se pudo cerrar el live.',
        tone: 'danger',
      });
    } finally {
      setIsSavingLive(false);
    }
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch('');
    setIsCustomerModalVisible(false);
  };

  const selectItem = (item: Item) => {
    setSelectedItem(item);
    setPriceText(
      item.price !== null && item.price !== undefined ? String(item.price) : ''
    );
    setItemSearch('');
    setIsItemModalVisible(false);
  };

  const addItemByCode = (value: string) => {
    const cleanValue = value.trim();

    if (!cleanValue) return;

    const item = items.find(
      (candidate) =>
        candidate.code === cleanValue || candidate.qrCode === cleanValue
    );

    if (!item) {
      Alert.alert('Live', 'No se encontró una prenda disponible con ese código.');
      setScanInput('');
      return;
    }

    selectItem(item);
    setScanInput('');
  };

  const handleCameraScanned = (value: string) => {
    setIsScannerVisible(false);
    addItemByCode(value);
  };

  const validateReservation = () => {
    if (!session) {
      Alert.alert('Sesión', 'No hay sesión activa.');
      return false;
    }

    if (!selectedLive || !isLiveOperable(selectedLive)) {
      Alert.alert('Live', 'Selecciona o crea un live abierto.');
      return false;
    }

    if (!liveChannelId) {
      Alert.alert('Live', 'El canal LIVE no está habilitado para la sucursal.');
      return false;
    }

    if (!selectedCustomer) {
      Alert.alert('Live', 'Selecciona un cliente.');
      return false;
    }

    if (!selectedItem) {
      Alert.alert('Live', 'Selecciona o escanea una prenda.');
      return false;
    }

    const price = Number(priceText);

    if (!priceText.trim() || Number.isNaN(price) || price <= 0) {
      Alert.alert('Live', 'Captura un precio válido.');
      return false;
    }

    return true;
  };

  const handleCreateReservation = async () => {
    if (reservationPendingReason) {
      setReservationIssue(reservationPendingReason);
      setLiveNotice({
        message: `No se puede agregar la reserva: ${reservationPendingReason}`,
        tone: 'warning',
      });
      return;
    }

    if (
      !validateReservation() ||
      !session ||
      !selectedCustomer ||
      !selectedItem ||
      !selectedLive ||
      !liveChannelId
    ) {
      return;
    }

    setIsSavingReservation(true);

    try {
      const price = Number(priceText);

      const reservation = await createReservation({
        itemId: selectedItem.id,
        customerId: selectedCustomer.id,
        branchId: session.branchId,
        liveId: selectedLive.id,
        salesChannelId: liveChannelId,
        price,
        createdByUserId: session.userId,
      });

      setRecentReservations((current) => [
        {
          reservation,
          customerName: selectedCustomer.name,
          itemCode: selectedItem.code,
        },
        ...current,
      ].slice(0, 10));

      setSelectedItem(null);
      setSelectedCustomer(null);
      setPriceText('');
      setScanInput('');

      await loadData();

      setLiveNotice({
        message: `Reserva #${reservation.id} creada correctamente.`,
        tone: 'success',
      });
    } catch (err: any) {
      setLiveNotice({
        message: err?.message || 'No se pudo crear la reserva.',
        tone: 'danger',
      });
    } finally {
      setIsSavingReservation(false);
    }
  };

  const handleReservationIssueAction = () => {
    const issue = reservationIssue || '';
    setReservationIssue(null);

    if (issue.includes('cliente')) {
      setIsCustomerModalVisible(true);
      return;
    }

    if (issue.includes('prenda')) {
      setIsItemModalVisible(true);
    }
  };

  const reservationIssueActionLabel =
    reservationIssue?.includes('cliente')
      ? 'Seleccionar cliente'
      : reservationIssue?.includes('prenda')
        ? 'Buscar prenda'
        : 'Entendido';

  if (isAllowed === null || isLoading) {
    return (
      <AppScreen>
        <ActivityIndicator />
      </AppScreen>
    );
  }

  return (
    <>
      <AppScreen>
        <AppBackButton fallbackRoute="/" />

        <AppText variant="title" bold>
          Live
        </AppText>

        {liveNotice ? (
          <AppNoticeDropdown
            title={liveNotice.tone === 'success' ? 'Reserva creada' : 'No se pudo completar'}
            message={liveNotice.message}
            tone={liveNotice.tone}
            onClose={() => setLiveNotice(null)}
          />
        ) : null}

        {filteredLives.length > 0 ? (
          <AppCard>
            <AppText variant="subtitle" bold>
              Lives abiertos
            </AppText>
            <AppText color={theme.colors.mutedText}>
              Selecciona el live donde vas a capturar reservas.
            </AppText>

            <AppResponsiveGrid tabletColumns={2} desktopColumns={3} style={styles.liveButtonGrid}>
              {filteredLives.map((live) => {
                const selected = selectedLive?.id === live.id;

                return (
                  <Pressable
                    key={live.id}
                    onPress={() => handleSelectLive(live)}
                    style={({ pressed }) => [
                      styles.liveButton,
                      {
                        borderColor: selected ? theme.colors.accent : theme.colors.border,
                        backgroundColor: selected
                          ? theme.colors.optionPressedBackground
                          : theme.colors.surface,
                        borderRadius: theme.radius.md,
                        opacity: pressed ? 0.75 : 1,
                      },
                    ]}
                  >
                    <AppText bold>Live #{live.id}</AppText>
                    <AppText variant="caption" color={theme.colors.mutedText}>
                      {getLiveStatusLabel(live.status)}
                    </AppText>
                    {live.notes ? (
                      <AppText numberOfLines={2}>{live.notes}</AppText>
                    ) : null}
                    {selected ? (
                      <AppText variant="caption" color={theme.colors.accent} bold>
                        Live seleccionado
                      </AppText>
                    ) : null}
                  </Pressable>
                );
              })}
            </AppResponsiveGrid>
          </AppCard>
        ) : null}

        {selectedLive ? (
          <AppCard>
          <AppText variant="subtitle" bold>
            Sesión de live
          </AppText>

            <>
              <AppText bold>Live #{selectedLive.id}</AppText>
              <AppText color={theme.colors.mutedText}>
                Estado: {getLiveStatusLabel(selectedLive.status)}
              </AppText>
              {selectedLive.status !== 'CLOSED' ? (
                <AppText variant="caption" color={theme.colors.accent} bold>
                  Capturando en este live. Registra la reserva en el bloque de abajo.
                </AppText>
              ) : null}
              {selectedLive.notes ? <AppText>{selectedLive.notes}</AppText> : null}

              <View style={styles.buttonRow}>
                {selectedLive.status === 'OPEN' ? (
                  <View style={styles.buttonFill}>
                    <AppButton
                      title="Activar live"
                      onPress={() => handleActivateLive(selectedLive)}
                      loading={isSavingLive}
                    />
                  </View>
                ) : null}
              </View>
            </>
          </AppCard>
        ) : (
          <AppInfoCard title="Sesión de live">
            <AppText color={theme.colors.infoCardText}>
              No hay live abierto seleccionado. Crea uno o selecciona uno de la
              lista.
            </AppText>
          </AppInfoCard>
        )}

        <AppCard>
          <AppText variant="subtitle" bold>
            Crear otro live
          </AppText>
          <AppText color={theme.colors.mutedText}>
            Usa esta opcion si la sucursal opera otro live al mismo tiempo en
            otra ubicacion, mesa o transmision.
          </AppText>

          <AppInput
            label="Ubicacion / notas *"
            value={newLiveNotes}
            onChangeText={setNewLiveNotes}
            placeholder="Ej. Mesa 2, bodega, transmision tarde"
            multiline
          />

          <AppButton
            title="Crear otro live"
            onPress={handleCreateLive}
            loading={isSavingLive}
            disabled={isSavingLive || !newLiveNotes.trim()}
            disabledReason={createLiveBlockedReason}
          />
        </AppCard>

        {false && !selectedLiveIsOperable && filteredLives.length > 0 ? (
          <AppCard>
            <AppText variant="subtitle" bold>
              Lives abiertos
            </AppText>

            {filteredLives.map((live) => {
              const selected = selectedLive?.id === live.id;

              return (
                <Pressable
                  key={live.id}
                  onPress={() => handleSelectLive(live)}
                  style={({ pressed }) => [
                    styles.liveRow,
                    {
                      borderColor: selected
                        ? theme.colors.accent
                        : theme.colors.border,
                      backgroundColor: selected
                        ? theme.colors.optionPressedBackground
                        : theme.colors.surface,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <AppText bold>Live #{live.id}</AppText>
                  <AppText color={theme.colors.mutedText}>
                    {getLiveStatusLabel(live.status)}
                    {live.notes ? ` · ${live.notes}` : ''}
                  </AppText>
                  {selected ? (
                    <AppText variant="caption" color={theme.colors.accent} bold>
                      Live seleccionado
                    </AppText>
                  ) : null}
                </Pressable>
              );
            })}
          </AppCard>
        ) : null}

        <AppCard>
          <AppText variant="subtitle" bold>
            Capturar reserva
          </AppText>

          {!selectedLive || !isLiveOperable(selectedLive) ? (
            <AppText color={theme.colors.mutedText}>
              Selecciona o crea un live abierto para capturar reservas.
            </AppText>
          ) : null}

          <View style={styles.sectionSpacing}>
            <AppText bold>Cliente</AppText>
            <AppText>
              {selectedCustomer
                ? selectedCustomer.name
                : 'Selecciona cliente real o genérico.'}
            </AppText>

            <AppButton
              title={selectedCustomer ? 'Cambiar cliente' : 'Seleccionar cliente'}
              variant="operation"
              onPress={() => setIsCustomerModalVisible(true)}
            />
          </View>

          <View style={styles.sectionSpacing}>
            <AppText bold>Prenda</AppText>
            <AppText>
              {selectedItem
                ? `${selectedItem.code} · ${selectedItem.productTypeName || 'Sin tipo'}`
                : 'Escanea o selecciona una prenda disponible.'}
            </AppText>

            <AppInput
              placeholder="Escanea o escribe código/QR"
              value={scanInput}
              onChangeText={setScanInput}
              onSubmitEditing={() => addItemByCode(scanInput)}
            />

            <View style={styles.buttonRow}>
              <View style={styles.buttonFill}>
                <AppButton
                  title="Agregar por código"
                  variant="operation"
                  onPress={() => addItemByCode(scanInput)}
                />
              </View>

              <View style={styles.buttonFill}>
                <AppButton
                  title="Escanear QR"
                  variant="secondary"
                  onPress={() => setIsScannerVisible(true)}
                />
              </View>
            </View>

            <View style={styles.buttonRow}>
              <View style={styles.buttonFill}>
                <AppButton
                  title="Buscar prenda"
                  variant="secondary"
                  onPress={() => setIsItemModalVisible(true)}
                />
              </View>
              <View style={styles.buttonFill}>
                <AppButton
                  title="Alta rapida de prenda"
                  variant="secondary"
                  onPress={() =>
                    router.push('/items-create?returnTo=/live' as any)
                  }
                />
              </View>
            </View>
            </View>

          <AppInput
            label="Precio"
            value={priceText}
            onChangeText={setPriceText}
            placeholder="0.00"
            keyboardType="numeric"
          />

          <AppButton
            title="Agregar reserva"
            onPress={handleCreateReservation}
            loading={isSavingReservation}
            disabled={isSavingReservation}
          />
        </AppCard>

        <AppCard>
          <AppText variant="subtitle" bold>
            Reservas recientes
          </AppText>

          {recentReservations.length === 0 ? (
            <AppText color={theme.colors.mutedText}>
              Aún no hay reservas capturadas en esta sesión.
            </AppText>
          ) : (
            recentReservations.map(({ reservation, customerName, itemCode }) => {
              const paid = paidByReservationId[reservation.id] ?? 0;
              const settled = isReservationSettled(reservation, paid);

              return (
                <Pressable
                  key={reservation.id}
                  onPress={() => goToReservationDetail(reservation.id)}
                  style={({ pressed }) => [
                    styles.recentRow,
                    {
                      borderColor: theme.colors.border,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <AppText bold>{itemCode}</AppText>
                  <AppText>{customerName}</AppText>
                  <AppText color={theme.colors.mutedText}>
                    {formatMoney(Number(reservation.price || 0))}
                    {settled ? ' - Liquidado' : ''}
                  </AppText>
                  <AppText variant="caption" color={theme.colors.mutedText}>
                    Live: #{reservation.liveId || selectedLive?.id || '-'}
                  </AppText>
                  <AppText variant="caption" color={theme.colors.mutedText}>
                    Reservo: {getReservationSellerLabel(reservation)}
                  </AppText>
                  <AppText variant="caption" color={theme.colors.mutedText}>
                    Fecha: {formatDateTime(reservation.createdAt)}
                  </AppText>
                  <View style={styles.buttonRow}>
                    <View style={styles.buttonFill}>
                      <AppButton
                        title="Ver detalle"
                        variant="secondary"
                        onPress={() => goToReservationDetail(reservation.id)}
                      />
                    </View>
                    {!settled ? (
                      <View style={styles.buttonFill}>
                        <AppButton
                          title="Cobrar"
                          onPress={() => goToReservationPayment(reservation.id)}
                        />
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              );
            })
          )}
        </AppCard>

        {selectedLive ? (
          <AppCard>
            <AppText variant="subtitle" bold>
              Cierre del live
            </AppText>
            <AppText color={theme.colors.mutedText}>
              Cierra la sesión cuando termines de capturar reservas.
            </AppText>
            {selectedLive.status === 'CLOSED' ? (
              <AppButton
                title="Live cerrado"
                variant="cancel"
                disabled
                style={styles.buttonSpacing}
              />
            ) : (
              <AppButton
                title="Cerrar live"
                variant="danger"
                onPress={() => handleCloseLive(selectedLive)}
                loading={isSavingLive}
                style={styles.buttonSpacing}
              />
            )}
          </AppCard>
        ) : null}

        {false && selectedLiveIsOperable && filteredLives.length > 0 ? (
          <AppCard>
            <AppText variant="subtitle" bold>
              Lives abiertos
            </AppText>

            {filteredLives.map((live) => {
              const selected = selectedLive?.id === live.id;

              return (
                <Pressable
                  key={live.id}
                  onPress={() => handleSelectLive(live)}
                  style={({ pressed }) => [
                    styles.liveRow,
                    {
                      borderColor: selected
                        ? theme.colors.accent
                        : theme.colors.border,
                      backgroundColor: selected
                        ? theme.colors.optionPressedBackground
                        : theme.colors.surface,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <AppText bold>Live #{live.id}</AppText>
                  <AppText color={theme.colors.mutedText}>
                    {getLiveStatusLabel(live.status)}
                    {live.notes ? ` · ${live.notes}` : ''}
                  </AppText>
                  {selected ? (
                    <AppText variant="caption" color={theme.colors.accent} bold>
                      Live seleccionado
                    </AppText>
                  ) : null}
                </Pressable>
              );
            })}
          </AppCard>
        ) : null}
      </AppScreen>

      <QRScannerModal
        visible={isScannerVisible}
        onClose={() => setIsScannerVisible(false)}
        onScanned={handleCameraScanned}
      />

      <AppBottomModal
        visible={isCustomerModalVisible}
        title="Seleccionar cliente"
        onClose={() => setIsCustomerModalVisible(false)}
        scroll={false}
      >
        <AppInput
          placeholder="Buscar cliente"
          value={customerSearch}
          onChangeText={setCustomerSearch}
        />

        <FlatList
          data={filteredCustomers}
          style={styles.modalList}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <AppOptionRow
              title={item.name}
              subtitle={`${item.phone || 'Sin teléfono'}${
                item.isGeneric ? ' · Genérico' : ''
              }`}
              onPress={() => selectCustomer(item)}
            />
          )}
          ListEmptyComponent={<AppText>No hay clientes activos.</AppText>}
        />
      </AppBottomModal>

      <AppBottomModal
        visible={isItemModalVisible}
        title="Seleccionar prenda"
        onClose={() => setIsItemModalVisible(false)}
        scroll={false}
      >
        <AppInput
          placeholder="Buscar por código, tipo, marca o talla"
          value={itemSearch}
          onChangeText={setItemSearch}
        />

        <FlatList
          data={filteredItems}
          style={styles.modalList}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <AppOptionRow
              title={item.code}
              subtitle={`${item.productTypeName || 'Sin tipo'} · ${
                item.brandName || 'Sin marca'
              } · ${item.sizeName || 'Sin talla'}`}
              onPress={() => selectItem(item)}
            >
              <AppText variant="caption" color={theme.colors.mutedText}>
                Precio sugerido:{' '}
                {item.price !== null && item.price !== undefined
                  ? formatMoney(item.price)
                  : 'Sin precio'}
              </AppText>
            </AppOptionRow>
          )}
          ListEmptyComponent={<AppText>No hay prendas disponibles.</AppText>}
        />
      </AppBottomModal>


      <AppBottomModal
        visible={closeLiveToConfirm !== null}
        title="Cerrar live"
        onClose={() => setCloseLiveToConfirm(null)}
        showCancelButton={false}
      >
        <AppText>
          Al cerrar el live ya no se podran capturar reservas en esta sesión.
        </AppText>
        {closeLiveToConfirm ? (
          <AppText color={theme.colors.mutedText}>
            Live #{closeLiveToConfirm.id}
            {closeLiveToConfirm.notes ? ` - ${closeLiveToConfirm.notes}` : ''}
          </AppText>
        ) : null}
        <View style={styles.buttonRow}>
          <View style={styles.buttonFill}>
            <AppButton
              title="Cancelar"
              variant="secondary"
              onPress={() => setCloseLiveToConfirm(null)}
              disabled={isSavingLive}
            />
          </View>
          <View style={styles.buttonFill}>
            <AppButton
              title="Confirmar cierre"
              variant="danger"
              onPress={confirmCloseLive}
              loading={isSavingLive}
              disabled={isSavingLive}
            />
          </View>
        </View>
      </AppBottomModal>

      <AppBottomModal
        visible={reservationIssue !== null}
        title="No se puede agregar reserva"
        onClose={() => setReservationIssue(null)}
        showCancelButton={false}
      >
        <AppText>
          Falta completar información para poder agregar la reserva.
        </AppText>
        <AppText color={theme.colors.warning} bold>
          {reservationIssue}
        </AppText>
        <View style={styles.buttonRow}>
          <View style={styles.buttonFill}>
            <AppButton
              title="Cerrar"
              variant="secondary"
              onPress={() => setReservationIssue(null)}
            />
          </View>
          <View style={styles.buttonFill}>
            <AppButton
              title={reservationIssueActionLabel}
              onPress={handleReservationIssueAction}
            />
          </View>
        </View>
      </AppBottomModal>
    </>
  );
}

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  buttonFill: {
    flex: 1,
    minWidth: 130,
  },
  buttonSpacing: {
    marginTop: 10,
  },
  liveButton: {
    borderWidth: 1,
    justifyContent: 'center',
    marginBottom: 10,
    minHeight: 92,
    padding: 12,
  },
  liveButtonGrid: {
    marginTop: 10,
  },
  liveHistoryRow: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginTop: 10,
    padding: 12,
  },
  liveHistoryText: {
    flex: 1,
    minWidth: 0,
  },
  liveRow: {
    borderWidth: 1,
    marginTop: 10,
    padding: 12,
  },
  modalList: {
    maxHeight: 420,
  },
  recentRow: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  sectionSpacing: {
    marginTop: 12,
    gap: 8,
  },
});
