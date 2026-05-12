package com.hpsqsoft.ctrlropa.report;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class DailyStoreReportResponse {

    private LocalDate date;
    private Long branchId;
    private String branchCode;
    private String branchName;

    private List<ScreenLine> screenLines;
    private List<PrintLine> printLines;

    private PaymentSummary paymentSummary;
    private OperationSummary operationSummary;
    private CashSummary cashSummary;

    public DailyStoreReportResponse(LocalDate date,
                                    Long branchId,
                                    String branchCode,
                                    String branchName,
                                    List<ScreenLine> screenLines,
                                    List<PrintLine> printLines,
                                    PaymentSummary paymentSummary,
                                    OperationSummary operationSummary,
                                    CashSummary cashSummary) {
        this.date = date;
        this.branchId = branchId;
        this.branchCode = branchCode;
        this.branchName = branchName;
        this.screenLines = screenLines;
        this.printLines = printLines;
        this.paymentSummary = paymentSummary;
        this.operationSummary = operationSummary;
        this.cashSummary = cashSummary;
    }

    public LocalDate getDate() {
        return date;
    }

    public Long getBranchId() {
        return branchId;
    }

    public String getBranchCode() {
        return branchCode;
    }

    public String getBranchName() {
        return branchName;
    }

    public List<ScreenLine> getScreenLines() {
        return screenLines;
    }

    public List<PrintLine> getPrintLines() {
        return printLines;
    }

    public PaymentSummary getPaymentSummary() {
        return paymentSummary;
    }

    public OperationSummary getOperationSummary() {
        return operationSummary;
    }

    public CashSummary getCashSummary() {
        return cashSummary;
    }

    public static class ScreenLine {

        private String sourceType;
        private Long sourceId;
        private String folio;
        private String customerName;
        private String channelCode;
        private String operationType;
        private BigDecimal total;
        private BigDecimal paid;
        private BigDecimal pending;
        private BigDecimal cash;
        private BigDecimal transfer;
        private BigDecimal card;
        private BigDecimal balanceApplied;
        private String paymentStatus;
        private String status;
        private String attendedBy;
        private LocalDateTime createdAt;
        private String observation;

        public ScreenLine(String sourceType,
                          Long sourceId,
                          String folio,
                          String customerName,
                          String channelCode,
                          String operationType,
                          BigDecimal total,
                          BigDecimal paid,
                          BigDecimal pending,
                          BigDecimal cash,
                          BigDecimal transfer,
                          BigDecimal card,
                          BigDecimal balanceApplied,
                          String paymentStatus,
                          String status,
                          String attendedBy,
                          LocalDateTime createdAt,
                          String observation) {
            this.sourceType = sourceType;
            this.sourceId = sourceId;
            this.folio = folio;
            this.customerName = customerName;
            this.channelCode = channelCode;
            this.operationType = operationType;
            this.total = total;
            this.paid = paid;
            this.pending = pending;
            this.cash = cash;
            this.transfer = transfer;
            this.card = card;
            this.balanceApplied = balanceApplied;
            this.paymentStatus = paymentStatus;
            this.status = status;
            this.attendedBy = attendedBy;
            this.createdAt = createdAt;
            this.observation = observation;
        }

        public String getSourceType() { return sourceType; }
        public Long getSourceId() { return sourceId; }
        public String getFolio() { return folio; }
        public String getCustomerName() { return customerName; }
        public String getChannelCode() { return channelCode; }
        public String getOperationType() { return operationType; }
        public BigDecimal getTotal() { return total; }
        public BigDecimal getPaid() { return paid; }
        public BigDecimal getPending() { return pending; }
        public BigDecimal getCash() { return cash; }
        public BigDecimal getTransfer() { return transfer; }
        public BigDecimal getCard() { return card; }
        public BigDecimal getBalanceApplied() { return balanceApplied; }
        public String getPaymentStatus() { return paymentStatus; }
        public String getStatus() { return status; }
        public String getAttendedBy() { return attendedBy; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public String getObservation() { return observation; }
    }

    public static class PrintLine {

        private Integer rowNumber;
        private String folio;
        private String customerName;
        private BigDecimal total;
        private BigDecimal paid;
        private String paymentText;
        private String attendedBy;
        private String observation;

        public PrintLine(Integer rowNumber,
                         String folio,
                         String customerName,
                         BigDecimal total,
                         BigDecimal paid,
                         String paymentText,
                         String attendedBy,
                         String observation) {
            this.rowNumber = rowNumber;
            this.folio = folio;
            this.customerName = customerName;
            this.total = total;
            this.paid = paid;
            this.paymentText = paymentText;
            this.attendedBy = attendedBy;
            this.observation = observation;
        }

        public Integer getRowNumber() { return rowNumber; }
        public String getFolio() { return folio; }
        public String getCustomerName() { return customerName; }
        public BigDecimal getTotal() { return total; }
        public BigDecimal getPaid() { return paid; }
        public String getPaymentText() { return paymentText; }
        public String getAttendedBy() { return attendedBy; }
        public String getObservation() { return observation; }
    }

    public static class PaymentSummary {

        private BigDecimal cash;
        private BigDecimal transfer;
        private BigDecimal card;
        private BigDecimal balanceApplied;
        private BigDecimal balanceGenerated;
        private BigDecimal totalReceived;

        public PaymentSummary(BigDecimal cash,
                              BigDecimal transfer,
                              BigDecimal card,
                              BigDecimal balanceApplied,
                              BigDecimal balanceGenerated,
                              BigDecimal totalReceived) {
            this.cash = cash;
            this.transfer = transfer;
            this.card = card;
            this.balanceApplied = balanceApplied;
            this.balanceGenerated = balanceGenerated;
            this.totalReceived = totalReceived;
        }

        public BigDecimal getCash() { return cash; }
        public BigDecimal getTransfer() { return transfer; }
        public BigDecimal getCard() { return card; }
        public BigDecimal getBalanceApplied() { return balanceApplied; }
        public BigDecimal getBalanceGenerated() { return balanceGenerated; }
        public BigDecimal getTotalReceived() { return totalReceived; }
    }

    public static class OperationSummary {

        private BigDecimal activeSalesTotal;
        private BigDecimal activeReservationsTotal;
        private BigDecimal cancelledSalesTotal;
        private BigDecimal cancelledReservationsTotal;
        private BigDecimal processedRefundsTotal;
        private Integer activeSalesCount;
        private Integer activeReservationsCount;
        private Integer cancelledSalesCount;
        private Integer cancelledReservationsCount;
        private Integer refundsCount;

        public OperationSummary(BigDecimal activeSalesTotal,
                                BigDecimal activeReservationsTotal,
                                BigDecimal cancelledSalesTotal,
                                BigDecimal cancelledReservationsTotal,
                                BigDecimal processedRefundsTotal,
                                Integer activeSalesCount,
                                Integer activeReservationsCount,
                                Integer cancelledSalesCount,
                                Integer cancelledReservationsCount,
                                Integer refundsCount) {
            this.activeSalesTotal = activeSalesTotal;
            this.activeReservationsTotal = activeReservationsTotal;
            this.cancelledSalesTotal = cancelledSalesTotal;
            this.cancelledReservationsTotal = cancelledReservationsTotal;
            this.processedRefundsTotal = processedRefundsTotal;
            this.activeSalesCount = activeSalesCount;
            this.activeReservationsCount = activeReservationsCount;
            this.cancelledSalesCount = cancelledSalesCount;
            this.cancelledReservationsCount = cancelledReservationsCount;
            this.refundsCount = refundsCount;
        }

        public BigDecimal getActiveSalesTotal() { return activeSalesTotal; }
        public BigDecimal getActiveReservationsTotal() { return activeReservationsTotal; }
        public BigDecimal getCancelledSalesTotal() { return cancelledSalesTotal; }
        public BigDecimal getCancelledReservationsTotal() { return cancelledReservationsTotal; }
        public BigDecimal getProcessedRefundsTotal() { return processedRefundsTotal; }
        public Integer getActiveSalesCount() { return activeSalesCount; }
        public Integer getActiveReservationsCount() { return activeReservationsCount; }
        public Integer getCancelledSalesCount() { return cancelledSalesCount; }
        public Integer getCancelledReservationsCount() { return cancelledReservationsCount; }
        public Integer getRefundsCount() { return refundsCount; }
    }

    public static class CashSummary {

        private BigDecimal expectedCash;
        private BigDecimal expenses;
        private BigDecimal deliveredCash;
        private BigDecimal difference;

        public CashSummary(BigDecimal expectedCash,
                           BigDecimal expenses,
                           BigDecimal deliveredCash,
                           BigDecimal difference) {
            this.expectedCash = expectedCash;
            this.expenses = expenses;
            this.deliveredCash = deliveredCash;
            this.difference = difference;
        }

        public BigDecimal getExpectedCash() { return expectedCash; }
        public BigDecimal getExpenses() { return expenses; }
        public BigDecimal getDeliveredCash() { return deliveredCash; }
        public BigDecimal getDifference() { return difference; }
    }
}