SET NAMES utf8mb4;
START TRANSACTION;

INSERT IGNORE INTO permissions (code, name) VALUES
  ('MANAGE_CONSIGNMENTS', 'Administrar consignaciones'),
  ('SETTLE_CONSIGNMENTS', 'Liquidar consignaciones'),
  ('CANCEL_CONSIGNMENTS', 'Cancelar consignaciones');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
WHERE r.code = 'ADMIN'
  AND p.code IN (
    'MANAGE_CONSIGNMENTS',
    'SETTLE_CONSIGNMENTS',
    'CANCEL_CONSIGNMENTS'
  );

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'MANAGE_CONSIGNMENTS',
  'SETTLE_CONSIGNMENTS'
)
WHERE r.code IN ('SUPERVISOR', 'INVENTORY');

INSERT IGNORE INTO user_permissions (user_id, permission_id)
SELECT u.id, p.id
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.id = ur.role_id
JOIN permissions p
WHERE r.code = 'ADMIN'
  AND p.code IN (
    'MANAGE_CONSIGNMENTS',
    'SETTLE_CONSIGNMENTS',
    'CANCEL_CONSIGNMENTS'
  );

COMMIT;