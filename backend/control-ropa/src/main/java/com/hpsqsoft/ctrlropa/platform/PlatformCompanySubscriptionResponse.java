package com.hpsqsoft.ctrlropa.platform;

public record PlatformCompanySubscriptionResponse(
        Long id,
        Long companyId,
        Long planId,
        String planCode,
        String planName,
        String billingModel,
        String billingPeriod,
        String status,
        String startedAt,
        String endsAt,
        String nextBillingAt
) {
}
