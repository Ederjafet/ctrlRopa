import AppShellPage from '@/components/layout/AppShellPage';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppText from '@/components/ui/AppText';
import ScreenPermissionHeaderAction from '@/components/ui/ScreenPermissionHeaderAction';
import { useAppTheme } from '@/context/AppThemeContext';
import { canAccessByPermission } from '@/services/accessControl';
import { getCustomerBalance, type BalanceSummary } from '@/services/balanceService';
import {
  CustomerAddress,
  getCustomerAddresses,
  updateCustomerAddress,
} from '@/services/customerAddressService';
import {
  Customer,
  CustomerStatus,
  getCustomerById,
  updateCustomer,
} from '@/services/customerService';
import { CustomerOrder, getCustomerOrdersByCustomer } from '@/services/customerOrderService';
import {
  CustomerPackageDetail,
  getCustomerPackageDetailsByCustomer,
} from '@/services/customerPackageService';
import { getPaymentsByCustomer, type Payment } from '@/services/paymentService';
import { getReservationsByBranch, type Reservation } from '@/services/reservationService';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

type FormErrors = Partial<Record<'name' | 'phone', string>>;

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function isValidId(value?: string) {
  return Boolean(value && /^\d+$/.test(value));
}

function money(value?: number | null) {
  return `$${Number(value ?? 0).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} MXN`;
}

function formatDate(value?: string | null) {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('es-MX');
}

function customerStatusLabel(status?: CustomerStatus) {
  return status === 'INACTIVE' ? 'Inactivo' : 'Activo';
}

function packageStatusLabel(status?: string) {
  if (status === 'OPEN') return 'En preparacion';
  if (status === 'READY') return 'Listo para envio';
  if (status === 'SHIPPED') return 'Enviado';
  if (status === 'DELIVERED') return 'Entregado';
  if (status === 'CANCELLED') return 'Cancelado';
  return status || 'Sin estado';
}

function reservationStatusLabel(status?: string) {
  if (status === 'ACTIVE') return 'Activo';
  if (status === 'CANCELLED') return 'Cancelado';
  if (status === 'CONVERTED_TO_SALE') return 'Convertido a venta';
  if (status === 'COMPLETED') return 'Completado';
  return status || 'Sin estado';
}

function addressText(address?: CustomerAddress | null) {
  if (!address) return 'Sin direccion principal';
  return [address.line1, address.line2, address.city, address.state, address.postalCode]
    .filter(Boolean)
    .join(', ');
}

function confirmStatusChange(message: string) {
  if (Platform.OS === 'web') return window.confirm(message);
  return true;
}

async function safeLoad<T>(loader: Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader;
  } catch {
    return fallback;
  }
}

