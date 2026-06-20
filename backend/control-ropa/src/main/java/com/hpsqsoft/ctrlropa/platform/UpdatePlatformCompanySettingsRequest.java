package com.hpsqsoft.ctrlropa.platform;

import java.util.List;

public class UpdatePlatformCompanySettingsRequest {

    private List<ModuleSetting> modules;
    private Integer maxUsers;
    private Integer maxBranches;
    private Integer maxItems;
    private Integer maxLiveSessionsPerMonth;
    private Integer maxShipmentsPerMonth;
    private Integer maxPackagesPerMonth;

    public List<ModuleSetting> getModules() {
        return modules;
    }

    public void setModules(List<ModuleSetting> modules) {
        this.modules = modules;
    }

    public Integer getMaxUsers() {
        return maxUsers;
    }

    public void setMaxUsers(Integer maxUsers) {
        this.maxUsers = maxUsers;
    }

    public Integer getMaxBranches() {
        return maxBranches;
    }

    public void setMaxBranches(Integer maxBranches) {
        this.maxBranches = maxBranches;
    }

    public Integer getMaxItems() {
        return maxItems;
    }

    public void setMaxItems(Integer maxItems) {
        this.maxItems = maxItems;
    }

    public Integer getMaxLiveSessionsPerMonth() {
        return maxLiveSessionsPerMonth;
    }

    public void setMaxLiveSessionsPerMonth(Integer maxLiveSessionsPerMonth) {
        this.maxLiveSessionsPerMonth = maxLiveSessionsPerMonth;
    }

    public Integer getMaxShipmentsPerMonth() {
        return maxShipmentsPerMonth;
    }

    public void setMaxShipmentsPerMonth(Integer maxShipmentsPerMonth) {
        this.maxShipmentsPerMonth = maxShipmentsPerMonth;
    }

    public Integer getMaxPackagesPerMonth() {
        return maxPackagesPerMonth;
    }

    public void setMaxPackagesPerMonth(Integer maxPackagesPerMonth) {
        this.maxPackagesPerMonth = maxPackagesPerMonth;
    }

    public static class ModuleSetting {
        private String code;
        private Boolean enabled;

        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }

        public Boolean getEnabled() {
            return enabled;
        }

        public void setEnabled(Boolean enabled) {
            this.enabled = enabled;
        }
    }
}
