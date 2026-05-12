package com.hpsqsoft.ctrlropa.report;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class DailyDeliveriesReportResponse {

    private LocalDate date;
    private Long branchId;
    private String branchCode;
    private String branchName;

    private List<ScreenLine> screenLines;
    private List<PrintLine> printLines;
    private Summary summary;

    public DailyDeliveriesReportResponse(LocalDate date,
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

        private Long shipmentId;
        private String shipmentFolio;
        private String shipmentStatus;

        private Long packageId;
        private String packageFolio;
        private String packageStatus;

        private Long customerId;
        private String customerName;
        private String customerPhone;
        private String addressText;

        private BigDecimal total;
        private BigDecimal paid;
        private BigDecimal pending;
        private String paymentStatus;

        private String deliveryType;
        private LocalDateTime createdAt;
        private LocalDateTime sentAt;
        private LocalDateTime deliveredAt;
        private String observation;

        public ScreenLine(Long shipmentId,
                          String shipmentFolio,
                          String shipmentStatus,
                          Long packageId,
                          String packageFolio,
                          String packageStatus,
                          Long customerId,
                          String customerName,
                          String customerPhone,
                          String addressText,
                          BigDecimal total,
                          BigDecimal paid,
                          BigDecimal pending,
                          String paymentStatus,
                          String deliveryType,
                          LocalDateTime createdAt,
                          LocalDateTime sentAt,
                          LocalDateTime deliveredAt,
                          String observation) {
            this.shipmentId = shipmentId;
            this.shipmentFolio = shipmentFolio;
            this.shipmentStatus = shipmentStatus;
            this.packageId = packageId;
            this.packageFolio = packageFolio;
            this.packageStatus = packageStatus;
            this.customerId = customerId;
            this.customerName = customerName;
            this.customerPhone = customerPhone;
            this.addressText = addressText;
            this.total = total;
            this.paid = paid;
            this.pending = pending;
            this.paymentStatus = paymentStatus;
            this.deliveryType = deliveryType;
            this.createdAt = createdAt;
            this.sentAt = sentAt;
            this.deliveredAt = deliveredAt;
            this.observation = observation;
        }

        public Long getShipmentId() { return shipmentId; }
        public String getShipmentFolio() { return shipmentFolio; }
        public String getShipmentStatus() { return shipmentStatus; }
        public Long getPackageId() { return packageId; }
        public String getPackageFolio() { return packageFolio; }
        public String getPackageStatus() { return packageStatus; }
        public Long getCustomerId() { return customerId; }
        public String getCustomerName() { return customerName; }
        public String getCustomerPhone() { return customerPhone; }
        public String getAddressText() { return addressText; }
        public BigDecimal getTotal() { return total; }
        public BigDecimal getPaid() { return paid; }
        public BigDecimal getPending() { return pending; }
        public String getPaymentStatus() { return paymentStatus; }
        public String getDeliveryType() { return deliveryType; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public LocalDateTime getSentAt() { return sentAt; }
        public LocalDateTime getDeliveredAt() { return deliveredAt; }
        public String getObservation() { return observation; }
    }

    public static class PrintLine {

        private Integer rowNumber;
        private String folio;
        private String customerName;
        private BigDecimal total;
        private BigDecimal paid;
        private String paymentText;
        private String observation;

        public PrintLine(Integer rowNumber,
                         String folio,
                         String customerName,
                         BigDecimal total,
                         BigDecimal paid,
                         String paymentText,
                         String observation) {
            this.rowNumber = rowNumber;
            this.folio = folio;
            this.customerName = customerName;
            this.total = total;
            this.paid = paid;
            this.paymentText = paymentText;
            this.observation = observation;
        }

        public Integer getRowNumber() { return rowNumber; }
        public String getFolio() { return folio; }
        public String getCustomerName() { return customerName; }
        public BigDecimal getTotal() { return total; }
        public BigDecimal getPaid() { return paid; }
        public String getPaymentText() { return paymentText; }
        public String getObservation() { return observation; }
    }

    public static class Summary {

        private Integer totalPackages;
        private Integer inRoutePackages;
        private Integer deliveredPackages;
        private Integer returnedPackages;
        private BigDecimal totalAmount;
        private BigDecimal totalPaid;
        private BigDecimal totalPending;

        public Summary(Integer totalPackages,
                       Integer inRoutePackages,
                       Integer deliveredPackages,
                       Integer returnedPackages,
                       BigDecimal totalAmount,
                       BigDecimal totalPaid,
                       BigDecimal totalPending) {
            this.totalPackages = totalPackages;
            this.inRoutePackages = inRoutePackages;
            this.deliveredPackages = deliveredPackages;
            this.returnedPackages = returnedPackages;
            this.totalAmount = totalAmount;
            this.totalPaid = totalPaid;
            this.totalPending = totalPending;
        }

        public Integer getTotalPackages() { return totalPackages; }
        public Integer getInRoutePackages() { return inRoutePackages; }
        public Integer getDeliveredPackages() { return deliveredPackages; }
        public Integer getReturnedPackages() { return returnedPackages; }
        public BigDecimal getTotalAmount() { return totalAmount; }
        public BigDecimal getTotalPaid() { return totalPaid; }
        public BigDecimal getTotalPending() { return totalPending; }
    }
}