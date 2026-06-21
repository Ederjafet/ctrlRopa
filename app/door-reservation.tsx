import AppShellPage from '@/components/layout/AppShellPage';
import QRScannerModal from '@/components/qr/QRScannerModal';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppOptionRow from '@/components/ui/AppOptionRow';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';

import { getActionableApiError } from '@/services/apiError';
import { getPaymentMethods, PaymentMethod } from '@/services/catalogService';
import { Customer, getCustomersByBranch } from '@/services/customerService';
import { getItemsByBranch, Item } from '@/services/itemService';
import { createPayment } from '@/services/paymentService';
import { consumePendingQuickItems } from '@/services/pendingQuickItems';
import {
  createReservation,
  Reservation,
} from '@/services/reservationService';
import { validateRouteAccess } from '@/services/routeGuard';
import { getSession } from '@/services/sessionStorage';

import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

type CartLine = {
  item: Item;
  priceText: string;
};

type ReservationValidationIssue =
  | 'CUSTOMER'
  | 'ITEM'
  | 'PRICE'
  | 'ADVANCE'
  | 'PAYMENT'
  | null;

export default function DoorReservationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ customerId?: string | string[] }>();
  const { theme } = useAppTheme();
  const { t } = useTranslation('common');
  const preselectedCustomerId = params.customerId
    ? Number(Array.isArray(params.customerId) ? params.customerId[0] : params.customerId)
    : null;

  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [items, setItems] = useState<Item[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod | null>(null);

  const [cart, setCart] = useState<CartLine[]>([]);
  const [advanceText, setAdvanceText] = useState('');

  const [scanInput, setScanInput] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  const [isCustomerModalVisible, setIsCustomerModalVisible] = useState(false);
  const [isItemModalVisible, setIsItemModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [validationIssue, setValidationIssue] =
    useState<ReservationValidationIssue>(null);

  const showActionableError = (error: unknown) => {
    const copy = getActionableApiError(error, t);
    Alert.alert(copy.title, copy.message, [{ text: copy.primaryActionLabel }]);
  };

  useFocusEffect(
    useCallback(() => {
      checkAccessAndLoad();
    }, [preselectedCustomerId])
  );

  const checkAccessAndLoad = async () => {
    try {
      const allowed = await validateRouteAccess(
        'DOOR_RESERVATION',
        'DO_DOOR_RESERVATION'
      );

      if (!allowed) {
        router.replace('/access-denied');
        return;
      }

      setIsAllowed(true);
      await loadData();
    } catch (err: any) {
      showActionableError(err);
      setIsLoading(false);
    }
  };

  const loadData = async () => {
    const session = await getSession();
    if (!session) return;

    try {
      setIsLoading(true);

      const [itemResult, customerResult, paymentResult] = await Promise.allSettled([
        getItemsByBranch(session.branchId),
        getCustomersByBranch(session.branchId),
        getPaymentMethods(session.branchId),
      ]);

      const itemData = itemResult.status === 'fulfilled' ? itemResult.value : [];
      const customerData =
        customerResult.status === 'fulfilled' ? customerResult.value : [];
      const paymentData = paymentResult.status === 'fulfilled' ? paymentResult.value : [];

      const availableItems = itemData.filter((item) => item.status === 'AVAILABLE');

      setItems(availableItems);
      const selectableCustomers = customerData.filter(
        (customer) =>
          customer.status !== 'INACTIVE' &&
          customer.isGeneric !== true &&
          !customer.genericType
      );

      setCustomers(selectableCustomers);
      if (
        preselectedCustomerId &&
        Number.isFinite(preselectedCustomerId) &&
        selectedCustomer?.id !== preselectedCustomerId
      ) {
        const matchedCustomer = selectableCustomers.find(
          (customer) => customer.id === preselectedCustomerId
        );
        if (matchedCustomer) {
          setSelectedCustomer(matchedCustomer);
        }
      }
      setPaymentMethods(paymentData);
      await addPendingQuickItemsToCart(availableItems);

      const errorCopies = [itemResult, customerResult, paymentResult]
        .filter((result) => result.status === 'rejected')
        .map((result) =>
          result.status === 'rejected'
            ? getActionableApiError(result.reason, t)
            : null
        )
        .filter(
          (copy): copy is ReturnType<typeof getActionableApiError> => Boolean(copy)
        );

      if (errorCopies.length > 0) {
        const [copy] = errorCopies;
        const messages = errorCopies.map((entry) => entry?.message ?? '');
        Alert.alert(copy?.title ?? t('errors.unknown.title'), Array.from(new Set(messages)).join('\n'), [
          { text: copy.primaryActionLabel },
        ]);
      }
    } catch (e: any) {
      showActionableError(e);
    } finally {
      setIsLoading(false);
    }
  };

  const getDoorReservationChannelId = async () => {
    const session = await getSession();

    const channel = session?.channels?.find(
      (c) => c.code === 'DOOR_RESERVATION' && c.enabled === true
    );

    if (!channel) {
      throw new Error('El canal Apartado puerta no está habilitado.');
    }

    return channel.id;
  };

  const addItemToCart = (item: Item) => {
    const exists = cart.some((line) => line.item.id === item.id);

    if (exists) {
      Alert.alert('Apartado', 'La prenda ya está agregada.');
      return;
    }

    setCart((prev) => [
      ...prev,
      {
        item,
        priceText:
          item.price !== null && item.price !== undefined
            ? String(item.price)
            : '',
      },
    ]);

    setIsItemModalVisible(false);
    setItemSearch('');
  };

  const addPendingQuickItemsToCart = async (availableItems: Item[]) => {
    const pendingItemIds = await consumePendingQuickItems('door-reservation');
    if (pendingItemIds.length === 0) return;

    const createdItems = pendingItemIds
      .map((itemId) => availableItems.find((item) => item.id === itemId))
      .filter((item): item is Item => !!item);

    if (createdItems.length === 0) {
      Alert.alert(
        'Alta rapida',
        'Se crearon prendas, pero no se encontraron disponibles para agregar al apartado.'
      );
      return;
    }

    setCart((prev) => {
      const existingIds = new Set(prev.map((line) => line.item.id));
      const newLines = createdItems
        .filter((item) => !existingIds.has(item.id))
        .map((item) => ({
          item,
          priceText:
            item.price !== null && item.price !== undefined
              ? String(item.price)
              : '',
        }));

      return [...prev, ...newLines];
    });
    Alert.alert(
      'Alta rapida',
      createdItems.length === 1
        ? 'Prenda agregada al apartado.'
        : `${createdItems.length} prendas agregadas al apartado.`
    );
  };

  const addItemByCode = (code: string) => {
    const cleanCode = code.trim();

    if (!cleanCode) return;

    const item = items.find(
      (i) => i.code === cleanCode || i.qrCode === cleanCode
    );

    if (!item) {
      Alert.alert(
        'Escaneo',
        'No se encontró una prenda disponible con ese código.'
      );
      setScanInput('');
      return;
    }

    addItemToCart(item);
    setScanInput('');
  };

  const handleCameraScanned = (value: string) => {
    setIsScannerVisible(false);
    addItemByCode(value);
  };

  const removeItemFromCart = (itemId: number) => {
    setCart((prev) => prev.filter((line) => line.item.id !== itemId));
  };

  const updateLinePrice = (itemId: number, value: string) => {
    setCart((prev) =>
      prev.map((line) =>
        line.item.id === itemId ? { ...line, priceText: value } : line
      )
    );
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsCustomerModalVisible(false);
    setCustomerSearch('');
  };

  const selectPaymentMethod = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    setIsPaymentModalVisible(false);
  };

  const getFilteredCustomers = () => {
    const text = customerSearch.toLowerCase().trim();

    if (!text) return customers.slice(0, 20);

    return customers
      .filter((customer) =>
        `${customer.name ?? ''} ${customer.phone ?? ''} ${customer.email ?? ''}`
          .toLowerCase()
          .includes(text)
      )
      .slice(0, 20);
  };

  const getFilteredItems = () => {
    const text = itemSearch.toLowerCase().trim();
    const selectedIds = cart.map((line) => line.item.id);

    return items
      .filter((item) => !selectedIds.includes(item.id))
      .filter((item) =>
        `${item.code ?? ''} ${item.qrCode ?? ''} ${item.productTypeName ?? ''} ${
          item.brandName ?? ''
        } ${item.sizeName ?? ''}`
          .toLowerCase()
          .includes(text)
      )
      .slice(0, 30);
  };

  const getTotal = () => {
    return cart.reduce((sum, line) => {
      const price = Number(line.priceText);
      return sum + (Number.isFinite(price) ? price : 0);
    }, 0);
  };

  const getAdvance = () => {
    const value = Number(advanceText || '0');
    return Number.isFinite(value) ? value : 0;
  };

  const formatMoney = (value: number) => `$${value.toFixed(2)}`;

  const validateBeforeSave = () => {
    if (!selectedCustomer) {
      setValidationIssue('CUSTOMER');
      return false;
    }

    if (cart.length === 0) {
      setValidationIssue('ITEM');
      return false;
    }

    for (const line of cart) {
      const price = Number(line.priceText);

      if (!line.priceText.trim() || Number.isNaN(price) || price <= 0) {
        setValidationIssue('PRICE');
        return false;
      }
    }

    const total = getTotal();
    const advance = getAdvance();

    if (advance < 0 || Number.isNaN(advance)) {
      setValidationIssue('ADVANCE');
      return false;
    }

    if (advance > total) {
      setValidationIssue('ADVANCE');
      return false;
    }

    if (advance > 0 && !selectedPaymentMethod) {
      setValidationIssue('PAYMENT');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateBeforeSave()) return;

    const session = await getSession();

    if (!session || !selectedCustomer) {
      Alert.alert('Sesión', 'No se encontró sesión activa.');
      return;
    }

    try {
      setIsSaving(true);

      const salesChannelId = await getDoorReservationChannelId();
      const advance = getAdvance();
      let remainingAdvance = advance;
      const createdReservations: {
        reservation: Reservation;
        price: number;
      }[] = [];

      for (const line of cart) {
        const price = Number(line.priceText);

        const reservation = await createReservation({
          itemId: line.item.id,
          customerId: selectedCustomer.id,
          branchId: session.branchId,
          salesChannelId,
          price,
          createdByUserId: session.userId,
        });

        createdReservations.push({ reservation, price });
      }

      for (const { reservation, price } of createdReservations) {
        if (remainingAdvance > 0 && selectedPaymentMethod) {
          const amountForThisReservation = Math.min(price, remainingAdvance);

          await createPayment({
            reservationId: reservation.id,
            amount: amountForThisReservation,
            paymentMethodId: selectedPaymentMethod.id,
            createdByUserId: session.userId,
          });

          remainingAdvance -= amountForThisReservation;
        }
      }

      Alert.alert(
        'Apartado puerta',
        advance > 0
          ? 'Apartado creado con anticipo correctamente.'
          : 'Apartado creado correctamente.'
      );

      setCart([]);
      setSelectedCustomer(null);
      setSelectedPaymentMethod(null);
      setAdvanceText('');
      setScanInput('');
      setItemSearch('');
      setCustomerSearch('');

      await loadData();
    } catch (e: any) {
      showActionableError(e);
    } finally {
      setIsSaving(false);
    }
  };

  if (isAllowed === null || isLoading) {
    return (
      <AppShellPage
        title={t('navigation.items.doorHold')}
        subtitle={t('operationalScreens.doorReservation.subtitle')}
        activeRoute="door-reservation"
        compactHeader
      >
        <ActivityIndicator />
      </AppShellPage>
    );
  }

  return (
    <>
      <AppShellPage
        title={t('navigation.items.doorHold')}
        subtitle={t('operationalScreens.doorReservation.subtitle')}
        activeRoute="door-reservation"
        compactHeader
      >

      <AppCard style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionText}>
            <AppText variant="subtitle" bold>
              {t('operationalScreens.shared.customer')}
            </AppText>
            <AppText color={theme.colors.mutedText} numberOfLines={1}>
              {selectedCustomer
                ? selectedCustomer.name
                : t('operationalScreens.doorReservation.selectRealCustomer')}
            </AppText>
          </View>

          <AppButton
            title={
              selectedCustomer
                ? t('operationalScreens.shared.changeCustomer')
                : t('operationalScreens.shared.selectCustomer')
            }
            variant="operation"
            onPress={() => setIsCustomerModalVisible(true)}
            style={styles.compactButton}
          />
        </View>
      </AppCard>

      <AppCard style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionText}>
            <AppText variant="subtitle" bold>
              {t('operationalScreens.shared.addItem')}
            </AppText>
            <AppText color={theme.colors.mutedText}>
              {t('operationalScreens.doorReservation.addItemHelp')}
            </AppText>
          </View>
        </View>

        <View style={styles.scanRow}>
          <View style={styles.scanInput}>
            <AppInput
              placeholder={t('operationalScreens.shared.scanOrCodePlaceholder')}
              value={scanInput}
              onChangeText={setScanInput}
              onSubmitEditing={() => addItemByCode(scanInput)}
            />
          </View>
          <AppButton
            title={t('operationalScreens.shared.addByCode')}
            variant="operation"
            onPress={() => addItemByCode(scanInput)}
            style={styles.compactButton}
          />
        </View>

        <View style={styles.inlineActions}>
          <AppButton
            title={t('operationalScreens.shared.searchItem')}
            variant="secondary"
            onPress={() => setIsItemModalVisible(true)}
            style={styles.compactButton}
          />
          <AppButton
            title={t('operationalScreens.shared.scanWithCamera')}
            variant="secondary"
            onPress={() => setIsScannerVisible(true)}
            style={styles.compactButton}
          />
        </View>
      </AppCard>

      <AppCard style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionText}>
            <AppText variant="subtitle" bold>
              {t('operationalScreens.shared.items')}
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {cart.length === 0
                ? t('operationalScreens.shared.noItemsAdded')
                : `${cart.length} prenda${cart.length === 1 ? '' : 's'} en apartado`}
            </AppText>
          </View>

          <View style={styles.inlineActions}>
            <AppButton
              title={t('operationalScreens.shared.addItem')}
              variant="secondary"
              onPress={() => setIsItemModalVisible(true)}
              style={styles.compactButton}
            />
            <AppButton
              title={t('operationalScreens.doorReservation.quickItem')}
              variant="secondary"
              onPress={() => {
                const returnPath = selectedCustomer
                  ? `/door-reservation?customerId=${selectedCustomer.id}`
                  : '/door-reservation';
                router.push(`/items-create?returnTo=${encodeURIComponent(returnPath)}` as any);
              }}
              style={styles.compactButton}
            />
          </View>
        </View>

        {cart.length === 0 ? (
          <AppText color={theme.colors.mutedText}>
            No hay prendas agregadas. Escanea o busca una prenda para continuar.
          </AppText>
        ) : (
          cart.map((line) => (
            <View
              key={line.item.id}
              style={[
                styles.cartLine,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.cartLineMain}>
                <AppText bold numberOfLines={1}>{line.item.code}</AppText>
                <AppText color={theme.colors.mutedText} numberOfLines={1}>
                  {line.item.productTypeName || t('operationalScreens.shared.noType')} ·{' '}
                  {line.item.brandName || t('operationalScreens.shared.noBrand')} ·{' '}
                  {line.item.sizeName || t('operationalScreens.shared.noSize')}
                </AppText>
              </View>

              <View style={styles.cartLineActions}>
                <View style={styles.priceInputWrap}>
                  <AppInput
                    label={t('operationalScreens.doorReservation.holdPrice')}
                    value={line.priceText}
                    onChangeText={(value) => updateLinePrice(line.item.id, value)}
                    keyboardType="numeric"
                    placeholder={t('operationalScreens.doorReservation.pricePlaceholder')}
                  />
                </View>

                <AppButton
                  title={t('operationalScreens.shared.remove')}
                  variant="danger"
                  onPress={() => removeItemFromCart(line.item.id)}
                  style={styles.compactButton}
                />
              </View>
            </View>
          ))
        )}
      </AppCard>

      <AppCard style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionText}>
            <AppText variant="subtitle" bold>
              {t('operationalScreens.doorReservation.advance')}
            </AppText>
            <AppText color={theme.colors.mutedText}>
              {getAdvance() > 0
                ? `${t('operationalScreens.shared.paymentMethod')}: ${
                    selectedPaymentMethod
                      ? selectedPaymentMethod.name
                      : t('operationalScreens.shared.noSelection')
                  }`
                : t('operationalScreens.doorReservation.advanceHelp')}
            </AppText>
          </View>

          {getAdvance() > 0 ? (
            <AppButton
              title={t('operationalScreens.shared.selectPaymentMethod')}
              variant="operation"
              onPress={() => setIsPaymentModalVisible(true)}
              style={styles.compactButton}
            />
          ) : null}
        </View>

        <View style={styles.scanRow}>
          <View style={styles.scanInput}>
            <AppInput
              label={t('operationalScreens.doorReservation.optionalAdvance')}
              value={advanceText}
              onChangeText={setAdvanceText}
              keyboardType="numeric"
              placeholder={t('operationalScreens.doorReservation.advancePlaceholder')}
            />
          </View>
        </View>

        <View style={styles.totalRow}>
          <AppText bold>{t('operationalScreens.doorReservation.holdTotal')}</AppText>
          <AppText bold>{formatMoney(getTotal())}</AppText>
        </View>

        <View style={styles.totalRow}>
          <AppText bold>{t('operationalScreens.doorReservation.pendingBalance')}</AppText>
          <AppText bold>
            {formatMoney(Math.max(getTotal() - getAdvance(), 0))}
          </AppText>
        </View>
      </AppCard>

      <View style={styles.footerActions}>
        <AppButton
          title={t('operationalScreens.doorReservation.createHold')}
          onPress={handleSave}
          loading={isSaving}
          disabled={isSaving}
          style={styles.footerPrimaryButton}
        />
      </View>
      </AppShellPage>

      <QRScannerModal
        visible={isScannerVisible}
        onClose={() => setIsScannerVisible(false)}
        onScanned={handleCameraScanned}
      />

      <AppBottomModal
        visible={isCustomerModalVisible}
        title={t('operationalScreens.shared.selectCustomer')}
        onClose={() => setIsCustomerModalVisible(false)}
        scroll={false}
      >
        <AppInput
          placeholder={t('operationalScreens.shared.searchCustomerPlaceholder')}
          value={customerSearch}
          onChangeText={setCustomerSearch}
        />

        <FlatList
          data={getFilteredCustomers()}
          style={styles.modalList}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <AppOptionRow
              title={item.name}
              subtitle={`${item.phone || t('operationalScreens.shared.noPhone')} · ${
                item.email || t('operationalScreens.shared.noEmail')
              }`}
              onPress={() => selectCustomer(item)}
            />
          )}
          ListEmptyComponent={<AppText>{t('operationalScreens.shared.noCustomers')}</AppText>}
        />
      </AppBottomModal>

      <AppBottomModal
        visible={isItemModalVisible}
        title={t('operationalScreens.shared.addItem')}
        onClose={() => setIsItemModalVisible(false)}
        scroll={false}
      >
        <AppInput
          placeholder={t('operationalScreens.shared.searchItemPlaceholder')}
          value={itemSearch}
          onChangeText={setItemSearch}
        />

        <FlatList
          data={getFilteredItems()}
          style={styles.modalList}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <AppOptionRow
              title={item.code}
              subtitle={`${item.productTypeName || t('operationalScreens.shared.noType')} · ${
                item.brandName || t('operationalScreens.shared.noBrand')
              } · ${item.sizeName || t('operationalScreens.shared.noSize')}`}
              onPress={() => addItemToCart(item)}
            >
              <AppText variant="caption" color={theme.colors.mutedText}>
                {t('operationalScreens.shared.suggestedPrice')}:{' '}
                {item.price !== null && item.price !== undefined
                  ? formatMoney(item.price)
                  : t('operationalScreens.shared.noPrice')}
              </AppText>
            </AppOptionRow>
          )}
          ListEmptyComponent={
            <AppText>{t('operationalScreens.shared.noItemsAvailable')}</AppText>
          }
        />
      </AppBottomModal>

      <AppBottomModal
        visible={isPaymentModalVisible}
        title={t('operationalScreens.shared.paymentMethod')}
        onClose={() => setIsPaymentModalVisible(false)}
      >
        {paymentMethods.map((method) => (
          <AppOptionRow
            key={method.id}
            title={method.name}
            onPress={() => selectPaymentMethod(method)}
          />
        ))}
      </AppBottomModal>

      <AppBottomModal
        visible={validationIssue !== null}
        title={t('operationalScreens.doorReservation.validationTitle')}
        onClose={() => setValidationIssue(null)}
        showCancelButton={false}
      >
        {validationIssue === 'CUSTOMER' ? (
          <AppText>{t('operationalScreens.doorReservation.validationCustomer')}</AppText>
        ) : null}
        {validationIssue === 'ITEM' ? (
          <AppText>{t('operationalScreens.doorReservation.validationItem')}</AppText>
        ) : null}
        {validationIssue === 'PRICE' ? (
          <AppText>{t('operationalScreens.doorReservation.validationPrice')}</AppText>
        ) : null}
        {validationIssue === 'ADVANCE' ? (
          <AppText>{t('operationalScreens.doorReservation.validationAdvance')}</AppText>
        ) : null}
        {validationIssue === 'PAYMENT' ? (
          <AppText>{t('operationalScreens.doorReservation.validationPayment')}</AppText>
        ) : null}

        <View style={styles.modalActions}>
          <View style={styles.modalAction}>
            <AppButton
              title={t('operationalScreens.shared.close')}
              variant="secondary"
              onPress={() => setValidationIssue(null)}
            />
          </View>
          <View style={styles.modalAction}>
            <AppButton
              title={
                validationIssue === 'CUSTOMER'
                  ? t('operationalScreens.doorReservation.chooseCustomer')
                  : validationIssue === 'ITEM'
                    ? t('operationalScreens.shared.addItem')
                    : validationIssue === 'PAYMENT'
                      ? t('operationalScreens.shared.choosePayment')
                      : t('operationalScreens.shared.review')
              }
              onPress={() => {
                const issue = validationIssue;
                setValidationIssue(null);
                if (issue === 'CUSTOMER') setIsCustomerModalVisible(true);
                if (issue === 'ITEM') setIsItemModalVisible(true);
                if (issue === 'PAYMENT') setIsPaymentModalVisible(true);
              }}
            />
          </View>
        </View>
      </AppBottomModal>
    </>
  );
}

const styles = StyleSheet.create({
  actionSpacing: {
    marginTop: 10,
  },
  cartLineActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
  },
  cartLineMain: {
    flex: 1,
    gap: 3,
    minWidth: 160,
  },
  compactButton: {
    minHeight: 30,
    minWidth: 74,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  footerActions: {
    alignItems: 'flex-end',
    marginTop: 2,
  },
  footerPrimaryButton: {
    minHeight: 34,
    minWidth: 210,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  inlineActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  modalAction: {
    flex: 1,
  },
  cartLine: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
    padding: 10,
  },
  modalList: {
    maxHeight: 420,
  },
  priceInputWrap: {
    minWidth: 126,
    width: 150,
  },
  scanInput: {
    flex: 1,
    minWidth: 210,
  },
  scanRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  sectionCard: {
    gap: 10,
  },
  sectionHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  sectionText: {
    flex: 1,
    gap: 3,
    minWidth: 180,
  },
  totalRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

