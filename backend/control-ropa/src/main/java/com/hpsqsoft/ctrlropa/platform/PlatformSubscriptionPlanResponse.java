package com.hpsqsoft.ctrlropa.platform;

public record PlatformSubscriptionPlanResponse(
        Long id,
        String code,
        String name,
        String description,
        String status,
        Integer includedMaxUsers,
        Integer includedMaxBranches,
        Boolean includesLive,
        Boolean includesReports,
        Boolean includesShipments,
        Boolean includesPackages
) {
}
