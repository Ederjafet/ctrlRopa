import AppBackButton from '@/components/ui/AppBackButton';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';

import {
    CustomerAddress,
    deactivateCustomerAddress,
    getCustomerAddresses,
    updateCustomerAddress,
} from '@/services/customerAddressService';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform } from 'react-native';

export default function CustomerAddressDetailScreen() {
  const { id, customerId } = useLocalSearchParams();
  const router = useRouter();

  const [address, setAddress] = useState<CustomerAddress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [label, setLabel] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('México');

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadAddress();
  }, []);

  const loadAddress = async () => {
    try {
      setIsLoading(true);

      const customer = Number(customerId);
      const addrId = Number(id);

      const list = await getCustomerAddresses(customer);
      const found = list.find((a) => a.id === addrId);

      if (!found) {
        Alert.alert('Error', 'Dirección no encontrada.');
        router.replace(`/customers/${customer}` as any);
        return;
      }

      setAddress(found);

      setLabel(found.label || '');
      setLine1(found.line1 || '');
      setLine2(found.line2 || '');
      setCity(found.city || '');
      setStateName(found.state || '');
      setPostalCode(found.postalCode || '');
      setCountry(found.country || 'México');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo cargar la dirección.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!address) return;

    if (!label.trim()) {
      Alert.alert('Validación', 'Captura la etiqueta.');
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

      await updateCustomerAddress(address.id, {
        label: label.trim(),
        line1: line1.trim(),
        line2: line2.trim() || null,
        city: city.trim(),
        state: stateName.trim(),
        postalCode: postalCode.trim(),
        country: country.trim(),
        isDefault: address.isDefault ?? false,
        status: address.status ?? 'ACTIVE',
      });

      Alert.alert('Éxito', 'Dirección actualizada.');
      router.replace(`/customers/${customerId}` as any);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo actualizar.');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = (message: string) => {
    if (Platform.OS === 'web') {
      return window.confirm(message);
    }
    return true;
  };

  const handleDeactivate = async () => {
    if (!address) return;

    const confirmed = confirmDelete('¿Desactivar esta dirección?');
    if (!confirmed) return;

    try {
      setIsDeleting(true);

      await deactivateCustomerAddress(address.id);

      Alert.alert('Éxito', 'Dirección desactivada.');
      router.replace(`/customers/${customerId}` as any);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo desactivar.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading || !address) {
    return (
      <AppScreen>
        <ActivityIndicator />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <AppBackButton fallbackRoute={`/customers/${customerId}`} preferHistory={false} />

      <AppText variant="title" bold>
        Dirección
      </AppText>

      <AppCard>
        <AppInput label="Etiqueta *" value={label} onChangeText={setLabel} />

        <AppInput label="Dirección *" value={line1} onChangeText={setLine1} />

        <AppInput label="Interior" value={line2} onChangeText={setLine2} />

        <AppInput label="Ciudad *" value={city} onChangeText={setCity} />

        <AppInput label="Estado *" value={stateName} onChangeText={setStateName} />

        <AppInput
          label="Código postal *"
          value={postalCode}
          onChangeText={setPostalCode}
        />

        <AppInput label="País *" value={country} onChangeText={setCountry} />

        <AppButton
          title="Guardar cambios"
          onPress={handleSave}
          loading={isSaving}
        />
      </AppCard>

      <AppButton
        title="Desactivar dirección"
        variant="danger"
        onPress={handleDeactivate}
        loading={isDeleting}
      />
    </AppScreen>
  );
}
