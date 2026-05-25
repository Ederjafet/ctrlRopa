package com.hpsqsoft.ctrlropa.auth;

import java.util.List;

public class LoginResponse {

    private Long userId;
    private String name;
    private String email;
    private String phone;
    private String status;
    private String sessionToken;
    private Integer sessionTimeoutMinutes;
    private Boolean passwordChangeRequired;
    private CompanyInfo company;
    private BranchInfo branch;
    private List<RoleInfo> roles;
    private List<PermissionInfo> effectivePermissions;
    private List<ChannelInfo> channels;

    public LoginResponse(Long userId,
                         String name,
                         String email,
                         String phone,
                         String status,
                         String sessionToken,
                         Integer sessionTimeoutMinutes,
                         Boolean passwordChangeRequired,
                         CompanyInfo company,
                         BranchInfo branch,
                         List<RoleInfo> roles,
                         List<PermissionInfo> effectivePermissions,
                         List<ChannelInfo> channels) {
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.status = status;
        this.sessionToken = sessionToken;
        this.sessionTimeoutMinutes = sessionTimeoutMinutes;
        this.passwordChangeRequired = passwordChangeRequired;
        this.company = company;
        this.branch = branch;
        this.roles = roles;
        this.effectivePermissions = effectivePermissions;
        this.channels = channels;
    }

    public Long getUserId() { return userId; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getStatus() { return status; }
    public String getSessionToken() { return sessionToken; }
    public Integer getSessionTimeoutMinutes() { return sessionTimeoutMinutes; }
    public Boolean getPasswordChangeRequired() { return passwordChangeRequired; }
    public CompanyInfo getCompany() { return company; }
    public BranchInfo getBranch() { return branch; }
    public List<RoleInfo> getRoles() { return roles; }
    public List<PermissionInfo> getEffectivePermissions() { return effectivePermissions; }
    public List<ChannelInfo> getChannels() { return channels; }

    public static class CompanyInfo {
        private Long id;
        private String code;
        private String name;

        public CompanyInfo(Long id, String code, String name) {
            this.id = id;
            this.code = code;
            this.name = name;
        }

        public Long getId() { return id; }
        public String getCode() { return code; }
        public String getName() { return name; }
    }

    public static class BranchInfo {
        private Long id;
        private String code;
        private String name;
        private String status;

        public BranchInfo(Long id, String code, String name, String status) {
            this.id = id;
            this.code = code;
            this.name = name;
            this.status = status;
        }

        public Long getId() { return id; }
        public String getCode() { return code; }
        public String getName() { return name; }
        public String getStatus() { return status; }
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

    public static class ChannelInfo {
        private Long id;
        private String code;
        private String name;
        private String status;
        private Boolean enabled;

        public ChannelInfo(Long id, String code, String name, String status, Boolean enabled) {
            this.id = id;
            this.code = code;
            this.name = name;
            this.status = status;
            this.enabled = enabled;
        }

        public Long getId() { return id; }
        public String getCode() { return code; }
        public String getName() { return name; }
        public String getStatus() { return status; }
        public Boolean getEnabled() { return enabled; }
    }
}
