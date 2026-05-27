package com.hpsqsoft.ctrlropa.security.access;

import com.hpsqsoft.ctrlropa.security.audit.SecurityAuditEventType;
import com.hpsqsoft.ctrlropa.security.audit.SecurityAuditService;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AccessServiceAuditTests {

    private final JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
    private final SecurityAuditService securityAuditService = mock(SecurityAuditService.class);
    private final AccessService accessService = new AccessService(jdbcTemplate, securityAuditService);

    @Test
    void permissionDeniedRecordsAuditEvent() {
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class), eq(10L)))
                .thenReturn(1);
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class), eq("VIEW_CUSTOMERS"), eq(10L), eq(10L)))
                .thenReturn(0);

        assertThrows(AccessDeniedException.class, () -> accessService.assertCan(10L, "VIEW_CUSTOMERS"));

        verify(securityAuditService).record(
                SecurityAuditEventType.PERMISSION_DENIED,
                10L,
                null,
                null,
                null,
                403,
                "Permiso requerido: VIEW_CUSTOMERS",
                "PERMISSION",
                "VIEW_CUSTOMERS",
                null
        );
    }
}
