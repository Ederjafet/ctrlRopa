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
  createPlatformSubscriptionPlan,
  createPlatformTenantAdmin,
  createPlatformUser,
  getPlatformBranches,
  getPlatformCompanies,
  getPlatformCompanyDetail,
  getPlatformCompanySettings,
  getPlatformCompanySubscription,
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
  { key: 'dashboard', label: 'Panel Owner' },
  { key: 'companies', label: 'Clientes / Companias' },
  { key: 'branches', label: 'Sucursales' },
  { key: 'users', label: 'Usuarios' },
  { key: 'modules', label: 'Modulos activos' },
  { key: 'limits', label: 'Limites por cliente' },
  { key: 'subscriptions', label: 'Planes / Suscripciones' },
  { key: 'usageRates', label: 'Tarifas por consumo' },
  { key: 'usage', label: 'Uso por cliente' },
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

function normalizeSection(value: unknown): PlatformSection {
  const raw = Array.isArray(value) ? value[0] : value;
  const candidate = typeof raw === 'string' ? raw : 'dashboard';
  return SECTION_CONFIG.some((section) => section.key === candidate)
    ? (candidate as PlatformSection)
    : 'dashboard';
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

export default function PlatformScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useAppTheme();
  const { isPhone } = useResponsiveLayout();

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
      const [companyRows, planRows, usageRows] = await Promise.all([
        getPlatformCompanies(),
        getPlatformSubscriptionPlans(),
        getPlatformUsageSummary(),
      ]);
      setCompanies(companyRows);
      setSubscriptionPlans(planRows);
      setUsageSummary(usageRows);
      setSelectedCompanyId((current) =>
        current ?? companyRows.find((company) => company.code !== 'APPMODA_PLATFORM')?.id ?? null
      );
      setSelectedPlanId((current) => current ?? planRows[0]?.id ?? null);
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
    const data = await getPlatformCompanies();
    setCompanies(data);
    if (selectedCompanyId && !data.some((company) => company.id === selectedCompanyId)) {
      setSelectedCompanyId(null);
    }
  };

  const refreshUsageSummary = async () => {
    setUsageSummary(await getPlatformUsageSummary());
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
      setShowCompanyForm(false);
      setSelectedCompanyId(created.id);
      setMessage(`Empresa creada: ${created.name}.`);
      Alert.alert('Empresa creada', `Se creo ${created.name} con sucursal principal.`);
      await refreshCompanies();
      await refreshUsageSummary();
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
      setMessage('Modulos y limites actualizados para el cliente seleccionado.');
      await loadCompanyScope(selectedCompany.id);
      await refreshUsageSummary();
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

  const renderCompanyContext = () => (
    <AppCard style={styles.panel}>
      <View style={[styles.rowBetween, isPhone ? styles.column : null]}>
        <View style={styles.flex}>
          <AppText variant="caption" color={theme.colors.mutedText} bold>
            CONTEXTO DE CLIENTE
          </AppText>
          <AppText variant="subtitle" bold>
            {selectedCompany ? `Administrando: ${selectedCompany.name}` : 'Selecciona una compania primero'}
          </AppText>
          <AppText variant="caption" color={theme.colors.mutedText}>
            {selectedCompany
              ? `${selectedCompany.code} - ${selectedCompany.branchName || 'Sin sucursal principal'}`
              : 'Ve a Clientes / Companias para elegir el cliente que quieres configurar.'}
          </AppText>
        </View>
        {selectedCompanyDetail ? (
          <View style={styles.metaStack}>
            <StatusBadge label={`Sucursales ${selectedCompanyDetail.branchCount}`} tone="neutral" />
            <StatusBadge label={`Usuarios activos ${selectedCompanyDetail.activeUserCount}`} tone="info" />
          </View>
        ) : null}
        <AppButton
          title={selectedCompany ? 'Cambiar cliente' : 'Seleccionar cliente'}
          variant="secondary"
          onPress={() => router.push('/platform?section=companies' as any)}
          style={styles.compactButton}
        />
      </View>
    </AppCard>
  );

  const renderCompanyRequired = (message: string) => (
    <AppCard style={styles.panel}>
      <EmptyState title="Selecciona una compania" message={message} icon="domain" />
      <AppButton title="Ir a Clientes / Companias" variant="secondary" onPress={() => router.push('/platform?section=companies' as any)} style={styles.actionButton} />
    </AppCard>
  );

  const renderDashboard = () => (
    <View style={styles.sectionStack}>
      <AppCard style={styles.panel}>
        <View style={styles.sectionHeader}>
          <StatusBadge label="PANEL SAAS" tone="info" />
          <View style={styles.flex}>
            <AppText variant="subtitle" bold>
              Dashboard SaaS AppModa
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              Resumen general de plataforma. No contiene formularios ni operacion de tienda.
            </AppText>
          </View>
        </View>
        <View style={styles.metricGrid}>
          {renderMetric('Clientes activos', activeCompanies.length)}
          {renderMetric('Clientes suspendidos/inactivos', inactiveCompanies.length)}
          {renderMetric('Planes activos', subscriptionPlans.filter((plan) => plan.status === 'ACTIVE').length)}
          {renderMetric('Clientes sin plan', clientsWithoutPlan.length)}
          {renderMetric('Clientes con modelo consumo', usageSummary.filter((item) => item.billingModel === 'USAGE_BASED').length)}
          {renderMetric('Clientes con suscripcion activa', usageSummary.filter((item) => item.subscriptionStatus === 'ACTIVE').length)}
        </View>
        <View style={styles.actionsRow}>
          <AppButton title="Ver clientes" variant="secondary" onPress={() => router.push('/platform?section=companies' as any)} style={styles.compactButton} />
          <AppButton title="Revisar suscripciones" variant="secondary" onPress={() => router.push('/platform?section=subscriptions' as any)} style={styles.compactButton} />
        </View>
      </AppCard>
      {renderUsageList(true)}
    </View>
  );

  const renderCompanies = () => (
    <View style={styles.sectionStack}>
      <AppCard style={styles.panel}>
        <View style={[styles.rowBetween, isPhone ? styles.column : null]}>
          <View style={styles.flex}>
            <AppText variant="subtitle" bold>
              Clientes / Companias
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              Lista clientes, crea empresas y selecciona el contexto que usaran las demas secciones.
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
                  title={selected ? 'Seleccionada' : 'Seleccionar'}
                  variant={selected ? 'neutral' : 'secondary'}
                  disabled={selected || isPlatformCompany}
                  disabledReason={isPlatformCompany ? 'Tenant interno.' : 'La empresa ya esta seleccionada.'}
                  onPress={() => setSelectedCompanyId(company.id)}
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
      {renderCompanyContext()}
      {!canUseSelectedCompany
        ? renderCompanyRequired('Selecciona una compania en Clientes / Companias para administrar sus sucursales.')
        : (
      <AppCard style={styles.panel}>
        <View style={[styles.rowBetween, isPhone ? styles.column : null]}>
          <View style={styles.flex}>
            <AppText variant="subtitle" bold>
              Sucursales del cliente
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              Administra solo las sucursales de la compania seleccionada.
            </AppText>
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
      {renderCompanyContext()}
      {!canUseSelectedCompany
        ? renderCompanyRequired('Selecciona una compania para administrar sus usuarios.')
        : (
      <AppCard style={styles.panel}>
        <View style={[styles.rowBetween, isPhone ? styles.column : null]}>
          <View style={styles.flex}>
            <AppText variant="subtitle" bold>
              Usuarios del cliente
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              Crea admins y usuarios operativos asociados a la compania seleccionada.
            </AppText>
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
      {renderCompanyContext()}
      {!canUseSelectedCompany ? renderCompanyRequired('Selecciona una compania para activar o desactivar modulos.') : null}
      {canUseSelectedCompany ? (
      <AppCard style={styles.panel}>
        <View style={styles.sectionHeader}>
          <StatusBadge label="MODULOS" tone="info" />
          <View style={styles.flex}>
            <AppText variant="subtitle" bold>
              Modulos activos del cliente
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              Activa o desactiva funcionalidades disponibles para este cliente.
            </AppText>
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
      {renderCompanyContext()}
      {!canUseSelectedCompany ? renderCompanyRequired('Selecciona una compania para configurar sus limites contratados.') : null}
      {canUseSelectedCompany ? (
      <AppCard style={styles.panel}>
        <View style={styles.sectionHeader}>
          <StatusBadge label="LIMITES" tone="warning" />
          <View style={styles.flex}>
            <AppText variant="subtitle" bold>
              Limites contratados del cliente
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              Define cuantos usuarios, sucursales y operaciones puede usar este cliente.
            </AppText>
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
              Crea planes, define periodicidades y asocia el cliente seleccionado a un modelo de cobro.
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
      {renderCompanyContext()}
      {renderCompanySubscription()}
    </View>
  );

  const renderUsageRates = () => (
    <View style={styles.sectionStack}>
      {renderCompanyContext()}
      {!canUseSelectedCompany ? renderCompanyRequired('Selecciona una compania para configurar sus tarifas por consumo.') : null}
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
      {renderCompanyContext()}
      {renderUsageList(false)}
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
        <EmptyState title="Sin sucursales" message="Crea una sucursal para el cliente seleccionado." icon="store" />
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
      <AppText variant="subtitle" bold>Catalogo de planes</AppText>
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
              <AppButton title={selectedPlanId === plan.id ? 'Seleccionado' : 'Precios'} variant={selectedPlanId === plan.id ? 'neutral' : 'secondary'} onPress={() => setSelectedPlanId(plan.id)} style={styles.compactButton} />
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
            {selectedPlan ? selectedPlan.name : 'Selecciona un plan del catalogo'}
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
    <AppCard style={styles.panel}>
      <View style={styles.sectionHeader}>
        <StatusBadge label="CLIENTE" tone="role" />
        <View style={styles.flex}>
          <AppText variant="subtitle" bold>
            Suscripcion del cliente
          </AppText>
          <AppText variant="caption" color={theme.colors.mutedText}>
            {selectedCompany ? selectedCompany.name : 'Selecciona un cliente'}
          </AppText>
        </View>
      </View>
      <View style={styles.actionsRow}>
        {subscriptionPlans.map((plan) => (
          <AppButton key={plan.id} title={plan.name} variant={subscriptionForm.planId === plan.id ? 'primary' : 'secondary'} onPress={() => setSubscriptionForm((current) => ({ ...current, planId: plan.id }))} style={styles.compactButton} />
        ))}
      </View>
      <View style={styles.actionsRow}>
        {BILLING_MODELS.map((model) => (
          <AppButton key={model.code} title={model.label} variant={subscriptionForm.billingModel === model.code ? 'primary' : 'secondary'} onPress={() => setSubscriptionForm((current) => ({ ...current, billingModel: model.code }))} style={styles.compactButton} />
        ))}
      </View>
      <View style={styles.actionsRow}>
        {BILLING_PERIODS.map((period) => (
          <AppButton key={period.code} title={period.label} variant={subscriptionForm.billingPeriod === period.code ? 'primary' : 'secondary'} onPress={() => setSubscriptionForm((current) => ({ ...current, billingPeriod: period.code }))} style={styles.compactButton} />
        ))}
      </View>
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
  );

  const renderUsageList = (compact: boolean) => (
    <AppCard style={styles.panel}>
      <View style={styles.sectionHeader}>
        <StatusBadge label="USO" tone="info" />
        <View style={styles.flex}>
          <AppText variant="subtitle" bold>
            Uso por cliente
          </AppText>
          <AppText variant="caption" color={theme.colors.mutedText}>
            Metricas basicas para cobranza SaaS. No configura planes ni tarifas.
          </AppText>
        </View>
      </View>
      <View style={styles.compactList}>
        {(compact ? usageSummary.slice(0, 5) : usageSummary).map((item) => (
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
            <AppButton title={selectedCompanyId === item.companyId ? 'Seleccionado' : 'Seleccionar'} variant={selectedCompanyId === item.companyId ? 'neutral' : 'secondary'} onPress={() => setSelectedCompanyId(item.companyId)} style={styles.compactButton} />
          </View>
        ))}
      </View>
      {selectedUsage ? (
        <AppText variant="caption" color={theme.colors.mutedText}>
          Cliente seleccionado: {selectedUsage.companyName} - {selectedUsage.billingModel} - {selectedUsage.planName || 'sin plan'}
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
  companyList: {
    gap: 10,
  },
  content: {
    gap: 14,
    paddingBottom: 28,
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
  metaStack: {
    alignItems: 'flex-end',
    gap: 6,
  },
  metricCard: {
    flex: 1,
    marginBottom: 0,
    minWidth: 160,
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
    gap: 8,
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
  moneyInput: {
    minWidth: 110,
  },
  notice: {
    marginBottom: 0,
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
