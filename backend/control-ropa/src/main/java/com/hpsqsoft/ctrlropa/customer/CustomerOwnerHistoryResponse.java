package com.hpsqsoft.ctrlropa.customer;

import java.time.LocalDateTime;

public class CustomerOwnerHistoryResponse {

    private Long id;
    private Long customerId;
    private Long fromUserId;
    private Long toUserId;
    private String reason;
    private LocalDateTime changedAt;
    private Long changedByUserId;

    public CustomerOwnerHistoryResponse() {
    }

    public CustomerOwnerHistoryResponse(Long id,
                                        Long customerId,
                                        Long fromUserId,
                                        Long toUserId,
                                        String reason,
                                        LocalDateTime changedAt,
                                        Long changedByUserId) {
        this.id = id;
        this.customerId = customerId;
        this.fromUserId = fromUserId;
        this.toUserId = toUserId;
        this.reason = reason;
        this.changedAt = changedAt;
        this.changedByUserId = changedByUserId;
    }

    public Long getId() { return id; }
    public Long getCustomerId() { return customerId; }
    public Long getFromUserId() { return fromUserId; }
    public Long getToUserId() { return toUserId; }
    public String getReason() { return reason; }
    public LocalDateTime getChangedAt() { return changedAt; }
    public Long getChangedByUserId() { return changedByUserId; }
}