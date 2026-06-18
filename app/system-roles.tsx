import AppShellPage from '@/components/layout/AppShellPage';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
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
import { useTranslation } from 'react-i18next';
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
  const { t, i18n } = useTranslation('common');

  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [form, setForm] = useState<RoleForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [loadError, setLoadError] = useState('');
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

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
      const message = error?.message ?? t('systemRoles.loadError');
      setLoadError(message);
      Alert.alert(t('system.title'), message);
    } finally {
      setLoading(false);
    }
  };

  const filteredPermissions = useMemo(() => {
    return groupPermissionsForDisplay(
      permissions.filter((permission) => matchesPermissionSearch(permission, search, i18n.language)),
      i18n.language
    );
  }, [i18n.language, permissions, search]);

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
    setShowTechnicalDetails(false);
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
    setShowTechnicalDetails(false);
    setModalVisible(true);
  };

  const save = async () => {
    if (!form.code.trim()) {
      Alert.alert(t('systemRoles.title'), t('systemRoles.codeRequired'));
      return;
    }

    if (!form.name.trim()) {
      Alert.alert(t('systemRoles.title'), t('systemRoles.nameRequired'));
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
      Alert.alert(t('systemRoles.title'), error?.message ?? t('systemRoles.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppShellPage
        title={t('systemRoles.title')}
        subtitle={t('systemRoles.cardHelp')}
        activeRoute="system-roles"
      >
        <ActivityIndicator />
      </AppShellPage>
    );
  }

  return (
    <>
      <AppShellPage
        title={t('systemRoles.title')}
        subtitle={t('systemRoles.cardHelp')}
        activeRoute="system-roles"
        rightContent={<AppButton title={t('systemRoles.newRole')} variant="secondary" onPress={openNew} />}
      >
        <AppCard>
          <AppText variant="subtitle" bold>
            {t('systemRoles.cardTitle')}
          </AppText>
          <AppText color={theme.colors.mutedText}>
            {t('systemRoles.cardHelp')}
          </AppText>
        </AppCard>

        {loadError ? (
          <AppCard>
            <AppText color={theme.colors.danger}>{loadError}</AppText>
            <AppButton title={t('common.retry')} variant="secondary" onPress={load} />
          </AppCard>
        ) : roles.length === 0 ? (
          <AppCard>
            <AppText color={theme.colors.mutedText}>
              {t('systemRoles.empty')}
            </AppText>
            <AppButton title={t('common.retry')} variant="secondary" onPress={load} />
          </AppCard>
        ) : (
          roles.map((role) => (
            <AppCard key={role.id}>
              <View style={styles.roleHeader}>
                <View style={styles.roleText}>
                  <AppText bold>{role.name}</AppText>
                  <AppText variant="caption" color={theme.colors.mutedText}>
                    {formatPermissionCode(role.code, i18n.language)}
                  </AppText>
                  <AppText variant="caption" color={theme.colors.mutedText}>
                    {t('systemRoles.includedPermissions', { count: permissionIds(role).length })}
                  </AppText>
                </View>
                <View style={styles.roleAction}>
                  <AppButton title={t('systemRoles.edit')} variant="secondary" onPress={() => openEdit(role)} />
                </View>
              </View>
            </AppCard>
          ))
        )}
      </AppShellPage>

      <AppBottomModal
        visible={modalVisible}
        title={form.id ? t('systemRoles.editRole') : t('systemRoles.newRole')}
        onClose={() => setModalVisible(false)}
        maxHeight="92%"
        showCancelButton={false}
        footer={
          <View style={styles.modalActions}>
            <View style={styles.modalActionButton}>
              <AppButton title={t('systemRoles.cancel')} variant="secondary" onPress={() => setModalVisible(false)} />
            </View>
            <View style={styles.modalActionButton}>
              <AppButton title={saving ? t('common.saving') : t('systemRoles.saveRole')} loading={saving} onPress={save} />
            </View>
          </View>
        }
      >
        <AppInput
          label={t('systemRoles.code')}
          placeholder="EJEMPLO_ROL"
          value={form.code}
          autoCapitalize="characters"
          onChangeText={(code) => setForm((current) => ({ ...current, code }))}
        />

        <AppInput
          label={t('systemRoles.name')}
          placeholder={t('systemRoles.visibleName')}
          value={form.name}
          onChangeText={(name) => setForm((current) => ({ ...current, name }))}
        />

        <AppCard>
          <AppText variant="subtitle" bold>
            {t('systemRoles.existingPermissions')}
          </AppText>
          <AppText color={theme.colors.mutedText}>
            {t('systemRoles.existingPermissionsHelp')}
          </AppText>

          <AppInput
            placeholder={t('systemRoles.searchPermission')}
            value={search}
            onChangeText={setSearch}
          />

          <View style={styles.technicalToggle}>
            <AppButton
              title={
                showTechnicalDetails
                  ? t('systemRoles.hideTechnicalDetails')
                  : t('systemRoles.showTechnicalDetails')
              }
              variant="secondary"
              onPress={() => setShowTechnicalDetails((current) => !current)}
            />
          </View>

          {filteredPermissions.length === 0 ? (
            <AppText color={theme.colors.mutedText} style={styles.emptyPermissions}>
              {t('systemRoles.noPermissionsFound')}
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
                    ? getSuggestedDependencyWarnings(
                        permission.code,
                        selectedPermissionCodes,
                        permissions,
                        i18n.language
                      )
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
                        <AppText bold={selected}>{formatPermissionCode(permission.code, i18n.language)}</AppText>
                        {showTechnicalDetails ? (
                          <AppText variant="caption" color={theme.colors.mutedText}>
                            {t('systemRoles.internalCode', { code: permission.code })}
                          </AppText>
                        ) : null}
                        <AppText color={selected ? theme.colors.accent : theme.colors.mutedText} bold={selected}>
                          {selected ? t('systemRoles.included') : t('systemRoles.add')}
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
  technicalToggle: {
    alignItems: 'flex-start',
    marginTop: 10,
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
