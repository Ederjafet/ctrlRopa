-- SOLO QA - Fix Fase 2H para usuarios QA tenant-aware.
-- No es migracion Flyway. No ejecutar en PROD.
-- Objetivo: asegurar usuarios QA requeridos para smoke tenant, permisos, reportes y soporte.
-- Password de los usuarios corregidos: Qa12345!
-- Script idempotente y acotado a:
--   qa.sinpermisos@local.test
--   qa.reportes@local.test
--   qa.soporte@local.test

SET NAMES utf8mb4;
START TRANSACTION;

SELECT id INTO @default_company_id FROM companies WHERE code = 'DEFAULT' AND status = 'ACTIVE' LIMIT 1;
SELECT id INTO @qa_centro_id FROM branches WHERE code = 'QA_CTR' LIMIT 1;
SELECT id INTO @qa_veracruz_id FROM branches WHERE code = 'QA_VER' LIMIT 1;

-- En QA, las sucursales de prueba deben quedar bajo la company DEFAULT mientras no exista dataset Empresa A/B.
UPDATE branches
SET company_id = @default_company_id,
    status = 'ACTIVE'
WHERE code IN ('QA_CTR', 'QA_VER')
  AND @default_company_id IS NOT NULL;

INSERT IGNORE INTO roles (code, name) VALUES
  ('REPORTS', 'Reportes'),
  ('NO_ACCESS', 'Sin permisos'),
  ('SUPPORT_TECH', 'Soporte tecnico');

INSERT IGNORE INTO permissions (code, name) VALUES
  ('VIEW_REPORTS', 'Ver reportes'),
  ('VIEW_CUSTOMERS', 'Ver clientes'),
  ('VIEW_INVENTORY', 'Ver inventario'),
  ('VIEW_DEPOSIT_REPORTS', 'Ver reporte de depositos'),
  ('MANAGE_USERS', 'Administrar usuarios'),
  ('MANAGE_ROLES', 'Administrar roles'),
  ('MANAGE_SECURITY_SETTINGS', 'Administrar parametros de seguridad'),
  ('MANAGE_INCIDENTS', 'Administrar incidencias');

INSERT INTO users (
  branch_id, name, email, phone, password_hash, password_change_required, password_updated_at, status
)
SELECT
  b.id, 'QA Reportes Centro', 'qa.reportes@local.test', '5550000011',
  '{noop}Qa12345!', 0, CURRENT_TIMESTAMP, 'ACTIVE'
FROM branches b
WHERE b.code = 'QA_CTR'
ON DUPLICATE KEY UPDATE
  branch_id = VALUES(branch_id),
  name = VALUES(name),
  phone = VALUES(phone),
  password_hash = VALUES(password_hash),
  password_change_required = 0,
  password_updated_at = CURRENT_TIMESTAMP,
  status = 'ACTIVE';

INSERT INTO users (
  branch_id, name, email, phone, password_hash, password_change_required, password_updated_at, status
)
SELECT
  b.id, 'QA Usuario Sin Permisos', 'qa.sinpermisos@local.test', '5550000012',
  '{noop}Qa12345!', 0, CURRENT_TIMESTAMP, 'ACTIVE'
FROM branches b
WHERE b.code = 'QA_CTR'
ON DUPLICATE KEY UPDATE
  branch_id = VALUES(branch_id),
  name = VALUES(name),
  phone = VALUES(phone),
  password_hash = VALUES(password_hash),
  password_change_required = 0,
  password_updated_at = CURRENT_TIMESTAMP,
  status = 'ACTIVE';

INSERT INTO users (
  branch_id, name, email, phone, password_hash, password_change_required, password_updated_at, status
)
SELECT
  b.id, 'QA Soporte Tecnico', 'qa.soporte@local.test', '5550000013',
  '{noop}Qa12345!', 0, CURRENT_TIMESTAMP, 'ACTIVE'
FROM branches b
WHERE b.code = 'QA_CTR'
ON DUPLICATE KEY UPDATE
  branch_id = VALUES(branch_id),
  name = VALUES(name),
  phone = VALUES(phone),
  password_hash = VALUES(password_hash),
  password_change_required = 0,
  password_updated_at = CURRENT_TIMESTAMP,
  status = 'ACTIVE';

