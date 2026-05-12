import AppBackButton from '@/components/ui/AppBackButton';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppOptionRow from '@/components/ui/AppOptionRow';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { Branch, getActiveBranches } from '@/services/branchAdminService';
import { getItemsByBranch, Item } from '@/services/itemService';
import { getSession, UserSession } from '@/services/sessionStorage';
import {
  BranchTransfer,
  createTransfer,
  getTransfersByBranch,
  getTransferStatusLabel,
} from '@/services/transferService';
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

function normalize(value?: string | null) {
  return (value ?? '').toLowerCase().trim();
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function directionLabel(sessionBranchId: number, transfer: BranchTransfer) {
  if (transfer.fromBranchId === sessionBranchId) return 'Salida';
  if (transfer.toBranchId === sessionBranchId) return 'Entrada';
  return 'Relacionada';
}

export default function TransfersScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const [session, setSession] = useState<UserSession | null>(null);
  const [transfers, setTransfers] = useState<BranchTransfer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [originItems, setOriginItems] = useState<Item[]>([]);
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);

  const [selectedToBranchId, setSelectedToBranchId] = useState<number | null>(
    null
  );
  const [customerOrderIdText, setCustomerOrderIdText] = useState('');
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isItemModalVisible, setIsItemModalVisible] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const currentSession = await getSession();

      if (!currentSession) {
        router.replace('/login');
        return;
      }

      setSession(currentSession);

      const [transferData, branchData, itemData] = await Promise.all([
        getTransfersByBranch(currentSession.branchId),
        getActiveBranches(),
        getItemsByBranch(currentSession.branchId),
      ]);

      setTransfers(transferData);
      setBranches(branchData);

      setOriginItems(
        itemData.filter(
          (item) => item.status === 'AVAILABLE' && item.branchId === currentSession.branchId
        )
      );
    } catch (err: any) {
      Alert.alert(
        'Transferencias',
        err?.message || 'No se pudieron cargar las transferencias.'
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const destinationBranches = useMemo(() => {
    if (!session) return [];
    return branches.filter((branch) => branch.id !== session.branchId);
  }, [branches, session]);

  const filteredTransfers = useMemo(() => {
    const term = normalize(search);

    if (!term) return transfers;

    return transfers.filter((transfer) => {
      const content = [
        transfer.folio,
        transfer.status,
        transfer.fromBranchName,
        transfer.toBranchName,
        transfer.notes,
        transfer.customerOrderId ? String(transfer.customerOrderId) : '',
      ]
        .map(normalize)
        .join(' ');

      return content.includes(term);
    });
  }, [search, transfers]);

  const filteredItems = useMemo(() => {
    const term = normalize(itemSearch);
    const selectedIds = new Set(selectedItems.map((item) => item.id));

    return originItems
      .filter((item) => !selectedIds.has(item.id))
      .filter((item) => {
        if (!term) return true;

        return [
          item.code,
          item.qrCode,
          item.productTypeName,
          item.brandName,
          item.sizeName,
          item.batchFolio,
        ]
          .map(normalize)
          .join(' ')
          .includes(term);
      })
      .slice(0, 40);
  }, [itemSearch, originItems, selectedItems]);

  const createTransferBlockedReason = saving
    ? 'Espera a que termine la creacion actual.'
    : !selectedToBranchId && selectedItems.length === 0
      ? 'Selecciona una sucursal destino y agrega al menos una prenda.'
      : !selectedToBranchId
        ? 'Selecciona una sucursal destino.'
        : selectedItems.length === 0
          ? 'Agrega al menos una prenda.'
          : undefined;

  const resetCreateForm = () => {
    setSelectedToBranchId(null);
    setSelectedItems([]);
    setCustomerOrderIdText('');
    setNotes('');
    setItemSearch('');
  };

  const openCreateModal = () => {
    resetCreateForm();
    setIsCreateModalVisible(true);
  };

  const addSelectedItem = (item: Item) => {
    setSelectedItems((current) => [...current, item]);
    setIsItemModalVisible(false);
    setItemSearch('');
  };

  const removeSelectedItem = (itemId: number) => {
    setSelectedItems((current) => current.filter((item) => item.id !== itemId));
  };

  const handleCreateTransfer = async () => {
    if (!session) return;

    if (!selectedToBranchId) {
      Alert.alert('Transferencias', 'Selecciona una sucursal destino.');
      return;
    }

    if (selectedItems.length === 0) {
      Alert.alert('Transferencias', 'Agrega al menos una prenda.');
      return;
    }

    const customerOrderId = customerOrderIdText.trim()
      ? Number(customerOrderIdText)
      : undefined;

    if (
      customerOrderIdText.trim() &&
      (customerOrderId === undefined || Number.isNaN(customerOrderId) || customerOrderId <= 0)
    ) {
      Alert.alert('Transferencias', 'Captura un ID de pedido válido.');
      return;
    }

    setSaving(true);

    try {
      const created = await createTransfer({
        fromBranchId: session.branchId,
        toBranchId: selectedToBranchId,
        customerOrderId,
        notes,
        itemIds: selectedItems.map((item) => item.id),
      });

      setIsCreateModalVisible(false);
      resetCreateForm();
      await load();

      router.push({
        pathname: '/transfer-detail',
        params: { id: String(created.id) },
      });
    } catch (err: any) {
      Alert.alert(
        'Transferencias',
        err?.message || 'No se pudo crear la transferencia.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AppScreen>
        <AppBackButton fallbackRoute="/" />

        <AppText variant="title" bold>
          Transferencias
        </AppText>

        <AppCard>
          <AppText variant="subtitle" bold>
            Movimientos entre sucursales
          </AppText>
          <AppText color={theme.colors.mutedText}>
            Crea transferencias desde tu sucursal, envíalas y recibe prendas por
            escaneo/código en la sucursal destino.
          </AppText>
        </AppCard>

        <AppButton title="+ Nueva transferencia" onPress={openCreateModal} />

        <AppInput
          label="Buscar"
          placeholder="Folio, sucursal, estado o pedido"
          value={search}
          onChangeText={setSearch}
        />

        {loading ? <ActivityIndicator /> : null}

        {!loading && filteredTransfers.length === 0 ? (
          <AppCard>
            <AppText color={theme.colors.mutedText}>
              No hay transferencias para mostrar.
            </AppText>
          </AppCard>
        ) : null}

        {filteredTransfers.map((transfer) => (
          <Pressable
            key={transfer.id}
            onPress={() =>
              router.push({
                pathname: '/transfer-detail',
                params: { id: String(transfer.id) },
              })
            }
            style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
          >
            <AppCard>
              <View style={styles.headerRow}>
                <View style={styles.headerText}>
                  <AppText variant="subtitle" bold>
                    {transfer.folio}
                  </AppText>
                  <AppText color={theme.colors.mutedText}>
                    {session
                      ? directionLabel(session.branchId, transfer)
                      : 'Transferencia'}{' '}
                    · {getTransferStatusLabel(transfer.status)}
                  </AppText>
                </View>

                <View
                  style={[
                    styles.statusPill,
                    {
                      borderColor:
                        transfer.status === 'CANCELLED'
                          ? theme.colors.danger
                          : transfer.status === 'RECEIVED'
                            ? theme.colors.success
                            : theme.colors.warning,
                      backgroundColor:
                        transfer.status === 'CANCELLED'
                          ? theme.colors.dangerBackground
                          : transfer.status === 'RECEIVED'
                            ? theme.colors.successBackground
                            : theme.colors.warningBackground,
                    },
                  ]}
                >
                  <AppText
                    variant="caption"
                    bold
                    color={
                      transfer.status === 'CANCELLED'
                        ? theme.colors.danger
                        : transfer.status === 'RECEIVED'
                          ? theme.colors.success
                          : theme.colors.warning
                    }
                  >
                    {getTransferStatusLabel(transfer.status)}
                  </AppText>
                </View>
              </View>

              <AppText>
                {transfer.fromBranchName || transfer.fromBranchCode} →{' '}
                {transfer.toBranchName || transfer.toBranchCode}
              </AppText>

              <AppText color={theme.colors.mutedText}>
                Items: {transfer.receivedItems}/{transfer.totalItems} recibidos
              </AppText>

              {transfer.customerOrderId ? (
                <AppText color={theme.colors.mutedText}>
                  Pedido: #{transfer.customerOrderId}
                </AppText>
              ) : null}

              <AppText variant="caption" color={theme.colors.mutedText}>
                Creada: {formatDate(transfer.createdAt)}
              </AppText>
            </AppCard>
          </Pressable>
        ))}
      </AppScreen>

      <AppBottomModal
        visible={isCreateModalVisible}
        title="Nueva transferencia"
        onClose={() => setIsCreateModalVisible(false)}
      >
        <AppCard>
          <AppText variant="subtitle" bold>
            Origen
          </AppText>
          <AppText>{session?.branchName || 'Sucursal actual'}</AppText>
        </AppCard>

        <AppText variant="subtitle" bold>
          Destino
        </AppText>

        {destinationBranches.map((branch) => {
          const selected = branch.id === selectedToBranchId;

          return (
            <Pressable
              key={branch.id}
              onPress={() => setSelectedToBranchId(branch.id)}
              style={({ pressed }) => [
                styles.destinationOption,
                {
                  borderColor: selected
                    ? theme.colors.accent
                    : theme.colors.border,
                  backgroundColor: selected
                    ? theme.colors.optionPressedBackground
                    : theme.colors.surface,
                  borderRadius: theme.radius.md,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <AppText bold>{branch.name}</AppText>
              <AppText variant="caption" color={theme.colors.mutedText}>
                {branch.code}
              </AppText>
            </Pressable>
          );
        })}

        <AppInput
          label="ID de pedido existente"
          placeholder="Opcional; solo si ya existe el pedido"
          value={customerOrderIdText}
          onChangeText={setCustomerOrderIdText}
          keyboardType="number-pad"
        />

        <AppText variant="caption" color={theme.colors.mutedText}>
          Si no estas ligando la transferencia a un pedido abierto, deja este campo vacio.
        </AppText>

        <AppInput
          label="Notas"
          placeholder="Notas opcionales"
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <AppCard>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <AppText variant="subtitle" bold>
                Prendas
              </AppText>
              <AppText color={theme.colors.mutedText}>
                Seleccionadas: {selectedItems.length}
              </AppText>
            </View>

            <View style={styles.smallButton}>
              <AppButton
                title="Agregar"
                variant="secondary"
                onPress={() => setIsItemModalVisible(true)}
              />
            </View>
          </View>

          {selectedItems.length === 0 ? (
            <AppText color={theme.colors.mutedText}>
              Agrega al menos una prenda disponible de la sucursal origen.
            </AppText>
          ) : (
            selectedItems.map((item) => (
              <View key={item.id} style={styles.selectedItemRow}>
                <View style={styles.headerText}>
                  <AppText bold>{item.code}</AppText>
                  <AppText variant="caption" color={theme.colors.mutedText}>
                    {item.productTypeName || 'Sin tipo'} ·{' '}
                    {item.brandName || 'Sin marca'} · {item.sizeName || 'Sin talla'}
                  </AppText>
                </View>

                <Pressable onPress={() => removeSelectedItem(item.id)}>
                  <AppText color={theme.colors.danger} bold>
                    Quitar
                  </AppText>
                </Pressable>
              </View>
            ))
          )}
        </AppCard>

        <AppButton
          title={saving ? 'Creando...' : 'Crear transferencia'}
          onPress={handleCreateTransfer}
          loading={saving}
          disabled={
            saving || !selectedToBranchId || selectedItems.length === 0
          }
          disabledReason={createTransferBlockedReason}
        />
      </AppBottomModal>

      <AppBottomModal
        visible={isItemModalVisible}
        title="Agregar prenda"
        onClose={() => setIsItemModalVisible(false)}
        scroll={false}
      >
        <AppInput
          placeholder="Buscar por código, tipo, marca, talla o lote"
          value={itemSearch}
          onChangeText={setItemSearch}
        />

        <FlatList
          data={filteredItems}
          style={styles.modalList}
          keyExtractor={(item) => String(item.id)}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <AppOptionRow
              title={item.code}
              subtitle={`${item.productTypeName || 'Sin tipo'} · ${
                item.brandName || 'Sin marca'
              } · ${item.sizeName || 'Sin talla'}`}
              onPress={() => addSelectedItem(item)}
            />
          )}
          ListEmptyComponent={
            <AppText color={theme.colors.mutedText}>
              No hay prendas disponibles para transferir.
            </AppText>
          }
        />
      </AppBottomModal>
    </>
  );
}

const styles = StyleSheet.create({
  destinationOption: {
    borderWidth: 1,
    marginTop: 10,
    padding: 12,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
  },
  modalList: {
    maxHeight: 420,
  },
  selectedItemRow: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
  },
  smallButton: {
    minWidth: 110,
  },
  statusPill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});
