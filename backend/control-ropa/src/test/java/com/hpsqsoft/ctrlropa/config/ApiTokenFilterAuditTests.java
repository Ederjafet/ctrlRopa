package com.hpsqsoft.ctrlropa.config;

import com.hpsqsoft.ctrlropa.security.audit.SecurityAuditEventType;
import com.hpsqsoft.ctrlropa.security.audit.SecurityAuditService;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ApiTokenFilterAuditTests {

    private final JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
    private final SecurityAuditService securityAuditService = mock(SecurityAuditService.class);
    private final ApiTokenFilter filter = new ApiTokenFilter(jdbcTemplate, securityAuditService);

    @Test
    void revokedTokenRecordsAuditAndReturnsUnauthorized() throws Exception {
        when(jdbcTemplate.query(anyString(), org.mockito.ArgumentMatchers.<ResultSetExtractor<Object>>any(), anyString()))
                .thenReturn(null);
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class), anyString()))
                .thenReturn(1);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/me");
        request.addHeader("Authorization", "Bearer old-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        assertEquals(401, response.getStatus());
        verify(chain, never()).doFilter(request, response);
        verify(securityAuditService).record(
                eq(SecurityAuditEventType.TOKEN_REVOKED),
                isNull(),
                isNull(),
                isNull(),
                isNull(),
                eq(401),
                eq("Tu sesion se cerro porque iniciaste sesion en otro dispositivo."),
                eq("TOKEN"),
                anyString(),
                anyString()
        );
    }
}
