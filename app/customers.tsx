import AppBackButton from '@/components/ui/AppBackButton';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

import {
    Customer,
    getCustomersByBranch,
} from '@/services/customerService';

import { getSession } from '@/services/sessionStorage';

import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';

export default function CustomersScreen() {
  const router = useRouter();
  const { isPhone } = useResponsiveLayout();
  const listColumns = isPhone ? 1 : 2;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filtered, setFiltered] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadCustomers();
    }, [])
  );

  const loadCustomers = async () => {
    const session = await getSession();
    if (!session) return;

    try {
      setIsLoading(true);
      const data = await getCustomersByBranch(session.branchId);
      setCustomers(data);
      setFiltered(data);
    } finally {
      setIsLoading(false);
    }
  };

  const filterCustomers = (text: string) => {
    const query = text.toLowerCase();

    const result = customers.filter((customer) => {
      const content = `
        ${customer.name ?? ''}
        ${customer.phone ?? ''}
        ${customer.email ?? ''}
      `.toLowerCase();

      return content.includes(query);
    });

    setFiltered(result);
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    filterCustomers(text);
  };

  if (isLoading) {
    return (
      <AppScreen scroll={false}>
        <ActivityIndicator />
      </AppScreen>
    );
  }

  return (
    <AppScreen scroll={false}>
      <AppBackButton fallbackRoute="/" />

      <AppText variant="title" bold>
        Clientes
      </AppText>

      <AppButton
        title="Nuevo cliente"
        onPress={() => router.push('/customers-create' as any)}
      />

      <View style={styles.search}>
        <AppInput
          placeholder="Buscar por nombre, teléfono o correo"
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      <FlatList
        key={listColumns}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={listColumns > 1 ? styles.listColumns : undefined}
        numColumns={listColumns}
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Pressable
            style={styles.customerTile}
            onPress={() => router.push(`/customers/${item.id}` as any)}
          >
            <AppCard>
              <AppText bold>{item.name}</AppText>

              <AppText>
                {item.phone || 'Sin teléfono'} ·{' '}
                {item.email || 'Sin correo'}
              </AppText>

              {item.isGeneric ? (
                <AppText variant="caption" color="#666666">
                  Cliente genérico {item.genericType || ''}
                </AppText>
              ) : null}

              <AppText variant="caption" color="#666666" style={styles.hint}>
                Tocar para ver detalle
              </AppText>
            </AppCard>
          </Pressable>
        )}
        ListEmptyComponent={
          <AppText>No hay clientes registrados.</AppText>
        }
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  search: {
    marginTop: 12,
  },
  hint: {
    marginTop: 8,
  },
  customerTile: {
    flex: 1,
  },
  listColumns: {
    gap: 12,
  },
});
