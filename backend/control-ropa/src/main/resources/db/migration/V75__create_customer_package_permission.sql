SET NAMES utf8mb4;
START TRANSACTION;

INSERT IGNORE INTO permissions (code, name) VALUES
  ('CREATE_CUSTOMER_PACKAGE', 'Crear paquete');

-- Backfill: quienes ya podian operar/cerrar paquetes conservan la capacidad de crear.
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT rp.role_id, p_new.id
FROM role_permissions rp
JOIN permissions p_old ON p_old.id = rp.permission_id
JOIN permissions p_new ON p_new.code = 'CREATE_CUSTOMER_PACKAGE'
WHERE p_old.code = 'CREATE_CLOSE_CUSTOMER_PACKAGE';

INSERT IGNORE INTO user_permissions (user_id, permission_id)
SELECT up.user_id, p_new.id
FROM user_permissions up
JOIN permissions p_old ON p_old.id = up.permission_id
JOIN permissions p_new ON p_new.code = 'CREATE_CUSTOMER_PACKAGE'
WHERE p_old.code = 'CREATE_CLOSE_CUSTOMER_PACKAGE';

COMMIT;