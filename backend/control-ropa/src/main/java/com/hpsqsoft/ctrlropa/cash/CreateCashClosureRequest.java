package com.hpsqsoft.ctrlropa.cash;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public class CreateCashClosureRequest {

    @NotNull(message = "branchId es obligatorio")
    private Long branchId;

    @NotNull(message = "closureDate es obligatorio")
    private LocalDate closureDate;

    private BigDecimal deliveredCash;

    @Size(max = 500, message = "notes no puede exceder 500 caracteres")
    private String notes;

    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }

    public LocalDate getClosureDate() { return closureDate; }
    public void setClosureDate(LocalDate closureDate) { this.closureDate = closureDate; }

    public BigDecimal getDeliveredCash() { return deliveredCash; }
    public void setDeliveredCash(BigDecimal deliveredCash) { this.deliveredCash = deliveredCash; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}