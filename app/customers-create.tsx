import AppShellPage from '@/components/layout/AppShellPage';
import ScreenPermissionHeaderAction from '@/components/ui/ScreenPermissionHeaderAction';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppResponsiveGrid from '@/components/ui/AppResponsiveGrid';
import AppText from '@/components/ui/AppText';
import { canAccessByPermission } from '@/services/accessControl';
import { getActionableApiErrorMessage } from '@/services/apiError';
import { createCustomer } from '@/services/customerService';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

export default function CustomersCreateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string | string[] }>();
  const returnTo = Array.isArray(params.returnTo) ? params.returnTo[0] : params.returnTo;
  const returnRoute = returnTo || '/customers';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [session, setSession] = useState<UserSession | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  const canCreateCustomer = canAccessByPermission(session, 'CREATE_CUSTOMER');

  useEffect(() => {
    const checkAccess = async () => {
      const currentSession = await getSession();
      setSession(currentSession);
      setIsCheckingAccess(false);
    };

    void checkAccess();
  }, []);

  const handleSave = async () => {
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      Alert.alert('Validacion', 'Captura el nombre del cliente.');
      return;
    }

    if (!cleanPhone) {
      Alert.alert('Validacion', 'Captura el telefono del cliente.');
      return;
    }

    const currentSession = await getSession();
    setSession(currentSession);

    if (!currentSession) {
      Alert.alert('Sesion', 'No se encontro sesion activa.');
      return;
    }

    if (!canAccessByPermission(currentSession, 'CREATE_CUSTOMER')) {
      setErrorMessage('No tienes permiso para crear clientes. Permiso requerido: CREATE_CUSTOMER.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage('');

      const customer = await createCustomer(currentSession.branchId, {
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail || null,
        ownerUserId: currentSession.userId,
        createdByUserId: currentSession.userId,
        isGeneric: false,
        genericType: null,
        status: 'ACTIVE',
      });

      Alert.alert('Cliente', 'Cliente creado correctamente.');
      router.replace(returnTo ? (returnRoute as any) : (`/customers/${customer.id}` as any));
    } catch (error) {
      const message = getActionableApiErrorMessage(error);
      setErrorMessage(message);
      Alert.alert('Error', message || 'No se pudo crear el cliente.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isCheckingAccess) {
    return (
      <AppShellPage
        title="Nuevo cliente"
        subtitle="Alta de cliente en la sucursal activa"
        activeRoute="customers"
        rightContent={
          <ScreenPermissionHeaderAction
            screenKey="customersCreate"
            screenTitle="Nuevo cliente"
            session={session}
          />
        }
      >
        <ActivityIndicator />
      </AppShellPage>
    );
  }

  return (
    <AppShellPage
      title="Nuevo cliente"
      subtitle="Alta de cliente en la sucursal activa"
      activeRoute="customers"
      rightContent={
        <View style={styles.headerActions}>
          <ScreenPermissionHeaderAction
            screenKey="customersCreate"
            screenTitle="Nuevo cliente"
            session={session}
          />
          <AppButton
            title="Volver"
            variant="secondary"
            onPress={() => router.replace(returnRoute as any)}
          />
        </View>
      }
    >
      {!canCreateCustomer ? (
        <AppCard variant="danger">
          <AppText bold>Acceso restringido</AppText>
          <AppText>
            No tienes permiso para crear clientes. Permiso requerido: CREATE_CUSTOMER.
          </AppText>
        </AppCard>
      ) : null}

      {errorMessage ? (
        <AppCard variant="danger">
          <AppText>{errorMessage}</AppText>
        </AppCard>
      ) : null}

      {canCreateCustomer ? (
        <AppCard>
          <AppResponsiveGrid tabletColumns={2} desktopColumns={2}>
            <AppInput
              label="Nombre *"
              value={name}
              onChangeText={setName}
              placeholder="Nombre del cliente"
            />

            <AppInput
              label="Telefono *"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="Telefono"
            />

            <AppInput
              label="Correo"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Opcional"
            />
          </AppResponsiveGrid>

          <AppButton title="Guardar cliente" onPress={handleSave} loading={isSaving} />
        </AppCard>
      ) : null}
    </AppShellPage>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
