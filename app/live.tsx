import QRScannerModal from '@/components/qr/QRScannerModal';
import LiveDesktopLayout from '@/components/live/LiveDesktopLayout';
import LiveMobileLayout from '@/components/live/LiveMobileLayout';
import LiveTabletLayout from '@/components/live/LiveTabletLayout';
import {
  LiveActionCard,
  LiveCompactCard,
  LiveInfoCard,
  LiveMetricCard,
  LiveWarningCard,
} from '@/components/live/LiveCommerceCards';
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
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { hasEffectivePermission } from '@/services/accessControl';
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
  getLiveById,
  getLiveEvents,
  getLivesByBranch,
  getLiveStatusLabel,
  isLiveOperable,
  Live,
  LiveEvent,
  setLiveActiveItem,
} from '@/services/liveService';
import {
  clearSelectedLiveId,
  getSelectedLiveId,
  saveSelectedLiveId,
} from '@/services/liveWorkflowStorage';
import {
  DEFAULT_LIVE_LAYOUT_PREFERENCES,
  getLiveLayoutPreferences,
  LiveLayoutPreferences,
} from '@/services/liveLayoutPreferences';
import {
  canOperateLive,
  canSelectLiveCustomer,
  canSelectLiveItem,
  canViewLive,
  canViewLiveAnalytics,
} from '@/services/livePermissionGuards';
import { resolveLiveActorContext } from '@/services/liveActorResolver';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  createReservation,
  getReservationsByBranch,
  LiveReservationOperationalStatus,
  Reservation,
  updateLiveReservationOperationalStatus,
} from '@/services/reservationService';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

type ActivityFeedEvent = {
  badge: string;
  label: string;
  time: string;
  tone: 'success' | 'neutral' | 'info' | 'accent';
};

type LiveNoticeModalProps = {
  notice: LiveNotice | null;
  onClose: () => void;
};

const LIVE_MINIMAL_OPERATIONAL_MODE = true;
const LIVE_ACTIVE_ITEM_POLL_MS = 5000;

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

