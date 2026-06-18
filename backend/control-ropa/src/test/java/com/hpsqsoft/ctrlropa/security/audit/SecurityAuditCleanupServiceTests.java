package com.hpsqsoft.ctrlropa.security.audit;

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

class SecurityAuditCleanupServiceTests {

    private final SecurityAuditEventRepository repository = mock(SecurityAuditEventRepository.class);
    private final SecurityAuditRetentionProperties properties = new SecurityAuditRetentionProperties();
    private final Clock clock = Clock.fixed(
            Instant.parse("2026-05-27T09:00:00Z"),
            ZoneId.of("America/Mexico_City")
    );
    private final SecurityAuditCleanupService service = new SecurityAuditCleanupService(repository, properties, clock);

    @Test
    void deletesEventsOlderThanRetentionDays() {
        properties.setRetentionDays(180);
        when(repository.deleteByOccurredAtBefore(any(LocalDateTime.class))).thenReturn(3L);

        long deleted = service.cleanupOldEvents();

        assertEquals(3L, deleted);
        verify(repository).deleteByOccurredAtBefore(LocalDateTime.now(clock).minusDays(180));
    }

    @Test
    void keepsRecentEventsByUsingCutoffDateOnly() {
        properties.setRetentionDays(7);
        when(repository.deleteByOccurredAtBefore(LocalDateTime.now(clock).minusDays(7))).thenReturn(0L);

        long deleted = service.cleanupOldEvents();

        assertEquals(0L, deleted);
        verify(repository).deleteByOccurredAtBefore(LocalDateTime.now(clock).minusDays(7));
    }

    @Test
    void cleanupDisabledDoesNotDeleteAnything() {
        properties.getCleanup().setEnabled(false);

        long deleted = service.cleanupOldEvents();

        assertEquals(0L, deleted);
        verify(repository, never()).deleteByOccurredAtBefore(any());
    }

    @Test
    void zeroRetentionIsUnsafeAndDoesNotDeleteAnything() {
        properties.setRetentionDays(0);

        long deleted = service.cleanupOldEvents();

        assertEquals(0L, deleted);
        verify(repository, never()).deleteByOccurredAtBefore(any());
    }

    @Test
    void negativeRetentionIsUnsafeAndDoesNotDeleteAnything() {
        properties.setRetentionDays(-1);

        long deleted = service.cleanupOldEvents();

        assertEquals(0L, deleted);
        verify(repository, never()).deleteByOccurredAtBefore(any());
    }
}
