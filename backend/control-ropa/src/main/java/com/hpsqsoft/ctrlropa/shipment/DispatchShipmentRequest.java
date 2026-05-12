package com.hpsqsoft.ctrlropa.shipment;

import jakarta.validation.constraints.NotNull;

public class DispatchShipmentRequest {

    @NotNull(message = "dispatchedByUserId es obligatorio")
    private Long dispatchedByUserId;

    public Long getDispatchedByUserId() {
        return dispatchedByUserId;
    }

    public void setDispatchedByUserId(Long dispatchedByUserId) {
        this.dispatchedByUserId = dispatchedByUserId;
    }
}