function formatLiveEventTime(value?: string | null) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatLiveDateTime(value?: string | null) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString([], {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getLiveTimestamp(live?: Live | null) {
  if (!live) return 0;
  const value = live.endedAt || live.startedAt || live.createdAt;
  const time = value ? new Date(value).getTime() : 0;
  return Number.isNaN(time) ? 0 : time;
}

function formatLiveDuration(start?: string | null, end?: string | null) {
  if (!start || !end) return '';
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  if (Number.isNaN(startTime) || Number.isNaN(endTime) || endTime <= startTime) {
    return '';
  }
  const totalMinutes = Math.round((endTime - startTime) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
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

function getItemStatusLabel(status: string | null | undefined, t: (key: string) => string) {
  switch (normalizeStatus(status)) {
    case 'AVAILABLE':
      return t('live.itemStatusAvailable');
    case 'RESERVED':
      return t('live.itemStatusReserved');
    case 'SOLD':
      return t('live.itemStatusSold');
    case 'DISABLED':
      return t('live.itemStatusDisabled');
    case 'ON_CONSIGNMENT':
      return t('live.itemStatusConsignment');
    default:
      return t('live.itemStatusUnknown');
  }
}

function activeItemFromLive(live: Live | null): Item | null {
  if (!live?.activeItemId) return null;

  return {
    id: live.activeItemId,
    code: live.activeItemCode || `#${live.activeItemId}`,
    qrCode: live.activeItemQrCode ?? null,
    branchId: live.activeItemBranchId ?? live.branchId,
    productTypeId: 0,
    productTypeName: live.activeItemProductTypeName ?? undefined,
    brandName: live.activeItemBrandName ?? undefined,
    sizeName: live.activeItemSizeName ?? undefined,
    price: live.activeItemPrice ?? null,
    status: (live.activeItemStatus || 'AVAILABLE') as Item['status'],
  };
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
      return code || 'No capturado';
  }
}

function isReservationSettled(reservation: Reservation, paid: number) {
  return paid >= Number(reservation.price || 0) && Number(reservation.price || 0) > 0;
}

function isBlockingLiveReservation(reservation: Reservation) {
  const reservationStatus = normalizeStatus(reservation.status);
  const operationalStatus = getLiveReservationOperationalStatus(reservation);

  return (
    !['CANCELLED', 'COMPLETED', 'CONVERTED_TO_SALE'].includes(reservationStatus) &&
    operationalStatus !== 'CANCELLED'
  );
}

function getLiveReservationOperationalStatus(
  reservation: Reservation
): LiveReservationOperationalStatus {
  const status = normalizeStatus(reservation.liveOperationalStatus);

  if (
    status === 'PENDING' ||
    status === 'RESERVED' ||
    status === 'OPERATIONAL_SOLD' ||
    status === 'CANCELLED'
  ) {
    return status;
  }

  if (normalizeStatus(reservation.status) === 'CANCELLED') {
    return 'CANCELLED';
  }

  return 'RESERVED';
}

function getOperationalStatusLabel(
  status: LiveReservationOperationalStatus,
  t: (key: string) => string
) {
  switch (status) {
    case 'OPERATIONAL_SOLD':
      return t('live.operationalSoldStatus');
    case 'CANCELLED':
      return t('live.operationalStatusCancelled');
    case 'PENDING':
      return t('live.operationalStatusPending');
    case 'RESERVED':
    default:
      return t('live.operationalStatusReserved');
  }
}

function getLiveReservationOperationalStatusLabel(
  status: LiveReservationOperationalStatus,
  t: (key: string) => string
) {
  switch (status) {
    case 'PENDING':
      return t('live.operationalStatusPending');
    case 'RESERVED':
      return t('live.operationalStatusReserved');
    case 'OPERATIONAL_SOLD':
      return t('live.operationalSoldStatus');
    case 'CANCELLED':
      return t('live.operationalStatusCancelled');
    default:
      return t('live.operationalStatusReserved');
  }
}

function getLiveEventLabel(
  event: LiveEvent,
  t: (key: string, options?: Record<string, unknown>) => string
) {
  switch (event.eventType) {
    case 'LIVE_STARTED':
      return t('live.eventLiveStarted');
    case 'LIVE_CLOSED':
      return t('live.eventLiveClosed');
    case 'ACTIVE_ITEM_CHANGED':
      return t('live.eventActiveItemChanged', { id: event.entityId || '-' });
    case 'LIVE_RESERVATION_CREATED':
      return t('live.eventReservationCreated', { id: event.entityId || '-' });
    case 'LIVE_RESERVATION_STATUS_CHANGED':
      return t('live.eventReservationStatusChanged', { id: event.entityId || '-' });
    case 'LIVE_OPERATIONAL_SOLD':
      return t('live.eventOperationalSold', { id: event.entityId || '-' });
    case 'LIVE_RESERVATION_CANCELLED':
      return t('live.eventReservationCancelled', { id: event.entityId || '-' });
    default:
      return event.eventType;
  }
}

function getLiveEventBadge(eventType: string, t: (key: string) => string) {
  if (eventType.includes('RESERVATION')) return t('live.activityBadgeReservation');
  if (eventType.includes('ITEM')) return t('live.activityBadgeProduct');
  if (eventType.includes('SOLD')) return t('live.activityBadgeSold');
  return t('live.activityBadgeLive');
}

function getLiveEventTone(eventType: string): ActivityFeedEvent['tone'] {
  if (eventType.includes('SOLD')) return 'success';
  if (eventType.includes('ITEM')) return 'accent';
  if (eventType.includes('CANCELLED') || eventType.includes('CLOSED')) return 'neutral';
  return 'info';
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
  const insets = useSafeAreaInsets();
  const { isDesktop, isTablet, isPhone } = useResponsiveLayout();
  const { t } = useTranslation('common');
  const LiveLayout = isDesktop
    ? LiveDesktopLayout
    : isTablet
      ? LiveTabletLayout
      : LiveMobileLayout;

  const [session, setSession] = useState<UserSession | null>(null);
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingLive, setIsSavingLive] = useState(false);
  const [isSavingActiveItem, setIsSavingActiveItem] = useState(false);
  const [isSavingReservation, setIsSavingReservation] = useState(false);
  const [liveNotice, setLiveNotice] = useState<LiveNotice | null>(null);
  const [closeLiveToConfirm, setCloseLiveToConfirm] = useState<Live | null>(null);
  const [activateLiveToConfirm, setActivateLiveToConfirm] = useState<Live | null>(null);
  const [reservationIssue, setReservationIssue] = useState<string | null>(null);
  const [showDemoMetrics, setShowDemoMetrics] = useState(true);
  const [liveLayoutPreferences, setLiveLayoutPreferences] =
    useState<LiveLayoutPreferences>(DEFAULT_LIVE_LAYOUT_PREFERENCES);
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
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [liveEventsLiveId, setLiveEventsLiveId] = useState<number | null>(null);
  const [branchReservations, setBranchReservations] = useState<Reservation[]>([]);
  const [paidByReservationId, setPaidByReservationId] = useState<Record<number, number>>({});
  const [updatingOperationalReservationId, setUpdatingOperationalReservationId] =
    useState<number | null>(null);
  const [expandedClosedLiveReservationsId, setExpandedClosedLiveReservationsId] =
    useState<number | null>(null);
  const [expandedClosedLiveEventsId, setExpandedClosedLiveEventsId] =
    useState<number | null>(null);
  const [selectedClosedLiveSource, setSelectedClosedLiveSource] = useState<
    'auto' | 'recent' | 'history'
  >('auto');
  const [isFullLiveHistoryExpanded, setIsFullLiveHistoryExpanded] = useState(false);
  const [isLoadingClosedLiveEvents, setIsLoadingClosedLiveEvents] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [activeItem, setActiveItem] = useState<Item | null>(null);
  const [priceText, setPriceText] = useState('');
  const [scanInput, setScanInput] = useState('');
  const activeItemRef = useRef<Item | null>(null);
  const activeLivePollInFlightRef = useRef(false);
  const setActiveItemForReservation = useCallback((item: Item | null) => {
    setActiveItem(item);
    setPriceText(
      item?.price !== null && item?.price !== undefined ? String(item.price) : ''
    );
  }, []);

  useEffect(() => {
    activeItemRef.current = activeItem;
  }, [activeItem]);

  const [customerSearch, setCustomerSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [isCustomerModalVisible, setIsCustomerModalVisible] = useState(false);
  const [isItemModalVisible, setIsItemModalVisible] = useState(false);
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const refreshLiveLayoutPreferences = useCallback(async (userId?: number | null) => {
    try {
      setLiveLayoutPreferences(await getLiveLayoutPreferences(userId));
    } catch {
      setLiveLayoutPreferences(DEFAULT_LIVE_LAYOUT_PREFERENCES);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshLiveLayoutPreferences(session?.userId);
      checkAccessAndLoad();
      // checkAccessAndLoad depends on the current screen state and intentionally
      // refreshes every time the route receives focus.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshLiveLayoutPreferences, session?.userId])
  );

  const checkAccessAndLoad = async () => {
    try {
      const currentSession = await getSession();
      const allowed = canViewLive(currentSession);

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
    await refreshLiveLayoutPreferences(currentSession.userId);
    setIsLoading(true);

    try {
      const canLoadCustomers = canSelectLiveCustomer(currentSession);
      const canLoadItems = canSelectLiveItem(currentSession);
      const [liveResult, itemResult, customerResult, reservationResult] =
        await Promise.allSettled([
          getLivesByBranch(currentSession.branchId),
          canLoadItems
            ? getItemsByBranch(currentSession.branchId)
            : Promise.resolve([]),
          canLoadCustomers
            ? getCustomersByBranch(currentSession.branchId)
            : Promise.resolve([]),
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
        !canLoadCustomers
          ? t('live.customerPermissionError')
          : customerResult.status === 'rejected'
          ? resolveLoadIssue(
              customerResult.reason,
              t('live.customerLoadError'),
              t('live.customerPermissionError')
            )
          : null
      );
      setItemLoadIssue(
        !canLoadItems
          ? t('live.itemPermissionError')
          : itemResult.status === 'rejected'
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
        return status !== 'DISABLED';
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
      const latestClosedLive = liveData
        .filter((live) => normalizeStatus(live.status) === 'CLOSED')
        .sort((a, b) => {
          const timeDiff = getLiveTimestamp(b) - getLiveTimestamp(a);
          if (timeDiff !== 0) return timeDiff;
          return b.id - a.id;
        })[0];
      const contextLiveId = nextSelectedLive?.id ?? latestClosedLive?.id;

      setSelectedLive(nextSelectedLive);
      if (!nextSelectedLive) {
        setSelectedClosedLiveSource('auto');
      }
      setActiveItemForReservation(activeItemFromLive(nextSelectedLive));
      await updateRecentReservations(
        reservationData,
        nextSelectedLive?.id,
        hasEffectivePermission(currentSession, 'VIEW_PAYMENTS')
      );
      await updateLiveEvents(contextLiveId);

      const pendingItemIds = await consumePendingQuickItems('live');
      const createdItems = pendingItemIds
        .map((itemId) => availableItems.find((item) => item.id === itemId))
        .filter((item): item is Item => !!item);

      if (createdItems.length > 0) {
        const createdItem = createdItems[0];
        setSelectedItem(createdItem);
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
  const liveActorContext = useMemo(
    () => resolveLiveActorContext(session),
    [session]
  );
  const liveCapabilities = liveActorContext.capabilities;
  const isOperatorFocusedView = liveActorContext.capabilities.viewMode === 'operator';
  const isSupportView = liveActorContext.capabilities.viewMode === 'support';
  const isSupervisorView = liveActorContext.actor === 'SUPERVISOR';
  const selectedLiveStatus = normalizeStatus(selectedLive?.status);

  const filteredLives = useMemo(() => {
    return lives.filter((live) => live.status !== 'CLOSED').slice(0, 10);
  }, [lives]);
  const closedLives = useMemo(
    () =>
      lives
        .filter((live) => normalizeStatus(live.status) === 'CLOSED')
        .sort((a, b) => {
          const timeDiff = getLiveTimestamp(b) - getLiveTimestamp(a);
          if (timeDiff !== 0) return timeDiff;
          return b.id - a.id;
        }),
    [lives]
  );
  const latestClosedLive = closedLives[0] ?? null;
  const highlightedClosedLive =
    selectedLiveStatus === 'CLOSED' && selectedLive ? selectedLive : latestClosedLive;
  const recentLives = useMemo(
    () =>
      closedLives
        .filter((live) => live.id !== highlightedClosedLive?.id)
        .slice(0, 3),
    [closedLives, highlightedClosedLive?.id]
  );

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

  const selectedLiveIsOperable = isLiveOperable(selectedLive);
  const operatorLiveIsActive = selectedLiveStatus === 'ACTIVE';
  const operatorFlowEnabled = !isOperatorFocusedView || operatorLiveIsActive;

  useEffect(() => {
    if (!selectedLive?.id || selectedLiveStatus !== 'ACTIVE') return undefined;

    let cancelled = false;

    const pollActiveLive = async () => {
      if (activeLivePollInFlightRef.current) return;

      activeLivePollInFlightRef.current = true;

      try {
        const refreshedLive = await getLiveById(selectedLive.id);
        if (cancelled) return;

        setLives((currentLives) => {
          const exists = currentLives.some((live) => live.id === refreshedLive.id);

          return exists
            ? currentLives.map((live) =>
                live.id === refreshedLive.id ? refreshedLive : live
              )
            : [refreshedLive, ...currentLives];
        });

        setSelectedLive((currentLive) =>
          currentLive?.id === refreshedLive.id ? refreshedLive : currentLive
        );

        const refreshedStatus = normalizeStatus(refreshedLive.status);
        const refreshedActiveItem =
          refreshedStatus === 'CLOSED' ? null : activeItemFromLive(refreshedLive);
        const currentActiveItem = activeItemRef.current;
        const activeItemChanged =
          currentActiveItem?.id !== refreshedActiveItem?.id ||
          currentActiveItem?.code !== refreshedActiveItem?.code ||
          currentActiveItem?.price !== refreshedActiveItem?.price ||
          currentActiveItem?.status !== refreshedActiveItem?.status;

        if (refreshedStatus === 'CLOSED' || activeItemChanged) {
          setActiveItemForReservation(refreshedActiveItem);
        }

        if (isSupervisorView && session) {
          const [reservationResult, eventResult] = await Promise.allSettled([
            getReservationsByBranch(session.branchId),
            getLiveEvents(refreshedLive.id),
          ]);

          if (cancelled) return;

          if (reservationResult.status === 'fulfilled') {
            setBranchReservations(reservationResult.value);
            setRecentReservations(
              mapLiveReservations(reservationResult.value, refreshedLive.id)
            );
          }

          if (eventResult.status === 'fulfilled') {
            setLiveEvents(eventResult.value);
            setLiveEventsLiveId(refreshedLive.id);
          }
        }
      } catch {
        // Keep the current on-air item on transient polling failures.
      } finally {
        activeLivePollInFlightRef.current = false;
      }
    };

    const interval = setInterval(pollActiveLive, LIVE_ACTIVE_ITEM_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [
    isSupervisorView,
    selectedLive?.id,
    selectedLiveStatus,
    session,
    setActiveItemForReservation,
  ]);

  const hasValidReservationPrice =
    !!priceText.trim() && !Number.isNaN(Number(priceText)) && Number(priceText) > 0;
  const reservationSourcesForActiveItem = [
    ...recentReservations.map((entry) => entry.reservation),
    ...branchReservations,
  ];
  const findBlockingReservationForItem = (itemId?: number | null) =>
    itemId
      ? reservationSourcesForActiveItem.find(
        (reservation, index, reservations) =>
          reservations.findIndex((candidate) => candidate.id === reservation.id) === index &&
          reservation.itemId === itemId &&
          isBlockingLiveReservation(reservation)
      )
      : undefined;
  const activeItemBlockingReservationForValidation = findBlockingReservationForItem(activeItem?.id);
  const reservationPendingReason = !selectedLive || !operatorFlowEnabled
    ? t('live.reserveMissingLive')
    : !activeItem
      ? t('live.reserveMissingActiveItem')
    : activeItemBlockingReservationForValidation
      ? t('live.activeItemAlreadyReservedReason')
    : !hasValidReservationPrice
      ? t('live.reserveMissingPrice')
    : !selectedCustomer
      ? t('live.reserveMissingCustomer')
    : !liveChannelId
      ? t('live.channelReason')
    : '';
  const mayOperateLive = liveCapabilities.canOperateLive;
  const maySelectCustomer = liveCapabilities.canSelectCustomer;
  const mayCreateCustomer = liveCapabilities.canCreateCustomer;
  const maySelectItem = liveCapabilities.canSelectItem;
  const mayCreateItem = liveCapabilities.canCreateItem;
  const canViewPayments = hasEffectivePermission(session, 'VIEW_PAYMENTS');
  const mayViewAnalytics = canViewLiveAnalytics(session);
  const isMobileLayout = isPhone;
  const showRolesWidget =
    !isOperatorFocusedView &&
    !isSupportView &&
    !LIVE_MINIMAL_OPERATIONAL_MODE &&
    liveLayoutPreferences.showRoles &&
    (isTablet || isDesktop);
  const showProductSpotlightWidget =
    liveLayoutPreferences.showProductSpotlight && !isOperatorFocusedView && !isSupportView;
  const showPresenterViewWidget =
    !isOperatorFocusedView &&
    !isSupportView &&
    !LIVE_MINIMAL_OPERATIONAL_MODE && liveLayoutPreferences.showPresenterView;
  const showOperationalStateWidget =
    liveLayoutPreferences.showOperationalState && !isOperatorFocusedView && !isSupportView;
  const showAnalyticsWidget =
    !LIVE_MINIMAL_OPERATIONAL_MODE &&
    liveLayoutPreferences.showAnalytics && mayViewAnalytics && !isMobileLayout;
  const showActivityFeedWidget =
    !LIVE_MINIMAL_OPERATIONAL_MODE &&
    liveLayoutPreferences.showActivityFeed && mayViewAnalytics && !isMobileLayout;
  const showStreamingPanel = showAnalyticsWidget || showActivityFeedWidget;
  const hasLeftColumnWidgets =
    showProductSpotlightWidget ||
    showPresenterViewWidget ||
    showOperationalStateWidget ||
    showStreamingPanel;
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
  const roleCards = [
    {
      title: t('live.presenterRoleTitle'),
      helper: t('live.presenterRoleHelp'),
      value: t('live.presenterRoleValue'),
    },
    {
      title: t('live.operatorRoleTitle'),
      helper: t('live.operatorRoleHelp'),
      value: t('live.operatorRoleValue'),
    },
    {
      title: t('live.supervisorRoleTitle'),
      helper: t('live.supervisorRoleHelp'),
      value: t('live.supervisorRoleValue'),
    },
  ];
  const streamingMetricCards = [
    {
      label: t('live.streamViewers'),
      value: demoMetricCards[0]?.value ?? '0',
      helper: undefined,
    },
    {
      label: t('live.streamReservations'),
      value: String(recentReservations.length),
      helper: undefined,
    },
    {
      label: t('live.streamComments'),
      value: selectedLiveStatus === 'CLOSED' ? '0' : '63',
      helper: undefined,
    },
    {
      label: t('live.streamReactions'),
      value: selectedLiveStatus === 'CLOSED' ? '0' : '312',
      helper: undefined,
    },
  ];
  const visibleDemoMetricCards = isTablet
    ? demoMetricCards.slice(0, 4)
    : demoMetricCards;
  const visibleRecentReservations = isTablet
    ? recentReservations.slice(0, 3)
    : recentReservations;
  const getLiveOperationalSummary = (live: Live) => {
    const liveReservations = branchReservations.filter(
      (reservation) => reservation.liveId === live.id
    );
    const operationalSold = liveReservations.filter(
      (reservation) => getLiveReservationOperationalStatus(reservation) === 'OPERATIONAL_SOLD'
    ).length;
    const cancelled = liveReservations.filter(
      (reservation) => getLiveReservationOperationalStatus(reservation) === 'CANCELLED'
    ).length;
    const selectedEvents = liveEventsLiveId === live.id ? liveEvents : [];
    const activeItemEvents = selectedEvents.filter(
      (event) => normalizeStatus(event.eventType) === 'ACTIVE_ITEM_CHANGED'
    );
    const shownItemsById = new Set(
      activeItemEvents.map((event) => event.entityId).filter((id) => id !== null && id !== undefined)
    ).size;
    const shownItems = shownItemsById > 0 ? shownItemsById : activeItemEvents.length;
    const lastActivity = selectedEvents
      .map((event) => event.createdAt)
      .filter(Boolean)
      .sort()
      .pop();

    return {
      reservations: liveReservations.length,
      operationalSold,
      cancelled,
      events: selectedEvents.length,
      shownItems: selectedEvents.length > 0 ? shownItems : 0,
      lastActivity,
    };
  };
  const hasActiveProduct = !!activeItem;
  const featuredProductName =
    activeItem?.productTypeName ||
    activeItem?.code ||
    t('live.noProductOnScreen');
  const featuredProductMeta = activeItem
    ? [
        activeItem.brandName || t('live.noBrand'),
        activeItem.sizeName || t('live.noSize'),
        session?.branchName || selectedLive?.branchName || t('live.noBranch'),
      ].join(' / ')
    : t('live.noProductOnScreenHelp');
  const featuredProductPrice =
    activeItem?.price !== null && activeItem?.price !== undefined
      ? formatMoney(Number(activeItem.price))
      : t('live.noPriceDefined');
  const featuredProductCode =
    activeItem?.code || t('live.noActiveProductCode');
  const featuredProductSize = activeItem?.sizeName || t('live.noSize');
  const featuredProductStatus = activeItem
    ? getItemStatusLabel(activeItem.status, t)
    : t('live.noProductStatus');
  const featuredProductBranch =
    session?.branchName || selectedLive?.branchName || t('live.noBranch');
  const spotlightBadges = hasActiveProduct
    ? [
        t('live.productOnAirBadge'),
        featuredProductStatus,
        featuredProductBranch,
      ]
    : [t('live.selectItemToShowBadge')];
  const presenterMessage = !selectedLive
    ? t('live.presenterNoLive')
    : !hasActiveProduct
      ? t('live.presenterNoProduct')
      : selectedLiveStatus === 'ACTIVE'
        ? t('live.presenterReadyActive')
        : t('live.presenterReadyOpen');
  const shouldShowDemoMetrics = showAnalyticsWidget && showDemoMetrics;
  const activityFeed: ActivityFeedEvent[] = liveEvents
    .map((event) => ({
      badge: getLiveEventBadge(event.eventType, t),
      label: getLiveEventLabel(event, t),
      time: formatLiveEventTime(event.createdAt) || t('live.activityNow'),
      tone: getLiveEventTone(event.eventType),
    }))
    .slice(0, isTablet ? 4 : isDesktop ? 6 : 3);
  const createLiveBlockedReason = !newLiveNotes.trim()
    ? t('live.createLiveMissingNotes')
    : isSavingLive
      ? t('live.actionInProgress')
      : '';
  const operatorNextStep = !operatorFlowEnabled
    ? t('live.operatorNextStart')
    : !selectedItem && !activeItem
      ? t('live.operatorNextProduct')
    : !activeItem
      ? t('live.operatorNextActiveItem')
    : activeItemBlockingReservationForValidation
      ? t('live.operatorNextChangeReservedItem')
    : !hasValidReservationPrice
      ? t('live.operatorNextPrice')
    : !selectedCustomer
      ? t('live.operatorNextCustomer')
    : t('live.operatorReadyToReserve');
  const operatorLatestReservation = recentReservations[0];
  const operatorLiveStateLabel = operatorLiveIsActive
    ? t('live.operatorLiveActive')
    : selectedLiveStatus === 'CLOSED'
      ? t('live.operatorLiveClosed')
      : t('live.operatorNoLiveActiveShort');
  const operatorLiveStateHelp = operatorLiveIsActive
    ? t('live.operatorLiveActiveHelp')
    : selectedLiveStatus === 'CLOSED'
      ? t('live.operatorLiveClosedHelp')
      : t('live.operatorNoLiveStateHelp');
  const selectedCustomerSummary = useMemo(() => {
    if (!selectedCustomer) {
      return null;
    }

    const customerReservations = branchReservations.filter(
      (reservation) => reservation.customerId === selectedCustomer.id
    );
    const activeReservations = customerReservations.filter((reservation) => {
      const status = getLiveReservationOperationalStatus(reservation);
      return status !== 'CANCELLED' && status !== 'OPERATIONAL_SOLD';
    });
    const pastReservations = customerReservations.filter((reservation) => {
      const status = getLiveReservationOperationalStatus(reservation);
      return (
        status === 'OPERATIONAL_SOLD' ||
        status === 'CANCELLED' ||
        reservation.status === 'COMPLETED' ||
        reservation.status === 'CONVERTED_TO_SALE'
      );
    });
    const pendingBalance = activeReservations.reduce((sum, reservation) => {
      const paid = paidByReservationId[reservation.id] ?? 0;
      const pending = Math.max(Number(reservation.price || 0) - paid, 0);
      return sum + pending;
    }, 0);

    return {
      pastPurchases: pastReservations.length,
      activePurchases: activeReservations.length,
      pendingBalance,
      frequent: customerReservations.length >= 3,
    };
  }, [branchReservations, paidByReservationId, selectedCustomer]);
  const getReservationCustomerInfo = (reservation: Reservation) =>
    customers.find((customer) => customer.id === reservation.customerId);
  const getReservationItemInfo = (reservation: Reservation) =>
    items.find((item) => item.id === reservation.itemId);
  const renderRecentReservationInfo = (
    reservation: Reservation,
    customerName: string,
    itemCode: string,
    operationalStatus: LiveReservationOperationalStatus,
    settled: boolean,
    operationalSold: boolean
  ) => {
    const customer = getReservationCustomerInfo(reservation);
    const item = getReservationItemInfo(reservation);
    const liveLabel = reservation.liveId
      ? t('live.liveNumber', { id: reservation.liveId })
      : t('live.noReservationLive');
    const createdAt = formatLiveDateTime(reservation.createdAt) || t('live.noReservationDate');
    const statusLabel = settled
      ? t('live.settled')
      : operationalSold
        ? t('live.operationalSoldStatus')
        : getLiveReservationOperationalStatusLabel(operationalStatus, t);

    return (
      <LiveCompactCard>
        <View style={styles.recentReservationHeader}>
          <View style={styles.recentReservationText}>
            <View style={styles.recentReservationBadgeRow}>
              <View
                style={[
                  styles.operatorItemBadge,
                  {
                    backgroundColor: theme.colors.infoCardBackground,
                    borderColor: theme.colors.accent,
                    borderRadius: theme.radius.sm,
                  },
                ]}
              >
                <AppText variant="caption" color={theme.colors.accent} bold>
                  {t('live.liveReservationBadge')}
                </AppText>
              </View>
              <AppText variant="caption" color={theme.colors.mutedText}>
                {liveLabel}
              </AppText>
            </View>
            <AppText bold numberOfLines={1}>{customerName}</AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {customer?.phone || t('live.noPhone')}
            </AppText>
          </View>
          <View style={styles.recentReservationPriceBlock}>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {t('live.price')}
            </AppText>
            <AppText color={theme.colors.accent} bold>
              {formatMoney(Number(reservation.price || 0))}
            </AppText>
          </View>
        </View>

        <View style={styles.recentReservationGrid}>
          <View style={styles.recentReservationMeta}>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {t('live.item')}
            </AppText>
            <AppText bold numberOfLines={1}>
              {item?.productTypeName || itemCode}
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
              {itemCode}
            </AppText>
          </View>
          <View style={styles.recentReservationMeta}>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {t('live.operationalStatusTitle')}
            </AppText>
            <AppText bold>{statusLabel}</AppText>
          </View>
          <View style={styles.recentReservationMeta}>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {t('live.liveChannel')}
            </AppText>
            <AppText bold>
              {getSalesChannelLabel(
                reservation.salesChannelCode,
                reservation.salesChannelName
              )}
            </AppText>
          </View>
          <View style={styles.recentReservationMeta}>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {t('live.reservationDate')}
            </AppText>
            <AppText bold>{createdAt}</AppText>
          </View>
          <View style={styles.recentReservationMeta}>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {t('live.branchLabel')}
            </AppText>
            <AppText bold numberOfLines={1}>
              {session?.branchName || selectedLive?.branchName || t('live.notCaptured')}
            </AppText>
          </View>
          <View style={styles.recentReservationMeta}>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {t('live.reservationSeller')}
            </AppText>
            <AppText bold numberOfLines={1}>
              {getReservationSellerLabel(reservation)}
            </AppText>
          </View>
        </View>

        {operationalSold && !settled ? (
          <AppText variant="caption" color={theme.colors.warning}>
            {t('live.operationalSoldPersistedNoPaymentHelp')}
          </AppText>
        ) : null}
      </LiveCompactCard>
    );
  };
  const getItemLiveAvailability = useCallback(
    (item: Item | null) => {
      if (!item) {
        return {
          canGoOnAir: false,
          label: t('live.itemAvailabilityUnknown'),
          reason: t('live.itemAvailabilityUnknownReason'),
          warning: '',
        };
      }

      const itemStatus = normalizeStatus(item.status);
      const itemReservations = branchReservations.filter(
        (reservation) =>
          reservation.itemId === item.id &&
          getLiveReservationOperationalStatus(reservation) !== 'CANCELLED' &&
          normalizeStatus(reservation.status) !== 'CANCELLED'
      );
      const paidAmount = itemReservations.reduce(
        (sum, reservation) => sum + (paidByReservationId[reservation.id] ?? 0),
        0
      );

      if (itemStatus === 'SOLD') {
        return {
          canGoOnAir: false,
          label: t('live.itemNotAvailableSold'),
          reason: t('live.itemCannotGoOnAirPaidOrSold'),
          warning: '',
        };
      }

      if (paidAmount > 0) {
        return {
          canGoOnAir: false,
          label: t('live.itemNotAvailablePaid'),
          reason: t('live.itemCannotGoOnAirPaidOrSold'),
          warning: '',
        };
      }

      if (itemStatus === 'RESERVED') {
        if (itemReservations.length === 0) {
          return {
            canGoOnAir: false,
            label: t('live.itemAvailabilityUnknown'),
            reason: t('live.itemAvailabilityUnknownReason'),
            warning: '',
          };
        }

        if (!canViewPayments) {
          return {
            canGoOnAir: false,
            label: t('live.itemAvailabilityUnknown'),
            reason: t('live.itemAvailabilityUnknownReason'),
            warning: '',
          };
        }

        return {
          canGoOnAir: true,
          label: t('live.itemReservedWithoutPayment'),
          reason: '',
          warning: t('live.itemReservedWithoutPaymentWarning'),
        };
      }

      if (!itemStatus || itemStatus === 'AVAILABLE' || itemStatus === 'ON_CONSIGNMENT') {
        return {
          canGoOnAir: true,
          label: t('live.itemFree'),
          reason: '',
          warning: '',
        };
      }

      return {
        canGoOnAir: false,
        label: t('live.itemAvailabilityUnknown'),
        reason: t('live.itemAvailabilityUnknownReason'),
        warning: '',
      };
    },
    [branchReservations, canViewPayments, paidByReservationId, t]
  );
  const operatorStartDisabledReason = !mayOperateLive
    ? t('live.liveOperatePermissionError')
    : isSavingLive
      ? t('live.actionInProgress')
      : '';
  const operatorFinishDisabledReason = !mayOperateLive
    ? t('live.liveOperatePermissionError')
    : !selectedLiveIsOperable
      ? t('live.selectOpenLiveReason')
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

  const handleSelectLive = (
    live: Live,
    source: 'recent' | 'history' | 'auto' = 'recent'
  ) => {
    setSelectedLive(live);
    setActiveItemForReservation(activeItemFromLive(live));
    updateRecentReservations(branchReservations, live.id);
    void updateLiveEvents(live.id);
    if (normalizeStatus(live.status) === 'CLOSED') {
      setSelectedClosedLiveSource(source);
    }
    if (session && live.status !== 'CLOSED') {
      void saveSelectedLiveId(session.branchId, session.userId, live.id);
    }
  };

  const updateRecentReservations = async (
    reservations: Reservation[],
    liveId?: number | null,
    canLoadPayments = canViewPayments
  ) => {
    const mappedReservations = mapLiveReservations(reservations, liveId);
    setRecentReservations(mappedReservations);

    if (!canLoadPayments) {
      setPaidByReservationId({});
      return;
    }

    const entries = await Promise.all(
      reservations.map(async (reservation) => {
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

  const updateLiveEvents = async (liveId?: number | null) => {
    if (!liveId) {
      setLiveEvents([]);
      setLiveEventsLiveId(null);
      return;
    }

    try {
      setIsLoadingClosedLiveEvents(true);
      setLiveEvents(await getLiveEvents(liveId));
      setLiveEventsLiveId(liveId);
    } catch {
      setLiveEvents([]);
      setLiveEventsLiveId(liveId);
    } finally {
      setIsLoadingClosedLiveEvents(false);
    }
  };

  const handleUpdateReservationOperationalStatus = async (
    reservationId: number,
    status: LiveReservationOperationalStatus
  ) => {
    if (!session || !selectedLive || !canOperateLive(session)) {
      setLiveNotice({
        title: t('live.permissionDeniedTitle'),
        message: t('live.liveOperatePermissionError'),
        tone: 'warning',
      });
      return;
    }

    setUpdatingOperationalReservationId(reservationId);

    try {
      const updatedReservation = await updateLiveReservationOperationalStatus(
        reservationId,
        status
      );

      const applyReservation = (reservation: Reservation) =>
        reservation.id === updatedReservation.id ? updatedReservation : reservation;

      setBranchReservations((current) => current.map(applyReservation));
      setRecentReservations((current) =>
        current.map((entry) =>
          entry.reservation.id === updatedReservation.id
            ? { ...entry, reservation: updatedReservation }
            : entry
        )
      );
      await updateLiveEvents(selectedLive.id);

      setLiveNotice({
        title:
          status === 'OPERATIONAL_SOLD'
            ? t('live.operationalSoldTitle')
            : t('live.operationalStatusUpdatedTitle'),
        message:
          status === 'OPERATIONAL_SOLD'
            ? t('live.operationalSoldMessage')
            : t('live.operationalStatusUpdatedMessage'),
        tone: status === 'CANCELLED' ? 'warning' : 'success',
      });
    } catch (err: any) {
      setLiveNotice({
        title: t('live.operationalStatusUpdateErrorTitle'),
        message: err?.message || t('live.operationalStatusUpdateError'),
        tone: 'danger',
      });
    } finally {
      setUpdatingOperationalReservationId(null);
    }
  };

  const handleCreateLive = async () => {
    if (!session) {
      Alert.alert(t('live.sessionTitle'), t('live.noActiveSession'));
      return;
    }

    if (!canOperateLive(session)) {
      setLiveNotice({
        title: t('live.permissionDeniedTitle'),
        message: t('live.liveOperatePermissionError'),
        tone: 'warning',
      });
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

  const handleStartLiveNow = async () => {
    if (!session) {
      Alert.alert(t('live.sessionTitle'), t('live.noActiveSession'));
      return;
    }

    if (!mayOperateLive) {
      setLiveNotice({
        title: t('live.permissionDeniedTitle'),
        message: t('live.liveOperatePermissionError'),
        tone: 'warning',
      });
      return;
    }

    const branchId = Number(session.branchId);

    if (!Number.isFinite(branchId) || branchId <= 0) {
      Alert.alert(t('live.title'), t('live.invalidBranch'));
      return;
    }

    setIsSavingLive(true);

    try {
      const activeCandidate =
        normalizeStatus(selectedLive?.status) === 'ACTIVE'
          ? selectedLive
          : lives.find((live) => normalizeStatus(live.status) === 'ACTIVE');
      const openCandidate =
        selectedLive && normalizeStatus(selectedLive.status) === 'OPEN'
          ? selectedLive
          : lives.find((live) => normalizeStatus(live.status) === 'OPEN');

      if (activeCandidate) {
        setSelectedLive(activeCandidate);
        setActiveItemForReservation(activeItemFromLive(activeCandidate));
        await updateRecentReservations(branchReservations, activeCandidate.id);
        await updateLiveEvents(activeCandidate.id);
        await saveSelectedLiveId(session.branchId, session.userId, activeCandidate.id);
        await loadData();
        setLiveNotice({
          title: t('live.liveActivatedTitle'),
          message: t('live.operatorLiveAlreadyActive', { id: activeCandidate.id }),
          tone: 'success',
        });
        return;
      }

      const liveToActivate =
        openCandidate ??
        (await createLive(branchId, {
          notes: newLiveNotes.trim() || t('live.operatorDefaultLiveNotes'),
        }));

      const updated = await activateLive(liveToActivate.id);
      setSelectedLive(updated);
      setActiveItemForReservation(activeItemFromLive(updated));
      setLives((current) => {
        const exists = current.some((live) => live.id === updated.id);
        return exists
          ? current.map((live) => (live.id === updated.id ? updated : live))
          : [updated, ...current];
      });
      setNewLiveNotes('');
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

  const handleActivateLive = async (live: Live) => {
    if (!session) return;

    if (!canOperateLive(session)) {
      setLiveNotice({
        title: t('live.permissionDeniedTitle'),
        message: t('live.liveOperatePermissionError'),
        tone: 'warning',
      });
      setActivateLiveToConfirm(null);
      return;
    }

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
    if (!canOperateLive(session)) {
      setLiveNotice({
        title: t('live.permissionDeniedTitle'),
        message: t('live.liveOperatePermissionError'),
        tone: 'warning',
      });
      return;
    }

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
      setSelectedLive(closedLive);
      setActiveItemForReservation(null);
      setSelectedItem(null);
      setSelectedCustomer(null);
      setScanInput('');
      setCloseLiveToConfirm(null);
      if (session) {
        await clearSelectedLiveId(session.branchId, session.userId);
      }
      await updateRecentReservations(branchReservations, closedLive.id);
      await updateLiveEvents(closedLive.id);
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
    if (!canSelectLiveCustomer(session)) {
      setLiveNotice({
        title: t('live.permissionDeniedTitle'),
        message: t('live.customerPermissionError'),
        tone: 'warning',
      });
      return;
    }

    setSelectedCustomer(customer);
    setCustomerSearch('');
    setIsCustomerModalVisible(false);
  };

  const selectItem = (item: Item) => {
    if (!canSelectLiveItem(session)) {
      setLiveNotice({
        title: t('live.permissionDeniedTitle'),
        message: t('live.itemPermissionError'),
        tone: 'warning',
      });
      return;
    }

    const availability = getItemLiveAvailability(item);
    if (!availability.canGoOnAir) {
      setLiveNotice({
        title: t('live.itemCannotGoOnAirTitle'),
        message: availability.reason || t('live.itemCannotGoOnAirPaidOrSold'),
        tone: 'warning',
      });
      return;
    }

    setSelectedItem(item);
    setItemSearch('');
    setIsItemModalVisible(false);

    if (availability.warning) {
      setLiveNotice({
        title: t('live.itemReservedWithoutPayment'),
        message: availability.warning,
        tone: 'warning',
      });
    }
  };

  const handleSetSelectedItemActive = async () => {
    if (!session || !selectedLive || !selectedItem) {
      setLiveNotice({
        title: t('live.activeProductMissingTitle'),
        message: t('live.activeProductMissingMessage'),
        tone: 'warning',
      });
      return;
    }

    if (!canOperateLive(session)) {
      setLiveNotice({
        title: t('live.permissionDeniedTitle'),
        message: t('live.liveOperatePermissionError'),
        tone: 'warning',
      });
      return;
    }

    if (!isLiveOperable(selectedLive)) {
      setLiveNotice({
        title: t('live.activeProductMissingTitle'),
        message: t('live.activeProductLiveClosedMessage'),
        tone: 'warning',
      });
      return;
    }

    const availability = getItemLiveAvailability(selectedItem);
    if (!availability.canGoOnAir) {
      setLiveNotice({
        title: t('live.itemCannotGoOnAirTitle'),
        message: availability.reason || t('live.itemCannotGoOnAirPaidOrSold'),
        tone: 'warning',
      });
      return;
    }

    setIsSavingActiveItem(true);

    try {
      const updated = await setLiveActiveItem(selectedLive.id, selectedItem.id);
      setSelectedLive(updated);
      setLives((current) =>
        current.map((live) => (live.id === updated.id ? updated : live))
      );
      setActiveItemForReservation(activeItemFromLive(updated));
      await updateLiveEvents(updated.id);
      setLiveNotice({
        title: t('live.activeProductUpdatedTitle'),
        message: t('live.activeProductUpdatedMessage', {
          item: selectedItem.code,
        }),
        tone: 'success',
      });
    } catch (err: any) {
      setLiveNotice({
        title: t('live.activeProductUpdateErrorTitle'),
        message: err?.message || t('live.activeProductUpdateError'),
        tone: 'danger',
      });
    } finally {
      setIsSavingActiveItem(false);
    }
  };

  const handleClearActiveItem = async () => {
    if (!session || !selectedLive || !activeItem) {
      return;
    }

    if (!canOperateLive(session)) {
      setLiveNotice({
        title: t('live.permissionDeniedTitle'),
        message: t('live.liveOperatePermissionError'),
        tone: 'warning',
      });
      return;
    }

    if (!operatorFlowEnabled) {
      setLiveNotice({
        title: t('live.activeProductMissingTitle'),
        message: t('live.activeProductLiveClosedMessage'),
        tone: 'warning',
      });
      return;
    }

    setIsSavingActiveItem(true);

    try {
      const updated = await setLiveActiveItem(selectedLive.id, null);
      setSelectedLive(updated);
      setLives((current) =>
        current.map((live) => (live.id === updated.id ? updated : live))
      );
      setActiveItemForReservation(activeItemFromLive(updated));
      await updateLiveEvents(updated.id);
      setLiveNotice({
        title: t('live.activeProductClearedTitle'),
        message: t('live.activeProductClearedMessage'),
        tone: 'success',
      });
    } catch (err: any) {
      setLiveNotice({
        title: t('live.activeProductUpdateErrorTitle'),
        message: err?.message || t('live.activeProductUpdateError'),
        tone: 'danger',
      });
    } finally {
      setIsSavingActiveItem(false);
    }
  };

  const addItemByCode = (value: string) => {
    if (!canSelectLiveItem(session)) {
      setLiveNotice({
        title: t('live.permissionDeniedTitle'),
        message: t('live.itemPermissionError'),
        tone: 'warning',
      });
      return;
    }

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

    if (!canOperateLive(session)) {
      setReservationIssue(t('live.liveOperatePermissionError'));
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

    if (!activeItem) {
      Alert.alert(t('live.title'), t('live.reserveMissingActiveItem'));
      return false;
    }

    if (activeItemBlockingReservationForValidation) {
      setReservationIssue(t('live.activeItemAlreadyReservedReason'));
      return false;
    }

    const availability = getItemLiveAvailability(activeItem);
    if (!availability.canGoOnAir) {
      setReservationIssue(t('live.itemNotAvailableForReservation'));
      return false;
    }

    const price = Number(priceText);

    if (!priceText.trim() || Number.isNaN(price) || price <= 0) {
      Alert.alert(t('live.title'), t('live.reserveMissingPrice'));
      return false;
    }

    if (!selectedCustomer) {
      Alert.alert(t('live.title'), t('live.selectCustomerReason'));
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
      !activeItem ||
      !selectedLive ||
      !liveChannelId
    ) {
      return;
    }

    setIsSavingReservation(true);

    try {
      const price = Number(priceText);

      const reservation = await createReservation({
        itemId: activeItem.id,
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
          itemCode: activeItem.code,
        },
        ...current,
      ].slice(0, 10));
      setBranchReservations((current) => {
        const withoutDuplicate = current.filter((entry) => entry.id !== reservation.id);
        return [reservation, ...withoutDuplicate];
      });
      setActiveItemForReservation({
        ...activeItem,
        status: 'RESERVED',
      });

      setSelectedItem(null);
      setSelectedCustomer(null);
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
  const renderOperatorItemCard = (
    item: Item | null,
    options: {
      title: string;
      emptyText: string;
      highlighted?: boolean;
      showOnAirAction?: boolean;
      showActiveActions?: boolean;
    }
  ) => {
    if (!item) {
      return (
        <View
          style={[
            styles.operatorItemCard,
            {
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
            },
          ]}
        >
          <View
            style={[
              styles.operatorItemPlaceholder,
              {
                backgroundColor: theme.colors.infoCardBackground,
                borderRadius: theme.radius.md,
              },
            ]}
          >
            <AppText variant="caption" color={theme.colors.mutedText} bold>
              {t('live.itemPlaceholder')}
            </AppText>
          </View>
          <View style={styles.operatorItemDetails}>
            <AppText variant="caption" color={theme.colors.mutedText} bold>
              {options.title}
            </AppText>
            <AppText color={theme.colors.mutedText}>{options.emptyText}</AppText>
          </View>
        </View>
      );
    }

    const itemName =
      item.productTypeName ||
      item.brandName ||
      item.code ||
      t('live.noType');
    const itemPrice =
      item.price !== null && item.price !== undefined
        ? formatMoney(Number(item.price))
        : t('live.noPriceDefined');
    const isOnAir = activeItem?.id === item.id;
    const isPreparedForChange = options.showOnAirAction && !options.highlighted;
    const availability = getItemLiveAvailability(item);
    const blockingReservation = findBlockingReservationForItem(item.id);
    const isHighlightedReserved = !!options.highlighted && !!blockingReservation;
    const cardBorderColor = isHighlightedReserved
      ? '#f59e0b'
      : options.highlighted
      ? theme.colors.success
      : isPreparedForChange
        ? '#f59e0b'
        : theme.colors.border;
    const cardBackgroundColor = isHighlightedReserved
      ? theme.isDark
        ? '#451a03'
        : '#fff7e6'
      : options.highlighted
      ? theme.colors.successBackground
      : isPreparedForChange
        ? theme.isDark
          ? '#451a03'
          : '#fff7e6'
        : theme.colors.surface;
    const placeholderBackgroundColor = isHighlightedReserved
      ? theme.isDark
        ? '#78350f'
        : '#fffbeb'
      : options.highlighted
      ? theme.colors.surface
      : isPreparedForChange
        ? theme.isDark
          ? '#78350f'
          : '#fffbeb'
        : theme.colors.infoCardBackground;
    const stateColor = isHighlightedReserved
      ? theme.colors.warning
      : options.highlighted
      ? theme.colors.success
      : isPreparedForChange
        ? theme.colors.warning
        : theme.colors.accent;
    const availabilityLabel = isHighlightedReserved
      ? t('live.activeItemReservedStatus')
      : availability.label;
    const availabilityTone = isHighlightedReserved
      ? theme.colors.warning
      : availability.canGoOnAir
        ? theme.colors.success
        : theme.colors.warning;

    return (
      <View
        style={[
          styles.operatorItemCard,
          {
            borderColor: cardBorderColor,
            borderRadius: theme.radius.md,
            backgroundColor: cardBackgroundColor,
          },
        ]}
      >
        <View
          style={[
            styles.operatorItemPlaceholder,
            {
              backgroundColor: placeholderBackgroundColor,
              borderRadius: theme.radius.md,
            },
          ]}
        >
          <AppText variant="caption" color={theme.colors.mutedText} bold>
            {t('live.itemPlaceholder')}
          </AppText>
        </View>
        <View style={styles.operatorItemDetails}>
          <View style={styles.operatorItemHeader}>
            <View style={styles.operatorItemTitleBlock}>
              <AppText
                variant="caption"
                color={stateColor}
                bold
              >
                {options.title}
              </AppText>
              <AppText bold numberOfLines={2}>
                {itemName}
              </AppText>
              <AppText variant="caption" color={theme.colors.mutedText}>
                {isHighlightedReserved
                  ? t('live.activeItemReservedHelp')
                  : options.highlighted
                    ? t('live.activeItemReservationHelp')
                  : options.showOnAirAction && activeItem
                    ? t('live.preparedItemReservationHelp')
                    : t('live.productOnAirHelp')}
              </AppText>
            </View>
            {isOnAir ? (
              <>
                <View
                  style={[
                    styles.operatorItemBadge,
                    {
                      backgroundColor: theme.colors.successBackground,
                      borderColor: theme.colors.success,
                      borderRadius: theme.radius.sm,
                    },
                  ]}
                >
                  <AppText variant="caption" color={theme.colors.success} bold>
                    {t('live.productOnAirChip')}
                  </AppText>
                </View>
                {isHighlightedReserved ? (
                  <View
                    style={[
                      styles.operatorItemBadge,
                      {
                        backgroundColor: theme.isDark ? '#78350f' : '#fffbeb',
                        borderColor: '#f59e0b',
                        borderRadius: theme.radius.sm,
                      },
                    ]}
                  >
                    <AppText variant="caption" color={theme.colors.warning} bold>
                      {t('live.activeItemReservedChip')}
                    </AppText>
                  </View>
                ) : null}
              </>
            ) : isPreparedForChange ? (
              <View
                style={[
                  styles.operatorItemBadge,
                  {
                    backgroundColor: theme.isDark ? '#78350f' : '#fffbeb',
                    borderColor: '#f59e0b',
                    borderRadius: theme.radius.sm,
                  },
                ]}
              >
                <AppText variant="caption" color={theme.colors.warning} bold>
                  {t('live.preparedItemChip')}
                </AppText>
              </View>
            ) : null}
          </View>
          <AppText
            variant="caption"
            color={availabilityTone}
            bold
          >
            {availabilityLabel}
          </AppText>
          {availability.warning ? (
            <AppText variant="caption" color={theme.colors.warning}>
              {availability.warning}
            </AppText>
          ) : null}
          {isHighlightedReserved ? (
            <AppText variant="caption" color={theme.colors.warning}>
              {t('live.activeItemReservedNextStepHelp')}
            </AppText>
          ) : !availability.canGoOnAir && availability.reason ? (
            <AppText variant="caption" color={theme.colors.warning}>
              {availability.reason}
            </AppText>
          ) : null}

          <View style={styles.operatorItemMetaGrid}>
            <View style={styles.operatorItemMeta}>
              <AppText variant="caption" color={theme.colors.mutedText}>
                {t('live.itemCodeLabel')}
              </AppText>
              <AppText bold numberOfLines={1}>{item.code || t('live.noActiveProductCode')}</AppText>
            </View>
            <View style={styles.operatorItemMeta}>
              <AppText variant="caption" color={theme.colors.mutedText}>
                {t('live.size')}
              </AppText>
              <AppText bold numberOfLines={1}>{item.sizeName || t('live.noSize')}</AppText>
            </View>
            <View style={styles.operatorItemMeta}>
              <AppText variant="caption" color={theme.colors.mutedText}>
                {t('live.color')}
              </AppText>
              <AppText bold numberOfLines={1}>{t('live.noColor')}</AppText>
            </View>
            <View style={styles.operatorItemMeta}>
              <AppText variant="caption" color={theme.colors.mutedText}>
                {t('live.price')}
              </AppText>
              <AppText bold numberOfLines={1}>{itemPrice}</AppText>
            </View>
            <View style={styles.operatorItemMeta}>
              <AppText variant="caption" color={theme.colors.mutedText}>
                {t('live.stock')}
              </AppText>
              <AppText bold numberOfLines={1}>{t('live.stockUndefined')}</AppText>
            </View>
            <View style={styles.operatorItemMeta}>
              <AppText variant="caption" color={theme.colors.mutedText}>
                {t('live.itemStatus')}
              </AppText>
              <AppText bold numberOfLines={1}>{getItemStatusLabel(item.status, t)}</AppText>
            </View>
          </View>

          {options.showOnAirAction ? (
            <AppButton
              title={
                isOnAir
                  ? t('live.productAlreadyOnAir')
                  : t('live.markSelectedProductOnAir')
              }
              variant={isOnAir ? 'secondary' : 'operation'}
              onPress={handleSetSelectedItemActive}
              loading={isSavingActiveItem}
              disabled={
                isSavingActiveItem ||
                !operatorFlowEnabled ||
                !mayOperateLive ||
                isOnAir ||
                !availability.canGoOnAir
              }
              disabledReason={
                !mayOperateLive
                  ? t('live.liveOperatePermissionError')
                  : !operatorFlowEnabled
                    ? t('live.selectOpenLiveReason')
                    : isOnAir
                      ? t('live.productAlreadyOnAir')
                      : !availability.canGoOnAir
                        ? availability.reason
                      : undefined
              }
            />
          ) : null}
          {options.highlighted && isOnAir && options.showActiveActions !== false ? (
            <View style={styles.buttonRow}>
              <View style={styles.buttonFill}>
                <AppButton
                  title={t('live.clearProductOnAir')}
                  variant="secondary"
                  onPress={handleClearActiveItem}
                  loading={isSavingActiveItem}
                  disabled={isSavingActiveItem || !operatorFlowEnabled || !mayOperateLive}
                  disabledReason={
                    !mayOperateLive
                      ? t('live.liveOperatePermissionError')
                      : !operatorFlowEnabled
                        ? t('live.selectOpenLiveReason')
                        : undefined
                  }
                />
              </View>
              <View style={styles.buttonFill}>
                <AppButton
                  title={t('live.changeItemOnAir')}
                  variant="secondary"
                  onPress={() => setIsItemModalVisible(true)}
                  disabled={!maySelectItem}
                  disabledReason={t('live.itemPermissionError')}
                />
              </View>
            </View>
          ) : null}
        </View>
      </View>
    );
  };
  const renderOperatorNoItemOnAirState = () => (
    <View
      style={[
        styles.operatorItemCard,
        {
          borderColor: theme.isDark ? '#1d4ed8' : '#bfdbfe',
          borderRadius: theme.radius.md,
          backgroundColor: theme.isDark ? '#172554' : '#eff6ff',
        },
      ]}
    >
      <View
        style={[
          styles.operatorItemPlaceholder,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.md,
          },
        ]}
      >
        <AppText variant="caption" color={theme.colors.mutedText} bold>
          {t('live.itemPlaceholder')}
        </AppText>
      </View>
      <View style={styles.operatorItemDetails}>
        <AppText variant="caption" color={theme.colors.accent} bold>
          {t('live.noItemOnAirTitle')}
        </AppText>
        <AppText color={theme.colors.mutedText}>
          {t('live.noItemOnAirHelp')}
        </AppText>
      </View>
    </View>
  );
  const renderSupportActiveItemPanel = () => (
    <LiveCompactCard style={styles.presenterOnAirPanel}>
      <View style={styles.presenterOnAirHeader}>
        <View style={styles.operatorItemTitleBlock}>
          <AppText variant="caption" color={theme.colors.accent} bold>
            {t(liveActorContext.labelKey)}
          </AppText>
          <AppText variant="subtitle" bold>
            {t('live.activeItemNowTitle')}
          </AppText>
          <AppText color={theme.colors.mutedText}>
            {activeItem ? t('live.activeItemPresenterHelp') : t('live.noItemOnAirPresenterHelp')}
          </AppText>
        </View>
        <View
          style={[
            styles.operatorStatusBadge,
            {
              backgroundColor: operatorLiveIsActive
                ? theme.colors.successBackground
                : theme.colors.infoCardBackground,
              borderColor: operatorLiveIsActive ? theme.colors.success : theme.colors.border,
              borderRadius: theme.radius.md,
            },
          ]}
        >
          <AppText
            variant="caption"
            color={operatorLiveIsActive ? theme.colors.success : theme.colors.mutedText}
            bold
          >
            {operatorLiveStateLabel}
          </AppText>
        </View>
      </View>

      {activeItem ? (
        <>
          {renderOperatorItemCard(activeItem, {
            title: t('live.activeItemNowTitle'),
            emptyText: t('live.noOfficialActiveProduct'),
            highlighted: true,
            showActiveActions: false,
          })}
          <View
            style={[
              styles.presenterPriceBand,
              {
                backgroundColor: theme.colors.successBackground,
                borderColor: theme.colors.success,
                borderRadius: theme.radius.md,
              },
            ]}
          >
            <AppText variant="caption" color={theme.colors.success} bold>
              {t('live.activeItemPriceLabel')}
            </AppText>
            <AppText variant="title" color={theme.colors.success} bold>
              {featuredProductPrice}
            </AppText>
          </View>
        </>
      ) : (
        <View
          style={[
            styles.presenterEmptyOnAirCard,
            {
              backgroundColor: theme.isDark ? '#172554' : '#eff6ff',
              borderColor: theme.isDark ? '#1d4ed8' : '#bfdbfe',
              borderRadius: theme.radius.md,
            },
          ]}
        >
          <AppText variant="subtitle" bold>
            {t('live.noItemOnAirTitle')}
          </AppText>
          <AppText color={theme.colors.mutedText}>
            {t('live.noItemOnAirPresenterHelp')}
          </AppText>
        </View>
      )}
    </LiveCompactCard>
  );
  const renderSupportActorView = () => (
    <LiveActionCard style={styles.minimalModeCard}>
      <View style={styles.operatorHeroTop}>
        <View style={styles.operatorHeroTitle}>
          <AppText variant="caption" color={theme.colors.accent} bold>
            {t(liveActorContext.labelKey)}
          </AppText>
          <AppText variant="title" bold>
            {t('live.supportViewTitle')}
          </AppText>
          <AppText color={theme.colors.mutedText}>
            {t(liveActorContext.subtitleKey)}
          </AppText>
        </View>
        <View
          style={[
            styles.operatorStatusBadge,
            {
              backgroundColor: operatorLiveIsActive
                ? theme.colors.successBackground
                : selectedLiveStatus === 'CLOSED'
                  ? theme.colors.dangerBackground
                  : theme.colors.infoCardBackground,
              borderColor: operatorLiveIsActive
                ? theme.colors.success
                : selectedLiveStatus === 'CLOSED'
                  ? theme.colors.danger
                  : theme.colors.border,
              borderRadius: theme.radius.md,
            },
          ]}
        >
          <AppText
            variant="caption"
            color={
              operatorLiveIsActive
                ? theme.colors.success
                : selectedLiveStatus === 'CLOSED'
                  ? theme.colors.danger
                  : theme.colors.mutedText
            }
            bold
          >
            {operatorLiveStateLabel}
          </AppText>
        </View>
      </View>

      <AppText color={theme.colors.mutedText}>
        {t('live.supportViewHelp')}
      </AppText>

      {renderSupportActiveItemPanel()}

      {selectedLive ? (
        <LiveCompactCard style={styles.supervisorSectionCard}>
          <View style={styles.liveSessionCompactHeader}>
            <AppText bold>{t('live.liveNumber', { id: selectedLive.id })}</AppText>
            <AppText color={statusColor} bold>
              {getLiveStatusLabel(selectedLive.status)}
            </AppText>
          </View>
          <AppText color={theme.colors.mutedText}>
            {selectedLive.notes || t('live.notCaptured')}
          </AppText>
          <AppText variant="caption" color={theme.colors.mutedText}>
            {t('live.branchLabel')}: {selectedLive.branchName || session?.branchName || t('live.notCaptured')}
          </AppText>
        </LiveCompactCard>
      ) : (
        <LiveCompactCard style={styles.supervisorSectionCard}>
          <AppText bold>{t('live.noLiveStatusLabel')}</AppText>
          <AppText color={theme.colors.mutedText}>
            {t('live.noLiveStatusBody')}
          </AppText>
        </LiveCompactCard>
      )}
    </LiveActionCard>
  );
  const renderOperatorItemActionCard = (options: {
    icon: keyof typeof MaterialIcons.glyphMap;
    title: string;
    subtitle: string;
    onPress: () => void;
    disabled?: boolean;
  }) => (
    <Pressable
      onPress={options.onPress}
      disabled={options.disabled}
      style={({ pressed }) => [
        styles.operatorItemActionCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          opacity: options.disabled ? 0.52 : pressed ? 0.78 : 1,
          width: isPhone ? '100%' : undefined,
        },
      ]}
    >
      <View
        style={[
          styles.operatorItemActionIcon,
          {
            backgroundColor: theme.colors.infoCardBackground,
            borderRadius: theme.radius.md,
          },
        ]}
      >
        <MaterialIcons
          name={options.icon}
          size={22}
          color={options.disabled ? theme.colors.mutedText : theme.colors.accent}
        />
      </View>
      <View style={styles.operatorItemActionText}>
        <AppText bold>{options.title}</AppText>
        <AppText variant="caption" color={theme.colors.mutedText}>
          {options.subtitle}
        </AppText>
      </View>
    </Pressable>
  );
  const renderLiveDetailRow = (label: string, value?: string | number | null) => (
    <View
      style={[
        styles.operatorLiveDetailRow,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
        },
      ]}
    >
      <AppText variant="caption" color={theme.colors.mutedText}>
        {label}
      </AppText>
      <AppText bold>{value || t('live.notCaptured')}</AppText>
    </View>
  );
  const getClosedLiveReservations = (liveId: number) =>
    branchReservations.filter((reservation) => reservation.liveId === liveId);
  const getClosedLiveEventLabel = (eventType?: string | null) => {
    switch (normalizeStatus(eventType)) {
      case 'LIVE_STARTED':
        return t('live.eventLiveStarted');
      case 'LIVE_CLOSED':
        return t('live.eventLiveClosed');
      case 'ACTIVE_ITEM_CHANGED':
        return t('live.eventActiveItemChanged');
      case 'LIVE_RESERVATION_CREATED':
        return t('live.eventReservationCreated');
      case 'LIVE_RESERVATION_STATUS_CHANGED':
        return t('live.eventReservationStatusChanged');
      case 'LIVE_OPERATIONAL_SOLD':
        return t('live.eventOperationalSold');
      case 'LIVE_RESERVATION_CANCELLED':
        return t('live.eventReservationCancelled');
      default:
        return eventType || t('live.unknownLiveEvent');
    }
  };
  const toggleClosedLiveReservations = (live: Live) => {
    setExpandedClosedLiveReservationsId((current) =>
      current === live.id ? null : live.id
    );
  };
  const toggleClosedLiveEvents = async (live: Live) => {
    const nextExpanded = expandedClosedLiveEventsId === live.id ? null : live.id;
    setExpandedClosedLiveEventsId(nextExpanded);
    if (nextExpanded && liveEventsLiveId !== live.id) {
      await updateLiveEvents(live.id);
    }
  };
  const renderClosedLiveReservations = (live: Live) => {
    if (expandedClosedLiveReservationsId !== live.id) return null;

    const reservations = getClosedLiveReservations(live.id);

    return (
      <View style={styles.closedLiveExpandedSection}>
        <AppText variant="subtitle" bold>
          {t('live.closedLiveReservationsTitle')}
        </AppText>
        {reservations.length === 0 ? (
          <AppText color={theme.colors.mutedText}>{t('live.noClosedLiveReservations')}</AppText>
        ) : (
          reservations.map((reservation) => (
            <View
              key={reservation.id}
              style={[
                styles.closedLiveExpandedRow,
                {
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.md,
                },
              ]}
            >
              <View style={styles.closedLiveExpandedText}>
                <AppText bold numberOfLines={1}>
                  {reservation.customerName || t('live.noCustomerSelected')}
                </AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  {reservation.itemCode || t('live.noActiveProductCode')}
                </AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  {getOperationalStatusLabel(getLiveReservationOperationalStatus(reservation), t)}
                </AppText>
              </View>
              <View style={styles.closedLiveExpandedActions}>
                <AppText bold>{formatMoney(Number(reservation.price || 0))}</AppText>
                <AppButton
                  title={t('live.viewDetail')}
                  variant="secondary"
                  onPress={() => goToReservationDetail(reservation.id)}
                />
              </View>
            </View>
          ))
        )}
      </View>
    );
  };
  const renderClosedLiveEvents = (live: Live) => {
    if (expandedClosedLiveEventsId !== live.id) return null;

    const events = liveEventsLiveId === live.id ? liveEvents : [];
    const sortedEvents = [...events].sort((a, b) => {
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    return (
      <View style={styles.closedLiveExpandedSection}>
        <AppText variant="subtitle" bold>
          {t('live.closedLiveEventsTitle')}
        </AppText>
        {isLoadingClosedLiveEvents && liveEventsLiveId !== live.id ? (
          <AppText color={theme.colors.mutedText}>{t('live.loadingEvents')}</AppText>
        ) : sortedEvents.length === 0 ? (
          <AppText color={theme.colors.mutedText}>{t('live.noClosedLiveEvents')}</AppText>
        ) : (
          sortedEvents.map((event) => (
            <View
              key={event.id}
              style={[
                styles.closedLiveExpandedRow,
                {
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.md,
                },
              ]}
            >
              <View style={styles.closedLiveExpandedText}>
                <AppText bold>{getClosedLiveEventLabel(event.eventType)}</AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  {formatLiveDateTime(event.createdAt) || t('live.notAvailable')}
                </AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  {event.entityType || t('live.noEntity')} #{event.entityId ?? t('live.notAvailable')}
                </AppText>
              </View>
              <AppText variant="caption" color={theme.colors.mutedText}>
                {event.eventType}
              </AppText>
            </View>
          ))
        )}
      </View>
    );
  };
  const getClosedLiveSummaryTitle = (live: Live) => {
    if (selectedLive?.id === live.id && selectedClosedLiveSource === 'history') {
      return t('live.liveDetailTitle');
    }
    if (
      selectedLive?.id === live.id &&
      (selectedClosedLiveSource === 'recent' || live.id !== latestClosedLive?.id)
    ) {
      return t('live.selectedClosedLiveTitle');
    }
    return t('live.lastClosedLiveTitle');
  };
  const renderClosedLiveSummary = () => {
    if (!highlightedClosedLive) return null;

    const summary = getLiveOperationalSummary(highlightedClosedLive);
    const hasLoadedEventsForLive = liveEventsLiveId === highlightedClosedLive.id;
    const reservationsExpanded = expandedClosedLiveReservationsId === highlightedClosedLive.id;
    const eventsExpanded = expandedClosedLiveEventsId === highlightedClosedLive.id;

    return (
      <LiveCompactCard style={styles.operatorLastClosedLiveCard}>
        <View style={styles.liveSessionCompactHeader}>
          <View>
            <AppText variant="caption" color={theme.colors.danger} bold>
              {getClosedLiveSummaryTitle(highlightedClosedLive)}
            </AppText>
            <AppText variant="subtitle" bold>
              {t('live.liveNumber', { id: highlightedClosedLive.id })}
            </AppText>
          </View>
          <AppButton
            title={t('live.viewLiveSummary')}
            variant="secondary"
            onPress={() => undefined}
            disabled
            disabledReason={t('live.liveSummaryPending')}
          />
        </View>

        <View style={styles.operatorLiveDetailGrid}>
          {renderLiveDetailRow(t('live.liveStatusLabel'), getLiveStatusLabel(highlightedClosedLive.status))}
          {renderLiveDetailRow(t('live.branchLabel'), highlightedClosedLive.branchName || session?.branchName)}
          {renderLiveDetailRow(t('live.liveStartedAt'), formatLiveDateTime(highlightedClosedLive.startedAt))}
          {renderLiveDetailRow(t('live.liveClosedAt'), formatLiveDateTime(highlightedClosedLive.endedAt))}
          {renderLiveDetailRow(
            t('live.liveDuration'),
            formatLiveDuration(highlightedClosedLive.startedAt, highlightedClosedLive.endedAt) ||
              t('live.notAvailable')
          )}
          {renderLiveDetailRow(t('live.liveOperator'), session?.email)}
          {renderLiveDetailRow(t('live.liveChannel'), null)}
          {renderLiveDetailRow(t('live.liveStreamUrl'), null)}
          {renderLiveDetailRow(t('live.liveNotes'), highlightedClosedLive.notes)}
          {renderLiveDetailRow(
            t('live.shownItems'),
            hasLoadedEventsForLive
              ? summary.shownItems > 0
                ? summary.shownItems
                : t('live.noShownItems')
              : t('live.notAvailable')
          )}
          {renderLiveDetailRow(
            t('live.lastActivity'),
            hasLoadedEventsForLive
              ? formatLiveDateTime(summary.lastActivity) ||
                formatLiveDateTime(highlightedClosedLive.endedAt) ||
                t('live.notAvailable')
              : t('live.notAvailable')
          )}
        </View>

        <View style={styles.operatorLiveSummaryGrid}>
          <View style={styles.operatorLiveSummaryMetric}>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {t('live.summaryReservations')}
            </AppText>
            <AppText bold>{summary.reservations}</AppText>
          </View>
          <View style={styles.operatorLiveSummaryMetric}>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {t('live.summaryOperationalSold')}
            </AppText>
            <AppText bold>{summary.operationalSold}</AppText>
          </View>
          <View style={styles.operatorLiveSummaryMetric}>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {t('live.summaryCancelled')}
            </AppText>
            <AppText bold>{summary.cancelled}</AppText>
          </View>
          <View style={styles.operatorLiveSummaryMetric}>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {t('live.summaryEvents')}
            </AppText>
            <AppText bold>
              {hasLoadedEventsForLive
                ? summary.events > 0
                  ? summary.events
                  : t('live.noEventsShort')
                : t('live.notAvailable')}
            </AppText>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <View style={styles.buttonFill}>
            <AppButton
              title={
                reservationsExpanded
                  ? t('live.hideReservations')
                  : t('live.viewReservations')
              }
              variant="secondary"
              onPress={() => toggleClosedLiveReservations(highlightedClosedLive)}
            />
          </View>
          <View style={styles.buttonFill}>
            <AppButton
              title={eventsExpanded ? t('live.hideEvents') : t('live.viewEvents')}
              variant="secondary"
              onPress={() => toggleClosedLiveEvents(highlightedClosedLive)}
              loading={isLoadingClosedLiveEvents && eventsExpanded}
            />
          </View>
        </View>
        {renderClosedLiveReservations(highlightedClosedLive)}
        {renderClosedLiveEvents(highlightedClosedLive)}
      </LiveCompactCard>
    );
  };
  const renderFullLiveHistory = () => {
    if (!isFullLiveHistoryExpanded) return null;

    if (closedLives.length === 0) {
      return (
        <View style={styles.closedLiveExpandedSection}>
          <AppText variant="subtitle" bold>
            {t('live.liveFullHistoryTitle')}
          </AppText>
          <AppText color={theme.colors.mutedText}>
            {t('live.noClosedLivesHistory')}
          </AppText>
        </View>
      );
    }

    return (
      <View style={styles.closedLiveExpandedSection}>
        <AppText variant="subtitle" bold>
          {t('live.liveFullHistoryTitle')}
        </AppText>
        <View style={styles.fullLiveHistoryList}>
        {closedLives.map((live) => {
          const summary = getLiveOperationalSummary(live);
          const selected = highlightedClosedLive?.id === live.id;

          return (
            <Pressable
              key={live.id}
              onPress={() => handleSelectLive(live, 'history')}
              style={({ pressed }) => [
                styles.fullLiveHistoryRow,
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
              <View style={styles.fullLiveHistoryMain}>
                <View style={styles.recentLiveHeader}>
                  <AppText bold>{t('live.liveNumber', { id: live.id })}</AppText>
                  {selected ? (
                    <View
                      style={[
                        styles.selectedLiveChip,
                        {
                          backgroundColor: theme.colors.infoCardBackground,
                          borderColor: theme.colors.accent,
                          borderRadius: theme.radius.sm,
                        },
                      ]}
                    >
                      <AppText variant="caption" color={theme.colors.accent} bold>
                        {t('live.selectedLiveChip')}
                      </AppText>
                    </View>
                  ) : null}
                </View>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  {getLiveStatusLabel(live.status)}
                </AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  {formatLiveDateTime(live.startedAt || live.createdAt) || t('live.notCaptured')}
                </AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  {formatLiveDateTime(live.endedAt) || t('live.notCaptured')}
                </AppText>
              </View>
              <View style={styles.fullLiveHistoryMetrics}>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  {t('live.summaryReservations')}: {summary.reservations}
                </AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  {t('live.summaryOperationalSold')}: {summary.operationalSold}
                </AppText>
                <AppText variant="caption" color={theme.colors.accent} bold>
                  {t('live.viewLiveSummary')}
                </AppText>
              </View>
            </Pressable>
          );
        })}
        </View>
      </View>
    );
  };
  const renderRecentLives = () => {
    if (recentLives.length === 0) return null;

    return (
      <LiveCompactCard style={styles.operatorClosedLiveCard}>
        <AppText variant="subtitle" bold>
          {t('live.recentLivesTitle')}
        </AppText>
        <View style={styles.operatorRecentLiveGrid}>
          {recentLives.map((live) => {
            const summary = getLiveOperationalSummary(live);
            const selected = highlightedClosedLive?.id === live.id;

            return (
              <Pressable
                key={live.id}
                onPress={() => handleSelectLive(live, 'recent')}
                style={({ pressed }) => [
                  styles.operatorRecentLiveCard,
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
                <View style={styles.recentLiveHeader}>
                  <AppText bold>{t('live.liveNumber', { id: live.id })}</AppText>
                  {selected ? (
                    <View
                      style={[
                        styles.selectedLiveChip,
                        {
                          backgroundColor: theme.colors.infoCardBackground,
                          borderColor: theme.colors.accent,
                          borderRadius: theme.radius.sm,
                        },
                      ]}
                    >
                      <AppText variant="caption" color={theme.colors.accent} bold>
                        {t('live.selectedLiveChip')}
                      </AppText>
                    </View>
                  ) : null}
                </View>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  {getLiveStatusLabel(live.status)}
                </AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  {formatLiveDateTime(live.startedAt || live.createdAt) || t('live.notCaptured')}
                </AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  {t('live.summaryReservations')}: {summary.reservations}
                </AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  {t('live.summaryOperationalSold')}: {summary.operationalSold}
                </AppText>
                <AppText variant="caption" color={theme.colors.accent} bold>
                  {t('live.viewLiveSummary')}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        <AppButton
          title={
            isFullLiveHistoryExpanded
              ? t('live.hideFullHistory')
              : t('live.viewFullHistory')
          }
          variant="secondary"
          onPress={() => setIsFullLiveHistoryExpanded((current) => !current)}
        />
        {renderFullLiveHistory()}
      </LiveCompactCard>
    );
  };
  const renderSupervisorDashboard = () => {
    const dashboardLive = selectedLive ?? highlightedClosedLive;
    const summary = getLiveOperationalSummary(dashboardLive);
    const metrics = [
      {
        label: t('live.liveStatusLabel'),
        value: dashboardLive ? getLiveStatusLabel(dashboardLive.status) : t('live.operatorNoLiveActiveShort'),
      },
      {
        label: t('live.branchLabel'),
        value: dashboardLive?.branchName || session?.branchName || t('live.notCaptured'),
      },
      {
        label: t('live.liveStartedAt'),
        value: formatLiveDateTime(dashboardLive?.startedAt || dashboardLive?.createdAt)
          || t('live.notCaptured'),
      },
      {
        label: t('live.liveClosedAt'),
        value: formatLiveDateTime(dashboardLive?.endedAt) || t('live.notAvailable'),
      },
      {
        label: t('live.summaryReservations'),
        value: String(summary.reservations),
      },
      {
        label: t('live.summaryOperationalSold'),
        value: String(summary.operationalSold),
      },
      {
        label: t('live.summaryCancelled'),
        value: String(summary.cancelled),
      },
      {
        label: t('live.summaryEvents'),
        value: summary.events > 0 ? String(summary.events) : t('live.noEventsShort'),
      },
      {
        label: t('live.shownItems'),
        value: summary.shownItems > 0 ? String(summary.shownItems) : t('live.noShownItems'),
      },
      {
        label: t('live.lastActivity'),
        value: summary.lastActivity || t('live.notAvailable'),
      },
    ];

    return (
      <LiveActionCard style={styles.supervisorDashboardCard}>
        <View style={styles.operatorHeroTop}>
          <View style={styles.operatorHeroTitle}>
            <AppText variant="caption" color={theme.colors.accent} bold>
              {t('live.actorSupervisorLabel')}
            </AppText>
            <AppText variant="title" bold>
              {t('live.supervisorMonitoringTitle')}
            </AppText>
            <AppText color={theme.colors.mutedText}>
              {t('live.supervisorMonitoringHelp')}
            </AppText>
          </View>
          <View
            style={[
              styles.operatorStatusBadge,
              {
                backgroundColor: operatorLiveIsActive
                  ? theme.colors.successBackground
                  : selectedLiveStatus === 'CLOSED'
                    ? theme.colors.dangerBackground
                    : theme.colors.warningBackground,
                borderColor: operatorLiveIsActive
                  ? theme.colors.success
                  : selectedLiveStatus === 'CLOSED'
                    ? theme.colors.danger
                    : theme.colors.warning,
                borderRadius: theme.radius.md,
              },
            ]}
          >
            <AppText
              variant="caption"
              color={
                operatorLiveIsActive
                  ? theme.colors.success
                  : selectedLiveStatus === 'CLOSED'
                    ? theme.colors.danger
                    : theme.colors.warning
              }
              bold
            >
              {operatorLiveStateLabel}
            </AppText>
          </View>
        </View>

        <LiveCompactCard style={styles.supervisorSectionCard}>
          <AppText variant="subtitle" bold>
            {t('live.supervisorIndicatorsTitle')}
          </AppText>
          <AppResponsiveGrid tabletColumns={2} desktopColumns={4} gap={10}>
            {metrics.map((metric) => (
              <View
                key={metric.label}
                style={[
                  styles.supervisorMetricCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.md,
                  },
                ]}
              >
                <AppText variant="caption" color={theme.colors.mutedText}>
                  {metric.label}
                </AppText>
                <AppText bold numberOfLines={2}>
                  {metric.value}
                </AppText>
              </View>
            ))}
          </AppResponsiveGrid>
          <AppText variant="caption" color={theme.colors.mutedText}>
            {t('live.supervisorNoDemoMetricsHelp')}
          </AppText>
        </LiveCompactCard>

        {renderSupportActiveItemPanel()}

        <LiveCompactCard style={styles.supervisorSectionCard}>
          <AppText variant="subtitle" bold>
            {t('live.recentReservations')}
          </AppText>
          {recentReservations.length === 0 ? (
            <AppText color={theme.colors.mutedText}>
              {t('live.noRecentReservations')}
            </AppText>
          ) : (
            visibleRecentReservations.map(({ reservation, customerName, itemCode }) => {
              const paid = paidByReservationId[reservation.id] ?? 0;
              const operationalStatus = getLiveReservationOperationalStatus(reservation);
              const operationalSold = operationalStatus === 'OPERATIONAL_SOLD';

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
                  {renderRecentReservationInfo(
                    reservation,
                    customerName,
                    itemCode,
                    operationalStatus,
                    isReservationSettled(reservation, paid),
                    operationalSold
                  )}
                  <AppButton
                    title={t('live.viewDetail')}
                    variant="secondary"
                    onPress={() => goToReservationDetail(reservation.id)}
                  />
                </Pressable>
              );
            })
          )}
        </LiveCompactCard>

        <LiveCompactCard style={styles.supervisorSectionCard}>
          <AppText variant="subtitle" bold>
            {t('live.supervisorRecentEventsTitle')}
          </AppText>
          {activityFeed.length === 0 ? (
            <AppText color={theme.colors.mutedText}>
              {t('live.noLiveEvents')}
            </AppText>
          ) : (
            activityFeed.map((event, index) => (
              <View
                key={`${event.label}-${index}`}
                style={[
                  styles.activityFeedRow,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
              >
                <View style={styles.activityFeedMain}>
                  <AppText numberOfLines={2}>{event.label}</AppText>
                </View>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  {event.time}
                </AppText>
              </View>
            ))
          )}
        </LiveCompactCard>

        {!operatorLiveIsActive ? (
          <>
            {renderClosedLiveSummary()}
            {renderRecentLives()}
          </>
        ) : null}
      </LiveActionCard>
    );
  };
  const preparedItem =
    selectedItem && activeItem?.id !== selectedItem.id ? selectedItem : null;
  const liveHeaderSafeTop =
    Platform.OS === 'android' ? Math.max(insets.top - 12, 8) : 0;

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
        <View style={[styles.liveHeader, { paddingTop: liveHeaderSafeTop }]}>
          <AppBackButton fallbackRoute="/" />
          <View style={styles.liveHeaderText}>
            <AppText variant="title" bold>
              {t('live.title')}
            </AppText>
            <AppText color={theme.colors.mutedText} numberOfLines={2}>
              {isTablet
                ? t('live.tabletHeaderHelp')
                : isDesktop
                  ? t('live.desktopHeaderHelp')
                  : t('live.mobileHeaderHelp')}
            </AppText>
          </View>
        </View>
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

        {isOperatorFocusedView ? (
          <LiveActionCard style={styles.operatorHeroCard}>
            <View style={styles.operatorHeroTop}>
              <View style={styles.operatorHeroTitle}>
                <AppText variant="caption" color={theme.colors.accent} bold>
                  {t(liveActorContext.labelKey)}
                </AppText>
                <AppText variant="title" bold>
                  {t('live.operatorReservationTracking')}
                </AppText>
                <AppText color={theme.colors.mutedText}>
                  {t(liveActorContext.subtitleKey)}
                </AppText>
              </View>
              <View
                style={[
                  styles.operatorStatusBadge,
                  {
                    backgroundColor: operatorLiveIsActive
                      ? theme.colors.successBackground
                      : selectedLiveStatus === 'CLOSED'
                        ? theme.colors.dangerBackground
                      : theme.colors.warningBackground,
                    borderColor: operatorLiveIsActive
                      ? theme.colors.success
                      : selectedLiveStatus === 'CLOSED'
                        ? theme.colors.danger
                      : theme.colors.warning,
                    borderRadius: theme.radius.md,
                  },
                ]}
              >
                <AppText
                  variant="caption"
                  color={
                    operatorLiveIsActive
                      ? theme.colors.success
                      : selectedLiveStatus === 'CLOSED'
                        ? theme.colors.danger
                        : theme.colors.warning
                  }
                  bold
                >
                  {operatorLiveStateLabel}
                </AppText>
              </View>
            </View>

            <View
              style={[
                styles.operatorLiveStateCard,
                {
                  borderColor: operatorLiveIsActive
                    ? theme.colors.success
                    : selectedLiveStatus === 'CLOSED'
                      ? theme.colors.danger
                      : theme.colors.border,
                  borderRadius: theme.radius.md,
                  backgroundColor: operatorLiveIsActive
                    ? theme.colors.successBackground
                    : theme.colors.surface,
                },
              ]}
            >
              <AppText
                variant="caption"
                color={operatorLiveIsActive ? theme.colors.success : theme.colors.mutedText}
                bold
              >
                {operatorLiveStateLabel}
              </AppText>
              <AppText color={theme.colors.mutedText}>{operatorLiveStateHelp}</AppText>
            </View>

            {!operatorLiveIsActive ? (
              <AppButton
                title={
                  selectedLiveStatus === 'CLOSED'
                    ? t('live.operatorStartNewLive')
                    : t('live.operatorStartLive')
                }
                variant="operation"
                onPress={handleStartLiveNow}
                loading={isSavingLive}
                disabled={isSavingLive || !mayOperateLive}
                disabledReason={operatorStartDisabledReason}
                style={styles.operatorPrimaryButton}
              />
            ) : null}

            {!operatorFlowEnabled ? (
              <>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  {t('live.operatorNextStepLabel')} {operatorNextStep}
                </AppText>
                {renderClosedLiveSummary()}
                {renderRecentLives()}
              </>
            ) : (
              <>
                <View style={styles.operatorStepStack}>
                  <LiveCompactCard style={styles.operatorFlowStepCard}>
                    <AppText variant="caption" color={theme.colors.accent} bold>
                      1. {t('live.operatorStepProduct')}
                    </AppText>
                    <AppText variant="caption" color={theme.colors.mutedText}>
                      {t('live.prepareNextItemHelp')}
                    </AppText>

                    <View style={styles.operatorItemActionGrid}>
                      {renderOperatorItemActionCard({
                        icon: 'search',
                        title: t('live.searchItem'),
                        subtitle: t('live.searchItemActionHelp'),
                        onPress: () => setIsItemModalVisible(true),
                        disabled: !maySelectItem,
                      })}
                      {renderOperatorItemActionCard({
                        icon: 'qr-code-scanner',
                        title: t('live.scanQr'),
                        subtitle: t('live.scanQrActionHelp'),
                        onPress: () => setIsScannerVisible(true),
                        disabled: !maySelectItem,
                      })}
                      {renderOperatorItemActionCard({
                        icon: 'add-circle-outline',
                        title: t('live.quickItem'),
                        subtitle: t('live.quickItemActionHelp'),
                        onPress: () => router.push('/items-create?returnTo=/live' as any),
                        disabled: !mayCreateItem,
                      })}
                    </View>

                    {preparedItem
                      ? renderOperatorItemCard(preparedItem, {
                          title: t('live.preparedItemForChangeTitle'),
                          emptyText: t('live.operatorStepProductEmpty'),
                          showOnAirAction: true,
                        })
                      : null}
                  </LiveCompactCard>

                  <LiveCompactCard style={styles.operatorFlowStepCard}>
                    <AppText variant="caption" color={theme.colors.accent} bold>
                      2. {t('live.operatorStepActiveItem')}
                    </AppText>
                    <AppText variant="caption" color={theme.colors.mutedText}>
                      {t('live.activeItemSectionHelp')}
                    </AppText>

                    {!activeItem ? renderOperatorNoItemOnAirState() : null}

                    {activeItem
                      ? renderOperatorItemCard(activeItem, {
                          title: t('live.activeItemNowTitle'),
                          emptyText: t('live.noOfficialActiveProduct'),
                          highlighted: true,
                        })
                      : null}
                  </LiveCompactCard>

                  <LiveCompactCard style={styles.operatorFlowStepCard}>
                    <AppText variant="caption" color={theme.colors.accent} bold>
                      3. {t('live.operatorStepPrice')}
                    </AppText>
                    <AppText variant="caption" color={theme.colors.mutedText}>
                      {activeItem
                        ? t('live.priceUsesActiveItemHelp')
                        : t('live.reserveNeedsActiveItem')}
                    </AppText>
                    {activeItem?.price !== null && activeItem?.price !== undefined ? (
                      <AppText variant="caption" color={theme.colors.mutedText}>
                        {t('live.suggestedPriceFromItem', {
                          price: formatMoney(Number(activeItem.price)),
                        })}
                      </AppText>
                    ) : null}
                    <AppInput
                      label={t('live.activeItemPriceLabel')}
                      value={priceText}
                      onChangeText={setPriceText}
                      placeholder="0.00"
                      keyboardType="numeric"
                      editable={!!activeItem}
                    />
                    <AppText variant="caption" color={theme.colors.mutedText}>
                      {hasValidReservationPrice
                        ? t('live.priceConfirmedForReservation', {
                            price: formatMoney(Number(priceText)),
                          })
                        : t('live.operatorStepPriceEmpty')}
                    </AppText>
                  </LiveCompactCard>

                  <LiveCompactCard style={styles.operatorFlowStepCard}>
                    <AppText variant="caption" color={theme.colors.accent} bold>
                      4. {t('live.operatorStepCustomer')}
                    </AppText>
                    {!activeItem ? (
                      <AppText variant="caption" color={theme.colors.mutedText}>
                        {t('live.customerNeedsActiveItem')}
                      </AppText>
                    ) : !hasValidReservationPrice ? (
                      <AppText variant="caption" color={theme.colors.mutedText}>
                        {t('live.customerNeedsPrice')}
                      </AppText>
                    ) : null}
                    <AppText bold>
                      {selectedCustomer
                        ? selectedCustomer.name
                        : t('live.operatorStepCustomerEmpty')}
                    </AppText>
                    {selectedCustomer && selectedCustomerSummary ? (
                      <View
                        style={[
                          styles.operatorCustomerSummaryCard,
                          {
                            borderColor: theme.colors.border,
                            borderRadius: theme.radius.md,
                          },
                        ]}
                      >
                        <View style={styles.operatorCustomerHeader}>
                          <View style={styles.operatorCustomerText}>
                            <AppText variant="caption" color={theme.colors.mutedText} bold>
                              {t('live.selectedCustomerLabel')}
                            </AppText>
                            <AppText bold numberOfLines={1}>
                              {selectedCustomer.name}
                            </AppText>
                            <AppText variant="caption" color={theme.colors.mutedText}>
                              {selectedCustomer.phone
                                ? t('live.customerPhoneValue', {
                                    phone: selectedCustomer.phone,
                                  })
                                : t('live.noPhone')}
                            </AppText>
                          </View>
                          {selectedCustomerSummary.frequent ? (
                            <View
                              style={[
                                styles.operatorCustomerBadge,
                                {
                                  backgroundColor: theme.colors.successBackground,
                                  borderColor: theme.colors.success,
                                  borderRadius: theme.radius.sm,
                                },
                              ]}
                            >
                              <AppText
                                variant="caption"
                                color={theme.colors.success}
                                bold
                              >
                                {t('live.frequentCustomer')}
                              </AppText>
                            </View>
                          ) : null}
                        </View>
                        <View style={styles.operatorCustomerStats}>
                          <View style={styles.operatorCustomerStat}>
                            <AppText variant="caption" color={theme.colors.mutedText}>
                              {t('live.pastPurchases')}
                            </AppText>
                            <AppText bold>{selectedCustomerSummary.pastPurchases}</AppText>
                          </View>
                          <View style={styles.operatorCustomerStat}>
                            <AppText variant="caption" color={theme.colors.mutedText}>
                              {t('live.activePurchases')}
                            </AppText>
                            <AppText bold>{selectedCustomerSummary.activePurchases}</AppText>
                          </View>
                          <View style={styles.operatorCustomerStat}>
                            <AppText variant="caption" color={theme.colors.mutedText}>
                              {t('live.pendingBalance')}
                            </AppText>
                            <AppText bold>
                              {formatMoney(selectedCustomerSummary.pendingBalance)}
                            </AppText>
                          </View>
                        </View>
                      </View>
                    ) : (
                      <AppText variant="caption" color={theme.colors.mutedText}>
                        {t('live.selectCustomerHelp')}
                      </AppText>
                    )}
                    <View style={styles.buttonRow}>
                      <View style={styles.buttonFill}>
                        <AppButton
                          title={
                            selectedCustomer
                              ? t('live.changeCustomer')
                              : t('live.selectCustomer')
                          }
                          variant="operation"
                          onPress={() => setIsCustomerModalVisible(true)}
                          disabled={!maySelectCustomer || !activeItem || !hasValidReservationPrice}
                          disabledReason={
                            !activeItem
                              ? t('live.customerNeedsActiveItem')
                              : !hasValidReservationPrice
                                ? t('live.customerNeedsPrice')
                              : t('live.customerPermissionError')
                          }
                        />
                      </View>
                      {mayCreateCustomer ? (
                        <View style={styles.buttonFill}>
                          <AppButton
                            title={t('live.operatorQuickCustomer')}
                            variant="secondary"
                            onPress={() =>
                              router.push('/customers-create?returnTo=/live' as any)
                            }
                            disabled={!activeItem || !hasValidReservationPrice}
                            disabledReason={
                              !activeItem
                                ? t('live.customerNeedsActiveItem')
                                : t('live.customerNeedsPrice')
                            }
                          />
                        </View>
                      ) : null}
                    </View>
                  </LiveCompactCard>

                  <LiveCompactCard style={styles.operatorFlowStepCard}>
                    <AppText variant="caption" color={theme.colors.accent} bold>
                      5. {t('live.operatorStepReservation')}
                    </AppText>
                    <AppText variant="caption" color={theme.colors.mutedText}>
                      {t('live.reserveActiveItemHelp')}
                    </AppText>
                    <LiveWarningCard style={styles.reservationRiskCard}>
                      <AppText variant="caption" color={theme.colors.warning} bold>
                        {t('live.reservationRiskTitle')}
                      </AppText>
                      <AppText variant="caption" color={theme.colors.mutedText}>
                        {t('live.reservationRiskHelp')}
                      </AppText>
                    </LiveWarningCard>
                  </LiveCompactCard>
                </View>

                {activeItemBlockingReservationForValidation ? (
                  <LiveWarningCard style={styles.reservationRiskCard}>
                    <AppText variant="caption" color={theme.colors.warning} bold>
                      {t('live.activeItemAlreadyReservedTitle')}
                    </AppText>
                    <AppText variant="caption" color={theme.colors.mutedText}>
                      {t('live.activeItemAlreadyReservedReason')}
                    </AppText>
                  </LiveWarningCard>
                ) : null}

                <AppButton
                  title={t('live.operatorReserveNow')}
                  variant="operation"
                  onPress={handleCreateReservation}
                  loading={isSavingReservation}
                  disabled={
                    isSavingReservation ||
                    !mayOperateLive ||
                    !!activeItemBlockingReservationForValidation
                  }
                  disabledReason={
                    activeItemBlockingReservationForValidation
                      ? t('live.activeItemAlreadyReservedReason')
                      : reservationPendingReason || t('live.liveOperatePermissionError')
                  }
                  style={styles.operatorPrimaryButton}
                />

                <View style={styles.operatorFollowUpRow}>
                  <AppText variant="caption" color={theme.colors.mutedText}>
                    {t('live.operatorNextStepLabel')} {operatorNextStep}
                  </AppText>
                  {operatorLatestReservation ? (
                    <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
                      {t('live.operatorLatestReservation', {
                        id: operatorLatestReservation.reservation.id,
                      })}
                    </AppText>
                  ) : null}
                </View>

                <AppCard style={styles.operatorRecentReservationsCard}>
                  <AppText variant="subtitle" bold>
                    {t('live.recentReservations')}
                  </AppText>

                  {recentReservations.length === 0 ? (
                    <AppText color={theme.colors.mutedText}>
                      {t('live.noRecentReservations')}
                    </AppText>
                  ) : (
                    <>
                      {visibleRecentReservations.map(({ reservation, customerName, itemCode }) => {
                        const paid = paidByReservationId[reservation.id] ?? 0;
                        const settled = isReservationSettled(reservation, paid);
                        const operationalStatus = getLiveReservationOperationalStatus(reservation);
                        const operationalSold = operationalStatus === 'OPERATIONAL_SOLD';
                        const operationalCancelled = operationalStatus === 'CANCELLED';
                        const isUpdatingOperationalStatus =
                          updatingOperationalReservationId === reservation.id;

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
                            {renderRecentReservationInfo(
                              reservation,
                              customerName,
                              itemCode,
                              operationalStatus,
                              settled,
                              operationalSold
                            )}
                            <View style={styles.buttonRow}>
                              <View style={styles.buttonFill}>
                                <AppButton
                                  title={t('live.viewDetail')}
                                  variant="secondary"
                                  onPress={() => goToReservationDetail(reservation.id)}
                                />
                              </View>
                              {!settled && !operationalSold && !operationalCancelled && mayOperateLive ? (
                                <View style={styles.buttonFill}>
                                  <AppButton
                                    title={t('live.markOperationalSold')}
                                    variant="operation"
                                    loading={isUpdatingOperationalStatus}
                                    onPress={() =>
                                      handleUpdateReservationOperationalStatus(
                                        reservation.id,
                                        'OPERATIONAL_SOLD'
                                      )
                                    }
                                  />
                                </View>
                              ) : null}
                              {operationalStatus === 'RESERVED' && mayOperateLive ? (
                                <View style={styles.buttonFill}>
                                  <AppButton
                                    title={t('live.markPending')}
                                    variant="secondary"
                                    loading={isUpdatingOperationalStatus}
                                    onPress={() =>
                                      handleUpdateReservationOperationalStatus(
                                        reservation.id,
                                        'PENDING'
                                      )
                                    }
                                  />
                                </View>
                              ) : null}
                              {(operationalStatus === 'PENDING' || operationalSold) && mayOperateLive ? (
                                <View style={styles.buttonFill}>
                                  <AppButton
                                    title={t('live.returnToReserved')}
                                    variant="secondary"
                                    loading={isUpdatingOperationalStatus}
                                    onPress={() =>
                                      handleUpdateReservationOperationalStatus(
                                        reservation.id,
                                        'RESERVED'
                                      )
                                    }
                                  />
                                </View>
                              ) : null}
                              {!operationalCancelled && mayOperateLive ? (
                                <View style={styles.buttonFill}>
                                  <AppButton
                                    title={t('live.cancelOperational')}
                                    variant="cancel"
                                    loading={isUpdatingOperationalStatus}
                                    onPress={() =>
                                      handleUpdateReservationOperationalStatus(
                                        reservation.id,
                                        'CANCELLED'
                                      )
                                    }
                                  />
                                </View>
                              ) : null}
                              {operationalCancelled && mayOperateLive ? (
                                <View style={styles.buttonFill}>
                                  <AppButton
                                    title={t('live.reactivateReserved')}
                                    variant="secondary"
                                    loading={isUpdatingOperationalStatus}
                                    onPress={() =>
                                      handleUpdateReservationOperationalStatus(
                                        reservation.id,
                                        'RESERVED'
                                      )
                                    }
                                  />
                                </View>
                              ) : null}
                            </View>
                          </Pressable>
                        );
                      })}
                      {isTablet && recentReservations.length > visibleRecentReservations.length ? (
                        <AppText variant="caption" color={theme.colors.mutedText}>
                          {t('live.moreRecentReservations', {
                            count: recentReservations.length - visibleRecentReservations.length,
                          })}
                        </AppText>
                      ) : null}
                    </>
                  )}
                </AppCard>

                <AppButton
                  title={t('live.operatorFinishLive')}
                  variant="danger"
                  onPress={() => (selectedLive ? handleCloseLive(selectedLive) : undefined)}
                  loading={isSavingLive}
                  disabled={isSavingLive || !selectedLiveIsOperable || !mayOperateLive}
                  disabledReason={operatorFinishDisabledReason}
                />
              </>
            )}
          </LiveActionCard>
        ) : isSupervisorView ? (
          renderSupervisorDashboard()
        ) : isSupportView ? (
          renderSupportActorView()
        ) : (
          <LiveInfoCard
            title={t(liveActorContext.labelKey)}
            subtitle={t(liveActorContext.subtitleKey)}
            style={styles.minimalModeCard}
          />
        )}

        {!isSupervisorView && !isSupportView && showRolesWidget ? (
          <View style={styles.roleSection}>
            <AppText variant="caption" color={theme.colors.mutedText} bold>
              {t('live.teamRolesTitle')}
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {t('live.teamRolesHelp')}
            </AppText>
            <AppResponsiveGrid
              gap={10}
              tabletColumns={3}
              desktopColumns={3}
              style={styles.roleGrid}
            >
              {roleCards.map((role) => (
                <LiveCompactCard key={role.title} style={styles.roleCard}>
                  <View style={styles.roleCardHeader}>
                    <AppText variant="caption" color={theme.colors.accent} bold>
                      {role.title}
                    </AppText>
                    <AppText bold numberOfLines={1}>
                      {role.value}
                    </AppText>
                  </View>
                  <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={2}>
                    {role.helper}
                  </AppText>
                </LiveCompactCard>
              ))}
            </AppResponsiveGrid>
          </View>
        ) : null}

        {!isSupervisorView && !isSupportView ? (
        <LiveLayout compact={!hasLeftColumnWidgets}>
          <View style={styles.commerceColumn}>
            {showProductSpotlightWidget ? (
            <AppCard>
              <View style={styles.productVisualHeader}>
                <View
                  style={[
                    styles.liveBadge,
                    {
                      backgroundColor: statusBackground,
                      borderColor: statusColor,
                    },
                  ]}
                >
                  <AppText variant="caption" color={statusColor} bold>
                    {selectedLiveStatus === 'ACTIVE' ? t('live.liveBadgeActive') : statusLabel}
                  </AppText>
                </View>
                {showAnalyticsWidget ? (
                  <AppText variant="caption" color={theme.colors.accent} bold>
                    {demoMetricCards[0]?.value} {t('live.demoCurrentViewers')}
                  </AppText>
                ) : null}
              </View>
              <View
                style={[
                  styles.productVisual,
                  isTablet ? styles.productVisualTablet : null,
                  {
                    backgroundColor: theme.colors.optionPressedBackground,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.xl,
                  },
                ]}
              >
                <View style={styles.spotlightContent}>
                  <AppText variant="caption" color={theme.colors.accent} bold>
                    {t('live.productSpotlightTitle')}
                  </AppText>
                  <AppText variant="title" bold numberOfLines={2}>
                    {featuredProductName}
                  </AppText>
                  <AppText color={theme.colors.mutedText} numberOfLines={2}>
                    {featuredProductMeta}
                  </AppText>
                  <AppText variant="subtitle" color={theme.colors.accent} bold>
                    {featuredProductPrice}
                  </AppText>
                  <View style={styles.productMetaRow}>
                    <View style={styles.productMetaItem}>
                      <AppText variant="caption" color={theme.colors.mutedText}>
                        {t('live.productCode')}
                      </AppText>
                      <AppText bold numberOfLines={1}>
                        {featuredProductCode}
                      </AppText>
                    </View>
                    <View style={styles.productMetaItem}>
                      <AppText variant="caption" color={theme.colors.mutedText}>
                        {t('live.productSize')}
                      </AppText>
                      <AppText bold numberOfLines={1}>
                        {featuredProductSize}
                      </AppText>
                    </View>
                    <View style={styles.productMetaItem}>
                      <AppText variant="caption" color={theme.colors.mutedText}>
                        {t('live.productStatus')}
                      </AppText>
                      <AppText bold color={theme.colors.accent} numberOfLines={1}>
                        {featuredProductStatus}
                      </AppText>
                    </View>
                  </View>
                  <View style={styles.spotlightPulseRow}>
                    <View
                      style={[
                        styles.livePulse,
                        { backgroundColor: theme.colors.danger },
                      ]}
                    />
                    <AppText variant="caption" bold>
                      {hasActiveProduct
                        ? t('live.spotlightLivePrompt')
                        : t('live.spotlightSelectProductPrompt')}
                    </AppText>
                  </View>
                  <View style={styles.spotlightBadgeRow}>
                    {spotlightBadges.map((badge) => (
                      <View
                        key={badge}
                        style={[
                          styles.spotlightBadge,
                          {
                            backgroundColor: theme.colors.surface,
                            borderColor: theme.colors.border,
                            borderRadius: theme.radius.md,
                          },
                        ]}
                      >
                        <AppText variant="caption" bold>
                          {badge}
                        </AppText>
                      </View>
                    ))}
                  </View>
                </View>
                {showActivityFeedWidget ? (
                <View style={styles.commentOverlay}>
                  <View
                    style={[
                      styles.commentBubble,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                        borderRadius: theme.radius.lg,
                      },
                    ]}
                  >
                    <AppText variant="caption" bold>
                      {t('live.demoCommentOne')}
                    </AppText>
                  </View>
                  <View
                    style={[
                      styles.commentBubble,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                        borderRadius: theme.radius.lg,
                      },
                    ]}
                  >
                    <AppText variant="caption">
                      {t('live.demoCommentTwo')}
                    </AppText>
                  </View>
                </View>
                ) : null}
              </View>
            </AppCard>
            ) : null}

        {showPresenterViewWidget ? (
        <LiveInfoCard title={t('live.presenterPanelTitle')} subtitle={presenterMessage}>
            <View style={styles.presenterActionRow}>
              <View style={styles.presenterAction}>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  {t('live.presenterCurrentProduct')}
                </AppText>
                <AppText bold numberOfLines={1}>
                  {featuredProductName}
                </AppText>
              </View>
                {showAnalyticsWidget ? (
                <View style={styles.presenterAction}>
                  <AppText variant="caption" color={theme.colors.mutedText}>
                    {t('live.presenterAudience')}
                  </AppText>
                  <AppText bold color={theme.colors.accent}>
                    {demoMetricCards[0]?.value}
                  </AppText>
                </View>
              ) : null}
              <View style={styles.presenterAction}>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  {t('live.presenterStatus')}
                </AppText>
                <AppText bold color={statusColor} numberOfLines={1}>
                  {statusLabel}
                </AppText>
              </View>
          </View>
        </LiveInfoCard>
        ) : null}

        {showOperationalStateWidget ? (
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
        ) : null}

        {showStreamingPanel ? (
        <AppCard>
          <View style={styles.demoHeader}>
            <View style={styles.statusTextBlock}>
              <View style={styles.demoTitleRow}>
                <AppText variant="subtitle" bold>
                  {t('live.streamPulseTitle')}
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
                    {t('live.streamPulseBadge')}
                  </AppText>
                </View>
              </View>
              {!isTablet ? (
                <AppText color={theme.colors.mutedText}>
                  {t('live.streamPulseHelp')}
                </AppText>
              ) : null}
            </View>

            <Pressable
              onPress={() => setShowDemoMetrics((current) => !current)}
              disabled={!showAnalyticsWidget}
              style={({ pressed }) => [
                styles.demoToggle,
                {
                  borderColor: theme.colors.border,
                  opacity: !showAnalyticsWidget ? 0.45 : pressed ? 0.75 : 1,
                },
              ]}
            >
              <AppText variant="caption" bold>
                {!showAnalyticsWidget
                  ? t('live.demoMetricsHiddenByPreference')
                  : showDemoMetrics
                  ? t('live.demoHideMetrics')
                  : t('live.demoShowMetrics')}
              </AppText>
            </Pressable>
          </View>

          {shouldShowDemoMetrics ? (
            <>
              <AppResponsiveGrid
                gap={isTablet ? 8 : 12}
                tabletColumns={2}
                desktopColumns={3}
                style={styles.demoMetricGrid}
              >
                {(isTablet ? streamingMetricCards : visibleDemoMetricCards).map((metric) => (
                  <LiveMetricCard
                    key={metric.label}
                    label={metric.label}
                    value={metric.value}
                    helper={metric.helper}
                    compact={isTablet}
                  />
                ))}
              </AppResponsiveGrid>

              {!isTablet ? (
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
              ) : null}

              {showActivityFeedWidget ? (
              <View
                style={[
                  styles.demoPanel,
                  isTablet ? styles.demoPanelTablet : null,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
              >
                <AppText bold>{t('live.activityFeedTitle')}</AppText>
                {activityFeed.length === 0 ? (
                  <AppText color={theme.colors.mutedText}>
                    {t('live.noLiveEvents')}
                  </AppText>
                ) : activityFeed.map((event, index) => (
                  <View
                    key={`${event.label}-${index}`}
                    style={[
                      styles.activityFeedRow,
                      {
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.surface,
                      },
                    ]}
                  >
                    <View style={styles.activityFeedMain}>
                      <View
                        style={[
                          styles.activityBadge,
                          {
                            backgroundColor:
                              event.tone === 'success'
                                ? theme.colors.successBackground
                                : theme.colors.infoCardBackground,
                            borderColor:
                              event.tone === 'success'
                                ? theme.colors.success
                                : theme.colors.accent,
                          },
                        ]}
                      >
                        <AppText
                          variant="caption"
                          color={
                            event.tone === 'success'
                              ? theme.colors.success
                              : theme.colors.accent
                          }
                          bold
                        >
                          {event.badge}
                        </AppText>
                      </View>
                      <AppText numberOfLines={2}>{event.label}</AppText>
                    </View>
                    <AppText variant="caption" color={theme.colors.mutedText}>
                      {event.time}
                    </AppText>
                  </View>
                ))}
              </View>
              ) : null}
            </>
          ) : (
            <>
              {showActivityFeedWidget ? (
                <View
                  style={[
                    styles.demoPanel,
                    isTablet ? styles.demoPanelTablet : null,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surface,
                    },
                  ]}
                >
                  <AppText bold>{t('live.activityFeedTitle')}</AppText>
                  {activityFeed.length === 0 ? (
                    <AppText color={theme.colors.mutedText}>
                      {t('live.noLiveEvents')}
                    </AppText>
                  ) : activityFeed.map((event, index) => (
                    <View
                      key={`${event.label}-${index}`}
                      style={[
                        styles.activityFeedRow,
                        {
                          borderColor: theme.colors.border,
                          backgroundColor: theme.colors.surface,
                        },
                      ]}
                    >
                      <View style={styles.activityFeedMain}>
                        <AppText numberOfLines={2}>{event.label}</AppText>
                      </View>
                      <AppText variant="caption" color={theme.colors.mutedText}>
                        {event.time}
                      </AppText>
                    </View>
                  ))}
                </View>
              ) : (
                <AppText color={theme.colors.mutedText}>
                  {t('live.demoMetricsCollapsed')}
                </AppText>
              )}
            </>
          )}
        </AppCard>
        ) : null}

          </View>

          <View style={styles.commerceColumn}>

        {!isOperatorFocusedView ? (
        <AppCard style={styles.operationHeaderCard}>
          <View style={styles.operationHeaderTop}>
            <AppText variant="subtitle" bold>
              {t('live.operationBlockTitle')}
            </AppText>
            <AppText color={theme.colors.mutedText}>
              {selectedLive
                ? t('live.operationBlockActiveHelp')
                : t('live.operationBlockHelp')}
            </AppText>
          </View>

        {filteredLives.length > 0 ? (
          <View style={[styles.operationSection, { borderColor: theme.colors.border }]}>
            <AppText variant="caption" color={theme.colors.mutedText} bold>
              {t('live.openLivesTitle')}
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
          </View>
        ) : null}

        {selectedLive && !isOperatorFocusedView ? (
          <View style={[styles.operationSection, { borderColor: theme.colors.border }]}>
            <>
              <View style={styles.liveSessionCompactHeader}>
                <AppText bold>{t('live.liveNumber', { id: selectedLive.id })}</AppText>
                <AppText color={statusColor} bold>
                  {getLiveStatusLabel(selectedLive.status)}
                </AppText>
              </View>
              <AppText color={theme.colors.mutedText}>
                {selectedLive.notes || t('live.capturingHelp')}
              </AppText>
              {selectedLive.status !== 'CLOSED' ? (
                <AppText variant="caption" color={theme.colors.accent} bold>
                  {t('live.capturingHelp')}
                </AppText>
              ) : null}

              <View style={styles.buttonRow}>
                {mayOperateLive && selectedLive.status === 'OPEN' ? (
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
          </View>
        ) : (
          <View style={[styles.operationSection, { borderColor: theme.colors.border }]}>
            <AppText color={theme.colors.infoCardText}>
              {t('live.liveSessionEmpty')}
            </AppText>
          </View>
        )}

          <View style={[styles.operationSection, { borderColor: theme.colors.border }]}>
          <AppText variant="caption" color={theme.colors.mutedText} bold>
            {t('live.createLiveTitle')}
          </AppText>
          <AppText color={theme.colors.mutedText}>
            {t('live.createLiveHelp')}
          </AppText>

          {mayOperateLive ? (
            <>
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
            </>
          ) : (
            <AppText variant="caption" color={theme.colors.mutedText}>
              {t('live.presenterReadOnlyHelp')}
            </AppText>
          )}
          </View>
        </AppCard>
        ) : null}

        {!isOperatorFocusedView ? renderSupportActiveItemPanel() : null}

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
                    {live.notes ? ` - ${live.notes}` : ''}
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

        {!isOperatorFocusedView ? (
        <LiveActionCard title={t('live.operatorConsoleTitle')} subtitle={t('live.operatorConsoleHelp')}>
          <View style={styles.operatorQuickRow}>
            <View
              style={[
                styles.operatorQuickChip,
                {
                  backgroundColor: theme.colors.infoCardBackground,
                  borderColor: theme.colors.accent,
                },
              ]}
            >
              <AppText variant="caption" color={theme.colors.accent} bold>
                {t('live.operatorQuickReservation')}
              </AppText>
            </View>
            <View
              style={[
                styles.operatorQuickChip,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <AppText variant="caption" bold>
                {t('live.operatorQuickProduct')}
              </AppText>
            </View>
          </View>
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
            <LiveCompactCard style={styles.captureChoiceCard}>
            <AppText variant="caption" color={theme.colors.mutedText} bold>
              {t('live.existingCustomerTitle')}
            </AppText>
            <AppText>
              {selectedCustomer
                ? selectedCustomer.name
                : t('live.selectCustomerHelp')}
            </AppText>
            {maySelectCustomer ? (
              <AppButton
                title={
                  selectedCustomer
                    ? t('live.changeCustomer')
                    : t('live.selectCustomer')
                }
                variant="operation"
                onPress={() => setIsCustomerModalVisible(true)}
              />
            ) : (
              <AppText variant="caption" color={theme.colors.mutedText}>
                {t('live.customerPermissionError')}
              </AppText>
            )}
            </LiveCompactCard>

            {mayCreateCustomer ? (
            <View style={styles.secondaryFlowGroup}>
              <AppText variant="caption" color={theme.colors.mutedText} bold>
                {t('live.newCustomerQuestion')}
              </AppText>
              <Pressable
                onPress={() => router.push('/customers-create?returnTo=/live' as any)}
                style={({ pressed }) => [
                  styles.ghostAction,
                  {
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.md,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <AppText variant="caption" color={theme.colors.mutedText} bold>
                  {t('live.quickCustomer')}
                </AppText>
              </Pressable>
            </View>
            ) : null}
          </View>

            <View style={styles.sectionSpacing}>
              <AppText bold>{t('live.item')}</AppText>
            <AppText>
              {selectedItem
                ? `${selectedItem.code} - ${selectedItem.productTypeName || t('live.noType')}`
                : t('live.itemHelp')}
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {activeItem
                ? t('live.activeProductCurrent', { item: activeItem.code })
                : t('live.noOfficialActiveProduct')}
            </AppText>

            <View style={styles.capturePrimaryGroup}>
            <AppInput
              label={t('live.productCodeQrLabel')}
              placeholder={t('live.productCodeQrPlaceholder')}
              value={scanInput}
              onChangeText={setScanInput}
              onSubmitEditing={() => addItemByCode(scanInput)}
              style={styles.guidedInput}
              editable={maySelectItem}
            />

            {maySelectItem ? (
                <AppButton
                  title={t('live.addItemPrimary')}
                  variant="operation"
                  onPress={() => addItemByCode(scanInput)}
                />
              ) : (
                <AppText variant="caption" color={theme.colors.mutedText}>
                  {t('live.itemPermissionError')}
                </AppText>
              )}
              <AppText variant="caption" color={theme.colors.mutedText}>
                {t('live.productCodeQrHelp')}
              </AppText>
              {selectedItem ? (
                <AppButton
                  title={
                    activeItem?.id === selectedItem.id
                      ? t('live.productAlreadyOnAir')
                      : t('live.markProductOnAir')
                  }
                  variant="secondary"
                  onPress={handleSetSelectedItemActive}
                  loading={isSavingActiveItem}
                  disabled={
                    isSavingActiveItem ||
                    !selectedLiveIsOperable ||
                    !mayOperateLive ||
                    activeItem?.id === selectedItem.id
                  }
                  disabledReason={
                    !mayOperateLive
                      ? t('live.liveOperatePermissionError')
                      : !selectedLiveIsOperable
                        ? t('live.selectOpenLiveReason')
                        : undefined
                  }
                />
              ) : null}
            </View>

            {maySelectItem ? (
            <View style={styles.secondaryFlowGroup}>
              <AppText variant="caption" color={theme.colors.mutedText} bold>
                {t('live.noCodeQuestion')}
              </AppText>
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
                  title={t('live.scanQr')}
                  variant="secondary"
                  onPress={() => setIsScannerVisible(true)}
                />
                </View>
              </View>
            </View>
            ) : null}
            {mayCreateItem ? (
            <View style={styles.tertiaryFlowGroup}>
              <AppText variant="caption" color={theme.colors.mutedText} bold>
                {t('live.itemDoesNotExistQuestion')}
              </AppText>
              <Pressable
                onPress={() => router.push('/items-create?returnTo=/live' as any)}
                style={({ pressed }) => [
                  styles.ghostAction,
                  {
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.md,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <AppText variant="caption" color={theme.colors.mutedText} bold>
                  {t('live.quickItem')}
                </AppText>
              </Pressable>
            </View>
            ) : null}
            </View>

          <LiveCompactCard>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {t('live.quickReservationHint')}
            </AppText>
          </LiveCompactCard>

          <LiveWarningCard style={styles.reservationRiskCard}>
            <AppText variant="caption" color={theme.colors.warning} bold>
              {t('live.reservationRiskTitle')}
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {t('live.reservationRiskHelp')}
            </AppText>
          </LiveWarningCard>

          <AppInput
            label={t('live.price')}
            value={priceText}
            onChangeText={setPriceText}
            placeholder="0.00"
            keyboardType="numeric"
          />

          <AppButton
            title={t('live.reserveNow')}
            onPress={handleCreateReservation}
            loading={isSavingReservation}
            disabled={isSavingReservation || !mayOperateLive}
            disabledReason={!mayOperateLive ? t('live.liveOperatePermissionError') : undefined}
          />
        </LiveActionCard>
        ) : null}

          </View>

          <View style={styles.commerceColumn}>

        {!isOperatorFocusedView ? (
        <AppCard>
          <AppText variant="subtitle" bold>
            {t('live.recentReservations')}
          </AppText>

          {recentReservations.length === 0 ? (
            <AppText color={theme.colors.mutedText}>
              {t('live.noRecentReservations')}
            </AppText>
          ) : (
            <>
            {visibleRecentReservations.map(({ reservation, customerName, itemCode }) => {
              const paid = paidByReservationId[reservation.id] ?? 0;
              const settled = isReservationSettled(reservation, paid);
              const operationalStatus = getLiveReservationOperationalStatus(reservation);
              const operationalSold = operationalStatus === 'OPERATIONAL_SOLD';
              const operationalCancelled = operationalStatus === 'CANCELLED';
              const isUpdatingOperationalStatus =
                updatingOperationalReservationId === reservation.id;

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
                  {renderRecentReservationInfo(
                    reservation,
                    customerName,
                    itemCode,
                    operationalStatus,
                    settled,
                    operationalSold
                  )}
                  <View style={styles.buttonRow}>
                    <View style={styles.buttonFill}>
                      <AppButton
                        title={t('live.viewDetail')}
                        variant="secondary"
                        onPress={() => goToReservationDetail(reservation.id)}
                      />
                    </View>
                    {!settled && !operationalSold && !operationalCancelled && mayOperateLive ? (
                      <View style={styles.buttonFill}>
                        <AppButton
                          title={t('live.markOperationalSold')}
                          variant="operation"
                          loading={isUpdatingOperationalStatus}
                          onPress={() =>
                            handleUpdateReservationOperationalStatus(
                              reservation.id,
                              'OPERATIONAL_SOLD'
                            )
                          }
                        />
                      </View>
                    ) : null}
                    {operationalStatus === 'RESERVED' && mayOperateLive ? (
                      <View style={styles.buttonFill}>
                        <AppButton
                          title={t('live.markPending')}
                          variant="secondary"
                          loading={isUpdatingOperationalStatus}
                          onPress={() =>
                            handleUpdateReservationOperationalStatus(
                              reservation.id,
                              'PENDING'
                            )
                          }
                        />
                      </View>
                    ) : null}
                    {operationalStatus === 'PENDING' && mayOperateLive ? (
                      <View style={styles.buttonFill}>
                        <AppButton
                          title={t('live.returnToReserved')}
                          variant="secondary"
                          loading={isUpdatingOperationalStatus}
                          onPress={() =>
                            handleUpdateReservationOperationalStatus(
                              reservation.id,
                              'RESERVED'
                            )
                          }
                        />
                      </View>
                    ) : null}
                    {operationalSold && mayOperateLive ? (
                      <View style={styles.buttonFill}>
                        <AppButton
                          title={t('live.returnToReserved')}
                          variant="secondary"
                          loading={isUpdatingOperationalStatus}
                          onPress={() =>
                            handleUpdateReservationOperationalStatus(
                              reservation.id,
                              'RESERVED'
                            )
                          }
                        />
                      </View>
                    ) : null}
                    {!operationalCancelled && mayOperateLive ? (
                      <View style={styles.buttonFill}>
                        <AppButton
                          title={t('live.cancelOperational')}
                          variant="cancel"
                          loading={isUpdatingOperationalStatus}
                          onPress={() =>
                            handleUpdateReservationOperationalStatus(
                              reservation.id,
                              'CANCELLED'
                            )
                          }
                        />
                      </View>
                    ) : null}
                    {operationalCancelled && mayOperateLive ? (
                      <View style={styles.buttonFill}>
                        <AppButton
                          title={t('live.reactivateReserved')}
                          variant="secondary"
                          loading={isUpdatingOperationalStatus}
                          onPress={() =>
                            handleUpdateReservationOperationalStatus(
                              reservation.id,
                              'RESERVED'
                            )
                          }
                        />
                      </View>
                    ) : null}
                    {!settled && !operationalCancelled && mayOperateLive && canViewPayments ? (
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
            })}
            {isTablet && recentReservations.length > visibleRecentReservations.length ? (
              <AppText variant="caption" color={theme.colors.mutedText}>
                {t('live.moreRecentReservations', {
                  count: recentReservations.length - visibleRecentReservations.length,
                })}
              </AppText>
            ) : null}
            </>
          )}
        </AppCard>
        ) : null}

        {selectedLive && !isOperatorFocusedView ? (
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
            ) : mayOperateLive ? (
              <AppButton
                title={t('live.closeLive')}
                variant="danger"
                onPress={() => handleCloseLive(selectedLive)}
                loading={isSavingLive}
                style={styles.buttonSpacing}
              />
            ) : (
              <AppText variant="caption" color={theme.colors.mutedText} style={styles.buttonSpacing}>
                {t('live.presenterReadOnlyHelp')}
              </AppText>
            )}
          </AppCard>
        ) : null}

          </View>
        </LiveLayout>
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
                    {live.notes ? ` - ${live.notes}` : ''}
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
                item.isGeneric ? ` - ${t('live.generic')}` : ''
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
          renderItem={({ item }) => {
            const availability = getItemLiveAvailability(item);

            return (
              <AppOptionRow
                title={item.code}
                subtitle={`${item.productTypeName || t('live.noType')} - ${
                  item.brandName || t('live.noBrand')
                } - ${item.sizeName || t('live.noSize')}`}
                onPress={() => selectItem(item)}
              >
                <AppText variant="caption" color={theme.colors.mutedText}>
                  {t('live.suggestedPrice')}{' '}
                  {item.price !== null && item.price !== undefined
                    ? formatMoney(item.price)
                    : t('live.noPrice')}
                </AppText>
                <AppText
                  variant="caption"
                  color={availability.canGoOnAir ? theme.colors.success : theme.colors.warning}
                  bold
                >
                  {availability.label}
                </AppText>
                {availability.reason ? (
                  <AppText variant="caption" color={theme.colors.warning}>
                    {availability.reason}
                  </AppText>
                ) : null}
              </AppOptionRow>
            );
          }}
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
  activityBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  activityFeedMain: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  activityFeedRow: {
    alignItems: 'flex-start',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    padding: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  buttonFill: {
    flex: 1,
    minWidth: 130,
  },
  buttonSpacing: {
    marginTop: 10,
  },
  commerceColumn: {
    gap: 10,
    minWidth: 0,
  },
  captureChoiceCard: {
    gap: 8,
  },
  capturePrimaryGroup: {
    gap: 6,
  },
  commentBubble: {
    borderWidth: 1,
    maxWidth: '92%',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  commentOverlay: {
    gap: 8,
    marginTop: 18,
    width: '100%',
  },
  demoBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  guidedInput: {
    minHeight: 54,
  },
  ghostAction: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  demoPanelTablet: {
    gap: 6,
    minWidth: 0,
    padding: 10,
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
  liveBadge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  liveButton: {
    borderWidth: 1,
    justifyContent: 'center',
    marginBottom: 8,
    minHeight: 72,
    padding: 10,
  },
  liveButtonGrid: {
    marginTop: 8,
  },
  liveHeader: {
    gap: 8,
    marginBottom: 2,
  },
  liveHeaderText: {
    gap: 4,
  },
  livePulse: {
    height: 9,
    width: 9,
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
  minimalModeCard: {
    marginBottom: 10,
  },
  minimalStepPill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  minimalStepRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  productVisual: {
    borderWidth: 1,
    minHeight: 240,
    padding: 18,
    justifyContent: 'flex-end',
  },
  productVisualTablet: {
    minHeight: 160,
    padding: 14,
  },
  productVisualHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  productMetaItem: {
    flex: 1,
    minWidth: 92,
  },
  productMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  operatorFollowUpRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  operatorHeroCard: {
    marginBottom: 12,
  },
  operatorHeroTitle: {
    flex: 1,
    gap: 4,
    minWidth: 220,
  },
  operatorHeroTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  operatorLiveStateCard: {
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  operatorClosedLiveCard: {
    gap: 12,
  },
  closedLiveExpandedActions: {
    alignItems: 'flex-end',
    gap: 8,
    minWidth: 120,
  },
  closedLiveExpandedRow: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    padding: 10,
  },
  closedLiveExpandedSection: {
    gap: 10,
  },
  closedLiveExpandedText: {
    flex: 1,
    gap: 3,
    minWidth: 180,
  },
  fullLiveHistoryList: {
    gap: 10,
  },
  fullLiveHistoryMain: {
    flex: 1,
    gap: 4,
    minWidth: 190,
  },
  fullLiveHistoryMetrics: {
    gap: 4,
    minWidth: 160,
  },
  fullLiveHistoryRow: {
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    padding: 10,
  },
  operatorLastClosedLiveCard: {
    gap: 14,
    paddingVertical: 14,
  },
  operatorLiveDetailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  operatorLiveDetailRow: {
    borderWidth: 1,
    flex: 1,
    gap: 3,
    minWidth: 160,
    padding: 10,
  },
  operatorLiveSummaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  operatorLiveSummaryMetric: {
    flex: 1,
    gap: 3,
    minWidth: 120,
  },
  operatorPrimaryButton: {
    minHeight: 54,
  },
  operatorRecentLiveCard: {
    borderWidth: 1,
    flex: 1,
    gap: 5,
    minWidth: 180,
    padding: 10,
  },
  operatorRecentLiveGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  recentLiveHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  selectedLiveChip: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  supervisorDashboardCard: {
    gap: 14,
    marginBottom: 12,
  },
  supervisorMetricCard: {
    borderWidth: 1,
    gap: 4,
    minHeight: 78,
    padding: 10,
  },
  supervisorSectionCard: {
    gap: 10,
  },
  operatorRecentReservationsCard: {
    gap: 10,
  },
  operatorProductStrip: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  operatorProductText: {
    flex: 1,
    minWidth: 220,
  },
  operatorItemBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  operatorItemCard: {
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 12,
  },
  operatorItemActionCard: {
    alignItems: 'center',
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 74,
    minWidth: 190,
    padding: 12,
  },
  operatorItemActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  operatorItemActionIcon: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  operatorItemActionText: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  operatorItemDetails: {
    flex: 1,
    gap: 10,
    minWidth: 220,
  },
  operatorItemHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  operatorItemMeta: {
    flex: 1,
    gap: 2,
    minWidth: 96,
  },
  operatorItemMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  operatorItemPlaceholder: {
    alignItems: 'center',
    height: 92,
    justifyContent: 'center',
    width: 92,
  },
  operatorItemTitleBlock: {
    flex: 1,
    gap: 3,
    minWidth: 180,
  },
  operatorCustomerBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  operatorCustomerHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  operatorCustomerStat: {
    flex: 1,
    gap: 2,
    minWidth: 118,
  },
  operatorCustomerStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  operatorCustomerSummaryCard: {
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  operatorCustomerText: {
    flex: 1,
    gap: 3,
    minWidth: 180,
  },
  operatorQuickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  operatorQuickChip: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  operatorQuickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  operatorStatusBadge: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  operatorFlowStepCard: {
    gap: 10,
  },
  operatorStepCard: {
    borderWidth: 1,
    flex: 1,
    gap: 6,
    minWidth: 150,
    padding: 12,
  },
  operatorStepGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  operatorStepStack: {
    gap: 10,
  },
  operationHeaderCard: {
    gap: 10,
  },
  operationHeaderTop: {
    gap: 4,
  },
  operationSection: {
    borderTopWidth: 1,
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
  },
  presenterAction: {
    flex: 1,
    minWidth: 120,
  },
  presenterActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  presenterEmptyOnAirCard: {
    borderWidth: 1,
    gap: 6,
    padding: 12,
  },
  presenterOnAirHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  presenterOnAirPanel: {
    gap: 12,
  },
  presenterPriceBand: {
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  roleCard: {
    minHeight: 78,
  },
  roleCardHeader: {
    gap: 4,
  },
  roleGrid: {
    marginTop: 8,
  },
  roleSection: {
    gap: 4,
    marginBottom: 10,
    marginTop: 2,
  },
  spotlightBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  spotlightBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  spotlightContent: {
    gap: 6,
  },
  spotlightPulseRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
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
  recentReservationHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  recentReservationBadgeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentReservationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentReservationMeta: {
    flex: 1,
    gap: 2,
    minWidth: 120,
  },
  recentReservationPriceBlock: {
    alignItems: 'flex-end',
    gap: 2,
  },
  recentReservationText: {
    flex: 1,
    minWidth: 160,
  },
  reservationRiskCard: {
    marginTop: 4,
  },
  sectionSpacing: {
    marginTop: 12,
    gap: 8,
  },
  secondaryFlowGroup: {
    gap: 6,
    marginTop: 4,
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
  tertiaryAction: {
    maxWidth: 280,
    opacity: 0.88,
  },
  tertiaryFlowGroup: {
    gap: 6,
    marginTop: 4,
  },
  liveSessionCompactHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
});
