import AppShellPage from '@/components/layout/AppShellPage';
import AppBottomModal from '@/components/ui/AppBottomModal';
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
  createPlatformSubscriptionPlan,
  createPlatformTenantAdmin,
  createPlatformUser,
  getPlatformBranches,
  getPlatformCompanies,
  getPlatformCompanyDetail,
  getPlatformCompanySettings,
  getPlatformCompanySubscription,
  getPlatformDashboardSummary,
  getPlatformPlanPrices,
  getPlatformSubscriptionPlans,
  getPlatformUsageRates,
  getPlatformUsageSummary,
  getPlatformUsers,
  PlatformBranch,
  PlatformCompany,
  PlatformCompanyDetail,
  PlatformCompanySettings,
  PlatformCompanySubscription,
  PlatformCompanyUser,
  PlatformDashboardSummary,
  PlatformPlanPrice,
  PlatformSubscriptionPlan,
  PlatformUsageRate,
  PlatformUsageSummary,
  updatePlatformCompanySettings,
  updatePlatformCompanySubscription,
  updatePlatformPlanPrices,
  updatePlatformUsageRates,
} from '@/services/platformService';
import { getSession, UserSession } from '@/services/sessionStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';

type PlatformSection =
  | 'dashboard'
  | 'companies'
  | 'branches'
  | 'users'
  | 'modules'
  | 'limits'
  | 'subscriptions'
  | 'usageRates'
  | 'usage'
  | 'audit';

const SECTION_CONFIG: { key: PlatformSection; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard SaaS' },
  { key: 'companies', label: 'Clientes / Companias' },
  { key: 'branches', label: 'Sucursales' },
  { key: 'users', label: 'Usuarios' },
  { key: 'modules', label: 'Modulos activos' },
  { key: 'limits', label: 'Limites' },
  { key: 'subscriptions', label: 'Planes / Suscripciones' },
  { key: 'usageRates', label: 'Tarifas por consumo' },
  { key: 'usage', label: 'Uso del cliente' },
  { key: 'audit', label: 'Auditoria global' },
];

const BILLING_PERIODS = [
  { code: 'MONTHLY', label: 'Mensual' },
  { code: 'QUARTERLY', label: 'Trimestral' },
  { code: 'SEMIANNUAL', label: 'Semestral' },
  { code: 'ANNUAL', label: 'Anual' },
];

const BILLING_MODELS = [
  { code: 'SUBSCRIPTION', label: 'Suscripcion' },
  { code: 'USAGE_BASED', label: 'Consumo' },
  { code: 'HYBRID', label: 'Hibrido' },
];

const SUBSCRIPTION_STATUSES = [
  { code: 'TRIAL', label: 'Trial' },
  { code: 'ACTIVE', label: 'Activa' },
  { code: 'PAST_DUE', label: 'Vencida' },
  { code: 'SUSPENDED', label: 'Suspendida' },
  { code: 'CANCELLED', label: 'Cancelada' },
];

const PLAN_MODULE_FLAGS: {
  key: 'includesLive' | 'includesReports' | 'includesShipments' | 'includesPackages';
  label: string;
}[] = [
  { key: 'includesLive', label: 'LIVE' },
  { key: 'includesReports', label: 'Reportes' },
  { key: 'includesShipments', label: 'Envios' },
  { key: 'includesPackages', label: 'Paquetes' },
];

const TENANT_ROLE_OPTIONS = [
  { code: 'ADMIN', label: 'Admin' },
  { code: 'SUPERVISOR', label: 'Supervisor' },
  { code: 'SELLER', label: 'Vendedor' },
  { code: 'CASHIER', label: 'Caja' },
];

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
  maxItems: '',
  maxLiveSessionsPerMonth: '',
  maxShipmentsPerMonth: '',
  maxPackagesPerMonth: '',
};

const EMPTY_PLAN_FORM = {
  code: '',
  name: '',
  description: '',
  includedMaxUsers: '',
  includedMaxBranches: '',
  includesLive: true,
  includesReports: true,
  includesShipments: true,
  includesPackages: true,
};

const EMPTY_SUBSCRIPTION_FORM = {
  planId: null as number | null,
  billingModel: 'SUBSCRIPTION',
  billingPeriod: 'MONTHLY',
  status: 'TRIAL',
};

const PLATFORM_SELECTED_COMPANY_ID_KEY = 'appmoda.platform.selectedCompanyId';
const OWNER_SIDEBAR_SCROLL_KEY = 'appmoda.owner.sidebarScrollY';

function normalizeSection(value: unknown): PlatformSection {
  const raw = Array.isArray(value) ? value[0] : value;
  const candidate = typeof raw === 'string' ? raw : 'dashboard';
  return SECTION_CONFIG.some((section) => section.key === candidate)
    ? (candidate as PlatformSection)
    : 'dashboard';
}

function parseCompanyIdParam(value: unknown): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizePlatformActionSection(value?: string | null): PlatformSection {
  return SECTION_CONFIG.some((section) => section.key === value)
    ? (value as PlatformSection)
    : 'companies';
}

function normalizeDashboardTone(value?: string | null): 'neutral' | 'success' | 'warning' | 'danger' | 'info' {
  if (value === 'success' || value === 'warning' || value === 'danger' || value === 'info') {
    return value;
  }
  return 'neutral';
}

