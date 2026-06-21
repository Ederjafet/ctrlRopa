import AppShellPage from '@/components/layout/AppShellPage';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppNoticeDropdown from '@/components/ui/AppNoticeDropdown';
import AppOptionRow from '@/components/ui/AppOptionRow';
import ScreenPermissionHeaderAction from '@/components/ui/ScreenPermissionHeaderAction';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { getBalanceByPackageFolio, type BalanceSummary } from '@/services/balanceService';
import { getPaymentMethods, type PaymentMethod } from '@/services/catalogService';
import {
  addCustomerPackageItemByCode,
  addCustomerPackageItemByQr,
  canMarkCustomerPackageReady,
  cancelCustomerPackage,
  CustomerPackageDetail,
  CustomerPackageItemLine,
  getCustomerPackageDetail,
  getCustomerPackageDetailByFolio,
  isCustomerPackageOpen,
  markCustomerPackageReady,
} from '@/services/customerPackageService';
import { getItemsByBranch, Item } from '@/services/itemService';
import { createPaymentByPackageFolio } from '@/services/paymentService';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

function money(value?: number | null) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function formatDate(value?: string | null) {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function statusLabel(status?: string) {
  if (status === 'OPEN') return 'Abierto';
  if (status === 'READY') return 'Listo para envio';
  if (status === 'SHIPPED') return 'Enviado';
  if (status === 'DELIVERED') return 'Entregado';
  if (status === 'CANCELLED') return 'Cancelado';
  if (status === 'ACTIVE') return 'Activo';
  if (status === 'SOLD') return 'Vendido';
  return status || 'Sin estado';
}

function paymentStatusLabel(status?: string) {
  if (status === 'PAID') return 'Pagado';
  if (status === 'PARTIAL') return 'Parcial';
  if (status === 'PENDING') return 'Pendiente';
  if (status === 'UNPAID') return 'Pendiente';
  return status || 'Sin estado';
}

function sourceTypeLabel(type?: string) {
  if (type === 'SALE') return 'Venta';
  if (type === 'RESERVATION') return 'Apartado';
  return type || 'Movimiento';
}

function PackageLabel({ detail }: { detail: CustomerPackageDetail }) {
  return (
    <View style={styles.labelBox}>
      <QRCode value={detail.folio} size={130} backgroundColor="#ffffff" color="#000000" />
      <Text style={[styles.labelText, styles.labelFolio]}>{detail.folio}</Text>
      <Text style={styles.labelText}>{detail.customerName}</Text>
      <Text style={styles.labelText}>Items: {detail.totalItems ?? 0}</Text>
      <Text style={styles.labelText}>Estado: {statusLabel(detail.status)}</Text>
    </View>
  );
}

function ItemLine({ item }: { item: CustomerPackageItemLine }) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.itemRow, { borderBottomColor: theme.colors.border }]}> 
      <AppText bold>{item.itemCode || `Item #${item.itemId}`}</AppText>
      <AppText>Origen: {sourceTypeLabel(item.sourceType)}</AppText>
      <AppText>Tipo: {item.productType || 'Sin tipo'}</AppText>
      {item.brand ? <AppText>Marca: {item.brand}</AppText> : null}
      {item.size ? <AppText>Talla: {item.size}</AppText> : null}
      <AppText>Precio: {money(item.price)}</AppText>
      <AppText>Pagado: {money(item.paidAmount)}</AppText>
      <AppText>Pendiente: {money(item.pendingAmount)}</AppText>
      <AppText>Estado origen: {statusLabel(item.sourceStatus)}</AppText>
      <AppText color={theme.colors.mutedText}>Agregado: {formatDate(item.createdAt)}</AppText>
    </View>
  );
}

