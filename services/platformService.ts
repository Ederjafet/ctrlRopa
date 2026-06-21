import { apiRequest } from '@/services/apiClient';

export type PlatformCompany = {
  id: number;
  code: string;
  name: string;
  status: string;
  branchId: number | null;
  branchCode: string | null;
  branchName: string | null;
  adminUsers: number;
};

export type PlatformCompanyDetail = {
  id: number;
  code: string;
  name: string;
  status: string;
  branchCount: number;
  userCount: number;
  activeUserCount: number;
};

export type PlatformBranch = {
  id: number;
  companyId: number;
  code: string;
  name: string;
  status: string;
};

export type PlatformCompanyUser = {
  id: number;
  companyId: number;
  branchId: number;
  branchCode: string;
  branchName: string;
  name: string;
  email: string;
  phone?: string | null;
  status: string;
  roles: string[];
};

export type PlatformModuleSetting = {
  code: string;
  name: string;
  enabled: boolean;
};

export type PlatformCompanySettings = {
  modules: PlatformModuleSetting[];
  limits: {
    maxUsers?: number | null;
    maxBranches?: number | null;
    maxItems?: number | null;
    maxLiveSessionsPerMonth?: number | null;
    maxShipmentsPerMonth?: number | null;
    maxPackagesPerMonth?: number | null;
  };
};

export type PlatformSubscriptionPlan = {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  status: string;
  includedMaxUsers?: number | null;
  includedMaxBranches?: number | null;
  includesLive: boolean;
  includesReports: boolean;
  includesShipments: boolean;
  includesPackages: boolean;
};

export type PlatformPlanPrice = {
  id: number;
  planId: number;
  billingPeriod: string;
  priceAmount: number;
  currency: string;
  status: string;
};

export type PlatformCompanySubscription = {
  id?: number | null;
  companyId: number;
  planId?: number | null;
  planCode?: string | null;
  planName?: string | null;
  billingModel: string;
  billingPeriod?: string | null;
  status: string;
  startedAt?: string | null;
  endsAt?: string | null;
  nextBillingAt?: string | null;
};

export type PlatformUsageRate = {
  id?: number | null;
  companyId: number;
  usageType: string;
  name: string;
  unitPrice: number;
  currency: string;
  enabled: boolean;
};

export type PlatformUsageSummary = {
  companyId: number;
  companyName: string;
  billingModel: string;
  planName?: string | null;
  subscriptionStatus: string;
  activeBranches: number;
  activeUsers: number;
  activeModules: number;
  maxUsers?: number | null;
  maxBranches?: number | null;
};

export type PlatformDashboardSummary = {
  summary: {
    activeCompanies: number;
    trialCompanies: number;
    suspendedCompanies: number;
    companiesWithoutPlan: number;
    companiesWithActiveSubscription: number;
    companiesWithUsageBilling: number;
    activeUsers: number;
    activeBranches: number;
    activePlans: number;
    companiesWithUsageToday: number;
    estimatedMonthlyRevenue?: number | null;
  };
  todayActivity: {
    itemsCreated: number;
    reservationsCreated: number;
    packagesCreated: number;
    paymentsRegistered: number;
    paymentAmount?: number | null;
    shipmentsCreated: number;
    liveSessions: number;
    liveReservations: number;
  };
  installationPendings: {
    companyId: number;
    companyName: string;
    status: string;
    missing: string[];
    actionSection: string;
  }[];
  attentionCompanies: {
    companyId: number;
    companyName: string;
    status: string;
    planName?: string | null;
    billingModel: string;
    activeUsers: number;
    maxUsers?: number | null;
    activeBranches: number;
    maxBranches?: number | null;
    modules: string[];
    usageLabel: string;
    pendingLabels: string[];
  }[];
  operationalAlerts: {
    type: string;
    label: string;
    count: number;
    tone: string;
    actionSection: string;
  }[];
};

export type CreatePlatformCompanyPayload = {
  name: string;
  legalName?: string;
  branchName: string;
};

export type CreateTenantAdminPayload = {
  name: string;
  email: string;
  password: string;
  branchId?: number | null;
};

export type CreatePlatformBranchPayload = {
  name: string;
  code?: string;
};

export type CreatePlatformCompanyUserPayload = {
  name: string;
  email: string;
  password: string;
  role: string;
  branchId?: number | null;
  phone?: string | null;
};

export type UpdatePlatformCompanySettingsPayload = {
  modules: {
    code: string;
    enabled: boolean;
  }[];
  maxUsers?: number | null;
  maxBranches?: number | null;
  maxItems?: number | null;
  maxLiveSessionsPerMonth?: number | null;
  maxShipmentsPerMonth?: number | null;
  maxPackagesPerMonth?: number | null;
};

export type CreatePlatformSubscriptionPlanPayload = {
  code: string;
  name: string;
  description?: string | null;
  status?: string;
  includedMaxUsers?: number | null;
  includedMaxBranches?: number | null;
  includesLive?: boolean;
  includesReports?: boolean;
  includesShipments?: boolean;
  includesPackages?: boolean;
};

export type UpdatePlatformPlanPricesPayload = {
  prices: {
    billingPeriod: string;
    priceAmount: number;
    currency?: string;
    status?: string;
  }[];
};

export type UpdatePlatformCompanySubscriptionPayload = {
  planId?: number | null;
  billingModel: string;
  billingPeriod?: string | null;
  status: string;
  startedAt?: string | null;
  endsAt?: string | null;
  nextBillingAt?: string | null;
};

