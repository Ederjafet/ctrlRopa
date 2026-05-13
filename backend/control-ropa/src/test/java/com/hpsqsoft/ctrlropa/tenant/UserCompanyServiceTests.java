package com.hpsqsoft.ctrlropa.tenant;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class UserCompanyServiceTests {

    private final UserCompanyRepository repository = mock(UserCompanyRepository.class);
    private final JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
    private final UserCompanyService service = new UserCompanyService(repository, jdbcTemplate);

    @Test
    void userBelongsToCompanyDefault() {
        when(repository.existsByUserIdAndCompanyIdAndStatus(99L, 1L, "ACTIVE"))
                .thenReturn(true);

        assertTrue(service.userBelongsToCompany(99L, 1L));
        assertDoesNotThrow(() -> service.assertUserBelongsToCompany(99L, 1L));
    }

    @Test
    void userWithoutCompanyIsRejected() {
        when(repository.existsByUserIdAndCompanyIdAndStatus(99L, 2L, "ACTIVE"))
                .thenReturn(false);

        assertFalse(service.userBelongsToCompany(99L, 2L));
        assertThrows(AccessDeniedException.class, () -> service.assertUserBelongsToCompany(99L, 2L));
    }

    @Test
    void userCanOperateAssignedBranch() {
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class), eq(99L), eq(10L), eq(1L)))
                .thenReturn(1);

        assertTrue(service.userCanOperateBranch(99L, 1L, 10L));
        assertDoesNotThrow(() -> service.assertUserCanOperateBranch(99L, 1L, 10L));
    }

    @Test
    void userCannotOperateBranchOutsideCompany() {
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class), eq(99L), eq(20L), eq(1L)))
                .thenReturn(0);

        assertFalse(service.userCanOperateBranch(99L, 1L, 20L));
        assertThrows(AccessDeniedException.class, () -> service.assertUserCanOperateBranch(99L, 1L, 20L));
    }
}
