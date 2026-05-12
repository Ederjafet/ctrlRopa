import { apiRequest } from '@/services/apiClient';

export type AdminRole = {
  id: number;
  code: string;
  name: string;
  permissions?: AdminPermission[];
};

export type AdminPermission = {
  id: number;
  code: string;
  name: string;
};

export type AdminBranch = {
  id: number;
  code: string;
  name: string;
  status?: string;
};

export type AdminUser = {
  id: number;
  branchId: number;
  branchCode?: string;
  branchName?: string;
  branches?: (AdminBranch & { primary?: boolean })[];
  name: string;
  email: string;
  phone?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | string;
  passwordChangeRequired?: boolean;
  createdAt?: string;
  updatedAt?: string;
  roles?: AdminRole[];
  directPermissions?: AdminPermission[];
  effectivePermissions?: AdminPermission[];
};

export type SaveUserRequest = {
  branchId: number;
  branchIds?: number[];
  name: string;
  email: string;
  phone?: string | null;
  password?: string;
  status: 'ACTIVE' | 'INACTIVE';
  passwordChangeRequired?: boolean;
  roleIds: number[];
  permissionIds: number[];
};

export type SaveRoleRequest = {
  code: string;
  name: string;
  permissionIds: number[];
};

export async function getUsers(search?: string): Promise<AdminUser[]> {
  const query = search?.trim();
  const suffix = query ? `?search=${encodeURIComponent(query)}` : '';
  return apiRequest(`/api/users${suffix}`);
}

export async function getUser(id: number): Promise<AdminUser> {
  return apiRequest(`/api/users/${id}`);
}

export async function createUser(request: SaveUserRequest): Promise<AdminUser> {
  return apiRequest('/api/users', {
    method: 'POST',
    body: normalizeUserRequest(request, true),
  });
}

export async function updateUser(
  id: number,
  request: Partial<SaveUserRequest>
): Promise<AdminUser> {
  return apiRequest(`/api/users/${id}`, {
    method: 'PUT',
    body: normalizeUserRequest(request, false),
  });
}

export async function deactivateUser(id: number): Promise<AdminUser> {
  return apiRequest(`/api/users/${id}/deactivate`, {
    method: 'PATCH',
  });
}

export async function activateUser(id: number): Promise<AdminUser> {
  return updateUser(id, { status: 'ACTIVE' });
}

export async function getRoles(): Promise<AdminRole[]> {
  return apiRequest('/api/roles');
}

export async function createRole(request: SaveRoleRequest): Promise<AdminRole> {
  return apiRequest('/api/roles', {
    method: 'POST',
    body: normalizeRoleRequest(request),
  });
}

export async function updateRole(
  id: number,
  request: SaveRoleRequest
): Promise<AdminRole> {
  return apiRequest(`/api/roles/${id}`, {
    method: 'PUT',
    body: normalizeRoleRequest(request),
  });
}

export async function getPermissions(): Promise<AdminPermission[]> {
  return apiRequest('/api/permissions');
}

export async function getBranches(): Promise<AdminBranch[]> {
  return apiRequest('/api/branches');
}

function normalizeUserRequest(
  request: Partial<SaveUserRequest>,
  includePassword: boolean
) {
  const body: Record<string, unknown> = {};

  if (request.branchId !== undefined) body.branchId = request.branchId;
  if (request.branchIds !== undefined) body.branchIds = request.branchIds;
  if (request.name !== undefined) body.name = request.name.trim();
  if (request.email !== undefined) body.email = request.email.trim().toLowerCase();
  if (request.phone !== undefined) body.phone = request.phone?.trim() || null;
  if (request.status !== undefined) body.status = request.status;
  if (request.passwordChangeRequired !== undefined) body.passwordChangeRequired = request.passwordChangeRequired;
  if (request.roleIds !== undefined) body.roleIds = request.roleIds;
  if (request.permissionIds !== undefined) body.permissionIds = request.permissionIds;

  if (includePassword || (request.password && request.password.trim())) {
    body.password = request.password?.trim();
  }

  return body;
}

function normalizeRoleRequest(request: SaveRoleRequest) {
  return {
    code: request.code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
    name: request.name.trim(),
    permissionIds: request.permissionIds,
  };
}
