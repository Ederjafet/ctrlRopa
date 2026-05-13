package com.hpsqsoft.ctrlropa.tenant;

import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class TenantResolver {

    private final JdbcTemplate jdbcTemplate;
    private final CurrentUser currentUser;

    public TenantResolver(JdbcTemplate jdbcTemplate, CurrentUser currentUser) {
        this.jdbcTemplate = jdbcTemplate;
        this.currentUser = currentUser;
    }

    public CurrentTenantContext resolveCurrent() {
        Long userId = currentUser.getUserId();
        return resolveForUser(userId);
    }

    public CurrentTenantContext resolveForUser(Long userId) {
        return jdbcTemplate.query(
                """
                SELECT
                  c.id AS company_id,
                  c.code AS company_code,
                  c.name AS company_name,
                  b.id AS branch_id,
                  b.code AS branch_code,
                  b.name AS branch_name,
                  u.id AS user_id
                FROM users u
                JOIN branches b ON b.id = u.branch_id
                JOIN companies c ON c.id = b.company_id
                WHERE u.id = ?
                  AND u.status = 'ACTIVE'
                  AND b.status = 'ACTIVE'
                  AND c.status = 'ACTIVE'
                """,
                rs -> {
                    if (!rs.next()) {
                        throw new AccessDeniedException("No se pudo resolver company activa para el usuario");
                    }
                    return new CurrentTenantContext(
                            rs.getLong("company_id"),
                            rs.getString("company_code"),
                            rs.getString("company_name"),
                            rs.getLong("branch_id"),
                            rs.getString("branch_code"),
                            rs.getString("branch_name"),
                            rs.getLong("user_id")
                    );
                },
                userId
        );
    }

    public CurrentTenantContext resolveDefault() {
        return jdbcTemplate.query(
                """
                SELECT
                  c.id AS company_id,
                  c.code AS company_code,
                  c.name AS company_name,
                  b.id AS branch_id,
                  b.code AS branch_code,
                  b.name AS branch_name
                FROM companies c
                LEFT JOIN branches b ON b.company_id = c.id AND b.status = 'ACTIVE'
                WHERE c.code = 'DEFAULT'
                  AND c.status = 'ACTIVE'
                ORDER BY b.id
                LIMIT 1
                """,
                rs -> {
                    if (!rs.next()) {
                        throw new IllegalStateException("Tenant default no disponible");
                    }
                    Long branchId = rs.getObject("branch_id", Long.class);
                    return new CurrentTenantContext(
                            rs.getLong("company_id"),
                            rs.getString("company_code"),
                            rs.getString("company_name"),
                            branchId,
                            rs.getString("branch_code"),
                            rs.getString("branch_name"),
                            null
                    );
                }
        );
    }

    public void assertBranchBelongsToCompany(Long branchId, Long companyId) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM branches
                WHERE id = ?
                  AND company_id = ?
                  AND status = 'ACTIVE'
                """,
                Integer.class,
                branchId,
                companyId
        );

        if (count == null || count == 0) {
            throw new AccessDeniedException("La sucursal no pertenece a la company activa");
        }
    }
}
