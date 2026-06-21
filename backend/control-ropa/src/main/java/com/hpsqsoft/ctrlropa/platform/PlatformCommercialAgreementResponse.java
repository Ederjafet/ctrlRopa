package com.hpsqsoft.ctrlropa.platform;

import java.math.BigDecimal;

public record PlatformCommercialAgreementResponse(
        License license,
        ServiceAgreement serviceAgreement
) {
    public record License(
            Long id,
            Long companyId,
            String licenseType,
            String status,
            BigDecimal purchaseAmount,
            String currency,
            String paymentDate,
            String paymentMethod,
            String paymentReference,
            String notes,
            String validFrom,
            String validUntil,
            Boolean noExpiration,
            Boolean unlimitedCommercialUse
    ) {
    }

    public record ServiceAgreement(
            Long id,
            Long companyId,
            String serviceType,
            String deploymentType,
            String status,
            BigDecimal annualAmount,
            String currency,
            String startDate,
            String endDate,
            Boolean autoRenew,
            String paymentMethod,
            String paymentReference,
            String notes
    ) {
    }
}
