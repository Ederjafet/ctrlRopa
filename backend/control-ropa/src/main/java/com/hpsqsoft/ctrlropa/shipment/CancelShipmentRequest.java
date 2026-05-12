package com.hpsqsoft.ctrlropa.shipment;

import jakarta.validation.constraints.NotNull;

public class CancelShipmentRequest {

    @NotNull(message = "cancelledByUserId es obligatorio")
    private Long cancelledByUserId;

    public Long getCancelledByUserId() {
        return cancelledByUserId;
    }

    public void setCancelledByUserId(Long cancelledByUserId) {
        this.cancelledByUserId = cancelledByUserId;
    }
}