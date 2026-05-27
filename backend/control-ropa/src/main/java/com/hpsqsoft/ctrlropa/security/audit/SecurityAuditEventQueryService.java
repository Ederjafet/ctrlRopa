package com.hpsqsoft.ctrlropa.security.audit;

import com.hpsqsoft.ctrlropa.security.access.AccessService;
import com.hpsqsoft.ctrlropa.security.access.CurrentUser;
import com.hpsqsoft.ctrlropa.security.access.PermissionCode;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
public class SecurityAuditEventQueryService {

    private static final int MAX_PAGE_SIZE = 200;
    private static final int SUMMARY_GROUP_LIMIT = 10;
    private static final List<String> CRITICAL_EVENTS = List.of(
            SecurityAuditEventType.TOKEN_INVALID.name(),
            SecurityAuditEventType.TOKEN_REVOKED.name(),
            SecurityAuditEventType.PERMISSION_DENIED.name(),
            SecurityAuditEventType.BRANCH_DENIED.name(),
            SecurityAuditEventType.COMPANY_DENIED.name(),
            SecurityAuditEventType.CROSS_TENANT_DENIED.name(),
            SecurityAuditEventType.LOGIN_BLOCKED_NO_ACCESS.name(),
            SecurityAuditEventType.LOGIN_BLOCKED_NO_EFFECTIVE_PERMISSIONS.name()
    );

    private final JdbcTemplate jdbcTemplate;
    private final CurrentUser currentUser;
    private final AccessService accessService;

    public SecurityAuditEventQueryService(JdbcTemplate jdbcTemplate,
                                          CurrentUser currentUser,
                                          AccessService accessService) {
        this.jdbcTemplate = jdbcTemplate;
        this.currentUser = currentUser;
        this.accessService = accessService;
    }

    @Transactional(readOnly = true)
    public SecurityAuditEventResponse findEvents(String eventType,
                                                 String email,
                                                 Long companyId,
                                                 Long branchId,
                                                 Integer statusCode,
                                                 String dateFrom,
                                                 String dateTo,
                                                 String path,
                                                 Integer page,
                                                 Integer size) {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.VIEW_SECURITY_AUDIT);

        int safePage = page == null || page < 0 ? 0 : page;
        int safeSize = size == null || size < 1 ? 50 : Math.min(size, MAX_PAGE_SIZE);
        int offset = safePage * safeSize;

        QueryParts queryParts = buildWhere(eventType, email, companyId, branchId, statusCode, dateFrom, dateTo, path);

