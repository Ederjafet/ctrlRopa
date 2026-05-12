import AppBackButton from '@/components/ui/AppBackButton';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import {
  activateBranch,
  Branch,
  deactivateBranch,
  getBranches,
  isBranchActive,
} from '@/services/branchAdminService';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

function normalizeText(value?: string | null) {
  return (value ?? '').toLowerCase().trim();
}

export default function BranchesScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { isPhone, isDesktop } = useResponsiveLayout();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const loadBranches = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getBranches();
      setBranches(data);
    } catch (err: any) {
      setError(err?.message || 'No se pudieron cargar las sucursales.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBranches();
    }, [loadBranches])
  );

  const filteredBranches = useMemo(() => {
    const term = normalizeText(search);

    if (!term) return branches;

    return branches.filter((branch) => {
      const content = [
        branch.code,
        branch.name,
        branch.city,
        branch.state,
        branch.postalCode,
        branch.country,
        branch.status,
      ]
        .map(normalizeText)
        .join(' ');

      return content.includes(term);
    });
  }, [branches, search]);

  const handleEdit = (branch: Branch) => {
    router.push({
      pathname: '/branches-form',
      params: { id: String(branch.id) },
    });
  };

  const handleCreate = () => {
    router.push('/branches-form');
  };

  const handleDeactivate = (branch: Branch) => {
    Alert.alert(
      'Desactivar sucursal',
      `¿Quieres desactivar la sucursal ${branch.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: async () => {
            setActionId(branch.id);
            setError('');

            try {
              await deactivateBranch(branch.id);
              await loadBranches();
            } catch (err: any) {
              setError(err?.message || 'No se pudo desactivar la sucursal.');
            } finally {
              setActionId(null);
            }
          },
        },
      ]
    );
  };

  const handleActivate = (branch: Branch) => {
    Alert.alert(
      'Activar sucursal',
      `¿Quieres activar la sucursal ${branch.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Activar',
          onPress: async () => {
            setActionId(branch.id);
            setError('');

            try {
              await activateBranch(branch);
              await loadBranches();
            } catch (err: any) {
              setError(err?.message || 'No se pudo activar la sucursal.');
            } finally {
              setActionId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <AppScreen>
      <AppBackButton fallbackRoute="/" />

      <View style={styles.pageHeader}>
        <AppText variant="title" bold style={styles.pageTitle}>
          Sucursales
        </AppText>
        <View style={[styles.createAction, isPhone ? styles.fullWidth : null]}>
          <AppButton title="+ Nueva sucursal" onPress={handleCreate} />
        </View>
      </View>

      <AppCard>
        <AppText variant="subtitle" bold>
          Catálogo de sucursales
        </AppText>
        <AppText color={theme.colors.mutedText}>
          Administra las sucursales operativas. Las sucursales no se eliminan:
          se desactivan para conservar historial.
        </AppText>
      </AppCard>

      <AppInput
        label="Buscar"
        value={search}
        onChangeText={setSearch}
        placeholder="Código, nombre, ciudad o estado"
        autoCapitalize="none"
      />

      {error ? (
        <AppCard style={{ borderColor: theme.colors.danger }}>
          <AppText color={theme.colors.danger}>{error}</AppText>
        </AppCard>
      ) : null}

      {loading ? <AppText>Cargando sucursales...</AppText> : null}

      {!loading && filteredBranches.length === 0 ? (
        <AppCard>
          <AppText color={theme.colors.mutedText}>
            No hay sucursales para mostrar.
          </AppText>
        </AppCard>
      ) : null}

      <View style={styles.branchGrid}>
      {filteredBranches.map((branch) => {
        const active = isBranchActive(branch);
        const busy = actionId === branch.id;

        return (
          <AppCard
            key={branch.id}
            style={[
              styles.branchCard,
              { width: isPhone ? '100%' : isDesktop ? '48%' : '100%' },
            ]}
          >
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <AppText variant="subtitle" bold>
                  {branch.name}
                </AppText>
                <AppText color={theme.colors.mutedText}>
                  Código: {branch.code}
                </AppText>
              </View>

              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: active
                      ? theme.colors.success
                      : theme.colors.warningBackground,
                    borderColor: active
                      ? theme.colors.success
                      : theme.colors.warning,
                  },
                ]}
              >
                <AppText
                  variant="caption"
                  bold
                  color={active ? '#FFFFFF' : theme.colors.warning}
                >
                  {active ? 'Activa' : 'Inactiva'}
                </AppText>
              </View>
            </View>

            <View style={styles.infoBlock}>
              <AppText>
                {branch.addressLine1}
                {branch.addressLine2 ? `, ${branch.addressLine2}` : ''}
              </AppText>
              <AppText color={theme.colors.mutedText}>
                {branch.city}, {branch.state} · CP {branch.postalCode}
              </AppText>
              <AppText color={theme.colors.mutedText}>{branch.country}</AppText>
            </View>

            <View style={styles.actions}>
              <Pressable
                onPress={() => handleEdit(branch)}
                style={({ pressed }) => [
                  styles.smallAction,
                  {
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.md,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <AppText bold>Editar</AppText>
              </Pressable>

              {active ? (
                <Pressable
                  disabled={busy}
                  onPress={() => handleDeactivate(branch)}
                  style={({ pressed }) => [
                    styles.smallAction,
                    {
                      borderColor: theme.colors.danger,
                      borderRadius: theme.radius.md,
                      opacity: busy ? 0.5 : pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <AppText bold color={theme.colors.danger}>
                    {busy ? 'Procesando...' : 'Desactivar'}
                  </AppText>
                </Pressable>
              ) : (
                <Pressable
                  disabled={busy}
                  onPress={() => handleActivate(branch)}
                  style={({ pressed }) => [
                    styles.smallAction,
                    {
                      borderColor: theme.colors.success,
                      borderRadius: theme.radius.md,
                      opacity: busy ? 0.5 : pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <AppText bold color={theme.colors.success}>
                    {busy ? 'Procesando...' : 'Activar'}
                  </AppText>
                </Pressable>
              )}
            </View>
          </AppCard>
        );
      })}
      </View>

      <AppText
        variant="caption"
        color={theme.colors.mutedText}
        style={styles.note}
      >
        Las sucursales activas se usan en operación, usuarios, canales por
        sucursal, inventario y reportes.
      </AppText>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  branchCard: {
    marginBottom: 0,
  },
  branchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  createAction: {
    minWidth: 180,
  },
  fullWidth: {
    width: '100%',
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  infoBlock: {
    marginTop: 8,
    gap: 2,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  smallAction: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  note: {
    marginTop: 8,
    textAlign: 'center',
  },
  pageHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pageTitle: {
    flexGrow: 1,
    marginBottom: 0,
  },
});
