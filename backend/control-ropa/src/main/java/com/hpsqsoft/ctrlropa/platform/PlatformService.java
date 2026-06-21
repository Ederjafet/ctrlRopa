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

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Types;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Transactional
public class PlatformService {

    private static final String PLATFORM_COMPANY_CODE = "APPMODA_PLATFORM";
    private static final String TENANT_ADMIN_ROLE = "ADMIN";
    private static final Pattern PLATFORM_COMPANY_ID_PATTERN =
            Pattern.compile("^/api/platform/companies/(\\d+)(?:/.*)?$");
    private static final Pattern PLATFORM_PLAN_ID_PATTERN =
            Pattern.compile("^/api/platform/subscription-plans/(\\d+)(?:/.*)?$");
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
            new ModuleDefinition("RETURNS_REFUNDS", "Devoluciones y refunds"),
            new ModuleDefinition("APPEARANCE_CUSTOMIZATION", "Personalizacion UI / Branding")
    );
    private static final List<String> BILLING_PERIODS = List.of(
            "MONTHLY",
            "QUARTERLY",
            "SEMIANNUAL",
            "ANNUAL"
    );
    private static final List<String> BILLING_MODELS = List.of(
            "SUBSCRIPTION",
            "USAGE_BASED",
            "HYBRID",
            "PERPETUAL"
    );
    private static final List<String> SUBSCRIPTION_STATUSES = List.of(
            "TRIAL",
            "ACTIVE",
            "PAST_DUE",
            "SUSPENDED",
            "CANCELLED"
    );
    private static final List<String> LICENSE_TYPES = List.of(
            "PERPETUAL"
    );
    private static final List<String> LICENSE_STATUSES = List.of(
            "ACTIVE",
            "SUSPENDED",
            "CANCELLED"
    );
    private static final List<String> DEPLOYMENT_TYPES = List.of(
            "APPMODA_HOSTED",
            "CLIENT_HOSTED",
            "HYBRID",
            "OTHER"
    );
    private static final List<String> SERVICE_TYPES = List.of(
            "HOSTING_INFRASTRUCTURE",
            "SUPPORT_MAINTENANCE",
            "BACKUP_MONITORING",
            "OTHER"
    );
    private static final List<String> SERVICE_STATUSES = List.of(
            "ACTIVE",
            "NOT_APPLICABLE",
            "PAST_DUE",
            "SUSPENDED",
            "CANCELLED"
    );
    private static final List<UsageDefinition> USAGE_DEFINITIONS = List.of(
            new UsageDefinition("ACTIVE_USER", "Usuario activo"),
            new UsageDefinition("ACTIVE_BRANCH", "Sucursal activa"),
            new UsageDefinition("LIVE_SESSION", "LIVE realizado"),
            new UsageDefinition("PACKAGE_CREATED", "Paquete creado"),
            new UsageDefinition("SHIPMENT_CREATED", "Envio generado"),
            new UsageDefinition("SALE_CREATED", "Venta registrada"),
            new UsageDefinition("ITEM_CREATED", "Prenda registrada"),
            new UsageDefinition("PAYMENT_REGISTERED", "Pago registrado"),
            new UsageDefinition("RESERVATION_CREATED", "Apartado creado")
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
        if (request.getModules() != null) {
            accessService.assertCan(currentUser.getUserId(), PermissionCode.MANAGE_COMPANY_MODULES);
        }

        Integer maxUsers = validateLimit(request.getMaxUsers(), "maxUsers");
        Integer maxBranches = validateLimit(request.getMaxBranches(), "maxBranches");
        Integer maxItems = validateLimit(request.getMaxItems(), "maxItems");
        Integer maxLiveSessions = validateLimit(request.getMaxLiveSessionsPerMonth(), "maxLiveSessionsPerMonth");
        Integer maxShipments = validateLimit(request.getMaxShipmentsPerMonth(), "maxShipmentsPerMonth");
        Integer maxPackages = validateLimit(request.getMaxPackagesPerMonth(), "maxPackagesPerMonth");

        if (request.getMaxUsers() != null ||
                request.getMaxBranches() != null ||
                request.getMaxItems() != null ||
                request.getMaxLiveSessionsPerMonth() != null ||
                request.getMaxShipmentsPerMonth() != null ||
                request.getMaxPackagesPerMonth() != null) {
            accessService.assertCan(currentUser.getUserId(), PermissionCode.MANAGE_COMPANY_LIMITS);
        }

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

        jdbcTemplate.update(
                """
                INSERT INTO company_limits (
                  company_id, max_users, max_branches, max_items,
                  max_live_sessions_per_month, max_shipments_per_month, max_packages_per_month
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                  max_users = VALUES(max_users),
                  max_branches = VALUES(max_branches),
                  max_items = VALUES(max_items),
                  max_live_sessions_per_month = VALUES(max_live_sessions_per_month),
                  max_shipments_per_month = VALUES(max_shipments_per_month),
                  max_packages_per_month = VALUES(max_packages_per_month),
                  updated_at = CURRENT_TIMESTAMP
                """,
                companyId,
                maxUsers,
                maxBranches,
                maxItems,
                maxLiveSessions,
                maxShipments,
                maxPackages
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

    @Transactional(readOnly = true)
    public List<PlatformSubscriptionPlanResponse> findSubscriptionPlans() {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.VIEW_PLATFORM_BILLING);

        return jdbcTemplate.query(
                """
                SELECT id, code, name, description, status, included_max_users, included_max_branches,
                       includes_live, includes_reports, includes_shipments, includes_packages
                FROM subscription_plans
                ORDER BY status, name
                """,
                (rs, rowNum) -> mapSubscriptionPlan(rs.getLong("id"),
                        rs.getString("code"),
                        rs.getString("name"),
                        rs.getString("description"),
                        rs.getString("status"),
                        rs.getObject("included_max_users", Integer.class),
                        rs.getObject("included_max_branches", Integer.class),
                        rs.getBoolean("includes_live"),
                        rs.getBoolean("includes_reports"),
                        rs.getBoolean("includes_shipments"),
                        rs.getBoolean("includes_packages"))
        );
    }

    public PlatformSubscriptionPlanResponse createSubscriptionPlan(CreatePlatformSubscriptionPlanRequest request) {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.MANAGE_SUBSCRIPTION_PLANS);

        String code = normalizeCode(cleanRequired(request.getCode(), "code"), 64);
        String name = cleanRequired(request.getName(), "name");
        String status = normalizePlanStatus(request.getStatus() == null ? "ACTIVE" : request.getStatus());

        KeyHolder planKey = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    """
                    INSERT INTO subscription_plans (
                      code, name, description, status, included_max_users, included_max_branches,
                      includes_live, includes_reports, includes_shipments, includes_packages
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setString(1, code);
            ps.setString(2, name);
            ps.setString(3, cleanNullable(request.getDescription()));
            ps.setString(4, status);
            setNullableInteger(ps, 5, request.getIncludedMaxUsers());
            setNullableInteger(ps, 6, request.getIncludedMaxBranches());
            ps.setInt(7, Boolean.TRUE.equals(request.getIncludesLive()) ? 1 : 0);
            ps.setInt(8, Boolean.TRUE.equals(request.getIncludesReports()) ? 1 : 0);
            ps.setInt(9, Boolean.TRUE.equals(request.getIncludesShipments()) ? 1 : 0);
            ps.setInt(10, Boolean.TRUE.equals(request.getIncludesPackages()) ? 1 : 0);
            return ps;
        }, planKey);

        return findSubscriptionPlan(planKey.getKey().longValue());
    }

    public PlatformSubscriptionPlanResponse updateSubscriptionPlan(
            Long planId,
            CreatePlatformSubscriptionPlanRequest request
    ) {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.MANAGE_SUBSCRIPTION_PLANS);
        assertPlanExists(planId);

        String code = cleanNullable(request.getCode()) == null ? null : normalizeCode(request.getCode(), 64);
        StringBuilder sql = new StringBuilder("UPDATE subscription_plans SET ");
        new UpdateBuilder(sql)
                .add("code", code)
                .add("name", cleanNullable(request.getName()))
                .add("description", cleanNullable(request.getDescription()))
                .add("status", request.getStatus() == null ? null : normalizePlanStatus(request.getStatus()))
                .add("included_max_users", request.getIncludedMaxUsers())
                .add("included_max_branches", request.getIncludedMaxBranches())
                .add("includes_live", request.getIncludesLive() == null ? null : (Boolean.TRUE.equals(request.getIncludesLive()) ? 1 : 0))
                .add("includes_reports", request.getIncludesReports() == null ? null : (Boolean.TRUE.equals(request.getIncludesReports()) ? 1 : 0))
                .add("includes_shipments", request.getIncludesShipments() == null ? null : (Boolean.TRUE.equals(request.getIncludesShipments()) ? 1 : 0))
                .add("includes_packages", request.getIncludesPackages() == null ? null : (Boolean.TRUE.equals(request.getIncludesPackages()) ? 1 : 0))
                .execute((statement, values) -> jdbcTemplate.update(statement + " WHERE id = ?", append(values, planId)));

        return findSubscriptionPlan(planId);
    }

    @Transactional(readOnly = true)
    public List<PlatformPlanPriceResponse> findSubscriptionPlanPrices(Long planId) {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.VIEW_PLATFORM_BILLING);
        assertPlanExists(planId);
        return findSubscriptionPlanPricesById(planId);
    }

    public List<PlatformPlanPriceResponse> updateSubscriptionPlanPrices(
            Long planId,
            UpdatePlatformPlanPricesRequest request
    ) {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.MANAGE_SUBSCRIPTION_PLANS);
        assertPlanExists(planId);

        if (request.getPrices() != null) {
            request.getPrices().forEach(price -> {
                String period = normalizeBillingPeriod(price.getBillingPeriod(), true);
                BigDecimal amount = validateMoney(price.getPriceAmount());
                String currency = normalizeCurrency(price.getCurrency());
                String status = normalizePlanStatus(price.getStatus() == null ? "ACTIVE" : price.getStatus());

                jdbcTemplate.update(
                        """
                        INSERT INTO subscription_plan_prices (plan_id, billing_period, price_amount, currency, status)
                        VALUES (?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE
                          price_amount = VALUES(price_amount),
                          currency = VALUES(currency),
                          status = VALUES(status),
                          updated_at = CURRENT_TIMESTAMP
                        """,
                        planId,
                        period,
                        amount,
                        currency,
                        status
                );
            });
        }

        return findSubscriptionPlanPricesById(planId);
    }

    @Transactional(readOnly = true)
    public PlatformCompanySubscriptionResponse findCompanySubscription(Long companyId) {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.VIEW_PLATFORM_BILLING);
        assertCompanyExists(companyId);
        return findCompanySubscriptionByCompanyId(companyId);
    }

    public PlatformCompanySubscriptionResponse updateCompanySubscription(
            Long companyId,
            UpdatePlatformCompanySubscriptionRequest request
    ) {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.MANAGE_COMPANY_SUBSCRIPTIONS);
        assertCustomerCompany(companyId);

        Long planId = request.getPlanId();
        if (planId != null) {
            assertPlanExists(planId);
        }

        String billingModel = normalizeBillingModel(request.getBillingModel() == null ? "SUBSCRIPTION" : request.getBillingModel());
        String billingPeriod = normalizeBillingPeriod(request.getBillingPeriod(), false);
        String status = normalizeSubscriptionStatus(request.getStatus() == null ? "TRIAL" : request.getStatus());

        jdbcTemplate.update(
                """
                INSERT INTO company_subscriptions (
                  company_id, plan_id, billing_model, billing_period, status,
                  started_at, ends_at, next_billing_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                  plan_id = VALUES(plan_id),
                  billing_model = VALUES(billing_model),
                  billing_period = VALUES(billing_period),
                  status = VALUES(status),
                  started_at = VALUES(started_at),
                  ends_at = VALUES(ends_at),
                  next_billing_at = VALUES(next_billing_at),
                  updated_at = CURRENT_TIMESTAMP
                """,
                companyId,
                planId,
                billingModel,
                billingPeriod,
                status,
                normalizeDateTime(request.getStartedAt()),
                normalizeDateTime(request.getEndsAt()),
                normalizeDateTime(request.getNextBillingAt())
        );

        return findCompanySubscriptionByCompanyId(companyId);
    }

    @Transactional(readOnly = true)
    public PlatformCommercialAgreementResponse findCommercialAgreement(Long companyId) {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.VIEW_PLATFORM_LICENSES);
        accessService.assertCan(currentUser.getUserId(), PermissionCode.VIEW_PLATFORM_SERVICE_AGREEMENTS);
        assertCompanyExists(companyId);
        return findCommercialAgreementByCompanyId(companyId);
    }

    public PlatformCommercialAgreementResponse updateCommercialAgreement(
            Long companyId,
            UpdatePlatformCommercialAgreementRequest request
    ) {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.MANAGE_PLATFORM_LICENSES);
        accessService.assertCan(currentUser.getUserId(), PermissionCode.MANAGE_PLATFORM_SERVICE_AGREEMENTS);
        assertCustomerCompany(companyId);

        UpdatePlatformCommercialAgreementRequest.LicensePayload license =
                request == null ? null : request.getLicense();
        UpdatePlatformCommercialAgreementRequest.ServiceAgreementPayload serviceAgreement =
                request == null ? null : request.getServiceAgreement();

        if (license != null) {
            upsertCommercialLicense(companyId, license);
        }
        if (serviceAgreement != null) {
            upsertServiceAgreement(companyId, serviceAgreement);
        }

        return findCommercialAgreementByCompanyId(companyId);
    }

    @Transactional(readOnly = true)
    public List<PlatformUsageRateResponse> findCompanyUsageRates(Long companyId) {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.VIEW_PLATFORM_BILLING);
        assertCompanyExists(companyId);
        return findCompanyUsageRatesByCompanyId(companyId);
    }

    public List<PlatformUsageRateResponse> updateCompanyUsageRates(
            Long companyId,
            UpdatePlatformUsageRatesRequest request
    ) {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.MANAGE_USAGE_RATES);
        assertCustomerCompany(companyId);

        if (request.getRates() != null) {
            request.getRates().forEach(rate -> {
                String type = normalizeUsageType(rate.getUsageType());
                BigDecimal amount = validateMoney(rate.getUnitPrice());
                jdbcTemplate.update(
                        """
                        INSERT INTO company_usage_rates (company_id, usage_type, unit_price, currency, enabled)
                        VALUES (?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE
                          unit_price = VALUES(unit_price),
                          currency = VALUES(currency),
                          enabled = VALUES(enabled),
                          updated_at = CURRENT_TIMESTAMP
                        """,
                        companyId,
                        type,
                        amount,
                        normalizeCurrency(rate.getCurrency()),
                        Boolean.FALSE.equals(rate.getEnabled()) ? 0 : 1
                );
            });
        }

        return findCompanyUsageRatesByCompanyId(companyId);
    }

    @Transactional(readOnly = true)
    public List<PlatformUsageSummaryResponse> findUsageSummary() {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.VIEW_PLATFORM_USAGE);

        return jdbcTemplate.query(
                """
                SELECT
                  c.id AS company_id,
                  c.name AS company_name,
                  CASE
                    WHEN lic.license_type = 'PERPETUAL' AND lic.status = 'ACTIVE' THEN 'PERPETUAL'
                    ELSE COALESCE(cs.billing_model, 'SIN_CONFIGURAR')
                  END AS billing_model,
                  CASE
                    WHEN lic.license_type = 'PERPETUAL' AND lic.status = 'ACTIVE' THEN 'Licencia perpetua'
                    ELSE sp.name
                  END AS plan_name,
                  CASE
                    WHEN lic.license_type = 'PERPETUAL' AND lic.status = 'ACTIVE' THEN 'ACTIVE'
                    ELSE COALESCE(cs.status, 'SIN_CONFIGURAR')
                  END AS subscription_status,
                  (SELECT COUNT(*) FROM branches b WHERE b.company_id = c.id AND b.status = 'ACTIVE') AS active_branches,
                  (
                    SELECT COUNT(*)
                    FROM users u
                    JOIN branches b ON b.id = u.branch_id
                    WHERE b.company_id = c.id
                      AND u.status = 'ACTIVE'
                  ) AS active_users,
                  (SELECT COUNT(*) FROM company_modules cm WHERE cm.company_id = c.id AND cm.enabled = 1) AS active_modules,
                  CASE WHEN lic.license_type = 'PERPETUAL' AND lic.status = 'ACTIVE' AND lic.unlimited_commercial_use = 1 THEN NULL ELSE cl.max_users END AS max_users,
                  CASE WHEN lic.license_type = 'PERPETUAL' AND lic.status = 'ACTIVE' AND lic.unlimited_commercial_use = 1 THEN NULL ELSE cl.max_branches END AS max_branches,
                  lic.license_type,
                  lic.status AS license_status,
                  lic.unlimited_commercial_use,
                  csa.deployment_type,
                  csa.status AS service_agreement_status,
                  DATE_FORMAT(csa.end_date, '%Y-%m-%d') AS service_agreement_end_date
                FROM companies c
                LEFT JOIN company_subscriptions cs ON cs.company_id = c.id
                LEFT JOIN subscription_plans sp ON sp.id = cs.plan_id
                LEFT JOIN company_limits cl ON cl.company_id = c.id
                LEFT JOIN company_licenses lic ON lic.company_id = c.id
                LEFT JOIN company_service_agreements csa
                  ON csa.company_id = c.id
                 AND csa.service_type = 'HOSTING_INFRASTRUCTURE'
                WHERE c.code <> ?
                ORDER BY c.name
                """,
                (rs, rowNum) -> new PlatformUsageSummaryResponse(
                        rs.getLong("company_id"),
                        rs.getString("company_name"),
                        rs.getString("billing_model"),
                        rs.getString("plan_name"),
                        rs.getString("subscription_status"),
                        rs.getInt("active_branches"),
                        rs.getInt("active_users"),
                        rs.getInt("active_modules"),
                        rs.getObject("max_users", Integer.class),
                        rs.getObject("max_branches", Integer.class),
                        rs.getString("license_type"),
                        rs.getString("license_status"),
                        rs.getObject("unlimited_commercial_use", Boolean.class),
                        rs.getString("deployment_type"),
                        rs.getString("service_agreement_status"),
                        rs.getString("service_agreement_end_date")
                ),
                PLATFORM_COMPANY_CODE
        );
    }

    @Transactional(readOnly = true)
    public PlatformDashboardSummaryResponse findDashboardSummary() {
        assertCanViewPlatform();

        List<DashboardCompanyRow> companies = findDashboardCompanyRows();
        Set<Long> companiesWithUsageToday = findCompaniesWithUsageToday();
        Map<Long, List<String>> modulesByCompany = findEnabledModulesByCompany();

        PlatformDashboardSummaryResponse.Summary summary = buildDashboardSummary(
                companies,
                companiesWithUsageToday.size()
        );
        PlatformDashboardSummaryResponse.TodayActivity todayActivity = findTodayActivity();
        List<PlatformDashboardSummaryResponse.InstallationPending> installationPendings =
                buildInstallationPendings(companies);
        List<PlatformDashboardSummaryResponse.AttentionCompany> attentionCompanies =
                buildAttentionCompanies(companies, modulesByCompany, companiesWithUsageToday);
        List<PlatformDashboardSummaryResponse.OperationalAlert> operationalAlerts =
                buildOperationalAlerts(companies);

        return new PlatformDashboardSummaryResponse(
                summary,
                todayActivity,
                installationPendings,
                attentionCompanies,
                operationalAlerts
        );
    }

    @Transactional(readOnly = true)
    public PlatformAuditEventsResponse findAuditEvents() {
        assertCanViewPlatform();

        List<PlatformAuditLogRow> rows = jdbcTemplate.query(
                """
                SELECT
                  sal.id,
                  sal.event_type,
                  sal.http_method,
                  sal.request_path,
                  sal.query_string,
                  sal.status_code,
                  sal.user_id,
                  sal.user_name,
                  u.email AS actor_email,
                  sal.detail,
                  sal.created_at
                FROM system_movement_audit_log sal
                LEFT JOIN users u ON u.id = sal.user_id
                WHERE sal.request_path LIKE '/api/platform%'
                ORDER BY sal.created_at DESC, sal.id DESC
                LIMIT 100
                """,
                (rs, rowNum) -> new PlatformAuditLogRow(
                        rs.getLong("id"),
                        rs.getString("event_type"),
                        rs.getString("http_method"),
                        rs.getString("request_path"),
                        rs.getString("query_string"),
                        rs.getObject("status_code", Integer.class),
                        rs.getObject("user_id", Long.class),
                        rs.getString("user_name"),
                        rs.getString("actor_email"),
                        rs.getString("detail"),
                        rs.getTimestamp("created_at").toLocalDateTime()
                )
        );

        Map<Long, String> companyNames = findAuditCompanyNames();
        Map<Long, String> planNames = findAuditPlanNames();
        List<PlatformAuditEventsResponse.AuditEvent> events = rows.stream()
                .map(row -> toPlatformAuditEvent(row, companyNames, planNames))
                .sorted(Comparator.comparing(PlatformAuditEventsResponse.AuditEvent::occurredAt).reversed())
                .toList();

        return new PlatformAuditEventsResponse(
                events,
                buildPlatformAuditSummary(events),
                buildPlatformAuditCoverage(events)
        );
    }

    private List<DashboardCompanyRow> findDashboardCompanyRows() {
        return jdbcTemplate.query(
                """
                SELECT
                  c.id AS company_id,
                  c.name AS company_name,
                  c.status,
                  cs.plan_id,
                  CASE
                    WHEN lic.license_type = 'PERPETUAL' AND lic.status = 'ACTIVE' THEN 'Licencia perpetua'
                    ELSE sp.name
                  END AS plan_name,
                  CASE
                    WHEN lic.license_type = 'PERPETUAL' AND lic.status = 'ACTIVE' THEN 'PERPETUAL'
                    ELSE COALESCE(cs.billing_model, 'SIN_CONFIGURAR')
                  END AS billing_model,
                  CASE
                    WHEN lic.license_type = 'PERPETUAL' AND lic.status = 'ACTIVE' THEN 'ACTIVE'
                    ELSE COALESCE(cs.status, 'SIN_CONFIGURAR')
                  END AS subscription_status,
                  (SELECT COUNT(*) FROM branches b WHERE b.company_id = c.id AND b.status = 'ACTIVE') AS active_branches,
                  (
                    SELECT COUNT(*)
                    FROM users u
                    JOIN branches b ON b.id = u.branch_id
                    WHERE b.company_id = c.id
                      AND u.status = 'ACTIVE'
                  ) AS active_users,
                  (
                    SELECT COUNT(*)
                    FROM users u
                    JOIN branches b ON b.id = u.branch_id
                    JOIN user_roles ur ON ur.user_id = u.id
                    JOIN roles r ON r.id = ur.role_id
                    WHERE b.company_id = c.id
                      AND u.status = 'ACTIVE'
                      AND r.code = 'ADMIN'
                  ) AS admin_users,
                  (
                    SELECT COUNT(*)
                    FROM users u
                    JOIN branches b ON b.id = u.branch_id
                    JOIN user_roles ur ON ur.user_id = u.id
                    JOIN roles r ON r.id = ur.role_id
                    WHERE b.company_id = c.id
                      AND u.status = 'ACTIVE'
                      AND r.code IN ('SUPERVISOR', 'SELLER', 'CASHIER')
                  ) AS operational_users,
                  (SELECT COUNT(*) FROM company_modules cm WHERE cm.company_id = c.id AND cm.enabled = 1) AS active_modules,
                  CASE WHEN cl.company_id IS NULL THEN 0 ELSE 1 END AS has_limits,
                  (SELECT COUNT(*) FROM company_modules cm WHERE cm.company_id = c.id AND cm.module_code = 'LIVE' AND cm.enabled = 1) AS live_enabled,
                  CASE WHEN lic.license_type = 'PERPETUAL' AND lic.status = 'ACTIVE' AND lic.unlimited_commercial_use = 1 THEN NULL ELSE cl.max_users END AS max_users,
                  CASE WHEN lic.license_type = 'PERPETUAL' AND lic.status = 'ACTIVE' AND lic.unlimited_commercial_use = 1 THEN NULL ELSE cl.max_branches END AS max_branches,
                  lic.license_type,
                  lic.status AS license_status,
                  lic.unlimited_commercial_use,
                  csa.deployment_type,
                  csa.status AS service_agreement_status,
                  DATE_FORMAT(csa.end_date, '%Y-%m-%d') AS service_agreement_end_date
                FROM companies c
                LEFT JOIN company_subscriptions cs ON cs.company_id = c.id
                LEFT JOIN subscription_plans sp ON sp.id = cs.plan_id
                LEFT JOIN company_limits cl ON cl.company_id = c.id
                LEFT JOIN company_licenses lic ON lic.company_id = c.id
                LEFT JOIN company_service_agreements csa
                  ON csa.company_id = c.id
                 AND csa.service_type = 'HOSTING_INFRASTRUCTURE'
                WHERE c.code <> ?
                ORDER BY
                  CASE c.status WHEN 'ACTIVE' THEN 0 WHEN 'TRIAL' THEN 1 ELSE 2 END,
                  c.name
                """,
                (rs, rowNum) -> new DashboardCompanyRow(
                        rs.getLong("company_id"),
                        rs.getString("company_name"),
                        rs.getString("status"),
                        rs.getObject("plan_id", Long.class),
                        rs.getString("plan_name"),
                        rs.getString("billing_model"),
                        rs.getString("subscription_status"),
                        rs.getInt("active_branches"),
                        rs.getInt("active_users"),
                        rs.getInt("admin_users"),
                        rs.getInt("operational_users"),
                        rs.getInt("active_modules"),
                        rs.getInt("has_limits") == 1,
                        rs.getInt("live_enabled") > 0,
                        rs.getObject("max_users", Integer.class),
                        rs.getObject("max_branches", Integer.class),
                        rs.getString("license_type"),
                        rs.getString("license_status"),
                        rs.getObject("unlimited_commercial_use", Boolean.class),
                        rs.getString("deployment_type"),
                        rs.getString("service_agreement_status"),
                        rs.getString("service_agreement_end_date")
                ),
                PLATFORM_COMPANY_CODE
        );
    }

    private PlatformDashboardSummaryResponse.Summary buildDashboardSummary(
            List<DashboardCompanyRow> companies,
            int companiesWithUsageToday
    ) {
        int activeCompanies = 0;
        int trialCompanies = 0;
        int suspendedCompanies = 0;
        int companiesWithoutPlan = 0;
        int companiesWithActiveSubscription = 0;
        int companiesWithUsageBilling = 0;
        int activeUsers = 0;
        int activeBranches = 0;
        int companiesWithPerpetualLicense = 0;
        int appModaHostedCompanies = 0;
        int clientHostedCompanies = 0;
        int annualServicesPastDue = 0;
        int annualServicesExpiringSoon = 0;

        for (DashboardCompanyRow company : companies) {
            String status = normalizeCode(company.status());
            boolean hasActivePerpetualLicense = hasActivePerpetualLicense(company);
            String deploymentType = normalizeCode(company.deploymentType());
            String serviceStatus = normalizeCode(company.serviceAgreementStatus());
            if ("ACTIVE".equals(status)) {
                activeCompanies++;
            } else if ("TRIAL".equals(status)) {
                trialCompanies++;
            } else {
                suspendedCompanies++;
            }

            if (!hasActivePerpetualLicense &&
                    (company.planId() == null || "SIN_CONFIGURAR".equals(normalizeCode(company.billingModel())))) {
                companiesWithoutPlan++;
            }
            if ("ACTIVE".equals(normalizeCode(company.subscriptionStatus()))) {
                companiesWithActiveSubscription++;
            }
            if ("USAGE_BASED".equals(normalizeCode(company.billingModel()))) {
                companiesWithUsageBilling++;
            }
            if (hasActivePerpetualLicense) {
                companiesWithPerpetualLicense++;
            }
            if ("APPMODA_HOSTED".equals(deploymentType)) {
                appModaHostedCompanies++;
            } else if ("CLIENT_HOSTED".equals(deploymentType)) {
                clientHostedCompanies++;
            }
            if ("PAST_DUE".equals(serviceStatus)) {
                annualServicesPastDue++;
            }
            if (isAnnualServiceExpiringSoon(company.serviceAgreementEndDate())) {
                annualServicesExpiringSoon++;
            }

            activeUsers += company.activeUsers();
            activeBranches += company.activeBranches();
        }

        return new PlatformDashboardSummaryResponse.Summary(
                activeCompanies,
                trialCompanies,
                suspendedCompanies,
                companiesWithoutPlan,
                companiesWithActiveSubscription,
                companiesWithUsageBilling,
                activeUsers,
                activeBranches,
                queryInteger("SELECT COUNT(*) FROM subscription_plans WHERE status = 'ACTIVE'"),
                companiesWithUsageToday,
                companiesWithPerpetualLicense,
                appModaHostedCompanies,
                clientHostedCompanies,
                annualServicesPastDue,
                annualServicesExpiringSoon,
                findOneTimeLicenseAmount(),
                findEstimatedMonthlyRevenue()
        );
    }

    private BigDecimal findOneTimeLicenseAmount() {
        return queryBigDecimal(
                """
                SELECT SUM(COALESCE(lic.purchase_amount, 0))
                FROM company_licenses lic
                JOIN companies c ON c.id = lic.company_id
                WHERE c.code <> ?
                  AND lic.license_type = 'PERPETUAL'
                  AND lic.status = 'ACTIVE'
                """,
                PLATFORM_COMPANY_CODE
        );
    }

    private BigDecimal findEstimatedMonthlyRevenue() {
        return jdbcTemplate.queryForObject(
                """
                SELECT SUM(
                  CASE COALESCE(cs.billing_period, 'MONTHLY')
                    WHEN 'MONTHLY' THEN spp.price_amount
                    WHEN 'QUARTERLY' THEN spp.price_amount / 3
                    WHEN 'SEMIANNUAL' THEN spp.price_amount / 6
                    WHEN 'ANNUAL' THEN spp.price_amount / 12
                    ELSE spp.price_amount
                  END
                )
                FROM company_subscriptions cs
                JOIN companies c ON c.id = cs.company_id
                JOIN subscription_plan_prices spp
                  ON spp.plan_id = cs.plan_id
                 AND spp.billing_period = COALESCE(cs.billing_period, 'MONTHLY')
                 AND spp.status = 'ACTIVE'
                WHERE c.code <> ?
                  AND cs.status = 'ACTIVE'
                """,
                BigDecimal.class,
                PLATFORM_COMPANY_CODE
        );
    }

    private PlatformDashboardSummaryResponse.TodayActivity findTodayActivity() {
        return new PlatformDashboardSummaryResponse.TodayActivity(
                queryInteger(
                        """
                        SELECT COUNT(*)
                        FROM items i
                        JOIN companies c ON c.id = i.company_id
                        WHERE c.code <> ?
                          AND i.created_at >= CURDATE()
                          AND i.created_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
                        """,
                        PLATFORM_COMPANY_CODE
                ),
                queryInteger(
                        """
                        SELECT COUNT(*)
                        FROM reservations r
                        JOIN branches b ON b.id = r.branch_id
                        JOIN companies c ON c.id = b.company_id
                        WHERE c.code <> ?
                          AND r.created_at >= CURDATE()
                          AND r.created_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
                        """,
                        PLATFORM_COMPANY_CODE
                ),
                queryInteger(
                        """
                        SELECT COUNT(*)
                        FROM customer_packages cp
                        JOIN branches b ON b.id = cp.branch_id
                        JOIN companies c ON c.id = b.company_id
                        WHERE c.code <> ?
                          AND cp.created_at >= CURDATE()
                          AND cp.created_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
                        """,
                        PLATFORM_COMPANY_CODE
                ),
                queryInteger(
                        """
                        SELECT COUNT(*)
                        FROM payments p
                        JOIN branches b ON b.id = p.branch_id
                        JOIN companies c ON c.id = b.company_id
                        WHERE c.code <> ?
                          AND p.status = 'ACTIVE'
                          AND p.created_at >= CURDATE()
                          AND p.created_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
                        """,
                        PLATFORM_COMPANY_CODE
                ),
                queryBigDecimal(
                        """
                        SELECT SUM(p.received_amount)
                        FROM payments p
                        JOIN branches b ON b.id = p.branch_id
                        JOIN companies c ON c.id = b.company_id
                        WHERE c.code <> ?
                          AND p.status = 'ACTIVE'
                          AND p.created_at >= CURDATE()
                          AND p.created_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
                        """,
                        PLATFORM_COMPANY_CODE
                ),
                queryInteger(
                        """
                        SELECT COUNT(*)
                        FROM shipments s
                        JOIN branches b ON b.id = s.branch_id
                        JOIN companies c ON c.id = b.company_id
                        WHERE c.code <> ?
                          AND s.created_at >= CURDATE()
                          AND s.created_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
                        """,
                        PLATFORM_COMPANY_CODE
                ),
                queryInteger(
                        """
                        SELECT COUNT(*)
                        FROM lives l
                        JOIN branches b ON b.id = l.branch_id
                        JOIN companies c ON c.id = b.company_id
                        WHERE c.code <> ?
                          AND l.created_at >= CURDATE()
                          AND l.created_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
                        """,
                        PLATFORM_COMPANY_CODE
                ),
                queryInteger(
                        """
                        SELECT COUNT(*)
                        FROM reservations r
                        JOIN branches b ON b.id = r.branch_id
                        JOIN companies c ON c.id = b.company_id
                        WHERE c.code <> ?
                          AND r.live_id IS NOT NULL
                          AND r.created_at >= CURDATE()
                          AND r.created_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
                        """,
                        PLATFORM_COMPANY_CODE
                )
        );
    }

    private Set<Long> findCompaniesWithUsageToday() {
        return jdbcTemplate.query(
                """
                SELECT DISTINCT activity.company_id
                FROM (
                  SELECT i.company_id AS company_id
                  FROM items i
                  WHERE i.created_at >= CURDATE()
                    AND i.created_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
                  UNION
                  SELECT b.company_id
                  FROM reservations r
                  JOIN branches b ON b.id = r.branch_id
                  WHERE r.created_at >= CURDATE()
                    AND r.created_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
                  UNION
                  SELECT b.company_id
                  FROM customer_packages cp
                  JOIN branches b ON b.id = cp.branch_id
                  WHERE cp.created_at >= CURDATE()
                    AND cp.created_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
                  UNION
                  SELECT b.company_id
                  FROM payments p
                  JOIN branches b ON b.id = p.branch_id
                  WHERE p.status = 'ACTIVE'
                    AND p.created_at >= CURDATE()
                    AND p.created_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
                  UNION
                  SELECT b.company_id
                  FROM shipments s
                  JOIN branches b ON b.id = s.branch_id
                  WHERE s.created_at >= CURDATE()
                    AND s.created_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
                  UNION
                  SELECT b.company_id
                  FROM lives l
                  JOIN branches b ON b.id = l.branch_id
                  WHERE l.created_at >= CURDATE()
                    AND l.created_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
                ) activity
                JOIN companies c ON c.id = activity.company_id
                WHERE c.code <> ?
                """,
                (rs, rowNum) -> rs.getLong("company_id"),
                PLATFORM_COMPANY_CODE
        ).stream().collect(Collectors.toSet());
    }

    private Map<Long, List<String>> findEnabledModulesByCompany() {
        Map<Long, List<String>> result = new HashMap<>();
        jdbcTemplate.query(
                """
                SELECT cm.company_id, cm.module_code
                FROM company_modules cm
                JOIN companies c ON c.id = cm.company_id
                WHERE c.code <> ?
                  AND cm.enabled = 1
                ORDER BY cm.company_id, cm.module_code
                """,
                rs -> {
                    Long companyId = rs.getLong("company_id");
                    result.computeIfAbsent(companyId, ignored -> new ArrayList<>())
                            .add(rs.getString("module_code"));
                },
                PLATFORM_COMPANY_CODE
        );
        return result;
    }

    private List<PlatformDashboardSummaryResponse.InstallationPending> buildInstallationPendings(
            List<DashboardCompanyRow> companies
    ) {
        return companies.stream()
                .map(company -> {
                    List<String> missing = findMissingInstallationItems(company);
                    if (missing.isEmpty()) {
                        return null;
                    }
                    return new PlatformDashboardSummaryResponse.InstallationPending(
                            company.companyId(),
                            company.companyName(),
                            company.status(),
                            missing,
                            actionSectionForMissing(missing)
                    );
                })
                .filter(item -> item != null)
                .limit(8)
                .toList();
    }

    private List<PlatformDashboardSummaryResponse.AttentionCompany> buildAttentionCompanies(
            List<DashboardCompanyRow> companies,
            Map<Long, List<String>> modulesByCompany,
            Set<Long> companiesWithUsageToday
    ) {
        return companies.stream()
                .map(company -> {
                    List<String> pendingLabels = new ArrayList<>(findMissingInstallationItems(company));
                    if (isNearLimit(company.activeUsers(), company.maxUsers())) {
                        pendingLabels.add("Cerca del limite de usuarios");
                    }
                    if (isNearLimit(company.activeBranches(), company.maxBranches())) {
                        pendingLabels.add("Cerca del limite de sucursales");
                    }

                    boolean hasUsageToday = companiesWithUsageToday.contains(company.companyId());
                    if (!hasUsageToday && pendingLabels.isEmpty()) {
                        pendingLabels.add("Sin uso hoy");
                    }

                    if (pendingLabels.isEmpty()) {
                        return null;
                    }

                    List<String> modules = modulesByCompany.getOrDefault(company.companyId(), List.of())
                            .stream()
                            .limit(5)
                            .toList();

                    return new PlatformDashboardSummaryResponse.AttentionCompany(
                            company.companyId(),
                            company.companyName(),
                            company.status(),
                            company.planName(),
                            company.billingModel(),
                            company.licenseType(),
                            company.deploymentType(),
                            company.serviceAgreementStatus(),
                            company.activeUsers(),
                            company.maxUsers(),
                            company.activeBranches(),
                            company.maxBranches(),
                            modules,
                            hasUsageToday ? "Con uso hoy" : company.activeUsers() > 0 ? "Sin uso hoy" : "Sin uso operativo",
                            pendingLabels
                    );
                })
                .filter(item -> item != null)
                .limit(8)
                .toList();
    }

    private List<PlatformDashboardSummaryResponse.OperationalAlert> buildOperationalAlerts(
            List<DashboardCompanyRow> companies
    ) {
        List<PlatformDashboardSummaryResponse.OperationalAlert> alerts = new ArrayList<>();
        addAlert(
                alerts,
                "PACKAGES_READY",
                "Paquetes listos para envio",
                queryInteger(
                        """
                        SELECT COUNT(*)
                        FROM customer_packages cp
                        JOIN branches b ON b.id = cp.branch_id
                        JOIN companies c ON c.id = b.company_id
                        WHERE c.code <> ?
                          AND cp.status = 'READY'
                        """,
                        PLATFORM_COMPANY_CODE
                ),
                "info",
                "usage"
        );
        addAlert(
                alerts,
                "SHIPMENTS_OPEN",
                "Envios abiertos o en ruta",
                queryInteger(
                        """
                        SELECT COUNT(*)
                        FROM shipments s
                        JOIN branches b ON b.id = s.branch_id
                        JOIN companies c ON c.id = b.company_id
                        WHERE c.code <> ?
                          AND s.status IN ('OPEN', 'OUT_FOR_DELIVERY')
                        """,
                        PLATFORM_COMPANY_CODE
                ),
                "warning",
                "usage"
        );
        addAlert(
                alerts,
                "OLD_RESERVATIONS",
                "Apartados activos con mas de 7 dias sin paquete",
                queryInteger(
                        """
                        SELECT COUNT(*)
                        FROM reservations r
                        JOIN branches b ON b.id = r.branch_id
                        JOIN companies c ON c.id = b.company_id
                        WHERE c.code <> ?
                          AND r.status = 'ACTIVE'
                          AND r.created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
                          AND NOT EXISTS (
                            SELECT 1
                            FROM customer_package_items cpi
                            WHERE cpi.reservation_id = r.id
                          )
                        """,
                        PLATFORM_COMPANY_CODE
                ),
                "warning",
                "companies"
        );
        addAlert(
                alerts,
                "LIVE_AUTH_REQUESTED",
                "Autorizaciones LIVE pendientes",
                queryInteger(
                        """
                        SELECT COUNT(*)
                        FROM operational_authorization_requests oar
                        JOIN companies c ON c.id = oar.company_id
                        WHERE c.code <> ?
                          AND oar.status = 'REQUESTED'
                        """,
                        PLATFORM_COMPANY_CODE
                ),
                "warning",
                "audit"
        );

        int companiesNearLimits = (int) companies.stream()
                .filter(company ->
                        isNearLimit(company.activeUsers(), company.maxUsers()) ||
                                isNearLimit(company.activeBranches(), company.maxBranches()))
                .count();
        addAlert(
                alerts,
                "CLIENTS_NEAR_LIMITS",
                "Clientes cerca de limites configurados",
                companiesNearLimits,
                "warning",
                "limits"
        );

        int servicesPastDue = (int) companies.stream()
                .filter(company -> "PAST_DUE".equals(normalizeCode(company.serviceAgreementStatus())))
                .count();
        addAlert(
                alerts,
                "ANNUAL_SERVICES_PAST_DUE",
                "Servicios anuales de hosting vencidos",
                servicesPastDue,
                "danger",
                "subscriptions"
        );

        int servicesExpiringSoon = (int) companies.stream()
                .filter(company -> isAnnualServiceExpiringSoon(company.serviceAgreementEndDate()))
                .count();
        addAlert(
                alerts,
                "ANNUAL_SERVICES_EXPIRING",
                "Servicios anuales proximos a vencer",
                servicesExpiringSoon,
                "warning",
                "subscriptions"
        );

        return alerts;
    }

    private PlatformAuditEventsResponse.AuditEvent toPlatformAuditEvent(
            PlatformAuditLogRow row,
            Map<Long, String> companyNames,
            Map<Long, String> planNames
    ) {
        String path = valueOrFallback(row.requestPath(), "");
        String method = normalizeCode(row.httpMethod());
        Long companyId = extractId(PLATFORM_COMPANY_ID_PATTERN, path);
        Long planId = extractId(PLATFORM_PLAN_ID_PATTERN, path);
        String companyName = companyId == null ? null : companyNames.get(companyId);
        String planName = planId == null ? null : planNames.get(planId);
        String eventType = resolvePlatformAuditEventType(method, path);
        String category = resolvePlatformAuditCategory(eventType);
        String entityType = resolvePlatformAuditEntityType(eventType);
        String entityId = companyId != null
                ? String.valueOf(companyId)
                : planId != null ? String.valueOf(planId) : null;

        return new PlatformAuditEventsResponse.AuditEvent(
                row.id(),
                eventType,
                category,
                row.createdAt(),
                row.actorEmail(),
                valueOrFallback(row.userName(), "Usuario no disponible"),
                companyId,
                companyName,
                resolvePlatformAuditTitle(eventType),
                buildPlatformAuditDescription(eventType, companyId, companyName, planId, planName),
                row.statusCode() != null && row.statusCode() >= 400 ? "warning" : null,
                entityType,
                entityId,
                null,
                null,
                buildPlatformAuditTechnicalDetail(row)
        );
    }

    private PlatformAuditEventsResponse.Summary buildPlatformAuditSummary(
            List<PlatformAuditEventsResponse.AuditEvent> events
    ) {
        LocalDate today = LocalDate.now();
        LocalDate sevenDaysAgo = today.minusDays(6);
        int todayCount = 0;
        int last7DaysCount = 0;
        int companyChanges = 0;
        int subscriptionChanges = 0;
        int configurationChanges = 0;

        for (PlatformAuditEventsResponse.AuditEvent event : events) {
            LocalDate eventDate = event.occurredAt().toLocalDate();
            if (today.equals(eventDate)) {
                todayCount++;
            }
            if (!eventDate.isBefore(sevenDaysAgo)) {
                last7DaysCount++;
            }

            String category = normalizeCode(event.category());
            if ("COMPANIES".equals(category)) {
                companyChanges++;
            } else if ("SUBSCRIPTIONS".equals(category) || "PRICES".equals(category)) {
                subscriptionChanges++;
            } else if ("CONFIGURATION".equals(category) || "USERS".equals(category)) {
                configurationChanges++;
            }
        }

        return new PlatformAuditEventsResponse.Summary(
                todayCount,
                last7DaysCount,
                companyChanges,
                subscriptionChanges,
                configurationChanges,
                events.size()
        );
    }

    private List<PlatformAuditEventsResponse.CoverageItem> buildPlatformAuditCoverage(
            List<PlatformAuditEventsResponse.AuditEvent> events
    ) {
        return List.of(
                new PlatformAuditEventsResponse.CoverageItem(
                        "Eventos del Panel Owner",
                        events.isEmpty() ? "Sin eventos registrados" : "Activo",
                        "Se leen escrituras reales registradas en system_movement_audit_log para rutas /api/platform."
                ),
                new PlatformAuditEventsResponse.CoverageItem(
                        "Actor y fecha",
                        "Parcial",
                        "La bitacora conserva usuario, fecha, metodo y ruta cuando la solicitud usa sesion autenticada."
                ),
                new PlatformAuditEventsResponse.CoverageItem(
                        "Antes / despues",
                        "Pendiente",
                        "El log actual no guarda payload ni diff de campos; queda para hardening de auditoria SaaS."
                ),
                new PlatformAuditEventsResponse.CoverageItem(
                        "Severidad y exportacion",
                        "Pendiente",
                        "La vista prepara categorias, pero severidad real, retencion avanzada y CSV quedan fuera de esta fase."
                )
        );
    }

    private Map<Long, String> findAuditCompanyNames() {
        Map<Long, String> names = new HashMap<>();
        jdbcTemplate.query(
                "SELECT id, name FROM companies",
                (rs, rowNum) -> Map.entry(rs.getLong("id"), rs.getString("name"))
        ).forEach(entry -> names.put(entry.getKey(), entry.getValue()));
        return names;
    }

    private Map<Long, String> findAuditPlanNames() {
        Map<Long, String> names = new HashMap<>();
        jdbcTemplate.query(
                "SELECT id, name FROM subscription_plans",
                (rs, rowNum) -> Map.entry(rs.getLong("id"), rs.getString("name"))
        ).forEach(entry -> names.put(entry.getKey(), entry.getValue()));
        return names;
    }

    private String resolvePlatformAuditEventType(String method, String path) {
        if ("POST".equals(method) && "/api/platform/companies".equals(path)) {
            return "COMPANY_CREATED";
        }
        if ("PATCH".equals(method) && path.matches("^/api/platform/companies/\\d+$")) {
            return "COMPANY_UPDATED";
        }
        if ("POST".equals(method) && path.matches("^/api/platform/companies/\\d+/branches$")) {
            return "BRANCH_CREATED";
        }
        if ("PATCH".equals(method) && path.matches("^/api/platform/companies/\\d+/branches/\\d+$")) {
            return "BRANCH_UPDATED";
        }
        if ("POST".equals(method) && path.matches("^/api/platform/companies/\\d+/admin-user$")) {
            return "TENANT_ADMIN_CREATED";
        }
        if ("POST".equals(method) && path.matches("^/api/platform/companies/\\d+/users$")) {
            return "TENANT_USER_CREATED";
        }
        if ("PATCH".equals(method) && path.matches("^/api/platform/companies/\\d+/users/\\d+$")) {
            return "TENANT_USER_UPDATED";
        }
        if ("POST".equals(method) && "/api/platform/subscription-plans".equals(path)) {
            return "SUBSCRIPTION_PLAN_CREATED";
        }
        if ("PATCH".equals(method) && path.matches("^/api/platform/subscription-plans/\\d+$")) {
            return "SUBSCRIPTION_PLAN_UPDATED";
        }
        if ("PUT".equals(method) && path.matches("^/api/platform/subscription-plans/\\d+/prices$")) {
            return "PLAN_PRICES_UPDATED";
        }
        if ("PUT".equals(method) && path.matches("^/api/platform/companies/\\d+/subscription$")) {
            return "SUBSCRIPTION_ASSIGNED";
        }
        if ("PUT".equals(method) && path.matches("^/api/platform/companies/\\d+/commercial-agreement$")) {
            return "COMPANY_COMMERCIAL_AGREEMENT_UPDATED";
        }
        if ("PATCH".equals(method) && path.matches("^/api/platform/companies/\\d+/settings$")) {
            return "COMPANY_SETTINGS_UPDATED";
        }
        if ("PUT".equals(method) && path.matches("^/api/platform/companies/\\d+/usage-rates$")) {
            return "USAGE_RATES_UPDATED";
        }
        return "PLATFORM_CHANGE_RECORDED";
    }

    private String resolvePlatformAuditCategory(String eventType) {
        return switch (eventType) {
            case "COMPANY_CREATED", "COMPANY_UPDATED", "BRANCH_CREATED", "BRANCH_UPDATED" -> "COMPANIES";
            case "TENANT_ADMIN_CREATED", "TENANT_USER_CREATED", "TENANT_USER_UPDATED" -> "USERS";
            case "SUBSCRIPTION_PLAN_CREATED", "SUBSCRIPTION_PLAN_UPDATED", "SUBSCRIPTION_ASSIGNED",
                    "COMPANY_COMMERCIAL_AGREEMENT_UPDATED" -> "SUBSCRIPTIONS";
            case "PLAN_PRICES_UPDATED", "USAGE_RATES_UPDATED" -> "PRICES";
            case "COMPANY_SETTINGS_UPDATED" -> "CONFIGURATION";
            default -> "PLATFORM";
        };
    }

    private String resolvePlatformAuditEntityType(String eventType) {
        return switch (eventType) {
            case "COMPANY_CREATED", "COMPANY_UPDATED", "BRANCH_CREATED", "BRANCH_UPDATED",
                    "TENANT_ADMIN_CREATED", "TENANT_USER_CREATED", "TENANT_USER_UPDATED",
                    "SUBSCRIPTION_ASSIGNED", "COMPANY_COMMERCIAL_AGREEMENT_UPDATED",
                    "COMPANY_SETTINGS_UPDATED", "USAGE_RATES_UPDATED" -> "COMPANY";
            case "SUBSCRIPTION_PLAN_CREATED", "SUBSCRIPTION_PLAN_UPDATED", "PLAN_PRICES_UPDATED" -> "SUBSCRIPTION_PLAN";
            default -> "PLATFORM";
        };
    }

    private String resolvePlatformAuditTitle(String eventType) {
        return switch (eventType) {
            case "COMPANY_CREATED" -> "Compania creada";
            case "COMPANY_UPDATED" -> "Cliente actualizado";
            case "BRANCH_CREATED" -> "Sucursal creada";
            case "BRANCH_UPDATED" -> "Sucursal actualizada";
            case "TENANT_ADMIN_CREATED" -> "Admin de cliente creado";
            case "TENANT_USER_CREATED" -> "Usuario de cliente creado";
            case "TENANT_USER_UPDATED" -> "Usuario de cliente actualizado";
            case "SUBSCRIPTION_PLAN_CREATED" -> "Plan SaaS creado";
            case "SUBSCRIPTION_PLAN_UPDATED" -> "Plan SaaS actualizado";
            case "PLAN_PRICES_UPDATED" -> "Precios del plan actualizados";
            case "SUBSCRIPTION_ASSIGNED" -> "Suscripcion del cliente actualizada";
            case "COMPANY_COMMERCIAL_AGREEMENT_UPDATED" -> "Licencia y hosting actualizados";
            case "COMPANY_SETTINGS_UPDATED" -> "Modulos o limites actualizados";
            case "USAGE_RATES_UPDATED" -> "Tarifas por consumo actualizadas";
            default -> "Cambio global de plataforma";
        };
    }

    private String buildPlatformAuditDescription(
            String eventType,
            Long companyId,
            String companyName,
            Long planId,
            String planName
    ) {
        String companyLabel = companyName != null
                ? companyName
                : companyId != null ? "cliente ID " + companyId : "cliente no identificado en ruta";
        String planLabel = planName != null
                ? planName
                : planId != null ? "plan ID " + planId : "plan no identificado en ruta";

        return switch (eventType) {
            case "COMPANY_CREATED" ->
                    "Se registro una solicitud de creacion de compania desde Panel Owner. El log actual no conserva el ID creado en la respuesta.";
            case "COMPANY_UPDATED" -> "Se actualizaron datos generales de " + companyLabel + ".";
            case "BRANCH_CREATED" -> "Se creo una sucursal para " + companyLabel + ".";
            case "BRANCH_UPDATED" -> "Se actualizo una sucursal de " + companyLabel + ".";
            case "TENANT_ADMIN_CREATED" -> "Se creo un administrador para " + companyLabel + ".";
            case "TENANT_USER_CREATED" -> "Se creo un usuario operativo para " + companyLabel + ".";
            case "TENANT_USER_UPDATED" -> "Se actualizo un usuario operativo de " + companyLabel + ".";
            case "SUBSCRIPTION_PLAN_CREATED" -> "Se creo un plan del catalogo global de suscripciones.";
            case "SUBSCRIPTION_PLAN_UPDATED" -> "Se actualizo el plan " + planLabel + ".";
            case "PLAN_PRICES_UPDATED" -> "Se actualizaron precios por periodo del plan " + planLabel + ".";
            case "SUBSCRIPTION_ASSIGNED" -> "Se actualizo la suscripcion SaaS de " + companyLabel + ".";
            case "COMPANY_COMMERCIAL_AGREEMENT_UPDATED" ->
                    "Se actualizo la licencia comercial o servicio anual de infraestructura de " + companyLabel + ".";
            case "COMPANY_SETTINGS_UPDATED" -> "Se actualizaron modulos o limites de " + companyLabel + ".";
            case "USAGE_RATES_UPDATED" -> "Se actualizaron tarifas por consumo de " + companyLabel + ".";
            default -> "Se registro una accion global de plataforma.";
        };
    }

    private String buildPlatformAuditTechnicalDetail(PlatformAuditLogRow row) {
        String query = valueOrFallback(row.queryString(), "");
        String suffix = query.isBlank() ? "" : "?" + query;
        String status = row.statusCode() == null ? "sin status" : "HTTP " + row.statusCode();
        return row.httpMethod() + " " + row.requestPath() + suffix + " - " + status;
    }

    private Long extractId(Pattern pattern, String path) {
        Matcher matcher = pattern.matcher(path);
        if (!matcher.matches()) {
            return null;
        }
        try {
            return Long.parseLong(matcher.group(1));
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private String valueOrFallback(String value, String fallback) {
        return value == null || value.trim().isEmpty() ? fallback : value.trim();
    }

    private List<String> findMissingInstallationItems(DashboardCompanyRow company) {
        List<String> missing = new ArrayList<>();
        String billingModel = normalizeCode(company.billingModel());
        String subscriptionStatus = normalizeCode(company.subscriptionStatus());
        boolean hasActivePerpetualLicense = hasActivePerpetualLicense(company);

        if (!hasActivePerpetualLicense && company.planId() == null) {
            missing.add("Sin plan");
        }
        if (!hasActivePerpetualLicense && "SIN_CONFIGURAR".equals(billingModel)) {
            missing.add("Sin modelo de cobro");
        }
        if (company.activeBranches() == 0) {
            missing.add("Sin sucursal activa");
        }
        if (company.adminUsers() == 0) {
            missing.add("Sin admin cliente");
        }
        if (company.operationalUsers() == 0) {
            missing.add("Sin usuarios operativos");
        }
        if (company.activeModules() == 0) {
            missing.add("Sin modulos activos");
        }
        if (!hasActivePerpetualLicense && !company.hasLimits()) {
            missing.add("Sin limites configurados");
        }
        if (!company.liveEnabled()) {
            missing.add("LIVE desactivado");
        }
        if (!hasActivePerpetualLicense &&
                company.planId() != null &&
                !List.of("ACTIVE", "TRIAL").contains(subscriptionStatus)) {
            missing.add("Suscripcion no activa");
        }
        String serviceStatus = normalizeCode(company.serviceAgreementStatus());
        if (hasActivePerpetualLicense && "PAST_DUE".equals(serviceStatus)) {
            missing.add("Servicio anual vencido");
        } else if (hasActivePerpetualLicense && requiresAnnualService(company) &&
                !"ACTIVE".equals(serviceStatus)) {
            missing.add("Falta servicio anual de hosting");
        }

        return missing;
    }

    private String actionSectionForMissing(List<String> missing) {
        if (missing.stream().anyMatch(item -> item.contains("plan") ||
                item.contains("cobro") ||
                item.contains("Suscripcion") ||
                item.contains("hosting") ||
                item.contains("Servicio anual"))) {
            return "subscriptions";
        }
        if (missing.stream().anyMatch(item -> item.contains("limite"))) {
            return "limits";
        }
        if (missing.stream().anyMatch(item -> item.contains("usuario") || item.contains("admin"))) {
            return "users";
        }
        if (missing.stream().anyMatch(item -> item.contains("modulo") || item.contains("LIVE"))) {
            return "modules";
        }
        return "companies";
    }

    private boolean isNearLimit(int current, Integer max) {
        if (max == null || max <= 0) {
            return false;
        }
        return current >= Math.ceil(max * 0.8);
    }

    private boolean hasActivePerpetualLicense(DashboardCompanyRow company) {
        return "PERPETUAL".equals(normalizeCode(company.licenseType())) &&
                "ACTIVE".equals(normalizeCode(company.licenseStatus()));
    }

    private boolean requiresAnnualService(DashboardCompanyRow company) {
        String deploymentType = normalizeCode(company.deploymentType());
        return "APPMODA_HOSTED".equals(deploymentType) || "HYBRID".equals(deploymentType);
    }

    private boolean isAnnualServiceExpiringSoon(String endDate) {
        String cleaned = cleanNullable(endDate);
        if (cleaned == null) {
            return false;
        }
        try {
            LocalDate parsed = LocalDate.parse(cleaned);
            LocalDate today = LocalDate.now();
            return !parsed.isBefore(today) && !parsed.isAfter(today.plusDays(30));
        } catch (RuntimeException ex) {
            return false;
        }
    }

    private void addAlert(
            List<PlatformDashboardSummaryResponse.OperationalAlert> alerts,
            String type,
            String label,
            Integer count,
            String tone,
            String actionSection
    ) {
        if (count != null && count > 0) {
            alerts.add(new PlatformDashboardSummaryResponse.OperationalAlert(
                    type,
                    label,
                    count,
                    tone,
                    actionSection
            ));
        }
    }

    private Integer queryInteger(String sql, Object... args) {
        Integer value = jdbcTemplate.queryForObject(sql, Integer.class, args);
        return value == null ? 0 : value;
    }

    private BigDecimal queryBigDecimal(String sql, Object... args) {
        BigDecimal value = jdbcTemplate.queryForObject(sql, BigDecimal.class, args);
        return value == null ? BigDecimal.ZERO : value;
    }

    private String normalizeCode(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }

    private PlatformSubscriptionPlanResponse findSubscriptionPlan(Long planId) {
        return jdbcTemplate.queryForObject(
                """
                SELECT id, code, name, description, status, included_max_users, included_max_branches,
                       includes_live, includes_reports, includes_shipments, includes_packages
                FROM subscription_plans
                WHERE id = ?
                """,
                (rs, rowNum) -> mapSubscriptionPlan(
                        rs.getLong("id"),
                        rs.getString("code"),
                        rs.getString("name"),
                        rs.getString("description"),
                        rs.getString("status"),
                        rs.getObject("included_max_users", Integer.class),
                        rs.getObject("included_max_branches", Integer.class),
                        rs.getBoolean("includes_live"),
                        rs.getBoolean("includes_reports"),
                        rs.getBoolean("includes_shipments"),
                        rs.getBoolean("includes_packages")
                ),
                planId
        );
    }

    private List<PlatformPlanPriceResponse> findSubscriptionPlanPricesById(Long planId) {
        return jdbcTemplate.query(
                """
                SELECT id, plan_id, billing_period, price_amount, currency, status
                FROM subscription_plan_prices
                WHERE plan_id = ?
                ORDER BY
                  CASE billing_period
                    WHEN 'MONTHLY' THEN 1
                    WHEN 'QUARTERLY' THEN 2
                    WHEN 'SEMIANNUAL' THEN 3
                    WHEN 'ANNUAL' THEN 4
                    ELSE 9
                  END,
                  billing_period
                """,
                (rs, rowNum) -> new PlatformPlanPriceResponse(
                        rs.getLong("id"),
                        rs.getLong("plan_id"),
                        rs.getString("billing_period"),
                        rs.getBigDecimal("price_amount"),
                        rs.getString("currency"),
                        rs.getString("status")
                ),
                planId
        );
    }

    private PlatformCompanySubscriptionResponse findCompanySubscriptionByCompanyId(Long companyId) {
        List<PlatformCompanySubscriptionResponse> rows = jdbcTemplate.query(
                """
                SELECT
                  cs.id,
                  cs.company_id,
                  cs.plan_id,
                  sp.code AS plan_code,
                  sp.name AS plan_name,
                  cs.billing_model,
                  cs.billing_period,
                  cs.status,
                  DATE_FORMAT(cs.started_at, '%Y-%m-%d %H:%i:%s') AS started_at,
                  DATE_FORMAT(cs.ends_at, '%Y-%m-%d %H:%i:%s') AS ends_at,
                  DATE_FORMAT(cs.next_billing_at, '%Y-%m-%d %H:%i:%s') AS next_billing_at
                FROM company_subscriptions cs
                LEFT JOIN subscription_plans sp ON sp.id = cs.plan_id
                WHERE cs.company_id = ?
                """,
                (rs, rowNum) -> new PlatformCompanySubscriptionResponse(
                        rs.getLong("id"),
                        rs.getLong("company_id"),
                        rs.getObject("plan_id", Long.class),
                        rs.getString("plan_code"),
                        rs.getString("plan_name"),
                        rs.getString("billing_model"),
                        rs.getString("billing_period"),
                        rs.getString("status"),
                        rs.getString("started_at"),
                        rs.getString("ends_at"),
                        rs.getString("next_billing_at")
                ),
                companyId
        );

        if (!rows.isEmpty()) {
            return rows.get(0);
        }

        return new PlatformCompanySubscriptionResponse(
                null,
                companyId,
                null,
                null,
                null,
                "SIN_CONFIGURAR",
                null,
                "SIN_CONFIGURAR",
                null,
                null,
                null
        );
    }

    private PlatformCommercialAgreementResponse findCommercialAgreementByCompanyId(Long companyId) {
        return new PlatformCommercialAgreementResponse(
                findCommercialLicenseByCompanyId(companyId),
                findServiceAgreementByCompanyId(companyId)
        );
    }

    private PlatformCommercialAgreementResponse.License findCommercialLicenseByCompanyId(Long companyId) {
        List<PlatformCommercialAgreementResponse.License> rows = jdbcTemplate.query(
                """
                SELECT
                  id,
                  company_id,
                  license_type,
                  status,
                  purchase_amount,
                  currency,
                  DATE_FORMAT(payment_date, '%Y-%m-%d') AS payment_date,
                  payment_method,
                  payment_reference,
                  notes,
                  DATE_FORMAT(valid_from, '%Y-%m-%d') AS valid_from,
                  DATE_FORMAT(valid_until, '%Y-%m-%d') AS valid_until,
                  no_expiration,
                  unlimited_commercial_use
                FROM company_licenses
                WHERE company_id = ?
                """,
                (rs, rowNum) -> new PlatformCommercialAgreementResponse.License(
                        rs.getLong("id"),
                        rs.getLong("company_id"),
                        rs.getString("license_type"),
                        rs.getString("status"),
                        rs.getBigDecimal("purchase_amount"),
                        rs.getString("currency"),
                        rs.getString("payment_date"),
                        rs.getString("payment_method"),
                        rs.getString("payment_reference"),
                        rs.getString("notes"),
                        rs.getString("valid_from"),
                        rs.getString("valid_until"),
                        rs.getObject("no_expiration", Boolean.class),
                        rs.getObject("unlimited_commercial_use", Boolean.class)
                ),
                companyId
        );

        if (!rows.isEmpty()) {
            return rows.get(0);
        }

        return new PlatformCommercialAgreementResponse.License(
                null,
                companyId,
                "SIN_LICENCIA",
                "SIN_CONFIGURAR",
                null,
                "MXN",
                null,
                null,
                null,
                null,
                null,
                null,
                true,
                true
        );
    }

    private PlatformCommercialAgreementResponse.ServiceAgreement findServiceAgreementByCompanyId(Long companyId) {
        List<PlatformCommercialAgreementResponse.ServiceAgreement> rows = jdbcTemplate.query(
                """
                SELECT
                  id,
                  company_id,
                  service_type,
                  deployment_type,
                  status,
                  annual_amount,
                  currency,
                  DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
                  DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date,
                  auto_renew,
                  payment_method,
                  payment_reference,
                  notes
                FROM company_service_agreements
                WHERE company_id = ?
                  AND service_type = 'HOSTING_INFRASTRUCTURE'
                """,
                (rs, rowNum) -> new PlatformCommercialAgreementResponse.ServiceAgreement(
                        rs.getLong("id"),
                        rs.getLong("company_id"),
                        rs.getString("service_type"),
                        rs.getString("deployment_type"),
                        rs.getString("status"),
                        rs.getBigDecimal("annual_amount"),
                        rs.getString("currency"),
                        rs.getString("start_date"),
                        rs.getString("end_date"),
                        rs.getObject("auto_renew", Boolean.class),
                        rs.getString("payment_method"),
                        rs.getString("payment_reference"),
                        rs.getString("notes")
                ),
                companyId
        );

        if (!rows.isEmpty()) {
            return rows.get(0);
        }

        return new PlatformCommercialAgreementResponse.ServiceAgreement(
                null,
                companyId,
                "HOSTING_INFRASTRUCTURE",
                "CLIENT_HOSTED",
                "NOT_APPLICABLE",
                null,
                "MXN",
                null,
                null,
                false,
                null,
                null,
                null
        );
    }

    private void upsertCommercialLicense(
            Long companyId,
            UpdatePlatformCommercialAgreementRequest.LicensePayload license
    ) {
        String licenseType = normalizeLicenseType(license.getLicenseType() == null ? "PERPETUAL" : license.getLicenseType());
        String status = normalizeLicenseStatus(license.getStatus() == null ? "ACTIVE" : license.getStatus());
        boolean noExpiration = license.getNoExpiration() == null || license.getNoExpiration();
        boolean unlimitedCommercialUse =
                license.getUnlimitedCommercialUse() == null || license.getUnlimitedCommercialUse();

        jdbcTemplate.update(
                """
                INSERT INTO company_licenses (
                  company_id, license_type, status, purchase_amount, currency,
                  payment_date, payment_method, payment_reference, notes,
                  valid_from, valid_until, no_expiration, unlimited_commercial_use,
                  created_by_user_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                  license_type = VALUES(license_type),
                  status = VALUES(status),
                  purchase_amount = VALUES(purchase_amount),
                  currency = VALUES(currency),
                  payment_date = VALUES(payment_date),
                  payment_method = VALUES(payment_method),
                  payment_reference = VALUES(payment_reference),
                  notes = VALUES(notes),
                  valid_from = VALUES(valid_from),
                  valid_until = VALUES(valid_until),
                  no_expiration = VALUES(no_expiration),
                  unlimited_commercial_use = VALUES(unlimited_commercial_use),
                  updated_at = CURRENT_TIMESTAMP
                """,
                companyId,
                licenseType,
                status,
                validateMoney(license.getPurchaseAmount()),
                normalizeCurrency(license.getCurrency()),
                normalizeDate(license.getPaymentDate()),
                truncate(cleanNullable(license.getPaymentMethod()), 64),
                truncate(cleanNullable(license.getPaymentReference()), 150),
                truncate(cleanNullable(license.getNotes()), 1000),
                normalizeDate(license.getValidFrom()),
                noExpiration ? null : normalizeDate(license.getValidUntil()),
                noExpiration ? 1 : 0,
                unlimitedCommercialUse ? 1 : 0,
                currentUser.getUserId()
        );
    }

    private void upsertServiceAgreement(
            Long companyId,
            UpdatePlatformCommercialAgreementRequest.ServiceAgreementPayload serviceAgreement
    ) {
        String serviceType = normalizeServiceType(
                serviceAgreement.getServiceType() == null
                        ? "HOSTING_INFRASTRUCTURE"
                        : serviceAgreement.getServiceType()
        );
        String deploymentType = normalizeDeploymentType(
                serviceAgreement.getDeploymentType() == null
                        ? "CLIENT_HOSTED"
                        : serviceAgreement.getDeploymentType()
        );
        String status = normalizeServiceStatus(
                serviceAgreement.getStatus() == null
                        ? "NOT_APPLICABLE"
                        : serviceAgreement.getStatus()
        );
        BigDecimal annualAmount = validateMoney(serviceAgreement.getAnnualAmount());
        String startDate = normalizeDate(serviceAgreement.getStartDate());
        String endDate = normalizeDate(serviceAgreement.getEndDate());

        if ("CLIENT_HOSTED".equals(deploymentType)) {
            status = "NOT_APPLICABLE";
            annualAmount = null;
            startDate = null;
            endDate = null;
        }

        jdbcTemplate.update(
                """
                INSERT INTO company_service_agreements (
                  company_id, service_type, deployment_type, status, annual_amount,
                  currency, start_date, end_date, auto_renew, payment_method,
                  payment_reference, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                  deployment_type = VALUES(deployment_type),
                  status = VALUES(status),
                  annual_amount = VALUES(annual_amount),
                  currency = VALUES(currency),
                  start_date = VALUES(start_date),
                  end_date = VALUES(end_date),
                  auto_renew = VALUES(auto_renew),
                  payment_method = VALUES(payment_method),
                  payment_reference = VALUES(payment_reference),
                  notes = VALUES(notes),
                  updated_at = CURRENT_TIMESTAMP
                """,
                companyId,
                serviceType,
                deploymentType,
                status,
                annualAmount,
                normalizeCurrency(serviceAgreement.getCurrency()),
                startDate,
                endDate,
                Boolean.TRUE.equals(serviceAgreement.getAutoRenew()) ? 1 : 0,
                truncate(cleanNullable(serviceAgreement.getPaymentMethod()), 64),
                truncate(cleanNullable(serviceAgreement.getPaymentReference()), 150),
                truncate(cleanNullable(serviceAgreement.getNotes()), 1000)
        );
    }

    private List<PlatformUsageRateResponse> findCompanyUsageRatesByCompanyId(Long companyId) {
        List<UsageRateRow> rows = jdbcTemplate.query(
                """
                SELECT usage_type, id, unit_price, currency, enabled
                FROM company_usage_rates
                WHERE company_id = ?
                """,
                (rs, rowNum) -> new UsageRateRow(
                        rs.getString("usage_type"),
                        rs.getObject("id", Long.class),
                        rs.getBigDecimal("unit_price"),
                        rs.getString("currency"),
                        rs.getBoolean("enabled")
                ),
                companyId
        );

        return USAGE_DEFINITIONS.stream()
                .map(definition -> {
                    UsageRateRow row = rows.stream()
                            .filter(candidate -> candidate.usageType().equals(definition.code()))
                            .findFirst()
                            .orElse(null);

                    return new PlatformUsageRateResponse(
                            row == null ? null : row.id(),
                            companyId,
                            definition.code(),
                            definition.name(),
                            row == null ? BigDecimal.ZERO : row.unitPrice(),
                            row == null ? "MXN" : row.currency(),
                            row == null || Boolean.TRUE.equals(row.enabled())
                    );
                })
                .toList();
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
                SELECT
                  max_users,
                  max_branches,
                  max_items,
                  max_live_sessions_per_month,
                  max_shipments_per_month,
                  max_packages_per_month
                FROM company_limits
                WHERE company_id = ?
                """,
                (rs, rowNum) -> new PlatformCompanySettingsResponse.LimitSettings(
                        rs.getObject("max_users", Integer.class),
                        rs.getObject("max_branches", Integer.class),
                        rs.getObject("max_items", Integer.class),
                        rs.getObject("max_live_sessions_per_month", Integer.class),
                        rs.getObject("max_shipments_per_month", Integer.class),
                        rs.getObject("max_packages_per_month", Integer.class)
                ),
                companyId
        );

        return rows.isEmpty()
                ? new PlatformCompanySettingsResponse.LimitSettings(null, null, null, null, null, null)
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

    private PlatformSubscriptionPlanResponse mapSubscriptionPlan(
            Long id,
            String code,
            String name,
            String description,
            String status,
            Integer includedMaxUsers,
            Integer includedMaxBranches,
            Boolean includesLive,
            Boolean includesReports,
            Boolean includesShipments,
            Boolean includesPackages
    ) {
        return new PlatformSubscriptionPlanResponse(
                id,
                code,
                name,
                description,
                status,
                includedMaxUsers,
                includedMaxBranches,
                includesLive,
                includesReports,
                includesShipments,
                includesPackages
        );
    }

    private void assertPlanExists(Long planId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM subscription_plans WHERE id = ?",
                Integer.class,
                planId
        );

        if (count == null || count == 0) {
            throw new IllegalArgumentException("Plan de suscripcion no encontrado");
        }
    }

    private String normalizePlanStatus(String status) {
        String normalized = cleanRequired(status, "status").toUpperCase(Locale.ROOT);
        if (!"ACTIVE".equals(normalized) && !"INACTIVE".equals(normalized)) {
            throw new IllegalArgumentException("status debe ser ACTIVE o INACTIVE");
        }
        return normalized;
    }

    private String normalizeBillingModel(String value) {
        String normalized = cleanRequired(value, "billingModel").toUpperCase(Locale.ROOT);
        if (!BILLING_MODELS.contains(normalized)) {
            throw new IllegalArgumentException("billingModel no permitido: " + value);
        }
        return normalized;
    }

    private String normalizeBillingPeriod(String value, boolean required) {
        String cleaned = cleanNullable(value);
        if (cleaned == null) {
            if (required) {
                throw new IllegalArgumentException("billingPeriod es obligatorio");
            }
            return null;
        }

        String normalized = cleaned.toUpperCase(Locale.ROOT);
        if (!BILLING_PERIODS.contains(normalized)) {
            throw new IllegalArgumentException("billingPeriod no permitido: " + value);
        }
        return normalized;
    }

    private String normalizeSubscriptionStatus(String value) {
        String normalized = cleanRequired(value, "status").toUpperCase(Locale.ROOT);
        if (!SUBSCRIPTION_STATUSES.contains(normalized)) {
            throw new IllegalArgumentException("status de suscripcion no permitido: " + value);
        }
        return normalized;
    }

    private String normalizeLicenseType(String value) {
        String normalized = cleanRequired(value, "licenseType").toUpperCase(Locale.ROOT);
        if (!LICENSE_TYPES.contains(normalized)) {
            throw new IllegalArgumentException("licenseType no permitido: " + value);
        }
        return normalized;
    }

    private String normalizeLicenseStatus(String value) {
        String normalized = cleanRequired(value, "licenseStatus").toUpperCase(Locale.ROOT);
        if (!LICENSE_STATUSES.contains(normalized)) {
            throw new IllegalArgumentException("licenseStatus no permitido: " + value);
        }
        return normalized;
    }

    private String normalizeDeploymentType(String value) {
        String normalized = cleanRequired(value, "deploymentType").toUpperCase(Locale.ROOT);
        if (!DEPLOYMENT_TYPES.contains(normalized)) {
            throw new IllegalArgumentException("deploymentType no permitido: " + value);
        }
        return normalized;
    }

    private String normalizeServiceType(String value) {
        String normalized = cleanRequired(value, "serviceType").toUpperCase(Locale.ROOT);
        if (!SERVICE_TYPES.contains(normalized)) {
            throw new IllegalArgumentException("serviceType no permitido: " + value);
        }
        return normalized;
    }

    private String normalizeServiceStatus(String value) {
        String normalized = cleanRequired(value, "serviceStatus").toUpperCase(Locale.ROOT);
        if (!SERVICE_STATUSES.contains(normalized)) {
            throw new IllegalArgumentException("serviceStatus no permitido: " + value);
        }
        return normalized;
    }

    private String normalizeUsageType(String value) {
        String normalized = cleanRequired(value, "usageType").toUpperCase(Locale.ROOT);
        boolean known = USAGE_DEFINITIONS.stream().anyMatch(definition -> definition.code().equals(normalized));
        if (!known) {
            throw new IllegalArgumentException("Tipo de consumo no reconocido: " + value);
        }
        return normalized;
    }

    private BigDecimal validateMoney(BigDecimal value) {
        BigDecimal amount = value == null ? BigDecimal.ZERO : value;
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("El monto no puede ser negativo");
        }
        return amount;
    }

    private String normalizeCurrency(String value) {
        String normalized = cleanNullable(value);
        if (normalized == null) {
            return "MXN";
        }
        String sanitized = normalized.toUpperCase(Locale.ROOT).replaceAll("[^A-Z]", "");
        return sanitized.isBlank() ? "MXN" : sanitized.substring(0, Math.min(8, sanitized.length()));
    }

    private String normalizeDateTime(String value) {
        String cleaned = cleanNullable(value);
        if (cleaned == null) {
            return null;
        }
        return cleaned.replace('T', ' ');
    }

    private String normalizeDate(String value) {
        String cleaned = cleanNullable(value);
        if (cleaned == null) {
            return null;
        }
        return cleaned.length() > 10 ? cleaned.substring(0, 10) : cleaned;
    }

    private void setNullableInteger(PreparedStatement ps, int index, Integer value) throws SQLException {
        if (value == null) {
            ps.setNull(index, Types.INTEGER);
            return;
        }
        ps.setInt(index, value);
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

    private String truncate(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        return value.length() > maxLength ? value.substring(0, maxLength) : value;
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

    private record UsageDefinition(
            String code,
            String name
    ) {
    }

    private record UsageRateRow(
            String usageType,
            Long id,
            BigDecimal unitPrice,
            String currency,
            Boolean enabled
    ) {
    }

    private record PlatformAuditLogRow(
            Long id,
            String eventType,
            String httpMethod,
            String requestPath,
            String queryString,
            Integer statusCode,
            Long userId,
            String userName,
            String actorEmail,
            String detail,
            LocalDateTime createdAt
    ) {
    }

    private record DashboardCompanyRow(
            Long companyId,
            String companyName,
            String status,
            Long planId,
            String planName,
            String billingModel,
            String subscriptionStatus,
            int activeBranches,
            int activeUsers,
            int adminUsers,
            int operationalUsers,
            int activeModules,
            boolean hasLimits,
            boolean liveEnabled,
            Integer maxUsers,
            Integer maxBranches,
            String licenseType,
            String licenseStatus,
            Boolean unlimitedCommercialUse,
            String deploymentType,
            String serviceAgreementStatus,
            String serviceAgreementEndDate
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
