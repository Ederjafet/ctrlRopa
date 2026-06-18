-- SOLO QA - AUTH-F3 permisos RBAC minimos para roles QA.
-- No es migracion Flyway. No ejecutar en PROD.
--
-- Objetivo:
-- - Asegurar que el catalogo QA tenga los permisos AUTH-F3.
-- - Asignar permisos nuevos solo a roles QA controlados.
-- - Revocar sesiones QA afectadas para forzar login con permisos actualizados.
--
-- Roles cubiertos:
--   QA_TENANT_ADMIN
--   QA_TENANT_SELLER
--
-- Usuarios QA cubiertos para revocacion:
--   qa.a.admin@local.test
--   qa.b.admin@local.test
--   qa.a.vendedor@local.test
--   qa.b.vendedor@local.test
--
-- Script idempotente: se puede ejecutar varias veces.

SET NAMES utf8mb4;
START TRANSACTION;

INSERT IGNORE INTO permissions (code, name) VALUES
  ('CREATE_CUSTOMER', 'Crear clientes'),
  ('EDIT_CUSTOMER', 'Editar clientes'),
  ('VIEW_PAYMENTS', 'Ver pagos'),
  ('VIEW_SALES', 'Ver ventas');

-- Admin QA: cubre lectura/alta/edicion de clientes y consulta pagos/ventas.
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'CREATE_CUSTOMER',
  'EDIT_CUSTOMER',
  'VIEW_PAYMENTS',
  'VIEW_SALES'
)
WHERE r.code = 'QA_TENANT_ADMIN';

-- Vendedor QA: permite operar En vivo/puerta con alta rapida de cliente,
-- consultar pagos/ventas asociadas y no recibe EDIT_CUSTOMER por defecto.
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'CREATE_CUSTOMER',
  'VIEW_PAYMENTS',
  'VIEW_SALES'
)
WHERE r.code = 'QA_TENANT_SELLER';

-- Revocar sesiones de usuarios QA A/B para que el login recargue permisos efectivos.
UPDATE user_api_sessions s
JOIN users u ON u.id = s.user_id
SET s.revoked_at = CURRENT_TIMESTAMP
WHERE s.revoked_at IS NULL
  AND u.email IN (
    'qa.a.admin@local.test',
    'qa.b.admin@local.test',
    'qa.a.vendedor@local.test',
    'qa.b.vendedor@local.test'
  );

COMMIT;

-- Validacion posterior: permisos AUTH-F3 por rol QA.
SELECT
  r.code AS role_code,
  p.code AS permission_code,
  p.name AS permission_name
FROM roles r
JOIN role_permissions rp ON rp.role_id = r.id
JOIN permissions p ON p.id = rp.permission_id
WHERE r.code IN ('QA_TENANT_ADMIN', 'QA_TENANT_SELLER')
  AND p.code IN ('CREATE_CUSTOMER', 'EDIT_CUSTOMER', 'VIEW_PAYMENTS', 'VIEW_SALES')
ORDER BY r.code, p.code;
