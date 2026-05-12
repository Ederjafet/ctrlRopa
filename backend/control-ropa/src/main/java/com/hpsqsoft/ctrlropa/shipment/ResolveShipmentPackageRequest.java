package com.hpsqsoft.ctrlropa.shipment;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class ResolveShipmentPackageRequest {

    @NotNull(message = "status es obligatorio")
    private ShipmentPackageStatus status;

    private BigDecimal collectedAmount;

    @Size(max = 255, message = "collectionNotes no puede exceder 255 caracteres")
    private String collectionNotes;

    @NotNull(message = "deliveryConfirmedByUserId es obligatorio")
    private Long deliveryConfirmedByUserId;

    public ShipmentPackageStatus getStatus() {
        return status;
    }

    public void setStatus(ShipmentPackageStatus status) {
        this.status = status;
    }

    public BigDecimal getCollectedAmount() {
        return collectedAmount;
    }

    public void setCollectedAmount(BigDecimal collectedAmount) {
        this.collectedAmount = collectedAmount;
    }

    public String getCollectionNotes() {
        return collectionNotes;
    }

    public void setCollectionNotes(String collectionNotes) {
        this.collectionNotes = collectionNotes;
    }

    public Long getDeliveryConfirmedByUserId() {
        return deliveryConfirmedByUserId;
    }

    public void setDeliveryConfirmedByUserId(Long deliveryConfirmedByUserId) {
        this.deliveryConfirmedByUserId = deliveryConfirmedByUserId;
    }
}