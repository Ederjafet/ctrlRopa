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
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class DailyDepositsReportService {

    private final JdbcTemplate jdbcTemplate;
    private final BranchRepository branchRepository;
    private final AccessService accessService;
    private final CurrentUser currentUser;
    private final TenantAccessGuard tenantAccessGuard;

    public DailyDepositsReportService(JdbcTemplate jdbcTemplate,
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

    public DailyDepositsReportResponse getDailyDepositsReport(DailyDepositsReportRequest request) {
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

        List<DailyDepositsReportResponse.ScreenLine> screenLines =
                findDepositLines(branch.getId(), start, end);

        List<DailyDepositsReportResponse.PrintLine> printLines =
                buildPrintLines(screenLines);

        DailyDepositsReportResponse.Summary summary =
                buildSummary(screenLines);

        return new DailyDepositsReportResponse(
                date,
                branch.getId(),
                branch.getCode(),
                branch.getName(),
                screenLines,
                printLines,
                summary
        );
    }

    private List<DailyDepositsReportResponse.ScreenLine> findDepositLines(Long branchId,
                                                                          LocalDateTime start,
                                                                          LocalDateTime end) {
        return jdbcTemplate.query(
                """
                SELECT
                    p.id AS payment_id,
                    c.name AS customer_name,
                    pm.code AS method_code,
                    pm.name AS method_name,
                    p.reference AS reference,
                    p.received_amount AS amount,
                    p.status AS status,
                    p.created_at AS created_at,
                    COALESCE(u.name, CONCAT('Usuario ', p.created_by_user_id)) AS created_by
                FROM payments p
                JOIN customers c ON c.id = p.customer_id
                JOIN payment_methods pm ON pm.id = p.payment_method_id
                LEFT JOIN users u ON u.id = p.created_by_user_id
                WHERE p.branch_id = ?
                  AND p.created_at >= ?
                  AND p.created_at < ?
                  AND pm.code IN ('TRANS', 'TRANSFER', 'DEPOSIT', 'BANK')
                ORDER BY p.created_at ASC
                """,
                (rs, rowNum) -> new DailyDepositsReportResponse.ScreenLine(
                        rs.getLong("payment_id"),
                        rs.getString("customer_name"),
                        resolveMethodText(
                                rs.getString("method_code"),
                                rs.getString("method_name")
                        ),
                        rs.getString("reference"),
                        safe(rs.getBigDecimal("amount")),
                        rs.getString("status"),
                        rs.getString("created_by"),
                        rs.getTimestamp("created_at").toLocalDateTime(),
                        buildObservation(
                                rs.getString("status"),
                                rs.getString("reference")
                        )
                ),
                branchId,
                start,
                end
        );
    }

    private List<DailyDepositsReportResponse.PrintLine> buildPrintLines(List<DailyDepositsReportResponse.ScreenLine> screenLines) {
        List<DailyDepositsReportResponse.PrintLine> printLines = new ArrayList<>();

        int row = 1;

        for (DailyDepositsReportResponse.ScreenLine line : screenLines) {
            printLines.add(new DailyDepositsReportResponse.PrintLine(
                    row,
                    line.getCustomerName(),
                    line.getAmount(),
                    line.getMethod(),
                    line.getReference(),
                    line.getObservation()
            ));

            row++;
        }

        return printLines;
    }

    private DailyDepositsReportResponse.Summary buildSummary(List<DailyDepositsReportResponse.ScreenLine> lines) {
        BigDecimal totalDeposits = lines.stream()
                .filter(line -> "ACTIVE".equals(line.getStatus()))
                .map(DailyDepositsReportResponse.ScreenLine::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalOperations = (int) lines.stream()
                .filter(line -> "ACTIVE".equals(line.getStatus()))
                .count();

        BigDecimal averageDeposit = BigDecimal.ZERO;

        if (totalOperations > 0) {
            averageDeposit = totalDeposits.divide(
                    BigDecimal.valueOf(totalOperations),
                    2,
                    RoundingMode.HALF_UP
            );
        }

        return new DailyDepositsReportResponse.Summary(
                totalDeposits,
                totalOperations,
                averageDeposit
        );
    }

    private String resolveMethodText(String code, String name) {
        if (name != null && !name.isBlank()) {
            return name;
        }

        return code;
    }

    private String buildObservation(String status, String reference) {
        List<String> parts = new ArrayList<>();

        if (status != null && !"ACTIVE".equals(status)) {
            parts.add(status);
        }

        if (reference == null || reference.isBlank()) {
            parts.add("Sin referencia");
        }

        return String.join(" | ", parts);
    }

    private BigDecimal safe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
