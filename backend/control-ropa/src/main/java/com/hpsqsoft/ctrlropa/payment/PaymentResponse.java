package com.hpsqsoft.ctrlropa.payment;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class PaymentResponse {

    private Long id;
    private Long customerId;
    private Long branchId;
    private BigDecimal receivedAmount;
    private Long paymentMethodId;
    private String paymentMethodCode;
    private String reference;
    private String status;
    private LocalDateTime createdAt;
    private Long createdByUserId;
    private List<AllocationLine> allocations;

    public PaymentResponse(Long id,
                           Long customerId,
                           Long branchId,
                           BigDecimal receivedAmount,
                           Long paymentMethodId,
                           String paymentMethodCode,
                           String reference,
                           String status,
                           LocalDateTime createdAt,
                           Long createdByUserId,
                           List<AllocationLine> allocations) {
        this.id = id;
        this.customerId = customerId;
        this.branchId = branchId;
        this.receivedAmount = receivedAmount;
        this.paymentMethodId = paymentMethodId;
        this.paymentMethodCode = paymentMethodCode;
        this.reference = reference;
        this.status = status;
        this.createdAt = createdAt;
        this.createdByUserId = createdByUserId;
        this.allocations = allocations;
    }

    public Long getId() {
        return id;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public Long getBranchId() {
        return branchId;
    }

    public BigDecimal getReceivedAmount() {
        return receivedAmount;
    }

    public Long getPaymentMethodId() {
        return paymentMethodId;
    }

    public String getPaymentMethodCode() {
        return paymentMethodCode;
    }

    public String getReference() {
        return reference;
    }

    public String getStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public Long getCreatedByUserId() {
        return createdByUserId;
    }

    public List<AllocationLine> getAllocations() {
        return allocations;
    }

    public static class AllocationLine {
        private Long id;
        private Long saleId;
        private Long reservationId;
        private BigDecimal amount;
        private LocalDateTime createdAt;

        public AllocationLine(Long id,
                              Long saleId,
                              Long reservationId,
                              BigDecimal amount,
                              LocalDateTime createdAt) {
            this.id = id;
            this.saleId = saleId;
            this.reservationId = reservationId;
            this.amount = amount;
            this.createdAt = createdAt;
        }

        public Long getId() {
            return id;
        }

        public Long getSaleId() {
            return saleId;
        }

        public Long getReservationId() {
            return reservationId;
        }

        public BigDecimal getAmount() {
            return amount;
        }

        public LocalDateTime getCreatedAt() {
            return createdAt;
        }
    }
}