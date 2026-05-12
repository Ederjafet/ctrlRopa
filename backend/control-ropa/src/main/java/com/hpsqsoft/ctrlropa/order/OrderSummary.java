package com.hpsqsoft.ctrlropa.order;

import java.math.BigDecimal;

public class OrderSummary {

    private BigDecimal total;
    private BigDecimal paid;
    private BigDecimal pending;

    public OrderSummary(BigDecimal total, BigDecimal paid, BigDecimal pending) {
        this.total = total;
        this.paid = paid;
        this.pending = pending;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public BigDecimal getPaid() {
        return paid;
    }

    public BigDecimal getPending() {
        return pending;
    }
}