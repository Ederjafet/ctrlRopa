package com.hpsqsoft.ctrlropa.security.audit;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "security.audit")
public class SecurityAuditRetentionProperties {

    private int retentionDays = 180;
    private String cleanupCron = "0 0 3 * * *";
    private final Cleanup cleanup = new Cleanup();

    public int getRetentionDays() {
        return retentionDays;
    }

    public void setRetentionDays(int retentionDays) {
        this.retentionDays = retentionDays;
    }

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
