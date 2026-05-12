package com.hpsqsoft.ctrlropa.catalog;

import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import org.springframework.jdbc.core.JdbcTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class CatalogBootstrapService {

    private static final Logger log = LoggerFactory.getLogger(CatalogBootstrapService.class);

    private final JdbcTemplate jdbcTemplate;
    private final AccessService accessService;
    private final CurrentUser currentUser;

    public CatalogBootstrapService(JdbcTemplate jdbcTemplate,
                                   AccessService accessService,
                                   CurrentUser currentUser) {
        this.jdbcTemplate = jdbcTemplate;
        this.accessService = accessService;
        this.currentUser = currentUser;
    }

    public CatalogBootstrapResponse getBootstrap(Long branchId) {
        boolean canManageUsers = canManageUsers();

        return new CatalogBootstrapResponse(
                findActiveSimpleCatalog("branches", "name"),
                findActiveSimpleCatalog("sales_channels", "code"),
                findActiveSimpleCatalog("payment_methods", "code"),
                canManageUsers ? findSimpleCatalog("roles", "code") : new ArrayList<>(),
                canManageUsers ? findSimpleCatalog("permissions", "code") : new ArrayList<>(),
                findActiveSimpleCatalog("product_types", "name"),
                findActiveSimpleCatalog("brands", "name"),
                findActiveSimpleCatalog("sizes", "sort_order, name"),
                findStorageLocations(branchId),
                findBoxes(branchId)
        );
    }

    private List<CatalogBootstrapResponse.SimpleCatalog> findActiveSimpleCatalog(String tableName, String orderBy) {
        try {
            return jdbcTemplate.query(
                    "SELECT id, code, name FROM " + tableName + " WHERE status = 'ACTIVE' ORDER BY " + orderBy,
                    (rs, rowNum) -> new CatalogBootstrapResponse.SimpleCatalog(
                            rs.getLong("id"),
                            rs.getString("code"),
                            rs.getString("name")
                    )
            );
        } catch (Exception ex) {
            log.warn("No se pudo cargar catalogo {} para bootstrap", tableName, ex);
            return new ArrayList<>();
        }
    }

    private List<CatalogBootstrapResponse.SimpleCatalog> findSimpleCatalog(String tableName, String orderBy) {
        try {
            return jdbcTemplate.query(
                    "SELECT id, code, name FROM " + tableName + " ORDER BY " + orderBy,
                    (rs, rowNum) -> new CatalogBootstrapResponse.SimpleCatalog(
                            rs.getLong("id"),
                            rs.getString("code"),
                            rs.getString("name")
                    )
            );
        } catch (Exception ex) {
            log.warn("No se pudo cargar catalogo {} para bootstrap", tableName, ex);
            return new ArrayList<>();
        }
    }

    private List<CatalogBootstrapResponse.SimpleCatalog> findStorageLocations(Long branchId) {
        try {
            if (branchId != null) {
                return jdbcTemplate.query(
                        """
                        SELECT id, code, name
                        FROM storage_locations
                        WHERE status = 'ACTIVE'
                          AND branch_id = ?
                        ORDER BY name
                        """,
                        (rs, rowNum) -> new CatalogBootstrapResponse.SimpleCatalog(
                                rs.getLong("id"),
                                rs.getString("code"),
                                rs.getString("name")
                        ),
                        branchId
                );
            }

            return jdbcTemplate.query(
                    """
                    SELECT sl.id, sl.code, CONCAT(b.code, ' - ', sl.name) AS name
                    FROM storage_locations sl
                    JOIN branches b ON b.id = sl.branch_id
                    WHERE sl.status = 'ACTIVE'
                    ORDER BY b.code, sl.name
                    """,
                    (rs, rowNum) -> new CatalogBootstrapResponse.SimpleCatalog(
                            rs.getLong("id"),
                            rs.getString("code"),
                            rs.getString("name")
                    )
            );
        } catch (Exception ex) {
            log.warn("No se pudieron cargar ubicaciones para bootstrap. branchId={}", branchId, ex);
            return new ArrayList<>();
        }
    }

    private List<CatalogBootstrapResponse.SimpleCatalog> findBoxes(Long branchId) {
        try {
            if (branchId != null) {
                return jdbcTemplate.query(
                        """
                        SELECT id, code, description AS name
                        FROM boxes
                        WHERE status = 'ACTIVE'
                          AND branch_id = ?
                        ORDER BY code
                        """,
                        (rs, rowNum) -> new CatalogBootstrapResponse.SimpleCatalog(
                                rs.getLong("id"),
                                rs.getString("code"),
                                rs.getString("name")
                        ),
                        branchId
                );
            }

            return jdbcTemplate.query(
                    """
                    SELECT bx.id, bx.code, CONCAT(b.code, ' - ', bx.description) AS name
                    FROM boxes bx
                    JOIN branches b ON b.id = bx.branch_id
                    WHERE bx.status = 'ACTIVE'
                    ORDER BY b.code, bx.code
                    """,
                    (rs, rowNum) -> new CatalogBootstrapResponse.SimpleCatalog(
                            rs.getLong("id"),
                            rs.getString("code"),
                            rs.getString("name")
                    )
            );
        } catch (Exception ex) {
            log.warn("No se pudieron cargar cajas para bootstrap. branchId={}", branchId, ex);
            return new ArrayList<>();
        }
    }

    private boolean canManageUsers() {
        try {
            accessService.assertCan(currentUser.getUserId(), PermissionCode.MANAGE_USERS);
            return true;
        } catch (Exception ex) {
            return false;
        }
    }
}
