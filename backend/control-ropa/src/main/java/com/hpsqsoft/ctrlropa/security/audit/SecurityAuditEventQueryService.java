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
import java.util.List;

@Service
public class SecurityAuditEventQueryService {

    private static final int MAX_PAGE_SIZE = 200;

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
