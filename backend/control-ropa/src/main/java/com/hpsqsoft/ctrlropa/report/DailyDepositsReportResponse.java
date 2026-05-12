package com.hpsqsoft.ctrlropa.report;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class DailyDepositsReportResponse {

    private LocalDate date;
    private Long branchId;
    private String branchCode;
    private String branchName;

    private List<ScreenLine> screenLines;
    private List<PrintLine> printLines;

    private Summary summary;

    public DailyDepositsReportResponse(LocalDate date,
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

        private Long paymentId;
        private String customerName;
        private String method;
        private String reference;
        private BigDecimal amount;
        private String status;
        private String createdBy;
        private LocalDateTime createdAt;
        private String observation;

        public ScreenLine(Long paymentId,
                          String customerName,
                          String method,
                          String reference,
                          BigDecimal amount,
                          String status,
                          String createdBy,
                          LocalDateTime createdAt,
                          String observation) {
            this.paymentId = paymentId;
            this.customerName = customerName;
            this.method = method;
            this.reference = reference;
            this.amount = amount;
            this.status = status;
            this.createdBy = createdBy;
            this.createdAt = createdAt;
            this.observation = observation;
        }

        public Long getPaymentId() { return paymentId; }
        public String getCustomerName() { return customerName; }
        public String getMethod() { return method; }
        public String getReference() { return reference; }
        public BigDecimal getAmount() { return amount; }
        public String getStatus() { return status; }
        public String getCreatedBy() { return createdBy; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public String getObservation() { return observation; }
    }

    // ---------------- PRINT ----------------

    public static class PrintLine {

        private Integer rowNumber;
        private String customerName;
        private BigDecimal amount;
        private String method;
        private String reference;
        private String observation;

        public PrintLine(Integer rowNumber,
                         String customerName,
                         BigDecimal amount,
                         String method,
                         String reference,
                         String observation) {
            this.rowNumber = rowNumber;
            this.customerName = customerName;
            this.amount = amount;
            this.method = method;
            this.reference = reference;
            this.observation = observation;
        }

        public Integer getRowNumber() { return rowNumber; }
        public String getCustomerName() { return customerName; }
        public BigDecimal getAmount() { return amount; }
        public String getMethod() { return method; }
        public String getReference() { return reference; }
        public String getObservation() { return observation; }
    }

    // ---------------- SUMMARY ----------------

    public static class Summary {

        private BigDecimal totalDeposits;
        private Integer totalOperations;
        private BigDecimal averageDeposit;

        public Summary(BigDecimal totalDeposits,
                       Integer totalOperations,
                       BigDecimal averageDeposit) {
            this.totalDeposits = totalDeposits;
            this.totalOperations = totalOperations;
            this.averageDeposit = averageDeposit;
        }

        public BigDecimal getTotalDeposits() { return totalDeposits; }
        public Integer getTotalOperations() { return totalOperations; }
        public BigDecimal getAverageDeposit() { return averageDeposit; }
    }
}