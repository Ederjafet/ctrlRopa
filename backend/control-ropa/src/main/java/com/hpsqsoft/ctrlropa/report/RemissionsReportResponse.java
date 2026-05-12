package com.hpsqsoft.ctrlropa.report;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class RemissionsReportResponse {

    private LocalDate date;
    private Long branchId;
    private String branchCode;
    private String branchName;

    private List<ScreenLine> screenLines;
    private List<PrintLine> printLines;
    private Summary summary;

    public RemissionsReportResponse(LocalDate date,
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
        private String itemCode;
        private String qrCode;
        private String customerName;
        private String productType;
        private String brand;
        private String size;
        private BigDecimal price;
        private String channelCode;
        private String packageFolio;
        private String paymentStatus;
        private BigDecimal paid;
        private BigDecimal pending;
        private LocalDateTime createdAt;
        private String sellerName;

        public ScreenLine(String sourceType,
                          Long sourceId,
                          String itemCode,
                          String qrCode,
                          String customerName,
                          String productType,
                          String brand,
                          String size,
                          BigDecimal price,
                          String channelCode,
                          String packageFolio,
                          String paymentStatus,
                          BigDecimal paid,
                          BigDecimal pending,
                          LocalDateTime createdAt,
                          String sellerName) {
            this.sourceType = sourceType;
            this.sourceId = sourceId;
            this.itemCode = itemCode;
            this.qrCode = qrCode;
            this.customerName = customerName;
            this.productType = productType;
            this.brand = brand;
            this.size = size;
            this.price = price;
            this.channelCode = channelCode;
            this.packageFolio = packageFolio;
            this.paymentStatus = paymentStatus;
            this.paid = paid;
            this.pending = pending;
            this.createdAt = createdAt;
            this.sellerName = sellerName;
        }

        public String getSourceType() { return sourceType; }
        public Long getSourceId() { return sourceId; }
        public String getItemCode() { return itemCode; }
        public String getQrCode() { return qrCode; }
        public String getCustomerName() { return customerName; }
        public String getProductType() { return productType; }
        public String getBrand() { return brand; }
        public String getSize() { return size; }
        public BigDecimal getPrice() { return price; }
        public String getChannelCode() { return channelCode; }
        public String getPackageFolio() { return packageFolio; }
        public String getPaymentStatus() { return paymentStatus; }
        public BigDecimal getPaid() { return paid; }
        public BigDecimal getPending() { return pending; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public String getSellerName() { return sellerName; }
    }

    public static class PrintLine {

        private Integer rowNumber;
        private String folio;
        private String customerName;
        private String description;
        private String brand;
        private String size;
        private BigDecimal price;
        private BigDecimal paid;
        private BigDecimal pending;
        private String attendedBy;
        private String deliveryInfo;

        public PrintLine(Integer rowNumber,
                         String folio,
                         String customerName,
                         String description,
                         String brand,
                         String size,
                         BigDecimal price,
                         BigDecimal paid,
                         BigDecimal pending,
                         String attendedBy,
                         String deliveryInfo) {
            this.rowNumber = rowNumber;
            this.folio = folio;
            this.customerName = customerName;
            this.description = description;
            this.brand = brand;
            this.size = size;
            this.price = price;
            this.paid = paid;
            this.pending = pending;
            this.attendedBy = attendedBy;
            this.deliveryInfo = deliveryInfo;
        }

        public Integer getRowNumber() { return rowNumber; }
        public String getFolio() { return folio; }
        public String getCustomerName() { return customerName; }
        public String getDescription() { return description; }
        public String getBrand() { return brand; }
        public String getSize() { return size; }
        public BigDecimal getPrice() { return price; }
        public BigDecimal getPaid() { return paid; }
        public BigDecimal getPending() { return pending; }
        public String getAttendedBy() { return attendedBy; }
        public String getDeliveryInfo() { return deliveryInfo; }
    }

    public static class Summary {

        private Integer totalPieces;
        private BigDecimal totalAmount;
        private BigDecimal totalPaid;
        private BigDecimal totalPending;
        private BigDecimal averageTicket;

        public Summary(Integer totalPieces,
                       BigDecimal totalAmount,
                       BigDecimal totalPaid,
                       BigDecimal totalPending,
                       BigDecimal averageTicket) {
            this.totalPieces = totalPieces;
            this.totalAmount = totalAmount;
            this.totalPaid = totalPaid;
            this.totalPending = totalPending;
            this.averageTicket = averageTicket;
        }

        public Integer getTotalPieces() { return totalPieces; }
        public BigDecimal getTotalAmount() { return totalAmount; }
        public BigDecimal getTotalPaid() { return totalPaid; }
        public BigDecimal getTotalPending() { return totalPending; }
        public BigDecimal getAverageTicket() { return averageTicket; }
    }
}