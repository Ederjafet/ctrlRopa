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
    private static final int ALERT_LIMIT = 20;
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
    public String exportEventsCsv(String eventType,
                                  String email,
                                  Long companyId,
                                  Long branchId,
                                  Integer statusCode,
                                  String dateFrom,
                                  String dateTo,
                                  String path) {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.VIEW_SECURITY_AUDIT);

        QueryParts queryParts = buildWhere(eventType, email, companyId, branchId, statusCode, dateFrom, dateTo, path);

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
                  target_resource_id
                FROM security_audit_events
                WHERE %s
                ORDER BY occurred_at DESC, id DESC
                LIMIT ?
                """.formatted(queryParts.where()),
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
                        null
                ),
                withLimit(queryParts.params(), 5000)
        );

        StringBuilder csv = new StringBuilder();
        appendCsvLine(csv, List.of(
                "id",
                "occurred_at",
                "user_id",
                "email",
                "company_id",
                "branch_id",
                "event_type",
                "http_method",
                "path",
                "status_code",
                "reason",
                "remote_ip",
                "user_agent",
                "target_resource_type",
                "target_resource_id"
        ));
        for (SecurityAuditEventResponse.SecurityAuditEventLine event : events) {
            appendCsvLine(csv, Arrays.asList(
                    event.getId(),
                    event.getOccurredAt(),
                    event.getUserId(),
                    event.getEmail(),
                    event.getCompanyId(),
                    event.getBranchId(),
                    event.getEventType(),
                    event.getHttpMethod(),
                    event.getPath(),
                    event.getStatusCode(),
                    event.getReason(),
                    event.getRemoteIp(),
                    event.getUserAgent(),
                    event.getTargetResourceType(),
                    event.getTargetResourceId()
            ));
        }
        return csv.toString();
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

    @Transactional(readOnly = true)
    public SecurityAuditAlertsResponse alerts(Integer windowMinutes,
                                              Integer threshold,
                                              Long companyId,
                                              Long branchId,
                                              String email) {
        accessService.assertCan(currentUser.getUserId(), PermissionCode.VIEW_SECURITY_AUDIT);

        int safeWindowMinutes = windowMinutes == null || windowMinutes <= 0 ? 60 : windowMinutes;
        int safeThreshold = threshold == null || threshold <= 0 ? 5 : threshold;
        QueryParts base = buildAlertWhere(safeWindowMinutes, companyId, branchId, email);

        List<SecurityAuditAlertsResponse.SecurityAuditAlertLine> alerts = new ArrayList<>();
        alerts.addAll(statusAlerts(base, safeThreshold, 401, "MANY_401", "Muchos eventos 401 en ventana reciente"));
        alerts.addAll(statusAlerts(base, safeThreshold, 403, "MANY_403", "Muchos eventos 403 en ventana reciente"));
        alerts.addAll(groupedEventAlerts(base, safeThreshold, SecurityAuditEventType.PERMISSION_DENIED.name(),
                "MANY_PERMISSION_DENIED_BY_EMAIL", "Muchos permisos denegados del mismo email", "email"));
        alerts.addAll(groupedEventAlerts(base, safeThreshold, SecurityAuditEventType.TOKEN_REVOKED.name(),
                "MANY_TOKEN_REVOKED_BY_EMAIL", "Muchos tokens revocados del mismo email", "email"));
        alerts.addAll(tenantDeniedAlerts(base, safeThreshold));
        alerts.addAll(pathAlerts(base, safeThreshold));
        alerts.addAll(groupedEventAlerts(base, safeThreshold, SecurityAuditEventType.LOGIN_BLOCKED_NO_ACCESS.name(),
                "MANY_LOGIN_BLOCKED_NO_ACCESS", "Multiples bloqueos NO_ACCESS", "email"));

        alerts.sort((left, right) -> {
            int severityCompare = Integer.compare(severityRank(right.getSeverity()), severityRank(left.getSeverity()));
            if (severityCompare != 0) {
                return severityCompare;
            }
            int countCompare = Long.compare(right.getCount(), left.getCount());
            if (countCompare != 0) {
                return countCompare;
            }
            LocalDateTime rightLastSeen = right.getLastSeen();
            LocalDateTime leftLastSeen = left.getLastSeen();
            if (rightLastSeen == null && leftLastSeen == null) {
                return 0;
            }
            if (rightLastSeen == null) {
                return -1;
            }
            if (leftLastSeen == null) {
                return 1;
            }
            return rightLastSeen.compareTo(leftLastSeen);
        });

        if (alerts.size() > ALERT_LIMIT) {
            alerts = alerts.subList(0, ALERT_LIMIT);
        }

        return new SecurityAuditAlertsResponse(alerts.size(), alerts);
    }

    @Transactional(readOnly = true)
    public String exportAlertsCsv(Integer windowMinutes,
                                  Integer threshold,
                                  Long companyId,
                                  Long branchId,
                                  String email) {
        SecurityAuditAlertsResponse response = alerts(windowMinutes, threshold, companyId, branchId, email);

        StringBuilder csv = new StringBuilder();
        appendCsvLine(csv, List.of(
                "severity",
                "alert_type",
                "description",
                "count",
                "email",
                "path",
                "company_id",
                "branch_id",
                "first_seen",
                "last_seen"
        ));
        for (SecurityAuditAlertsResponse.SecurityAuditAlertLine alert : response.getAlerts()) {
            appendCsvLine(csv, Arrays.asList(
                    alert.getSeverity(),
                    alert.getAlertType(),
                    alert.getDescription(),
                    alert.getCount(),
                    alert.getEmail(),
                    alert.getPath(),
                    alert.getCompanyId(),
                    alert.getBranchId(),
                    alert.getFirstSeen(),
                    alert.getLastSeen()
            ));
        }
        return csv.toString();
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

    private List<SecurityAuditAlertsResponse.SecurityAuditAlertLine> statusAlerts(QueryParts base,
                                                                                  int threshold,
                                                                                  int statusCode,
                                                                                  String alertType,
                                                                                  String description) {
        QueryParts scoped = appendClause(base, "status_code = ?", statusCode);
        return jdbcTemplate.query(
                """
                SELECT COUNT(*) AS total, MIN(occurred_at) AS first_seen, MAX(occurred_at) AS last_seen
                FROM security_audit_events
                WHERE %s
                HAVING COUNT(*) >= ?
                """.formatted(scoped.where()),
                (rs, rowNum) -> toAlertLine(
                        alertType,
                        description,
                        rs.getLong("total"),
                        null,
                        null,
                        null,
                        null,
                        toLocalDateTime(rs.getTimestamp("first_seen")),
                        toLocalDateTime(rs.getTimestamp("last_seen")),
                        threshold
                ),
                withThreshold(scoped.params(), threshold)
        );
    }

    private List<SecurityAuditAlertsResponse.SecurityAuditAlertLine> groupedEventAlerts(QueryParts base,
                                                                                        int threshold,
                                                                                        String eventType,
                                                                                        String alertType,
                                                                                        String description,
                                                                                        String groupColumn) {
        QueryParts scoped = appendClause(base, "event_type = ? AND " + groupColumn + " IS NOT NULL AND " + groupColumn + " <> ''", eventType);
        return jdbcTemplate.query(
                """
                SELECT
                  %s AS group_value,
                  COUNT(*) AS total,
                  MIN(occurred_at) AS first_seen,
                  MAX(occurred_at) AS last_seen
                FROM security_audit_events
                WHERE %s
                GROUP BY %s
                HAVING COUNT(*) >= ?
                ORDER BY total DESC, group_value ASC
                LIMIT ?
                """.formatted(groupColumn, scoped.where(), groupColumn),
                (rs, rowNum) -> toAlertLine(
                        alertType,
                        description,
                        rs.getLong("total"),
                        "email".equals(groupColumn) ? rs.getString("group_value") : null,
                        "path".equals(groupColumn) ? rs.getString("group_value") : null,
                        null,
                        null,
                        toLocalDateTime(rs.getTimestamp("first_seen")),
                        toLocalDateTime(rs.getTimestamp("last_seen")),
                        threshold
                ),
                withThresholdAndLimit(scoped.params(), threshold)
        );
    }

    private List<SecurityAuditAlertsResponse.SecurityAuditAlertLine> tenantDeniedAlerts(QueryParts base, int threshold) {
        String placeholders = "?,?,?";
        QueryParts scoped = appendClause(
                base,
                "event_type IN (" + placeholders + ")",
                SecurityAuditEventType.BRANCH_DENIED.name(),
                SecurityAuditEventType.COMPANY_DENIED.name(),
                SecurityAuditEventType.CROSS_TENANT_DENIED.name()
        );
        return jdbcTemplate.query(
                """
                SELECT
                  event_type,
                  company_id,
                  branch_id,
                  COUNT(*) AS total,
                  MIN(occurred_at) AS first_seen,
                  MAX(occurred_at) AS last_seen
                FROM security_audit_events
                WHERE %s
                GROUP BY event_type, company_id, branch_id
                HAVING COUNT(*) >= ?
                ORDER BY total DESC, event_type ASC
                LIMIT ?
                """.formatted(scoped.where()),
                (rs, rowNum) -> toAlertLine(
                        "MANY_TENANT_DENIED",
                        "Muchos bloqueos de branch/company/tenant",
                        rs.getLong("total"),
                        null,
                        null,
                        rs.getObject("company_id", Long.class),
                        rs.getObject("branch_id", Long.class),
                        toLocalDateTime(rs.getTimestamp("first_seen")),
                        toLocalDateTime(rs.getTimestamp("last_seen")),
                        threshold
                ),
                withThresholdAndLimit(scoped.params(), threshold)
        );
    }

    private List<SecurityAuditAlertsResponse.SecurityAuditAlertLine> pathAlerts(QueryParts base, int threshold) {
        QueryParts scoped = appendClause(base, "path IS NOT NULL AND path <> ''");
        return jdbcTemplate.query(
                """
                SELECT
                  path,
                  COUNT(*) AS total,
                  MIN(occurred_at) AS first_seen,
                  MAX(occurred_at) AS last_seen
                FROM security_audit_events
                WHERE %s
                GROUP BY path
                HAVING COUNT(*) >= ?
                ORDER BY total DESC, path ASC
                LIMIT ?
                """.formatted(scoped.where()),
                (rs, rowNum) -> toAlertLine(
                        "MANY_EVENTS_SAME_PATH",
                        "Muchos bloqueos hacia el mismo path",
                        rs.getLong("total"),
                        null,
                        rs.getString("path"),
                        null,
                        null,
                        toLocalDateTime(rs.getTimestamp("first_seen")),
                        toLocalDateTime(rs.getTimestamp("last_seen")),
                        threshold
                ),
                withThresholdAndLimit(scoped.params(), threshold)
        );
    }

    private SecurityAuditAlertsResponse.SecurityAuditAlertLine toAlertLine(String alertType,
                                                                           String description,
                                                                           long count,
                                                                           String email,
                                                                           String path,
                                                                           Long companyId,
                                                                           Long branchId,
                                                                           LocalDateTime firstSeen,
                                                                           LocalDateTime lastSeen,
                                                                           int threshold) {
        return new SecurityAuditAlertsResponse.SecurityAuditAlertLine(
                severityFor(count, threshold),
                alertType,
                description,
                count,
                email,
                path,
                companyId,
                branchId,
                firstSeen,
                lastSeen
        );
    }

    private Object[] withThreshold(List<Object> params, int threshold) {
        List<Object> scopedParams = new ArrayList<>(params);
        scopedParams.add(threshold);
        return scopedParams.toArray();
    }

    private Object[] withThresholdAndLimit(List<Object> params, int threshold) {
        List<Object> scopedParams = new ArrayList<>(params);
        scopedParams.add(threshold);
        scopedParams.add(ALERT_LIMIT);
        return scopedParams.toArray();
    }

    private Object[] withLimit(List<Object> params, int limit) {
        List<Object> scopedParams = new ArrayList<>(params);
        scopedParams.add(limit);
        return scopedParams.toArray();
    }

    private void appendCsvLine(StringBuilder csv, List<?> values) {
        for (int i = 0; i < values.size(); i++) {
            if (i > 0) {
                csv.append(',');
            }
            csv.append(csvValue(values.get(i)));
        }
        csv.append('\n');
    }

    private String csvValue(Object value) {
        if (value == null) {
            return "";
        }
        String text = String.valueOf(value);
        String escaped = text.replace("\"", "\"\"");
        return "\"" + escaped + "\"";
    }

    private QueryParts buildAlertWhere(int windowMinutes, Long companyId, Long branchId, String email) {
        List<String> clauses = new ArrayList<>();
        List<Object> params = new ArrayList<>();
        clauses.add("occurred_at >= ?");
        params.add(Timestamp.valueOf(LocalDateTime.now().minusMinutes(windowMinutes)));

        if (companyId != null) {
            clauses.add("company_id = ?");
            params.add(companyId);
        }

        if (branchId != null) {
            clauses.add("branch_id = ?");
            params.add(branchId);
        }

        if (hasText(email)) {
            clauses.add("LOWER(email) LIKE ?");
            params.add("%" + email.trim().toLowerCase() + "%");
        }

        return new QueryParts(String.join(" AND ", clauses), params);
    }

    private String severityFor(long count, int threshold) {
        if (count >= (long) threshold * 4) {
            return "CRITICAL";
        }
        if (count >= (long) threshold * 2) {
            return "HIGH";
        }
        if (count >= threshold) {
            return "MEDIUM";
        }
        return "LOW";
    }

    private int severityRank(String severity) {
        return switch (severity) {
            case "CRITICAL" -> 4;
            case "HIGH" -> 3;
            case "MEDIUM" -> 2;
            default -> 1;
        };
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
