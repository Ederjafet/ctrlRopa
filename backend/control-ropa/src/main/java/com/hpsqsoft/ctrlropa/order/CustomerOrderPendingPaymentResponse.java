package com.hpsqsoft.ctrlropa.order;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CustomerOrderPendingPaymentResponse {

    private Long id;
    private Long customerId;
    private String customerName;
    private Long branchId;
    private String branchCode;
    private String status;
    private LocalDateTime createdAt;
    private String salesChannelCode;
    private BigDecimal total;
    private BigDecimal paid;
    private BigDecimal pending;
    private Integer itemCount;
    private Integer activeReservationCount;

    public CustomerOrderPendingPaymentResponse(Long id,
                                               Long customerId,
                                               String customerName,
                                               Long branchId,
                                               String branchCode,
                                               String status,
                                               LocalDateTime createdAt,
                                               String salesChannelCode,
                                               BigDecimal total,
                                               BigDecimal paid,
                                               BigDecimal pending,
                                               Integer itemCount,
                                               Integer activeReservationCount) {
        this.id = id;
        this.customerId = customerId;
        this.customerName = customerName;
        this.branchId = branchId;
        this.branchCode = branchCode;
        this.status = status;
        this.createdAt = createdAt;
        this.salesChannelCode = salesChannelCode;
        this.total = total;
        this.paid = paid;
        this.pending = pending;
        this.itemCount = itemCount;
        this.activeReservationCount = activeReservationCount;
    }

    public Long getId() { return id; }
    public Long getCustomerId() { return customerId; }
    public String getCustomerName() { return customerName; }
    public Long getBranchId() { return branchId; }
    public String getBranchCode() { return branchCode; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getSalesChannelCode() { return salesChannelCode; }
    public BigDecimal getTotal() { return total; }
    public BigDecimal getPaid() { return paid; }
    public BigDecimal getPending() { return pending; }
    public Integer getItemCount() { return itemCount; }
    public Integer getActiveReservationCount() { return activeReservationCount; }
}
