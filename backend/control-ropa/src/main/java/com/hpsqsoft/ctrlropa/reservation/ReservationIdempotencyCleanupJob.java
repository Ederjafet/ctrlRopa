package com.hpsqsoft.ctrlropa.reservation;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ReservationIdempotencyCleanupJob {

    private final ReservationIdempotencyCleanupService cleanupService;

    public ReservationIdempotencyCleanupJob(ReservationIdempotencyCleanupService cleanupService) {
        this.cleanupService = cleanupService;
    }

    @Scheduled(cron = "${reservation.idempotency.cleanup-cron:0 30 3 * * *}")
    public void runScheduledCleanup() {
        cleanupService.cleanupExpiredKeys();
    }
}
