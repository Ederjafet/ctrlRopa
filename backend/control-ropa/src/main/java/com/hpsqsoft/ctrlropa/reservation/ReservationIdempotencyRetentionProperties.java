package com.hpsqsoft.ctrlropa.reservation;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "reservation.idempotency")
public class ReservationIdempotencyRetentionProperties {

    private String cleanupCron = "0 30 3 * * *";
    private final Cleanup cleanup = new Cleanup();

    public String getCleanupCron() {
        return cleanupCron;
    }

    public void setCleanupCron(String cleanupCron) {
        this.cleanupCron = cleanupCron;
    }

    public Cleanup getCleanup() {
        return cleanup;
    }

    public static class Cleanup {
        private boolean enabled = true;

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }
    }
}
