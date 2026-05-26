package com.hpsqsoft.ctrlropa.tenant;

import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TenantAccessGuardTests {

    private final TenantResolver tenantResolver = mock(TenantResolver.class);
    private final TenantAccessGuard guard = new TenantAccessGuard(tenantResolver);

    @Test
    void requireBranchAllowsActiveBranch() {
        when(tenantResolver.resolveCurrent()).thenReturn(tenant(2L, 6L));

        assertDoesNotThrow(() -> guard.requireBranch(6L));
    }

    @Test
    void requireBranchBlocksOtherActiveBranch() {
        when(tenantResolver.resolveCurrent()).thenReturn(tenant(2L, 6L));

        assertThrows(AccessDeniedException.class, () -> guard.requireBranch(4L));
    }

    @Test
    void requireBranchBlocksOtherCompany() {
        when(tenantResolver.resolveCurrent()).thenReturn(tenant(2L, 6L));
        doThrow(new AccessDeniedException("cross-company"))
                .when(tenantResolver)
                .assertBranchBelongsToCompany(7L, 2L);

        assertThrows(AccessDeniedException.class, () -> guard.requireBranch(7L));
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
