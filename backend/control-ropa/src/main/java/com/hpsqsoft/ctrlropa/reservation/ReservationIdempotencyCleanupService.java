package com.hpsqsoft.ctrlropa.reservation;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;

@Service
public class ReservationIdempotencyCleanupService {

    private static final Logger log = LoggerFactory.getLogger(ReservationIdempotencyCleanupService.class);

    private final ReservationIdempotencyRepository repository;
    private final ReservationIdempotencyRetentionProperties properties;
    private final Clock clock;

    public ReservationIdempotencyCleanupService(ReservationIdempotencyRepository repository,
                                                ReservationIdempotencyRetentionProperties properties,
                                                Clock clock) {
        this.repository = repository;
        this.properties = properties;
        this.clock = clock;
    }

    @Transactional
    public long cleanupExpiredKeys() {
        if (!properties.getCleanup().isEnabled()) {
            log.debug("Reservation idempotency cleanup skipped because it is disabled");
            return 0L;
        }

        LocalDateTime cutoff = LocalDateTime.now(clock);
        long deleted = repository.deleteByExpiresAtBefore(cutoff);
        log.info("Reservation idempotency cleanup deleted {} keys expired before {}", deleted, cutoff);
        return deleted;
    }
}
