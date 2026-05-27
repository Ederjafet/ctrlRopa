package com.hpsqsoft.ctrlropa.security.audit;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Service
public class SecurityAuditService {

    private static final Logger log = LoggerFactory.getLogger(SecurityAuditService.class);

    private final SecurityAuditEventRepository repository;

    public SecurityAuditService(SecurityAuditEventRepository repository) {
        this.repository = repository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(SecurityAuditEventType eventType,
                       Long userId,
                       String email,
                       Long companyId,
                       Long branchId,
                       Integer statusCode,
                       String reason) {
        record(eventType, userId, email, companyId, branchId, statusCode, reason, null, null, null);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(SecurityAuditEventType eventType,
                       Long userId,
                       String email,
                       Long companyId,
                       Long branchId,
                       Integer statusCode,
                       String reason,
                       String targetResourceType,
                       String targetResourceId,
                       String metadataJson) {
        try {
            HttpServletRequest request = currentRequest();
            SecurityAuditEvent event = new SecurityAuditEvent();
            event.setEventType(eventType.name());
            event.setUserId(userId);
            event.setEmail(limit(email, 255));
            event.setCompanyId(companyId);
            event.setBranchId(branchId);
            event.setStatusCode(statusCode);
            event.setReason(limit(reason, 500));
            event.setTargetResourceType(limit(targetResourceType, 80));
            event.setTargetResourceId(limit(targetResourceId, 120));
            event.setMetadataJson(metadataJson);

            if (request != null) {
                event.setHttpMethod(limit(request.getMethod(), 10));
                event.setPath(limit(request.getRequestURI(), 500));
                event.setRemoteIp(limit(clientIp(request), 80));
                event.setUserAgent(limit(request.getHeader("User-Agent"), 500));
            }

            repository.save(event);
        } catch (Exception ex) {
            log.debug("No se pudo registrar auditoria de seguridad eventType={}", eventType, ex);
        }
    }

    private HttpServletRequest currentRequest() {
        if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes)) {
            return null;
        }
        return attributes.getRequest();
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String limit(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        return value.length() > maxLength ? value.substring(0, maxLength) : value;
    }
}
