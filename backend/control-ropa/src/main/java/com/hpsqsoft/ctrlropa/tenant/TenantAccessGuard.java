package com.hpsqsoft.ctrlropa.tenant;

import com.hpsqsoft.ctrlropa.security.audit.SecurityAuditEventType;
import com.hpsqsoft.ctrlropa.security.audit.SecurityAuditService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class TenantAccessGuard {

    private final TenantResolver tenantResolver;
    private final SecurityAuditService securityAuditService;

    public TenantAccessGuard(TenantResolver tenantResolver, SecurityAuditService securityAuditService) {
        this.tenantResolver = tenantResolver;
        this.securityAuditService = securityAuditService;
    }

    public CurrentTenantContext requireCurrentTenant() {
        return tenantResolver.resolveCurrent();
    }

    public CurrentTenantContext requireBranch(Long branchId) {
        return requireBranch(branchId, "El recurso no pertenece a la sucursal activa");
    }

    public CurrentTenantContext requireBranch(Long branchId, String message) {
        CurrentTenantContext tenant = tenantResolver.resolveCurrent();
        try {
            tenantResolver.assertBranchBelongsToCompany(branchId, tenant.getCompanyId());
        } catch (AccessDeniedException ex) {
            securityAuditService.record(
                    SecurityAuditEventType.COMPANY_DENIED,
                    tenant.getUserId(),
                    null,
                    tenant.getCompanyId(),
                    tenant.getBranchId(),
                    403,
                    ex.getMessage(),
                    "BRANCH",
                    branchId == null ? null : branchId.toString(),
                    null
            );
            throw ex;
        }
        if (tenant.getBranchId() != null && !tenant.getBranchId().equals(branchId)) {
            securityAuditService.record(
                    SecurityAuditEventType.BRANCH_DENIED,
                    tenant.getUserId(),
                    null,
                    tenant.getCompanyId(),
                    tenant.getBranchId(),
                    403,
                    message,
                    "BRANCH",
                    branchId == null ? null : branchId.toString(),
                    null
            );
            throw new AccessDeniedException(message);
        }
        return tenant;
    }
}
