package com.hpsqsoft.ctrlropa.system;

import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class SystemLogService {

    private final JdbcTemplate jdbcTemplate;
    private final CurrentUser currentUser;

    public SystemLogService(JdbcTemplate jdbcTemplate,
                            CurrentUser currentUser) {
        this.jdbcTemplate = jdbcTemplate;
        this.currentUser = currentUser;
    }

    public SystemLogResponse findRecentLogs(Integer limit) {
        assertSupportTech();

        int safeLimit = limit == null ? 100 : Math.max(20, Math.min(limit, 300));

        List<SystemLogResponse.SystemLogLine> lines = jdbcTemplate.query(
                """
                SELECT
                    sal.id,
                    sal.event_type,
                    sal.http_method,
                    sal.request_path,
                    sal.status_code,
                    sal.branch_id,
                    b.name AS branch_name,
                    sal.user_id,
                    sal.user_name,
                    sal.detail,
                    sal.created_at
                FROM system_movement_audit_log sal
                LEFT JOIN branches b ON b.id = sal.branch_id
                ORDER BY sal.created_at DESC, sal.id DESC
                LIMIT ?
                """,
                (rs, rowNum) -> new SystemLogResponse.SystemLogLine(
                        rs.getLong("id"),
                        rs.getString("event_type"),
                        rs.getString("http_method"),
                        rs.getString("request_path"),
                        rs.getObject("status_code", Integer.class),
                        rs.getObject("branch_id", Long.class),
                        rs.getString("branch_name"),
                        rs.getObject("user_id", Long.class),
                        rs.getString("user_name"),
                        rs.getString("detail"),
                        rs.getTimestamp("created_at").toLocalDateTime()
                ),
                safeLimit
        );

        return new SystemLogResponse(lines);
    }

    private void assertSupportTech() {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM user_roles ur
                JOIN roles r ON r.id = ur.role_id
                WHERE ur.user_id = ?
                  AND r.code = 'SUPPORT_TECH'
                """,
                Integer.class,
                currentUser.getUserId()
        );

        if (count == null || count == 0) {
            throw new AccessDeniedException("Rol requerido: SUPPORT_TECH");
        }
    }
}
