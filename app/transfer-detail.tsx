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
import { getItemsByBranch, Item } from '@/services/itemService';
import { getSession, UserSession } from '@/services/sessionStorage';
import {
  addTransferItem,
  BranchTransfer,
  cancelTransfer,
  getTransferById,
  getTransferStatusLabel,
  isTransferEditable,
  isTransferReceivable,
  receiveTransferItem,
  sendTransfer,
} from '@/services/transferService';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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

export default function TransferDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { theme } = useAppTheme();

  const transferId = Number(id);

  const [session, setSession] = useState<UserSession | null>(null);
  const [transfer, setTransfer] = useState<BranchTransfer | null>(null);
  const [originItems, setOriginItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [receiveCode, setReceiveCode] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [itemSearch, setItemSearch] = useState('');

  const [isAddItemModalVisible, setIsAddItemModalVisible] = useState(false);
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [isScannerVisible, setIsScannerVisible] = useState(false);

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    if (!transferId || Number.isNaN(transferId)) {
      Alert.alert('Transferencia', 'Transferencia no válida.');
      router.replace('/transfers');
      return;
    }

    setLoading(true);

    try {
      const currentSession = await getSession();

      if (!currentSession) {
        router.replace('/login');
        return;
      }

      setSession(currentSession);

      const data = await getTransferById(transferId);
      setTransfer(data);

      if (data.status === 'OPEN') {
        const items = await getItemsByBranch(data.fromBranchId);
        const selectedIds = new Set(data.items.map((line) => line.itemId));

        setOriginItems(
          items.filter(
            (item) =>
              item.status === 'AVAILABLE' &&
              !selectedIds.has(item.id) &&
              item.branchId === data.fromBranchId
          )
        );
      } else {
        setOriginItems([]);
      }
    } catch (err: any) {
      Alert.alert(
        'Transferencia',
        err?.message || 'No se pudo cargar la transferencia.'
      );
    } finally {
      setLoading(false);
    }
  };

  const isOriginUser = !!(
    session &&
    transfer &&
    session.branchId === transfer.fromBranchId
  );

  const isDestinationUser = !!(
    session &&
    transfer &&
    session.branchId === transfer.toBranchId
  );

  const pendingItems = useMemo(() => {
    return transfer?.items.filter((item) => !item.receivedAt) ?? [];
  }, [transfer]);

  const availableToAdd = useMemo(() => {
    const term = normalize(itemSearch);

    return originItems
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
  }, [itemSearch, originItems]);

  const sendBlockedReason = useMemo(() => {
    if (actionLoading) return 'Espera a que termine la accion en proceso.';
    if (transfer && transfer.totalItems === 0) {
      return 'Agrega al menos una prenda antes de enviar la transferencia.';
    }
    return undefined;
  }, [actionLoading, transfer]);

  const handleAddItem = async (item: Item) => {
    if (!transfer) return;

    setActionLoading(true);

    try {
      const updated = await addTransferItem(transfer.id, item.id);
      setTransfer(updated);
      setIsAddItemModalVisible(false);
      setItemSearch('');
      await load();
    } catch (err: any) {
      Alert.alert(
        'Transferencia',
        err?.message || 'No se pudo agregar la prenda.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleSend = () => {
    if (!transfer) return;

    Alert.alert(
      'Enviar transferencia',
      'Al enviar la transferencia quedará en tránsito y ya no podrás modificar prendas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: async () => {
            setActionLoading(true);

            try {
              const updated = await sendTransfer(transfer.id);
              setTransfer(updated);
              await load();
            } catch (err: any) {
              Alert.alert(
                'Transferencia',
                err?.message || 'No se pudo enviar la transferencia.'
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const receiveByCode = async (value: string) => {
    if (!transfer) return;

    const code = value.trim();

    if (!code) {
      Alert.alert('Recepción', 'Captura o escanea un código.');
      return;
    }

    setActionLoading(true);

    try {
      const payload = code.startsWith('QR') ? { qrCode: code } : { itemCode: code };
      const updated = await receiveTransferItem(transfer.id, payload);

      setTransfer(updated);
      setReceiveCode('');
      await load();

      Alert.alert('Recepción', 'Prenda recibida correctamente.');
    } catch (err: any) {
      Alert.alert(
        'Recepción',
        err?.message || 'No se pudo recibir la prenda.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleScanned = (value: string) => {
    setIsScannerVisible(false);
    receiveByCode(value);
  };

  const handleCancel = async () => {
    if (!transfer) return;

    if (!cancelReason.trim()) {
      Alert.alert('Cancelar', 'Captura el motivo de cancelación.');
      return;
    }

    setActionLoading(true);

    try {
      const updated = await cancelTransfer(transfer.id, cancelReason);
      setTransfer(updated);
      setIsCancelModalVisible(false);
      setCancelReason('');
      await load();
    } catch (err: any) {
      Alert.alert(
        'Cancelar',
        err?.message || 'No se pudo cancelar la transferencia.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <AppScreen>
        <ActivityIndicator />
      </AppScreen>
    );
  }

  if (!transfer) {
    return (
      <AppScreen>
        <AppBackButton fallbackRoute="/transfers" />
        <AppText>No se encontró la transferencia.</AppText>
      </AppScreen>
    );
  }

  return (
    <>
      <AppScreen>
        <AppBackButton fallbackRoute="/transfers" />

        <AppText variant="title" bold>
          Transferencia {transfer.folio}
        </AppText>

        <AppCard>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <AppText variant="subtitle" bold>
                {getTransferStatusLabel(transfer.status)}
              </AppText>
              <AppText color={theme.colors.mutedText}>
                {transfer.fromBranchName || transfer.fromBranchCode} →{' '}
                {transfer.toBranchName || transfer.toBranchCode}
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

          <AppText color={theme.colors.mutedText}>
            Creada: {formatDate(transfer.createdAt)}
          </AppText>
          <AppText color={theme.colors.mutedText}>
            Enviada: {formatDate(transfer.sentAt)}
          </AppText>
          <AppText color={theme.colors.mutedText}>
            Recibida: {formatDate(transfer.receivedAt)}
          </AppText>

          {transfer.customerOrderId ? (
            <AppText>Pedido relacionado: #{transfer.customerOrderId}</AppText>
          ) : null}

          {transfer.notes ? <AppText>Notas: {transfer.notes}</AppText> : null}

          <AppText bold style={styles.progress}>
            Progreso: {transfer.receivedItems}/{transfer.totalItems} prendas
            recibidas
          </AppText>
        </AppCard>

        {isTransferEditable(transfer) && isOriginUser ? (
          <AppCard>
            <AppText variant="subtitle" bold>
              Acciones origen
            </AppText>

            <View style={styles.buttonGroup}>
              <AppButton
                title="Agregar prenda"
                variant="secondary"
                onPress={() => setIsAddItemModalVisible(true)}
                disabled={actionLoading}
              />

              <AppButton
                title="Enviar transferencia"
                onPress={handleSend}
                loading={actionLoading}
                disabled={actionLoading || transfer.totalItems === 0}
                disabledReason={sendBlockedReason}
              />

              <AppButton
                title="Cancelar transferencia"
                variant="danger"
                onPress={() => setIsCancelModalVisible(true)}
                disabled={actionLoading}
              />
            </View>
          </AppCard>
        ) : null}

        {isTransferReceivable(transfer) && isDestinationUser ? (
          <AppCard>
            <AppText variant="subtitle" bold>
              Recepción por escaneo
            </AppText>

            <AppText color={theme.colors.mutedText}>
              Recibe cada prenda escaneando su QR o capturando su código.
            </AppText>

            <AppInput
              label="Código / QR"
              placeholder="Escanea o captura código"
              value={receiveCode}
              onChangeText={setReceiveCode}
              onSubmitEditing={() => receiveByCode(receiveCode)}
            />

            <View style={styles.buttonRow}>
              <View style={styles.buttonFill}>
                <AppButton
                  title="Recibir"
                  onPress={() => receiveByCode(receiveCode)}
                  loading={actionLoading}
                  disabled={actionLoading}
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
          </AppCard>
        ) : null}

        <AppCard>
          <AppText variant="subtitle" bold>
            Prendas
          </AppText>

          {transfer.items.length === 0 ? (
            <AppText color={theme.colors.mutedText}>
              No hay prendas en esta transferencia.
            </AppText>
          ) : (
            transfer.items.map((item) => (
              <View key={item.transferItemId} style={styles.itemRow}>
                <View style={styles.headerText}>
                  <AppText bold>{item.itemCode}</AppText>
                  <AppText variant="caption" color={theme.colors.mutedText}>
                    Estado item: {item.itemStatus || '—'}
                  </AppText>
                  {item.itemQrCode ? (
                    <AppText variant="caption" color={theme.colors.mutedText}>
                      QR: {item.itemQrCode}
                    </AppText>
                  ) : null}
                </View>

                <AppText
                  bold
                  color={
                    item.receivedAt
                      ? theme.colors.success
                      : theme.colors.warning
                  }
                >
                  {item.receivedAt ? 'Recibida' : 'Pendiente'}
                </AppText>
              </View>
            ))
          )}
        </AppCard>

        {isTransferReceivable(transfer) && !isDestinationUser ? (
          <AppCard>
            <AppText color={theme.colors.mutedText}>
              Esta transferencia está en tránsito. La recepción solo corresponde
              a la sucursal destino.
            </AppText>
          </AppCard>
        ) : null}

        {pendingItems.length === 0 && transfer.status === 'RECEIVED' ? (
          <AppCard>
            <AppText color={theme.colors.success} bold>
              Transferencia recibida completamente.
            </AppText>
          </AppCard>
        ) : null}
      </AppScreen>

      <QRScannerModal
        visible={isScannerVisible}
        onClose={() => setIsScannerVisible(false)}
        onScanned={handleScanned}
      />

      <AppBottomModal
        visible={isAddItemModalVisible}
        title="Agregar prenda"
        onClose={() => setIsAddItemModalVisible(false)}
        scroll={false}
      >
        <AppInput
          placeholder="Buscar por código, tipo, marca, talla o lote"
          value={itemSearch}
          onChangeText={setItemSearch}
        />

        <FlatList
          data={availableToAdd}
          style={styles.modalList}
          keyExtractor={(item) => String(item.id)}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <AppOptionRow
              title={item.code}
              subtitle={`${item.productTypeName || 'Sin tipo'} · ${
                item.brandName || 'Sin marca'
              } · ${item.sizeName || 'Sin talla'}`}
              onPress={() => handleAddItem(item)}
            />
          )}
          ListEmptyComponent={
            <AppText color={theme.colors.mutedText}>
              No hay prendas disponibles para agregar.
            </AppText>
          }
        />
      </AppBottomModal>

      <AppBottomModal
        visible={isCancelModalVisible}
        title="Cancelar transferencia"
        onClose={() => setIsCancelModalVisible(false)}
      >
        <AppInput
          label="Motivo"
          placeholder="Motivo de cancelación"
          value={cancelReason}
          onChangeText={setCancelReason}
          multiline
        />

        <AppButton
          title="Confirmar cancelación"
          variant="danger"
          onPress={handleCancel}
          loading={actionLoading}
          disabled={actionLoading}
        />
      </AppBottomModal>
    </>
  );
}

const styles = StyleSheet.create({
  buttonFill: {
    flex: 1,
    minWidth: 130,
  },
  buttonGroup: {
    gap: 10,
    marginTop: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
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
  itemRow: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 12,
  },
  modalList: {
    maxHeight: 420,
  },
  progress: {
    marginTop: 10,
  },
  statusPill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});
