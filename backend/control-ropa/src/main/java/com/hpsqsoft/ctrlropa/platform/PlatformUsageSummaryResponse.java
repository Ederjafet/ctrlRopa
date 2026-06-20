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
        Integer maxBranches
) {
}
