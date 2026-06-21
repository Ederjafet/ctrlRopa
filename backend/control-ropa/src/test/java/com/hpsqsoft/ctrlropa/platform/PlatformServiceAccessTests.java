package com.hpsqsoft.ctrlropa.platform;

import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import com.hpsqsoft.ctrlropa.security.settings.SecuritySettingsService;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PlatformServiceAccessTests {

    private final JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
    private final AccessService accessService = mock(AccessService.class);
    private final CurrentUser currentUser = mock(CurrentUser.class);
    private final SecuritySettingsService securitySettingsService = mock(SecuritySettingsService.class);
    private final PlatformService service = new PlatformService(
            jdbcTemplate,
            accessService,
            currentUser,
            securitySettingsService
    );

    @Test
    void findCompaniesRequiresViewPlatform() {
        when(currentUser.getUserId()).thenReturn(10L);
        doThrow(new AccessDeniedException("missing"))
                .when(accessService)
                .assertCan(10L, PermissionCode.VIEW_PLATFORM);

        assertThrows(AccessDeniedException.class, service::findCompanies);
    }

    @Test
    void findDashboardSummaryRequiresViewPlatform() {
        when(currentUser.getUserId()).thenReturn(10L);
        doThrow(new AccessDeniedException("missing"))
                .when(accessService)
                .assertCan(10L, PermissionCode.VIEW_PLATFORM);

        assertThrows(AccessDeniedException.class, service::findDashboardSummary);
    }

    @Test
    void findCompanyUsersRequiresViewPlatform() {
        when(currentUser.getUserId()).thenReturn(10L);
        doThrow(new AccessDeniedException("missing"))
                .when(accessService)
                .assertCan(10L, PermissionCode.VIEW_PLATFORM);

        assertThrows(AccessDeniedException.class, () -> service.findUsers(2L));
    }

    @Test
    void findCompanySettingsRequiresViewPlatform() {
        when(currentUser.getUserId()).thenReturn(10L);
        doThrow(new AccessDeniedException("missing"))
                .when(accessService)
                .assertCan(10L, PermissionCode.VIEW_PLATFORM);

        assertThrows(AccessDeniedException.class, () -> service.findCompanySettings(2L));
    }

    @Test
    void updateCompanySettingsRequiresManageCompanies() {
        when(currentUser.getUserId()).thenReturn(10L);
        doThrow(new AccessDeniedException("missing"))
                .when(accessService)
                .assertCan(10L, PermissionCode.MANAGE_COMPANY_MODULES);

        UpdatePlatformCompanySettingsRequest request = new UpdatePlatformCompanySettingsRequest();
        UpdatePlatformCompanySettingsRequest.ModuleSetting module = new UpdatePlatformCompanySettingsRequest.ModuleSetting();
        module.setCode("LIVE");
        module.setEnabled(true);
        request.setModules(java.util.List.of(module));

        assertThrows(
                AccessDeniedException.class,
                () -> service.updateCompanySettings(2L, request)
        );
    }

    @Test
    void updateCompanyLimitsRequiresManageCompanyLimits() {
        when(currentUser.getUserId()).thenReturn(10L);
        doThrow(new AccessDeniedException("missing"))
                .when(accessService)
                .assertCan(10L, PermissionCode.MANAGE_COMPANY_LIMITS);

        UpdatePlatformCompanySettingsRequest request = new UpdatePlatformCompanySettingsRequest();
        request.setMaxUsers(5);

        assertThrows(
                AccessDeniedException.class,
                () -> service.updateCompanySettings(2L, request)
        );
    }

    @Test
    void findSubscriptionPlansRequiresBillingPermission() {
        when(currentUser.getUserId()).thenReturn(10L);
        doThrow(new AccessDeniedException("missing"))
                .when(accessService)
                .assertCan(10L, PermissionCode.VIEW_PLATFORM_BILLING);

        assertThrows(AccessDeniedException.class, service::findSubscriptionPlans);
    }

    @Test
    void createSubscriptionPlanRequiresManagePlansPermission() {
        when(currentUser.getUserId()).thenReturn(10L);
        doThrow(new AccessDeniedException("missing"))
                .when(accessService)
                .assertCan(10L, PermissionCode.MANAGE_SUBSCRIPTION_PLANS);

        assertThrows(
                AccessDeniedException.class,
                () -> service.createSubscriptionPlan(new CreatePlatformSubscriptionPlanRequest())
        );
    }

    @Test
    void updateUsageRatesRequiresManageUsageRatesPermission() {
        when(currentUser.getUserId()).thenReturn(10L);
        doThrow(new AccessDeniedException("missing"))
                .when(accessService)
                .assertCan(10L, PermissionCode.MANAGE_USAGE_RATES);

        assertThrows(
                AccessDeniedException.class,
                () -> service.updateCompanyUsageRates(2L, new UpdatePlatformUsageRatesRequest())
        );
    }

    @Test
    void createBranchRequiresManageCompanies() {
        when(currentUser.getUserId()).thenReturn(10L);
        doThrow(new AccessDeniedException("missing"))
                .when(accessService)
                .assertCan(10L, PermissionCode.MANAGE_COMPANIES);

        CreatePlatformBranchRequest request = new CreatePlatformBranchRequest();
        request.setName("Sucursal Centro");

        assertThrows(AccessDeniedException.class, () -> service.createBranch(2L, request));
    }

    @Test
    void createCompanyUserRequiresManageTenantAdmins() {
        when(currentUser.getUserId()).thenReturn(10L);
        doThrow(new AccessDeniedException("missing"))
                .when(accessService)
                .assertCan(10L, PermissionCode.MANAGE_TENANT_ADMINS);

        CreatePlatformCompanyUserRequest request = new CreatePlatformCompanyUserRequest();
        request.setName("Vendedor Centro");
        request.setEmail("vendedor@test.local");
        request.setPassword("Vendedor123!");
        request.setRole("SELLER");

        assertThrows(AccessDeniedException.class, () -> service.createCompanyUser(2L, request));
    }
}
