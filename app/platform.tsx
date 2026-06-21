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
  getPlatformCommercialAgreement,
  getPlatformAuditEvents,
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
  PlatformCommercialAgreement,
  PlatformCompanyUser,
  PlatformAuditEvent,
  PlatformAuditEventsResponse,
  PlatformDashboardSummary,
  PlatformPlanPrice,
  PlatformSubscriptionPlan,
  PlatformUsageRate,
  PlatformUsageSummary,
  updatePlatformBranch,
  updatePlatformCompany,
  updatePlatformCompanyUser,
  updatePlatformCompanySettings,
  updatePlatformCompanySubscription,
  updatePlatformCommercialAgreement,
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
  { key: 'subscriptions', label: 'Planes / Licencias' },
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

const LICENSE_STATUSES = [
  { code: 'ACTIVE', label: 'Activa' },
  { code: 'SUSPENDED', label: 'Suspendida' },
  { code: 'CANCELLED', label: 'Cancelada' },
];

const DEPLOYMENT_TYPES = [
  { code: 'CLIENT_HOSTED', label: 'Cliente hospedado' },
  { code: 'APPMODA_HOSTED', label: 'AppModa hospedado' },
  { code: 'HYBRID', label: 'Mixto' },
  { code: 'OTHER', label: 'Otro' },
];

const SERVICE_STATUSES = [
  { code: 'ACTIVE', label: 'Activo' },
  { code: 'NOT_APPLICABLE', label: 'No aplica' },
  { code: 'PAST_DUE', label: 'Vencido' },
  { code: 'SUSPENDED', label: 'Suspendido' },
  { code: 'CANCELLED', label: 'Cancelado' },
];

