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

export type CreatePlatformCompanyPayload = {
  name: string;
  legalName?: string;
  branchName: string;
};

export type CreateTenantAdminPayload = {
  name: string;
  email: string;
  password: string;
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

export async function createPlatformTenantAdmin(
  companyId: number,
  payload: CreateTenantAdminPayload
): Promise<PlatformTenantAdmin> {
  return apiRequest<PlatformTenantAdmin>(`/api/platform/companies/${companyId}/admin-user`, {
    method: 'POST',
    body: payload,
  });
}
