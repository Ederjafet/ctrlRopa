package com.hpsqsoft.ctrlropa.operation;

import com.hpsqsoft.ctrlropa.security.access.ChannelCode;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class OperationMenuService {

    private final JdbcTemplate jdbcTemplate;
    private final CurrentUser currentUser;

    public OperationMenuService(JdbcTemplate jdbcTemplate,
                                CurrentUser currentUser) {
        this.jdbcTemplate = jdbcTemplate;
        this.currentUser = currentUser;
    }

    public OperationMenuResponse getMenu() {
        Long userId = currentUser.getUserId();
        UserBranchRow user = findUserBranch(userId);

        List<OperationMenuResponse.MenuModule> modules = new ArrayList<>();

        modules.add(permissionOnly("CUSTOMERS", "Clientes", userId, PermissionCode.VIEW_INVENTORY));
        modules.add(permissionOnly("INVENTORY", "Inventario", userId, PermissionCode.VIEW_INVENTORY));

        modules.add(permissionAndChannel(
                "LIVE",
                "Live",
                userId,
                user.branchId(),
                PermissionCode.DO_LIVE_RESERVATION,
                ChannelCode.LIVE
        ));

        modules.add(permissionAndChannel(
                "DOOR_SALE",
                "Venta puerta",
                userId,
                user.branchId(),
                PermissionCode.DO_DOOR_SALE,
                ChannelCode.DOOR_SALE
        ));

        modules.add(permissionAndChannel(
                "DOOR_RESERVATION",
                "Apartado puerta",
                userId,
                user.branchId(),
                PermissionCode.DO_DOOR_RESERVATION,
                ChannelCode.DOOR_RESERVATION
        ));

        modules.add(permissionOnly("PAYMENTS", "Pagos", userId, PermissionCode.REGISTER_PAYMENTS));
        modules.add(permissionOnly("BALANCE", "Saldo a favor", userId, PermissionCode.APPLY_CUSTOMER_BALANCE));
        modules.add(permissionOnly("PACKAGES", "Paquetes", userId, PermissionCode.CREATE_CLOSE_CUSTOMER_PACKAGE));
        modules.add(permissionOnly("SHIPMENTS", "Envíos", userId, PermissionCode.MANAGE_SHIPMENTS));

        modules.add(permissionOnly("TRANSFERS", "Transferencias", userId, PermissionCode.MANAGE_TRANSFERS));

        modules.add(permissionAndChannel(
                "CONSIGNMENTS",
                "Consignaciones",
                userId,
                user.branchId(),
                PermissionCode.MANAGE_CONSIGNMENTS,
                ChannelCode.CONSIGNMENT
        ));

        modules.add(permissionOnly("REPORTS", "Reportes", userId, PermissionCode.VIEW_REPORTS));
        modules.add(permissionOnly("USERS", "Usuarios", userId, PermissionCode.MANAGE_USERS));
        modules.add(permissionOnly("ROLES", "Roles y permisos", userId, PermissionCode.MANAGE_ROLES));
        modules.add(permissionOnly("BRANDING", "Apariencia / Branding", userId, PermissionCode.MANAGE_BRANDING));

        return new OperationMenuResponse(
                userId,
                user.branchId(),
                user.branchCode(),
                user.branchName(),
                modules
        );
    }

    private OperationMenuResponse.MenuModule permissionOnly(String code,
                                                            String name,
                                                            Long userId,
                                                            String permissionCode) {
        boolean hasPermission = hasPermission(userId, permissionCode);

        return new OperationMenuResponse.MenuModule(
                code,
                name,
                hasPermission,
                hasPermission ? null : "Permiso requerido: " + permissionCode
        );
    }

    private OperationMenuResponse.MenuModule permissionAndChannel(String code,
                                                                  String name,
                                                                  Long userId,
                                                                  Long branchId,
                                                                  String permissionCode,
                                                                  String channelCode) {
        boolean hasPermission = hasPermission(userId, permissionCode);
        boolean channelEnabled = isChannelEnabled(branchId, channelCode);

        boolean enabled = hasPermission && channelEnabled;

        String reason = null;

        if (!hasPermission) {
            reason = "Permiso requerido: " + permissionCode;
        } else if (!channelEnabled) {
            reason = "Canal deshabilitado: " + channelCode;
        }

        return new OperationMenuResponse.MenuModule(
                code,
                name,
                enabled,
                reason
        );
    }

    private UserBranchRow findUserBranch(Long userId) {
        return jdbcTemplate.queryForObject(
                """
                SELECT
                    u.id AS user_id,
                    u.branch_id AS branch_id,
                    b.code AS branch_code,
                    b.name AS branch_name
                FROM users u
                JOIN branches b ON b.id = u.branch_id
                WHERE u.id = ?
                  AND u.status = 'ACTIVE'
                """,
                (rs, rowNum) -> new UserBranchRow(
                        rs.getLong("user_id"),
                        rs.getLong("branch_id"),
                        rs.getString("branch_code"),
                        rs.getString("branch_name")
                ),
                userId
        );
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

    private boolean isChannelEnabled(Long branchId, String channelCode) {
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

        return count != null && count > 0;
    }

    private record UserBranchRow(
            Long userId,
            Long branchId,
            String branchCode,
            String branchName
    ) {
    }
}
