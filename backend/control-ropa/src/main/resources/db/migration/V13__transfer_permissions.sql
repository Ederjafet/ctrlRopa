SET NAMES utf8mb4;
START TRANSACTION;

INSERT IGNORE INTO permissions (code, name) VALUES
  ('MANAGE_TRANSFERS', 'Administrar transferencias'),
  ('SEND_TRANSFERS', 'Enviar transferencias'),
  ('RECEIVE_TRANSFERS', 'Recibir transferencias'),
  ('CANCEL_TRANSFERS', 'Cancelar transferencias');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
WHERE r.code = 'ADMIN'
  AND p.code IN ('MANAGE_TRANSFERS', 'SEND_TRANSFERS', 'RECEIVE_TRANSFERS', 'CANCEL_TRANSFERS');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('MANAGE_TRANSFERS', 'SEND_TRANSFERS', 'RECEIVE_TRANSFERS')
WHERE r.code IN ('SUPERVISOR', 'INVENTORY', 'LOGISTICS');

INSERT IGNORE INTO user_permissions (user_id, permission_id)
SELECT u.id, p.id
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.id = ur.role_id
JOIN permissions p
WHERE r.code = 'ADMIN'
  AND p.code IN ('MANAGE_TRANSFERS', 'SEND_TRANSFERS', 'RECEIVE_TRANSFERS', 'CANCEL_TRANSFERS');

COMMIT;