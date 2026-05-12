package com.hpsqsoft.ctrlropa.payment;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "payment_applications")
public class PaymentApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "payment_transaction_id", nullable = false)
    private Long paymentTransactionId;

    @Column(name = "customer_order_id", nullable = false)
    private Long customerOrderId;

    @Column(nullable = false)
    private BigDecimal amount;

    public Long getId() { return id; }

    public Long getPaymentTransactionId() { return paymentTransactionId; }
    public void setPaymentTransactionId(Long paymentTransactionId) { this.paymentTransactionId = paymentTransactionId; }

    public Long getCustomerOrderId() { return customerOrderId; }
    public void setCustomerOrderId(Long customerOrderId) { this.customerOrderId = customerOrderId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
}