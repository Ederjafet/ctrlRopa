import AppShellPage from '@/components/layout/AppShellPage';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppText from '@/components/ui/AppText';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAppTheme } from '@/context/AppThemeContext';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { canAccessPlatform, hasEffectivePermission } from '@/services/accessControl';
import { getActionableApiErrorMessage } from '@/services/apiError';
import {
  createPlatformBranch,
  createPlatformCompany,
  createPlatformUser,
  getPlatformBranches,
  createPlatformTenantAdmin,
  getPlatformCompanies,
  getPlatformCompanyDetail,
  getPlatformCompanySettings,
  getPlatformUsers,
  updatePlatformCompanySettings,
  PlatformBranch,
  PlatformCompany,
  PlatformCompanyDetail,
  PlatformCompanySettings,
  PlatformCompanyUser,
} from '@/services/platformService';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';

const EMPTY_COMPANY_FORM = {
  name: '',
  legalName: '',
  branchName: 'Sucursal Principal',
};

const EMPTY_ADMIN_FORM = {
  name: '',
  email: '',
  password: '',
};

const EMPTY_BRANCH_FORM = {
  name: '',
  code: '',
};

const EMPTY_USER_FORM = {
  name: '',
  email: '',
  password: '',
  phone: '',
  role: 'SELLER',
  branchId: null as number | null,
};

const EMPTY_SETTINGS_FORM = {
  maxUsers: '',
  maxBranches: '',
};

type ActivePanel = 'overview' | 'company' | 'admin' | 'branches' | 'users' | 'settings';

const TENANT_ROLE_OPTIONS = [
  { code: 'ADMIN', label: 'Admin' },
  { code: 'SUPERVISOR', label: 'Supervisor' },
  { code: 'SELLER', label: 'Vendedor' },
  { code: 'CASHIER', label: 'Caja' },
];

