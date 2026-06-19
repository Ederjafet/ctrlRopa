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
import { useAppTheme } from '@/context/AppThemeContext';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { hasPermission } from '@/services/accessControl';
import {
  getActionableApiError,
  getActionableApiErrorMessage,
} from '@/services/apiError';
import { Box, getActiveBoxesByBranch } from '@/services/boxService';
import { Customer, getCustomersByBranch } from '@/services/customerService';
import {
  addCustomerPackageItem,
  createCustomerPackage,
  getCustomerPackageDetailsByCustomer,
  getCustomerPackageDetail,
  getCustomerPackagesByCustomer,
  prepareCustomerPackageFromReservation,
  type CustomerPackageDetail,
} from '@/services/customerPackageService';
import { getItemsByBranch, type Item } from '@/services/itemService';
import {
  assignReservationToBox,
  getReservationsByBranch,
  linkReservationCustomer,
  type Reservation,
} from '@/services/reservationService';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, StyleSheet, View } from 'react-native';

type ReservationFilter =
  | 'ALL'
  | 'ACTIVE'
  | 'WITHOUT_BOX'
  | 'WITH_BOX'
  | 'INTERESTED'
  | 'CUSTOMERS'
  | 'IN_PACKAGE'
  | 'READY_TO_SHIP'
  | 'SHIPPED';

type ReservationAction = 'assignBox' | 'createPackage' | 'linkCustomer';
type PrimaryActionKind =
  | 'linkCustomer'
  | 'createPackage'
  | 'assignBox'
  | 'registerPayment'
  | 'releaseShipment'
  | 'markShipped'
  | 'viewPackage'
  | 'detail';

type OperationalTab = {
  key: ReservationFilter;
  label: string;
  enabled: boolean;
  disabledReason?: string;
};

const RESERVATION_PAGE_SIZE = 25;

type ReservationPackageLink = {
  id: number;
  folio: string;
  status?: string;
};

type ReservationPackageMap = Record<number, ReservationPackageLink>;

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

function hasFormalCustomer(reservation: Reservation) {
  return Boolean(reservation.customerId);
}

function hasInterestedAlias(reservation: Reservation) {
  return !reservation.customerId && Boolean(reservation.interestedAlias);
}

function isSelectableCustomer(customer: Customer) {
  return customer.status !== 'INACTIVE' && !customer.isGeneric;
}

function isActivePackageStatus(status?: string | null) {
  return status === 'OPEN' || status === 'READY' || status === 'SHIPPED';
}

function getPartyInfo(reservation: Reservation) {
  if (reservation.customerName) {
    return {
      badge: 'CLIENTE',
      displayType: 'Cliente',
      label: reservation.customerName,
      tone: 'info' as const,
      needsCustomer: false,
    };
  }

  if (reservation.customerId) {
    return {
      badge: 'CLIENTE',
      displayType: 'Cliente',
      label: `#${reservation.customerId}`,
      tone: 'info' as const,
      needsCustomer: false,
    };
  }

  if (reservation.interestedAlias) {
    return {
      badge: 'INTERESADO',
      displayType: 'Interesado',
      label: reservation.interestedAlias,
      tone: 'warning' as const,
      needsCustomer: true,
    };
  }

  return {
    badge: 'SIN CLIENTE',
    displayType: 'Sin cliente',
    label: 'Requiere seguimiento',
    tone: 'danger' as const,
    needsCustomer: true,
  };
}

function getReservationCustomerLabel(reservation: Reservation) {
  const party = getPartyInfo(reservation);

  if (party.badge === 'CLIENTE') return `Cliente: ${party.label}`;
  if (party.badge === 'INTERESADO') return `Interesado: ${party.label}`;
  return 'Sin cliente/interesado';
}

function getPrimaryAction(
  reservation: Reservation,
  packageLink?: ReservationPackageLink
): { kind: PrimaryActionKind; title: string } {
  if (!isActiveReservation(reservation)) return { kind: 'detail', title: 'Ver detalle' };
  if (packageLink) return { kind: 'viewPackage', title: 'Ver paquete' };
  if (!reservation.customerId) return { kind: 'linkCustomer', title: 'Vincular cliente' };

  return { kind: 'createPackage', title: 'Crear paquete' };
}

