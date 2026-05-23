import AppBackButton from '@/components/ui/AppBackButton';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { canManageUsers } from '@/services/livePermissionGuards';
import { getSession } from '@/services/sessionStorage';
import {
  activateUser,
  AdminUser,
  deactivateUser,
  getUsers,
} from '@/services/userAdminService';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  View,
} from 'react-native';

function isActive(user: AdminUser) {
  return String(user.status).toUpperCase() === 'ACTIVE';
}

function roleSummary(user: AdminUser) {
  const roles = user.roles ?? [];
  if (roles.length === 0) return 'Sin roles';
  return roles.map((role) => role.code || role.name).join(', ');
}

export default function UsersScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [])
  );

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const session = await getSession();
      if (!canManageUsers(session)) {
        router.replace('/access-denied');
        return;
      }

      const data = await getUsers();
      setUsers(data);
    } catch (error: any) {
      Alert.alert('No se pudieron cargar usuarios', error?.message ?? 'Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;

    return users.filter((user) => {
      const content = `
        ${user.name ?? ''}
        ${user.email ?? ''}
        ${user.phone ?? ''}
        ${user.branchName ?? ''}
        ${user.branchCode ?? ''}
        ${roleSummary(user)}
        ${user.status ?? ''}
      `.toLowerCase();

      return content.includes(query);
    });
  }, [search, users]);

  const confirmToggleStatus = (user: AdminUser) => {
    const active = isActive(user);
    const title = active ? 'Desactivar usuario' : 'Activar usuario';
    const message = active
      ? `¿Desactivar a ${user.name}? No se eliminará, solo quedará inactivo.`
      : `¿Activar nuevamente a ${user.name}?`;

    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: active ? 'Desactivar' : 'Activar',
        style: active ? 'destructive' : 'default',
        onPress: () => toggleStatus(user),
      },
    ]);
  };

  const toggleStatus = async (user: AdminUser) => {
    try {
      setBusyUserId(user.id);
      if (isActive(user)) {
        await deactivateUser(user.id);
      } else {
        await activateUser(user.id);
      }
      await loadUsers();
    } catch (error: any) {
      Alert.alert('No se pudo actualizar el usuario', error?.message ?? 'Intenta nuevamente.');
    } finally {
      setBusyUserId(null);
    }
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

      <AppText variant="title" bold>
        Usuarios
      </AppText>

      <AppText color={theme.colors.mutedText} style={styles.description}>
        Administra usuarios del sistema. No se eliminan registros: se activan o desactivan.
      </AppText>

      <AppButton
        title="Nuevo usuario"
        onPress={() => router.push('/users-form' as any)}
      />

      <View style={styles.search}>
        <AppInput
          placeholder="Buscar por nombre, correo, sucursal o rol"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={filteredUsers}
        keyExtractor={(item) => String(item.id)}
        refreshing={isLoading}
        onRefresh={loadUsers}
        renderItem={({ item }) => {
          const active = isActive(item);
          const directPermissions = item.directPermissions ?? [];
          const effectivePermissions = item.effectivePermissions ?? [];

          return (
            <AppCard>
              <View style={styles.headerRow}>
                <View style={styles.headerInfo}>
                  <AppText bold>{item.name}</AppText>
                  <AppText>{item.email}</AppText>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: active
                        ? theme.colors.optionPressedBackground
                        : theme.colors.inputBackground,
                      borderColor: active
                        ? theme.colors.accent
                        : theme.colors.border,
                    },
                  ]}
                >
                  <AppText
                    variant="caption"
                    color={active ? theme.colors.accent : theme.colors.mutedText}
                    bold
                  >
                    {active ? 'Activo' : 'Inactivo'}
                  </AppText>
                </View>
              </View>

              <AppText style={styles.meta}>Sucursal: {item.branchName || 'Sin sucursal'}</AppText>
              <AppText style={styles.meta}>Roles: {roleSummary(item)}</AppText>

              {item.phone ? <AppText style={styles.meta}>Teléfono: {item.phone}</AppText> : null}

              <AppText variant="caption" color={theme.colors.mutedText} style={styles.meta}>
                Permisos directos: {directPermissions.length} · Permisos efectivos: {effectivePermissions.length}
              </AppText>

              <View style={styles.actions}>
                <View style={styles.actionButton}>
                  <AppButton
                    title="Editar"
                    variant="secondary"
                    onPress={() => router.push(`/users-form?id=${item.id}` as any)}
                  />
                </View>

                <View style={styles.actionButton}>
                  <AppButton
                    title={active ? 'Desactivar' : 'Activar'}
                    variant={active ? 'danger' : 'primary'}
                    loading={busyUserId === item.id}
                    onPress={() => confirmToggleStatus(item)}
                  />
                </View>
              </View>
            </AppCard>
          );
        }}
        ListEmptyComponent={
          <AppCard>
            <AppText>No hay usuarios para mostrar.</AppText>
          </AppCard>
        }
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  description: {
    marginBottom: 12,
  },
  search: {
    marginTop: 12,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerInfo: {
    flex: 1,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  meta: {
    marginTop: 6,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
  },
});
