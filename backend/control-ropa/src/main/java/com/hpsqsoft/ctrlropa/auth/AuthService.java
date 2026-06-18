package com.hpsqsoft.ctrlropa.auth;

import com.hpsqsoft.ctrlropa.security.settings.SecuritySettingsResponse;
import com.hpsqsoft.ctrlropa.security.settings.SecuritySettingsService;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.audit.SecurityAuditEventType;
import com.hpsqsoft.ctrlropa.security.audit.SecurityAuditService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class AuthService {

    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;
    private final SecuritySettingsService securitySettingsService;
    private final CurrentUser currentUser;
    private final HttpServletRequest httpRequest;
    private final SecurityAuditService securityAuditService;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(JdbcTemplate jdbcTemplate,
                       SecuritySettingsService securitySettingsService,
                       CurrentUser currentUser,
                       HttpServletRequest httpRequest,
                       SecurityAuditService securityAuditService) {
        this.jdbcTemplate = jdbcTemplate;
        this.securitySettingsService = securitySettingsService;
        this.currentUser = currentUser;
        this.httpRequest = httpRequest;
        this.securityAuditService = securityAuditService;
        this.passwordEncoder = PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        String email = cleanRequired(request.getEmail()).toLowerCase();
        String password = cleanRequired(request.getPassword());

        AuthUserRow user = findUserByEmail(email);
        SecuritySettingsResponse securitySettings = securitySettingsService.getSettings();

        assertNotLocked(user.id());

        if (!passwordEncoder.matches(password, user.passwordHash())) {
            registerFailedLogin(user.id(), securitySettings);
            auditSecurityEvent("AUTH_LOGIN_FAILED", "/api/auth/login", 403, user.id(), user.branchId(), user.name(), "Credenciales invalidas");
            throw new AccessDeniedException("Credenciales invalidas");
        }

        if (!"ACTIVE".equals(user.status())) {
            throw new AccessDeniedException("Usuario inactivo");
        }

        List<LoginResponse.RoleInfo> roles = findRoles(user.id());
        List<LoginResponse.PermissionInfo> effectivePermissions = findEffectivePermissions(user.id());
        assertAuthorizedForLogin(user, roles, effectivePermissions);
        DefaultTenantRow tenant = findDefaultTenantForUser(user.id());

        boolean passwordExpired = isPasswordExpired(user.passwordUpdatedAt(), securitySettings);
        if (passwordExpired) {
            markPasswordChangeRequired(user.id());
        }

        registerSuccessfulLogin(user.id());
        String sessionToken = createApiSession(user.id(), securitySettings, tenant);
        auditSecurityEvent("AUTH_LOGIN_SUCCESS", "/api/auth/login", 200, user.id(), user.branchId(), user.name(), "Login exitoso");

        return new LoginResponse(
                user.id(),
                user.name(),
                user.email(),
                user.phone(),
                user.status(),
                sessionToken,
                securitySettings.getSessionTimeoutMinutes(),
                Boolean.TRUE.equals(user.passwordChangeRequired()) || passwordExpired,
                findCompany(tenant.companyId()),
                findBranch(tenant.branchId()),
                roles,
                effectivePermissions,
                findChannels(user.branchId())
        );
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        Long userId = currentUser.getUserId();
        PasswordUserRow user = findPasswordUser(userId);
        String currentPassword = cleanRequired(request.getCurrentPassword());
        String newPassword = cleanRequired(request.getNewPassword());

        if (!passwordEncoder.matches(currentPassword, user.passwordHash())) {
            auditSecurityEvent("AUTH_PASSWORD_CHANGE_FAILED", "/api/auth/change-password", 403, user.id(), user.branchId(), user.name(), "Contraseña actual incorrecta");
            throw new AccessDeniedException("Contraseña actual incorrecta");
        }

        securitySettingsService.assertPasswordPolicy(newPassword);
        assertPasswordNotReused(userId, newPassword, user.passwordHash());

        String newPasswordHash = passwordEncoder.encode(newPassword);

        jdbcTemplate.update(
                """
                UPDATE users
                SET password_hash = ?,
                    password_change_required = 0,
                    password_updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                newPasswordHash,
                userId
        );

        savePasswordHistory(userId, newPasswordHash);

        jdbcTemplate.update(
                """
                UPDATE user_api_sessions
                SET revoked_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
                  AND revoked_at IS NULL
                  AND token_hash <> ?
                """,
                userId,
                currentUser.getCurrentTokenHash()
        );

        auditSecurityEvent("AUTH_PASSWORD_CHANGED", "/api/auth/change-password", 200, user.id(), user.branchId(), user.name(), "Cambio de contraseña por usuario");
    }

    @Transactional
    public void logout(String authorization) {
        String token = extractBearerToken(authorization);
        if (token == null) {
            return;
        }

        String tokenHash = sha256(token);
        AuthUserInfo userInfo = findUserInfoByTokenHash(tokenHash);

        jdbcTemplate.update(
                """
                UPDATE user_api_sessions
                SET revoked_at = CURRENT_TIMESTAMP
                WHERE token_hash = ?
                  AND revoked_at IS NULL
                """,
                tokenHash
        );

        if (userInfo != null) {
            auditSecurityEvent("AUTH_LOGOUT", "/api/auth/logout", 200, userInfo.id(), userInfo.branchId(), userInfo.name(), "Logout");
        }
    }

    private String createApiSession(Long userId, SecuritySettingsResponse settings, DefaultTenantRow tenant) {
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
        Integer absoluteHours = settings.getAbsoluteSessionTimeoutHours();
        int revokedSessions = revokeActiveSessionsForUser(userId);
        if (revokedSessions > 0) {
            securityAuditService.record(
                    SecurityAuditEventType.SESSION_REVOKED,
                    userId,
                    null,
                    tenant.companyId(),
                    tenant.branchId(),
                    200,
                    "Sesiones activas anteriores revocadas por nuevo login",
                    "USER_API_SESSION",
                    userId.toString(),
                    "{\"revokedSessions\":" + revokedSessions + "}"
            );
        }

        jdbcTemplate.update(
                """
                INSERT INTO user_api_sessions (
                  user_id,
                  active_company_id,
                  active_branch_id,
                  token_hash,
                  expires_at,
                  absolute_expires_at,
                  last_seen_at,
                  ip_address,
                  user_agent
                ) VALUES (
                  ?,
                  ?,
                  ?,
                  ?,
                  DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? MINUTE),
                  CASE WHEN ? > 0 THEN DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? HOUR) ELSE NULL END,
                  CURRENT_TIMESTAMP,
                  ?,
                  ?
                )
                """,
                userId,
                tenant.companyId(),
                tenant.branchId(),
                sha256(token),
                settings.getSessionTimeoutMinutes(),
                absoluteHours,
                absoluteHours,
                clientIp(),
                userAgent()
        );

        return token;
    }

    private int revokeActiveSessionsForUser(Long userId) {
        return jdbcTemplate.update(
                """
                UPDATE user_api_sessions
                SET revoked_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
                  AND revoked_at IS NULL
                """,
                userId
        );
    }

    private void assertAuthorizedForLogin(AuthUserRow user,
                                          List<LoginResponse.RoleInfo> roles,
                                          List<LoginResponse.PermissionInfo> effectivePermissions) {
        boolean hasNoAccessRole = roles.stream().anyMatch(role -> "NO_ACCESS".equals(role.getCode()));

        if (hasNoAccessRole) {
            securityAuditService.record(
                    SecurityAuditEventType.LOGIN_BLOCKED_NO_ACCESS,
                    user.id(),
                    user.email(),
                    null,
                    user.branchId(),
                    403,
                    "Usuario con rol NO_ACCESS"
            );
            auditSecurityEvent("AUTH_LOGIN_DENIED", "/api/auth/login", 403, user.id(), user.branchId(), user.name(), "Usuario con rol NO_ACCESS");
            throw new AccessDeniedException("No tienes permisos asignados para acceder al sistema");
        }

        if (effectivePermissions.isEmpty()) {
            securityAuditService.record(
                    SecurityAuditEventType.LOGIN_BLOCKED_NO_EFFECTIVE_PERMISSIONS,
                    user.id(),
                    user.email(),
                    null,
                    user.branchId(),
                    403,
                    "Usuario sin permisos efectivos"
            );
            auditSecurityEvent("AUTH_LOGIN_DENIED", "/api/auth/login", 403, user.id(), user.branchId(), user.name(), "Usuario sin permisos efectivos");
            throw new AccessDeniedException("No tienes permisos asignados para acceder al sistema");
        }
    }

    private DefaultTenantRow findDefaultTenantForUser(Long userId) {
        return jdbcTemplate.query(
                """
                SELECT
                  c.id AS company_id,
                  b.id AS branch_id
                FROM users u
                JOIN branches b ON b.id = u.branch_id
                JOIN companies c ON c.id = b.company_id
                JOIN user_companies uc ON uc.user_id = u.id
                                    AND uc.company_id = c.id
                                    AND uc.status = 'ACTIVE'
                JOIN user_branches ub ON ub.user_id = u.id
                                    AND ub.branch_id = b.id
                WHERE u.id = ?
                  AND u.status = 'ACTIVE'
                  AND b.status = 'ACTIVE'
                  AND c.status = 'ACTIVE'
                """,
                rs -> {
                    if (!rs.next()) {
                        securityAuditService.record(
                                SecurityAuditEventType.COMPANY_DENIED,
                                userId,
                                null,
                                null,
                                null,
                                403,
                                "No se pudo resolver company activa para la sesion"
                        );
                        throw new AccessDeniedException("No se pudo resolver company activa para la sesion");
                    }
                    return new DefaultTenantRow(
                            rs.getLong("company_id"),
                            rs.getLong("branch_id")
                    );
                },
                userId
        );
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
            throw new IllegalStateException("No se pudo firmar la sesión");
        }
    }

    private void assertNotLocked(Long userId) {
        List<LocalDateTime> lockedUntilValues = jdbcTemplate.query(
                """
                SELECT locked_until
                FROM user_login_security
                WHERE user_id = ?
                """,
                (rs, rowNum) -> {
                    java.sql.Timestamp value = rs.getTimestamp("locked_until");
                    return value == null ? null : value.toLocalDateTime();
                },
                userId
        );

        if (!lockedUntilValues.isEmpty()) {
            LocalDateTime lockedUntil = lockedUntilValues.get(0);
            if (lockedUntil != null && lockedUntil.isAfter(LocalDateTime.now())) {
                throw new AccessDeniedException("Usuario bloqueado temporalmente");
            }
        }
    }

    private void registerFailedLogin(Long userId, SecuritySettingsResponse settings) {
        jdbcTemplate.update(
                """
                INSERT INTO user_login_security (user_id, failed_login_attempts, last_failed_login_at)
                VALUES (?, 1, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE
                  failed_login_attempts = failed_login_attempts + 1,
                  last_failed_login_at = CURRENT_TIMESTAMP
                """,
                userId
        );

        Integer failedAttempts = jdbcTemplate.queryForObject(
                """
                SELECT failed_login_attempts
                FROM user_login_security
                WHERE user_id = ?
                """,
                Integer.class,
                userId
        );

        if (failedAttempts != null && failedAttempts >= settings.getMaxLoginAttempts()) {
            jdbcTemplate.update(
                    """
                    UPDATE user_login_security
                    SET locked_until = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? MINUTE)
                    WHERE user_id = ?
                    """,
                    settings.getLoginLockoutMinutes(),
                    userId
            );
            AuthUserInfo userInfo = findUserInfo(userId);
            if (userInfo != null) {
                auditSecurityEvent("AUTH_USER_LOCKED", "/api/auth/login", 403, userInfo.id(), userInfo.branchId(), userInfo.name(), "Bloqueo temporal por intentos fallidos");
            }
        }
    }

    private void registerSuccessfulLogin(Long userId) {
        jdbcTemplate.update(
                """
                INSERT INTO user_login_security (
                  user_id,
                  failed_login_attempts,
                  locked_until,
                  last_success_login_at,
                  last_login_ip,
                  last_login_user_agent
                ) VALUES (?, 0, NULL, CURRENT_TIMESTAMP, ?, ?)
                ON DUPLICATE KEY UPDATE
                  failed_login_attempts = 0,
                  locked_until = NULL,
                  last_success_login_at = CURRENT_TIMESTAMP,
                  last_login_ip = VALUES(last_login_ip),
                  last_login_user_agent = VALUES(last_login_user_agent)
                """,
                userId,
                clientIp(),
                userAgent()
        );
    }

    private AuthUserRow findUserByEmail(String email) {
        List<AuthUserRow> users = jdbcTemplate.query(
                """
                SELECT id, branch_id, name, email, phone, status, password_hash, password_change_required, password_updated_at
                FROM users
                WHERE email = ?
                """,
                (rs, rowNum) -> new AuthUserRow(
                        rs.getLong("id"),
                        rs.getLong("branch_id"),
                        rs.getString("name"),
                        rs.getString("email"),
                        rs.getString("phone"),
                        rs.getString("status"),
                        rs.getString("password_hash"),
                        rs.getBoolean("password_change_required"),
                        rs.getTimestamp("password_updated_at") == null
                                ? null
                                : rs.getTimestamp("password_updated_at").toLocalDateTime()
                ),
                email
        );

        if (users.isEmpty()) {
            auditSecurityEvent("AUTH_LOGIN_FAILED", "/api/auth/login", 403, null, null, null, "Email no registrado: " + email);
            throw new AccessDeniedException("Credenciales invalidas");
        }

        return users.get(0);
    }

    private PasswordUserRow findPasswordUser(Long userId) {
        return jdbcTemplate.query(
                """
                SELECT id, branch_id, name, password_hash
                FROM users
                WHERE id = ?
                """,
                rs -> rs.next()
                        ? new PasswordUserRow(
                                rs.getLong("id"),
                                rs.getLong("branch_id"),
                                rs.getString("name"),
                                rs.getString("password_hash")
                        )
                        : null,
                userId
        );
    }

    private AuthUserInfo findUserInfo(Long userId) {
        return jdbcTemplate.query(
                """
                SELECT id, branch_id, name
                FROM users
                WHERE id = ?
                """,
                rs -> rs.next()
                        ? new AuthUserInfo(
                                rs.getLong("id"),
                                rs.getLong("branch_id"),
                                rs.getString("name")
                        )
                        : null,
                userId
        );
    }

    private AuthUserInfo findUserInfoByTokenHash(String tokenHash) {
        return jdbcTemplate.query(
                """
                SELECT u.id, u.branch_id, u.name
                FROM user_api_sessions s
                JOIN users u ON u.id = s.user_id
                WHERE s.token_hash = ?
                """,
                rs -> rs.next()
                        ? new AuthUserInfo(
                                rs.getLong("id"),
                                rs.getLong("branch_id"),
                                rs.getString("name")
                        )
                        : null,
                tokenHash
        );
    }

    private void auditSecurityEvent(String eventType,
                                    String requestPath,
                                    Integer statusCode,
                                    Long userId,
                                    Long branchId,
                                    String userName,
                                    String detail) {
        jdbcTemplate.update(
                """
                INSERT INTO system_movement_audit_log (
                    category,
                    event_type,
                    http_method,
                    request_path,
                    status_code,
                    branch_id,
                    user_id,
                    user_name,
                    detail
                ) VALUES ('SECURITY', ?, 'POST', ?, ?, ?, ?, ?, ?)
                """,
                eventType,
                requestPath,
                statusCode,
                branchId,
                userId,
                userName,
                detail
        );
    }

    private boolean isPasswordExpired(LocalDateTime passwordUpdatedAt, SecuritySettingsResponse settings) {
        Integer expirationDays = settings.getPasswordExpirationDays();
        if (expirationDays == null || expirationDays <= 0 || passwordUpdatedAt == null) {
            return false;
        }

        return passwordUpdatedAt.plusDays(expirationDays).isBefore(LocalDateTime.now());
    }

    private void markPasswordChangeRequired(Long userId) {
        jdbcTemplate.update(
                """
                UPDATE users
                SET password_change_required = 1
                WHERE id = ?
                """,
                userId
        );
    }

    private void assertPasswordNotReused(Long userId, String newPassword, String currentPasswordHash) {
        SecuritySettingsResponse settings = securitySettingsService.getSettings();
        Integer historyCount = settings.getPasswordHistoryCount();
        if (historyCount == null || historyCount <= 0) {
            return;
        }

        if (passwordEncoder.matches(newPassword, currentPasswordHash)) {
            throw new IllegalArgumentException("La contraseña nueva no puede ser igual a una contraseña reciente.");
        }

        List<String> recentHashes = jdbcTemplate.query(
                """
                SELECT password_hash
                FROM user_password_history
                WHERE user_id = ?
                ORDER BY changed_at DESC, id DESC
                LIMIT ?
                """,
                (rs, rowNum) -> rs.getString("password_hash"),
                userId,
                historyCount
        );

        for (String hash : recentHashes) {
            if (passwordEncoder.matches(newPassword, hash)) {
                throw new IllegalArgumentException("La contraseña nueva no puede reutilizar una contraseña reciente.");
            }
        }
    }

    private void savePasswordHistory(Long userId, String passwordHash) {
        jdbcTemplate.update(
                """
                INSERT INTO user_password_history (user_id, password_hash)
                VALUES (?, ?)
                """,
                userId,
                passwordHash
        );
    }

    private String clientIp() {
        String forwarded = httpRequest.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }

        return httpRequest.getRemoteAddr();
    }

    private String userAgent() {
        String value = httpRequest.getHeader("User-Agent");
        if (value == null) {
            return null;
        }

        return value.length() > 500 ? value.substring(0, 500) : value;
    }

    private String extractBearerToken(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return null;
        }

        String token = authorization.substring("Bearer ".length()).trim();
        return token.isEmpty() ? null : token;
    }

    private LoginResponse.BranchInfo findBranch(Long branchId) {
        return jdbcTemplate.queryForObject(
                """
                SELECT id, code, name, status
                FROM branches
                WHERE id = ?
                """,
                (rs, rowNum) -> new LoginResponse.BranchInfo(
                        rs.getLong("id"),
                        rs.getString("code"),
                        rs.getString("name"),
                        rs.getString("status")
                ),
                branchId
        );
    }

    private LoginResponse.CompanyInfo findCompany(Long companyId) {
        return jdbcTemplate.queryForObject(
                """
                SELECT id, code, name
                FROM companies
                WHERE id = ?
                """,
                (rs, rowNum) -> new LoginResponse.CompanyInfo(
                        rs.getLong("id"),
                        rs.getString("code"),
                        rs.getString("name")
                ),
                companyId
        );
    }

    private List<LoginResponse.RoleInfo> findRoles(Long userId) {
        return jdbcTemplate.query(
                """
                SELECT r.id, r.code, r.name
                FROM user_roles ur
                JOIN roles r ON r.id = ur.role_id
                WHERE ur.user_id = ?
                ORDER BY r.code
                """,
                (rs, rowNum) -> new LoginResponse.RoleInfo(
                        rs.getLong("id"),
                        rs.getString("code"),
                        rs.getString("name")
                ),
                userId
        );
    }

    private List<LoginResponse.PermissionInfo> findEffectivePermissions(Long userId) {
        return jdbcTemplate.query(
                """
                SELECT DISTINCT p.id, p.code, p.name
                FROM permissions p
                WHERE
                    EXISTS (
                        SELECT 1
                        FROM user_permissions up
                        WHERE up.user_id = ?
                          AND up.permission_id = p.id
                    )
                    OR EXISTS (
                        SELECT 1
                        FROM user_roles ur
                        JOIN role_permissions rp ON rp.role_id = ur.role_id
                        WHERE ur.user_id = ?
                          AND rp.permission_id = p.id
                    )
                ORDER BY p.code
                """,
                (rs, rowNum) -> new LoginResponse.PermissionInfo(
                        rs.getLong("id"),
                        rs.getString("code"),
                        rs.getString("name")
                ),
                userId,
                userId
        );
    }

    private List<LoginResponse.ChannelInfo> findChannels(Long branchId) {
        return jdbcTemplate.query(
                """
                SELECT
                    sc.id,
                    sc.code,
                    sc.name,
                    sc.status,
                    CASE
                        WHEN bsc.id IS NULL THEN 0
                        ELSE bsc.is_enabled
                    END AS enabled
                FROM sales_channels sc
                LEFT JOIN branch_sales_channels bsc
                    ON bsc.sales_channel_id = sc.id
                   AND bsc.branch_id = ?
                WHERE sc.status = 'ACTIVE'
                  AND sc.global_enabled = 1
                ORDER BY sc.code
                """,
                (rs, rowNum) -> new LoginResponse.ChannelInfo(
                        rs.getLong("id"),
                        rs.getString("code"),
                        rs.getString("name"),
                        rs.getString("status"),
                        rs.getBoolean("enabled")
                ),
                branchId
        );
    }

    private String cleanRequired(String value) {
        if (value == null || value.trim().isBlank()) {
            throw new IllegalArgumentException("Valor obligatorio vacio");
        }

        return value.trim();
    }

    private record AuthUserRow(
            Long id,
            Long branchId,
            String name,
            String email,
            String phone,
            String status,
            String passwordHash,
            Boolean passwordChangeRequired,
            LocalDateTime passwordUpdatedAt
    ) {
    }

    private record PasswordUserRow(
            Long id,
            Long branchId,
            String name,
            String passwordHash
    ) {
    }

    private record AuthUserInfo(
            Long id,
            Long branchId,
            String name
    ) {
    }

    private record DefaultTenantRow(
            Long companyId,
            Long branchId
    ) {
    }
}
