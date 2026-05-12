package com.hpsqsoft.ctrlropa.report;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class LiveControlReportResponse {

    private LocalDate date;
    private Long branchId;
    private String branchCode;
    private String branchName;

    private List<ScreenLine> screenLines;
    private List<PrintLine> printLines;
    private Summary summary;

    public LiveControlReportResponse(LocalDate date,
                                     Long branchId,
                                     String branchCode,
                                     String branchName,
                                     List<ScreenLine> screenLines,
                                     List<PrintLine> printLines,
                                     Summary summary) {
        this.date = date;
        this.branchId = branchId;
        this.branchCode = branchCode;
        this.branchName = branchName;
        this.screenLines = screenLines;
        this.printLines = printLines;
        this.summary = summary;
    }

    public LocalDate getDate() { return date; }
    public Long getBranchId() { return branchId; }
    public String getBranchCode() { return branchCode; }
    public String getBranchName() { return branchName; }
    public List<ScreenLine> getScreenLines() { return screenLines; }
    public List<PrintLine> getPrintLines() { return printLines; }
    public Summary getSummary() { return summary; }

    // ---------------- SCREEN ----------------

    public static class ScreenLine {

        private Long packageId;
        private String packageFolio;

        private Long customerId;
        private String customerName;

        private Integer pieces;

        private BigDecimal total;
        private BigDecimal paid;
        private BigDecimal pending;

        private String paymentStatus;
        private String packageStatus;
        private String orderStatus;

        private LocalDateTime createdAt;
        private LocalDateTime settledAt;

        public ScreenLine(Long packageId,
                          String packageFolio,
                          Long customerId,
                          String customerName,
                          Integer pieces,
                          BigDecimal total,
                          BigDecimal paid,
                          BigDecimal pending,
                          String paymentStatus,
                          String packageStatus,
                          String orderStatus,
                          LocalDateTime createdAt,
                          LocalDateTime settledAt) {
            this.packageId = packageId;
            this.packageFolio = packageFolio;
            this.customerId = customerId;
            this.customerName = customerName;
            this.pieces = pieces;
            this.total = total;
            this.paid = paid;
            this.pending = pending;
            this.paymentStatus = paymentStatus;
            this.packageStatus = packageStatus;
            this.orderStatus = orderStatus;
            this.createdAt = createdAt;
            this.settledAt = settledAt;
        }

        public Long getPackageId() { return packageId; }
        public String getPackageFolio() { return packageFolio; }
        public Long getCustomerId() { return customerId; }
        public String getCustomerName() { return customerName; }
        public Integer getPieces() { return pieces; }
        public BigDecimal getTotal() { return total; }
        public BigDecimal getPaid() { return paid; }
        public BigDecimal getPending() { return pending; }
        public String getPaymentStatus() { return paymentStatus; }
        public String getPackageStatus() { return packageStatus; }
        public String getOrderStatus() { return orderStatus; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public LocalDateTime getSettledAt() { return settledAt; }
    }

    // ---------------- PRINT ----------------

    public static class PrintLine {

        private Integer rowNumber;
        private String packageFolio;
        private String customerName;
        private Integer pieces;
        private BigDecimal total;
        private String status;
        private String settledDate;

        public PrintLine(Integer rowNumber,
                         String packageFolio,
                         String customerName,
                         Integer pieces,
                         BigDecimal total,
                         String status,
                         String settledDate) {
            this.rowNumber = rowNumber;
            this.packageFolio = packageFolio;
            this.customerName = customerName;
            this.pieces = pieces;
            this.total = total;
            this.status = status;
            this.settledDate = settledDate;
        }

        public Integer getRowNumber() { return rowNumber; }
        public String getPackageFolio() { return packageFolio; }
        public String getCustomerName() { return customerName; }
        public Integer getPieces() { return pieces; }
        public BigDecimal getTotal() { return total; }
        public String getStatus() { return status; }
        public String getSettledDate() { return settledDate; }
    }

    // ---------------- SUMMARY ----------------

    public static class Summary {

        private Integer totalPackages;
        private Integer totalPieces;

        private BigDecimal totalAmount;
        private BigDecimal totalPaid;
        private BigDecimal totalPending;

        private Integer settledPackages;
        private Integer pendingPackages;

        public Summary(Integer totalPackages,
                       Integer totalPieces,
                       BigDecimal totalAmount,
                       BigDecimal totalPaid,
                       BigDecimal totalPending,
                       Integer settledPackages,
                       Integer pendingPackages) {
            this.totalPackages = totalPackages;
            this.totalPieces = totalPieces;
            this.totalAmount = totalAmount;
            this.totalPaid = totalPaid;
            this.totalPending = totalPending;
            this.settledPackages = settledPackages;
            this.pendingPackages = pendingPackages;
        }

        public Integer getTotalPackages() { return totalPackages; }
        public Integer getTotalPieces() { return totalPieces; }
        public BigDecimal getTotalAmount() { return totalAmount; }
        public BigDecimal getTotalPaid() { return totalPaid; }
        public BigDecimal getTotalPending() { return totalPending; }
        public Integer getSettledPackages() { return settledPackages; }
        public Integer getPendingPackages() { return pendingPackages; }
    }
}