package com.hpsqsoft.ctrlropa.report;

import com.hpsqsoft.ctrlropa.branch.Branch;
import com.hpsqsoft.ctrlropa.branch.BranchRepository;
import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import com.hpsqsoft.ctrlropa.tenant.TenantAccessGuard;
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
public class DailyCancellationsReportService {

    private final JdbcTemplate jdbcTemplate;
    private final BranchRepository branchRepository;
    private final AccessService accessService;
    private final CurrentUser currentUser;
    private final TenantAccessGuard tenantAccessGuard;

    public DailyCancellationsReportService(JdbcTemplate jdbcTemplate,
                                          BranchRepository branchRepository,
                                          AccessService accessService,
                                          CurrentUser currentUser,
                                          TenantAccessGuard tenantAccessGuard) {
        this.jdbcTemplate = jdbcTemplate;
        this.branchRepository = branchRepository;
        this.accessService = accessService;
        this.currentUser = currentUser;
        this.tenantAccessGuard = tenantAccessGuard;
    }

    public DailyCancellationsReportResponse getDailyCancellationsReport(DailyCancellationsReportRequest request) {
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
        tenantAccessGuard.requireBranch(branch.getId(), "La sucursal del reporte no pertenece al tenant activo");

        LocalDate date = request.getDate();
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.plusDays(1).atStartOfDay();

        List<DailyCancellationsReportResponse.ScreenLine> screenLines = new ArrayList<>();
        screenLines.addAll(findCancelledSales(branch.getId(), start, end));
        screenLines.addAll(findCancelledReservations(branch.getId(), start, end));

        screenLines.sort(Comparator.comparing(DailyCancellationsReportResponse.ScreenLine::getCancelledAt));

        List<DailyCancellationsReportResponse.PrintLine> printLines = buildPrintLines(screenLines);
        DailyCancellationsReportResponse.Summary summary = buildSummary(branch.getId(), start, end, screenLines);

        return new DailyCancellationsReportResponse(
                date,
                branch.getId(),
                branch.getCode(),
                branch.getName(),
                screenLines,
                printLines,
                summary
        );
    }

    private List<DailyCancellationsReportResponse.ScreenLine> findCancelledSales(Long branchId,
                                                                                 LocalDateTime start,
                                                                                 LocalDateTime end) {
        return jdbcTemplate.query(
                """
                SELECT
                    s.id AS source_id,
                    CONCAT('SALE-', s.id) AS folio,
                    c.id AS customer_id,
                    c.name AS customer_name,
                    i.id AS item_id,
                    i.code AS item_code,
                    s.price AS total,
                    s.status AS status,
                    s.cancelled_at AS cancelled_at,
                    s.cancelled_by_user_id AS cancelled_by_user_id,
                    COALESCE(u.name, CONCAT('Usuario ', s.cancelled_by_user_id)) AS cancelled_by_user_name,
                    s.cancel_reason AS cancel_reason,

                    COALESCE(refund_data.refund_status, 'NONE') AS refund_status,
                    COALESCE(refund_data.refund_amount, 0) AS refund_amount

                FROM sales s
                JOIN customers c ON c.id = s.customer_id
                JOIN items i ON i.id = s.item_id
                LEFT JOIN users u ON u.id = s.cancelled_by_user_id

                LEFT JOIN (
                    SELECT
                        cr.sale_id,
                        MAX(r.status) AS refund_status,
                        COALESCE(SUM(CASE
                            WHEN r.status = 'PROCESSED' THEN r.amount
                            ELSE 0
                        END), 0) AS refund_amount
                    FROM `returns` cr
                    JOIN refunds r ON r.return_id = cr.id
                    GROUP BY cr.sale_id
                ) refund_data ON refund_data.sale_id = s.id

                WHERE s.branch_id = ?
                  AND s.status = 'CANCELLED'
                  AND s.cancelled_at >= ?
                  AND s.cancelled_at < ?
                ORDER BY s.cancelled_at ASC
                """,
                (rs, rowNum) -> new DailyCancellationsReportResponse.ScreenLine(
                        "SALE",
                        rs.getLong("source_id"),
                        rs.getString("folio"),
                        rs.getLong("customer_id"),
                        rs.getString("customer_name"),
                        rs.getLong("item_id"),
                        rs.getString("item_code"),
                        safe(rs.getBigDecimal("total")),
                        rs.getString("status"),
                        rs.getTimestamp("cancelled_at") != null
                                ? rs.getTimestamp("cancelled_at").toLocalDateTime()
                                : null,
                        rs.getLong("cancelled_by_user_id"),
                        rs.getString("cancelled_by_user_name"),
                        rs.getString("cancel_reason"),
                        rs.getString("refund_status"),
                        safe(rs.getBigDecimal("refund_amount"))
                ),
                branchId,
                start,
                end
        );
    }

