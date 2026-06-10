package com.hpsqsoft.ctrlropa.reservation;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ReservationIdempotencyCleanupServiceTests {

    private final ReservationIdempotencyRepository repository = mock(ReservationIdempotencyRepository.class);
    private final ReservationIdempotencyRetentionProperties properties =
            new ReservationIdempotencyRetentionProperties();
    private final Clock clock = Clock.fixed(
            Instant.parse("2026-06-09T09:00:00Z"),
            ZoneId.of("America/Mexico_City")
    );
    private final ReservationIdempotencyCleanupService service =
            new ReservationIdempotencyCleanupService(repository, properties, clock);

    @Test
    void deletesOnlyExpiredKeysUsingCurrentTimeCutoff() {
        LocalDateTime cutoff = LocalDateTime.now(clock);
        when(repository.deleteByExpiresAtBefore(cutoff)).thenReturn(4L);

        long deleted = service.cleanupExpiredKeys();

        assertEquals(4L, deleted);
        verify(repository).deleteByExpiresAtBefore(cutoff);
    }

    @Test
    void cleanupDisabledDoesNotDeleteAnything() {
        properties.getCleanup().setEnabled(false);

        long deleted = service.cleanupExpiredKeys();

        assertEquals(0L, deleted);
        verify(repository, never()).deleteByExpiresAtBefore(any());
    }
}
