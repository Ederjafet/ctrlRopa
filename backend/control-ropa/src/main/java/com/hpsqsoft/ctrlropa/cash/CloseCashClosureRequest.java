package com.hpsqsoft.ctrlropa.cash;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class CloseCashClosureRequest {

    @NotNull(message = "deliveredCash es obligatorio")
    private BigDecimal deliveredCash;

    @NotNull(message = "closedByUserId es obligatorio")
    private Long closedByUserId;

    @Size(max = 500, message = "notes no puede exceder 500 caracteres")
    private String notes;

    public BigDecimal getDeliveredCash() {
        return deliveredCash;
    }

    public void setDeliveredCash(BigDecimal deliveredCash) {
        this.deliveredCash = deliveredCash;
    }

    public Long getClosedByUserId() {
        return closedByUserId;
    }

    public void setClosedByUserId(Long closedByUserId) {
        this.closedByUserId = closedByUserId;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}