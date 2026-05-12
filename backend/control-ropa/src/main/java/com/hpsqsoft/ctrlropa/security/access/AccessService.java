package com.hpsqsoft.ctrlropa.security.access;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AccessService {

    private final JdbcTemplate jdbcTemplate;

    public AccessService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void assertCan(Long userId, String permissionCode) {
        assertUserActive(userId);
        assertHasPermission(userId, permissionCode);
    }

    public boolean can(Long userId, String permissionCode) {
        assertUserActive(userId);
        return hasPermission(userId, permissionCode);
    }

    public void assertCan(Long userId, String permissionCode, String channelCode, Long branchId) {
        assertUserActive(userId);
        assertHasPermission(userId, permissionCode);
        assertChannelEnabled(branchId, channelCode);
    }

    private void assertUserActive(Long userId) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM users
                WHERE id = ?
                  AND status = 'ACTIVE'
                """,
                Integer.class,
                userId
        );

        if (count == null || count == 0) {
            throw new AccessDeniedException("Usuario inactivo o inexistente");
        }
    }

    private void assertHasPermission(Long userId, String permissionCode) {
        if (!hasPermission(userId, permissionCode)) {
            throw new AccessDeniedException("Permiso requerido: " + permissionCode);
        }
    }

    private boolean hasPermission(Long userId, String permissionCode) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM permissions p
                WHERE p.code = ?
                  AND (
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
                  )
                """,
                Integer.class,
                permissionCode,
                userId,
                userId
        );

        return count != null && count > 0;
    }

    private void assertChannelEnabled(Long branchId, String channelCode) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM branch_sales_channels bsc
                JOIN sales_channels sc ON sc.id = bsc.sales_channel_id
                WHERE bsc.branch_id = ?
                  AND sc.code = ?
                  AND sc.status = 'ACTIVE'
                  AND sc.global_enabled = 1
                  AND bsc.is_enabled = 1
                """,
                Integer.class,
                branchId,
                channelCode
        );

        if (count == null || count == 0) {
            throw new AccessDeniedException("Canal deshabilitado para la sucursal: " + channelCode);
        }
    }
}
