package com.hpsqsoft.ctrlropa.dashboard;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class SellerDashboardResponse {

    private LocalDate date;
    private Long branchId;
    private String branchCode;
    private String branchName;

    private BigDecimal todaySales;
    private BigDecimal todayReservations;
    private BigDecimal todayPayments;
    private BigDecimal todayCash;
    private BigDecimal pendingCollections;

    private Integer salesCount;
    private Integer reservationsCount;
    private Integer paymentsCount;
    private Integer pendingPackages;
    private Integer pendingShipments;
    private Integer liveReservations;
    private Integer lowStockItems;

    private List<ActionItem> actionItems;

    public SellerDashboardResponse(LocalDate date,
                                   Long branchId,
                                   String branchCode,
                                   String branchName,
                                   BigDecimal todaySales,
                                   BigDecimal todayReservations,
                                   BigDecimal todayPayments,
                                   BigDecimal todayCash,
                                   BigDecimal pendingCollections,
                                   Integer salesCount,
                                   Integer reservationsCount,
                                   Integer paymentsCount,
                                   Integer pendingPackages,
                                   Integer pendingShipments,
                                   Integer liveReservations,
                                   Integer lowStockItems,
                                   List<ActionItem> actionItems) {
        this.date = date;
        this.branchId = branchId;
        this.branchCode = branchCode;
        this.branchName = branchName;
        this.todaySales = todaySales;
        this.todayReservations = todayReservations;
        this.todayPayments = todayPayments;
        this.todayCash = todayCash;
        this.pendingCollections = pendingCollections;
        this.salesCount = salesCount;
        this.reservationsCount = reservationsCount;
        this.paymentsCount = paymentsCount;
        this.pendingPackages = pendingPackages;
        this.pendingShipments = pendingShipments;
        this.liveReservations = liveReservations;
        this.lowStockItems = lowStockItems;
        this.actionItems = actionItems;
    }

    public LocalDate getDate() { return date; }
    public Long getBranchId() { return branchId; }
    public String getBranchCode() { return branchCode; }
    public String getBranchName() { return branchName; }

    public BigDecimal getTodaySales() { return todaySales; }
    public BigDecimal getTodayReservations() { return todayReservations; }
    public BigDecimal getTodayPayments() { return todayPayments; }
    public BigDecimal getTodayCash() { return todayCash; }
    public BigDecimal getPendingCollections() { return pendingCollections; }

    public Integer getSalesCount() { return salesCount; }
    public Integer getReservationsCount() { return reservationsCount; }
    public Integer getPaymentsCount() { return paymentsCount; }
    public Integer getPendingPackages() { return pendingPackages; }
    public Integer getPendingShipments() { return pendingShipments; }
    public Integer getLiveReservations() { return liveReservations; }
    public Integer getLowStockItems() { return lowStockItems; }

    public List<ActionItem> getActionItems() { return actionItems; }

    public static class ActionItem {

        private String code;
        private String label;
        private Integer count;
        private String severity;

        public ActionItem(String code, String label, Integer count, String severity) {
            this.code = code;
            this.label = label;
            this.count = count;
            this.severity = severity;
        }

        public String getCode() { return code; }
        public String getLabel() { return label; }
        public Integer getCount() { return count; }
        public String getSeverity() { return severity; }
    }
}