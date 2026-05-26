import AppBackButton from '@/components/ui/AppBackButton';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppResponsiveGrid from '@/components/ui/AppResponsiveGrid';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';

import { canAccessByPermission } from '@/services/accessControl';
import { createCustomer } from '@/services/customerService';
import { getSession } from '@/services/sessionStorage';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert } from 'react-native';

export default function CustomersCreateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string | string[] }>();
  const returnTo = Array.isArray(params.returnTo)
    ? params.returnTo[0]
    : params.returnTo;
  const returnRoute = returnTo || '/customers';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      const session = await getSession();

      if (!session || !canAccessByPermission(session, 'CREATE_CUSTOMER')) {
        router.replace('/access-denied' as any);
        return;
      }

      setIsCheckingAccess(false);
    };

    checkAccess();
  }, [router]);

  const handleSave = async () => {
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      Alert.alert('Validación', 'Captura el nombre del cliente.');
      return;
    }

    if (!cleanPhone) {
      Alert.alert('Validación', 'Captura el teléfono del cliente.');
      return;
    }

    const session = await getSession();

    if (!session) {
      Alert.alert('Sesión', 'No se encontró sesión activa.');
      return;
    }

    if (!canAccessByPermission(session, 'CREATE_CUSTOMER')) {
      router.replace('/access-denied' as any);
      return;
    }

    try {
      setIsSaving(true);

      const customer = await createCustomer(session.branchId, {
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail || null,
        ownerUserId: session.userId,
        createdByUserId: session.userId,
        isGeneric: false,
        genericType: null,
        status: 'ACTIVE',
      });

      Alert.alert('Cliente', 'Cliente creado correctamente.');
      router.replace(
        returnTo ? (returnRoute as any) : (`/customers/${customer.id}` as any)
      );
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo crear el cliente.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isCheckingAccess) {
    return (
      <AppScreen>
        <ActivityIndicator />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <AppBackButton fallbackRoute={returnRoute} preferHistory={false} />

      <AppText variant="title" bold>
        Nuevo cliente
      </AppText>

      <AppCard>
        <AppResponsiveGrid tabletColumns={2} desktopColumns={2}>
        <AppInput
          label="Nombre *"
          value={name}
          onChangeText={setName}
          placeholder="Nombre del cliente"
        />

        <AppInput
          label="Teléfono *"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="Teléfono"
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

        <AppButton
          title="Guardar cliente"
          onPress={handleSave}
          loading={isSaving}
        />
      </AppCard>
    </AppScreen>
  );
}
