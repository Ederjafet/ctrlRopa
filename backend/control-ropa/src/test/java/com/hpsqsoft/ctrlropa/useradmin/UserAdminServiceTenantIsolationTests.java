package com.hpsqsoft.ctrlropa.useradmin;

import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import com.hpsqsoft.ctrlropa.security.settings.SecuritySettingsService;
import com.hpsqsoft.ctrlropa.tenant.CurrentTenantContext;
import com.hpsqsoft.ctrlropa.tenant.TenantResolver;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UserAdminServiceTenantIsolationTests {

    private final JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
    private final AccessService accessService = mock(AccessService.class);
    private final CurrentUser currentUser = mock(CurrentUser.class);
    private final SecuritySettingsService securitySettingsService = mock(SecuritySettingsService.class);
    private final TenantResolver tenantResolver = mock(TenantResolver.class);
    private final UserAdminService service = new UserAdminService(
            jdbcTemplate,
            accessService,
            currentUser,
            securitySettingsService,
            tenantResolver
    );

    @Test
    void findAllScopesUsersByCurrentCompany() {
        when(currentUser.getUserId()).thenReturn(99L);
        when(tenantResolver.resolveCurrent()).thenReturn(tenant(20L, 200L));
        when(jdbcTemplate.query(contains("b.company_id = ?"), any(RowMapper.class), eq(20L)))
                .thenReturn(List.of());

        service.findAll(null);

        verify(accessService).assertCan(99L, PermissionCode.MANAGE_USERS);
        verify(tenantResolver).resolveCurrent();
    }

    @Test
    void findByIdRejectsUserFromAnotherCompany() {
        when(currentUser.getUserId()).thenReturn(99L);
        when(tenantResolver.resolveCurrent()).thenReturn(tenant(20L, 200L));
        when(jdbcTemplate.queryForObject(
                contains("b.company_id = ?"),
                eq(Integer.class),
                eq(55L),
                eq(20L)
        )).thenReturn(0);

        assertThrows(AccessDeniedException.class, () -> service.findById(55L));
    }

    @Test
    void createRejectsBranchFromAnotherCompany() {
        when(currentUser.getUserId()).thenReturn(99L);
        when(tenantResolver.resolveCurrent()).thenReturn(tenant(20L, 200L));
        when(jdbcTemplate.queryForObject(
                contains("FROM branches"),
                eq(Integer.class),
                eq(300L),
                eq(20L)
        )).thenReturn(0);

        CreateUserRequest request = new CreateUserRequest();
        request.setBranchId(300L);
        request.setName("Vendedor Ajeno");
        request.setEmail("vendedor.ajeno@test.local");
        request.setPassword("Vendedor123!");
        request.setRoleIds(List.of(1L));

        assertThrows(AccessDeniedException.class, () -> service.create(request));
    }

    @Test
    void deactivateRejectsUserFromAnotherCompany() {
        when(currentUser.getUserId()).thenReturn(99L);
        when(tenantResolver.resolveCurrent()).thenReturn(tenant(20L, 200L));
        when(jdbcTemplate.queryForObject(
                eq("SELECT COUNT(*) FROM users WHERE id = ?"),
                eq(Integer.class),
                eq(55L)
        )).thenReturn(1);
        when(jdbcTemplate.queryForObject(
                contains("b.company_id = ?"),
                eq(Integer.class),
                eq(55L),
                eq(20L)
        )).thenReturn(0);

        assertThrows(AccessDeniedException.class, () -> service.deactivate(55L));
    }

    private static CurrentTenantContext tenant(Long companyId, Long branchId) {
        return new CurrentTenantContext(
                companyId,
                "MARLA",
                "Marla Boutique",
                branchId,
                "CENTRO",
                "Sucursal Centro",
                99L
        );
    }
}
