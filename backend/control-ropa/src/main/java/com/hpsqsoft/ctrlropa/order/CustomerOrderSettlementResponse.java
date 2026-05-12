package com.hpsqsoft.ctrlropa.order;

import java.math.BigDecimal;

public class CustomerOrderSettlementResponse {

    private Long orderId;
    private BigDecimal total;
    private BigDecimal directPaid;
    private BigDecimal appliedBalance;
    private BigDecimal paid;
    private BigDecimal pending;
    private String status;

    public CustomerOrderSettlementResponse(Long orderId,
                                           BigDecimal total,
                                           BigDecimal directPaid,
                                           BigDecimal appliedBalance,
                                           BigDecimal paid,
                                           BigDecimal pending,
                                           String status) {
        this.orderId = orderId;
        this.total = total;
        this.directPaid = directPaid;
        this.appliedBalance = appliedBalance;
        this.paid = paid;
        this.pending = pending;
        this.status = status;
    }

    public Long getOrderId() {
        return orderId;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public BigDecimal getDirectPaid() {
        return directPaid;
    }

    public BigDecimal getAppliedBalance() {
        return appliedBalance;
    }

    public BigDecimal getPaid() {
        return paid;
    }

    public BigDecimal getPending() {
        return pending;
    }

    public String getStatus() {
        return status;
    }
}