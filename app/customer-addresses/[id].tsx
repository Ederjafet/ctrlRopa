import AppShellPage from '@/components/layout/AppShellPage';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppText from '@/components/ui/AppText';
import ScreenPermissionHeaderAction from '@/components/ui/ScreenPermissionHeaderAction';
import { useAppTheme } from '@/context/AppThemeContext';
import { canAccessByPermission } from '@/services/accessControl';
import {
  CustomerAddress,
  deactivateCustomerAddress,
  getCustomerAddresses,
  updateCustomerAddress,
} from '@/services/customerAddressService';
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

function confirmAction(message: string) {
  if (Platform.OS === 'web') return window.confirm(message);
  return true;
}

export default function CustomerAddressDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[]; customerId?: string | string[]; returnTo?: string | string[] }>();
  const router = useRouter();
  const { theme } = useAppTheme();

  const idParam = firstParam(params.id);
  const customerIdParam = firstParam(params.customerId);
  const returnRoute = firstParam(params.returnTo);
  const validAddressId = isValidId(idParam);
  const validCustomerId = isValidId(customerIdParam);
  const addressId = validAddressId ? Number(idParam) : null;
  const customerId = validCustomerId ? Number(customerIdParam) : null;
  const backRoute = returnRoute || (customerId ? `/customers/${customerId}` : '/customers');

  const [session, setSession] = useState<UserSession | null>(null);
  const [address, setAddress] = useState<CustomerAddress | null>(null);
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
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadAddress();
  }, [idParam, customerIdParam]);

  const canEditCustomer = canAccessByPermission(session, 'EDIT_CUSTOMER');

  const readinessMessage = useMemo(() => {
    if (!validAddressId || !validCustomerId) return 'Direccion o cliente no valido.';
    if (!canEditCustomer) return 'No tienes permiso para editar direcciones. Permiso requerido: EDIT_CUSTOMER.';
    if (!label.trim()) return 'Captura una etiqueta.';
    if (!line1.trim()) return 'Captura calle, numero y colonia.';
    if (!city.trim()) return 'Captura ciudad o municipio.';
    if (!stateName.trim()) return 'Captura estado.';
    if (!postalCode.trim()) return 'Captura codigo postal.';
    if (!country.trim()) return 'Captura pais.';
    return 'Lista para guardar.';
  }, [canEditCustomer, city, country, label, line1, postalCode, stateName, validAddressId, validCustomerId]);

  async function loadAddress() {
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

      if (!addressId || !customerId) return;

      const list = await getCustomerAddresses(customerId);
      const found = list.find((item) => item.id === addressId);

      if (!found) {
        setNotice({ tone: 'danger', message: 'Direccion no encontrada.' });
        return;
      }

      setAddress(found);
      setLabel(found.label || '');
      setLine1(found.line1 || '');
      setLine2(found.line2 || '');
      setCity(found.city || '');
      setStateName(found.state || '');
      setPostalCode(found.postalCode || '');
      setCountry(found.country || 'Mexico');
      setIsDefault(Boolean(found.isDefault));
    } catch (error: any) {
      setNotice({ tone: 'danger', message: error.message || 'No se pudo cargar la direccion.' });
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
    if (!address) return;
    if (!canEditCustomer) {
      setNotice({ tone: 'warning', message: 'No tienes permiso para editar direcciones. Permiso requerido: EDIT_CUSTOMER.' });
      return;
    }
    if (!validateForm()) {
      setNotice({ tone: 'warning', message: readinessMessage });
      return;
    }

    if (isDefault && !address.isDefault) {
      const confirmed = confirmAction('Deseas marcar esta direccion como principal? La anterior dejara de ser principal.');
      if (!confirmed) return;
    }

    try {
      setIsSaving(true);
      await updateCustomerAddress(address.id, {
        label: label.trim(),
        line1: line1.trim(),
        line2: line2.trim() || null,
        city: city.trim(),
        state: stateName.trim(),
        postalCode: postalCode.trim(),
        country: country.trim(),
        isDefault,
        status: address.status ?? 'ACTIVE',
      });

      setNotice({ tone: 'success', message: 'Direccion actualizada correctamente.' });
      setTimeout(() => router.replace(backRoute as any), 650);
    } catch (error: any) {
      setNotice({ tone: 'danger', message: error.message || 'No se pudo actualizar la direccion.' });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeactivate() {
    if (!address) return;
    if (!canEditCustomer) {
      setNotice({ tone: 'warning', message: 'No tienes permiso para desactivar direcciones. Permiso requerido: EDIT_CUSTOMER.' });
      return;
    }

    const confirmed = confirmAction('Desactivar esta direccion?');
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await deactivateCustomerAddress(address.id);
      setNotice({ tone: 'success', message: 'Direccion desactivada correctamente.' });
      setTimeout(() => router.replace(backRoute as any), 650);
    } catch (error: any) {
      setNotice({ tone: 'danger', message: error.message || 'No se pudo desactivar la direccion.' });
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <AppShellPage title="Direccion" subtitle="Editar direccion del cliente" activeRoute="customers" session={session}>
        <ActivityIndicator />
      </AppShellPage>
    );
  }

  if (!validAddressId || !validCustomerId || !address) {
    return (
      <AppShellPage title="Direccion no valida" subtitle="No se pudo abrir la direccion" activeRoute="customers" session={session}>
        <AppCard variant="warning">
          <AppText bold>Direccion no valida.</AppText>
          <AppText color={theme.colors.mutedText}>Revisa la ruta o vuelve al cliente.</AppText>
        </AppCard>
        <AppButton title="Volver" variant="secondary" onPress={() => router.replace(backRoute as any)} />
      </AppShellPage>
    );
  }

  return (
    <AppShellPage
      title="Editar direccion"
      subtitle="Direccion guardada del cliente"
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

      <View style={styles.contentGrid}>
        <View style={styles.mainColumn}>
          <AppCard>
            <AppText variant="subtitle" bold>Datos de direccion</AppText>
            <AppInput label="Etiqueta *" value={label} onChangeText={setLabel} error={errors.label} editable={canEditCustomer && !isSaving} />
            <AppInput label="Calle, numero y colonia *" value={line1} onChangeText={setLine1} error={errors.line1} editable={canEditCustomer && !isSaving} />
            <AppInput label="Interior / referencias cortas" value={line2} onChangeText={setLine2} editable={canEditCustomer && !isSaving} />
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
          <AppCard variant={canEditCustomer ? 'info' : 'warning'}>
            <AppText variant="subtitle" bold>Uso operativo</AppText>
            <AppText color={theme.colors.mutedText}>
              Esta direccion puede usarse como base para paquetes. El paquete conservara su propio snapshot de envio.
            </AppText>
            <AppButton
              title={`${isDefault ? '[x]' : '[ ]'} Direccion principal`}
              variant={isDefault ? 'operation' : 'neutral'}
              onPress={() => setIsDefault((current) => !current)}
              disabled={!canEditCustomer || isSaving}
              disabledReason="No tienes permiso para cambiar la direccion principal. Permiso requerido: EDIT_CUSTOMER."
              style={styles.actionButton}
            />
          </AppCard>

          <AppCard variant={!canEditCustomer ? 'warning' : readinessMessage === 'Lista para guardar.' ? 'success' : 'subtle'}>
            <AppText variant="subtitle" bold>Estado</AppText>
            <AppText>{readinessMessage}</AppText>
            <AppButton title="Guardar cambios" onPress={handleSave} loading={isSaving} disabled={!canEditCustomer || isSaving} disabledReason={readinessMessage} style={styles.actionButton} />
            <AppButton title="Desactivar direccion" variant="danger" onPress={handleDeactivate} loading={isDeleting} disabled={!canEditCustomer || isDeleting} disabledReason="No tienes permiso para desactivar direcciones. Permiso requerido: EDIT_CUSTOMER." style={styles.actionButton} />
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