function parseNullableInteger(value: string, label: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${label} debe ser un entero mayor a cero.`);
  }
  return parsed;
}

function parseMoney(value: string): number {
  const parsed = Number(value.trim() || '0');
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error('El monto debe ser cero o mayor.');
  }
  return parsed;
}

function money(value: number | string | null | undefined) {
  return Number(value ?? 0).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
  });
}

function formatCompanyScopeCounts(detail: PlatformCompanyDetail) {
  const branches = `${detail.branchCount} sucursal${detail.branchCount === 1 ? '' : 'es'}`;
  const users = `${detail.activeUserCount} usuario${detail.activeUserCount === 1 ? '' : 's'}`;
  return `${branches} - ${users}`;
}

export default function PlatformScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useAppTheme();
  const { isPhone } = useResponsiveLayout();
  const routeCompanyId = useMemo(() => parseCompanyIdParam(params.companyId), [params.companyId]);

  const [activeSection, setActiveSection] = useState<PlatformSection>(() =>
    normalizeSection(params.section)
  );
  const [session, setSession] = useState<UserSession | null>(null);
  const [companies, setCompanies] = useState<PlatformCompany[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [selectedCompanyDetail, setSelectedCompanyDetail] =
    useState<PlatformCompanyDetail | null>(null);
  const [companyBranches, setCompanyBranches] = useState<PlatformBranch[]>([]);
  const [companyUsers, setCompanyUsers] = useState<PlatformCompanyUser[]>([]);
  const [companySettings, setCompanySettings] = useState<PlatformCompanySettings | null>(null);
  const [companySubscription, setCompanySubscription] =
    useState<PlatformCompanySubscription | null>(null);
  const [usageRates, setUsageRates] = useState<PlatformUsageRate[]>([]);
  const [usageSummary, setUsageSummary] = useState<PlatformUsageSummary[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<PlatformDashboardSummary | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<PlatformSubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [planPrices, setPlanPrices] = useState<PlatformPlanPrice[]>([]);
  const [priceForm, setPriceForm] = useState<Record<string, string>>({});
  const [companyForm, setCompanyForm] = useState(EMPTY_COMPANY_FORM);
  const [adminForm, setAdminForm] = useState(EMPTY_ADMIN_FORM);
  const [branchForm, setBranchForm] = useState(EMPTY_BRANCH_FORM);
  const [userForm, setUserForm] = useState(EMPTY_USER_FORM);
  const [settingsForm, setSettingsForm] = useState(EMPTY_SETTINGS_FORM);
  const [planForm, setPlanForm] = useState(EMPTY_PLAN_FORM);
  const [subscriptionForm, setSubscriptionForm] = useState(EMPTY_SUBSCRIPTION_FORM);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [companyPickerVisible, setCompanyPickerVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingCompanyScope, setLoadingCompanyScope] = useState(false);
  const [creatingCompany, setCreatingCompany] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [creatingBranch, setCreatingBranch] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPrices, setSavingPrices] = useState(false);
  const [savingSubscription, setSavingSubscription] = useState(false);
  const [savingUsageRates, setSavingUsageRates] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === selectedCompanyId) ?? null,
    [companies, selectedCompanyId]
  );
  const selectedPlan = useMemo(
    () => subscriptionPlans.find((plan) => plan.id === selectedPlanId) ?? null,
    [subscriptionPlans, selectedPlanId]
  );
  const canManageCompanies = hasEffectivePermission(session, 'MANAGE_COMPANIES');
  const canManageAdmins = hasEffectivePermission(session, 'MANAGE_TENANT_ADMINS');
  const canManageModules = hasEffectivePermission(session, 'MANAGE_COMPANY_MODULES');
  const canManageLimits = hasEffectivePermission(session, 'MANAGE_COMPANY_LIMITS');
  const canManagePlans = hasEffectivePermission(session, 'MANAGE_SUBSCRIPTION_PLANS');
  const canManageSubscriptions = hasEffectivePermission(session, 'MANAGE_COMPANY_SUBSCRIPTIONS');
  const canManageUsageRates = hasEffectivePermission(session, 'MANAGE_USAGE_RATES');
  const canUseSelectedCompany = Boolean(selectedCompany && selectedCompany.code !== 'APPMODA_PLATFORM');

  const selectedBranchName = useMemo(() => {
    const branch = companyBranches.find((item) => item.id === userForm.branchId);
    return branch ? `${branch.code} - ${branch.name}` : 'Sucursal principal';
  }, [companyBranches, userForm.branchId]);

  useEffect(() => {
    setActiveSection(normalizeSection(params.section));
  }, [params.section]);

  const buildPlatformRoute = useCallback((section: PlatformSection, companyId?: number | null) => {
    const companyParam = companyId ? `&companyId=${companyId}` : '';
    return `/platform?section=${section}${companyParam}` as any;
  }, []);

  const updateCompanyInAdministration = useCallback((companyId: number | null, feedbackName?: string) => {
    setSelectedCompanyId(companyId);
    router.replace(buildPlatformRoute(activeSection, companyId));
    if (companyId) {
      void AsyncStorage.setItem(PLATFORM_SELECTED_COMPANY_ID_KEY, String(companyId));
    } else {
      void AsyncStorage.removeItem(PLATFORM_SELECTED_COMPANY_ID_KEY);
    }

    if (feedbackName) {
      setMessage(`Ahora administras ${feedbackName}.`);
      setErrorMessage('');
    }
  }, [activeSection, buildPlatformRoute, router]);

  useEffect(() => {
    if (!selectedCompanyId || loading) return;
    if (routeCompanyId === selectedCompanyId) return;
    router.replace(buildPlatformRoute(activeSection, selectedCompanyId));
  }, [activeSection, buildPlatformRoute, loading, routeCompanyId, router, selectedCompanyId]);

  const loadPlanPrices = useCallback(async (planId: number | null) => {
    if (!planId) {
      setPlanPrices([]);
      setPriceForm({});
      return;
    }

    const prices = await getPlatformPlanPrices(planId);
    setPlanPrices(prices);
    setPriceForm(
      BILLING_PERIODS.reduce<Record<string, string>>((acc, period) => {
        const price = prices.find((item) => item.billingPeriod === period.code);
        acc[period.code] = price ? String(price.priceAmount) : '';
        return acc;
      }, {})
    );
  }, []);

  const loadCompanyScope = useCallback(async (companyId: number | null) => {
    const company = companies.find((item) => item.id === companyId);

    if (!companyId || company?.code === 'APPMODA_PLATFORM') {
      setSelectedCompanyDetail(null);
      setCompanyBranches([]);
      setCompanyUsers([]);
      setCompanySettings(null);
      setCompanySubscription(null);
      setUsageRates([]);
      setSettingsForm(EMPTY_SETTINGS_FORM);
      setSubscriptionForm(EMPTY_SUBSCRIPTION_FORM);
      setUserForm((current) => ({ ...current, branchId: null }));
      return;
    }

    try {
      setLoadingCompanyScope(true);
      const [detail, branches, users, settings, subscription, rates] = await Promise.all([
        getPlatformCompanyDetail(companyId),
        getPlatformBranches(companyId),
        getPlatformUsers(companyId),
        getPlatformCompanySettings(companyId),
        getPlatformCompanySubscription(companyId),
        getPlatformUsageRates(companyId),
      ]);
      setSelectedCompanyDetail(detail);
      setCompanyBranches(branches);
      setCompanyUsers(users);
      setCompanySettings(settings);
      setCompanySubscription(subscription);
      setUsageRates(rates);
      setSettingsForm({
        maxUsers: settings.limits.maxUsers ? String(settings.limits.maxUsers) : '',
        maxBranches: settings.limits.maxBranches ? String(settings.limits.maxBranches) : '',
        maxItems: settings.limits.maxItems ? String(settings.limits.maxItems) : '',
        maxLiveSessionsPerMonth: settings.limits.maxLiveSessionsPerMonth
          ? String(settings.limits.maxLiveSessionsPerMonth)
          : '',
        maxShipmentsPerMonth: settings.limits.maxShipmentsPerMonth
          ? String(settings.limits.maxShipmentsPerMonth)
          : '',
        maxPackagesPerMonth: settings.limits.maxPackagesPerMonth
          ? String(settings.limits.maxPackagesPerMonth)
          : '',
      });
      setSubscriptionForm({
        planId: subscription.planId ?? null,
        billingModel:
          subscription.billingModel && subscription.billingModel !== 'SIN_CONFIGURAR'
            ? subscription.billingModel
            : 'SUBSCRIPTION',
        billingPeriod: subscription.billingPeriod ?? 'MONTHLY',
        status:
          subscription.status && subscription.status !== 'SIN_CONFIGURAR'
            ? subscription.status
            : 'TRIAL',
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

  useEffect(() => {
    loadPlanPrices(selectedPlanId).catch((error) => setErrorMessage(getActionableApiErrorMessage(error)));
  }, [loadPlanPrices, selectedPlanId]);

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
      const [companyRows, planRows, usageRows, dashboardRows, storedCompanyIdRaw] = await Promise.all([
        getPlatformCompanies(),
        getPlatformSubscriptionPlans(),
        getPlatformUsageSummary(),
        getPlatformDashboardSummary(),
        AsyncStorage.getItem(PLATFORM_SELECTED_COMPANY_ID_KEY),
      ]);
      const storedCompanyId = parseCompanyIdParam(storedCompanyIdRaw);
      setCompanies(companyRows);
      setSubscriptionPlans(planRows);
      setUsageSummary(usageRows);
      setDashboardSummary(dashboardRows);
      setSelectedCompanyId((current) => {
        const requestedId = routeCompanyId ?? storedCompanyId ?? current;
        const validCompany = requestedId
          ? companyRows.find(
              (company) => company.id === requestedId && company.code !== 'APPMODA_PLATFORM'
            )
          : null;

        if (requestedId && !validCompany) {
          void AsyncStorage.removeItem(PLATFORM_SELECTED_COMPANY_ID_KEY);
          router.replace(buildPlatformRoute(normalizeSection(params.section), null));
          return null;
        }

        if (validCompany) {
          void AsyncStorage.setItem(PLATFORM_SELECTED_COMPANY_ID_KEY, String(validCompany.id));
        }

        return validCompany?.id ?? null;
      });
      setSelectedPlanId((current) => current ?? planRows[0]?.id ?? null);
    } catch (error) {
      setErrorMessage(getActionableApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [buildPlatformRoute, params.section, routeCompanyId, router]);

  useFocusEffect(
    useCallback(() => {
      loadPlatform();
    }, [loadPlatform])
  );

  const refreshCompanies = async () => {
    const data = await getPlatformCompanies();
    setCompanies(data);
    if (
      selectedCompanyId &&
      !data.some((company) => company.id === selectedCompanyId && company.code !== 'APPMODA_PLATFORM')
    ) {
      updateCompanyInAdministration(null);
    }
  };

  const refreshUsageSummary = async () => {
    setUsageSummary(await getPlatformUsageSummary());
  };

  const refreshDashboardSummary = async () => {
    setDashboardSummary(await getPlatformDashboardSummary());
  };

  const openDashboardCompanyAction = useCallback((companyId: number, section?: string | null) => {
    const targetSection = normalizePlatformActionSection(section);
    const company = companies.find((item) => item.id === companyId);
    setSelectedCompanyId(companyId);
    void AsyncStorage.setItem(PLATFORM_SELECTED_COMPANY_ID_KEY, String(companyId));
    router.push(buildPlatformRoute(targetSection, companyId));
    if (company) {
      setMessage(`Ahora administras ${company.name}.`);
      setErrorMessage('');
    }
  }, [buildPlatformRoute, companies, router]);

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
      setShowCompanyForm(false);
      updateCompanyInAdministration(created.id, created.name);
      Alert.alert('Empresa creada', `Se creo ${created.name} con sucursal principal.`);
      await refreshCompanies();
      await refreshUsageSummary();
      await refreshDashboardSummary();
    } catch (error) {
      setErrorMessage(getActionableApiErrorMessage(error));
    } finally {
      setCreatingCompany(false);
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
      setShowBranchForm(false);
      setUserForm((current) => ({ ...current, branchId: created.id }));
      setMessage(`Sucursal creada: ${created.name}.`);
      await loadCompanyScope(selectedCompany.id);
      await refreshCompanies();
      await refreshUsageSummary();
      await refreshDashboardSummary();
    } catch (error) {
      setErrorMessage(getActionableApiErrorMessage(error));
    } finally {
      setCreatingBranch(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (creatingAdmin || !selectedCompany) return;
    const name = adminForm.name.trim();
    const email = adminForm.email.trim();
    const password = adminForm.password;

    if (!canUseSelectedCompany || !name || !email || !password) {
      setErrorMessage('Captura empresa, nombre, correo y password inicial del admin.');
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
      setShowAdminForm(false);
      setMessage(`Admin inicial creado: ${created.email}.`);
      await loadCompanyScope(selectedCompany.id);
      await refreshCompanies();
      await refreshUsageSummary();
      await refreshDashboardSummary();
    } catch (error) {
      setErrorMessage(getActionableApiErrorMessage(error));
    } finally {
      setCreatingAdmin(false);
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
      setShowUserForm(false);
      setMessage(`Usuario creado: ${created.email}.`);
      await loadCompanyScope(selectedCompany.id);
      await refreshCompanies();
      await refreshUsageSummary();
      await refreshDashboardSummary();
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
        maxUsers: parseNullableInteger(settingsForm.maxUsers, 'Limite de usuarios'),
        maxBranches: parseNullableInteger(settingsForm.maxBranches, 'Limite de sucursales'),
        maxItems: parseNullableInteger(settingsForm.maxItems, 'Limite de prendas'),
        maxLiveSessionsPerMonth: parseNullableInteger(
          settingsForm.maxLiveSessionsPerMonth,
          'Limite de LIVE por mes'
        ),
        maxShipmentsPerMonth: parseNullableInteger(
          settingsForm.maxShipmentsPerMonth,
          'Limite de envios por mes'
        ),
        maxPackagesPerMonth: parseNullableInteger(
          settingsForm.maxPackagesPerMonth,
          'Limite de paquetes por mes'
        ),
      });
      setCompanySettings(saved);
      setSettingsForm({
        maxUsers: saved.limits.maxUsers ? String(saved.limits.maxUsers) : '',
        maxBranches: saved.limits.maxBranches ? String(saved.limits.maxBranches) : '',
        maxItems: saved.limits.maxItems ? String(saved.limits.maxItems) : '',
        maxLiveSessionsPerMonth: saved.limits.maxLiveSessionsPerMonth
          ? String(saved.limits.maxLiveSessionsPerMonth)
          : '',
        maxShipmentsPerMonth: saved.limits.maxShipmentsPerMonth
          ? String(saved.limits.maxShipmentsPerMonth)
          : '',
        maxPackagesPerMonth: saved.limits.maxPackagesPerMonth
          ? String(saved.limits.maxPackagesPerMonth)
          : '',
      });
      setMessage('Modulos y limites actualizados para el cliente en administracion.');
      await loadCompanyScope(selectedCompany.id);
      await refreshUsageSummary();
      await refreshDashboardSummary();
    } catch (error) {
      setErrorMessage(getActionableApiErrorMessage(error));
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreatePlan = async () => {
    if (creatingPlan) return;
    const code = planForm.code.trim();
    const name = planForm.name.trim();

    if (!code || !name) {
      setErrorMessage('Captura codigo y nombre del plan.');
      return;
    }

    try {
      setCreatingPlan(true);
      setErrorMessage('');
      setMessage('');
      const created = await createPlatformSubscriptionPlan({
        code,
        name,
        description: planForm.description.trim() || null,
        status: 'ACTIVE',
        includedMaxUsers: parseNullableInteger(planForm.includedMaxUsers, 'Usuarios incluidos'),
        includedMaxBranches: parseNullableInteger(planForm.includedMaxBranches, 'Sucursales incluidas'),
        includesLive: planForm.includesLive,
        includesReports: planForm.includesReports,
        includesShipments: planForm.includesShipments,
        includesPackages: planForm.includesPackages,
      });
      setPlanForm(EMPTY_PLAN_FORM);
      setShowPlanForm(false);
      setSelectedPlanId(created.id);
      setSubscriptionPlans(await getPlatformSubscriptionPlans());
      setMessage(`Plan creado: ${created.name}.`);
    } catch (error) {
      setErrorMessage(getActionableApiErrorMessage(error));
    } finally {
      setCreatingPlan(false);
    }
  };

  const handleSavePlanPrices = async () => {
    if (savingPrices || !selectedPlanId) return;

    try {
      setSavingPrices(true);
      setErrorMessage('');
      setMessage('');
      const prices = await updatePlatformPlanPrices(selectedPlanId, {
        prices: BILLING_PERIODS.map((period) => ({
          billingPeriod: period.code,
          priceAmount: parseMoney(priceForm[period.code] ?? '0'),
          currency: 'MXN',
          status: 'ACTIVE',
        })),
      });
      setPlanPrices(prices);
      setMessage('Precios por periodo actualizados.');
    } catch (error) {
      setErrorMessage(getActionableApiErrorMessage(error));
    } finally {
      setSavingPrices(false);
    }
  };

  const handleSaveSubscription = async () => {
    if (savingSubscription || !selectedCompany) return;

    if (!canUseSelectedCompany) {
      setErrorMessage('Selecciona una empresa cliente para asociar plan o modelo de cobro.');
      return;
    }

    try {
      setSavingSubscription(true);
      setErrorMessage('');
      setMessage('');
      const saved = await updatePlatformCompanySubscription(selectedCompany.id, {
        planId: subscriptionForm.planId,
        billingModel: subscriptionForm.billingModel,
        billingPeriod: subscriptionForm.billingPeriod,
        status: subscriptionForm.status,
      });
      setCompanySubscription(saved);
      setMessage('Suscripcion del cliente actualizada.');
      await refreshUsageSummary();
      await refreshDashboardSummary();
    } catch (error) {
      setErrorMessage(getActionableApiErrorMessage(error));
    } finally {
      setSavingSubscription(false);
    }
  };

  const handleSaveUsageRates = async () => {
    if (savingUsageRates || !selectedCompany) return;

    if (!canUseSelectedCompany) {
      setErrorMessage('Selecciona una empresa cliente para configurar tarifas.');
      return;
    }

    try {
      setSavingUsageRates(true);
      setErrorMessage('');
      setMessage('');
      const saved = await updatePlatformUsageRates(selectedCompany.id, {
        rates: usageRates.map((rate) => ({
          usageType: rate.usageType,
          unitPrice: Number(rate.unitPrice ?? 0),
          currency: rate.currency || 'MXN',
          enabled: rate.enabled,
        })),
      });
      setUsageRates(saved);
      setMessage('Tarifas por consumo actualizadas.');
    } catch (error) {
      setErrorMessage(getActionableApiErrorMessage(error));
    } finally {
      setSavingUsageRates(false);
    }
  };

  const activeCompanies = companies.filter(
    (company) => company.code !== 'APPMODA_PLATFORM' && company.status === 'ACTIVE'
  );
  const inactiveCompanies = companies.filter(
    (company) => company.code !== 'APPMODA_PLATFORM' && company.status !== 'ACTIVE'
  );
  const clientsWithoutPlan = usageSummary.filter((item) => item.billingModel === 'SIN_CONFIGURAR');
  const selectedUsage = selectedCompany
    ? usageSummary.find((item) => item.companyId === selectedCompany.id)
    : null;

  const renderOwnerCompanyContext = () => (
    <View
      style={[
        styles.ownerContextPill,
        {
          backgroundColor: theme.colors.surfaceAlt,
          borderColor: theme.colors.borderSubtle,
        },
      ]}
    >
      <View style={styles.flex}>
        <AppText variant="caption" color={theme.colors.mutedText} bold numberOfLines={1}>
          Cliente en administracion
        </AppText>
        <AppText bold numberOfLines={1} style={styles.ownerContextName}>
          {selectedCompany ? selectedCompany.name : 'Sin cliente seleccionado'}
        </AppText>
        <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
          {selectedCompany
            ? `${selectedCompany.status} - ${selectedCompany.branchName || 'Sin sucursal principal'}`
            : 'Elige un cliente para configurar.'}
        </AppText>
        {selectedCompanyDetail ? (
          <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
            {formatCompanyScopeCounts(selectedCompanyDetail)}
          </AppText>
        ) : null}
        <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={2}>
          {selectedCompany
            ? 'Se usa en sucursales, usuarios, modulos y limites.'
            : 'No cambia tu sesion ni entra como cliente.'}
        </AppText>
      </View>
      <AppButton
        title={selectedCompany ? 'Cambiar' : 'Elegir'}
        variant="secondary"
        onPress={() => setCompanyPickerVisible(true)}
        style={[styles.compactButton, styles.ownerContextButton]}
      />
    </View>
  );

  const renderCompanyPicker = () => (
    <AppBottomModal
      visible={companyPickerVisible}
      title="Cliente en administracion"
      onClose={() => setCompanyPickerVisible(false)}
      maxHeight="88%"
    >
      <View style={styles.sectionStack}>
        <AppCard style={styles.panel}>
          <AppText variant="caption" color={theme.colors.mutedText}>
            Elegir un cliente solo cambia el contexto de administracion del Panel Owner. No cambia tu sesion, no entra como el cliente y no es impersonacion.
          </AppText>
        </AppCard>
        <View style={styles.compactList}>
          {companies.filter((company) => company.code !== 'APPMODA_PLATFORM').length === 0 ? (
            <EmptyState title="Sin clientes" message="Crea una compania para comenzar a administrarla." icon="domain" />
          ) : null}
          {companies.filter((company) => company.code !== 'APPMODA_PLATFORM').map((company) => {
            const selected = company.id === selectedCompanyId;
            const usage = usageSummary.find((item) => item.companyId === company.id);
            return (
              <View key={company.id} style={styles.companyPickerRow}>
                <View style={styles.flex}>
                  <AppText bold numberOfLines={1}>{company.name}</AppText>
                  <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
                    {company.status} - {company.branchName || 'Sin sucursal principal'}
                  </AppText>
                  <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
                    Usuarios {usage?.activeUsers ?? '-'} - Sucursales {usage?.activeBranches ?? '-'} - Plan {usage?.planName || 'sin plan'}
                  </AppText>
                </View>
                <AppButton
                  title={selected ? 'En administracion' : 'Administrar'}
                  variant={selected ? 'neutral' : 'secondary'}
                  disabled={selected}
                  disabledReason="Este cliente ya esta en administracion."
                  onPress={() => {
                    updateCompanyInAdministration(company.id, company.name);
                    setCompanyPickerVisible(false);
                  }}
                  style={styles.compactButton}
                />
              </View>
            );
          })}
        </View>
      </View>
    </AppBottomModal>
  );

  const renderCompanyRequired = (message: string) => (
    <AppCard style={styles.panel}>
      <EmptyState title="Selecciona un cliente para continuar" message={message} icon="domain" />
      <View style={styles.actionsRow}>
        <AppButton title="Elegir cliente" variant="operation" onPress={() => setCompanyPickerVisible(true)} style={styles.actionButton} />
        <AppButton title="Ir a Clientes / Companias" variant="secondary" onPress={() => router.push(buildPlatformRoute('companies', selectedCompanyId))} style={styles.actionButton} />
      </View>
    </AppCard>
  );

  const renderCompanyScopeLine = () =>
    selectedCompany ? (
      <AppText variant="caption" color={theme.colors.mutedText}>
        Cliente en administracion: {selectedCompany.name} - {selectedCompany.status} - {selectedCompany.branchName || 'Sin sucursal principal'}
      </AppText>
    ) : null;

  const renderDashboardMetricTile = (
    label: string,
    value: string | number,
    helper?: string,
    tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info' = 'neutral'
  ) => (
    <View
      key={label}
      style={[
        styles.dashboardMetricTile,
        {
          backgroundColor: theme.colors.surfaceAlt,
          borderColor:
            tone === 'warning'
              ? theme.colors.warning
              : tone === 'success'
                ? theme.colors.success
                : tone === 'danger'
                  ? theme.colors.danger
                  : tone === 'info'
                    ? theme.colors.accent
                    : theme.colors.border,
        },
      ]}
    >
      <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
        {label}
      </AppText>
      <AppText variant="subtitle" bold numberOfLines={1}>
        {value}
      </AppText>
      {helper ? (
        <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={2}>
          {helper}
        </AppText>
      ) : null}
    </View>
  );

  const renderDashboard = () => {
    const summary = dashboardSummary?.summary;
    const today = dashboardSummary?.todayActivity;
    const pendings = dashboardSummary?.installationPendings ?? [];
    const attentionCompanies = dashboardSummary?.attentionCompanies ?? [];
    const alerts = dashboardSummary?.operationalAlerts ?? [];
    const estimatedRevenue =
      summary?.estimatedMonthlyRevenue === null || summary?.estimatedMonthlyRevenue === undefined
        ? 'Pendiente'
        : money(summary.estimatedMonthlyRevenue);
    const hasTodayActivity = today
      ? today.itemsCreated +
          today.reservationsCreated +
          today.packagesCreated +
          today.paymentsRegistered +
          today.shipmentsCreated +
          today.liveSessions >
        0
      : false;

    return (
      <View style={styles.sectionStack}>
        <AppCard style={styles.panel}>
          <View style={[styles.rowBetween, isPhone ? styles.column : null]}>
            <View style={styles.sectionHeader}>
              <StatusBadge label="GLOBAL" tone="info" />
              <View style={styles.flex}>
                <AppText variant="subtitle" bold>
                  Dashboard SaaS AppModa
                </AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  Vista global de plataforma. Estas metricas no dependen del cliente en administracion.
                </AppText>
              </View>
            </View>
            <View style={styles.dashboardQuickActions}>
              <AppButton
                title="Crear cliente"
                variant="operation"
                disabled={!canManageCompanies}
                disabledReason="Tu usuario necesita MANAGE_COMPANIES."
                onPress={() => {
                  setShowCompanyForm(true);
                  router.push(buildPlatformRoute('companies', selectedCompanyId));
                }}
                style={styles.compactButton}
              />
              <AppButton
                title="Revisar sin plan"
                variant="secondary"
                onPress={() => router.push(buildPlatformRoute('subscriptions', selectedCompanyId))}
                style={styles.compactButton}
              />
            </View>
          </View>
          <View style={styles.dashboardMetricGrid}>
            {renderDashboardMetricTile('Clientes activos', summary?.activeCompanies ?? activeCompanies.length, 'Tenants operables', 'success')}
            {renderDashboardMetricTile('Clientes sin plan', summary?.companiesWithoutPlan ?? clientsWithoutPlan.length, 'Requieren configuracion comercial', (summary?.companiesWithoutPlan ?? clientsWithoutPlan.length) > 0 ? 'warning' : 'success')}
            {renderDashboardMetricTile('Suspendidos/inactivos', summary?.suspendedCompanies ?? inactiveCompanies.length, 'Riesgo de soporte o cobranza', (summary?.suspendedCompanies ?? inactiveCompanies.length) > 0 ? 'warning' : 'neutral')}
            {renderDashboardMetricTile('Ingreso mensual estimado', estimatedRevenue, 'Con suscripciones activas y precio configurado', summary?.estimatedMonthlyRevenue ? 'info' : 'neutral')}
            {renderDashboardMetricTile('Usuarios activos', summary?.activeUsers ?? usageSummary.reduce((total, item) => total + item.activeUsers, 0), 'Global en clientes tenant', 'info')}
            {renderDashboardMetricTile('Clientes con uso hoy', summary?.companiesWithUsageToday ?? 0, 'Actividad operativa detectada', (summary?.companiesWithUsageToday ?? 0) > 0 ? 'success' : 'neutral')}
          </View>
        </AppCard>

        <View style={[styles.dashboardTwoColumn, isPhone ? styles.column : null]}>
          <AppCard style={[styles.panel, styles.dashboardColumn]}>
            <View style={styles.sectionHeader}>
              <StatusBadge label="CRITICO" tone={pendings.length > 0 ? 'warning' : 'success'} />
              <View style={styles.flex}>
                <AppText variant="subtitle" bold>
                  Pendientes criticos
                </AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  {pendings.length > 0
                    ? `${pendings.length} clientes requieren configuracion antes de operar sin friccion.`
                    : 'Sin pendientes criticos de instalacion por ahora.'}
                </AppText>
              </View>
            </View>
            {pendings.length === 0 ? (
              <EmptyState title="Instalacion en orden" message="No hay clientes incompletos en el resumen global." icon="check-circle" />
            ) : (
              <View style={styles.dashboardList}>
                {pendings.slice(0, 5).map((item) => (
                  <View key={item.companyId} style={[styles.dashboardListRow, { borderColor: theme.colors.border }]}>
                    <View style={styles.flex}>
                      <View style={styles.inlineBadges}>
                        <AppText bold numberOfLines={1}>{item.companyName}</AppText>
                        <StatusBadge label={item.status} tone={item.status === 'ACTIVE' ? 'success' : 'warning'} />
                      </View>
                      <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={2}>
                        {item.missing.join(' - ')}
                      </AppText>
                    </View>
                    <AppButton
                      title="Configurar"
                      variant="secondary"
                      onPress={() => openDashboardCompanyAction(item.companyId, item.actionSection)}
                      style={styles.compactButton}
                    />
                  </View>
                ))}
              </View>
            )}
          </AppCard>

          <AppCard style={[styles.panel, styles.dashboardColumn]}>
            <View style={styles.sectionHeader}>
              <StatusBadge label="HOY" tone={hasTodayActivity ? 'success' : 'neutral'} />
              <View style={styles.flex}>
                <AppText variant="subtitle" bold>
                  Actividad de hoy
                </AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  Operacion global detectada desde prendas, apartados, paquetes, pagos, envios y LIVE.
                </AppText>
              </View>
            </View>
            <View style={styles.todayGrid}>
              {renderDashboardMetricTile('Prendas', today?.itemsCreated ?? 0)}
              {renderDashboardMetricTile('Apartados', today?.reservationsCreated ?? 0)}
              {renderDashboardMetricTile('Paquetes', today?.packagesCreated ?? 0)}
              {renderDashboardMetricTile('Pagos', today?.paymentsRegistered ?? 0, money(today?.paymentAmount ?? 0))}
              {renderDashboardMetricTile('Envios', today?.shipmentsCreated ?? 0)}
              {renderDashboardMetricTile('LIVE', today?.liveSessions ?? 0, `${today?.liveReservations ?? 0} reservas LIVE`)}
            </View>
          </AppCard>
        </View>

        <AppCard style={styles.panel}>
          <View style={styles.sectionHeader}>
            <StatusBadge label="ATENCION" tone={attentionCompanies.length > 0 ? 'warning' : 'success'} />
            <View style={styles.flex}>
              <AppText variant="subtitle" bold>
                Clientes que requieren atencion
              </AppText>
              <AppText variant="caption" color={theme.colors.mutedText}>
                Priorizados por configuracion incompleta, limites cercanos o falta de uso hoy.
              </AppText>
            </View>
          </View>
          {attentionCompanies.length === 0 ? (
            <EmptyState title="Sin clientes en atencion" message="No hay señales criticas con los datos actuales." icon="domain" />
          ) : (
            <View style={styles.dashboardTable}>
              {attentionCompanies.map((item) => (
                <View key={item.companyId} style={[styles.dashboardTableRow, { borderColor: theme.colors.border }]}>
                  <View style={styles.dashboardCompanyCell}>
                    <AppText bold numberOfLines={1}>{item.companyName}</AppText>
                    <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
                      {item.status} - {item.planName || 'Sin plan'} - {item.billingModel}
                    </AppText>
                  </View>
                  <View style={styles.dashboardCompactCell}>
                    <AppText variant="caption" color={theme.colors.mutedText}>Usuarios</AppText>
                    <AppText bold>{item.activeUsers}/{item.maxUsers ?? 'sin limite'}</AppText>
                  </View>
                  <View style={styles.dashboardCompactCell}>
                    <AppText variant="caption" color={theme.colors.mutedText}>Sucursales</AppText>
                    <AppText bold>{item.activeBranches}/{item.maxBranches ?? 'sin limite'}</AppText>
                  </View>
                  <View style={styles.dashboardPendingCell}>
                    <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={2}>
                      {item.pendingLabels.join(' - ')}
                    </AppText>
                    <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
                      {item.usageLabel} - {item.modules.length > 0 ? item.modules.join(', ') : 'Sin modulos'}
                    </AppText>
                  </View>
                  <AppButton
                    title="Revisar"
                    variant="secondary"
                    onPress={() => openDashboardCompanyAction(item.companyId, 'companies')}
                    style={styles.compactButton}
                  />
                </View>
              ))}
            </View>
          )}
        </AppCard>

        <View style={[styles.dashboardTwoColumn, isPhone ? styles.column : null]}>
          <AppCard style={[styles.panel, styles.dashboardColumn]}>
            <View style={styles.sectionHeader}>
              <StatusBadge label="ALERTAS" tone={alerts.length > 0 ? 'warning' : 'success'} />
              <View style={styles.flex}>
                <AppText variant="subtitle" bold>
                  Alertas operativas
                </AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  Senales globales calculadas con datos operativos existentes.
                </AppText>
              </View>
            </View>
            {alerts.length === 0 ? (
              <EmptyState title="Sin alertas criticas" message="No hay paquetes, envios o autorizaciones pendientes que destacar." icon="notifications" />
            ) : (
              <View style={styles.dashboardList}>
                {alerts.map((alert) => (
                  <View key={alert.type} style={[styles.dashboardListRow, { borderColor: theme.colors.border }]}>
                    <View style={styles.flex}>
                      <View style={styles.inlineBadges}>
                        <StatusBadge label={String(alert.count)} tone={normalizeDashboardTone(alert.tone)} />
                        <AppText bold numberOfLines={1}>{alert.label}</AppText>
                      </View>
                    </View>
                    <AppButton
                      title="Revisar"
                      variant="secondary"
                      onPress={() => router.push(buildPlatformRoute(normalizePlatformActionSection(alert.actionSection), selectedCompanyId))}
                      style={styles.compactButton}
                    />
                  </View>
                ))}
              </View>
            )}
          </AppCard>

          <AppCard style={[styles.panel, styles.dashboardColumn]}>
            <View style={styles.sectionHeader}>
              <StatusBadge label="ACCIONES" tone="info" />
              <View style={styles.flex}>
                <AppText variant="subtitle" bold>
                  Acciones rapidas
                </AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  Atajos de administracion SaaS, no navegacion duplicada.
                </AppText>
              </View>
            </View>
            <View style={styles.dashboardActionGrid}>
              <AppButton title="Crear cliente" variant="operation" disabled={!canManageCompanies} disabledReason="Tu usuario necesita MANAGE_COMPANIES." onPress={() => { setShowCompanyForm(true); router.push(buildPlatformRoute('companies', selectedCompanyId)); }} style={styles.actionButton} />
              <AppButton title="Configurar planes" variant="secondary" onPress={() => router.push(buildPlatformRoute('subscriptions', selectedCompanyId))} style={styles.actionButton} />
              <AppButton title="Revisar limites" variant="secondary" onPress={() => router.push(buildPlatformRoute('limits', selectedCompanyId))} style={styles.actionButton} />
              <AppButton title="Ver uso global" variant="secondary" onPress={() => router.push(buildPlatformRoute('usage', selectedCompanyId))} style={styles.actionButton} />
            </View>
          </AppCard>
        </View>
      </View>
    );
  };

  const renderCompanies = () => (
    <View style={styles.sectionStack}>
      <AppCard style={styles.panel}>
        <View style={[styles.rowBetween, isPhone ? styles.column : null]}>
          <View style={styles.flex}>
            <AppText variant="subtitle" bold>
              Clientes / Companias
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              Crea clientes, consulta companias y elige que cliente vas a administrar.
            </AppText>
          </View>
          <AppButton
            title={showCompanyForm ? 'Ocultar formulario' : 'Crear compania'}
            variant="operation"
            disabled={!canManageCompanies}
            disabledReason="Tu usuario necesita MANAGE_COMPANIES."
            onPress={() => setShowCompanyForm((current) => !current)}
          />
        </View>

        {showCompanyForm ? (
          <View style={styles.inlineForm}>
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
              disabledReason="Tu usuario necesita MANAGE_COMPANIES."
              onPress={handleCreateCompany}
              style={styles.actionButton}
            />
          </View>
        ) : null}
      </AppCard>

      <View style={styles.companyList}>
        {companies.map((company) => {
          const selected = company.id === selectedCompanyId;
          const isPlatformCompany = company.code === 'APPMODA_PLATFORM';
          const usage = usageSummary.find((item) => item.companyId === company.id);
          const settingsLabel = usage?.billingModel || 'SIN_CONFIGURAR';
          return (
            <AppCard key={company.id} variant={selected ? 'selected' : 'default'} style={styles.companyCard}>
              <View style={[styles.rowBetween, isPhone ? styles.column : null]}>
                <View style={styles.flex}>
                  <View style={styles.inlineBadges}>
                    <AppText bold>{company.name}</AppText>
                    <StatusBadge label={isPlatformCompany ? 'Interna' : company.status} tone={company.status === 'ACTIVE' ? 'success' : 'warning'} />
                  </View>
                  <AppText variant="caption" color={theme.colors.mutedText}>
                    {company.code} - {company.branchName || 'Sin sucursal principal'}
                  </AppText>
                  <AppText variant="caption" color={theme.colors.mutedText}>
                    Usuarios activos / limite: {usage?.activeUsers ?? '-'} / {usage?.maxUsers ?? 'sin limite'} - Sucursales: {usage?.activeBranches ?? '-'} / {usage?.maxBranches ?? 'sin limite'}
                  </AppText>
                  <AppText variant="caption" color={theme.colors.mutedText}>
                    Modelo: {settingsLabel} - Plan: {usage?.planName || 'sin plan'}
                  </AppText>
                </View>
                <AppButton
                  title={selected ? 'En administracion' : 'Administrar'}
                  variant={selected ? 'neutral' : 'secondary'}
                  disabled={selected || isPlatformCompany}
                  disabledReason={isPlatformCompany ? 'Tenant interno.' : 'Este cliente ya esta en administracion.'}
                  onPress={() => updateCompanyInAdministration(company.id, company.name)}
                  style={styles.compactButton}
                />
              </View>
            </AppCard>
          );
        })}
      </View>
    </View>
  );

  const renderBranches = () => (
    <View style={styles.sectionStack}>
      {!canUseSelectedCompany
        ? renderCompanyRequired('Elige un cliente en Clientes / Companias o usa Cambiar en el menu lateral para configurar sucursales, usuarios, modulos, limites, tarifas y uso.')
        : (
      <AppCard style={styles.panel}>
        <View style={[styles.rowBetween, isPhone ? styles.column : null]}>
          <View style={styles.flex}>
            <AppText variant="subtitle" bold>
              Sucursales
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              Administra sucursales del cliente en administracion.
            </AppText>
            {renderCompanyScopeLine()}
          </View>
          <AppButton
            title={showBranchForm ? 'Ocultar formulario' : 'Nueva sucursal'}
            variant="operation"
            disabled={!canManageCompanies || !canUseSelectedCompany}
            disabledReason="Selecciona un cliente y confirma permiso MANAGE_COMPANIES."
            onPress={() => setShowBranchForm((current) => !current)}
          />
        </View>

        {showBranchForm ? (
          <View style={styles.inlineForm}>
            <AppInput
              label="Nombre"
              placeholder="Sucursal Centro"
              value={branchForm.name}
              onChangeText={(value) => setBranchForm((current) => ({ ...current, name: value }))}
              editable={!creatingBranch && canManageCompanies}
            />
            <AppInput
              label="Codigo"
              placeholder="CENTRO"
              value={branchForm.code}
              onChangeText={(value) => setBranchForm((current) => ({ ...current, code: value }))}
              editable={!creatingBranch && canManageCompanies}
            />
            <AppButton
              title="Crear sucursal"
              loading={creatingBranch}
              disabled={creatingBranch || !canManageCompanies || !canUseSelectedCompany}
              disabledReason="Selecciona un cliente valido."
              onPress={handleCreateBranch}
              style={styles.actionButton}
            />
          </View>
        ) : null}
      </AppCard>
        )}
      {canUseSelectedCompany ? renderBranchesList() : null}
    </View>
  );

  const renderUsers = () => (
    <View style={styles.sectionStack}>
      {!canUseSelectedCompany
        ? renderCompanyRequired('Elige un cliente en Clientes / Companias o usa Cambiar en el menu lateral para configurar sus usuarios.')
        : (
      <AppCard style={styles.panel}>
        <View style={[styles.rowBetween, isPhone ? styles.column : null]}>
          <View style={styles.flex}>
            <AppText variant="subtitle" bold>
              Usuarios
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              Administra usuarios y roles operativos del cliente en administracion.
            </AppText>
            {renderCompanyScopeLine()}
          </View>
          <View style={styles.actionsRow}>
            <AppButton
              title={showAdminForm ? 'Ocultar admin' : 'Crear admin'}
              variant="secondary"
              disabled={!canManageAdmins || !canUseSelectedCompany}
              disabledReason="Selecciona cliente y permiso MANAGE_TENANT_ADMINS."
              onPress={() => setShowAdminForm((current) => !current)}
            />
            <AppButton
              title={showUserForm ? 'Ocultar usuario' : 'Nuevo usuario'}
              variant="operation"
              disabled={!canManageAdmins || !canUseSelectedCompany}
              disabledReason="Selecciona cliente y permiso MANAGE_TENANT_ADMINS."
              onPress={() => setShowUserForm((current) => !current)}
            />
          </View>
        </View>

        {showAdminForm ? renderAdminForm() : null}
        {showUserForm ? renderUserForm() : null}
      </AppCard>
        )}
      {canUseSelectedCompany ? renderUsersList() : null}
    </View>
  );

  const renderModules = () => (
    <View style={styles.sectionStack}>
      {!canUseSelectedCompany ? renderCompanyRequired('Elige un cliente en Clientes / Companias o usa Cambiar en el menu lateral para activar sus modulos.') : null}
      {canUseSelectedCompany ? (
      <AppCard style={styles.panel}>
        <View style={styles.sectionHeader}>
          <StatusBadge label="MODULOS" tone="info" />
          <View style={styles.flex}>
            <AppText variant="subtitle" bold>
              Modulos activos
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              Activa o desactiva funcionalidades para el cliente en administracion.
            </AppText>
            {renderCompanyScopeLine()}
          </View>
        </View>
        {companySettings ? (
          <>
            <View style={styles.moduleGrid}>
              {companySettings.modules.map((module) => (
                <View key={module.code} style={styles.moduleRow}>
                  <View style={styles.flex}>
                    <AppText bold>{module.name}</AppText>
                    <AppText variant="caption" color={theme.colors.mutedText}>
                      {module.code}
                    </AppText>
                  </View>
                  <AppButton
                    title={module.enabled ? 'Activo' : 'Inactivo'}
                    variant={module.enabled ? 'primary' : 'secondary'}
                    disabled={!canManageModules}
                    disabledReason="Tu usuario necesita MANAGE_COMPANY_MODULES."
                    onPress={() => toggleModule(module.code)}
                    style={styles.moduleButton}
                  />
                </View>
              ))}
            </View>
            <AppButton
              title="Guardar modulos"
              loading={savingSettings}
              disabled={savingSettings || !canManageModules}
              disabledReason="Tu usuario necesita MANAGE_COMPANY_MODULES."
              onPress={handleSaveSettings}
              style={styles.actionButton}
            />
          </>
        ) : (
          <EmptyState title="Selecciona un cliente" message="Elige una compania para cargar modulos." icon="toggle-on" />
        )}
      </AppCard>
      ) : null}
    </View>
  );

  const renderLimits = () => (
    <View style={styles.sectionStack}>
      {!canUseSelectedCompany ? renderCompanyRequired('Elige un cliente en Clientes / Companias o usa Cambiar en el menu lateral para configurar sus limites contratados.') : null}
      {canUseSelectedCompany ? (
      <AppCard style={styles.panel}>
        <View style={styles.sectionHeader}>
          <StatusBadge label="LIMITES" tone="warning" />
          <View style={styles.flex}>
            <AppText variant="subtitle" bold>
              Limites
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              Define limites contratados para el cliente en administracion.
            </AppText>
            {renderCompanyScopeLine()}
          </View>
        </View>
        {selectedCompanyDetail ? (
          <View style={styles.metricGrid}>
            {renderMetric('Usuarios actuales / maximo', `${selectedCompanyDetail.activeUserCount} / ${settingsForm.maxUsers || 'sin limite'}`)}
            {renderMetric('Sucursales actuales / maximo', `${selectedCompanyDetail.branchCount} / ${settingsForm.maxBranches || 'sin limite'}`)}
          </View>
        ) : null}
        <View style={[styles.grid, isPhone ? styles.column : null]}>
          <AppInput label="Usuarios permitidos" placeholder="Sin limite" keyboardType="numeric" value={settingsForm.maxUsers} onChangeText={(value) => setSettingsForm((current) => ({ ...current, maxUsers: value }))} editable={!savingSettings && canManageLimits} />
          <AppInput label="Sucursales permitidas" placeholder="Sin limite" keyboardType="numeric" value={settingsForm.maxBranches} onChangeText={(value) => setSettingsForm((current) => ({ ...current, maxBranches: value }))} editable={!savingSettings && canManageLimits} />
          <AppInput label="Prendas permitidas" placeholder="Sin limite" keyboardType="numeric" value={settingsForm.maxItems} onChangeText={(value) => setSettingsForm((current) => ({ ...current, maxItems: value }))} editable={!savingSettings && canManageLimits} />
          <AppInput label="LIVE por mes" placeholder="Sin limite" keyboardType="numeric" value={settingsForm.maxLiveSessionsPerMonth} onChangeText={(value) => setSettingsForm((current) => ({ ...current, maxLiveSessionsPerMonth: value }))} editable={!savingSettings && canManageLimits} />
          <AppInput label="Envios por mes" placeholder="Sin limite" keyboardType="numeric" value={settingsForm.maxShipmentsPerMonth} onChangeText={(value) => setSettingsForm((current) => ({ ...current, maxShipmentsPerMonth: value }))} editable={!savingSettings && canManageLimits} />
          <AppInput label="Paquetes por mes" placeholder="Sin limite" keyboardType="numeric" value={settingsForm.maxPackagesPerMonth} onChangeText={(value) => setSettingsForm((current) => ({ ...current, maxPackagesPerMonth: value }))} editable={!savingSettings && canManageLimits} />
        </View>
        <AppButton
          title="Guardar limites"
          loading={savingSettings}
          disabled={savingSettings || !canManageLimits}
          disabledReason="Tu usuario necesita MANAGE_COMPANY_LIMITS."
          onPress={handleSaveSettings}
          style={styles.actionButton}
        />
      </AppCard>
      ) : null}
    </View>
  );

  const renderSubscriptions = () => (
    <View style={styles.sectionStack}>
      <AppCard style={styles.panel}>
        <View style={[styles.rowBetween, isPhone ? styles.column : null]}>
          <View style={styles.flex}>
            <AppText variant="subtitle" bold>
              Planes / Suscripciones
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              Catalogo global de planes y suscripcion del cliente en administracion cuando aplique.
            </AppText>
          </View>
          <AppButton
            title={showPlanForm ? 'Ocultar plan' : 'Crear plan'}
            variant="operation"
            disabled={!canManagePlans}
            disabledReason="Tu usuario necesita MANAGE_SUBSCRIPTION_PLANS."
            onPress={() => setShowPlanForm((current) => !current)}
          />
        </View>
        {showPlanForm ? renderPlanForm() : null}
      </AppCard>
      {renderPlanCatalog()}
      {renderPlanPrices()}
      {renderCompanySubscription()}
    </View>
  );

  const renderUsageRates = () => (
    <View style={styles.sectionStack}>
      {!canUseSelectedCompany ? renderCompanyRequired('Elige un cliente en Clientes / Companias o usa Cambiar en el menu lateral para configurar sus tarifas por consumo.') : null}
      {canUseSelectedCompany ? (
      <AppCard style={styles.panel}>
        <View style={styles.sectionHeader}>
          <StatusBadge label="CONSUMO" tone="info" />
          <View style={styles.flex}>
            <AppText variant="subtitle" bold>
              Tarifas por consumo
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              Define cuanto cuesta cada evento de uso para clientes por consumo o modelo hibrido.
            </AppText>
            {renderCompanyScopeLine()}
          </View>
        </View>
        {usageRates.length === 0 ? (
          <EmptyState title="Selecciona un cliente" message="Las tarifas se cargan por company_id." icon="receipt-long" />
        ) : (
          <View style={styles.compactList}>
            {usageRates.map((rate) => (
              <View key={rate.usageType} style={styles.usageRateRow}>
                <View style={styles.flex}>
                  <AppText bold>{rate.name}</AppText>
                  <AppText variant="caption" color={theme.colors.mutedText}>{rate.usageType}</AppText>
                </View>
                <AppInput
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={String(rate.unitPrice ?? 0)}
                  onChangeText={(value) => setUsageRates((current) => current.map((item) => item.usageType === rate.usageType ? { ...item, unitPrice: Number(value || 0) } : item))}
                  editable={!savingUsageRates && canManageUsageRates}
                  style={styles.moneyInput}
                />
                <AppButton
                  title={rate.enabled ? 'Activo' : 'Inactivo'}
                  variant={rate.enabled ? 'primary' : 'secondary'}
                  disabled={!canManageUsageRates}
                  disabledReason="Tu usuario necesita MANAGE_USAGE_RATES."
                  onPress={() => setUsageRates((current) => current.map((item) => item.usageType === rate.usageType ? { ...item, enabled: !item.enabled } : item))}
                  style={styles.compactButton}
                />
              </View>
            ))}
          </View>
        )}
        <AppButton
          title="Guardar tarifas"
          loading={savingUsageRates}
          disabled={savingUsageRates || !canManageUsageRates || !canUseSelectedCompany}
          disabledReason="Selecciona cliente y permiso MANAGE_USAGE_RATES."
          onPress={handleSaveUsageRates}
          style={styles.actionButton}
        />
      </AppCard>
      ) : null}
    </View>
  );

  const renderUsage = () => (
    <View style={styles.sectionStack}>
      {!canUseSelectedCompany
        ? renderCompanyRequired('Elige un cliente en Clientes / Companias o usa Cambiar en el menu lateral para consultar su consumo y actividad.')
        : renderUsageList(false)}
    </View>
  );

  const renderAudit = () => (
    <AppCard style={styles.panel}>
      <View style={styles.sectionHeader}>
        <StatusBadge label="AUDITORIA" tone="warning" />
        <View style={styles.flex}>
          <AppText variant="subtitle" bold>
            Auditoria global de Plataforma
          </AppText>
          <AppText variant="caption" color={theme.colors.mutedText}>
            Auditoria global pendiente de hardening. Esta seccion queda separada y no reutiliza el Panel Owner.
          </AppText>
        </View>
      </View>
      <EmptyState
        title="Auditoria global pendiente"
        message="Eventos SaaS como plan asignado, tarifa modificada o modulo desactivado se conectaran a un endpoint auditado posterior."
        icon="security"
      />
    </AppCard>
  );

  const renderActiveSection = () => {
    if (loadingCompanyScope && activeSection !== 'dashboard' && activeSection !== 'companies') {
      return (
        <AppCard style={styles.panel}>
          <ActivityIndicator />
        </AppCard>
      );
    }

    switch (activeSection) {
      case 'dashboard':
        return renderDashboard();
      case 'companies':
        return renderCompanies();
      case 'branches':
        return renderBranches();
      case 'users':
        return renderUsers();
      case 'modules':
        return renderModules();
      case 'limits':
        return renderLimits();
      case 'subscriptions':
        return renderSubscriptions();
      case 'usageRates':
        return renderUsageRates();
      case 'usage':
        return renderUsage();
      case 'audit':
        return renderAudit();
      default:
        return renderDashboard();
    }
  };

  const renderMetric = (label: string, value: string | number) => (
    <AppCard style={styles.metricCard} key={label}>
      <AppText variant="caption" color={theme.colors.mutedText}>{label}</AppText>
      <AppText variant="title" bold>{value}</AppText>
    </AppCard>
  );

  const renderBranchesList = () => (
    <View style={styles.compactList}>
      {companyBranches.length === 0 ? (
        <EmptyState title="Sin sucursales" message="Crea una sucursal para el cliente en administracion." icon="store" />
      ) : (
        companyBranches.map((branch) => (
          <AppCard key={branch.id} style={styles.listCard}>
            <View style={styles.rowBetween}>
              <View style={styles.flex}>
                <AppText bold>{branch.code} - {branch.name}</AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>ID {branch.id}</AppText>
              </View>
              <StatusBadge label={branch.status} tone={branch.status === 'ACTIVE' ? 'success' : 'neutral'} />
            </View>
          </AppCard>
        ))
      )}
    </View>
  );

  const renderAdminForm = () => (
    <View style={styles.inlineForm}>
      <AppText bold>Crear admin inicial o adicional</AppText>
      <AppInput label="Nombre del admin" placeholder="Administrador Cliente Demo" value={adminForm.name} onChangeText={(value) => setAdminForm((current) => ({ ...current, name: value }))} editable={!creatingAdmin && canManageAdmins} />
      <AppInput label="Correo" placeholder="admin.cliente.demo@local.test" autoCapitalize="none" keyboardType="email-address" value={adminForm.email} onChangeText={(value) => setAdminForm((current) => ({ ...current, email: value }))} editable={!creatingAdmin && canManageAdmins} />
      <AppInput label="Password inicial" placeholder="AdminCliente123!" secureTextEntry value={adminForm.password} onChangeText={(value) => setAdminForm((current) => ({ ...current, password: value }))} editable={!creatingAdmin && canManageAdmins} />
      <AppText variant="caption" color={theme.colors.mutedText}>Sucursal destino: {selectedBranchName}</AppText>
      <AppButton title="Crear admin" loading={creatingAdmin} disabled={creatingAdmin || !canManageAdmins || !canUseSelectedCompany} disabledReason="Selecciona cliente y permiso MANAGE_TENANT_ADMINS." onPress={handleCreateAdmin} style={styles.actionButton} />
    </View>
  );

  const renderUserForm = () => (
    <View style={styles.inlineForm}>
      <AppText bold>Crear usuario operativo</AppText>
      <AppInput label="Nombre" placeholder="Vendedor Centro" value={userForm.name} onChangeText={(value) => setUserForm((current) => ({ ...current, name: value }))} editable={!creatingUser && canManageAdmins} />
      <AppInput label="Correo" placeholder="vendedor.centro@cliente.test" autoCapitalize="none" keyboardType="email-address" value={userForm.email} onChangeText={(value) => setUserForm((current) => ({ ...current, email: value }))} editable={!creatingUser && canManageAdmins} />
      <AppInput label="Password inicial" placeholder="Vendedor123!" secureTextEntry value={userForm.password} onChangeText={(value) => setUserForm((current) => ({ ...current, password: value }))} editable={!creatingUser && canManageAdmins} />
      <AppInput label="Telefono opcional" placeholder="Opcional" value={userForm.phone} onChangeText={(value) => setUserForm((current) => ({ ...current, phone: value }))} editable={!creatingUser && canManageAdmins} />
      <View style={styles.actionsRow}>
        {TENANT_ROLE_OPTIONS.map((role) => (
          <AppButton key={role.code} title={role.label} variant={userForm.role === role.code ? 'primary' : 'secondary'} onPress={() => setUserForm((current) => ({ ...current, role: role.code }))} style={styles.compactButton} />
        ))}
      </View>
      <AppText variant="caption" color={theme.colors.mutedText}>Sucursal asignada: {selectedBranchName}</AppText>
      <AppButton title="Crear usuario" loading={creatingUser} disabled={creatingUser || !canManageAdmins || !canUseSelectedCompany || companyBranches.length === 0} disabledReason="Selecciona una empresa con sucursal y permiso MANAGE_TENANT_ADMINS." onPress={handleCreateUser} style={styles.actionButton} />
    </View>
  );

  const renderUsersList = () => (
    <View style={styles.compactList}>
      {companyUsers.length === 0 ? (
        <EmptyState title="Sin usuarios" message="Crea admin o usuario operativo para este cliente." icon="manage-accounts" />
      ) : (
        companyUsers.map((user) => (
          <AppCard key={user.id} style={styles.listCard}>
            <View style={[styles.rowBetween, isPhone ? styles.column : null]}>
              <View style={styles.flex}>
                <AppText bold>{user.name}</AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>{user.email} - {user.branchName}</AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>Roles: {user.roles.join(', ') || 'Sin rol'}</AppText>
              </View>
              <StatusBadge label={user.status} tone={user.status === 'ACTIVE' ? 'success' : 'neutral'} />
            </View>
          </AppCard>
        ))
      )}
    </View>
  );

  const renderPlanForm = () => (
    <View style={styles.inlineForm}>
      <AppInput label="Codigo" placeholder="PRO" value={planForm.code} onChangeText={(value) => setPlanForm((current) => ({ ...current, code: value }))} editable={!creatingPlan && canManagePlans} />
      <AppInput label="Nombre" placeholder="Plan Pro" value={planForm.name} onChangeText={(value) => setPlanForm((current) => ({ ...current, name: value }))} editable={!creatingPlan && canManagePlans} />
      <AppInput label="Descripcion" placeholder="Plan para tienda en crecimiento" value={planForm.description} onChangeText={(value) => setPlanForm((current) => ({ ...current, description: value }))} editable={!creatingPlan && canManagePlans} />
      <View style={[styles.grid, isPhone ? styles.column : null]}>
        <AppInput label="Usuarios incluidos" placeholder="5" keyboardType="numeric" value={planForm.includedMaxUsers} onChangeText={(value) => setPlanForm((current) => ({ ...current, includedMaxUsers: value }))} editable={!creatingPlan && canManagePlans} />
        <AppInput label="Sucursales incluidas" placeholder="1" keyboardType="numeric" value={planForm.includedMaxBranches} onChangeText={(value) => setPlanForm((current) => ({ ...current, includedMaxBranches: value }))} editable={!creatingPlan && canManagePlans} />
      </View>
      <View style={styles.actionsRow}>
        {PLAN_MODULE_FLAGS.map(({ key, label }) => (
          <AppButton
            key={key}
            title={`${label}: ${planForm[key] ? 'Si' : 'No'}`}
            variant={planForm[key] ? 'primary' : 'secondary'}
            onPress={() => setPlanForm((current) => ({ ...current, [key]: !current[key] }))}
            style={styles.compactButton}
          />
        ))}
      </View>
      <AppButton title="Crear plan" loading={creatingPlan} disabled={creatingPlan || !canManagePlans} disabledReason="Tu usuario necesita MANAGE_SUBSCRIPTION_PLANS." onPress={handleCreatePlan} style={styles.actionButton} />
    </View>
  );

  const renderPlanCatalog = () => (
    <AppCard style={styles.panel}>
      <View style={styles.sectionHeader}>
        <StatusBadge label="GLOBAL" tone="info" />
        <View style={styles.flex}>
          <AppText variant="subtitle" bold>Catalogo global de planes</AppText>
          <AppText variant="caption" color={theme.colors.mutedText}>
            Planes disponibles para todos los clientes. No dependen del cliente en administracion.
          </AppText>
        </View>
      </View>
      <View style={styles.compactList}>
        {subscriptionPlans.length === 0 ? (
          <EmptyState title="Sin planes" message="Crea un plan para iniciar la configuracion SaaS." icon="payments" />
        ) : (
          subscriptionPlans.map((plan) => (
            <View key={plan.id} style={styles.listRow}>
              <View style={styles.flex}>
                <AppText bold>{plan.name}</AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  {plan.code} - Usuarios {plan.includedMaxUsers ?? 'sin limite'} - Sucursales {plan.includedMaxBranches ?? 'sin limite'}
                </AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  LIVE {plan.includesLive ? 'si' : 'no'} - Reportes {plan.includesReports ? 'si' : 'no'} - Envios {plan.includesShipments ? 'si' : 'no'} - Paquetes {plan.includesPackages ? 'si' : 'no'}
                </AppText>
              </View>
              <AppButton title={selectedPlanId === plan.id ? 'Plan para precios' : 'Configurar precios'} variant={selectedPlanId === plan.id ? 'neutral' : 'secondary'} onPress={() => setSelectedPlanId(plan.id)} style={styles.compactButton} />
            </View>
          ))
        )}
      </View>
    </AppCard>
  );

  const renderPlanPrices = () => (
    <AppCard style={styles.panel}>
      <View style={styles.sectionHeader}>
        <StatusBadge label="PRECIOS" tone="info" />
        <View style={styles.flex}>
          <AppText variant="subtitle" bold>
            Precios por periodo
          </AppText>
          <AppText variant="caption" color={theme.colors.mutedText}>
            {selectedPlan
              ? `${selectedPlan.name} - precios globales del plan`
              : 'Selecciona un plan del catalogo global'}
          </AppText>
        </View>
      </View>
      <View style={[styles.grid, isPhone ? styles.column : null]}>
        {BILLING_PERIODS.map((period) => (
          <AppInput
            key={period.code}
            label={period.label}
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={priceForm[period.code] ?? ''}
            onChangeText={(value) => setPriceForm((current) => ({ ...current, [period.code]: value }))}
            editable={!savingPrices && canManagePlans && Boolean(selectedPlanId)}
          />
        ))}
      </View>
      <AppText variant="caption" color={theme.colors.mutedText}>
        Precios guardados: {planPrices.map((price) => `${price.billingPeriod} ${money(price.priceAmount)}`).join(' - ') || 'sin precios'}
      </AppText>
      <AppButton title="Guardar precios" loading={savingPrices} disabled={savingPrices || !canManagePlans || !selectedPlanId} disabledReason="Selecciona plan y permiso MANAGE_SUBSCRIPTION_PLANS." onPress={handleSavePlanPrices} style={styles.actionButton} />
    </AppCard>
  );

  const renderCompanySubscription = () => (
    !canUseSelectedCompany ? (
      renderCompanyRequired('Elige un cliente en Clientes / Companias o usa Cambiar en el menu lateral para asignar o revisar su suscripcion.')
    ) : (
    <AppCard style={styles.panel}>
      <View style={styles.sectionHeader}>
        <StatusBadge label="CLIENTE" tone="role" />
        <View style={styles.flex}>
          <AppText variant="subtitle" bold>
            Suscripcion del cliente en administracion
          </AppText>
          <AppText variant="caption" color={theme.colors.mutedText}>
            {selectedCompany ? selectedCompany.name : 'Selecciona un cliente'}
          </AppText>
          {renderCompanyScopeLine()}
        </View>
      </View>
      <AppText variant="caption" color={theme.colors.mutedText} bold>
        Modelo de cobro
      </AppText>
      <View style={styles.actionsRow}>
        {BILLING_MODELS.map((model) => (
          <AppButton key={model.code} title={model.label} variant={subscriptionForm.billingModel === model.code ? 'primary' : 'secondary'} onPress={() => setSubscriptionForm((current) => ({ ...current, billingModel: model.code }))} style={styles.compactButton} />
        ))}
      </View>
      <AppText variant="caption" color={theme.colors.mutedText} bold>
        Plan asignado
      </AppText>
      <View style={styles.actionsRow}>
        {subscriptionPlans.map((plan) => (
          <AppButton key={plan.id} title={plan.name} variant={subscriptionForm.planId === plan.id ? 'primary' : 'secondary'} onPress={() => setSubscriptionForm((current) => ({ ...current, planId: plan.id }))} style={styles.compactButton} />
        ))}
      </View>
      <AppText variant="caption" color={theme.colors.mutedText} bold>
        Periodicidad
      </AppText>
      <View style={styles.actionsRow}>
        {BILLING_PERIODS.map((period) => (
          <AppButton key={period.code} title={period.label} variant={subscriptionForm.billingPeriod === period.code ? 'primary' : 'secondary'} onPress={() => setSubscriptionForm((current) => ({ ...current, billingPeriod: period.code }))} style={styles.compactButton} />
        ))}
      </View>
      <AppText variant="caption" color={theme.colors.mutedText} bold>
        Estado
      </AppText>
      <View style={styles.actionsRow}>
        {SUBSCRIPTION_STATUSES.map((status) => (
          <AppButton key={status.code} title={status.label} variant={subscriptionForm.status === status.code ? 'primary' : 'secondary'} onPress={() => setSubscriptionForm((current) => ({ ...current, status: status.code }))} style={styles.compactButton} />
        ))}
      </View>
      <AppText variant="caption" color={theme.colors.mutedText}>
        Actual: {companySubscription?.planName || 'sin plan'} - {companySubscription?.billingModel || 'sin modelo'} - {companySubscription?.status || 'sin estado'}
      </AppText>
      <AppButton title="Guardar suscripcion" loading={savingSubscription} disabled={savingSubscription || !canManageSubscriptions || !canUseSelectedCompany} disabledReason="Selecciona cliente y permiso MANAGE_COMPANY_SUBSCRIPTIONS." onPress={handleSaveSubscription} style={styles.actionButton} />
    </AppCard>
    )
  );

  const renderUsageList = (compact: boolean) => (
    <AppCard style={styles.panel}>
      <View style={styles.sectionHeader}>
        <StatusBadge label="USO" tone="info" />
        <View style={styles.flex}>
          <AppText variant="subtitle" bold>
            Uso del cliente
          </AppText>
          <AppText variant="caption" color={theme.colors.mutedText}>
            Metricas basicas del cliente en administracion. No configura planes ni tarifas.
          </AppText>
          {renderCompanyScopeLine()}
        </View>
      </View>
      <View style={styles.compactList}>
        {(compact ? usageSummary.slice(0, 5) : selectedUsage ? [selectedUsage] : []).map((item) => (
          <View key={item.companyId} style={styles.listRow}>
            <View style={styles.flex}>
              <AppText bold>{item.companyName}</AppText>
              <AppText variant="caption" color={theme.colors.mutedText}>
                Modelo {item.billingModel} - Plan {item.planName || 'sin plan'} - Estado {item.subscriptionStatus}
              </AppText>
              <AppText variant="caption" color={theme.colors.mutedText}>
                Usuarios {item.activeUsers}/{item.maxUsers ?? 'sin limite'} - Sucursales {item.activeBranches}/{item.maxBranches ?? 'sin limite'} - Modulos activos {item.activeModules}
              </AppText>
            </View>
            <AppButton title={selectedCompanyId === item.companyId ? 'Uso visible' : 'Ver uso'} variant={selectedCompanyId === item.companyId ? 'neutral' : 'secondary'} onPress={() => updateCompanyInAdministration(item.companyId, item.companyName)} style={styles.compactButton} />
          </View>
        ))}
      </View>
      {selectedUsage ? (
        <AppText variant="caption" color={theme.colors.mutedText}>
          Cliente en administracion: {selectedUsage.companyName} - {selectedUsage.billingModel} - {selectedUsage.planName || 'sin plan'}
        </AppText>
      ) : null}
    </AppCard>
  );

  if (loading) {
    return (
      <AppShellPage
        eyebrow="MODO PLATAFORMA"
        title="Panel Owner AppModa"
        subtitle="Administracion SaaS multiempresa"
        metadata="Administra clientes, sucursales, usuarios, modulos, limites, suscripciones y consumo. No opera ventas, inventario, pagos ni LIVE mezclando clientes."
        activeRoute={`platform-${activeSection}`}
        session={session}
        sidebarScrollStorageKey={OWNER_SIDEBAR_SCROLL_KEY}
        compactHeader
      >
        <ActivityIndicator />
      </AppShellPage>
    );
  }

  return (
    <AppShellPage
      eyebrow="MODO PLATAFORMA"
      title="Panel Owner AppModa"
      subtitle="Administracion SaaS multiempresa"
      metadata="Administra clientes, sucursales, usuarios, modulos, limites, suscripciones y consumo. No opera ventas, inventario, pagos ni LIVE mezclando clientes."
      activeRoute={`platform-${activeSection}`}
      session={session}
      compactHeader
      sidebarContext={renderOwnerCompanyContext()}
      sidebarScrollStorageKey={OWNER_SIDEBAR_SCROLL_KEY}
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
        {renderActiveSection()}
      </ScrollView>
      {renderCompanyPicker()}
    </AppShellPage>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignSelf: 'flex-start',
    minWidth: 160,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  column: {
    flexDirection: 'column',
  },
  compactButton: {
    minHeight: 32,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  compactList: {
    gap: 8,
    marginTop: 10,
  },
  companyCard: {
    marginBottom: 0,
  },
  companyPickerRow: {
    alignItems: 'center',
    borderColor: '#d8dee9',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    padding: 10,
  },
  companyList: {
    gap: 10,
  },
  content: {
    gap: 14,
    paddingBottom: 28,
  },
  dashboardActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dashboardColumn: {
    flex: 1,
    minWidth: 280,
  },
  dashboardCompactCell: {
    minWidth: 92,
  },
  dashboardCompanyCell: {
    flex: 1.3,
    minWidth: 180,
  },
  dashboardList: {
    gap: 8,
  },
  dashboardListRow: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    padding: 10,
  },
  dashboardMetricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dashboardMetricTile: {
    borderRadius: 10,
    borderWidth: 1,
    flexGrow: 1,
    flexShrink: 1,
    gap: 3,
    minHeight: 82,
    minWidth: 150,
    padding: 10,
  },
  dashboardPendingCell: {
    flex: 1.2,
    minWidth: 210,
  },
  dashboardQuickActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
  },
  dashboardTable: {
    gap: 8,
  },
  dashboardTableRow: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 10,
  },
  dashboardTwoColumn: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: 12,
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  grid: {
    alignItems: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  inlineBadges: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  inlineForm: {
    gap: 10,
    marginTop: 12,
  },
  listCard: {
    marginBottom: 0,
  },
  listRow: {
    alignItems: 'center',
    borderColor: '#d8dee9',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    padding: 10,
  },
  metricCard: {
    flex: 1,
    marginBottom: 0,
    minWidth: 135,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  moduleButton: {
    minWidth: 100,
  },
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moduleRow: {
    alignItems: 'center',
    borderColor: '#d8dee9',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    flexGrow: 1,
    flexShrink: 1,
    gap: 10,
    justifyContent: 'space-between',
    minWidth: 230,
    padding: 10,
  },
  moneyInput: {
    minWidth: 110,
  },
  notice: {
    marginBottom: 0,
  },
  ownerContextName: {
    marginTop: 1,
  },
  ownerContextButton: {
    alignSelf: 'flex-start',
    minHeight: 28,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  ownerContextPill: {
    alignItems: 'flex-start',
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 7,
    width: '100%',
  },
  panel: {
    gap: 12,
    marginBottom: 0,
  },
  rowBetween: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  sectionHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
  },
  sectionStack: {
    gap: 12,
  },
  todayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  usageRateRow: {
    alignItems: 'center',
    borderColor: '#d8dee9',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: 10,
  },
});
