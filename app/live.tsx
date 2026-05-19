import QRScannerModal from '@/components/qr/QRScannerModal';
import AppBackButton from '@/components/ui/AppBackButton';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInfoCard from '@/components/ui/AppInfoCard';
import AppInput from '@/components/ui/AppInput';
import AppOptionRow from '@/components/ui/AppOptionRow';
import AppResponsiveGrid from '@/components/ui/AppResponsiveGrid';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { ApiError } from '@/services/apiClient';
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
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
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
  title: string;
  message: string;
  tone: 'success' | 'warning' | 'danger';
};

type LiveNoticeModalProps = {
  notice: LiveNotice | null;
  onClose: () => void;
};

function isForbiddenError(error: unknown) {
  return error instanceof ApiError && error.status === 403;
}

function resolveLoadIssue(
  error: unknown,
  fallbackMessage: string,
  forbiddenMessage: string
) {
  if (isForbiddenError(error)) return forbiddenMessage;

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

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

function LiveNoticeModal({ notice, onClose }: LiveNoticeModalProps) {
  const { theme } = useAppTheme();
  const { t } = useTranslation('common');

  const color =
    notice?.tone === 'danger'
      ? theme.colors.danger
      : notice?.tone === 'warning'
        ? theme.colors.warning
        : theme.colors.success;

  return (
    <Modal visible={!!notice} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.noticeBackdrop, { backgroundColor: theme.colors.backdrop }]}>
        <View
          style={[
            styles.noticeDialog,
            {
              backgroundColor: theme.colors.modalBackground,
              borderColor: color,
              borderRadius: theme.radius.lg,
              padding: theme.spacing.lg,
            },
          ]}
        >
          <AppText variant="subtitle" bold color={color}>
            {notice?.title}
          </AppText>
          <AppText>{notice?.message}</AppText>
          <AppButton title={t('common.understood')} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

export default function LiveScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { t } = useTranslation('common');

  const [session, setSession] = useState<UserSession | null>(null);
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingLive, setIsSavingLive] = useState(false);
  const [isSavingReservation, setIsSavingReservation] = useState(false);
  const [liveNotice, setLiveNotice] = useState<LiveNotice | null>(null);
  const [closeLiveToConfirm, setCloseLiveToConfirm] = useState<Live | null>(null);
  const [activateLiveToConfirm, setActivateLiveToConfirm] = useState<Live | null>(null);
  const [reservationIssue, setReservationIssue] = useState<string | null>(null);
  const [showDemoMetrics, setShowDemoMetrics] = useState(true);
  const [liveLoadIssue, setLiveLoadIssue] = useState<string | null>(null);
  const [customerLoadIssue, setCustomerLoadIssue] = useState<string | null>(null);
  const [itemLoadIssue, setItemLoadIssue] = useState<string | null>(null);
  const [reservationLoadIssue, setReservationLoadIssue] = useState<string | null>(null);

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
      Alert.alert(
        t('live.title'),
        resolveLoadIssue(err, t('live.loadingError'), t('live.accessDenied'))
      );
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
      const nextLiveLoadIssue =
        liveResult.status === 'rejected'
          ? resolveLoadIssue(
              liveResult.reason,
              t('live.liveLoadError'),
              t('live.accessDenied')
            )
          : null;

      setLiveLoadIssue(nextLiveLoadIssue);
      setCustomerLoadIssue(
        customerResult.status === 'rejected'
          ? resolveLoadIssue(
              customerResult.reason,
              t('live.customerLoadError'),
              t('live.customerPermissionError')
            )
          : null
      );
      setItemLoadIssue(
        itemResult.status === 'rejected'
          ? resolveLoadIssue(
              itemResult.reason,
              t('live.itemLoadError'),
              t('live.itemPermissionError')
            )
          : null
      );
      setReservationLoadIssue(
        reservationResult.status === 'rejected'
          ? resolveLoadIssue(
              reservationResult.reason,
              t('live.reservationLoadError'),
              t('live.reservationPermissionError')
            )
          : null
      );

      const availableItems = itemData.filter((item) => {
        const status = normalizeStatus(item.status);
        return !status || status === 'AVAILABLE';
      });

      const activeCustomers = customerData.filter(
        (customer) => normalizeStatus(customer.status) !== 'INACTIVE'
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
          t('live.title'),
          `Prenda ${createdItem.code} lista para agregar a la reserva.`
        );
      }

      if (
        liveResult.status === 'rejected' &&
        isForbiddenError(liveResult.reason)
      ) {
        Alert.alert(t('live.title'), t('live.accessDenied'));
      }
    } catch (err: any) {
      Alert.alert(
        t('live.title'),
        resolveLoadIssue(err, t('live.loadingError'), t('live.accessDenied'))
      );
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
    ? t('live.selectOpenLiveReason')
    : !selectedCustomer
      ? t('live.selectCustomerReason')
      : !selectedItem
        ? t('live.selectItemReason')
        : !priceText.trim() || Number.isNaN(Number(priceText)) || Number(priceText) <= 0
          ? t('live.priceReason')
          : !liveChannelId
            ? t('live.channelReason')
            : '';
  const selectedLiveIsOperable = isLiveOperable(selectedLive);
  const selectedLiveStatus = normalizeStatus(selectedLive?.status);
  const statusColor =
    selectedLiveStatus === 'ACTIVE'
      ? theme.colors.success
      : selectedLiveStatus === 'OPEN'
        ? theme.colors.warning
        : selectedLiveStatus === 'CLOSED'
          ? theme.colors.danger
          : theme.colors.accent;
  const statusBackground =
    selectedLiveStatus === 'ACTIVE'
      ? theme.colors.successBackground
      : selectedLiveStatus === 'OPEN'
        ? theme.colors.warningBackground
        : selectedLiveStatus === 'CLOSED'
          ? theme.colors.dangerBackground
          : theme.colors.infoCardBackground;
  const statusLabel = selectedLive
    ? getLiveStatusLabel(selectedLive.status)
    : t('live.noLiveStatusLabel');
  const statusHelp = !selectedLive
    ? t('live.noLiveStatusBody')
    : selectedLiveStatus === 'ACTIVE'
      ? t('live.activeStatusBody')
      : selectedLiveStatus === 'OPEN'
        ? t('live.openStatusBody')
        : selectedLiveStatus === 'CLOSED'
          ? t('live.closedStatusBody')
          : t('live.unknownStatusBody');
  const actionHint = !selectedLive
    ? t('live.noLiveActionHint')
    : selectedLiveStatus === 'ACTIVE'
      ? t('live.activeLiveActionHint')
      : selectedLiveStatus === 'OPEN'
        ? t('live.openLiveActionHint')
        : selectedLiveStatus === 'CLOSED'
          ? t('live.closedLiveActionHint')
          : t('live.unknownLiveActionHint');
  const demoMetricCards = [
    {
      label: t('live.demoCurrentViewers'),
      value: selectedLiveStatus === 'ACTIVE' ? '128' : selectedLiveStatus === 'OPEN' ? '42' : '0',
      helper: t('live.demoCurrentViewersHelp'),
    },
    {
      label: t('live.demoPeakViewers'),
      value: selectedLiveStatus === 'ACTIVE' ? '214' : '86',
      helper: t('live.demoPeakViewersHelp'),
    },
    {
      label: t('live.demoEngagement'),
      value: selectedLiveStatus === 'CLOSED' ? '0%' : '18%',
      helper: t('live.demoEngagementHelp'),
    },
    {
      label: t('live.demoComments'),
      value: selectedLiveStatus === 'CLOSED' ? '0' : '63',
      helper: t('live.demoCommentsHelp'),
    },
    {
      label: t('live.demoReactions'),
      value: selectedLiveStatus === 'CLOSED' ? '0' : '312',
      helper: t('live.demoReactionsHelp'),
    },
    {
      label: t('live.demoPinnedProducts'),
      value: selectedLiveStatus === 'CLOSED' ? '0' : '4',
      helper: t('live.demoPinnedProductsHelp'),
    },
  ];
  const demoTimeline = [
    { time: '00:00', label: t('live.demoEventLiveStarted') },
    { time: '03:20', label: t('live.demoEventViewerJoined') },
    { time: '08:45', label: t('live.demoEventProductPinned') },
    { time: '12:10', label: t('live.demoEventCommentReceived') },
    { time: '15:30', label: t('live.demoEventReactionReceived') },
    { time: '28:00', label: t('live.demoEventLiveClosed') },
  ];
  const demoProducts = [
    {
      name: t('live.demoProductBlouse'),
      stat: t('live.demoProductClicks', { count: 28 }),
    },
    {
      name: t('live.demoProductDress'),
      stat: t('live.demoProductClicks', { count: 19 }),
    },
    {
      name: t('live.demoProductJacket'),
      stat: t('live.demoProductClicks', { count: 14 }),
    },
  ];
  const createLiveBlockedReason = !newLiveNotes.trim()
    ? t('live.createLiveMissingNotes')
    : isSavingLive
      ? t('live.actionInProgress')
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
      Alert.alert(t('live.sessionTitle'), t('live.noActiveSession'));
      return;
    }

    if (!newLiveNotes.trim()) {
      Alert.alert(t('live.title'), t('live.createLiveMissingNotes'));
      return;
    }

    const branchId = Number(session.branchId);

    if (!Number.isFinite(branchId) || branchId <= 0) {
      Alert.alert(t('live.title'), t('live.invalidBranch'));
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
        title: t('live.liveCreatedTitle'),
        message: t('live.liveCreatedDetail', {
          id: live.id,
          notes: live.notes || liveNotes,
        }),
        tone: 'success',
      });
      await loadData();
    } catch (err: any) {
      setLiveNotice({
        title: t('live.liveCreateErrorTitle'),
        message: err?.message || t('live.liveCreateError'),
        tone: 'danger',
      });
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
      setActivateLiveToConfirm(null);
      await saveSelectedLiveId(session.branchId, session.userId, updated.id);
      await loadData();
      setLiveNotice({
        title: t('live.liveActivatedTitle'),
        message: t('live.liveActivated', { id: updated.id }),
        tone: 'success',
      });
    } catch (err: any) {
      setLiveNotice({
        title: t('live.liveActivationErrorTitle'),
        message: err?.message || t('live.liveActivationError'),
        tone: 'danger',
      });
    } finally {
      setIsSavingLive(false);
    }
  };

  const handleCloseLive = (live: Live) => {
    setCloseLiveToConfirm(live);
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
        title: t('live.liveClosedTitle'),
        message: t('live.liveClosed', { id: closedLive.id }),
        tone: 'success',
      });
    } catch (err: any) {
      setLiveNotice({
        title: t('live.liveCloseErrorTitle'),
        message: err?.message || t('live.liveCloseError'),
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
      Alert.alert(t('live.title'), t('live.itemNotFound'));
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
      Alert.alert(t('live.sessionTitle'), t('live.noActiveSession'));
      return false;
    }

    if (!selectedLive || !isLiveOperable(selectedLive)) {
      Alert.alert(t('live.title'), t('live.selectOpenLiveReason'));
      return false;
    }

    if (!liveChannelId) {
      Alert.alert(t('live.title'), t('live.channelDisabled'));
      return false;
    }

    if (!selectedCustomer) {
      Alert.alert(t('live.title'), t('live.selectCustomerReason'));
      return false;
    }

    if (!selectedItem) {
      Alert.alert(t('live.title'), t('live.selectOrScanItem'));
      return false;
    }

    const price = Number(priceText);

    if (!priceText.trim() || Number.isNaN(price) || price <= 0) {
      Alert.alert(t('live.title'), t('live.validPrice'));
      return false;
    }

    return true;
  };

  const handleCreateReservation = async () => {
    if (reservationPendingReason) {
      setReservationIssue(reservationPendingReason);
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
        title: t('live.reservationCreatedTitle'),
        message: t('live.reservationCreated', { id: reservation.id }),
        tone: 'success',
      });
    } catch (err: any) {
      setLiveNotice({
        title: t('live.reservationCreateErrorTitle'),
        message: err?.message || t('live.reservationCreateError'),
        tone: 'danger',
      });
    } finally {
      setIsSavingReservation(false);
    }
  };

  const handleReservationIssueAction = () => {
    const issue = reservationIssue || '';
    const normalizedIssue = normalize(issue);
    setReservationIssue(null);

    if (normalizedIssue.includes('cliente') || normalizedIssue.includes('customer')) {
      setIsCustomerModalVisible(true);
      return;
    }

    if (
      normalizedIssue.includes('prenda') ||
      normalizedIssue.includes('item')
    ) {
      setIsItemModalVisible(true);
    }
  };

  const reservationIssueActionLabel =
    reservationIssue &&
    (normalize(reservationIssue).includes('cliente') ||
      normalize(reservationIssue).includes('customer'))
      ? t('live.selectCustomer')
      : reservationIssue &&
          (normalize(reservationIssue).includes('prenda') ||
            normalize(reservationIssue).includes('item'))
        ? t('live.searchItem')
        : t('common.understood');

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
          {t('live.title')}
        </AppText>
        {liveLoadIssue ? (
          <AppInfoCard title={t('live.liveLoadIssueTitle')}>
            <AppText>{liveLoadIssue}</AppText>
          </AppInfoCard>
        ) : null}
        {reservationLoadIssue ? (
          <AppInfoCard title={t('live.reservationLoadIssueTitle')}>
            <AppText>{reservationLoadIssue}</AppText>
          </AppInfoCard>
        ) : null}

        <AppCard>
          <View style={styles.statusHeader}>
            <View style={styles.statusTextBlock}>
              <AppText variant="subtitle" bold>
                {t('live.operationalStatusTitle')}
              </AppText>
              <AppText color={theme.colors.mutedText}>{statusHelp}</AppText>
            </View>
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: statusBackground,
                  borderColor: statusColor,
                },
              ]}
            >
              <AppText color={statusColor} bold>
                {statusLabel}
              </AppText>
            </View>
          </View>
          <View style={styles.statusHint}>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {actionHint}
            </AppText>
          </View>
        </AppCard>

        <AppCard>
          <View style={styles.demoHeader}>
            <View style={styles.statusTextBlock}>
              <View style={styles.demoTitleRow}>
                <AppText variant="subtitle" bold>
                  {t('live.demoMetricsTitle')}
                </AppText>
                <View
                  style={[
                    styles.demoBadge,
                    {
                      backgroundColor: theme.colors.infoCardBackground,
                      borderColor: theme.colors.accent,
                    },
                  ]}
                >
                  <AppText variant="caption" color={theme.colors.accent} bold>
                    {t('live.demoModeBadge')}
                  </AppText>
                </View>
              </View>
              <AppText color={theme.colors.mutedText}>
                {t('live.demoMetricsHelp')}
              </AppText>
            </View>

            <Pressable
              onPress={() => setShowDemoMetrics((current) => !current)}
              style={({ pressed }) => [
                styles.demoToggle,
                {
                  borderColor: theme.colors.border,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <AppText variant="caption" bold>
                {showDemoMetrics
                  ? t('live.demoHideMetrics')
                  : t('live.demoShowMetrics')}
              </AppText>
            </Pressable>
          </View>

          {showDemoMetrics ? (
            <>
              <AppResponsiveGrid tabletColumns={3} desktopColumns={3} style={styles.demoMetricGrid}>
                {demoMetricCards.map((metric) => (
                  <View
                    key={metric.label}
                    style={[
                      styles.demoMetricCard,
                      {
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.surface,
                      },
                    ]}
                  >
                    <AppText variant="caption" color={theme.colors.mutedText}>
                      {metric.label}
                    </AppText>
                    <AppText variant="title" color={theme.colors.accent} bold>
                      {metric.value}
                    </AppText>
                    <AppText variant="caption" color={theme.colors.mutedText}>
                      {metric.helper}
                    </AppText>
                  </View>
                ))}
              </AppResponsiveGrid>

              <View style={styles.demoSplitRow}>
                <View
                  style={[
                    styles.demoPanel,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surface,
                    },
                  ]}
                >
                  <AppText bold>{t('live.demoActivityTitle')}</AppText>
                  <View style={styles.demoBars}>
                    {[28, 56, 44, 72, 62, 88, 50, 66].map((height, index) => (
                      <View
                        key={`${height}-${index}`}
                        style={[
                          styles.demoBar,
                          {
                            height,
                            backgroundColor: theme.colors.accent,
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <AppText variant="caption" color={theme.colors.mutedText}>
                    {t('live.demoActivityHelp')}
                  </AppText>
                </View>

                <View
                  style={[
                    styles.demoPanel,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surface,
                    },
                  ]}
                >
                  <AppText bold>{t('live.demoFeaturedProductsTitle')}</AppText>
                  {demoProducts.map((product) => (
                    <View key={product.name} style={styles.demoProductRow}>
                      <AppText>{product.name}</AppText>
                      <AppText variant="caption" color={theme.colors.accent} bold>
                        {product.stat}
                      </AppText>
                    </View>
                  ))}
                </View>
              </View>

              <View
                style={[
                  styles.demoPanel,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
              >
                <AppText bold>{t('live.demoTimelineTitle')}</AppText>
                {demoTimeline.map((event) => (
                  <View key={`${event.time}-${event.label}`} style={styles.demoTimelineRow}>
                    <View
                      style={[
                        styles.demoTimelineDot,
                        { backgroundColor: theme.colors.accent },
                      ]}
                    />
                    <AppText variant="caption" color={theme.colors.mutedText}>
                      {event.time}
                    </AppText>
                    <AppText>{event.label}</AppText>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <AppText color={theme.colors.mutedText}>
              {t('live.demoMetricsCollapsed')}
            </AppText>
          )}
        </AppCard>

        {filteredLives.length > 0 ? (
          <AppCard>
            <AppText variant="subtitle" bold>
              {t('live.openLivesTitle')}
            </AppText>
            <AppText color={theme.colors.mutedText}>
              {t('live.openLivesHelp')}
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
                    <AppText bold>{t('live.liveNumber', { id: live.id })}</AppText>
                    <AppText variant="caption" color={theme.colors.mutedText}>
                      {getLiveStatusLabel(live.status)}
                    </AppText>
                    {live.notes ? (
                      <AppText numberOfLines={2}>{live.notes}</AppText>
                    ) : null}
                    {selected ? (
                      <AppText variant="caption" color={theme.colors.accent} bold>
                        {t('live.selectedLive')}
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
            {t('live.liveSessionTitle')}
          </AppText>

            <>
              <AppText bold>{t('live.liveNumber', { id: selectedLive.id })}</AppText>
              <AppText color={theme.colors.mutedText}>
                {t('live.status', {
                  status: getLiveStatusLabel(selectedLive.status),
                })}
              </AppText>
              {selectedLive.status !== 'CLOSED' ? (
                <AppText variant="caption" color={theme.colors.accent} bold>
                  {t('live.capturingHelp')}
                </AppText>
              ) : null}
              {selectedLive.notes ? <AppText>{selectedLive.notes}</AppText> : null}

              <View style={styles.buttonRow}>
                {selectedLive.status === 'OPEN' ? (
                  <View style={styles.buttonFill}>
                    <AppButton
                      title={t('live.activateLive')}
                      onPress={() => setActivateLiveToConfirm(selectedLive)}
                      loading={isSavingLive}
                    />
                  </View>
                ) : null}
              </View>
            </>
          </AppCard>
        ) : (
          <AppInfoCard title={t('live.liveSessionTitle')}>
            <AppText color={theme.colors.infoCardText}>
              {t('live.liveSessionEmpty')}
            </AppText>
          </AppInfoCard>
        )}

        <AppCard>
          <AppText variant="subtitle" bold>
            {t('live.createLiveTitle')}
          </AppText>
          <AppText color={theme.colors.mutedText}>
            {t('live.createLiveHelp')}
          </AppText>

          <AppInput
            label={t('live.locationNotesLabel')}
            value={newLiveNotes}
            onChangeText={setNewLiveNotes}
            placeholder={t('live.locationNotesPlaceholder')}
            multiline
          />

          <AppButton
            title={t('live.createLive')}
            onPress={handleCreateLive}
            loading={isSavingLive}
            disabled={isSavingLive || !newLiveNotes.trim()}
            disabledReason={createLiveBlockedReason}
          />
        </AppCard>

        {false && !selectedLiveIsOperable && filteredLives.length > 0 ? (
          <AppCard>
            <AppText variant="subtitle" bold>
              {t('live.openLivesTitle')}
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
                  <AppText bold>{t('live.liveNumber', { id: live.id })}</AppText>
                  <AppText color={theme.colors.mutedText}>
                    {getLiveStatusLabel(live.status)}
                    {live.notes ? ` · ${live.notes}` : ''}
                  </AppText>
                  {selected ? (
                    <AppText variant="caption" color={theme.colors.accent} bold>
                      {t('live.selectedLive')}
                    </AppText>
                  ) : null}
                </Pressable>
              );
            })}
          </AppCard>
        ) : null}

        <AppCard>
          <AppText variant="subtitle" bold>
            {t('live.captureReservationTitle')}
          </AppText>

          {!selectedLive || !isLiveOperable(selectedLive) ? (
            <AppText color={theme.colors.mutedText}>
              {t('live.selectLiveToCapture')}
            </AppText>
          ) : null}

          <View style={styles.sectionSpacing}>
            <AppText bold>{t('live.customer')}</AppText>
            <AppText>
              {selectedCustomer
                ? selectedCustomer.name
                : t('live.selectCustomerHelp')}
            </AppText>

            <AppButton
              title={
                selectedCustomer
                  ? t('live.changeCustomer')
                  : t('live.selectCustomer')
              }
              variant="operation"
              onPress={() => setIsCustomerModalVisible(true)}
            />
          </View>

          <View style={styles.sectionSpacing}>
            <AppText bold>{t('live.item')}</AppText>
            <AppText>
              {selectedItem
                ? `${selectedItem.code} · ${selectedItem.productTypeName || t('live.noType')}`
                : t('live.itemHelp')}
            </AppText>

            <AppInput
              placeholder={t('live.scanPlaceholder')}
              value={scanInput}
              onChangeText={setScanInput}
              onSubmitEditing={() => addItemByCode(scanInput)}
            />

            <View style={styles.buttonRow}>
              <View style={styles.buttonFill}>
                <AppButton
                  title={t('live.addByCode')}
                  variant="operation"
                  onPress={() => addItemByCode(scanInput)}
                />
              </View>

              <View style={styles.buttonFill}>
                <AppButton
                  title={t('live.scanQr')}
                  variant="secondary"
                  onPress={() => setIsScannerVisible(true)}
                />
              </View>
            </View>

            <View style={styles.buttonRow}>
              <View style={styles.buttonFill}>
                <AppButton
                  title={t('live.searchItem')}
                  variant="secondary"
                  onPress={() => setIsItemModalVisible(true)}
                />
              </View>
              <View style={styles.buttonFill}>
                <AppButton
                  title={t('live.quickItem')}
                  variant="secondary"
                  onPress={() =>
                    router.push('/items-create?returnTo=/live' as any)
                  }
                />
              </View>
            </View>
            </View>

          <AppInput
            label={t('live.price')}
            value={priceText}
            onChangeText={setPriceText}
            placeholder="0.00"
            keyboardType="numeric"
          />

          <AppButton
            title={t('live.addReservation')}
            onPress={handleCreateReservation}
            loading={isSavingReservation}
            disabled={isSavingReservation}
          />
        </AppCard>

        <AppCard>
          <AppText variant="subtitle" bold>
            {t('live.recentReservations')}
          </AppText>

          {recentReservations.length === 0 ? (
            <AppText color={theme.colors.mutedText}>
              {t('live.noRecentReservations')}
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
                    {settled ? ` - ${t('live.settled')}` : ''}
                  </AppText>
                  <AppText variant="caption" color={theme.colors.mutedText}>
                    {t('live.liveNumber', {
                      id: reservation.liveId || selectedLive?.id || '-',
                    })}
                  </AppText>
                  <AppText variant="caption" color={theme.colors.mutedText}>
                    {t('live.reservedBy', {
                      seller: getReservationSellerLabel(reservation),
                    })}
                  </AppText>
                  <AppText variant="caption" color={theme.colors.mutedText}>
                    {t('live.date', {
                      date: formatDateTime(reservation.createdAt),
                    })}
                  </AppText>
                  <View style={styles.buttonRow}>
                    <View style={styles.buttonFill}>
                      <AppButton
                        title={t('live.viewDetail')}
                        variant="secondary"
                        onPress={() => goToReservationDetail(reservation.id)}
                      />
                    </View>
                    {!settled ? (
                      <View style={styles.buttonFill}>
                        <AppButton
                          title={t('live.charge')}
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
              {t('live.closeLiveTitle')}
            </AppText>
            <AppText color={theme.colors.mutedText}>
              {t('live.closeLiveHelp')}
            </AppText>
            {selectedLive.status === 'CLOSED' ? (
              <AppButton
                title={t('live.liveClosedButton')}
                variant="cancel"
                disabled
                style={styles.buttonSpacing}
              />
            ) : (
              <AppButton
                title={t('live.closeLive')}
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
              {t('live.openLivesTitle')}
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
                  <AppText bold>{t('live.liveNumber', { id: live.id })}</AppText>
                  <AppText color={theme.colors.mutedText}>
                    {getLiveStatusLabel(live.status)}
                    {live.notes ? ` · ${live.notes}` : ''}
                  </AppText>
                  {selected ? (
                    <AppText variant="caption" color={theme.colors.accent} bold>
                      {t('live.selectedLive')}
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
        title={t('live.selectCustomerModal')}
        onClose={() => setIsCustomerModalVisible(false)}
        scroll={false}
      >
        <AppInput
          placeholder={t('live.searchCustomer')}
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
              subtitle={`${item.phone || t('live.noPhone')}${
                item.isGeneric ? ` · ${t('live.generic')}` : ''
              }`}
              onPress={() => selectCustomer(item)}
            />
          )}
          ListEmptyComponent={
            <AppText>
              {customerLoadIssue || t('live.noActiveCustomers')}
            </AppText>
          }
        />
      </AppBottomModal>

      <AppBottomModal
        visible={isItemModalVisible}
        title={t('live.selectItemModal')}
        onClose={() => setIsItemModalVisible(false)}
        scroll={false}
      >
        <AppInput
          placeholder={t('live.searchItemPlaceholder')}
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
              subtitle={`${item.productTypeName || t('live.noType')} · ${
                item.brandName || t('live.noBrand')
              } · ${item.sizeName || t('live.noSize')}`}
              onPress={() => selectItem(item)}
            >
              <AppText variant="caption" color={theme.colors.mutedText}>
                {t('live.suggestedPrice')}{' '}
                {item.price !== null && item.price !== undefined
                  ? formatMoney(item.price)
                  : t('live.noPrice')}
              </AppText>
            </AppOptionRow>
          )}
          ListEmptyComponent={
            <AppText>
              {itemLoadIssue || t('live.noAvailableItems')}
            </AppText>
          }
        />
      </AppBottomModal>


      <AppBottomModal
        visible={activateLiveToConfirm !== null}
        title={t('live.activateLiveModalTitle')}
        onClose={() => setActivateLiveToConfirm(null)}
        showCancelButton={false}
      >
        <AppText>{t('live.activateLiveModalBody')}</AppText>
        {activateLiveToConfirm ? (
          <AppText color={theme.colors.mutedText}>
            {t('live.liveNumber', { id: activateLiveToConfirm.id })}
            {activateLiveToConfirm.notes ? ` - ${activateLiveToConfirm.notes}` : ''}
          </AppText>
        ) : null}
        <View style={styles.buttonRow}>
          <View style={styles.buttonFill}>
            <AppButton
              title={t('common.cancel')}
              variant="secondary"
              onPress={() => setActivateLiveToConfirm(null)}
              disabled={isSavingLive}
            />
          </View>
          <View style={styles.buttonFill}>
            <AppButton
              title={t('live.confirmActivate')}
              onPress={() =>
                activateLiveToConfirm
                  ? handleActivateLive(activateLiveToConfirm)
                  : undefined
              }
              loading={isSavingLive}
              disabled={isSavingLive}
            />
          </View>
        </View>
      </AppBottomModal>

      <AppBottomModal
        visible={closeLiveToConfirm !== null}
        title={t('live.closeLiveModalTitle')}
        onClose={() => setCloseLiveToConfirm(null)}
        showCancelButton={false}
      >
        <AppText>
          {t('live.closeLiveModalBody')}
        </AppText>
        <AppText color={theme.colors.warning} bold>
          {t('live.closeLiveModalWarning')}
        </AppText>
        {closeLiveToConfirm ? (
          <AppText color={theme.colors.mutedText}>
            {t('live.liveNumber', { id: closeLiveToConfirm.id })}
            {closeLiveToConfirm.notes ? ` - ${closeLiveToConfirm.notes}` : ''}
          </AppText>
        ) : null}
        <View style={styles.buttonRow}>
          <View style={styles.buttonFill}>
            <AppButton
              title={t('common.cancel')}
              variant="secondary"
              onPress={() => setCloseLiveToConfirm(null)}
              disabled={isSavingLive}
            />
          </View>
          <View style={styles.buttonFill}>
            <AppButton
              title={t('live.confirmClose')}
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
        title={t('live.reservationIssueTitle')}
        onClose={() => setReservationIssue(null)}
        showCancelButton={false}
      >
        <AppText>
          {t('live.reservationIssueBody')}
        </AppText>
        <AppText color={theme.colors.warning} bold>
          {reservationIssue}
        </AppText>
        <View style={styles.buttonRow}>
          <View style={styles.buttonFill}>
            <AppButton
              title={t('common.close')}
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

      <LiveNoticeModal
        notice={liveNotice}
        onClose={() => setLiveNotice(null)}
      />
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
  demoBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  demoBar: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    flex: 1,
    minWidth: 12,
  },
  demoBars: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 6,
    height: 96,
    marginTop: 12,
  },
  demoHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  demoMetricCard: {
    borderWidth: 1,
    gap: 6,
    minHeight: 118,
    padding: 12,
  },
  demoMetricGrid: {
    marginTop: 14,
  },
  demoPanel: {
    borderWidth: 1,
    flex: 1,
    gap: 10,
    minWidth: 240,
    padding: 12,
  },
  demoProductRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  demoSplitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  demoTimelineDot: {
    height: 10,
    width: 10,
  },
  demoTimelineRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  demoTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  demoToggle: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  noticeBackdrop: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  noticeDialog: {
    borderWidth: 1,
    elevation: 5,
    gap: 14,
    maxWidth: 420,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    width: '100%',
  },
  recentRow: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  sectionSpacing: {
    marginTop: 12,
    gap: 8,
  },
  statusHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  statusHint: {
    marginTop: 10,
  },
  statusPill: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusTextBlock: {
    flex: 1,
    minWidth: 220,
  },
});
