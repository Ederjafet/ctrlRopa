package com.hpsqsoft.ctrlropa.inventory;

import java.time.LocalDateTime;

public class StorageLocationResponse {

    private Long id;
    private Long branchId;
    private String branchCode;
    private String branchName;
    private String code;
    private String name;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public StorageLocationResponse(Long id,
                                   Long branchId,
                                   String branchCode,
                                   String branchName,
                                   String code,
                                   String name,
                                   String status,
                                   LocalDateTime createdAt,
                                   LocalDateTime updatedAt) {
        this.id = id;
        this.branchId = branchId;
        this.branchCode = branchCode;
        this.branchName = branchName;
        this.code = code;
        this.name = name;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() { return id; }
    public Long getBranchId() { return branchId; }
    public String getBranchCode() { return branchCode; }
    public String getBranchName() { return branchName; }
    public String getCode() { return code; }
    public String getName() { return name; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}