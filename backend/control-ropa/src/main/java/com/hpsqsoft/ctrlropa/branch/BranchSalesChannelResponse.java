package com.hpsqsoft.ctrlropa.branch;

public class BranchSalesChannelResponse {

    private Long id;
    private Long branchId;
    private String branchCode;
    private String branchName;
    private Long salesChannelId;
    private String salesChannelCode;
    private String salesChannelName;
    private Boolean enabled;
    private Long updatedByUserId;

    public BranchSalesChannelResponse() {
    }

    public BranchSalesChannelResponse(Long id,
                                      Long branchId,
                                      String branchCode,
                                      String branchName,
                                      Long salesChannelId,
                                      String salesChannelCode,
                                      String salesChannelName,
                                      Boolean enabled,
                                      Long updatedByUserId) {
        this.id = id;
        this.branchId = branchId;
        this.branchCode = branchCode;
        this.branchName = branchName;
        this.salesChannelId = salesChannelId;
        this.salesChannelCode = salesChannelCode;
        this.salesChannelName = salesChannelName;
        this.enabled = enabled;
        this.updatedByUserId = updatedByUserId;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }

    public String getBranchCode() { return branchCode; }
    public void setBranchCode(String branchCode) { this.branchCode = branchCode; }

    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }

    public Long getSalesChannelId() { return salesChannelId; }
    public void setSalesChannelId(Long salesChannelId) { this.salesChannelId = salesChannelId; }

    public String getSalesChannelCode() { return salesChannelCode; }
    public void setSalesChannelCode(String salesChannelCode) { this.salesChannelCode = salesChannelCode; }

    public String getSalesChannelName() { return salesChannelName; }
    public void setSalesChannelName(String salesChannelName) { this.salesChannelName = salesChannelName; }

    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }

    public Long getUpdatedByUserId() { return updatedByUserId; }
    public void setUpdatedByUserId(Long updatedByUserId) { this.updatedByUserId = updatedByUserId; }
}