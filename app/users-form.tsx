import AppBackButton from '@/components/ui/AppBackButton';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppOptionRow from '@/components/ui/AppOptionRow';
import AppScreen from '@/components/ui/AppScreen';
import AppSelectorField from '@/components/ui/AppSelectorField';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import {
  AdminBranch,
  AdminPermission,
  AdminRole,
  createUser,
  getBranches,
  getPermissions,
  getRoles,
  getUser,
  updateUser,
} from '@/services/userAdminService';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  View,
} from 'react-native';

type UserStatus = 'ACTIVE' | 'INACTIVE';

type FormState = {
  branchId: number | null;
  branchIds: number[];
  name: string;
  email: string;
  phone: string;
  password: string;
  passwordChangeRequired: boolean;
  status: UserStatus;
  roleIds: number[];
  permissionIds: number[];
};

const initialForm: FormState = {
  branchId: null,
  branchIds: [],
  name: '',
  email: '',
  phone: '',
  password: '',
  passwordChangeRequired: true,
  status: 'ACTIVE',
  roleIds: [],
  permissionIds: [],
};

function parseId(value: string | string[] | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function selectedNames<T extends { id: number; code?: string; name: string }>(
  items: T[],
  ids: number[],
  emptyText: string
) {
  if (ids.length === 0) return emptyText;
  const selected = items.filter((item) => ids.includes(item.id));
  if (selected.length === 0) return emptyText;
  return selected.map((item) => item.code || item.name).join(', ');
}

function toggleId(ids: number[], id: number) {
  return ids.includes(id) ? ids.filter((currentId) => currentId !== id) : [...ids, id];
}

function currentDefaultBranchId(branches: AdminBranch[]) {
  return branches.find((branch) => branch.status !== 'INACTIVE')?.id ?? branches[0]?.id ?? null;
}

function mergeIds(ids: number[], requiredId: number | null) {
  const merged = requiredId ? [requiredId, ...ids] : ids;
  return Array.from(new Set(merged));
}

export default function UsersFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const userId = parseId(id);
  const isEdit = userId !== null;
  const { theme } = useAppTheme();

  const [form, setForm] = useState<FormState>(initialForm);
  const [branches, setBranches] = useState<AdminBranch[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [branchModalVisible, setBranchModalVisible] = useState(false);
  const [assignedBranchesModalVisible, setAssignedBranchesModalVisible] = useState(false);
  const [rolesModalVisible, setRolesModalVisible] = useState(false);
  const [permissionsModalVisible, setPermissionsModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [branchesData, rolesData, permissionsData] = await Promise.all([
        getBranches(),
        getRoles(),
        getPermissions(),
      ]);

      setBranches(branchesData);
      setRoles(rolesData);
      setPermissions(permissionsData);

      if (userId) {
        const user = await getUser(userId);
        const assignedBranchIds = user.branches?.length
          ? user.branches.map((branch) => branch.id)
          : [user.branchId];
        setForm({
          branchId: user.branchId,
          branchIds: mergeIds(assignedBranchIds, user.branchId),
          name: user.name ?? '',
          email: user.email ?? '',
          phone: user.phone ?? '',
          password: '',
          passwordChangeRequired: Boolean(user.passwordChangeRequired),
          status: String(user.status).toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
          roleIds: (user.roles ?? []).map((role) => role.id),
          permissionIds: (user.directPermissions ?? []).map((permission) => permission.id),
        });
      } else {
        const defaultBranchId = currentDefaultBranchId(branchesData);

        setForm((current) => ({
          ...current,
          branchId: current.branchId ?? defaultBranchId,
          branchIds: mergeIds(current.branchIds, current.branchId ?? defaultBranchId),
        }));
      }
    } catch (error: any) {
      Alert.alert('No se pudo cargar el formulario', error?.message ?? 'Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedBranch = useMemo(
    () => branches.find((branch) => branch.id === form.branchId),
    [branches, form.branchId]
  );

  const selectedAssignedBranches = useMemo(
    () => selectedNames(branches, mergeIds(form.branchIds, form.branchId), 'Seleccionar sucursales'),
    [branches, form.branchId, form.branchIds]
  );

  const validate = () => {
    if (!form.name.trim()) {
      Alert.alert('Falta nombre', 'Captura el nombre del usuario.');
      return false;
    }

    if (!form.email.trim()) {
      Alert.alert('Falta correo', 'Captura el correo del usuario.');
      return false;
    }

    if (!form.branchId) {
      Alert.alert('Falta sucursal', 'Selecciona una sucursal.');
      return false;
    }

    if (form.roleIds.length === 0) {
      Alert.alert('Falta rol', 'Selecciona al menos un rol para el usuario.');
      return false;
    }

    if (!isEdit && !form.password.trim()) {
      Alert.alert('Falta contraseña', 'Captura una contraseña inicial para el usuario.');
      return false;
    }

    return true;
  };

  const save = async () => {
    if (!validate()) return;

    try {
      setIsSaving(true);

      const payload = {
        branchId: form.branchId!,
        branchIds: mergeIds(form.branchIds, form.branchId),
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        passwordChangeRequired: form.passwordChangeRequired,
        status: form.status,
        roleIds: form.roleIds,
        permissionIds: form.permissionIds,
      };

      if (isEdit && userId) {
        await updateUser(userId, payload);
      } else {
        await createUser(payload);
      }

      router.replace('/users' as any);
    } catch (error: any) {
      Alert.alert('No se pudo guardar', error?.message ?? 'Revisa los datos e intenta nuevamente.');
    } finally {
      setIsSaving(false);
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
    <>
      <AppScreen>
        <AppBackButton fallbackRoute="/users" preferHistory={false} />

        <AppText variant="title" bold>
          {isEdit ? 'Editar usuario' : 'Nuevo usuario'}
        </AppText>

        <AppCard>
          <AppText variant="subtitle" bold>
            Datos generales
          </AppText>

          <AppInput
            label="Nombre"
            value={form.name}
            onChangeText={(name) => setForm((current) => ({ ...current, name }))}
            placeholder="Nombre completo"
          />

          <AppInput
            label="Correo electrónico"
            value={form.email}
            onChangeText={(email) => setForm((current) => ({ ...current, email }))}
            placeholder="correo@ejemplo.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <AppInput
            label="Teléfono"
            value={form.phone}
            onChangeText={(phone) => setForm((current) => ({ ...current, phone }))}
            placeholder="Opcional"
            keyboardType="phone-pad"
          />

          <AppInput
            label={isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña inicial'}
            value={form.password}
            onChangeText={(password) => setForm((current) => ({ ...current, password }))}
            placeholder={isEdit ? 'Dejar vacío para no cambiar' : 'Contraseña'}
            secureTextEntry
          />

          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <AppText>Forzar cambio en siguiente login</AppText>
              <AppText variant="caption" color={theme.colors.mutedText}>
                Recomendado cuando soporte asigna o resetea una contraseña.
              </AppText>
            </View>
            <Switch
              value={form.passwordChangeRequired}
              onValueChange={(passwordChangeRequired) =>
                setForm((current) => ({ ...current, passwordChangeRequired }))
              }
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={form.passwordChangeRequired ? theme.colors.accent : theme.colors.surface}
            />
          </View>

          <AppSelectorField
            label="Sucursal principal"
            value={selectedBranch ? `${selectedBranch.code} · ${selectedBranch.name}` : null}
            placeholder="Seleccionar sucursal"
            onPress={() => setBranchModalVisible(true)}
          />

          <AppSelectorField
            label="Sucursales asignadas"
            value={selectedAssignedBranches}
            placeholder="Seleccionar sucursales"
            onPress={() => setAssignedBranchesModalVisible(true)}
          />

          <AppText color={theme.colors.mutedText} variant="caption">
            La sucursal principal se usa por defecto. Las asignadas permiten ver dashboard y operar varias sucursales.
          </AppText>
        </AppCard>

        <AppCard>
          <AppText variant="subtitle" bold>
            Acceso
          </AppText>

          <AppSelectorField
            label="Roles"
            value={selectedNames(roles, form.roleIds, 'Seleccionar roles')}
            placeholder="Seleccionar roles"
            onPress={() => setRolesModalVisible(true)}
          />

          <AppSelectorField
            label="Permisos adicionales"
            value={selectedNames(permissions, form.permissionIds, 'Sin permisos adicionales')}
            placeholder="Seleccionar permisos adicionales"
            onPress={() => setPermissionsModalVisible(true)}
          />

          <AppText color={theme.colors.mutedText} variant="caption">
            Los roles definen las capacidades base. Los permisos adicionales solo refinan acciones específicas.
          </AppText>
        </AppCard>

        <AppCard>
          <AppText variant="subtitle" bold>
            Estado
          </AppText>

          <View style={styles.statusRow}>
            <Pressable
              onPress={() => setForm((current) => ({ ...current, status: 'ACTIVE' }))}
              style={[
                styles.statusOption,
                {
                  borderColor: form.status === 'ACTIVE' ? theme.colors.accent : theme.colors.border,
                  backgroundColor:
                    form.status === 'ACTIVE'
                      ? theme.colors.optionPressedBackground
                      : theme.colors.inputBackground,
                  borderRadius: theme.radius.md,
                },
              ]}
            >
              <AppText bold={form.status === 'ACTIVE'}>Activo</AppText>
            </Pressable>

            <Pressable
              onPress={() => setForm((current) => ({ ...current, status: 'INACTIVE' }))}
              style={[
                styles.statusOption,
                {
                  borderColor: form.status === 'INACTIVE' ? theme.colors.accent : theme.colors.border,
                  backgroundColor:
                    form.status === 'INACTIVE'
                      ? theme.colors.optionPressedBackground
                      : theme.colors.inputBackground,
                  borderRadius: theme.radius.md,
                },
              ]}
            >
              <AppText bold={form.status === 'INACTIVE'}>Inactivo</AppText>
            </Pressable>
          </View>
        </AppCard>

        <AppButton title="Guardar" loading={isSaving} onPress={save} />
      </AppScreen>

      <AppBottomModal
        visible={branchModalVisible}
        title="Seleccionar sucursal"
        onClose={() => setBranchModalVisible(false)}
      >
        {branches.map((branch) => (
          <AppOptionRow
            key={branch.id}
            title={`${branch.code} · ${branch.name}`}
            subtitle={branch.status === 'INACTIVE' ? 'Inactiva' : 'Activa'}
            onPress={() => {
              setForm((current) => ({
                ...current,
                branchId: branch.id,
                branchIds: mergeIds(current.branchIds, branch.id),
              }));
              setBranchModalVisible(false);
            }}
          />
        ))}
      </AppBottomModal>

      <AppBottomModal
        visible={assignedBranchesModalVisible}
        title="Sucursales asignadas"
        onClose={() => setAssignedBranchesModalVisible(false)}
      >
        <AppText color={theme.colors.mutedText} style={styles.modalDescription}>
          La sucursal principal siempre queda asignada. Agrega otras cuando el usuario atienda mas de una sucursal.
        </AppText>

        {branches.map((branch) => {
          const selected = mergeIds(form.branchIds, form.branchId).includes(branch.id);
          const isPrimary = form.branchId === branch.id;
          return (
            <AppOptionRow
              key={branch.id}
              title={`${branch.code} - ${branch.name}`}
              subtitle={isPrimary ? 'Principal' : branch.status === 'INACTIVE' ? 'Inactiva' : 'Asignable'}
              onPress={() =>
                setForm((current) => ({
                  ...current,
                  branchIds: isPrimary ? mergeIds(current.branchIds, current.branchId) : toggleId(current.branchIds, branch.id),
                }))
              }
            >
              <AppText color={selected ? theme.colors.accent : theme.colors.mutedText} bold={selected}>
                {selected ? 'Asignada' : 'Tocar para asignar'}
              </AppText>
            </AppOptionRow>
          );
        })}

        <View style={styles.modalActions}>
          <AppButton title="Listo" onPress={() => setAssignedBranchesModalVisible(false)} />
        </View>
      </AppBottomModal>

      <AppBottomModal
        visible={rolesModalVisible}
        title="Seleccionar roles"
        onClose={() => setRolesModalVisible(false)}
      >
        {roles.map((role) => {
          const selected = form.roleIds.includes(role.id);
          return (
            <AppOptionRow
              key={role.id}
              title={role.code}
              subtitle={role.name}
              onPress={() =>
                setForm((current) => ({
                  ...current,
                  roleIds: toggleId(current.roleIds, role.id),
                }))
              }
            >
              <AppText color={selected ? theme.colors.accent : theme.colors.mutedText} bold={selected}>
                {selected ? 'Seleccionado' : 'Tocar para seleccionar'}
              </AppText>
            </AppOptionRow>
          );
        })}

        <View style={styles.modalActions}>
          <AppButton title="Listo" onPress={() => setRolesModalVisible(false)} />
        </View>
      </AppBottomModal>

      <AppBottomModal
        visible={permissionsModalVisible}
        title="Permisos adicionales"
        onClose={() => setPermissionsModalVisible(false)}
      >
        <AppText color={theme.colors.mutedText} style={styles.modalDescription}>
          Estos permisos se agregan directamente al usuario además de los que obtiene por rol.
        </AppText>

        {permissions.map((permission) => {
          const selected = form.permissionIds.includes(permission.id);
          return (
            <AppOptionRow
              key={permission.id}
              title={permission.code}
              subtitle={permission.name}
              onPress={() =>
                setForm((current) => ({
                  ...current,
                  permissionIds: toggleId(current.permissionIds, permission.id),
                }))
              }
            >
              <AppText color={selected ? theme.colors.accent : theme.colors.mutedText} bold={selected}>
                {selected ? 'Seleccionado' : 'Tocar para seleccionar'}
              </AppText>
            </AppOptionRow>
          );
        })}

        <View style={styles.modalActions}>
          <AppButton title="Listo" onPress={() => setPermissionsModalVisible(false)} />
        </View>
      </AppBottomModal>
    </>
  );
}

const styles = StyleSheet.create({
  statusRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statusOption: {
    borderWidth: 1,
    flex: 1,
    padding: 14,
  },
  modalDescription: {
    marginTop: 12,
    marginBottom: 10,
  },
  modalActions: {
    marginTop: 12,
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  switchText: {
    flex: 1,
  },
});
