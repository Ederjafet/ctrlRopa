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
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

@Service
@Transactional
public class PlatformService {

    private static final String PLATFORM_COMPANY_CODE = "APPMODA_PLATFORM";
    private static final String TENANT_ADMIN_ROLE = "ADMIN";
    private static final List<ModuleDefinition> MODULE_DEFINITIONS = List.of(
            new ModuleDefinition("INVENTORY", "Inventario"),
            new ModuleDefinition("DOOR_SALES", "Venta puerta"),
            new ModuleDefinition("RESERVATIONS", "Apartados"),
            new ModuleDefinition("CUSTOMER_PACKAGES", "Paquetes"),
            new ModuleDefinition("SHIPMENTS", "Envios"),
            new ModuleDefinition("PAYMENTS", "Pagos"),
            new ModuleDefinition("LIVE", "LIVE"),
            new ModuleDefinition("REPORTS", "Reportes"),
            new ModuleDefinition("MULTI_BRANCH", "Multi sucursal"),
            new ModuleDefinition("CASH_CLOSURES", "Cortes de caja"),
            new ModuleDefinition("CONSIGNMENTS", "Consignacion"),
            new ModuleDefinition("RETURNS_REFUNDS", "Devoluciones y refunds")
    );

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
        assertCanViewPlatform();

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

    @Transactional(readOnly = true)
    public PlatformCompanyDetailResponse findCompanyDetail(Long companyId) {
        assertCanViewPlatform();
        assertCompanyExists(companyId);
        return findCompanyDetailById(companyId);
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
        ensureDefaultCompanySettings(companyId);

        return findCompany(companyId);
    }

    public PlatformCompanyDetailResponse updateCompany(Long companyId, UpdatePlatformCompanyRequest request) {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.MANAGE_COMPANIES);
        assertCustomerCompany(companyId);

        StringBuilder sql = new StringBuilder("UPDATE companies SET ");
        new UpdateBuilder(sql)
                .add("name", cleanNullable(request.getName()))
                .add("status", normalizeCompanyStatus(request.getStatus()))
                .execute((statement, values) -> jdbcTemplate.update(statement + " WHERE id = ?", append(values, companyId)));