export default function CustomerDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[]; returnTo?: string | string[] }>();
  const idParam = firstParam(params.id);
  const returnRoute = firstParam(params.returnTo);
  const validCustomerId = isValidId(idParam);
  const customerId = validCustomerId ? Number(idParam) : null;
  const router = useRouter();
  const { theme } = useAppTheme();

  const [session, setSession] = useState<UserSession | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [packages, setPackages] = useState<CustomerPackageDetail[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [balanceSummary, setBalanceSummary] = useState<BalanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [notice, setNotice] = useState<{ tone: 'success' | 'warning' | 'danger'; message: string } | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [defaultAddressId, setDefaultAddressId] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [idParam])
  );

  const canEditCustomer = canAccessByPermission(session, 'EDIT_CUSTOMER');
  const canCreateReservation = canAccessByPermission(session, 'DO_DOOR_RESERVATION');
  const canViewPackages = canAccessByPermission(session, 'CREATE_CLOSE_CUSTOMER_PACKAGE');
  const canViewPayments = canAccessByPermission(session, 'VIEW_PAYMENTS');

  const activeAddresses = useMemo(
    () => addresses.filter((address) => address.status !== 'INACTIVE'),
    [addresses]
  );
  const primaryAddress = activeAddresses.find((address) => address.isDefault) ?? null;
  const activeReservations = useMemo(
    () => reservations.filter((reservation) => reservation.status === 'ACTIVE'),
    [reservations]
  );
  const activePackages = useMemo(
    () => packages.filter((item) => item.status === 'OPEN' || item.status === 'READY'),
    [packages]
  );
  const pendingPackages = useMemo(
    () => packages.filter((item) => Number(item.pendingAmount ?? 0) > 0),
    [packages]
  );
  const pendingAmount = useMemo(
    () => packages.reduce((sum, item) => sum + Number(item.pendingAmount ?? 0), 0),
    [packages]
  );
  const paidAmount = useMemo(
    () => packages.reduce((sum, item) => sum + Number(item.paidAmount ?? 0), 0),
    [packages]
  );
  const customerBalance = Number(balanceSummary?.balance ?? 0);
  const lastPackage = packages[0] ?? null;

  async function loadData() {
    try {
      setIsLoading(true);
      setNotice(null);

      const currentSession = await getSession();
      setSession(currentSession);

      if (!currentSession) {
        router.replace('/login' as any);
        return;
      }

      if (!canAccessByPermission(currentSession, 'VIEW_CUSTOMERS')) {
        router.replace('/access-denied' as any);
        return;
      }

      if (!customerId) return;

      const [customerData, addressData] = await Promise.all([
        getCustomerById(customerId),
        getCustomerAddresses(customerId),
      ]);

      const canLoadPackages = canAccessByPermission(currentSession, 'CREATE_CLOSE_CUSTOMER_PACKAGE');
      const canLoadPayments = canAccessByPermission(currentSession, 'VIEW_PAYMENTS');
      const canLoadReservations = canAccessByPermission(currentSession, 'DO_DOOR_RESERVATION');

      const [packageData, orderData, reservationData, balanceData, paymentData] = await Promise.all([
        canLoadPackages ? safeLoad(getCustomerPackageDetailsByCustomer(customerId), []) : Promise.resolve([]),
        safeLoad(getCustomerOrdersByCustomer(customerId), []),
        canLoadReservations
          ? safeLoad(getReservationsByBranch(currentSession.branchId), [])
          : Promise.resolve([]),
        canLoadPayments ? safeLoad(getCustomerBalance(customerId), null) : Promise.resolve(null),
        canLoadPayments ? safeLoad(getPaymentsByCustomer(customerId), []) : Promise.resolve([]),
      ]);

      setCustomer(customerData);
      setAddresses(addressData);
      setPackages(packageData);
      setOrders(orderData);
      setReservations(reservationData.filter((reservation) => reservation.customerId === customerId));
      setBalanceSummary(balanceData);
      setPayments(paymentData);
      setName(customerData.name || '');
      setPhone(customerData.phone || '');
      setEmail(customerData.email || '');
    } catch (error: any) {
      setNotice({ tone: 'danger', message: error.message || 'No se pudo cargar el cliente.' });
    } finally {
      setIsLoading(false);
    }
  }

  function validateForm() {
    const nextErrors: FormErrors = {};
    if (!name.trim()) nextErrors.name = 'Captura el nombre.';
    if (!phone.trim()) nextErrors.phone = 'Captura el telefono.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function buildPayload(status?: CustomerStatus) {
    if (!customer) return null;
    return {
      ownerUserId: customer.ownerUserId ?? null,
      createdByUserId: customer.createdByUserId,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || null,
      isGeneric: customer.isGeneric ?? false,
      genericType: customer.genericType ?? null,
      status: status ?? customer.status ?? 'ACTIVE',
    };
  }

  async function handleSave() {
    if (!customer) return;
    if (!canEditCustomer) {
      setNotice({ tone: 'warning', message: 'No tienes permiso para editar clientes. Permiso requerido: EDIT_CUSTOMER.' });
      return;
    }
    if (!validateForm()) return;

    const payload = buildPayload();
    if (!payload) return;

    try {
      setIsSaving(true);
      const updated = await updateCustomer(customer.id, payload);
      setCustomer(updated);
      setNotice({ tone: 'success', message: 'Cliente actualizado correctamente.' });
    } catch (error: any) {
      setNotice({ tone: 'danger', message: error.message || 'No se pudo actualizar el cliente.' });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleStatus() {
    if (!customer) return;
    if (!canEditCustomer) {
      setNotice({ tone: 'warning', message: 'No tienes permiso para editar clientes. Permiso requerido: EDIT_CUSTOMER.' });
      return;
    }
    if (!validateForm()) return;

    const nextStatus: CustomerStatus = customer.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
    const confirmed = confirmStatusChange(
      nextStatus === 'ACTIVE' ? 'Activar este cliente?' : 'Desactivar este cliente?'
    );
    if (!confirmed) return;

    const payload = buildPayload(nextStatus);
    if (!payload) return;

    try {
      setIsChangingStatus(true);
      const updated = await updateCustomer(customer.id, payload);
      setCustomer(updated);
      setNotice({ tone: 'success', message: `Cliente ${customerStatusLabel(updated.status).toLowerCase()}.` });
    } catch (error: any) {
      setNotice({ tone: 'danger', message: error.message || 'No se pudo cambiar el estado.' });
    } finally {
      setIsChangingStatus(false);
    }
  }

  async function handleSetDefaultAddress(address: CustomerAddress) {
    if (address.isDefault) return;
    if (!canEditCustomer) {
      setNotice({ tone: 'warning', message: 'No tienes permiso para cambiar direcciones. Permiso requerido: EDIT_CUSTOMER.' });
      return;
    }

    try {
      setDefaultAddressId(address.id);
      await updateCustomerAddress(address.id, {
        label: address.label,
        line1: address.line1,
        line2: address.line2 ?? null,
        city: address.city ?? null,
        state: address.state ?? null,
        postalCode: address.postalCode ?? null,
        country: address.country ?? 'Mexico',
        isDefault: true,
        status: address.status ?? 'ACTIVE',
      });

      setNotice({ tone: 'success', message: 'Direccion principal actualizada.' });
      await loadData();
    } catch (error: any) {
      setNotice({ tone: 'danger', message: error.message || 'No se pudo marcar como principal.' });
    } finally {
      setDefaultAddressId(null);
    }
  }

  if (isLoading) {
    return (
      <AppShellPage title="Cliente" subtitle="Cliente 360" activeRoute="customers" session={session}>
        <ActivityIndicator />
      </AppShellPage>
    );
  }

  if (!validCustomerId || !customer) {
    return (
      <AppShellPage title="Cliente no valido" subtitle="No se pudo abrir la ficha" activeRoute="customers" session={session}>
        <AppCard variant="warning">
          <AppText bold>Cliente no valido.</AppText>
          <AppText color={theme.colors.mutedText}>
            La ruta debe usar un identificador numerico, por ejemplo `/customers/4`.
          </AppText>
        </AppCard>
        <AppButton title="Volver a clientes" variant="secondary" onPress={() => router.replace('/customers' as any)} />
      </AppShellPage>
    );
  }

  const isInactive = customer.status === 'INACTIVE';
  const backRoute = returnRoute || '/customers';
  const customerRoute = `/customers/${customer.id}`;
  const ordersRoute = `/customer-orders?customerId=${customer.id}&returnTo=${encodeURIComponent(customerRoute)}`;

  return (
    <AppShellPage
      title={customer.name}
      subtitle={`${customer.phone || 'Sin telefono'} - ${customer.branchName || 'Sucursal no disponible'}`}
      metadata={`Cliente #${customer.id}`}
      activeRoute="customers"
      session={session}
      rightContent={
        <View style={styles.headerActions}>
          <ScreenPermissionHeaderAction screenKey="customerDetail" screenTitle="Cliente" session={session} />
          <AppButton title="Volver" variant="secondary" onPress={() => router.replace(backRoute as any)} />
        </View>
      }
      compactHeader
    >
      {notice ? (
        <AppCard variant={notice.tone}>
          <AppText>{notice.message}</AppText>
        </AppCard>
      ) : null}

      <AppCard variant={isInactive ? 'warning' : 'info'}>
        <View style={styles.heroRow}>
          <View style={styles.heroText}>
            <AppText variant="subtitle" bold>{customer.name}</AppText>
            <AppText color={theme.colors.mutedText}>
              {customer.phone || 'Sin telefono'}{customer.email ? ` - ${customer.email}` : ''}
            </AppText>
            <AppText color={theme.colors.mutedText}>
              Direccion principal: {addressText(primaryAddress)}
            </AppText>
          </View>
          <View style={[styles.badge, { backgroundColor: isInactive ? theme.colors.warningBackground : theme.colors.successBackground }]}>
            <AppText bold color={isInactive ? theme.colors.warning : theme.colors.success}>
              {customerStatusLabel(customer.status)}
            </AppText>
          </View>
        </View>
      </AppCard>

      <View style={styles.metricGrid}>
        <Metric label="Apartados activos" value={String(activeReservations.length)} tone={activeReservations.length > 0 ? 'warning' : 'default'} />
        <Metric label="Paquetes abiertos" value={String(activePackages.length)} tone={activePackages.length > 0 ? 'info' : 'default'} />
        <Metric label="Saldo pendiente" value={money(pendingAmount)} tone={pendingAmount > 0 ? 'warning' : 'success'} />
        <Metric label="Saldo a favor" value={money(customerBalance)} tone={customerBalance > 0 ? 'success' : 'default'} />
        <Metric label="Pagado en paquetes" value={money(paidAmount)} tone="default" />
        <Metric label="Direcciones" value={String(activeAddresses.length)} tone={activeAddresses.length > 0 ? 'success' : 'warning'} />
      </View>

      <View style={styles.contentGrid}>
        <View style={styles.mainColumn}>
          <AppCard>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionText}>
                <AppText variant="subtitle" bold>Datos de contacto</AppText>
                <AppText color={theme.colors.mutedText}>Informacion base para venta, apartados y paquetes.</AppText>
              </View>
              <AppText color={canEditCustomer ? theme.colors.success : theme.colors.warning} bold>
                {canEditCustomer ? 'Editable' : 'Solo lectura'}
              </AppText>
            </View>
            <AppInput label="Nombre" value={name} onChangeText={setName} editable={canEditCustomer && !isSaving} error={errors.name} />
            <View style={styles.twoColumns}>
              <View style={styles.fieldColumn}>
                <AppInput label="Telefono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" editable={canEditCustomer && !isSaving} error={errors.phone} />
              </View>
              <View style={styles.fieldColumn}>
                <AppInput label="Correo" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" editable={canEditCustomer && !isSaving} />
              </View>
            </View>
            {canEditCustomer ? (
              <AppButton title="Guardar cambios" onPress={handleSave} loading={isSaving} style={styles.actionButton} />
            ) : (
              <AppText color={theme.colors.mutedText}>No tienes permiso para editar clientes. Permiso requerido: EDIT_CUSTOMER.</AppText>
            )}
          </AppCard>

          <AppCard>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionText}>
                <AppText variant="subtitle" bold>Direcciones</AppText>
                <AppText color={theme.colors.mutedText}>
                  Pueden usarse como base; cada paquete conserva snapshot de la direccion final.
                </AppText>
              </View>
              <AppButton
                title="Agregar direccion"
                variant="secondary"
                onPress={() =>
                  router.push(`/customer-addresses-create?customerId=${customer.id}&returnTo=${encodeURIComponent(customerRoute)}` as any)
                }
                disabled={!canEditCustomer}
                disabledReason="No tienes permiso para crear direcciones. Permiso requerido: EDIT_CUSTOMER."
              />
            </View>

            {activeAddresses.length === 0 ? (
              <View style={styles.emptyBox}>
                <AppText bold>Este cliente no tiene direccion registrada.</AppText>
                <AppText color={theme.colors.mutedText}>Agrega una direccion para acelerar el flujo de envio por paquete.</AppText>
              </View>
            ) : (
              activeAddresses.map((address) => (
                <View key={address.id} style={[styles.addressRow, { borderColor: theme.colors.borderSubtle }]}>
                  <View style={styles.addressMain}>
                    <View style={styles.inlineTitle}>
                      <AppText bold>{address.label}</AppText>
                      {address.isDefault ? <StatusPill label="Principal" tone="success" /> : null}
                    </View>
                    <AppText>{addressText(address)}</AppText>
                    <AppText color={theme.colors.mutedText}>{address.country || 'Mexico'}</AppText>
                  </View>
                  <View style={styles.rowActions}>
                    <AppButton
                      title="Editar"
                      variant="secondary"
                      onPress={() =>
                        router.push(`/customer-addresses/${address.id}?customerId=${customer.id}&returnTo=${encodeURIComponent(customerRoute)}` as any)
                      }
                      disabled={!canEditCustomer}
                      disabledReason="No tienes permiso para editar direcciones. Permiso requerido: EDIT_CUSTOMER."
                    />
                    {!address.isDefault ? (
                      <AppButton
                        title="Principal"
                        variant="neutral"
                        onPress={() => handleSetDefaultAddress(address)}
                        loading={defaultAddressId === address.id}
                        disabled={!canEditCustomer}
                        disabledReason="No tienes permiso para cambiar la direccion principal. Permiso requerido: EDIT_CUSTOMER."
                      />
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </AppCard>

          <AppCard>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionText}>
                <AppText variant="subtitle" bold>Pedidos, paquetes y apartados</AppText>
                <AppText color={theme.colors.mutedText}>Actividad reciente del cliente.</AppText>
              </View>
              <AppButton title="Ver pedidos" variant="secondary" onPress={() => router.push(ordersRoute as any)} />
            </View>

            {lastPackage ? (
              <View style={[styles.packageRow, { borderColor: theme.colors.borderSubtle }]}>
                <View style={styles.addressMain}>
                  <AppText bold>{lastPackage.folio || `Paquete #${lastPackage.id}`}</AppText>
                  <AppText>{packageStatusLabel(lastPackage.status)} - {Number(lastPackage.totalItems ?? 0)} prendas</AppText>
                  <AppText color={theme.colors.mutedText}>
                    Total {money(lastPackage.totalAmount)} - Pendiente {money(lastPackage.pendingAmount)}
                  </AppText>
                </View>
                <AppButton
                  title="Ver paquete"
                  variant="secondary"
                  onPress={() =>
                    router.push(`/customer-package-detail?id=${lastPackage.id}&returnTo=${encodeURIComponent(customerRoute)}` as any)
                  }
                  disabled={!canViewPackages}
                  disabledReason="No tienes permiso para ver paquetes. Permiso requerido: CREATE_CLOSE_CUSTOMER_PACKAGE."
                />
              </View>
            ) : (
              <AppText color={theme.colors.mutedText}>Sin paquetes registrados para este cliente.</AppText>
            )}

            {activeReservations.slice(0, 3).map((reservation) => (
              <View key={reservation.id} style={[styles.compactLine, { borderColor: theme.colors.borderSubtle }]}>
                <AppText bold>Apartado #{reservation.id}</AppText>
                <AppText color={theme.colors.mutedText}>
                  {reservation.itemCode || `Prenda #${reservation.itemId}`} - {reservationStatusLabel(reservation.status)} - {money(reservation.price)}
                </AppText>
              </View>
            ))}
          </AppCard>
        </View>

        <View style={styles.sideColumn}>
          <AppCard>
            <AppText variant="subtitle" bold>Acciones rapidas</AppText>
            <View style={styles.actionStack}>
              <AppButton
                title="Nuevo apartado"
                variant="operation"
                onPress={() => router.push(`/door-reservation?customerId=${customer.id}` as any)}
                disabled={!canCreateReservation}
                disabledReason="No tienes permiso para crear apartados. Permiso requerido: DO_DOOR_RESERVATION."
              />
              <AppButton
                title="Paquetes del cliente"
                variant="secondary"
                onPress={() => router.push(`/customer-packages?customerId=${customer.id}` as any)}
                disabled={!canViewPackages}
                disabledReason="No tienes permiso para ver paquetes. Permiso requerido: CREATE_CLOSE_CUSTOMER_PACKAGE."
              />
              <AppButton title="Pedidos del cliente" variant="secondary" onPress={() => router.push(ordersRoute as any)} />
              <AppButton
                title="Agregar direccion"
                variant="secondary"
                onPress={() =>
                  router.push(`/customer-addresses-create?customerId=${customer.id}&returnTo=${encodeURIComponent(customerRoute)}` as any)
                }
                disabled={!canEditCustomer}
                disabledReason="No tienes permiso para crear direcciones. Permiso requerido: EDIT_CUSTOMER."
              />
            </View>
          </AppCard>

          <AppCard variant={pendingAmount > 0 ? 'warning' : 'success'}>
            <AppText variant="subtitle" bold>Saldo y pagos</AppText>
            <InfoLine label="Pendiente en paquetes" value={canViewPackages ? money(pendingAmount) : 'Sin permiso'} />
            <InfoLine label="Saldo a favor" value={canViewPayments ? money(customerBalance) : 'Sin permiso'} />
            <InfoLine label="Pagos visibles" value={canViewPayments ? String(payments.length) : 'Sin permiso'} />
            {canViewPayments && payments[0] ? (
              <AppText color={theme.colors.mutedText}>
                Ultimo pago: {money(payments[0].amount ?? payments[0].receivedAmount)} - {formatDate(payments[0].createdAt)}
              </AppText>
            ) : null}
          </AppCard>

          <AppCard>
            <AppText variant="subtitle" bold>Resumen operativo</AppText>
            <InfoLine label="Pedidos operativos" value={String(orders.length)} />
            <InfoLine label="Paquetes pendientes" value={String(pendingPackages.length)} />
            <InfoLine label="Apartados activos" value={String(activeReservations.length)} />
            <InfoLine label="Ultimo paquete" value={lastPackage ? `${lastPackage.folio || `#${lastPackage.id}`} - ${packageStatusLabel(lastPackage.status)}` : 'Sin paquete'} />
          </AppCard>

          {canEditCustomer ? (
            <AppButton
              title={isInactive ? 'Activar cliente' : 'Desactivar cliente'}
              variant={isInactive ? 'primary' : 'danger'}
              onPress={handleToggleStatus}
              loading={isChangingStatus}
            />
          ) : null}
        </View>
      </View>
    </AppShellPage>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: 'default' | 'success' | 'warning' | 'info' }) {
  const { theme } = useAppTheme();
  const color =
    tone === 'success'
      ? theme.colors.success
      : tone === 'warning'
        ? theme.colors.warning
        : tone === 'info'
          ? theme.colors.info
          : theme.colors.text;

  return (
    <View style={[styles.metric, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.borderSubtle }]}>
      <AppText variant="caption" color={theme.colors.mutedText}>{label}</AppText>
      <AppText bold color={color}>{value}</AppText>
    </View>
  );
}

function StatusPill({ label, tone }: { label: string; tone: 'success' | 'warning' | 'info' | 'default' }) {
  const { theme } = useAppTheme();
  const color =
    tone === 'success'
      ? theme.colors.success
      : tone === 'warning'
        ? theme.colors.warning
        : tone === 'info'
          ? theme.colors.info
          : theme.colors.textSecondary;

  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <AppText variant="caption" color={color} bold>{label}</AppText>
    </View>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.infoLine}>
      <AppText color={theme.colors.mutedText}>{label}</AppText>
      <AppText bold>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
  },
  heroRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  heroText: {
    flex: 1,
    gap: 4,
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  metric: {
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 150,
    padding: 12,
  },
  contentGrid: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  mainColumn: {
    flex: 2,
    minWidth: 340,
  },
  sideColumn: {
    flex: 1,
    minWidth: 280,
  },
  sectionHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionText: {
    flex: 1,
    gap: 4,
    minWidth: 220,
  },
  twoColumns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  fieldColumn: {
    flex: 1,
    minWidth: 190,
  },
  actionButton: {
    marginTop: 8,
  },
  emptyBox: {
    gap: 4,
    paddingVertical: 8,
  },
  addressRow: {
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  addressMain: {
    flex: 1,
    gap: 4,
    minWidth: 220,
  },
  inlineTitle: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rowActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  packageRow: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  compactLine: {
    borderBottomWidth: 1,
    gap: 4,
    paddingVertical: 10,
  },
  actionStack: {
    gap: 10,
  },
  infoLine: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginTop: 8,
  },
  pill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
});
