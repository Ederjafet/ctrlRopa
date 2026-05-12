package com.hpsqsoft.ctrlropa.security.settings;

import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
public class SecuritySettingsService {

    public static final int DEFAULT_SESSION_TIMEOUT_MINUTES = 30;
    public static final int DEFAULT_MAX_LOGIN_ATTEMPTS = 5;
    public static final int DEFAULT_LOGIN_LOCKOUT_MINUTES = 15;
    public static final int DEFAULT_PASSWORD_MIN_LENGTH = 8;
    public static final int DEFAULT_PASSWORD_EXPIRATION_DAYS = 90;
    public static final int DEFAULT_PASSWORD_HISTORY_COUNT = 5;
    public static final int DEFAULT_ABSOLUTE_SESSION_TIMEOUT_HOURS = 12;

    private final JdbcTemplate jdbcTemplate;
    private final CurrentUser currentUser;

    public SecuritySettingsService(JdbcTemplate jdbcTemplate, CurrentUser currentUser) {
        this.jdbcTemplate = jdbcTemplate;
        this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public SecuritySettingsResponse getPublicSettings() {
        return getSettings();
    }

    @Transactional(readOnly = true)
    public SecuritySettingsResponse getDeveloperSettings() {
        assertSupportTech();
        return getSettings();
    }

    @Transactional
    public SecuritySettingsResponse updateDeveloperSettings(UpdateSecuritySettingsRequest request) {
        Long userId = currentUser.getUserId();
        assertSupportTech(userId);

        upsert("session_timeout_minutes", request.getSessionTimeoutMinutes(), userId);
        upsert("max_login_attempts", request.getMaxLoginAttempts(), userId);
        upsert("login_lockout_minutes", request.getLoginLockoutMinutes(), userId);
        upsert("password_min_length", request.getPasswordMinLength(), userId);
        upsert("password_require_uppercase", boolValue(request.getPasswordRequireUppercase()), userId);
        upsert("password_require_lowercase", boolValue(request.getPasswordRequireLowercase()), userId);
        upsert("password_require_number", boolValue(request.getPasswordRequireNumber()), userId);
        upsert("password_require_symbol", boolValue(request.getPasswordRequireSymbol()), userId);
        upsert("password_expiration_days", request.getPasswordExpirationDays(), userId);
        upsert("password_history_count", request.getPasswordHistoryCount(), userId);
        upsert("absolute_session_timeout_hours", request.getAbsoluteSessionTimeoutHours(), userId);

        return getSettings();
    }

    @Transactional(readOnly = true)
    public SecuritySettingsResponse getSettings() {
        Map<String, String> values = jdbcTemplate.query(
                """
                SELECT setting_key, setting_value
                FROM system_security_settings
                WHERE setting_key IN (
                  'session_timeout_minutes',
                  'max_login_attempts',
                  'login_lockout_minutes',
                  'password_min_length',
                  'password_require_uppercase',
                  'password_require_lowercase',
                  'password_require_number',
                  'password_require_symbol',
                  'password_expiration_days',
                  'password_history_count',
                  'absolute_session_timeout_hours'
                )
                """,
                rs -> {
                    Map<String, String> rows = new HashMap<>();
                    while (rs.next()) {
                        rows.put(rs.getString("setting_key"), rs.getString("setting_value"));
                    }
                    return rows;
                }
        );

        return new SecuritySettingsResponse(
                intValue(values.get("session_timeout_minutes"), DEFAULT_SESSION_TIMEOUT_MINUTES),
                intValue(values.get("max_login_attempts"), DEFAULT_MAX_LOGIN_ATTEMPTS),
                intValue(values.get("login_lockout_minutes"), DEFAULT_LOGIN_LOCKOUT_MINUTES),
                intValue(values.get("password_min_length"), DEFAULT_PASSWORD_MIN_LENGTH),
                boolValue(values.get("password_require_uppercase"), true),
                boolValue(values.get("password_require_lowercase"), true),
                boolValue(values.get("password_require_number"), true),
                boolValue(values.get("password_require_symbol"), true),
                intValue(values.get("password_expiration_days"), DEFAULT_PASSWORD_EXPIRATION_DAYS),
                intValue(values.get("password_history_count"), DEFAULT_PASSWORD_HISTORY_COUNT),
                intValue(values.get("absolute_session_timeout_hours"), DEFAULT_ABSOLUTE_SESSION_TIMEOUT_HOURS)
        );
    }

    public void assertPasswordPolicy(String password) {
        SecuritySettingsResponse settings = getSettings();

        if (password == null || password.length() < settings.getPasswordMinLength()) {
            throw new IllegalArgumentException("La contraseña debe tener al menos " + settings.getPasswordMinLength() + " caracteres.");
        }

        if (Boolean.TRUE.equals(settings.getPasswordRequireUppercase()) && !password.matches(".*[A-Z].*")) {
            throw new IllegalArgumentException("La contraseña debe incluir al menos una mayuscula.");
        }

        if (Boolean.TRUE.equals(settings.getPasswordRequireLowercase()) && !password.matches(".*[a-z].*")) {
            throw new IllegalArgumentException("La contraseña debe incluir al menos una minuscula.");
        }

        if (Boolean.TRUE.equals(settings.getPasswordRequireNumber()) && !password.matches(".*[0-9].*")) {
            throw new IllegalArgumentException("La contraseña debe incluir al menos un numero.");
        }

        if (Boolean.TRUE.equals(settings.getPasswordRequireSymbol()) && !password.matches(".*[^A-Za-z0-9].*")) {
            throw new IllegalArgumentException("La contraseña debe incluir al menos un simbolo.");
        }
    }

    private void upsert(String key, Integer value, Long userId) {
        jdbcTemplate.update(
                """
                INSERT INTO system_security_settings (setting_key, setting_value, updated_by_user_id)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE
                  setting_value = VALUES(setting_value),
                  updated_by_user_id = VALUES(updated_by_user_id)
                """,
                key,
                String.valueOf(value),
                userId
        );
    }

    private void assertSupportTech() {
        assertSupportTech(currentUser.getUserId());
    }

    private void assertSupportTech(Long userId) {
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
            throw new AccessDeniedException("Rol requerido: " + PermissionCode.MANAGE_SECURITY_SETTINGS);
        }
    }

    private int intValue(String rawValue, int fallback) {
        if (rawValue == null || rawValue.isBlank()) {
            return fallback;
        }

        try {
            return Integer.parseInt(rawValue.trim());
        } catch (NumberFormatException ex) {
            return fallback;
        }
    }

    private int boolValue(Boolean value) {
        return Boolean.TRUE.equals(value) ? 1 : 0;
    }

    private boolean boolValue(String rawValue, boolean fallback) {
        if (rawValue == null || rawValue.isBlank()) {
            return fallback;
        }

        return "1".equals(rawValue.trim()) || "true".equalsIgnoreCase(rawValue.trim());
    }
}
