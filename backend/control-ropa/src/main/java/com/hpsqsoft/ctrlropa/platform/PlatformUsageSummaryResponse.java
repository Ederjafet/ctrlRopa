package com.hpsqsoft.ctrlropa.platform;

public record PlatformUsageSummaryResponse(
        Long companyId,
        String companyName,
        String billingModel,
        String planName,
        String subscriptionStatus,
        Integer activeBranches,
        Integer activeUsers,
        Integer activeModules,
        Integer maxUsers,
        Integer maxBranches,
        String licenseType,
        String licenseStatus,
        Boolean unlimitedCommercialUse,
        String deploymentType,
        String serviceAgreementStatus,
        String serviceAgreementEndDate
) {
}
