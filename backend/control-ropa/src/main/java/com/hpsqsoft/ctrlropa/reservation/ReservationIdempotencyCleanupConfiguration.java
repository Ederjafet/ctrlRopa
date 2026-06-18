package com.hpsqsoft.ctrlropa.reservation;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(ReservationIdempotencyRetentionProperties.class)
public class ReservationIdempotencyCleanupConfiguration {
}
