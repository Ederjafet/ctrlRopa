import AppBackButton from '@/components/ui/AppBackButton';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppOptionRow from '@/components/ui/AppOptionRow';
import AppScreen from '@/components/ui/AppScreen';
import AppSelectorField from '@/components/ui/AppSelectorField';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import {
  Branch,
  buildChannelRows,
  ChannelToggleRow,
  getActiveBranches,
  getActiveSalesChannels,
  getBranchSalesChannels,
  saveBranchSalesChannel,
} from '@/services/branchChannelService';
import { getSession } from '@/services/sessionStorage';
import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Switch, View } from 'react-native';

const CHANNEL_DESCRIPTIONS: Record<string, string> = {
  LIVE: 'Permite operar lives y generar reservas desde transmisión.',
  DOOR_SALE: 'Permite venta directa en puerta y generación de ventas.',
  DOOR_RESERVATION: 'Permite apartados en puerta y generación de reservas.',
  CONSIGNMENT: 'Permite operar consignación con terceros.',
};

function sortChannels(rows: ChannelToggleRow[]) {
  const order = ['LIVE', 'DOOR_SALE', 'DOOR_RESERVATION', 'CONSIGNMENT'];

  return [...rows].sort((a, b) => {
    const aIndex = order.indexOf(a.salesChannelCode);
    const bIndex = order.indexOf(b.salesChannelCode);

    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;

    return a.salesChannelName.localeCompare(b.salesChannelName);
  });
}

