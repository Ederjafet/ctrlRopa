package com.hpsqsoft.ctrlropa.operationauth;

import java.time.LocalDateTime;

public class OperationalAuthorizationResponse {
    private final Long id;
    private final String operationType;
    private final String status;
    private final Long companyId;
    private final Long branchId;
    private final Long requestedByUserId;
    private final LocalDateTime requestedAt;
    private final Long decidedByUserId;
    private final LocalDateTime decidedAt;
    private final Long appliedByUserId;
    private final LocalDateTime appliedAt;
    private final LocalDateTime expiresAt;
    private final String targetType;
    private final Long targetId;
    private final Long liveId;
    private final Long reservationId;
    private final Long itemId;
    private final Long paymentId;
    private final Long saleId;
    private final String reason;
    private final String decisionReason;
    private final String currentStateHash;
    private final String snapshotJson;
    private final String payloadJson;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public OperationalAuthorizationResponse(OperationalAuthorizationRequest request) {
        this.id = request.getId();
        this.operationType = request.getOperationType().name();
        this.status = request.getStatus().name();
        this.companyId = request.getCompanyId();
        this.branchId = request.getBranchId();
        this.requestedByUserId = request.getRequestedByUserId();
        this.requestedAt = request.getRequestedAt();
        this.decidedByUserId = request.getDecidedByUserId();
        this.decidedAt = request.getDecidedAt();
        this.appliedByUserId = request.getAppliedByUserId();
        this.appliedAt = request.getAppliedAt();
        this.expiresAt = request.getExpiresAt();
        this.targetType = request.getTargetType().name();
        this.targetId = request.getTargetId();
        this.liveId = request.getLiveId();
        this.reservationId = request.getReservationId();
        this.itemId = request.getItemId();
        this.paymentId = request.getPaymentId();
        this.saleId = request.getSaleId();
        this.reason = request.getReason();
        this.decisionReason = request.getDecisionReason();
        this.currentStateHash = request.getCurrentStateHash();
        this.snapshotJson = request.getSnapshotJson();
        this.payloadJson = request.getPayloadJson();
        this.createdAt = request.getCreatedAt();
        this.updatedAt = request.getUpdatedAt();
    }

    public Long getId() { return id; }
    public String getOperationType() { return operationType; }
    public String getStatus() { return status; }
    public Long getCompanyId() { return companyId; }
    public Long getBranchId() { return branchId; }
    public Long getRequestedByUserId() { return requestedByUserId; }
    public LocalDateTime getRequestedAt() { return requestedAt; }
    public Long getDecidedByUserId() { return decidedByUserId; }
    public LocalDateTime getDecidedAt() { return decidedAt; }
    public Long getAppliedByUserId() { return appliedByUserId; }
    public LocalDateTime getAppliedAt() { return appliedAt; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public String getTargetType() { return targetType; }
    public Long getTargetId() { return targetId; }
    public Long getLiveId() { return liveId; }
    public Long getReservationId() { return reservationId; }
    public Long getItemId() { return itemId; }
    public Long getPaymentId() { return paymentId; }
    public Long getSaleId() { return saleId; }
    public String getReason() { return reason; }
    public String getDecisionReason() { return decisionReason; }
    public String getCurrentStateHash() { return currentStateHash; }
    public String getSnapshotJson() { return snapshotJson; }
    public String getPayloadJson() { return payloadJson; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
