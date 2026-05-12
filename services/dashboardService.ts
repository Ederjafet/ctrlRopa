import { apiRequest } from '@/services/apiClient';

export type DashboardAction = {
  label: string;
  count: number;
  severity: 'INFO' | 'WARNING' | 'DANGER' | string;
  route: string;
};

export type BranchDashboard = {
  branchId: number;
  branchCode: string;
  branchName: string;
  primary: boolean;
  money: {
    todaySales: number;
    todayReservations: number;
    todayPayments: number;
    todayCash: number;
    pendingCollections: number;
    pendingRefunds: number;
  };
  operations: {
    todaySalesCount: number;
    todayReservationsCount: number;
    todayPaymentsCount: number;
    activeCustomersToday: number;
    activeLives: number;
  };
  inventory: {
    availableItems: number;
    reservedItems: number;
    soldItemsToday: number;
    announcedBatches: number;
    receivedBatches: number;
  };
  pending: {
    packagesToPrepare: number;
    shipmentsOpen: number;
    transfersToSend: number;
    transfersToReceive: number;
    refundsToApprove: number;
    refundsToProcess: number;
    incidentsOpen: number;
    ordersOpen: number;
  };
  actions: DashboardAction[];
};

export type UserDashboard = {
  date: string;
  roles: string[];
  branches: BranchDashboard[];
};

export type DashboardMetricDetailItem = {
  label: string;
  subtitle?: string | null;
  amount?: number | null;
  status?: string | null;
  route?: string | null;
};

export type DashboardMetricDetail = {
  metric: string;
  title: string;
  items: DashboardMetricDetailItem[];
};

export async function getUserDashboard(): Promise<UserDashboard> {
  return apiRequest('/api/dashboard/me');
}

export async function getDashboardMetricDetail(
  branchId: number,
  metric: string
): Promise<DashboardMetricDetail> {
  return apiRequest(
    `/api/dashboard/me/branches/${branchId}/metrics/${encodeURIComponent(metric)}`
  );
}
