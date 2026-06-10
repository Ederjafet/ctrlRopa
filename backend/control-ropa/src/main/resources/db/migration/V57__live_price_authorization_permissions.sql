-- LIVE-PRICE-C: permisos de autorizacion de cambio de precio LIVE.
-- Aditiva e idempotente: no toca pagos, caja, devoluciones ni venta financiera.

SET NAMES utf8mb4;
START TRANSACTION;

INSERT IGNORE INTO permissions (code, name) VALUES
  ('REQUEST_LIVE_PRICE_CHANGE', 'Solicitar cambio de precio LIVE'),
  ('APPROVE_LIVE_PRICE_CHANGE', 'Aprobar cambio de precio LIVE'),
  ('APPLY_APPROVED_LIVE_PRICE_CHANGE', 'Aplicar precio LIVE aprobado'),
  ('VIEW_LIVE_PRICE_AUTHORIZATIONS', 'Ver autorizaciones de precio LIVE'),
  ('CHANGE_LIVE_PRICE', 'Cambiar precio LIVE');

-- ADMIN y SUPERVISOR pueden solicitar, ver, aprobar y aplicar cambios de precio LIVE.
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'REQUEST_LIVE_PRICE_CHANGE',
  'APPROVE_LIVE_PRICE_CHANGE',
  'APPLY_APPROVED_LIVE_PRICE_CHANGE',
  'VIEW_LIVE_PRICE_AUTHORIZATIONS',
  'CHANGE_LIVE_PRICE'
)
WHERE r.code IN ('ADMIN', 'SUPERVISOR');

-- SELLER puede solicitar cambios de precio LIVE, pero no aprobar ni aplicar.
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'REQUEST_LIVE_PRICE_CHANGE'
WHERE r.code = 'SELLER';

COMMIT;
