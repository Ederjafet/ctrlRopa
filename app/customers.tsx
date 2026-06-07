import AppShell from '@/components/layout/AppShell';
import AppShellPage from '@/components/layout/AppShellPage';
import { buildMainNavSections, getSessionScopeLabel } from '@/components/layout/appNavigation';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppText from '@/components/ui/AppText';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { canAccessByPermission } from '@/services/accessControl';
import { getActionableApiErrorMessage } from '@/services/apiError';
import { ApiError } from '@/services/apiClient';
import { Customer, getCustomersByBranch } from '@/services/customerService';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

export default function CustomersScreen() {
  const router = useRouter();
  const { isPhone } = useResponsiveLayout();
  const { t } = useTranslation('common');
  const listColumns = isPhone ? 1 : 2;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filtered, setFiltered] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [canCreateCustomer, setCanCreateCustomer] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const navSections = useMemo(() => buildMainNavSections(session), [session]);

  useFocusEffect(
    useCallback(() => {
      loadCustomers();
    }, [])
  );

  const loadCustomers = async () => {
    const currentSession = await getSession();
    if (!currentSession) return;

    setSession(currentSession);

    if (!canAccessByPermission(currentSession, 'VIEW_CUSTOMERS')) {
      router.replace('/access-denied' as any);
      return;
    }

    setCanCreateCustomer(canAccessByPermission(currentSession, 'CREATE_CUSTOMER'));

    try {
      setIsLoading(true);
      setErrorMessage('');
      const data = await getCustomersByBranch(currentSession.branchId);
      setCustomers(data);
      setFiltered(data);
    } catch (err: any) {
      if (err instanceof ApiError && err.suppressUserNotification) {
        return;
      }
      setCustomers([]);
      setFiltered([]);
      setErrorMessage(getActionableApiErrorMessage(err, t));
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
      <AppShellPage
        title="Clientes"
        subtitle="Seguimiento comercial y datos de contacto"
        activeRoute="customers"
      >
        <ActivityIndicator />
      </AppShellPage>
    );
  }

  return (
    <AppShell
      title="Clientes"
      subtitle="Seguimiento comercial y datos de contacto"
      contextTitle="Cartera de clientes"
      contextSubtitle={getSessionScopeLabel(session)}
      activeRoute="customers"
      session={session}
      navSections={navSections}
      rightContent={
        canCreateCustomer ? (
          <AppButton
            title="Nuevo cliente"
            variant="secondary"
            onPress={() => router.push('/customers-create' as any)}
          />
        ) : null
      }
    >
      <View style={styles.search}>
        <AppInput
          placeholder="Buscar por nombre, telefono o correo"
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      {errorMessage ? (
        <AppCard variant="danger">
          <AppText>{errorMessage}</AppText>
          <AppButton
            title={t('errors.retry')}
            variant="secondary"
            onPress={loadCustomers}
            style={styles.retryButton}
          />
        </AppCard>
      ) : null}

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
            <AppCard variant="elevated" style={styles.customerCard}>
              <View style={styles.customerHeader}>
                <View style={styles.customerText}>
                  <AppText bold numberOfLines={2}>
                    {item.name}
                  </AppText>
                  <AppText numberOfLines={2}>
                    {item.phone || 'Sin telefono'} · {item.email || 'Sin correo'}
                  </AppText>
                </View>
                {item.isGeneric ? (
                  <StatusBadge label={`Generico ${item.genericType || ''}`.trim()} tone="info" />
                ) : null}
              </View>

              <AppText variant="caption" style={styles.hint}>
                Tocar para ver detalle
              </AppText>
            </AppCard>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            title="No hay clientes registrados"
            message="Cuando existan clientes, apareceran aqui."
          />
        }
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  customerCard: {
    minHeight: 126,
  },
  customerHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  customerText: {
    flex: 1,
    minWidth: 0,
  },
  customerTile: {
    flex: 1,
  },
  hint: {
    marginTop: 8,
  },
  list: {
    flex: 1,
  },
  listColumns: {
    gap: 12,
  },
  listContent: {
    gap: 12,
    paddingBottom: 24,
  },
  search: {
    marginBottom: 12,
  },
  retryButton: {
    marginTop: 12,
  },
});
