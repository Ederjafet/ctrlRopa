package com.hpsqsoft.ctrlropa.shipment;

import jakarta.validation.constraints.NotNull;

public class AddPackageRequest {

    @NotNull
    private Long customerPackageId;

    public Long getCustomerPackageId() { return customerPackageId; }
    public void setCustomerPackageId(Long customerPackageId) { this.customerPackageId = customerPackageId; }
}