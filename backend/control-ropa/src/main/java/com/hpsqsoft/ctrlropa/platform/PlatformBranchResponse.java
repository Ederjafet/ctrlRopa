package com.hpsqsoft.ctrlropa.platform;

public record PlatformBranchResponse(
        Long id,
        Long companyId,
        String code,
        String name,
        String status
) {
}
