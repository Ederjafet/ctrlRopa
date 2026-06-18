package com.hpsqsoft.ctrlropa.security.audit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;

@Service
public class SecurityAuditCleanupService {

    private static final Logger log = LoggerFactory.getLogger(SecurityAuditCleanupService.class);

    private final SecurityAuditEventRepository repository;
    private final SecurityAuditRetentionProperties properties;
    private final Clock clock;

    public SecurityAuditCleanupService(SecurityAuditEventRepository repository,
                                       SecurityAuditRetentionProperties properties,
                                       Clock clock) {
        this.repository = repository;
        this.properties = properties;
        this.clock = clock;
    }

    @Transactional
    public long cleanupOldEvents() {
        if (!properties.getCleanup().isEnabled()) {
            log.debug("Security audit cleanup skipped because it is disabled");
            return 0L;
        }

        int retentionDays = properties.getRetentionDays();
        if (retentionDays <= 0) {
            log.warn("Security audit cleanup skipped because retention-days is unsafe: {}", retentionDays);
            return 0L;
        }

        LocalDateTime cutoff = LocalDateTime.now(clock).minusDays(retentionDays);
        long deleted = repository.deleteByOccurredAtBefore(cutoff);
        log.info("Security audit cleanup deleted {} events older than {}", deleted, cutoff);
        return deleted;
    }
}
