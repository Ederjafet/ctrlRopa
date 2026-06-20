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
