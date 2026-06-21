package com.hpsqsoft.ctrlropa.platform;

import java.time.LocalDateTime;
import java.util.List;

public record PlatformAuditEventsResponse(
        List<AuditEvent> items,
        Summary summary,
        List<CoverageItem> coverage
) {
    public record AuditEvent(
            Long id,
            String eventType,
            String category,
            LocalDateTime occurredAt,
            String actorEmail,
            String actorName,
            Long companyId,
            String companyName,
            String title,
            String description,
            String severity,
            String entityType,
            String entityId,
            String beforeSummary,
            String afterSummary,
            String technicalDetail
    ) {
    }

    public record Summary(
            Integer todayCount,
            Integer last7DaysCount,
            Integer companyChangesCount,
            Integer subscriptionChangesCount,
            Integer configurationChangesCount,
            Integer totalEvents
    ) {
    }

    public record CoverageItem(
            String label,
            String status,
            String description
    ) {
    }
}
