-- LIVE-AUTH-B1A: backfill RBAC aditivo para autorizaciones operativas LIVE.
-- Corrige bases DEV donde V55 se aplico antes de la version canonica commiteada.
-- No toca pagos, caja, precio LIVE, devoluciones ni venta financiera.

SET NAMES utf8mb4;
START TRANSACTION;

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'UNDO_LIVE_OPERATIONAL_SALE'
WHERE r.code = 'SELLER';

COMMIT;
