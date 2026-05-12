package com.hpsqsoft.ctrlropa.inventory;

import java.time.LocalDateTime;

public class BoxResponse {

    private Long id;
    private Long branchId;
    private String branchCode;
    private String branchName;
    private String code;
    private String description;
    private String qrCode;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public BoxResponse(Long id,
                       Long branchId,
                       String branchCode,
                       String branchName,
                       String code,
                       String description,
                       String qrCode,
                       String status,
                       LocalDateTime createdAt,
                       LocalDateTime updatedAt) {
        this.id = id;
        this.branchId = branchId;
        this.branchCode = branchCode;
        this.branchName = branchName;
        this.code = code;
        this.description = description;
        this.qrCode = qrCode;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() { return id; }
    public Long getBranchId() { return branchId; }
    public String getBranchCode() { return branchCode; }
    public String getBranchName() { return branchName; }
    public String getCode() { return code; }
    public String getDescription() { return description; }
    public String getQrCode() { return qrCode; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}