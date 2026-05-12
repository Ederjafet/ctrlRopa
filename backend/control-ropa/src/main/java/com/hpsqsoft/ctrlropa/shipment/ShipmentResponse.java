package com.hpsqsoft.ctrlropa.shipment;

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
                            Long packageCount) {
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
}
