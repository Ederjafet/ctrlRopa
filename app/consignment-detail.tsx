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
import { Customer, getCustomersByBranch } from '@/services/customerService';
import { getItemsByBranch, Item } from '@/services/itemService';
import {
  addConsignmentItem,
  cancelConsignment,
  Consignment,
  ConsignmentItemLine,
  deliverConsignment,
  getConsignmentById,
  getConsignmentItemStatusLabel,
  getConsignmentStatusLabel,
  settleConsignment,
} from '@/services/consignmentService';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';

function normalize(value?: string | null) {
  return (value ?? '').toLowerCase().trim();
}

function formatMoney(value?: number | null) {
  if (value === null || value === undefined) return 'Sin precio';
  return `$${Number(value).toFixed(2)}`;
}

function formatDate(value?: string | null) {
  if (!value) return 'Sin fecha';
  return new Date(value).toLocaleDateString();
}

export default function ConsignmentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { theme } = useAppTheme();

  const consignmentId = Number(id);

  const [session, setSession] = useState<UserSession | null>(null);
  const [consignment, setConsignment] = useState<Consignment | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [addItemModalVisible, setAddItemModalVisible] = useState(false);
  const [itemPickerVisible, setItemPickerVisible] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [itemSearch, setItemSearch] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [suggestedPrice, setSuggestedPrice] = useState('');
  const [itemNotes, setItemNotes] = useState('');

  const [settleModalVisible, setSettleModalVisible] = useState(false);
  const [settleItem, setSettleItem] = useState<ConsignmentItemLine | null>(null);
  const [settleResult, setSettleResult] = useState<'SOLD' | 'RETURNED'>('SOLD');
  const [salePrice, setSalePrice] = useState('');
  const [settleNotes, setSettleNotes] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerPickerVisible, setCustomerPickerVisible] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  const [cancelReason, setCancelReason] = useState('');
  const [cancelModalVisible, setCancelModalVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, [consignmentId]);

  const loadData = async () => {
    const currentSession = await getSession();

    if (!currentSession) {
      router.replace('/login');
      return;
    }

    setSession(currentSession);
    setLoading(true);
    setError('');

    try {
      const [consignmentData, itemData, customerData] = await Promise.all([
        getConsignmentById(consignmentId),
        getItemsByBranch(currentSession.branchId),
        getCustomersByBranch(currentSession.branchId),
      ]);

      setConsignment(consignmentData);
      setItems(itemData.filter((item) => item.status === 'AVAILABLE'));
      setCustomers(customerData.filter((customer) => customer.status !== 'INACTIVE'));
    } catch (err: any) {
      setError(err?.message || 'No se pudo cargar la consignación.');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    const term = normalize(itemSearch);
    if (!term) return items.slice(0, 30);

    return items
      .filter((item) =>
        `${item.code} ${item.qrCode ?? ''} ${item.productTypeName ?? ''} ${item.brandName ?? ''} ${item.sizeName ?? ''}`
          .toLowerCase()
          .includes(term)
      )
      .slice(0, 30);
  }, [items, itemSearch]);

  const filteredCustomers = useMemo(() => {
    const term = normalize(customerSearch);
    if (!term) return customers.slice(0, 30);

    return customers
      .filter((customer) =>
        `${customer.name} ${customer.phone ?? ''} ${customer.email ?? ''}`
          .toLowerCase()
          .includes(term)
      )
      .slice(0, 30);
  }, [customers, customerSearch]);

  const openItems = useMemo(
    () => consignment?.items.filter((item) => item.status === 'OUT_ON_CONSIGNMENT') ?? [],
    [consignment]
  );

  const canAddItems = consignment?.status === 'OPEN';
  const canDeliver = consignment?.status === 'OPEN' && (consignment?.totalItems ?? 0) > 0;
  const canSettle = consignment?.status === 'DELIVERED' || consignment?.status === 'IN_SETTLEMENT';
  const canCancel = consignment && consignment.status !== 'CLOSED' && consignment.status !== 'CANCELLED';

  const resetAddItemForm = () => {
    setItemCode('');
    setSuggestedPrice('');
    setItemNotes('');
    setItemSearch('');
  };

  const handleAddItemByPayload = async (payload: { itemId?: number; itemCode?: string; qrCode?: string }) => {
    if (!consignment) return;

    const price = suggestedPrice.trim() ? Number(suggestedPrice) : null;

    if (suggestedPrice.trim() && (Number.isNaN(price) || Number(price) <= 0)) {
      setError('El precio sugerido debe ser mayor a 0.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const updated = await addConsignmentItem(consignment.id, {
        ...payload,
        suggestedPrice: price,
        notes: itemNotes,
      });

      setConsignment(updated);
      resetAddItemForm();
      setAddItemModalVisible(false);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'No se pudo agregar la prenda.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddByCode = () => {
    const code = itemCode.trim();

    if (!code) {
      setError('Captura o escanea el código de la prenda.');
      return;
    }

    handleAddItemByPayload({ itemCode: code });
  };

  const handleScanned = (value: string) => {
    setScannerVisible(false);
    setItemCode(value);
  };

  const handleDeliver = () => {
    if (!consignment) return;

    Alert.alert(
      'Entregar consignación',
      'La consignación pasará a DELIVERED y ya no podrás agregar más prendas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Entregar',
          onPress: async () => {
            setSaving(true);
            setError('');

            try {
              const updated = await deliverConsignment(consignment.id);
              setConsignment(updated);
            } catch (err: any) {
              setError(err?.message || 'No se pudo entregar la consignación.');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const openSettleModal = (item: ConsignmentItemLine, result: 'SOLD' | 'RETURNED') => {
    setSettleItem(item);
    setSettleResult(result);
    setSalePrice(result === 'SOLD' && item.suggestedPrice ? String(item.suggestedPrice) : '');
    setSettleNotes('');
    setSelectedCustomer(null);
    setSettleModalVisible(true);
  };

  const handleSettle = async () => {
    if (!consignment || !settleItem) return;

    const price = salePrice.trim() ? Number(salePrice) : null;

    if (settleResult === 'SOLD' && (!price || Number.isNaN(price) || price <= 0)) {
      setError('El precio de venta es obligatorio para marcar como vendido.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const updated = await settleConsignment(consignment.id, {
        notes: settleNotes,
        items: [
          {
            consignmentItemId: settleItem.consignmentItemId,
            result: settleResult,
            salePrice: settleResult === 'SOLD' ? price : null,
            customerId: settleResult === 'SOLD' ? selectedCustomer?.id ?? null : null,
            notes: settleNotes,
          },
        ],
      });

      setConsignment(updated);
      setSettleModalVisible(false);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'No se pudo liquidar la prenda.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!consignment) return;

    setSaving(true);
    setError('');

    try {
      const updated = await cancelConsignment(consignment.id, cancelReason);
      setConsignment(updated);
      setCancelReason('');
      setCancelModalVisible(false);
    } catch (err: any) {
      setError(err?.message || 'No se pudo cancelar la consignación.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppScreen>
        <ActivityIndicator />
      </AppScreen>
    );
  }

  if (!consignment) {
    return (
      <AppScreen>
        <AppBackButton fallbackRoute="/consignments" />
        <AppText>No se encontró la consignación.</AppText>
        {error ? <AppText color={theme.colors.danger}>{error}</AppText> : null}
      </AppScreen>
    );
  }

  return (
    <>
      <AppScreen>
        <AppBackButton fallbackRoute="/consignments" />

        <AppText variant="title" bold>
          Consignación {consignment.folio}
        </AppText>

        <AppCard>
          <AppText variant="subtitle" bold>
            Resumen
          </AppText>
          <AppText>Consignatario: {consignment.consigneeName}</AppText>
          <AppText>Estado: {getConsignmentStatusLabel(consignment.status)}</AppText>
          <AppText color={theme.colors.mutedText}>
            Creada: {formatDate(consignment.createdAt)}
          </AppText>
          <AppText>
            Items: {consignment.totalItems} · Vendidos: {consignment.soldItems} · Devueltos:{' '}
            {consignment.returnedItems} · Abiertos: {consignment.openItems}
          </AppText>
          {consignment.notes ? (
            <AppText color={theme.colors.mutedText}>{consignment.notes}</AppText>
          ) : null}
        </AppCard>

        {error ? (
          <AppCard style={{ borderColor: theme.colors.danger }}>
            <AppText color={theme.colors.danger}>{error}</AppText>
          </AppCard>
        ) : null}

        <View style={styles.buttonRow}>
          {canAddItems ? (
            <View style={styles.buttonFill}>
              <AppButton title="Agregar prenda" onPress={() => setAddItemModalVisible(true)} />
            </View>
          ) : null}

          {canDeliver ? (
            <View style={styles.buttonFill}>
              <AppButton title="Entregar" onPress={handleDeliver} loading={saving} />
            </View>
          ) : null}

          {canCancel ? (
            <View style={styles.buttonFill}>
              <AppButton
                title="Cancelar"
                variant="danger"
                onPress={() => setCancelModalVisible(true)}
                loading={saving}
              />
            </View>
          ) : null}
        </View>

        <AppCard>
          <AppText variant="subtitle" bold>
            Prendas
          </AppText>

          {consignment.items.length === 0 ? (
            <AppText color={theme.colors.mutedText}>
              Aún no hay prendas en esta consignación.
            </AppText>
          ) : null}

          {consignment.items.map((item) => (
            <View
              key={item.consignmentItemId}
              style={[styles.itemRow, { borderBottomColor: theme.colors.border }]}
            >
              <AppText bold>{item.itemCode}</AppText>
              <AppText color={theme.colors.mutedText}>
                Estado: {getConsignmentItemStatusLabel(item.status)} · Sugerido:{' '}
                {formatMoney(item.suggestedPrice)}
              </AppText>
              {item.notes ? <AppText color={theme.colors.mutedText}>{item.notes}</AppText> : null}

              {canSettle && item.status === 'OUT_ON_CONSIGNMENT' ? (
                <View style={styles.buttonRowSmall}>
                  <View style={styles.buttonFill}>
                    <AppButton
                      title="Vendido"
                      onPress={() => openSettleModal(item, 'SOLD')}
                    />
                  </View>
                  <View style={styles.buttonFill}>
                    <AppButton
                      title="Devuelto"
                      variant="secondary"
                      onPress={() => openSettleModal(item, 'RETURNED')}
                    />
                  </View>
                </View>
              ) : null}
            </View>
          ))}
        </AppCard>

        <AppCard>
          <AppText variant="subtitle" bold>
            Liquidaciones
          </AppText>

          {consignment.settlements.length === 0 ? (
            <AppText color={theme.colors.mutedText}>
              Aún no hay liquidaciones registradas.
            </AppText>
          ) : null}

          {consignment.settlements.map((settlement) => (
            <View
              key={settlement.settlementId}
              style={[styles.itemRow, { borderBottomColor: theme.colors.border }]}
            >
              <AppText bold>Liquidación #{settlement.settlementId}</AppText>
              <AppText color={theme.colors.mutedText}>
                {formatDate(settlement.createdAt)}
              </AppText>
              {settlement.items.map((item) => (
                <AppText key={item.settlementItemId}>
                  Item consignación #{item.consignmentItemId}: {item.result}
                  {item.salePrice ? ` · ${formatMoney(item.salePrice)}` : ''}
                  {item.customerName ? ` · ${item.customerName}` : ''}
                </AppText>
              ))}
            </View>
          ))}
        </AppCard>
      </AppScreen>

      <AppBottomModal
        visible={addItemModalVisible}
        title="Agregar prenda"
        onClose={() => setAddItemModalVisible(false)}
        scroll={false}
      >
        <AppInput
          label="Código / QR"
          value={itemCode}
          onChangeText={setItemCode}
          placeholder="Escanea o escribe código"
          onSubmitEditing={handleAddByCode}
        />

        <AppInput
          label="Precio sugerido"
          value={suggestedPrice}
          onChangeText={setSuggestedPrice}
          placeholder="0.00"
          keyboardType="numeric"
        />

        <AppInput
          label="Notas"
          value={itemNotes}
          onChangeText={setItemNotes}
          placeholder="Notas opcionales"
          multiline
        />

        <View style={styles.buttonRow}>
          <View style={styles.buttonFill}>
            <AppButton title="Agregar" onPress={handleAddByCode} loading={saving} />
          </View>
          <View style={styles.buttonFill}>
            <AppButton
              title="Escanear QR"
              variant="secondary"
              onPress={() => setScannerVisible(true)}
            />
          </View>
        </View>

        <View style={styles.modalSpacing}>
          <AppButton
            title="Buscar prenda disponible"
            variant="secondary"
            onPress={() => setItemPickerVisible(true)}
          />
        </View>
      </AppBottomModal>

      <AppBottomModal
        visible={itemPickerVisible}
        title="Seleccionar prenda"
        onClose={() => setItemPickerVisible(false)}
        scroll={false}
      >
        <AppInput
          placeholder="Buscar código, tipo, marca o talla"
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
              subtitle={`${item.productTypeName ?? 'Sin tipo'} · ${item.brandName ?? 'Sin marca'} · ${item.sizeName ?? 'Sin talla'}`}
              onPress={() => {
                setItemCode(item.code);
                setSuggestedPrice(item.price ? String(item.price) : '');
                setItemPickerVisible(false);
              }}
            />
          )}
          ListEmptyComponent={<AppText>No hay prendas disponibles.</AppText>}
        />
      </AppBottomModal>

      <AppBottomModal
        visible={settleModalVisible}
        title={settleResult === 'SOLD' ? 'Registrar vendido' : 'Registrar devuelto'}
        onClose={() => setSettleModalVisible(false)}
        scroll={false}
      >
        <AppText bold>{settleItem?.itemCode}</AppText>

        {settleResult === 'SOLD' ? (
          <>
            <AppInput
              label="Precio de venta"
              value={salePrice}
              onChangeText={setSalePrice}
              placeholder="0.00"
              keyboardType="numeric"
            />

            <AppText bold>Cliente</AppText>
            <AppText color={theme.colors.mutedText} style={styles.modalText}>
              {selectedCustomer
                ? selectedCustomer.name
                : 'Opcional. Si no eliges cliente, se usará cliente genérico de consignación.'}
            </AppText>

            <AppButton
              title={selectedCustomer ? 'Cambiar cliente' : 'Seleccionar cliente'}
              variant="secondary"
              onPress={() => setCustomerPickerVisible(true)}
            />
          </>
        ) : null}

        <AppInput
          label="Notas"
          value={settleNotes}
          onChangeText={setSettleNotes}
          placeholder="Notas de liquidación"
          multiline
        />

        <AppButton
          title="Guardar liquidación"
          onPress={handleSettle}
          loading={saving}
          disabled={saving}
        />
      </AppBottomModal>

      <AppBottomModal
        visible={customerPickerVisible}
        title="Seleccionar cliente"
        onClose={() => setCustomerPickerVisible(false)}
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
              subtitle={`${item.phone || 'Sin teléfono'}${item.isGeneric ? ' · Genérico' : ''}`}
              onPress={() => {
                setSelectedCustomer(item);
                setCustomerSearch('');
                setCustomerPickerVisible(false);
              }}
            />
          )}
          ListEmptyComponent={<AppText>No hay clientes activos.</AppText>}
        />
      </AppBottomModal>

      <AppBottomModal
        visible={cancelModalVisible}
        title="Cancelar consignación"
        onClose={() => setCancelModalVisible(false)}
      >
        <AppInput
          label="Motivo"
          value={cancelReason}
          onChangeText={setCancelReason}
          placeholder="Motivo de cancelación"
          multiline
        />

        <AppButton
          title="Confirmar cancelación"
          variant="danger"
          onPress={handleCancel}
          loading={saving}
          disabled={saving}
        />
      </AppBottomModal>

      <QRScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScanned={handleScanned}
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
  buttonRowSmall: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  buttonFill: {
    flex: 1,
    minWidth: 130,
  },
  itemRow: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  modalList: {
    maxHeight: 420,
  },
  modalSpacing: {
    marginTop: 10,
  },
  modalText: {
    marginBottom: 10,
    marginTop: 4,
  },
});
