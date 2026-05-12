import QRScannerModal from '@/components/qr/QRScannerModal';
import AppBackButton from '@/components/ui/AppBackButton';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppOptionRow from '@/components/ui/AppOptionRow';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';

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

import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  View,
} from 'react-native';

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
  const { theme } = useAppTheme();

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

  useFocusEffect(
    useCallback(() => {
      checkAccessAndLoad();
    }, [])
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
      Alert.alert(
        'Apartado puerta',
        err?.message || 'No se pudo cargar apartado puerta.'
      );
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
      setCustomers(
        customerData.filter(
          (customer) =>
            customer.status !== 'INACTIVE' &&
            customer.isGeneric !== true &&
            !customer.genericType
        )
      );
      setPaymentMethods(paymentData);
      await addPendingQuickItemsToCart(availableItems);

      const errors = [itemResult, customerResult, paymentResult]
        .filter((result) => result.status === 'rejected')
        .map((result) =>
          result.status === 'rejected'
            ? result.reason?.message || 'No se pudo cargar un recurso.'
            : ''
        )
        .filter(Boolean);

      if (errors.length > 0) {
        Alert.alert('Apartado puerta', errors.join('\n'));
      }
    } catch (e: any) {
      Alert.alert('Apartado puerta', e.message || 'No se pudo cargar apartado puerta.');
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
      Alert.alert('Error', e.message || 'No se pudo crear el apartado.');
    } finally {
      setIsSaving(false);
    }
  };

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
        Crear apartado en puerta
      </AppText>

      <AppCard>
        <AppText variant="subtitle" bold>
          Cliente
        </AppText>

        <AppText>
          {selectedCustomer
            ? selectedCustomer.name
            : 'Selecciona un cliente real. No se permite cliente genérico.'}
        </AppText>

        <View style={styles.actionSpacing}>
          <AppButton
            title={selectedCustomer ? 'Cambiar cliente' : 'Seleccionar cliente'}
            variant="operation"
            onPress={() => setIsCustomerModalVisible(true)}
          />
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="subtitle" bold>
          Agregar prenda
        </AppText>
        <AppText color={theme.colors.mutedText}>
          Usa código, QR, búsqueda o alta rapida para agregar prendas al apartado.
        </AppText>

        <AppInput
          placeholder="Escanea o escribe código/QR"
          value={scanInput}
          onChangeText={setScanInput}
          onSubmitEditing={() => addItemByCode(scanInput)}
        />

        <AppButton
          title="Agregar por código"
          variant="operation"
          onPress={() => addItemByCode(scanInput)}
        />

        <View style={styles.actionSpacing}>
          <AppButton
            title="Buscar prenda"
            variant="operation"
            onPress={() => setIsItemModalVisible(true)}
          />
        </View>

        <View style={styles.actionSpacing}>
          <AppButton
            title="Escanear con cámara"
            variant="operation"
            onPress={() => setIsScannerVisible(true)}
          />
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="subtitle" bold>
          Prendas
        </AppText>

        {cart.length === 0 ? (
          <AppText color={theme.colors.mutedText}>No hay prendas agregadas.</AppText>
        ) : (
          cart.map((line) => (
            <View key={line.item.id} style={styles.cartLine}>
              <AppText bold>{line.item.code}</AppText>

              <AppText>
                {line.item.productTypeName || 'Sin tipo'} ·{' '}
                {line.item.brandName || 'Sin marca'} ·{' '}
                {line.item.sizeName || 'Sin talla'}
              </AppText>

              <AppInput
                label="Precio apartado *"
                value={line.priceText}
                onChangeText={(value) => updateLinePrice(line.item.id, value)}
                keyboardType="numeric"
                placeholder="Captura precio"
              />

              <AppButton
                title="Quitar"
                variant="danger"
                onPress={() => removeItemFromCart(line.item.id)}
              />
            </View>
          ))
        )}

        <AppButton
          title="Agregar prenda"
          variant="operation"
          onPress={() => setIsItemModalVisible(true)}
        />

        <View style={styles.actionSpacing}>
          <AppButton
            title="Alta rápida de prenda"
            variant="operation"
            onPress={() =>
              router.push('/items-create?returnTo=/door-reservation' as any)
            }
          />
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="subtitle" bold>
          Anticipo
        </AppText>

        <AppInput
          label="Anticipo opcional"
          value={advanceText}
          onChangeText={setAdvanceText}
          keyboardType="numeric"
          placeholder="0.00"
        />

        {getAdvance() > 0 ? (
          <>
            <AppText>
              Método:{' '}
              {selectedPaymentMethod
                ? selectedPaymentMethod.name
                : 'Sin seleccionar'}
            </AppText>

            <View style={styles.actionSpacing}>
              <AppButton
                title="Seleccionar método de pago"
                variant="operation"
                onPress={() => setIsPaymentModalVisible(true)}
              />
            </View>
          </>
        ) : (
          <AppText color={theme.colors.mutedText}>
            Si no capturas anticipo, solo se creará el apartado.
          </AppText>
        )}

        <View style={styles.totalRow}>
          <AppText bold>Total apartado</AppText>
          <AppText bold>{formatMoney(getTotal())}</AppText>
        </View>

        <View style={styles.totalRow}>
          <AppText bold>Saldo pendiente</AppText>
          <AppText bold>
            {formatMoney(Math.max(getTotal() - getAdvance(), 0))}
          </AppText>
        </View>
      </AppCard>

      <AppButton
        title="Crear apartado"
        onPress={handleSave}
        loading={isSaving}
        disabled={isSaving}
      />
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
          data={getFilteredCustomers()}
          style={styles.modalList}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <AppOptionRow
              title={item.name}
              subtitle={`${item.phone || 'Sin teléfono'} · ${
                item.email || 'Sin correo'
              }`}
              onPress={() => selectCustomer(item)}
            />
          )}
          ListEmptyComponent={<AppText>No hay clientes reales activos.</AppText>}
        />
      </AppBottomModal>

      <AppBottomModal
        visible={isItemModalVisible}
        title="Agregar prenda"
        onClose={() => setIsItemModalVisible(false)}
        scroll={false}
      >
        <AppInput
          placeholder="Buscar por código, tipo, marca o talla"
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
              subtitle={`${item.productTypeName || 'Sin tipo'} · ${
                item.brandName || 'Sin marca'
              } · ${item.sizeName || 'Sin talla'}`}
              onPress={() => addItemToCart(item)}
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
        visible={isPaymentModalVisible}
        title="Método de pago"
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
        title="Falta completar el apartado"
        onClose={() => setValidationIssue(null)}
        showCancelButton={false}
      >
        {validationIssue === 'CUSTOMER' ? (
          <AppText>Selecciona un cliente real para crear el apartado.</AppText>
        ) : null}
        {validationIssue === 'ITEM' ? (
          <AppText>Agrega al menos una prenda al apartado.</AppText>
        ) : null}
        {validationIssue === 'PRICE' ? (
          <AppText>Revisa que todas las prendas tengan precio mayor a cero.</AppText>
        ) : null}
        {validationIssue === 'ADVANCE' ? (
          <AppText>El anticipo debe ser cero o mayor, y no puede superar el total.</AppText>
        ) : null}
        {validationIssue === 'PAYMENT' ? (
          <AppText>Selecciona el metodo de pago para registrar el anticipo.</AppText>
        ) : null}

        <View style={styles.modalActions}>
          <View style={styles.modalAction}>
            <AppButton
              title="Cerrar"
              variant="secondary"
              onPress={() => setValidationIssue(null)}
            />
          </View>
          <View style={styles.modalAction}>
            <AppButton
              title={
                validationIssue === 'CUSTOMER'
                  ? 'Elegir cliente'
                  : validationIssue === 'ITEM'
                    ? 'Agregar prenda'
                    : validationIssue === 'PAYMENT'
                      ? 'Elegir pago'
                      : 'Revisar'
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
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  modalAction: {
    flex: 1,
  },
  cartLine: {
    marginTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  modalList: {
    maxHeight: 420,
  },
  totalRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

