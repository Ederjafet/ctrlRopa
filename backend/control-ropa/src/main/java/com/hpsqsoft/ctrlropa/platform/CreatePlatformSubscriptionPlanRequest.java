package com.hpsqsoft.ctrlropa.platform;

public class CreatePlatformSubscriptionPlanRequest {
    private String code;
    private String name;
    private String description;
    private String status;
    private Integer includedMaxUsers;
    private Integer includedMaxBranches;
    private Boolean includesLive;
    private Boolean includesReports;
    private Boolean includesShipments;
    private Boolean includesPackages;

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getIncludedMaxUsers() { return includedMaxUsers; }
    public void setIncludedMaxUsers(Integer includedMaxUsers) { this.includedMaxUsers = includedMaxUsers; }
    public Integer getIncludedMaxBranches() { return includedMaxBranches; }
    public void setIncludedMaxBranches(Integer includedMaxBranches) { this.includedMaxBranches = includedMaxBranches; }
    public Boolean getIncludesLive() { return includesLive; }
    public void setIncludesLive(Boolean includesLive) { this.includesLive = includesLive; }
    public Boolean getIncludesReports() { return includesReports; }
    public void setIncludesReports(Boolean includesReports) { this.includesReports = includesReports; }
    public Boolean getIncludesShipments() { return includesShipments; }
    public void setIncludesShipments(Boolean includesShipments) { this.includesShipments = includesShipments; }
    public Boolean getIncludesPackages() { return includesPackages; }
    public void setIncludesPackages(Boolean includesPackages) { this.includesPackages = includesPackages; }
}
