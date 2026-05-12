package com.hpsqsoft.ctrlropa.dashboard;

import com.hpsqsoft.ctrlropa.branch.Branch;
import com.hpsqsoft.ctrlropa.branch.BranchRepository;
import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class SellerDashboardService {

    private final JdbcTemplate jdbcTemplate;
    private final BranchRepository branchRepository;
    private final AccessService accessService;
    private final CurrentUser currentUser;

    public SellerDashboardService(JdbcTemplate jdbcTemplate,
                                  BranchRepository branchRepository,
                                  AccessService accessService,
                                  CurrentUser currentUser) {
        this.jdbcTemplate = jdbcTemplate;
        this.branchRepository = branchRepository;
        this.accessService = accessService;
        this.currentUser = currentUser;
    }

    public SellerDashboardResponse getSellerDashboard(Long branchId) {
        Long userId = currentUser.getUserId();

        accessService.assertCan(userId, PermissionCode.VIEW_INVENTORY);

        if (branchId == null) {
            throw new IllegalArgumentException("branchId es obligatorio");
        }

        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new IllegalArgumentException("Sucursal no encontrada"));

        LocalDate date = LocalDate.now();
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.plusDays(1).atStartOfDay();

        BigDecimal todaySales = queryAmount(
                """
                SELECT COALESCE(SUM(price), 0)
                FROM sales
                WHERE branch_id = ?
                  AND status = 'ACTIVE'
                  AND created_at >= ?
                  AND created_at < ?
                """,
                branchId,
                start,
                end
        );

        BigDecimal todayReservations = queryAmount(
                """
                SELECT COALESCE(SUM(price), 0)
                FROM reservations
                WHERE branch_id = ?
                  AND status = 'ACTIVE'
                  AND created_at >= ?
                  AND created_at < ?
                """,
                branchId,
                start,
                end
        );

        BigDecimal todayPayments = queryAmount(
                """
                SELECT COALESCE(SUM(received_amount), 0)
                FROM payments
                WHERE branch_id = ?
                  AND status = 'ACTIVE'
                  AND created_at >= ?
                  AND created_at < ?
                """,
                branchId,
                start,
                end
        );

        BigDecimal todayCash = queryAmount(
                """
                SELECT COALESCE(SUM(p.received_amount), 0)
                FROM payments p
                JOIN payment_methods pm ON pm.id = p.payment_method_id
                WHERE p.branch_id = ?
                  AND p.status = 'ACTIVE'
                  AND pm.code = 'CASH'
                  AND p.created_at >= ?
                  AND p.created_at < ?
                """,
                branchId,
                start,
                end
        );

        BigDecimal pendingCollections = queryAmount(
                """
                SELECT COALESCE(SUM(x.pending), 0)
                FROM (
                    SELECT
                        s.id,
                        GREATEST(
                            s.price - COALESCE(SUM(CASE WHEN p.status = 'ACTIVE' THEN pa.amount ELSE 0 END), 0),
                            0
                        ) AS pending
                    FROM sales s
                    LEFT JOIN payment_allocations pa ON pa.sale_id = s.id
                    LEFT JOIN payments p ON p.id = pa.payment_id
                    WHERE s.branch_id = ?
                      AND s.status = 'ACTIVE'
                    GROUP BY s.id, s.price

                    UNION ALL

                    SELECT
                        r.id,
                        GREATEST(
                            r.price - COALESCE(SUM(CASE WHEN p.status = 'ACTIVE' THEN pa.amount ELSE 0 END), 0),
                            0
                        ) AS pending
                    FROM reservations r
                    LEFT JOIN payment_allocations pa ON pa.reservation_id = r.id
                    LEFT JOIN payments p ON p.id = pa.payment_id
                    WHERE r.branch_id = ?
                      AND r.status = 'ACTIVE'
                    GROUP BY r.id, r.price
                ) x
                """,
                branchId,
                branchId
        );

        Integer salesCount = queryCount(
                """
                SELECT COUNT(*)
                FROM sales
                WHERE branch_id = ?
                  AND status = 'ACTIVE'
                  AND created_at >= ?
                  AND created_at < ?
                """,
                branchId,
                start,
                end
        );

        Integer reservationsCount = queryCount(
                """
                SELECT COUNT(*)
                FROM reservations
                WHERE branch_id = ?
                  AND status = 'ACTIVE'
                  AND created_at >= ?
                  AND created_at < ?
                """,
                branchId,
                start,
                end
        );

        Integer paymentsCount = queryCount(
                """
                SELECT COUNT(*)
                FROM payments
                WHERE branch_id = ?
                  AND status = 'ACTIVE'
                  AND created_at >= ?
                  AND created_at < ?
                """,
                branchId,
                start,
                end
        );

        Integer pendingPackages = queryCount(
                """
                SELECT COUNT(*)
                FROM customer_packages
                WHERE branch_id = ?
                  AND status IN ('OPEN', 'READY')
                """,
                branchId
        );

        Integer pendingShipments = queryCount(
                """
                SELECT COUNT(*)
                FROM shipments
                WHERE branch_id = ?
                  AND status IN ('CREATED', 'OUT_FOR_DELIVERY')
                """,
                branchId
        );

        Integer liveReservations = queryCount(
                """
                SELECT COUNT(*)
                FROM reservations r
                JOIN sales_channels sc ON sc.id = r.sales_channel_id
                WHERE r.branch_id = ?
                  AND r.status = 'ACTIVE'
                  AND sc.code = 'LIVE'
                """,
                branchId
        );

        Integer lowStockItems = queryCount(
                """
                SELECT COUNT(*)
                FROM items
                WHERE branch_id = ?
                  AND status = 'AVAILABLE'
                """,
                branchId
        );

        List<SellerDashboardResponse.ActionItem> actionItems = buildActionItems(
                pendingPackages,
                pendingShipments,
                liveReservations,
                pendingCollections
        );

        return new SellerDashboardResponse(
                date,
                branch.getId(),
                branch.getCode(),
                branch.getName(),
                todaySales,
                todayReservations,
                todayPayments,
                todayCash,
                pendingCollections,
                salesCount,
                reservationsCount,
                paymentsCount,
                pendingPackages,
                pendingShipments,
                liveReservations,
                lowStockItems,
                actionItems
        );
    }

    private List<SellerDashboardResponse.ActionItem> buildActionItems(Integer pendingPackages,
                                                                      Integer pendingShipments,
                                                                      Integer liveReservations,
                                                                      BigDecimal pendingCollections) {
        List<SellerDashboardResponse.ActionItem> items = new ArrayList<>();

        if (pendingPackages != null && pendingPackages > 0) {
            items.add(new SellerDashboardResponse.ActionItem(
                    "PENDING_PACKAGES",
                    "Paquetes pendientes",
                    pendingPackages,
                    "WARNING"
            ));
        }

        if (pendingShipments != null && pendingShipments > 0) {
            items.add(new SellerDashboardResponse.ActionItem(
                    "PENDING_SHIPMENTS",
                    "Envíos pendientes",
                    pendingShipments,
                    "WARNING"
            ));
        }

        if (liveReservations != null && liveReservations > 0) {
            items.add(new SellerDashboardResponse.ActionItem(
                    "LIVE_RESERVATIONS",
                    "Reservas live activas",
                    liveReservations,
                    "INFO"
            ));
        }

        if (pendingCollections != null && pendingCollections.compareTo(BigDecimal.ZERO) > 0) {
            items.add(new SellerDashboardResponse.ActionItem(
                    "PENDING_COLLECTIONS",
                    "Cobros pendientes",
                    1,
                    "DANGER"
            ));
        }

        return items;
    }

    private BigDecimal queryAmount(String sql, Object... params) {
        BigDecimal value = jdbcTemplate.queryForObject(sql, BigDecimal.class, params);
        return value == null ? BigDecimal.ZERO : value;
    }

    private Integer queryCount(String sql, Object... params) {
        Integer value = jdbcTemplate.queryForObject(sql, Integer.class, params);
        return value == null ? 0 : value;
    }
}