import AppShellPage from '@/components/layout/AppShellPage';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppText from '@/components/ui/AppText';
import ScreenPermissionHeaderAction from '@/components/ui/ScreenPermissionHeaderAction';
import { useAppTheme } from '@/context/AppThemeContext';
import { canAccessByPermission } from '@/services/accessControl';
import { createCustomerAddress, getCustomerAddresses } from '@/services/customerAddressService';
import { Customer, getCustomerById } from '@/services/customerService';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

type FormErrors = Partial<Record<'label' | 'line1' | 'city' | 'state' | 'postalCode' | 'country', string>>;

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function isValidId(value?: string) {
  return Boolean(value && /^\d+$/.test(value));
}

function confirmReplacePrimary(message: string) {
  if (Platform.OS === 'web') return window.confirm(message);
  return true;
}

export default function CustomerAddressesCreateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ customerId?: string | string[]; returnTo?: string | string[] }>();
  const { theme } = useAppTheme();

  const customerIdParam = firstParam(params.customerId);
  const returnRoute = firstParam(params.returnTo);
  const validCustomerId = isValidId(customerIdParam);
  const numericCustomerId = validCustomerId ? Number(customerIdParam) : null;
  const fallbackRoute = numericCustomerId ? `/customers/${numericCustomerId}` : '/customers';
  const backRoute = returnRoute || fallbackRoute;

  const [session, setSession] = useState<UserSession | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [hasPrimaryAddress, setHasPrimaryAddress] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [label, setLabel] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Mexico');
  const [isDefault, setIsDefault] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [notice, setNotice] = useState<{ tone: 'success' | 'warning' | 'danger'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [customerIdParam]);

  const canEditCustomer = canAccessByPermission(session, 'EDIT_CUSTOMER');

  const readinessMessage = useMemo(() => {
    if (!validCustomerId) return 'El identificador de cliente no es valido.';
    if (!canEditCustomer) return 'No tienes permiso para crear direcciones. Permiso requerido: EDIT_CUSTOMER.';
    if (!label.trim()) return 'Captura una etiqueta para identificar la direccion.';
    if (!line1.trim()) return 'Captura calle, numero y colonia.';
    if (!city.trim()) return 'Captura ciudad o municipio.';
    if (!stateName.trim()) return 'Captura estado.';
    if (!postalCode.trim()) return 'Captura codigo postal.';
    if (!country.trim()) return 'Captura pais.';
    return 'Lista para guardar.';
  }, [canEditCustomer, city, country, label, line1, postalCode, stateName, validCustomerId]);

  async function loadData() {
    try {
      setIsLoading(true);
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

      if (!numericCustomerId) return;

      const [customerData, addresses] = await Promise.all([
        getCustomerById(numericCustomerId),
        getCustomerAddresses(numericCustomerId),
      ]);

      setCustomer(customerData);
      setHasPrimaryAddress(addresses.some((address) => address.status !== 'INACTIVE' && address.isDefault));
      setIsDefault(!addresses.some((address) => address.status !== 'INACTIVE' && address.isDefault));
    } catch (error: any) {
      setNotice({ tone: 'danger', message: error.message || 'No se pudo cargar el cliente.' });
    } finally {
      setIsLoading(false);
    }
  }

  function validateForm() {
    const nextErrors: FormErrors = {};
    if (!label.trim()) nextErrors.label = 'Captura una etiqueta.';
    if (!line1.trim()) nextErrors.line1 = 'Captura calle, numero y colonia.';
    if (!city.trim()) nextErrors.city = 'Captura ciudad o municipio.';
    if (!stateName.trim()) nextErrors.state = 'Captura estado.';
    if (!postalCode.trim()) nextErrors.postalCode = 'Captura codigo postal.';
    if (!country.trim()) nextErrors.country = 'Captura pais.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSave() {
    if (!numericCustomerId || !validCustomerId) {
      setNotice({ tone: 'danger', message: 'Cliente no valido.' });
      return;
    }

    if (!canEditCustomer) {
      setNotice({
        tone: 'warning',
        message: 'No tienes permiso para crear direcciones. Permiso requerido: EDIT_CUSTOMER.',
      });
      return;
    }

    if (!validateForm()) {
      setNotice({ tone: 'warning', message: readinessMessage });
      return;
    }

    if (isDefault && hasPrimaryAddress) {
      const confirmed = confirmReplacePrimary('Este cliente ya tiene direccion principal. Deseas reemplazarla?');
      if (!confirmed) return;
    }

    try {
      setIsSaving(true);
      await createCustomerAddress(numericCustomerId, {
        label: label.trim(),
        line1: line1.trim(),
        line2: line2.trim() || null,
        city: city.trim(),
        state: stateName.trim(),
        postalCode: postalCode.trim(),
        country: country.trim(),
        isDefault,
        status: 'ACTIVE',
      });

      setNotice({ tone: 'success', message: 'Direccion guardada correctamente.' });
      setTimeout(() => router.replace(backRoute as any), 650);
    } catch (error: any) {
      setNotice({ tone: 'danger', message: error.message || 'No se pudo crear la direccion.' });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <AppShellPage title="Nueva direccion" subtitle="Direccion de envio del cliente" activeRoute="customers" session={session}>
        <ActivityIndicator />
      </AppShellPage>
    );
  }

  if (!validCustomerId) {
    return (
      <AppShellPage title="Cliente no valido" subtitle="No se pudo abrir la direccion" activeRoute="customers" session={session}>
        <AppCard variant="warning">
          <AppText bold>Cliente no valido.</AppText>
          <AppText color={theme.colors.mutedText}>Revisa la ruta o vuelve a la lista de clientes.</AppText>
        </AppCard>
        <AppButton title="Volver a clientes" variant="secondary" onPress={() => router.replace('/customers' as any)} />
      </AppShellPage>
    );
  }

  return (
    <AppShellPage
      title="Nueva direccion"
      subtitle={customer ? `Cliente: ${customer.name}` : 'Direccion de envio del cliente'}
      activeRoute="customers"
      session={session}
      rightContent={
        <View style={styles.headerActions}>
          <ScreenPermissionHeaderAction screenKey="customerAddressesCreate" screenTitle="Direccion del cliente" session={session} />
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

      <AppCard variant={canEditCustomer ? 'info' : 'warning'}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionText}>
            <AppText variant="subtitle" bold>Direccion guardada del cliente</AppText>
            <AppText color={theme.colors.mutedText}>
              Sirve como base para paquetes. Cada paquete conserva una copia exacta de la direccion usada en su envio.
            </AppText>
          </View>
          <AppText color={canEditCustomer ? theme.colors.success : theme.colors.warning} bold>
            {canEditCustomer ? 'Editable' : 'Bloqueada'}
          </AppText>
        </View>
      </AppCard>

      <View style={styles.contentGrid}>
        <View style={styles.mainColumn}>
          <AppCard>
            <AppText variant="subtitle" bold>Datos de direccion</AppText>
            <AppInput label="Etiqueta *" value={label} onChangeText={setLabel} placeholder="Casa, Trabajo, Mama, Oficina" error={errors.label} editable={canEditCustomer && !isSaving} />
            <AppInput label="Calle, numero y colonia *" value={line1} onChangeText={setLine1} placeholder="Calle 1 #123, Col. Centro" error={errors.line1} editable={canEditCustomer && !isSaving} />
            <AppInput label="Interior / referencias cortas" value={line2} onChangeText={setLine2} placeholder="Depto, piso, entre calles" editable={canEditCustomer && !isSaving} />
            <View style={styles.twoColumns}>
              <View style={styles.fieldColumn}>
                <AppInput label="Ciudad / municipio *" value={city} onChangeText={setCity} error={errors.city} editable={canEditCustomer && !isSaving} />
              </View>
              <View style={styles.fieldColumn}>
                <AppInput label="Estado *" value={stateName} onChangeText={setStateName} error={errors.state} editable={canEditCustomer && !isSaving} />
              </View>
            </View>
            <View style={styles.twoColumns}>
              <View style={styles.fieldColumn}>
                <AppInput label="Codigo postal *" value={postalCode} onChangeText={setPostalCode} keyboardType="numeric" error={errors.postalCode} editable={canEditCustomer && !isSaving} />
              </View>
              <View style={styles.fieldColumn}>
                <AppInput label="Pais *" value={country} onChangeText={setCountry} error={errors.country} editable={canEditCustomer && !isSaving} />
              </View>
            </View>
          </AppCard>
        </View>

        <View style={styles.sideColumn}>
          <AppCard>
            <AppText variant="subtitle" bold>Uso operativo</AppText>
            <AppText color={theme.colors.mutedText}>
              El destinatario y telefono final se capturan en el paquete cuando se define direccion y envio.
            </AppText>
            <AppButton
              title={`${isDefault ? '[x]' : '[ ]'} Marcar como principal`}
              variant={isDefault ? 'operation' : 'neutral'}
              onPress={() => setIsDefault((current) => !current)}
              disabled={!canEditCustomer || isSaving}
              disabledReason="No tienes permiso para cambiar la direccion principal. Permiso requerido: EDIT_CUSTOMER."
              style={styles.actionButton}
            />
            <AppText variant="caption" color={theme.colors.mutedText}>
              {hasPrimaryAddress && isDefault
                ? 'Al guardar se desmarcara la direccion principal anterior.'
                : 'Solo una direccion puede quedar como principal.'}
            </AppText>
          </AppCard>

          <AppCard variant={!canEditCustomer ? 'warning' : readinessMessage === 'Lista para guardar.' ? 'success' : 'subtle'}>
            <AppText variant="subtitle" bold>Estado</AppText>
            <AppText>{readinessMessage}</AppText>
            <AppButton
              title="Guardar direccion"
              onPress={handleSave}
              loading={isSaving}
              disabled={!canEditCustomer || isSaving}
              disabledReason={readinessMessage}
              style={styles.actionButton}
            />
            <AppButton title="Cancelar" variant="secondary" onPress={() => router.replace(backRoute as any)} style={styles.actionButton} />
          </AppCard>
        </View>
      </View>
    </AppShellPage>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
  },
  sectionHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  sectionText: {
    flex: 1,
    gap: 4,
  },
  contentGrid: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  mainColumn: {
    flex: 2,
    minWidth: 320,
  },
  sideColumn: {
    flex: 1,
    minWidth: 280,
  },
  twoColumns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  fieldColumn: {
    flex: 1,
    minWidth: 180,
  },
  actionButton: {
    marginTop: 12,
  },
});
