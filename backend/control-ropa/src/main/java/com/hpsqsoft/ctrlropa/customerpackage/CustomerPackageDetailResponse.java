package com.hpsqsoft.ctrlropa.customerpackage;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class CustomerPackageDetailResponse {

    private Long id;
    private String folio;
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private Long branchId;
    private String branchCode;
    private String branchName;
    private String status;
    private String paymentStatus;
    private String notes;
    private LocalDateTime createdAt;
    private Long createdByUserId;
    private LocalDateTime closedAt;
    private Long closedByUserId;

    private Integer totalItems;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private BigDecimal pendingAmount;

    private List<ItemLine> items;
    private List<ShipmentLine> shipments;

    public CustomerPackageDetailResponse(Long id,
                                         String folio,
                                         Long customerId,
                                         String customerName,
                                         String customerPhone,
                                         Long branchId,
                                         String branchCode,
                                         String branchName,
                                         String status,
                                         String paymentStatus,
                                         String notes,
                                         LocalDateTime createdAt,
                                         Long createdByUserId,
                                         LocalDateTime closedAt,
                                         Long closedByUserId,
                                         Integer totalItems,
                                         BigDecimal totalAmount,
                                         BigDecimal paidAmount,
                                         BigDecimal pendingAmount,
                                         List<ItemLine> items,
                                         List<ShipmentLine> shipments) {
        this.id = id;
        this.folio = folio;
        this.customerId = customerId;
        this.customerName = customerName;
        this.customerPhone = customerPhone;
        this.branchId = branchId;
        this.branchCode = branchCode;
        this.branchName = branchName;
        this.status = status;
        this.paymentStatus = paymentStatus;
        this.notes = notes;
        this.createdAt = createdAt;
        this.createdByUserId = createdByUserId;
        this.closedAt = closedAt;
        this.closedByUserId = closedByUserId;
        this.totalItems = totalItems;
        this.totalAmount = totalAmount;
        this.paidAmount = paidAmount;
        this.pendingAmount = pendingAmount;
        this.items = items;
        this.shipments = shipments;
    }

    public Long getId() { return id; }
    public String getFolio() { return folio; }
    public Long getCustomerId() { return customerId; }
    public String getCustomerName() { return customerName; }
    public String getCustomerPhone() { return customerPhone; }
    public Long getBranchId() { return branchId; }
    public String getBranchCode() { return branchCode; }
    public String getBranchName() { return branchName; }
    public String getStatus() { return status; }
    public String getPaymentStatus() { return paymentStatus; }
    public String getNotes() { return notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public Long getCreatedByUserId() { return createdByUserId; }
    public LocalDateTime getClosedAt() { return closedAt; }
    public Long getClosedByUserId() { return closedByUserId; }
    public Integer getTotalItems() { return totalItems; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public BigDecimal getPaidAmount() { return paidAmount; }
    public BigDecimal getPendingAmount() { return pendingAmount; }
    public List<ItemLine> getItems() { return items; }
    public List<ShipmentLine> getShipments() { return shipments; }

    public static class ItemLine {
        private Long id;
        private Long itemId;
        private String itemCode;
        private String itemQrCode;
        private String itemStatus;
        private String productType;
        private String brand;
        private String size;
        private BigDecimal price;
        private BigDecimal paidAmount;
        private BigDecimal pendingAmount;
        private Long saleId;
        private Long reservationId;
        private String sourceType;
        private String sourceStatus;
        private LocalDateTime createdAt;

        public ItemLine(Long id,
                        Long itemId,
                        String itemCode,
                        String itemQrCode,
                        String itemStatus,
                        String productType,
                        String brand,
                        String size,
                        BigDecimal price,
                        BigDecimal paidAmount,
                        BigDecimal pendingAmount,
                        Long saleId,
                        Long reservationId,
                        String sourceType,
                        String sourceStatus,
                        LocalDateTime createdAt) {
            this.id = id;
            this.itemId = itemId;
            this.itemCode = itemCode;
            this.itemQrCode = itemQrCode;
            this.itemStatus = itemStatus;
            this.productType = productType;
            this.brand = brand;
            this.size = size;
            this.price = price;
            this.paidAmount = paidAmount;
            this.pendingAmount = pendingAmount;
            this.saleId = saleId;
            this.reservationId = reservationId;
            this.sourceType = sourceType;
            this.sourceStatus = sourceStatus;
            this.createdAt = createdAt;
        }

        public Long getId() { return id; }
        public Long getItemId() { return itemId; }
        public String getItemCode() { return itemCode; }
        public String getItemQrCode() { return itemQrCode; }
        public String getItemStatus() { return itemStatus; }
        public String getProductType() { return productType; }
        public String getBrand() { return brand; }
        public String getSize() { return size; }
        public BigDecimal getPrice() { return price; }
        public BigDecimal getPaidAmount() { return paidAmount; }
        public BigDecimal getPendingAmount() { return pendingAmount; }
        public Long getSaleId() { return saleId; }
        public Long getReservationId() { return reservationId; }
        public String getSourceType() { return sourceType; }
        public String getSourceStatus() { return sourceStatus; }
        public LocalDateTime getCreatedAt() { return createdAt; }
    }

    public static class ShipmentLine {
        private Long shipmentPackageId;
        private Long shipmentId;
        private String shipmentFolio;
        private String shipmentStatus;
        private String packageShipmentStatus;
        private String paymentMode;
        private BigDecimal expectedCollectionAmount;
        private BigDecimal collectedAmount;
        private BigDecimal collectionDifference;
        private String collectionStatus;
        private String collectionNotes;
        private LocalDateTime deliveredAt;
        private LocalDateTime returnedAt;

        public ShipmentLine(Long shipmentPackageId,
                            Long shipmentId,
                            String shipmentFolio,
                            String shipmentStatus,
                            String packageShipmentStatus,
                            String paymentMode,
                            BigDecimal expectedCollectionAmount,
                            BigDecimal collectedAmount,
                            BigDecimal collectionDifference,
                            String collectionStatus,
                            String collectionNotes,
                            LocalDateTime deliveredAt,
                            LocalDateTime returnedAt) {
            this.shipmentPackageId = shipmentPackageId;
            this.shipmentId = shipmentId;
            this.shipmentFolio = shipmentFolio;
            this.shipmentStatus = shipmentStatus;
            this.packageShipmentStatus = packageShipmentStatus;
            this.paymentMode = paymentMode;
            this.expectedCollectionAmount = expectedCollectionAmount;
            this.collectedAmount = collectedAmount;
            this.collectionDifference = collectionDifference;
            this.collectionStatus = collectionStatus;
            this.collectionNotes = collectionNotes;
            this.deliveredAt = deliveredAt;
            this.returnedAt = returnedAt;
        }

        public Long getShipmentPackageId() { return shipmentPackageId; }
        public Long getShipmentId() { return shipmentId; }
        public String getShipmentFolio() { return shipmentFolio; }
        public String getShipmentStatus() { return shipmentStatus; }
        public String getPackageShipmentStatus() { return packageShipmentStatus; }
        public String getPaymentMode() { return paymentMode; }
        public BigDecimal getExpectedCollectionAmount() { return expectedCollectionAmount; }
        public BigDecimal getCollectedAmount() { return collectedAmount; }
        public BigDecimal getCollectionDifference() { return collectionDifference; }
        public String getCollectionStatus() { return collectionStatus; }
        public String getCollectionNotes() { return collectionNotes; }
        public LocalDateTime getDeliveredAt() { return deliveredAt; }
        public LocalDateTime getReturnedAt() { return returnedAt; }
    }
}