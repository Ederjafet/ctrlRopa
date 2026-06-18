-- AUTH-I2 - Dataset QA para permiso VIEW_SECURITY_AUDIT
-- Uso: mysql -u root -p control_ropa < docs/qa/12-auth-i2-view-security-audit-qa.sql
-- Alcance: QA/local. Idempotente. No usar para asignaciones productivas amplias.

SET NAMES utf8mb4;
START TRANSACTION;

INSERT IGNORE INTO permissions (code, name) VALUES
  ('VIEW_SECURITY_AUDIT', 'Ver auditoria de seguridad');

-- Soporte QA debe poder consultar auditoria.
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'VIEW_SECURITY_AUDIT'
WHERE r.code = 'SUPPORT_TECH';

-- Refuerzo directo para el usuario QA de soporte si existe.
INSERT IGNORE INTO user_permissions (user_id, permission_id)
SELECT u.id, p.id
FROM users u
JOIN permissions p ON p.code = 'VIEW_SECURITY_AUDIT'
WHERE u.email = 'qa.soporte@local.test';

-- No asignar a QA_TENANT_ADMIN. Si existia por pruebas manuales, se retira solo de ese rol QA.
DELETE rp
FROM role_permissions rp
JOIN roles r ON r.id = rp.role_id
JOIN permissions p ON p.id = rp.permission_id
WHERE r.code = 'QA_TENANT_ADMIN'
  AND p.code = 'VIEW_SECURITY_AUDIT';

COMMIT;

SELECT
  u.email,
  CASE WHEN EXISTS (
    SELECT 1
    FROM user_permissions up
    JOIN permissions p ON p.id = up.permission_id
    WHERE up.user_id = u.id
      AND p.code = 'VIEW_SECURITY_AUDIT'
  ) OR EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = u.id
      AND p.code = 'VIEW_SECURITY_AUDIT'
  ) THEN 'YES' ELSE 'NO' END AS has_view_security_audit
FROM users u
WHERE u.email IN ('qa.soporte@local.test', 'qa.a.admin@local.test');
