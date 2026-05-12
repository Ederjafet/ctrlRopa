package com.hpsqsoft.ctrlropa.security.sessions;

import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class SecuritySessionsService {

    private final JdbcTemplate jdbcTemplate;
    private final CurrentUser currentUser;

    public SecuritySessionsService(JdbcTemplate jdbcTemplate, CurrentUser currentUser) {
        this.jdbcTemplate = jdbcTemplate;
        this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public SecuritySessionsResponse findCurrentState() {
        assertSupportTech();

        List<SecuritySessionsResponse.UserLoginSecurityLine> users = jdbcTemplate.query(
                """
                SELECT
                  u.id,
                  u.name,
                  u.email,
                  b.name AS branch_name,
                  COALESCE(uls.failed_login_attempts, 0) AS failed_login_attempts,
                  uls.locked_until,
                  uls.last_failed_login_at,
                  uls.last_success_login_at,
                  uls.last_login_ip,
                  uls.last_login_user_agent
                FROM users u
                LEFT JOIN branches b ON b.id = u.branch_id
                LEFT JOIN user_login_security uls ON uls.user_id = u.id
                WHERE COALESCE(uls.failed_login_attempts, 0) > 0
                   OR uls.locked_until IS NOT NULL
                   OR uls.last_failed_login_at IS NOT NULL
                ORDER BY uls.updated_at DESC, u.name
                LIMIT 200
                """,
                (rs, rowNum) -> new SecuritySessionsResponse.UserLoginSecurityLine(
                        rs.getLong("id"),
                        rs.getString("name"),
                        rs.getString("email"),
                        rs.getString("branch_name"),
                        rs.getInt("failed_login_attempts"),
                        toLocalDateTime(rs.getTimestamp("locked_until")),
                        toLocalDateTime(rs.getTimestamp("last_failed_login_at")),
                        toLocalDateTime(rs.getTimestamp("last_success_login_at")),
                        rs.getString("last_login_ip"),
                        rs.getString("last_login_user_agent")
                )
        );

        List<SecuritySessionsResponse.ApiSessionLine> sessions = jdbcTemplate.query(
                """
                SELECT
                  s.id,
                  u.id AS user_id,
                  u.name,
                  u.email,
                  b.name AS branch_name,
                  s.expires_at,
                  s.absolute_expires_at,
                  s.last_seen_at,
                  s.revoked_at,
                  s.created_at,
                  s.ip_address,
                  s.user_agent
                FROM user_api_sessions s
                JOIN users u ON u.id = s.user_id
                LEFT JOIN branches b ON b.id = u.branch_id
                WHERE s.revoked_at IS NULL
                  AND s.expires_at > CURRENT_TIMESTAMP
                ORDER BY s.last_seen_at DESC, s.created_at DESC
                LIMIT 200
                """,
                (rs, rowNum) -> new SecuritySessionsResponse.ApiSessionLine(
                        rs.getLong("id"),
                        rs.getLong("user_id"),
                        rs.getString("name"),
                        rs.getString("email"),
                        rs.getString("branch_name"),
                        toLocalDateTime(rs.getTimestamp("expires_at")),
                        toLocalDateTime(rs.getTimestamp("absolute_expires_at")),
                        toLocalDateTime(rs.getTimestamp("last_seen_at")),
                        toLocalDateTime(rs.getTimestamp("revoked_at")),
                        toLocalDateTime(rs.getTimestamp("created_at")),
                        rs.getString("ip_address"),
                        rs.getString("user_agent")
                )
        );

        return new SecuritySessionsResponse(users, sessions);
    }

    @Transactional
    public void unlockUser(Long userId) {
        assertSupportTech();

        jdbcTemplate.update(
                """
                UPDATE user_login_security
                SET failed_login_attempts = 0,
                    locked_until = NULL
                WHERE user_id = ?
                """,
                userId
        );

        audit("AUTH_USER_UNLOCKED", userId, "Desbloqueo manual de usuario");
    }

    @Transactional
    public void revokeUserSessions(Long userId) {
        assertSupportTech();

        jdbcTemplate.update(
                """
                UPDATE user_api_sessions
                SET revoked_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
                  AND revoked_at IS NULL
                """,
                userId
        );

        audit("AUTH_SESSIONS_REVOKED", userId, "Sesiónes revocadas manualmente");
    }

    @Transactional
    public void revokeSession(Long sessionId) {
        assertSupportTech();

        Long userId = jdbcTemplate.query(
                "SELECT user_id FROM user_api_sessions WHERE id = ?",
                rs -> rs.next() ? rs.getLong("user_id") : null,
                sessionId
        );

        jdbcTemplate.update(
                """
                UPDATE user_api_sessions
                SET revoked_at = CURRENT_TIMESTAMP
                WHERE id = ?
                  AND revoked_at IS NULL
                """,
                sessionId
        );

        audit("AUTH_SESSION_REVOKED", userId, "Sesión individual revocada manualmente: " + sessionId);
    }

    @Transactional
    public void revokeAllSessions() {
        assertSupportTech();

        jdbcTemplate.update(
                """
                UPDATE user_api_sessions
                SET revoked_at = CURRENT_TIMESTAMP
                WHERE revoked_at IS NULL
                """
        );

        audit("AUTH_ALL_SESSIONS_REVOKED", currentUser.getUserId(), "Todas las sesiónes activas fueron revocadas");
    }

    private void assertSupportTech() {
        Long userId = currentUser.getUserId();
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM user_roles ur
                JOIN roles r ON r.id = ur.role_id
                WHERE ur.user_id = ?
                  AND r.code = 'SUPPORT_TECH'
                """,
                Integer.class,
                userId
        );

        if (count == null || count == 0) {
            throw new AccessDeniedException("Rol requerido: SUPPORT_TECH");
        }
    }

    private void audit(String eventType, Long targetUserId, String detail) {
        jdbcTemplate.update(
                """
                INSERT INTO system_movement_audit_log (
                  category,
                  event_type,
                  http_method,
                  request_path,
                  status_code,
                  user_id,
                  detail
                ) VALUES ('SECURITY', ?, 'POST', '/api/security/sessions', 200, ?, ?)
                """,
                eventType,
                targetUserId,
                detail
        );
    }

    private LocalDateTime toLocalDateTime(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toLocalDateTime();
    }
}
