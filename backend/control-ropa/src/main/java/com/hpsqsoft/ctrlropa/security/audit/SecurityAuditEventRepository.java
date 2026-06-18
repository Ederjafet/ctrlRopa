package com.hpsqsoft.ctrlropa.security.audit;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface SecurityAuditEventRepository extends JpaRepository<SecurityAuditEvent, Long> {
    long deleteByOccurredAtBefore(LocalDateTime cutoff);
}
