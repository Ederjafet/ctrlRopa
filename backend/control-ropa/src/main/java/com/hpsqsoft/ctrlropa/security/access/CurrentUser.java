package com.hpsqsoft.ctrlropa.security.access;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;

@Component
public class CurrentUser {

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    private final HttpServletRequest request;
    private final JdbcTemplate jdbcTemplate;

    public CurrentUser(HttpServletRequest request, JdbcTemplate jdbcTemplate) {
        this.request = request;
        this.jdbcTemplate = jdbcTemplate;
    }

    public Long getUserId() {
        String bearerToken = getBearerToken();

        if (bearerToken == null) {
            throw new IllegalArgumentException("Token de sesión obligatorio");
        }

        return getUserIdFromToken(bearerToken);
    }

    public String getCurrentTokenHash() {
        String bearerToken = getBearerToken();
        return bearerToken == null ? null : sha256(bearerToken);
    }

    private String getBearerToken() {
        String value = request.getHeader(AUTHORIZATION_HEADER);
        if (value == null || !value.startsWith(BEARER_PREFIX)) {
            return null;
        }

        String token = value.substring(BEARER_PREFIX.length()).trim();
        return token.isEmpty() ? null : token;
    }

    private Long getUserIdFromToken(String token) {
        String tokenHash = sha256(token);
        List<Long> users = jdbcTemplate.query(
                """
                SELECT s.user_id
                FROM user_api_sessions s
                JOIN users u ON u.id = s.user_id
                WHERE s.token_hash = ?
                  AND s.revoked_at IS NULL
                  AND s.expires_at > CURRENT_TIMESTAMP
                  AND (s.absolute_expires_at IS NULL OR s.absolute_expires_at > CURRENT_TIMESTAMP)
                  AND u.status = 'ACTIVE'
                  AND s.id = (
                    SELECT MAX(active_s.id)
                    FROM user_api_sessions active_s
                    WHERE active_s.user_id = s.user_id
                      AND active_s.revoked_at IS NULL
                      AND active_s.expires_at > CURRENT_TIMESTAMP
                      AND (active_s.absolute_expires_at IS NULL OR active_s.absolute_expires_at > CURRENT_TIMESTAMP)
                  )
                """,
                (rs, rowNum) -> rs.getLong("user_id"),
                tokenHash
        );

        if (users.isEmpty()) {
            throw new IllegalArgumentException("Token de sesión invalido o vencido");
        }

        return users.get(0);
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
