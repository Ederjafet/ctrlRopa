import { apiRequest } from '@/services/apiClient';

export type CashClosureStatus = 'OPEN' | 'CLOSED' | 'CANCELLED';
export type CashExpenseStatus = 'ACTIVE' | 'CANCELLED';

export type CashExpenseLine = {
  id: number;
  concept: string;
  amount: number;
  notes?: string | null;
  status: CashExpenseStatus | string;
  createdAt?: string | null;
  createdByUserId?: number | null;
  cancelledAt?: string | null;
  cancelledByUserId?: number | null;
  cancelReason?: string | null;
};

export type CashClosure = {
  id: number;
  branchId: number;
  branchCode?: string | null;
  branchName?: string | null;
  closureDate: string;
  expectedCash: number;
  expensesTotal: number;
  deliveredCash: number;
  difference: number;
  notes?: string | null;
  status: CashClosureStatus | string;
  createdAt?: string | null;
  createdByUserId?: number | null;
  closedAt?: string | null;
  closedByUserId?: number | null;
  cancelledAt?: string | null;
  cancelledByUserId?: number | null;
  cancelReason?: string | null;
  expenses: CashExpenseLine[];
};

export type CreateCashClosureRequest = {
  branchId: number;
  closureDate: string;
  deliveredCash?: number | null;
  notes?: string | null;
};

export type UpdateCashClosureRequest = {
  deliveredCash?: number | null;
  notes?: string | null;
};

export type CloseCashClosureRequest = {
  deliveredCash: number;
  closedByUserId: number;
  notes?: string | null;
};

export type AddCashExpenseRequest = {
  concept: string;
  amount: number;
  notes?: string | null;
};

export async function createCashClosure(
  payload: CreateCashClosureRequest
): Promise<CashClosure> {
  return apiRequest<CashClosure>('/api/cash-closures', {
    method: 'POST',
    body: {
      branchId: payload.branchId,
      closureDate: payload.closureDate,
      deliveredCash: payload.deliveredCash ?? 0,
      notes: payload.notes?.trim() || null,
    },
  });
}

export async function getCashClosure(id: number): Promise<CashClosure> {
  return apiRequest<CashClosure>(`/api/cash-closures/${id}`);
}

export async function getCashClosuresByBranch(
  branchId: number
): Promise<CashClosure[]> {
  return apiRequest<CashClosure[]>(`/api/cash-closures/branch/${branchId}`);
}

export async function getCashClosureByBranchAndDate(
  branchId: number,
  date: string
): Promise<CashClosure> {
  return apiRequest<CashClosure>(
    `/api/cash-closures/branch/${branchId}/date/${date}`
  );
}

export async function updateCashClosure(
  id: number,
  payload: UpdateCashClosureRequest
): Promise<CashClosure> {
  return apiRequest<CashClosure>(`/api/cash-closures/${id}`, {
    method: 'PUT',
    body: {
      deliveredCash: payload.deliveredCash ?? null,
      notes: payload.notes?.trim() ?? null,
    },
  });
}

export async function addCashExpense(
  closureId: number,
  payload: AddCashExpenseRequest
): Promise<CashClosure> {
  return apiRequest<CashClosure>(`/api/cash-closures/${closureId}/expenses`, {
    method: 'POST',
    body: {
      concept: payload.concept.trim(),
      amount: payload.amount,
      notes: payload.notes?.trim() || null,
    },
  });
}

export async function cancelCashExpense(
  closureId: number,
  expenseId: number,
  reason: string
): Promise<CashClosure> {
  return apiRequest<CashClosure>(
    `/api/cash-closures/${closureId}/expenses/${expenseId}/cancel`,
    {
      method: 'PATCH',
      body: { reason: reason.trim() },
    }
  );
}

export async function closeCashClosure(
  id: number,
  payload: CloseCashClosureRequest
): Promise<CashClosure> {
  return apiRequest<CashClosure>(`/api/cash-closures/${id}/close`, {
    method: 'PATCH',
    body: {
      deliveredCash: payload.deliveredCash,
      closedByUserId: payload.closedByUserId,
      notes: payload.notes?.trim() || null,
    },
  });
}

export async function cancelCashClosure(
  id: number,
  reason: string
): Promise<CashClosure> {
  return apiRequest<CashClosure>(`/api/cash-closures/${id}/cancel`, {
    method: 'PATCH',
    body: { reason: reason.trim() },
  });
}

export function getCashClosureStatusLabel(status?: string | null): string {
  switch (status) {
    case 'OPEN':
      return 'Abierto';
    case 'CLOSED':
      return 'Cerrado';
    case 'CANCELLED':
      return 'Cancelado';
    default:
      return status || 'Sin estado';
  }
}

export function isCashClosureOpen(closure?: CashClosure | null): boolean {
  return closure?.status === 'OPEN';
}

export function isExpenseActive(expense?: CashExpenseLine | null): boolean {
  return expense?.status === 'ACTIVE';
}
