import AppShellPage from '@/components/layout/AppShellPage';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';

import { ApiError } from '@/services/apiClient';
import { hasAnyPermission } from '@/services/accessControl';
import { getItemStatusLabel } from '@/services/itemLabels';
import { getItemsByBranch, Item, ItemStatus } from '@/services/itemService';
import { getSession } from '@/services/sessionStorage';

import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

type InventoryStatusFilter = 'ALL' | ItemStatus;

const statusFilters: { labelKey: string; value: InventoryStatusFilter }[] = [
  { labelKey: 'operationalScreens.items.filterAll', value: 'ALL' },
  { labelKey: 'operationalScreens.items.filterAvailable', value: 'AVAILABLE' },
  { labelKey: 'operationalScreens.items.filterReserved', value: 'RESERVED' },
  { labelKey: 'operationalScreens.items.filterSold', value: 'SOLD' },
];

export default function ItemsScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { t } = useTranslation('common');

  const [items, setItems] = useState<Item[]>([]);
  const [filtered, setFiltered] = useState<Item[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InventoryStatusFilter>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [])
  );

  useEffect(() => {
    filterItems();
  }, [search, items, statusFilter]);

  const loadItems = async () => {
    const session = await getSession();
    if (!session) return;

    if (!hasAnyPermission(session, ['VIEW_INVENTORY', 'MANAGE_INVENTORY'])) {
      router.replace('/access-denied' as any);
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const data = await getItemsByBranch(session.branchId);
      setItems(data);
      setFiltered(data);
    } catch (err: any) {
      if (err instanceof ApiError && err.suppressUserNotification) {
        return;
      }
      const message = err?.message || 'No se pudo cargar el inventario.';
      setError(message);
      Alert.alert('Inventario', message);
    } finally {
      setIsLoading(false);
    }
  };

  const filterItems = () => {
    const text = search.toLowerCase().trim();
    const byStatus =
      statusFilter === 'ALL'
        ? items
        : items.filter((item) => item.status === statusFilter);

    if (!text) {
      setFiltered(byStatus);
      return;
    }

    const result = byStatus.filter((item) => {
      const content = `
        ${item.code ?? ''}
        ${item.productTypeName ?? ''}
        ${item.brandName ?? ''}
        ${item.sizeName ?? ''}
        ${item.batchFolio ?? ''}
        ${item.storageLocationName ?? ''}
      `.toLowerCase();

      return content.includes(text);
    });

    setFiltered(result);
  };

  const formatMoney = (value?: number | null) => {
    if (value === null || value === undefined) return t('operationalScreens.shared.noPrice');
    return `$${value.toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return theme.colors.success;
      case 'SOLD':
        return theme.colors.textMuted;
      case 'RESERVED':
        return theme.colors.danger;
      case 'ON_CONSIGNMENT':
        return theme.colors.accent;
      case 'DISABLED':
        return theme.colors.mutedText;
      default:
        return theme.colors.mutedText;
    }
  };

  const goToCreateItem = () => {
    router.push({
      pathname: '/items-create',
      params: { returnTo: '/items' },
    } as any);
  };

  if (isLoading) {
    return (
      <AppShellPage
        title={t('navigation.items.itemsInventory')}
        subtitle={t('operationalScreens.items.subtitle')}
        activeRoute="items"
      >
        <ActivityIndicator />
      </AppShellPage>
    );
  }

  return (
    <AppShellPage
      title={t('navigation.items.itemsInventory')}
      subtitle={t('operationalScreens.items.subtitle')}
      activeRoute="items"
      rightContent={
        <AppButton title={t('operationalScreens.items.createItem')} onPress={goToCreateItem} />
      }
    >

      <AppInput
        placeholder={t('operationalScreens.items.searchPlaceholder')}
        value={search}
        onChangeText={setSearch}
      />

      {error ? (
        <AppCard style={{ borderColor: theme.colors.danger }}>
          <AppText color={theme.colors.danger}>{error}</AppText>
        </AppCard>
      ) : null}

      <View style={styles.filterRow}>
        {statusFilters.map((filter) => (
          <View key={filter.value} style={styles.filterButton}>
            <AppButton
              title={t(filter.labelKey)}
              variant={statusFilter === filter.value ? 'primary' : 'secondary'}
              onPress={() => setStatusFilter(filter.value)}
            />
          </View>
        ))}
      </View>

      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        keyboardShouldPersistTaps="handled"
        refreshing={isLoading}
        onRefresh={loadItems}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/items/[id]',
                params: { id: String(item.id), returnTo: '/items' },
              } as any)
            }
          >
            <AppCard>
              <AppText bold>{item.code}</AppText>

              <AppText>
                {item.productTypeName || t('operationalScreens.shared.noType')} ·{' '}
                {item.brandName || t('operationalScreens.shared.noBrand')} ·{' '}
                {item.sizeName || t('operationalScreens.shared.noSize')}
              </AppText>

              <View style={styles.metaBlock}>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  {t('operationalScreens.items.batch')}: {item.batchFolio || t('operationalScreens.items.noBatch')}
                </AppText>

                <AppText variant="caption" color={theme.colors.mutedText}>
                  {t('operationalScreens.items.location')}: {item.storageLocationName || t('operationalScreens.items.noLocation')}
                </AppText>
              </View>

              <View style={styles.row}>
                <AppText>{formatMoney(item.price)}</AppText>

                <AppText
                  style={{
                    color: getStatusColor(item.status),
                    fontWeight: 'bold',
                  }}
                >
                  {getItemStatusLabel(item.status)}
                </AppText>
              </View>

              <AppText
                variant="caption"
                color={theme.colors.mutedText}
                style={styles.hint}
              >
                {t('operationalScreens.items.tapDetail')}
              </AppText>
            </AppCard>
          </Pressable>
        )}
        ListEmptyComponent={
          <AppCard>
            <AppText>{t('operationalScreens.items.noInventory')}</AppText>
            <View style={styles.emptyAction}>
              <AppButton title={t('operationalScreens.items.createFirst')} onPress={goToCreateItem} />
            </View>
          </AppCard>
        }
      />
    </AppShellPage>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  filterButton: {
    flexGrow: 1,
    minWidth: 120,
  },
  metaBlock: {
    marginTop: 6,
    gap: 2,
  },
  row: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hint: {
    marginTop: 8,
  },
  emptyAction: {
    marginTop: 12,
  },
});
