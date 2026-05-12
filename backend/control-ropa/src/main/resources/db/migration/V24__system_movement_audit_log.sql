SET NAMES utf8mb4;
START TRANSACTION;

CREATE TABLE IF NOT EXISTS system_movement_audit_log (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  category VARCHAR(32) NOT NULL DEFAULT 'NON_FINANCIAL',
  event_type VARCHAR(80) NOT NULL,
  http_method VARCHAR(12) NOT NULL,
  request_path VARCHAR(255) NOT NULL,
  query_string VARCHAR(500) NULL,
  status_code INT NULL,
  branch_id BIGINT UNSIGNED NULL,
  user_id BIGINT UNSIGNED NULL,
  user_name VARCHAR(150) NULL,
  detail VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_system_audit_created_at (created_at),
  KEY idx_system_audit_branch (branch_id),
  KEY idx_system_audit_user (user_id),
  KEY idx_system_audit_event_type (event_type),

  CONSTRAINT fk_system_audit_branch
    FOREIGN KEY (branch_id) REFERENCES branches(id),

  CONSTRAINT fk_system_audit_user
    FOREIGN KEY (user_id) REFERENCES users(id)
);

COMMIT;
