package com.hpsqsoft.ctrlropa.config;

import com.hpsqsoft.ctrlropa.security.audit.SecurityAuditEventType;
import com.hpsqsoft.ctrlropa.security.audit.SecurityAuditService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@Component
public class ApiTokenFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(ApiTokenFilter.class);
    private static final String BEARER_PREFIX = "Bearer ";

    private final JdbcTemplate jdbcTemplate;
    private final SecurityAuditService securityAuditService;

    public ApiTokenFilter(JdbcTemplate jdbcTemplate, SecurityAuditService securityAuditService) {
        this.jdbcTemplate = jdbcTemplate;
        this.securityAuditService = securityAuditService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (!mustValidate(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = extractToken(request.getHeader("Authorization"));
        if (token == null || !isTokenValid(token)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            boolean revokedToken = token != null && isRevokedToken(token);
            String message = revokedToken
                    ? "Tu sesion se cerro porque iniciaste sesion en otro dispositivo."
                    : "Sesion invalida o vencida";
            auditInvalidToken(token, revokedToken, message);
            response.getWriter().write("{\"message\":\"" + message + "\"}");
            return;
        }

        if (isPasswordChangeRequired(token) && !isPasswordChangeAllowedPath(request)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.getWriter().write("{\"message\":\"Debes cambiar tu contraseña para continuar\"}");
            return;
        }

        refreshSession(token);

        filterChain.doFilter(request, response);
    }

    private boolean mustValidate(HttpServletRequest request) {
        String path = request.getRequestURI();

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return false;
        }

        if (!path.startsWith("/api/")) {
            return false;
        }

        if (path.equals("/api/auth/login")) {
            return false;
        }

        if (path.equals("/api/security/settings/public")) {
            return false;
        }

        if (path.equals("/api/health") || path.equals("/api/health/")) {
            return false;
        }

        return !(path.equals("/api/appearance") && "GET".equalsIgnoreCase(request.getMethod()));
    }

    private String extractToken(String authorization) {
        if (authorization == null || !authorization.startsWith(BEARER_PREFIX)) {
            return null;
        }

        String token = authorization.substring(BEARER_PREFIX.length()).trim();
        return token.isEmpty() ? null : token;
    }

    private boolean isTokenValid(String token) {
        String tokenHash = sha256(token);
        SessionValidationRow session = findSessionForValidation(tokenHash);

        if (session == null) {
            log.warn("AUTH session_validation tokenHash={} result=NOT_FOUND", preview(tokenHash));
            return false;
        }

        boolean valid = session.revokedAt() == null
                && Boolean.TRUE.equals(session.notExpired())
                && Boolean.TRUE.equals(session.notAbsoluteExpired())
                && "ACTIVE".equals(session.userStatus())
                && (session.sessionCompanyId() == null || "ACTIVE".equals(session.companyStatus()))
                && (session.sessionBranchId() == null
                    || ("ACTIVE".equals(session.branchStatus())
                        && session.sessionCompanyId() != null
                        && session.sessionCompanyId().equals(session.branchCompanyId())))
                && Boolean.TRUE.equals(session.isLatestActiveSession());

        log.debug(
                "AUTH session_validation sessionId={} userId={} tokenHash={} revokedAt={} expiresAt={} absoluteExpiresAt={} latestActive={} result={}",
                session.id(),
                session.userId(),
                preview(tokenHash),
                session.revokedAt(),
                session.expiresAt(),
                session.absoluteExpiresAt(),
                session.isLatestActiveSession(),
                valid ? "VALID" : "INVALID"
        );

        return valid;
    }

    private SessionValidationRow findSessionForValidation(String tokenHash) {
        return jdbcTemplate.query(
                """
                SELECT
                  s.id,
                  s.user_id,
                  u.email,
                  s.active_company_id,
                  s.active_branch_id,
                  s.revoked_at,
                  s.expires_at,
                  s.absolute_expires_at,
                  s.expires_at > CURRENT_TIMESTAMP AS not_expired,
                  (s.absolute_expires_at IS NULL OR s.absolute_expires_at > CURRENT_TIMESTAMP) AS not_absolute_expired,
                  u.status AS user_status,
                  c.status AS company_status,
                  b.status AS branch_status,
                  b.company_id AS branch_company_id,
                  s.id = (
                    SELECT MAX(active_s.id)
                    FROM user_api_sessions active_s
                    WHERE active_s.user_id = s.user_id
                      AND active_s.revoked_at IS NULL
                      AND active_s.expires_at > CURRENT_TIMESTAMP
                      AND (active_s.absolute_expires_at IS NULL OR active_s.absolute_expires_at > CURRENT_TIMESTAMP)
                  ) AS latest_active_session
                FROM user_api_sessions s
                JOIN users u ON u.id = s.user_id
                LEFT JOIN companies c ON c.id = s.active_company_id
                LEFT JOIN branches b ON b.id = s.active_branch_id
                WHERE s.token_hash = ?
                """,
                rs -> rs.next()
                        ? new SessionValidationRow(
                                rs.getLong("id"),
                                rs.getLong("user_id"),
                                rs.getString("email"),
                                rs.getObject("active_company_id", Long.class),
                                rs.getObject("active_branch_id", Long.class),
                                rs.getTimestamp("revoked_at"),
                                rs.getTimestamp("expires_at"),
                                rs.getTimestamp("absolute_expires_at"),
                                rs.getBoolean("not_expired"),
                                rs.getBoolean("not_absolute_expired"),
                                rs.getString("user_status"),
                                rs.getString("company_status"),
                                rs.getString("branch_status"),
                                rs.getObject("branch_company_id", Long.class),
                                rs.getBoolean("latest_active_session")
                        )
                        : null,
                tokenHash
        );
    }

    private void auditInvalidToken(String token, boolean revokedToken, String message) {
        if (token == null) {
            securityAuditService.record(
                    SecurityAuditEventType.TOKEN_INVALID,
                    null,
                    null,
                    null,
                    null,
                    HttpServletResponse.SC_UNAUTHORIZED,
                    "Token ausente"
            );
            return;
        }

        String tokenHash = sha256(token);
        SessionValidationRow session = findSessionForValidation(tokenHash);
        SecurityAuditEventType eventType = revokedToken
                ? SecurityAuditEventType.TOKEN_REVOKED
                : SecurityAuditEventType.TOKEN_INVALID;
        if (session != null && session.revokedAt() != null) {
            eventType = SecurityAuditEventType.TOKEN_REVOKED;
        } else if (session != null && !Boolean.TRUE.equals(session.isLatestActiveSession())) {
            eventType = SecurityAuditEventType.SESSION_REVOKED;
        }

        securityAuditService.record(
                eventType,
                session == null ? null : session.userId(),
                session == null ? null : session.email(),
                session == null ? null : session.sessionCompanyId(),
                session == null ? null : session.sessionBranchId(),
                HttpServletResponse.SC_UNAUTHORIZED,
                message,
                "TOKEN",
                preview(tokenHash),
                "{\"tokenHashPreview\":\"" + preview(tokenHash) + "\"}"
        );
    }

    private boolean isRevokedToken(String token) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM user_api_sessions
                WHERE token_hash = ?
                  AND revoked_at IS NOT NULL
                """,
                Integer.class,
                sha256(token)
        );

        return count != null && count > 0;
    }

    private boolean isPasswordChangeRequired(String token) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM user_api_sessions s
                JOIN users u ON u.id = s.user_id
                WHERE s.token_hash = ?
                  AND u.password_change_required = 1
                """,
                Integer.class,
                sha256(token)
        );

        return count != null && count > 0;
    }

    private boolean isPasswordChangeAllowedPath(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.equals("/api/auth/change-password")
                || path.equals("/api/auth/logout")
                || path.equals("/api/me");
    }

    private void refreshSession(String token) {
        jdbcTemplate.update(
                """
                UPDATE user_api_sessions
                SET
                  last_seen_at = CURRENT_TIMESTAMP,
                  expires_at = DATE_ADD(
                    CURRENT_TIMESTAMP,
                    INTERVAL COALESCE((
                      SELECT CAST(setting_value AS UNSIGNED)
                      FROM system_security_settings
                      WHERE setting_key = 'session_timeout_minutes'
                    ), 30) MINUTE
                  ),
                  ip_address = ?,
                  user_agent = ?
                WHERE token_hash = ?
                  AND revoked_at IS NULL
                  AND expires_at > CURRENT_TIMESTAMP
                  AND (absolute_expires_at IS NULL OR absolute_expires_at > CURRENT_TIMESTAMP)
                """,
                clientIp(),
                userAgent(),
                sha256(token)
        );
    }

    private String clientIp() {
        String forwarded = getCurrentRequest().getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }

        return getCurrentRequest().getRemoteAddr();
    }

    private String userAgent() {
        String value = getCurrentRequest().getHeader("User-Agent");
        if (value == null) {
            return null;
        }

        return value.length() > 500 ? value.substring(0, 500) : value;
    }

    private HttpServletRequest getCurrentRequest() {
        return ((org.springframework.web.context.request.ServletRequestAttributes)
                org.springframework.web.context.request.RequestContextHolder.currentRequestAttributes()).getRequest();
    }

    private String sha256(String value) {
        try {
            byte[] hash = MessageDigest
                    .getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder();
            for (byte item : hash) {
                builder.append(String.format("%02x", item));
            }
            return builder.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("No se pudo validar la sesión");
        }
    }

    private String preview(String tokenHash) {
        if (tokenHash == null || tokenHash.length() <= 12) {
            return tokenHash;
        }
        return tokenHash.substring(0, 12);
    }

    private record SessionValidationRow(
            Long id,
            Long userId,
            String email,
            Long sessionCompanyId,
            Long sessionBranchId,
            java.sql.Timestamp revokedAt,
            java.sql.Timestamp expiresAt,
            java.sql.Timestamp absoluteExpiresAt,
            Boolean notExpired,
            Boolean notAbsoluteExpired,
            String userStatus,
            String companyStatus,
            String branchStatus,
            Long branchCompanyId,
            Boolean isLatestActiveSession
    ) {
    }
}
