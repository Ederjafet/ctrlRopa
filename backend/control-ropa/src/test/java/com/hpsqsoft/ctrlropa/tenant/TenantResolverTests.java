package com.hpsqsoft.ctrlropa.tenant;

import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TenantResolverTests {

    private final JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
    private final CurrentUser currentUser = mock(CurrentUser.class);
    private final TenantResolver resolver = new TenantResolver(jdbcTemplate, currentUser);

    @Test
    void currentTenantResolvesFromAuthenticatedUser() {
        CurrentTenantContext expected = new CurrentTenantContext(
                1L,
                "DEFAULT",
                "HPSQ-SOFT Default Company",
                10L,
                "CTR",
                "Centro",
                99L
        );

        when(currentUser.getUserId()).thenReturn(99L);
        when(jdbcTemplate.query(anyString(), anyResultSetExtractor(), eq(99L)))
                .thenReturn(expected);

        CurrentTenantContext result = resolver.resolveCurrent();

        org.junit.jupiter.api.Assertions.assertEquals(1L, result.getCompanyId());
        org.junit.jupiter.api.Assertions.assertEquals(10L, result.getBranchId());
    }

    @Test
    void branchMustBelongToCompany() {
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class), eq(10L), eq(1L)))
                .thenReturn(1);

        assertDoesNotThrow(() -> resolver.assertBranchBelongsToCompany(10L, 1L));
    }

    @Test
    void branchFromAnotherCompanyIsRejected() {
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class), eq(10L), eq(1L)))
                .thenReturn(0);

        assertThrows(AccessDeniedException.class, () -> resolver.assertBranchBelongsToCompany(10L, 1L));
    }

    @SuppressWarnings("unchecked")
    private ResultSetExtractor<CurrentTenantContext> anyResultSetExtractor() {
        return any(ResultSetExtractor.class);
    }
}
