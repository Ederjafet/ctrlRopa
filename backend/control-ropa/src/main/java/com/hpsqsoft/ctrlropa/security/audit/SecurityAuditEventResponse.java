package com.hpsqsoft.ctrlropa.security.audit;

import java.time.LocalDateTime;
import java.util.List;

public class SecurityAuditEventResponse {

    private List<SecurityAuditEventLine> events;
    private int page;
    private int size;
    private long total;

    public SecurityAuditEventResponse(List<SecurityAuditEventLine> events, int page, int size, long total) {
        this.events = events;
        this.page = page;
        this.size = size;
        this.total = total;
    }

    public List<SecurityAuditEventLine> getEvents() { return events; }
    public int getPage() { return page; }
    public int getSize() { return size; }
    public long getTotal() { return total; }

    public static class SecurityAuditEventLine {
        private Long id;
        private LocalDateTime occurredAt;
        private Long userId;
        private String email;
        private Long companyId;
        private Long branchId;
        private String eventType;
        private String httpMethod;
        private String path;
        private Integer statusCode;
        private String reason;
        private String remoteIp;
        private String userAgent;
        private String targetResourceType;
        private String targetResourceId;
        private String metadataJson;

        public SecurityAuditEventLine(Long id,
                                      LocalDateTime occurredAt,
                                      Long userId,
                                      String email,
                                      Long companyId,
                                      Long branchId,
                                      String eventType,
                                      String httpMethod,
                                      String path,
                                      Integer statusCode,
                                      String reason,
                                      String remoteIp,
                                      String userAgent,
                                      String targetResourceType,
                                      String targetResourceId,
                                      String metadataJson) {
            this.id = id;
            this.occurredAt = occurredAt;
            this.userId = userId;
            this.email = email;
            this.companyId = companyId;
            this.branchId = branchId;
            this.eventType = eventType;
            this.httpMethod = httpMethod;
            this.path = path;
            this.statusCode = statusCode;
            this.reason = reason;
            this.remoteIp = remoteIp;
            this.userAgent = userAgent;
            this.targetResourceType = targetResourceType;
            this.targetResourceId = targetResourceId;
            this.metadataJson = metadataJson;
        }

        public Long getId() { return id; }
        public LocalDateTime getOccurredAt() { return occurredAt; }
        public Long getUserId() { return userId; }
        public String getEmail() { return email; }
        public Long getCompanyId() { return companyId; }
        public Long getBranchId() { return branchId; }
        public String getEventType() { return eventType; }
        public String getHttpMethod() { return httpMethod; }
        public String getPath() { return path; }
        public Integer getStatusCode() { return statusCode; }
        public String getReason() { return reason; }
        public String getRemoteIp() { return remoteIp; }
        public String getUserAgent() { return userAgent; }
        public String getTargetResourceType() { return targetResourceType; }
        public String getTargetResourceId() { return targetResourceId; }
        public String getMetadataJson() { return metadataJson; }
    }
}
