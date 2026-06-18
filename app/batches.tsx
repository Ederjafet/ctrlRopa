import AppShellPage from '@/components/layout/AppShellPage';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import {
  Batch,
  BatchStatus,
  getBatchesByBranch,
  getBatchStatusLabel,
} from '@/services/batchService';
import { ApiError } from '@/services/apiClient';
import { hasAnyPermission } from '@/services/accessControl';
import { getSession } from '@/services/sessionStorage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

type BatchStatusFilter = 'ALL' | BatchStatus;

const statusFilters: { labelKey: string; value: BatchStatusFilter }[] = [
  { labelKey: 'operationalScreens.batches.filterAll', value: 'ALL' },
  { labelKey: 'operationalScreens.batches.filterAnnounced', value: 'ANNOUNCED' },
  { labelKey: 'operationalScreens.batches.filterReceived', value: 'RECEIVED' },
  { labelKey: 'operationalScreens.batches.filterReconciled', value: 'RECONCILED' },
  { labelKey: 'operationalScreens.batches.filterCancelled', value: 'CANCELLED' },
];

function normalize(value?: string | null) {
  return (value ?? '').toLowerCase().trim();
}

export default function BatchesScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { t } = useTranslation('common');

  const [batches, setBatches] = useState<Batch[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BatchStatusFilter>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canManageInventory, setCanManageInventory] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadBatches();
    }, [])
  );

  const loadBatches = async () => {
    const session = await getSession();
    if (!session) return;

    if (!hasAnyPermission(session, ['VIEW_INVENTORY', 'MANAGE_INVENTORY'])) {
      router.replace('/access-denied' as any);
      return;
    }

    setCanManageInventory(
      session.effectivePermissions?.some(
        (permission) => permission.code === 'MANAGE_INVENTORY'
      ) ?? false
    );

    setLoading(true);
    setError('');

    try {
      const data = await getBatchesByBranch(session.branchId);
      setBatches(data);
    } catch (err: any) {
      if (err instanceof ApiError && err.suppressUserNotification) {
        return;
      }
      setError(err?.message || 'No se pudieron cargar los lotes.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const term = normalize(search);
    const byStatus =
      statusFilter === 'ALL'
        ? batches
        : batches.filter((batch) => batch.status === statusFilter);

    if (!term) return byStatus;

    return byStatus.filter((batch) => {
      const content = [
        batch.folio,
        batch.status,
        batch.branchName,
        batch.supplierName,
        batch.notes,
        String(batch.expectedQuantity ?? ''),
        String(batch.receivedQuantity ?? ''),
      ]
        .map(normalize)
        .join(' ');

      return content.includes(term);
    });
  }, [batches, search, statusFilter]);

  if (loading) {
    return (
      <AppShellPage
        title={t('navigation.items.batches')}
        subtitle={t('operationalScreens.batches.subtitle')}
        activeRoute="batches"
      >
        <ActivityIndicator />
      </AppShellPage>
    );
  }

  return (
    <AppShellPage
      title={t('navigation.items.batches')}
      subtitle={t('operationalScreens.batches.subtitle')}
      activeRoute="batches"
      rightContent={
        canManageInventory ? (
          <AppButton
            title={t('operationalScreens.batches.createBatch')}
            onPress={() => router.push('/batch-form')}
          />
        ) : null
      }
    >

      <AppInput
        placeholder={t('operationalScreens.batches.searchPlaceholder')}
        value={search}
        onChangeText={setSearch}
      />

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

      {error ? (
        <AppCard style={{ borderColor: theme.colors.danger }}>
          <AppText color={theme.colors.danger}>{error}</AppText>
        </AppCard>
      ) : null}

      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        refreshing={loading}
        onRefresh={loadBatches}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({ pathname: '/batch-detail', params: { id: String(item.id) } })
            }
          >
            <AppCard>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitle}>
                  <AppText variant="subtitle" bold>
                    {item.folio}
                  </AppText>
                  <AppText variant="caption" color={theme.colors.mutedText}>
                    {item.branchName || t('operationalScreens.batches.currentBranch')}
                  </AppText>
                  <AppText variant="caption" color={theme.colors.mutedText}>
                    {t('operationalScreens.batches.supplier')}: {item.supplierName || t('operationalScreens.batches.noSupplier')}
                  </AppText>
                </View>

                <View
                  style={[
                    styles.statusPill,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.optionPressedBackground,
                      borderRadius: theme.radius.md,
                    },
                  ]}
                >
                  <AppText variant="caption" bold>
                    {getBatchStatusLabel(item.status)}
                  </AppText>
                </View>
              </View>

              <View style={styles.metricsRow}>
                <AppText>{t('operationalScreens.batches.expected')}: {item.expectedQuantity ?? 0}</AppText>
                <AppText>{t('operationalScreens.batches.received')}: {item.receivedQuantity ?? '-'}</AppText>
              </View>

              <View style={styles.metricsRow}>
                <AppText>{t('operationalScreens.batches.classified')}: {item.classifiedQuantity ?? 0}</AppText>
                <AppText>{t('operationalScreens.batches.items')}: {item.itemCount ?? 0}</AppText>
              </View>

              {item.receivedAt ? (
                <AppText variant="caption" color={theme.colors.mutedText} style={styles.note}>
                  {t('operationalScreens.batches.received')}: {new Date(item.receivedAt).toLocaleString('es-MX')}
                </AppText>
              ) : null}

              {item.notes ? (
                <AppText variant="caption" color={theme.colors.mutedText} style={styles.note}>
                  {item.notes}
                </AppText>
              ) : null}

              <AppText variant="caption" color={theme.colors.mutedText} style={styles.hint}>
                {t('operationalScreens.batches.tapDetail')}
              </AppText>
            </AppCard>
          </Pressable>
        )}
        ListEmptyComponent={
          <AppCard>
            <AppText>{t('operationalScreens.batches.noBatches')}</AppText>
            <View style={styles.emptyAction}>
              <AppButton
                title={t('operationalScreens.batches.createFirst')}
                onPress={() => router.push('/batch-form')}
              />
            </View>
          </AppCard>
        }
      />
    </AppShellPage>
  );
}

const styles = StyleSheet.create({
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
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitle: {
    flex: 1,
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 8,
  },
  note: {
    marginTop: 8,
  },
  hint: {
    marginTop: 8,
  },
  emptyAction: {
    marginTop: 12,
  },
});
