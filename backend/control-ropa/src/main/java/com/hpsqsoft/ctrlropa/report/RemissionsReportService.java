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
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class RemissionsReportService {

    private final JdbcTemplate jdbcTemplate;
    private final BranchRepository branchRepository;
    private final AccessService accessService;
    private final CurrentUser currentUser;

    public RemissionsReportService(JdbcTemplate jdbcTemplate,
                                   BranchRepository branchRepository,
                                   AccessService accessService,
                                   CurrentUser currentUser) {
        this.jdbcTemplate = jdbcTemplate;
        this.branchRepository = branchRepository;
        this.accessService = accessService;
        this.currentUser = currentUser;
    }

    public RemissionsReportResponse getRemissionsReport(RemissionsReportRequest request) {
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

        List<RemissionsReportResponse.ScreenLine> screenLines = new ArrayList<>();
        screenLines.addAll(findSaleLines(branch.getId(), start, end));
        screenLines.addAll(findReservationLines(branch.getId(), start, end));

        screenLines.sort(Comparator.comparing(RemissionsReportResponse.ScreenLine::getCreatedAt));

        List<RemissionsReportResponse.PrintLine> printLines = buildPrintLines(screenLines);
        RemissionsReportResponse.Summary summary = buildSummary(screenLines);

        return new RemissionsReportResponse(
                date,
                branch.getId(),
                branch.getCode(),
                branch.getName(),
                screenLines,
                printLines,
                summary
        );
    }

    private List<RemissionsReportResponse.ScreenLine> findSaleLines(Long branchId,
                                                                    LocalDateTime start,
                                                                    LocalDateTime end) {
        return jdbcTemplate.query(
                """
                SELECT
                    s.id AS source_id,
                    i.code AS item_code,
                    i.qr_code AS qr_code,
                    c.name AS customer_name,
                    pt.name AS product_type,
                    b.name AS brand,
                    sz.name AS size_name,
                    s.price AS price,
                    sc.code AS channel_code,
                    cp.folio AS package_folio,
                    s.payment_status AS payment_status,
                    s.created_at AS created_at,
                    COALESCE(u.name, CONCAT('Usuario ', s.seller_user_id)) AS seller_name,

                    COALESCE(SUM(CASE
                        WHEN p.status = 'ACTIVE' THEN pa.amount
                        ELSE 0
                    END), 0) AS paid

                FROM sales s
                JOIN items i ON i.id = s.item_id
                JOIN customers c ON c.id = s.customer_id
                JOIN product_types pt ON pt.id = i.product_type_id
                LEFT JOIN brands b ON b.id = i.brand_id
                LEFT JOIN sizes sz ON sz.id = i.size_id
                JOIN sales_channels sc ON sc.id = s.sales_channel_id
                LEFT JOIN users u ON u.id = s.seller_user_id

                LEFT JOIN customer_package_items cpi ON cpi.sale_id = s.id
                LEFT JOIN customer_packages cp ON cp.id = cpi.customer_package_id

                LEFT JOIN payment_allocations pa ON pa.sale_id = s.id
                LEFT JOIN payments p ON p.id = pa.payment_id

                WHERE s.branch_id = ?
                  AND s.created_at >= ?
                  AND s.created_at < ?

                GROUP BY
                    s.id,
                    i.code,
                    i.qr_code,
                    c.name,
                    pt.name,
                    b.name,
                    sz.name,
                    s.price,
                    sc.code,
                    cp.folio,
                    s.payment_status,
                    s.created_at,
                    u.name,
                    s.seller_user_id

                ORDER BY s.created_at ASC
                """,
                (rs, rowNum) -> {
                    BigDecimal price = safe(rs.getBigDecimal("price"));
                    BigDecimal paid = safe(rs.getBigDecimal("paid"));
                    BigDecimal pending = calculatePending(price, paid);

                    String paymentStatus = rs.getString("payment_status");
                    if (paymentStatus == null || paymentStatus.isBlank()) {
                        paymentStatus = resolvePaymentStatus(price, paid);
                    }

                    return new RemissionsReportResponse.ScreenLine(
                            "SALE",
                            rs.getLong("source_id"),
                            rs.getString("item_code"),
                            rs.getString("qr_code"),
                            rs.getString("customer_name"),
                            rs.getString("product_type"),
                            rs.getString("brand"),
                            rs.getString("size_name"),
                            price,
                            rs.getString("channel_code"),
                            rs.getString("package_folio"),
                            paymentStatus,
                            paid,
                            pending,
                            rs.getTimestamp("created_at").toLocalDateTime(),
                            rs.getString("seller_name")
                    );
                },
                branchId,
                start,
                end
        );
    }

    private List<RemissionsReportResponse.ScreenLine> findReservationLines(Long branchId,
                                                                           LocalDateTime start,
                                                                           LocalDateTime end) {
        return jdbcTemplate.query(
                """
                SELECT
                    r.id AS source_id,
                    i.code AS item_code,
                    i.qr_code AS qr_code,
                    c.name AS customer_name,
                    pt.name AS product_type,
                    b.name AS brand,
                    sz.name AS size_name,
                    r.price AS price,
                    sc.code AS channel_code,
                    cp.folio AS package_folio,
                    r.created_at AS created_at,
                    COALESCE(u.name, CONCAT('Usuario ', r.seller_user_id)) AS seller_name,

                    COALESCE(SUM(CASE
                        WHEN p.status = 'ACTIVE' THEN pa.amount
                        ELSE 0
                    END), 0) AS paid

                FROM reservations r
                JOIN items i ON i.id = r.item_id
                JOIN customers c ON c.id = r.customer_id
                JOIN product_types pt ON pt.id = i.product_type_id
                LEFT JOIN brands b ON b.id = i.brand_id
                LEFT JOIN sizes sz ON sz.id = i.size_id
                JOIN sales_channels sc ON sc.id = r.sales_channel_id
                LEFT JOIN users u ON u.id = r.seller_user_id

                LEFT JOIN customer_package_items cpi ON cpi.reservation_id = r.id
                LEFT JOIN customer_packages cp ON cp.id = cpi.customer_package_id

                LEFT JOIN payment_allocations pa ON pa.reservation_id = r.id
                LEFT JOIN payments p ON p.id = pa.payment_id

                WHERE r.branch_id = ?
                  AND r.created_at >= ?
                  AND r.created_at < ?

                GROUP BY
                    r.id,
                    i.code,
                    i.qr_code,
                    c.name,
                    pt.name,
                    b.name,
                    sz.name,
                    r.price,
                    sc.code,
                    cp.folio,
                    r.created_at,
                    u.name,
                    r.seller_user_id

                ORDER BY r.created_at ASC
                """,
                (rs, rowNum) -> {
                    BigDecimal price = safe(rs.getBigDecimal("price"));
                    BigDecimal paid = safe(rs.getBigDecimal("paid"));
                    BigDecimal pending = calculatePending(price, paid);

                    return new RemissionsReportResponse.ScreenLine(
                            "RESERVATION",
                            rs.getLong("source_id"),
                            rs.getString("item_code"),
                            rs.getString("qr_code"),
                            rs.getString("customer_name"),
                            rs.getString("product_type"),
                            rs.getString("brand"),
                            rs.getString("size_name"),
                            price,
                            rs.getString("channel_code"),
                            rs.getString("package_folio"),
                            resolvePaymentStatus(price, paid),
                            paid,
                            pending,
                            rs.getTimestamp("created_at").toLocalDateTime(),
                            rs.getString("seller_name")
                    );
                },
                branchId,
                start,
                end
        );
    }

    private List<RemissionsReportResponse.PrintLine> buildPrintLines(List<RemissionsReportResponse.ScreenLine> screenLines) {
        List<RemissionsReportResponse.PrintLine> printLines = new ArrayList<>();

        int row = 1;

        for (RemissionsReportResponse.ScreenLine line : screenLines) {
            printLines.add(new RemissionsReportResponse.PrintLine(
                    row,
                    resolvePrintFolio(line),
                    line.getCustomerName(),
                    line.getProductType(),
                    line.getBrand(),
                    line.getSize(),
                    line.getPrice(),
                    line.getPaid(),
                    line.getPending(),
                    line.getSellerName(),
                    buildDeliveryInfo(line)
            ));

            row++;
        }

        return printLines;
    }

    private RemissionsReportResponse.Summary buildSummary(List<RemissionsReportResponse.ScreenLine> lines) {
        int totalPieces = lines.size();

        BigDecimal totalAmount = lines.stream()
                .map(RemissionsReportResponse.ScreenLine::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPaid = lines.stream()
                .map(RemissionsReportResponse.ScreenLine::getPaid)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPending = lines.stream()
                .map(RemissionsReportResponse.ScreenLine::getPending)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal averageTicket = BigDecimal.ZERO;

        if (totalPieces > 0) {
            averageTicket = totalAmount.divide(
                    BigDecimal.valueOf(totalPieces),
                    2,
                    RoundingMode.HALF_UP
            );
        }

        return new RemissionsReportResponse.Summary(
                totalPieces,
                totalAmount,
                totalPaid,
                totalPending,
                averageTicket
        );
    }

    private String resolvePrintFolio(RemissionsReportResponse.ScreenLine line) {
        if (line.getPackageFolio() != null && !line.getPackageFolio().isBlank()) {
            return line.getPackageFolio();
        }

        return line.getSourceType() + "-" + line.getSourceId();
    }

    private String buildDeliveryInfo(RemissionsReportResponse.ScreenLine line) {
        List<String> parts = new ArrayList<>();

        if (line.getPackageFolio() != null && !line.getPackageFolio().isBlank()) {
            parts.add("Paquete " + line.getPackageFolio());
        }

        if (line.getChannelCode() != null && !line.getChannelCode().isBlank()) {
            parts.add(line.getChannelCode());
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

    private BigDecimal calculatePending(BigDecimal total, BigDecimal paid) {
        BigDecimal pending = total.subtract(paid);

        if (pending.signum() < 0) {
            return BigDecimal.ZERO;
        }

        return pending;
    }

    private BigDecimal safe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}