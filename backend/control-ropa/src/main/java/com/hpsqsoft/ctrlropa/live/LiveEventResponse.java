package com.hpsqsoft.ctrlropa.live;

import java.time.LocalDateTime;

public class LiveEventResponse {

    private Long id;
    private Long companyId;
    private Long branchId;
    private Long liveId;
    private Long actorUserId;
    private String eventType;
    private String entityType;
    private Long entityId;
    private String payloadJson;
    private LocalDateTime createdAt;

    public LiveEventResponse() {
    }

    public LiveEventResponse(Long id,
                             Long companyId,
                             Long branchId,
                             Long liveId,
                             Long actorUserId,
                             String eventType,
                             String entityType,
                             Long entityId,
                             String payloadJson,
                             LocalDateTime createdAt) {
        this.id = id;
        this.companyId = companyId;
        this.branchId = branchId;
        this.liveId = liveId;
        this.actorUserId = actorUserId;
        this.eventType = eventType;
        this.entityType = entityType;
        this.entityId = entityId;
        this.payloadJson = payloadJson;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public Long getCompanyId() { return companyId; }
    public Long getBranchId() { return branchId; }
    public Long getLiveId() { return liveId; }
    public Long getActorUserId() { return actorUserId; }
    public String getEventType() { return eventType; }
    public String getEntityType() { return entityType; }
    public Long getEntityId() { return entityId; }
    public String getPayloadJson() { return payloadJson; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
