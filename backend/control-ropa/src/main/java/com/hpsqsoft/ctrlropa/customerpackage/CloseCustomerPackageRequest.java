package com.hpsqsoft.ctrlropa.customerpackage;

import jakarta.validation.constraints.NotNull;

public class CloseCustomerPackageRequest {

    @NotNull(message = "closedByUserId es obligatorio")
    private Long closedByUserId;

    public Long getClosedByUserId() {
        return closedByUserId;
    }

    public void setClosedByUserId(Long closedByUserId) {
        this.closedByUserId = closedByUserId;
    }
}