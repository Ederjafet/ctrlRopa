package com.hpsqsoft.ctrlropa.security.me;

import java.util.List;

public class MeResponse {

    private Long userId;
    private String name;
    private String email;
    private String phone;
    private String status;
    private Boolean passwordChangeRequired;

    private CompanyInfo company;
    private BranchInfo branch;
    private List<RoleInfo> roles;
    private List<PermissionInfo> permissions;
    private List<ChannelInfo> channels;
    private List<String> enabledModules;

    public MeResponse() {
    }

    public MeResponse(Long userId,
                      String name,
                      String email,
                      String phone,
                      String status,
                      Boolean passwordChangeRequired,
                      CompanyInfo company,
                      BranchInfo branch,
                      List<RoleInfo> roles,
                      List<PermissionInfo> permissions,
                      List<ChannelInfo> channels,
                      List<String> enabledModules) {
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.status = status;
        this.passwordChangeRequired = passwordChangeRequired;
        this.company = company;
        this.branch = branch;
        this.roles = roles;
        this.permissions = permissions;
        this.channels = channels;
        this.enabledModules = enabledModules;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Boolean getPasswordChangeRequired() { return passwordChangeRequired; }
    public void setPasswordChangeRequired(Boolean passwordChangeRequired) { this.passwordChangeRequired = passwordChangeRequired; }

    public CompanyInfo getCompany() { return company; }
    public void setCompany(CompanyInfo company) { this.company = company; }

    public BranchInfo getBranch() { return branch; }
    public void setBranch(BranchInfo branch) { this.branch = branch; }

    public List<RoleInfo> getRoles() { return roles; }
    public void setRoles(List<RoleInfo> roles) { this.roles = roles; }

    public List<PermissionInfo> getPermissions() { return permissions; }
    public void setPermissions(List<PermissionInfo> permissions) { this.permissions = permissions; }

    public List<ChannelInfo> getChannels() { return channels; }
    public void setChannels(List<ChannelInfo> channels) { this.channels = channels; }

    public List<String> getEnabledModules() { return enabledModules; }
    public void setEnabledModules(List<String> enabledModules) { this.enabledModules = enabledModules; }

    public static class CompanyInfo {
        private Long id;
        private String code;
        private String name;

        public CompanyInfo() {
        }

        public CompanyInfo(Long id, String code, String name) {
            this.id = id;
            this.code = code;
            this.name = name;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
    }

    public static class BranchInfo {
        private Long id;
        private String code;
        private String name;
        private String status;

        public BranchInfo() {
        }

        public BranchInfo(Long id, String code, String name, String status) {
            this.id = id;
            this.code = code;
            this.name = name;
            this.status = status;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    public static class RoleInfo {
        private Long id;
        private String code;
        private String name;

        public RoleInfo() {
        }

        public RoleInfo(Long id, String code, String name) {
            this.id = id;
            this.code = code;
            this.name = name;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
    }

    public static class PermissionInfo {
        private Long id;
        private String code;
        private String name;

        public PermissionInfo() {
        }

        public PermissionInfo(Long id, String code, String name) {
            this.id = id;
            this.code = code;
            this.name = name;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
    }

    public static class ChannelInfo {
        private Long id;
        private String code;
        private String name;
        private String status;
        private Boolean enabled;

        public ChannelInfo() {
        }

        public ChannelInfo(Long id, String code, String name, String status, Boolean enabled) {
            this.id = id;
            this.code = code;
            this.name = name;
            this.status = status;
            this.enabled = enabled;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public Boolean getEnabled() { return enabled; }
        public void setEnabled(Boolean enabled) { this.enabled = enabled; }
    }
}