export type UpdatePlatformUsageRatesPayload = {
  rates: {
    usageType: string;
    unitPrice: number;
    currency?: string;
    enabled?: boolean;
  }[];
};

export type PlatformTenantAdmin = {
  id: number;
  companyId: number;
  branchId: number;
  name: string;
  email: string;
  status: string;
  roleCode: string;
};

export async function getPlatformCompanies(): Promise<PlatformCompany[]> {
  return apiRequest<PlatformCompany[]>('/api/platform/companies');
}

export async function createPlatformCompany(
  payload: CreatePlatformCompanyPayload
): Promise<PlatformCompany> {
  return apiRequest<PlatformCompany>('/api/platform/companies', {
    method: 'POST',
    body: payload,
  });
}

export async function getPlatformCompanyDetail(
  companyId: number
): Promise<PlatformCompanyDetail> {
  return apiRequest<PlatformCompanyDetail>(`/api/platform/companies/${companyId}`);
}

export async function getPlatformBranches(companyId: number): Promise<PlatformBranch[]> {
  return apiRequest<PlatformBranch[]>(`/api/platform/companies/${companyId}/branches`);
}

export async function createPlatformBranch(
  companyId: number,
  payload: CreatePlatformBranchPayload
): Promise<PlatformBranch> {
  return apiRequest<PlatformBranch>(`/api/platform/companies/${companyId}/branches`, {
    method: 'POST',
    body: payload,
  });
}

export async function getPlatformUsers(companyId: number): Promise<PlatformCompanyUser[]> {
  return apiRequest<PlatformCompanyUser[]>(`/api/platform/companies/${companyId}/users`);
}

export async function getPlatformCompanySettings(
  companyId: number
): Promise<PlatformCompanySettings> {
  return apiRequest<PlatformCompanySettings>(`/api/platform/companies/${companyId}/settings`);
}

export async function updatePlatformCompanySettings(
  companyId: number,
  payload: UpdatePlatformCompanySettingsPayload
): Promise<PlatformCompanySettings> {
  return apiRequest<PlatformCompanySettings>(`/api/platform/companies/${companyId}/settings`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function createPlatformUser(
  companyId: number,
  payload: CreatePlatformCompanyUserPayload
): Promise<PlatformCompanyUser> {
  return apiRequest<PlatformCompanyUser>(`/api/platform/companies/${companyId}/users`, {
    method: 'POST',
    body: payload,
  });
}

export async function createPlatformTenantAdmin(
  companyId: number,
  payload: CreateTenantAdminPayload
): Promise<PlatformTenantAdmin> {
  return apiRequest<PlatformTenantAdmin>(`/api/platform/companies/${companyId}/admin-user`, {
    method: 'POST',
    body: payload,
  });
}

export async function getPlatformSubscriptionPlans(): Promise<PlatformSubscriptionPlan[]> {
  return apiRequest<PlatformSubscriptionPlan[]>('/api/platform/subscription-plans');
}

export async function createPlatformSubscriptionPlan(
  payload: CreatePlatformSubscriptionPlanPayload
): Promise<PlatformSubscriptionPlan> {
  return apiRequest<PlatformSubscriptionPlan>('/api/platform/subscription-plans', {
    method: 'POST',
    body: payload,
  });
}

export async function getPlatformPlanPrices(planId: number): Promise<PlatformPlanPrice[]> {
  return apiRequest<PlatformPlanPrice[]>(`/api/platform/subscription-plans/${planId}/prices`);
}

export async function updatePlatformPlanPrices(
  planId: number,
  payload: UpdatePlatformPlanPricesPayload
): Promise<PlatformPlanPrice[]> {
  return apiRequest<PlatformPlanPrice[]>(`/api/platform/subscription-plans/${planId}/prices`, {
    method: 'PUT',
    body: payload,
  });
}

export async function getPlatformCompanySubscription(
  companyId: number
): Promise<PlatformCompanySubscription> {
  return apiRequest<PlatformCompanySubscription>(`/api/platform/companies/${companyId}/subscription`);
}

export async function updatePlatformCompanySubscription(
  companyId: number,
  payload: UpdatePlatformCompanySubscriptionPayload
): Promise<PlatformCompanySubscription> {
  return apiRequest<PlatformCompanySubscription>(`/api/platform/companies/${companyId}/subscription`, {
    method: 'PUT',
    body: payload,
  });
}

export async function getPlatformUsageRates(companyId: number): Promise<PlatformUsageRate[]> {
  return apiRequest<PlatformUsageRate[]>(`/api/platform/companies/${companyId}/usage-rates`);
}

export async function updatePlatformUsageRates(
  companyId: number,
  payload: UpdatePlatformUsageRatesPayload
): Promise<PlatformUsageRate[]> {
  return apiRequest<PlatformUsageRate[]>(`/api/platform/companies/${companyId}/usage-rates`, {
    method: 'PUT',
    body: payload,
  });
}

export async function getPlatformUsageSummary(): Promise<PlatformUsageSummary[]> {
  return apiRequest<PlatformUsageSummary[]>('/api/platform/usage');
}

export async function getPlatformDashboardSummary(): Promise<PlatformDashboardSummary> {
  return apiRequest<PlatformDashboardSummary>('/api/platform/dashboard/summary');
}
