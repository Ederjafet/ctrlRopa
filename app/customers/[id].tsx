import AppBackButton from '@/components/ui/AppBackButton';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';

import {
    Customer,
    CustomerStatus,
    getCustomerById,
    updateCustomer,
} from '@/services/customerService';

import {
    CustomerAddress,
    getCustomerAddresses,
    updateCustomerAddress,
} from '@/services/customerAddressService';

import { canAccessByPermission } from '@/services/accessControl';
import { getSession } from '@/services/sessionStorage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, View } from 'react-native';

function getCustomerStatusLabel(status?: CustomerStatus) {
  return status === 'INACTIVE' ? 'Inactivo' : 'Activo';
}

function getAddressStatusLabel(status?: string) {
  return status === 'INACTIVE' ? 'Inactiva' : 'Activa';
}

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [defaultAddressId, setDefaultAddressId] = useState<number | null>(null);
  const [canEditCustomer, setCanEditCustomer] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setIsLoading(true);

      const session = await getSession();
      if (!session || !canAccessByPermission(session, 'VIEW_CUSTOMERS')) {
        router.replace('/access-denied' as any);
        return;
      }

      setCanEditCustomer(canAccessByPermission(session, 'EDIT_CUSTOMER'));

      const customerId = Number(id);

      const [customerData, addressData] = await Promise.all([
        getCustomerById(customerId),
        getCustomerAddresses(customerId),
      ]);

      setCustomer(customerData);
      setAddresses(addressData);

      setName(customerData.name || '');
      setPhone(customerData.phone || '');
      setEmail(customerData.email || '');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo cargar el cliente.');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Validación', 'Captura el nombre.');
      return false;
    }

    if (!phone.trim()) {
      Alert.alert('Validación', 'Captura el teléfono.');
      return false;
    }

    return true;
  };

  const buildPayload = (status?: CustomerStatus) => {
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
  };

  const handleSave = async () => {
    if (!customer) return;
    if (!canEditCustomer) {
      router.replace('/access-denied' as any);
      return;
    }
    if (!validateForm()) return;

    const payload = buildPayload();
    if (!payload) return;

    try {
      setIsSaving(true);

      const updated = await updateCustomer(customer.id, payload);
      setCustomer(updated);

      Alert.alert('Éxito', 'Cliente actualizado.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo actualizar.');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmStatusChange = (message: string) => {
    if (Platform.OS === 'web') {
      return window.confirm(message);
    }

    return true;
  };

  const handleToggleStatus = async () => {
    if (!customer) return;
    if (!canEditCustomer) {
      router.replace('/access-denied' as any);
      return;
    }
    if (!validateForm()) return;

    const nextStatus: CustomerStatus =
      customer.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';

    const actionText = nextStatus === 'ACTIVE' ? 'activar' : 'desactivar';

    const confirmed = confirmStatusChange(
      `¿Deseas ${actionText} este cliente?`
    );

    if (!confirmed) return;

    const payload = buildPayload(nextStatus);
    if (!payload) return;

    try {
      setIsChangingStatus(true);

      const updated = await updateCustomer(customer.id, payload);
      setCustomer(updated);

      Alert.alert(
        'Éxito',
        `Cliente ${getCustomerStatusLabel(updated.status).toLowerCase()}.`
      );
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo cambiar el estado.');
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handleSetDefaultAddress = async (address: CustomerAddress) => {
    if (address.isDefault) return;
    if (!canEditCustomer) {
      router.replace('/access-denied' as any);
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
        country: address.country ?? 'México',
        isDefault: true,
        status: address.status ?? 'ACTIVE',
      });

      Alert.alert('Dirección', 'Dirección principal actualizada.');
      await loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo marcar como principal.');
    } finally {
      setDefaultAddressId(null);
    }
  };

  if (isLoading || !customer) {
    return (
      <AppScreen>
        <ActivityIndicator />
      </AppScreen>
    );
  }

  const isInactive = customer.status === 'INACTIVE';

  return (
    <AppScreen>
      <AppBackButton fallbackRoute="/customers" preferHistory={false} />

      <AppText variant="title" bold>
        Cliente
      </AppText>

      <AppCard>
        <View style={styles.statusRow}>
          <AppText bold>Estado</AppText>
          <AppText color={isInactive ? '#b00020' : '#2e7d32'} bold>
            {getCustomerStatusLabel(customer.status)}
          </AppText>
        </View>
      </AppCard>

      <AppCard>
        <AppInput
          label="Nombre"
          value={name}
          onChangeText={setName}
          editable={canEditCustomer}
        />

        <AppInput
          label="Teléfono"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          editable={canEditCustomer}
        />

        <AppInput
          label="Correo"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={canEditCustomer}
        />

        {canEditCustomer ? (
          <AppButton
            title="Guardar cambios"
            onPress={handleSave}
            loading={isSaving}
          />
        ) : null}
      </AppCard>

      <AppCard>
        <AppText variant="subtitle" bold>
          Operación
        </AppText>

        <AppButton
          title="Pedidos del cliente"
          variant="secondary"
          onPress={() =>
            router.push({
              pathname: '/customer-orders',
              params: {
                customerId: String(customer.id),
                returnTo: `/customers/${customer.id}`,
              },
            } as any)
          }
        />
      </AppCard>

      <AppCard>
        <AppText variant="subtitle" bold>
          Direcciones
        </AppText>

        {addresses.length === 0 ? (
          <AppText color="#666666">Sin direcciones registradas.</AppText>
        ) : (
          addresses.map((addr) => (
            <View key={addr.id} style={styles.address}>
              <View style={styles.addressHeader}>
                <AppText bold>{addr.label}</AppText>

                {addr.isDefault ? (
                  <View style={styles.defaultBadge}>
                    <AppText variant="caption" color="#2e7d32" bold>
                      Principal
                    </AppText>
                  </View>
                ) : null}
              </View>

              <AppText>{addr.line1}</AppText>
              {addr.line2 ? <AppText>{addr.line2}</AppText> : null}

              <AppText>
                {[addr.city, addr.state].filter(Boolean).join(', ') ||
                  'Sin ciudad/estado'}
              </AppText>

              <AppText>{addr.postalCode || 'Sin código postal'}</AppText>

              {canEditCustomer ? (
              <View style={styles.addressAction}>
                <AppButton
                    title="Editar"
                    variant="secondary"
                    onPress={() =>
                    router.push(
                        `/customer-addresses/${addr.id}?customerId=${customer.id}` as any
                    )
                    }
                />
                </View>
              ) : null}

              {canEditCustomer && !addr.isDefault ? (
                <View style={styles.addressAction}>
                  <AppButton
                    title="Marcar como principal"
                    variant="secondary"
                    onPress={() => handleSetDefaultAddress(addr)}
                    loading={defaultAddressId === addr.id}
                  />
                </View>
              ) : null}
            </View>
          ))
        )}

        {canEditCustomer ? (
        <AppButton
          title="Nueva dirección"
          variant="secondary"
          onPress={() =>
            router.push(`/customer-addresses-create?customerId=${customer.id}` as any)
          }
        />
        ) : null}
      </AppCard>

      {canEditCustomer ? (
      <AppButton
        title={isInactive ? 'Activar cliente' : 'Desactivar cliente'}
        variant={isInactive ? 'primary' : 'danger'}
        onPress={handleToggleStatus}
        loading={isChangingStatus}
      />
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  address: {
    marginTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#e9f5e9',
    borderRadius: 8,
  },
  addressAction: {
    marginTop: 10,
  },
});
