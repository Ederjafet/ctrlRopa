package com.hpsqsoft.ctrlropa.consignment;

import java.time.LocalDateTime;

public class ConsigneeResponse {

    private Long id;
    private Long branchId;
    private String branchCode;
    private String branchName;
    private String name;
    private String phone;
    private String email;
    private String notes;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ConsigneeResponse(Long id,
                             Long branchId,
                             String branchCode,
                             String branchName,
                             String name,
                             String phone,
                             String email,
                             String notes,
                             String status,
                             LocalDateTime createdAt,
                             LocalDateTime updatedAt) {
        this.id = id;
        this.branchId = branchId;
        this.branchCode = branchCode;
        this.branchName = branchName;
        this.name = name;
        this.phone = phone;
        this.email = email;
        this.notes = notes;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public Long getBranchId() {
        return branchId;
    }

    public String getBranchCode() {
        return branchCode;
    }

    public String getBranchName() {
        return branchName;
    }

    public String getName() {
        return name;
    }

    public String getPhone() {
        return phone;
    }

    public String getEmail() {
        return email;
    }

    public String getNotes() {
        return notes;
    }

    public String getStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}