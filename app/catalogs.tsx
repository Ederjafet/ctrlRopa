import AppBackButton from '@/components/ui/AppBackButton';
import AppCard from '@/components/ui/AppCard';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { CATALOG_CONFIGS } from '@/services/adminCatalogService';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

export default function CatalogsScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const baseCatalogs = CATALOG_CONFIGS.filter((config) => !config.branchScoped);
  const branchCatalogs = CATALOG_CONFIGS.filter((config) => config.branchScoped);

  return (
    <AppScreen>
      <AppBackButton fallbackRoute="/" />

      <AppText variant="title" bold>
        Catálogos
      </AppText>

      <AppCard>
        <AppText variant="subtitle" bold>
          Catálogos base
        </AppText>
        <AppText color={theme.colors.mutedText}>
          Valores globales usados en inventario, ventas y pagos.
        </AppText>

        <View style={styles.grid}>
          {baseCatalogs.map((config) => (
            <CatalogTile
              key={config.kind}
              title={config.title}
              subtitle="Global"
              onPress={() => router.push(`/catalog-list?kind=${config.kind}` as any)}
            />
          ))}
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="subtitle" bold>
          Operación por sucursal
        </AppText>
        <AppText color={theme.colors.mutedText}>
          Elementos físicos que dependen de la sucursal activa.
        </AppText>

        <View style={styles.grid}>
          {branchCatalogs.map((config) => (
            <CatalogTile
              key={config.kind}
              title={config.title}
              subtitle="Sucursal actual"
              onPress={() => router.push(`/catalog-list?kind=${config.kind}` as any)}
            />
          ))}
        </View>
      </AppCard>
    </AppScreen>
  );
}

function CatalogTile({ title, subtitle, onPress }: { title: string; subtitle: string; onPress: () => void }) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: pressed ? theme.colors.optionPressedBackground : theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          padding: theme.spacing.md,
        },
      ]}
    >
      <AppText bold>{title}</AppText>
      <AppText variant="caption" color={theme.colors.mutedText}>
        {subtitle}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: {
    marginTop: 12,
    gap: 10,
  },
  tile: {
    borderWidth: 1,
  },
});
