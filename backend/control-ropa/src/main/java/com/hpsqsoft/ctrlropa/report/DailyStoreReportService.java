package com.hpsqsoft.ctrlropa.report;

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
import java.util.Comparator;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class DailyStoreReportService {

    private final JdbcTemplate jdbcTemplate;
    private final BranchRepository branchRepository;
    private final AccessService accessService;
    private final CurrentUser currentUser;

    public DailyStoreReportService(JdbcTemplate jdbcTemplate,
                                   BranchRepository branchRepository,
                                   AccessService accessService,
                                   CurrentUser currentUser) {
        this.jdbcTemplate = jdbcTemplate;
        this.branchRepository = branchRepository;
        this.accessService = accessService;
        this.currentUser = currentUser;
    }

    public DailyStoreReportResponse getDailyStoreReport(DailyStoreReportRequest request) {
        Long userId = currentUser.getUserId();
        accessService.assertCan(userId, PermissionCode.VIEW_REPORTS);

        if (request.getBranchId() == null) {
            throw new IllegalArgumentException("branchId es obligatorio");
        }

        if (request.getDate() == null) {
            throw new IllegalArgumentException("date es obligatorio");
        }

        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new IllegalArgumentException("Sucursal no encontrada"));

        LocalDate date = request.getDate();
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.plusDays(1).atStartOfDay();

        List<DailyStoreReportResponse.ScreenLine> screenLines = new ArrayList<>();
        screenLines.addAll(findSaleLines(branch.getId(), start, end));
        screenLines.addAll(findReservationLines(branch.getId(), start, end));

        screenLines.sort(Comparator.comparing(DailyStoreReportResponse.ScreenLine::getCreatedAt));

        List<DailyStoreReportResponse.PrintLine> printLines = buildPrintLines(screenLines);

        DailyStoreReportResponse.PaymentSummary paymentSummary = buildPaymentSummary(branch.getId(), start, end);
        DailyStoreReportResponse.OperationSummary operationSummary = buildOperationSummary(branch.getId(), start, end);
        DailyStoreReportResponse.CashSummary cashSummary = buildCashSummary(branch.getId(), date, paymentSummary);

        return new DailyStoreReportResponse(
                date,
                branch.getId(),
                branch.getCode(),
                branch.getName(),
                screenLines,
                printLines,
                paymentSummary,
                operationSummary,
                cashSummary
        );
    }

	private List<DailyStoreReportResponse.ScreenLine> findSaleLines(Long branchId, LocalDateTime start,
			LocalDateTime end) {
		return jdbcTemplate.query("""
				SELECT
				s.id AS source_id,
				CONCAT('SALE-', s.id) AS folio,
				c.name AS customer_name,
				sc.code AS channel_code,
				s.price AS total,
				s.payment_status AS payment_status,
				s.status AS status,
				s.created_at AS created_at,
				s.cancel_reason AS observation,
				COALESCE(u.name, CONCAT('Usuario ', s.seller_user_id)) AS attended_by,

				COALESCE(SUM(CASE
				WHEN p.status = 'ACTIVE' THEN pa.amount
				ELSE 0
				END), 0) AS payment_paid,

				COALESCE(SUM(CASE
				WHEN p.status = 'ACTIVE' AND pm.code = 'CASH' THEN pa.amount
				ELSE 0
				END), 0) AS cash,

				COALESCE(SUM(CASE
				WHEN p.status = 'ACTIVE'
				AND pm.code IN ('TRANS', 'TRANSFER', 'DEPOSIT', 'BANK')
				THEN pa.amount
				ELSE 0
				END), 0) AS transfer,

				COALESCE(SUM(CASE
				WHEN p.status = 'ACTIVE' AND pm.code = 'CARD' THEN pa.amount
				ELSE 0
				END), 0) AS card,

				CASE
				WHEN resolved_order.customer_order_id IS NOT NULL
				AND COALESCE(order_totals.order_total, 0) > 0
				THEN COALESCE(balance_by_order.balance_applied, 0)
				* s.price
				/ order_totals.order_total
				ELSE 0
				END AS balance_applied

				FROM sales s
				JOIN customers c ON c.id = s.customer_id
				JOIN sales_channels sc ON sc.id = s.sales_channel_id
				LEFT JOIN users u ON u.id = s.seller_user_id
				LEFT JOIN payment_allocations pa ON pa.sale_id = s.id
				LEFT JOIN payments p ON p.id = pa.payment_id
				LEFT JOIN payment_methods pm ON pm.id = p.payment_method_id

				LEFT JOIN (
				SELECT
				s2.id AS sale_id,
				COALESCE(s2.customer_order_id, coi.customer_order_id) AS customer_order_id
				FROM sales s2
				LEFT JOIN (
				SELECT sale_id, MAX(customer_order_id) AS customer_order_id
				FROM customer_order_items
				WHERE sale_id IS NOT NULL
				GROUP BY sale_id
				) coi ON coi.sale_id = s2.id
				) resolved_order ON resolved_order.sale_id = s.id

				LEFT JOIN (
				SELECT
				customer_order_id,
				COALESCE(SUM(price), 0) AS order_total
				FROM sales
				WHERE status = 'ACTIVE'
				AND customer_order_id IS NOT NULL
				GROUP BY customer_order_id
				) order_totals ON order_totals.customer_order_id = resolved_order.customer_order_id

				LEFT JOIN (
				SELECT
				customer_order_id,
				COALESCE(SUM(amount), 0) AS balance_applied
				FROM customer_balance_movements
				WHERE type = 'APPLIED_TO_ORDER'
				AND amount > 0
				GROUP BY customer_order_id
				) balance_by_order ON balance_by_order.customer_order_id = resolved_order.customer_order_id

				WHERE s.branch_id = ?
				AND (
				(s.created_at >= ? AND s.created_at < ?)
				OR (s.cancelled_at >= ? AND s.cancelled_at < ?)
				OR EXISTS (
				SELECT 1
				FROM payment_allocations pa2
				JOIN payments p2 ON p2.id = pa2.payment_id
				WHERE pa2.sale_id = s.id
				AND p2.status = 'ACTIVE'
				AND p2.created_at >= ?
				AND p2.created_at < ?
				)
				OR EXISTS (
				SELECT 1
				FROM customer_balance_movements cbm2
				WHERE cbm2.customer_order_id = resolved_order.customer_order_id
				AND cbm2.type = 'APPLIED_TO_ORDER'
				AND cbm2.amount > 0
				AND cbm2.created_at >= ?
				AND cbm2.created_at < ?
				)
				)
				GROUP BY
				s.id,
				c.name,
				sc.code,
				s.price,
				s.payment_status,
				s.status,
				s.created_at,
				s.cancel_reason,
				u.name,
				s.seller_user_id,
				resolved_order.customer_order_id,
				order_totals.order_total,
				balance_by_order.balance_applied
				ORDER BY s.created_at ASC
				""", (rs, rowNum) -> {
			BigDecimal total = safe(rs.getBigDecimal("total"));
			BigDecimal paymentPaid = safe(rs.getBigDecimal("payment_paid"));
			BigDecimal balanceApplied = safe(rs.getBigDecimal("balance_applied"));
			BigDecimal paid = paymentPaid.add(balanceApplied);
			BigDecimal pending = calculatePending(total, paid);

			return new DailyStoreReportResponse.ScreenLine("SALE", rs.getLong("source_id"), rs.getString("folio"),
					rs.getString("customer_name"), rs.getString("channel_code"), "SALE", total, paid, pending,
					safe(rs.getBigDecimal("cash")), safe(rs.getBigDecimal("transfer")), safe(rs.getBigDecimal("card")),
					balanceApplied, resolvePaymentStatus(total, paid, rs.getString("payment_status")),
					rs.getString("status"), rs.getString("attended_by"),
					rs.getTimestamp("created_at").toLocalDateTime(), rs.getString("observation"));
		}, branchId, start, end, start, end, start, end, start, end);
	}

    private List<DailyStoreReportResponse.ScreenLine> findReservationLines(Long branchId,
                                                                           LocalDateTime start,
                                                                           LocalDateTime end) {
        return jdbcTemplate.query(
                """
                SELECT
                    r.id AS source_id,
                    CONCAT('RES-', r.id) AS folio,
                    c.name AS customer_name,
                    sc.code AS channel_code,
                    r.price AS total,
                    r.status AS status,
                    r.created_at AS created_at,
                    r.cancel_reason AS observation,
                    COALESCE(u.name, CONCAT('Usuario ', r.seller_user_id)) AS attended_by,

                    COALESCE(SUM(CASE
                        WHEN p.status = 'ACTIVE' THEN pa.amount
                        ELSE 0
                    END), 0) AS payment_paid,

                    COALESCE(SUM(CASE
                        WHEN p.status = 'ACTIVE' AND pm.code = 'CASH' THEN pa.amount
                        ELSE 0
                    END), 0) AS cash,

                    COALESCE(SUM(CASE
                        WHEN p.status = 'ACTIVE'
                         AND pm.code IN ('TRANS', 'TRANSFER', 'DEPOSIT', 'BANK')
                        THEN pa.amount
                        ELSE 0
                    END), 0) AS transfer,

                    COALESCE(SUM(CASE
                        WHEN p.status = 'ACTIVE' AND pm.code = 'CARD' THEN pa.amount
                        ELSE 0
                    END), 0) AS card,

                    CASE
                        WHEN rol.customer_order_id IS NOT NULL
                         AND COALESCE(order_totals.order_total, r.price, 0) > 0
                        THEN COALESCE(balance_by_order.balance_applied, 0)
                             * r.price
                             / COALESCE(NULLIF(order_totals.order_total, 0), r.price)
                        ELSE 0
                    END AS balance_applied

                FROM reservations r
                JOIN customers c ON c.id = r.customer_id
                JOIN sales_channels sc ON sc.id = r.sales_channel_id
                LEFT JOIN users u ON u.id = r.seller_user_id
                LEFT JOIN payment_allocations pa ON pa.reservation_id = r.id
                LEFT JOIN payments p ON p.id = pa.payment_id
                LEFT JOIN payment_methods pm ON pm.id = p.payment_method_id

                LEFT JOIN (
                    SELECT reservation_id, MAX(customer_order_id) AS customer_order_id
                    FROM customer_order_items
                    WHERE reservation_id IS NOT NULL
                    GROUP BY reservation_id
                ) rol ON rol.reservation_id = r.id

                LEFT JOIN customer_orders co ON co.id = rol.customer_order_id

                LEFT JOIN (
                    SELECT customer_order_id, COALESCE(SUM(price), 0) AS order_total
                    FROM customer_order_items
                    GROUP BY customer_order_id
                ) order_totals ON order_totals.customer_order_id = rol.customer_order_id

                LEFT JOIN (
                    SELECT customer_order_id, COALESCE(SUM(amount), 0) AS balance_applied
                    FROM customer_balance_movements
                    WHERE type = 'APPLIED_TO_ORDER'
                    GROUP BY customer_order_id
                ) balance_by_order ON balance_by_order.customer_order_id = rol.customer_order_id

                WHERE r.branch_id = ?
                  AND (
                        (r.created_at >= ? AND r.created_at < ?)
                     OR (r.cancelled_at >= ? AND r.cancelled_at < ?)
                     OR (co.closed_at >= ? AND co.closed_at < ?)
                     OR EXISTS (
                            SELECT 1
                            FROM payment_allocations pa2
                            JOIN payments p2 ON p2.id = pa2.payment_id
                            WHERE pa2.reservation_id = r.id
                              AND p2.status = 'ACTIVE'
                              AND p2.created_at >= ?
                              AND p2.created_at < ?
                        )
                     OR EXISTS (
                            SELECT 1
                            FROM customer_balance_movements cbm2
                            WHERE cbm2.customer_order_id = rol.customer_order_id
                              AND cbm2.type = 'APPLIED_TO_ORDER'
                              AND cbm2.created_at >= ?
                              AND cbm2.created_at < ?
                        )
                  )
                GROUP BY
                    r.id,
                    c.name,
                    sc.code,
                    r.price,
                    r.status,
                    r.created_at,
                    r.cancel_reason,
                    u.name,
                    r.seller_user_id,
                    rol.customer_order_id,
                    order_totals.order_total,
                    balance_by_order.balance_applied
                ORDER BY r.created_at ASC
                """,
                (rs, rowNum) -> {
                    BigDecimal total = safe(rs.getBigDecimal("total"));
                    BigDecimal paymentPaid = safe(rs.getBigDecimal("payment_paid"));
                    BigDecimal balanceApplied = safe(rs.getBigDecimal("balance_applied"));
                    BigDecimal paid = paymentPaid.add(balanceApplied);
                    BigDecimal pending = calculatePending(total, paid);

                    return new DailyStoreReportResponse.ScreenLine(
                            "RESERVATION",
                            rs.getLong("source_id"),
                            rs.getString("folio"),
                            rs.getString("customer_name"),
                            rs.getString("channel_code"),
                            "RESERVATION",
                            total,
                            paid,
                            pending,
                            safe(rs.getBigDecimal("cash")),
                            safe(rs.getBigDecimal("transfer")),
                            safe(rs.getBigDecimal("card")),
                            balanceApplied,
                            resolvePaymentStatus(total, paid, null),
                            rs.getString("status"),
                            rs.getString("attended_by"),
                            rs.getTimestamp("created_at").toLocalDateTime(),
                            rs.getString("observation")
                    );
                },
                branchId,
                start,
                end,
                start,
                end,
                start,
                end,
                start,
                end,
                start,
                end
        );
    }

	private DailyStoreReportResponse.PaymentSummary buildPaymentSummary(Long branchId, LocalDateTime start,
			LocalDateTime end) {
		PaymentTotals paymentTotals = jdbcTemplate.queryForObject("""
				SELECT
				COALESCE(SUM(CASE
				WHEN pm.code = 'CASH' THEN p.received_amount
				ELSE 0
				END), 0) AS cash,

				COALESCE(SUM(CASE
				WHEN pm.code IN ('TRANS', 'TRANSFER', 'DEPOSIT', 'BANK') THEN p.received_amount
				ELSE 0
				END), 0) AS transfer,

				COALESCE(SUM(CASE
				WHEN pm.code = 'CARD' THEN p.received_amount
				ELSE 0
				END), 0) AS card,

				COALESCE(SUM(p.received_amount), 0) AS total_received

				FROM payments p
				JOIN payment_methods pm ON pm.id = p.payment_method_id
				WHERE p.branch_id = ?
				AND p.status = 'ACTIVE'
				AND p.created_at >= ?
				AND p.created_at < ?
				""",
				(rs, rowNum) -> new PaymentTotals(safe(rs.getBigDecimal("cash")), safe(rs.getBigDecimal("transfer")),
						safe(rs.getBigDecimal("card")), safe(rs.getBigDecimal("total_received"))),
				branchId, start, end);

		BigDecimal balanceApplied = querySingleAmount("""
				SELECT COALESCE(SUM(amount), 0)
				FROM customer_balance_movements
				WHERE branch_id = ?
				AND type = 'APPLIED_TO_ORDER'
				AND amount > 0
				AND created_at >= ?
				AND created_at < ?
				""", branchId, start, end);

		BigDecimal paymentOverage = querySingleAmount("""
				SELECT COALESCE(SUM(amount), 0)
				FROM customer_balance_movements
				WHERE branch_id = ?
				AND type = 'PAYMENT_OVERAGE'
				AND amount > 0
				AND created_at >= ?
				AND created_at < ?
				""", branchId, start, end);

		BigDecimal refundStoreCredit = querySingleAmount("""
				SELECT COALESCE(SUM(amount), 0)
				FROM refunds
				WHERE branch_id = ?
				AND status = 'PROCESSED'
				AND method = 'STORE_CREDIT'
				AND processed_at >= ?
				AND processed_at < ?
				""", branchId, start, end);

		return new DailyStoreReportResponse.PaymentSummary(paymentTotals.cash(), paymentTotals.transfer(),
				paymentTotals.card(), balanceApplied, paymentOverage.add(refundStoreCredit),
				paymentTotals.totalReceived());
	}

	private DailyStoreReportResponse.OperationSummary buildOperationSummary(Long branchId, LocalDateTime start,
			LocalDateTime end) {
		BigDecimal activeSalesTotal = querySingleAmount("""
				SELECT COALESCE(SUM(s.price), 0)
				FROM sales s
				LEFT JOIN (
				SELECT
				s2.id AS sale_id,
				COALESCE(s2.customer_order_id, coi.customer_order_id) AS customer_order_id
				FROM sales s2
				LEFT JOIN (
				SELECT sale_id, MAX(customer_order_id) AS customer_order_id
				FROM customer_order_items
				WHERE sale_id IS NOT NULL
				GROUP BY sale_id
				) coi ON coi.sale_id = s2.id
				) resolved_order ON resolved_order.sale_id = s.id
				WHERE s.branch_id = ?
				AND s.status = 'ACTIVE'
				AND (
				(s.created_at >= ? AND s.created_at < ?)
				OR EXISTS (
				SELECT 1
				FROM customer_balance_movements cbm
				WHERE cbm.customer_order_id = resolved_order.customer_order_id
				AND cbm.type = 'APPLIED_TO_ORDER'
				AND cbm.amount > 0
				AND cbm.created_at >= ?
				AND cbm.created_at < ?
				)
				)
				""", branchId, start, end, start, end);

		BigDecimal activeReservationsTotal = querySingleAmount("""
				SELECT COALESCE(SUM(price), 0)
				FROM reservations
				WHERE branch_id = ?
				AND status = 'ACTIVE'
				AND created_at >= ?
				AND created_at < ?
				""", branchId, start, end);

		BigDecimal cancelledSalesTotal = querySingleAmount("""
				SELECT COALESCE(SUM(price), 0)
				FROM sales
				WHERE branch_id = ?
				AND status = 'CANCELLED'
				AND cancelled_at >= ?
				AND cancelled_at < ?
				""", branchId, start, end);

		BigDecimal cancelledReservationsTotal = querySingleAmount("""
				SELECT COALESCE(SUM(price), 0)
				FROM reservations
				WHERE branch_id = ?
				AND status = 'CANCELLED'
				AND cancelled_at >= ?
				AND cancelled_at < ?
				""", branchId, start, end);

		BigDecimal processedRefundsTotal = querySingleAmount("""
				SELECT COALESCE(SUM(amount), 0)
				FROM refunds
				WHERE branch_id = ?
				AND status = 'PROCESSED'
				AND processed_at >= ?
				AND processed_at < ?
				""", branchId, start, end);

		Integer activeSalesCount = querySingleCount("""
				SELECT COUNT(*)
				FROM sales s
				LEFT JOIN (
				SELECT
				s2.id AS sale_id,
				COALESCE(s2.customer_order_id, coi.customer_order_id) AS customer_order_id
				FROM sales s2
				LEFT JOIN (
				SELECT sale_id, MAX(customer_order_id) AS customer_order_id
				FROM customer_order_items
				WHERE sale_id IS NOT NULL
				GROUP BY sale_id
				) coi ON coi.sale_id = s2.id
				) resolved_order ON resolved_order.sale_id = s.id
				WHERE s.branch_id = ?
				AND s.status = 'ACTIVE'
				AND (
				(s.created_at >= ? AND s.created_at < ?)
				OR EXISTS (
				SELECT 1
				FROM customer_balance_movements cbm
				WHERE cbm.customer_order_id = resolved_order.customer_order_id
				AND cbm.type = 'APPLIED_TO_ORDER'
				AND cbm.amount > 0
				AND cbm.created_at >= ?
				AND cbm.created_at < ?
				)
				)
				""", branchId, start, end, start, end);

		Integer activeReservationsCount = querySingleCount("""
				SELECT COUNT(*)
				FROM reservations
				WHERE branch_id = ?
				AND status = 'ACTIVE'
				AND created_at >= ?
				AND created_at < ?
				""", branchId, start, end);

		Integer cancelledSalesCount = querySingleCount("""
				SELECT COUNT(*)
				FROM sales
				WHERE branch_id = ?
				AND status = 'CANCELLED'
				AND cancelled_at >= ?
				AND cancelled_at < ?
				""", branchId, start, end);

		Integer cancelledReservationsCount = querySingleCount("""
				SELECT COUNT(*)
				FROM reservations
				WHERE branch_id = ?
				AND status = 'CANCELLED'
				AND cancelled_at >= ?
				AND cancelled_at < ?
				""", branchId, start, end);

		Integer refundsCount = querySingleCount("""
				SELECT COUNT(*)
				FROM refunds
				WHERE branch_id = ?
				AND status = 'PROCESSED'
				AND processed_at >= ?
				AND processed_at < ?
				""", branchId, start, end);

		return new DailyStoreReportResponse.OperationSummary(activeSalesTotal, activeReservationsTotal,
				cancelledSalesTotal, cancelledReservationsTotal, processedRefundsTotal, activeSalesCount,
				activeReservationsCount, cancelledSalesCount, cancelledReservationsCount, refundsCount);
	}

    private DailyStoreReportResponse.CashSummary buildCashSummary(Long branchId,
                                                                  LocalDate date,
                                                                  DailyStoreReportResponse.PaymentSummary paymentSummary) {
        CashClosureReportData closureData = jdbcTemplate.query(
                """
                SELECT
                    expected_cash,
                    expenses_total,
                    delivered_cash,
                    difference
                FROM cash_closures
                WHERE branch_id = ?
                  AND closure_date = ?
                  AND status <> 'CANCELLED'
                LIMIT 1
                """,
                rs -> {
                    if (rs.next()) {
                        return new CashClosureReportData(
                                safe(rs.getBigDecimal("expected_cash")),
                                safe(rs.getBigDecimal("expenses_total")),
                                safe(rs.getBigDecimal("delivered_cash")),
                                safe(rs.getBigDecimal("difference"))
                        );
                    }

                    BigDecimal expenses = BigDecimal.ZERO;
                    BigDecimal deliveredCash = BigDecimal.ZERO;
                    BigDecimal expectedCash = paymentSummary.getCash().subtract(expenses);
                    BigDecimal difference = deliveredCash.subtract(expectedCash);

                    return new CashClosureReportData(
                            expectedCash,
                            expenses,
                            deliveredCash,
                            difference
                    );
                },
                branchId,
                date
        );

        return new DailyStoreReportResponse.CashSummary(
                closureData.expectedCash(),
                closureData.expenses(),
                closureData.deliveredCash(),
                closureData.difference()
        );
    }

    private List<DailyStoreReportResponse.PrintLine> buildPrintLines(List<DailyStoreReportResponse.ScreenLine> screenLines) {
        List<DailyStoreReportResponse.PrintLine> printLines = new ArrayList<>();

        int row = 1;

        for (DailyStoreReportResponse.ScreenLine line : screenLines) {
            printLines.add(new DailyStoreReportResponse.PrintLine(
                    row,
                    line.getFolio(),
                    line.getCustomerName(),
                    line.getTotal(),
                    line.getPaid(),
                    buildPaymentText(line),
                    line.getAttendedBy(),
                    buildPrintObservation(line)
            ));

            row++;
        }

        return printLines;
    }

    private String buildPaymentText(DailyStoreReportResponse.ScreenLine line) {
        List<String> parts = new ArrayList<>();

        if (line.getCash().compareTo(BigDecimal.ZERO) > 0) {
            parts.add("Efectivo $" + line.getCash());
        }

        if (line.getTransfer().compareTo(BigDecimal.ZERO) > 0) {
            parts.add("Transfer $" + line.getTransfer());
        }

        if (line.getCard().compareTo(BigDecimal.ZERO) > 0) {
            parts.add("Tarjeta $" + line.getCard());
        }

        if (line.getBalanceApplied().compareTo(BigDecimal.ZERO) > 0) {
            parts.add("Saldo $" + line.getBalanceApplied());
        }

        if (parts.isEmpty()) {
            return "Pendiente";
        }

        return String.join(" / ", parts);
    }

    private String buildPrintObservation(DailyStoreReportResponse.ScreenLine line) {
        List<String> parts = new ArrayList<>();

        if (line.getChannelCode() != null) {
            parts.add(line.getChannelCode());
        }

        if (line.getStatus() != null && !"ACTIVE".equals(line.getStatus())) {
            parts.add(line.getStatus());
        }

        if (line.getPaymentStatus() != null) {
            parts.add(line.getPaymentStatus());
        }

        if (line.getObservation() != null && !line.getObservation().isBlank()) {
            parts.add(line.getObservation());
        }

        return String.join(" | ", parts);
    }

    private String resolvePaymentStatus(BigDecimal total, BigDecimal paid, String existingStatus) {
        if (paid.compareTo(BigDecimal.ZERO) <= 0) {
            return existingStatus != null && !existingStatus.isBlank() ? existingStatus : "UNPAID";
        }

        if (paid.compareTo(total) < 0) {
            return "PARTIALLY_PAID";
        }

        return "PAID";
    }

    private BigDecimal calculatePending(BigDecimal total, BigDecimal paid) {
        BigDecimal pending = total.subtract(paid);

        if (pending.signum() < 0) {
            return BigDecimal.ZERO;
        }

        return pending;
    }

    private BigDecimal querySingleAmount(String sql, Object... params) {
        BigDecimal amount = jdbcTemplate.queryForObject(sql, BigDecimal.class, params);
        return safe(amount);
    }

    private Integer querySingleCount(String sql, Object... params) {
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, params);
        return count == null ? 0 : count;
    }

    private BigDecimal safe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private record PaymentTotals(
            BigDecimal cash,
            BigDecimal transfer,
            BigDecimal card,
            BigDecimal totalReceived
    ) {
    }

    private record CashClosureReportData(
            BigDecimal expectedCash,
            BigDecimal expenses,
            BigDecimal deliveredCash,
            BigDecimal difference
    ) {
    }
}