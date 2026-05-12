package com.hpsqsoft.ctrlropa.shipment;

import jakarta.validation.constraints.NotNull;

public class ReopenShipmentRequest {

    @NotNull(message = "reopenedByUserId es obligatorio")
    private Long reopenedByUserId;

    public Long getReopenedByUserId() {
        return reopenedByUserId;
    }

    public void setReopenedByUserId(Long reopenedByUserId) {
        this.reopenedByUserId = reopenedByUserId;
    }
}