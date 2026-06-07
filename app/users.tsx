import AppShell from '@/components/layout/AppShell';
import AppShellPage from '@/components/layout/AppShellPage';
import { buildMainNavSections, getSessionScopeLabel } from '@/components/layout/appNavigation';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppText from '@/components/ui/AppText';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import { canManageUsers } from '@/services/livePermissionGuards';
import { getSession, UserSession } from '@/services/sessionStorage';
import {
  activateUser,
  AdminUser,
  deactivateUser,
  getUsers,
} from '@/services/userAdminService';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, View } from 'react-native';

function isActive(user: AdminUser) {
  return String(user.status).toUpperCase() === 'ACTIVE';
}

function roleSummary(user: AdminUser) {
  const roles = user.roles ?? [];
  if (roles.length === 0) return 'Sin roles';
  return roles
    .map((role) => {
      const name = role.name || role.code;
      return role.code ? `${name} (${role.code.toLowerCase()})` : name;
    })
    .join(', ');
}

function inheritedPermissionCount(user: AdminUser) {
  const directKeys = new Set(
    (user.directPermissions ?? []).map((permission) => permission.code || String(permission.id))
  );

  return (user.effectivePermissions ?? []).filter(
    (permission) => !directKeys.has(permission.code || String(permission.id))
  ).length;
}

export default function UsersScreen() {
  const router = useRouter();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);
  const [session, setSession] = useState<UserSession | null>(null);
  const navSections = useMemo(() => buildMainNavSections(session), [session]);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [])
  );

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const currentSession = await getSession();
      setSession(currentSession);

      if (!canManageUsers(currentSession)) {
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
      ? `Desactivar a ${user.name}? No se eliminara, solo quedara inactivo.`
      : `Activar nuevamente a ${user.name}?`;

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
      <AppShellPage
        title="Usuarios"
        subtitle="Administracion de accesos y estado operativo"
        activeRoute="users"
      >
        <ActivityIndicator />
      </AppShellPage>
    );
  }

  return (
    <AppShell
      title="Usuarios"
      subtitle="Administracion de accesos y estado operativo"
      contextTitle="Control de usuarios"
      contextSubtitle={getSessionScopeLabel(session)}
      activeRoute="users"
      session={session}
      navSections={navSections}
      rightContent={
        <AppButton title="Nuevo usuario" variant="secondary" onPress={() => router.push('/users-form' as any)} />
      }
    >
      <AppText>
        Administra usuarios del sistema. No se eliminan registros: se activan o desactivan.
      </AppText>

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
          const inheritedPermissions = inheritedPermissionCount(item);

          return (
            <AppCard variant="elevated">
              <View style={styles.headerRow}>
                <View style={styles.headerInfo}>
                  <AppText bold>{item.name}</AppText>
                  <AppText>{item.email}</AppText>
                </View>

                <StatusBadge label={active ? 'Activo' : 'Inactivo'} tone={active ? 'success' : 'neutral'} />
              </View>

              <AppText style={styles.meta}>Sucursal: {item.branchName || 'Sin sucursal'}</AppText>
              <AppText style={styles.meta}>Roles: {roleSummary(item)}</AppText>

              {item.phone ? <AppText style={styles.meta}>Telefono: {item.phone}</AppText> : null}

              <AppText variant="caption" style={styles.meta}>
                Permisos directos del usuario: {directPermissions.length}
              </AppText>
              <AppText variant="caption" style={styles.metaCompact}>
                Permisos heredados por roles: {inheritedPermissions}
              </AppText>
              <AppText variant="caption" style={styles.metaCompact}>
                Permisos efectivos totales: {effectivePermissions.length}
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
        ListEmptyComponent={<EmptyState title="No hay usuarios para mostrar" />}
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 12,
    paddingBottom: 24,
  },
  meta: {
    marginTop: 6,
  },
  metaCompact: {
    marginTop: 2,
  },
  search: {
    marginTop: 12,
  },
});
