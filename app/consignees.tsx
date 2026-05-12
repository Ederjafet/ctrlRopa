import AppBackButton from '@/components/ui/AppBackButton';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import {
  activateConsignee,
  Consignee,
  deactivateConsignee,
  getConsigneesByBranch,
  isConsigneeActive,
} from '@/services/consignmentService';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

function normalize(value?: string | null) {
  return (value ?? '').toLowerCase().trim();
}

export default function ConsigneesScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const [session, setSession] = useState<UserSession | null>(null);
  const [consignees, setConsignees] = useState<Consignee[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

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
      const data = await getConsigneesByBranch(currentSession.branchId);
      setConsignees(data);
    } catch (err: any) {
      setError(err?.message || 'No se pudieron cargar los consignatarios.');
    } finally {
      setLoading(false);
    }
  };

  const filteredConsignees = useMemo(() => {
    const term = normalize(search);
    if (!term) return consignees;

    return consignees.filter((consignee) =>
      `${consignee.name} ${consignee.phone} ${consignee.email ?? ''} ${consignee.status}`
        .toLowerCase()
        .includes(term)
    );
  }, [consignees, search]);

  const toggleStatus = (consignee: Consignee) => {
    const active = isConsigneeActive(consignee);

    Alert.alert(
      active ? 'Desactivar consignatario' : 'Activar consignatario',
      `${active ? '¿Desactivar' : '¿Activar'} a ${consignee.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: active ? 'Desactivar' : 'Activar',
          style: active ? 'destructive' : 'default',
          onPress: async () => {
            setActionId(consignee.id);
            setError('');

            try {
              if (active) {
                await deactivateConsignee(consignee.id);
              } else {
                await activateConsignee(consignee);
              }

              await loadData();
            } catch (err: any) {
              setError(err?.message || 'No se pudo actualizar el consignatario.');
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
      <AppBackButton fallbackRoute="/consignments" />

      <AppText variant="title" bold>
        Consignatarios
      </AppText>

      <AppCard>
        <AppText variant="subtitle" bold>
          Catálogo operativo
        </AppText>
        <AppText color={theme.colors.mutedText}>
          Administra terceros que reciben prendas en consignación. No se eliminan;
          se desactivan para conservar historial.
        </AppText>
      </AppCard>

      <AppButton
        title="+ Nuevo consignatario"
        onPress={() => router.push('/consignee-form')}
      />

      <AppInput
        label="Buscar"
        value={search}
        onChangeText={setSearch}
        placeholder="Nombre, teléfono o email"
      />

      {error ? (
        <AppCard style={{ borderColor: theme.colors.danger }}>
          <AppText color={theme.colors.danger}>{error}</AppText>
        </AppCard>
      ) : null}

      {loading ? <AppText>Cargando consignatarios...</AppText> : null}

      {!loading && filteredConsignees.length === 0 ? (
        <AppCard>
          <AppText color={theme.colors.mutedText}>
            No hay consignatarios para mostrar.
          </AppText>
        </AppCard>
      ) : null}

      {filteredConsignees.map((consignee) => {
        const active = isConsigneeActive(consignee);
        const busy = actionId === consignee.id;

        return (
          <AppCard key={consignee.id}>
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <AppText variant="subtitle" bold>
                  {consignee.name}
                </AppText>
                <AppText color={theme.colors.mutedText}>{consignee.phone}</AppText>
                {consignee.email ? (
                  <AppText color={theme.colors.mutedText}>{consignee.email}</AppText>
                ) : null}
              </View>

              <View
                style={[
                  styles.statusPill,
                  {
                    borderColor: active ? theme.colors.success : theme.colors.border,
                    borderRadius: theme.radius.md,
                  },
                ]}
              >
                <AppText
                  variant="caption"
                  bold
                  color={active ? theme.colors.success : theme.colors.mutedText}
                >
                  {active ? 'Activo' : 'Inactivo'}
                </AppText>
              </View>
            </View>

            {consignee.notes ? (
              <AppText style={styles.notes} color={theme.colors.mutedText}>
                {consignee.notes}
              </AppText>
            ) : null}

            <View style={styles.actions}>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/consignee-form',
                    params: { id: String(consignee.id) },
                  })
                }
                style={({ pressed }) => [
                  styles.action,
                  {
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.md,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <AppText bold>Editar</AppText>
              </Pressable>

              <Pressable
                disabled={busy}
                onPress={() => toggleStatus(consignee)}
                style={({ pressed }) => [
                  styles.action,
                  {
                    borderColor: active ? theme.colors.danger : theme.colors.success,
                    borderRadius: theme.radius.md,
                    opacity: busy ? 0.5 : pressed ? 0.75 : 1,
                  },
                ]}
              >
                <AppText bold color={active ? theme.colors.danger : theme.colors.success}>
                  {busy ? 'Procesando...' : active ? 'Desactivar' : 'Activar'}
                </AppText>
              </Pressable>
            </View>
          </AppCard>
        );
      })}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
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
  notes: {
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  action: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
});
