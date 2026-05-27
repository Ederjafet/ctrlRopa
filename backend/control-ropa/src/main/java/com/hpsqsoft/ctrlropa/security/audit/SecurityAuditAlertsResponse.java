package com.hpsqsoft.ctrlropa.security.audit;

import java.time.LocalDateTime;
import java.util.List;

public class SecurityAuditAlertsResponse {

    private long totalAlerts;
    private List<SecurityAuditAlertLine> alerts;

    public SecurityAuditAlertsResponse(long totalAlerts, List<SecurityAuditAlertLine> alerts) {
        this.totalAlerts = totalAlerts;
        this.alerts = alerts;
    }

    public long getTotalAlerts() { return totalAlerts; }

    public List<SecurityAuditAlertLine> getAlerts() { return alerts; }

    public static class SecurityAuditAlertLine {
        private String severity;
        private String alertType;
        private String description;
        private long count;
        private String email;
        private String path;
        private Long companyId;
        private Long branchId;
        private LocalDateTime firstSeen;
        private LocalDateTime lastSeen;

        public SecurityAuditAlertLine(String severity,
                                      String alertType,
                                      String description,
                                      long count,
                                      String email,
                                      String path,
                                      Long companyId,
                                      Long branchId,
                                      LocalDateTime firstSeen,
                                      LocalDateTime lastSeen) {
            this.severity = severity;
            this.alertType = alertType;
            this.description = description;
            this.count = count;
            this.email = email;
            this.path = path;
            this.companyId = companyId;
            this.branchId = branchId;
            this.firstSeen = firstSeen;
            this.lastSeen = lastSeen;
        }

        public String getSeverity() { return severity; }

        public String getAlertType() { return alertType; }

        public String getDescription() { return description; }

        public long getCount() { return count; }

        public String getEmail() { return email; }

        public String getPath() { return path; }

        public Long getCompanyId() { return companyId; }

        public Long getBranchId() { return branchId; }

        public LocalDateTime getFirstSeen() { return firstSeen; }

        public LocalDateTime getLastSeen() { return lastSeen; }
    }
}
