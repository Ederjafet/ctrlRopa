SET NAMES utf8mb4;

INSERT IGNORE INTO roles (code, name) VALUES
  ('SYSTEM_ADMIN', 'Administrador de sistema'),
  ('SUPPORT_TECH', 'Soporte tecnico');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'MANAGE_USERS',
  'MANAGE_ROLES',
  'MANAGE_BRANCHES',
  'MANAGE_CATALOGS',
  'MANAGE_BRANCH_CHANNELS',
  'MANAGE_BRANDING',
  'VIEW_REPORTS'
)
WHERE r.code = 'SYSTEM_ADMIN';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
WHERE r.code IN ('ADMIN', 'SUPPORT_TECH');
