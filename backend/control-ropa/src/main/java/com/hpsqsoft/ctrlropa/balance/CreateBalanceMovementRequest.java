package com.hpsqsoft.ctrlropa.balance;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class CreateBalanceMovementRequest {

    @NotNull(message = "customerId es obligatorio")
    private Long customerId;

    @NotNull(message = "branchId es obligatorio")
    private Long branchId;

    @NotNull(message = "type es obligatorio")
    private CustomerBalanceMovementType type;

    @NotNull(message = "amount es obligatorio")
    @DecimalMin(value = "0.01", message = "amount debe ser mayor a 0")
    private BigDecimal amount;

    private Long paymentId;

    private Long customerOrderId;

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

    public CustomerBalanceMovementType getType() {
        return type;
    }

    public void setType(CustomerBalanceMovementType type) {
        this.type = type;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public Long getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(Long paymentId) {
        this.paymentId = paymentId;
    }

    public Long getCustomerOrderId() {
        return customerOrderId;
    }

    public void setCustomerOrderId(Long customerOrderId) {
        this.customerOrderId = customerOrderId;
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