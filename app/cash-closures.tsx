import AppBackButton from '@/components/ui/AppBackButton';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppDateField from '@/components/ui/AppDateField';
import AppInput from '@/components/ui/AppInput';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { Branch, getActiveBranches } from '@/services/branchAdminService';
import {
  CashClosure,
  createCashClosure,
  getCashClosureStatusLabel,
  getCashClosuresByBranch,
} from '@/services/cashClosureService';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function normalize(value?: string | number | null) {
  return String(value ?? '').toLowerCase().trim();
}

function formatMoney(value?: number | null) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  return value.slice(0, 10);
}

function statusColor(theme: any, status?: string | null) {
  if (status === 'CLOSED') return theme.colors.success;
  if (status === 'CANCELLED') return theme.colors.danger;
  return theme.colors.accent;
}

export default function CashClosuresScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const [session, setSession] = useState<UserSession | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [closures, setClosures] = useState<CashClosure[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [closureDate, setClosureDate] = useState(todayIso());
  const [deliveredCashText, setDeliveredCashText] = useState('0');
  const [notes, setNotes] = useState('');

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const load = async (branchOverride?: number | null) => {
    setLoading(true);
    setError('');

    try {
      const currentSession = await getSession();

      if (!currentSession) {
        router.replace('/login');
        return;
      }

      setSession(currentSession);

      const activeBranches = await getActiveBranches();
      setBranches(activeBranches);

      const branchId = branchOverride ?? selectedBranchId ?? currentSession.branchId;
      setSelectedBranchId(branchId);

      const data = await getCashClosuresByBranch(branchId);
      setClosures(data);
    } catch (err: any) {
      setError(err?.message || 'No se pudieron cargar los cierres de caja.');
    } finally {
      setLoading(false);
    }
  };

  const selectedBranch = useMemo(() => {
    return branches.find((branch) => branch.id === selectedBranchId);
  }, [branches, selectedBranchId]);

  const filteredClosures = useMemo(() => {
    const term = normalize(search);

    if (!term) return closures;

    return closures.filter((closure) => {
      const content = [
        closure.id,
        closure.closureDate,
        closure.status,
        getCashClosureStatusLabel(closure.status),
        closure.branchName,
        closure.branchCode,
        closure.expectedCash,
        closure.expensesTotal,
        closure.deliveredCash,
        closure.difference,
        closure.notes,
      ]
        .map(normalize)
        .join(' ');

      return content.includes(term);
    });
  }, [closures, search]);

  const openCount = closures.filter((closure) => closure.status === 'OPEN').length;
  const closedCount = closures.filter((closure) => closure.status === 'CLOSED').length;

  const selectBranch = async (branchId: number) => {
    setSelectedBranchId(branchId);
    await load(branchId);
  };

  const openCreate = () => {
    setClosureDate(todayIso());
    setDeliveredCashText('0');
    setNotes('');
    setIsCreateModalVisible(true);
  };

  const handleCreate = async () => {
    if (!selectedBranchId) {
      Alert.alert('Cierre de caja', 'Selecciona una sucursal.');
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(closureDate)) {
      Alert.alert('Cierre de caja', 'Captura la fecha en formato YYYY-MM-DD.');
      return;
    }

    const deliveredCash = Number(deliveredCashText || 0);

    if (Number.isNaN(deliveredCash) || deliveredCash < 0) {
      Alert.alert('Cierre de caja', 'Captura efectivo entregado válido.');
      return;
    }

    setSaving(true);

    try {
      const created = await createCashClosure({
        branchId: selectedBranchId,
        closureDate,
        deliveredCash,
        notes,
      });

      setIsCreateModalVisible(false);
      await load(selectedBranchId);

      router.push({
        pathname: '/cash-closure-detail',
        params: { id: String(created.id) },
      });
    } catch (err: any) {
      Alert.alert('Cierre de caja', err?.message || 'No se pudo crear el cierre.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AppScreen>
        <AppBackButton fallbackRoute="/" />

        <AppText variant="title" bold>
          Cierres de caja
        </AppText>

        <AppCard>
          <AppText variant="subtitle" bold>
            Control de efectivo por día
          </AppText>
          <AppText color={theme.colors.mutedText}>
            Registra gastos, efectivo entregado y diferencia contra efectivo esperado.
          </AppText>
        </AppCard>

        <AppCard>
          <AppText variant="subtitle" bold>
            Sucursal
          </AppText>
          <AppText>{selectedBranch?.name || session?.branchName || 'Sucursal actual'}</AppText>

          <View style={styles.branchList}>
            {branches.map((branch) => {
              const selected = branch.id === selectedBranchId;

              return (
                <Pressable
                  key={branch.id}
                  onPress={() => selectBranch(branch.id)}
                  style={({ pressed }) => [
                    styles.branchChip,
                    {
                      borderColor: selected ? theme.colors.accent : theme.colors.border,
                      backgroundColor: selected
                        ? theme.colors.optionPressedBackground
                        : theme.colors.surface,
                      borderRadius: theme.radius.md,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <AppText bold={selected}>{branch.name}</AppText>
                </Pressable>
              );
            })}
          </View>
        </AppCard>

        <View style={styles.summaryRow}>
          <AppCard style={styles.summaryCard}>
            <AppText variant="caption" color={theme.colors.mutedText}>
              Abiertos
            </AppText>
            <AppText variant="subtitle" bold color={theme.colors.accent}>
              {openCount}
            </AppText>
          </AppCard>

          <AppCard style={styles.summaryCard}>
            <AppText variant="caption" color={theme.colors.mutedText}>
              Cerrados
            </AppText>
            <AppText variant="subtitle" bold color={theme.colors.success}>
              {closedCount}
            </AppText>
          </AppCard>
        </View>

        <AppButton title="+ Nuevo cierre" onPress={openCreate} />

        <AppInput
          label="Buscar"
          placeholder="Fecha, estado, notas o montos"
          value={search}
          onChangeText={setSearch}
        />

        {error ? (
          <AppCard style={{ borderColor: theme.colors.danger }}>
            <AppText color={theme.colors.danger}>{error}</AppText>
          </AppCard>
        ) : null}

        {loading ? <ActivityIndicator /> : null}

        {!loading && filteredClosures.length === 0 ? (
          <AppCard>
            <AppText color={theme.colors.mutedText}>
              No hay cierres de caja para mostrar.
            </AppText>
          </AppCard>
        ) : null}

        {filteredClosures.map((closure) => {
          const color = statusColor(theme, closure.status);

          return (
            <Pressable
              key={closure.id}
              onPress={() =>
                router.push({
                  pathname: '/cash-closure-detail',
                  params: { id: String(closure.id) },
                })
              }
              style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
            >
              <AppCard>
                <View style={styles.headerRow}>
                  <View style={styles.headerText}>
                    <AppText variant="subtitle" bold>
                      {formatDate(closure.closureDate)}
                    </AppText>
                    <AppText color={theme.colors.mutedText}>
                      {closure.branchName || closure.branchCode || 'Sucursal'}
                    </AppText>
                  </View>

                  <View style={[styles.statusPill, { borderColor: color }]}>
                    <AppText variant="caption" bold color={color}>
                      {getCashClosureStatusLabel(closure.status)}
                    </AppText>
                  </View>
                </View>

                <View style={styles.amountGrid}>
                  <AmountBlock label="Esperado" value={closure.expectedCash} />
                  <AmountBlock label="Gastos" value={closure.expensesTotal} />
                  <AmountBlock label="Entregado" value={closure.deliveredCash} />
                  <AmountBlock label="Diferencia" value={closure.difference} />
                </View>

                {closure.notes ? (
                  <AppText color={theme.colors.mutedText}>Notas: {closure.notes}</AppText>
                ) : null}
              </AppCard>
            </Pressable>
          );
        })}
      </AppScreen>

      <AppBottomModal
        visible={isCreateModalVisible}
        title="Nuevo cierre de caja"
        onClose={() => setIsCreateModalVisible(false)}
      >
        <AppDateField
          label="Fecha"
          value={closureDate}
          onChange={setClosureDate}
        />

        <AppInput
          label="Efectivo entregado inicial"
          placeholder="0.00"
          value={deliveredCashText}
          onChangeText={setDeliveredCashText}
          keyboardType="numeric"
        />

        <AppInput
          label="Notas"
          placeholder="Notas opcionales"
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <AppButton
          title={saving ? 'Creando...' : 'Crear cierre'}
          onPress={handleCreate}
          loading={saving}
          disabled={saving}
        />
      </AppBottomModal>
    </>
  );
}

function AmountBlock({ label, value }: { label: string; value: number }) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.amountBlock}>
      <AppText variant="caption" color={theme.colors.mutedText}>
        {label}
      </AppText>
      <AppText bold>{formatMoney(value)}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  amountBlock: {
    flex: 1,
    minWidth: 120,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  branchChip: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  branchList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
  },
  statusPill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  summaryCard: {
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
});
