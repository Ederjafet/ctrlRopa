package com.hpsqsoft.ctrlropa.platform;

import java.util.List;

public record PlatformCompanyUserResponse(
        Long id,
        Long companyId,
        Long branchId,
        String branchCode,
        String branchName,
        String name,
        String email,
        String phone,
        String status,
        List<String> roles
) {
}
