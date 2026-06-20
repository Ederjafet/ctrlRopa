package com.hpsqsoft.ctrlropa.platform;

public record PlatformTenantAdminResponse(
        Long id,
        Long companyId,
        Long branchId,
        String name,
        String email,
        String status,
        String roleCode
) {
}
