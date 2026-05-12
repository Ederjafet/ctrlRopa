package com.hpsqsoft.ctrlropa.refund;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class CreateRefundRequest {

    @NotNull(message = "returnId es obligatorio")
    private Long returnId;

    @NotNull(message = "amount es obligatorio")
    private BigDecimal amount;

    @NotNull(message = "method es obligatorio")
    private RefundMethod method;

    @NotBlank(message = "reason es obligatorio")
    @Size(max = 255, message = "reason no puede exceder 255 caracteres")
    private String reason;

    @Size(max = 500, message = "notes no puede exceder 500 caracteres")
    private String notes;

    private Long createdByUserId;

    public Long getReturnId() {
        return returnId;
    }

    public void setReturnId(Long returnId) {
        this.returnId = returnId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public RefundMethod getMethod() {
        return method;
    }

    public void setMethod(RefundMethod method) {
        this.method = method;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
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