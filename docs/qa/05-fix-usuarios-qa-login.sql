-- SOLO QA - Fix Fase 1H para KI-004/KI-005.
-- No es migracion Flyway. No ejecutar en PROD.
-- Objetivo: asegurar login de usuarios QA requeridos para smoke de permisos, reportes y soporte.
-- Password de los usuarios corregidos: Qa12345!
-- Script idempotente y acotado a:
--   qa.sinpermisos@local.test
--   qa.reportes@local.test
--   qa.soporte@local.test

SET NAMES utf8mb4;
START TRANSACTION;

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

-- NO_ACCESS queda intencionalmente sin role_permissions.

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

COMMIT;

SELECT
  u.email,
  u.status,
  b.code AS branch_code,
  GROUP_CONCAT(DISTINCT r.code ORDER BY r.code) AS roles,
  COUNT(DISTINCT p.code) AS effective_permissions
FROM users u
JOIN branches b ON b.id = u.branch_id
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN roles r ON r.id = ur.role_id
LEFT JOIN role_permissions rp ON rp.role_id = r.id
LEFT JOIN permissions p ON p.id = rp.permission_id
WHERE u.email IN (
  'qa.reportes@local.test',
  'qa.sinpermisos@local.test',
  'qa.soporte@local.test'
)
GROUP BY u.email, u.status, b.code
ORDER BY u.email;
