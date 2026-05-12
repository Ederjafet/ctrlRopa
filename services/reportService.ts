import { apiRequest } from '@/services/apiClient';

export type ReportRequest = {
  branchId: number;
  date: string;
};

export type MovementHistoryRequest = {
  branchId: number;
  startDate: string;
  endDate: string;
  movementType?: 'ALL' | 'FINANCIAL' | 'NON_FINANCIAL';
};

export type BaseReport<TLine, TPrintLine, TSummary> = {
  date: string;
  branchId: number;
  branchCode?: string | null;
  branchName?: string | null;
  screenLines: TLine[];
  printLines?: TPrintLine[];
  summary?: TSummary | null;
};

export type DailyStoreReport = {
  date: string;
  branchId: number;
  branchCode?: string | null;
  branchName?: string | null;
  screenLines: DailyStoreLine[];
  printLines?: DailyStorePrintLine[];
  paymentSummary?: DailyStorePaymentSummary | null;
  operationSummary?: DailyStoreOperationSummary | null;
  cashSummary?: DailyStoreCashSummary | null;
};

export type DailyStoreLine = {
  sourceType?: string | null;
  sourceId?: number | null;
  folio?: string | null;
  customerName?: string | null;
  channelCode?: string | null;
  operationType?: string | null;
  total?: number | null;
  paid?: number | null;
  pending?: number | null;
  cash?: number | null;
  transfer?: number | null;
  card?: number | null;
  balanceApplied?: number | null;
  paymentStatus?: string | null;
  status?: string | null;
  attendedBy?: string | null;
  createdAt?: string | null;
  observation?: string | null;
};

export type DailyStorePrintLine = {
  rowNumber?: number | null;
  folio?: string | null;
  customerName?: string | null;
  total?: number | null;
  paid?: number | null;
  paymentText?: string | null;
  attendedBy?: string | null;
  observation?: string | null;
};

export type DailyStorePaymentSummary = {
  cash?: number | null;
  transfer?: number | null;
  card?: number | null;
  balanceApplied?: number | null;
  balanceGenerated?: number | null;
  totalReceived?: number | null;
};

export type DailyStoreOperationSummary = {
  activeSalesTotal?: number | null;
  activeReservationsTotal?: number | null;
  cancelledSalesTotal?: number | null;
  cancelledReservationsTotal?: number | null;
  processedRefundsTotal?: number | null;
  activeSalesCount?: number | null;
  activeReservationsCount?: number | null;
  cancelledSalesCount?: number | null;
  cancelledReservationsCount?: number | null;
  refundsCount?: number | null;
};

export type DailyStoreCashSummary = {
  expectedCash?: number | null;
  expenses?: number | null;
  deliveredCash?: number | null;
  difference?: number | null;
};

export type DailyDeliveriesReport = BaseReport<
  DailyDeliveryLine,
  DailyDeliveryPrintLine,
  DailyDeliveriesSummary
>;

export type DailyDeliveryLine = {
  shipmentId?: number | null;
  shipmentFolio?: string | null;
  shipmentStatus?: string | null;
  packageId?: number | null;
  packageFolio?: string | null;
  packageStatus?: string | null;
  customerId?: number | null;
  customerName?: string | null;
  customerPhone?: string | null;
  addressText?: string | null;
  total?: number | null;
  paid?: number | null;
  pending?: number | null;
  paymentStatus?: string | null;
  deliveryType?: string | null;
  createdAt?: string | null;
  sentAt?: string | null;
  deliveredAt?: string | null;
  observation?: string | null;
};

export type DailyDeliveryPrintLine = {
  rowNumber?: number | null;
  folio?: string | null;
  customerName?: string | null;
  total?: number | null;
  paid?: number | null;
  paymentText?: string | null;
  observation?: string | null;
};

export type DailyDeliveriesSummary = {
  totalPackages?: number | null;
  inRoutePackages?: number | null;
  deliveredPackages?: number | null;
  returnedPackages?: number | null;
  totalAmount?: number | null;
  totalPaid?: number | null;
  totalPending?: number | null;
};

export type DailyDepositsReport = BaseReport<
  DailyDepositLine,
  DailyDepositPrintLine,
  DailyDepositsSummary
>;

export type DailyDepositLine = {
  paymentId?: number | null;
  customerName?: string | null;
  method?: string | null;
  reference?: string | null;
  amount?: number | null;
  status?: string | null;
  createdBy?: string | null;
  createdAt?: string | null;
  observation?: string | null;
};

export type DailyDepositPrintLine = {
  rowNumber?: number | null;
  customerName?: string | null;
  amount?: number | null;
  method?: string | null;
  reference?: string | null;
  observation?: string | null;
};

export type DailyDepositsSummary = {
  totalDeposits?: number | null;
  totalOperations?: number | null;
  averageDeposit?: number | null;
};

export type DailyCancellationsReport = BaseReport<
  DailyCancellationLine,
  DailyCancellationPrintLine,
  DailyCancellationsSummary
>;

export type DailyCancellationLine = {
  sourceType?: string | null;
  sourceId?: number | null;
  folio?: string | null;
  customerId?: number | null;
  customerName?: string | null;
  itemId?: number | null;
  itemCode?: string | null;
  total?: number | null;
  status?: string | null;
  cancelledAt?: string | null;
  cancelledByUserId?: number | null;
  cancelledByUserName?: string | null;
  cancelReason?: string | null;
  refundStatus?: string | null;
  refundAmount?: number | null;
};

export type DailyCancellationPrintLine = {
  rowNumber?: number | null;
  folio?: string | null;
  customerName?: string | null;
  total?: number | null;
  pieces?: number | null;
  attendedBy?: string | null;
  reason?: string | null;
};

