package com.hpsqsoft.ctrlropa.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@Component
public class ApiTokenFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JdbcTemplate jdbcTemplate;

    public ApiTokenFilter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
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
            response.getWriter().write("{\"message\":\"Sesión invalida o vencida\"}");
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
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM user_api_sessions s
                JOIN users u ON u.id = s.user_id
                WHERE s.token_hash = ?
                  AND s.revoked_at IS NULL
                  AND s.expires_at > CURRENT_TIMESTAMP
                  AND (s.absolute_expires_at IS NULL OR s.absolute_expires_at > CURRENT_TIMESTAMP)
                  AND u.status = 'ACTIVE'
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
}
