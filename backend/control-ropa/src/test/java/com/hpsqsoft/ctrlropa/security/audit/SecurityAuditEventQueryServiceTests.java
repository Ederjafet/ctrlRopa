package com.hpsqsoft.ctrlropa.security.audit;

import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.atLeastOnce;
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

    @Test
    void summaryRequiresViewSecurityAuditPermission() {
        when(currentUser.getUserId()).thenReturn(10L);
        when(jdbcTemplate.queryForObject(anyString(), eq(Long.class), any(Object[].class)))
                .thenReturn(5L, 2L, 3L);
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), any(Object[].class)))
                .thenReturn(java.util.List.of());

        SecurityAuditSummaryResponse response = service.summary(
                null,
                null,
                null,
                null,
                null,
                null
        );

        verify(accessService).assertCan(10L, PermissionCode.VIEW_SECURITY_AUDIT);
        assertEquals(5L, response.getTotalEvents());
        assertEquals(2L, response.getTotal401());
        assertEquals(3L, response.getTotal403());
    }

    @Test
    void summaryDeniesUserWithoutViewSecurityAuditPermission() {
        when(currentUser.getUserId()).thenReturn(10L);
        doThrow(new AccessDeniedException("permiso faltante"))
                .when(accessService).assertCan(10L, PermissionCode.VIEW_SECURITY_AUDIT);

        assertThrows(AccessDeniedException.class, () -> service.summary(
                null,
                null,
                null,
                null,
                null,
                null
        ));
    }

    @Test
    void summaryAppliesDateFiltersToCounts() {
        when(currentUser.getUserId()).thenReturn(10L);
        when(jdbcTemplate.queryForObject(anyString(), eq(Long.class), any(Object[].class)))
                .thenReturn(0L);
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), any(Object[].class)))
                .thenReturn(java.util.List.of());

        service.summary(
                null,
                null,
                null,
                null,
                "2026-05-01T00:00:00",
                "2026-05-27T23:59:59"
        );

        verify(jdbcTemplate, atLeastOnce()).queryForObject(
                org.mockito.ArgumentMatchers.contains("occurred_at >= ? AND occurred_at <= ?"),
                eq(Long.class),
                any(Object[].class)
        );
    }

    @Test
    void summaryReturnsEventTypeAndStatusCodeGroups() {
        when(currentUser.getUserId()).thenReturn(10L);
        when(jdbcTemplate.queryForObject(anyString(), eq(Long.class), any(Object[].class)))
                .thenReturn(8L, 4L, 4L);
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), any(Object[].class)))
                .thenAnswer(invocation -> {
                    String sql = invocation.getArgument(0);
                    if (sql.contains("GROUP BY event_type")) {
                        return java.util.List.of(new SecurityAuditSummaryResponse.CountLine("TOKEN_REVOKED", 3L));
                    }
                    if (sql.contains("GROUP BY status_code")) {
                        return java.util.List.of(new SecurityAuditSummaryResponse.CountLine("401", 4L));
                    }
                    return java.util.List.of();
                });

        SecurityAuditSummaryResponse response = service.summary(
                null,
                null,
                null,
                null,
                null,
                null
        );

        assertEquals("TOKEN_REVOKED", response.getByEventType().get(0).getKey());
        assertEquals(3L, response.getByEventType().get(0).getCount());
        assertEquals("401", response.getByStatusCode().get(0).getKey());
        assertEquals(4L, response.getByStatusCode().get(0).getCount());
    }

    @Test
    void summaryLimitsTopPaths() {
        when(currentUser.getUserId()).thenReturn(10L);
        when(jdbcTemplate.queryForObject(anyString(), eq(Long.class), any(Object[].class)))
                .thenReturn(1L, 1L, 0L);
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), any(Object[].class)))
                .thenAnswer(invocation -> {
                    String sql = invocation.getArgument(0);
                    if (sql.contains("GROUP BY path")) {
                        return java.util.List.of(new SecurityAuditSummaryResponse.CountLine("/api/me", 2L));
                    }
                    return java.util.List.of();
                });

        SecurityAuditSummaryResponse response = service.summary(
                null,
                null,
                null,
                null,
                null,
                null
        );

        assertEquals("/api/me", response.getTopPaths().get(0).getKey());
    }
}
