SET NAMES utf8mb4;
START TRANSACTION;

-- RC-CLIENTE-C:
-- Los permisos CREATE_CUSTOMER / EDIT_CUSTOMER se agregaron despues de
-- migraciones que otorgaban el paquete operativo al rol ADMIN. Este backfill
-- mantiene al admin cliente operable sin otorgar permisos platform.

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'VIEW_CUSTOMERS',
  'CREATE_CUSTOMER',
  'EDIT_CUSTOMER',
  'VIEW_INVENTORY',
  'MANAGE_INVENTORY',
  'MANAGE_CATALOGS'
)
WHERE r.code = 'ADMIN';

INSERT IGNORE INTO user_permissions (user_id, permission_id)
SELECT u.id, p.id
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.id = ur.role_id
JOIN permissions p ON p.code IN (
  'VIEW_CUSTOMERS',
  'CREATE_CUSTOMER',
  'EDIT_CUSTOMER',
  'VIEW_INVENTORY',
  'MANAGE_INVENTORY',
  'MANAGE_CATALOGS'
)
WHERE r.code = 'ADMIN';

COMMIT;
