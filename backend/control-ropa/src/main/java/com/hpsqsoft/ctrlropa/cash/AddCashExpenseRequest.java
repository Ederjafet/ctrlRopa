package com.hpsqsoft.ctrlropa.cash;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class AddCashExpenseRequest {

    @NotBlank(message = "concept es obligatorio")
    @Size(max = 180, message = "concept no puede exceder 180 caracteres")
    private String concept;

    @NotNull(message = "amount es obligatorio")
    private BigDecimal amount;

    @Size(max = 500, message = "notes no puede exceder 500 caracteres")
    private String notes;

    public String getConcept() { return concept; }
    public void setConcept(String concept) { this.concept = concept; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}