package com.hpsqsoft.ctrlropa.payment;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class CreatePaymentByItemRequest {

    @NotNull(message = "amount es obligatorio")
    @DecimalMin(value = "0.01", message = "amount debe ser mayor a 0")
    private BigDecimal amount;

    @NotNull(message = "paymentMethodId es obligatorio")
    private Long paymentMethodId;

    private String reference;

    @NotNull(message = "createdByUserId es obligatorio")
    private Long createdByUserId;

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public Long getPaymentMethodId() {
        return paymentMethodId;
    }

    public void setPaymentMethodId(Long paymentMethodId) {
        this.paymentMethodId = paymentMethodId;
    }

    public String getReference() {
        return reference;
    }

    public void setReference(String reference) {
        this.reference = reference;
    }

    public Long getCreatedByUserId() {
        return createdByUserId;
    }

    public void setCreatedByUserId(Long createdByUserId) {
        this.createdByUserId = createdByUserId;
    }
}