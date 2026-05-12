import AppBackButton from '@/components/ui/AppBackButton';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';

import { getItemStatusLabel } from '@/services/itemLabels';
import { getItemsByBranch, Item, ItemStatus } from '@/services/itemService';
import { getSession } from '@/services/sessionStorage';

import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

type InventoryStatusFilter = 'ALL' | ItemStatus;

const statusFilters: Array<{ label: string; value: InventoryStatusFilter }> = [
  { label: 'Todo', value: 'ALL' },
  { label: 'Disponible', value: 'AVAILABLE' },
  { label: 'Reservado', value: 'RESERVED' },
  { label: 'Vendido', value: 'SOLD' },
];

export default function ItemsScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

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

    try {
      setIsLoading(true);
      setError('');
      const data = await getItemsByBranch(session.branchId);
      setItems(data);
      setFiltered(data);
    } catch (err: any) {
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
    if (value === null || value === undefined) return 'Sin precio';
    return `$${value.toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return '#2e7d32';
      case 'SOLD':
        return '#999999';
      case 'RESERVED':
        return '#f9a825';
      case 'ON_CONSIGNMENT':
        return '#7e57c2';
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
      <AppScreen scroll={false}>
        <ActivityIndicator />
      </AppScreen>
    );
  }

  return (
    <AppScreen scroll={false}>
      <AppBackButton fallbackRoute="/" />

      <View style={styles.headerRow}>
        <View style={styles.titleWrapper}>
          <AppText variant="title" bold>
            Inventario
          </AppText>
          <AppText variant="caption" color={theme.colors.mutedText}>
            Consulta prendas y da de alta nuevas piezas desde este módulo.
          </AppText>
        </View>
      </View>

      <View style={styles.createButtonWrapper}>
        <AppButton title="+ Alta prenda" onPress={goToCreateItem} />
      </View>

      <AppInput
        placeholder="Buscar por código, tipo, marca, talla, lote o ubicación"
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
              title={filter.label}
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
                {item.productTypeName || 'Sin tipo'} ·{' '}
                {item.brandName || 'Sin marca'} ·{' '}
                {item.sizeName || 'Sin talla'}
              </AppText>

              <View style={styles.metaBlock}>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  Lote: {item.batchFolio || 'Sin lote'}
                </AppText>

                <AppText variant="caption" color={theme.colors.mutedText}>
                  Ubicación: {item.storageLocationName || 'Sin ubicación'}
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
                Tocar para ver detalle
              </AppText>
            </AppCard>
          </Pressable>
        )}
        ListEmptyComponent={
          <AppCard>
            <AppText>No hay prendas en inventario.</AppText>
            <View style={styles.emptyAction}>
              <AppButton title="Crear primera prenda" onPress={goToCreateItem} />
            </View>
          </AppCard>
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
  headerRow: {
    marginBottom: 12,
  },
  titleWrapper: {
    flex: 1,
  },
  createButtonWrapper: {
    marginBottom: 12,
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