        return findCompanyDetailById(companyId);
    }

    @Transactional(readOnly = true)
    public PlatformCompanySettingsResponse findCompanySettings(Long companyId) {
        assertCanViewPlatform();
        assertCompanyExists(companyId);
        return findCompanySettingsById(companyId);
    }

    public PlatformCompanySettingsResponse updateCompanySettings(
            Long companyId,
            UpdatePlatformCompanySettingsRequest request
    ) {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.MANAGE_COMPANIES);
        assertCustomerCompany(companyId);
        ensureDefaultCompanySettings(companyId);

        if (request.getModules() != null) {
            request.getModules().forEach(module -> {
                String code = normalizeModuleCode(module.getCode());
                Boolean enabled = module.getEnabled();
                if (enabled == null) {
                    return;
                }

                jdbcTemplate.update(
                        """
                        INSERT INTO company_modules (company_id, module_code, enabled)
                        VALUES (?, ?, ?)
                        ON DUPLICATE KEY UPDATE
                          enabled = VALUES(enabled),
                          updated_at = CURRENT_TIMESTAMP
                        """,
                        companyId,
                        code,
                        Boolean.TRUE.equals(enabled) ? 1 : 0
                );
            });
        }

        Integer maxUsers = validateLimit(request.getMaxUsers(), "maxUsers");
        Integer maxBranches = validateLimit(request.getMaxBranches(), "maxBranches");

        jdbcTemplate.update(
                """
                INSERT INTO company_limits (company_id, max_users, max_branches)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE
                  max_users = VALUES(max_users),
                  max_branches = VALUES(max_branches),
                  updated_at = CURRENT_TIMESTAMP
                """,
                companyId,
                maxUsers,
                maxBranches
        );

        return findCompanySettingsById(companyId);
    }

    @Transactional(readOnly = true)
    public List<PlatformBranchResponse> findBranches(Long companyId) {
        assertCanViewPlatform();
        assertCompanyExists(companyId);

        return jdbcTemplate.query(
                """
                SELECT id, company_id, code, name, status
                FROM branches
                WHERE company_id = ?
                ORDER BY status, name
                """,
                (rs, rowNum) -> new PlatformBranchResponse(
                        rs.getLong("id"),
                        rs.getLong("company_id"),
                        rs.getString("code"),
                        rs.getString("name"),
                        rs.getString("status")
                ),
                companyId
        );
    }

    public PlatformBranchResponse createBranch(Long companyId, CreatePlatformBranchRequest request) {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.MANAGE_COMPANIES);
        assertCustomerCompany(companyId);
        assertBranchLimitAllows(companyId);

        String name = cleanRequired(request.getName(), "name");
        String code = cleanNullable(request.getCode()) == null
                ? nextBranchCode(companyId, name)
                : normalizeCode(request.getCode(), 32);

        assertBranchCodeAvailable(companyId, code, null);

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
            ps.setString(2, code);
            ps.setString(3, name);
            return ps;
        }, branchKey);

        Long branchId = branchKey.getKey().longValue();
        enableDefaultSalesChannels(branchId, currentUser.getUserId());

        return findBranch(companyId, branchId);
    }

    public PlatformBranchResponse updateBranch(Long companyId, Long branchId, UpdatePlatformBranchRequest request) {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.MANAGE_COMPANIES);
        assertCustomerCompany(companyId);
        assertBranchBelongsToCompany(branchId, companyId);

        String code = cleanNullable(request.getCode()) == null ? null : normalizeCode(request.getCode(), 32);
        assertBranchCodeAvailable(companyId, code, branchId);

        StringBuilder sql = new StringBuilder("UPDATE branches SET ");
        new UpdateBuilder(sql)
                .add("code", code)
                .add("name", cleanNullable(request.getName()))
                .add("status", normalizeActiveStatus(request.getStatus()))
                .execute((statement, values) -> jdbcTemplate.update(statement + " WHERE id = ? AND company_id = ?", append(values, branchId, companyId)));

        return findBranch(companyId, branchId);
    }

    @Transactional(readOnly = true)
    public List<PlatformCompanyUserResponse> findUsers(Long companyId) {
        assertCanViewPlatform();
        assertCompanyExists(companyId);

        return jdbcTemplate.query(
                """
                SELECT
                  u.id,
                  b.company_id,
                  u.branch_id,
                  b.code AS branch_code,
                  b.name AS branch_name,
                  u.name,
                  u.email,
                  u.phone,
                  u.status,
                  GROUP_CONCAT(r.code ORDER BY r.code SEPARATOR ',') AS role_codes
                FROM users u
                JOIN branches b ON b.id = u.branch_id
                LEFT JOIN user_roles ur ON ur.user_id = u.id
                LEFT JOIN roles r ON r.id = ur.role_id
                WHERE b.company_id = ?
                GROUP BY u.id, b.company_id, u.branch_id, b.code, b.name, u.name, u.email, u.phone, u.status
                ORDER BY u.created_at DESC, u.name
                """,
                (rs, rowNum) -> new PlatformCompanyUserResponse(
                        rs.getLong("id"),
                        rs.getLong("company_id"),
                        rs.getLong("branch_id"),
                        rs.getString("branch_code"),
                        rs.getString("branch_name"),
                        rs.getString("name"),
                        rs.getString("email"),
                        rs.getString("phone"),
                        rs.getString("status"),
                        splitRoles(rs.getString("role_codes"))
                ),
                companyId
        );
    }

    public PlatformCompanyUserResponse createCompanyUser(Long companyId, CreatePlatformCompanyUserRequest request) {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.MANAGE_TENANT_ADMINS);
        assertCustomerCompany(companyId);

        Long branchId = request.getBranchId() == null ? findPrimaryBranchId(companyId) : request.getBranchId();
        String roleCode = normalizeAllowedTenantRole(request.getRole());
        Long userId = createTenantUser(
                companyId,
                branchId,
                cleanRequired(request.getName(), "name"),
                cleanRequired(request.getEmail(), "email").toLowerCase(Locale.ROOT),
                cleanNullable(request.getPhone()),
                cleanRequired(request.getPassword(), "password"),
                roleCode
        );

        return findUser(companyId, userId);
    }

    public PlatformCompanyUserResponse updateCompanyUser(Long companyId, Long userId, UpdatePlatformCompanyUserRequest request) {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.MANAGE_TENANT_ADMINS);
        assertCustomerCompany(companyId);
        assertUserBelongsToCompany(userId, companyId);

        Long branchId = request.getBranchId();
        if (branchId != null) {
            assertBranchBelongsToCompany(branchId, companyId);
        }

        StringBuilder sql = new StringBuilder("UPDATE users SET ");
        new UpdateBuilder(sql)
                .add("branch_id", branchId)
                .add("name", cleanNullable(request.getName()))
                .add("phone", cleanNullable(request.getPhone()))
                .add("status", normalizeActiveStatus(request.getStatus()))
                .execute((statement, values) -> jdbcTemplate.update(statement + " WHERE id = ?", append(values, userId)));

        if (branchId != null) {
            replaceUserBranches(userId, branchId);
            ensureUserCompany(userId, companyId);
        }

        if (cleanNullable(request.getRole()) != null) {
            replaceUserRole(userId, normalizeAllowedTenantRole(request.getRole()));
        }

        return findUser(companyId, userId);
    }

    public PlatformTenantAdminResponse createTenantAdmin(Long companyId, CreateTenantAdminRequest request) {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.MANAGE_TENANT_ADMINS);
        assertCustomerCompany(companyId);

        Long branchId = request.getBranchId() == null ? findPrimaryBranchId(companyId) : request.getBranchId();
        Long userId = createTenantUser(
                companyId,
                branchId,
                cleanRequired(request.getName(), "name"),
                cleanRequired(request.getEmail(), "email").toLowerCase(Locale.ROOT),
                null,
                cleanRequired(request.getPassword(), "password"),
                TENANT_ADMIN_ROLE
        );

        PlatformCompanyUserResponse created = findUser(companyId, userId);
        return new PlatformTenantAdminResponse(
                created.id(),
                companyId,
                created.branchId(),
                created.name(),
                created.email(),
                created.status(),
                TENANT_ADMIN_ROLE
        );
    }

    private Long createTenantUser(Long companyId,
                                  Long branchId,
                                  String name,
                                  String email,
                                  String phone,
                                  String password,
                                  String roleCode) {
        assertBranchBelongsToCompany(branchId, companyId);
        assertUserLimitAllows(companyId);
        assertEmailAvailable(email);

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
                    ) VALUES (?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP, 'ACTIVE')
                    """,
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setLong(1, branchId);
            ps.setString(2, name);
            ps.setString(3, email);
            ps.setString(4, phone);
            ps.setString(5, passwordHash);
            return ps;
        }, userKey);

        Long userId = userKey.getKey().longValue();
        replaceUserRole(userId, roleCode);
        ensureUserCompany(userId, companyId);
        replaceUserBranches(userId, branchId);
        savePasswordHistory(userId, passwordHash);

        return userId;
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

    private PlatformCompanyDetailResponse findCompanyDetailById(Long companyId) {
        return jdbcTemplate.queryForObject(
                """
                SELECT
                  c.id,
                  c.code,
                  c.name,
                  c.status,
                  (SELECT COUNT(*) FROM branches b WHERE b.company_id = c.id) AS branch_count,
                  (
                    SELECT COUNT(*)
                    FROM users u
                    JOIN branches b ON b.id = u.branch_id
                    WHERE b.company_id = c.id
                  ) AS user_count,
                  (
                    SELECT COUNT(*)
                    FROM users u
                    JOIN branches b ON b.id = u.branch_id
                    WHERE b.company_id = c.id
                      AND u.status = 'ACTIVE'
                  ) AS active_user_count
                FROM companies c
                WHERE c.id = ?
                """,
                (rs, rowNum) -> new PlatformCompanyDetailResponse(
                        rs.getLong("id"),
                        rs.getString("code"),
                        rs.getString("name"),
                        rs.getString("status"),
                        rs.getLong("branch_count"),
                        rs.getLong("user_count"),
                        rs.getLong("active_user_count")
                ),
                companyId
        );
    }

    private PlatformBranchResponse findBranch(Long companyId, Long branchId) {
        return jdbcTemplate.queryForObject(
                """
                SELECT id, company_id, code, name, status
                FROM branches
                WHERE id = ?
                  AND company_id = ?
                """,
                (rs, rowNum) -> new PlatformBranchResponse(
                        rs.getLong("id"),
                        rs.getLong("company_id"),
                        rs.getString("code"),
                        rs.getString("name"),
                        rs.getString("status")
                ),
                branchId,
                companyId
        );
    }

    private PlatformCompanyUserResponse findUser(Long companyId, Long userId) {
        return jdbcTemplate.queryForObject(
                """
                SELECT
                  u.id,
                  b.company_id,
                  u.branch_id,
                  b.code AS branch_code,
                  b.name AS branch_name,
                  u.name,
                  u.email,
                  u.phone,
                  u.status,
                  GROUP_CONCAT(r.code ORDER BY r.code SEPARATOR ',') AS role_codes
                FROM users u
                JOIN branches b ON b.id = u.branch_id
                LEFT JOIN user_roles ur ON ur.user_id = u.id
                LEFT JOIN roles r ON r.id = ur.role_id
                WHERE u.id = ?
                  AND b.company_id = ?
                GROUP BY u.id, b.company_id, u.branch_id, b.code, b.name, u.name, u.email, u.phone, u.status
                """,
                (rs, rowNum) -> new PlatformCompanyUserResponse(
                        rs.getLong("id"),
                        rs.getLong("company_id"),
                        rs.getLong("branch_id"),
                        rs.getString("branch_code"),
                        rs.getString("branch_name"),
                        rs.getString("name"),
                        rs.getString("email"),
                        rs.getString("phone"),
                        rs.getString("status"),
                        splitRoles(rs.getString("role_codes"))
                ),
                userId,
                companyId
        );
    }

    private PlatformCompanySettingsResponse findCompanySettingsById(Long companyId) {
        List<ModuleRow> rows = jdbcTemplate.query(
                """
                SELECT module_code, enabled
                FROM company_modules
                WHERE company_id = ?
                """,
                (rs, rowNum) -> new ModuleRow(
                        rs.getString("module_code"),
                        rs.getBoolean("enabled")
                ),
                companyId
        );

        List<PlatformCompanySettingsResponse.ModuleSetting> modules = MODULE_DEFINITIONS.stream()
                .map(definition -> new PlatformCompanySettingsResponse.ModuleSetting(
                        definition.code(),
                        definition.name(),
                        rows.stream()
                                .filter(row -> row.code().equals(definition.code()))
                                .findFirst()
                                .map(ModuleRow::enabled)
                                .orElse(Boolean.TRUE)
                ))
                .toList();

        PlatformCompanySettingsResponse.LimitSettings limits = findCompanyLimits(companyId);

        return new PlatformCompanySettingsResponse(modules, limits);
    }

    private PlatformCompanySettingsResponse.LimitSettings findCompanyLimits(Long companyId) {
        List<PlatformCompanySettingsResponse.LimitSettings> rows = jdbcTemplate.query(
                """
                SELECT max_users, max_branches
                FROM company_limits
                WHERE company_id = ?
                """,
                (rs, rowNum) -> new PlatformCompanySettingsResponse.LimitSettings(
                        rs.getObject("max_users", Integer.class),
                        rs.getObject("max_branches", Integer.class)
                ),
                companyId
        );

        return rows.isEmpty()
                ? new PlatformCompanySettingsResponse.LimitSettings(null, null)
                : rows.get(0);
    }

    private void ensureDefaultCompanySettings(Long companyId) {
        MODULE_DEFINITIONS.forEach(module -> jdbcTemplate.update(
                """
                INSERT IGNORE INTO company_modules (company_id, module_code, enabled)
                VALUES (?, ?, 1)
                """,
                companyId,
                module.code()
        ));

        jdbcTemplate.update(
                """
                INSERT IGNORE INTO company_limits (company_id, max_users, max_branches)
                VALUES (?, NULL, NULL)
                """,
                companyId
        );
    }

    private void assertBranchLimitAllows(Long companyId) {
        Integer maxBranches = findCompanyLimits(companyId).maxBranches();
        if (maxBranches == null) {
            return;
        }

        Integer activeBranches = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM branches
                WHERE company_id = ?
                  AND status = 'ACTIVE'
                """,
                Integer.class,
                companyId
        );

        if (activeBranches != null && activeBranches >= maxBranches) {
            throw new IllegalArgumentException("Este cliente llego al limite de sucursales permitido");
        }
    }

    private void assertUserLimitAllows(Long companyId) {
        Integer maxUsers = findCompanyLimits(companyId).maxUsers();
        if (maxUsers == null) {
            return;
        }

        Integer activeUsers = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM users u
                JOIN branches b ON b.id = u.branch_id
                WHERE b.company_id = ?
                  AND u.status = 'ACTIVE'
                """,
                Integer.class,
                companyId
        );

        if (activeUsers != null && activeUsers >= maxUsers) {
            throw new IllegalArgumentException("Este cliente llego al limite de usuarios permitido");
        }
    }

    private void assertCanViewPlatform() {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.VIEW_PLATFORM);
    }

    private void assertCompanyExists(Long companyId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM companies WHERE id = ?",
                Integer.class,
                companyId
        );

        if (count == null || count == 0) {
            throw new IllegalArgumentException("Empresa no encontrada");
        }
    }

    private void assertCustomerCompany(Long companyId) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM companies
                WHERE id = ?
                  AND status = 'ACTIVE'
                  AND code <> ?
                """,
                Integer.class,
                companyId,
                PLATFORM_COMPANY_CODE
        );

        if (count == null || count == 0) {
            throw new IllegalArgumentException("Empresa cliente activa no encontrada");
        }
    }

    private void assertBranchBelongsToCompany(Long branchId, Long companyId) {
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
            throw new IllegalArgumentException("Sucursal activa no pertenece a la empresa seleccionada");
        }
    }

    private void assertUserBelongsToCompany(Long userId, Long companyId) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM users u
                JOIN branches b ON b.id = u.branch_id
                WHERE u.id = ?
                  AND b.company_id = ?
                """,
                Integer.class,
                userId,
                companyId
        );

        if (count == null || count == 0) {
            throw new IllegalArgumentException("Usuario no pertenece a la empresa seleccionada");
        }
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

    private void assertBranchCodeAvailable(Long companyId, String code, Long currentBranchId) {
        if (code == null) {
            return;
        }

        Integer count = currentBranchId == null
                ? jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM branches WHERE company_id = ? AND code = ?",
                        Integer.class,
                        companyId,
                        code
                )
                : jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM branches WHERE company_id = ? AND code = ? AND id <> ?",
                        Integer.class,
                        companyId,
                        code,
                        currentBranchId
                );

        if (count != null && count > 0) {
            throw new IllegalArgumentException("Ya existe una sucursal con ese codigo en la empresa");
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

    private void replaceUserRole(Long userId, String roleCode) {
        Long roleId = findRoleId(roleCode);
        jdbcTemplate.update("DELETE FROM user_roles WHERE user_id = ?", userId);
        jdbcTemplate.update(
                "INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)",
                userId,
                roleId
        );
    }

    private void ensureUserCompany(Long userId, Long companyId) {
        jdbcTemplate.update(
                "UPDATE user_companies SET is_primary = 0 WHERE user_id = ?",
                userId
        );
        jdbcTemplate.update(
                """
                INSERT INTO user_companies (user_id, company_id, is_primary, status)
                VALUES (?, ?, 1, 'ACTIVE')
                ON DUPLICATE KEY UPDATE
                  is_primary = VALUES(is_primary),
                  status = VALUES(status)
                """,
                userId,
                companyId
        );
    }

    private void replaceUserBranches(Long userId, Long branchId) {
        jdbcTemplate.update("DELETE FROM user_branches WHERE user_id = ?", userId);
        jdbcTemplate.update(
                """
                INSERT INTO user_branches (user_id, branch_id, is_primary)
                VALUES (?, ?, 1)
                """,
                userId,
                branchId
        );
    }

    private void savePasswordHistory(Long userId, String passwordHash) {
        jdbcTemplate.update(
                "INSERT INTO user_password_history (user_id, password_hash) VALUES (?, ?)",
                userId,
                passwordHash
        );
    }

    private String normalizeAllowedTenantRole(String role) {
        String normalized = cleanRequired(role, "role")
                .toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9_]", "_");

        return switch (normalized) {
            case "ADMIN", "TENANT_ADMIN", "ADMINISTRADOR" -> "ADMIN";
            case "SUPERVISOR" -> "SUPERVISOR";
            case "SELLER", "VENDEDOR" -> "SELLER";
            case "CASHIER", "CAJERO" -> "CASHIER";
            default -> throw new IllegalArgumentException("Rol tenant no permitido: " + role);
        };
    }

    private String normalizeModuleCode(String code) {
        String normalized = cleanRequired(code, "moduleCode")
                .toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9_]", "_");

        boolean known = MODULE_DEFINITIONS.stream()
                .anyMatch(module -> module.code().equals(normalized));
        if (!known) {
            throw new IllegalArgumentException("Modulo no reconocido: " + code);
        }

        return normalized;
    }

    private Integer validateLimit(Integer value, String field) {
        if (value == null) {
            return null;
        }

        if (value < 1) {
            throw new IllegalArgumentException(field + " debe ser mayor a cero o quedar vacio");
        }

        return value;
    }

    private String normalizeActiveStatus(String status) {
        String cleaned = cleanNullable(status);
        if (cleaned == null) {
            return null;
        }

        String normalized = cleaned.toUpperCase(Locale.ROOT);
        if (!"ACTIVE".equals(normalized) && !"INACTIVE".equals(normalized)) {
            throw new IllegalArgumentException("status debe ser ACTIVE o INACTIVE");
        }
        return normalized;
    }

    private String normalizeCompanyStatus(String status) {
        String cleaned = cleanNullable(status);
        if (cleaned == null) {
            return null;
        }

        String normalized = cleaned.toUpperCase(Locale.ROOT);
        if (!"ACTIVE".equals(normalized) && !"INACTIVE".equals(normalized) && !"SUSPENDED".equals(normalized)) {
            throw new IllegalArgumentException("status debe ser ACTIVE, INACTIVE o SUSPENDED");
        }
        return normalized;
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

    private String cleanNullable(String value) {
        if (value == null) {
            return null;
        }

        String cleaned = value.trim();
        return cleaned.isBlank() ? null : cleaned;
    }

    private List<String> splitRoles(String roles) {
        if (roles == null || roles.isBlank()) {
            return List.of();
        }

        return Arrays.stream(roles.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .toList();
    }

    private Object[] append(List<Object> values, Object... suffix) {
        Object[] params = new Object[values.size() + suffix.length];
        for (int i = 0; i < values.size(); i++) {
            params[i] = values.get(i);
        }
        System.arraycopy(suffix, 0, params, values.size(), suffix.length);
        return params;
    }

    @FunctionalInterface
    private interface CodeExists {
        boolean test(String value);
    }

    private record ModuleDefinition(
            String code,
            String name
    ) {
    }

    private record ModuleRow(
            String code,
            Boolean enabled
    ) {
    }

    @FunctionalInterface
    private interface UpdateExecutor {
        void execute(String statement, List<Object> values);
    }

    private static class UpdateBuilder {
        private final StringBuilder sql;
        private final List<Object> values = new java.util.ArrayList<>();
        private boolean hasField = false;

        UpdateBuilder(StringBuilder sql) {
            this.sql = sql;
        }

        UpdateBuilder add(String column, Object value) {
            if (value == null) {
                return this;
            }

            if (hasField) {
                sql.append(", ");
            }

            sql.append(column).append(" = ?");
            values.add(value);
            hasField = true;
            return this;
        }

        void execute(UpdateExecutor executor) {
            if (!hasField) {
                return;
            }

            executor.execute(sql.toString(), values);
        }
    }
}
