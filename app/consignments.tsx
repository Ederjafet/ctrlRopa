import AppBackButton from '@/components/ui/AppBackButton';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppOptionRow from '@/components/ui/AppOptionRow';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import {
  Consignee,
  Consignment,
  createConsignment,
  getActiveConsigneesByBranch,
  getConsignmentStatusLabel,
  getConsignmentsByBranch,
} from '@/services/consignmentService';
import { validateRouteAccess } from '@/services/routeGuard';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

function normalize(value?: string | null) {
  return (value ?? '').toLowerCase().trim();
}

function formatDate(value?: string | null) {
  if (!value) return 'Sin fecha';
  return new Date(value).toLocaleDateString();
}

export default function ConsignmentsScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const [session, setSession] = useState<UserSession | null>(null);
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [consignments, setConsignments] = useState<Consignment[]>([]);
  const [consignees, setConsignees] = useState<Consignee[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'DELIVERED' | 'IN_SETTLEMENT' | 'CLOSED' | 'CANCELLED'>('ALL');

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [consigneeModalVisible, setConsigneeModalVisible] = useState(false);
  const [selectedConsignee, setSelectedConsignee] = useState<Consignee | null>(null);
  const [notes, setNotes] = useState('');
  const [consigneeSearch, setConsigneeSearch] = useState('');

  useFocusEffect(
    useCallback(() => {
      checkAccessAndLoad();
    }, [])
  );

  const checkAccessAndLoad = async () => {
    const allowed = await validateRouteAccess('CONSIGNMENT', 'MANAGE_CONSIGNMENTS');

    if (!allowed) {
      router.replace('/access-denied');
      return;
    }

    setIsAllowed(true);
    await loadData();
  };

  const loadData = async () => {
    const currentSession = await getSession();

    if (!currentSession) {
      router.replace('/login');
      return;
    }

    setSession(currentSession);
    setLoading(true);
    setError('');

    try {
      const [consignmentData, consigneeData] = await Promise.all([
        getConsignmentsByBranch(currentSession.branchId),
        getActiveConsigneesByBranch(currentSession.branchId),
      ]);

      setConsignments(consignmentData);
      setConsignees(consigneeData);
    } catch (err: any) {
      setError(err?.message || 'No se pudo cargar consignación.');
    } finally {
      setLoading(false);
    }
  };

  const filteredConsignments = useMemo(() => {
    const term = normalize(search);

    return consignments.filter((consignment) => {
      const matchesStatus = statusFilter === 'ALL' || consignment.status === statusFilter;
      const content = `${consignment.folio} ${consignment.consigneeName} ${consignment.status} ${consignment.notes ?? ''}`.toLowerCase();
      const matchesSearch = !term || content.includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [consignments, search, statusFilter]);

  const filteredConsignees = useMemo(() => {
    const term = normalize(consigneeSearch);
    if (!term) return consignees;

    return consignees.filter((consignee) =>
      `${consignee.name} ${consignee.phone} ${consignee.email ?? ''}`
        .toLowerCase()
        .includes(term)
    );
  }, [consignees, consigneeSearch]);

  const openCreateModal = () => {
    setSelectedConsignee(null);
    setNotes('');
    setCreateModalVisible(true);
  };

  const handleCreate = async () => {
    if (!session) return;

    if (!selectedConsignee) {
      setError('Selecciona un consignatario.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const created = await createConsignment({
        branchId: session.branchId,
        consigneeId: selectedConsignee.id,
        notes,
      });

      setCreateModalVisible(false);
      await loadData();
      router.push({
        pathname: '/consignment-detail',
        params: { id: String(created.id) },
      });
    } catch (err: any) {
      setError(err?.message || 'No se pudo crear la consignación.');
    } finally {
      setSaving(false);
    }
  };

  if (isAllowed === null || loading) {
    return (
      <AppScreen>
        <ActivityIndicator />
      </AppScreen>
    );
  }

  return (
    <>
      <AppScreen>
        <AppBackButton fallbackRoute="/" />

        <AppText variant="title" bold>
          Consignación
        </AppText>

        <AppCard>
          <AppText variant="subtitle" bold>
            Flujo de consignación
          </AppText>
          <AppText color={theme.colors.mutedText}>
            Entrega items existentes a terceros, registra liquidaciones parciales
            y convierte resultados vendidos en ventas.
          </AppText>
        </AppCard>

        <View style={styles.buttonRow}>
          <View style={styles.buttonFill}>
            <AppButton title="+ Nueva consignación" onPress={openCreateModal} />
          </View>
          <View style={styles.buttonFill}>
            <AppButton
              title="Consignatarios"
              variant="secondary"
              onPress={() => router.push('/consignees')}
            />
          </View>
        </View>

        <AppInput
          label="Buscar"
          value={search}
          onChangeText={setSearch}
          placeholder="Folio, consignatario o estado"
        />

        <View style={styles.filters}>
          {(['ALL', 'OPEN', 'DELIVERED', 'IN_SETTLEMENT', 'CLOSED', 'CANCELLED'] as const).map(
            (status) => {
              const selected = statusFilter === status;
              return (
                <Pressable
                  key={status}
                  onPress={() => setStatusFilter(status)}
                  style={({ pressed }) => [
                    styles.filterPill,
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
                  <AppText bold={selected} variant="caption">
                    {status === 'ALL' ? 'Todas' : getConsignmentStatusLabel(status)}
                  </AppText>
                </Pressable>
              );
            }
          )}
        </View>

        {error ? (
          <AppCard style={{ borderColor: theme.colors.danger }}>
            <AppText color={theme.colors.danger}>{error}</AppText>
          </AppCard>
        ) : null}

        {filteredConsignments.length === 0 ? (
          <AppCard>
            <AppText color={theme.colors.mutedText}>
              No hay consignaciones para mostrar.
            </AppText>
          </AppCard>
        ) : null}

        {filteredConsignments.map((consignment) => (
          <Pressable
            key={consignment.id}
            onPress={() =>
              router.push({
                pathname: '/consignment-detail',
                params: { id: String(consignment.id) },
              })
            }
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
          >
            <AppCard>
              <View style={styles.headerRow}>
                <View style={styles.headerText}>
                  <AppText variant="subtitle" bold>
                    {consignment.folio}
                  </AppText>
                  <AppText>{consignment.consigneeName}</AppText>
                </View>
                <AppText color={theme.colors.mutedText}>
                  {getConsignmentStatusLabel(consignment.status)}
                </AppText>
              </View>

              <AppText color={theme.colors.mutedText}>
                Creada: {formatDate(consignment.createdAt)}
              </AppText>
              <AppText>
                Items: {consignment.totalItems} · Vendidos: {consignment.soldItems} · Devueltos:{' '}
                {consignment.returnedItems} · Abiertos: {consignment.openItems}
              </AppText>
            </AppCard>
          </Pressable>
        ))}
      </AppScreen>

      <AppBottomModal
        visible={createModalVisible}
        title="Nueva consignación"
        onClose={() => setCreateModalVisible(false)}
        scroll={false}
      >
        <AppText bold>Consignatario</AppText>
        <AppText color={theme.colors.mutedText} style={styles.modalText}>
          {selectedConsignee ? selectedConsignee.name : 'Selecciona un consignatario activo'}
        </AppText>

        <AppButton
          title={selectedConsignee ? 'Cambiar consignatario' : 'Seleccionar consignatario'}
          variant="secondary"
          onPress={() => setConsigneeModalVisible(true)}
        />

        <AppInput
          label="Notas"
          value={notes}
          onChangeText={setNotes}
          placeholder="Notas opcionales"
          multiline
        />

        <AppButton
          title={saving ? 'Creando...' : 'Crear consignación'}
          onPress={handleCreate}
          loading={saving}
          disabled={saving || !selectedConsignee}
        />
      </AppBottomModal>

      <AppBottomModal
        visible={consigneeModalVisible}
        title="Seleccionar consignatario"
        onClose={() => setConsigneeModalVisible(false)}
        scroll={false}
      >
        <AppInput
          placeholder="Buscar consignatario"
          value={consigneeSearch}
          onChangeText={setConsigneeSearch}
        />

        <FlatList
          data={filteredConsignees}
          style={styles.modalList}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <AppOptionRow
              title={item.name}
              subtitle={`${item.phone}${item.email ? ` · ${item.email}` : ''}`}
              onPress={() => {
                setSelectedConsignee(item);
                setConsigneeSearch('');
                setConsigneeModalVisible(false);
              }}
            />
          )}
          ListEmptyComponent={<AppText>No hay consignatarios activos.</AppText>}
        />
      </AppBottomModal>
    </>
  );
}

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  buttonFill: {
    flex: 1,
    minWidth: 150,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
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
  modalList: {
    maxHeight: 420,
  },
  modalText: {
    marginBottom: 10,
    marginTop: 4,
  },
});
