package com.hpsqsoft.ctrlropa.tenant;

public class CurrentTenantContext {

    private final Long companyId;
    private final String companyCode;
    private final String companyName;
    private final Long branchId;
    private final String branchCode;
    private final String branchName;
    private final Long userId;

    public CurrentTenantContext(Long companyId,
                                String companyCode,
                                String companyName,
                                Long branchId,
                                String branchCode,
                                String branchName,
                                Long userId) {
        this.companyId = companyId;
        this.companyCode = companyCode;
        this.companyName = companyName;
        this.branchId = branchId;
        this.branchCode = branchCode;
        this.branchName = branchName;
        this.userId = userId;
    }

    public Long getCompanyId() { return companyId; }
    public String getCompanyCode() { return companyCode; }
    public String getCompanyName() { return companyName; }
    public Long getBranchId() { return branchId; }
    public String getBranchCode() { return branchCode; }
    public String getBranchName() { return branchName; }
    public Long getUserId() { return userId; }
}
