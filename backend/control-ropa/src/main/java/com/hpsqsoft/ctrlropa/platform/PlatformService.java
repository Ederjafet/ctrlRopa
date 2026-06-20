package com.hpsqsoft.ctrlropa.platform;

import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import com.hpsqsoft.ctrlropa.security.settings.SecuritySettingsService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

@Service
@Transactional
public class PlatformService {

    private static final String TENANT_ADMIN_ROLE = "ADMIN";

    private final JdbcTemplate jdbcTemplate;
    private final AccessService accessService;
    private final CurrentUser currentUser;
    private final SecuritySettingsService securitySettingsService;

    public PlatformService(JdbcTemplate jdbcTemplate,
                           AccessService accessService,
                           CurrentUser currentUser,
                           SecuritySettingsService securitySettingsService) {
        this.jdbcTemplate = jdbcTemplate;
        this.accessService = accessService;
        this.currentUser = currentUser;
        this.securitySettingsService = securitySettingsService;
    }

    @Transactional(readOnly = true)
    public List<PlatformCompanyResponse> findCompanies() {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.VIEW_PLATFORM);

        return jdbcTemplate.query(
                """
                SELECT
                  c.id,
                  c.code,
                  c.name,
                  c.status,
                  b.id AS branch_id,
                  b.code AS branch_code,
                  b.name AS branch_name,
                  (
                    SELECT COUNT(*)
                    FROM users u
                    JOIN user_roles ur ON ur.user_id = u.id
                    JOIN roles r ON r.id = ur.role_id
                    JOIN branches ub ON ub.id = u.branch_id
                    WHERE ub.company_id = c.id
                      AND r.code = 'ADMIN'
                      AND u.status = 'ACTIVE'
                  ) AS admin_users
                FROM companies c
                LEFT JOIN branches b
                  ON b.id = (
                    SELECT MIN(b2.id)
                    FROM branches b2
                    WHERE b2.company_id = c.id
                      AND b2.status = 'ACTIVE'
                  )
                ORDER BY
                  CASE WHEN c.code = 'APPMODA_PLATFORM' THEN 0 ELSE 1 END,
                  c.created_at DESC,
                  c.name
                """,
                (rs, rowNum) -> new PlatformCompanyResponse(
                        rs.getLong("id"),
                        rs.getString("code"),
                        rs.getString("name"),
                        rs.getString("status"),
                        rs.getObject("branch_id", Long.class),
                        rs.getString("branch_code"),
                        rs.getString("branch_name"),
                        rs.getLong("admin_users")
                )
        );
    }

    public PlatformCompanyResponse createCompany(CreatePlatformCompanyRequest request) {
        Long userId = currentUser.getUserId();
        accessService.assertCan(userId, PermissionCode.MANAGE_COMPANIES);

        String name = cleanRequired(request.getName(), "name");
        String branchName = cleanRequired(request.getBranchName(), "branchName");
        String companyCode = nextCompanyCode(name);

        KeyHolder companyKey = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    """
                    INSERT INTO companies (code, name, status)
                    VALUES (?, ?, 'ACTIVE')
                    """,
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setString(1, companyCode);
            ps.setString(2, name);
            return ps;
        }, companyKey);

        Long companyId = companyKey.getKey().longValue();
        Long branchId = createMainBranch(companyId, branchName);
        enableDefaultSalesChannels(branchId, userId);

        return findCompany(companyId);
    }

    public PlatformTenantAdminResponse createTenantAdmin(Long companyId, CreateTenantAdminRequest request) {
        Long userId = currentUser.getUserId();
        accessService.assertCan(userId, PermissionCode.MANAGE_TENANT_ADMINS);

        assertActiveCompany(companyId);
        Long branchId = findPrimaryBranchId(companyId);
        Long roleId = findRoleId(TENANT_ADMIN_ROLE);
        String email = cleanRequired(request.getEmail(), "email").toLowerCase(Locale.ROOT);
        assertEmailAvailable(email);

        String password = cleanRequired(request.getPassword(), "password");
        securitySettingsService.assertPasswordPolicy(password);
        String passwordHash = "{noop}" + password;

        KeyHolder userKey = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    """
                    INSERT INTO users (
                      branch_id,
                      name,
                      email,
                      phone,
                      password_hash,
                      password_change_required,
                      password_updated_at,
                      status
                    ) VALUES (?, ?, ?, NULL, ?, 0, CURRENT_TIMESTAMP, 'ACTIVE')
                    """,
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setLong(1, branchId);
            ps.setString(2, cleanRequired(request.getName(), "name"));
            ps.setString(3, email);
            ps.setString(4, passwordHash);
            return ps;
        }, userKey);

        Long newUserId = userKey.getKey().longValue();

        jdbcTemplate.update(
                "INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)",
                newUserId,
                roleId
        );
        jdbcTemplate.update(
                """
                INSERT INTO user_companies (user_id, company_id, is_primary, status)
                VALUES (?, ?, 1, 'ACTIVE')
                """,
                newUserId,
                companyId
        );
        jdbcTemplate.update(
                """
                INSERT INTO user_branches (user_id, branch_id, is_primary)
                VALUES (?, ?, 1)
                """,
                newUserId,
                branchId
        );
        jdbcTemplate.update(
                "INSERT INTO user_password_history (user_id, password_hash) VALUES (?, ?)",
                newUserId,
                passwordHash
        );

        return findTenantAdmin(newUserId, companyId, branchId);
    }

    private Long createMainBranch(Long companyId, String branchName) {
        String branchCode = nextBranchCode(companyId, branchName);
        KeyHolder branchKey = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    """
                    INSERT INTO branches (
                      company_id,
                      code,
                      name,
                      status,
                      address_line1,
                      address_line2,
                      city,
                      state,
                      postal_code,
                      country
                    ) VALUES (?, ?, ?, 'ACTIVE', 'Pendiente de capturar', NULL, 'Pendiente', 'Pendiente', '00000', 'Mexico')
                    """,
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setLong(1, companyId);
            ps.setString(2, branchCode);
            ps.setString(3, branchName);
            return ps;
        }, branchKey);

        return branchKey.getKey().longValue();
    }

    private void enableDefaultSalesChannels(Long branchId, Long userId) {
        jdbcTemplate.update(
                """
                INSERT INTO branch_sales_channels (branch_id, sales_channel_id, is_enabled, updated_by_user_id)
                SELECT ?, sc.id, 1, ?
                FROM sales_channels sc
                WHERE sc.status = 'ACTIVE'
                  AND sc.global_enabled = 1
                ON DUPLICATE KEY UPDATE
                  is_enabled = VALUES(is_enabled),
                  updated_by_user_id = VALUES(updated_by_user_id)
                """,
                branchId,
                userId
        );
    }

    private PlatformCompanyResponse findCompany(Long companyId) {
        return jdbcTemplate.queryForObject(
                """
                SELECT
                  c.id,
                  c.code,
                  c.name,
                  c.status,
                  b.id AS branch_id,
                  b.code AS branch_code,
                  b.name AS branch_name,
                  (
                    SELECT COUNT(*)
                    FROM users u
                    JOIN user_roles ur ON ur.user_id = u.id
                    JOIN roles r ON r.id = ur.role_id
                    JOIN branches ub ON ub.id = u.branch_id
                    WHERE ub.company_id = c.id
                      AND r.code = 'ADMIN'
                      AND u.status = 'ACTIVE'
                  ) AS admin_users
                FROM companies c
                LEFT JOIN branches b
                  ON b.id = (
                    SELECT MIN(b2.id)
                    FROM branches b2
                    WHERE b2.company_id = c.id
                      AND b2.status = 'ACTIVE'
                  )
                WHERE c.id = ?
                """,
                (rs, rowNum) -> new PlatformCompanyResponse(
                        rs.getLong("id"),
                        rs.getString("code"),
                        rs.getString("name"),
                        rs.getString("status"),
                        rs.getObject("branch_id", Long.class),
                        rs.getString("branch_code"),
                        rs.getString("branch_name"),
                        rs.getLong("admin_users")
                ),
                companyId
        );
    }

    private PlatformTenantAdminResponse findTenantAdmin(Long userId, Long companyId, Long branchId) {
        return jdbcTemplate.queryForObject(
                """
                SELECT id, name, email, status
                FROM users
                WHERE id = ?
                """,
                (rs, rowNum) -> new PlatformTenantAdminResponse(
                        rs.getLong("id"),
                        companyId,
                        branchId,
                        rs.getString("name"),
                        rs.getString("email"),
                        rs.getString("status"),
                        TENANT_ADMIN_ROLE
                ),
                userId
        );
    }

    private void assertActiveCompany(Long companyId) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM companies
                WHERE id = ?
                  AND status = 'ACTIVE'
                  AND code <> 'APPMODA_PLATFORM'
                """,
                Integer.class,
                companyId
        );

        if (count == null || count == 0) {
            throw new IllegalArgumentException("Empresa cliente activa no encontrada");
        }
    }

    private Long findPrimaryBranchId(Long companyId) {
        List<Long> ids = jdbcTemplate.query(
                """
                SELECT id
                FROM branches
                WHERE company_id = ?
                  AND status = 'ACTIVE'
                ORDER BY id
                LIMIT 1
                """,
                (rs, rowNum) -> rs.getLong("id"),
                companyId
        );

        if (ids.isEmpty()) {
            throw new IllegalArgumentException("La empresa no tiene sucursal principal activa");
        }

        return ids.get(0);
    }

    private Long findRoleId(String roleCode) {
        return jdbcTemplate.query(
                "SELECT id FROM roles WHERE code = ?",
                rs -> {
                    if (!rs.next()) {
                        throw new IllegalStateException("Rol requerido no existe: " + roleCode);
                    }
                    return rs.getLong("id");
                },
                roleCode
        );
    }

    private void assertEmailAvailable(String email) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE email = ?",
                Integer.class,
                email
        );

        if (count != null && count > 0) {
            throw new IllegalArgumentException("Ya existe un usuario con ese email");
        }
    }

    private String nextCompanyCode(String name) {
        return nextCode(name, 50, candidate -> exists("companies", "code", candidate));
    }

    private String nextBranchCode(Long companyId, String name) {
        String base = normalizeCode(name, 32);
        String candidate = base;
        int counter = 2;

        while (branchCodeExists(companyId, candidate)) {
            String suffix = "_" + counter++;
            candidate = trimForSuffix(base, suffix, 32) + suffix;
        }

        return candidate;
    }

    private String nextCode(String seed, int maxLength, CodeExists exists) {
        String base = normalizeCode(seed, maxLength);
        String candidate = base;
        int counter = 2;

        while (exists.test(candidate)) {
            String suffix = "_" + counter++;
            candidate = trimForSuffix(base, suffix, maxLength) + suffix;
        }

        return candidate;
    }

    private boolean exists(String table, String column, String value) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM " + table + " WHERE " + column + " = ?",
                Integer.class,
                value
        );

        return count != null && count > 0;
    }

    private boolean branchCodeExists(Long companyId, String code) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM branches
                WHERE company_id = ?
                  AND code = ?
                """,
                Integer.class,
                companyId,
                code
        );

        return count != null && count > 0;
    }

    private String normalizeCode(String value, int maxLength) {
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9]+", "_")
                .replaceAll("^_+|_+$", "");

        if (normalized.isBlank()) {
            normalized = "CLIENTE";
        }

        return normalized.length() > maxLength
                ? normalized.substring(0, maxLength).replaceAll("_+$", "")
                : normalized;
    }

    private String trimForSuffix(String base, String suffix, int maxLength) {
        int allowed = Math.max(1, maxLength - suffix.length());
        String trimmed = base.length() > allowed ? base.substring(0, allowed) : base;
        return trimmed.replaceAll("_+$", "");
    }

    private String cleanRequired(String value, String field) {
        if (value == null || value.trim().isBlank()) {
            throw new IllegalArgumentException(field + " es obligatorio");
        }

        return value.trim();
    }

    @FunctionalInterface
    private interface CodeExists {
        boolean test(String value);
    }
}
