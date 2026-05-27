package com.hpsqsoft.ctrlropa.security.audit;

import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SecurityAuditEventQueryServiceTests {

    private final JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
    private final CurrentUser currentUser = mock(CurrentUser.class);
    private final AccessService accessService = mock(AccessService.class);
    private final SecurityAuditEventQueryService service = new SecurityAuditEventQueryService(
            jdbcTemplate,
            currentUser,
            accessService
    );

    @Test
    void findEventsRequiresSecuritySettingsPermission() {
        when(currentUser.getUserId()).thenReturn(10L);
        when(jdbcTemplate.queryForObject(anyString(), eq(Long.class), eq("TOKEN_REVOKED")))
                .thenReturn(0L);

        SecurityAuditEventResponse response = service.findEvents(
                "TOKEN_REVOKED",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                0,
                20
        );

        verify(accessService).assertCan(10L, PermissionCode.VIEW_SECURITY_AUDIT);
        assertEquals(0L, response.getTotal());
    }
}
