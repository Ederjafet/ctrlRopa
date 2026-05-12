package com.hpsqsoft.ctrlropa.dashboard;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class UserDashboardResponse {

    private LocalDate date;
    private List<String> roles;
    private List<BranchDashboard> branches;

    public UserDashboardResponse(LocalDate date, List<String> roles, List<BranchDashboard> branches) {
        this.date = date;
        this.roles = roles;
        this.branches = branches;
    }

    public LocalDate getDate() { return date; }
    public List<String> getRoles() { return roles; }
    public List<BranchDashboard> getBranches() { return branches; }

    public static class BranchDashboard {
        private Long branchId;
        private String branchCode;
        private String branchName;
        private boolean primary;
        private MoneySummary money;
        private OperationSummary operations;
        private InventorySummary inventory;
        private PendingSummary pending;
        private List<ActionItem> actions;

        public BranchDashboard(Long branchId,
                               String branchCode,
                               String branchName,
                               boolean primary,
                               MoneySummary money,
                               OperationSummary operations,
                               InventorySummary inventory,
                               PendingSummary pending,
                               List<ActionItem> actions) {
            this.branchId = branchId;
            this.branchCode = branchCode;
            this.branchName = branchName;
            this.primary = primary;
            this.money = money;
            this.operations = operations;
            this.inventory = inventory;
            this.pending = pending;
            this.actions = actions;
        }

        public Long getBranchId() { return branchId; }
        public String getBranchCode() { return branchCode; }
        public String getBranchName() { return branchName; }
        public boolean isPrimary() { return primary; }
        public MoneySummary getMoney() { return money; }
        public OperationSummary getOperations() { return operations; }
        public InventorySummary getInventory() { return inventory; }
        public PendingSummary getPending() { return pending; }
        public List<ActionItem> getActions() { return actions; }
    }

    public static class MoneySummary {
        private BigDecimal todaySales;
        private BigDecimal todayReservations;
        private BigDecimal todayPayments;
        private BigDecimal todayCash;
        private BigDecimal pendingCollections;
        private BigDecimal pendingRefunds;

        public MoneySummary(BigDecimal todaySales,
                            BigDecimal todayReservations,
                            BigDecimal todayPayments,
                            BigDecimal todayCash,
                            BigDecimal pendingCollections,
                            BigDecimal pendingRefunds) {
            this.todaySales = todaySales;
            this.todayReservations = todayReservations;
            this.todayPayments = todayPayments;
            this.todayCash = todayCash;
            this.pendingCollections = pendingCollections;
            this.pendingRefunds = pendingRefunds;
        }

        public BigDecimal getTodaySales() { return todaySales; }
        public BigDecimal getTodayReservations() { return todayReservations; }
        public BigDecimal getTodayPayments() { return todayPayments; }
        public BigDecimal getTodayCash() { return todayCash; }
        public BigDecimal getPendingCollections() { return pendingCollections; }
        public BigDecimal getPendingRefunds() { return pendingRefunds; }
    }

    public static class OperationSummary {
        private Integer todaySalesCount;
        private Integer todayReservationsCount;
        private Integer todayPaymentsCount;
        private Integer activeCustomersToday;
        private Integer activeLives;

        public OperationSummary(Integer todaySalesCount,
                                Integer todayReservationsCount,
                                Integer todayPaymentsCount,
                                Integer activeCustomersToday,
                                Integer activeLives) {
            this.todaySalesCount = todaySalesCount;
            this.todayReservationsCount = todayReservationsCount;
            this.todayPaymentsCount = todayPaymentsCount;
            this.activeCustomersToday = activeCustomersToday;
            this.activeLives = activeLives;
        }

        public Integer getTodaySalesCount() { return todaySalesCount; }
        public Integer getTodayReservationsCount() { return todayReservationsCount; }
        public Integer getTodayPaymentsCount() { return todayPaymentsCount; }
        public Integer getActiveCustomersToday() { return activeCustomersToday; }
        public Integer getActiveLives() { return activeLives; }
    }

    public static class InventorySummary {
        private Integer availableItems;
        private Integer reservedItems;
        private Integer soldItemsToday;
        private Integer announcedBatches;
        private Integer receivedBatches;

        public InventorySummary(Integer availableItems,
                                Integer reservedItems,
                                Integer soldItemsToday,
                                Integer announcedBatches,
                                Integer receivedBatches) {
            this.availableItems = availableItems;
            this.reservedItems = reservedItems;
            this.soldItemsToday = soldItemsToday;
            this.announcedBatches = announcedBatches;
            this.receivedBatches = receivedBatches;
        }

        public Integer getAvailableItems() { return availableItems; }
        public Integer getReservedItems() { return reservedItems; }
        public Integer getSoldItemsToday() { return soldItemsToday; }
        public Integer getAnnouncedBatches() { return announcedBatches; }
        public Integer getReceivedBatches() { return receivedBatches; }
    }

    public static class PendingSummary {
        private Integer packagesToPrepare;
        private Integer shipmentsOpen;
        private Integer transfersToSend;
        private Integer transfersToReceive;
        private Integer refundsToApprove;
        private Integer refundsToProcess;
        private Integer incidentsOpen;
        private Integer ordersOpen;

        public PendingSummary(Integer packagesToPrepare,
                              Integer shipmentsOpen,
                              Integer transfersToSend,
                              Integer transfersToReceive,
                              Integer refundsToApprove,
                              Integer refundsToProcess,
                              Integer incidentsOpen,
                              Integer ordersOpen) {
            this.packagesToPrepare = packagesToPrepare;
            this.shipmentsOpen = shipmentsOpen;
            this.transfersToSend = transfersToSend;
            this.transfersToReceive = transfersToReceive;
            this.refundsToApprove = refundsToApprove;
            this.refundsToProcess = refundsToProcess;
            this.incidentsOpen = incidentsOpen;
            this.ordersOpen = ordersOpen;
        }

        public Integer getPackagesToPrepare() { return packagesToPrepare; }
        public Integer getShipmentsOpen() { return shipmentsOpen; }
        public Integer getTransfersToSend() { return transfersToSend; }
        public Integer getTransfersToReceive() { return transfersToReceive; }
        public Integer getRefundsToApprove() { return refundsToApprove; }
        public Integer getRefundsToProcess() { return refundsToProcess; }
        public Integer getIncidentsOpen() { return incidentsOpen; }
        public Integer getOrdersOpen() { return ordersOpen; }
    }

    public static class ActionItem {
        private String label;
        private Integer count;
        private String severity;
        private String route;

        public ActionItem(String label, Integer count, String severity, String route) {
            this.label = label;
            this.count = count;
            this.severity = severity;
            this.route = route;
        }

        public String getLabel() { return label; }
        public Integer getCount() { return count; }
        public String getSeverity() { return severity; }
        public String getRoute() { return route; }
    }
}
