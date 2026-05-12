package com.hpsqsoft.ctrlropa.useradmin;

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
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class UserAdminService {

    private final JdbcTemplate jdbcTemplate;
    private final AccessService accessService;
    private final CurrentUser currentUser;
    private final SecuritySettingsService securitySettingsService;

    public UserAdminService(JdbcTemplate jdbcTemplate,
                            AccessService accessService,
                            CurrentUser currentUser,
                            SecuritySettingsService securitySettingsService) {
        this.jdbcTemplate = jdbcTemplate;
        this.accessService = accessService;
        this.currentUser = currentUser;
        this.securitySettingsService = securitySettingsService;
    }

    @Transactional(readOnly = true)
    public List<UserAdminResponse> findAll(String search) {
        assertCanManageUsers();

        String normalizedSearch = search == null ? null : search.trim();

        List<Long> ids;

        if (normalizedSearch == null || normalizedSearch.isBlank()) {
            ids = jdbcTemplate.query(
                    """
                    SELECT u.id
                    FROM users u
                    ORDER BY u.created_at DESC
                    """,
                    (rs, rowNum) -> rs.getLong("id")
            );
        } else {
            String like = "%" + normalizedSearch + "%";
            ids = jdbcTemplate.query(
                    """
                    SELECT u.id
                    FROM users u
                    WHERE u.name LIKE ?
                       OR u.email LIKE ?
                       OR u.phone LIKE ?
                    ORDER BY u.created_at DESC
                    """,
                    (rs, rowNum) -> rs.getLong("id"),
                    like,
                    like,
                    like
            );
        }

        return ids.stream()
                .map(this::findResponseById)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserAdminResponse findById(Long id) {
        assertCanManageUsers();
        return findResponseById(id);
    }

    public UserAdminResponse create(CreateUserRequest request) {
        assertCanManageUsers();

        validateStatus(request.getStatus());
        assertBranchExists(request.getBranchId());
        assertIdsExist("branches", request.getBranchIds());
        assertEmailAvailable(request.getEmail(), null);
        assertIdsExist("roles", request.getRoleIds());
        assertAssignableRoles(request.getRoleIds());
        assertIdsExist("permissions", request.getPermissionIds());

        String status = request.getStatus() == null || request.getStatus().isBlank()
                ? "ACTIVE"
                : request.getStatus().trim().toUpperCase();

        KeyHolder keyHolder = new GeneratedKeyHolder();
        String passwordHash = toPasswordHash(request.getPassword());

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    """
                    INSERT INTO users (
                        branch_id, name, email, phone, password_hash, password_change_required, password_updated_at, status
                    ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
                    """,
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setLong(1, request.getBranchId());
            ps.setString(2, cleanRequired(request.getName()));
            ps.setString(3, cleanRequired(request.getEmail()).toLowerCase());
            ps.setString(4, cleanNullable(request.getPhone()));
            ps.setString(5, passwordHash);
            ps.setBoolean(6, Boolean.TRUE.equals(request.getPasswordChangeRequired()));
            ps.setString(7, status);
            return ps;
        }, keyHolder);

        Long userId = keyHolder.getKey().longValue();
        savePasswordHistory(userId, passwordHash);

        replaceBranches(userId, request.getBranchId(), request.getBranchIds());
        replaceRoles(userId, request.getRoleIds());
        replacePermissions(userId, request.getPermissionIds());

        return findResponseById(userId);
    }

    public UserAdminResponse update(Long id, UpdateUserRequest request) {
        assertCanManageUsers();
        assertUserExists(id);

        if (request.getBranchId() != null) {
            assertBranchExists(request.getBranchId());
        }

        assertIdsExist("branches", request.getBranchIds());

        if (request.getEmail() != null) {
            assertEmailAvailable(request.getEmail(), id);
        }

        if (request.getStatus() != null) {
            validateStatus(request.getStatus());
        }

        assertIdsExist("roles", request.getRoleIds());
        assertAssignableRoles(request.getRoleIds());
        assertIdsExist("permissions", request.getPermissionIds());

        List<Object> params = new ArrayList<>();
        StringBuilder sql = new StringBuilder("UPDATE users SET ");

        boolean hasField = false;
        boolean passwordChanged = false;

        if (request.getBranchId() != null) {
            sql.append("branch_id = ?");
            params.add(request.getBranchId());
            hasField = true;
        }

        if (request.getName() != null) {
            if (hasField) sql.append(", ");
            sql.append("name = ?");
            params.add(cleanRequired(request.getName()));
            hasField = true;
        }

        if (request.getEmail() != null) {
            if (hasField) sql.append(", ");
            sql.append("email = ?");
            params.add(cleanRequired(request.getEmail()).toLowerCase());
            hasField = true;
        }

        if (request.getPhone() != null) {
            if (hasField) sql.append(", ");
            sql.append("phone = ?");
            params.add(cleanNullable(request.getPhone()));
            hasField = true;
        }

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            String updatedPasswordHash = toPasswordHash(request.getPassword());
            if (hasField) sql.append(", ");
            sql.append("password_hash = ?, password_updated_at = CURRENT_TIMESTAMP");
            params.add(updatedPasswordHash);
            hasField = true;
            passwordChanged = true;
            savePasswordHistory(id, updatedPasswordHash);
        }

        if (request.getPasswordChangeRequired() != null) {
            if (hasField) sql.append(", ");
            sql.append("password_change_required = ?");
            params.add(Boolean.TRUE.equals(request.getPasswordChangeRequired()) ? 1 : 0);
            hasField = true;
        }

        if (request.getStatus() != null) {
            if (hasField) sql.append(", ");
            sql.append("status = ?");
            params.add(request.getStatus().trim().toUpperCase());
            hasField = true;
        }

        if (hasField) {
            sql.append(" WHERE id = ?");
            params.add(id);
            jdbcTemplate.update(sql.toString(), params.toArray());
        }

        if (passwordChanged) {
            revokeUserSessions(id);
        }

        if (request.getRoleIds() != null) {
            replaceRoles(id, request.getRoleIds());
        }

        if (request.hasBranchIds()) {
            Long primaryBranchId = request.getBranchId() != null ? request.getBranchId() : findPrimaryBranchId(id);
            replaceBranches(id, primaryBranchId, request.getBranchIds());
        } else if (request.getBranchId() != null) {
            ensureAssignedBranch(id, request.getBranchId(), true);
        }

        if (request.getPermissionIds() != null) {
            replacePermissions(id, request.getPermissionIds());
        }

        return findResponseById(id);
    }

    public UserAdminResponse deactivate(Long id) {
        assertCanManageUsers();
        assertUserExists(id);

        jdbcTemplate.update(
                """
                UPDATE users
                SET status = 'INACTIVE'
                WHERE id = ?
                """,
                id
        );

        return findResponseById(id);
    }

    public UserAdminResponse updateRoles(Long userId, UpdateUserRolesRequest request) {
        assertCanManageRoles();
        assertUserExists(userId);
        assertIdsExist("roles", request.getRoleIds());
        assertAssignableRoles(request.getRoleIds());

        replaceRoles(userId, request.getRoleIds());

        return findResponseById(userId);
    }

    public UserAdminResponse updatePermissions(Long userId, UpdateUserPermissionsRequest request) {
        assertCanManageRoles();
        assertUserExists(userId);
        assertIdsExist("permissions", request.getPermissionIds());

        replacePermissions(userId, request.getPermissionIds());

        return findResponseById(userId);
    }

    @Transactional(readOnly = true)
    public List<RoleResponse> findRoles() {
        assertCanManageUsers();

        return jdbcTemplate.query(
                """
                SELECT id, code, name
                FROM roles
                WHERE code <> 'SUPPORT_TECH'
                ORDER BY code
                """,
                (rs, rowNum) -> new RoleResponse(
                        rs.getLong("id"),
                        rs.getString("code"),
                        rs.getString("name"),
                        findRolePermissions(rs.getLong("id"))
                )
        );
    }

    public RoleResponse createRole(SaveRoleRequest request) {
        assertCanManageRoles();

        String code = normalizeRoleCode(request.getCode());
        String name = cleanRequired(request.getName());

        assertRoleCodeAvailable(code, null);
        assertIdsExist("permissions", request.getPermissionIds());

        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO roles (code, name) VALUES (?, ?)",
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setString(1, code);
            ps.setString(2, name);
            return ps;
        }, keyHolder);

        Long roleId = keyHolder.getKey().longValue();
        replaceRolePermissions(roleId, request.getPermissionIds());

        return findRoleById(roleId);
    }

    public RoleResponse updateRole(Long id, SaveRoleRequest request) {
        assertCanManageRoles();
        assertEditableRole(id);

        String code = normalizeRoleCode(request.getCode());
        String name = cleanRequired(request.getName());

        assertRoleCodeAvailable(code, id);
        assertIdsExist("permissions", request.getPermissionIds());

        jdbcTemplate.update(
                "UPDATE roles SET code = ?, name = ? WHERE id = ?",
                code,
                name,
                id
        );

        if (request.getPermissionIds() != null) {
            replaceRolePermissions(id, request.getPermissionIds());
        }

        return findRoleById(id);
    }

    public RoleResponse updateRolePermissions(Long id, SaveRoleRequest request) {
        assertCanManageRoles();
        assertEditableRole(id);
        assertIdsExist("permissions", request.getPermissionIds());
        replaceRolePermissions(id, request.getPermissionIds());
        return findRoleById(id);
    }

    @Transactional(readOnly = true)
    public List<PermissionResponse> findPermissions() {
        assertCanManageUsers();

        return jdbcTemplate.query(
                """
                SELECT id, code, name
                FROM permissions
                ORDER BY code
                """,
                (rs, rowNum) -> new PermissionResponse(
                        rs.getLong("id"),
                        rs.getString("code"),
                        rs.getString("name")
                )
        );
    }

    private UserAdminResponse findResponseById(Long id) {
        UserRow user = jdbcTemplate.queryForObject(
                """
                SELECT
                    u.id,
                    u.branch_id,
                    b.code AS branch_code,
                    b.name AS branch_name,
                    u.name,
                    u.email,
                    u.phone,
                    u.status,
                    u.password_change_required,
                    u.created_at,
                    u.updated_at
                FROM users u
                JOIN branches b ON b.id = u.branch_id
                WHERE u.id = ?
                """,
                (rs, rowNum) -> new UserRow(
                        rs.getLong("id"),
                        rs.getLong("branch_id"),
                        rs.getString("branch_code"),
                        rs.getString("branch_name"),
                        rs.getString("name"),
                        rs.getString("email"),
                        rs.getString("phone"),
                        rs.getString("status"),
                        rs.getBoolean("password_change_required"),
                        rs.getTimestamp("created_at").toLocalDateTime(),
                        rs.getTimestamp("updated_at").toLocalDateTime()
                ),
                id
        );

        if (user == null) {
            throw new IllegalArgumentException("Usuario no encontrado con id: " + id);
        }

        return new UserAdminResponse(
                user.id(),
                user.branchId(),
                user.branchCode(),
                user.branchName(),
                user.name(),
                user.email(),
                user.phone(),
                user.status(),
                user.passwordChangeRequired(),
                user.createdAt(),
                user.updatedAt(),
                findUserBranches(id),
                findUserRoles(id),
                findDirectPermissions(id),
                findEffectivePermissions(id)
        );
    }

    private List<UserAdminResponse.BranchInfo> findUserBranches(Long userId) {
        return jdbcTemplate.query(
                """
                SELECT b.id, b.code, b.name, ub.is_primary
                FROM user_branches ub
                JOIN branches b ON b.id = ub.branch_id
                WHERE ub.user_id = ?
                ORDER BY ub.is_primary DESC, b.name
                """,
                (rs, rowNum) -> new UserAdminResponse.BranchInfo(
                        rs.getLong("id"),
                        rs.getString("code"),
                        rs.getString("name"),
                        rs.getBoolean("is_primary")
                ),
                userId
        );
    }

    private List<UserAdminResponse.RoleInfo> findUserRoles(Long userId) {
        return jdbcTemplate.query(
                """
                SELECT r.id, r.code, r.name
                FROM user_roles ur
                JOIN roles r ON r.id = ur.role_id
                WHERE ur.user_id = ?
                ORDER BY r.code
                """,
                (rs, rowNum) -> new UserAdminResponse.RoleInfo(
                        rs.getLong("id"),
                        rs.getString("code"),
                        rs.getString("name")
                ),
                userId
        );
    }

    private List<UserAdminResponse.PermissionInfo> findDirectPermissions(Long userId) {
        return jdbcTemplate.query(
                """
                SELECT p.id, p.code, p.name
                FROM user_permissions up
                JOIN permissions p ON p.id = up.permission_id
                WHERE up.user_id = ?
                ORDER BY p.code
                """,
                (rs, rowNum) -> new UserAdminResponse.PermissionInfo(
                        rs.getLong("id"),
                        rs.getString("code"),
                        rs.getString("name")
                ),
                userId
        );
    }

    private List<UserAdminResponse.PermissionInfo> findEffectivePermissions(Long userId) {
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
                (rs, rowNum) -> new UserAdminResponse.PermissionInfo(
                        rs.getLong("id"),
                        rs.getString("code"),
                        rs.getString("name")
                ),
                userId,
                userId
        );
    }

    private RoleResponse findRoleById(Long roleId) {
        RoleResponse role = jdbcTemplate.queryForObject(
                """
                SELECT id, code, name
                FROM roles
                WHERE id = ?
                  AND code <> 'SUPPORT_TECH'
                """,
                (rs, rowNum) -> new RoleResponse(
                        rs.getLong("id"),
                        rs.getString("code"),
                        rs.getString("name"),
                        findRolePermissions(rs.getLong("id"))
                ),
                roleId
        );

        if (role == null) {
            throw new IllegalArgumentException("Rol no encontrado");
        }

        return role;
    }

    private List<PermissionResponse> findRolePermissions(Long roleId) {
        return jdbcTemplate.query(
                """
                SELECT p.id, p.code, p.name
                FROM role_permissions rp
                JOIN permissions p ON p.id = rp.permission_id
                WHERE rp.role_id = ?
                ORDER BY p.code
                """,
                (rs, rowNum) -> new PermissionResponse(
                        rs.getLong("id"),
                        rs.getString("code"),
                        rs.getString("name")
                ),
                roleId
        );
    }

    private void replaceRoles(Long userId, List<Long> roleIds) {
        jdbcTemplate.update("DELETE FROM user_roles WHERE user_id = ?", userId);

        for (Long roleId : normalizeIds(roleIds)) {
            jdbcTemplate.update(
                    """
                    INSERT INTO user_roles (user_id, role_id)
                    VALUES (?, ?)
                    """,
                    userId,
                    roleId
            );
        }
    }

    private void replacePermissions(Long userId, List<Long> permissionIds) {
        jdbcTemplate.update("DELETE FROM user_permissions WHERE user_id = ?", userId);

        for (Long permissionId : normalizeIds(permissionIds)) {
            jdbcTemplate.update(
                    """
                    INSERT INTO user_permissions (user_id, permission_id)
                    VALUES (?, ?)
                    """,
                    userId,
                    permissionId
            );
        }
    }

    private void revokeUserSessions(Long userId) {
        jdbcTemplate.update(
                """
                UPDATE user_api_sessions
                SET revoked_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
                  AND revoked_at IS NULL
                """,
                userId
        );
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

    private void replaceBranches(Long userId, Long primaryBranchId, List<Long> branchIds) {
        List<Long> normalized = normalizeIds(branchIds);

        if (primaryBranchId != null && !normalized.contains(primaryBranchId)) {
            normalized = new ArrayList<>(normalized);
            normalized.add(0, primaryBranchId);
        }

        jdbcTemplate.update("DELETE FROM user_branches WHERE user_id = ?", userId);

        for (Long branchId : normalizeIds(normalized)) {
            jdbcTemplate.update(
                    """
                    INSERT INTO user_branches (user_id, branch_id, is_primary)
                    VALUES (?, ?, ?)
                    """,
                    userId,
                    branchId,
                    branchId.equals(primaryBranchId) ? 1 : 0
            );
        }
    }

    private void replaceRolePermissions(Long roleId, List<Long> permissionIds) {
        jdbcTemplate.update("DELETE FROM role_permissions WHERE role_id = ?", roleId);

        for (Long permissionId : normalizeIds(permissionIds)) {
            jdbcTemplate.update(
                    """
                    INSERT INTO role_permissions (role_id, permission_id)
                    VALUES (?, ?)
                    """,
                    roleId,
                    permissionId
            );
        }
    }

    private void ensureAssignedBranch(Long userId, Long branchId, boolean primary) {
        if (primary) {
            jdbcTemplate.update(
                    "UPDATE user_branches SET is_primary = 0 WHERE user_id = ?",
                    userId
            );
        }

        jdbcTemplate.update(
                """
                INSERT INTO user_branches (user_id, branch_id, is_primary)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE is_primary = VALUES(is_primary)
                """,
                userId,
                branchId,
                primary ? 1 : 0
        );
    }

    private Long findPrimaryBranchId(Long userId) {
        return jdbcTemplate.queryForObject(
                "SELECT branch_id FROM users WHERE id = ?",
                Long.class,
                userId
        );
    }

    private List<Long> normalizeIds(List<Long> ids) {
        if (ids == null) {
            return List.of();
        }

        Set<Long> normalized = new LinkedHashSet<>();

        for (Long id : ids) {
            if (id != null) {
                normalized.add(id);
            }
        }

        return normalized.stream().toList();
    }

    private void assertCanManageUsers() {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.MANAGE_USERS);
    }

    private void assertCanManageRoles() {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.MANAGE_ROLES);
    }

    private void assertUserExists(Long userId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE id = ?",
                Integer.class,
                userId
        );

        if (count == null || count == 0) {
            throw new IllegalArgumentException("Usuario no encontrado con id: " + userId);
        }
    }

    private void assertBranchExists(Long branchId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM branches WHERE id = ?",
                Integer.class,
                branchId
        );

        if (count == null || count == 0) {
            throw new IllegalArgumentException("Sucursal no encontrada con id: " + branchId);
        }
    }

    private void assertEmailAvailable(String email, Long currentUserId) {
        String cleanedEmail = cleanRequired(email).toLowerCase();

        Integer count;

        if (currentUserId == null) {
            count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM users WHERE email = ?",
                    Integer.class,
                    cleanedEmail
            );
        } else {
            count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM users WHERE email = ? AND id <> ?",
                    Integer.class,
                    cleanedEmail,
                    currentUserId
            );
        }

        if (count != null && count > 0) {
            throw new IllegalArgumentException("Ya existe un usuario con ese email");
        }
    }

    private void assertIdsExist(String tableName, List<Long> ids) {
        List<Long> normalized = normalizeIds(ids);

        if (normalized.isEmpty()) {
            return;
        }

        for (Long id : normalized) {
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM " + tableName + " WHERE id = ?",
                    Integer.class,
                    id
            );

            if (count == null || count == 0) {
                throw new IllegalArgumentException("No existe registro en " + tableName + " con id: " + id);
            }
        }
    }

    private void assertAssignableRoles(List<Long> roleIds) {
        for (Long id : normalizeIds(roleIds)) {
            String code = jdbcTemplate.queryForObject(
                    "SELECT code FROM roles WHERE id = ?",
                    String.class,
                    id
            );

            if ("SUPPORT_TECH".equals(code) && !currentUserHasRole("SUPPORT_TECH")) {
                throw new IllegalArgumentException("El rol de soporte tecnico solo se asigna por soporte");
            }
        }
    }

    private void assertEditableRole(Long roleId) {
        String code = jdbcTemplate.queryForObject(
                "SELECT code FROM roles WHERE id = ?",
                String.class,
                roleId
        );

        if (code == null) {
            throw new IllegalArgumentException("Rol no encontrado");
        }

        if ("SUPPORT_TECH".equals(code)) {
            throw new IllegalArgumentException("El rol de soporte tecnico no se edita desde la aplicacion");
        }
    }

    private void assertRoleCodeAvailable(String code, Long currentRoleId) {
        Integer count;

        if (currentRoleId == null) {
            count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM roles WHERE code = ?",
                    Integer.class,
                    code
            );
        } else {
            count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM roles WHERE code = ? AND id <> ?",
                    Integer.class,
                    code,
                    currentRoleId
            );
        }

        if (count != null && count > 0) {
            throw new IllegalArgumentException("Ya existe un rol con ese código");
        }
    }

    private boolean currentUserHasRole(String roleCode) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM user_roles ur
                JOIN roles r ON r.id = ur.role_id
                WHERE ur.user_id = ?
                  AND r.code = ?
                """,
                Integer.class,
                currentUser.getUserId(),
                roleCode
        );

        return count != null && count > 0;
    }

    private void validateStatus(String status) {
        if (status == null || status.isBlank()) {
            return;
        }

        String normalized = status.trim().toUpperCase();

        if (!"ACTIVE".equals(normalized) && !"INACTIVE".equals(normalized)) {
            throw new IllegalArgumentException("status debe ser ACTIVE o INACTIVE");
        }
    }

    private String cleanRequired(String value) {
        if (value == null || value.trim().isBlank()) {
            throw new IllegalArgumentException("Valor obligatorio vacío");
        }

        return value.trim();
    }

    private String normalizeRoleCode(String value) {
        String code = cleanRequired(value).trim().toUpperCase().replaceAll("[^A-Z0-9_]", "_");

        if (code.length() > 64) {
            throw new IllegalArgumentException("El código del rol no puede exceder 64 caracteres");
        }

        if (code.isBlank()) {
            throw new IllegalArgumentException("Código de rol obligatorio");
        }

        if ("SUPPORT_TECH".equals(code)) {
            throw new IllegalArgumentException("El rol de soporte tecnico esta reservado");
        }

        return code;
    }

    private String cleanNullable(String value) {
        if (value == null) {
            return null;
        }

        String cleaned = value.trim();
        return cleaned.isBlank() ? null : cleaned;
    }

    private String toPasswordHash(String password) {
        String cleanPassword = cleanRequired(password);
        securitySettingsService.assertPasswordPolicy(cleanPassword);
        return "{noop}" + cleanPassword;
    }

    private record UserRow(
            Long id,
            Long branchId,
            String branchCode,
            String branchName,
            String name,
            String email,
            String phone,
            String status,
            Boolean passwordChangeRequired,
            java.time.LocalDateTime createdAt,
            java.time.LocalDateTime updatedAt
    ) {
    }
}
