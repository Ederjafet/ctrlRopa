import { apiRequest } from '@/services/apiClient';

export type Status = 'ACTIVE' | 'INACTIVE' | string;

export type Branch = {
  id: number;
  code?: string;
  name: string;
  status?: Status;
};

export type SalesChannel = {
  id: number;
  code: string;
  name: string;
  status?: Status;
  globalEnabled?: boolean;
};

export type BranchSalesChannel = {
  id: number;
  branchId: number;
  branchCode?: string;
  branchName?: string;
  salesChannelId: number;
  salesChannelCode: string;
  salesChannelName: string;
  enabled: boolean;
  updatedByUserId?: number | null;
};

export type ChannelToggleRow = {
  salesChannelId: number;
  salesChannelCode: string;
  salesChannelName: string;
  enabled: boolean;
  configId?: number;
};

export async function getActiveBranches(): Promise<Branch[]> {
  return apiRequest<Branch[]>('/api/branches/active');
}

export async function getActiveSalesChannels(): Promise<SalesChannel[]> {
  return apiRequest<SalesChannel[]>('/api/sales-channels/active');
}

export async function getAllSalesChannels(): Promise<SalesChannel[]> {
  return apiRequest<SalesChannel[]>('/api/sales-channels');
}

export async function updateSalesChannelGlobalEnabled(
  id: number,
  globalEnabled: boolean
): Promise<SalesChannel> {
  return apiRequest<SalesChannel>(`/api/sales-channels/${id}/global-enabled`, {
    method: 'PATCH',
    body: { globalEnabled },
  });
}

export async function getBranchSalesChannels(
  branchId: number
): Promise<BranchSalesChannel[]> {
  return apiRequest<BranchSalesChannel[]>(
    `/api/branch-sales-channels/branch/${branchId}`
  );
}

export async function saveBranchSalesChannel(input: {
  branchId: number;
  salesChannelId: number;
  enabled: boolean;
  configId?: number;
}): Promise<BranchSalesChannel> {
  if (input.configId) {
    return apiRequest<BranchSalesChannel>(
      `/api/branch-sales-channels/${input.configId}`,
      {
        method: 'PUT',
        body: { enabled: input.enabled },
      }
    );
  }

  return apiRequest<BranchSalesChannel>('/api/branch-sales-channels', {
    method: 'POST',
    body: {
      branchId: input.branchId,
      salesChannelId: input.salesChannelId,
      enabled: input.enabled,
    },
  });
}

export function buildChannelRows(
  salesChannels: SalesChannel[],
  branchConfig: BranchSalesChannel[]
): ChannelToggleRow[] {
  const configByChannelId = new Map<number, BranchSalesChannel>();

  branchConfig.forEach((config) => {
    configByChannelId.set(config.salesChannelId, config);
  });

  return salesChannels.map((channel) => {
    const config = configByChannelId.get(channel.id);

    return {
      salesChannelId: channel.id,
      salesChannelCode: channel.code,
      salesChannelName: channel.name,
      enabled: Boolean(config?.enabled),
      configId: config?.id,
    };
  });
}
