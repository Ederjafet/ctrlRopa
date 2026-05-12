package com.hpsqsoft.ctrlropa.security.me;

import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class MeService {

    private final JdbcTemplate jdbcTemplate;
    private final CurrentUser currentUser;

    public MeService(JdbcTemplate jdbcTemplate, CurrentUser currentUser) {
        this.jdbcTemplate = jdbcTemplate;
        this.currentUser = currentUser;
    }

    public MeResponse getMe() {
        Long userId = currentUser.getUserId();

        MeUserRow user = findUser(userId);

        if (!"ACTIVE".equals(user.status())) {
            throw new AccessDeniedException("Usuario inactivo");
        }

        MeResponse.BranchInfo branch = findBranch(user.branchId());
        List<MeResponse.RoleInfo> roles = findRoles(userId);
        List<MeResponse.PermissionInfo> permissions = findPermissions(userId);
        List<MeResponse.ChannelInfo> channels = findChannels(user.branchId());

        return new MeResponse(
                user.id(),
                user.name(),
                user.email(),
                user.phone(),
                user.status(),
                user.passwordChangeRequired(),
                branch,
                roles,
                permissions,
                channels
        );
    }

    public List<MeResponse.PermissionInfo> getPermissions() {
        Long userId = currentUser.getUserId();
        assertActiveUser(userId);
        return findPermissions(userId);
    }

    public List<MeResponse.ChannelInfo> getChannels() {
        Long userId = currentUser.getUserId();
        MeUserRow user = findUser(userId);

        if (!"ACTIVE".equals(user.status())) {
            throw new AccessDeniedException("Usuario inactivo");
        }

        return findChannels(user.branchId());
    }

    private void assertActiveUser(Long userId) {
        MeUserRow user = findUser(userId);

        if (!"ACTIVE".equals(user.status())) {
            throw new AccessDeniedException("Usuario inactivo");
        }
    }

    private MeUserRow findUser(Long userId) {
        return jdbcTemplate.queryForObject(
                """
                SELECT id, branch_id, name, email, phone, status, password_change_required
                FROM users
                WHERE id = ?
                """,
                (rs, rowNum) -> new MeUserRow(
                        rs.getLong("id"),
                        rs.getLong("branch_id"),
                        rs.getString("name"),
                        rs.getString("email"),
                        rs.getString("phone"),
                        rs.getString("status"),
                        rs.getBoolean("password_change_required")
                ),
                userId
        );
    }

    private MeResponse.BranchInfo findBranch(Long branchId) {
        return jdbcTemplate.queryForObject(
                """
                SELECT id, code, name, status
                FROM branches
                WHERE id = ?
                """,
                (rs, rowNum) -> new MeResponse.BranchInfo(
                        rs.getLong("id"),
                        rs.getString("code"),
                        rs.getString("name"),
                        rs.getString("status")
                ),
                branchId
        );
    }

    private List<MeResponse.RoleInfo> findRoles(Long userId) {
        return jdbcTemplate.query(
                """
                SELECT r.id, r.code, r.name
                FROM user_roles ur
                JOIN roles r ON r.id = ur.role_id
                WHERE ur.user_id = ?
                ORDER BY r.code
                """,
                (rs, rowNum) -> new MeResponse.RoleInfo(
                        rs.getLong("id"),
                        rs.getString("code"),
                        rs.getString("name")
                ),
                userId
        );
    }

    private List<MeResponse.PermissionInfo> findPermissions(Long userId) {
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
                (rs, rowNum) -> new MeResponse.PermissionInfo(
                        rs.getLong("id"),
                        rs.getString("code"),
                        rs.getString("name")
                ),
                userId,
                userId
        );
    }

    private List<MeResponse.ChannelInfo> findChannels(Long branchId) {
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
                (rs, rowNum) -> new MeResponse.ChannelInfo(
                        rs.getLong("id"),
                        rs.getString("code"),
                        rs.getString("name"),
                        rs.getString("status"),
                        rs.getBoolean("enabled")
                ),
                branchId
        );
    }

    private record MeUserRow(
            Long id,
            Long branchId,
            String name,
            String email,
            String phone,
            String status,
            Boolean passwordChangeRequired
    ) {
    }
}
