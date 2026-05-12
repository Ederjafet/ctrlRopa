SET NAMES utf8mb4;
START TRANSACTION;

INSERT IGNORE INTO permissions (code, name) VALUES
  ('MANAGE_BRANCHES', 'Administrar sucursales'),
  ('MANAGE_CATALOGS', 'Administrar catalogos'),
  ('VIEW_CUSTOMERS', 'Ver clientes'),
  ('VIEW_CUSTOMER_ORDERS', 'Ver pedidos de cliente'),
  ('MANAGE_REFUNDS', 'Administrar refunds'),
  ('MANAGE_RETURNS', 'Administrar devoluciones'),
  ('MANAGE_INCIDENTS', 'Administrar incidencias');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
WHERE r.code = 'ADMIN';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'VIEW_CUSTOMERS',
  'VIEW_CUSTOMER_ORDERS',
  'VIEW_INVENTORY',
  'REGISTER_PAYMENTS',
  'APPLY_CUSTOMER_BALANCE',
  'CREATE_CLOSE_CUSTOMER_PACKAGE',
  'MANAGE_SHIPMENTS',
  'CANCEL_RESERVATION',
  'CANCEL_SALE',
  'REQUEST_REFUND',
  'APPROVE_REFUND',
  'PROCESS_REFUND',
  'CANCEL_REFUND',
  'MANAGE_REFUNDS',
  'MANAGE_RETURNS',
  'REASSIGN_CUSTOMERS',
  'MANAGE_TRANSFERS',
  'SEND_TRANSFERS',
  'RECEIVE_TRANSFERS',
  'MANAGE_CONSIGNMENTS',
  'SETTLE_CONSIGNMENTS',
  'VIEW_REPORTS',
  'MANAGE_CASH_CLOSURES',
  'MANAGE_INCIDENTS'
)
WHERE r.code = 'SUPERVISOR';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'VIEW_CUSTOMERS',
  'VIEW_CUSTOMER_ORDERS',
  'VIEW_INVENTORY',
  'DO_LIVE_RESERVATION',
  'DO_DOOR_SALE',
  'DO_DOOR_RESERVATION',
  'REGISTER_PAYMENTS'
)
WHERE r.code = 'SELLER';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'VIEW_CUSTOMERS',
  'VIEW_CUSTOMER_ORDERS',
  'REGISTER_PAYMENTS',
  'APPLY_CUSTOMER_BALANCE',
  'VOID_PAYMENT',
  'VIEW_REPORTS',
  'MANAGE_CASH_CLOSURES'
)
WHERE r.code = 'CASHIER';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'VIEW_INVENTORY',
  'MANAGE_INVENTORY',
  'MANAGE_CATALOGS'
)
WHERE r.code = 'INVENTORY';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'VIEW_CUSTOMERS',
  'VIEW_CUSTOMER_ORDERS',
  'CREATE_CLOSE_CUSTOMER_PACKAGE'
)
WHERE r.code = 'PACKING';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'VIEW_CUSTOMERS',
  'MANAGE_SHIPMENTS',
  'MANAGE_TRANSFERS',
  'SEND_TRANSFERS',
  'RECEIVE_TRANSFERS',
  'MANAGE_INCIDENTS'
)
WHERE r.code = 'LOGISTICS';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'MANAGE_SHIPMENTS',
  'MANAGE_INCIDENTS'
)
WHERE r.code = 'COURIER';

COMMIT;
