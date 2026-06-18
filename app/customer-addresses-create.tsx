import AppShellPage from '@/components/layout/AppShellPage';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppText from '@/components/ui/AppText';

import { createCustomerAddress } from '@/services/customerAddressService';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

export default function CustomerAddressesCreateScreen() {
  const router = useRouter();
  const { customerId } = useLocalSearchParams();

  const [label, setLabel] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('México');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const id = Number(customerId);

    if (!id) {
      Alert.alert('Error', 'No se encontró el cliente.');
      return;
    }

    if (!label.trim()) {
      Alert.alert('Validación', 'Captura una etiqueta para la dirección.');
      return;
    }

    if (!line1.trim()) {
      Alert.alert('Validación', 'Captura la dirección.');
      return;
    }

    if (!city.trim()) {
      Alert.alert('Validación', 'Captura la ciudad.');
      return;
    }

    if (!stateName.trim()) {
      Alert.alert('Validación', 'Captura el estado.');
      return;
    }

    if (!postalCode.trim()) {
      Alert.alert('Validación', 'Captura el código postal.');
      return;
    }

    if (!country.trim()) {
      Alert.alert('Validación', 'Captura el país.');
      return;
    }

    try {
      setIsSaving(true);

      await createCustomerAddress(id, {
        label: label.trim(),
        line1: line1.trim(),
        line2: line2.trim() || null,
        city: city.trim(),
        state: stateName.trim(),
        postalCode: postalCode.trim(),
        country: country.trim(),
        isDefault: false,
        status: 'ACTIVE',
      });

      Alert.alert('Dirección', 'Dirección creada correctamente.');
      router.replace(`/customers/${id}` as any);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo crear la dirección.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShellPage
      title="Nueva direccion"
      subtitle="Datos de entrega del cliente"
      activeRoute="customers"
      rightContent={
        <AppButton
          title="Volver"
          variant="secondary"
          onPress={() => router.replace(`/customers/${customerId}` as any)}
        />
      }
    >
      <AppText variant="title" bold>
        Nueva dirección
      </AppText>

      <AppCard>
        <AppInput
          label="Etiqueta *"
          value={label}
          onChangeText={setLabel}
          placeholder="Casa, trabajo, local, etc."
        />

        <AppInput
          label="Dirección *"
          value={line1}
          onChangeText={setLine1}
          placeholder="Calle, número, colonia"
        />

        <AppInput
          label="Interior / referencia"
          value={line2}
          onChangeText={setLine2}
          placeholder="Opcional"
        />

        <AppInput
          label="Ciudad *"
          value={city}
          onChangeText={setCity}
          placeholder="Ciudad"
        />

        <AppInput
          label="Estado *"
          value={stateName}
          onChangeText={setStateName}
          placeholder="Estado"
        />

        <AppInput
          label="Código postal *"
          value={postalCode}
          onChangeText={setPostalCode}
          keyboardType="numeric"
          placeholder="Código postal"
        />

        <AppInput
          label="País *"
          value={country}
          onChangeText={setCountry}
        />

        <AppButton
          title="Guardar dirección"
          onPress={handleSave}
          loading={isSaving}
        />
      </AppCard>
    </AppShellPage>
  );
}
