package com.hpsqsoft.ctrlropa.catalog;

import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import com.hpsqsoft.ctrlropa.tenant.CurrentTenantContext;
import com.hpsqsoft.ctrlropa.tenant.TenantAccessGuard;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CatalogBootstrapServiceTests {

    private final JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
    private final AccessService accessService = mock(AccessService.class);
    private final CurrentUser currentUser = mock(CurrentUser.class);
    private final TenantAccessGuard tenantAccessGuard = mock(TenantAccessGuard.class);

    private final CatalogBootstrapService service = new CatalogBootstrapService(
            jdbcTemplate,
            accessService,
            currentUser,
            tenantAccessGuard
    );

    @Test
    @SuppressWarnings({"unchecked", "rawtypes"})
    void sellerBootstrapDoesNotUseThrowingPermissionCheckForOptionalAdminCatalogs() {
        when(currentUser.getUserId()).thenReturn(99L);
        when(accessService.can(99L, PermissionCode.MANAGE_USERS)).thenReturn(false);
        when(tenantAccessGuard.requireBranch(eq(5L), anyString())).thenReturn(tenant(3L, 5L));
        stubEmptyCatalogQueries();

        CatalogBootstrapResponse response = assertDoesNotThrow(() -> service.getBootstrap(5L));

        verify(accessService).can(99L, PermissionCode.MANAGE_USERS);
        verify(accessService, never()).assertCan(99L, PermissionCode.MANAGE_USERS);
        verify(tenantAccessGuard).requireBranch(eq(5L), anyString());
        assertTrue(response.getRoles().isEmpty());
        assertTrue(response.getPermissions().isEmpty());
    }

    @Test
    @SuppressWarnings({"unchecked", "rawtypes"})
    void adminBootstrapCanIncludeAdminCatalogsWithoutChangingBranchScope() {
        when(currentUser.getUserId()).thenReturn(10L);
        when(accessService.can(10L, PermissionCode.MANAGE_USERS)).thenReturn(true);
        when(tenantAccessGuard.requireBranch(eq(5L), anyString())).thenReturn(tenant(3L, 5L));
        stubEmptyCatalogQueries();

        assertDoesNotThrow(() -> service.getBootstrap(5L));

        verify(accessService).can(10L, PermissionCode.MANAGE_USERS);
        verify(tenantAccessGuard).requireBranch(eq(5L), anyString());
    }

    @Test
    void branchOutsideActiveTenantIsRejectedAsAccessDenied() {
        when(tenantAccessGuard.requireBranch(eq(8L), anyString()))
                .thenThrow(new AccessDeniedException("cross-branch"));

        assertThrows(AccessDeniedException.class, () -> service.getBootstrap(8L));
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    private void stubEmptyCatalogQueries() {
        when(jdbcTemplate.query(anyString(), any(RowMapper.class))).thenReturn(List.of());
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), any())).thenReturn(List.of());
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), any(), any())).thenReturn(List.of());
    }

    private CurrentTenantContext tenant(Long companyId, Long branchId) {
        return new CurrentTenantContext(
                companyId,
                "QA",
                "Cliente QA",
                branchId,
                "QA_CTR",
                "Sucursal QA",
                99L
        );
    }
}
