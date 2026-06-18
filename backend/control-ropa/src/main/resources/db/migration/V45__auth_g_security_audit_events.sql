CREATE TABLE IF NOT EXISTS security_audit_events (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id BIGINT UNSIGNED NULL,
    email VARCHAR(255) NULL,
    company_id BIGINT UNSIGNED NULL,
    branch_id BIGINT UNSIGNED NULL,
    event_type VARCHAR(80) NOT NULL,
    http_method VARCHAR(10) NULL,
    path VARCHAR(500) NULL,
    status_code INT NULL,
    reason VARCHAR(500) NULL,
    remote_ip VARCHAR(80) NULL,
    user_agent VARCHAR(500) NULL,
    target_resource_type VARCHAR(80) NULL,
    target_resource_id VARCHAR(120) NULL,
    metadata_json TEXT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_security_audit_events_user
        FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_security_audit_events_company
        FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_security_audit_events_branch
        FOREIGN KEY (branch_id) REFERENCES branches(id)
);

CREATE INDEX idx_security_audit_events_occurred_at
    ON security_audit_events (occurred_at);

CREATE INDEX idx_security_audit_events_user_id
    ON security_audit_events (user_id);

CREATE INDEX idx_security_audit_events_company_id
    ON security_audit_events (company_id);

CREATE INDEX idx_security_audit_events_event_type
    ON security_audit_events (event_type);