export default function PlatformScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { isPhone } = useResponsiveLayout();

  const [session, setSession] = useState<UserSession | null>(null);
  const [companies, setCompanies] = useState<PlatformCompany[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [selectedCompanyDetail, setSelectedCompanyDetail] = useState<PlatformCompanyDetail | null>(null);
  const [companyBranches, setCompanyBranches] = useState<PlatformBranch[]>([]);
  const [companyUsers, setCompanyUsers] = useState<PlatformCompanyUser[]>([]);
  const [companySettings, setCompanySettings] = useState<PlatformCompanySettings | null>(null);
  const [companyForm, setCompanyForm] = useState(EMPTY_COMPANY_FORM);
  const [adminForm, setAdminForm] = useState(EMPTY_ADMIN_FORM);
  const [branchForm, setBranchForm] = useState(EMPTY_BRANCH_FORM);
  const [userForm, setUserForm] = useState(EMPTY_USER_FORM);
  const [settingsForm, setSettingsForm] = useState(EMPTY_SETTINGS_FORM);
  const [activePanel, setActivePanel] = useState<ActivePanel>('overview');
  const [loading, setLoading] = useState(true);
  const [loadingCompanyScope, setLoadingCompanyScope] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [creatingCompany, setCreatingCompany] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [creatingBranch, setCreatingBranch] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === selectedCompanyId) ?? null,
    [companies, selectedCompanyId]
  );
  const canManageCompanies = hasEffectivePermission(session, 'MANAGE_COMPANIES');
  const canManageAdmins = hasEffectivePermission(session, 'MANAGE_TENANT_ADMINS');
  const canUseSelectedCompany = Boolean(selectedCompany && selectedCompany.code !== 'APPMODA_PLATFORM');
  const selectedBranchName = useMemo(() => {
    const branch = companyBranches.find((item) => item.id === userForm.branchId);
    return branch ? `${branch.code} · ${branch.name}` : 'Sucursal principal';
  }, [companyBranches, userForm.branchId]);

  const loadCompanyScope = useCallback(async (companyId: number | null) => {
    const company = companies.find((item) => item.id === companyId);

    if (!companyId || company?.code === 'APPMODA_PLATFORM') {
      setSelectedCompanyDetail(null);
      setCompanyBranches([]);
      setCompanyUsers([]);
      setCompanySettings(null);
      setSettingsForm(EMPTY_SETTINGS_FORM);
      setUserForm((current) => ({ ...current, branchId: null }));
      return;
    }

    try {
      setLoadingCompanyScope(true);
      const [detail, branches, users, settings] = await Promise.all([
        getPlatformCompanyDetail(companyId),
        getPlatformBranches(companyId),
        getPlatformUsers(companyId),
        getPlatformCompanySettings(companyId),
      ]);
      setSelectedCompanyDetail(detail);
      setCompanyBranches(branches);
      setCompanyUsers(users);
      setCompanySettings(settings);
      setSettingsForm({
        maxUsers: settings.limits.maxUsers ? String(settings.limits.maxUsers) : '',
        maxBranches: settings.limits.maxBranches ? String(settings.limits.maxBranches) : '',
      });
      setUserForm((current) => ({
        ...current,
        branchId:
          current.branchId && branches.some((branch) => branch.id === current.branchId)
            ? current.branchId
            : branches.find((branch) => branch.status === 'ACTIVE')?.id ?? branches[0]?.id ?? null,
      }));
    } catch (error) {
      setErrorMessage(getActionableApiErrorMessage(error));
    } finally {
      setLoadingCompanyScope(false);
    }
  }, [companies]);

  useEffect(() => {
    loadCompanyScope(selectedCompanyId);
  }, [loadCompanyScope, selectedCompanyId]);

  const loadPlatform = useCallback(async () => {
    const currentSession = await getSession();
    setSession(currentSession);

    if (!canAccessPlatform(currentSession)) {
      router.replace('/access-denied' as any);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      const data = await getPlatformCompanies();
      setCompanies(data);
      setSelectedCompanyId((current) => current ?? data.find((company) => company.code !== 'APPMODA_PLATFORM')?.id ?? null);
    } catch (error) {
      setErrorMessage(getActionableApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadPlatform();
    }, [loadPlatform])
  );

  const refreshCompanies = async () => {
    try {
      setRefreshing(true);
      setErrorMessage('');
      const data = await getPlatformCompanies();
      setCompanies(data);
      if (selectedCompanyId && !data.some((company) => company.id === selectedCompanyId)) {
        setSelectedCompanyId(null);
      }
    } catch (error) {
      setErrorMessage(getActionableApiErrorMessage(error));
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateCompany = async () => {
    if (creatingCompany) return;

    const name = companyForm.name.trim();
    const branchName = companyForm.branchName.trim();

    if (!name || !branchName) {
      setErrorMessage('Captura nombre de empresa y sucursal principal.');
      return;
    }

    try {
      setCreatingCompany(true);
      setErrorMessage('');
      setMessage('');
      const created = await createPlatformCompany({
        name,
        legalName: companyForm.legalName.trim() || undefined,
        branchName,
      });
      setCompanyForm(EMPTY_COMPANY_FORM);
      setSelectedCompanyId(created.id);
      setMessage(`Empresa creada: ${created.name}.`);
      Alert.alert('Empresa creada', `Se creo ${created.name} con sucursal principal.`);
      await refreshCompanies();
    } catch (error) {
      setErrorMessage(getActionableApiErrorMessage(error));
    } finally {
      setCreatingCompany(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (creatingAdmin) return;

    if (!selectedCompany || selectedCompany.code === 'APPMODA_PLATFORM') {
      setErrorMessage('Selecciona una empresa cliente para crear su admin inicial.');
      return;
    }

    const name = adminForm.name.trim();
    const email = adminForm.email.trim();
    const password = adminForm.password;

    if (!name || !email || !password) {
      setErrorMessage('Captura nombre, correo y password inicial del admin.');
      return;
    }

    try {
      setCreatingAdmin(true);
      setErrorMessage('');
      setMessage('');
      const created = await createPlatformTenantAdmin(selectedCompany.id, {
        name,
        email,
        password,
        branchId: userForm.branchId,
      });
      setAdminForm(EMPTY_ADMIN_FORM);
      setMessage(`Admin inicial creado: ${created.email}.`);
      Alert.alert('Admin creado', `El admin ${created.email} quedo activo para ${selectedCompany.name}.`);
      await refreshCompanies();
      await loadCompanyScope(selectedCompany.id);
    } catch (error) {
      setErrorMessage(getActionableApiErrorMessage(error));
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleCreateBranch = async () => {
    if (creatingBranch || !selectedCompany) return;

    const name = branchForm.name.trim();
    const code = branchForm.code.trim();

    if (!canUseSelectedCompany || !name) {
      setErrorMessage('Selecciona una empresa cliente y captura nombre de sucursal.');
      return;
    }

    try {
      setCreatingBranch(true);
      setErrorMessage('');
      setMessage('');
      const created = await createPlatformBranch(selectedCompany.id, {
        name,
        code: code || undefined,
      });
      setBranchForm(EMPTY_BRANCH_FORM);
      setUserForm((current) => ({ ...current, branchId: created.id }));
      setMessage(`Sucursal creada: ${created.name}.`);
      await loadCompanyScope(selectedCompany.id);
      await refreshCompanies();
    } catch (error) {
      setErrorMessage(getActionableApiErrorMessage(error));
    } finally {
      setCreatingBranch(false);
    }
  };

  const handleCreateUser = async () => {
    if (creatingUser || !selectedCompany) return;

    const name = userForm.name.trim();
    const email = userForm.email.trim();
    const password = userForm.password;
    const role = userForm.role.trim();

    if (!canUseSelectedCompany || !name || !email || !password || !role) {
      setErrorMessage('Captura empresa, sucursal, nombre, correo, rol y password inicial.');
      return;
    }

    try {
      setCreatingUser(true);
      setErrorMessage('');
      setMessage('');
      const created = await createPlatformUser(selectedCompany.id, {
        name,
        email,
        password,
        role,
        branchId: userForm.branchId,
        phone: userForm.phone.trim() || null,
      });
      setUserForm((current) => ({
        ...EMPTY_USER_FORM,
        role: current.role,
        branchId: current.branchId,
      }));
      setMessage(`Usuario creado: ${created.email}.`);
      await loadCompanyScope(selectedCompany.id);
      await refreshCompanies();
    } catch (error) {
      setErrorMessage(getActionableApiErrorMessage(error));
    } finally {
      setCreatingUser(false);
    }
  };

  const toggleModule = (code: string) => {
    setCompanySettings((current) => {
      if (!current) return current;

      return {
        ...current,
        modules: current.modules.map((module) =>
          module.code === code ? { ...module, enabled: !module.enabled } : module
        ),
      };
    });
  };

  const parseLimit = (value: string, label: string): number | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const parsed = Number(trimmed);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new Error(`${label} debe ser un numero entero mayor a cero.`);
    }

    return parsed;
  };

  const handleSaveSettings = async () => {
    if (savingSettings || !selectedCompany || !companySettings) return;

    try {
      setSavingSettings(true);
      setErrorMessage('');
      setMessage('');
      const saved = await updatePlatformCompanySettings(selectedCompany.id, {
        modules: companySettings.modules.map((module) => ({
          code: module.code,
          enabled: module.enabled,
        })),
        maxUsers: parseLimit(settingsForm.maxUsers, 'Limite de usuarios'),
        maxBranches: parseLimit(settingsForm.maxBranches, 'Limite de sucursales'),
      });
      setCompanySettings(saved);
      setSettingsForm({
        maxUsers: saved.limits.maxUsers ? String(saved.limits.maxUsers) : '',
        maxBranches: saved.limits.maxBranches ? String(saved.limits.maxBranches) : '',
      });
      setMessage('Modulos y limites actualizados para el cliente seleccionado.');
      await loadCompanyScope(selectedCompany.id);
    } catch (error) {
      setErrorMessage(getActionableApiErrorMessage(error));
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <AppShellPage
        title="Administracion multiempresa AppModa"
        subtitle="Clientes, sucursales, usuarios, modulos y limites SaaS"
        metadata="Modo Plataforma"
        activeRoute="platform"
        session={session}
        compactHeader
      >
        <ActivityIndicator />
      </AppShellPage>
    );
  }

  return (
    <AppShellPage
      title="Administracion multiempresa AppModa"
      subtitle="Clientes, sucursales, usuarios, modulos y limites SaaS"
      metadata="Modo Plataforma"
      activeRoute="platform"
      session={session}
      compactHeader
      rightContent={
        <AppButton
          title="Actualizar"
          variant="secondary"
          loading={refreshing}
          disabled={refreshing}
          onPress={refreshCompanies}
          style={styles.headerButton}
        />
      }
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppCard style={styles.scopeCard}>
          <View style={styles.scopeHeader}>
            <StatusBadge label="ALCANCE SAAS" tone="info" />
            <AppText variant="subtitle" bold>
              Administración multiempresa AppModa
            </AppText>
          </View>
          <AppText color={theme.colors.mutedText}>
            Puedes crear compañías, sucursales y usuarios por cliente. Desde este modo no se operan ventas,
            inventario, pagos ni LIVE mezclando datos de clientes.
          </AppText>
        </AppCard>

        {message ? (
          <AppCard variant="success" style={styles.notice}>
            <AppText>{message}</AppText>
          </AppCard>
        ) : null}

        {errorMessage ? (
          <AppCard variant="danger" style={styles.notice}>
            <AppText>{errorMessage}</AppText>
          </AppCard>
        ) : null}

        <AppCard style={styles.panel}>
          <View style={[styles.companyRow, isPhone ? styles.companyRowMobile : null]}>
            <View style={styles.companyMain}>
              <View style={styles.companyTitleRow}>
                <StatusBadge label="CLIENTE ACTUAL" tone="info" />
                <AppText variant="subtitle" bold>
                  {selectedCompany ? selectedCompany.name : 'Selecciona un cliente'}
                </AppText>
              </View>
              <AppText variant="caption" color={theme.colors.mutedText}>
                {selectedCompany
                  ? `${selectedCompany.code} · ${selectedCompany.branchName || 'Sin sucursal principal'}`
                  : 'Elige una compania para administrar sucursales, usuarios, modulos y limites.'}
              </AppText>
            </View>
            {selectedCompanyDetail ? (
              <View style={styles.scopeStats}>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  Sucursales: {selectedCompanyDetail.branchCount}
                </AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  Usuarios activos: {selectedCompanyDetail.activeUserCount}
                </AppText>
              </View>
            ) : null}
          </View>

          <View style={styles.companySelectorGrid}>
            {companies.map((company) => {
              const selected = company.id === selectedCompanyId;
              const isPlatformCompany = company.code === 'APPMODA_PLATFORM';

              return (
                <AppButton
                  key={company.id}
                  title={isPlatformCompany ? 'AppModa Platform' : company.name}
                  variant={selected ? 'primary' : 'secondary'}
                  disabled={selected || isPlatformCompany}
                  disabledReason={
                    isPlatformCompany
                      ? 'AppModa Platform es el tenant interno del super usuario.'
                      : 'La empresa ya esta seleccionada.'
                  }
                  onPress={() => setSelectedCompanyId(company.id)}
                  style={styles.selectorButton}
                />
              );
            })}
          </View>

          <View style={styles.quickActions}>
            <AppButton
              title="Crear cliente"
              variant={activePanel === 'company' ? 'primary' : 'secondary'}
              onPress={() => setActivePanel('company')}
              style={styles.quickActionButton}
            />
            <AppButton
              title="Admin inicial"
              variant={activePanel === 'admin' ? 'primary' : 'secondary'}
              onPress={() => setActivePanel('admin')}
              style={styles.quickActionButton}
            />
            <AppButton
              title="Sucursales"
              variant={activePanel === 'branches' ? 'primary' : 'secondary'}
              onPress={() => setActivePanel('branches')}
              style={styles.quickActionButton}
            />
            <AppButton
              title="Usuarios"
              variant={activePanel === 'users' ? 'primary' : 'secondary'}
              onPress={() => setActivePanel('users')}
              style={styles.quickActionButton}
            />
            <AppButton
              title="Modulos y limites"
              variant={activePanel === 'settings' ? 'primary' : 'secondary'}
              onPress={() => setActivePanel('settings')}
              style={styles.quickActionButton}
            />
          </View>
        </AppCard>

        {activePanel === 'company' || activePanel === 'admin' ? (
        <View style={[styles.grid, isPhone ? styles.gridMobile : null]}>
          {activePanel === 'company' ? (
          <AppCard style={styles.panel}>
            <View style={styles.sectionHeader}>
              <View style={styles.titleBlock}>
                <StatusBadge label="EMPRESA" tone="info" />
                <AppText variant="subtitle" bold>
                  Crear cliente AppModa
                </AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  Crea empresa y sucursal principal para un nuevo cliente.
                </AppText>
              </View>
            </View>

            <AppInput
              label="Nombre comercial"
              placeholder="Cliente Demo AppModa"
              value={companyForm.name}
              onChangeText={(value) => setCompanyForm((current) => ({ ...current, name: value }))}
              editable={!creatingCompany && canManageCompanies}
            />
            <AppInput
              label="Razon social o referencia"
              placeholder="Cliente Demo"
              value={companyForm.legalName}
              onChangeText={(value) => setCompanyForm((current) => ({ ...current, legalName: value }))}
              editable={!creatingCompany && canManageCompanies}
            />
            <AppInput
              label="Sucursal principal"
              placeholder="Sucursal Principal"
              value={companyForm.branchName}
              onChangeText={(value) => setCompanyForm((current) => ({ ...current, branchName: value }))}
              editable={!creatingCompany && canManageCompanies}
            />
            <AppButton
              title="Crear empresa"
              loading={creatingCompany}
              disabled={creatingCompany || !canManageCompanies}
              disabledReason="Tu usuario necesita MANAGE_COMPANIES para crear empresas."
              onPress={handleCreateCompany}
              style={styles.actionButton}
            />
          </AppCard>
          ) : null}

          {activePanel === 'admin' ? (
          <AppCard style={styles.panel}>
            <View style={styles.sectionHeader}>
              <View style={styles.titleBlock}>
                <StatusBadge label="ADMIN INICIAL" tone="role" />
                <AppText variant="subtitle" bold>
                  Crear admin del cliente
                </AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  Usa un cliente ya creado. No aplica para AppModa Platform.
                </AppText>
              </View>
            </View>

            <View style={styles.selectedCompanyBox}>
              <AppText variant="caption" color={theme.colors.mutedText}>
                Empresa seleccionada
              </AppText>
              <AppText bold numberOfLines={2}>
                {selectedCompany ? selectedCompany.name : 'Selecciona una empresa de la lista'}
              </AppText>
              {selectedCompany?.branchName ? (
                <AppText variant="caption" color={theme.colors.mutedText}>
                  {selectedCompany.branchName}
                </AppText>
              ) : null}
              <AppText variant="caption" color={theme.colors.mutedText}>
                Sucursal destino: {selectedBranchName}
              </AppText>
            </View>

            <AppInput
              label="Nombre del admin"
              placeholder="Administrador Cliente Demo"
              value={adminForm.name}
              onChangeText={(value) => setAdminForm((current) => ({ ...current, name: value }))}
              editable={!creatingAdmin && canManageAdmins}
            />
            <AppInput
              label="Correo"
              placeholder="admin.cliente.demo@local.test"
              autoCapitalize="none"
              keyboardType="email-address"
              value={adminForm.email}
              onChangeText={(value) => setAdminForm((current) => ({ ...current, email: value }))}
              editable={!creatingAdmin && canManageAdmins}
            />
            <AppInput
              label="Password inicial"
              placeholder="AdminCliente123!"
              secureTextEntry
              value={adminForm.password}
              onChangeText={(value) => setAdminForm((current) => ({ ...current, password: value }))}
              editable={!creatingAdmin && canManageAdmins}
            />
            <AppButton
              title="Crear admin inicial"
              loading={creatingAdmin}
              disabled={
                creatingAdmin ||
                !canManageAdmins ||
                !selectedCompany ||
                selectedCompany.code === 'APPMODA_PLATFORM'
              }
              disabledReason="Selecciona una empresa cliente y confirma permiso MANAGE_TENANT_ADMINS."
              onPress={handleCreateAdmin}
              style={styles.actionButton}
            />
          </AppCard>
          ) : null}
        </View>
        ) : null}

        <AppCard style={styles.panel}>
          <View style={[styles.companyRow, isPhone ? styles.companyRowMobile : null]}>
            <View style={styles.companyMain}>
              <View style={styles.companyTitleRow}>
                <StatusBadge label="ALCANCE" tone="info" />
                <AppText variant="subtitle" bold>
                  {selectedCompany ? selectedCompany.name : 'Selecciona una compañía'}
                </AppText>
              </View>
              <AppText variant="caption" color={theme.colors.mutedText}>
                {canUseSelectedCompany
                  ? 'Sucursales y usuarios se administran solo dentro de esta compañía.'
                  : 'AppModa Platform es tenant interno; no se usa para operación de clientes.'}
              </AppText>
            </View>
            {selectedCompanyDetail ? (
              <View style={styles.scopeStats}>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  Sucursales: {selectedCompanyDetail.branchCount}
                </AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  Usuarios activos: {selectedCompanyDetail.activeUserCount}
                </AppText>
              </View>
            ) : null}
          </View>

          {loadingCompanyScope ? (
            <ActivityIndicator style={styles.scopeLoader} />
          ) : canUseSelectedCompany ? (
            <View style={[styles.grid, isPhone ? styles.gridMobile : null]}>
              {activePanel === 'overview' ? (
                <View style={styles.scopeColumn}>
                  <View style={styles.sectionHeader}>
                    <AppText bold>Modo Plataforma AppModa</AppText>
                    <AppText variant="caption" color={theme.colors.mutedText}>
                      Puedes crear clientes, sucursales, usuarios, modulos y limites por cliente. La operacion normal
                      queda aislada por empresa y sucursal.
                    </AppText>
                  </View>
                  <View style={styles.compactList}>
                    <View style={styles.compactRow}>
                      <AppText bold>Clientes visibles</AppText>
                      <StatusBadge label={String(companies.filter((company) => company.code !== 'APPMODA_PLATFORM').length)} tone="info" />
                    </View>
                    <View style={styles.compactRow}>
                      <AppText bold>Sucursales de este cliente</AppText>
                      <StatusBadge label={String(companyBranches.length)} tone="neutral" />
                    </View>
                    <View style={styles.compactRow}>
                      <AppText bold>Usuarios de este cliente</AppText>
                      <StatusBadge label={String(companyUsers.length)} tone="neutral" />
                    </View>
                  </View>
                </View>
              ) : null}
              {activePanel === 'branches' ? (
              <View style={styles.scopeColumn}>
                <View style={styles.sectionHeader}>
                  <AppText bold>Sucursales</AppText>
                  <AppText variant="caption" color={theme.colors.mutedText}>
                    Crea y revisa sucursales sin mezclar compañías.
                  </AppText>
                </View>
                <View style={styles.inlineForm}>
                  <AppInput
                    label="Nueva sucursal"
                    placeholder="Sucursal Centro"
                    value={branchForm.name}
                    onChangeText={(value) => setBranchForm((current) => ({ ...current, name: value }))}
                    editable={!creatingBranch && canManageCompanies}
                  />
                  <AppInput
                    label="Código"
                    placeholder="CENTRO"
                    value={branchForm.code}
                    onChangeText={(value) => setBranchForm((current) => ({ ...current, code: value }))}
                    editable={!creatingBranch && canManageCompanies}
                  />
                  <AppButton
                    title="Crear sucursal"
                    variant="secondary"
                    loading={creatingBranch}
                    disabled={creatingBranch || !canManageCompanies}
                    disabledReason="Tu usuario necesita MANAGE_COMPANIES para crear sucursales."
                    onPress={handleCreateBranch}
                    style={styles.actionButton}
                  />
                </View>

                <View style={styles.compactList}>
                  {companyBranches.length === 0 ? (
                    <AppText variant="caption" color={theme.colors.mutedText}>
                      No hay sucursales para esta compañía.
                    </AppText>
                  ) : (
                    companyBranches.map((branch) => (
                      <View key={branch.id} style={styles.compactRow}>
                        <View style={styles.companyMain}>
                          <AppText bold numberOfLines={1}>
                            {branch.code} · {branch.name}
                          </AppText>
                          <AppText variant="caption" color={theme.colors.mutedText}>
                            ID {branch.id}
                          </AppText>
                        </View>
                        <StatusBadge
                          label={branch.status}
                          tone={branch.status === 'ACTIVE' ? 'success' : 'neutral'}
                        />
                      </View>
                    ))
                  )}
                </View>
              </View>
              ) : null}

              {activePanel === 'users' ? (
              <View style={styles.scopeColumn}>
                <View style={styles.sectionHeader}>
                  <AppText bold>Usuarios de compañía</AppText>
                  <AppText variant="caption" color={theme.colors.mutedText}>
                    Altas tenant dentro de la compañía seleccionada.
                  </AppText>
                </View>
                <View style={styles.inlineForm}>
                  <AppInput
                    label="Nombre"
                    placeholder="Vendedor Centro"
                    value={userForm.name}
                    onChangeText={(value) => setUserForm((current) => ({ ...current, name: value }))}
                    editable={!creatingUser && canManageAdmins}
                  />
                  <AppInput
                    label="Correo"
                    placeholder="vendedor.centro@cliente.test"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={userForm.email}
                    onChangeText={(value) => setUserForm((current) => ({ ...current, email: value }))}
                    editable={!creatingUser && canManageAdmins}
                  />
                  <AppInput
                    label="Password inicial"
                    placeholder="Vendedor123!"
                    secureTextEntry
                    value={userForm.password}
                    onChangeText={(value) => setUserForm((current) => ({ ...current, password: value }))}
                    editable={!creatingUser && canManageAdmins}
                  />
                  <View style={styles.roleRow}>
                    {TENANT_ROLE_OPTIONS.map((role) => (
                      <AppButton
                        key={role.code}
                        title={role.label}
                        variant={userForm.role === role.code ? 'primary' : 'secondary'}
                        onPress={() => setUserForm((current) => ({ ...current, role: role.code }))}
                        style={styles.roleButton}
                      />
                    ))}
                  </View>
                  <AppText variant="caption" color={theme.colors.mutedText}>
                    Sucursal asignada: {selectedBranchName}
                  </AppText>
                  <AppButton
                    title="Crear usuario"
                    loading={creatingUser}
                    disabled={creatingUser || !canManageAdmins || companyBranches.length === 0}
                    disabledReason="Selecciona una compañía con sucursal y confirma permiso MANAGE_TENANT_ADMINS."
                    onPress={handleCreateUser}
                    style={styles.actionButton}
                  />
                </View>

                <View style={styles.compactList}>
                  {companyUsers.length === 0 ? (
                    <AppText variant="caption" color={theme.colors.mutedText}>
                      No hay usuarios para esta compañía.
                    </AppText>
                  ) : (
                    companyUsers.map((user) => (
                      <View key={user.id} style={styles.compactRow}>
                        <View style={styles.companyMain}>
                          <AppText bold numberOfLines={1}>
                            {user.name}
                          </AppText>
                          <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
                            {user.email} · {user.branchName}
                          </AppText>
                          <AppText variant="caption" color={theme.colors.mutedText}>
                            Roles: {user.roles.join(', ') || 'Sin rol'}
                          </AppText>
                        </View>
                        <StatusBadge
                          label={user.status}
                          tone={user.status === 'ACTIVE' ? 'success' : 'neutral'}
                        />
                      </View>
                    ))
                  )}
                </View>
              </View>
              ) : null}

              {activePanel === 'settings' ? (
                <View style={styles.scopeColumn}>
                  <View style={styles.sectionHeader}>
                    <AppText bold>Modulos y limites</AppText>
                    <AppText variant="caption" color={theme.colors.mutedText}>
                      Define que aparece en la operacion del cliente y bloquea altas cuando se alcance un limite.
                    </AppText>
                  </View>
                  {companySettings ? (
                    <>
                      <View style={styles.moduleGrid}>
                        {companySettings.modules.map((module) => (
                          <View key={module.code} style={styles.moduleRow}>
                            <View style={styles.companyMain}>
                              <AppText bold>{module.name}</AppText>
                              <AppText variant="caption" color={theme.colors.mutedText}>
                                {module.code}
                              </AppText>
                            </View>
                            <AppButton
                              title={module.enabled ? 'Activo' : 'Inactivo'}
                              variant={module.enabled ? 'primary' : 'secondary'}
                              onPress={() => toggleModule(module.code)}
                              style={styles.moduleButton}
                            />
                          </View>
                        ))}
                      </View>
                      <View style={[styles.grid, isPhone ? styles.gridMobile : null]}>
                        <AppInput
                          label="Maximo de usuarios"
                          placeholder="Sin limite"
                          keyboardType="numeric"
                          value={settingsForm.maxUsers}
                          onChangeText={(value) => setSettingsForm((current) => ({ ...current, maxUsers: value }))}
                          editable={!savingSettings && canManageCompanies}
                        />
                        <AppInput
                          label="Maximo de sucursales"
                          placeholder="Sin limite"
                          keyboardType="numeric"
                          value={settingsForm.maxBranches}
                          onChangeText={(value) => setSettingsForm((current) => ({ ...current, maxBranches: value }))}
                          editable={!savingSettings && canManageCompanies}
                        />
                      </View>
                      <AppButton
                        title="Guardar modulos y limites"
                        loading={savingSettings}
                        disabled={savingSettings || !canManageCompanies}
                        disabledReason="Tu usuario necesita MANAGE_COMPANIES para cambiar modulos y limites."
                        onPress={handleSaveSettings}
                        style={styles.actionButton}
                      />
                    </>
                  ) : (
                    <EmptyState
                      title="Sin configuracion cargada"
                      message="Selecciona una empresa cliente para administrar sus modulos y limites."
                      icon="toggle-on"
                    />
                  )}
                </View>
              ) : null}
            </View>
          ) : null}
        </AppCard>

        <View style={styles.listHeader}>
          <View>
            <AppText variant="subtitle" bold>
              Empresas cliente
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {companies.length} empresas visibles para Plataforma.
            </AppText>
          </View>
        </View>

        {companies.length === 0 ? (
          <EmptyState
            title="No hay empresas registradas"
            message="Crea el primer cliente AppModa para comenzar."
            icon="business"
          />
        ) : (
          <View style={styles.companyList}>
            {companies.map((company) => {
              const selected = company.id === selectedCompanyId;
              const isPlatformCompany = company.code === 'APPMODA_PLATFORM';

              return (
                <AppCard
                  key={company.id}
                  variant={selected ? 'selected' : 'default'}
                  style={styles.companyCard}
                >
                  <View style={[styles.companyRow, isPhone ? styles.companyRowMobile : null]}>
                    <View style={styles.companyMain}>
                      <View style={styles.companyTitleRow}>
                        <AppText bold numberOfLines={1}>
                          {company.name}
                        </AppText>
                        <StatusBadge
                          label={isPlatformCompany ? 'Interna' : company.status}
                          tone={company.status === 'ACTIVE' ? 'success' : 'warning'}
                        />
                      </View>
                      <AppText variant="caption" color={theme.colors.mutedText}>
                        {company.code} · {company.branchName || 'Sin sucursal principal'}
                      </AppText>
                      <AppText variant="caption" color={theme.colors.mutedText}>
                        Admins activos: {company.adminUsers}
                      </AppText>
                    </View>
                    <View style={styles.companyActions}>
                      <AppButton
                        title={selected ? 'Seleccionada' : 'Seleccionar'}
                        variant={selected ? 'neutral' : 'secondary'}
                        disabled={selected || isPlatformCompany}
                        disabledReason={
                          isPlatformCompany
                            ? 'AppModa Platform es el tenant interno del super usuario.'
                            : 'La empresa ya esta seleccionada.'
                        }
                        onPress={() => setSelectedCompanyId(company.id)}
                        style={styles.compactButton}
                      />
                    </View>
                  </View>
                </AppCard>
              );
            })}
          </View>
        )}
      </ScrollView>
    </AppShellPage>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignSelf: 'flex-start',
    minWidth: 160,
  },
  companyActions: {
    alignItems: 'flex-end',
  },
  companyCard: {
    marginBottom: 0,
  },
  companyList: {
    gap: 10,
  },
  companyMain: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  companyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  companyRowMobile: {
    alignItems: 'stretch',
    flexDirection: 'column',
  },
  companyTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  companySelectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  compactButton: {
    minWidth: 120,
    paddingVertical: 10,
  },
  content: {
    gap: 14,
    paddingBottom: 28,
  },
  grid: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: 14,
  },
  gridMobile: {
    flexDirection: 'column',
  },
  headerButton: {
    minWidth: 120,
    paddingVertical: 10,
  },
  compactList: {
    gap: 8,
    marginTop: 10,
  },
  compactRow: {
    alignItems: 'center',
    borderColor: '#d8dee9',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    padding: 10,
  },
  inlineForm: {
    gap: 8,
  },
  moduleButton: {
    minWidth: 92,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  moduleGrid: {
    gap: 8,
    marginBottom: 10,
  },
  moduleRow: {
    alignItems: 'center',
    borderColor: '#d8dee9',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    padding: 10,
  },
  listHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  notice: {
    marginBottom: 0,
  },
  panel: {
    flex: 1,
    gap: 2,
    marginBottom: 0,
    minWidth: 0,
  },
  roleButton: {
    minWidth: 92,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  roleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickActionButton: {
    minWidth: 128,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  scopeCard: {
    gap: 8,
    marginBottom: 0,
  },
  scopeColumn: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  scopeHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scopeLoader: {
    marginVertical: 12,
  },
  scopeStats: {
    alignItems: 'flex-end',
    gap: 2,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  selectedCompanyBox: {
    borderWidth: 1,
    borderColor: '#d8dee9',
    borderRadius: 10,
    gap: 4,
    marginBottom: 12,
    padding: 12,
  },
  selectorButton: {
    minWidth: 150,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  titleBlock: {
    gap: 6,
  },
});
