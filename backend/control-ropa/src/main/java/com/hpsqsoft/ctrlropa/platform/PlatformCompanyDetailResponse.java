package com.hpsqsoft.ctrlropa.platform;

public record PlatformCompanyDetailResponse(
        Long id,
        String code,
        String name,
        String status,
        Long branchCount,
        Long userCount,
        Long activeUserCount
) {
}
