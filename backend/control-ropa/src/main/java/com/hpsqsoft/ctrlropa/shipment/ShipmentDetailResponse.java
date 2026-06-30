package com.hpsqsoft.ctrlropa.shipment;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class ShipmentDetailResponse {

    private Long id;
    private String folio;
    private Long branchId;
    private String branchCode;
    private String deliveryType;
    private String status;
    private String guideReference;
    private String recipientName;
    private String recipientPhone;
    private String destinationSummary;
    private String destinationCity;
    private String destinationState;
    private String destinationPostalCode;
    private String shippingCarrier;
    private BigDecimal shippingCostAmount;
    private String shippingNotes;
    private String logisticsSource;
    private String logisticsWarning;
    private LocalDateTime quotedAt;
    private LocalDateTime readyAt;
    private LocalDateTime receivedAt;
    private LocalDateTime createdAt;
    private Long createdByUserId;
    private LocalDateTime dispatchedAt;
    private Long dispatchedByUserId;
    private LocalDateTime cancelledAt;
    private Long cancelledByUserId;
    private List<PackageLine> packages;

    public ShipmentDetailResponse(Long id,
                                  String folio,
                                  Long branchId,
                                  String branchCode,
                                  String deliveryType,
                                  String status,
                                  String guideReference,
                                  String recipientName,
                                  String recipientPhone,
                                  String destinationSummary,
                                  String destinationCity,
                                  String destinationState,
                                  String destinationPostalCode,
                                  String shippingCarrier,
                                  BigDecimal shippingCostAmount,
                                  String shippingNotes,
                                  String logisticsSource,
                                  String logisticsWarning,
                                  LocalDateTime quotedAt,
                                  LocalDateTime readyAt,
                                  LocalDateTime receivedAt,
                                  LocalDateTime createdAt,
                                  Long createdByUserId,
                                  LocalDateTime dispatchedAt,
                                  Long dispatchedByUserId,
                                  LocalDateTime cancelledAt,
                                  Long cancelledByUserId,
                                  List<PackageLine> packages) {
        this.id = id;
        this.folio = folio;
        this.branchId = branchId;
        this.branchCode = branchCode;
        this.deliveryType = deliveryType;
        this.status = status;
        this.guideReference = guideReference;
        this.recipientName = recipientName;
        this.recipientPhone = recipientPhone;
        this.destinationSummary = destinationSummary;
        this.destinationCity = destinationCity;
        this.destinationState = destinationState;
        this.destinationPostalCode = destinationPostalCode;
        this.shippingCarrier = shippingCarrier;
        this.shippingCostAmount = shippingCostAmount;
        this.shippingNotes = shippingNotes;
        this.logisticsSource = logisticsSource;
        this.logisticsWarning = logisticsWarning;
        this.quotedAt = quotedAt;
        this.readyAt = readyAt;
        this.receivedAt = receivedAt;
        this.createdAt = createdAt;
        this.createdByUserId = createdByUserId;
        this.dispatchedAt = dispatchedAt;
        this.dispatchedByUserId = dispatchedByUserId;
        this.cancelledAt = cancelledAt;
        this.cancelledByUserId = cancelledByUserId;
        this.packages = packages;
    }

    public Long getId() {
        return id;
    }

    public String getFolio() {
        return folio;
    }

    public Long getBranchId() {
        return branchId;
    }

    public String getBranchCode() {
        return branchCode;
    }

    public String getDeliveryType() {
        return deliveryType;
    }

    public String getStatus() {
        return status;
    }

    public String getGuideReference() {
        return guideReference;
    }

    public String getRecipientName() {
        return recipientName;
    }

    public String getRecipientPhone() {
        return recipientPhone;
    }

    public String getDestinationSummary() {
        return destinationSummary;
    }

    public String getDestinationCity() {
        return destinationCity;
    }

    public String getDestinationState() {
        return destinationState;
    }

    public String getDestinationPostalCode() {
        return destinationPostalCode;
    }

    public String getShippingCarrier() {
        return shippingCarrier;
    }

    public BigDecimal getShippingCostAmount() {
        return shippingCostAmount;
    }

    public String getShippingNotes() {
        return shippingNotes;
    }

    public String getLogisticsSource() {
        return logisticsSource;
    }

    public String getLogisticsWarning() {
        return logisticsWarning;
    }

    public LocalDateTime getQuotedAt() {
        return quotedAt;
    }

    public LocalDateTime getReadyAt() {
        return readyAt;
    }

    public LocalDateTime getReceivedAt() {
        return receivedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public Long getCreatedByUserId() {
        return createdByUserId;
    }

    public LocalDateTime getDispatchedAt() {
        return dispatchedAt;
    }

    public Long getDispatchedByUserId() {
        return dispatchedByUserId;
    }

    public LocalDateTime getCancelledAt() {
        return cancelledAt;
    }

    public Long getCancelledByUserId() {
        return cancelledByUserId;
    }

    public List<PackageLine> getPackages() {
        return packages;
    }

    public static class PackageLine {
        private Long id;
        private Long customerPackageId;
        private String customerPackageFolio;
        private Long customerId;
        private String customerName;
        private Long deliveryAddressId;
        private String deliveryAddressLabel;
        private String deliveryType;
        private String shippingAddressSource;
        private String recipientName;
        private String recipientPhone;
        private String deliveryAddressText;
        private String deliveryReferences;
        private BigDecimal shippingCostAmount;
        private Boolean shippingCostWaived;
        private Boolean shippingCollect;
        private Boolean customerProvidedLabel;
        private String paymentMode;
        private BigDecimal expectedCollectionAmount;
        private String status;
        private BigDecimal collectedAmount;
        private BigDecimal collectionDifference;
        private String collectionStatus;
        private String collectionNotes;
        private Long deliveryConfirmedByUserId;
        private LocalDateTime deliveredAt;
        private LocalDateTime returnedAt;

        public PackageLine(Long id,
                           Long customerPackageId,
                           String customerPackageFolio,
                           Long customerId,
                           String customerName,
                           Long deliveryAddressId,
                           String deliveryAddressLabel,
                           String deliveryType,
                           String shippingAddressSource,
                           String recipientName,
                           String recipientPhone,
                           String deliveryAddressText,
                           String deliveryReferences,
                           BigDecimal shippingCostAmount,
                           Boolean shippingCostWaived,
                           Boolean shippingCollect,
                           Boolean customerProvidedLabel,
                           String paymentMode,
                           BigDecimal expectedCollectionAmount,
                           String status,
                           BigDecimal collectedAmount,
                           BigDecimal collectionDifference,
                           String collectionStatus,
                           String collectionNotes,
                           Long deliveryConfirmedByUserId,
                           LocalDateTime deliveredAt,
                           LocalDateTime returnedAt) {
            this.id = id;
            this.customerPackageId = customerPackageId;
            this.customerPackageFolio = customerPackageFolio;
            this.customerId = customerId;
            this.customerName = customerName;
            this.deliveryAddressId = deliveryAddressId;
            this.deliveryAddressLabel = deliveryAddressLabel;
            this.deliveryType = deliveryType;
            this.shippingAddressSource = shippingAddressSource;
            this.recipientName = recipientName;
            this.recipientPhone = recipientPhone;
            this.deliveryAddressText = deliveryAddressText;
            this.deliveryReferences = deliveryReferences;
            this.shippingCostAmount = shippingCostAmount;
            this.shippingCostWaived = shippingCostWaived;
            this.shippingCollect = shippingCollect;
            this.customerProvidedLabel = customerProvidedLabel;
            this.paymentMode = paymentMode;
            this.expectedCollectionAmount = expectedCollectionAmount;
            this.status = status;
            this.collectedAmount = collectedAmount;
            this.collectionDifference = collectionDifference;
            this.collectionStatus = collectionStatus;
            this.collectionNotes = collectionNotes;
            this.deliveryConfirmedByUserId = deliveryConfirmedByUserId;
            this.deliveredAt = deliveredAt;
            this.returnedAt = returnedAt;
        }

        public Long getId() {
            return id;
        }

        public Long getCustomerPackageId() {
            return customerPackageId;
        }

        public String getCustomerPackageFolio() {
            return customerPackageFolio;
        }

        public Long getCustomerId() {
            return customerId;
        }

        public String getCustomerName() {
            return customerName;
        }

        public Long getDeliveryAddressId() {
            return deliveryAddressId;
        }

        public String getDeliveryAddressLabel() {
            return deliveryAddressLabel;
        }

        public String getDeliveryType() {
            return deliveryType;
        }

        public String getShippingAddressSource() {
            return shippingAddressSource;
        }

        public String getRecipientName() {
            return recipientName;
        }

        public String getRecipientPhone() {
            return recipientPhone;
        }

        public String getDeliveryAddressText() {
            return deliveryAddressText;
        }

        public String getDeliveryReferences() {
            return deliveryReferences;
        }

        public BigDecimal getShippingCostAmount() {
            return shippingCostAmount;
        }

        public Boolean getShippingCostWaived() {
            return shippingCostWaived;
        }

        public Boolean getShippingCollect() {
            return shippingCollect;
        }

        public Boolean getCustomerProvidedLabel() {
            return customerProvidedLabel;
        }

        public String getPaymentMode() {
            return paymentMode;
        }

        public BigDecimal getExpectedCollectionAmount() {
            return expectedCollectionAmount;
        }

        public String getStatus() {
            return status;
        }

        public BigDecimal getCollectedAmount() {
            return collectedAmount;
        }

        public BigDecimal getCollectionDifference() {
            return collectionDifference;
        }

        public String getCollectionStatus() {
            return collectionStatus;
        }

        public String getCollectionNotes() {
            return collectionNotes;
        }

        public Long getDeliveryConfirmedByUserId() {
            return deliveryConfirmedByUserId;
        }

        public LocalDateTime getDeliveredAt() {
            return deliveredAt;
        }

        public LocalDateTime getReturnedAt() {
            return returnedAt;
        }
    }
}
