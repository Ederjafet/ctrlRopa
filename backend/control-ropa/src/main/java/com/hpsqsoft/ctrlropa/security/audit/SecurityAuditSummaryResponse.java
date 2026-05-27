package com.hpsqsoft.ctrlropa.security.audit;

import java.time.LocalDateTime;
import java.util.List;

public class SecurityAuditSummaryResponse {

    private long totalEvents;
    private long total401;
    private long total403;
    private List<CountLine> byEventType;
    private List<CountLine> byStatusCode;
    private List<CountLine> byCompany;
    private List<CountLine> byBranch;
    private List<CountLine> topEmails;
    private List<CountLine> topPaths;
    private List<CriticalEventLine> recentCriticalEvents;

    public SecurityAuditSummaryResponse(long totalEvents,
                                        long total401,
                                        long total403,
                                        List<CountLine> byEventType,
                                        List<CountLine> byStatusCode,
                                        List<CountLine> byCompany,
                                        List<CountLine> byBranch,
                                        List<CountLine> topEmails,
                                        List<CountLine> topPaths,
                                        List<CriticalEventLine> recentCriticalEvents) {
        this.totalEvents = totalEvents;
        this.total401 = total401;
        this.total403 = total403;
        this.byEventType = byEventType;
        this.byStatusCode = byStatusCode;
        this.byCompany = byCompany;
        this.byBranch = byBranch;
        this.topEmails = topEmails;
        this.topPaths = topPaths;
        this.recentCriticalEvents = recentCriticalEvents;
    }

    public long getTotalEvents() { return totalEvents; }

    public long getTotal401() { return total401; }

    public long getTotal403() { return total403; }

    public List<CountLine> getByEventType() { return byEventType; }

    public List<CountLine> getByStatusCode() { return byStatusCode; }

    public List<CountLine> getByCompany() { return byCompany; }

    public List<CountLine> getByBranch() { return byBranch; }

    public List<CountLine> getTopEmails() { return topEmails; }

    public List<CountLine> getTopPaths() { return topPaths; }

    public List<CriticalEventLine> getRecentCriticalEvents() { return recentCriticalEvents; }

    public static class CountLine {
        private String key;
        private long count;

        public CountLine(String key, long count) {
            this.key = key;
            this.count = count;
        }

        public String getKey() { return key; }

        public long getCount() { return count; }
    }

    public static class CriticalEventLine {
        private Long id;
        private LocalDateTime occurredAt;
        private String eventType;
        private String email;
        private Long companyId;
        private Long branchId;
        private String httpMethod;
        private String path;
        private Integer statusCode;
        private String reason;

        public CriticalEventLine(Long id,
                                 LocalDateTime occurredAt,
                                 String eventType,
                                 String email,
                                 Long companyId,
                                 Long branchId,
                                 String httpMethod,
                                 String path,
                                 Integer statusCode,
                                 String reason) {
            this.id = id;
            this.occurredAt = occurredAt;
            this.eventType = eventType;
            this.email = email;
            this.companyId = companyId;
            this.branchId = branchId;
            this.httpMethod = httpMethod;
            this.path = path;
            this.statusCode = statusCode;
            this.reason = reason;
        }

        public Long getId() { return id; }

        public LocalDateTime getOccurredAt() { return occurredAt; }

        public String getEventType() { return eventType; }

        public String getEmail() { return email; }

        public Long getCompanyId() { return companyId; }

        public Long getBranchId() { return branchId; }

        public String getHttpMethod() { return httpMethod; }

        public String getPath() { return path; }

        public Integer getStatusCode() { return statusCode; }

        public String getReason() { return reason; }
    }
}
