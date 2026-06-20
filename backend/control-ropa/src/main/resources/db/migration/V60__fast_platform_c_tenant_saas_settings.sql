SET NAMES utf8mb4;
START TRANSACTION;

CREATE TABLE IF NOT EXISTS company_modules (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  module_code VARCHAR(64) NOT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_company_modules_company_module (company_id, module_code),
  KEY idx_company_modules_company_enabled (company_id, enabled),
  CONSTRAINT fk_company_modules_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS company_limits (
  company_id BIGINT UNSIGNED NOT NULL,
  max_users INT NULL,
  max_branches INT NULL,
  max_items INT NULL,
  max_live_sessions_per_month INT NULL,
  max_shipments_per_month INT NULL,
  max_packages_per_month INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (company_id),
  CONSTRAINT fk_company_limits_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO permissions (code, name) VALUES
  ('MANAGE_PLATFORM_BRANCHES', 'Administrar sucursales desde plataforma'),
  ('MANAGE_PLATFORM_USERS', 'Administrar usuarios desde plataforma'),
  ('MANAGE_COMPANY_BRANCHES', 'Administrar sucursales de la propia empresa'),
  ('MANAGE_COMPANY_USERS', 'Administrar usuarios de la propia empresa');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'MANAGE_PLATFORM_BRANCHES',
  'MANAGE_PLATFORM_USERS'
)
WHERE r.code = 'PLATFORM_OWNER';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'MANAGE_COMPANY_BRANCHES',
  'MANAGE_COMPANY_USERS'
)
WHERE r.code = 'ADMIN';

INSERT IGNORE INTO company_modules (company_id, module_code, enabled)
SELECT c.id, modules.module_code, CASE WHEN c.code = 'APPMODA_PLATFORM' THEN 0 ELSE 1 END
FROM companies c
JOIN (
  SELECT 'INVENTORY' AS module_code
  UNION ALL SELECT 'DOOR_SALES'
  UNION ALL SELECT 'RESERVATIONS'
  UNION ALL SELECT 'CUSTOMER_PACKAGES'
  UNION ALL SELECT 'SHIPMENTS'
  UNION ALL SELECT 'PAYMENTS'
  UNION ALL SELECT 'LIVE'
  UNION ALL SELECT 'REPORTS'
  UNION ALL SELECT 'MULTI_BRANCH'
  UNION ALL SELECT 'CASH_CLOSURES'
  UNION ALL SELECT 'CONSIGNMENTS'
  UNION ALL SELECT 'RETURNS_REFUNDS'
) modules;

INSERT IGNORE INTO company_limits (company_id, max_users, max_branches)
SELECT id, NULL, NULL
FROM companies;

COMMIT;
