package com.hpsqsoft.ctrlropa.report;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class DailyCancellationsReportResponse {

    private LocalDate date;
    private Long branchId;
    private String branchCode;
    private String branchName;

    private List<ScreenLine> screenLines;
    private List<PrintLine> printLines;
    private Summary summary;

    public DailyCancellationsReportResponse(LocalDate date,
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

    public static class ScreenLine {

        private String sourceType;
        private Long sourceId;
        private String folio;
        private Long customerId;
        private String customerName;
        private Long itemId;
        private String itemCode;
        private BigDecimal total;
        private String status;
        private LocalDateTime cancelledAt;
        private Long cancelledByUserId;
        private String cancelledByUserName;
        private String cancelReason;
        private String refundStatus;
        private BigDecimal refundAmount;

        public ScreenLine(String sourceType,
                          Long sourceId,
                          String folio,
                          Long customerId,
                          String customerName,
                          Long itemId,
                          String itemCode,
                          BigDecimal total,
                          String status,
                          LocalDateTime cancelledAt,
                          Long cancelledByUserId,
                          String cancelledByUserName,
                          String cancelReason,
                          String refundStatus,
                          BigDecimal refundAmount) {
            this.sourceType = sourceType;
            this.sourceId = sourceId;
            this.folio = folio;
            this.customerId = customerId;
            this.customerName = customerName;
            this.itemId = itemId;
            this.itemCode = itemCode;
            this.total = total;
            this.status = status;
            this.cancelledAt = cancelledAt;
            this.cancelledByUserId = cancelledByUserId;
            this.cancelledByUserName = cancelledByUserName;
            this.cancelReason = cancelReason;
            this.refundStatus = refundStatus;
            this.refundAmount = refundAmount;
        }

        public String getSourceType() { return sourceType; }
        public Long getSourceId() { return sourceId; }
        public String getFolio() { return folio; }
        public Long getCustomerId() { return customerId; }
        public String getCustomerName() { return customerName; }
        public Long getItemId() { return itemId; }
        public String getItemCode() { return itemCode; }
        public BigDecimal getTotal() { return total; }
        public String getStatus() { return status; }
        public LocalDateTime getCancelledAt() { return cancelledAt; }
        public Long getCancelledByUserId() { return cancelledByUserId; }
        public String getCancelledByUserName() { return cancelledByUserName; }
        public String getCancelReason() { return cancelReason; }
        public String getRefundStatus() { return refundStatus; }
        public BigDecimal getRefundAmount() { return refundAmount; }
    }

    public static class PrintLine {

        private Integer rowNumber;
        private String folio;
        private String customerName;
        private BigDecimal total;
        private Integer pieces;
        private String attendedBy;
        private String reason;

        public PrintLine(Integer rowNumber,
                         String folio,
                         String customerName,
                         BigDecimal total,
                         Integer pieces,
                         String attendedBy,
                         String reason) {
            this.rowNumber = rowNumber;
            this.folio = folio;
            this.customerName = customerName;
            this.total = total;
            this.pieces = pieces;
            this.attendedBy = attendedBy;
            this.reason = reason;
        }

        public Integer getRowNumber() { return rowNumber; }
        public String getFolio() { return folio; }
        public String getCustomerName() { return customerName; }
        public BigDecimal getTotal() { return total; }
        public Integer getPieces() { return pieces; }
        public String getAttendedBy() { return attendedBy; }
        public String getReason() { return reason; }
    }

    public static class Summary {

        private BigDecimal totalCancelled;
        private Integer totalCancellations;
        private Integer cancelledSales;
        private Integer cancelledReservations;
        private Integer processedRefunds;
        private BigDecimal processedRefundAmount;

        public Summary(BigDecimal totalCancelled,
                       Integer totalCancellations,
                       Integer cancelledSales,
                       Integer cancelledReservations,
                       Integer processedRefunds,
                       BigDecimal processedRefundAmount) {
            this.totalCancelled = totalCancelled;
            this.totalCancellations = totalCancellations;
            this.cancelledSales = cancelledSales;
            this.cancelledReservations = cancelledReservations;
            this.processedRefunds = processedRefunds;
            this.processedRefundAmount = processedRefundAmount;
        }

        public BigDecimal getTotalCancelled() { return totalCancelled; }
        public Integer getTotalCancellations() { return totalCancellations; }
        public Integer getCancelledSales() { return cancelledSales; }
        public Integer getCancelledReservations() { return cancelledReservations; }
        public Integer getProcessedRefunds() { return processedRefunds; }
        public BigDecimal getProcessedRefundAmount() { return processedRefundAmount; }
    }
}