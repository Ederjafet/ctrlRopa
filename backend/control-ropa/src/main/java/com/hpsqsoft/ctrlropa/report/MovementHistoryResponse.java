package com.hpsqsoft.ctrlropa.report;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class MovementHistoryResponse {

    private LocalDate startDate;
    private LocalDate endDate;
    private Long branchId;
    private String branchCode;
    private String branchName;
    private String movementType;
    private List<MovementLine> screenLines;
    private Summary summary;

    public MovementHistoryResponse(LocalDate startDate,
                                   LocalDate endDate,
                                   Long branchId,
                                   String branchCode,
                                   String branchName,
                                   String movementType,
                                   List<MovementLine> screenLines,
                                   Summary summary) {
        this.startDate = startDate;
        this.endDate = endDate;
        this.branchId = branchId;
        this.branchCode = branchCode;
        this.branchName = branchName;
        this.movementType = movementType;
        this.screenLines = screenLines;
        this.summary = summary;
    }

    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
    public Long getBranchId() { return branchId; }
    public String getBranchCode() { return branchCode; }
    public String getBranchName() { return branchName; }
    public String getMovementType() { return movementType; }
    public List<MovementLine> getScreenLines() { return screenLines; }
    public Summary getSummary() { return summary; }

    public static class MovementLine {
        private String category;
        private String eventType;
        private Long sourceId;
        private LocalDateTime eventAt;
        private Long branchId;
        private String branchName;
        private Long customerId;
        private String customerName;
        private String itemCode;
        private BigDecimal amount;
        private String status;
        private String reference;
        private Long userId;
        private String userName;
        private String detail;

        public MovementLine(String category,
                            String eventType,
                            Long sourceId,
                            LocalDateTime eventAt,
                            Long branchId,
                            String branchName,
                            Long customerId,
                            String customerName,
                            String itemCode,
                            BigDecimal amount,
                            String status,
                            String reference,
                            Long userId,
                            String userName,
                            String detail) {
            this.category = category;
            this.eventType = eventType;
            this.sourceId = sourceId;
            this.eventAt = eventAt;
            this.branchId = branchId;
            this.branchName = branchName;
            this.customerId = customerId;
            this.customerName = customerName;
            this.itemCode = itemCode;
            this.amount = amount;
            this.status = status;
            this.reference = reference;
            this.userId = userId;
            this.userName = userName;
            this.detail = detail;
        }

        public String getCategory() { return category; }
        public String getEventType() { return eventType; }
        public Long getSourceId() { return sourceId; }
        public LocalDateTime getEventAt() { return eventAt; }
        public Long getBranchId() { return branchId; }
        public String getBranchName() { return branchName; }
        public Long getCustomerId() { return customerId; }
        public String getCustomerName() { return customerName; }
        public String getItemCode() { return itemCode; }
        public BigDecimal getAmount() { return amount; }
        public String getStatus() { return status; }
        public String getReference() { return reference; }
        public Long getUserId() { return userId; }
        public String getUserName() { return userName; }
        public String getDetail() { return detail; }
    }

    public static class Summary {
        private Integer totalMovements;
        private Integer financialMovements;
        private Integer nonFinancialMovements;
        private BigDecimal financialTotal;

        public Summary(Integer totalMovements,
                       Integer financialMovements,
                       Integer nonFinancialMovements,
                       BigDecimal financialTotal) {
            this.totalMovements = totalMovements;
            this.financialMovements = financialMovements;
            this.nonFinancialMovements = nonFinancialMovements;
            this.financialTotal = financialTotal;
        }

        public Integer getTotalMovements() { return totalMovements; }
        public Integer getFinancialMovements() { return financialMovements; }
        public Integer getNonFinancialMovements() { return nonFinancialMovements; }
        public BigDecimal getFinancialTotal() { return financialTotal; }
    }
}
