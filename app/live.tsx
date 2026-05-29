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
  canCreateLiveCustomer,
  canCreateLiveItem,
  canOperateLive,
  canSelectLiveCustomer,
  canSelectLiveItem,
  canViewLive,
  canViewLiveAnalytics,
} from '@/services/livePermissionGuards';
import {
  createReservation,
  getReservationsByBranch,
  LiveReservationOperationalStatus,
  Reservation,
  updateLiveReservationOperationalStatus,
} from '@/services/reservationService';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
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

function isReservationSettled(reservation: Reservation, paid: number) {
  return paid >= Number(reservation.price || 0) && Number(reservation.price || 0) > 0;
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
  const [branchReservations, setBranchReservations] = useState<Reservation[]>([]);
  const [paidByReservationId, setPaidByReservationId] = useState<Record<number, number>>({});
  const [updatingOperationalReservationId, setUpdatingOperationalReservationId] =
    useState<number | null>(null);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [activeItem, setActiveItem] = useState<Item | null>(null);
  const [priceText, setPriceText] = useState('');
  const [scanInput, setScanInput] = useState('');

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
      setActiveItem(activeItemFromLive(nextSelectedLive));
      await updateRecentReservations(reservationData, nextSelectedLive?.id);
      await updateLiveEvents(nextSelectedLive?.id);

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
  const mayOperateLive = canOperateLive(session);
  const maySelectCustomer = canSelectLiveCustomer(session);
  const mayCreateCustomer = canCreateLiveCustomer(session);
  const maySelectItem = canSelectLiveItem(session);
  const mayCreateItem = canCreateLiveItem(session);
  const mayViewAnalytics = canViewLiveAnalytics(session);
  const isMobileLayout = isPhone;
  const showRolesWidget =
    !LIVE_MINIMAL_OPERATIONAL_MODE &&
    liveLayoutPreferences.showRoles &&
    (isTablet || isDesktop);
  const showProductSpotlightWidget = liveLayoutPreferences.showProductSpotlight;
  const showPresenterViewWidget =
    !LIVE_MINIMAL_OPERATIONAL_MODE && liveLayoutPreferences.showPresenterView;
  const showOperationalStateWidget = liveLayoutPreferences.showOperationalState;
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
    setActiveItem(activeItemFromLive(live));
    updateRecentReservations(branchReservations, live.id);
    void updateLiveEvents(live.id);
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

  const updateLiveEvents = async (liveId?: number | null) => {
    if (!liveId) {
      setLiveEvents([]);
      return;
    }

    try {
      setLiveEvents(await getLiveEvents(liveId));
    } catch {
      setLiveEvents([]);
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
      setSelectedLive(null);
      setActiveItem(null);
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

    setSelectedItem(item);
    setPriceText(
      item.price !== null && item.price !== undefined ? String(item.price) : ''
    );
    setItemSearch('');
    setIsItemModalVisible(false);
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

    setIsSavingActiveItem(true);

    try {
      const updated = await setLiveActiveItem(selectedLive.id, selectedItem.id);
      setSelectedLive(updated);
      setLives((current) =>
        current.map((live) => (live.id === updated.id ? updated : live))
      );
      setActiveItem(activeItemFromLive(updated));
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

        <LiveInfoCard
          title={t('live.minimalModeTitle')}
          subtitle={t('live.minimalModeHelp')}
          style={styles.minimalModeCard}
        >
          <View style={styles.minimalStepRow}>
            {[
              t('live.minimalStepLive'),
              t('live.minimalStepProduct'),
              t('live.minimalStepCustomer'),
              t('live.minimalStepReservation'),
              t('live.minimalStepClose'),
            ].map((step) => (
              <View
                key={step}
                style={[
                  styles.minimalStepPill,
                  {
                    backgroundColor: theme.colors.infoCardBackground,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.md,
                  },
                ]}
              >
                <AppText variant="caption" bold>
                  {step}
                </AppText>
              </View>
            ))}
          </View>
        </LiveInfoCard>

        {showRolesWidget ? (
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

        {selectedLive ? (
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
                {t('live.operatorQuickCharge')}
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

          </View>

          <View style={styles.commerceColumn}>

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
                  <LiveCompactCard>
                    <View style={styles.recentReservationHeader}>
                      <View style={styles.recentReservationText}>
                        <AppText bold numberOfLines={1}>{customerName}</AppText>
                        <AppText color={theme.colors.mutedText} numberOfLines={1}>
                          {itemCode}
                        </AppText>
                      </View>
                      <AppText color={theme.colors.accent} bold>
                        {formatMoney(Number(reservation.price || 0))}
                      </AppText>
                    </View>
                    <AppText variant="caption" color={theme.colors.mutedText}>
                      {settled
                        ? t('live.settled')
                        : operationalSold
                          ? t('live.operationalSoldStatus')
                          : getLiveReservationOperationalStatusLabel(operationalStatus, t)}
                    </AppText>
                    {operationalSold && !settled ? (
                      <AppText variant="caption" color={theme.colors.warning}>
                        {t('live.operationalSoldPersistedNoPaymentHelp')}
                      </AppText>
                    ) : null}
                    {!operationalSold && !operationalCancelled ? (
                      <AppText variant="caption" color={theme.colors.mutedText}>
                        {getReservationSellerLabel(reservation)}
                      </AppText>
                    ) : null}
                  </LiveCompactCard>
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
                    {!settled && !operationalCancelled ? (
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
          renderItem={({ item }) => (
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
    gap: 10,
    justifyContent: 'space-between',
  },
  recentReservationText: {
    flex: 1,
    minWidth: 0,
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
