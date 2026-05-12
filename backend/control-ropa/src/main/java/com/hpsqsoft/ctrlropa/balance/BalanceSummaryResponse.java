package com.hpsqsoft.ctrlropa.balance;

import java.math.BigDecimal;

public class BalanceSummaryResponse {

    private Long customerId;
    private BigDecimal balance;

    public BalanceSummaryResponse(Long customerId, BigDecimal balance) {
        this.customerId = customerId;
        this.balance = balance;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public BigDecimal getBalance() {
        return balance;
    }
}