    private List<DailyCancellationsReportResponse.ScreenLine> findCancelledReservations(Long branchId,
                                                                                        LocalDateTime start,
                                                                                        LocalDateTime end) {
        return jdbcTemplate.query(
                """
                SELECT
                    r.id AS source_id,
                    CONCAT('RES-', r.id) AS folio,
                    c.id AS customer_id,
                    c.name AS customer_name,
                    i.id AS item_id,
                    i.code AS item_code,
                    r.price AS total,
                    r.status AS status,
                    r.cancelled_at AS cancelled_at,
                    r.cancelled_by_user_id AS cancelled_by_user_id,
                    COALESCE(u.name, CONCAT('Usuario ', r.cancelled_by_user_id)) AS cancelled_by_user_name,
                    r.cancel_reason AS cancel_reason

                FROM reservations r
                JOIN customers c ON c.id = r.customer_id
                JOIN items i ON i.id = r.item_id
                LEFT JOIN users u ON u.id = r.cancelled_by_user_id

                WHERE r.branch_id = ?
                  AND r.status = 'CANCELLED'
                  AND r.cancelled_at >= ?
                  AND r.cancelled_at < ?
                ORDER BY r.cancelled_at ASC
                """,
                (rs, rowNum) -> new DailyCancellationsReportResponse.ScreenLine(
                        "RESERVATION",
                        rs.getLong("source_id"),
                        rs.getString("folio"),
                        rs.getLong("customer_id"),
                        rs.getString("customer_name"),
                        rs.getLong("item_id"),
                        rs.getString("item_code"),
                        safe(rs.getBigDecimal("total")),
                        rs.getString("status"),
                        rs.getTimestamp("cancelled_at") != null
                                ? rs.getTimestamp("cancelled_at").toLocalDateTime()
                                : null,
                        rs.getLong("cancelled_by_user_id"),
                        rs.getString("cancelled_by_user_name"),
                        rs.getString("cancel_reason"),
                        "N/A",
                        BigDecimal.ZERO
                ),
                branchId,
                start,
                end
        );
    }

    private List<DailyCancellationsReportResponse.PrintLine> buildPrintLines(
            List<DailyCancellationsReportResponse.ScreenLine> screenLines) {

        List<DailyCancellationsReportResponse.PrintLine> printLines = new ArrayList<>();

        int row = 1;

        for (DailyCancellationsReportResponse.ScreenLine line : screenLines) {
            printLines.add(new DailyCancellationsReportResponse.PrintLine(
                    row,
                    line.getFolio(),
                    line.getCustomerName(),
                    line.getTotal(),
                    1,
                    line.getCancelledByUserName(),
                    buildPrintReason(line)
            ));

            row++;
        }

        return printLines;
    }

    private DailyCancellationsReportResponse.Summary buildSummary(Long branchId,
                                                                  LocalDateTime start,
                                                                  LocalDateTime end,
                                                                  List<DailyCancellationsReportResponse.ScreenLine> lines) {
        BigDecimal totalCancelled = lines.stream()
                .map(DailyCancellationsReportResponse.ScreenLine::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int cancelledSales = (int) lines.stream()
                .filter(line -> "SALE".equals(line.getSourceType()))
                .count();

        int cancelledReservations = (int) lines.stream()
                .filter(line -> "RESERVATION".equals(line.getSourceType()))
                .count();

        Integer processedRefunds = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM refunds
                WHERE branch_id = ?
                  AND status = 'PROCESSED'
                  AND processed_at >= ?
                  AND processed_at < ?
                """,
                Integer.class,
                branchId,
                start,
                end
        );

        BigDecimal processedRefundAmount = jdbcTemplate.queryForObject(
                """
                SELECT COALESCE(SUM(amount), 0)
                FROM refunds
                WHERE branch_id = ?
                  AND status = 'PROCESSED'
                  AND processed_at >= ?
                  AND processed_at < ?
                """,
                BigDecimal.class,
                branchId,
                start,
                end
        );

        return new DailyCancellationsReportResponse.Summary(
                totalCancelled,
                lines.size(),
                cancelledSales,
                cancelledReservations,
                processedRefunds == null ? 0 : processedRefunds,
                safe(processedRefundAmount)
        );
    }

    private String buildPrintReason(DailyCancellationsReportResponse.ScreenLine line) {
        List<String> parts = new ArrayList<>();

        if (line.getSourceType() != null) {
            parts.add(line.getSourceType());
        }

        if (line.getCancelReason() != null && !line.getCancelReason().isBlank()) {
            parts.add(line.getCancelReason());
        }

        if (line.getRefundAmount() != null && line.getRefundAmount().compareTo(BigDecimal.ZERO) > 0) {
            parts.add("Refund $" + line.getRefundAmount());
        }

        return String.join(" | ", parts);
    }

    private BigDecimal safe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
