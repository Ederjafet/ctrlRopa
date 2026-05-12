package com.hpsqsoft.ctrlropa.refund;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class RefundResponse {

    private Long id;
    private Long returnId;
    private Long saleId;
    private Long customerId;
    private Long customerOrderId;
    private Long branchId;
    private BigDecimal amount;
    private String method;
    private String status;
    private String reason;
    private String notes;
    private Long createdByUserId;
    private Long approvedByUserId;
    private Long processedByUserId;
    private Long cancelledByUserId;
    private LocalDateTime createdAt;
    private LocalDateTime approvedAt;
    private LocalDateTime processedAt;
    private LocalDateTime cancelledAt;
    private String cancelReason;

    public RefundResponse(Long id,
                          Long returnId,
                          Long saleId,
                          Long customerId,
                          Long customerOrderId,
                          Long branchId,
                          BigDecimal amount,
                          String method,
                          String status,
                          String reason,
                          String notes,
                          Long createdByUserId,
                          Long approvedByUserId,
                          Long processedByUserId,
                          Long cancelledByUserId,
                          LocalDateTime createdAt,
                          LocalDateTime approvedAt,
                          LocalDateTime processedAt,
                          LocalDateTime cancelledAt,
                          String cancelReason) {
        this.id = id;
        this.returnId = returnId;
        this.saleId = saleId;
        this.customerId = customerId;
        this.customerOrderId = customerOrderId;
        this.branchId = branchId;
        this.amount = amount;
        this.method = method;
        this.status = status;
        this.reason = reason;
        this.notes = notes;
        this.createdByUserId = createdByUserId;
        this.approvedByUserId = approvedByUserId;
        this.processedByUserId = processedByUserId;
        this.cancelledByUserId = cancelledByUserId;
        this.createdAt = createdAt;
        this.approvedAt = approvedAt;
        this.processedAt = processedAt;
        this.cancelledAt = cancelledAt;
        this.cancelReason = cancelReason;
    }

    public Long getId() { return id; }
    public Long getReturnId() { return returnId; }
    public Long getSaleId() { return saleId; }
    public Long getCustomerId() { return customerId; }
    public Long getCustomerOrderId() { return customerOrderId; }
    public Long getBranchId() { return branchId; }
    public BigDecimal getAmount() { return amount; }
    public String getMethod() { return method; }
    public String getStatus() { return status; }
    public String getReason() { return reason; }
    public String getNotes() { return notes; }
    public Long getCreatedByUserId() { return createdByUserId; }
    public Long getApprovedByUserId() { return approvedByUserId; }
    public Long getProcessedByUserId() { return processedByUserId; }
    public Long getCancelledByUserId() { return cancelledByUserId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getApprovedAt() { return approvedAt; }
    public LocalDateTime getProcessedAt() { return processedAt; }
    public LocalDateTime getCancelledAt() { return cancelledAt; }
    public String getCancelReason() { return cancelReason; }
}