package com.hpsqsoft.ctrlropa.report;

import com.hpsqsoft.ctrlropa.branch.Branch;
import com.hpsqsoft.ctrlropa.branch.BranchRepository;
import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class MovementHistoryService {

    private static final int MAX_LINES = 300;

    private final JdbcTemplate jdbcTemplate;
    private final BranchRepository branchRepository;
    private final AccessService accessService;
    private final CurrentUser currentUser;

    public MovementHistoryService(JdbcTemplate jdbcTemplate,
                                  BranchRepository branchRepository,
                                  AccessService accessService,
                                  CurrentUser currentUser) {
        this.jdbcTemplate = jdbcTemplate;
        this.branchRepository = branchRepository;
        this.accessService = accessService;
        this.currentUser = currentUser;
    }

    public MovementHistoryResponse getMovementHistory(Long branchId,
                                                      LocalDate startDate,
                                                      LocalDate endDate,
                                                      String movementType) {
        Long userId = currentUser.getUserId();
        accessService.assertCan(userId, PermissionCode.VIEW_REPORTS);

        if (branchId == null) {
            throw new IllegalArgumentException("branchId es obligatorio");
        }

        if (startDate == null) {
            throw new IllegalArgumentException("startDate es obligatorio");
        }

        if (endDate == null) {
            throw new IllegalArgumentException("endDate es obligatorio");
        }

        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("endDate no puede ser menor que startDate");
        }

        String normalizedType = normalizeMovementType(movementType);
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new IllegalArgumentException("Sucursal no encontrada"));

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.plusDays(1).atStartOfDay();

        List<MovementHistoryResponse.MovementLine> lines =
                findLines(branchId, start, end, normalizedType);

        return new MovementHistoryResponse(
                startDate,
                endDate,
                branch.getId(),
                branch.getCode(),
                branch.getName(),
                normalizedType,
                lines,
                buildSummary(lines)
        );
    }

    private List<MovementHistoryResponse.MovementLine> findLines(Long branchId,
                                                                 LocalDateTime start,
                                                                 LocalDateTime end,
                                                                 String movementType) {
        List<MovementHistoryResponse.MovementLine> lines = new ArrayList<>();

        if (includesFinancial(movementType)) {
            append(lines, """
                    SELECT 'FINANCIAL' AS category, 'PAYMENT_RECEIVED' AS event_type, p.id AS source_id,
                           p.created_at AS event_at, p.branch_id AS branch_id, b.name AS branch_name,
                           c.id AS customer_id, c.name AS customer_name, NULL AS item_code,
                           p.received_amount AS amount, p.status AS status, p.reference AS reference,
                           p.created_by_user_id AS user_id,
                           COALESCE(u.name, CONCAT('Usuario ', p.created_by_user_id)) AS user_name,
                           CONCAT('Pago registrado con ', COALESCE(pm.name, pm.code)) AS detail
                    FROM payments p
                    JOIN branches b ON b.id = p.branch_id
                    JOIN customers c ON c.id = p.customer_id
                    JOIN payment_methods pm ON pm.id = p.payment_method_id
                    LEFT JOIN users u ON u.id = p.created_by_user_id
                    WHERE p.branch_id = ? AND p.created_at >= ? AND p.created_at < ?
                    """, branchId, start, end);

            append(lines, """
                    SELECT 'FINANCIAL' AS category, 'PAYMENT_VOIDED' AS event_type, p.id AS source_id,
                           p.voided_at AS event_at, p.branch_id AS branch_id, b.name AS branch_name,
                           c.id AS customer_id, c.name AS customer_name, NULL AS item_code,
                           -p.received_amount AS amount, p.status AS status, p.void_reason AS reference,
                           p.voided_by_user_id AS user_id,
                           COALESCE(u.name, CONCAT('Usuario ', p.voided_by_user_id)) AS user_name,
                           'Pago anulado' AS detail
                    FROM payments p
                    JOIN branches b ON b.id = p.branch_id
                    JOIN customers c ON c.id = p.customer_id
                    LEFT JOIN users u ON u.id = p.voided_by_user_id
                    WHERE p.branch_id = ? AND p.voided_at IS NOT NULL
                      AND p.voided_at >= ? AND p.voided_at < ?
                    """, branchId, start, end);

            append(lines, """
                    SELECT 'FINANCIAL' AS category, 'SALE_CREATED' AS event_type, s.id AS source_id,
                           s.created_at AS event_at, s.branch_id AS branch_id, b.name AS branch_name,
                           c.id AS customer_id, c.name AS customer_name, i.code AS item_code,
                           s.price AS amount, s.status AS status, sc.code AS reference,
                           s.created_by_user_id AS user_id,
                           COALESCE(u.name, CONCAT('Usuario ', s.created_by_user_id)) AS user_name,
                           CONCAT('Venta de prenda ', i.code) AS detail
                    FROM sales s
                    JOIN branches b ON b.id = s.branch_id
                    JOIN customers c ON c.id = s.customer_id
                    JOIN items i ON i.id = s.item_id
                    JOIN sales_channels sc ON sc.id = s.sales_channel_id
                    LEFT JOIN users u ON u.id = s.created_by_user_id
                    WHERE s.branch_id = ? AND s.created_at >= ? AND s.created_at < ?
                    """, branchId, start, end);

            append(lines, """
                    SELECT 'FINANCIAL' AS category, 'BALANCE_MOVEMENT' AS event_type, cbm.id AS source_id,
                           cbm.created_at AS event_at, cbm.branch_id AS branch_id, b.name AS branch_name,
                           c.id AS customer_id, c.name AS customer_name, NULL AS item_code,
                           cbm.amount AS amount, cbm.type AS status, cbm.notes AS reference,
                           cbm.created_by_user_id AS user_id,
                           COALESCE(u.name, CONCAT('Usuario ', cbm.created_by_user_id)) AS user_name,
                           'Movimiento de saldo de cliente' AS detail
                    FROM customer_balance_movements cbm
                    JOIN branches b ON b.id = cbm.branch_id
                    JOIN customers c ON c.id = cbm.customer_id
                    LEFT JOIN users u ON u.id = cbm.created_by_user_id
                    WHERE cbm.branch_id = ? AND cbm.created_at >= ? AND cbm.created_at < ?
                    """, branchId, start, end);

            append(lines, """
                    SELECT 'FINANCIAL' AS category, 'REFUND_CREATED' AS event_type, r.id AS source_id,
                           r.created_at AS event_at, r.branch_id AS branch_id, b.name AS branch_name,
                           c.id AS customer_id, c.name AS customer_name, NULL AS item_code,
                           -r.amount AS amount, r.status AS status, r.reason AS reference,
                           r.created_by_user_id AS user_id,
                           COALESCE(u.name, CONCAT('Usuario ', r.created_by_user_id)) AS user_name,
                           CONCAT('Refund ', r.method) AS detail
                    FROM refunds r
                    JOIN branches b ON b.id = r.branch_id
                    JOIN customers c ON c.id = r.customer_id
                    LEFT JOIN users u ON u.id = r.created_by_user_id
                    WHERE r.branch_id = ? AND r.created_at >= ? AND r.created_at < ?
                    """, branchId, start, end);

            append(lines, """
                    SELECT 'FINANCIAL' AS category, 'CASH_EXPENSE' AS event_type, ce.id AS source_id,
                           ce.created_at AS event_at, ce.branch_id AS branch_id, b.name AS branch_name,
                           NULL AS customer_id, NULL AS customer_name, NULL AS item_code,
                           -ce.amount AS amount, ce.status AS status, ce.concept AS reference,
                           ce.created_by_user_id AS user_id,
                           COALESCE(u.name, CONCAT('Usuario ', ce.created_by_user_id)) AS user_name,
                           COALESCE(ce.notes, 'Gasto de caja') AS detail
                    FROM cash_expenses ce
                    JOIN branches b ON b.id = ce.branch_id
                    LEFT JOIN users u ON u.id = ce.created_by_user_id
                    WHERE ce.branch_id = ? AND ce.created_at >= ? AND ce.created_at < ?
                    """, branchId, start, end);
        }

        if (includesNonFinancial(movementType)) {
            append(lines, """
                    SELECT 'NON_FINANCIAL' AS category, 'CUSTOMER_CREATED' AS event_type, c.id AS source_id,
                           c.created_at AS event_at, c.branch_id AS branch_id, b.name AS branch_name,
                           c.id AS customer_id, c.name AS customer_name, NULL AS item_code,
                           NULL AS amount, c.status AS status, c.phone AS reference,
                           c.created_by_user_id AS user_id,
                           COALESCE(u.name, CONCAT('Usuario ', c.created_by_user_id)) AS user_name,
                           'Alta de cliente' AS detail
                    FROM customers c
                    JOIN branches b ON b.id = c.branch_id
                    LEFT JOIN users u ON u.id = c.created_by_user_id
                    WHERE c.branch_id = ? AND c.created_at >= ? AND c.created_at < ?
                    """, branchId, start, end);

            append(lines, """
                    SELECT 'NON_FINANCIAL' AS category, 'RESERVATION_CREATED' AS event_type, r.id AS source_id,
                           r.created_at AS event_at, r.branch_id AS branch_id, b.name AS branch_name,
                           c.id AS customer_id, c.name AS customer_name, i.code AS item_code,
                           NULL AS amount, r.status AS status, sc.code AS reference,
                           r.seller_user_id AS user_id,
                           COALESCE(u.name, CONCAT('Usuario ', r.seller_user_id)) AS user_name,
                           CONCAT('Apartado de prenda ', i.code) AS detail
                    FROM reservations r
                    JOIN branches b ON b.id = r.branch_id
                    JOIN customers c ON c.id = r.customer_id
                    JOIN items i ON i.id = r.item_id
                    JOIN sales_channels sc ON sc.id = r.sales_channel_id
                    LEFT JOIN users u ON u.id = r.seller_user_id
                    WHERE r.branch_id = ? AND r.created_at >= ? AND r.created_at < ?
                    """, branchId, start, end);

            append(lines, """
                    SELECT 'NON_FINANCIAL' AS category, 'ITEM_CREATED' AS event_type, i.id AS source_id,
                           i.created_at AS event_at, i.branch_id AS branch_id, b.name AS branch_name,
                           NULL AS customer_id, NULL AS customer_name, i.code AS item_code,
                           NULL AS amount, i.status AS status, i.qr_code AS reference,
                           i.created_by_user_id AS user_id,
                           COALESCE(u.name, CONCAT('Usuario ', i.created_by_user_id)) AS user_name,
                           'Alta de prenda' AS detail
                    FROM items i
                    JOIN branches b ON b.id = i.branch_id
                    LEFT JOIN users u ON u.id = i.created_by_user_id
                    WHERE i.branch_id = ? AND i.created_at >= ? AND i.created_at < ?
                    """, branchId, start, end);

            append(lines, """
                    SELECT 'NON_FINANCIAL' AS category, 'PACKAGE_CREATED' AS event_type, cp.id AS source_id,
                           cp.created_at AS event_at, cp.branch_id AS branch_id, b.name AS branch_name,
                           c.id AS customer_id, c.name AS customer_name, NULL AS item_code,
                           NULL AS amount, cp.status AS status, cp.folio AS reference,
                           cp.created_by_user_id AS user_id,
                           COALESCE(u.name, CONCAT('Usuario ', cp.created_by_user_id)) AS user_name,
                           'Paquete de cliente creado' AS detail
                    FROM customer_packages cp
                    JOIN branches b ON b.id = cp.branch_id
                    JOIN customers c ON c.id = cp.customer_id
                    LEFT JOIN users u ON u.id = cp.created_by_user_id
                    WHERE cp.branch_id = ? AND cp.created_at >= ? AND cp.created_at < ?
                    """, branchId, start, end);

            append(lines, """
                    SELECT 'NON_FINANCIAL' AS category, 'SHIPMENT_CREATED' AS event_type, sh.id AS source_id,
                           sh.created_at AS event_at, sh.branch_id AS branch_id, b.name AS branch_name,
                           NULL AS customer_id, NULL AS customer_name, NULL AS item_code,
                           NULL AS amount, sh.status AS status, sh.folio AS reference,
                           sh.created_by_user_id AS user_id,
                           COALESCE(u.name, CONCAT('Usuario ', sh.created_by_user_id)) AS user_name,
                           CONCAT('Envio ', sh.delivery_type) AS detail
                    FROM shipments sh
                    JOIN branches b ON b.id = sh.branch_id
                    LEFT JOIN users u ON u.id = sh.created_by_user_id
                    WHERE sh.branch_id = ? AND sh.created_at >= ? AND sh.created_at < ?
                    """, branchId, start, end);

            append(lines, """
                    SELECT 'NON_FINANCIAL' AS category, 'TRANSFER_CREATED' AS event_type, bt.id AS source_id,
                           bt.created_at AS event_at, bt.from_branch_id AS branch_id, b.name AS branch_name,
                           NULL AS customer_id, NULL AS customer_name, NULL AS item_code,
                           NULL AS amount, bt.status AS status, bt.folio AS reference,
                           bt.created_by_user_id AS user_id,
                           COALESCE(u.name, CONCAT('Usuario ', bt.created_by_user_id)) AS user_name,
                           CONCAT('Transferencia hacia sucursal ', bt.to_branch_id) AS detail
                    FROM branch_transfers bt
                    JOIN branches b ON b.id = bt.from_branch_id
                    LEFT JOIN users u ON u.id = bt.created_by_user_id
                    WHERE bt.from_branch_id = ? AND bt.created_at >= ? AND bt.created_at < ?
                    """, branchId, start, end);

            append(lines, """
                    SELECT 'NON_FINANCIAL' AS category, 'INCIDENT_CREATED' AS event_type, inc.id AS source_id,
                           inc.created_at AS event_at, inc.branch_id AS branch_id, b.name AS branch_name,
                           c.id AS customer_id, c.name AS customer_name, i.code AS item_code,
                           NULL AS amount, inc.status AS status, inc.type AS reference,
                           inc.created_by_user_id AS user_id,
                           COALESCE(u.name, CONCAT('Usuario ', inc.created_by_user_id)) AS user_name,
                           COALESCE(inc.description, 'Incidencia registrada') AS detail
                    FROM incidents inc
                    JOIN branches b ON b.id = inc.branch_id
                    LEFT JOIN customers c ON c.id = inc.customer_id
                    LEFT JOIN items i ON i.id = inc.item_id
                    LEFT JOIN users u ON u.id = inc.created_by_user_id
                    WHERE inc.branch_id = ? AND inc.created_at >= ? AND inc.created_at < ?
                    """, branchId, start, end);

            append(lines, """
                    SELECT 'NON_FINANCIAL' AS category, 'BATCH_CREATED' AS event_type, ba.id AS source_id,
                           ba.created_at AS event_at, ba.branch_id AS branch_id, b.name AS branch_name,
                           NULL AS customer_id, NULL AS customer_name, NULL AS item_code,
                           NULL AS amount, ba.status AS status, ba.folio AS reference,
                           ba.created_by_user_id AS user_id,
                           COALESCE(u.name, CONCAT('Usuario ', ba.created_by_user_id)) AS user_name,
                           CONCAT('Lote ', ba.folio) AS detail
                    FROM batches ba
                    JOIN branches b ON b.id = ba.branch_id
                    LEFT JOIN users u ON u.id = ba.created_by_user_id
                    WHERE ba.branch_id = ? AND ba.created_at >= ? AND ba.created_at < ?
                    """, branchId, start, end);

            append(lines, """
                    SELECT sal.category AS category, sal.event_type AS event_type, sal.id AS source_id,
                           sal.created_at AS event_at, sal.branch_id AS branch_id, b.name AS branch_name,
                           NULL AS customer_id, NULL AS customer_name, NULL AS item_code,
                           NULL AS amount, CONCAT('HTTP ', sal.status_code) AS status,
                           sal.query_string AS reference, sal.user_id AS user_id,
                           COALESCE(sal.user_name, CONCAT('Usuario ', sal.user_id)) AS user_name,
                           sal.detail AS detail
                    FROM system_movement_audit_log sal
                    LEFT JOIN branches b ON b.id = sal.branch_id
                    WHERE sal.branch_id = ? AND sal.created_at >= ? AND sal.created_at < ?
                      AND sal.event_type NOT IN (
                        'SYSTEM_CUSTOMERS_CREATE', 'SYSTEM_ITEMS_CREATE', 'SYSTEM_RESERVATIONS_CREATE',
                        'SYSTEM_CUSTOMER_PACKAGES_CREATE', 'SYSTEM_SHIPMENTS_CREATE',
                        'SYSTEM_TRANSFERS_CREATE', 'SYSTEM_INCIDENTS_CREATE', 'SYSTEM_PAYMENTS_CREATE',
                        'SYSTEM_PAYMENTS_CHANGE', 'SYSTEM_SALES_CREATE', 'SYSTEM_REFUNDS_CREATE',
                        'SYSTEM_CASH_EXPENSES_CREATE', 'SYSTEM_BATCHES_CREATE',
                        'SYSTEM_BATCHES_UPDATE', 'SYSTEM_BATCHES_CHANGE'
                      )
                    """, branchId, start, end);
        }

        return lines.stream()
                .sorted(Comparator
                        .comparing(MovementHistoryResponse.MovementLine::getEventAt, Comparator.reverseOrder())
                        .thenComparing(MovementHistoryResponse.MovementLine::getSourceId, Comparator.reverseOrder()))
                .limit(MAX_LINES)
                .toList();
    }

    private void append(List<MovementHistoryResponse.MovementLine> lines, String sql, Object... args) {
        lines.addAll(jdbcTemplate.query(sql, movementLineMapper(), args));
    }

    private RowMapper<MovementHistoryResponse.MovementLine> movementLineMapper() {
        return (rs, rowNum) -> new MovementHistoryResponse.MovementLine(
                rs.getString("category"),
                rs.getString("event_type"),
                rs.getLong("source_id"),
                toLocalDateTime(rs.getTimestamp("event_at")),
                rs.getLong("branch_id"),
                rs.getString("branch_name"),
                nullableLong(rs.getObject("customer_id")),
                rs.getString("customer_name"),
                rs.getString("item_code"),
                rs.getBigDecimal("amount"),
                rs.getString("status"),
                rs.getString("reference"),
                nullableLong(rs.getObject("user_id")),
                rs.getString("user_name"),
                rs.getString("detail")
        );
    }

    private MovementHistoryResponse.Summary buildSummary(List<MovementHistoryResponse.MovementLine> lines) {
        int financialMovements = (int) lines.stream()
                .filter(line -> "FINANCIAL".equals(line.getCategory()))
                .count();
        int nonFinancialMovements = lines.size() - financialMovements;
        BigDecimal financialTotal = lines.stream()
                .filter(line -> "FINANCIAL".equals(line.getCategory()))
                .map(MovementHistoryResponse.MovementLine::getAmount)
                .filter(amount -> amount != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new MovementHistoryResponse.Summary(
                lines.size(),
                financialMovements,
                nonFinancialMovements,
                financialTotal
        );
    }

    private boolean includesFinancial(String movementType) {
        return "ALL".equals(movementType) || "FINANCIAL".equals(movementType);
    }

    private boolean includesNonFinancial(String movementType) {
        return "ALL".equals(movementType) || "NON_FINANCIAL".equals(movementType);
    }

    private String normalizeMovementType(String movementType) {
        if (movementType == null || movementType.isBlank()) {
            return "ALL";
        }

        String value = movementType.trim().toUpperCase();
        if (!"ALL".equals(value) && !"FINANCIAL".equals(value) && !"NON_FINANCIAL".equals(value)) {
            throw new IllegalArgumentException("movementType debe ser ALL, FINANCIAL o NON_FINANCIAL");
        }

        return value;
    }

    private static LocalDateTime toLocalDateTime(Timestamp value) {
        return value == null ? null : value.toLocalDateTime();
    }

    private static Long nullableLong(Object value) {
        if (value == null) {
            return null;
        }

        return ((Number) value).longValue();
    }
}
