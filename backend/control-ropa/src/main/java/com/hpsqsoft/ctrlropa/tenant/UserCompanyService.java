package com.hpsqsoft.ctrlropa.tenant;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class UserCompanyService {

    private final UserCompanyRepository userCompanyRepository;
    private final JdbcTemplate jdbcTemplate;

    public UserCompanyService(UserCompanyRepository userCompanyRepository, JdbcTemplate jdbcTemplate) {
        this.userCompanyRepository = userCompanyRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    public boolean userBelongsToCompany(Long userId, Long companyId) {
        return userCompanyRepository.existsByUserIdAndCompanyIdAndStatus(userId, companyId, "ACTIVE");
    }

    public void assertUserBelongsToCompany(Long userId, Long companyId) {
        if (!userBelongsToCompany(userId, companyId)) {
            throw new AccessDeniedException("El usuario no pertenece a la company activa");
        }
    }

    public boolean userCanOperateBranch(Long userId, Long companyId, Long branchId) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM user_branches ub
                JOIN branches b ON b.id = ub.branch_id
                JOIN user_companies uc ON uc.user_id = ub.user_id
                                      AND uc.company_id = b.company_id
                                      AND uc.status = 'ACTIVE'
                WHERE ub.user_id = ?
                  AND ub.branch_id = ?
                  AND b.company_id = ?
                  AND b.status = 'ACTIVE'
                """,
                Integer.class,
                userId,
                branchId,
                companyId
        );

        return count != null && count > 0;
    }

    public void assertUserCanOperateBranch(Long userId, Long companyId, Long branchId) {
        if (!userCanOperateBranch(userId, companyId, branchId)) {
            throw new AccessDeniedException("El usuario no puede operar la sucursal seleccionada");
        }
    }
}
