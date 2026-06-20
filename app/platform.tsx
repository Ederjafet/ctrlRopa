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
  createPlatformCompany,
  createPlatformTenantAdmin,
  getPlatformCompanies,
  PlatformCompany,
} from '@/services/platformService';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
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

export default function PlatformScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { isPhone } = useResponsiveLayout();

  const [session, setSession] = useState<UserSession | null>(null);
  const [companies, setCompanies] = useState<PlatformCompany[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [companyForm, setCompanyForm] = useState(EMPTY_COMPANY_FORM);
  const [adminForm, setAdminForm] = useState(EMPTY_ADMIN_FORM);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creatingCompany, setCreatingCompany] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === selectedCompanyId) ?? null,
    [companies, selectedCompanyId]
  );
  const canManageCompanies = hasEffectivePermission(session, 'MANAGE_COMPANIES');
  const canManageAdmins = hasEffectivePermission(session, 'MANAGE_TENANT_ADMINS');

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
      });
      setAdminForm(EMPTY_ADMIN_FORM);
      setMessage(`Admin inicial creado: ${created.email}.`);
      Alert.alert('Admin creado', `El admin ${created.email} quedo activo para ${selectedCompany.name}.`);
      await refreshCompanies();
    } catch (error) {
      setErrorMessage(getActionableApiErrorMessage(error));
    } finally {
      setCreatingAdmin(false);
    }
  };

  if (loading) {
    return (
      <AppShellPage
        title="Plataforma"
        subtitle="Clientes AppModa"
        metadata="Super usuario"
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
      title="Plataforma"
      subtitle="Clientes AppModa"
      metadata="Administracion minima de empresas y admins iniciales"
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

        <View style={[styles.grid, isPhone ? styles.gridMobile : null]}>
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
        </View>

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
  titleBlock: {
    gap: 6,
  },
});
