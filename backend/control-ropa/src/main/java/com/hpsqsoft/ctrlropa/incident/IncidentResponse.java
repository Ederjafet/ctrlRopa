package com.hpsqsoft.ctrlropa.incident;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class IncidentResponse {

    private Long id;
    private Long branchId;
    private String type;
    private String status;
    private Long customerId;
    private Long itemId;
    private Long shipmentId;
    private Long shipmentPackageId; 
    private Long customerOrderId;
    private BigDecimal expectedAmount;
    private BigDecimal receivedAmount;
    private BigDecimal differenceAmount;
    private String description;
    private String evidenceUrl;
    private LocalDateTime createdAt;
    private Long createdByUserId;
    private LocalDateTime inProgressAt;
    private LocalDateTime resolvedAt;
    private Long resolvedByUserId;
    private LocalDateTime cancelledAt;
    private Long cancelledByUserId;

    public IncidentResponse(Long id,
                            Long branchId,
                            String type,
                            String status,
                            Long customerId,
                            Long itemId,
                            Long shipmentId,
                            Long shipmentPackageId, 
                            Long customerOrderId,
                            BigDecimal expectedAmount,
                            BigDecimal receivedAmount,
                            BigDecimal differenceAmount,
                            String description,
                            String evidenceUrl,
                            LocalDateTime createdAt,
                            Long createdByUserId,
                            LocalDateTime inProgressAt,
                            LocalDateTime resolvedAt,
                            Long resolvedByUserId,
                            LocalDateTime cancelledAt,
                            Long cancelledByUserId) {
        this.id = id;
        this.branchId = branchId;
        this.type = type;
        this.status = status;
        this.customerId = customerId;
        this.itemId = itemId;
        this.shipmentId = shipmentId;
        this.shipmentPackageId = shipmentPackageId; 
        this.customerOrderId = customerOrderId;
        this.expectedAmount = expectedAmount;
        this.receivedAmount = receivedAmount;
        this.differenceAmount = differenceAmount;
        this.description = description;
        this.evidenceUrl = evidenceUrl;
        this.createdAt = createdAt;
        this.createdByUserId = createdByUserId;
        this.inProgressAt = inProgressAt;
        this.resolvedAt = resolvedAt;
        this.resolvedByUserId = resolvedByUserId;
        this.cancelledAt = cancelledAt;
        this.cancelledByUserId = cancelledByUserId;
    }

    public Long getId() {
        return id;
    }

    public Long getBranchId() {
        return branchId;
    }

    public String getType() {
        return type;
    }

    public String getStatus() {
        return status;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public Long getItemId() {
        return itemId;
    }

    public Long getShipmentId() {
        return shipmentId;
    }

    public Long getShipmentPackageId() { 
        return shipmentPackageId;
    }

    public Long getCustomerOrderId() {
        return customerOrderId;
    }

    public BigDecimal getExpectedAmount() {
        return expectedAmount;
    }

    public BigDecimal getReceivedAmount() {
        return receivedAmount;
    }

    public BigDecimal getDifferenceAmount() {
        return differenceAmount;
    }

    public String getDescription() {
        return description;
    }

    public String getEvidenceUrl() {
        return evidenceUrl;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public Long getCreatedByUserId() {
        return createdByUserId;
    }

    public LocalDateTime getInProgressAt() {
        return inProgressAt;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public Long getResolvedByUserId() {
        return resolvedByUserId;
    }

    public LocalDateTime getCancelledAt() {
        return cancelledAt;
    }

    public Long getCancelledByUserId() {
        return cancelledByUserId;
    }
}