package com.hpsqsoft.ctrlropa.balance;

import jakarta.validation.constraints.NotNull;

public class ReverseBalanceApplicationRequest {

    @NotNull(message = "movementId es obligatorio")
    private Long movementId;

    private String notes;

    @NotNull(message = "createdByUserId es obligatorio")
    private Long createdByUserId;

    public Long getMovementId() {
        return movementId;
    }

    public void setMovementId(Long movementId) {
        this.movementId = movementId;
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