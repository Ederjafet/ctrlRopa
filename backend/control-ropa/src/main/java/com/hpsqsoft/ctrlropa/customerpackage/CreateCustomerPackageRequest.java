package com.hpsqsoft.ctrlropa.customerpackage;

import jakarta.validation.constraints.NotNull;

public class CreateCustomerPackageRequest {

    @NotNull(message = "customerId es obligatorio")
    private Long customerId;

    @NotNull(message = "branchId es obligatorio")
    private Long branchId;

    private String notes;

    @NotNull(message = "createdByUserId es obligatorio")
    private Long createdByUserId;

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public Long getBranchId() {
        return branchId;
    }

    public void setBranchId(Long branchId) {
        this.branchId = branchId;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Long getCreatedByUserId() {
        return createdByUserId;
    }

    public void setCreatedByUserId(Long createdByUserId) {
        this.createdByUserId = createdByUserId;
    }
}