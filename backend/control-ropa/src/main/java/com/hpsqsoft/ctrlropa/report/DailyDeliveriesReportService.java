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
import java.util.List;

@Service
@Transactional(readOnly = true)
public class DailyDeliveriesReportService {

    private final JdbcTemplate jdbcTemplate;
    private final BranchRepository branchRepository;
    private final AccessService accessService;
    private final CurrentUser currentUser;

    public DailyDeliveriesReportService(JdbcTemplate jdbcTemplate,
                                        BranchRepository branchRepository,
                                        AccessService accessService,
                                        CurrentUser currentUser) {
        this.jdbcTemplate = jdbcTemplate;
        this.branchRepository = branchRepository;
        this.accessService = accessService;
        this.currentUser = currentUser;
    }

    public DailyDeliveriesReportResponse getDailyDeliveriesReport(DailyDeliveriesReportRequest request) {
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

        List<DailyDeliveriesReportResponse.ScreenLine> screenLines =
                findDeliveryLines(branch.getId(), start, end);

        List<DailyDeliveriesReportResponse.PrintLine> printLines =
                buildPrintLines(screenLines);

        DailyDeliveriesReportResponse.Summary summary =
                buildSummary(screenLines);

        return new DailyDeliveriesReportResponse(
                date,
                branch.getId(),
                branch.getCode(),
                branch.getName(),
                screenLines,
                printLines,
                summary
        );
    }

