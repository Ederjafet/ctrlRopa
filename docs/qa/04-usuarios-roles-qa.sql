-- SOLO QA - Extension Fase 1D: perfiles QA minimos por rol.
-- No es migracion Flyway. No ejecutar en PROD.
-- Password sugerido para usuarios creados aqui: Qa12345!
-- Script idempotente y acotado a correos qa.*@local.test.

SET NAMES utf8mb4;
START TRANSACTION;

SELECT id INTO @qa_centro_id FROM branches WHERE code = 'QA_CTR';
SELECT id INTO @qa_veracruz_id FROM branches WHERE code = 'QA_VER';

INSERT IGNORE INTO roles (code, name) VALUES
  ('REPORTS', 'Reportes'),
  ('NO_ACCESS', 'Sin permisos'),
  ('SUPPORT_TECH', 'Soporte tecnico');

INSERT INTO users (branch_id, name, email, phone, password_hash, status) VALUES
  (@qa_centro_id, 'QA Reportes Centro', 'qa.reportes@local.test', '5550000011', '{noop}Qa12345!', 'ACTIVE'),
  (@qa_centro_id, 'QA Usuario Sin Permisos', 'qa.sinpermisos@local.test', '5550000012', '{noop}Qa12345!', 'ACTIVE'),
  (@qa_centro_id, 'QA Soporte Tecnico', 'qa.soporte@local.test', '5550000013', '{noop}Qa12345!', 'ACTIVE')
ON DUPLICATE KEY UPDATE
  branch_id = VALUES(branch_id),
  name = VALUES(name),
  phone = VALUES(phone),
  status = 'ACTIVE';

INSERT IGNORE INTO user_branches (user_id, branch_id, is_primary)
SELECT u.id, b.id, IF(b.code = 'QA_CTR', 1, 0)
FROM users u
JOIN branches b ON b.code IN ('QA_CTR', 'QA_VER')
WHERE u.email IN ('qa.reportes@local.test', 'qa.sinpermisos@local.test', 'qa.soporte@local.test');

DELETE ur FROM user_roles ur
JOIN users u ON u.id = ur.user_id
WHERE u.email IN ('qa.reportes@local.test', 'qa.sinpermisos@local.test', 'qa.soporte@local.test');

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON
  (u.email = 'qa.reportes@local.test' AND r.code = 'REPORTS')
  OR (u.email = 'qa.sinpermisos@local.test' AND r.code = 'NO_ACCESS')
  OR (u.email = 'qa.soporte@local.test' AND r.code = 'SUPPORT_TECH')
WHERE u.email IN ('qa.reportes@local.test', 'qa.sinpermisos@local.test', 'qa.soporte@local.test');

DELETE up FROM user_permissions up
JOIN users u ON u.id = up.user_id
WHERE u.email IN ('qa.reportes@local.test', 'qa.sinpermisos@local.test', 'qa.soporte@local.test');

-- Reportes: lectura operativa sin modificar transacciones.
INSERT INTO user_permissions (user_id, permission_id)
SELECT u.id, p.id
FROM users u
JOIN permissions p ON p.code IN ('VIEW_REPORTS', 'VIEW_CUSTOMERS', 'VIEW_INVENTORY')
WHERE u.email = 'qa.reportes@local.test';

-- Soporte tecnico: perfil para logs/incidentes/seguridad segun permisos existentes.
INSERT INTO user_permissions (user_id, permission_id)
SELECT u.id, p.id
FROM users u
JOIN permissions p ON p.code IN (
  'MANAGE_USERS',
  'MANAGE_ROLES',
  'MANAGE_SECURITY_SETTINGS',
  'VIEW_REPORTS',
  'MANAGE_INCIDENTS'
)
WHERE u.email = 'qa.soporte@local.test';

-- Usuario sin permisos: queda intencionalmente sin user_permissions.

COMMIT;

SELECT 'Extension QA 04 aplicada: usuarios por rol preparados. Password: Qa12345!' AS resultado;
