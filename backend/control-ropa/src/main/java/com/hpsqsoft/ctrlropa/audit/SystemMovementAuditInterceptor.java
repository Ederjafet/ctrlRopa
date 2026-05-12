package com.hpsqsoft.ctrlropa.audit;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Locale;
import java.util.List;

@Component
public class SystemMovementAuditInterceptor implements HandlerInterceptor {

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    private final JdbcTemplate jdbcTemplate;

    public SystemMovementAuditInterceptor(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void afterCompletion(HttpServletRequest request,
                                HttpServletResponse response,
                                Object handler,
                                Exception ex) {
        if (!shouldAudit(request, response)) {
            return;
        }

        Long userId = resolveUserId(request);
        UserInfo userInfo = userId == null ? null : findUserInfo(userId);
        String path = request.getRequestURI();
        String method = request.getMethod().toUpperCase(Locale.ROOT);

        jdbcTemplate.update(
                """
                INSERT INTO system_movement_audit_log (
                    category,
                    event_type,
                    http_method,
                    request_path,
                    query_string,
                    status_code,
                    branch_id,
                    user_id,
                    user_name,
                    detail
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                resolveCategory(path),
                resolveEventType(method, path),
                method,
                path,
                trimTo(request.getQueryString(), 500),
                response.getStatus(),
                userInfo == null ? null : userInfo.branchId,
                userId,
                userInfo == null ? null : userInfo.name,
                buildDetail(method, path)
        );
    }

    private Long resolveUserId(HttpServletRequest request) {
        String authorization = request.getHeader(AUTHORIZATION_HEADER);
        if (authorization == null || !authorization.startsWith(BEARER_PREFIX)) {
            return null;
        }

        String token = authorization.substring(BEARER_PREFIX.length()).trim();
        if (token.isEmpty()) {
            return null;
        }

        List<Long> users = jdbcTemplate.query(
                """
                SELECT user_id
                FROM user_api_sessions
                WHERE token_hash = ?
                """,
                (rs, rowNum) -> rs.getLong("user_id"),
                sha256(token)
        );

        return users.isEmpty() ? null : users.get(0);
    }

    private boolean shouldAudit(HttpServletRequest request, HttpServletResponse response) {
        String method = request.getMethod().toUpperCase(Locale.ROOT);
        String path = request.getRequestURI();

        if (!path.startsWith("/api/")) {
            return false;
        }

        if ("OPTIONS".equals(method) || "GET".equals(method)) {
            return false;
        }

        if (path.startsWith("/api/auth/login")) {
            return false;
        }

        return response.getStatus() < 400;
    }

    private UserInfo findUserInfo(Long userId) {
        return jdbcTemplate.query(
                """
                SELECT id, branch_id, name
                FROM users
                WHERE id = ?
                """,
                rs -> rs.next()
                        ? new UserInfo(
                                rs.getLong("id"),
                                rs.getLong("branch_id"),
                                rs.getString("name")
                        )
                        : null,
                userId
        );
    }

    private String resolveCategory(String path) {
        String cleanPath = path.toLowerCase(Locale.ROOT);

        if (cleanPath.contains("/payments")
                || cleanPath.contains("/refunds")
                || cleanPath.contains("/cash-closures")
                || cleanPath.contains("/balance")) {
            return "FINANCIAL";
        }

        return "NON_FINANCIAL";
    }

    private String resolveEventType(String method, String path) {
        String resource = path
                .replaceFirst("^/api/", "")
                .split("/")[0]
                .replace("-", "_")
                .toUpperCase(Locale.ROOT);

        String action = switch (method) {
            case "POST" -> "CREATE";
            case "PUT" -> "UPDATE";
            case "PATCH" -> "CHANGE";
            case "DELETE" -> "DELETE";
            default -> method;
        };

        return "SYSTEM_" + resource + "_" + action;
    }

    private String buildDetail(String method, String path) {
        return method + " " + path;
    }

    private String trimTo(String value, int maxLength) {
        if (value == null) {
            return null;
        }

        return value.length() <= maxLength ? value : value.substring(0, maxLength);
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
            return value;
        }
    }

    private static class UserInfo {
        private final Long id;
        private final Long branchId;
        private final String name;

        private UserInfo(Long id, Long branchId, String name) {
            this.id = id;
            this.branchId = branchId;
            this.name = name;
        }
    }
}
