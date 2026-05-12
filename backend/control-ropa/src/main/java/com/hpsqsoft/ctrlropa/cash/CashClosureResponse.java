package com.hpsqsoft.ctrlropa.cash;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class CashClosureResponse {

    private Long id;
    private Long branchId;
    private String branchCode;
    private String branchName;
    private LocalDate closureDate;
    private BigDecimal expectedCash;
    private BigDecimal expensesTotal;
    private BigDecimal deliveredCash;
    private BigDecimal difference;
    private String notes;
    private String status;
    private LocalDateTime createdAt;
    private Long createdByUserId;
    private LocalDateTime closedAt;
    private Long closedByUserId;
    private LocalDateTime cancelledAt;
    private Long cancelledByUserId;
    private String cancelReason;
    private List<ExpenseLine> expenses;

    public CashClosureResponse(Long id,
                               Long branchId,
                               String branchCode,
                               String branchName,
                               LocalDate closureDate,
                               BigDecimal expectedCash,
                               BigDecimal expensesTotal,
                               BigDecimal deliveredCash,
                               BigDecimal difference,
                               String notes,
                               String status,
                               LocalDateTime createdAt,
                               Long createdByUserId,
                               LocalDateTime closedAt,
                               Long closedByUserId,
                               LocalDateTime cancelledAt,
                               Long cancelledByUserId,
                               String cancelReason,
                               List<ExpenseLine> expenses) {
        this.id = id;
        this.branchId = branchId;
        this.branchCode = branchCode;
        this.branchName = branchName;
        this.closureDate = closureDate;
        this.expectedCash = expectedCash;
        this.expensesTotal = expensesTotal;
        this.deliveredCash = deliveredCash;
        this.difference = difference;
        this.notes = notes;
        this.status = status;
        this.createdAt = createdAt;
        this.createdByUserId = createdByUserId;
        this.closedAt = closedAt;
        this.closedByUserId = closedByUserId;
        this.cancelledAt = cancelledAt;
        this.cancelledByUserId = cancelledByUserId;
        this.cancelReason = cancelReason;
        this.expenses = expenses;
    }

    public Long getId() { return id; }
    public Long getBranchId() { return branchId; }
    public String getBranchCode() { return branchCode; }
    public String getBranchName() { return branchName; }
    public LocalDate getClosureDate() { return closureDate; }
    public BigDecimal getExpectedCash() { return expectedCash; }
    public BigDecimal getExpensesTotal() { return expensesTotal; }
    public BigDecimal getDeliveredCash() { return deliveredCash; }
    public BigDecimal getDifference() { return difference; }
    public String getNotes() { return notes; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public Long getCreatedByUserId() { return createdByUserId; }
    public LocalDateTime getClosedAt() { return closedAt; }
    public Long getClosedByUserId() { return closedByUserId; }
    public LocalDateTime getCancelledAt() { return cancelledAt; }
    public Long getCancelledByUserId() { return cancelledByUserId; }
    public String getCancelReason() { return cancelReason; }
    public List<ExpenseLine> getExpenses() { return expenses; }

    public static class ExpenseLine {

        private Long id;
        private String concept;
        private BigDecimal amount;
        private String notes;
        private String status;
        private LocalDateTime createdAt;
        private Long createdByUserId;
        private LocalDateTime cancelledAt;
        private Long cancelledByUserId;
        private String cancelReason;

        public ExpenseLine(Long id,
                           String concept,
                           BigDecimal amount,
                           String notes,
                           String status,
                           LocalDateTime createdAt,
                           Long createdByUserId,
                           LocalDateTime cancelledAt,
                           Long cancelledByUserId,
                           String cancelReason) {
            this.id = id;
            this.concept = concept;
            this.amount = amount;
            this.notes = notes;
            this.status = status;
            this.createdAt = createdAt;
            this.createdByUserId = createdByUserId;
            this.cancelledAt = cancelledAt;
            this.cancelledByUserId = cancelledByUserId;
            this.cancelReason = cancelReason;
        }

        public Long getId() { return id; }
        public String getConcept() { return concept; }
        public BigDecimal getAmount() { return amount; }
        public String getNotes() { return notes; }
        public String getStatus() { return status; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public Long getCreatedByUserId() { return createdByUserId; }
        public LocalDateTime getCancelledAt() { return cancelledAt; }
        public Long getCancelledByUserId() { return cancelledByUserId; }
        public String getCancelReason() { return cancelReason; }
    }
}