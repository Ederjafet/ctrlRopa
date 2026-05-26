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
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class LiveControlReportService {

    private final JdbcTemplate jdbcTemplate;
    private final BranchRepository branchRepository;
    private final AccessService accessService;
    private final CurrentUser currentUser;
    private final TenantAccessGuard tenantAccessGuard;

    public LiveControlReportService(JdbcTemplate jdbcTemplate,
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

    public LiveControlReportResponse getLiveControlReport(LiveControlReportRequest request) {
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

        List<LiveControlReportResponse.ScreenLine> screenLines =
                findLivePackageLines(branch.getId(), start, end);

        List<LiveControlReportResponse.PrintLine> printLines =
                buildPrintLines(screenLines);

        LiveControlReportResponse.Summary summary =
                buildSummary(screenLines);

        return new LiveControlReportResponse(
                date,
                branch.getId(),
                branch.getCode(),
                branch.getName(),
                screenLines,
                printLines,
                summary
        );
    }

    private List<LiveControlReportResponse.ScreenLine> findLivePackageLines(Long branchId,
                                                                            LocalDateTime start,
                                                                            LocalDateTime end) {
        return jdbcTemplate.query(
                """
                SELECT
                    cp.id AS package_id,
                    cp.folio AS package_folio,
                    cp.status AS package_status,
                    cp.created_at AS package_created_at,
                    cp.closed_at AS package_closed_at,

                    c.id AS customer_id,
                    c.name AS customer_name,

                    co.id AS customer_order_id,
                    co.status AS order_status,

                    COUNT(cpi.id) AS pieces,

                    COALESCE(SUM(
                        CASE
                            WHEN cpi.sale_id IS NOT NULL THEN s.price
                            WHEN cpi.reservation_id IS NOT NULL THEN r.price
                            ELSE 0
                        END
                    ), 0) AS total_amount,

                    COALESCE(SUM(
                        CASE
                            WHEN p.status = 'ACTIVE' THEN pa.amount
                            ELSE 0
                        END
                    ), 0) AS paid_amount

                FROM customer_packages cp
                JOIN customers c ON c.id = cp.customer_id
                LEFT JOIN customer_orders co
                    ON co.customer_id = cp.customer_id
                   AND co.branch_id = cp.branch_id
                JOIN customer_package_items cpi
                    ON cpi.customer_package_id = cp.id

                LEFT JOIN reservations r ON r.id = cpi.reservation_id
                LEFT JOIN sales s ON s.id = cpi.sale_id

                LEFT JOIN payment_allocations pa
                    ON (
                        (cpi.sale_id IS NOT NULL AND pa.sale_id = cpi.sale_id)
                        OR
                        (cpi.reservation_id IS NOT NULL AND pa.reservation_id = cpi.reservation_id)
                    )
                LEFT JOIN payments p ON p.id = pa.payment_id

                WHERE cp.branch_id = ?
                  AND (
                        (cp.created_at >= ? AND cp.created_at < ?)
                     OR (cp.closed_at >= ? AND cp.closed_at < ?)
                  )
                  AND EXISTS (
                        SELECT 1
                        FROM customer_package_items live_cpi
                        JOIN reservations live_r ON live_r.id = live_cpi.reservation_id
                        JOIN sales_channels live_sc ON live_sc.id = live_r.sales_channel_id
                        WHERE live_cpi.customer_package_id = cp.id
                          AND live_sc.code = 'LIVE'
                  )

                GROUP BY
                    cp.id,
                    cp.folio,
                    cp.status,
                    cp.created_at,
                    cp.closed_at,
                    c.id,
                    c.name,
                    co.id,
                    co.status

                ORDER BY cp.created_at ASC, cp.folio ASC
                """,
                (rs, rowNum) -> {
                    BigDecimal total = safe(rs.getBigDecimal("total_amount"));
                    BigDecimal paid = safe(rs.getBigDecimal("paid_amount"));

                    BigDecimal pending = total.subtract(paid);
                    if (pending.signum() < 0) {
                        pending = BigDecimal.ZERO;
                    }

                    String paymentStatus = resolvePaymentStatus(total, paid);

                    LocalDateTime settledAt = "PAID".equals(paymentStatus)
                            ? timestampToLocalDateTime(rs.getTimestamp("package_closed_at"))
                            : null;

                    return new LiveControlReportResponse.ScreenLine(
                            rs.getLong("package_id"),
                            rs.getString("package_folio"),
                            rs.getLong("customer_id"),
                            rs.getString("customer_name"),
                            rs.getInt("pieces"),
                            total,
                            paid,
                            pending,
                            paymentStatus,
                            rs.getString("package_status"),
                            rs.getString("order_status"),
                            timestampToLocalDateTime(rs.getTimestamp("package_created_at")),
                            settledAt
                    );
                },
                branchId,
                start,
                end,
                start,
                end
        );
    }

    private List<LiveControlReportResponse.PrintLine> buildPrintLines(List<LiveControlReportResponse.ScreenLine> screenLines) {
        List<LiveControlReportResponse.PrintLine> printLines = new ArrayList<>();

        int row = 1;

        for (LiveControlReportResponse.ScreenLine line : screenLines) {
            printLines.add(new LiveControlReportResponse.PrintLine(
                    row,
                    line.getPackageFolio(),
                    line.getCustomerName(),
                    line.getPieces(),
                    line.getTotal(),
                    buildPrintStatus(line),
                    formatDate(line.getSettledAt())
            ));

            row++;
        }

        return printLines;
    }

    private LiveControlReportResponse.Summary buildSummary(List<LiveControlReportResponse.ScreenLine> lines) {
        int totalPackages = lines.size();

        int totalPieces = lines.stream()
                .map(LiveControlReportResponse.ScreenLine::getPieces)
                .reduce(0, Integer::sum);

        BigDecimal totalAmount = lines.stream()
                .map(LiveControlReportResponse.ScreenLine::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPaid = lines.stream()
                .map(LiveControlReportResponse.ScreenLine::getPaid)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPending = lines.stream()
                .map(LiveControlReportResponse.ScreenLine::getPending)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int settledPackages = (int) lines.stream()
                .filter(line -> "PAID".equals(line.getPaymentStatus()))
                .count();

        int pendingPackages = totalPackages - settledPackages;

        return new LiveControlReportResponse.Summary(
                totalPackages,
                totalPieces,
                totalAmount,
                totalPaid,
                totalPending,
                settledPackages,
                pendingPackages
        );
    }

    private String buildPrintStatus(LiveControlReportResponse.ScreenLine line) {
        if ("PAID".equals(line.getPaymentStatus())) {
            return "Liquidado";
        }

        if ("PARTIALLY_PAID".equals(line.getPaymentStatus())) {
            return "Parcial";
        }

        return "Pendiente";
    }

    private String resolvePaymentStatus(BigDecimal total, BigDecimal paid) {
        if (paid.compareTo(BigDecimal.ZERO) <= 0) {
            return "UNPAID";
        }

        if (paid.compareTo(total) < 0) {
            return "PARTIALLY_PAID";
        }

        return "PAID";
    }

    private String formatDate(LocalDateTime value) {
        if (value == null) {
            return null;
        }

        return value.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
    }

    private LocalDateTime timestampToLocalDateTime(java.sql.Timestamp timestamp) {
        if (timestamp == null) {
            return null;
        }

        return timestamp.toLocalDateTime();
    }

    private BigDecimal safe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
