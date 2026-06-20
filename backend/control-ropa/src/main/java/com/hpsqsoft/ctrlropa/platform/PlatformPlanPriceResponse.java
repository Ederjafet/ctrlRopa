package com.hpsqsoft.ctrlropa.platform;

import java.math.BigDecimal;

public record PlatformPlanPriceResponse(
        Long id,
        Long planId,
        String billingPeriod,
        BigDecimal priceAmount,
        String currency,
        String status
) {
}
