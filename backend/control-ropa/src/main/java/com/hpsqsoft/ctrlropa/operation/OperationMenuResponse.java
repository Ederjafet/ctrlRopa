package com.hpsqsoft.ctrlropa.operation;

import java.util.List;

public class OperationMenuResponse {

    private Long userId;
    private Long branchId;
    private String branchCode;
    private String branchName;
    private List<MenuModule> modules;

    public OperationMenuResponse(Long userId,
                                 Long branchId,
                                 String branchCode,
                                 String branchName,
                                 List<MenuModule> modules) {
        this.userId = userId;
        this.branchId = branchId;
        this.branchCode = branchCode;
        this.branchName = branchName;
        this.modules = modules;
    }

    public Long getUserId() { return userId; }
    public Long getBranchId() { return branchId; }
    public String getBranchCode() { return branchCode; }
    public String getBranchName() { return branchName; }
    public List<MenuModule> getModules() { return modules; }

    public static class MenuModule {

        private String code;
        private String name;
        private Boolean enabled;
        private String reason;

        public MenuModule(String code, String name, Boolean enabled, String reason) {
            this.code = code;
            this.name = name;
            this.enabled = enabled;
            this.reason = reason;
        }

        public String getCode() { return code; }
        public String getName() { return name; }
        public Boolean getEnabled() { return enabled; }
        public String getReason() { return reason; }
    }
}