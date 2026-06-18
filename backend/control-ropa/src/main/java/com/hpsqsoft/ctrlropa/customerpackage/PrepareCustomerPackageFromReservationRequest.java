package com.hpsqsoft.ctrlropa.customerpackage;

import jakarta.validation.constraints.NotNull;

public class PrepareCustomerPackageFromReservationRequest {

    @NotNull(message = "createdByUserId es obligatorio")
    private Long createdByUserId;

    public Long getCreatedByUserId() {
        return createdByUserId;
    }

    public void setCreatedByUserId(Long createdByUserId) {
        this.createdByUserId = createdByUserId;
    }
}