    private List<DailyDeliveriesReportResponse.ScreenLine> findDeliveryLines(Long branchId,
                                                                             LocalDateTime start,
                                                                             LocalDateTime end) {
        return jdbcTemplate.query(
                """
                SELECT
                    sh.id AS shipment_id,
                    sh.folio AS shipment_folio,
                    sh.status AS shipment_status,
                    sh.delivery_type AS delivery_type,
                    sh.created_at AS shipment_created_at,
                    sh.dispatched_at AS sent_at,

                    sp.id AS shipment_package_id,
                    sp.customer_package_id AS package_id,
                    cp.folio AS package_folio,
                    cp.status AS package_status,

                    c.id AS customer_id,
                    c.name AS customer_name,
                    c.phone AS customer_phone,

                    CONCAT(
                        ca.line1,
                        CASE
                            WHEN ca.line2 IS NULL OR ca.line2 = '' THEN ''
                            ELSE CONCAT(', ', ca.line2)
                        END,
                        ', ',
                        ca.city,
                        ', ',
                        ca.state,
                        ', ',
                        ca.postal_code
                    ) AS address_text,

                    COALESCE(package_totals.total_amount, 0) AS total_amount,
                    COALESCE(package_payments.paid_amount, 0) AS paid_amount,

                    sp.payment_mode AS payment_mode,
                    sp.expected_cod_amount AS expected_cod_amount,
                    sp.result_status AS result_status,
                    sp.collected_amount AS collected_amount,
                    sp.collection_status AS collection_status,
                    sp.result_notes AS result_notes,
                    sp.delivered_at AS delivered_at,
                    sp.returned_at AS returned_at

                FROM shipment_packages sp
                JOIN shipments sh ON sh.id = sp.shipment_id
                JOIN customer_packages cp ON cp.id = sp.customer_package_id
                JOIN customers c ON c.id = sp.customer_id
                JOIN customer_addresses ca ON ca.id = sp.delivery_address_id

                LEFT JOIN (
                    SELECT
                        cpi.customer_package_id,
                        COALESCE(SUM(
                            CASE
                                WHEN cpi.sale_id IS NOT NULL THEN s.price
                                WHEN cpi.reservation_id IS NOT NULL THEN r.price
                                ELSE 0
                            END
                        ), 0) AS total_amount
                    FROM customer_package_items cpi
                    LEFT JOIN sales s ON s.id = cpi.sale_id
                    LEFT JOIN reservations r ON r.id = cpi.reservation_id
                    GROUP BY cpi.customer_package_id
                ) package_totals ON package_totals.customer_package_id = cp.id

                LEFT JOIN (
                    SELECT
                        cpi.customer_package_id,
                        COALESCE(SUM(
                            CASE
                                WHEN p.status = 'ACTIVE' THEN pa.amount
                                ELSE 0
                            END
                        ), 0) AS paid_amount
                    FROM customer_package_items cpi
                    LEFT JOIN payment_allocations pa
                        ON (
                            (cpi.sale_id IS NOT NULL AND pa.sale_id = cpi.sale_id)
                            OR
                            (cpi.reservation_id IS NOT NULL AND pa.reservation_id = cpi.reservation_id)
                        )
                    LEFT JOIN payments p ON p.id = pa.payment_id
                    GROUP BY cpi.customer_package_id
                ) package_payments ON package_payments.customer_package_id = cp.id

                WHERE sh.branch_id = ?
                  AND (
                        (sh.created_at >= ? AND sh.created_at < ?)
                     OR (sh.dispatched_at >= ? AND sh.dispatched_at < ?)
                     OR (sp.delivered_at >= ? AND sp.delivered_at < ?)
                     OR (sp.returned_at >= ? AND sp.returned_at < ?)
                  )
                ORDER BY
                    COALESCE(sh.dispatched_at, sh.created_at) ASC,
                    cp.folio ASC
                """,
                (rs, rowNum) -> {
                    BigDecimal total = safe(rs.getBigDecimal("total_amount"));
                    BigDecimal paid = safe(rs.getBigDecimal("paid_amount"));

                    BigDecimal pending = total.subtract(paid);
                    if (pending.signum() < 0) {
                        pending = BigDecimal.ZERO;
                    }

                    return new DailyDeliveriesReportResponse.ScreenLine(
                            rs.getLong("shipment_id"),
                            rs.getString("shipment_folio"),
                            rs.getString("shipment_status"),
                            rs.getLong("package_id"),
                            rs.getString("package_folio"),
                            rs.getString("package_status"),
                            rs.getLong("customer_id"),
                            rs.getString("customer_name"),
                            rs.getString("customer_phone"),
                            rs.getString("address_text"),
                            total,
                            paid,
                            pending,
                            resolvePaymentStatus(total, paid),
                            rs.getString("delivery_type"),
                            rs.getTimestamp("shipment_created_at") != null
                                    ? rs.getTimestamp("shipment_created_at").toLocalDateTime()
                                    : null,
                            rs.getTimestamp("sent_at") != null
                                    ? rs.getTimestamp("sent_at").toLocalDateTime()
                                    : null,
                            rs.getTimestamp("delivered_at") != null
                                    ? rs.getTimestamp("delivered_at").toLocalDateTime()
                                    : null,
                            buildObservation(
                                    rs.getString("result_status"),
                                    rs.getString("payment_mode"),
                                    rs.getBigDecimal("expected_cod_amount"),
                                    rs.getBigDecimal("collected_amount"),
                                    rs.getString("collection_status"),
                                    rs.getString("result_notes")
                            )
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
                end
        );
    }

    private List<DailyDeliveriesReportResponse.PrintLine> buildPrintLines(List<DailyDeliveriesReportResponse.ScreenLine> screenLines) {
        List<DailyDeliveriesReportResponse.PrintLine> printLines = new ArrayList<>();

        int row = 1;

        for (DailyDeliveriesReportResponse.ScreenLine line : screenLines) {
            printLines.add(new DailyDeliveriesReportResponse.PrintLine(
                    row,
                    line.getPackageFolio(),
                    line.getCustomerName(),
                    line.getTotal(),
                    line.getPaid(),
                    buildPaymentText(line),
                    line.getObservation()
            ));

            row++;
        }

        return printLines;
    }

    private DailyDeliveriesReportResponse.Summary buildSummary(List<DailyDeliveriesReportResponse.ScreenLine> lines) {
        int totalPackages = lines.size();

        int inRoutePackages = (int) lines.stream()
                .filter(line -> "OUT_FOR_DELIVERY".equals(line.getShipmentStatus()))
                .filter(line -> !"DELIVERED".equals(line.getPackageStatus()))
                .count();

        int deliveredPackages = (int) lines.stream()
                .filter(line -> line.getDeliveredAt() != null || line.getObservation().contains("DELIVERED"))
                .count();

        int returnedPackages = (int) lines.stream()
                .filter(line -> line.getObservation().contains("RETURNED"))
                .count();

        BigDecimal totalAmount = lines.stream()
                .map(DailyDeliveriesReportResponse.ScreenLine::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPaid = lines.stream()
                .map(DailyDeliveriesReportResponse.ScreenLine::getPaid)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPending = lines.stream()
                .map(DailyDeliveriesReportResponse.ScreenLine::getPending)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new DailyDeliveriesReportResponse.Summary(
                totalPackages,
                inRoutePackages,
                deliveredPackages,
                returnedPackages,
                totalAmount,
                totalPaid,
                totalPending
        );
    }

    private String buildPaymentText(DailyDeliveriesReportResponse.ScreenLine line) {
        if ("PAID".equals(line.getPaymentStatus())) {
            return "Pagado $" + line.getPaid();
        }

        if ("PARTIALLY_PAID".equals(line.getPaymentStatus())) {
            return "Parcial $" + line.getPaid() + " / Pendiente $" + line.getPending();
        }

        return "Pendiente $" + line.getPending();
    }

    private String buildObservation(String resultStatus,
                                    String paymentMode,
                                    BigDecimal expectedCodAmount,
                                    BigDecimal collectedAmount,
                                    String collectionStatus,
                                    String resultNotes) {
        List<String> parts = new ArrayList<>();

        if (resultStatus != null) {
            parts.add(resultStatus);
        }

        if (paymentMode != null) {
            parts.add(paymentMode);
        }

        if (expectedCodAmount != null && expectedCodAmount.signum() > 0) {
            parts.add("COD esperado $" + expectedCodAmount);
        }

        if (collectedAmount != null) {
            parts.add("Cobrado $" + collectedAmount);
        }

        if (collectionStatus != null) {
            parts.add(collectionStatus);
        }

        if (resultNotes != null && !resultNotes.isBlank()) {
            parts.add(resultNotes);
        }

        return String.join(" | ", parts);
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

    private BigDecimal safe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}