export default function CustomerPackageDetailScreen() {
  const router = useRouter();
  const { id, folio } = useLocalSearchParams<{ id?: string; folio?: string }>();
  const { theme } = useAppTheme();

  const packageId = id ? Number(id) : null;

  const [session, setSession] = useState<UserSession | null>(null);
  const [detail, setDetail] = useState<CustomerPackageDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [codeModalVisible, setCodeModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [itemSearchModalVisible, setItemSearchModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentMethodPickerVisible, setPaymentMethodPickerVisible] = useState(false);
  const [code, setCode] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<number | null>(null);
  const [cancelNotes, setCancelNotes] = useState('');
  const [branchItems, setBranchItems] = useState<Item[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [balanceSummary, setBalanceSummary] = useState<BalanceSummary | null>(null);
  const [notice, setNotice] = useState<{
    title: string;
    message: string;
    tone: 'success' | 'warning' | 'danger' | 'info';
  } | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const currentSession = await getSession();

      if (!currentSession) {
        router.replace('/login');
        return;
      }

      setSession(currentSession);

      const packageDetail = packageId
        ? await getCustomerPackageDetail(packageId)
        : await getCustomerPackageDetailByFolio(String(folio || ''));

      setDetail(packageDetail);
      const [itemsData, methodsData, balanceData] = await Promise.all([
        getItemsByBranch(packageDetail.branchId),
        getPaymentMethods(packageDetail.branchId),
        getBalanceByPackageFolio(packageDetail.folio),
      ]);
      setBranchItems(itemsData);
      setPaymentMethods(methodsData);
      setSelectedPaymentMethodId((current) => current ?? methodsData[0]?.id ?? null);
      setBalanceSummary(balanceData);
    } catch (error: any) {
      Alert.alert('Paquete', error.message || 'No se pudo cargar el paquete.');
    } finally {
      setIsLoading(false);
    }
  }, [folio, packageId, router]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const fallbackRoute = useMemo(() => {
    if (detail?.customerId) return `/customer-packages?customerId=${detail.customerId}`;
    return '/customer-packages';
  }, [detail?.customerId]);

  const canEdit = isCustomerPackageOpen(detail);
  const canReady = canMarkCustomerPackageReady(detail);
  const hasPending = Number(detail?.pendingAmount ?? 0) > 0;
  const filteredBranchItems = useMemo(() => {
    const term = itemSearch.trim().toLowerCase();
    const existingItemIds = new Set((detail?.items ?? []).map((item) => item.itemId));

    return branchItems
      .filter((item) => !existingItemIds.has(item.id))
      .filter((item) => item.status === 'AVAILABLE')
      .filter((item) => {
        if (!term) return true;
        return `${item.code ?? ''} ${item.qrCode ?? ''} ${item.productTypeName ?? ''} ${item.brandName ?? ''} ${item.sizeName ?? ''}`
          .toLowerCase()
          .includes(term);
      })
      .slice(0, 50);
  }, [branchItems, detail?.items, itemSearch]);

  const handleAddByCode = async () => {
    if (!detail) return;
    const cleanCode = code.trim();

    if (!cleanCode) {
      Alert.alert('Paquete', 'Captura el código del item.');
      return;
    }

    try {
      setIsWorking(true);
      const updated = await addCustomerPackageItemByCode(detail.folio, cleanCode);
      setDetail(updated);
      setCode('');
      setCodeModalVisible(false);
      setNotice({
        title: 'Prenda agregada',
        message: 'La prenda se agregó correctamente al paquete.',
        tone: 'success',
      });
    } catch (error: any) {
      setNotice({
        title: 'No se pudo agregar',
        message: error.message || 'No se pudo agregar la prenda al paquete.',
        tone: 'danger',
      });
    } finally {
      setIsWorking(false);
    }
  };

  const handleAddByQr = async () => {
    if (!detail) return;
    const cleanQr = qrCode.trim();

    if (!cleanQr) {
      Alert.alert('Paquete', 'Captura o escanea el QR del item.');
      return;
    }

    try {
      setIsWorking(true);
      const updated = await addCustomerPackageItemByQr(detail.folio, cleanQr);
      setDetail(updated);
      setQrCode('');
      setQrModalVisible(false);
      setNotice({
        title: 'Prenda agregada',
        message: 'La prenda se agregó correctamente al paquete.',
        tone: 'success',
      });
    } catch (error: any) {
      setNotice({
        title: 'No se pudo agregar',
        message: error.message || 'No se pudo agregar la prenda al paquete.',
        tone: 'danger',
      });
    } finally {
      setIsWorking(false);
    }
  };

  const handleAddSearchedItem = async (item: Item) => {
    if (!detail) return;

    try {
      setIsWorking(true);
      const updated = await addCustomerPackageItemByCode(detail.folio, item.code);
      setDetail(updated);
      setItemSearch('');
      setItemSearchModalVisible(false);
      setNotice({
        title: 'Prenda agregada',
        message: `${item.code} se agregó correctamente al paquete.`,
        tone: 'success',
      });
    } catch (error: any) {
      setNotice({
        title: 'No se pudo agregar',
        message:
          error.message ||
          'Revisa que la prenda pertenezca a la sucursal y este libre, vendida o apartada de forma valida.',
        tone: 'danger',
      });
    } finally {
      setIsWorking(false);
    }
  };

  const openPaymentModal = () => {
    if (!detail) return;

    if (!hasPending) {
      setNotice({
        title: 'Paquete liquidado',
        message: 'Este paquete no tiene saldo pendiente para registrar abono.',
        tone: 'info',
      });
      return;
    }

    setPaymentAmount(String(Number(detail.pendingAmount ?? 0).toFixed(2)));
    setPaymentReference(`Abono paquete ${detail.folio}`);
    setSelectedPaymentMethodId((current) => current ?? paymentMethods[0]?.id ?? null);
    setPaymentModalVisible(true);
  };

  const closePaymentModal = () => {
    if (isWorking) return;

    setPaymentModalVisible(false);
    setPaymentMethodPickerVisible(false);
    setPaymentAmount('');
    setPaymentReference('');
  };

  const handleRegisterPackagePayment = async () => {
    if (!detail || !session) return;

    const amount = Number(paymentAmount.replace(',', '.'));

    if (!selectedPaymentMethodId) {
      Alert.alert('Abono paquete', 'Selecciona un metodo de pago.');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Abono paquete', 'Captura un monto mayor a 0.');
      return;
    }

    try {
      setIsWorking(true);
      await createPaymentByPackageFolio(detail.folio, {
        amount,
        paymentMethodId: selectedPaymentMethodId,
        reference: paymentReference.trim() || `Abono paquete ${detail.folio}`,
        createdByUserId: session.userId,
      });

      const [updatedDetail, updatedBalance] = await Promise.all([
        getCustomerPackageDetail(detail.id),
        getBalanceByPackageFolio(detail.folio),
      ]);

      setDetail(updatedDetail);
      setBalanceSummary(updatedBalance);
      setPaymentModalVisible(false);
      setPaymentAmount('');
      setPaymentReference('');
      setNotice({
        title: 'Abono registrado',
        message: 'El pago se aplico al paquete. Si hubo sobrepago, quedo como saldo a favor del cliente.',
        tone: 'success',
      });
      Alert.alert(
        'Abono registrado',
        'El pago se aplico al paquete. Si hubo sobrepago, quedo como saldo a favor del cliente.'
      );
    } catch (error: any) {
      Alert.alert('No se pudo registrar', error.message || 'No se pudo registrar el abono del paquete.');
      setNotice({
        title: 'No se pudo registrar',
        message: error.message || 'No se pudo registrar el abono del paquete.',
        tone: 'danger',
      });
    } finally {
      setIsWorking(false);
    }
  };

  const handleMarkReady = async () => {
    if (!detail || !session) return;

    if (!canReady) {
      setNotice({
        title: 'Falta completar el paquete',
        message: hasPending
          ? 'Antes de marcar listo para envio, liquida el saldo pendiente del paquete.'
          : 'Antes de marcar listo para envio, agrega al menos una prenda al paquete.',
        tone: 'warning',
      });
      return;
    }

    Alert.alert('Marcar listo para envio', `¿Quieres marcar el paquete ${detail.folio} como listo para envio?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Marcar listo',
        onPress: async () => {
          try {
            setIsWorking(true);
            const updated = await markCustomerPackageReady(detail.id, session.userId);
            setDetail(updated);
            setNotice({
              title: 'Paquete listo para envio',
              message: 'El paquete quedo listo para envio. Ya puede agregarse a Envios.',
              tone: 'success',
            });
          } catch (error: any) {
            setNotice({
              title: 'No se pudo marcar listo',
              message: error.message || 'No se pudo marcar el paquete como listo.',
              tone: 'danger',
            });
          } finally {
            setIsWorking(false);
          }
        },
      },
    ]);
  };

  const handleCancel = async () => {
    if (!detail || !session) return;

    if (!cancelNotes.trim()) {
      Alert.alert('Paquete', 'Captura el motivo de cancelación.');
      return;
    }

    try {
      setIsWorking(true);
      const updated = await cancelCustomerPackage(detail.id, cancelNotes.trim(), session.userId);
      setDetail(updated);
      setCancelModalVisible(false);
      setCancelNotes('');
    } catch (error: any) {
      Alert.alert('Paquete', error.message || 'No se pudo cancelar el paquete.');
    } finally {
      setIsWorking(false);
    }
  };

  if (isLoading || !detail) {
    return (
      <AppShellPage
        title="Detalle de paquete"
        subtitle="Preparacion, etiqueta y prendas"
        activeRoute="customer-packages"
      >
        <ActivityIndicator />
      </AppShellPage>
    );
  }

  const items = detail.items ?? [];
  const shipments = detail.shipments ?? [];

  return (
    <AppShellPage
      title={`Paquete ${detail.folio}`}
      subtitle="Preparacion, etiqueta y prendas"
      activeRoute="customer-packages"
      rightContent={
        <View style={styles.actionBarButtons}>
          <ScreenPermissionHeaderAction
            screenKey="customerPackageDetail"
            screenTitle="Detalle de paquete"
            session={session}
            buttonStyle={styles.compactActionButton}
          />
          <AppButton
            title="Volver"
            variant="secondary"
            onPress={() => router.replace(fallbackRoute as any)}
            style={styles.compactActionButton}
          />
        </View>
      }
    >
      {notice ? (
        <AppNoticeDropdown
          title={notice.title}
          message={notice.message}
          tone={notice.tone}
          onClose={() => setNotice(null)}
        />
      ) : null}

      <AppCard style={styles.actionBarCard}>
        <View style={styles.actionBarHeader}>
          <View style={styles.actionBarIdentity}>
            <AppText variant="caption" color={theme.colors.mutedText}>
              Paquete {detail.folio} - Cliente
            </AppText>
            <AppText variant="subtitle" bold numberOfLines={1}>
              {detail.customerName || 'Sin cliente'}
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              Total {money(detail.totalAmount)} - Abonado {money(detail.paidAmount)} - Saldo {money(detail.pendingAmount)}
            </AppText>
            <AppText
              variant="caption"
              color={Number(balanceSummary?.balance ?? 0) > 0 ? theme.colors.success : theme.colors.mutedText}
            >
              Saldo a favor cliente: {money(balanceSummary?.balance)}
            </AppText>
          </View>
          <View style={styles.actionBarButtons}>
            <AppButton
              title="Registrar abono"
              variant="operation"
              onPress={openPaymentModal}
              disabled={!hasPending || isWorking}
              disabledReason={
                !hasPending
                  ? 'El paquete ya esta liquidado.'
                  : 'Ya hay una accion en proceso.'
              }
              style={styles.compactActionButton}
            />
            <AppButton
              title="Aplicar saldo a favor"
              variant="neutral"
              disabled
              disabledReason="Pendiente: aplicar saldo a paquete requiere trazabilidad especifica paquete-saldo."
              style={styles.compactActionButton}
            />
          </View>
        </View>
      </AppCard>

      <AppCard>
        <View style={styles.summaryRow}>
          <AppText bold>Cliente</AppText>
          <AppText>{detail.customerName || 'Sin cliente'}</AppText>
        </View>
        <View style={styles.summaryRow}>
          <AppText bold>Teléfono</AppText>
          <AppText>{detail.customerPhone || 'Sin teléfono'}</AppText>
        </View>
        <View style={styles.summaryRow}>
          <AppText bold>Sucursal</AppText>
          <AppText>{detail.branchName || detail.branchCode || 'Sin sucursal'}</AppText>
        </View>
        <View style={styles.summaryRow}>
          <AppText bold>Estado</AppText>
          <AppText bold>{statusLabel(detail.status)}</AppText>
        </View>
        <View style={styles.summaryRow}>
          <AppText bold>Pago</AppText>
          <AppText>{paymentStatusLabel(detail.paymentStatus)}</AppText>
        </View>
        <View style={styles.summaryRow}>
          <AppText bold>Fecha</AppText>
          <AppText>{formatDate(detail.createdAt)}</AppText>
        </View>
        {detail.notes ? <AppText>Notas: {detail.notes}</AppText> : null}
      </AppCard>

      <AppCard>
        <AppText variant="subtitle" bold>
          Resumen
        </AppText>
        <View style={styles.summaryRow}>
          <AppText>Prendas</AppText>
          <AppText>{detail.totalItems ?? items.length}</AppText>
        </View>
        <View style={styles.summaryRow}>
          <AppText>Total</AppText>
          <AppText>{money(detail.totalAmount)}</AppText>
        </View>
        <View style={styles.summaryRow}>
          <AppText>Pagado</AppText>
          <AppText>{money(detail.paidAmount)}</AppText>
        </View>
        <View style={styles.summaryRow}>
          <AppText bold>Pendiente</AppText>
          <AppText bold color={hasPending ? theme.colors.danger : theme.colors.success}>
            {money(detail.pendingAmount)}
          </AppText>
        </View>
        <View style={styles.summaryRow}>
          <AppText>Saldo a favor cliente</AppText>
          <AppText bold color={Number(balanceSummary?.balance ?? 0) > 0 ? theme.colors.success : theme.colors.mutedText}>
            {money(balanceSummary?.balance)}
          </AppText>
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="subtitle" bold>
          Etiqueta del paquete
        </AppText>
        <PackageLabel detail={detail} />
      </AppCard>

      {canEdit ? (
        <AppCard>
          <AppText variant="subtitle" bold>
            Agregar prendas
          </AppText>
          <AppText color={theme.colors.mutedText}>
            Agrega prendas pagadas, apartadas o libres por búsqueda, código o QR. Si la prenda está libre, queda apartada para este cliente y bloqueada contra venta doble.
          </AppText>

          <View style={styles.actions}>
            <AppButton title="Buscar prenda" onPress={() => setItemSearchModalVisible(true)} />
            <AppButton title="Agregar por código" variant="secondary" onPress={() => setCodeModalVisible(true)} />
            <AppButton title="Agregar por QR" variant="secondary" onPress={() => setQrModalVisible(true)} />
            <AppButton
              title="Alta rapida"
              variant="neutral"
              disabled
              disabledReason="Disponible en siguiente fase: alta rapida directa desde paquete con cliente formal."
            />
          </View>
        </AppCard>
      ) : null}

      <AppCard>
        <AppText variant="subtitle" bold>
          Prendas del paquete
        </AppText>
        {items.length === 0 ? (
          <AppText color={theme.colors.mutedText}>Este paquete todavía no tiene prendas.</AppText>
        ) : (
          items.map((item) => <ItemLine key={item.id} item={item} />)
        )}
      </AppCard>

      {shipments.length > 0 ? (
        <AppCard>
          <AppText variant="subtitle" bold>
            Envíos asociados
          </AppText>
          {shipments.map((shipment) => (
            <View
              key={shipment.shipmentPackageId}
              style={[styles.itemRow, { borderBottomColor: theme.colors.border }]}
            >
              <AppText bold>{shipment.shipmentFolio || `Envío #${shipment.shipmentId}`}</AppText>
              <AppText>Estado envío: {statusLabel(shipment.shipmentStatus)}</AppText>
              <AppText>Estado paquete: {statusLabel(shipment.packageShipmentStatus)}</AppText>
              <AppText>Modo cobro: {shipment.paymentMode || 'Sin modo'}</AppText>
              <AppText>Por cobrar: {money(shipment.expectedCollectionAmount)}</AppText>
              <AppText>Cobrado: {money(shipment.collectedAmount)}</AppText>
            </View>
          ))}
        </AppCard>
      ) : null}

      {canEdit ? (
        <View style={styles.bottomActions}>
          <AppButton
            title="Marcar listo para envio"
            onPress={handleMarkReady}
            loading={isWorking}
            disabled={isWorking}
          />
          {hasPending ? (
            <AppText variant="caption" color={theme.colors.danger}>
              Para marcar listo para envio, el paquete no debe tener saldo pendiente.
            </AppText>
          ) : null}
          <AppButton
            title="Cancelar paquete"
            variant="danger"
            onPress={() => setCancelModalVisible(true)}
            disabled={isWorking}
          />
        </View>
      ) : null}

      <AppBottomModal
        visible={codeModalVisible}
        title="Agregar por código"
        onClose={() => setCodeModalVisible(false)}
      >
        <AppInput
          label="Código de item"
          value={code}
          onChangeText={setCode}
          placeholder="Ej. IT-0001"
          autoCapitalize="characters"
        />
        <AppButton title="Agregar" onPress={handleAddByCode} loading={isWorking} disabled={isWorking} />
      </AppBottomModal>

      <AppBottomModal
        visible={qrModalVisible}
        title="Agregar por QR"
        onClose={() => setQrModalVisible(false)}
      >
        <AppInput
          label="QR del item"
          value={qrCode}
          onChangeText={setQrCode}
          placeholder="Escanea o captura el QR"
          autoCapitalize="characters"
        />
        <AppButton title="Agregar" onPress={handleAddByQr} loading={isWorking} disabled={isWorking} />
      </AppBottomModal>

      <AppBottomModal
        visible={itemSearchModalVisible}
        title="Buscar prenda"
        onClose={() => setItemSearchModalVisible(false)}
        scroll={false}
      >
        <AppInput
          label="Búsqueda"
          value={itemSearch}
          onChangeText={setItemSearch}
          placeholder="Código, QR, tipo, marca o talla"
          autoCapitalize="characters"
        />

        <FlatList
          data={filteredBranchItems}
          style={styles.modalList}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <AppOptionRow
              title={item.code}
              subtitle={`${item.productTypeName || 'Sin tipo'} | ${item.brandName || 'Sin marca'} | ${item.sizeName || 'Sin talla'} | ${item.status}`}
              onPress={() => handleAddSearchedItem(item)}
            />
          )}
          ListEmptyComponent={
            <AppText color={theme.colors.mutedText}>
              No hay prendas que coincidan con la búsqueda.
            </AppText>
          }
        />
      </AppBottomModal>

      <AppBottomModal
        visible={paymentModalVisible}
        title="Registrar abono"
        onClose={closePaymentModal}
      >
        <AppCard variant="subtle">
          <View style={styles.summaryRow}>
            <AppText>Paquete</AppText>
            <AppText bold>{detail.folio}</AppText>
          </View>
          <View style={styles.summaryRow}>
            <AppText>Pendiente actual</AppText>
            <AppText bold color={theme.colors.danger}>{money(detail.pendingAmount)}</AppText>
          </View>
          <View style={styles.summaryRow}>
            <AppText>Saldo a favor</AppText>
            <AppText>{money(balanceSummary?.balance)}</AppText>
          </View>
        </AppCard>

        <AppInput
          label="Monto"
          value={paymentAmount}
          onChangeText={setPaymentAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />
        <AppInput
          label="Referencia"
          value={paymentReference}
          onChangeText={setPaymentReference}
          placeholder="Referencia opcional"
        />

        <View style={styles.compactSelector}>
          <AppText variant="caption" color={theme.colors.mutedText} bold>
            Método de pago
          </AppText>
          <AppButton
            title={
              paymentMethods.find((method) => method.id === selectedPaymentMethodId)?.name ||
              'Seleccionar método'
            }
            variant="secondary"
            onPress={() => setPaymentMethodPickerVisible((current) => !current)}
            disabled={paymentMethods.length === 0 || isWorking}
            disabledReason="No hay métodos de pago activos para esta sucursal."
          />
          {paymentMethodPickerVisible ? (
            <View style={styles.paymentMethodsList}>
              {paymentMethods.map((method) => {
                const selected = selectedPaymentMethodId === method.id;

                return (
                  <AppOptionRow
                    key={method.id}
                    title={`${selected ? '[x] ' : ''}${method.name}`}
                    subtitle={method.code || 'Método activo'}
                    onPress={() => {
                      setSelectedPaymentMethodId(method.id);
                      setPaymentMethodPickerVisible(false);
                    }}
                  />
                );
              })}
            </View>
          ) : null}
        </View>

        <AppButton
          title="Registrar abono"
          variant="operation"
          onPress={handleRegisterPackagePayment}
          loading={isWorking}
          disabled={isWorking || !selectedPaymentMethodId}
          disabledReason="Selecciona metodo de pago y captura un monto valido."
        />
      </AppBottomModal>

      <AppBottomModal
        visible={cancelModalVisible}
        title="Cancelar paquete"
        onClose={() => setCancelModalVisible(false)}
      >
        <AppInput
          label="Motivo"
          value={cancelNotes}
          onChangeText={setCancelNotes}
          placeholder="Motivo de cancelación"
          multiline
        />
        <AppButton
          title="Confirmar cancelación"
          variant="danger"
          onPress={handleCancel}
          loading={isWorking}
          disabled={isWorking}
        />
      </AppBottomModal>
    </AppShellPage>
  );
}

const styles = StyleSheet.create({
  actionBarButtons: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
  },
  actionBarCard: {
    marginBottom: 12,
  },
  actionBarHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  actionBarIdentity: {
    flex: 1,
    gap: 3,
    minWidth: 220,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  actions: {
    gap: 10,
    marginTop: 12,
  },
  compactActionButton: {
    minHeight: 32,
    minWidth: 124,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  compactSelector: {
    gap: 8,
    marginBottom: 12,
  },
  bottomActions: {
    gap: 10,
  },
  itemRow: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  modalList: {
    maxHeight: 420,
  },
  paymentMethodsList: {
    gap: 8,
    marginBottom: 12,
    marginTop: 8,
  },
  labelBox: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dddddd',
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginTop: 12,
  },
  labelText: {
    color: '#000000',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  labelFolio: {
    marginTop: 12,
    marginBottom: 6,
    fontSize: 18,
    fontWeight: '700',
  },
});
