package com.hpsqsoft.ctrlropa.security.audit;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class SecurityAuditCleanupJob {

    private final SecurityAuditCleanupService cleanupService;

    public SecurityAuditCleanupJob(SecurityAuditCleanupService cleanupService) {
        this.cleanupService = cleanupService;
    }

    @Scheduled(cron = "${security.audit.cleanup-cron:0 0 3 * * *}")
    public void runScheduledCleanup() {
        cleanupService.cleanupOldEvents();
    }
}
