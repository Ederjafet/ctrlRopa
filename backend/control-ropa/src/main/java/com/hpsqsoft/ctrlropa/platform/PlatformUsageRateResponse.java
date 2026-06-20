package com.hpsqsoft.ctrlropa.platform;

import java.math.BigDecimal;

public record PlatformUsageRateResponse(
        Long id,
        Long companyId,
        String usageType,
        String name,
        BigDecimal unitPrice,
        String currency,
        Boolean enabled
) {
}
