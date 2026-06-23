package com.hpsqsoft.ctrlropa.shipment;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class ConfirmShipmentReceivedRequest {

    private LocalDateTime receivedAt;

    @Size(max = 255, message = "notes no puede exceder 255 caracteres")
    private String notes;

    @NotNull(message = "deliveryConfirmedByUserId es obligatorio")
    private Long deliveryConfirmedByUserId;

    public LocalDateTime getReceivedAt() {
        return receivedAt;
    }

    public void setReceivedAt(LocalDateTime receivedAt) {
        this.receivedAt = receivedAt;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Long getDeliveryConfirmedByUserId() {
        return deliveryConfirmedByUserId;
    }

    public void setDeliveryConfirmedByUserId(Long deliveryConfirmedByUserId) {
        this.deliveryConfirmedByUserId = deliveryConfirmedByUserId;
    }
}
