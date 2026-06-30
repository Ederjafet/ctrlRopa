package com.hpsqsoft.ctrlropa.shipment;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ShipmentResponse {

    private Long id;
    private String folio;
    private Long branchId;
    private String branchCode;
    private String deliveryType;
    private String status;
    private String guideReference;
    private LocalDateTime createdAt;
    private Long createdByUserId;
    private LocalDateTime dispatchedAt;
    private Long dispatchedByUserId;
    private LocalDateTime cancelledAt;
    private Long cancelledByUserId;
    private Long packageCount;
    private Long primaryPackageId;
    private String primaryPackageFolio;
    private String primaryPackageStatus;
    private Integer packageItemCount;
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private String packageDeliveryType;
    private String recipientName;
    private String recipientPhone;
    private String destinationSummary;
    private String destinationCity;
    private String destinationState;
    private String destinationPostalCode;
    private String shippingCarrier;
    private String packageTrackingNumber;
    private BigDecimal shippingCostAmount;
    private String shippingNotes;
    private String logisticsSource;
    private String logisticsWarning;
    private BigDecimal packageTotalAmount;
    private String paymentMode;
    private boolean requiresAttention;
    private String attentionReason;
    private String nextStep;
    private boolean canDispatch;
    private boolean canConfirmReceived;
    private String blockedReason;

    public ShipmentResponse(Long id,
                            String folio,
                            Long branchId,
                            String branchCode,
                            String deliveryType,
                            String status,
                            String guideReference,
                            LocalDateTime createdAt,
                            Long createdByUserId,
                            LocalDateTime dispatchedAt,
                            Long dispatchedByUserId,
                            LocalDateTime cancelledAt,
                            Long cancelledByUserId,
                            Long packageCount,
                            Long primaryPackageId,
                            String primaryPackageFolio,
                            String primaryPackageStatus,
                            Integer packageItemCount,
                            Long customerId,
                            String customerName,
                            String customerPhone,
                            String packageDeliveryType,
                            String recipientName,
                            String recipientPhone,
                            String destinationSummary,
                            String destinationCity,
                            String destinationState,
                            String destinationPostalCode,
                            String shippingCarrier,
                            String packageTrackingNumber,
                            BigDecimal shippingCostAmount,
                            String shippingNotes,
                            String logisticsSource,
                            String logisticsWarning,
                            BigDecimal packageTotalAmount,
                            String paymentMode,
                            boolean requiresAttention,
                            String attentionReason,
                            String nextStep,
                            boolean canDispatch,
                            boolean canConfirmReceived,
                            String blockedReason) {
        this.id = id;
        this.folio = folio;
        this.branchId = branchId;
        this.branchCode = branchCode;
        this.deliveryType = deliveryType;
        this.status = status;
        this.guideReference = guideReference;
        this.createdAt = createdAt;
        this.createdByUserId = createdByUserId;
        this.dispatchedAt = dispatchedAt;
        this.dispatchedByUserId = dispatchedByUserId;
        this.cancelledAt = cancelledAt;
        this.cancelledByUserId = cancelledByUserId;
        this.packageCount = packageCount;
        this.primaryPackageId = primaryPackageId;
        this.primaryPackageFolio = primaryPackageFolio;
        this.primaryPackageStatus = primaryPackageStatus;
        this.packageItemCount = packageItemCount;
        this.customerId = customerId;
        this.customerName = customerName;
        this.customerPhone = customerPhone;
        this.packageDeliveryType = packageDeliveryType;
        this.recipientName = recipientName;
        this.recipientPhone = recipientPhone;
        this.destinationSummary = destinationSummary;
        this.destinationCity = destinationCity;
        this.destinationState = destinationState;
        this.destinationPostalCode = destinationPostalCode;
        this.shippingCarrier = shippingCarrier;
        this.packageTrackingNumber = packageTrackingNumber;
        this.shippingCostAmount = shippingCostAmount;
        this.shippingNotes = shippingNotes;
        this.logisticsSource = logisticsSource;
        this.logisticsWarning = logisticsWarning;
        this.packageTotalAmount = packageTotalAmount;
        this.paymentMode = paymentMode;
        this.requiresAttention = requiresAttention;
        this.attentionReason = attentionReason;
        this.nextStep = nextStep;
        this.canDispatch = canDispatch;
        this.canConfirmReceived = canConfirmReceived;
        this.blockedReason = blockedReason;
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

    public Long getPackageCount() {
        return packageCount;
    }

    public Long getPrimaryPackageId() {
        return primaryPackageId;
    }

    public String getPrimaryPackageFolio() {
        return primaryPackageFolio;
    }

    public String getPrimaryPackageStatus() {
        return primaryPackageStatus;
    }

    public Integer getPackageItemCount() {
        return packageItemCount;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public String getPackageDeliveryType() {
        return packageDeliveryType;
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

    public String getPackageTrackingNumber() {
        return packageTrackingNumber;
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

    public BigDecimal getPackageTotalAmount() {
        return packageTotalAmount;
    }

    public String getPaymentMode() {
        return paymentMode;
    }

    public boolean isRequiresAttention() {
        return requiresAttention;
    }

    public String getAttentionReason() {
        return attentionReason;
    }

    public String getNextStep() {
        return nextStep;
    }

    public boolean isCanDispatch() {
        return canDispatch;
    }

    public boolean isCanConfirmReceived() {
        return canConfirmReceived;
    }

    public String getBlockedReason() {
        return blockedReason;
    }
}