const COMMERCIAL_PAYMENT_METHODS = [
  { code: 'TRANSFER', label: 'Transferencia' },
  { code: 'CASH', label: 'Efectivo' },
  { code: 'CARD', label: 'Tarjeta' },
  { code: 'DEPOSIT', label: 'Deposito' },
  { code: 'OTHER', label: 'Otro' },
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

type CompanyFilterKey = 'all' | 'active' | 'withoutPlan' | 'pending' | 'ready' | 'internal';
type AuditCategoryFilter =
  | 'ALL'
  | 'COMPANIES'
  | 'SUBSCRIPTIONS'
  | 'PRICES'
  | 'CONFIGURATION'
  | 'USERS'
  | 'PLATFORM';
type AuditDateFilter = 'ALL' | 'TODAY' | '7D' | '30D';

type CompanyHealth = {
  label: string;
  tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
};

const TENANT_ROLE_OPTIONS = [
  { code: 'ADMIN', label: 'Admin' },
  { code: 'SUPERVISOR', label: 'Supervisor' },
  { code: 'SELLER', label: 'Vendedor' },
  { code: 'CASHIER', label: 'Caja' },
];

const AUDIT_CATEGORY_OPTIONS: { key: AuditCategoryFilter; label: string }[] = [
  { key: 'ALL', label: 'Todos' },
  { key: 'COMPANIES', label: 'Clientes' },
  { key: 'SUBSCRIPTIONS', label: 'Suscripciones' },
  { key: 'PRICES', label: 'Precios' },
  { key: 'CONFIGURATION', label: 'Modulos / limites' },
  { key: 'USERS', label: 'Usuarios' },
  { key: 'PLATFORM', label: 'Plataforma' },
];

const AUDIT_DATE_OPTIONS: { key: AuditDateFilter; label: string }[] = [
  { key: 'ALL', label: 'Todo' },
  { key: 'TODAY', label: 'Hoy' },
  { key: '7D', label: '7 dias' },
  { key: '30D', label: '30 dias' },
];

const EMPTY_COMPANY_FORM = {
  name: '',
  legalName: '',
  branchName: 'Sucursal Principal',
  status: 'ACTIVE',
};

const EMPTY_ADMIN_FORM = {
  name: '',
  email: '',
  password: '',
};

const EMPTY_BRANCH_FORM = {
  name: '',
  code: '',
  status: 'ACTIVE',
};

const EMPTY_USER_FORM = {
  name: '',
  email: '',
  password: '',
  phone: '',
  role: 'SELLER',
  branchId: null as number | null,
  status: 'ACTIVE',
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
  startedAt: '',
  endsAt: '',
  nextBillingAt: '',
};

const EMPTY_COMMERCIAL_FORM = {
  licenseStatus: 'ACTIVE',
  purchaseAmount: '',
  licenseCurrency: 'MXN',
  paymentDate: '',
  paymentMethod: 'TRANSFER',
  paymentReference: '',
  licenseNotes: '',
  validFrom: '',
  validUntil: '',
  noExpiration: true,
  unlimitedCommercialUse: true,
  deploymentType: 'CLIENT_HOSTED',
  serviceStatus: 'NOT_APPLICABLE',
  annualAmount: '',
  serviceCurrency: 'MXN',
  serviceStartDate: '',
  serviceEndDate: '',
  autoRenew: false,
  servicePaymentMethod: 'TRANSFER',
  servicePaymentReference: '',
  serviceNotes: '',
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

function sectionForCompanyPending(labels: string[]): PlatformSection {
  if (labels.some((item) =>
    item.includes('plan') ||
    item.includes('cobro') ||
    item.includes('Suscripcion') ||
    item.includes('hosting') ||
    item.includes('Servicio anual')
  )) {
    return 'subscriptions';
  }
  if (labels.some((item) => item.includes('limite'))) {
    return 'limits';
  }
  if (labels.some((item) => item.includes('usuario') || item.includes('admin'))) {
    return 'users';
  }
  if (labels.some((item) => item.includes('modulo') || item.includes('LIVE'))) {
    return 'modules';
  }
  if (labels.some((item) => item.includes('sucursal'))) {
    return 'branches';
  }
  return 'companies';
}

function normalizeDashboardTone(value?: string | null): 'neutral' | 'success' | 'warning' | 'danger' | 'info' {
  if (value === 'success' || value === 'warning' || value === 'danger' || value === 'info') {
    return value;
  }
  return 'neutral';
}

function normalizeBillingModelLabel(value?: string | null) {
  switch ((value || '').toUpperCase()) {
    case 'SUBSCRIPTION':
      return 'Suscripcion';
    case 'USAGE_BASED':
      return 'Consumo';
    case 'HYBRID':
      return 'Hibrido';
    case 'PERPETUAL':
      return 'Licencia perpetua';
    case 'SIN_CONFIGURAR':
    case '':
      return 'Sin modelo';
    default:
      return value || 'Sin modelo';
  }
}

function normalizeLicenseStatusLabel(value?: string | null) {
  const status = LICENSE_STATUSES.find((item) => item.code === (value || '').toUpperCase());
  if (status) return status.label;
  if (!value || value === 'SIN_CONFIGURAR') return 'Sin licencia';
  return value;
}

function normalizeDeploymentTypeLabel(value?: string | null) {
  const deployment = DEPLOYMENT_TYPES.find((item) => item.code === (value || '').toUpperCase());
  return deployment?.label ?? 'Sin hospedaje definido';
}

function normalizeServiceStatusLabel(value?: string | null) {
  const status = SERVICE_STATUSES.find((item) => item.code === (value || '').toUpperCase());
  return status?.label ?? 'Sin servicio';
}

function normalizePaymentMethodLabel(value?: string | null) {
  const method = COMMERCIAL_PAYMENT_METHODS.find((item) => item.code === (value || '').toUpperCase());
  return method?.label ?? value ?? 'Sin metodo';
}

function normalizeSubscriptionStatusLabel(value?: string | null) {
  switch ((value || '').toUpperCase()) {
    case 'ACTIVE':
      return 'Suscripcion activa';
    case 'TRIAL':
      return 'Trial';
    case 'PAST_DUE':
      return 'Vencida';
    case 'SUSPENDED':
      return 'Suspendida';
    case 'CANCELLED':
      return 'Cancelada';
    case 'SIN_CONFIGURAR':
    case '':
      return 'Sin suscripcion';
    default:
      return value || 'Sin suscripcion';
  }
}

function getBillingPeriodLabel(value?: string | null) {
  return BILLING_PERIODS.find((period) => period.code === value)?.label ?? value ?? 'Sin periodicidad';
}

function getPlanModuleLabels(plan: PlatformSubscriptionPlan) {
  return PLAN_MODULE_FLAGS
    .filter(({ key }) => plan[key])
    .map(({ label }) => label);
}

function isPriceComplete(prices?: PlatformPlanPrice[]) {
  if (!prices) return false;
  return BILLING_PERIODS.every((period) =>
    prices.some((price) => price.billingPeriod === period.code && price.status === 'ACTIVE')
  );
}

function formatCountLimit(current?: number | null, max?: number | null) {
  return `${current ?? 0} / ${max ?? 'sin limite'}`;
}

function uniqueLabels(labels: string[]) {
  return Array.from(new Set(labels.filter(Boolean)));
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

function commercialAgreementToForm(agreement: PlatformCommercialAgreement | null) {
  const license = agreement?.license;
  const service = agreement?.serviceAgreement;
  return {
    licenseStatus:
      license?.status && license.status !== 'SIN_CONFIGURAR' ? license.status : 'ACTIVE',
    purchaseAmount: license?.purchaseAmount == null ? '' : String(license.purchaseAmount),
    licenseCurrency: license?.currency || 'MXN',
    paymentDate: license?.paymentDate || '',
    paymentMethod: license?.paymentMethod || 'TRANSFER',
    paymentReference: license?.paymentReference || '',
    licenseNotes: license?.notes || '',
    validFrom: license?.validFrom || '',
    validUntil: license?.validUntil || '',
    noExpiration: license?.noExpiration ?? true,
    unlimitedCommercialUse: license?.unlimitedCommercialUse ?? true,
    deploymentType: service?.deploymentType || 'CLIENT_HOSTED',
    serviceStatus: service?.status || 'NOT_APPLICABLE',
    annualAmount: service?.annualAmount == null ? '' : String(service.annualAmount),
    serviceCurrency: service?.currency || 'MXN',
    serviceStartDate: service?.startDate || '',
    serviceEndDate: service?.endDate || '',
    autoRenew: service?.autoRenew ?? false,
    servicePaymentMethod: service?.paymentMethod || 'TRANSFER',
    servicePaymentReference: service?.paymentReference || '',
    serviceNotes: service?.notes || '',
  };
}

function formatAuditTimestamp(value?: string | null) {
  if (!value) return 'Fecha no disponible';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function normalizeAuditCategoryLabel(value?: string | null) {
  const category = AUDIT_CATEGORY_OPTIONS.find((item) => item.key === value);
  return category?.label ?? value ?? 'Plataforma';
}

function normalizeAuditCoverageTone(value?: string | null): 'neutral' | 'success' | 'warning' | 'danger' | 'info' {
  const normalized = (value || '').toLowerCase();
  if (normalized.includes('activo')) return 'success';
  if (normalized.includes('pendiente')) return 'warning';
  if (normalized.includes('parcial')) return 'info';
  return 'neutral';
}

function matchesAuditDateFilter(value: string, filter: AuditDateFilter) {
  if (filter === 'ALL') return true;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return true;
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  if (filter === 'TODAY') {
    return parsed >= start;
  }

  const days = filter === '7D' ? 6 : 29;
  start.setDate(start.getDate() - days);
  return parsed >= start;
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
  const [commercialAgreement, setCommercialAgreement] =
    useState<PlatformCommercialAgreement | null>(null);
  const [usageRates, setUsageRates] = useState<PlatformUsageRate[]>([]);
  const [usageSummary, setUsageSummary] = useState<PlatformUsageSummary[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<PlatformDashboardSummary | null>(null);
  const [platformAudit, setPlatformAudit] = useState<PlatformAuditEventsResponse | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<PlatformSubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [planPrices, setPlanPrices] = useState<PlatformPlanPrice[]>([]);
  const [planPricesById, setPlanPricesById] = useState<Record<number, PlatformPlanPrice[]>>({});
  const [priceForm, setPriceForm] = useState<Record<string, string>>({});
  const [companyForm, setCompanyForm] = useState(EMPTY_COMPANY_FORM);
  const [adminForm, setAdminForm] = useState(EMPTY_ADMIN_FORM);
  const [branchForm, setBranchForm] = useState(EMPTY_BRANCH_FORM);
  const [userForm, setUserForm] = useState(EMPTY_USER_FORM);
  const [settingsForm, setSettingsForm] = useState(EMPTY_SETTINGS_FORM);
  const [planForm, setPlanForm] = useState(EMPTY_PLAN_FORM);
  const [subscriptionForm, setSubscriptionForm] = useState(EMPTY_SUBSCRIPTION_FORM);
  const [commercialForm, setCommercialForm] = useState(EMPTY_COMMERCIAL_FORM);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [companyPickerVisible, setCompanyPickerVisible] = useState(false);
  const [companyFilter, setCompanyFilter] = useState<CompanyFilterKey>('all');
  const [editingCompanyId, setEditingCompanyId] = useState<number | null>(null);
  const [editingBranchId, setEditingBranchId] = useState<number | null>(null);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditCategoryFilter, setAuditCategoryFilter] = useState<AuditCategoryFilter>('ALL');
  const [auditDateFilter, setAuditDateFilter] = useState<AuditDateFilter>('ALL');
  const [selectedAuditEventId, setSelectedAuditEventId] = useState<number | null>(null);
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
  const [savingCommercialAgreement, setSavingCommercialAgreement] = useState(false);
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
  const canManageLicenses = hasEffectivePermission(session, 'MANAGE_PLATFORM_LICENSES');
  const canManageServiceAgreements = hasEffectivePermission(session, 'MANAGE_PLATFORM_SERVICE_AGREEMENTS');
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
    setPlanPricesById((current) => ({ ...current, [planId]: prices }));
    setPriceForm(
      BILLING_PERIODS.reduce<Record<string, string>>((acc, period) => {
        const price = prices.find((item) => item.billingPeriod === period.code);
        acc[period.code] = price ? String(price.priceAmount) : '';
        return acc;
      }, {})
    );
  }, []);

  const refreshPlanPriceMap = useCallback(async (plans: PlatformSubscriptionPlan[]) => {
    if (plans.length === 0) {
      setPlanPricesById({});
      return;
    }

    const entries = await Promise.all(
      plans.map(async (plan) => {
        try {
          return [plan.id, await getPlatformPlanPrices(plan.id)] as const;
        } catch {
          return [plan.id, []] as const;
        }
      })
    );
    setPlanPricesById(Object.fromEntries(entries));
  }, []);

  const loadCompanyScope = useCallback(async (companyId: number | null) => {
    const company = companies.find((item) => item.id === companyId);

    if (!companyId || company?.code === 'APPMODA_PLATFORM') {
      setSelectedCompanyDetail(null);
      setCompanyBranches([]);
      setCompanyUsers([]);
      setCompanySettings(null);
      setCompanySubscription(null);
      setCommercialAgreement(null);
      setUsageRates([]);
      setSettingsForm(EMPTY_SETTINGS_FORM);
      setSubscriptionForm(EMPTY_SUBSCRIPTION_FORM);
      setCommercialForm(EMPTY_COMMERCIAL_FORM);
      setUserForm((current) => ({ ...current, branchId: null }));
      return;
    }

    try {
      setLoadingCompanyScope(true);
      const [detail, branches, users, settings, subscription, agreement, rates] = await Promise.all([
        getPlatformCompanyDetail(companyId),
        getPlatformBranches(companyId),
        getPlatformUsers(companyId),
        getPlatformCompanySettings(companyId),
        getPlatformCompanySubscription(companyId),
        getPlatformCommercialAgreement(companyId),
        getPlatformUsageRates(companyId),
      ]);
      setSelectedCompanyDetail(detail);
      setCompanyBranches(branches);
      setCompanyUsers(users);
      setCompanySettings(settings);
      setCompanySubscription(subscription);
      setCommercialAgreement(agreement);
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
        startedAt: subscription.startedAt ?? '',
        endsAt: subscription.endsAt ?? '',
        nextBillingAt: subscription.nextBillingAt ?? '',
      });
      setCommercialForm(commercialAgreementToForm(agreement));
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
      const [companyRows, planRows, usageRows, dashboardRows, auditRows, storedCompanyIdRaw] = await Promise.all([
        getPlatformCompanies(),
        getPlatformSubscriptionPlans(),
        getPlatformUsageSummary(),
        getPlatformDashboardSummary(),
        getPlatformAuditEvents(),
        AsyncStorage.getItem(PLATFORM_SELECTED_COMPANY_ID_KEY),
      ]);
      const storedCompanyId = parseCompanyIdParam(storedCompanyIdRaw);
      setCompanies(companyRows);
      setSubscriptionPlans(planRows);
      setUsageSummary(usageRows);
      setDashboardSummary(dashboardRows);
      setPlatformAudit(auditRows);
      await refreshPlanPriceMap(planRows);
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
  }, [buildPlatformRoute, params.section, refreshPlanPriceMap, routeCompanyId, router]);

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

  const refreshPlatformAudit = async () => {
    setPlatformAudit(await getPlatformAuditEvents());
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

  const resetCompanyEditor = () => {
    setEditingCompanyId(null);
    setCompanyForm(EMPTY_COMPANY_FORM);
    setShowCompanyForm(false);
  };

  const openCompanyEditor = (company: PlatformCompany) => {
    setEditingCompanyId(company.id);
    setCompanyForm({
      name: company.name,
      legalName: '',
      branchName: company.branchName || 'Sucursal Principal',
      status: company.status || 'ACTIVE',
    });
    setShowCompanyForm(true);
    setMessage('');
    setErrorMessage('');
  };

  const resetBranchEditor = () => {
    setEditingBranchId(null);
    setBranchForm(EMPTY_BRANCH_FORM);
    setShowBranchForm(false);
  };

  const openBranchEditor = (branch: PlatformBranch) => {
    setEditingBranchId(branch.id);
    setBranchForm({
      name: branch.name,
      code: branch.code,
      status: branch.status || 'ACTIVE',
    });
    setShowBranchForm(true);
    setMessage('');
    setErrorMessage('');
  };

  const resetUserEditor = () => {
    setEditingUserId(null);
    setUserForm((current) => ({
      ...EMPTY_USER_FORM,
      role: current.role,
      branchId: current.branchId,
    }));
    setShowUserForm(false);
  };

  const openUserEditor = (user: PlatformCompanyUser) => {
    setEditingUserId(user.id);
    setUserForm({
      name: user.name,
      email: user.email,
      password: '',
      phone: user.phone ?? '',
      role: user.roles[0] || 'SELLER',
      branchId: user.branchId,
      status: user.status || 'ACTIVE',
    });
    setShowUserForm(true);
    setShowAdminForm(false);
    setMessage('');
    setErrorMessage('');
  };

  const handleCreateCompany = async () => {
    if (creatingCompany) return;
    const name = companyForm.name.trim();
    const branchName = companyForm.branchName.trim();

    if (!name || (!editingCompanyId && !branchName)) {
      setErrorMessage(editingCompanyId ? 'Captura nombre de empresa.' : 'Captura nombre de empresa y sucursal principal.');
      return;
    }

    try {
      setCreatingCompany(true);
      setErrorMessage('');
      setMessage('');
      if (editingCompanyId) {
        await updatePlatformCompany(editingCompanyId, {
          name,
          status: companyForm.status,
        });
        const edited = companies.find((company) => company.id === editingCompanyId);
        resetCompanyEditor();
        setMessage(`Empresa actualizada: ${name}.`);
        if (selectedCompanyId === editingCompanyId && edited) {
          updateCompanyInAdministration(editingCompanyId, name);
        }
        await refreshCompanies();
        await refreshUsageSummary();
        await refreshDashboardSummary();
        await refreshPlatformAudit();
        return;
      }

      const created = await createPlatformCompany({
        name,
        legalName: companyForm.legalName.trim() || undefined,
        branchName,
      });
      resetCompanyEditor();
      updateCompanyInAdministration(created.id, created.name);
      Alert.alert('Empresa creada', `Se creo ${created.name} con sucursal principal.`);
      await refreshCompanies();
      await refreshUsageSummary();
      await refreshDashboardSummary();
      await refreshPlatformAudit();
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
      if (editingBranchId) {
        const updated = await updatePlatformBranch(selectedCompany.id, editingBranchId, {
          name,
          code: code || undefined,
          status: branchForm.status,
        });
        resetBranchEditor();
        setMessage(`Sucursal actualizada: ${updated.name}.`);
        await loadCompanyScope(selectedCompany.id);
        await refreshCompanies();
        await refreshUsageSummary();
        await refreshDashboardSummary();
        await refreshPlatformAudit();
        return;
      }

      const created = await createPlatformBranch(selectedCompany.id, {
        name,
        code: code || undefined,
      });
      resetBranchEditor();
      setUserForm((current) => ({ ...current, branchId: created.id }));
      setMessage(`Sucursal creada: ${created.name}.`);
      await loadCompanyScope(selectedCompany.id);
      await refreshCompanies();
      await refreshUsageSummary();
      await refreshDashboardSummary();
      await refreshPlatformAudit();
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
      await refreshPlatformAudit();
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

    if (!canUseSelectedCompany || !name || !role || (!editingUserId && (!email || !password))) {
      setErrorMessage(editingUserId ? 'Captura empresa, sucursal, nombre y rol.' : 'Captura empresa, sucursal, nombre, correo, rol y password inicial.');
      return;
    }

    try {
      setCreatingUser(true);
      setErrorMessage('');
      setMessage('');
      if (editingUserId) {
        const updated = await updatePlatformCompanyUser(selectedCompany.id, editingUserId, {
          name,
          role,
          branchId: userForm.branchId,
          phone: userForm.phone.trim() || null,
          status: userForm.status,
        });
        resetUserEditor();
        setMessage(`Usuario actualizado: ${updated.email}.`);
        await loadCompanyScope(selectedCompany.id);
        await refreshCompanies();
        await refreshUsageSummary();
        await refreshDashboardSummary();
        await refreshPlatformAudit();
        return;
      }

      const created = await createPlatformUser(selectedCompany.id, {
        name,
        email,
        password,
        role,
        branchId: userForm.branchId,
        phone: userForm.phone.trim() || null,
      });
      resetUserEditor();
      setMessage(`Usuario creado: ${created.email}.`);
      await loadCompanyScope(selectedCompany.id);
      await refreshCompanies();
      await refreshUsageSummary();
      await refreshDashboardSummary();
      await refreshPlatformAudit();
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
      await refreshPlatformAudit();
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
      const plans = await getPlatformSubscriptionPlans();
      setSubscriptionPlans(plans);
      await refreshPlanPriceMap(plans);
      setMessage(`Plan creado: ${created.name}.`);
      await refreshPlatformAudit();
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
      setPlanPricesById((current) => ({ ...current, [selectedPlanId]: prices }));
      setMessage('Precios por periodo actualizados.');
      await refreshPlatformAudit();
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

    if (subscriptionForm.billingModel !== 'USAGE_BASED' && !subscriptionForm.planId) {
      setErrorMessage('Selecciona un plan para modelos de suscripcion o hibrido.');
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
        startedAt: subscriptionForm.startedAt.trim() || null,
        endsAt: subscriptionForm.endsAt.trim() || null,
        nextBillingAt: subscriptionForm.nextBillingAt.trim() || null,
      });
      setCompanySubscription(saved);
      setMessage('Suscripcion del cliente actualizada.');
      await refreshUsageSummary();
      await refreshDashboardSummary();
      await refreshPlatformAudit();
    } catch (error) {
      setErrorMessage(getActionableApiErrorMessage(error));
    } finally {
      setSavingSubscription(false);
    }
  };

  const handleSaveCommercialAgreement = async () => {
    if (savingCommercialAgreement || !selectedCompany) return;

    if (!canUseSelectedCompany) {
      setErrorMessage('Selecciona una empresa cliente para registrar licencia o hosting anual.');
      return;
    }

    const deploymentType = commercialForm.deploymentType;
    const clientHosted = deploymentType === 'CLIENT_HOSTED';

    try {
      setSavingCommercialAgreement(true);
      setErrorMessage('');
      setMessage('');
      const saved = await updatePlatformCommercialAgreement(selectedCompany.id, {
        license: {
          licenseType: 'PERPETUAL',
          status: commercialForm.licenseStatus,
          purchaseAmount: parseMoney(commercialForm.purchaseAmount),
          currency: commercialForm.licenseCurrency || 'MXN',
          paymentDate: commercialForm.paymentDate.trim() || null,
          paymentMethod: commercialForm.paymentMethod,
          paymentReference: commercialForm.paymentReference.trim() || null,
          notes: commercialForm.licenseNotes.trim() || null,
          validFrom: commercialForm.validFrom.trim() || null,
          validUntil: commercialForm.noExpiration ? null : commercialForm.validUntil.trim() || null,
          noExpiration: commercialForm.noExpiration,
          unlimitedCommercialUse: commercialForm.unlimitedCommercialUse,
        },
        serviceAgreement: {
          serviceType: 'HOSTING_INFRASTRUCTURE',
          deploymentType,
          status: clientHosted ? 'NOT_APPLICABLE' : commercialForm.serviceStatus,
          annualAmount: clientHosted ? null : parseMoney(commercialForm.annualAmount),
          currency: commercialForm.serviceCurrency || 'MXN',
          startDate: clientHosted ? null : commercialForm.serviceStartDate.trim() || null,
          endDate: clientHosted ? null : commercialForm.serviceEndDate.trim() || null,
          autoRenew: clientHosted ? false : commercialForm.autoRenew,
          paymentMethod: clientHosted ? null : commercialForm.servicePaymentMethod,
          paymentReference: clientHosted ? null : commercialForm.servicePaymentReference.trim() || null,
          notes: commercialForm.serviceNotes.trim() || null,
        },
      });
      setCommercialAgreement(saved);
      setCommercialForm(commercialAgreementToForm(saved));
      setMessage('Licencia y servicio anual actualizados.');
      await refreshUsageSummary();
      await refreshDashboardSummary();
      await refreshPlatformAudit();
    } catch (error) {
      setErrorMessage(getActionableApiErrorMessage(error));
    } finally {
      setSavingCommercialAgreement(false);
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
      await refreshPlatformAudit();
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
  const companyCards = useMemo(() => {
    const usageByCompanyId = new Map(usageSummary.map((item) => [item.companyId, item]));
    const attentionByCompanyId = new Map(
      (dashboardSummary?.attentionCompanies ?? []).map((item) => [item.companyId, item])
    );
    const pendingByCompanyId = new Map(
      (dashboardSummary?.installationPendings ?? []).map((item) => [item.companyId, item])
    );

    return companies.map((company) => {
      const isInternal = company.code === 'APPMODA_PLATFORM';
      const selected = company.id === selectedCompanyId;
      const usage = usageByCompanyId.get(company.id);
      const attention = attentionByCompanyId.get(company.id);
      const installationPending = pendingByCompanyId.get(company.id);
      const inferredMissing: string[] = [];
      const hasPerpetualLicense =
        !isInternal &&
        usage != null &&
        ((usage.billingModel || '').toUpperCase() === 'PERPETUAL' ||
          ((usage.licenseType || '').toUpperCase() === 'PERPETUAL' &&
            (usage.licenseStatus || '').toUpperCase() === 'ACTIVE'));

      if (!isInternal) {
        if (!usage) {
          inferredMissing.push('Sin configuracion SaaS');
        } else {
          const billingModel = (usage.billingModel || '').toUpperCase();
          const subscriptionStatus = (usage.subscriptionStatus || '').toUpperCase();

          if (!usage.planName) {
            inferredMissing.push('Sin plan');
          }
          if (!billingModel || billingModel === 'SIN_CONFIGURAR') {
            inferredMissing.push('Sin modelo de cobro');
          }
          if ((usage.activeBranches ?? 0) <= 0) {
            inferredMissing.push('Sin sucursal activa');
          }
          if (company.adminUsers <= 0) {
            inferredMissing.push('Sin admin cliente');
          }
          if ((usage.activeUsers ?? 0) <= 0) {
            inferredMissing.push('Sin usuarios activos');
          }
          if ((usage.activeModules ?? 0) <= 0) {
            inferredMissing.push('Sin modulos activos');
          }
          if (!hasPerpetualLicense && usage.maxUsers == null && usage.maxBranches == null) {
            inferredMissing.push('Sin limites configurados');
          }
          if (usage.planName && !['ACTIVE', 'TRIAL'].includes(subscriptionStatus)) {
            inferredMissing.push('Suscripcion no activa');
          }
        }

        if (!company.branchName) {
          inferredMissing.push('Sin sucursal principal');
        }
      }

      const configurationPendings = uniqueLabels([
        ...(installationPending?.missing ?? []),
        ...inferredMissing,
      ]);
      const attentionLabels = uniqueLabels(attention?.pendingLabels ?? []);
      const allPendingLabels = uniqueLabels([...configurationPendings, ...attentionLabels]);
      const hasPlanIssue = configurationPendings.some((item) =>
        item.includes('plan') || item.includes('cobro')
      );
      const isReady =
        !isInternal &&
        company.status === 'ACTIVE' &&
        configurationPendings.length === 0;
      const health: CompanyHealth = isInternal
        ? { label: 'Interno', tone: 'neutral' }
        : company.status !== 'ACTIVE' && company.status !== 'TRIAL'
          ? { label: 'Suspendido/inactivo', tone: 'danger' }
          : hasPerpetualLicense
            ? { label: 'Licencia perpetua', tone: 'success' }
          : hasPlanIssue
            ? { label: 'Sin plan', tone: 'warning' }
            : configurationPendings.length > 0
              ? { label: 'Incompleto', tone: 'warning' }
              : attentionLabels.length > 0
                ? { label: 'Requiere atencion', tone: 'info' }
                : { label: 'Listo', tone: 'success' };
      const modules = attention?.modules?.length
        ? attention.modules
        : usage?.activeModules
          ? [`${usage.activeModules} modulos activos`]
          : [];
      const actionSection = installationPending?.actionSection
        ? normalizePlatformActionSection(installationPending.actionSection)
        : sectionForCompanyPending(configurationPendings);

      return {
        company,
        selected,
        isInternal,
        usage,
        health,
        modules,
        configurationPendings,
        attentionLabels,
        allPendingLabels,
        actionSection,
        isReady,
        hasPlanIssue,
        hasPerpetualLicense,
      };
    });
  }, [companies, dashboardSummary, selectedCompanyId, usageSummary]);
  const companyStats = useMemo(() => {
    const operational = companyCards.filter((item) => !item.isInternal);
    return {
      totalOperational: operational.length,
      active: operational.filter((item) => item.company.status === 'ACTIVE').length,
      withoutPlan: operational.filter((item) => item.hasPlanIssue).length,
      pending: operational.filter((item) => !item.isReady || item.attentionLabels.length > 0).length,
      ready: operational.filter((item) => item.isReady).length,
      inactive: operational.filter((item) => item.company.status !== 'ACTIVE').length,
      internal: companyCards.filter((item) => item.isInternal).length,
    };
  }, [companyCards]);
  const companyFilterOptions = useMemo(
    () => [
      { key: 'all' as const, label: 'Todos', count: companyCards.length },
      { key: 'active' as const, label: 'Activos', count: companyStats.active },
      { key: 'withoutPlan' as const, label: 'Sin plan', count: companyStats.withoutPlan },
      { key: 'pending' as const, label: 'Con pendientes', count: companyStats.pending },
      { key: 'ready' as const, label: 'Listos', count: companyStats.ready },
      { key: 'internal' as const, label: 'Internos', count: companyStats.internal },
    ],
    [companyCards.length, companyStats]
  );
  const filteredCompanyCards = useMemo(() => {
    switch (companyFilter) {
      case 'active':
        return companyCards.filter((item) => !item.isInternal && item.company.status === 'ACTIVE');
      case 'withoutPlan':
        return companyCards.filter((item) => !item.isInternal && item.hasPlanIssue);
      case 'pending':
        return companyCards.filter(
          (item) => !item.isInternal && (!item.isReady || item.attentionLabels.length > 0)
        );
      case 'ready':
        return companyCards.filter((item) => item.isReady);
      case 'internal':
        return companyCards.filter((item) => item.isInternal);
      case 'all':
      default:
        return companyCards;
    }
  }, [companyCards, companyFilter]);
  const planCards = useMemo(() => {
    return subscriptionPlans.map((plan) => {
      const prices = planPricesById[plan.id];
      const completePrices = isPriceComplete(prices);
      const clientsUsing = usageSummary.filter((item) => item.planName === plan.name).length;
      return {
        plan,
        prices,
        completePrices,
        clientsUsing,
        modules: getPlanModuleLabels(plan),
        selected: selectedPlanId === plan.id,
      };
    });
  }, [planPricesById, selectedPlanId, subscriptionPlans, usageSummary]);
  const subscriptionStats = useMemo(() => {
    const activePlans = subscriptionPlans.filter((plan) => plan.status === 'ACTIVE').length;
    return {
      activePlans,
      plansWithoutCompletePrices: planCards.filter((item) => !item.completePrices).length,
      companiesWithoutPlan:
        dashboardSummary?.summary.companiesWithoutPlan ??
        usageSummary.filter((item) => !item.planName || item.billingModel === 'SIN_CONFIGURAR').length,
      companiesWithActiveSubscription:
        dashboardSummary?.summary.companiesWithActiveSubscription ??
        usageSummary.filter((item) => item.subscriptionStatus === 'ACTIVE').length,
      companiesWithPerpetualLicense:
        dashboardSummary?.summary.companiesWithPerpetualLicense ??
        usageSummary.filter((item) => (item.billingModel || '').toUpperCase() === 'PERPETUAL').length,
      appModaHostedCompanies:
        dashboardSummary?.summary.appModaHostedCompanies ??
        usageSummary.filter((item) => (item.deploymentType || '').toUpperCase() === 'APPMODA_HOSTED').length,
      clientHostedCompanies:
        dashboardSummary?.summary.clientHostedCompanies ??
        usageSummary.filter((item) => (item.deploymentType || '').toUpperCase() === 'CLIENT_HOSTED').length,
      annualServicesPastDue: dashboardSummary?.summary.annualServicesPastDue ?? 0,
      annualServicesExpiringSoon: dashboardSummary?.summary.annualServicesExpiringSoon ?? 0,
      currentCustomerStatus: !canUseSelectedCompany
        ? 'Sin cliente'
        : (commercialAgreement?.license.licenseType || '').toUpperCase() === 'PERPETUAL' &&
            (commercialAgreement?.license.status || '').toUpperCase() === 'ACTIVE'
          ? 'Licencia perpetua'
        : companySubscription?.planName
          ? companySubscription.planName
          : normalizeBillingModelLabel(companySubscription?.billingModel) === 'Consumo'
            ? 'Consumo'
            : 'Sin plan',
    };
  }, [canUseSelectedCompany, commercialAgreement, companySubscription, dashboardSummary, planCards, subscriptionPlans, usageSummary]);
  const selectedPlanPrices = selectedPlanId
    ? planPricesById[selectedPlanId] ?? planPrices.filter((price) => price.planId === selectedPlanId)
    : [];
  const selectedPlanPricesComplete = isPriceComplete(selectedPlanPrices);
  const filteredAuditEvents = useMemo(() => {
    const query = auditSearch.trim().toLowerCase();
    return (platformAudit?.items ?? []).filter((event) => {
      const matchesCategory =
        auditCategoryFilter === 'ALL' || event.category === auditCategoryFilter;
      const matchesDate = matchesAuditDateFilter(event.occurredAt, auditDateFilter);
      const searchable = [
        event.title,
        event.description,
        event.actorName,
        event.actorEmail,
        event.companyName,
        event.eventType,
        event.category,
        event.technicalDetail,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchesCategory && matchesDate && (!query || searchable.includes(query));
    });
  }, [auditCategoryFilter, auditDateFilter, auditSearch, platformAudit]);
  const selectedAuditEvent = useMemo(() => {
    if (!selectedAuditEventId) return filteredAuditEvents[0] ?? null;
    return (
      filteredAuditEvents.find((event) => event.id === selectedAuditEventId) ??
      platformAudit?.items.find((event) => event.id === selectedAuditEventId) ??
      filteredAuditEvents[0] ??
      null
    );
  }, [filteredAuditEvents, platformAudit, selectedAuditEventId]);

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
            {renderDashboardMetricTile('Licencias perpetuas', summary?.companiesWithPerpetualLicense ?? 0, 'Pago unico registrado', (summary?.companiesWithPerpetualLicense ?? 0) > 0 ? 'success' : 'neutral')}
            {renderDashboardMetricTile('Cobros unicos', money(summary?.oneTimeLicenseAmount ?? 0), 'Licencias perpetuas, no MRR', (summary?.oneTimeLicenseAmount ?? 0) > 0 ? 'success' : 'neutral')}
            {renderDashboardMetricTile('Hosting AppModa', summary?.appModaHostedCompanies ?? 0, 'Clientes con servicio anual', (summary?.appModaHostedCompanies ?? 0) > 0 ? 'info' : 'neutral')}
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
                      {item.status} - {item.planName || 'Sin plan'} - {normalizeBillingModelLabel(item.billingModel)}
                    </AppText>
                    <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
                      {normalizeDeploymentTypeLabel(item.deploymentType)} - {normalizeServiceStatusLabel(item.serviceAgreementStatus)}
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
            <View style={styles.inlineBadges}>
              <StatusBadge label="SAAS" tone="info" />
              <AppText variant="subtitle" bold>
                Clientes / Companias
              </AppText>
            </View>
            <AppText variant="caption" color={theme.colors.mutedText}>
              Administra clientes, estado, plan, sucursales, usuarios y configuracion SaaS. Elegir un cliente no cambia tu sesion ni es impersonacion.
            </AppText>
          </View>
          <AppButton
            title={showCompanyForm ? (editingCompanyId ? 'Cancelar edicion' : 'Ocultar formulario') : 'Crear compania'}
            variant="operation"
            disabled={!canManageCompanies}
            disabledReason="Tu usuario necesita MANAGE_COMPANIES."
            onPress={() => {
              if (showCompanyForm) {
                resetCompanyEditor();
                return;
              }
              setEditingCompanyId(null);
              setCompanyForm(EMPTY_COMPANY_FORM);
              setShowCompanyForm(true);
            }}
            style={styles.actionButton}
          />
        </View>

        <View style={styles.dashboardMetricGrid}>
          {renderDashboardMetricTile('Clientes operativos', companyStats.totalOperational, 'Excluye AppModa Platform', 'info')}
          {renderDashboardMetricTile('Activos', dashboardSummary?.summary.activeCompanies ?? companyStats.active, 'Listos para configuracion', companyStats.active > 0 ? 'success' : 'neutral')}
          {renderDashboardMetricTile('Sin plan', dashboardSummary?.summary.companiesWithoutPlan ?? companyStats.withoutPlan, 'Plan o cobro pendiente', companyStats.withoutPlan > 0 ? 'warning' : 'success')}
          {renderDashboardMetricTile('Licencia perpetua', dashboardSummary?.summary.companiesWithPerpetualLicense ?? 0, 'Pago unico valido', (dashboardSummary?.summary.companiesWithPerpetualLicense ?? 0) > 0 ? 'success' : 'neutral')}
          {renderDashboardMetricTile('Con pendientes', companyStats.pending, 'Configuracion o atencion requerida', companyStats.pending > 0 ? 'warning' : 'success')}
          {renderDashboardMetricTile('Listos', companyStats.ready, 'Sin pendientes criticos detectados', companyStats.ready > 0 ? 'success' : 'neutral')}
          {renderDashboardMetricTile('Suspendidos/inactivos', dashboardSummary?.summary.suspendedCompanies ?? companyStats.inactive, 'Revisar soporte o cobranza', companyStats.inactive > 0 ? 'warning' : 'neutral')}
        </View>

        <View style={styles.companyFilterBar}>
          {companyFilterOptions.map((filter) => (
            <AppButton
              key={filter.key}
              title={`${filter.label} (${filter.count})`}
              variant={companyFilter === filter.key ? 'primary' : 'secondary'}
              onPress={() => setCompanyFilter(filter.key)}
              style={styles.filterButton}
            />
          ))}
        </View>

        {showCompanyForm ? (
          <View style={styles.inlineForm}>
            <AppText bold>{editingCompanyId ? 'Editar compania' : 'Crear compania cliente'}</AppText>
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
              editable={!creatingCompany && canManageCompanies && !editingCompanyId}
            />
            {editingCompanyId ? (
              <View style={styles.actionsRow}>
                {['ACTIVE', 'SUSPENDED', 'INACTIVE'].map((status) => (
                  <AppButton
                    key={status}
                    title={status}
                    variant={companyForm.status === status ? 'primary' : 'secondary'}
                    onPress={() => setCompanyForm((current) => ({ ...current, status }))}
                    style={styles.compactButton}
                  />
                ))}
              </View>
            ) : null}
            <AppButton
              title={editingCompanyId ? 'Guardar cambios' : 'Crear empresa'}
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
        {filteredCompanyCards.length === 0 ? (
          <EmptyState title="No hay clientes con este filtro" message="Cambia el filtro o crea una nueva compania para continuar." icon="business" />
        ) : null}
        {filteredCompanyCards.map((item) => {
          const { company, usage } = item;
          const pendingPreview = item.allPendingLabels.slice(0, 4);
          const hiddenPendingCount = Math.max(item.allPendingLabels.length - pendingPreview.length, 0);
          const modulePreview = item.modules.slice(0, 4);
          const branchLabel = company.branchName || 'Sin sucursal principal';
          const planLabel = usage?.planName || 'Sin plan';
          const billingLabel = normalizeBillingModelLabel(usage?.billingModel);
          const subscriptionLabel = normalizeSubscriptionStatusLabel(usage?.subscriptionStatus);
          const hostingLabel = normalizeDeploymentTypeLabel(usage?.deploymentType);
          const serviceStatusLabel = normalizeServiceStatusLabel(usage?.serviceAgreementStatus);

          return (
            <AppCard key={company.id} variant={item.selected ? 'selected' : item.health.tone === 'danger' ? 'danger' : 'default'} style={styles.companyCard}>
              <View style={[styles.companyCardHeader, isPhone ? styles.column : null]}>
                <View style={styles.companyNameBlock}>
                  <View style={styles.inlineBadges}>
                    <AppText bold numberOfLines={1} style={styles.companyNameText}>{company.name}</AppText>
                    <StatusBadge label={item.health.label} tone={item.health.tone} />
                    <StatusBadge label={item.isInternal ? 'Interna' : company.status} tone={item.isInternal ? 'neutral' : company.status === 'ACTIVE' ? 'success' : 'warning'} />
                    {item.selected ? <StatusBadge label="En administracion" tone="info" /> : null}
                  </View>
                  <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={2}>
                    {company.code} - {branchLabel}
                  </AppText>
                  {item.isInternal ? (
                    <AppText variant="caption" color={theme.colors.mutedText}>
                      Uso interno de plataforma. No se administra como cliente tenant.
                    </AppText>
                  ) : null}
                </View>

                <View style={styles.companyActions}>
                  {!item.isInternal && !item.selected ? (
                    <AppButton
                      title="Administrar"
                      variant="operation"
                      onPress={() => updateCompanyInAdministration(company.id, company.name)}
                      style={styles.compactButton}
                    />
                  ) : null}
                  {!item.isInternal && item.selected ? (
                    <AppButton
                      title="Ir a configuracion"
                      variant="secondary"
                      onPress={() => openDashboardCompanyAction(company.id, item.actionSection)}
                      style={styles.compactButton}
                    />
                  ) : null}
                  {!item.isInternal ? (
                    <>
                      <AppButton
                        title="Editar"
                        variant="secondary"
                        disabled={!canManageCompanies}
                        disabledReason="Tu usuario necesita MANAGE_COMPANIES."
                        onPress={() => openCompanyEditor(company)}
                        style={styles.compactButton}
                      />
                      <AppButton
                        title="Configurar"
                        variant="secondary"
                        onPress={() => openDashboardCompanyAction(company.id, item.actionSection)}
                        style={styles.compactButton}
                      />
                      <AppButton
                        title="Ver plan"
                        variant="ghost"
                        onPress={() => openDashboardCompanyAction(company.id, 'subscriptions')}
                        style={styles.compactButton}
                      />
                    </>
                  ) : null}
                </View>
              </View>

              <View style={styles.companyInfoGrid}>
                <View style={[styles.companyInfoCell, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.borderSubtle }]}>
                  <AppText variant="caption" color={theme.colors.mutedText}>Plan / modelo</AppText>
                  <AppText bold numberOfLines={1}>{planLabel}</AppText>
                  <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
                    {billingLabel} - {subscriptionLabel}
                  </AppText>
                  {item.hasPerpetualLicense ? (
                    <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
                      Pago unico - {usage?.unlimitedCommercialUse ? 'Sin restricciones' : 'Con limites'}
                    </AppText>
                  ) : null}
                </View>
                <View style={[styles.companyInfoCell, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.borderSubtle }]}>
                  <AppText variant="caption" color={theme.colors.mutedText}>Usuarios</AppText>
                  <AppText bold>{formatCountLimit(usage?.activeUsers, usage?.maxUsers)}</AppText>
                  <AppText variant="caption" color={theme.colors.mutedText}>
                    Admin inicial: {company.adminUsers > 0 ? 'configurado' : 'pendiente'}
                  </AppText>
                </View>
                <View style={[styles.companyInfoCell, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.borderSubtle }]}>
                  <AppText variant="caption" color={theme.colors.mutedText}>Sucursales</AppText>
                  <AppText bold>{formatCountLimit(usage?.activeBranches, usage?.maxBranches)}</AppText>
                  <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
                    {branchLabel}
                  </AppText>
                </View>
                <View style={[styles.companyInfoCell, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.borderSubtle }]}>
                  <AppText variant="caption" color={theme.colors.mutedText}>Hosting / servicio</AppText>
                  <AppText bold numberOfLines={1}>{hostingLabel}</AppText>
                  <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
                    {serviceStatusLabel}{usage?.serviceAgreementEndDate ? ` - vence ${usage.serviceAgreementEndDate}` : ''}
                  </AppText>
                </View>
              </View>

              <View style={styles.inlineBadges}>
                {modulePreview.length > 0 ? (
                  modulePreview.map((module) => <StatusBadge key={module} label={module} tone="neutral" />)
                ) : (
                  <StatusBadge label="Sin modulos activos" tone="warning" />
                )}
              </View>

              <View style={[styles.companyPendingRow, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border }]}>
                <View style={styles.flex}>
                  <AppText variant="caption" color={theme.colors.mutedText} bold>
                    Pendientes
                  </AppText>
                  {pendingPreview.length > 0 ? (
                    <View style={styles.inlineBadges}>
                      {pendingPreview.map((pending) => (
                        <StatusBadge key={pending} label={pending} tone={pending.includes('Sin') ? 'warning' : 'info'} />
                      ))}
                      {hiddenPendingCount > 0 ? <StatusBadge label={`+${hiddenPendingCount} mas`} tone="neutral" /> : null}
                    </View>
                  ) : (
                    <AppText variant="caption" color={theme.colors.mutedText}>
                      Sin pendientes criticos detectados con los datos actuales.
                    </AppText>
                  )}
                </View>
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
            title={showBranchForm ? (editingBranchId ? 'Cancelar edicion' : 'Ocultar formulario') : 'Nueva sucursal'}
            variant="operation"
            disabled={!canManageCompanies || !canUseSelectedCompany}
            disabledReason="Selecciona un cliente y confirma permiso MANAGE_COMPANIES."
            onPress={() => {
              if (showBranchForm) {
                resetBranchEditor();
                return;
              }
              setEditingBranchId(null);
              setBranchForm(EMPTY_BRANCH_FORM);
              setShowBranchForm(true);
            }}
          />
        </View>

        {showBranchForm ? (
          <View style={styles.inlineForm}>
            <AppText bold>{editingBranchId ? 'Editar sucursal' : 'Nueva sucursal'}</AppText>
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
            {editingBranchId ? (
              <View style={styles.actionsRow}>
                {['ACTIVE', 'INACTIVE'].map((status) => (
                  <AppButton
                    key={status}
                    title={status}
                    variant={branchForm.status === status ? 'primary' : 'secondary'}
                    onPress={() => setBranchForm((current) => ({ ...current, status }))}
                    style={styles.compactButton}
                  />
                ))}
              </View>
            ) : null}
            <AppButton
              title={editingBranchId ? 'Guardar cambios' : 'Crear sucursal'}
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
              onPress={() => {
                setEditingUserId(null);
                resetUserEditor();
                setShowAdminForm((current) => !current);
              }}
            />
            <AppButton
              title={showUserForm ? (editingUserId ? 'Cancelar edicion' : 'Ocultar usuario') : 'Nuevo usuario'}
              variant="operation"
              disabled={!canManageAdmins || !canUseSelectedCompany}
              disabledReason="Selecciona cliente y permiso MANAGE_TENANT_ADMINS."
              onPress={() => {
                if (showUserForm) {
                  resetUserEditor();
                  return;
                }
                setEditingUserId(null);
                setUserForm((current) => ({
                  ...EMPTY_USER_FORM,
                  role: current.role,
                  branchId: current.branchId,
                }));
                setShowAdminForm(false);
                setShowUserForm(true);
              }}
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
          <View style={styles.sectionHeader}>
            <StatusBadge label="SAAS" tone="info" />
            <View style={styles.flex}>
              <AppText variant="subtitle" bold>
                Planes / Licencias
              </AppText>
              <AppText variant="caption" color={theme.colors.mutedText}>
                Administra planes, licencias perpetuas y servicios comerciales del cliente. No implementa cobro real ni pasarela.
              </AppText>
            </View>
          </View>
          <AppButton
            title={showPlanForm ? 'Ocultar formulario' : 'Crear plan'}
            variant="operation"
            disabled={!canManagePlans}
            disabledReason="Tu usuario necesita MANAGE_SUBSCRIPTION_PLANS."
            onPress={() => setShowPlanForm((current) => !current)}
            style={styles.actionButton}
          />
        </View>

        <View style={styles.dashboardMetricGrid}>
          {renderDashboardMetricTile('Planes activos', subscriptionStats.activePlans, 'Catalogo global', subscriptionStats.activePlans > 0 ? 'success' : 'neutral')}
          {renderDashboardMetricTile('Planes sin precios completos', subscriptionStats.plansWithoutCompletePrices, 'Mensual, trimestral, semestral y anual', subscriptionStats.plansWithoutCompletePrices > 0 ? 'warning' : 'success')}
          {renderDashboardMetricTile('Clientes sin plan', subscriptionStats.companiesWithoutPlan, 'Requieren configuracion comercial', subscriptionStats.companiesWithoutPlan > 0 ? 'warning' : 'success')}
          {renderDashboardMetricTile('Licencias perpetuas', subscriptionStats.companiesWithPerpetualLicense, 'Pago unico, sin MRR', subscriptionStats.companiesWithPerpetualLicense > 0 ? 'success' : 'neutral')}
          {renderDashboardMetricTile('Cobros unicos', money(dashboardSummary?.summary.oneTimeLicenseAmount ?? 0), 'Licencias registradas', (dashboardSummary?.summary.oneTimeLicenseAmount ?? 0) > 0 ? 'success' : 'neutral')}
          {renderDashboardMetricTile('AppModa hospedados', subscriptionStats.appModaHostedCompanies, 'Requieren servicio anual', subscriptionStats.appModaHostedCompanies > 0 ? 'info' : 'neutral')}
          {renderDashboardMetricTile('Cliente hospedado', subscriptionStats.clientHostedCompanies, 'Hosting no aplica', subscriptionStats.clientHostedCompanies > 0 ? 'success' : 'neutral')}
          {renderDashboardMetricTile('Servicios vencen/vencidos', `${subscriptionStats.annualServicesExpiringSoon}/${subscriptionStats.annualServicesPastDue}`, 'Proximos 30 dias / vencidos', subscriptionStats.annualServicesPastDue > 0 ? 'danger' : subscriptionStats.annualServicesExpiringSoon > 0 ? 'warning' : 'success')}
          {renderDashboardMetricTile('Cliente actual', subscriptionStats.currentCustomerStatus, 'Cliente en administracion', canUseSelectedCompany && subscriptionStats.currentCustomerStatus !== 'Sin plan' ? 'success' : 'warning')}
        </View>

        {showPlanForm ? renderPlanForm() : null}
      </AppCard>

      <View style={[styles.subscriptionLayout, isPhone ? styles.column : null]}>
        <View style={styles.subscriptionColumn}>
          {renderPlanCatalog()}
        </View>
        <View style={styles.subscriptionColumn}>
          {renderPlanPrices()}
          {renderCommercialAgreement()}
          {renderCompanySubscription()}
        </View>
      </View>
    </View>
  );

  const renderPlanForm = () => (
    <View style={styles.inlineForm}>
      <View style={styles.sectionHeader}>
        <StatusBadge label="NUEVO PLAN" tone="info" />
        <View style={styles.flex}>
          <AppText bold>Crear plan global</AppText>
          <AppText variant="caption" color={theme.colors.mutedText}>
            El plan queda disponible para todos los clientes. Los precios se configuran despues de crearlo.
          </AppText>
        </View>
      </View>
      <View style={[styles.grid, isPhone ? styles.column : null]}>
        <AppInput label="Codigo" placeholder="PRO" value={planForm.code} onChangeText={(value) => setPlanForm((current) => ({ ...current, code: value }))} editable={!creatingPlan && canManagePlans} />
        <AppInput label="Nombre" placeholder="Plan Pro" value={planForm.name} onChangeText={(value) => setPlanForm((current) => ({ ...current, name: value }))} editable={!creatingPlan && canManagePlans} />
      </View>
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
        {planCards.length === 0 ? (
          <EmptyState title="Sin planes" message="Crea un plan para iniciar la configuracion SaaS." icon="payments" />
        ) : (
          planCards.map(({ plan, completePrices, clientsUsing, modules, selected }) => (
            <View
              key={plan.id}
              style={[
                styles.planRow,
                {
                  backgroundColor: selected ? theme.colors.infoSoft : theme.colors.surfaceAlt,
                  borderColor: selected ? theme.colors.accent : theme.colors.border,
                },
              ]}
            >
              <View style={styles.flex}>
                <View style={styles.inlineBadges}>
                  <AppText bold numberOfLines={1}>{plan.name}</AppText>
                  <StatusBadge label={plan.status} tone={plan.status === 'ACTIVE' ? 'success' : 'neutral'} />
                  <StatusBadge label={completePrices ? 'Precios completos' : 'Faltan precios'} tone={completePrices ? 'success' : 'warning'} />
                  {selected ? <StatusBadge label="Editando precios" tone="info" /> : null}
                </View>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  Codigo {plan.code} - Usuarios {plan.includedMaxUsers ?? 'sin limite'} - Sucursales {plan.includedMaxBranches ?? 'sin limite'}
                </AppText>
                <View style={styles.inlineBadges}>
                  {modules.length > 0 ? (
                    modules.map((module) => <StatusBadge key={module} label={module} tone="neutral" />)
                  ) : (
                    <StatusBadge label="Sin modulos incluidos" tone="warning" />
                  )}
                  <StatusBadge label={`${clientsUsing} cliente${clientsUsing === 1 ? '' : 's'} usando`} tone={clientsUsing > 0 ? 'info' : 'neutral'} />
                </View>
              </View>
              <View style={styles.companyActions}>
                <AppButton
                  title={selected ? 'Editando precios' : 'Editar precios'}
                  variant={selected ? 'neutral' : 'secondary'}
                  onPress={() => setSelectedPlanId(plan.id)}
                  style={styles.compactButton}
                />
                <AppButton
                  title="Usar en cliente"
                  variant="ghost"
                  disabled={!canUseSelectedCompany}
                  disabledReason="Selecciona un cliente en administracion."
                  onPress={() => setSubscriptionForm((current) => ({ ...current, planId: plan.id }))}
                  style={styles.compactButton}
                />
              </View>
            </View>
          ))
        )}
      </View>
    </AppCard>
  );

  const renderPlanPrices = () => (
    <AppCard style={styles.panel}>
      <View style={[styles.rowBetween, isPhone ? styles.column : null]}>
        <View style={styles.sectionHeader}>
          <StatusBadge label="PRECIOS GLOBALES" tone="info" />
          <View style={styles.flex}>
            <AppText variant="subtitle" bold>
              {selectedPlan ? `Precios de ${selectedPlan.name}` : 'Precios por periodo'}
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {selectedPlan
                ? 'Estos precios pertenecen al catalogo global del plan, no a un cliente especifico.'
                : 'Selecciona un plan del catalogo global para configurar sus precios.'}
            </AppText>
          </View>
        </View>
        <StatusBadge label={selectedPlanPricesComplete ? 'Completo' : 'Incompleto'} tone={selectedPlanPricesComplete ? 'success' : 'warning'} />
      </View>

      {!selectedPlan ? (
        <EmptyState title="Selecciona un plan" message="Elige un plan en el catalogo global para editar sus precios por periodo." icon="payments" />
      ) : (
        <>
          <View style={styles.priceGrid}>
            {BILLING_PERIODS.map((period) => {
              const savedPrice = selectedPlanPrices.find((price) => price.billingPeriod === period.code);
              return (
                <View
                  key={period.code}
                  style={[styles.pricePeriodCard, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.borderSubtle }]}
                >
                  <View style={styles.inlineBadges}>
                    <StatusBadge label={period.label} tone="neutral" />
                    <StatusBadge label={savedPrice ? 'Guardado' : 'Pendiente'} tone={savedPrice ? 'success' : 'warning'} />
                  </View>
                  <AppText variant="subtitle" bold numberOfLines={1}>
                    {savedPrice ? `${money(savedPrice.priceAmount)} ${savedPrice.currency || 'MXN'}` : 'Sin precio'}
                  </AppText>
                  <AppInput
                    label={`Editar ${period.label.toLowerCase()}`}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    value={priceForm[period.code] ?? ''}
                    onChangeText={(value) => setPriceForm((current) => ({ ...current, [period.code]: value }))}
                    editable={!savingPrices && canManagePlans && Boolean(selectedPlanId)}
                  />
                </View>
              );
            })}
          </View>
          <AppButton title="Guardar precios" loading={savingPrices} disabled={savingPrices || !canManagePlans || !selectedPlanId} disabledReason="Selecciona plan y permiso MANAGE_SUBSCRIPTION_PLANS." onPress={handleSavePlanPrices} style={styles.actionButton} />
        </>
      )}
    </AppCard>
  );

  const renderCompanySubscription = () => {
    if (!canUseSelectedCompany) {
      return (
        <AppCard style={styles.panel}>
          <View style={styles.sectionHeader}>
            <StatusBadge label="CLIENTE" tone="warning" />
            <View style={styles.flex}>
              <AppText variant="subtitle" bold>
                Suscripcion del cliente en administracion
              </AppText>
              <AppText variant="caption" color={theme.colors.mutedText}>
                Selecciona un cliente para asignar o revisar su suscripcion. El catalogo global de planes sigue visible.
              </AppText>
            </View>
          </View>
          <AppButton
            title="Ir a Clientes / Companias"
            variant="secondary"
            onPress={() => router.push(buildPlatformRoute('companies', selectedCompanyId))}
            style={styles.actionButton}
          />
        </AppCard>
      );
    }

    const savedBillingLabel = normalizeBillingModelLabel(companySubscription?.billingModel);
    const savedStatusLabel = normalizeSubscriptionStatusLabel(companySubscription?.status);
    const selectedSubscriptionPlan = subscriptionPlans.find((plan) => plan.id === subscriptionForm.planId);
    const isUsageOnly = subscriptionForm.billingModel === 'USAGE_BASED';
    const hasSavedSubscription =
      Boolean(companySubscription?.planName) ||
      Boolean(companySubscription?.billingModel && companySubscription.billingModel !== 'SIN_CONFIGURAR');

    return (
      <AppCard style={styles.panel}>
        <View style={[styles.rowBetween, isPhone ? styles.column : null]}>
          <View style={styles.sectionHeader}>
            <StatusBadge label="CLIENTE" tone="role" />
            <View style={styles.flex}>
              <AppText variant="subtitle" bold>
                Suscripcion del cliente en administracion
              </AppText>
              <AppText variant="caption" color={theme.colors.mutedText}>
                Esta configuracion si depende del cliente en administracion: {selectedCompany?.name}
              </AppText>
              {renderCompanyScopeLine()}
            </View>
          </View>
          <StatusBadge
            label={hasSavedSubscription ? savedStatusLabel : 'Sin suscripcion'}
            tone={companySubscription?.status === 'ACTIVE' || companySubscription?.status === 'TRIAL' ? 'success' : 'warning'}
          />
        </View>

        <View style={styles.companyInfoGrid}>
          <View style={[styles.companyInfoCell, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.borderSubtle }]}>
            <AppText variant="caption" color={theme.colors.mutedText}>Plan actual</AppText>
            <AppText bold numberOfLines={1}>{companySubscription?.planName || 'Sin plan'}</AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>{savedBillingLabel}</AppText>
          </View>
          <View style={[styles.companyInfoCell, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.borderSubtle }]}>
            <AppText variant="caption" color={theme.colors.mutedText}>Periodicidad</AppText>
            <AppText bold>{getBillingPeriodLabel(companySubscription?.billingPeriod)}</AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>Estado {savedStatusLabel}</AppText>
          </View>
          <View style={[styles.companyInfoCell, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.borderSubtle }]}>
            <AppText variant="caption" color={theme.colors.mutedText}>Proxima fecha</AppText>
            <AppText bold numberOfLines={1}>{companySubscription?.nextBillingAt || companySubscription?.endsAt || 'Sin fecha'}</AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>No genera cobro automatico</AppText>
          </View>
        </View>

        <View style={styles.formBlock}>
          <AppText variant="caption" color={theme.colors.mutedText} bold>
            Modelo de cobro
          </AppText>
          <View style={styles.actionsRow}>
            {BILLING_MODELS.map((model) => (
              <AppButton key={model.code} title={model.label} variant={subscriptionForm.billingModel === model.code ? 'primary' : 'secondary'} onPress={() => setSubscriptionForm((current) => ({ ...current, billingModel: model.code, planId: model.code === 'USAGE_BASED' ? null : current.planId }))} style={styles.compactButton} />
            ))}
          </View>
        </View>

        <View style={styles.formBlock}>
          <AppText variant="caption" color={theme.colors.mutedText} bold>
            Plan para el cliente
          </AppText>
          <View style={styles.actionsRow}>
            <AppButton
              title="Sin plan / solo consumo"
              variant={subscriptionForm.planId === null ? 'primary' : 'secondary'}
              onPress={() => setSubscriptionForm((current) => ({ ...current, planId: null, billingModel: 'USAGE_BASED' }))}
              style={styles.compactButton}
            />
            {subscriptionPlans.map((plan) => (
              <AppButton key={plan.id} title={plan.name} variant={subscriptionForm.planId === plan.id ? 'primary' : 'secondary'} onPress={() => setSubscriptionForm((current) => ({ ...current, planId: plan.id, billingModel: current.billingModel === 'USAGE_BASED' ? 'SUBSCRIPTION' : current.billingModel }))} style={styles.compactButton} />
            ))}
          </View>
          <AppText variant="caption" color={theme.colors.mutedText}>
            {isUsageOnly
              ? 'El modelo por consumo puede operar sin plan asignado.'
              : selectedSubscriptionPlan
                ? `Se asignara ${selectedSubscriptionPlan.name}.`
                : 'Selecciona un plan para suscripcion o modelo hibrido.'}
          </AppText>
        </View>

        <View style={styles.formBlock}>
          <AppText variant="caption" color={theme.colors.mutedText} bold>
            Periodicidad
          </AppText>
          <View style={styles.actionsRow}>
            {BILLING_PERIODS.map((period) => (
              <AppButton key={period.code} title={period.label} variant={subscriptionForm.billingPeriod === period.code ? 'primary' : 'secondary'} onPress={() => setSubscriptionForm((current) => ({ ...current, billingPeriod: period.code }))} style={styles.compactButton} />
            ))}
          </View>
        </View>

        <View style={styles.formBlock}>
          <AppText variant="caption" color={theme.colors.mutedText} bold>
            Estado de suscripcion
          </AppText>
          <View style={styles.actionsRow}>
            {SUBSCRIPTION_STATUSES.map((status) => (
              <AppButton key={status.code} title={status.label} variant={subscriptionForm.status === status.code ? 'primary' : 'secondary'} onPress={() => setSubscriptionForm((current) => ({ ...current, status: status.code }))} style={styles.compactButton} />
            ))}
          </View>
        </View>

        <View style={[styles.grid, isPhone ? styles.column : null]}>
          <AppInput label="Inicio" placeholder="YYYY-MM-DD" value={subscriptionForm.startedAt} onChangeText={(value) => setSubscriptionForm((current) => ({ ...current, startedAt: value }))} editable={!savingSubscription && canManageSubscriptions} />
          <AppInput label="Vence" placeholder="YYYY-MM-DD" value={subscriptionForm.endsAt} onChangeText={(value) => setSubscriptionForm((current) => ({ ...current, endsAt: value }))} editable={!savingSubscription && canManageSubscriptions} />
          <AppInput label="Proximo corte" placeholder="YYYY-MM-DD" value={subscriptionForm.nextBillingAt} onChangeText={(value) => setSubscriptionForm((current) => ({ ...current, nextBillingAt: value }))} editable={!savingSubscription && canManageSubscriptions} />
        </View>

        <View style={styles.actionsRow}>
          <AppButton title={companySubscription?.id ? 'Guardar suscripcion' : 'Asignar plan al cliente'} loading={savingSubscription} disabled={savingSubscription || !canManageSubscriptions || !canUseSelectedCompany} disabledReason="Selecciona cliente y permiso MANAGE_COMPANY_SUBSCRIPTIONS." onPress={handleSaveSubscription} style={styles.actionButton} />
          <AppButton title="Ver tarifas por consumo" variant="secondary" onPress={() => router.push(buildPlatformRoute('usageRates', selectedCompanyId))} style={styles.actionButton} />
        </View>
        <AppText variant="caption" color={theme.colors.mutedText}>
          Esto solo configura el modelo SaaS administrativo. No genera cargos, facturas ni pasarela de pago.
        </AppText>
      </AppCard>
    );
  };

  const renderCommercialAgreement = () => {
    if (!canUseSelectedCompany) return null;

    const license = commercialAgreement?.license;
    const service = commercialAgreement?.serviceAgreement;
    const savedLicenseActive =
      (license?.licenseType || '').toUpperCase() === 'PERPETUAL' &&
      (license?.status || '').toUpperCase() === 'ACTIVE';
    const clientHosted = commercialForm.deploymentType === 'CLIENT_HOSTED';
    const canManageCommercial = canManageLicenses && canManageServiceAgreements;

    return (
      <AppCard style={styles.panel}>
        <View style={[styles.rowBetween, isPhone ? styles.column : null]}>
          <View style={styles.sectionHeader}>
            <StatusBadge label="LICENCIA" tone={savedLicenseActive ? 'success' : 'warning'} />
            <View style={styles.flex}>
              <AppText variant="subtitle" bold>
                Licencia del cliente
              </AppText>
              <AppText variant="caption" color={theme.colors.mutedText}>
                Registra el pago unico de derecho de uso y separa el servicio anual de infraestructura. No se mezcla con pagos operativos.
              </AppText>
              {renderCompanyScopeLine()}
            </View>
          </View>
          <StatusBadge
            label={savedLicenseActive ? 'Perpetua activa' : 'Sin licencia perpetua'}
            tone={savedLicenseActive ? 'success' : 'warning'}
          />
        </View>

        <View style={styles.companyInfoGrid}>
          <View style={[styles.companyInfoCell, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.borderSubtle }]}>
            <AppText variant="caption" color={theme.colors.mutedText}>Licencia</AppText>
            <AppText bold>{savedLicenseActive ? 'Perpetua' : 'Sin licencia activa'}</AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {normalizeLicenseStatusLabel(license?.status)}
            </AppText>
          </View>
          <View style={[styles.companyInfoCell, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.borderSubtle }]}>
            <AppText variant="caption" color={theme.colors.mutedText}>Cobro unico</AppText>
            <AppText bold>{license?.purchaseAmount == null ? 'Sin monto' : `${money(license.purchaseAmount)} ${license.currency || 'MXN'}`}</AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {license?.paymentDate || 'Sin fecha'} - {normalizePaymentMethodLabel(license?.paymentMethod)}
            </AppText>
          </View>
          <View style={[styles.companyInfoCell, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.borderSubtle }]}>
            <AppText variant="caption" color={theme.colors.mutedText}>Restricciones</AppText>
            <AppText bold>{license?.unlimitedCommercialUse ? 'Sin restricciones' : 'Con limites comerciales'}</AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {license?.noExpiration ? 'Sin vencimiento' : `Vence ${license?.validUntil || 'sin fecha'}`}
            </AppText>
          </View>
          <View style={[styles.companyInfoCell, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.borderSubtle }]}>
            <AppText variant="caption" color={theme.colors.mutedText}>Infraestructura</AppText>
            <AppText bold>{normalizeDeploymentTypeLabel(service?.deploymentType)}</AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              Servicio anual: {normalizeServiceStatusLabel(service?.status)}
            </AppText>
          </View>
        </View>

        <View style={styles.formBlock}>
          <AppText variant="caption" color={theme.colors.mutedText} bold>
            Licencia perpetua
          </AppText>
          <View style={styles.actionsRow}>
            {LICENSE_STATUSES.map((status) => (
              <AppButton
                key={status.code}
                title={status.label}
                variant={commercialForm.licenseStatus === status.code ? 'primary' : 'secondary'}
                onPress={() => setCommercialForm((current) => ({ ...current, licenseStatus: status.code }))}
                style={styles.compactButton}
              />
            ))}
          </View>
          <View style={[styles.grid, isPhone ? styles.column : null]}>
            <AppInput
              label="Monto cobrado"
              placeholder="25000.00"
              keyboardType="decimal-pad"
              value={commercialForm.purchaseAmount}
              onChangeText={(value) => setCommercialForm((current) => ({ ...current, purchaseAmount: value }))}
              editable={!savingCommercialAgreement && canManageCommercial}
            />
            <AppInput
              label="Moneda"
              placeholder="MXN"
              value={commercialForm.licenseCurrency}
              onChangeText={(value) => setCommercialForm((current) => ({ ...current, licenseCurrency: value.toUpperCase() }))}
              editable={!savingCommercialAgreement && canManageCommercial}
            />
            <AppInput
              label="Fecha de pago"
              placeholder="YYYY-MM-DD"
              value={commercialForm.paymentDate}
              onChangeText={(value) => setCommercialForm((current) => ({ ...current, paymentDate: value }))}
              editable={!savingCommercialAgreement && canManageCommercial}
            />
          </View>
          <View style={styles.actionsRow}>
            {COMMERCIAL_PAYMENT_METHODS.map((method) => (
              <AppButton
                key={method.code}
                title={method.label}
                variant={commercialForm.paymentMethod === method.code ? 'primary' : 'secondary'}
                onPress={() => setCommercialForm((current) => ({ ...current, paymentMethod: method.code }))}
                style={styles.compactButton}
              />
            ))}
          </View>
          <View style={[styles.grid, isPhone ? styles.column : null]}>
            <AppInput
              label="Referencia"
              placeholder="QA-PERP-001"
              value={commercialForm.paymentReference}
              onChangeText={(value) => setCommercialForm((current) => ({ ...current, paymentReference: value }))}
              editable={!savingCommercialAgreement && canManageCommercial}
            />
            <AppInput
              label="Vigencia desde"
              placeholder="YYYY-MM-DD"
              value={commercialForm.validFrom}
              onChangeText={(value) => setCommercialForm((current) => ({ ...current, validFrom: value }))}
              editable={!savingCommercialAgreement && canManageCommercial}
            />
            <AppInput
              label="Vigencia hasta"
              placeholder="Sin fecha si no vence"
              value={commercialForm.validUntil}
              onChangeText={(value) => setCommercialForm((current) => ({ ...current, validUntil: value }))}
              editable={!savingCommercialAgreement && canManageCommercial && !commercialForm.noExpiration}
            />
          </View>
          <View style={styles.actionsRow}>
            <AppButton
              title={commercialForm.noExpiration ? 'Sin vencimiento' : 'Con vencimiento'}
              variant={commercialForm.noExpiration ? 'primary' : 'secondary'}
              onPress={() => setCommercialForm((current) => ({ ...current, noExpiration: !current.noExpiration }))}
              style={styles.compactButton}
            />
            <AppButton
              title={commercialForm.unlimitedCommercialUse ? 'Sin restricciones comerciales' : 'Con limites comerciales'}
              variant={commercialForm.unlimitedCommercialUse ? 'primary' : 'secondary'}
              onPress={() => setCommercialForm((current) => ({ ...current, unlimitedCommercialUse: !current.unlimitedCommercialUse }))}
              style={styles.compactButton}
            />
          </View>
          <AppInput
            label="Notas de licencia"
            placeholder="Licencia perpetua sin restricciones comerciales."
            value={commercialForm.licenseNotes}
            onChangeText={(value) => setCommercialForm((current) => ({ ...current, licenseNotes: value }))}
            editable={!savingCommercialAgreement && canManageCommercial}
          />
        </View>

        <View style={styles.formBlock}>
          <AppText variant="caption" color={theme.colors.mutedText} bold>
            Infraestructura / servicio anual
          </AppText>
          <View style={styles.actionsRow}>
            {DEPLOYMENT_TYPES.map((deployment) => (
              <AppButton
                key={deployment.code}
                title={deployment.label}
                variant={commercialForm.deploymentType === deployment.code ? 'primary' : 'secondary'}
                onPress={() => setCommercialForm((current) => ({
                  ...current,
                  deploymentType: deployment.code,
                  serviceStatus: deployment.code === 'CLIENT_HOSTED' ? 'NOT_APPLICABLE' : current.serviceStatus === 'NOT_APPLICABLE' ? 'ACTIVE' : current.serviceStatus,
                }))}
                style={styles.compactButton}
              />
            ))}
          </View>
          <AppText variant="caption" color={theme.colors.mutedText}>
            {clientHosted
              ? 'El servidor y la base son responsabilidad del cliente; el servicio anual de hosting queda como No aplica.'
              : 'AppModa participa en hosting, base, respaldos o monitoreo; registra el servicio anual correspondiente.'}
          </AppText>

          {!clientHosted ? (
            <>
              <View style={styles.actionsRow}>
                {SERVICE_STATUSES.filter((status) => status.code !== 'NOT_APPLICABLE').map((status) => (
                  <AppButton
                    key={status.code}
                    title={status.label}
                    variant={commercialForm.serviceStatus === status.code ? 'primary' : 'secondary'}
                    onPress={() => setCommercialForm((current) => ({ ...current, serviceStatus: status.code }))}
                    style={styles.compactButton}
                  />
                ))}
              </View>
              <View style={[styles.grid, isPhone ? styles.column : null]}>
                <AppInput
                  label="Monto anual"
                  placeholder="6000.00"
                  keyboardType="decimal-pad"
                  value={commercialForm.annualAmount}
                  onChangeText={(value) => setCommercialForm((current) => ({ ...current, annualAmount: value }))}
                  editable={!savingCommercialAgreement && canManageCommercial}
                />
                <AppInput
                  label="Moneda"
                  placeholder="MXN"
                  value={commercialForm.serviceCurrency}
                  onChangeText={(value) => setCommercialForm((current) => ({ ...current, serviceCurrency: value.toUpperCase() }))}
                  editable={!savingCommercialAgreement && canManageCommercial}
                />
                <AppInput
                  label="Inicio"
                  placeholder="YYYY-MM-DD"
                  value={commercialForm.serviceStartDate}
                  onChangeText={(value) => setCommercialForm((current) => ({ ...current, serviceStartDate: value }))}
                  editable={!savingCommercialAgreement && canManageCommercial}
                />
                <AppInput
                  label="Vencimiento"
                  placeholder="YYYY-MM-DD"
                  value={commercialForm.serviceEndDate}
                  onChangeText={(value) => setCommercialForm((current) => ({ ...current, serviceEndDate: value }))}
                  editable={!savingCommercialAgreement && canManageCommercial}
                />
              </View>
              <View style={styles.actionsRow}>
                <AppButton
                  title={commercialForm.autoRenew ? 'Renovacion automatica' : 'Sin renovacion automatica'}
                  variant={commercialForm.autoRenew ? 'primary' : 'secondary'}
                  onPress={() => setCommercialForm((current) => ({ ...current, autoRenew: !current.autoRenew }))}
                  style={styles.compactButton}
                />
                {COMMERCIAL_PAYMENT_METHODS.map((method) => (
                  <AppButton
                    key={method.code}
                    title={method.label}
                    variant={commercialForm.servicePaymentMethod === method.code ? 'primary' : 'secondary'}
                    onPress={() => setCommercialForm((current) => ({ ...current, servicePaymentMethod: method.code }))}
                    style={styles.compactButton}
                  />
                ))}
              </View>
              <AppInput
                label="Referencia de servicio"
                placeholder="HOST-2026-001"
                value={commercialForm.servicePaymentReference}
                onChangeText={(value) => setCommercialForm((current) => ({ ...current, servicePaymentReference: value }))}
                editable={!savingCommercialAgreement && canManageCommercial}
              />
            </>
          ) : null}

          <AppInput
            label="Notas de infraestructura"
            placeholder={clientHosted ? 'Servidor y base de datos son responsabilidad del cliente.' : 'Servicio anual de servidor, base de datos, respaldos y monitoreo.'}
            value={commercialForm.serviceNotes}
            onChangeText={(value) => setCommercialForm((current) => ({ ...current, serviceNotes: value }))}
            editable={!savingCommercialAgreement && canManageCommercial}
          />
        </View>

        <View style={styles.actionsRow}>
          <AppButton
            title="Guardar licencia y hosting"
            loading={savingCommercialAgreement}
            disabled={savingCommercialAgreement || !canManageCommercial || !canUseSelectedCompany}
            disabledReason="Necesitas MANAGE_PLATFORM_LICENSES y MANAGE_PLATFORM_SERVICE_AGREEMENTS."
            onPress={handleSaveCommercialAgreement}
            style={styles.actionButton}
          />
        </View>
        <AppText variant="caption" color={theme.colors.mutedText}>
          Estos datos son comerciales de AppModa hacia la empresa cliente. No registran pagos de clientas finales, paquetes, apartados ni saldo a favor.
        </AppText>
      </AppCard>
    );
  };

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

  const renderAuditEventRow = (event: PlatformAuditEvent) => {
    const selected = selectedAuditEvent?.id === event.id;
    return (
      <View
        key={event.id}
        style={[
          styles.auditEventRow,
          {
            backgroundColor: selected ? theme.colors.infoCardBackground : theme.colors.surfaceAlt,
            borderColor: selected ? theme.colors.accent : theme.colors.borderSubtle,
          },
        ]}
      >
        <View style={styles.flex}>
          <View style={styles.inlineBadges}>
            <StatusBadge label={normalizeAuditCategoryLabel(event.category)} tone="info" />
            <AppText variant="caption" color={theme.colors.mutedText}>
              {formatAuditTimestamp(event.occurredAt)}
            </AppText>
          </View>
          <AppText bold>{event.title}</AppText>
          <AppText variant="caption" color={theme.colors.mutedText}>
            {event.description}
          </AppText>
          <AppText variant="caption" color={theme.colors.mutedText}>
            Actor: {event.actorName || 'Usuario no disponible'}
            {event.actorEmail ? ` - ${event.actorEmail}` : ''}
          </AppText>
          <AppText variant="caption" color={theme.colors.mutedText}>
            {event.companyName ? `Cliente: ${event.companyName}` : 'Evento global de plataforma'}
          </AppText>
        </View>
        <AppButton
          title={selected ? 'Visible' : 'Ver detalle'}
          variant={selected ? 'neutral' : 'secondary'}
          onPress={() => setSelectedAuditEventId(event.id)}
          style={styles.compactButton}
        />
      </View>
    );
  };

  const renderAuditDetail = () => (
    <AppCard style={[styles.panel, styles.dashboardColumn]}>
      <View style={styles.sectionHeader}>
        <StatusBadge label="DETALLE" tone="role" />
        <View style={styles.flex}>
          <AppText variant="subtitle" bold>
            Detalle del evento
          </AppText>
          <AppText variant="caption" color={theme.colors.mutedText}>
            Datos disponibles en la bitacora global. No muestra payload sensible.
          </AppText>
        </View>
      </View>

      {selectedAuditEvent ? (
        <View style={styles.auditDetailGrid}>
          <View style={[styles.companyInfoCell, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.borderSubtle }]}>
            <AppText variant="caption" color={theme.colors.mutedText}>Evento</AppText>
            <AppText bold>{selectedAuditEvent.title}</AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>{selectedAuditEvent.eventType}</AppText>
          </View>
          <View style={[styles.companyInfoCell, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.borderSubtle }]}>
            <AppText variant="caption" color={theme.colors.mutedText}>Fecha</AppText>
            <AppText bold>{formatAuditTimestamp(selectedAuditEvent.occurredAt)}</AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>{normalizeAuditCategoryLabel(selectedAuditEvent.category)}</AppText>
          </View>
          <View style={[styles.companyInfoCell, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.borderSubtle }]}>
            <AppText variant="caption" color={theme.colors.mutedText}>Actor</AppText>
            <AppText bold numberOfLines={1}>{selectedAuditEvent.actorName || 'Usuario no disponible'}</AppText>
            <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>{selectedAuditEvent.actorEmail || 'Sin correo en bitacora'}</AppText>
          </View>
          <View style={[styles.companyInfoCell, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.borderSubtle }]}>
            <AppText variant="caption" color={theme.colors.mutedText}>Entidad</AppText>
            <AppText bold>{selectedAuditEvent.companyName || selectedAuditEvent.entityType || 'Plataforma'}</AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>{selectedAuditEvent.entityId ? `ID ${selectedAuditEvent.entityId}` : 'Sin ID asociado'}</AppText>
          </View>
          <View style={[styles.auditTechnicalBlock, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.borderSubtle }]}>
            <AppText variant="caption" color={theme.colors.mutedText}>Resumen</AppText>
            <AppText>{selectedAuditEvent.description}</AppText>
            {selectedAuditEvent.beforeSummary || selectedAuditEvent.afterSummary ? (
              <AppText variant="caption" color={theme.colors.mutedText}>
                Antes: {selectedAuditEvent.beforeSummary || '-'} - Despues: {selectedAuditEvent.afterSummary || '-'}
              </AppText>
            ) : (
              <AppText variant="caption" color={theme.colors.mutedText}>
                Before/after detallado pendiente de hardening de auditoria SaaS.
              </AppText>
            )}
            {selectedAuditEvent.technicalDetail ? (
              <AppText variant="caption" color={theme.colors.mutedText}>
                Tecnico: {selectedAuditEvent.technicalDetail}
              </AppText>
            ) : null}
          </View>
        </View>
      ) : (
        <EmptyState
          title="Sin evento seleccionado"
          message="Cuando exista un evento global, aqui veras actor, fecha, cliente y detalle."
          icon="security"
        />
      )}
    </AppCard>
  );

  const renderAudit = () => {
    const summary = platformAudit?.summary;
    const events = platformAudit?.items ?? [];
    const hasEvents = events.length > 0;

    return (
      <View style={styles.sectionStack}>
        <AppCard style={styles.panel}>
          <View style={[styles.rowBetween, isPhone ? styles.column : null]}>
            <View style={styles.sectionHeader}>
              <StatusBadge label="GLOBAL" tone="info" />
              <View style={styles.flex}>
                <AppText variant="subtitle" bold>
                  Auditoria global de plataforma
                </AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  Consulta eventos globales del Panel Owner: companias, suscripciones, precios, modulos, limites y administracion SaaS. No depende del cliente en administracion.
                </AppText>
              </View>
            </View>
            <StatusBadge label={hasEvents ? `${events.length} eventos` : 'Sin eventos'} tone={hasEvents ? 'success' : 'neutral'} />
          </View>
          <View style={styles.dashboardMetricGrid}>
            {renderDashboardMetricTile('Hoy', summary?.todayCount ?? 0, 'Eventos registrados hoy', (summary?.todayCount ?? 0) > 0 ? 'info' : 'neutral')}
            {renderDashboardMetricTile('Ultimos 7 dias', summary?.last7DaysCount ?? 0, 'Actividad reciente de plataforma', (summary?.last7DaysCount ?? 0) > 0 ? 'success' : 'neutral')}
            {renderDashboardMetricTile('Clientes', summary?.companyChangesCount ?? 0, 'Companias y sucursales', (summary?.companyChangesCount ?? 0) > 0 ? 'info' : 'neutral')}
            {renderDashboardMetricTile('Suscripciones', summary?.subscriptionChangesCount ?? 0, 'Planes, precios y asignaciones', (summary?.subscriptionChangesCount ?? 0) > 0 ? 'info' : 'neutral')}
            {renderDashboardMetricTile('Configuracion', summary?.configurationChangesCount ?? 0, 'Usuarios, modulos y limites', (summary?.configurationChangesCount ?? 0) > 0 ? 'warning' : 'neutral')}
          </View>
        </AppCard>

        <AppCard style={styles.panel}>
          <View style={[styles.rowBetween, isPhone ? styles.column : null]}>
            <View style={styles.sectionHeader}>
              <StatusBadge label="FILTROS" tone="role" />
              <View style={styles.flex}>
                <AppText variant="subtitle" bold>
                  Buscar eventos
                </AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  Filtra por texto, categoria o rango rapido sin cambiar el cliente en administracion.
                </AppText>
              </View>
            </View>
            <AppButton
              title="Limpiar filtros"
              variant="secondary"
              onPress={() => {
                setAuditSearch('');
                setAuditCategoryFilter('ALL');
                setAuditDateFilter('ALL');
                setSelectedAuditEventId(null);
              }}
              style={styles.compactButton}
            />
          </View>
          <AppInput
            label="Buscar"
            placeholder="Actor, cliente, suscripcion, modulo..."
            value={auditSearch}
            onChangeText={setAuditSearch}
          />
          <View style={styles.companyFilterBar}>
            {AUDIT_CATEGORY_OPTIONS.map((option) => (
              <AppButton
                key={option.key}
                title={option.label}
                variant={auditCategoryFilter === option.key ? 'primary' : 'secondary'}
                onPress={() => setAuditCategoryFilter(option.key)}
                style={styles.filterButton}
              />
            ))}
          </View>
          <View style={styles.companyFilterBar}>
            {AUDIT_DATE_OPTIONS.map((option) => (
              <AppButton
                key={option.key}
                title={option.label}
                variant={auditDateFilter === option.key ? 'primary' : 'secondary'}
                onPress={() => setAuditDateFilter(option.key)}
                style={styles.filterButton}
              />
            ))}
          </View>
        </AppCard>

        <View style={[styles.dashboardTwoColumn, isPhone ? styles.column : null]}>
          <AppCard style={[styles.panel, styles.dashboardColumn]}>
            <View style={styles.sectionHeader}>
              <StatusBadge label="TIMELINE" tone={filteredAuditEvents.length > 0 ? 'success' : 'neutral'} />
              <View style={styles.flex}>
                <AppText variant="subtitle" bold>
                  Eventos globales
                </AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  {filteredAuditEvents.length} eventos con los filtros actuales.
                </AppText>
              </View>
            </View>
            {filteredAuditEvents.length === 0 ? (
              <EmptyState
                title={hasEvents ? 'Sin resultados con estos filtros' : 'Aun no hay eventos globales registrados'}
                message={
                  hasEvents
                    ? 'Cambia los filtros para ver otros eventos de plataforma.'
                    : 'Los cambios de companias, suscripciones, precios, modulos, limites y admins apareceran aqui cuando se realicen desde Panel Owner.'
                }
                icon="security"
              />
            ) : (
              <View style={styles.auditTimeline}>
                {filteredAuditEvents.map(renderAuditEventRow)}
              </View>
            )}
          </AppCard>

          {renderAuditDetail()}
        </View>

        <AppCard style={styles.panel}>
          <View style={styles.sectionHeader}>
            <StatusBadge label="COBERTURA" tone="warning" />
            <View style={styles.flex}>
              <AppText variant="subtitle" bold>
                Cobertura actual de auditoria
              </AppText>
              <AppText variant="caption" color={theme.colors.mutedText}>
                Esta fase usa eventos persistidos existentes y deja marcado lo pendiente para auditoria SaaS avanzada.
              </AppText>
            </View>
          </View>
          <View style={styles.dashboardTable}>
            {(platformAudit?.coverage ?? []).map((item) => (
              <View key={item.label} style={[styles.dashboardTableRow, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.borderSubtle }]}>
                <View style={styles.dashboardCompanyCell}>
                  <AppText bold>{item.label}</AppText>
                  <AppText variant="caption" color={theme.colors.mutedText}>{item.description}</AppText>
                </View>
                <StatusBadge label={item.status} tone={normalizeAuditCoverageTone(item.status)} />
              </View>
            ))}
          </View>
        </AppCard>
      </View>
    );
  };

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
            <View style={[styles.rowBetween, isPhone ? styles.column : null]}>
              <View style={styles.flex}>
                <AppText bold>{branch.code} - {branch.name}</AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>ID {branch.id}</AppText>
              </View>
              <View style={styles.actionsRow}>
                <StatusBadge label={branch.status} tone={branch.status === 'ACTIVE' ? 'success' : 'neutral'} />
                <AppButton
                  title="Editar"
                  variant="secondary"
                  disabled={!canManageCompanies}
                  disabledReason="Tu usuario necesita MANAGE_COMPANIES."
                  onPress={() => openBranchEditor(branch)}
                  style={styles.compactButton}
                />
              </View>
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
      <AppText bold>{editingUserId ? 'Editar usuario del cliente' : 'Crear usuario operativo'}</AppText>
      <AppInput label="Nombre" placeholder="Vendedor Centro" value={userForm.name} onChangeText={(value) => setUserForm((current) => ({ ...current, name: value }))} editable={!creatingUser && canManageAdmins} />
      <AppInput label="Correo" placeholder="vendedor.centro@cliente.test" autoCapitalize="none" keyboardType="email-address" value={userForm.email} onChangeText={(value) => setUserForm((current) => ({ ...current, email: value }))} editable={!creatingUser && canManageAdmins && !editingUserId} />
      {!editingUserId ? (
        <AppInput label="Password inicial" placeholder="Vendedor123!" secureTextEntry value={userForm.password} onChangeText={(value) => setUserForm((current) => ({ ...current, password: value }))} editable={!creatingUser && canManageAdmins} />
      ) : (
        <AppText variant="caption" color={theme.colors.mutedText}>
          El cambio de password se maneja por el flujo dedicado de usuarios; esta edicion conserva el acceso actual.
        </AppText>
      )}
      <AppInput label="Telefono opcional" placeholder="Opcional" value={userForm.phone} onChangeText={(value) => setUserForm((current) => ({ ...current, phone: value }))} editable={!creatingUser && canManageAdmins} />
      <View style={styles.actionsRow}>
        {TENANT_ROLE_OPTIONS.map((role) => (
          <AppButton key={role.code} title={role.label} variant={userForm.role === role.code ? 'primary' : 'secondary'} onPress={() => setUserForm((current) => ({ ...current, role: role.code }))} style={styles.compactButton} />
        ))}
      </View>
      {companyBranches.length > 1 ? (
        <View style={styles.actionsRow}>
          {companyBranches.map((branch) => (
            <AppButton
              key={branch.id}
              title={branch.name}
              variant={userForm.branchId === branch.id ? 'primary' : 'secondary'}
              onPress={() => setUserForm((current) => ({ ...current, branchId: branch.id }))}
              style={styles.compactButton}
            />
          ))}
        </View>
      ) : null}
      {editingUserId ? (
        <View style={styles.actionsRow}>
          {['ACTIVE', 'INACTIVE'].map((status) => (
            <AppButton
              key={status}
              title={status}
              variant={userForm.status === status ? 'primary' : 'secondary'}
              onPress={() => setUserForm((current) => ({ ...current, status }))}
              style={styles.compactButton}
            />
          ))}
        </View>
      ) : null}
      <AppText variant="caption" color={theme.colors.mutedText}>Sucursal asignada: {selectedBranchName}</AppText>
      <AppButton title={editingUserId ? 'Guardar cambios' : 'Crear usuario'} loading={creatingUser} disabled={creatingUser || !canManageAdmins || !canUseSelectedCompany || companyBranches.length === 0} disabledReason="Selecciona una empresa con sucursal y permiso MANAGE_TENANT_ADMINS." onPress={handleCreateUser} style={styles.actionButton} />
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
              <View style={styles.actionsRow}>
                <StatusBadge label={user.status} tone={user.status === 'ACTIVE' ? 'success' : 'neutral'} />
                <AppButton
                  title="Editar"
                  variant="secondary"
                  disabled={!canManageAdmins}
                  disabledReason="Tu usuario necesita MANAGE_TENANT_ADMINS."
                  onPress={() => openUserEditor(user)}
                  style={styles.compactButton}
                />
              </View>
            </View>
          </AppCard>
        ))
      )}
    </View>
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
                Modelo {normalizeBillingModelLabel(item.billingModel)} - Plan {item.planName || 'sin plan'} - Estado {normalizeSubscriptionStatusLabel(item.subscriptionStatus)}
              </AppText>
              <AppText variant="caption" color={theme.colors.mutedText}>
                Usuarios {item.activeUsers}/{item.maxUsers ?? 'sin limite'} - Sucursales {item.activeBranches}/{item.maxBranches ?? 'sin limite'} - Modulos activos {item.activeModules}
              </AppText>
              <AppText variant="caption" color={theme.colors.mutedText}>
                Hosting {normalizeDeploymentTypeLabel(item.deploymentType)} - Servicio {normalizeServiceStatusLabel(item.serviceAgreementStatus)}
              </AppText>
            </View>
            <AppButton title={selectedCompanyId === item.companyId ? 'Uso visible' : 'Ver uso'} variant={selectedCompanyId === item.companyId ? 'neutral' : 'secondary'} onPress={() => updateCompanyInAdministration(item.companyId, item.companyName)} style={styles.compactButton} />
          </View>
        ))}
      </View>
      {selectedUsage ? (
        <AppText variant="caption" color={theme.colors.mutedText}>
          Cliente en administracion: {selectedUsage.companyName} - {normalizeBillingModelLabel(selectedUsage.billingModel)} - {selectedUsage.planName || 'sin plan'}
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
  auditDetailGrid: {
    gap: 8,
  },
  auditEventRow: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    padding: 10,
  },
  auditTechnicalBlock: {
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
    padding: 10,
  },
  auditTimeline: {
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
  companyActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
  },
  companyCardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  companyFilterBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  companyInfoCell: {
    borderRadius: 10,
    borderWidth: 1,
    flexGrow: 1,
    flexShrink: 1,
    gap: 3,
    minWidth: 150,
    padding: 10,
  },
  companyInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  companyNameBlock: {
    flex: 1,
    gap: 3,
    minWidth: 220,
  },
  companyNameText: {
    maxWidth: 280,
  },
  companyPendingRow: {
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 10,
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
  filterButton: {
    minHeight: 30,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  formBlock: {
    gap: 8,
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
  planRow: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    padding: 10,
  },
  priceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pricePeriodCard: {
    borderRadius: 10,
    borderWidth: 1,
    flexGrow: 1,
    flexShrink: 1,
    gap: 8,
    minWidth: 180,
    padding: 10,
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
  subscriptionColumn: {
    flex: 1,
    minWidth: 300,
  },
  subscriptionLayout: {
    alignItems: 'flex-start',
    flexDirection: 'row',
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
