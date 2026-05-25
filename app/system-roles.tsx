import AppBackButton from '@/components/ui/AppBackButton';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import {
  formatPermissionCode,
  groupPermissionsForDisplay,
  getSuggestedDependencyWarnings,
  matchesPermissionSearch,
} from '@/services/permissionDependencies';
import {
  AdminPermission,
  AdminRole,
  createRole,
  getPermissions,
  getRoles,
  updateRole,
} from '@/services/userAdminService';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

type RoleForm = {
  id: number | null;
  code: string;
  name: string;
  permissionIds: number[];
};

const emptyForm: RoleForm = {
  id: null,
  code: '',
  name: '',
  permissionIds: [],
};

function permissionIds(role: AdminRole) {
  return (role.permissions ?? []).map((permission) => permission.id);
}

function toggleId(ids: number[], id: number) {
  return ids.includes(id) ? ids.filter((current) => current !== id) : [...ids, id];
}

export default function SystemRolesScreen() {
  const { theme } = useAppTheme();

  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [form, setForm] = useState<RoleForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [loadError, setLoadError] = useState('');

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const load = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const [roleData, permissionData] = await Promise.all([
        getRoles(),
        getPermissions(),
      ]);
      setRoles(roleData);
      setPermissions(permissionData);
    } catch (error: any) {
      const message = error?.message ?? 'No se pudieron cargar roles.';
      setLoadError(message);
      Alert.alert('Sistema', message);
    } finally {
      setLoading(false);
    }
  };

  const filteredPermissions = useMemo(() => {
    return groupPermissionsForDisplay(
      permissions.filter((permission) => matchesPermissionSearch(permission, search))
    );
  }, [permissions, search]);

  const selectedPermissionCodes = useMemo(
    () =>
      permissions
        .filter((permission) => form.permissionIds.includes(permission.id))
        .map((permission) => permission.code),
    [form.permissionIds, permissions]
  );

  const openNew = () => {
    setForm(emptyForm);
    setSearch('');
    setModalVisible(true);
  };

  const openEdit = (role: AdminRole) => {
    setForm({
      id: role.id,
      code: role.code,
      name: role.name,
      permissionIds: permissionIds(role),
    });
    setSearch('');
    setModalVisible(true);
  };

  const save = async () => {
    if (!form.code.trim()) {
      Alert.alert('Rol', 'Captura el código del rol.');
      return;
    }

    if (!form.name.trim()) {
      Alert.alert('Rol', 'Captura el nombre del rol.');
      return;
    }

    try {
      setSaving(true);
      if (form.id) {
        await updateRole(form.id, form);
      } else {
        await createRole(form);
      }
      setModalVisible(false);
      await load();
    } catch (error: any) {
      Alert.alert('Rol', error?.message ?? 'No se pudo guardar el rol.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppScreen scroll={false}>
        <ActivityIndicator />
      </AppScreen>
    );
  }

  return (
    <>
      <AppScreen>
        <AppBackButton fallbackRoute="/system" />

        <AppText variant="title" bold>
          Roles
        </AppText>

        <AppCard>
          <AppText variant="subtitle" bold>
            Roles del sistema
          </AppText>
          <AppText color={theme.colors.mutedText}>
            Los permisos son una lista tecnica fija. Aqui solo se asignan a roles.
          </AppText>
        </AppCard>

        <AppButton title="Nuevo rol" onPress={openNew} />

        {loadError ? (
          <AppCard>
            <AppText color={theme.colors.danger}>{loadError}</AppText>
            <AppButton title="Reintentar" variant="secondary" onPress={load} />
          </AppCard>
        ) : roles.length === 0 ? (
          <AppCard>
            <AppText color={theme.colors.mutedText}>
              No se cargaron roles. Revisa que el backend este encendido y vuelve a intentar.
            </AppText>
            <AppButton title="Reintentar" variant="secondary" onPress={load} />
          </AppCard>
        ) : (
          roles.map((role) => (
            <AppCard key={role.id}>
              <View style={styles.roleHeader}>
                <View style={styles.roleText}>
                  <AppText bold>{role.name}</AppText>
                  <AppText variant="caption" color={theme.colors.mutedText}>
                    {formatPermissionCode(role.code)}
                  </AppText>
                  <AppText variant="caption" color={theme.colors.mutedText}>
                    Permisos incluidos: {permissionIds(role).length}
                  </AppText>
                </View>
                <View style={styles.roleAction}>
                  <AppButton title="Editar" variant="secondary" onPress={() => openEdit(role)} />
                </View>
              </View>
            </AppCard>
          ))
        )}
      </AppScreen>

      <AppBottomModal
        visible={modalVisible}
        title={form.id ? 'Editar rol' : 'Nuevo rol'}
        onClose={() => setModalVisible(false)}
        maxHeight="92%"
        showCancelButton={false}
        footer={
          <View style={styles.modalActions}>
            <View style={styles.modalActionButton}>
              <AppButton title="Cancelar" variant="secondary" onPress={() => setModalVisible(false)} />
            </View>
            <View style={styles.modalActionButton}>
              <AppButton title={saving ? 'Guardando...' : 'Guardar rol'} loading={saving} onPress={save} />
            </View>
          </View>
        }
      >
        <AppInput
          label="Código"
          placeholder="EJEMPLO_ROL"
          value={form.code}
          autoCapitalize="characters"
          onChangeText={(code) => setForm((current) => ({ ...current, code }))}
        />

        <AppInput
          label="Nombre"
          placeholder="Nombre visible"
          value={form.name}
          onChangeText={(name) => setForm((current) => ({ ...current, name }))}
        />

        <AppCard>
          <AppText variant="subtitle" bold>
            Permisos existentes
          </AppText>
          <AppText color={theme.colors.mutedText}>
            No se crean permisos aqui; solo se seleccionan los que ya existen en el sistema.
          </AppText>

          <AppInput
            placeholder="Buscar permiso"
            value={search}
            onChangeText={setSearch}
          />

          {filteredPermissions.length === 0 ? (
            <AppText color={theme.colors.mutedText} style={styles.emptyPermissions}>
              No se encontraron permisos con ese filtro.
            </AppText>
          ) : (
            filteredPermissions.map((group) => (
              <View key={group.group} style={styles.permissionGroup}>
                <AppText variant="caption" color={theme.colors.mutedText} bold>
                  {group.group}
                </AppText>

                {group.permissions.map((permission) => {
                  const selected = form.permissionIds.includes(permission.id);
                  const dependencyWarnings = selected
                    ? getSuggestedDependencyWarnings(permission.code, selectedPermissionCodes, permissions)
                    : [];
                  return (
                    <Pressable
                      key={permission.id}
                      onPress={() =>
                        setForm((current) => ({
                          ...current,
                          permissionIds: toggleId(current.permissionIds, permission.id),
                        }))
                      }
                      style={[
                        styles.permissionRow,
                        { borderBottomColor: theme.colors.border },
                      ]}
                    >
                      <View style={styles.permissionText}>
                        <AppText bold={selected}>{permission.name}</AppText>
                        <AppText variant="caption" color={theme.colors.mutedText}>
                          {formatPermissionCode(permission.code)}
                        </AppText>
                        <AppText color={selected ? theme.colors.accent : theme.colors.mutedText} bold={selected}>
                          {selected ? 'Incluido' : 'Agregar'}
                        </AppText>
                        {dependencyWarnings.map((warning) => (
                          <AppText
                            key={warning.text}
                            variant="caption"
                            color={theme.colors.warning}
                          >
                            {warning.text}
                          </AppText>
                        ))}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))
          )}
        </AppCard>

      </AppBottomModal>
    </>
  );
}

const styles = StyleSheet.create({
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalActionButton: {
    flex: 1,
  },
  emptyPermissions: {
    marginTop: 10,
  },
  permissionRow: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  permissionText: {
    flex: 1,
  },
  permissionGroup: {
    marginTop: 14,
  },
  roleAction: {
    minWidth: 110,
  },
  roleHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  roleText: {
    flex: 1,
  },
});
