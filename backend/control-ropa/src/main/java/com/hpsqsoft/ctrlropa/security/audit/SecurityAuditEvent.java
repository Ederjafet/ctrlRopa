package com.hpsqsoft.ctrlropa.security.audit;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "security_audit_events")
public class SecurityAuditEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "occurred_at", nullable = false)
    private LocalDateTime occurredAt;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "email")
    private String email;

    @Column(name = "company_id")
    private Long companyId;

    @Column(name = "branch_id")
    private Long branchId;

    @Column(name = "event_type", nullable = false)
    private String eventType;

    @Column(name = "http_method")
    private String httpMethod;

    @Column(name = "path")
    private String path;

    @Column(name = "status_code")
    private Integer statusCode;

    @Column(name = "reason")
    private String reason;

    @Column(name = "remote_ip")
    private String remoteIp;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(name = "target_resource_type")
    private String targetResourceType;

    @Column(name = "target_resource_id")
    private String targetResourceId;

    @Column(name = "metadata_json")
    private String metadataJson;

    @PrePersist
    public void prePersist() {
        if (occurredAt == null) {
            occurredAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setCompanyId(Long companyId) {
        this.companyId = companyId;
    }

    public void setBranchId(Long branchId) {
        this.branchId = branchId;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public void setHttpMethod(String httpMethod) {
        this.httpMethod = httpMethod;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public void setStatusCode(Integer statusCode) {
        this.statusCode = statusCode;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public void setRemoteIp(String remoteIp) {
        this.remoteIp = remoteIp;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public void setTargetResourceType(String targetResourceType) {
        this.targetResourceType = targetResourceType;
    }

    public void setTargetResourceId(String targetResourceId) {
        this.targetResourceId = targetResourceId;
    }

    public void setMetadataJson(String metadataJson) {
        this.metadataJson = metadataJson;
    }
}
