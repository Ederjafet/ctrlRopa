package com.hpsqsoft.ctrlropa.dashboard;

import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Locale;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class UserDashboardService {

    private final JdbcTemplate jdbcTemplate;
    private final CurrentUser currentUser;

    public UserDashboardService(JdbcTemplate jdbcTemplate, CurrentUser currentUser) {
        this.jdbcTemplate = jdbcTemplate;
        this.currentUser = currentUser;
    }

    public UserDashboardResponse getCurrentUserDashboard() {
        Long userId = currentUser.getUserId();
        LocalDate date = LocalDate.now();
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.plusDays(1).atStartOfDay();

        List<String> roles = findRoles(userId);
        List<UserBranchRow> branches = findAssignedBranches(userId);

        List<UserDashboardResponse.BranchDashboard> branchDashboards = branches.stream()
                .map(branch -> buildBranchDashboard(branch, start, end))
                .toList();

        return new UserDashboardResponse(date, roles, branchDashboards);
    }

    public DashboardMetricDetailResponse getMetricDetail(Long branchId, String metric) {
        Long userId = currentUser.getUserId();
        boolean assigned = findAssignedBranches(userId).stream()
                .anyMatch(branch -> branch.branchId().equals(branchId));

        if (!assigned) {
            throw new IllegalArgumentException("No tienes acceso a la sucursal solicitada.");
        }

        String normalizedMetric = metric == null ? "" : metric.trim().toUpperCase(Locale.ROOT);
        LocalDate date = LocalDate.now();
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.plusDays(1).atStartOfDay();

        return switch (normalizedMetric) {
            case "TODAY_SALES", "TODAY_SALES_COUNT", "SOLD_ITEMS_TODAY" ->
                    detail(normalizedMetric, "Ventas de hoy", salesToday(branchId, start, end));
            case "TODAY_RESERVATIONS", "TODAY_RESERVATIONS_COUNT" ->
                    detail(normalizedMetric, "Apartados de hoy", reservationsToday(branchId, start, end));
            case "TODAY_PAYMENTS" ->
                    detail(normalizedMetric, "Cobrado hoy", paymentsToday(branchId, start, end, false));
            case "TODAY_CASH" ->
                    detail(normalizedMetric, "Efectivo hoy", paymentsToday(branchId, start, end, true));
            case "PENDING_COLLECTIONS" ->
                    detail(normalizedMetric, "Pendiente por cobrar", pendingCollections(branchId));
            case "PENDING_REFUNDS" ->
                    detail(normalizedMetric, "Reembolsos pendientes", refundsPending(branchId));
            case "ACTIVE_CUSTOMERS_TODAY" ->
                    detail(normalizedMetric, "Clientes con movimiento hoy", activeCustomersToday(branchId, start, end));
            case "ACTIVE_LIVES" ->
                    detail(normalizedMetric, "Lives activas", activeLives(branchId));
            case "AVAILABLE_ITEMS" ->
                    detail(normalizedMetric, "Prendas disponibles", itemsByStatus(branchId, "AVAILABLE"));
            case "RESERVED_ITEMS" ->
                    detail(normalizedMetric, "Prendas reservadas", itemsByStatus(branchId, "RESERVED"));
            case "ANNOUNCED_BATCHES" ->
                    detail(normalizedMetric, "Lotes por recibir", batchesByStatus(branchId, "ANNOUNCED"));
            case "RECEIVED_BATCHES" ->
                    detail(normalizedMetric, "Lotes por conciliar", batchesByStatus(branchId, "RECEIVED"));
            case "PACKAGES_TO_PREPARE" ->
                    detail(normalizedMetric, "Paquetes por preparar", packagesToPrepare(branchId));
            default -> throw new IllegalArgumentException("Metrica de dashboard no soportada: " + metric);
        };
    }

    private DashboardMetricDetailResponse detail(String metric,
                                                 String title,
                                                 List<DashboardMetricDetailResponse.DetailItem> items) {
        return new DashboardMetricDetailResponse(metric, title, items);
    }

    private UserDashboardResponse.BranchDashboard buildBranchDashboard(UserBranchRow branch,
                                                                       LocalDateTime start,
                                                                       LocalDateTime end) {
        Long branchId = branch.branchId();

        BigDecimal todaySales = amount(
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

        BigDecimal todayReservations = amount(
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

        BigDecimal todayPayments = amount(
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

        BigDecimal todayCash = amount(
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

        BigDecimal pendingCollections = amount(
                """
                SELECT COALESCE(SUM(x.pending), 0)
                FROM (
                    SELECT GREATEST(s.price - COALESCE(SUM(CASE WHEN p.status = 'ACTIVE' THEN pa.amount ELSE 0 END), 0), 0) AS pending
                    FROM sales s
                    LEFT JOIN payment_allocations pa ON pa.sale_id = s.id
                    LEFT JOIN payments p ON p.id = pa.payment_id
                    WHERE s.branch_id = ?
                      AND s.status = 'ACTIVE'
                    GROUP BY s.id, s.price
                    UNION ALL
                    SELECT GREATEST(r.price - COALESCE(SUM(CASE WHEN p.status = 'ACTIVE' THEN pa.amount ELSE 0 END), 0), 0) AS pending
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

        BigDecimal pendingRefunds = amount(
                """
                SELECT COALESCE(SUM(amount), 0)
                FROM refunds
                WHERE branch_id = ?
                  AND status IN ('PENDING', 'APPROVED')
                """,
                branchId
        );

        UserDashboardResponse.MoneySummary money = new UserDashboardResponse.MoneySummary(
                todaySales,
                todayReservations,
                todayPayments,
                todayCash,
                pendingCollections,
                pendingRefunds
        );

        Integer todaySalesCount = count(
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

        Integer todayReservationsCount = count(
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

        Integer todayPaymentsCount = count(
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

        Integer activeCustomersToday = count(
                """
                SELECT COUNT(DISTINCT customer_id)
                FROM (
                    SELECT customer_id FROM sales WHERE branch_id = ? AND status = 'ACTIVE' AND created_at >= ? AND created_at < ?
                    UNION
                    SELECT customer_id FROM reservations WHERE branch_id = ? AND status = 'ACTIVE' AND created_at >= ? AND created_at < ?
                    UNION
                    SELECT customer_id FROM payments WHERE branch_id = ? AND status = 'ACTIVE' AND created_at >= ? AND created_at < ?
                ) x
                """,
                branchId,
                start,
                end,
                branchId,
                start,
                end,
                branchId,
                start,
                end
        );

        Integer activeLives = count(
                """
                SELECT COUNT(*)
                FROM lives
                WHERE branch_id = ?
                  AND status IN ('OPEN', 'ACTIVE')
                """,
                branchId
        );

        UserDashboardResponse.OperationSummary operations = new UserDashboardResponse.OperationSummary(
                todaySalesCount,
                todayReservationsCount,
                todayPaymentsCount,
                activeCustomersToday,
                activeLives
        );

        Integer availableItems = count("SELECT COUNT(*) FROM items WHERE branch_id = ? AND status = 'AVAILABLE'", branchId);
        Integer reservedItems = count("SELECT COUNT(*) FROM items WHERE branch_id = ? AND status = 'RESERVED'", branchId);
        Integer soldItemsToday = count(
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
        Integer announcedBatches = count("SELECT COUNT(*) FROM batches WHERE branch_id = ? AND status = 'ANNOUNCED'", branchId);
        Integer receivedBatches = count("SELECT COUNT(*) FROM batches WHERE branch_id = ? AND status = 'RECEIVED'", branchId);

        UserDashboardResponse.InventorySummary inventory = new UserDashboardResponse.InventorySummary(
                availableItems,
                reservedItems,
                soldItemsToday,
                announcedBatches,
                receivedBatches
        );

        Integer packagesToPrepare = count("SELECT COUNT(*) FROM customer_packages WHERE branch_id = ? AND status = 'OPEN'", branchId);
        Integer shipmentsOpen = count("SELECT COUNT(*) FROM shipments WHERE branch_id = ? AND status IN ('OPEN', 'OUT_FOR_DELIVERY')", branchId);
        Integer transfersToSend = count("SELECT COUNT(*) FROM branch_transfers WHERE from_branch_id = ? AND status = 'OPEN'", branchId);
        Integer transfersToReceive = count("SELECT COUNT(*) FROM branch_transfers WHERE to_branch_id = ? AND status = 'IN_TRANSIT'", branchId);
        Integer refundsToApprove = count("SELECT COUNT(*) FROM refunds WHERE branch_id = ? AND status = 'PENDING'", branchId);
        Integer refundsToProcess = count("SELECT COUNT(*) FROM refunds WHERE branch_id = ? AND status = 'APPROVED'", branchId);
        Integer incidentsOpen = count("SELECT COUNT(*) FROM incidents WHERE branch_id = ? AND status IN ('OPEN', 'IN_PROGRESS')", branchId);
        Integer ordersOpen = count("SELECT COUNT(*) FROM customer_orders WHERE branch_id = ? AND status IN ('OPEN', 'CONSOLIDATING', 'READY_TO_PACK')", branchId);

        UserDashboardResponse.PendingSummary pending = new UserDashboardResponse.PendingSummary(
                packagesToPrepare,
                shipmentsOpen,
                transfersToSend,
                transfersToReceive,
                refundsToApprove,
                refundsToProcess,
                incidentsOpen,
                ordersOpen
        );

        return new UserDashboardResponse.BranchDashboard(
                branch.branchId(),
                branch.branchCode(),
                branch.branchName(),
                branch.primary(),
                money,
                operations,
                inventory,
                pending,
                buildActions(pendingCollections, pending)
        );
    }

    private List<UserDashboardResponse.ActionItem> buildActions(BigDecimal pendingCollections,
                                                                UserDashboardResponse.PendingSummary pending) {
        List<UserDashboardResponse.ActionItem> actions = new ArrayList<>();

        addAction(actions, "Cobros pendientes", pendingCollections.compareTo(BigDecimal.ZERO) > 0 ? 1 : 0, "DANGER", "/payments");
        addAction(actions, "Paquetes por preparar", pending.getPackagesToPrepare(), "WARNING", "metric:PACKAGES_TO_PREPARE");
        addAction(actions, "Envíos abiertos", pending.getShipmentsOpen(), "WARNING", "/shipments");
        addAction(actions, "Transferencias por enviar", pending.getTransfersToSend(), "INFO", "/transfers");
        addAction(actions, "Transferencias por recibir", pending.getTransfersToReceive(), "INFO", "/transfers");
        addAction(actions, "Reembolsos por aprobar", pending.getRefundsToApprove(), "DANGER", "/refunds");
        addAction(actions, "Reembolsos por procesar", pending.getRefundsToProcess(), "DANGER", "/refunds");
        addAction(actions, "Incidencias abiertas", pending.getIncidentsOpen(), "WARNING", "/incidents");
        addAction(actions, "Pedidos abiertos", pending.getOrdersOpen(), "INFO", "/customer-orders");

        return actions;
    }

    private void addAction(List<UserDashboardResponse.ActionItem> actions,
                           String label,
                           Integer count,
                           String severity,
                           String route) {
        if (count != null && count > 0) {
            actions.add(new UserDashboardResponse.ActionItem(label, count, severity, route));
        }
    }

    private List<DashboardMetricDetailResponse.DetailItem> salesToday(Long branchId,
                                                                      LocalDateTime start,
                                                                      LocalDateTime end) {
        return jdbcTemplate.query(
                """
                SELECT s.id,
                       s.price,
                       s.status,
                       s.created_at,
                       c.name AS customer_name,
                       i.code AS item_code
                FROM sales s
                LEFT JOIN customers c ON c.id = s.customer_id
                LEFT JOIN items i ON i.id = s.item_id
                WHERE s.branch_id = ?
                  AND s.status = 'ACTIVE'
                  AND s.created_at >= ?
                  AND s.created_at < ?
                ORDER BY s.created_at DESC
                LIMIT 100
                """,
                (rs, rowNum) -> new DashboardMetricDetailResponse.DetailItem(
                        "Venta #" + rs.getLong("id"),
                        join("Cliente: " + safe(rs.getString("customer_name")),
                                "Prenda: " + safe(rs.getString("item_code")),
                                String.valueOf(rs.getTimestamp("created_at"))),
                        rs.getBigDecimal("price"),
                        rs.getString("status"),
                        null
                ),
                branchId,
                start,
                end
        );
    }

    private List<DashboardMetricDetailResponse.DetailItem> reservationsToday(Long branchId,
                                                                             LocalDateTime start,
                                                                             LocalDateTime end) {
        return jdbcTemplate.query(
                """
                SELECT r.id,
                       r.price,
                       r.status,
                       r.created_at,
                       r.live_id,
                       c.name AS customer_name,
                       i.code AS item_code
                FROM reservations r
                LEFT JOIN customers c ON c.id = r.customer_id
                LEFT JOIN items i ON i.id = r.item_id
                WHERE r.branch_id = ?
                  AND r.status = 'ACTIVE'
                  AND r.created_at >= ?
                  AND r.created_at < ?
                ORDER BY r.created_at DESC
                LIMIT 100
                """,
                (rs, rowNum) -> new DashboardMetricDetailResponse.DetailItem(
                        "Apartado #" + rs.getLong("id"),
                        join("Cliente: " + safe(rs.getString("customer_name")),
                                "Prenda: " + safe(rs.getString("item_code")),
                                rs.getObject("live_id") == null ? null : "Live #" + rs.getLong("live_id"),
                                String.valueOf(rs.getTimestamp("created_at"))),
                        rs.getBigDecimal("price"),
                        rs.getString("status"),
                        "/reservation-detail?id=" + rs.getLong("id") + "&returnTo=/dashboard"
                ),
                branchId,
                start,
                end
        );
    }

    private List<DashboardMetricDetailResponse.DetailItem> paymentsToday(Long branchId,
                                                                         LocalDateTime start,
                                                                         LocalDateTime end,
                                                                         boolean cashOnly) {
        String sql = """
                SELECT p.id,
                       p.received_amount,
                       p.status,
                       p.created_at,
                       p.reference,
                       pm.name AS method_name
                FROM payments p
                LEFT JOIN payment_methods pm ON pm.id = p.payment_method_id
                WHERE p.branch_id = ?
                  AND p.status = 'ACTIVE'
                  AND p.created_at >= ?
                  AND p.created_at < ?
                """;

        if (cashOnly) {
            sql += " AND pm.code = 'CASH'\n";
        }

        sql += " ORDER BY p.created_at DESC LIMIT 100";

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new DashboardMetricDetailResponse.DetailItem(
                        "Pago #" + rs.getLong("id"),
                        join("Metodo: " + safe(rs.getString("method_name")),
                                rs.getString("reference") == null ? null : "Ref: " + rs.getString("reference"),
                                String.valueOf(rs.getTimestamp("created_at"))),
                        rs.getBigDecimal("received_amount"),
                        rs.getString("status"),
                        null
                ),
                branchId,
                start,
                end
        );
    }

    private List<DashboardMetricDetailResponse.DetailItem> pendingCollections(Long branchId) {
        return jdbcTemplate.query(
                """
                SELECT *
                FROM (
                    SELECT 'Venta' AS kind,
                           s.id,
                           s.price,
                           s.status,
                           s.created_at,
                           c.name AS customer_name,
                           i.code AS item_code,
                           GREATEST(s.price - COALESCE(SUM(CASE WHEN p.status = 'ACTIVE' THEN pa.amount ELSE 0 END), 0), 0) AS pending
                    FROM sales s
                    LEFT JOIN customers c ON c.id = s.customer_id
                    LEFT JOIN items i ON i.id = s.item_id
                    LEFT JOIN payment_allocations pa ON pa.sale_id = s.id
                    LEFT JOIN payments p ON p.id = pa.payment_id
                    WHERE s.branch_id = ?
                      AND s.status = 'ACTIVE'
                    GROUP BY s.id, s.price, s.status, s.created_at, c.name, i.code
                    UNION ALL
                    SELECT 'Apartado' AS kind,
                           r.id,
                           r.price,
                           r.status,
                           r.created_at,
                           c.name AS customer_name,
                           i.code AS item_code,
                           GREATEST(r.price - COALESCE(SUM(CASE WHEN p.status = 'ACTIVE' THEN pa.amount ELSE 0 END), 0), 0) AS pending
                    FROM reservations r
                    LEFT JOIN customers c ON c.id = r.customer_id
                    LEFT JOIN items i ON i.id = r.item_id
                    LEFT JOIN payment_allocations pa ON pa.reservation_id = r.id
                    LEFT JOIN payments p ON p.id = pa.payment_id
                    WHERE r.branch_id = ?
                      AND r.status = 'ACTIVE'
                    GROUP BY r.id, r.price, r.status, r.created_at, c.name, i.code
                ) x
                WHERE x.pending > 0
                ORDER BY x.created_at DESC
                LIMIT 100
                """,
                (rs, rowNum) -> {
                    String kind = rs.getString("kind");
                    long id = rs.getLong("id");
                    String route = "Apartado".equals(kind)
                            ? "/payments?reservationId=" + id + "&returnTo=/dashboard"
                            : "/payments?returnTo=/dashboard";
                    return new DashboardMetricDetailResponse.DetailItem(
                            kind + " #" + id,
                            join("Cliente: " + safe(rs.getString("customer_name")),
                                    "Prenda: " + safe(rs.getString("item_code")),
                                    "Total: $" + rs.getBigDecimal("price")),
                            rs.getBigDecimal("pending"),
                            "PENDIENTE",
                            route
                    );
                },
                branchId,
                branchId
        );
    }

    private List<DashboardMetricDetailResponse.DetailItem> refundsPending(Long branchId) {
        return jdbcTemplate.query(
                """
                SELECT id, amount, status, method, reason, created_at
                FROM refunds
                WHERE branch_id = ?
                  AND status IN ('PENDING', 'APPROVED')
                ORDER BY created_at DESC
                LIMIT 100
                """,
                (rs, rowNum) -> new DashboardMetricDetailResponse.DetailItem(
                        "Reembolso #" + rs.getLong("id"),
                        join("Metodo: " + safe(rs.getString("method")),
                                rs.getString("reason"),
                                String.valueOf(rs.getTimestamp("created_at"))),
                        rs.getBigDecimal("amount"),
                        rs.getString("status"),
                        "/refund-detail?id=" + rs.getLong("id") + "&returnTo=/dashboard"
                ),
                branchId
        );
    }

    private List<DashboardMetricDetailResponse.DetailItem> activeCustomersToday(Long branchId,
                                                                               LocalDateTime start,
                                                                               LocalDateTime end) {
        return jdbcTemplate.query(
                """
                SELECT DISTINCT c.id, c.name, c.phone, c.email
                FROM customers c
                JOIN (
                    SELECT customer_id FROM sales WHERE branch_id = ? AND status = 'ACTIVE' AND created_at >= ? AND created_at < ?
                    UNION
                    SELECT customer_id FROM reservations WHERE branch_id = ? AND status = 'ACTIVE' AND created_at >= ? AND created_at < ?
                    UNION
                    SELECT customer_id FROM payments WHERE branch_id = ? AND status = 'ACTIVE' AND created_at >= ? AND created_at < ?
                ) x ON x.customer_id = c.id
                ORDER BY c.name
                LIMIT 100
                """,
                (rs, rowNum) -> new DashboardMetricDetailResponse.DetailItem(
                        safe(rs.getString("name")),
                        join(rs.getString("phone"), rs.getString("email")),
                        null,
                        null,
                        "/customers/" + rs.getLong("id")
                ),
                branchId, start, end,
                branchId, start, end,
                branchId, start, end
        );
    }

    private List<DashboardMetricDetailResponse.DetailItem> activeLives(Long branchId) {
        return jdbcTemplate.query(
                """
                SELECT id, status, notes, created_at
                FROM lives
                WHERE branch_id = ?
                  AND status IN ('OPEN', 'ACTIVE')
                ORDER BY created_at DESC
                LIMIT 100
                """,
                (rs, rowNum) -> new DashboardMetricDetailResponse.DetailItem(
                        "Live #" + rs.getLong("id"),
                        join(rs.getString("notes"), String.valueOf(rs.getTimestamp("created_at"))),
                        null,
                        rs.getString("status"),
                        "/live"
                ),
                branchId
        );
    }

    private List<DashboardMetricDetailResponse.DetailItem> itemsByStatus(Long branchId, String status) {
        return jdbcTemplate.query(
                """
                SELECT i.id,
                       i.code,
                       i.status,
                       i.price,
                       pt.name AS product_type_name,
                       br.name AS brand_name,
                       sz.name AS size_name
                FROM items i
                LEFT JOIN product_types pt ON pt.id = i.product_type_id
                LEFT JOIN brands br ON br.id = i.brand_id
                LEFT JOIN sizes sz ON sz.id = i.size_id
                WHERE i.branch_id = ?
                  AND i.status = ?
                ORDER BY i.updated_at DESC, i.id DESC
                LIMIT 100
                """,
                (rs, rowNum) -> new DashboardMetricDetailResponse.DetailItem(
                        safe(rs.getString("code")),
                        join(rs.getString("product_type_name"), rs.getString("brand_name"), rs.getString("size_name")),
                        rs.getBigDecimal("price"),
                        rs.getString("status"),
                        "/items/" + rs.getLong("id")
                ),
                branchId,
                status
        );
    }

    private List<DashboardMetricDetailResponse.DetailItem> batchesByStatus(Long branchId, String status) {
        return jdbcTemplate.query(
                """
                SELECT id, folio, status, expected_quantity, received_quantity, created_at
                FROM batches
                WHERE branch_id = ?
                  AND status = ?
                ORDER BY created_at DESC
                LIMIT 100
                """,
                (rs, rowNum) -> new DashboardMetricDetailResponse.DetailItem(
                        safe(rs.getString("folio")),
                        join("Esperadas: " + rs.getInt("expected_quantity"),
                                "Recibidas: " + rs.getInt("received_quantity"),
                                String.valueOf(rs.getTimestamp("created_at"))),
                        null,
                        rs.getString("status"),
                        "/batch-detail?id=" + rs.getLong("id")
                ),
                branchId,
                status
        );
    }

    private List<DashboardMetricDetailResponse.DetailItem> packagesToPrepare(Long branchId) {
        return jdbcTemplate.query(
                """
                SELECT cp.id,
                       cp.folio,
                       cp.status,
                       cp.created_at,
                       c.name AS customer_name,
                       COUNT(cpi.id) AS item_count
                FROM customer_packages cp
                JOIN customers c ON c.id = cp.customer_id
                LEFT JOIN customer_package_items cpi ON cpi.customer_package_id = cp.id
                WHERE cp.branch_id = ?
                  AND cp.status = 'OPEN'
                GROUP BY cp.id, cp.folio, cp.status, cp.created_at, c.name
                ORDER BY cp.created_at DESC
                LIMIT 100
                """,
                (rs, rowNum) -> new DashboardMetricDetailResponse.DetailItem(
                        safe(rs.getString("folio")),
                        join("Cliente: " + safe(rs.getString("customer_name")),
                                "Prendas: " + rs.getInt("item_count"),
                                String.valueOf(rs.getTimestamp("created_at"))),
                        null,
                        rs.getString("status"),
                        "/customer-package-detail?id=" + rs.getLong("id")
                ),
                branchId
        );
    }

    private String safe(String value) {
        return value == null || value.isBlank() ? "Sin dato" : value;
    }

    private String join(String... values) {
        List<String> parts = new ArrayList<>();
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                parts.add(value);
            }
        }
        return String.join(" | ", parts);
    }

    private List<UserBranchRow> findAssignedBranches(Long userId) {
        List<UserBranchRow> assigned = jdbcTemplate.query(
                """
                SELECT b.id, b.code, b.name, ub.is_primary
                FROM user_branches ub
                JOIN branches b ON b.id = ub.branch_id
                WHERE ub.user_id = ?
                  AND b.status = 'ACTIVE'
                ORDER BY ub.is_primary DESC, b.name
                """,
                (rs, rowNum) -> new UserBranchRow(
                        rs.getLong("id"),
                        rs.getString("code"),
                        rs.getString("name"),
                        rs.getBoolean("is_primary")
                ),
                userId
        );

        if (!assigned.isEmpty()) {
            return assigned;
        }

        return jdbcTemplate.query(
                """
                SELECT b.id, b.code, b.name, 1 AS is_primary
                FROM users u
                JOIN branches b ON b.id = u.branch_id
                WHERE u.id = ?
                  AND b.status = 'ACTIVE'
                """,
                (rs, rowNum) -> new UserBranchRow(
                        rs.getLong("id"),
                        rs.getString("code"),
                        rs.getString("name"),
                        rs.getBoolean("is_primary")
                ),
                userId
        );
    }

    private List<String> findRoles(Long userId) {
        return jdbcTemplate.query(
                """
                SELECT r.code
                FROM user_roles ur
                JOIN roles r ON r.id = ur.role_id
                WHERE ur.user_id = ?
                ORDER BY r.code
                """,
                (rs, rowNum) -> rs.getString("code"),
                userId
        );
    }

    private BigDecimal amount(String sql, Object... params) {
        BigDecimal value = jdbcTemplate.queryForObject(sql, BigDecimal.class, params);
        return value == null ? BigDecimal.ZERO : value;
    }

    private Integer count(String sql, Object... params) {
        Integer value = jdbcTemplate.queryForObject(sql, Integer.class, params);
        return value == null ? 0 : value;
    }

    private record UserBranchRow(Long branchId, String branchCode, String branchName, boolean primary) {
    }
}
