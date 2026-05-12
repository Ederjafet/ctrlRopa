package com.hpsqsoft.ctrlropa.useradmin;

import java.time.LocalDateTime;
import java.util.List;

public class UserAdminResponse {

    private Long id;
    private Long branchId;
    private String branchCode;
    private String branchName;
    private String name;
    private String email;
    private String phone;
    private String status;
    private Boolean passwordChangeRequired;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<BranchInfo> branches;
    private List<RoleInfo> roles;
    private List<PermissionInfo> directPermissions;
    private List<PermissionInfo> effectivePermissions;

    public UserAdminResponse(Long id,
                             Long branchId,
                             String branchCode,
                             String branchName,
                             String name,
                             String email,
                             String phone,
                             String status,
                             Boolean passwordChangeRequired,
                             LocalDateTime createdAt,
                             LocalDateTime updatedAt,
                             List<BranchInfo> branches,
                             List<RoleInfo> roles,
                             List<PermissionInfo> directPermissions,
                             List<PermissionInfo> effectivePermissions) {
        this.id = id;
        this.branchId = branchId;
        this.branchCode = branchCode;
        this.branchName = branchName;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.status = status;
        this.passwordChangeRequired = passwordChangeRequired;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.branches = branches;
        this.roles = roles;
        this.directPermissions = directPermissions;
        this.effectivePermissions = effectivePermissions;
    }

    public Long getId() { return id; }
    public Long getBranchId() { return branchId; }
    public String getBranchCode() { return branchCode; }
    public String getBranchName() { return branchName; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getStatus() { return status; }
    public Boolean getPasswordChangeRequired() { return passwordChangeRequired; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public List<BranchInfo> getBranches() { return branches; }
    public List<RoleInfo> getRoles() { return roles; }
    public List<PermissionInfo> getDirectPermissions() { return directPermissions; }
    public List<PermissionInfo> getEffectivePermissions() { return effectivePermissions; }

    public static class BranchInfo {
        private Long id;
        private String code;
        private String name;
        private boolean primary;

        public BranchInfo(Long id, String code, String name, boolean primary) {
            this.id = id;
            this.code = code;
            this.name = name;
            this.primary = primary;
        }

        public Long getId() { return id; }
        public String getCode() { return code; }
        public String getName() { return name; }
        public boolean isPrimary() { return primary; }
    }

    public static class RoleInfo {
        private Long id;
        private String code;
        private String name;

        public RoleInfo(Long id, String code, String name) {
            this.id = id;
            this.code = code;
            this.name = name;
        }

        public Long getId() { return id; }
        public String getCode() { return code; }
        public String getName() { return name; }
    }

    public static class PermissionInfo {
        private Long id;
        private String code;
        private String name;

        public PermissionInfo(Long id, String code, String name) {
            this.id = id;
            this.code = code;
            this.name = name;
        }

        public Long getId() { return id; }
        public String getCode() { return code; }
        public String getName() { return name; }
    }
}
