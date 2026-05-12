package com.hpsqsoft.ctrlropa.live;

import java.time.LocalDateTime;

public class LiveResponse {

    private Long id;
    private Long branchId;
    private String branchCode;
    private String branchName;
    private String status;
    private String notes;
    private Long createdByUserId;
    private LocalDateTime createdAt;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;

    public LiveResponse() {
    }

    public LiveResponse(Long id,
                        Long branchId,
                        String branchCode,
                        String branchName,
                        String status,
                        String notes,
                        Long createdByUserId,
                        LocalDateTime createdAt,
                        LocalDateTime startedAt,
                        LocalDateTime endedAt) {
        this.id = id;
        this.branchId = branchId;
        this.branchCode = branchCode;
        this.branchName = branchName;
        this.status = status;
        this.notes = notes;
        this.createdByUserId = createdByUserId;
        this.createdAt = createdAt;
        this.startedAt = startedAt;
        this.endedAt = endedAt;
    }

    public Long getId() { return id; }
    public Long getBranchId() { return branchId; }
    public String getBranchCode() { return branchCode; }
    public String getBranchName() { return branchName; }
    public String getStatus() { return status; }
    public String getNotes() { return notes; }
    public Long getCreatedByUserId() { return createdByUserId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public LocalDateTime getEndedAt() { return endedAt; }
}