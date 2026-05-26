package com.hpsqsoft.ctrlropa.tenant;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class TenantAccessGuard {

    private final TenantResolver tenantResolver;

    public TenantAccessGuard(TenantResolver tenantResolver) {
        this.tenantResolver = tenantResolver;
    }

    public CurrentTenantContext requireCurrentTenant() {
        return tenantResolver.resolveCurrent();
    }

    public CurrentTenantContext requireBranch(Long branchId) {
        return requireBranch(branchId, "El recurso no pertenece a la sucursal activa");
    }

    public CurrentTenantContext requireBranch(Long branchId, String message) {
        CurrentTenantContext tenant = tenantResolver.resolveCurrent();
        tenantResolver.assertBranchBelongsToCompany(branchId, tenant.getCompanyId());
        if (tenant.getBranchId() != null && !tenant.getBranchId().equals(branchId)) {
            throw new AccessDeniedException(message);
        }
        return tenant;
    }
}