function getPackageDisabledReason(
  reservation: Reservation,
  session: UserSession | null,
  packageLink?: ReservationPackageLink
) {
  if (packageLink) {
    return `Este apartado ya esta en el paquete ${packageLink.folio}.`;
  }

  if (!hasPermission(session, 'CREATE_CLOSE_CUSTOMER_PACKAGE')) {
    return 'Tu usuario no tiene permiso para crear paquetes.';
  }

  if (!isActiveReservation(reservation)) {
    return 'Solo se pueden preparar paquetes desde apartados activos.';
  }

  if (!reservation.customerId) {
    return 'Primero vincula este interesado a un cliente formal para crear paquete.';
  }

  if (!reservation.itemId) {
    return 'El apartado debe tener prenda antes de crear paquete.';
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
  const { isPhone } = useResponsiveLayout();
  const returnTo = Array.isArray(params.returnTo) ? params.returnTo[0] : params.returnTo;
  const isLiveContext = returnTo === '/live';

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ReservationFilter>('ALL');
  const [visibleLimit, setVisibleLimit] = useState(RESERVATION_PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAssigningBox, setIsAssigningBox] = useState(false);
  const [isLinkingCustomer, setIsLinkingCustomer] = useState(false);
  const [isLoadingPackageCandidates, setIsLoadingPackageCandidates] = useState(false);
  const [workingReservationId, setWorkingReservationId] = useState<number | null>(null);
  const [workingAction, setWorkingAction] = useState<ReservationAction | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [actionsReservation, setActionsReservation] = useState<Reservation | null>(null);
  const [linkCustomerReservation, setLinkCustomerReservation] = useState<Reservation | null>(null);
  const [linkCustomerSearch, setLinkCustomerSearch] = useState('');
  const [selectedLinkCustomer, setSelectedLinkCustomer] = useState<Customer | null>(null);
  const [packageReservation, setPackageReservation] = useState<Reservation | null>(null);
  const [packageCandidates, setPackageCandidates] = useState<Reservation[]>([]);
  const [packageFreeItems, setPackageFreeItems] = useState<Item[]>([]);
  const [packageActivePackages, setPackageActivePackages] = useState<CustomerPackageDetail[]>([]);
  const [reservationPackageMap, setReservationPackageMap] = useState<ReservationPackageMap>({});
  const [selectedPackageReservationIds, setSelectedPackageReservationIds] = useState<number[]>([]);
  const [selectedPackageItemIds, setSelectedPackageItemIds] = useState<number[]>([]);
  const [selectedExistingPackageId, setSelectedExistingPackageId] = useState<number | null>(null);
  const [packageItemSearch, setPackageItemSearch] = useState('');
  const [expandedReservationId, setExpandedReservationId] = useState<number | null>(null);
  const [isBoxModalVisible, setIsBoxModalVisible] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const navSections = useMemo(() => buildMainNavSections(session), [session]);
  const sessionScopeLabel = getSessionScopeLabel(session);

  const operationalTabs: OperationalTab[] = useMemo(
    () => [
      { key: 'ALL', label: 'Todas', enabled: true },
      { key: 'ACTIVE', label: 'Activas', enabled: true },
      { key: 'WITHOUT_BOX', label: 'Sin caja', enabled: true },
      { key: 'WITH_BOX', label: 'Con caja', enabled: true },
      { key: 'INTERESTED', label: 'Interesados', enabled: true },
      { key: 'CUSTOMERS', label: 'Clientes', enabled: true },
      {
        key: 'IN_PACKAGE',
        label: 'En paquete',
        enabled: true,
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

  const loadReservationPackageMap = useCallback(async (activeReservations: Reservation[]) => {
    const customerIds = Array.from(
      new Set(
        activeReservations
          .map((reservation) => reservation.customerId)
          .filter((customerId): customerId is number => Boolean(customerId))
      )
    );

    if (customerIds.length === 0) {
      return {};
    }

    try {
      const packagesByCustomer = await Promise.all(
        customerIds.map((customerId) => getCustomerPackagesByCustomer(customerId))
      );
      const activePackages = packagesByCustomer
        .flat()
        .filter((customerPackage) => isActivePackageStatus(customerPackage.status));
      const packageDetails: CustomerPackageDetail[] = await Promise.all(
        activePackages.map((customerPackage) => getCustomerPackageDetail(customerPackage.id))
      );

      return packageDetails.reduce<ReservationPackageMap>((acc, customerPackage) => {
        customerPackage.items?.forEach((packageItem) => {
          if (packageItem.reservationId) {
            acc[packageItem.reservationId] = {
              id: customerPackage.id,
              folio: customerPackage.folio,
              status: customerPackage.status,
            };
          }
        });

        return acc;
      }, {});
    } catch (error) {
      console.log('No se pudo cargar membresia de paquetes', error);
      return {};
    }
  }, []);

  const loadReservations = useCallback(
    async (refreshing = false) => {
      const currentSession = await getSession();
      setSession(currentSession);

      if (!currentSession?.branchId) {
        setReservations([]);
        setReservationPackageMap({});
        setBoxes([]);
        setCustomers([]);
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

        const [reservationData, boxData, customerData] = await Promise.all([
          getReservationsByBranch(currentSession.branchId),
          getActiveBoxesByBranch(currentSession.branchId),
          getCustomersByBranch(currentSession.branchId),
        ]);

        const active = reservationData.filter(isActiveReservation);
        const packageMap = await loadReservationPackageMap(active);

        setReservations(active);
        setReservationPackageMap(packageMap);
        setBoxes(boxData);
        setCustomers(customerData.filter(isSelectableCustomer));
      } catch (error) {
        console.log('Error cargando reservaciones', error);
        setErrorMessage(getActionableApiErrorMessage(error, t));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [loadReservationPackageMap, t]
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
          : filter === 'INTERESTED'
            ? reservations.filter(hasInterestedAlias)
          : filter === 'CUSTOMERS'
            ? reservations.filter(hasFormalCustomer)
          : filter === 'IN_PACKAGE'
            ? reservations.filter((reservation) => Boolean(reservationPackageMap[reservation.id]))
          : reservations;

    if (!query) return data;

    return data.filter((reservation) => {
      const content = `
        ${reservation.id ?? ''}
        ${reservation.itemCode ?? ''}
        ${reservation.customerName ?? ''}
        ${reservation.interestedAlias ?? ''}
        ${reservation.status ?? ''}
        ${reservation.salesChannelName ?? ''}
        ${reservation.liveId ?? ''}
        ${reservation.liveNotes ?? ''}
        ${reservation.boxCode ?? ''}
        ${reservationPackageMap[reservation.id]?.folio ?? ''}
      `.toLowerCase();

      return content.includes(query);
    });
  }, [filter, reservationPackageMap, reservations, search]);

  const metrics = useMemo(() => {
    const active = reservations.filter(isActiveReservation);
    const withoutBox = active.filter((reservation) => !reservation.boxId);
    const withBox = active.filter((reservation) => Boolean(reservation.boxId));
    const interested = active.filter(hasInterestedAlias);
    const customers = active.filter(hasFormalCustomer);
    const inPackage = active.filter((reservation) => Boolean(reservationPackageMap[reservation.id]));

    return {
      active: active.length,
      interested: interested.length,
      customers: customers.length,
      withoutBox: withoutBox.length,
      withBox: withBox.length,
      inPackage: inPackage.length,
    };
  }, [reservationPackageMap, reservations]);

  const visibleReservations = useMemo(
    () => filtered.slice(0, visibleLimit),
    [filtered, visibleLimit]
  );
  const visibleCount = Math.min(visibleLimit, filtered.length);
  const canLoadMore = visibleCount < filtered.length;
  const filteredLinkCustomers = useMemo(() => {
    const query = linkCustomerSearch.toLowerCase().trim();
    const data = query
      ? customers.filter((customer) => {
          const content = `${customer.name ?? ''} ${customer.phone ?? ''} ${customer.email ?? ''}`.toLowerCase();
          return content.includes(query);
        })
      : customers;

    return data.slice(0, 25);
  }, [customers, linkCustomerSearch]);
  const selectedPackageReservations = useMemo(
    () =>
      packageCandidates.filter((reservation) =>
        selectedPackageReservationIds.includes(reservation.id)
      ),
    [packageCandidates, selectedPackageReservationIds]
  );
  const selectedPackageItems = useMemo(
    () => packageFreeItems.filter((item) => selectedPackageItemIds.includes(item.id)),
    [packageFreeItems, selectedPackageItemIds]
  );
  const packageSubtotal = useMemo(
    () =>
      selectedPackageReservations.reduce(
        (total, reservation) => total + Number(reservation.price || 0),
        0
      ) +
      selectedPackageItems.reduce((total, item) => total + Number(item.price || 0), 0),
    [selectedPackageItems, selectedPackageReservations]
  );
  const filteredPackageFreeItems = useMemo(() => {
    const term = packageItemSearch.trim().toLowerCase();
    const data = term
      ? packageFreeItems.filter((item) =>
          `${item.code || ''} ${item.qrCode || ''} ${item.productTypeName || ''} ${
            item.brandName || ''
          } ${item.sizeName || ''}`
            .toLowerCase()
            .includes(term)
        )
      : packageFreeItems;

    return data.slice(0, 40);
  }, [packageFreeItems, packageItemSearch]);

  const changeFilter = (nextFilter: ReservationFilter) => {
    setFilter(nextFilter);
    setVisibleLimit(RESERVATION_PAGE_SIZE);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setVisibleLimit(RESERVATION_PAGE_SIZE);
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

  const openPackageDetail = (packageLink: ReservationPackageLink) => {
    router.push({
      pathname: '/customer-package-detail',
      params: { id: String(packageLink.id) },
    } as any);
  };

  const applyUpdatedReservation = (updatedReservation: Reservation) => {
    setReservations((current) =>
      current.map((reservation) =>
        reservation.id === updatedReservation.id ? updatedReservation : reservation
      )
    );
    setSelectedReservation((current) =>
      current?.id === updatedReservation.id ? updatedReservation : current
    );
    setActionsReservation((current) =>
      current?.id === updatedReservation.id ? updatedReservation : current
    );
  };

  const openLinkCustomerModal = (reservation: Reservation) => {
    if (reservation.customerId) {
      Alert.alert('Vincular cliente', 'Este apartado ya tiene cliente formal.');
      return;
    }

    if (!hasInterestedAlias(reservation)) {
      Alert.alert('Vincular cliente', 'El apartado no tiene alias/interesado para vincular.');
      return;
    }

    setLinkCustomerReservation(reservation);
    setLinkCustomerSearch('');
    setSelectedLinkCustomer(null);
  };

  const closeLinkCustomerModal = () => {
    if (isLinkingCustomer) return;

    setLinkCustomerReservation(null);
    setLinkCustomerSearch('');
    setSelectedLinkCustomer(null);
  };

  const handleLinkCustomer = async () => {
    if (!linkCustomerReservation || !selectedLinkCustomer) return;

    try {
      setIsLinkingCustomer(true);
      setWorkingReservationId(linkCustomerReservation.id);
      setWorkingAction('linkCustomer');

      const updated = await linkReservationCustomer(
        linkCustomerReservation.id,
        selectedLinkCustomer.id
      );

      applyUpdatedReservation(updated);
      setLinkCustomerReservation(null);
      setLinkCustomerSearch('');
      setSelectedLinkCustomer(null);
      Alert.alert('Vincular cliente', 'Cliente vinculado al apartado.');
      await loadReservations(false);
    } catch (error: any) {
      const copy = getActionableApiError(error, t);
      Alert.alert(copy.title, copy.message, [{ text: copy.primaryActionLabel }]);
    } finally {
      setIsLinkingCustomer(false);
      setWorkingReservationId(null);
      setWorkingAction(null);
    }
  };

  const getPackageCandidates = async (reservation: Reservation) => {
    if (!reservation.customerId || !session) {
      return { reservations: [], freeItems: [], activePackages: [] };
    }

    const [packageData, itemData] = await Promise.all([
      getCustomerPackageDetailsByCustomer(reservation.customerId),
      getItemsByBranch(session.branchId),
    ]);
    const activePackages = packageData.filter((customerPackage) =>
      isActivePackageStatus(customerPackage.status)
    );
    const packagedReservationIds = new Set<number>();
    const packagedItemIds = new Set<number>();

    activePackages.forEach((customerPackage) => {
      customerPackage.items?.forEach((item) => {
        if (item.reservationId) {
          packagedReservationIds.add(item.reservationId);
        }
        if (item.itemId) {
          packagedItemIds.add(item.itemId);
        }
      });
    });

    const reservationCandidates = reservations
      .filter((candidate) => {
        if (!isActiveReservation(candidate)) return false;
        if (!candidate.customerId || candidate.customerId !== reservation.customerId) return false;
        if (!candidate.itemId) return false;
        return !packagedReservationIds.has(candidate.id);
      })
      .sort((a, b) => {
        if (a.id === reservation.id) return -1;
        if (b.id === reservation.id) return 1;
        return b.id - a.id;
      });

    const freeItems = itemData
      .filter((item) => item.status === 'AVAILABLE')
      .filter((item) => !packagedItemIds.has(item.id))
      .sort((a, b) => b.id - a.id);

    return {
      reservations: reservationCandidates,
      freeItems,
      activePackages,
    };
  };

  const openPackageModal = async (reservation: Reservation) => {
    const disabledReason = getPackageDisabledReason(
      reservation,
      session,
      reservationPackageMap[reservation.id]
    );

    if (disabledReason) {
      Alert.alert('Crear paquete', disabledReason);
      return;
    }

    setPackageReservation(reservation);
    setPackageCandidates([]);
    setPackageFreeItems([]);
    setPackageActivePackages([]);
    setSelectedPackageReservationIds([reservation.id]);
    setSelectedPackageItemIds([]);
    setSelectedExistingPackageId(null);
    setPackageItemSearch('');
    setIsLoadingPackageCandidates(true);

    try {
      const candidates = await getPackageCandidates(reservation);

      if (!candidates.reservations.some((candidate) => candidate.id === reservation.id)) {
        setPackageReservation(null);
        setSelectedPackageReservationIds([]);
        Alert.alert(
          'Crear paquete',
          'Este apartado ya esta en otro paquete activo o ya no esta disponible para paquete.'
        );
        return;
      }

      setPackageCandidates(candidates.reservations);
      setPackageFreeItems(candidates.freeItems);
      setPackageActivePackages(candidates.activePackages);
    } catch (error: any) {
      const copy = getActionableApiError(error, t);
      setPackageReservation(null);
      setSelectedPackageReservationIds([]);
      setSelectedPackageItemIds([]);
      setSelectedExistingPackageId(null);
      Alert.alert(copy.title, copy.message, [{ text: copy.primaryActionLabel }]);
    } finally {
      setIsLoadingPackageCandidates(false);
    }
  };

  const closePackageModal = () => {
    if (workingAction === 'createPackage') return;

    setPackageReservation(null);
    setPackageCandidates([]);
    setPackageFreeItems([]);
    setPackageActivePackages([]);
    setSelectedPackageReservationIds([]);
    setSelectedPackageItemIds([]);
    setSelectedExistingPackageId(null);
    setPackageItemSearch('');
  };

  const togglePackageReservationSelection = (reservationId: number) => {
    setSelectedPackageReservationIds((current) =>
      current.includes(reservationId)
        ? current.filter((id) => id !== reservationId)
        : [...current, reservationId]
    );
  };

  const togglePackageItemSelection = (itemId: number) => {
    setSelectedPackageItemIds((current) =>
      current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId]
    );
  };

  const handleCreatePackage = async () => {
    if (!session || !packageReservation) return;

    if (selectedPackageReservations.length === 0 && selectedPackageItems.length === 0) {
      Alert.alert('Crear paquete', 'Selecciona al menos un apartado o una prenda libre.');
      return;
    }

    try {
      setWorkingReservationId(packageReservation.id);
      setWorkingAction('createPackage');

      let detail: CustomerPackageDetail;
      const [firstReservation, ...extraReservations] = selectedPackageReservations;

      if (selectedExistingPackageId) {
        const existingDetail = packageActivePackages.find((item) => item.id === selectedExistingPackageId);
        if (!existingDetail) {
          Alert.alert('Agregar a paquete', 'Selecciona un paquete activo valido.');
          return;
        }
        detail = existingDetail;

        for (const reservation of selectedPackageReservations) {
          detail = await addCustomerPackageItem(selectedExistingPackageId, {
            itemId: reservation.itemId,
            reservationId: reservation.id,
          });
        }
      } else if (firstReservation) {
        detail = await prepareCustomerPackageFromReservation(firstReservation.id, {
          createdByUserId: session.userId,
        });

        for (const reservation of extraReservations) {
          detail = await addCustomerPackageItem(detail.id, {
            itemId: reservation.itemId,
            reservationId: reservation.id,
          });
        }
      } else {
        detail = await createCustomerPackage({
          customerId: packageReservation.customerId!,
          branchId: session.branchId,
          notes: `Creado desde apartados para cliente #${packageReservation.customerId}`,
          createdByUserId: session.userId,
        }) as CustomerPackageDetail;
      }

      for (const item of selectedPackageItems) {
        detail = await addCustomerPackageItem(detail.id, {
          itemId: item.id,
        });
      }

      setPackageReservation(null);
      setPackageCandidates([]);
      setPackageFreeItems([]);
      setPackageActivePackages([]);
      setSelectedPackageReservationIds([]);
      setSelectedPackageItemIds([]);
      setSelectedExistingPackageId(null);
      setPackageItemSearch('');

      Alert.alert(
        selectedExistingPackageId ? 'Paquete actualizado' : 'Paquete creado',
        selectedExistingPackageId
          ? `Las prendas se agregaron al paquete ${detail.folio || `#${detail.id}`}.`
          : `Paquete ${detail.folio || `#${detail.id}`} creado correctamente.`,
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
  };

  const openActionsModal = (reservation: Reservation) => {
    setActionsReservation(reservation);
  };

  const closeActionsModal = () => {
    setActionsReservation(null);
  };

  const closeActionsAndRun = (callback: (reservation: Reservation) => void) => {
    if (!actionsReservation) return;

    const reservation = actionsReservation;
    setActionsReservation(null);
    callback(reservation);
  };

  const toggleExpandedReservation = (reservationId: number) => {
    setExpandedReservationId((current) => (current === reservationId ? null : reservationId));
  };

  const renderCompactMetric = (label: string, value: number) => (
    <View
      style={[
        styles.kpiPill,
        {
          backgroundColor: theme.colors.surfaceAlt,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <AppText variant="caption" color={theme.colors.mutedText} bold numberOfLines={1}>
        {label}: <AppText variant="caption" bold>{value}</AppText>
      </AppText>
    </View>
  );

  const renderPrimaryAction = (item: Reservation) => {
    const packageLink = reservationPackageMap[item.id];
    const primaryAction = getPrimaryAction(item, packageLink);
    const packageDisabledReason = getPackageDisabledReason(item, session, packageLink);
    const assignBoxDisabledReason = getAssignBoxDisabledReason(item);
    const isCreatingPackage = workingReservationId === item.id && workingAction === 'createPackage';
    const isLinkingCurrentCustomer = workingReservationId === item.id && workingAction === 'linkCustomer';
    const isAssigningCurrentBox = workingReservationId === item.id && workingAction === 'assignBox';
    const isBlockedByOtherAction = Boolean(workingReservationId && workingReservationId !== item.id);

    if (primaryAction.kind === 'linkCustomer') {
      return (
        <AppButton
          title={primaryAction.title}
          variant="warning"
          onPress={() => openLinkCustomerModal(item)}
          loading={isLinkingCurrentCustomer}
          disabled={isBlockedByOtherAction}
          disabledReason="Ya hay una accion en proceso."
          style={styles.primaryActionButton}
        />
      );
    }

    if (primaryAction.kind === 'detail') {
      return (
        <AppButton
          title={primaryAction.title}
          variant="secondary"
          onPress={() => openReservationDetail(item)}
          disabled={isBlockedByOtherAction}
          disabledReason="Ya hay una accion en proceso."
          style={styles.primaryActionButton}
        />
      );
    }

    if (primaryAction.kind === 'viewPackage' && packageLink) {
      return (
        <AppButton
          title={primaryAction.title}
          variant="operation"
          onPress={() => openPackageDetail(packageLink)}
          disabled={isBlockedByOtherAction}
          disabledReason="Ya hay una accion en proceso."
          style={styles.primaryActionButton}
        />
      );
    }

    const usesPackageAction = primaryAction.kind === 'createPackage';
    const disabledReason = usesPackageAction ? packageDisabledReason : assignBoxDisabledReason;
    const loading = usesPackageAction ? isCreatingPackage : isAssigningCurrentBox;

    return (
      <AppButton
        title={primaryAction.title}
        variant="operation"
        onPress={() => (usesPackageAction ? openPackageModal(item) : openBoxModal(item))}
        loading={loading}
        disabled={Boolean(disabledReason) || isBlockedByOtherAction}
        disabledReason={disabledReason || 'Ya hay una accion en proceso.'}
        style={styles.primaryActionButton}
      />
    );
  };

  const renderReservation = ({ item }: { item: Reservation }) => {
    const isExpanded = expandedReservationId === item.id;
    const party = getPartyInfo(item);
    const packageLink = reservationPackageMap[item.id];
    const channelLabel =
      item.liveId
        ? getLiveLabel(item)
        : getSalesChannelLabel(item.salesChannelCode, item.salesChannelName) || 'Canal no capturado';
    const boxLabel = item.boxCode || 'Sin caja';
    const followUpLabel = packageLink
      ? `En paquete ${packageLink.folio}`
      : party.needsCustomer
      ? 'Pendiente: vincular cliente'
      : item.boxCode
        ? `En caja: ${boxLabel}`
        : 'Caja: Sin caja';
    const itemLabel = item.itemCode || `ID ${item.itemId}`;
    const branchLabel = session?.branchName || 'Sucursal no capturada';
    const itemMetaLine = `${itemLabel} - ${branchLabel}`;
    const compactMetaLine = `${itemMetaLine} - Caja: ${boxLabel}`;
    const primaryAction = getPrimaryAction(item, packageLink);

    return (
      <AppCard
        variant="elevated"
        style={[styles.compactReservationCard, isPhone ? styles.mobileReservationCard : styles.desktopReservationCard]}
      >
        <View style={[styles.holdRow, !isPhone && styles.holdRowDesktop]}>
          <View style={styles.holdIdentityColumn}>
            <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
              Apartado #{item.id} - {channelLabel}
            </AppText>
            <AppText
              bold
              numberOfLines={1}
              color={party.needsCustomer ? theme.colors.accent : theme.colors.text}
              style={styles.holdPartyName}
            >
              {party.displayType} - {party.label}
            </AppText>
          </View>

          <View style={styles.holdMetaColumn}>
            <AppText
              variant="caption"
              color={party.needsCustomer ? theme.colors.accent : theme.colors.mutedText}
              numberOfLines={1}
            >
              {followUpLabel}
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={2}>
              {compactMetaLine}
            </AppText>
          </View>

          <View style={[styles.holdAmountActions, isPhone && styles.holdAmountActionsMobile]}>
            <View style={styles.holdAmountBlock}>
              <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
                Pago en detalle
              </AppText>
              <AppText color={theme.colors.accent} bold numberOfLines={1}>
                {formatMoney(item.price)}
              </AppText>
            </View>
            <View style={[styles.compactActions, isPhone && styles.mobileCompactActions]}>
              {primaryAction.kind !== 'detail' ? renderPrimaryAction(item) : null}
              <AppButton
                title="Detalle"
                variant="secondary"
                onPress={() => openReservationDetail(item)}
                style={styles.detailActionButton}
              />
              <AppButton
                title="Mas"
                variant="secondary"
                onPress={() => openActionsModal(item)}
                style={styles.moreActionButton}
              />
              {isPhone ? (
                <AppButton
                  title={isExpanded ? 'Ocultar' : 'Info'}
                  variant="ghost"
                  onPress={() => toggleExpandedReservation(item.id)}
                  style={styles.expandButton}
                />
              ) : null}
            </View>
          </View>
        </View>

        {isPhone && isExpanded ? (
          <View style={styles.expandedDetails}>
            <InfoPill label="Responsable" value={item.sellerUserName || 'No capturado'} />
            <InfoPill label="Fecha" value={formatDateTime(item.createdAt)} />
            <InfoPill label="Live / canal" value={channelLabel} />
            <InfoPill label="Prenda" value={itemLabel} />
            {packageLink ? <InfoPill label="Paquete" value={packageLink.folio} /> : null}
            <InfoPill
              label="Pagos"
              value="Abono y saldo se revisan en detalle para evitar llamadas N+1."
            />
          </View>
        ) : null}
      </AppCard>
    );
  };

  const renderActionsModal = () => {
    if (!actionsReservation) return null;

    const item = actionsReservation;
    const canViewPayments = hasPermission(session, 'VIEW_PAYMENTS');
    const canRegisterPayments = hasPermission(session, 'REGISTER_PAYMENTS');
    const canCancelReservation = hasPermission(session, 'CANCEL_RESERVATION');
    const packageLink = reservationPackageMap[item.id];
    const packageDisabledReason = getPackageDisabledReason(item, session, packageLink);
    const assignBoxDisabledReason = getAssignBoxDisabledReason(item);
    const isCreatingPackage = workingReservationId === item.id && workingAction === 'createPackage';
    const needsCustomerFollowUp = hasInterestedAlias(item);

    return (
      <AppBottomModal
        visible={Boolean(actionsReservation)}
        title={`Apartado #${item.id}`}
        onClose={closeActionsModal}
      >
        <AppCard variant="subtle" style={styles.actionModalSummary}>
          <AppText bold numberOfLines={1}>
            {getReservationCustomerLabel(item)}
          </AppText>
          <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
            {item.itemCode || `Prenda #${item.itemId}`} - {item.boxCode || 'Sin caja'} - {formatMoney(item.price)}
          </AppText>
        </AppCard>

        <View style={styles.modalActionsStack}>
          <AppButton
            title="Ver detalle"
            variant="secondary"
            onPress={() => closeActionsAndRun(openReservationDetail)}
          />
          {packageLink ? (
            <AppButton
              title={`Ver paquete ${packageLink.folio}`}
              variant="operation"
              onPress={() => {
                setActionsReservation(null);
                openPackageDetail(packageLink);
              }}
            />
          ) : null}
          {needsCustomerFollowUp ? (
            <>
              <AppButton
                title="Vincular alias a cliente existente"
                variant="warning"
                onPress={() => closeActionsAndRun(openLinkCustomerModal)}
                disabled={Boolean(workingReservationId)}
                disabledReason="Ya hay una accion en proceso."
              />
              <AppButton
                title="Convertir alias en cliente formal"
                variant="neutral"
                disabled
                disabledReason="Pendiente: crear cliente con decision explicita del usuario, sin clientes fake."
              />
              <AppButton
                title="Editar alias"
                variant="neutral"
                disabled
                disabledReason="Pendiente: requiere endpoint auditado para modificar el alias del interesado."
              />
            </>
          ) : null}
          <AppButton
            title={item.boxId ? 'Cambiar caja' : 'Asignar caja'}
            variant={item.boxId ? 'neutral' : 'operation'}
            onPress={() =>
              item.boxId ? closeActionsAndRun(openReservationDetail) : closeActionsAndRun(openBoxModal)
            }
            disabled={Boolean(assignBoxDisabledReason)}
            disabledReason={assignBoxDisabledReason || undefined}
          />
          <AppButton
            title="Crear paquete"
            variant="operation"
            onPress={() => closeActionsAndRun(openPackageModal)}
            loading={isCreatingPackage}
            disabled={Boolean(packageDisabledReason) || Boolean(workingReservationId)}
            disabledReason={packageDisabledReason || 'Ya hay una accion en proceso.'}
          />
          <AppButton
            title="Agregar a paquete"
            variant="neutral"
            onPress={() => closeActionsAndRun(openPackageModal)}
            loading={isCreatingPackage}
            disabled={Boolean(packageDisabledReason) || Boolean(workingReservationId)}
            disabledReason={
              packageDisabledReason ||
              'Selecciona un paquete activo del mismo cliente o crea uno nuevo.'
            }
          />
          <AppButton
            title="Ver pagos"
            variant="secondary"
            onPress={() => closeActionsAndRun(openReservationDetail)}
            disabled={!canViewPayments}
            disabledReason="Tu usuario no tiene permiso para ver pagos."
          />
          <AppButton
            title="Registrar abono"
            variant="secondary"
            onPress={() => closeActionsAndRun(openPaymentFlow)}
            disabled={!canRegisterPayments || !isActiveReservation(item)}
            disabledReason={
              !canRegisterPayments
                ? 'Tu usuario no tiene permiso para registrar pagos.'
                : 'Solo se puede abonar sobre apartados activos.'
            }
          />
          <AppButton
            title="Venta inmediata LIVE"
            variant="neutral"
            disabled
            disabledReason="Usar solo si la venta se cierra directamente desde LIVE, sin continuar flujo de paquete/envio."
          />
          <AppButton
            title="Liberar envio"
            variant="neutral"
            disabled
            disabledReason="Pendiente: requiere resumen de paquete pagado y validacion backend de saldo completo."
          />
          <AppButton
            title="Marcar enviado"
            variant="neutral"
            disabled
            disabledReason="Pendiente: requiere paquete liberado y datos de envio."
          />
          <AppButton
            title="Cancelar apartado"
            variant="danger"
            onPress={() => closeActionsAndRun(openReservationDetail)}
            disabled={!canCancelReservation || !isActiveReservation(item)}
            disabledReason={
              !canCancelReservation
                ? 'Tu usuario no tiene permiso para cancelar apartados.'
                : 'Solo se puede cancelar desde apartados activos.'
            }
          />
        </View>
      </AppBottomModal>
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
      title="Apartados y reservas"
      subtitle="Gestión operativa de apartados y envíos"
      metadata={sessionScopeLabel}
      contextTitle="Apartados y reservas"
      contextSubtitle="Gestión operativa de apartados y envíos"
      contextMetadata={sessionScopeLabel}
      activeRoute="reservations"
      session={session}
      navSections={navSections}
      compactHeader
      rightContent={
        <View style={styles.headerActions}>
          {isLiveContext ? (
            <AppButton
              title="Volver al live"
              variant="secondary"
              onPress={() => router.replace('/live' as any)}
              style={styles.headerSecondaryButton}
            />
          ) : null}
          <AppButton
            title="Nuevo apartado"
            variant="operation"
            onPress={() => router.push('/door-reservation' as any)}
            style={styles.headerSecondaryButton}
          />
          <AppButton
            title={isRefreshing ? 'Actualizando...' : 'Actualizar'}
            variant="secondary"
            onPress={handleManualRefresh}
            loading={isRefreshing}
            disabled={isRefreshing}
            style={styles.refreshButton}
          />
        </View>
      }
    >
      <View style={styles.metricsStrip}>
        {renderCompactMetric('Activas', metrics.active)}
        {renderCompactMetric('Interesados', metrics.interested)}
        {renderCompactMetric('Clientes', metrics.customers)}
        {renderCompactMetric('Sin caja', metrics.withoutBox)}
        {renderCompactMetric('Con caja', metrics.withBox)}
        {renderCompactMetric('En paquete', metrics.inPackage)}
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
        placeholder="Buscar por cliente, interesado, prenda, caja o canal"
        value={search}
        onChangeText={handleSearchChange}
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
        data={visibleReservations}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderReservation}
        refreshing={isRefreshing}
        onRefresh={handleManualRefresh}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={
          filtered.length > 0 ? (
            <View style={styles.listFooter}>
              <AppText variant="caption" color={theme.colors.mutedText} bold>
                Mostrando {visibleCount} de {filtered.length} apartados
              </AppText>
              {canLoadMore ? (
                <AppButton
                  title="Cargar mas"
                  variant="secondary"
                  onPress={() => setVisibleLimit((current) => current + RESERVATION_PAGE_SIZE)}
                  style={styles.loadMoreButton}
                />
              ) : null}
            </View>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            title={
              filter === 'WITHOUT_BOX'
                ? 'No hay apartados activos sin caja'
                : filter === 'WITH_BOX'
                  ? 'No hay apartados activos con caja'
                  : filter === 'INTERESTED'
                    ? 'No hay apartados con interesado'
                    : filter === 'CUSTOMERS'
                      ? 'No hay apartados con cliente formal'
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
              {getReservationCustomerLabel(selectedReservation)}
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

      <AppBottomModal
        visible={Boolean(linkCustomerReservation)}
        title="Vincular cliente"
        onClose={closeLinkCustomerModal}
        scroll={false}
        footer={
          <View style={styles.modalFooterActions}>
            <AppButton
              title="Cancelar"
              variant="cancel"
              onPress={closeLinkCustomerModal}
              disabled={isLinkingCustomer}
              style={styles.modalFooterButton}
            />
            <AppButton
              title="Vincular cliente"
              variant="warning"
              onPress={handleLinkCustomer}
              loading={isLinkingCustomer}
              disabled={!selectedLinkCustomer || isLinkingCustomer}
              disabledReason="Selecciona un cliente real para vincular el apartado."
              style={styles.modalFooterButton}
            />
          </View>
        }
      >
        <View style={styles.linkCustomerModalContent}>
          <AppCard variant="subtle" style={styles.actionModalSummary}>
            <AppText variant="caption" color={theme.colors.mutedText}>
              Interesado actual
            </AppText>
            <AppText bold numberOfLines={1}>
              {linkCustomerReservation?.interestedAlias || 'Sin alias'}
            </AppText>
          </AppCard>

          <AppInput
            label="Buscar cliente existente"
            placeholder="Nombre, telefono o correo"
            value={linkCustomerSearch}
            onChangeText={(value) => {
              setLinkCustomerSearch(value);
              setSelectedLinkCustomer(null);
            }}
          />

          <FlatList
            data={filteredLinkCustomers}
            style={styles.modalList}
            keyboardShouldPersistTaps="handled"
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => {
              const selected = selectedLinkCustomer?.id === item.id;

              return (
                <AppOptionRow
                  title={item.name}
                  subtitle={item.phone || 'Sin telefono'}
                  onPress={() => setSelectedLinkCustomer(item)}
                >
                  {selected ? (
                    <AppText variant="caption" color={theme.colors.accent} bold>
                      Seleccionado para vincular
                    </AppText>
                  ) : null}
                </AppOptionRow>
              );
            }}
            ListEmptyComponent={
              <AppText color={theme.colors.mutedText}>
                No se encontraron clientes.
              </AppText>
            }
          />

          <AppText variant="caption" color={theme.colors.mutedText}>
            {selectedLinkCustomer
              ? `Cliente seleccionado: ${selectedLinkCustomer.name}`
              : 'El alias no se crea como cliente automaticamente; selecciona un cliente formal existente.'}
          </AppText>
        </View>
      </AppBottomModal>

      <AppBottomModal
        visible={Boolean(packageReservation)}
        title="Crear paquete"
        onClose={closePackageModal}
        maxHeight="90%"
        footer={
          <View style={styles.modalFooterActions}>
            <AppButton
              title="Cancelar"
              variant="cancel"
              onPress={closePackageModal}
              disabled={workingAction === 'createPackage'}
              style={styles.modalFooterButton}
            />
            <AppButton
              title={selectedExistingPackageId ? 'Agregar al paquete' : 'Crear paquete'}
              variant="operation"
              onPress={handleCreatePackage}
              loading={workingAction === 'createPackage'}
              disabled={
                (selectedPackageReservations.length === 0 && selectedPackageItems.length === 0) ||
                isLoadingPackageCandidates ||
                workingAction === 'createPackage'
              }
              disabledReason={
                selectedPackageReservations.length === 0 && selectedPackageItems.length === 0
                  ? 'Selecciona al menos un apartado o una prenda libre.'
                  : 'Ya hay una accion en proceso.'
              }
              style={styles.modalFooterButton}
            />
          </View>
        }
      >
        {packageReservation ? (
          <View style={styles.packageModalContent}>
            <AppCard variant="subtle" style={styles.actionModalSummary}>
              <AppText variant="caption" color={theme.colors.mutedText}>
                Cliente
              </AppText>
              <AppText bold numberOfLines={1}>
                {packageReservation.customerName || `Cliente #${packageReservation.customerId}`}
              </AppText>
              <AppText variant="caption" color={theme.colors.mutedText}>
                Selecciona apartados activos, prendas libres o un paquete abierto del mismo cliente. Los interesados sin cliente formal no aparecen aqui.
              </AppText>
            </AppCard>

            {isLoadingPackageCandidates ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator />
                <AppText style={styles.loadingText}>Buscando apartados disponibles...</AppText>
              </View>
            ) : (
              <>
                <View style={styles.packageSummaryRow}>
                  <InfoPill
                    label="Prendas seleccionadas"
                    value={String(selectedPackageReservations.length + selectedPackageItems.length)}
                  />
                  <InfoPill label="Subtotal" value={formatMoney(packageSubtotal)} />
                  <InfoPill
                    label="Destino"
                    value={selectedExistingPackageId ? 'Paquete activo' : 'Paquete nuevo'}
                    tone="warning"
                  />
                </View>

                {packageActivePackages.length > 0 ? (
                  <View style={styles.packageSection}>
                    <AppText variant="caption" color={theme.colors.mutedText} bold>
                      Paquetes activos
                    </AppText>
                    <AppOptionRow
                      title={`${selectedExistingPackageId ? '( )' : '(x)'} Crear paquete nuevo`}
                      subtitle="Abre un paquete nuevo para la seleccion actual."
                      onPress={() => setSelectedExistingPackageId(null)}
                    />
                    {packageActivePackages.map((customerPackage) => {
                      const selected = selectedExistingPackageId === customerPackage.id;

                      return (
                        <AppOptionRow
                          key={customerPackage.id}
                          title={`${selected ? '(x)' : '( )'} ${customerPackage.folio}`}
                          subtitle={`${customerPackage.status} - ${customerPackage.totalItems || 0} prendas - Saldo ${formatMoney(customerPackage.pendingAmount)}`}
                          onPress={() => setSelectedExistingPackageId(customerPackage.id)}
                        />
                      );
                    })}
                  </View>
                ) : null}

                <View style={styles.packageSection}>
                  <AppText variant="caption" color={theme.colors.mutedText} bold>
                    Apartados disponibles
                  </AppText>
                {packageCandidates.length > 0 ? (
                  packageCandidates.map((reservation) => {
                    const selected = selectedPackageReservationIds.includes(reservation.id);

                    return (
                      <AppOptionRow
                        key={reservation.id}
                        title={`${selected ? '[x]' : '[ ]'} Apartado #${reservation.id} - ${
                          reservation.itemCode || `Prenda #${reservation.itemId}`
                        }`}
                        subtitle={`${formatMoney(reservation.price)} - ${
                          reservation.boxCode || 'Sin caja'
                        } - ${getLiveLabel(reservation) || getSalesChannelLabel(
                          reservation.salesChannelCode,
                          reservation.salesChannelName
                        ) || 'Canal no capturado'}`}
                        onPress={() => togglePackageReservationSelection(reservation.id)}
                      />
                    );
                  })
                ) : (
                  <AppText color={theme.colors.mutedText}>
                    No hay apartados disponibles para este cliente.
                  </AppText>
                )}
                </View>

                <View style={styles.packageSection}>
                  <AppText variant="caption" color={theme.colors.mutedText} bold>
                    Prendas libres
                  </AppText>
                  <AppInput
                    label="Buscar prenda libre"
                    placeholder="Codigo, QR, tipo, marca o talla"
                    value={packageItemSearch}
                    onChangeText={setPackageItemSearch}
                  />
                  {filteredPackageFreeItems.length > 0 ? (
                    filteredPackageFreeItems.map((item) => {
                      const selected = selectedPackageItemIds.includes(item.id);

                      return (
                        <AppOptionRow
                          key={item.id}
                          title={`${selected ? '[x]' : '[ ]'} ${item.code || `Prenda #${item.id}`}`}
                          subtitle={`${item.productTypeName || 'Sin tipo'} - ${formatMoney(item.price)} - Disponible`}
                          onPress={() => togglePackageItemSelection(item.id)}
                        />
                      );
                    })
                  ) : (
                    <AppText color={theme.colors.mutedText}>
                      No hay prendas libres disponibles para esta busqueda.
                    </AppText>
                  )}
                </View>
              </>
            )}
          </View>
        ) : null}
      </AppBottomModal>

      {renderActionsModal()}
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
  actionModalSummary: {
    marginBottom: 10,
  },
  channelField: {
    flexBasis: 150,
  },
  compactActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexGrow: 0,
    flexShrink: 1,
    gap: 8,
    justifyContent: 'flex-end',
    minWidth: 0,
  },
  compactBadge: {
    maxWidth: 160,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  compactBody: {
    gap: 10,
  },
  compactBodyDesktop: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'nowrap',
  },
  compactCardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  compactCardHeaderDesktop: {
    alignItems: 'center',
    marginBottom: 6,
  },
  compactField: {
    flexBasis: 96,
    flexGrow: 1,
    minWidth: 0,
  },
  compactReservationCard: {
    marginBottom: 0,
  },
  detailActionButton: {
    minHeight: 30,
    minWidth: 70,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  compactTitleLine: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  compactMetaLine: {
    marginTop: 5,
  },
  customerText: {
    flexShrink: 1,
  },
  desktopReservationCard: {
    paddingBottom: 12,
    paddingTop: 12,
  },
  expandButton: {
    minWidth: 86,
    paddingHorizontal: 10,
  },
  expandedDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  folioText: {
    flexShrink: 1,
  },
  itemField: {
    flexBasis: 110,
  },
  kpiPill: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 32,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  listFooter: {
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
    paddingTop: 10,
  },
  loadMoreButton: {
    minWidth: 150,
  },
  mobileCompactActions: {
    alignItems: 'stretch',
    flexBasis: 'auto',
    flexDirection: 'row',
    flexGrow: 1,
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  mobileReservationCard: {
    paddingBottom: 12,
    paddingTop: 12,
  },
  modalActionsStack: {
    gap: 8,
  },
  modalFooterActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalFooterButton: {
    flex: 1,
    minWidth: 150,
  },
  modalList: {
    maxHeight: 260,
  },
  modalLoading: {
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 18,
  },
  moreActionButton: {
    minHeight: 30,
    minWidth: 64,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  partyLine: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 0,
    marginTop: 4,
    maxWidth: '100%',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  primaryActionButton: {
    minHeight: 30,
    minWidth: 118,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  reservationIdentity: {
    flex: 1,
    minWidth: 0,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-end',
  },
  headerSecondaryButton: {
    minHeight: 32,
    minWidth: 108,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  holdAmountActions: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1.2,
    gap: 8,
    justifyContent: 'flex-end',
    minWidth: 220,
  },
  holdAmountActionsMobile: {
    alignItems: 'stretch',
    flexDirection: 'column',
    minWidth: 0,
    width: '100%',
  },
  holdAmountBlock: {
    alignItems: 'flex-end',
    gap: 2,
    minWidth: 100,
  },
  holdIdentityColumn: {
    flex: 1.15,
    gap: 3,
    minWidth: 170,
  },
  holdMetaColumn: {
    flex: 1,
    gap: 3,
    minWidth: 140,
  },
  holdPartyName: {
    flex: 1,
    minWidth: 120,
  },
  holdRow: {
    flex: 1,
    gap: 8,
    minWidth: 0,
  },
  holdRowDesktop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  filterButton: {
    minWidth: 96,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  infoPill: {
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: 150,
    flexGrow: 1,
    gap: 2,
    padding: 8,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 8,
    paddingBottom: 24,
  },
  linkCustomerModalContent: {
    gap: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  metricsStrip: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  packageModalContent: {
    gap: 10,
  },
  packageSummaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  packageSection: {
    gap: 8,
    marginTop: 12,
  },
  refreshButton: {
    minHeight: 32,
    minWidth: 118,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  retryButton: {
    marginTop: 12,
  },
  savingText: {
    marginTop: 12,
  },
});
