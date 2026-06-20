package com.hpsqsoft.ctrlropa.platform;

public record PlatformCompanyResponse(
        Long id,
        String code,
        String name,
        String status,
        Long branchId,
        String branchCode,
        String branchName,
        Long adminUsers
) {
}
