import AppBackButton from '@/components/ui/AppBackButton';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import {
  CatalogEntity,
  activateCatalogItem,
  deactivateCatalogItem,
  getCatalogConfig,
  getPrimaryLabel,
  getSecondaryLabel,
  isActive,
  listCatalogItems,
} from '@/services/adminCatalogService';
import { getSession } from '@/services/sessionStorage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';

export default function CatalogListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ kind?: string }>();
  const config = useMemo(() => getCatalogConfig(params.kind), [params.kind]);
  const { theme } = useAppTheme();

  const [items, setItems] = useState<CatalogEntity[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [branchName, setBranchName] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [params.kind])
  );

  const loadItems = async () => {
    if (!config) return;

    const session = await getSession();
    if (!session) {
      router.replace('/login');
      return;
    }

    try {
      setIsLoading(true);
      setBranchName(session.branchName || null);
      const data = await listCatalogItems(config, session.branchId);
      setItems(data);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo cargar el catálogo.');
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;

    return items.filter((item) => {
      const content = `${item.code ?? ''} ${item.name ?? ''} ${item.description ?? ''} ${item.status ?? ''}`.toLowerCase();
      return content.includes(query);
    });
  }, [items, search]);

  const handleDeactivate = (item: CatalogEntity) => {
    if (!config) return;

    Alert.alert(
      'Desactivar',
      `¿Desactivar ${getPrimaryLabel(item)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deactivateCatalogItem(config, item.id);
              await loadItems();
            } catch (e: any) {
              Alert.alert('Error', e.message || 'No se pudo desactivar.');
            }
          },
        },
      ]
    );
  };


  const handleActivate = (item: CatalogEntity) => {
    if (!config) return;

    Alert.alert(
      'Activar',
      `¿Activar ${getPrimaryLabel(item)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Activar',
          onPress: async () => {
            try {
              await activateCatalogItem(config, item.id);
              await loadItems();
            } catch (e: any) {
              Alert.alert('Error', e.message || 'No se pudo activar.');
            }
          },
        },
      ]
    );
  };

  if (!config) {
    return (
      <AppScreen>
        <AppBackButton fallbackRoute="/catalogs" />
        <AppText>Catálogo no reconocido.</AppText>
      </AppScreen>
    );
  }

  if (isLoading) {
    return (
      <AppScreen scroll={false}>
        <ActivityIndicator />
      </AppScreen>
    );
  }

  return (
    <AppScreen scroll={false}>
      <AppBackButton fallbackRoute="/catalogs" preferHistory={false} />

      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <AppText variant="title" bold>
            {config.title}
          </AppText>
          {config.branchScoped ? (
            <AppText variant="caption" color={theme.colors.mutedText}>
              Sucursal: {branchName || 'Actual'}
            </AppText>
          ) : null}
        </View>

        <View style={styles.headerButton}>
          <AppButton
            title="Nuevo"
            onPress={() => router.push(`/catalog-form?kind=${config.kind}` as any)}
          />
        </View>
      </View>

      {config.notes?.length ? (
        <AppCard>
          {config.notes.map((note) => (
            <AppText key={note} color={theme.colors.mutedText}>
              {note}
            </AppText>
          ))}
        </AppCard>
      ) : null}

      <AppInput
        placeholder="Buscar por código, nombre o estado"
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        refreshing={isLoading}
        onRefresh={loadItems}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/catalog-form?kind=${config.kind}&id=${item.id}` as any)}>
            <AppCard>
              <View style={styles.itemHeader}>
                <View style={styles.itemText}>
                  <AppText bold>{getPrimaryLabel(item)}</AppText>
                  <AppText variant="caption" color={theme.colors.mutedText}>
                    {getSecondaryLabel(item) || 'Sin código'}
                  </AppText>
                </View>

                <AppText
                  variant="caption"
                  color={isActive(item) ? theme.colors.success : theme.colors.danger}
                >
                  {isActive(item) ? 'Activo' : 'Inactivo'}
                </AppText>
              </View>

              <View style={styles.actions}>
                <AppButton
                  title="Editar"
                  variant="secondary"
                  onPress={() => router.push(`/catalog-form?kind=${config.kind}&id=${item.id}` as any)}
                />
                {isActive(item) ? (
                  <AppButton
                    title="Desactivar"
                    variant="danger"
                    onPress={() => handleDeactivate(item)}
                  />
                ) : (
                  <AppButton
                    title="Activar"
                    variant="secondary"
                    onPress={() => handleActivate(item)}
                  />
                )}
              </View>
            </AppCard>
          </Pressable>
        )}
        ListEmptyComponent={<AppText>No hay registros.</AppText>}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  headerText: {
    flex: 1,
  },
  headerButton: {
    minWidth: 110,
  },
  listContent: {
    paddingBottom: 24,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  itemText: {
    flex: 1,
  },
  actions: {
    marginTop: 12,
    gap: 8,
  },
});
