package com.hpsqsoft.ctrlropa.item;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ItemLookupResponse {

    private ItemResponse item;
    private SaleInfo activeSale;
    private ReservationInfo activeReservation;
    private PackageInfo currentPackage;
    private ShipmentInfo currentShipment;

    public ItemLookupResponse(ItemResponse item,
                              SaleInfo activeSale,
                              ReservationInfo activeReservation,
                              PackageInfo currentPackage,
                              ShipmentInfo currentShipment) {
        this.item = item;
        this.activeSale = activeSale;
        this.activeReservation = activeReservation;
        this.currentPackage = currentPackage;
        this.currentShipment = currentShipment;
    }

    public ItemResponse getItem() {
        return item;
    }

    public SaleInfo getActiveSale() {
        return activeSale;
    }

    public ReservationInfo getActiveReservation() {
        return activeReservation;
    }

    public PackageInfo getCurrentPackage() {
        return currentPackage;
    }

    public ShipmentInfo getCurrentShipment() {
        return currentShipment;
    }

    public static class SaleInfo {
        private Long saleId;
        private Long customerId;
        private String customerName;
        private Long customerOrderId;
        private Long branchId;
        private String branchCode;
        private Long salesChannelId;
        private String salesChannelCode;
        private BigDecimal price;
        private String status;
        private String paymentStatus;
        private LocalDateTime createdAt;

        public SaleInfo(Long saleId,
                        Long customerId,
                        String customerName,
                        Long customerOrderId,
                        Long branchId,
                        String branchCode,
                        Long salesChannelId,
                        String salesChannelCode,
                        BigDecimal price,
                        String status,
                        String paymentStatus,
                        LocalDateTime createdAt) {
            this.saleId = saleId;
            this.customerId = customerId;
            this.customerName = customerName;
            this.customerOrderId = customerOrderId;
            this.branchId = branchId;
            this.branchCode = branchCode;
            this.salesChannelId = salesChannelId;
            this.salesChannelCode = salesChannelCode;
            this.price = price;
            this.status = status;
            this.paymentStatus = paymentStatus;
            this.createdAt = createdAt;
        }

        public Long getSaleId() { return saleId; }
        public Long getCustomerId() { return customerId; }
        public String getCustomerName() { return customerName; }
        public Long getCustomerOrderId() { return customerOrderId; }
        public Long getBranchId() { return branchId; }
        public String getBranchCode() { return branchCode; }
        public Long getSalesChannelId() { return salesChannelId; }
        public String getSalesChannelCode() { return salesChannelCode; }
        public BigDecimal getPrice() { return price; }
        public String getStatus() { return status; }
        public String getPaymentStatus() { return paymentStatus; }
        public LocalDateTime getCreatedAt() { return createdAt; }
    }

    public static class ReservationInfo {
        private Long reservationId;
        private Long customerId;
        private String customerName;
        private Long branchId;
        private String branchCode;
        private Long liveId;
        private Long salesChannelId;
        private String salesChannelCode;
        private BigDecimal price;
        private String status;
        private LocalDateTime createdAt;

        public ReservationInfo(Long reservationId,
                               Long customerId,
                               String customerName,
                               Long branchId,
                               String branchCode,
                               Long liveId,
                               Long salesChannelId,
                               String salesChannelCode,
                               BigDecimal price,
                               String status,
                               LocalDateTime createdAt) {
            this.reservationId = reservationId;
            this.customerId = customerId;
            this.customerName = customerName;
            this.branchId = branchId;
            this.branchCode = branchCode;
            this.liveId = liveId;
            this.salesChannelId = salesChannelId;
            this.salesChannelCode = salesChannelCode;
            this.price = price;
            this.status = status;
            this.createdAt = createdAt;
        }

        public Long getReservationId() { return reservationId; }
        public Long getCustomerId() { return customerId; }
        public String getCustomerName() { return customerName; }
        public Long getBranchId() { return branchId; }
        public String getBranchCode() { return branchCode; }
        public Long getLiveId() { return liveId; }
        public Long getSalesChannelId() { return salesChannelId; }
        public String getSalesChannelCode() { return salesChannelCode; }
        public BigDecimal getPrice() { return price; }
        public String getStatus() { return status; }
        public LocalDateTime getCreatedAt() { return createdAt; }
    }

    public static class PackageInfo {
        private Long packageId;
        private String packageFolio;
        private String status;
        private Long customerId;
        private String customerName;
        private Long branchId;
        private String branchCode;
        private Long packageItemId;
        private Long saleId;
        private Long reservationId;

        public PackageInfo(Long packageId,
                           String packageFolio,
                           String status,
                           Long customerId,
                           String customerName,
                           Long branchId,
                           String branchCode,
                           Long packageItemId,
                           Long saleId,
                           Long reservationId) {
            this.packageId = packageId;
            this.packageFolio = packageFolio;
            this.status = status;
            this.customerId = customerId;
            this.customerName = customerName;
            this.branchId = branchId;
            this.branchCode = branchCode;
            this.packageItemId = packageItemId;
            this.saleId = saleId;
            this.reservationId = reservationId;
        }

        public Long getPackageId() { return packageId; }
        public String getPackageFolio() { return packageFolio; }
        public String getStatus() { return status; }
        public Long getCustomerId() { return customerId; }
        public String getCustomerName() { return customerName; }
        public Long getBranchId() { return branchId; }
        public String getBranchCode() { return branchCode; }
        public Long getPackageItemId() { return packageItemId; }
        public Long getSaleId() { return saleId; }
        public Long getReservationId() { return reservationId; }
    }

    public static class ShipmentInfo {
        private Long shipmentId;
        private String shipmentFolio;
        private Long shipmentPackageId;
        private String shipmentStatus;
        private String shipmentPackageStatus;
        private String paymentMode;

        public ShipmentInfo(Long shipmentId,
                            String shipmentFolio,
                            Long shipmentPackageId,
                            String shipmentStatus,
                            String shipmentPackageStatus,
                            String paymentMode) {
            this.shipmentId = shipmentId;
            this.shipmentFolio = shipmentFolio;
            this.shipmentPackageId = shipmentPackageId;
            this.shipmentStatus = shipmentStatus;
            this.shipmentPackageStatus = shipmentPackageStatus;
            this.paymentMode = paymentMode;
        }

        public Long getShipmentId() { return shipmentId; }
        public String getShipmentFolio() { return shipmentFolio; }
        public Long getShipmentPackageId() { return shipmentPackageId; }
        public String getShipmentStatus() { return shipmentStatus; }
        public String getShipmentPackageStatus() { return shipmentPackageStatus; }
        public String getPaymentMode() { return paymentMode; }
    }
}