package com.hpsqsoft.ctrlropa.tenant;

import com.hpsqsoft.ctrlropa.security.audit.SecurityAuditEventType;
import com.hpsqsoft.ctrlropa.security.audit.SecurityAuditService;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TenantAccessGuardTests {

    private final TenantResolver tenantResolver = mock(TenantResolver.class);
    private final SecurityAuditService securityAuditService = mock(SecurityAuditService.class);
    private final TenantAccessGuard guard = new TenantAccessGuard(tenantResolver, securityAuditService);

    @Test
    void requireBranchAllowsActiveBranch() {
        when(tenantResolver.resolveCurrent()).thenReturn(tenant(2L, 6L));

        assertDoesNotThrow(() -> guard.requireBranch(6L));
    }

    @Test
    void requireBranchBlocksOtherActiveBranch() {
        when(tenantResolver.resolveCurrent()).thenReturn(tenant(2L, 6L));

        assertThrows(AccessDeniedException.class, () -> guard.requireBranch(4L));
        verify(securityAuditService).record(
                SecurityAuditEventType.BRANCH_DENIED,
                10L,
                null,
                2L,
                6L,
                403,
                "El recurso no pertenece a la sucursal activa",
                "BRANCH",
                "4",
                null
        );
    }

    @Test
    void requireBranchBlocksOtherCompany() {
        when(tenantResolver.resolveCurrent()).thenReturn(tenant(2L, 6L));
        doThrow(new AccessDeniedException("cross-company"))
                .when(tenantResolver)
                .assertBranchBelongsToCompany(7L, 2L);

        assertThrows(AccessDeniedException.class, () -> guard.requireBranch(7L));
        verify(securityAuditService).record(
                SecurityAuditEventType.COMPANY_DENIED,
                10L,
                null,
                2L,
                6L,
                403,
                "cross-company",
                "BRANCH",
                "7",
                null
        );
    }

    private CurrentTenantContext tenant(Long companyId, Long branchId) {
        return new CurrentTenantContext(
                companyId,
                "QA_A",
                "Empresa QA A",
                branchId,
                "QA_A_CTR",
                "Sucursal QA A",
                10L
        );
    }
}