        Long total = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM security_audit_events WHERE " + queryParts.where(),
                Long.class,
                queryParts.params().toArray()
        );

        List<Object> listParams = new ArrayList<>(queryParts.params());
        listParams.add(safeSize);
        listParams.add(offset);

        List<SecurityAuditEventResponse.SecurityAuditEventLine> events = jdbcTemplate.query(
                """
                SELECT
                  id,
                  occurred_at,
                  user_id,
                  email,
                  company_id,
                  branch_id,
                  event_type,
                  http_method,
                  path,
                  status_code,
                  reason,
                  remote_ip,
                  user_agent,
                  target_resource_type,
                  target_resource_id,
                  metadata_json
                FROM security_audit_events
                WHERE
                """ + queryParts.where() + """

                ORDER BY occurred_at DESC, id DESC
                LIMIT ? OFFSET ?
                """,
                (rs, rowNum) -> new SecurityAuditEventResponse.SecurityAuditEventLine(
                        rs.getLong("id"),
                        toLocalDateTime(rs.getTimestamp("occurred_at")),
                        rs.getObject("user_id", Long.class),
                        rs.getString("email"),
                        rs.getObject("company_id", Long.class),
                        rs.getObject("branch_id", Long.class),
                        rs.getString("event_type"),
                        rs.getString("http_method"),
                        rs.getString("path"),
                        rs.getObject("status_code", Integer.class),
                        rs.getString("reason"),
                        rs.getString("remote_ip"),
                        rs.getString("user_agent"),
                        rs.getString("target_resource_type"),
                        rs.getString("target_resource_id"),
                        rs.getString("metadata_json")
                ),
                listParams.toArray()
        );

        return new SecurityAuditEventResponse(events, safePage, safeSize, total == null ? 0L : total);
    }

    @Transactional(readOnly = true)
    public SecurityAuditSummaryResponse summary(String eventType,
                                                String email,
                                                Long companyId,
                                                Long branchId,
                                                String dateFrom,
                                                String dateTo) {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.VIEW_SECURITY_AUDIT);

        QueryParts queryParts = buildWhere(eventType, email, companyId, branchId, null, dateFrom, dateTo, null);

        long totalEvents = count(queryParts, null);
        long total401 = count(queryParts, "status_code = 401");
        long total403 = count(queryParts, "status_code = 403");

        return new SecurityAuditSummaryResponse(
                totalEvents,
                total401,
                total403,
                countBy(queryParts, "event_type", "event_type IS NOT NULL"),
                countBy(queryParts, "status_code", "status_code IS NOT NULL"),
                countBy(queryParts, "company_id", "company_id IS NOT NULL"),
                countBy(queryParts, "branch_id", "branch_id IS NOT NULL"),
                countBy(queryParts, "email", "email IS NOT NULL AND email <> ''"),
                countBy(queryParts, "path", "path IS NOT NULL AND path <> ''"),
                recentCriticalEvents(queryParts)
        );
    }

    private long count(QueryParts queryParts, String extraClause) {
        QueryParts scoped = appendClause(queryParts, extraClause);
        Long total = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM security_audit_events WHERE " + scoped.where(),
                Long.class,
                scoped.params().toArray()
        );
        return total == null ? 0L : total;
    }

    private List<SecurityAuditSummaryResponse.CountLine> countBy(QueryParts queryParts,
                                                                 String column,
                                                                 String extraClause) {
        QueryParts scoped = appendClause(queryParts, extraClause);
        List<Object> params = new ArrayList<>(scoped.params());
        params.add(SUMMARY_GROUP_LIMIT);

        return jdbcTemplate.query(
                """
                SELECT CAST(%s AS CHAR) AS line_key, COUNT(*) AS total
                FROM security_audit_events
                WHERE %s
                GROUP BY %s
                ORDER BY total DESC, line_key ASC
                LIMIT ?
                """.formatted(column, scoped.where(), column),
                (rs, rowNum) -> new SecurityAuditSummaryResponse.CountLine(
                        rs.getString("line_key"),
                        rs.getLong("total")
                ),
                params.toArray()
        );
    }

    private List<SecurityAuditSummaryResponse.CriticalEventLine> recentCriticalEvents(QueryParts queryParts) {
        String placeholders = String.join(",", CRITICAL_EVENTS.stream().map(event -> "?").toList());
        QueryParts critical = appendClause(queryParts, "event_type IN (" + placeholders + ")", CRITICAL_EVENTS.toArray());
        List<Object> params = new ArrayList<>(critical.params());
        params.add(SUMMARY_GROUP_LIMIT);

        return jdbcTemplate.query(
                """
                SELECT
                  id,
                  occurred_at,
                  event_type,
                  email,
                  company_id,
                  branch_id,
                  http_method,
                  path,
                  status_code,
                  reason
                FROM security_audit_events
                WHERE %s
                ORDER BY occurred_at DESC, id DESC
                LIMIT ?
                """.formatted(critical.where()),
                (rs, rowNum) -> new SecurityAuditSummaryResponse.CriticalEventLine(
                        rs.getLong("id"),
                        toLocalDateTime(rs.getTimestamp("occurred_at")),
                        rs.getString("event_type"),
                        rs.getString("email"),
                        rs.getObject("company_id", Long.class),
                        rs.getObject("branch_id", Long.class),
                        rs.getString("http_method"),
                        rs.getString("path"),
                        rs.getObject("status_code", Integer.class),
                        rs.getString("reason")
                ),
                params.toArray()
        );
    }

    private QueryParts appendClause(QueryParts queryParts, String extraClause, Object... extraParams) {
        if (!hasText(extraClause)) {
            return queryParts;
        }
        List<Object> params = new ArrayList<>(queryParts.params());
        params.addAll(Arrays.asList(extraParams));
        return new QueryParts(queryParts.where() + " AND " + extraClause, params);
    }

    private QueryParts buildWhere(String eventType,
                                  String email,
                                  Long companyId,
                                  Long branchId,
                                  Integer statusCode,
                                  String dateFrom,
                                  String dateTo,
                                  String path) {
        List<String> clauses = new ArrayList<>();
        List<Object> params = new ArrayList<>();
        clauses.add("1 = 1");

        if (hasText(eventType)) {
            clauses.add("event_type = ?");
            params.add(eventType.trim());
        }

        if (hasText(email)) {
            clauses.add("LOWER(email) LIKE ?");
            params.add("%" + email.trim().toLowerCase() + "%");
        }

        if (companyId != null) {
            clauses.add("company_id = ?");
            params.add(companyId);
        }

        if (branchId != null) {
            clauses.add("branch_id = ?");
            params.add(branchId);
        }

        if (statusCode != null) {
            clauses.add("status_code = ?");
            params.add(statusCode);
        }

        LocalDateTime parsedDateFrom = parseDateTime(dateFrom);
        if (parsedDateFrom != null) {
            clauses.add("occurred_at >= ?");
            params.add(Timestamp.valueOf(parsedDateFrom));
        }

        LocalDateTime parsedDateTo = parseDateTime(dateTo);
        if (parsedDateTo != null) {
            clauses.add("occurred_at <= ?");
            params.add(Timestamp.valueOf(parsedDateTo));
        }

        if (hasText(path)) {
            clauses.add("path LIKE ?");
            params.add("%" + path.trim() + "%");
        }

        return new QueryParts(String.join(" AND ", clauses), params);
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isBlank();
    }

    private LocalDateTime parseDateTime(String value) {
        if (!hasText(value)) {
            return null;
        }

        String normalized = value.trim().replace(' ', 'T');
        try {
            return LocalDateTime.parse(normalized);
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException("Fecha invalida: " + value);
        }
    }

    private LocalDateTime toLocalDateTime(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toLocalDateTime();
    }

    private record QueryParts(String where, List<Object> params) {
    }
}
