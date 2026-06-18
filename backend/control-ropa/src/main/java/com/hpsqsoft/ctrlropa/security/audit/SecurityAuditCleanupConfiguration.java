package com.hpsqsoft.ctrlropa.security.audit;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.time.Clock;

@Configuration
@EnableScheduling
@EnableConfigurationProperties(SecurityAuditRetentionProperties.class)
public class SecurityAuditCleanupConfiguration {

    @Bean
    public Clock securityAuditClock() {
        return Clock.systemDefaultZone();
    }
}
