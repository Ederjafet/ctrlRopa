package com.hpsqsoft.ctrlropa.balance.dto;

import java.math.BigDecimal;

public class ApplyBalanceRequest {

    private Long customerId;
    private Long customerOrderId;
    private BigDecimal amount;

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public Long getCustomerOrderId() {
        return customerOrderId;
    }

    public void setCustomerOrderId(Long customerOrderId) {
        this.customerOrderId = customerOrderId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }
}