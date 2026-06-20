package com.hpsqsoft.ctrlropa.platform;

import java.util.List;

public record PlatformCompanySettingsResponse(
        List<ModuleSetting> modules,
        LimitSettings limits
) {
    public record ModuleSetting(
            String code,
            String name,
            Boolean enabled
    ) {
    }

    public record LimitSettings(
            Integer maxUsers,
            Integer maxBranches,
            Integer maxItems,
            Integer maxLiveSessionsPerMonth,
            Integer maxShipmentsPerMonth,
            Integer maxPackagesPerMonth
    ) {
    }
}
