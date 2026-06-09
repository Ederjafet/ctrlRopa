SET NAMES utf8mb4;
START TRANSACTION;

-- LIVE-PERM-A1: permisos LIVE mínimos reales.
-- Mantiene DO_LIVE_RESERVATION como permiso legacy de apartado LIVE.
INSERT IGNORE INTO permissions (code, name) VALUES
  ('VIEW_LIVE', 'Ver LIVE'),
  ('OPERATE_LIVE', 'Operar LIVE'),
  ('PREPARE_LIVE_ITEM', 'Preparar prenda para LIVE'),
  ('CHANGE_LIVE_ACTIVE_ITEM', 'Cambiar prenda al aire'),
  ('REMOVE_LIVE_ACTIVE_ITEM', 'Retirar prenda del aire');

-- ADMIN: todos los permisos LIVE mínimos.
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'VIEW_LIVE',
  'OPERATE_LIVE',
  'PREPARE_LIVE_ITEM',
  'CHANGE_LIVE_ACTIVE_ITEM',
  'REMOVE_LIVE_ACTIVE_ITEM'
)
WHERE r.code = 'ADMIN';

-- SUPERVISOR: puede operar y supervisar el flujo mínimo aprobado.
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'VIEW_LIVE',
  'OPERATE_LIVE',
  'PREPARE_LIVE_ITEM',
  'CHANGE_LIVE_ACTIVE_ITEM',
  'REMOVE_LIVE_ACTIVE_ITEM'
)
WHERE r.code = 'SUPERVISOR';

-- SELLER: puede apoyar/operar el flujo aprobado, sin retirar prenda del aire.
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'VIEW_LIVE',
  'OPERATE_LIVE',
  'PREPARE_LIVE_ITEM',
  'CHANGE_LIVE_ACTIVE_ITEM'
)
WHERE r.code = 'SELLER';

COMMIT;
