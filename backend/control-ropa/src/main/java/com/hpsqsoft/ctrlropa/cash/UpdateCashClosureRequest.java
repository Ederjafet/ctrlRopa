package com.hpsqsoft.ctrlropa.cash;

import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class UpdateCashClosureRequest {

    private BigDecimal deliveredCash;

    @Size(max = 500, message = "notes no puede exceder 500 caracteres")
    private String notes;

    public BigDecimal getDeliveredCash() { return deliveredCash; }
    public void setDeliveredCash(BigDecimal deliveredCash) { this.deliveredCash = deliveredCash; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}