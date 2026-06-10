package com.hpsqsoft.ctrlropa.operationauth;

public class OperationalAuthorizationCreateRequest {
    private OperationalAuthorizationType operationType;
    private OperationalAuthorizationTargetType targetType;
    private Long targetId;
    private Long branchId;
    private Long liveId;
    private Long reservationId;
    private Long itemId;
    private Long paymentId;
    private Long saleId;
    private String reason;
    private String payloadJson;

    public OperationalAuthorizationType getOperationType() { return operationType; }
    public void setOperationType(OperationalAuthorizationType operationType) { this.operationType = operationType; }
    public OperationalAuthorizationTargetType getTargetType() { return targetType; }
    public void setTargetType(OperationalAuthorizationTargetType targetType) { this.targetType = targetType; }
    public Long getTargetId() { return targetId; }
    public void setTargetId(Long targetId) { this.targetId = targetId; }
    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }
    public Long getLiveId() { return liveId; }
    public void setLiveId(Long liveId) { this.liveId = liveId; }
    public Long getReservationId() { return reservationId; }
    public void setReservationId(Long reservationId) { this.reservationId = reservationId; }
    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    public Long getPaymentId() { return paymentId; }
    public void setPaymentId(Long paymentId) { this.paymentId = paymentId; }
    public Long getSaleId() { return saleId; }
    public void setSaleId(Long saleId) { this.saleId = saleId; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getPayloadJson() { return payloadJson; }
    public void setPayloadJson(String payloadJson) { this.payloadJson = payloadJson; }
}
