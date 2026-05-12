package com.hpsqsoft.ctrlropa.customerpackage;

import jakarta.validation.constraints.NotNull;

public class CancelCustomerPackageRequest {

    private String notes;

    @NotNull(message = "closedByUserId es obligatorio")
    private Long closedByUserId;

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Long getClosedByUserId() {
        return closedByUserId;
    }

    public void setClosedByUserId(Long closedByUserId) {
        this.closedByUserId = closedByUserId;
    }
}