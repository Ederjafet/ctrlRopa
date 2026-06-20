package com.hpsqsoft.ctrlropa.platform;

import jakarta.validation.constraints.Size;

public class UpdatePlatformCompanyUserRequest {

    @Size(max = 150, message = "name no puede exceder 150 caracteres")
    private String name;

    @Size(max = 40, message = "phone no puede exceder 40 caracteres")
    private String phone;

    @Size(max = 20, message = "status no puede exceder 20 caracteres")
    private String status;

    @Size(max = 64, message = "role no puede exceder 64 caracteres")
    private String role;

    private Long branchId;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }
}
