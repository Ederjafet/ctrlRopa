SET NAMES utf8mb4;

START TRANSACTION;

CREATE TABLE IF NOT EXISTS company_licenses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  license_type VARCHAR(32) NOT NULL DEFAULT 'PERPETUAL',
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  purchase_amount DECIMAL(12,2) NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'MXN',
  payment_date DATE NULL,
  payment_method VARCHAR(64) NULL,
  payment_reference VARCHAR(150) NULL,
  notes VARCHAR(1000) NULL,
  valid_from DATE NULL,
  valid_until DATE NULL,
  no_expiration TINYINT(1) NOT NULL DEFAULT 1,
  unlimited_commercial_use TINYINT(1) NOT NULL DEFAULT 1,
  created_by_user_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_company_licenses_company (company_id),
  KEY idx_company_licenses_status (status),
  CONSTRAINT fk_company_licenses_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_company_licenses_user FOREIGN KEY (created_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS company_service_agreements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  service_type VARCHAR(64) NOT NULL DEFAULT 'HOSTING_INFRASTRUCTURE',
  deployment_type VARCHAR(32) NOT NULL DEFAULT 'CLIENT_HOSTED',
  status VARCHAR(32) NOT NULL DEFAULT 'NOT_APPLICABLE',
  annual_amount DECIMAL(12,2) NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'MXN',
  start_date DATE NULL,
  end_date DATE NULL,
  auto_renew TINYINT(1) NOT NULL DEFAULT 0,
  payment_method VARCHAR(64) NULL,
  payment_reference VARCHAR(150) NULL,
  notes VARCHAR(1000) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_company_service_agreements_company_type (company_id, service_type),
  KEY idx_company_service_agreements_status (status),
  KEY idx_company_service_agreements_end_date (end_date),
  CONSTRAINT fk_company_service_agreements_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO permissions (code, name) VALUES
  ('VIEW_PLATFORM_LICENSES', 'Ver licencias comerciales de plataforma'),
  ('MANAGE_PLATFORM_LICENSES', 'Administrar licencias comerciales de plataforma'),
  ('VIEW_PLATFORM_SERVICE_AGREEMENTS', 'Ver servicios anuales de plataforma'),
  ('MANAGE_PLATFORM_SERVICE_AGREEMENTS', 'Administrar servicios anuales de plataforma');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'VIEW_PLATFORM_LICENSES',
  'MANAGE_PLATFORM_LICENSES',
  'VIEW_PLATFORM_SERVICE_AGREEMENTS',
  'MANAGE_PLATFORM_SERVICE_AGREEMENTS'
)
WHERE r.code = 'PLATFORM_OWNER';

COMMIT;