export type DailyCancellationsSummary = {
  totalCancelled?: number | null;
  totalCancellations?: number | null;
  cancelledSales?: number | null;
  cancelledReservations?: number | null;
  processedRefunds?: number | null;
  processedRefundAmount?: number | null;
};

export type LiveControlReport = BaseReport<
  LiveControlLine,
  LiveControlPrintLine,
  LiveControlSummary
>;

export type LiveControlLine = {
  packageId?: number | null;
  packageFolio?: string | null;
  customerId?: number | null;
  customerName?: string | null;
  pieces?: number | null;
  total?: number | null;
  paid?: number | null;
  pending?: number | null;
  paymentStatus?: string | null;
  packageStatus?: string | null;
  orderStatus?: string | null;
  createdAt?: string | null;
  settledAt?: string | null;
};

export type LiveControlPrintLine = {
  rowNumber?: number | null;
  packageFolio?: string | null;
  customerName?: string | null;
  pieces?: number | null;
  total?: number | null;
  status?: string | null;
  settledDate?: string | null;
};

export type LiveControlSummary = {
  totalPackages?: number | null;
  totalPieces?: number | null;
  totalAmount?: number | null;
  totalPaid?: number | null;
  totalPending?: number | null;
  settledPackages?: number | null;
  pendingPackages?: number | null;
};

export type RemissionsReport = BaseReport<
  RemissionLine,
  RemissionPrintLine,
  RemissionsSummary
>;

export type RemissionLine = {
  sourceType?: string | null;
  sourceId?: number | null;
  itemCode?: string | null;
  qrCode?: string | null;
  customerName?: string | null;
  productType?: string | null;
  brand?: string | null;
  size?: string | null;
  price?: number | null;
  channelCode?: string | null;
  packageFolio?: string | null;
  paymentStatus?: string | null;
  paid?: number | null;
  pending?: number | null;
  createdAt?: string | null;
  sellerName?: string | null;
};

export type RemissionPrintLine = {
  rowNumber?: number | null;
  folio?: string | null;
  customerName?: string | null;
  description?: string | null;
  brand?: string | null;
  size?: string | null;
  price?: number | null;
  paid?: number | null;
  pending?: number | null;
  attendedBy?: string | null;
  deliveryInfo?: string | null;
};

export type RemissionsSummary = {
  totalPieces?: number | null;
  totalAmount?: number | null;
  totalPaid?: number | null;
  totalPending?: number | null;
  averageTicket?: number | null;
};

export type MovementHistoryReport = {
  startDate: string;
  endDate: string;
  branchId: number;
  branchCode?: string | null;
  branchName?: string | null;
  movementType?: string | null;
  screenLines: MovementHistoryLine[];
  summary?: MovementHistorySummary | null;
};

export type MovementHistoryLine = {
  category?: string | null;
  eventType?: string | null;
  sourceId?: number | null;
  eventAt?: string | null;
  branchId?: number | null;
  branchName?: string | null;
  customerId?: number | null;
  customerName?: string | null;
  itemCode?: string | null;
  amount?: number | null;
  status?: string | null;
  reference?: string | null;
  userId?: number | null;
  userName?: string | null;
  detail?: string | null;
};

export type MovementHistorySummary = {
  totalMovements?: number | null;
  financialMovements?: number | null;
  nonFinancialMovements?: number | null;
  financialTotal?: number | null;
};

function buildReportQuery({ branchId, date }: ReportRequest) {
  return `branchId=${branchId}&date=${encodeURIComponent(date)}`;
}

function buildMovementHistoryQuery({
  branchId,
  startDate,
  endDate,
  movementType = 'ALL',
}: MovementHistoryRequest) {
  return [
    `branchId=${branchId}`,
    `startDate=${encodeURIComponent(startDate)}`,
    `endDate=${encodeURIComponent(endDate)}`,
    `movementType=${encodeURIComponent(movementType)}`,
  ].join('&');
}

export async function getDailyStoreReport(
  request: ReportRequest
): Promise<DailyStoreReport> {
  return apiRequest<DailyStoreReport>(
    `/api/reports/daily-store?${buildReportQuery(request)}`
  );
}

export async function getDailyDeliveriesReport(
  request: ReportRequest
): Promise<DailyDeliveriesReport> {
  return apiRequest<DailyDeliveriesReport>(
    `/api/reports/daily-deliveries?${buildReportQuery(request)}`
  );
}

export async function getDailyDepositsReport(
  request: ReportRequest
): Promise<DailyDepositsReport> {
  return apiRequest<DailyDepositsReport>(
    `/api/reports/daily-deposits?${buildReportQuery(request)}`
  );
}

export async function getDailyCancellationsReport(
  request: ReportRequest
): Promise<DailyCancellationsReport> {
  return apiRequest<DailyCancellationsReport>(
    `/api/reports/daily-cancellations?${buildReportQuery(request)}`
  );
}

export async function getLiveControlReport(
  request: ReportRequest
): Promise<LiveControlReport> {
  return apiRequest<LiveControlReport>(
    `/api/reports/live-control?${buildReportQuery(request)}`
  );
}

export async function getRemissionsReport(
  request: ReportRequest
): Promise<RemissionsReport> {
  return apiRequest<RemissionsReport>(
    `/api/reports/remissions?${buildReportQuery(request)}`
  );
}

export async function getMovementHistoryReport(
  request: MovementHistoryRequest
): Promise<MovementHistoryReport> {
  return apiRequest<MovementHistoryReport>(
    `/api/reports/movement-history?${buildMovementHistoryQuery(request)}`
  );
}
