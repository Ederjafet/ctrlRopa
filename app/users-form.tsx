import AppShellPage from '@/components/layout/AppShellPage';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppOptionRow from '@/components/ui/AppOptionRow';
import AppResponsiveGrid from '@/components/ui/AppResponsiveGrid';
import AppSelectorField from '@/components/ui/AppSelectorField';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import {
  formatPermissionCode,
  groupPermissionsForDisplay,
  matchesPermissionSearch,
  getSuggestedDependencyWarnings,
} from '@/services/permissionDependencies';
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
import { useTranslation } from 'react-i18next';
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
  emptyText: string,
  language = 'es'
) {
  if (ids.length === 0) return emptyText;
  const selected = items.filter((item) => ids.includes(item.id));
  if (selected.length === 0) return emptyText;
  return selected
    .map((item) => (item.code ? formatPermissionCode(item.code, language) : item.name))
    .join(', ');
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
  const { isPhone } = useResponsiveLayout();
  const { t, i18n } = useTranslation('common');

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
  const [draftRoleIds, setDraftRoleIds] = useState<number[]>([]);
  const [draftPermissionIds, setDraftPermissionIds] = useState<number[]>([]);
  const [permissionSearch, setPermissionSearch] = useState('');
  const [showPermissionTechnicalDetails, setShowPermissionTechnicalDetails] = useState(false);

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
      Alert.alert(t('usersForm.loadErrorTitle'), error?.message ?? t('usersForm.retryHelp'));
    } finally {
      setIsLoading(false);
    }
  }, [t, userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedBranch = useMemo(
    () => branches.find((branch) => branch.id === form.branchId),
    [branches, form.branchId]
  );

  const selectedAssignedBranches = useMemo(
    () =>
      selectedNames(
        branches,
        mergeIds(form.branchIds, form.branchId),
        t('usersForm.selectBranches'),
        i18n.language
      ),
    [branches, form.branchId, form.branchIds, i18n.language, t]
  );

  const draftPermissionCodes = useMemo(
    () =>
      permissions
        .filter((permission) => draftPermissionIds.includes(permission.id))
        .map((permission) => permission.code),
    [draftPermissionIds, permissions]
  );

  const groupedPermissionOptions = useMemo(
    () =>
      groupPermissionsForDisplay(
        permissions.filter((permission) => matchesPermissionSearch(permission, permissionSearch, i18n.language)),
        i18n.language
      ),
    [i18n.language, permissionSearch, permissions]
  );

  const openRolesModal = () => {
    setDraftRoleIds(form.roleIds);
    setRolesModalVisible(true);
  };

  const cancelRolesModal = () => {
    setDraftRoleIds(form.roleIds);
    setRolesModalVisible(false);
  };

  const saveRolesModal = () => {
    setForm((current) => ({ ...current, roleIds: draftRoleIds }));
    setRolesModalVisible(false);
  };

  const openPermissionsModal = () => {
    setDraftPermissionIds(form.permissionIds);
    setPermissionSearch('');
    setShowPermissionTechnicalDetails(false);
    setPermissionsModalVisible(true);
  };

  const cancelPermissionsModal = () => {
    setDraftPermissionIds(form.permissionIds);
    setPermissionSearch('');
    setPermissionsModalVisible(false);
  };

  const savePermissionsModal = () => {
    setForm((current) => ({ ...current, permissionIds: draftPermissionIds }));
    setPermissionSearch('');
    setPermissionsModalVisible(false);
  };

  const validate = () => {
    if (!form.name.trim()) {
      Alert.alert(t('usersForm.missingNameTitle'), t('usersForm.missingNameMessage'));
      return false;
    }

    if (!form.email.trim()) {
      Alert.alert(t('usersForm.missingEmailTitle'), t('usersForm.missingEmailMessage'));
      return false;
    }

    if (!form.branchId) {
      Alert.alert(t('usersForm.missingBranchTitle'), t('usersForm.missingBranchMessage'));
      return false;
    }

    if (form.roleIds.length === 0) {
      Alert.alert(t('usersForm.missingRoleTitle'), t('usersForm.missingRoleMessage'));
      return false;
    }

    if (!isEdit && !form.password.trim()) {
      Alert.alert(t('usersForm.missingPasswordTitle'), t('usersForm.missingPasswordMessage'));
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
      Alert.alert(t('usersForm.saveErrorTitle'), error?.message ?? t('usersForm.retryHelp'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AppShellPage
        title={isEdit ? t('usersForm.editTitle') : t('usersForm.newTitle')}
        subtitle={t('usersForm.subtitle')}
        activeRoute="users"
        compactHeader
      >
        <ActivityIndicator />
      </AppShellPage>
    );
  }

  return (
    <>
      <AppShellPage
        title={isEdit ? t('usersForm.editTitle') : t('usersForm.newTitle')}
        subtitle={t('usersForm.subtitle')}
        activeRoute="users"
        compactHeader
      >
        <AppCard>
          <AppText variant="subtitle" bold>
            {t('usersForm.generalData')}
          </AppText>
          <AppText variant="caption" color={theme.colors.mutedText} style={styles.sectionHint}>
            Datos visibles del usuario dentro de la empresa actual.
          </AppText>

          <AppResponsiveGrid desktopColumns={3}>
            <AppInput
              label={t('usersForm.name')}
              value={form.name}
              onChangeText={(name) => setForm((current) => ({ ...current, name }))}
              placeholder={t('usersForm.fullName')}
            />

            <AppInput
              label={t('usersForm.email')}
              value={form.email}
              onChangeText={(email) => setForm((current) => ({ ...current, email }))}
              placeholder="correo@ejemplo.com"
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <AppInput
              label={t('usersForm.phone')}
              value={form.phone}
              onChangeText={(phone) => setForm((current) => ({ ...current, phone }))}
              placeholder={t('usersForm.optional')}
              keyboardType="phone-pad"
            />
          </AppResponsiveGrid>

          <AppResponsiveGrid desktopColumns={3}>
          <AppInput
            label={isEdit ? t('usersForm.newPasswordOptional') : t('usersForm.initialPassword')}
            value={form.password}
            onChangeText={(password) => setForm((current) => ({ ...current, password }))}
            placeholder={isEdit ? t('usersForm.leaveEmptyPassword') : t('usersForm.password')}
            secureTextEntry
          />

          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <AppText>{t('usersForm.forcePasswordChange')}</AppText>
              <AppText variant="caption" color={theme.colors.mutedText}>
                {t('usersForm.forcePasswordChangeHelp')}
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
            label={t('usersForm.primaryBranch')}
            value={selectedBranch ? `${selectedBranch.code} Â· ${selectedBranch.name}` : null}
            placeholder={t('usersForm.selectBranch')}
            onPress={() => setBranchModalVisible(true)}
          />

          <AppSelectorField
            label={t('usersForm.assignedBranches')}
            value={selectedAssignedBranches}
            placeholder={t('usersForm.selectBranches')}
            onPress={() => setAssignedBranchesModalVisible(true)}
          />
          </AppResponsiveGrid>

          <AppText color={theme.colors.mutedText} variant="caption">
            {t('usersForm.branchHelp')}
          </AppText>
        </AppCard>

        <AppCard>
          <AppText variant="subtitle" bold>
            {t('usersForm.access')}
          </AppText>
          <AppText variant="caption" color={theme.colors.mutedText} style={styles.sectionHint}>
            Rol y permisos directos se asignan dentro del alcance tenant actual.
          </AppText>

          <AppResponsiveGrid desktopColumns={2}>
            <AppSelectorField
              label={t('usersForm.roles')}
              value={selectedNames(roles, form.roleIds, t('usersForm.selectRoles'), i18n.language)}
              placeholder={t('usersForm.selectRoles')}
              onPress={openRolesModal}
            />

            <AppSelectorField
              label={t('usersForm.directPermissions')}
              value={selectedNames(
                permissions,
                form.permissionIds,
                t('usersForm.noDirectPermissions'),
                i18n.language
              )}
              placeholder={t('usersForm.selectDirectPermissions')}
              onPress={openPermissionsModal}
            />
          </AppResponsiveGrid>

          <AppText color={theme.colors.mutedText} variant="caption">
            {t('usersForm.accessHelp')}
          </AppText>
        </AppCard>

        <AppCard>
          <AppText variant="subtitle" bold>
            {t('usersForm.status')}
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
              <AppText bold={form.status === 'ACTIVE'}>{t('usersForm.active')}</AppText>
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
              <AppText bold={form.status === 'INACTIVE'}>{t('usersForm.inactive')}</AppText>
            </Pressable>
          </View>
        </AppCard>

        <View style={[styles.formActions, isPhone ? styles.formActionsMobile : null]}>
          <AppButton
            title={t('common.back')}
            variant="secondary"
            onPress={() => router.replace('/users' as any)}
            style={isPhone ? styles.mobileAction : styles.secondaryAction}
          />
          <AppButton
            title={t('common.save')}
            loading={isSaving}
            onPress={save}
            style={isPhone ? styles.mobileAction : styles.primaryAction}
          />
        </View>
      </AppShellPage>

      <AppBottomModal
        visible={branchModalVisible}
        title={t('usersForm.selectBranch')}
        onClose={() => setBranchModalVisible(false)}
      >
        {branches.map((branch) => (
          <AppOptionRow
            key={branch.id}
            title={`${branch.code} Â· ${branch.name}`}
            subtitle={branch.status === 'INACTIVE' ? t('usersForm.inactive') : t('usersForm.active')}
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
        title={t('usersForm.assignedBranches')}
        onClose={() => setAssignedBranchesModalVisible(false)}
      >
        <AppText color={theme.colors.mutedText} style={styles.modalDescription}>
          {t('usersForm.assignedBranchesHelp')}
        </AppText>

        {branches.map((branch) => {
          const selected = mergeIds(form.branchIds, form.branchId).includes(branch.id);
          const isPrimary = form.branchId === branch.id;
          return (
            <AppOptionRow
              key={branch.id}
              title={`${branch.code} - ${branch.name}`}
              subtitle={isPrimary ? t('usersForm.primary') : branch.status === 'INACTIVE' ? t('usersForm.inactive') : t('usersForm.assignable')}
              onPress={() =>
                setForm((current) => ({
                  ...current,
                  branchIds: isPrimary ? mergeIds(current.branchIds, current.branchId) : toggleId(current.branchIds, branch.id),
                }))
              }
            >
              <AppText color={selected ? theme.colors.accent : theme.colors.mutedText} bold={selected}>
                {selected ? t('usersForm.assigned') : t('usersForm.tapToAssign')}
              </AppText>
            </AppOptionRow>
          );
        })}

        <View style={styles.modalActions}>
          <AppButton title={t('common.close')} onPress={() => setAssignedBranchesModalVisible(false)} />
        </View>
      </AppBottomModal>

      <AppBottomModal
        visible={rolesModalVisible}
        title={t('usersForm.selectRoles')}
        onClose={cancelRolesModal}
        maxHeight="88%"
        showCancelButton={false}
        footer={
          <View style={styles.modalFooterActions}>
            <View style={styles.modalFooterButton}>
              <AppButton title={t('common.cancel')} variant="secondary" onPress={cancelRolesModal} />
            </View>
            <View style={styles.modalFooterButton}>
              <AppButton title={t('common.save')} onPress={saveRolesModal} />
            </View>
          </View>
        }
      >
        {roles.map((role) => {
          const selected = draftRoleIds.includes(role.id);
          return (
            <AppOptionRow
              key={role.id}
              title={role.name}
              subtitle={formatPermissionCode(role.code, i18n.language)}
              onPress={() =>
                setDraftRoleIds((current) => toggleId(current, role.id))
              }
            >
              <AppText color={selected ? theme.colors.accent : theme.colors.mutedText} bold={selected}>
                {selected ? t('usersForm.selected') : t('usersForm.add')}
              </AppText>
            </AppOptionRow>
          );
        })}

      </AppBottomModal>

      <AppBottomModal
        visible={permissionsModalVisible}
        title={t('usersForm.directPermissions')}
        onClose={cancelPermissionsModal}
        maxHeight="88%"
        showCancelButton={false}
        footer={
          <View style={styles.modalFooterActions}>
            <View style={styles.modalFooterButton}>
              <AppButton title={t('common.cancel')} variant="secondary" onPress={cancelPermissionsModal} />
            </View>
            <View style={styles.modalFooterButton}>
              <AppButton title={t('usersForm.savePermissions')} onPress={savePermissionsModal} />
            </View>
          </View>
        }
      >
        <AppText color={theme.colors.mutedText} style={styles.modalDescription}>
          {t('usersForm.directPermissionsHelp')}
        </AppText>

        <AppInput
          placeholder={t('usersForm.searchPermissions')}
          value={permissionSearch}
          onChangeText={setPermissionSearch}
        />

        <View style={styles.technicalToggle}>
          <AppButton
            title={
              showPermissionTechnicalDetails
                ? t('systemRoles.hideTechnicalDetails')
                : t('systemRoles.showTechnicalDetails')
            }
            variant="secondary"
            onPress={() => setShowPermissionTechnicalDetails((current) => !current)}
          />
        </View>

        {groupedPermissionOptions.length === 0 ? (
          <AppText color={theme.colors.mutedText} style={styles.emptyPermissions}>
            {t('usersForm.noPermissionsFound')}
          </AppText>
        ) : (
          groupedPermissionOptions.map((group) => (
            <View key={group.group} style={styles.permissionGroup}>
              <AppText variant="caption" color={theme.colors.mutedText} bold>
                {group.group}
              </AppText>

              {group.permissions.map((permission) => {
                const selected = draftPermissionIds.includes(permission.id);
                const dependencyWarnings = selected
                  ? getSuggestedDependencyWarnings(
                      permission.code,
                      draftPermissionCodes,
                      permissions,
                      i18n.language
                    )
                  : [];
                return (
                  <AppOptionRow
                    key={permission.id}
                    title={formatPermissionCode(permission.code, i18n.language)}
                    subtitle={
                      showPermissionTechnicalDetails
                        ? t('systemRoles.internalCode', { code: permission.code })
                        : undefined
                    }
                    onPress={() =>
                      setDraftPermissionIds((current) => toggleId(current, permission.id))
                    }
                  >
                    <View style={styles.permissionStatusRow}>
                      <AppText color={selected ? theme.colors.accent : theme.colors.mutedText} bold={selected}>
                        {selected ? t('systemRoles.included') : t('usersForm.add')}
                      </AppText>
                    </View>
                    {dependencyWarnings.map((warning) => (
                      <AppText
                        key={warning.text}
                        variant="caption"
                        color={theme.colors.warning}
                      >
                        {warning.text}
                      </AppText>
                    ))}
                  </AppOptionRow>
                );
              })}
            </View>
          ))
        )}
      </AppBottomModal>
    </>
  );
}

const styles = StyleSheet.create({
  formActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  formActionsMobile: {
    alignItems: 'stretch',
    flexDirection: 'column',
  },
  mobileAction: {
    width: '100%',
  },
  primaryAction: {
    minWidth: 180,
  },
  secondaryAction: {
    minWidth: 130,
  },
  sectionHint: {
    marginBottom: 12,
  },
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
  modalFooterActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalFooterButton: {
    flex: 1,
  },
  emptyPermissions: {
    marginTop: 10,
  },
  permissionGroup: {
    marginTop: 14,
  },
  technicalToggle: {
    alignItems: 'flex-start',
    marginBottom: 4,
    marginTop: 10,
  },
  permissionStatusRow: {
    alignItems: 'flex-start',
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