INSERT INTO user_companies (user_id, company_id, is_primary, status)
SELECT DISTINCT u.id, b.company_id, 1, 'ACTIVE'
FROM users u
JOIN branches b ON b.id = u.branch_id
WHERE u.email IN (
  'qa.reportes@local.test',
  'qa.sinpermisos@local.test',
  'qa.soporte@local.test'
)
  AND b.company_id IS NOT NULL
ON DUPLICATE KEY UPDATE
  is_primary = 1,
  status = 'ACTIVE';

INSERT INTO user_branches (user_id, branch_id, is_primary)
SELECT u.id, b.id, IF(b.code = 'QA_CTR', 1, 0)
FROM users u
JOIN branches b ON b.code IN ('QA_CTR', 'QA_VER')
WHERE u.email IN (
  'qa.reportes@local.test',
  'qa.sinpermisos@local.test',
  'qa.soporte@local.test'
)
ON DUPLICATE KEY UPDATE
  is_primary = VALUES(is_primary);

DELETE ur FROM user_roles ur
JOIN users u ON u.id = ur.user_id
WHERE u.email IN (
  'qa.reportes@local.test',
  'qa.sinpermisos@local.test',
  'qa.soporte@local.test'
);

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON
  (u.email = 'qa.reportes@local.test' AND r.code = 'REPORTS')
  OR (u.email = 'qa.sinpermisos@local.test' AND r.code = 'NO_ACCESS')
  OR (u.email = 'qa.soporte@local.test' AND r.code = 'SUPPORT_TECH')
WHERE u.email IN (
  'qa.reportes@local.test',
  'qa.sinpermisos@local.test',
  'qa.soporte@local.test'
);

DELETE rp FROM role_permissions rp
JOIN roles r ON r.id = rp.role_id
WHERE r.code = 'NO_ACCESS';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('VIEW_REPORTS', 'VIEW_CUSTOMERS', 'VIEW_INVENTORY', 'VIEW_DEPOSIT_REPORTS')
WHERE r.code = 'REPORTS';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'MANAGE_USERS',
  'MANAGE_ROLES',
  'MANAGE_SECURITY_SETTINGS',
  'VIEW_REPORTS',
  'MANAGE_INCIDENTS'
)
WHERE r.code = 'SUPPORT_TECH';

-- NO_ACCESS queda intencionalmente sin role_permissions ni user_permissions.
DELETE up FROM user_permissions up
JOIN users u ON u.id = up.user_id
WHERE u.email IN (
  'qa.reportes@local.test',
  'qa.sinpermisos@local.test',
  'qa.soporte@local.test'
);

DELETE uls FROM user_login_security uls
JOIN users u ON u.id = uls.user_id
WHERE u.email IN (
  'qa.reportes@local.test',
  'qa.sinpermisos@local.test',
  'qa.soporte@local.test'
);

-- Revocar sesiones legacy para forzar nuevo login con active_company_id/active_branch_id.
UPDATE user_api_sessions s
JOIN users u ON u.id = s.user_id
SET s.revoked_at = CURRENT_TIMESTAMP
WHERE u.email IN (
  'qa.reportes@local.test',
  'qa.sinpermisos@local.test',
  'qa.soporte@local.test'
)
  AND s.revoked_at IS NULL;

COMMIT;

SELECT
  u.email,
  u.status,
  b.code AS branch_code,
  c.code AS company_code,
  CASE WHEN uc.user_id IS NULL THEN 'NO' ELSE 'YES' END AS has_user_company,
  GROUP_CONCAT(DISTINCT r.code ORDER BY r.code) AS roles,
  COUNT(DISTINCT p.code) AS role_permissions
FROM users u
JOIN branches b ON b.id = u.branch_id
JOIN companies c ON c.id = b.company_id
LEFT JOIN user_companies uc ON uc.user_id = u.id AND uc.company_id = c.id AND uc.status = 'ACTIVE'
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN roles r ON r.id = ur.role_id
LEFT JOIN role_permissions rp ON rp.role_id = r.id
LEFT JOIN permissions p ON p.id = rp.permission_id
WHERE u.email IN (
  'qa.reportes@local.test',
  'qa.sinpermisos@local.test',
  'qa.soporte@local.test'
)
GROUP BY u.email, u.status, b.code, c.code, has_user_company
ORDER BY u.email;
