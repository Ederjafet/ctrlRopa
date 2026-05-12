package com.hpsqsoft.ctrlropa.shipment;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreateShipmentRequest {

    @NotNull(message = "branchId es obligatorio")
    private Long branchId;

    @NotNull(message = "deliveryType es obligatorio")
    private ShipmentDeliveryType deliveryType;

    @Size(max = 255, message = "guideReference no puede exceder 255 caracteres")
    private String guideReference;

    @NotNull(message = "createdByUserId es obligatorio")
    private Long createdByUserId;

    public Long getBranchId() {
        return branchId;
    }

    public void setBranchId(Long branchId) {
        this.branchId = branchId;
    }

    public ShipmentDeliveryType getDeliveryType() {
        return deliveryType;
    }

    public void setDeliveryType(ShipmentDeliveryType deliveryType) {
        this.deliveryType = deliveryType;
    }

    public String getGuideReference() {
        return guideReference;
    }

    public void setGuideReference(String guideReference) {
        this.guideReference = guideReference;
    }

    public Long getCreatedByUserId() {
        return createdByUserId;
    }

    public void setCreatedByUserId(Long createdByUserId) {
        this.createdByUserId = createdByUserId;
    }
}