export default function ChannelsScreen() {
  const { theme } = useAppTheme();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [rows, setRows] = useState<ChannelToggleRow[]>([]);
  const [originalRows, setOriginalRows] = useState<ChannelToggleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedBranch = useMemo(
    () => branches.find((branch) => branch.id === selectedBranchId) ?? null,
    [branches, selectedBranchId]
  );

  const hasChanges = useMemo(() => {
    if (rows.length !== originalRows.length) return true;

    return rows.some((row) => {
      const original = originalRows.find(
        (item) => item.salesChannelId === row.salesChannelId
      );

      return original?.enabled !== row.enabled;
    });
  }, [rows, originalRows]);

  const saveBlockedReason = useMemo(() => {
    if (loading) return 'Espera a que terminen de cargar los canales.';
    if (saving) return 'Se estan guardando los cambios.';
    if (!selectedBranchId) return 'Selecciona una sucursal antes de guardar.';
    if (!hasChanges) return 'No hay cambios pendientes por guardar.';
    return undefined;
  }, [loading, saving, selectedBranchId, hasChanges]);

  const discardBlockedReason = useMemo(() => {
    if (loading) return 'Espera a que terminen de cargar los canales.';
    if (saving) return 'Se estan guardando los cambios.';
    if (!hasChanges) return 'No hay cambios pendientes por descartar.';
    return undefined;
  }, [loading, saving, hasChanges]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedBranchId) {
      loadBranchChannels(selectedBranchId);
    }
  }, [selectedBranchId]);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [session, branchList] = await Promise.all([
        getSession(),
        getActiveBranches(),
      ]);

      setBranches(branchList);

      const sessionBranchId = session?.branchId;
      const branchExists = branchList.some((branch) => branch.id === sessionBranchId);
      const firstBranchId = branchList[0]?.id ?? null;

      setSelectedBranchId(branchExists ? sessionBranchId! : firstBranchId);
    } catch (err) {
      console.log(err);
      setError('No se pudieron cargar las sucursales.');
    } finally {
      setLoading(false);
    }
  };

  const loadBranchChannels = async (branchId: number) => {
    setLoading(true);
    setError(null);

    try {
      const [salesChannels, branchConfig] = await Promise.all([
        getActiveSalesChannels(),
        getBranchSalesChannels(branchId),
      ]);

      const nextRows = sortChannels(buildChannelRows(salesChannels, branchConfig));

      setRows(nextRows);
      setOriginalRows(nextRows.map((row) => ({ ...row })));
    } catch (err) {
      console.log(err);
      setRows([]);
      setOriginalRows([]);
      setError('No se pudieron cargar los canales de la sucursal.');
    } finally {
      setLoading(false);
    }
  };

  const toggleChannel = (salesChannelId: number) => {
    setRows((current) =>
      current.map((row) =>
        row.salesChannelId === salesChannelId
          ? { ...row, enabled: !row.enabled }
          : row
      )
    );
  };

  const selectBranch = (branchId: number) => {
    if (hasChanges) {
      Alert.alert(
        'Cambios sin guardar',
        'Guarda o descarta los cambios antes de cambiar de sucursal.'
      );
      return;
    }

    setSelectedBranchId(branchId);
    setBranchModalOpen(false);
  };

  const resetChanges = () => {
    setRows(originalRows.map((row) => ({ ...row })));
  };

  const saveChanges = async () => {
    if (!selectedBranchId) return;

    const changedRows = rows.filter((row) => {
      const original = originalRows.find(
        (item) => item.salesChannelId === row.salesChannelId
      );

      return original?.enabled !== row.enabled;
    });

    if (changedRows.length === 0) {
      Alert.alert('Sin cambios', 'No hay cambios por guardar.');
      return;
    }

    setSaving(true);

    try {
      await Promise.all(
        changedRows.map((row) =>
          saveBranchSalesChannel({
            branchId: selectedBranchId,
            salesChannelId: row.salesChannelId,
            enabled: row.enabled,
            configId: row.configId,
          })
        )
      );

      await loadBranchChannels(selectedBranchId);
      Alert.alert('Canales actualizados', 'La configuración se guardó correctamente.');
    } catch (err) {
      console.log(err);
      Alert.alert(
        'No se pudo guardar',
        'Revisa tu conexión o permisos e inténtalo nuevamente.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AppScreen>
        <AppBackButton fallbackRoute="/" />

        <AppText variant="title" bold>
          Canales por sucursal
        </AppText>

        <AppCard>
          <AppText variant="subtitle" bold>
            Regla de acceso
          </AppText>
          <AppText color={theme.colors.mutedText}>
            Un usuario solo puede operar una accion cuando tiene el permiso, Sistema dejo el canal disponible y la sucursal lo tiene activo.
          </AppText>
        </AppCard>

        <AppSelectorField
          label="Sucursal"
          placeholder="Selecciona una sucursal"
          value={
            selectedBranch
              ? `${selectedBranch.name}${selectedBranch.code ? ` (${selectedBranch.code})` : ''}`
              : null
          }
          onPress={() => setBranchModalOpen(true)}
          disabled={loading || saving}
        />

        {error ? (
          <AppCard style={{ borderColor: theme.colors.danger }}>
            <AppText color={theme.colors.danger}>{error}</AppText>
          </AppCard>
        ) : null}

        <AppCard>
          <AppText variant="subtitle" bold>
            Canales disponibles
          </AppText>

          {loading ? (
            <AppText color={theme.colors.mutedText}>Cargando canales...</AppText>
          ) : rows.length === 0 ? (
            <AppText color={theme.colors.mutedText}>
              No hay canales disponibles desde Sistema para configurar en esta sucursal.
            </AppText>
          ) : (
            <View style={styles.channelList}>
              {rows.map((row) => (
                <View
                  key={row.salesChannelId}
                  style={[
                    styles.channelRow,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.inputBackground,
                      borderRadius: theme.radius.md,
                      padding: theme.spacing.md,
                    },
                  ]}
                >
                  <View style={styles.channelInfo}>
                    <AppText bold>{row.salesChannelName}</AppText>
                    <AppText variant="caption" color={theme.colors.mutedText}>
                      {row.salesChannelCode}
                    </AppText>
                    <AppText color={theme.colors.mutedText}>
                      {CHANNEL_DESCRIPTIONS[row.salesChannelCode] ??
                        'Canal operativo configurable por sucursal.'}
                    </AppText>
                  </View>

                  <Switch
                    value={row.enabled}
                    onValueChange={() => toggleChannel(row.salesChannelId)}
                    disabled={saving}
                    trackColor={{
                      false: theme.colors.border,
                      true: theme.colors.primary,
                    }}
                    thumbColor={row.enabled ? theme.colors.accent : theme.colors.surface}
                  />
                </View>
              ))}
            </View>
          )}
        </AppCard>

        <View style={styles.actions}>
          <AppButton
            title="Guardar cambios"
            onPress={saveChanges}
            loading={saving}
            disabled={loading || saving || !selectedBranchId || !hasChanges}
            disabledReason={saveBlockedReason}
          />

          <AppButton
            title="Descartar cambios"
            variant="secondary"
            onPress={resetChanges}
            disabled={loading || saving || !hasChanges}
            disabledReason={discardBlockedReason}
            style={{ marginTop: 10 }}
          />
        </View>
      </AppScreen>

      <AppBottomModal
        visible={branchModalOpen}
        title="Selecciona sucursal"
        onClose={() => setBranchModalOpen(false)}
      >
        {branches.map((branch) => (
          <AppOptionRow
            key={branch.id}
            title={branch.name}
            subtitle={branch.code || undefined}
            onPress={() => selectBranch(branch.id)}
          >
            {branch.id === selectedBranchId ? (
              <AppText variant="caption">Seleccionada</AppText>
            ) : null}
          </AppOptionRow>
        ))}
      </AppBottomModal>
    </>
  );
}

const styles = StyleSheet.create({
  channelList: {
    marginTop: 6,
  },
  channelRow: {
    borderWidth: 1,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelInfo: {
    flex: 1,
    paddingRight: 12,
  },
  actions: {
    marginBottom: 12,
  },
});
