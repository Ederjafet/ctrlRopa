SET NAMES utf8mb4;
START TRANSACTION;

-- =========================================================
-- 1. RELACIÓN ROL -> PERMISOS BASE
-- =========================================================
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id BIGINT UNSIGNED NOT NULL,
  permission_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  KEY idx_role_permissions_permission (permission_id),
  CONSTRAINT fk_role_permissions_role
    FOREIGN KEY (role_id) REFERENCES roles(id),
  CONSTRAINT fk_role_permissions_permission
    FOREIGN KEY (permission_id) REFERENCES permissions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 2. PERMISOS FALTANTES
-- =========================================================
INSERT IGNORE INTO permissions (code, name) VALUES
  ('MANAGE_USERS', 'Administrar usuarios'),
  ('MANAGE_ROLES', 'Administrar roles'),
  ('MANAGE_BRANCH_CHANNELS', 'Administrar canales por sucursal'),

  ('VIEW_INVENTORY', 'Ver inventario'),
  ('MANAGE_INVENTORY', 'Administrar inventario'),

  ('DO_LIVE_RESERVATION', 'Crear reservas en live'),
  ('DO_DOOR_RESERVATION', 'Crear apartados puerta'),

  ('MANAGE_SHIPMENTS', 'Administrar envíos'),

  ('REQUEST_REFUND', 'Solicitar refund'),
  ('APPROVE_REFUND', 'Aprobar refund'),
  ('PROCESS_REFUND', 'Procesar refund'),
  ('CANCEL_REFUND', 'Cancelar refund'),

  ('MANAGE_BRANDING', 'Administrar apariencia y branding');

-- =========================================================
-- 3. PERMISOS BASE POR ROL
-- =========================================================

-- ADMIN: todos los permisos
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
WHERE r.code = 'ADMIN';

-- SUPERVISOR: permisos operativos delicados, sin administrar usuarios/canales/branding
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'VIEW_INVENTORY',
  'REGISTER_PAYMENTS',
  'APPLY_CUSTOMER_BALANCE',
  'CREATE_CLOSE_CUSTOMER_PACKAGE',
  'CANCEL_RESERVATION',
  'CANCEL_SALE',
  'REQUEST_REFUND',
  'APPROVE_REFUND',
  'REASSIGN_CUSTOMERS'
)
WHERE r.code = 'SUPERVISOR';

-- SELLER: operación de venta/reserva
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'VIEW_INVENTORY',
  'DO_LIVE_RESERVATION',
  'DO_DOOR_SALE',
  'DO_DOOR_RESERVATION'
)
WHERE r.code = 'SELLER';

-- CASHIER: pagos y saldo
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'REGISTER_PAYMENTS',
  'APPLY_CUSTOMER_BALANCE',
  'VOID_PAYMENT'
)
WHERE r.code = 'CASHIER';

-- INVENTORY: inventario
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'VIEW_INVENTORY',
  'MANAGE_INVENTORY'
)
WHERE r.code = 'INVENTORY';

-- PACKING: paquetes
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'CREATE_CLOSE_CUSTOMER_PACKAGE'
)
WHERE r.code = 'PACKING';

-- LOGISTICS: envíos
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'MANAGE_SHIPMENTS'
)
WHERE r.code = 'LOGISTICS';

-- COURIER: por ahora sin permisos administrativos
-- Se puede ampliar después para lista de mensajero / entregas.

-- =========================================================
-- 4. ADMIN INICIAL CONSERVA TODOS LOS PERMISOS DIRECTOS
-- =========================================================
INSERT IGNORE INTO user_permissions (user_id, permission_id)
SELECT u.id, p.id
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.id = ur.role_id
JOIN permissions p
WHERE r.code = 'ADMIN';

COMMIT;